import RaceContentTabs, {PredictionCheckResponse} from "@/components/RaceContentTabs";
import {OpenF1Meeting, ScoresResponse, LeaderboardEntry} from "@/libs/types";
import Image from "next/image";
import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import { API_URL } from "@/libs/api";

export type PredictionWindowStatus = {
    status: 'not_yet_open' | 'open' | 'closed';
    openTime: string;
    closeTime: string;
};

type Props = {
    params: Promise<{ raceId: string }>
}

async function getRaceDetails(raceId: string): Promise<OpenF1Meeting | null> {
    const res = await fetch(`https://api.openf1.org/v1/meetings?meeting_key=${raceId}`, {
        next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch race');
    const response: OpenF1Meeting[] = await res.json();
    if(response.length === 0){
        return null;
    }
    return response[0];
}

async function getAuthToken(): Promise<string | null> {
    try {
        const authObj = await auth();
        return await authObj.getToken();
    } catch {
        return null;
    }
}

async function userPredictionStatus(raceId: string): Promise<PredictionCheckResponse | null> {
    const token = await getAuthToken();

    if (!token) {
        redirect(`/sign-in?redirect_url=/race/${raceId}`);
    }

    const res = await fetch(`${API_URL}/protected/prediction/check/${raceId}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
        redirect(`/sign-in?redirect_url=/race/${raceId}`);
    }

    if (!res.ok) return null;
    return (await res.json());
}

async function fetchScores(raceId: string, token: string): Promise<ScoresResponse | null> {
    try {
        const res = await fetch(`${API_URL}/protected/scores/${raceId}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
}

async function fetchLeaderboard(raceId: string, token: string): Promise<LeaderboardResponse | null> {
    try {
        const res = await fetch(`${API_URL}/protected/leaderboard/${raceId}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchPredictionWindow(raceId: string): Promise<PredictionWindowStatus | null> {
    const token = await getAuthToken();
    if (!token) return null;

    try {
        const res = await fetch(`${API_URL}/protected/prediction-window/${raceId}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function SpecificRace({ params }: Props) {
    const { raceId } = await params;
    const [raceDetails, predictionStatus, windowStatus] = await Promise.all([
        getRaceDetails(raceId),
        userPredictionStatus(raceId),
        fetchPredictionWindow(raceId)
    ]);

    if(!raceDetails || !predictionStatus) return null;

    // Get current user ID from Clerk auth for leaderboard highlighting
    const authObj = await auth();
    const currentUserId = authObj.userId ?? "";

    // Fetch scores and leaderboard if the user has submitted predictions
    let scoresResponse: ScoresResponse | null = null;
    let leaderboardResponse: LeaderboardResponse | null = null;

    if (predictionStatus.submitted) {
        const token = await getAuthToken();

        if (token) {
            [scoresResponse, leaderboardResponse] = await Promise.all([
                fetchScores(raceId, token),
                fetchLeaderboard(raceId, token),
            ]);
        }
    }

    const hasResults = scoresResponse?.hasResults ?? false;

    return (
        <div className="flex flex-col max-w-2xl mx-auto p-4 items-center justify-center">
            <div className="flex flex-row gap-3 items-center">
                <h1 className="text-xl">{raceDetails.meeting_official_name}</h1>
                <Image
                    src={raceDetails.country_flag}
                    alt={`${raceDetails.country_name} flag`}
                    width={120}
                    height={68}
                    className="w-[30px] h-[17px] object-cover"
                />
            </div>
            <Image src={raceDetails.circuit_image} alt={`${raceDetails.circuit_short_name} track`} width={250} height={188} className="object-cover"/>

            <RaceContentTabs
                raceId={raceId}
                predictionStatus={predictionStatus}
                hasResults={hasResults}
                scoresResponse={scoresResponse}
                leaderboard={leaderboardResponse?.leaderboard ?? []}
                currentUserId={currentUserId}
                windowStatus={windowStatus}
            />
        </div>
    )
}
