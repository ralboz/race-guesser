'use client';

export default function RaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white gap-4">
      <h2 className="text-2xl font-semibold">Failed to load race data</h2>
      <p className="text-gray-400">{error.message || 'The race data could not be retrieved.'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
