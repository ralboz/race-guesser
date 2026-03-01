import express, { Request, Response } from 'express';
import { fn, col, Op } from 'sequelize';
import rateLimit from 'express-rate-limit';
import { requireAuth, getAuth } from '../middleware/auth';
import { syncUserProfile } from '../middleware/syncUserProfile';
import { Group, UserPrediction, GroupMember, UserProfile } from '../models';
import PredictionScore from '../models/PredictionScore';
import UserRaceScore from '../models/UserRaceScore';
import {UserPredictionCreationAttributes} from "../models/UserPrediction";
import { hashPassword, verifyPassword } from '../utils/password';
import { getPredictionWindow } from '../services/predictionWindowService';
import { validDriverNames } from '../data';

// 20 requests every 15 mins
const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// 5 requests every 15 mins
const joinGroupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many join attempts, please try again later.' }
});

//Look up the group a user belongs to (as owner or member)
async function getUserGroupId(userId: string): Promise<number | null> {
  const ownedGroup = await Group.findOne({ where: { owner_id: userId } });
  if (ownedGroup) return ownedGroup.id;

  const membershipRecord = await GroupMember.findOne({
    where: { user_id: userId },
    include: [Group]
  });
  if (membershipRecord?.Group) return membershipRecord.Group.id;

  return null;
}

const router = express.Router();

router.use(requireAuth());
router.use(syncUserProfile);


// Get user's group (owned or member)
router.get('/group', async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID is required' });
    }

    // First check if user owns a group
    const ownedGroup = await Group.findOne({
      where: { owner_id: userId }
    });

    if (ownedGroup) {
      return res.json({ 
        group: ownedGroup,
        isOwner: true 
      });
    }

    // If not an owner, check if user is a member of any group
    const membershipRecord = await GroupMember.findOne({
      where: { user_id: userId },
      include: [Group]
    });

    if (membershipRecord && membershipRecord.Group) {
      return res.json({ 
        group: membershipRecord.Group,
        isOwner: false 
      });
    }

    // User is neither an owner nor a member of any group
    res.json({ group: null });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Error fetching groups' });
  }
});

// Create a new group
router.post('/create-group', mutationLimiter, async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID is required' });
    }
    const { group_name, group_type, password } = req.body;

    // --validation--
    if(group_name === undefined || group_type === undefined) return res.status(400).json({ message: 'Group name and group type are required' });
    if(group_name.length > 20) return res.status(400).json({ message: 'Group name must be less than 20 characters' });
    if(group_name.length < 3) return res.status(400).json({ message: 'Group name must be more than 3 characters' });
    if(group_type !== 'private' && group_type !== 'public') return res.status(400).json({ message: 'Group type must be either private or public'});
    if(group_type === 'private' && !password) return res.status(400).json({ message: 'Password is required for private groups' });

    const MAX_ID_ATTEMPTS = 20;
    let groupId: number | null = null;
    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
      const candidate = Math.floor(Math.random() * (1000000 - 1000 + 1)) + 1000;
      const existing = await Group.findByPk(candidate);
      if (!existing) {
        groupId = candidate;
        break;
      }
    }
    if (groupId === null) {
      return res.status(503).json({ message: 'Unable to generate a unique group ID. Please try again.' });
    }

    const newGroup = await Group.create({
      id: groupId,
      group_name,
      group_type,
      owner_id: userId,
      password: group_type === 'private' ? await hashPassword(password) : undefined
    });

    res.status(201).json({ group: newGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Error creating group' });
  }
});

// Add a prediction
router.post('/prediction/:raceId', mutationLimiter, async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID is required' });
    }
    const raceId = req.params.raceId;

    // Validate prediction window before processing
    const bypassWindow = process.env.BYPASS_PREDICTION_WINDOW === 'true';
    if (!bypassWindow) {
      try {
        const window = await getPredictionWindow(raceId as string);
        if (window.status === 'closed') {
          return res.status(403).json({ message: 'Predictions are closed for this race' });
        }
        if (window.status === 'not_yet_open') {
          return res.status(403).json({ message: 'Predictions are not yet open for this race' });
        }
      } catch (windowError) {
        return res.status(503).json({ message: 'Unable to verify prediction window. Please try again later.' });
      }
    }

    // Check for existing predictions (prevent double-submit)
    const existingCount = await UserPrediction.count({
      where: { user_id: userId, race_identifier: raceId }
    });
    if (existingCount > 0) {
      return res.status(409).json({ message: 'Predictions already submitted for this race' });
    }

    const { pole, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10 } = req.body;

    const group_id = await getUserGroupId(userId);
    if (group_id === null) {
      return res.status(403).json({ message: 'User must own or be member of a group' });
    }

    //--validations--
    const positions = { pole, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10 };
    const missing = Object.entries(positions).find(([key, val]) => !val || val.trim() === '');
    if (missing) {
      return res.status(400).json({ message: `Missing prediction for ${missing[0]}` });
    }

    // Validate all driver names against the known driver list
    const invalidEntry = Object.entries(positions).find(([, name]) => !validDriverNames.has(name.trim()));
    if (invalidEntry) {
      return res.status(400).json({ message: `Invalid driver name: "${invalidEntry[1].trim()}"` });
    }

    const predictionsData: UserPredictionCreationAttributes[] = Object.entries(positions).map(([position_type, driver_name]) => ({
      user_id: userId,
      group_id,
      race_identifier: raceId,
      position_type: position_type as 'pole' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10',
      driver_name: driver_name.trim()
    }) as UserPredictionCreationAttributes);

    const predictions = await UserPrediction.bulkCreate(predictionsData);
    res.status(201).json({ predictions, group_id });
  } catch (error) {
    console.error('Error creating predictions:', error);
    res.status(500).json({ message: 'Error creating predictions' });
  }
});

router.get('/prediction/check/:raceId', async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { raceId } = req.params;
    const predictions = await UserPrediction.findAll({
      where: { user_id: userId, race_identifier: raceId }
    });

    // Group by position_type
    const userPredictions = predictions.reduce((acc, pred) => {
      acc[pred.position_type] = pred.driver_name;
      return acc;
    }, {} as Record<'pole'|'p1'|'p2'|'p3'|'p4'|'p5'|'p6'|'p7'|'p8'|'p9'|'p10', string>);

    res.json({ submitted: predictions.length >= 11, predictions: userPredictions });
  } catch (error) {
    res.status(500).json({ message: 'Error checking predictions' });
  }
});

// Join a group
router.post('/join-group', joinGroupLimiter, async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'User ID is required' });
    }
    const { groupId, groupPassword } = req.body;

    // --validation--
    if (!groupId) return res.status(400).json({ message: 'Group ID is required' });

    // Check if group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already the owner of the group
    if (group.owner_id === userId) {
      return res.status(400).json({ message: 'You are already the owner of this group' });
    }

    const existingMembership = await GroupMember.findOne({
      where: {
        user_id: userId,
        group_id: groupId
      }
    });

    if (existingMembership) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    if (group.group_type === 'private') {
      if (!groupPassword) {
        return res.status(400).json({ message: 'Password is required for private groups' });
      }
      if (!(await verifyPassword(groupPassword, group.password!))) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    await GroupMember.create({
      user_id: userId,
      group_id: groupId
    });

    res.status(200).json({ 
      message: 'Successfully joined the group',
      group: {
        id: group.id,
        group_name: group.group_name,
        group_type: group.group_type
      }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Error joining group' });
  }
});

// Get predictions for a race in a group
router.get('/predictions/:groupId/:raceId', async (req: Request, res: Response) => {
  try {
    const { groupId, raceId } = req.params;

    const predictions = await UserPrediction.findAll({
      where: {
        group_id: groupId,
        race_identifier: raceId
      },
      include: [Group]
    });

    res.json({ predictions });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ message: 'Error fetching predictions' });
  }
});

// Get user's prediction scores for a race
router.get('/scores/:raceId', async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { raceId } = req.params;

    const group_id = await getUserGroupId(userId);

    // user has no group
    if (group_id === null) {
      return res.json({ hasResults: false, scores: [], summary: null });
    }

    // Query PredictionScore for this user-group-race
    const predictionScores = await PredictionScore.findAll({
      where: {
        user_id: userId,
        group_id,
        race_identifier: raceId
      }
    });

    if (predictionScores.length === 0) {
      return res.json({ hasResults: false, scores: [], summary: null });
    }

    // Map to response shape
    const scores = predictionScores.map((ps) => ({
      position_type: ps.position_type,
      predicted_driver_name: ps.predicted_driver_name,
      actual_driver_name: ps.actual_driver_name,
      base_points: ps.base_points,
      final_points: ps.final_points,
      unique_correct: ps.unique_correct
    }));

    // Query UserRaceScore for summary data
    const userRaceScore = await UserRaceScore.findOne({
      where: {
        user_id: userId,
        group_id,
        race_identifier: raceId
      }
    });

    const summary = userRaceScore
      ? {
          total_points: userRaceScore.total_points,
          exact_hits: userRaceScore.exact_hits,
          near_hits: userRaceScore.near_hits,
          unique_correct_hits: userRaceScore.unique_correct_hits
        }
      : null;

    res.json({ hasResults: true, scores, summary });
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ message: 'Error fetching scores' });
  }
});

// Get season ALL RACES leaderboard for user's group 
router.get('/leaderboard/season', async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const group_id = await getUserGroupId(userId);
    if (group_id === null) {
      return res.json({ leaderboard: [], raceCount: 0 });
    }

    // Aggregate scores across all races for the group in the current year
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01T00:00:00`);
    const yearEnd = new Date(`${currentYear + 1}-01-01T00:00:00`);
    const scores = await UserRaceScore.findAll({
      attributes: [
        'user_id',
        [fn('SUM', col('total_points')), 'total_points'],
        [fn('SUM', col('exact_hits')), 'exact_hits'],
        [fn('SUM', col('near_hits')), 'near_hits'],
        [fn('SUM', col('unique_correct_hits')), 'unique_correct_hits'],
      ],
      where: {
        group_id,
        computed_at: { [Op.gte]: yearStart, [Op.lt]: yearEnd },
      },
      group: ['user_id'],
      order: [
        [fn('SUM', col('total_points')), 'DESC'],
        [fn('SUM', col('exact_hits')), 'DESC'],
      ],
      raw: true,
    });

    // Count distinct races for this group in the current year
    const raceCount = await UserRaceScore.count({
      where: {
        group_id,
        computed_at: { [Op.gte]: yearStart, [Op.lt]: yearEnd },
      },
      distinct: true,
      col: 'race_identifier',
    });

    // Fetch display names for all user IDs
    const userIds = scores.map((s) => s.user_id);
    const profiles = await UserProfile.findAll({
      where: { user_id: userIds },
    });
    const profileMap = new Map(profiles.map((p) => [p.user_id, p.display_name]));

    // Compute ranks with tie-handling
    const leaderboard: Array<{
      user_id: string;
      display_name: string;
      total_points: number;
      exact_hits: number;
      near_hits: number;
      unique_correct_hits: number;
      rank: number;
    }> = [];

    scores.forEach((score, index) => {
      const totalPoints = Number(score.total_points);
      const exactHits = Number(score.exact_hits);
      const nearHits = Number(score.near_hits);
      const uniqueCorrectHits = Number(score.unique_correct_hits);

      let rank = 1;
      if (index > 0) {
        const prev = leaderboard[index - 1];
        if (totalPoints === prev.total_points && exactHits === prev.exact_hits) {
          rank = prev.rank;
        } else {
          rank = index + 1;
        }
      }

      leaderboard.push({
        user_id: score.user_id,
        display_name: profileMap.get(score.user_id) ?? score.user_id,
        total_points: totalPoints,
        exact_hits: exactHits,
        near_hits: nearHits,
        unique_correct_hits: uniqueCorrectHits,
        rank,
      });
    });

    res.json({ leaderboard, raceCount });
  } catch (error) {
    console.error('Error fetching season leaderboard:', error);
    res.status(500).json({ message: 'Error fetching season leaderboard' });
  }
});

// Get race leaderboard for user's group
router.get('/leaderboard/:raceId', async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { raceId } = req.params;

    const group_id = await getUserGroupId(userId);
    if (group_id === null) {
      return res.json({ leaderboard: [] });
    }

    const scores = await UserRaceScore.findAll({
      where: {
        group_id,
        race_identifier: raceId
      },
      order: [
        ['total_points', 'DESC'],
        ['exact_hits', 'DESC']
      ]
    });

    // Batch-query UserProfile for all user_ids in the results
    const userIds = scores.map((s) => s.user_id);
    const profiles = await UserProfile.findAll({
      where: { user_id: userIds }
    });
    const profileMap = new Map(profiles.map((p) => [p.user_id, p.display_name]));

    // Users with same total_points AND exact_hits get the same rank
    const leaderboard: Array<{
      user_id: string;
      display_name: string;
      total_points: number;
      exact_hits: number;
      near_hits: number;
      unique_correct_hits: number;
      rank: number;
    }> = [];

    scores.forEach((score, index) => {
      let rank = 1;
      if (index > 0) {
        const prev = scores[index - 1];
        const prevRank = leaderboard[index - 1].rank;
        if (score.total_points === prev.total_points && score.exact_hits === prev.exact_hits) {
          rank = prevRank;
        } else {
          rank = index + 1;
        }
      }
      leaderboard.push({
        user_id: score.user_id,
        display_name: profileMap.get(score.user_id) ?? score.user_id,
        total_points: score.total_points,
        exact_hits: score.exact_hits,
        near_hits: score.near_hits,
        unique_correct_hits: score.unique_correct_hits,
        rank
      });
    });

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

// returns prediction time window for race.
router.get('/prediction-window/:raceId', async (req: Request, res: Response) => {
  try {
    const raceId = req.params.raceId;
    const bypassWindow = process.env.BYPASS_PREDICTION_WINDOW === 'true';
    if (bypassWindow) {
      return res.json({
        status: 'open',
        openTime: new Date(0).toISOString(),
        closeTime: new Date('2099-12-31').toISOString(),
      });
    }
    const window = await getPredictionWindow(raceId as string);
    return res.json({
      status: window.status,
      openTime: window.openTime.toISOString(),
      closeTime: window.closeTime.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to determine prediction window for this race' });
  }
});

export default router;
