import express, { Request, Response } from 'express';
import { Op, fn, col, Transaction } from 'sequelize';
import sequelize from '../config/database';

import UserPrediction from '../models/UserPrediction';
import RaceResult from '../models/RaceResult';
import PredictionScore from '../models/PredictionScore';
import UserRaceScore from '../models/UserRaceScore';
import { requireAuth, getAuth } from '../middleware/auth';

import { scorePrediction, PositionType } from '../scoring/scorePrediction';
import { aggregateScores } from '../scoring/aggregateScores';

const RACE_POSITION_TYPES: PositionType[] = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'];

function numberToPosType(n: number): PositionType {
    return `p${n}` as PositionType;
}
const router = express.Router();

router.use(requireAuth());

/**
 * POST /superadmin/calculate-points/:raceId
 *
 * Body: {
 *   pole: "Driver Name",
 *   p1: "Driver Name",
 *   p2: "Driver Name",
 *   ...
 *   p10: "Driver Name",
 *   p11: "Driver Name"   // p11 needed for +/-1 near-miss scoring
 * }
 */
router.post<{ raceId: string }>('/calculate-points/:raceId', async (req: Request<{ raceId: string }>, res: Response) => {
    const { userId } = getAuth(req);
    const adminIds = (process.env.ADMIN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (!userId || !adminIds.includes(userId)) return res.sendStatus(403);

    const raceId = req.params.raceId;
    if (!raceId) return res.status(400).json({ error: "Missing raceId" });

    // Validate request body contains all required positions
    const { pole, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11 } = req.body;
    const positions = { pole, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11 };
    const missing = Object.entries(positions).find(([, val]) => !val || typeof val !== 'string' || val.trim() === '');
    if (missing) {
        return res.status(400).json({ error: `Missing or invalid result for ${missing[0]}` });
    }

    let t: Transaction | null = null;

    try {
        const poleDriverName = pole.trim();

        // Build actualByPosition map from request body (positions 1-11)
        const actualByPosition = new Map<number, string>();
        for (let p = 1; p <= 11; p++) {
            actualByPosition.set(p, positions[`p${p}` as keyof typeof positions]!.trim());
        }

        const activePositionTypes: PositionType[] = ['pole', ...RACE_POSITION_TYPES];

        t = await sequelize.transaction();

        // Upsert RaceResults for pole + p1..p10
        const raceResultsRows: { race_identifier: string; position_type: PositionType; driver_name: string }[] = [
            { race_identifier: raceId, position_type: 'pole', driver_name: poleDriverName }
        ];

        for (let p = 1; p <= 10; p++) {
            raceResultsRows.push({
                race_identifier: raceId,
                position_type: numberToPosType(p),
                driver_name: actualByPosition.get(p)!
            });
        }

        await RaceResult.bulkCreate(raceResultsRows, {
            updateOnDuplicate: ['driver_name', 'updated_at'],
            transaction: t
        });

        // Load all predictions for that race
        const predictions = await UserPrediction.findAll({
            where: {
                race_identifier: raceId,
                position_type: { [Op.in]: activePositionTypes }
            },
            transaction: t
        });

        // Compute uniqueness counts for "unique exact" bonus
        const actualDriversForSlots: string[] = [poleDriverName];
        for (const pt of RACE_POSITION_TYPES) {
            const slot = Number(pt.slice(1));
            if (slot) actualDriversForSlots.push(actualByPosition.get(slot)!);
        }

        const uniqueCountRows = await UserPrediction.findAll({
            attributes: [
                'group_id',
                'position_type',
                'driver_name',
                [fn('COUNT', col('*')), 'cnt']
            ],
            where: {
                race_identifier: raceId,
                position_type: { [Op.in]: activePositionTypes },
                driver_name: { [Op.in]: Array.from(new Set(actualDriversForSlots)) }
            },
            group: ['group_id', 'position_type', 'driver_name'],
            raw: true,
            transaction: t
        });

        const uniqueCountMap = new Map<string, number>();
        for (const row of uniqueCountRows as any[]) {
            uniqueCountMap.set(`${row.group_id}|${row.position_type}|${row.driver_name}`, Number(row.cnt));
        }

        // Build actualPosByDriver from positions 1..11 (for +/-1 scoring on p1-p10)
        const actualPosByDriver = new Map<string, number>();
        for (let p = 1; p <= 11; p++) {
            actualPosByDriver.set(actualByPosition.get(p)!, p);
        }

        // Create per-prediction score rows using scorePrediction
        const scoreRows: any[] = [];
        for (const pred of predictions) {
            const posType = pred.position_type as PositionType;
            const predictedName = pred.driver_name;

            let actualNameAtSlot: string;
            if (posType === 'pole') {
                actualNameAtSlot = poleDriverName;
            } else {
                const slot = Number(posType.slice(1));
                if (!slot) continue;
                actualNameAtSlot = actualByPosition.get(slot)!;
            }

            const basePoints = scorePrediction(
                predictedName,
                actualNameAtSlot,
                posType,
                actualPosByDriver
            );

            const uniqueCorrect =
                basePoints > 0 && (uniqueCountMap.get(`${pred.group_id}|${pred.position_type}|${predictedName}`) === 1);

            const finalPoints = uniqueCorrect ? basePoints * 2 : basePoints;

            scoreRows.push({
                prediction_id: pred.id,
                user_id: pred.user_id,
                group_id: pred.group_id,
                race_identifier: pred.race_identifier,
                position_type: pred.position_type,
                predicted_driver_name: predictedName,
                actual_driver_name: actualNameAtSlot,
                base_points: basePoints,
                unique_correct: uniqueCorrect ? 1 : 0,
                final_points: finalPoints,
                computed_at: new Date()
            });
        }

        await PredictionScore.bulkCreate(scoreRows, {
            updateOnDuplicate: [
                'prediction_id',
                'predicted_driver_name',
                'actual_driver_name',
                'base_points',
                'unique_correct',
                'final_points',
                'computed_at'
            ],
            transaction: t
        });

        // Aggregate into UserRaceScores
        const groupedRows = new Map<string, {
            user_id: string;
            group_id: number;
            race_identifier: string;
            rows: typeof scoreRows;
        }>();

        for (const r of scoreRows) {
            const key = `${r.group_id}|${r.user_id}|${r.race_identifier}`;
            const entry = groupedRows.get(key);
            if (entry) {
                entry.rows.push(r);
            } else {
                groupedRows.set(key, {
                    user_id: r.user_id,
                    group_id: r.group_id,
                    race_identifier: r.race_identifier,
                    rows: [r]
                });
            }
        }

        const userRaceScoreRows = Array.from(groupedRows.values()).map(g => {
            const agg = aggregateScores(g.rows);
            return {
                user_id: g.user_id,
                group_id: g.group_id,
                race_identifier: g.race_identifier,
                total_points: agg.total_points,
                exact_hits: agg.exact_hits,
                near_hits: agg.near_hits,
                unique_correct_hits: agg.unique_correct_hits,
                computed_at: new Date()
            };
        });

        await UserRaceScore.bulkCreate(userRaceScoreRows, {
            updateOnDuplicate: [
                'total_points',
                'exact_hits',
                'near_hits',
                'unique_correct_hits',
                'computed_at'
            ],
            transaction: t
        });

        await t.commit();

        return res.json({
            ok: true,
            race_identifier: raceId,
            predictions_scored: scoreRows.length,
            user_race_scores_updated: groupedRows.size
        });
    } catch (err: any) {
        if (t) await t.rollback();
        return res.status(500).json({ error: err?.message ?? 'Unknown error' });
    }
});

export default router;
