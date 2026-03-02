'use client';

import { FiAlertTriangle } from 'react-icons/fi';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="flex flex-col items-center gap-4 p-8 text-center"
        style={{
          backgroundColor: 'var(--color-error-bg)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '28rem',
          width: '100%',
        }}
      >
        <FiAlertTriangle size={40} style={{ color: 'var(--color-error)' }} />
        <h2 className="text-h2">Something went wrong</h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
