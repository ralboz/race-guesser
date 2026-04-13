export interface ReminderCandidate {
  user_id: string;
  email_notifications: boolean;
}

export type WindowStatus = 'not_yet_open' | 'open' | 'closed';

/**
 * Filters group members down to those eligible for a reminder email:
 * - Has not submitted predictions for the race
 * - Has email_notifications enabled
 */
export function getEligibleRecipients(
  memberUserIds: string[],
  submittedUserIds: Set<string>,
  profiles: ReminderCandidate[]
): ReminderCandidate[] {
  const pendingUserIds = memberUserIds.filter(id => !submittedUserIds.has(id));
  return profiles.filter(
    p => pendingUserIds.includes(p.user_id) && p.email_notifications
  );
}

/**
 * Returns whether a reminder can be sent for a given race.
 * Reminders are only allowed when the prediction window is open
 * and no reminder has been sent yet.
 */
export function canSendReminder(
  windowStatus: WindowStatus,
  alreadySent: boolean
): { allowed: boolean; reason?: string } {
  if (alreadySent) {
    return { allowed: false, reason: 'Reminder already sent for this race' };
  }
  if (windowStatus !== 'open') {
    return { allowed: false, reason: 'Prediction window is not open for this race' };
  }
  return { allowed: true };
}
