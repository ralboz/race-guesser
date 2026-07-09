import crypto from 'crypto';
import { Resend } from 'resend';
import { clerkClient } from '@clerk/express';
import { Op } from 'sequelize';
import UserProfile from '../models/UserProfile';
import { getRaceById } from '../data/races';

const resend = new Resend(process.env.RESEND_API_KEY);

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'default';

export function generateUnsubscribeToken(userId: string): string {
  return crypto
    .createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(userId)
    .digest('hex');
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

interface ScoredUser {
  user_id: string;
  total_points: number;
  exact_hits: number;
  near_hits: number;
  unique_correct_hits: number;
}

function buildTeaserLine(score: ScoredUser): string {
  const { total_points, exact_hits } = score;

  if (total_points === 0) {
    return `Tough race — but there's always next time. See what happened.`;
  }

  if (exact_hits >= 3) {
    return `You were on fire this race 🔥 with multiple perfect picks. See your full breakdown.`;
  }

  if (exact_hits >= 1) {
    return `You nailed at least one pick perfectly make sure to check how you stacked up.`;
  }

  // Has points but no exact hits = all near misses
  return `So close! You had some near misses this race — see where you landed.`;
}

/**
 * Send results notification emails to all users who were scored for a race.
 * Called after calculate-points commits successfully.
 */
export async function sendResultsNotifications(
  raceId: string,
  scoredUsers: ScoredUser[]
): Promise<{ sent: number; skipped: number; errors: number }> {
  if (scoredUsers.length === 0) {
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const race = getRaceById(raceId);
  if (!race) {
    console.error(`[results-notify] Race not found: ${raceId}`);
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const userIds = scoredUsers.map(s => s.user_id);

  // Fetch profiles and filter out opted-out users
  const profiles = await UserProfile.findAll({
    where: {
      user_id: { [Op.in]: userIds },
      results_email_opt_out: false,
    },
  });

  const profileMap = new Map(profiles.map(p => [p.user_id, p]));
  const eligibleUsers = scoredUsers.filter(s => profileMap.has(s.user_id));

  if (eligibleUsers.length === 0) {
    return { sent: 0, skipped: userIds.length, errors: 0 };
  }

  // Resolve emails from Clerk
  const emailMap = new Map<string, string>();
  for (const user of eligibleUsers) {
    try {
      const clerkUser = await clerkClient.users.getUser(user.user_id);
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (email) emailMap.set(user.user_id, email);
    } catch {
      // Skip users whose email can't be resolved
    }
  }

  const fromAddress = process.env.REMINDER_FROM_EMAIL || 'reminders@gridguesser.com';
  const siteUrl = process.env.SITE_URL || 'https://gridguesser.com';

  let sent = 0;
  let errors = 0;

  for (const user of eligibleUsers) {
    const email = emailMap.get(user.user_id);
    if (!email) continue;

    const profile = profileMap.get(user.user_id)!;
    const displayName = profile.display_name || 'there';
    const teaser = buildTeaserLine(user);
    const unsubscribeToken = generateUnsubscribeToken(user.user_id);
    const unsubscribeUrl = `${siteUrl}/api/public/unsubscribe-results?userId=${encodeURIComponent(user.user_id)}&token=${unsubscribeToken}`;
    const resultsUrl = `${siteUrl}/race/${raceId}`;

    try {
      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: `Results are in! ${race.meeting_name} 🏁`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; padding: 32px 16px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 24px; text-align: center;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Race Results</p>
                        <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">${race.meeting_name}</h1>
                        <p style="margin: 8px 0 0 0; font-size: 32px;">🏁</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="margin: 0 0 20px 0; font-size: 15px; color: #333; line-height: 1.5;">Hey ${displayName},</p>
                        <p style="margin: 0 0 24px 0; font-size: 15px; color: #333; line-height: 1.5;">The results have been posted and your scores are ready.</p>
                        <!-- Teaser card -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
                          <tr>
                            <td style="background-color: #f7f8fc; border-radius: 10px; padding: 20px 24px; border: 1px solid #e8ecf4;">
                              <p style="margin: 0; font-size: 15px; color: #2d3748; line-height: 1.6;">${teaser}</p>
                            </td>
                          </tr>
                        </table>
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${resultsUrl}" style="display: inline-block; background-color: #3b5bdb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View My Results →</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 24px; border-top: 1px solid #f0f0f0; text-align: center;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #a0aec0;">You're receiving this because you have an account on Grid Guesser.</p>
                        <a href="${unsubscribeUrl}" style="font-size: 12px; color: #a0aec0; text-decoration: underline;">Unsubscribe from results emails</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`[results-notify] Failed to send to ${email}:`, err);
      errors++;
    }
  }

  const skipped = userIds.length - eligibleUsers.length;
  console.log(`[results-notify] Race ${raceId}: sent=${sent}, skipped=${skipped}, errors=${errors}`);
  return { sent, skipped, errors };
}
