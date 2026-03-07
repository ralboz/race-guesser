import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { literal } from 'sequelize';
import { getRacesByYear, getRaceById } from '../data/races';
import Group from '../models/Group';
import GroupMember from '../models/GroupMember';
import UserProfile from '../models/UserProfile';

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

export default router;
