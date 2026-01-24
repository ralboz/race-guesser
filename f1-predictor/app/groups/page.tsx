import {OpenF1Meeting} from "@/libs/types";
import {RaceCard} from "@/components/RaceCard";
import { FaCopy } from "react-icons/fa";
import {NoGroupSection} from "@/components/NoGroupSection";
import {auth0} from "@/libs/auth0";

async function getUserGroup() {
    try {
        const tokenObj = await auth0.getAccessToken();

        const res = await fetch('http://localhost:3001/protected/user', {
            cache: 'no-store',
            headers: {
                Authorization: `bearer ${tokenObj.token}`,
            },
            next: { revalidate: 3600 },
        });
        console.log(res);
        if (!res.ok) {
            console.error('Backend error:', res.status, await res.text());
            return null; // Or redirect/handle unauth
        }

        const data = await res.json();
        return data ?? null;
    } catch (error) {
        console.error('Auth/token error:', error);
        return null;
    }
}

async function getGrandPrixRaces(): Promise<OpenF1Meeting[]> {
    const res = await fetch('https://api.openf1.org/v1/meetings?year=2026', {
        next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch races');

    const allRaces: OpenF1Meeting[] = await res.json();
    return allRaces.filter(race => race.meeting_name.includes('Grand Prix'));
}

export default async function Groups() {
    const [userGroup, races] = await Promise.all([getUserGroup(), getGrandPrixRaces()]);
    const now = new Date(); // Uses server time; consistent for SSR [web:19]
    const pastRaces = races.filter(race => new Date(race.date_start) < now);
    const upcomingRaces = races.filter(race => new Date(race.date_start) >= now);
    console.log(userGroup);
    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            {userGroup ? (
                <div>
                    <h1 className="text-3xl">{userGroup.groupName}</h1>
                    <div className="flex flex-row items-center gap-2.5 mb-8">
                        <p className="text-2xl opacity-80">#{userGroup.groupCode}</p>
                        <FaCopy />
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
                    <h1 className="text-3xl">You aren’t in a group yet! Do you want to join or create one?</h1>
                    <NoGroupSection />
                </div>
            )}
        </div>
    );
}