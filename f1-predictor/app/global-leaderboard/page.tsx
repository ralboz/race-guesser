import { auth } from "@clerk/nextjs/server";
import { GlobalLeaderboardEntry } from "@/libs/types";
import GlobalLeaderboard from "@/components/GlobalLeaderboard";
import { API_URL } from "@/libs/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Leaderboard | Grid Guesser",
  description:
    "See how F1 prediction players rank across all groups. Top 50 global leaderboard for the current season.",
  alternates: {
    canonical: "https://gridguesser.com/global-leaderboard",
  },
};

interface GlobalLeaderboardResponse {
  leaderboard: GlobalLeaderboardEntry[];
  currentUser: GlobalLeaderboardEntry | null;
  raceCount: number;
  totalParticipants: number;
}

export default async function GlobalLeaderboardPage() {
  const authObj = await auth();
  const currentUserId = authObj.userId ?? "";

  const url = currentUserId
    ? `${API_URL}/public/leaderboard/global?userId=${encodeURIComponent(currentUserId)}`
    : `${API_URL}/public/leaderboard/global`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center" style={{ color: "var(--text-muted)" }}>
        Failed to load global leaderboard.
      </div>
    );
  }

  const { leaderboard, currentUser, raceCount }: GlobalLeaderboardResponse = await res.json();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <GlobalLeaderboard
        leaderboard={leaderboard}
        currentUser={currentUser}
        currentUserId={currentUserId}
        raceCount={raceCount}
      />
    </div>
  );
}
