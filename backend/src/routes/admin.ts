import express, { Request, Response } from 'express';
import { Op, fn, col, Transaction } from 'sequelize';
import sequelize from '../config/database';

import UserPrediction from '../models/UserPrediction';
import RaceResult from '../models/RaceResult';
import PredictionScore from '../models/PredictionScore';
import UserRaceScore from '../models/UserRaceScore';
import {jwtCheck} from "../middleware/auth";

import { fetchQualifyingPoleDriver } from '../scoring/fetchQualifyingPoleDriver';
import { fetchRacePositions } from '../scoring/fetchRacePositions';
import { scorePrediction, PositionType } from '../scoring/scorePrediction';
import { aggregateScores } from '../scoring/aggregateScores';

const RACE_POSITION_TYPES: PositionType[] = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'];

function posTypeToNumber(pt: PositionType): number | null {
    if (pt === 'pole') return null;
    return Number(pt.slice(1));
}

function numberToPosType(n: number): PositionType {
    return `p${n}` as PositionType;
}
const router = express.Router();

router.use(jwtCheck);

router.post<{ raceId: string }>('/calculate-points/:raceId', async (req: Request<{ raceId: string }>, res: Response) => {
    const userId = req.auth?.payload.sub;
    if (!userId || userId !== process.env.ADMIN_ID) return res.sendStatus(403);

    const raceId = req.params.raceId;
    if (!raceId) return res.status(400).json({ error: "Missing raceId (session_key)" });

    let t: Transaction | null = null;

    try {
        // Fetch race positions and qualifying pole driver in parallel — both are required
        const [raceResult, poleDriverName] = await Promise.all([
            fetchRacePositions(raceId),
            fetchQualifyingPoleDriver(raceId)
        ]);

        if (!raceResult.ok) {
            return res.status(raceResult.error.status).json(raceResult.error);
        }

        if (!poleDriverName) {
            return res.status(500).json({ error: "Qualifying data unavailable — cannot complete scoring without pole position" });
        }

        const { actualByPosition } = raceResult.data;
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

        // 3) Load all predictions for that race
        const predictions = await UserPrediction.findAll({
            where: {
                race_identifier: raceId,
                position_type: { [Op.in]: activePositionTypes }
            },
            transaction: t
        });

        // 4) Compute uniqueness counts for "unique exact" bonus
        // Build the list of actual drivers for each active slot
        const actualDriversForSlots: string[] = [poleDriverName];
        for (const pt of RACE_POSITION_TYPES) {
            const slot = posTypeToNumber(pt);
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

        // 5) Create per-prediction score rows using scorePrediction
        const scoreRows: any[] = [];
        for (const pred of predictions) {
            const posType = pred.position_type as PositionType;
            const predictedName = pred.driver_name;

            // Determine the actual driver name for this slot
            let actualNameAtSlot: string;
            if (posType === 'pole') {
                actualNameAtSlot = poleDriverName;
            } else {
                const slot = posTypeToNumber(posType);
                if (!slot) continue;
                actualNameAtSlot = actualByPosition.get(slot)!;
            }

            const { base_points: basePoints, is_exact: isExact } = scorePrediction(
                predictedName,
                actualNameAtSlot,
                posType,
                actualPosByDriver
            );

            const uniqueCorrect =
                isExact && (uniqueCountMap.get(`${pred.group_id}|${pred.position_type}|${predictedName}`) === 1);

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

        // 6) Aggregate into UserRaceScores using aggregateScores
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
