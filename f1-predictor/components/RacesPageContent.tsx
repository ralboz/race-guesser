import { Group, LeaderboardEntry, Race } from "@/libs/types";
import { CopyButton } from "@/components/CopyButton";
import { NotificationToggle } from "@/components/NotificationToggle";
import { RaceTabs } from "@/components/RaceTabs";
import { FeaturedRaces } from "@/components/FeaturedRaces";
import Link from "next/link";

interface RacesPageContentProps {
    userGroup: Group;
    upcomingRaces: Race[];
    pastRaces: Race[];
    nextRaceSubmitted?: boolean | null;
    lastRacePodium?: LeaderboardEntry[];
    currentUserId?: string;
    lastRaceYourScore?: number | null;
}

export function RacesPageContent({
    userGroup,
    upcomingRaces,
    pastRaces,
    nextRaceSubmitted = null,
    lastRacePodium = [],
    currentUserId = "",
    lastRaceYourScore = null,
}: RacesPageContentProps) {
    const nextRace = upcomingRaces[0] ?? null;
    const lastRace = pastRaces.length > 0
        ? pastRaces.reduce((latest, race) =>
            new Date(race.date_end).getTime() > new Date(latest.date_end).getTime() ? race : latest
        )
        : null;
    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-3xl">{userGroup.groupName}</h1>
            <div className="flex flex-row items-center gap-2.5 mb-2">
                <p className="text-2xl opacity-80">#{userGroup.groupId}</p>
                <CopyButton text={userGroup.groupId} />
                <span className="text-sm opacity-60">•</span>
                <p className="text-sm opacity-60">{userGroup.memberCount} {userGroup.memberCount === 1 ? 'member' : 'members'}</p>
            </div>
            {userGroup.isOwner && (
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/groups/manage" className="btn btn-secondary text-sm">
                            Manage Group
                        </Link>
                    </div>
                </div>
            )}
            {!userGroup.isOwner && <NotificationToggle />}
            <FeaturedRaces
                nextRace={nextRace}
                nextRaceSubmitted={nextRaceSubmitted}
                lastRace={lastRace}
                lastRacePodium={lastRacePodium}
                currentUserId={currentUserId}
                lastRaceYourScore={lastRaceYourScore}
            />
            <RaceTabs upcomingRaces={upcomingRaces} pastRaces={pastRaces} isOwner={!!userGroup.isOwner} />
        </div>
    );
}
