"use client";

import { SeasonLeaderboardEntry } from "@/libs/types";

type SeasonLeaderboardProps = {
  leaderboard: SeasonLeaderboardEntry[];
  currentUserId: string;
  groupName: string;
  raceCount: number;
};

export default function SeasonLeaderboard({
  leaderboard,
  currentUserId,
  groupName,
  raceCount,
}: SeasonLeaderboardProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-1">{groupName}</h2>
      <p className="text-sm text-gray-400 mb-4">
        Across {raceCount} {raceCount === 1 ? "race" : "races"}
      </p>

      {leaderboard.length === 0 ? (
        <div className="w-full bg-[#1A1A1A] rounded-lg p-6 text-center text-gray-400">
          No scores available yet
        </div>
      ) : (
        <div className="w-full bg-[#1A1A1A] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-right">Points</th>
                <th className="px-3 py-2 text-right">Exact</th>
                <th className="px-3 py-2 text-right">Near</th>
                <th className="px-3 py-2 text-right">Unique</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.user_id === currentUserId;
                return (
                  <tr
                    key={entry.user_id}
                    className={
                      isCurrentUser
                        ? "bg-[#2C40BD]/30 font-semibold"
                        : "hover:bg-white/5"
                    }
                  >
                    <td className="px-3 py-2">{entry.rank}</td>
                    <td className="px-3 py-2">
                      {entry.display_name || entry.user_id}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {entry.total_points}
                    </td>
                    <td className="px-3 py-2 text-right text-green-400">
                      {entry.exact_hits}
                    </td>
                    <td className="px-3 py-2 text-right text-orange-400">
                      {entry.near_hits}
                    </td>
                    <td className="px-3 py-2 text-right text-yellow-400">
                      {entry.unique_correct_hits}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
