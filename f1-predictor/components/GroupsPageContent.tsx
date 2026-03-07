import { Group, Race, PublicGroupInfo } from "@/libs/types";
import { CopyButton } from "@/components/CopyButton";
import { NoGroupSection } from "@/components/NoGroupSection";
import { PublicGroupList } from "@/components/PublicGroupList";
import { RaceList } from "@/components/RaceList";
import Link from "next/link";

interface GroupsPageContentProps {
    isSignedIn: boolean;
    userGroup: Group | null;
    publicGroups: PublicGroupInfo[];
    upcomingRaces: Race[];
    pastRaces: Race[];
}

export function GroupsPageContent({ isSignedIn, userGroup, publicGroups, upcomingRaces, pastRaces }: GroupsPageContentProps) {
    // Signed in user in a group
    if (isSignedIn && userGroup) {
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
                <RaceList upcomingRaces={upcomingRaces} pastRaces={pastRaces} />
            </div>
        );
    }

    // Signed in user without a group
    if (isSignedIn && !userGroup) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-4">
                <h1 className="text-3xl">You aren&apos;t in a group yet! Do you want to join or create one?</h1>
                <NoGroupSection />
                <PublicGroupList groups={publicGroups} isSignedIn={isSignedIn} />
                <RaceList upcomingRaces={upcomingRaces} pastRaces={pastRaces} />
            </div>
        );
    }

    // Not signed in — fully PUBLIC
    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-3xl">Predict F1 Results With Your Friends and Colleagues</h1>
            <p className="text-lg mt-2 opacity-80">
                Create or join an active group, predict race results, and compete on the leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href="/sign-up?redirect_url=/groups" className="btn btn-primary text-lg px-8 py-3">
                    Join a Group
                </Link>
                <Link href="/sign-up?redirect_url=/groups" className="btn btn-secondary text-lg px-8 py-3">
                    Create a Group
                </Link>
            </div>

            <PublicGroupList groups={publicGroups} isSignedIn={isSignedIn} />
            <RaceList upcomingRaces={upcomingRaces} pastRaces={pastRaces} />
        </div>
    );
}
