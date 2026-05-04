import express, { Request, Response } from 'express';
import { Op, fn, col, literal, Transaction } from 'sequelize';
import sequelize from '../config/database';
import { Resend } from 'resend';
import { clerkClient } from '@clerk/express';

import UserPrediction from '../models/UserPrediction';
import RaceResult from '../models/RaceResult';
import PredictionScore from '../models/PredictionScore';
import UserRaceScore from '../models/UserRaceScore';
import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import UserProfile from '../models/UserProfile';
import { requireAuth, getAuth } from '../middleware/auth';
import { getRacesByYear, getRaceById } from '../data/races';

const resend = new Resend(process.env.RESEND_API_KEY);

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

// Returns platform-wide stats and per-race engagement data.
router.get('/oversight', async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const adminIds = (process.env.ADMIN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (!userId || !adminIds.includes(userId)) return res.sendStatus(403);

    try {
        const year = Number(req.query.year) || new Date().getFullYear();
        const races = getRacesByYear(year);
        const raceIds = races.map(r => r.race_id);

        const totalUsers = await UserProfile.count();
        const totalGroups = await Group.count();
        const totalMembers = await GroupMember.count();

        const usersWithPredictions = await UserPrediction.count({
            distinct: true,
            col: 'user_id',
            where: { race_identifier: { [Op.in]: raceIds } },
        });

        const totalPredictionRows = await UserPrediction.count({
            where: { race_identifier: { [Op.in]: raceIds } },
        });

        const emailOptIns = await UserProfile.count({ where: { email_notifications: true } });

        const groupSizeDistribution = await GroupMember.findAll({
            attributes: ['group_id', [fn('COUNT', col('user_id')), 'member_count']],
            group: ['group_id'],
            raw: true,
        }) as unknown as { group_id: number; member_count: string }[];

        const sizes = groupSizeDistribution.map(r => Number(r.member_count));
        const avgGroupSize = sizes.length ? +(sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(1) : 0;
        const maxGroupSize = sizes.length ? Math.max(...sizes) : 0;

        // Count distinct users who submitted predictions per race
        const predCountsByRace = await UserPrediction.findAll({
            attributes: [
                'race_identifier',
                [fn('COUNT', fn('DISTINCT', col('user_id'))), 'unique_predictors'],
                [fn('COUNT', fn('DISTINCT', col('group_id'))), 'active_groups'],
            ],
            where: { race_identifier: { [Op.in]: raceIds } },
            group: ['race_identifier'],
            raw: true,
        }) as unknown as { race_identifier: string; unique_predictors: string; active_groups: string }[];

        const predMap = new Map(predCountsByRace.map(r => [r.race_identifier, r]));

        // Check which races have results
        const scoredRaces = await RaceResult.findAll({
            attributes: [[fn('DISTINCT', col('race_identifier')), 'race_identifier']],
            where: { race_identifier: { [Op.in]: raceIds } },
            raw: true,
        }) as unknown as { race_identifier: string }[];
        const scoredSet = new Set(scoredRaces.map(r => r.race_identifier));

        // Average score per race (from UserRaceScore)
        const avgScoresByRace = await UserRaceScore.findAll({
            attributes: [
                'race_identifier',
                [fn('AVG', col('total_points')), 'avg_points'],
                [fn('MAX', col('total_points')), 'max_points'],
                [fn('AVG', col('exact_hits')), 'avg_exact'],
            ],
            where: { race_identifier: { [Op.in]: raceIds } },
            group: ['race_identifier'],
            raw: true,
        }) as unknown as { race_identifier: string; avg_points: string; max_points: string; avg_exact: string }[];

        const scoreMap = new Map(avgScoresByRace.map(r => [r.race_identifier, r]));

        const raceEngagement = races.map(race => {
            const pred = predMap.get(race.race_id);
            const score = scoreMap.get(race.race_id);
            return {
                race_id: race.race_id,
                meeting_name: race.meeting_name,
                country_name: race.country_name,
                date_start: race.date_start,
                has_results: scoredSet.has(race.race_id),
                unique_predictors: pred ? Number(pred.unique_predictors) : 0,
                active_groups: pred ? Number(pred.active_groups) : 0,
                avg_points: score ? +Number(score.avg_points).toFixed(1) : null,
                max_points: score ? Number(score.max_points) : null,
                avg_exact_hits: score ? +Number(score.avg_exact).toFixed(1) : null,
            };
        });

        return res.json({
            year,
            platform: {
                total_users: totalUsers,
                total_groups: totalGroups,
                total_memberships: totalMembers,
                avg_group_size: avgGroupSize,
                max_group_size: maxGroupSize,
                users_with_predictions: usersWithPredictions,
                total_prediction_rows: totalPredictionRows,
                email_opt_ins: emailOptIns,
            },
            races: raceEngagement,
        });
    } catch (err: any) {
        console.error('Oversight error:', err);
        return res.status(500).json({ error: err?.message ?? 'Unknown error' });
    }
});

// Sends a race-week reminder email to all group owners (admins)
router.post<{ raceId: string }>('/notify-admins/:raceId', async (req: Request<{ raceId: string }>, res: Response) => {
    const { userId } = getAuth(req);
    const adminIds = (process.env.ADMIN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (!userId || !adminIds.includes(userId)) return res.sendStatus(403);

    const raceId = req.params.raceId;
    const race = getRaceById(raceId);
    if (!race) return res.status(404).json({ error: 'Race not found' });

    try {
        // Get all groups and their owners
        const groups = await Group.findAll({ attributes: ['id', 'group_name', 'owner_id'] });
        if (groups.length === 0) {
            return res.json({ sent: 0, message: 'No groups found' });
        }

        const ownerIds = [...new Set(groups.map(g => g.owner_id))];

        // Only send to owners
        const profiles = await UserProfile.findAll({
            where: { user_id: { [Op.in]: ownerIds } },
        });
        const profileMap = new Map(profiles.map(p => [p.user_id, p.display_name]));

        if (profiles.length === 0) {
            return res.json({ sent: 0, message: 'No group admins found' });
        }

        // Resolve emails from Clerk
        const emailMap = new Map<string, string>();
        for (const profile of profiles) {
            try {
                const clerkUser = await clerkClient.users.getUser(profile.user_id);
                const email = clerkUser.primaryEmailAddress?.emailAddress;
                if (email) emailMap.set(profile.user_id, email);
            } catch {
                // Skip in case of failure
            }
        }

        if (emailMap.size === 0) {
            return res.json({ sent: 0, message: 'Could not resolve email addresses for any group admins' });
        }

        const ownerGroups = new Map<string, string[]>();
        for (const g of groups) {
            if (!emailMap.has(g.owner_id)) continue;
            const list = ownerGroups.get(g.owner_id) ?? [];
            list.push(g.group_name);
            ownerGroups.set(g.owner_id, list);
        }

        const fromAddress = process.env.REMINDER_FROM_EMAIL || 'reminders@gridguesser.com';
        const siteUrl = 'https://gridguesser.com';
        let sentCount = 0;

        for (const [ownerId, email] of emailMap) {
            const displayName = profileMap.get(ownerId) ?? 'there';
            const groupNames = ownerGroups.get(ownerId) ?? [];
            const groupLine = groupNames.length === 1
                ? `your group <strong>${groupNames[0]}</strong>`
                : `your groups (${groupNames.map(n => `<strong>${n}</strong>`).join(', ')})`;

            try {
                await resend.emails.send({
                    from: fromAddress,
                    to: email,
                    subject: `It's race week! ${race.meeting_name} — time to rally your group`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                            <p>Hey ${displayName},</p>
                            <p>It's race week — the <strong>${race.meeting_name}</strong> is coming up and the prediction window is open.</p>
                            <p>As the admin of ${groupLine}, this is a great time to nudge your members to get their predictions in before the deadline.</p>
                            <p>You can send them a reminder directly from your group admin panel, or just share the link.</p>
                            <p style="margin: 24px 0;">
                                <a href="${siteUrl}/race/${raceId}" style="background-color: #3b5bdb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                                    View Race &amp; Manage Group
                                </a>
                            </p>
                            <p style="color: #888; font-size: 13px;">Good luck this weekend 🏁</p>
                        </div>
                    `,
                });
                sentCount++;
            } catch (err) {
                console.error(`Failed to send admin notify to ${email}:`, err);
            }
        }

        return res.json({
            sent: sentCount,
            total_admins: ownerIds.length,
            opted_in: profiles.length,
            message: `Sent race-week reminder to ${sentCount} group admin${sentCount !== 1 ? 's' : ''}`,
        });
    } catch (err: any) {
        console.error('Notify admins error:', err);
        return res.status(500).json({ error: err?.message ?? 'Unknown error' });
    }
});

export default router;
