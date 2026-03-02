'use client';

import { useEffect, useState } from 'react';

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

const formatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (hours > 0) return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return `${pad(minutes)}m ${pad(seconds)}s`;
}

// client component used so that the timezone is the actual one of the user not our server.
export function LocalDate({ iso, className }: { iso: string; className?: string }) {
  const target = new Date(iso).getTime();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const diff = target - Date.now();
    if (diff <= 0 || diff > FOUR_DAYS_MS) return;

    setRemaining(diff);
    const interval = setInterval(() => {
      const next = target - Date.now();
      if (next <= 0) {
        clearInterval(interval);
        setRemaining(null);
      } else {
        setRemaining(next);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  if (remaining !== null && remaining > 0) {
    return <p className={className}>🏁 {formatCountdown(remaining)}</p>;
  }

  return <p className={className}>{formatter.format(new Date(iso))}</p>;
}
