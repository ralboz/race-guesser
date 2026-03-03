import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { syncUserProfile } from '../middleware/syncUserProfile';
import { requireGroupOwner } from '../middleware/requireGroupOwner';
import { GroupMember, UserProfile, Group } from '../models';
import { hashPassword } from '../utils/password';

const router = express.Router();

const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// All admin routes require auth + group ownership
router.use(requireAuth());
router.use(syncUserProfile);
router.use(requireGroupOwner);

// list all members of the owner's group
router.get('/members', async (req: Request, res: Response) => {
  try {
    const group = (req as any).group as Group;

    const members = await GroupMember.findAll({
      where: { group_id: group.id },
      order: [['created_at', 'ASC']]
    });

    const userIds = members.map(m => m.user_id);

    // Also include the owner
    const allUserIds = [group.owner_id, ...userIds];
    const profiles = await UserProfile.findAll({ where: { user_id: allUserIds } });
    const profileMap = new Map(profiles.map(p => [p.user_id, p.display_name]));

    const memberList = members.map(m => ({
      user_id: m.user_id,
      display_name: profileMap.get(m.user_id) ?? m.user_id,
      joined_at: m.created_at
    }));

    res.json({
      owner: {
        user_id: group.owner_id,
        display_name: profileMap.get(group.owner_id) ?? group.owner_id
      },
      members: memberList
    });
  } catch (error) {
    console.error('Error listing members:', error);
    res.status(500).json({ message: 'Error listing members' });
  }
});


// remove a member from the group
router.delete('/members/:userId', adminMutationLimiter, async (req: Request, res: Response) => {
  try {
    const group = (req as any).group as Group;
    const targetUserId = req.params.userId;

    if (targetUserId === group.owner_id) {
      return res.status(400).json({ message: 'Cannot remove the group owner' });
    }

    const deleted = await GroupMember.destroy({
      where: { user_id: targetUserId, group_id: group.id }
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Error removing member' });
  }
});

// change the group password
router.patch('/password', adminMutationLimiter, async (req: Request, res: Response) => {
  try {
    console.log("hit")
    const group = (req as any).group as Group;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length === 0) {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({ message: 'Password must be at least 3 characters' });
    }

    const hashed = await hashPassword(newPassword);
    await group.update({ password: hashed });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

export default router;
