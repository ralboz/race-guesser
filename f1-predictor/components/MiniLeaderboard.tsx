import { LeaderboardEntry } from "@/libs/types";

type MiniLeaderboardProps = {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
};

export default function MiniLeaderboard({
  leaderboard,
  currentUserId,
}: MiniLeaderboardProps) {
  if (leaderboard.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#1A1A1A] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-700">
            <th className="px-3 py-2 text-left">Rank</th>
            <th className="px-3 py-2 text-left">User</th>
            <th className="px-3 py-2 text-right">Points</th>
            <th className="px-3 py-2 text-right">Exact</th>
            <th className="px-3 py-2 text-right">Near</th>
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
                <td className="px-3 py-2">{entry.display_name || entry.user_id}</td>
                <td className="px-3 py-2 text-right">{entry.total_points}</td>
                <td className="px-3 py-2 text-right text-green-400">
                  {entry.exact_hits}
                </td>
                <td className="px-3 py-2 text-right text-orange-400">
                  {entry.near_hits}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
