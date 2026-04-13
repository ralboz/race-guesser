export interface ReminderCandidate {
  user_id: string;
  email_notifications: boolean;
}

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
