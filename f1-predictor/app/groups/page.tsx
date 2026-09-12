import { PublicGroupInfo } from "@/libs/types";
import { GroupsPageContent } from "@/components/GroupsPageContent";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { API_URL } from "@/libs/api";
import { getGrandPrixRaces, splitRacesByStatus } from "@/libs/races";
import { getUserGroup } from "@/libs/group";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Groups — Join or Create an F1 Prediction League",
    description:
        "Create a private F1 prediction league or join a public group. Compete with friends across the full Formula 1 season on Grid Guesser.",
    alternates: {
        canonical: "https://gridguesser.com/groups",
    },
};

async function getPublicGroups(): Promise<PublicGroupInfo[]> {
    const res = await fetch(`${API_URL}/public/groups`, {
        next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function Groups() {
    const { userId, getToken } = await auth();
    const isSignedIn = !!userId;

    let token: string | null = null;
    if (isSignedIn) {
        token = await getToken();
    }

    const [userGroup, races, publicGroups] = await Promise.all([
        isSignedIn ? getUserGroup(token!) : Promise.resolve(null),
        getGrandPrixRaces(),
        getPublicGroups(),
    ]);

    // Members already have a group — /groups is only for discovery/join/create.
    if (isSignedIn && userGroup) {
        redirect('/races');
    }

    const { upcomingRaces, pastRaces } = splitRacesByStatus(races);

    return (
        <GroupsPageContent
            isSignedIn={isSignedIn}
            publicGroups={publicGroups}
            upcomingRaces={upcomingRaces}
            pastRaces={pastRaces}
        />
    );
}
