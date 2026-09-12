import { Group, Race } from "@/libs/types";
import { CopyButton } from "@/components/CopyButton";
import { NotificationToggle } from "@/components/NotificationToggle";
import { RaceList } from "@/components/RaceList";
import Link from "next/link";

interface RacesPageContentProps {
    userGroup: Group;
    upcomingRaces: Race[];
    pastRaces: Race[];
}

export function RacesPageContent({ userGroup, upcomingRaces, pastRaces }: RacesPageContentProps) {
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
            <RaceList upcomingRaces={upcomingRaces} pastRaces={pastRaces} isOwner={!!userGroup.isOwner} />
        </div>
    );
}
