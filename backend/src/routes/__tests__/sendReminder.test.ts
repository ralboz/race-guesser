import { describe, it, expect } from 'vitest';
import { getEligibleRecipients, canSendReminder, ReminderCandidate, WindowStatus } from '../../services/reminderService';

describe('getEligibleRecipients', () => {
  const members = ['user_a', 'user_b', 'user_c'];

  it('includes only users who have not submitted and have notifications enabled', () => {
    const submitted = new Set(['user_a']);
    const profiles: ReminderCandidate[] = [
      { user_id: 'user_a', email_notifications: true },
      { user_id: 'user_b', email_notifications: true },
      { user_id: 'user_c', email_notifications: false },
    ];

    const result = getEligibleRecipients(members, submitted, profiles);

    expect(result).toEqual([{ user_id: 'user_b', email_notifications: true }]);
  });

  it('returns empty when all members have submitted', () => {
    const submitted = new Set(['user_a', 'user_b', 'user_c']);
    const profiles: ReminderCandidate[] = [
      { user_id: 'user_a', email_notifications: true },
      { user_id: 'user_b', email_notifications: true },
      { user_id: 'user_c', email_notifications: true },
    ];

    const result = getEligibleRecipients(members, submitted, profiles);

    expect(result).toEqual([]);
  });

  it('returns empty when no one has notifications enabled', () => {
    const submitted = new Set<string>();
    const profiles: ReminderCandidate[] = [
      { user_id: 'user_a', email_notifications: false },
      { user_id: 'user_b', email_notifications: false },
      { user_id: 'user_c', email_notifications: false },
    ];

    const result = getEligibleRecipients(members, submitted, profiles);

    expect(result).toEqual([]);
  });

  it('returns all opted-in users when none have submitted', () => {
    const submitted = new Set<string>();
    const profiles: ReminderCandidate[] = [
      { user_id: 'user_a', email_notifications: true },
      { user_id: 'user_b', email_notifications: false },
      { user_id: 'user_c', email_notifications: true },
    ];

    const result = getEligibleRecipients(members, submitted, profiles);

    expect(result).toEqual([
      { user_id: 'user_a', email_notifications: true },
      { user_id: 'user_c', email_notifications: true },
    ]);
  });

  it('owner is not in member list (excluded upstream)', () => {
    const memberIds = ['user_a', 'user_b'];
    const submitted = new Set<string>();
    const profiles: ReminderCandidate[] = [
      { user_id: 'owner_123', email_notifications: true },
      { user_id: 'user_a', email_notifications: true },
      { user_id: 'user_b', email_notifications: true },
    ];

    const result = getEligibleRecipients(memberIds, submitted, profiles);

    expect(result.find(r => r.user_id === 'owner_123')).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it('handles a single member who has submitted', () => {
    const result = getEligibleRecipients(
      ['user_a'],
      new Set(['user_a']),
      [{ user_id: 'user_a', email_notifications: true }]
    );

    expect(result).toEqual([]);
  });

  it('handles empty group (no members)', () => {
    const result = getEligibleRecipients([], new Set(), []);

    expect(result).toEqual([]);
  });
});


describe('canSendReminder', () => {
  it('allows when window is open and not already sent', () => {
    const result = canSendReminder('open', false);
    expect(result).toEqual({ allowed: true });
  });

  it('rejects when already sent', () => {
    const result = canSendReminder('open', true);
    expect(result).toEqual({ allowed: false, reason: 'Reminder already sent for this race' });
  });

  it('rejects when window is not yet open', () => {
    const result = canSendReminder('not_yet_open', false);
    expect(result).toEqual({ allowed: false, reason: 'Prediction window is not open for this race' });
  });

  it('rejects when window is closed', () => {
    const result = canSendReminder('closed', false);
    expect(result).toEqual({ allowed: false, reason: 'Prediction window is not open for this race' });
  });

  it('rejects with already-sent reason even if window is also closed', () => {
    const result = canSendReminder('closed', true);
    expect(result).toEqual({ allowed: false, reason: 'Reminder already sent for this race' });
  });
});
