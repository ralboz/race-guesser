'use client';

import { PredictionWindowStatus } from '@/app/race/[raceId]/page';
import type { SubmissionCount } from '@/app/race/[raceId]/page';

type SubmissionTrackerProps = {
  submissionCount: SubmissionCount | null;
  windowStatus: PredictionWindowStatus | null;
};

export default function ({ submissionCount, windowStatus }: SubmissionTrackerProps) {
  if (!submissionCount || submissionCount.total === 0) return null;
  if (windowStatus?.status === 'not_yet_open') return null;

  const { submitted, total } = submissionCount;
  const percentage = Math.round((submitted / total) * 100);
  const allIn = submitted === total;
  const windowOpen = windowStatus?.status === 'open';

  // Pick messaging based on state
  let message: string;
  let accentColor: string;

  if (allIn) {
    message = `Everyone's in — let's go!`;
    accentColor = 'var(--color-success)';
  } else if (windowOpen && submitted === 0) {
    message = 'No one has predicted yet — be the first!';
    accentColor = 'var(--color-warning)';
  } else if (windowOpen) {
    const remaining = total - submitted;
    message = `${remaining} still need${remaining === 1 ? 's' : ''} to submit — remind them!`;
    accentColor = 'var(--color-accent)';
  } else {
    message = `${submitted} of ${total} submitted`;
    accentColor = 'var(--text-secondary)';
  }

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-label" style={{ color: 'var(--text-primary)' }}>
          Group predictions
        </span>
        <span className="text-label" style={{ color: accentColor, fontWeight: 600 }}>
          {submitted}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '6px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: accentColor,
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <p
        className="text-caption mt-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {message}
      </p>
    </div>
  );
}
