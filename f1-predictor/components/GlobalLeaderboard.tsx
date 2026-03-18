"use client";

import { GlobalLeaderboardEntry } from "@/libs/types";
import { FaTrophy, FaMedal, FaGlobe } from "react-icons/fa";

type GlobalLeaderboardProps = {
  leaderboard: GlobalLeaderboardEntry[];
  currentUser: GlobalLeaderboardEntry | null;
  currentUserId: string;
  raceCount: number;
  totalParticipants: number;
};

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "var(--color-gold)" }}>
        <FaTrophy className="text-base" />
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "var(--color-silver)" }}>
        <FaMedal className="text-base" />
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "var(--color-bronze)" }}>
        <FaMedal className="text-base" />
        {rank}
      </span>
    );
  }
  return <span>{rank}</span>;
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  isEvenRow,
}: {
  entry: GlobalLeaderboardEntry;
  isCurrentUser: boolean;
  isEvenRow: boolean;
}) {
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
      data-current-user={isCurrentUser ? "true" : undefined}
      data-rank={entry.rank}
      style={{
        backgroundColor: rowBg,
        fontWeight: isCurrentUser ? 600 : 400,
        transition: "background-color 0.15s ease",
      }}
      className={!isCurrentUser ? "hover:!bg-[var(--bg-elevated)]" : ""}
    >
      <td className="px-4 py-3 text-left">
        <RankCell rank={entry.rank} />
      </td>
      <td className="px-4 py-3 text-left">
        {entry.display_name}
        {isCurrentUser && (
          <span className="ml-1.5 text-xs" style={{ color: "var(--color-accent)" }}>(you)</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">{entry.total_points}</td>
      <td className="px-4 py-3 text-right" style={{ color: "var(--color-exact)" }}>{entry.exact_hits}</td>
      <td className="px-4 py-3 text-right" style={{ color: "var(--color-near)" }}>{entry.near_hits}</td>
    </tr>
  );
}

export default function GlobalLeaderboard({
  leaderboard,
  currentUser,
  currentUserId,
  raceCount,
  totalParticipants,
}: GlobalLeaderboardProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1">
        <FaGlobe style={{ color: "var(--color-accent)" }} />
        <h2 className="text-h2">Global Leaderboard</h2>
      </div>
      <p className="text-caption mb-4">
        Top 50 of {totalParticipants} players across {raceCount} {raceCount === 1 ? "race" : "races"} — base points only, no unique bonus
      </p>

      {leaderboard.length === 0 ? (
        <div
          className="w-full rounded-lg p-8 text-center"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "var(--radius-lg)",
            color: "var(--text-muted)",
          }}
        >
          <p className="text-body" style={{ color: "var(--text-muted)" }}>
            No scores available yet
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto" style={{ borderRadius: "var(--radius-lg)" }}>
          <div
            className="min-w-[420px]"
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
                  <th className="px-4 py-3 text-left font-medium">Rank</th>
                  <th className="px-4 py-3 text-left font-medium">Player</th>
                  <th className="px-4 py-3 text-right font-medium">Points</th>
                  <th className="px-4 py-3 text-right font-medium">Exact</th>
                  <th className="px-4 py-3 text-right font-medium">Near</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={entry.user_id === currentUserId}
                    isEvenRow={index % 2 === 0}
                  />
                ))}
                {currentUser && (
                  <>
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-1 text-center text-xs"
                        style={{ color: "var(--text-muted)", borderTop: "1px dashed var(--bg-elevated)" }}
                      >
                        ···
                      </td>
                    </tr>
                    <LeaderboardRow
                      entry={currentUser}
                      isCurrentUser={true}
                      isEvenRow={false}
                    />
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
