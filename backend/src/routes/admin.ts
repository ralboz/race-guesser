import express, { Request, Response } from 'express';
import { Op, fn, col, Transaction } from 'sequelize';
import sequelize from '../config/database';

import UserPrediction from '../models/UserPrediction';
import RaceResult from '../models/RaceResult';
import PredictionScore from '../models/PredictionScore';
import UserRaceScore from '../models/UserRaceScore';
import {jwtCheck} from "../middleware/auth";
import {driverNumToNameMap} from "../data";

type PositionType =
    | 'pole'
    | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10';

const POSITION_TYPES: PositionType[] = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'];

type OpenF1SessionResultRow = {
    position: number;
    driver_number: number;
    session_key: number;
};

function posTypeToNumber(pt: PositionType): number | null {
    if (pt === 'pole') return null;
    return Number(pt.slice(1));
}

function numberToPosType(n: number): PositionType {
    return `p${n}` as PositionType;
}

async function fetchJson<T>(url: string): Promise<T> {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`OpenF1 error ${r.status} for ${url}`);
    return r.json() as Promise<T>;
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
        // Get race sessionId to pull results
        const sessions = await fetchJson<{ session_key: number }[]>(
            `https://api.openf1.org/v1/sessions?meeting_key=${encodeURIComponent(raceId)}&session_name=Race`
        );
        const session_key = sessions[0]?.session_key;

        if(!session_key) return res.status(500).json({ error: "Unable to get session key from raceId provided" });
        // 1) Pull actual results (top 11)
        const sessionResultUrl =
            `https://api.openf1.org/v1/session_result?session_key=${encodeURIComponent(session_key)}&position<=11`;

        const results = await fetchJson<OpenF1SessionResultRow[]>(sessionResultUrl);

        console.log(results)
        // actualByPosition[1..11] = "Full Name"
        const actualByPosition = new Map<number, string>();

        for (const r of results) {
            const name = driverNumToNameMap[r.driver_number]; // static lookup by driver_number
            if (!name) continue;
            actualByPosition.set(r.position, name);
        }

        const missingMappings: Array<{ position: number; driver_number: number }> = [];
        for (const r of results) {
            const pos = Number(r.position);
            const num = Number(r.driver_number);

            const name = driverNumToNameMap[num];
            if (!name) missingMappings.push({ position: pos, driver_number: num });
            else actualByPosition.set(pos, name);
        }

        if (missingMappings.length) {
            return res.status(400).json({
                error: "Static driver mapping missing numbers used in this session_result",
                missingMappings,
            });
        }

        for (let p = 1; p <= 11; p++) {
            if (!actualByPosition.get(p)) {
                return res.status(400).json({
                    error: `Missing actual driver for position ${p} (check OpenF1 data or static mapping)`,
                });
            }
        }

        t = await sequelize.transaction();

        // 2) Upsert RaceResults for p1..p10 (p11 only used for "one-off" scoring)
        const raceResultsRows = [];
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

        // 3) Load all predictions for that race (p1..p10 only)
        const predictions = await UserPrediction.findAll({
            where: {
                race_identifier: raceId,
                position_type: { [Op.in]: POSITION_TYPES }
            },
            transaction: t
        });

        // 4) Compute uniqueness counts for "unique exact" bonus:
        // count predictions where driver_name == actual driver for that slot, per group & slot
        const actualDriversForSlots = POSITION_TYPES.map(pt => actualByPosition.get(posTypeToNumber(pt)!)!);
        const uniqueCountRows = await UserPrediction.findAll({
            attributes: [
                'group_id',
                'position_type',
                'driver_name',
                [fn('COUNT', col('*')), 'cnt']
            ],
            where: {
                race_identifier: raceId,
                position_type: { [Op.in]: POSITION_TYPES },
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

        // Also build actualPosByDriver from positions 1..11 (for +/-1 scoring)
        const actualPosByDriver = new Map<string, number>();
        for (let p = 1; p <= 11; p++) {
            actualPosByDriver.set(actualByPosition.get(p)!, p);
        }

        // 5) Create per-prediction score rows
        const scoreRows: any[] = [];
        for (const pred of predictions) {
            const slot = posTypeToNumber(pred.position_type as PositionType);
            if (!slot) continue;

            const predictedName = pred.driver_name;
            const actualNameAtSlot = actualByPosition.get(slot)!;

            const actualPosOfPredicted = actualPosByDriver.get(predictedName); // undefined if not in top 11
            let basePoints = 0;

            if (actualPosOfPredicted != null) {
                const diff = Math.abs(actualPosOfPredicted - slot);
                basePoints = diff === 0 ? 2 : diff === 1 ? 1 : 0;
            }

            const exact = basePoints === 2 && predictedName === actualNameAtSlot;
            const uniqueCorrect =
                exact && (uniqueCountMap.get(`${pred.group_id}|${pred.position_type}|${predictedName}`) === 1);

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
            // ensures no duplicate entry for user in group with same race identifier and position type: relies on UNIQUE(group_id,user_id,race_identifier,position_type)
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

        // 6) Aggregate into UserRaceScores
        const totals = new Map<string, {
            user_id: string;
            group_id: number;
            race_identifier: string;
            total_points: number;
            exact_hits: number;
            near_hits: number;
            unique_correct_hits: number;
        }>();

        for (const r of scoreRows) {
            const key = `${r.group_id}|${r.user_id}|${r.race_identifier}`;
            const cur = totals.get(key) ?? {
                user_id: r.user_id,
                group_id: r.group_id,
                race_identifier: r.race_identifier,
                total_points: 0,
                exact_hits: 0,
                near_hits: 0,
                unique_correct_hits: 0
            };

            cur.total_points += r.final_points;
            if (r.base_points === 2) cur.exact_hits += 1;
            if (r.base_points === 1) cur.near_hits += 1;
            if (r.unique_correct === 1) cur.unique_correct_hits += 1;

            totals.set(key, cur);
        }

        await UserRaceScore.bulkCreate(Array.from(totals.values()).map(v => ({
            ...v,
            computed_at: new Date()
        })), {
            // ensures no duplicate entry for user in group with same race identifier and position type: relies on UNIQUE(group_id,user_id,race_identifier,position_type)
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
            user_race_scores_updated: totals.size
        });
    } catch (err: any) {
        if (t) await t.rollback();
        return res.status(500).json({ error: err?.message ?? 'Unknown error' });
    }
});

export default router;