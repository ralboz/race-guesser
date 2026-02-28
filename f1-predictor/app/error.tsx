'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white gap-4">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-gray-400">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
