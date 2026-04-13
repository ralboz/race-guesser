import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { clerkClient } from '@clerk/express';
import { requireAuth } from '../middleware/auth';
import { syncUserProfile } from '../middleware/syncUserProfile';
import { requireGroupOwner } from '../middleware/requireGroupOwner';
import { GroupMember, UserProfile, Group, UserPrediction, ReminderLog } from '../models';
import { hashPassword } from '../utils/password';
import { getRaceById } from '../data/races';
import { getEligibleRecipients } from '../services/reminderService';

const resend = new Resend(process.env.RESEND_API_KEY);

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

// Check reminder status for a race
router.get('/reminder-status/:raceId', async (req: Request, res: Response) => {
  try {
    const group = (req as any).group as Group;
    const { raceId } = req.params;
    const raceIdStr = Array.isArray(raceId) ? raceId[0] : raceId;

    const existing = await ReminderLog.findOne({
      where: { group_id: group.id, race_identifier: raceIdStr },
    });

    res.json({ sent: !!existing, sentAt: existing?.sent_at ?? null });
  } catch (error) {
    console.error('Error checking reminder status:', error);
    res.status(500).json({ message: 'Error checking reminder status' });
  }
});

// Send prediction reminder to group members who opted in and haven't submitted
router.post('/send-reminder/:raceId', adminMutationLimiter, async (req: Request, res: Response) => {
  try {
    const group = (req as any).group as Group;
    const { raceId } = req.params;
    const raceIdStr = Array.isArray(raceId) ? raceId[0] : raceId;
    const userId = (req as any).auth?.userId as string;

    // Check if reminder already sent for this race
    const existing = await ReminderLog.findOne({
      where: { group_id: group.id, race_identifier: raceIdStr },
    });
    if (existing) {
      return res.status(409).json({ message: 'Reminder already sent for this race' });
    }

    const race = getRaceById(raceIdStr);
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }

    const members = await GroupMember.findAll({ where: { group_id: group.id } });
    const allUserIds = members.map(m => m.user_id);

    // Find users who already submitted for this race
    const submittedUserIds = await UserPrediction.findAll({
      where: { group_id: group.id, race_identifier: raceIdStr },
      attributes: ['user_id'],
      group: ['user_id'],
    }).then(rows => new Set(rows.map(r => r.user_id)));

    if (allUserIds.length === 0 || allUserIds.every(id => submittedUserIds.has(id))) {
      return res.status(400).json({ message: 'All group members have already submitted predictions' });
    }

    // Get all profiles then filter with shared logic
    const allProfiles = await UserProfile.findAll({
      where: { user_id: allUserIds },
    });
    const eligible = getEligibleRecipients(allUserIds, submittedUserIds, allProfiles);
    const optedInProfiles = allProfiles.filter(p => eligible.some(e => e.user_id === p.user_id));

    if (optedInProfiles.length === 0) {
      // Even if no users still log the reminder so admin can't retry
      await ReminderLog.create({
        group_id: group.id,
        race_identifier: raceIdStr,
        sent_by: userId,
        recipients_count: 0,
      });
      return res.json({ message: 'No members have email notifications enabled', sent: 0 });
    }

    // Fetch emails from Clerk
    const emailMap = new Map<string, string>();
    for (const profile of optedInProfiles) {
      try {
        const clerkUser = await clerkClient.users.getUser(profile.user_id);
        const email = clerkUser.primaryEmailAddress?.emailAddress;
        if (email) emailMap.set(profile.user_id, email);
      } catch {
        // Just skip users whose data can't be fetched
      }
    }

    if (emailMap.size === 0) {
      // Even if no users still log the reminder so admin can't retry
      await ReminderLog.create({
        group_id: group.id,
        race_identifier: raceIdStr,
        sent_by: userId,
        recipients_count: 0,
      });
      return res.json({ message: 'Could not resolve email addresses for opted-in members', sent: 0 });
    }

    // Send emails
    const fromAddress = process.env.REMINDER_FROM_EMAIL || 'reminders@gridguesser.com';
    const siteUrl = 'https://gridguesser.com';
    let sentCount = 0;

    for (const [uid, email] of emailMap) {
      const displayName = optedInProfiles.find(p => p.user_id === uid)?.display_name ?? 'there';
      try {
        await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: `Reminder: Submit your predictions for ${race.meeting_name}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <p>Hey ${displayName},</p>
              <p>Your group <strong>${group.group_name}</strong> is waiting on your predictions for the <strong>${race.meeting_name}</strong>.</p>
              <p>Don't miss out — submit before the window closes.</p>
              <p style="margin: 24px 0;">
                <a href="${siteUrl}/race/${raceIdStr}" style="background-color: #3b5bdb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Submit Predictions
                </a>
              </p>
              <p style="color: #666; font-size: 13px;">You're receiving this because you opted in to email reminders. You can turn this off in your notification settings on <a href="${siteUrl}/groups" style="color: #3b5bdb;">Grid Guesser</a>.</p>
            </div>
          `,
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send reminder to ${email}:`, err);
      }
    }

    // Log the reminder
    await ReminderLog.create({
      group_id: group.id,
      race_identifier: raceIdStr,
      sent_by: userId,
      recipients_count: sentCount,
    });

    res.json({ message: `Reminder sent to ${sentCount} member${sentCount !== 1 ? 's' : ''}`, sent: sentCount });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ message: 'Error sending reminder' });
  }
});

export default router;
