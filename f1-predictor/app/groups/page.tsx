import {Group, Race} from "@/libs/types";
import {RaceCard} from "@/components/RaceCard";
import { CopyButton } from "@/components/CopyButton";
import {NoGroupSection} from "@/components/NoGroupSection";
import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import Link from "next/link";
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
            isOwner: data.isOwner,
            memberCount: data.memberCount
        };
    } catch (error) {
        console.error('Auth/token error:', error);
        return null;
    }
}

async function getGrandPrixRaces(): Promise<Race[]> {
    const res = await fetch(`${API_URL}/public/races?year=2026`, {
        next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch races');

    const allRaces: Race[] = await res.json();
    return allRaces.filter(race => race.meeting_name.includes('Grand Prix'));
}

export default async function Groups() {
    const [userGroup, races] = await Promise.all([getUserGroup(), getGrandPrixRaces()]);
    const now = new Date();
    const isRaceWeekendOver = (race: Race) => {
        const end = new Date(race.date_end);
        end.setUTCHours(23, 59, 59, 999);
        return end < now;
    };
    const pastRaces = races.filter(race => isRaceWeekendOver(race));
    const upcomingRaces = races.filter(race => !isRaceWeekendOver(race));

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            {userGroup ? (
                <div>
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
                                <Link
                                    href="/groups/manage"
                                    className="btn btn-secondary text-sm"
                                >
                                    Manage Group
                                </Link>
                            </div>
                        </div>
                    )}
                    <h2 className="text-h2 mb-6">Upcoming Races</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 justify-items-center">
                        {upcomingRaces.map((race) => (
                            <RaceCard key={race.race_id} race={race} />
                        ))}
                    </div>
                    {pastRaces.length > 0 && (
                        <>
                            <div className="w-full mt-12 mb-8 flex items-center gap-4">
                                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--bg-elevated), var(--text-muted), var(--bg-elevated), transparent)' }} />
                            </div>
                            <h2 className="text-h2 mb-6">Past Races</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 justify-items-center">
                                {pastRaces.map((race) => (
                                    <RaceCard key={race.race_id} race={race} />
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