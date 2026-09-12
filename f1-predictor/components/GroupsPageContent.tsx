import { Race, PublicGroupInfo } from "@/libs/types";
import { NoGroupSection } from "@/components/NoGroupSection";
import { PublicGroupList } from "@/components/PublicGroupList";
import { RaceList } from "@/components/RaceList";
import Link from "next/link";

interface GroupsPageContentProps {
    isSignedIn: boolean;
    publicGroups: PublicGroupInfo[];
    upcomingRaces: Race[];
    pastRaces: Race[];
}

export function GroupsPageContent({ isSignedIn, publicGroups, upcomingRaces, pastRaces }: GroupsPageContentProps) {
    // Signed in user without a group
    if (isSignedIn) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-4">
                <h1 className="text-3xl">You aren&apos;t in a group yet! Do you want to join or create one?</h1>
                <NoGroupSection />
                <PublicGroupList groups={publicGroups} isSignedIn={isSignedIn} />
                <RaceList upcomingRaces={upcomingRaces} pastRaces={pastRaces} hasGroup={false} />
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
            <RaceList upcomingRaces={upcomingRaces} pastRaces={pastRaces} hasGroup={false} />
        </div>
    );
}
