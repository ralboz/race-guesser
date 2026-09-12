import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RacesPageContent } from "@/components/RacesPageContent";
import { getUserGroup } from "@/libs/group";
import { getGrandPrixRaces, splitRacesByStatus } from "@/libs/races";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Races",
    robots: { index: false, follow: false },
};

export default async function RacesPage() {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in?redirect_url=/races');
    }

    const token = await getToken();
    if (!token) {
        redirect('/sign-in?redirect_url=/races');
    }

    const userGroup = await getUserGroup(token);
    if (!userGroup) {
        redirect('/groups');
    }

    const races = await getGrandPrixRaces();
    const { upcomingRaces, pastRaces } = splitRacesByStatus(races);

    return (
        <RacesPageContent
            userGroup={userGroup}
            upcomingRaces={upcomingRaces}
            pastRaces={pastRaces}
        />
    );
}
