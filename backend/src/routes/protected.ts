import express, { Request, Response } from 'express';
import { jwtCheck } from '../middleware/auth';
import { Group, UserPrediction, GroupMember } from '../models';
import {UserPredictionCreationAttributes} from "../models/UserPrediction";
import { hashPassword, verifyPassword } from '../utils/password';

const router = express.Router();

router.use(jwtCheck);

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'This is a protected endpoint',
    user: req.auth
  });
});

// Get user's group (owned or member)
router.get('/group', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.payload.sub;
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
router.post('/create-group', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.payload.sub;
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

    const generateRandomId = async () => {
      const min = 1000;
      const max = 1000000;
      const randomId = Math.floor(Math.random() * (max - min + 1)) + min;

      const existingGroup = await Group.findByPk(randomId);
      if (existingGroup) {
        return generateRandomId();
      }
      return randomId;
    };

    const groupId = await generateRandomId();

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
router.post('/prediction/:raceId', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.payload.sub;
    if (!userId) {
      return res.status(401).json({ message: 'User ID is required' });
    }
    const raceId = req.params.raceId;
    const { pole, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10 } = req.body;

    const ownedGroup = await Group.findOne({ where: { owner_id: userId } });
    let group_id: number;

    if (ownedGroup) {
      group_id = ownedGroup.id;
    } else {
      const membershipRecord = await GroupMember.findOne({
        where: { user_id: userId },
        include: [Group]
      });
      if (!membershipRecord?.Group) {
        return res.status(403).json({ message: 'User must own or be member of a group' });
      }
      group_id = membershipRecord.Group.id;
    }

    //--validations--
    const positions = { pole, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10 };
    const missing = Object.entries(positions).find(([key, val]) => !val || val.trim() === '');
    if (missing) {
      return res.status(400).json({ message: `Missing prediction for ${missing[0]}` });
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
    const userId = req.auth?.payload.sub;
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

    res.json({ submitted: predictions.length === 11, predictions: userPredictions });
  } catch (error) {
    res.status(500).json({ message: 'Error checking predictions' });
  }
});

// Join a group
router.post('/join-group', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.payload.sub;
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

export default router;