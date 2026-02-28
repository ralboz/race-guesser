import {Group, OpenF1Meeting} from "@/libs/types";
import {RaceCard} from "@/components/RaceCard";
import { FaCopy } from "react-icons/fa";
import {NoGroupSection} from "@/components/NoGroupSection";
import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import { API_URL } from "@/libs/api";

async function getUserGroup(): Promise<Group | null> {
    let token;
    try {
        const authObj = await auth();
        token = await authObj.getToken();
    } catch {
        redirect(`/sign-in?redirect_url=/groups`);
    }

    if (!token) {
        redirect(`/sign-in?redirect_url=/groups`);
    }

    try {
        const res = await fetch(`${API_URL}/protected/group`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Backend error fetching group:', res.status, errorText);
            return null;
        }

        const data = await res.json();
        if (!data.group) return null;

        return {
            id: data.group.id,
            groupName: data.group.group_name,
            groupType: data.group.group_type,
            ownerId: data.group.owner_id,
            groupId: data.group.id.toString(),
            isOwner: data.isOwner
        };
    } catch (error) {
        console.error('Auth/token error:', error);
        return null;
    }
}

async function getGrandPrixRaces(): Promise<OpenF1Meeting[]> {
    const res = await fetch('https://api.openf1.org/v1/meetings?year=2026', {
        cache: 'force-cache',
        next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch races');

    const allRaces: OpenF1Meeting[] = await res.json();
    return allRaces.filter(race => race.meeting_name.includes('Grand Prix'));
}

export default async function Groups() {
    const [userGroup, races] = await Promise.all([getUserGroup(), getGrandPrixRaces()]);
    const now = new Date();
    const pastRaces = races.filter(race => new Date(race.date_start) < now);
    const upcomingRaces = races.filter(race => new Date(race.date_start) >= now);

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            {userGroup ? (
                <div>
                    <h1 className="text-3xl">{userGroup.groupName}</h1>
                    <div className="flex flex-row items-center gap-2.5 mb-2">
                        <p className="text-2xl opacity-80">#{userGroup.groupId}</p>
                        <FaCopy />
                    </div>
                    <div className="mb-8">
                        {userGroup.isOwner ? (
                            <p className="text-green-500">You are the owner of this group</p>
                        ) : (
                            <p className="text-blue-500">You are a member of this group</p>
                        )}
                    </div>
                    <h2 className="text-xl mb-5">Upcoming Races</h2>
                    <div className="flex flex-row flex-wrap items-center justify-center gap-7">
                        {upcomingRaces.map((race) => (
                            <RaceCard key={race.meeting_key} race={race} />
                        ))}
                    </div>
                    {pastRaces.length > 0 && (
                        <>
                            <div className="w-full h-1 mt-10 bg-white rounded-lg"/>
                            <h2 className="text-xl mt-5 mb-5">Past Races</h2>
                            <div className="flex flex-row flex-wrap items-center justify-center gap-7">
                                {pastRaces.map((race) => (
                                    <RaceCard key={race.meeting_key} race={race} />
                                ))}
                            </div>
                        </>
                    )}

                </div>
            ) : (
                <div>
                    <h1 className="text-3xl">You aren't in a group yet! Do you want to join or create one?</h1>
                    <NoGroupSection />
                </div>
            )}
        </div>
    );
}