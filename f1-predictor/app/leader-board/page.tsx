import { auth0 } from "@/libs/auth0";
import { redirect } from "next/navigation";
import { SeasonLeaderboardEntry } from "@/libs/types";
import SeasonLeaderboard from "@/components/SeasonLeaderboard";

interface SeasonLeaderboardResponse {
  leaderboard: SeasonLeaderboardEntry[];
  raceCount: number;
}

export default async function LeaderBoardPage() {
  let tokenObj;
  try {
    tokenObj = await auth0.getAccessToken();
  } catch {
    redirect("/auth/login?returnTo=/leader-board");
  }

  const groupRes = await fetch("http://localhost:3001/protected/group", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${tokenObj.token}` },
  });

  if (!groupRes.ok) {
    return <div className="max-w-2xl mx-auto p-4 text-center text-gray-400">Failed to load group data.</div>;
  }

  const groupData = await groupRes.json();
  if (!groupData.group) {
    redirect("/groups");
  }

  // Fetch season leaderboard
  const leaderboardRes = await fetch("http://localhost:3001/protected/leaderboard/season", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${tokenObj.token}` },
  });

  if (!leaderboardRes.ok) {
    return <div className="max-w-2xl mx-auto p-4 text-center text-gray-400">Failed to load leaderboard data.</div>;
  }

  const { leaderboard, raceCount }: SeasonLeaderboardResponse = await leaderboardRes.json();

  // Get current user ID from session
  const session = await auth0.getSession();
  const currentUserId = session?.user?.sub ?? "";

  return (
    <div className="max-w-2xl mx-auto p-4">
      <SeasonLeaderboard
        leaderboard={leaderboard}
        raceCount={raceCount}
        groupName={groupData.group.group_name}
        currentUserId={currentUserId}
      />
    </div>
  );
}
