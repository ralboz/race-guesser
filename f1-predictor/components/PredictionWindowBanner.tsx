'use client';

import { PredictionWindowStatus } from '@/app/race/[raceId]/page';

type PredictionWindowProps = {
  windowStatus: PredictionWindowStatus | null;
};

export default function PredictionWindowBanner({ windowStatus }: PredictionWindowProps) {
  if (!windowStatus) {
    return (
      <div
        className="w-full text-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
        }}
      >
        <span className="text-label">Prediction window unavailable</span>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(iso));

  if (windowStatus.status === 'open') {
    return (
      <div
        className="w-full text-center"
        style={{
          backgroundColor: 'var(--color-success-bg)',
          border: '1px solid var(--color-success)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
        }}
      >
        <p className="text-label" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
          Predictions are open
        </p>
        <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(windowStatus.openTime)} → {formatDate(windowStatus.closeTime)}
        </p>
        <p className="text-caption" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Deadline: {formatDate(windowStatus.closeTime)}
        </p>
      </div>
    );
  }

  if (windowStatus.status === 'closed') {
    return (
      <div
        className="w-full text-center"
        style={{
          backgroundColor: 'var(--color-error-bg)',
          border: '1px solid var(--color-error)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
        }}
      >
        <p className="text-label" style={{ color: 'var(--color-error)', fontWeight: 600 }}>
          Predictions are closed
        </p>
      </div>
    );
  }

  // not yet open
  return (
    <div
      className="w-full text-center"
      style={{
        backgroundColor: 'var(--color-warning-bg)',
        border: '1px solid var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
      }}
    >
      <p className="text-label" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
        Predictions are not yet open
      </p>
      <p className="text-caption" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        Opens: {formatDate(windowStatus.openTime)}
      </p>
    </div>
  );
}
