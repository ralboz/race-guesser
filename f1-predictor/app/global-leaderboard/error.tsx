"use client";

export default function GlobalLeaderboardError() {
  return (
    <div className="max-w-2xl mx-auto p-4 text-center" style={{ color: "var(--text-muted)" }}>
      Something went wrong loading the global leaderboard. Please try again later.
    </div>
  );
}
