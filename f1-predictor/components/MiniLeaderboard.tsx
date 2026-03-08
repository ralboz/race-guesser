import { LeaderboardEntry } from "@/libs/types";
import { FaTrophy, FaMedal } from "react-icons/fa";

type MiniLeaderboardProps = {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
};

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1" style={{ color: "var(--color-gold)" }}>
        <FaTrophy className="text-sm" />
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1" style={{ color: "var(--color-silver)" }}>
        <FaMedal className="text-sm" />
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1" style={{ color: "var(--color-bronze)" }}>
        <FaMedal className="text-sm" />
        {rank}
      </span>
    );
  }
  return <span>{rank}</span>;
}

export default function MiniLeaderboard({
  leaderboard,
  currentUserId,
}: MiniLeaderboardProps) {
  if (leaderboard.length === 0) {
    return (
      <div
        className="w-full rounded-lg p-6 text-center"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          color: "var(--text-muted)",
        }}
      >
        <p className="text-body" style={{ color: "var(--text-muted)" }}>
          No leaderboard data yet
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-x-auto"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div
        className="min-w-[480px]"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-xs"
            style={{
              color: "var(--text-muted)",
              borderBottom: "1px solid var(--bg-elevated)",
            }}
          >
            <th className="px-3 py-2 text-left font-medium">Rank</th>
            <th className="px-3 py-2 text-left font-medium">User</th>
            <th className="px-3 py-2 text-right font-medium">Points</th>
            <th className="px-3 py-2 text-right font-medium">Exact</th>
            <th className="px-3 py-2 text-right font-medium">Near</th>
            <th className="px-3 py-2 text-right font-medium">Unique</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.user_id === currentUserId;
            const isEvenRow = index % 2 === 0;

            let rowBg: string;
            if (isCurrentUser) {
              rowBg = "var(--color-accent-muted)";
            } else if (isEvenRow) {
              rowBg = "transparent";
            } else {
              rowBg = "var(--bg-surface)";
            }

            return (
              <tr
                key={entry.user_id}
                data-current-user={isCurrentUser ? "true" : undefined}
                data-rank={entry.rank}
                style={{
                  backgroundColor: rowBg,
                  fontWeight: isCurrentUser ? 600 : 400,
                  transition: "background-color 0.15s ease",
                }}
                className={!isCurrentUser ? "hover:!bg-[var(--bg-elevated)]" : ""}
              >
                <td className="px-3 py-2 text-left">
                  <RankCell rank={entry.rank} />
                </td>
                <td className="px-3 py-2 text-left">
                  {entry.display_name || entry.user_id}
                </td>
                <td className="px-3 py-2 text-right">
                  {entry.total_points}
                </td>
                <td className="px-3 py-2 text-right" style={{ color: "var(--color-exact)" }}>
                  {entry.exact_hits}
                </td>
                <td className="px-3 py-2 text-right" style={{ color: "var(--color-near)" }}>
                  {entry.near_hits}
                </td>
                <td className="px-3 py-2 text-right" style={{ color: "var(--color-unique)" }}>
                  {entry.unique_correct_hits}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
