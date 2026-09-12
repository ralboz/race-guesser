import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RacesPageContent } from "@/components/RacesPageContent";
import { getUserGroup } from "@/libs/group";
import { getGrandPrixRaces, splitRacesByStatus } from "@/libs/races";
import { API_URL } from "@/libs/api";
import { LeaderboardEntry, Race } from "@/libs/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Races",
    robots: { index: false, follow: false },
};

function getLastRace(pastRaces: Race[]): Race | null {
    if (pastRaces.length === 0) return null;
    return pastRaces.reduce((latest, race) =>
        new Date(race.date_end).getTime() > new Date(latest.date_end).getTime() ? race : latest
    );
}

async function getPredictionSubmitted(raceId: string, token: string): Promise<boolean | null> {
    try {
        const res = await fetch(`${API_URL}/protected/prediction/check/${raceId}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return !!data.submitted;
    } catch {
        return null;
    }
}

async function getLastRacePodium(raceId: string, token: string): Promise<LeaderboardEntry[]> {
    try {
        const res = await fetch(`${API_URL}/protected/leaderboard/${raceId}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const leaderboard: LeaderboardEntry[] = data.leaderboard ?? [];
        return leaderboard.slice(0, 3);
    } catch {
        return [];
    }
}

async function getLastRaceYourScore(raceId: string, token: string): Promise<number | null> {
    try {
        const res = await fetch(`${API_URL}/protected/scores/${raceId}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.hasResults || !data.summary) return null;
        return data.summary.total_points ?? null;
    } catch {
        return null;
    }
}

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

    const nextRace = upcomingRaces[0] ?? null;
    const lastRace = getLastRace(pastRaces);

    const [nextRaceSubmitted, lastRacePodium, lastRaceYourScore] = await Promise.all([
        nextRace ? getPredictionSubmitted(nextRace.race_id, token) : Promise.resolve(null),
        lastRace ? getLastRacePodium(lastRace.race_id, token) : Promise.resolve([]),
        lastRace ? getLastRaceYourScore(lastRace.race_id, token) : Promise.resolve(null),
    ]);

    return (
        <RacesPageContent
            userGroup={userGroup}
            upcomingRaces={upcomingRaces}
            pastRaces={pastRaces}
            nextRaceSubmitted={nextRaceSubmitted}
            lastRacePodium={lastRacePodium}
            currentUserId={userId}
            lastRaceYourScore={lastRaceYourScore}
        />
    );
}
