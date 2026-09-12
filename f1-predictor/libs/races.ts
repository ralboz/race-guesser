import { API_URL } from "@/libs/api";
import { Race } from "@/libs/types";

export async function getGrandPrixRaces(): Promise<Race[]> {
    const res = await fetch(`${API_URL}/public/races?year=2026`, {
        next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch races');

    const allRaces: Race[] = await res.json();
    return allRaces.filter(race => race.meeting_name.includes('Grand Prix'));
}

export function splitRacesByStatus(races: Race[], now: Date = new Date()): { upcomingRaces: Race[]; pastRaces: Race[] } {
    const isRaceWeekendOver = (race: Race) => {
        const end = new Date(race.date_end);
        end.setUTCHours(23, 59, 59, 999);
        return end < now;
    };
    const pastRaces = races.filter(race => isRaceWeekendOver(race));
    const upcomingRaces = races.filter(race => !isRaceWeekendOver(race));
    return { upcomingRaces, pastRaces };
}
