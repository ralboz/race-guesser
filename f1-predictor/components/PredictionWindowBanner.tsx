'use client';

import { PredictionWindowStatus } from '@/app/race/[raceId]/page';

type PredictionWindowProps = {
  windowStatus: PredictionWindowStatus | null;
};

export default function PredictionWindowBanner({ windowStatus }: PredictionWindowProps) {
  if (!windowStatus) {
    return (
      <div className="w-full rounded-lg p-3 bg-gray-700 text-gray-300 text-center text-sm">
        Prediction window unavailable
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
      <div className="w-full rounded-lg p-3 bg-green-800 text-green-100 text-center text-sm">
        <p className="font-semibold">Predictions are open</p>
        <p>
          {formatDate(windowStatus.openTime)} → {formatDate(windowStatus.closeTime)}
        </p>
        <p className="text-xs mt-1 opacity-80">
          Deadline: {formatDate(windowStatus.closeTime)}
        </p>
      </div>
    );
  }

  if (windowStatus.status === 'closed') {
    return (
      <div className="w-full rounded-lg p-3 bg-red-800 text-red-100 text-center text-sm">
        <p className="font-semibold">Predictions are closed</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg p-3 bg-yellow-700 text-yellow-100 text-center text-sm">
      <p className="font-semibold">Predictions are not yet open</p>
      <p className="text-xs mt-1 opacity-80">
        Opens: {formatDate(windowStatus.openTime)}
      </p>
    </div>
  );
}
