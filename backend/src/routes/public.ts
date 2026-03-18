import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { fn, col, Op, literal } from 'sequelize';
import sequelize from '../config/database';
import { getRacesByYear, getRaceById } from '../data/races';
import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import UserProfile from '../models/UserProfile';
import PredictionScore from '../models/PredictionScore';
import { obfuscateName } from '../utils/obfuscateName';

const router = express.Router();

// 60 requests per minute max
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

router.use(publicLimiter);

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data);
  }
  return fetcher().then(data => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  });
}

router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'alive' });
});

// all race details for particular year
router.get('/races', (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string, 10);
  if (!year || isNaN(year)) {
    return res.status(400).json({ message: 'year query parameter is required' });
  }
  const races = getRacesByYear(year);
  return res.json(races);
});

// single race details
router.get('/races/:raceId', (req: Request, res: Response) => {
  const raceId = req.params.raceId as string;
  const race = getRaceById(raceId);
  if (!race) {
    return res.status(404).json({ message: 'Race not found' });
  }
  return res.json(race);
});

// list public groups with name and member count (cached 5 min)
router.get('/groups', async (_req: Request, res: Response) => {
  try {
    const groups = await getCached('public-groups', 5 * 60 * 1000, async () => {
      const rows = await Group.findAll({
        where: { group_type: 'public' },
        attributes: [
          'id',
          'group_name',
          [
            literal('(SELECT COUNT(*) FROM `GroupMembers` WHERE `GroupMembers`.`group_id` = `Group`.`id`) + 1'),
            'member_count'
          ],
        ],
        order: [
          [literal('(SELECT COUNT(*) FROM `GroupMembers` WHERE `GroupMembers`.`group_id` = `Group`.`id`)'), 'DESC']
        ],
        limit: 20,
      });

      return rows.map(g => {
        const plain = g.get({ plain: true }) as any;
        return {
          id: plain.id,
          groupName: plain.group_name,
          memberCount: Number(plain.member_count),
        };
      });
    });

    return res.json(groups);
  } catch (error) {
    console.error('Error fetching public groups:', error);
    return res.status(500).json({ message: 'Failed to fetch public groups' });
  }
});

// public stats (cached 5 min)
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getCached('public-stats', 5 * 60 * 1000, async () => {
      const [groupCount, userCount] = await Promise.all([
        Group.count(),
        UserProfile.count(),
      ]);
      return { groupCount, userCount };
    });

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Global leaderboard — public, top 50, base_points only (no unique x2), cached 30 min
// Accepts optional ?userId= query param to include the caller's position if outside top 50
router.get('/leaderboard/global', async (req: Request, res: Response) => {
  try {
    const requestingUserId = (req.query.userId as string) || null;

    const { ranked, raceCount } = await getCached('global-leaderboard', 30 * 60 * 1000, async () => {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(`${currentYear}-01-01T00:00:00`);
      const yearEnd = new Date(`${currentYear + 1}-01-01T00:00:00`);

      const allScores = await PredictionScore.findAll({
        attributes: [
          'user_id',
          [fn('SUM', col('base_points')), 'total_points'],
          [fn('SUM', sequelize.literal('CASE WHEN base_points = 2 THEN 1 ELSE 0 END')), 'exact_hits'],
          [fn('SUM', sequelize.literal('CASE WHEN base_points = 1 THEN 1 ELSE 0 END')), 'near_hits'],
        ],
        where: {
          computed_at: { [Op.gte]: yearStart, [Op.lt]: yearEnd },
        },
        group: ['user_id'],
        order: [
          [fn('SUM', col('base_points')), 'DESC'],
          [fn('SUM', sequelize.literal('CASE WHEN base_points = 2 THEN 1 ELSE 0 END')), 'DESC'],
        ],
        raw: true,
      }) as unknown as Array<{ user_id: string; total_points: string; exact_hits: string; near_hits: string }>;

      const rc = await PredictionScore.count({
        where: {
          computed_at: { [Op.gte]: yearStart, [Op.lt]: yearEnd },
        },
        distinct: true,
        col: 'race_identifier',
      });

      // Assign ranks with tie-handling
      const rankedList: Array<{
        user_id: string;
        total_points: number;
        exact_hits: number;
        near_hits: number;
        rank: number;
      }> = [];

      allScores.forEach((score, index) => {
        const totalPoints = Number(score.total_points);
        const exactHits = Number(score.exact_hits);
        const nearHits = Number(score.near_hits);

        let rank = 1;
        if (index > 0) {
          const prev = rankedList[index - 1];
          if (totalPoints === prev.total_points && exactHits === prev.exact_hits) {
            rank = prev.rank;
          } else {
            rank = index + 1;
          }
        }

        rankedList.push({ user_id: score.user_id, total_points: totalPoints, exact_hits: exactHits, near_hits: nearHits, rank });
      });

      return { ranked: rankedList, raceCount: rc };
    });

    const top50 = ranked.slice(0, 50);

    // Determine if we need the requesting user's entry
    const currentUserRanked = requestingUserId
      ? ranked.find((r) => r.user_id === requestingUserId) ?? null
      : null;
    const currentUserInTop50 = requestingUserId
      ? top50.some((r) => r.user_id === requestingUserId)
      : false;

    // Fetch display names
    const userIdsToFetch = [...new Set([
      ...top50.map((r) => r.user_id),
      ...(currentUserRanked ? [currentUserRanked.user_id] : []),
    ])];

    const profiles = await UserProfile.findAll({
      where: { user_id: userIdsToFetch },
    });
    const profileMap = new Map(profiles.map((p) => [p.user_id, p.display_name]));

    // Obfuscate all names except requesting user
    const buildEntry = (r: typeof ranked[number]) => ({
      user_id: r.user_id,
      display_name: r.user_id === requestingUserId
        ? (profileMap.get(r.user_id) ?? r.user_id)
        : obfuscateName(profileMap.get(r.user_id)),
      total_points: r.total_points,
      exact_hits: r.exact_hits,
      near_hits: r.near_hits,
      rank: r.rank,
    });

    const leaderboard = top50.map(buildEntry);

    const currentUser = currentUserRanked && !currentUserInTop50
      ? buildEntry(currentUserRanked)
      : null;

    return res.json({ leaderboard, currentUser, raceCount, totalParticipants: ranked.length });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    return res.status(500).json({ message: 'Failed to fetch global leaderboard' });
  }
});

export default router;
