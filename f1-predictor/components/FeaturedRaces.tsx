import { NextRaceCard } from "@/components/NextRaceCard";
import { LastRaceCard } from "@/components/LastRaceCard";
import { LeaderboardEntry, Race } from "@/libs/types";

interface FeaturedRacesProps {
    nextRace: Race | null;
    nextRaceSubmitted: boolean | null;
    lastRace: Race | null;
    lastRacePodium: LeaderboardEntry[];
    currentUserId: string;
    lastRaceYourScore: number | null;
}

export function FeaturedRaces({
    nextRace,
    nextRaceSubmitted,
    lastRace,
    lastRacePodium,
    currentUserId,
    lastRaceYourScore,
}: FeaturedRacesProps) {
    if (!nextRace && !lastRace) return null;

    return (
        <div className="relative mt-8">
            <div
                className="absolute inset-x-0 top-0 -z-10 h-[280px] opacity-50 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, var(--color-accent-muted), transparent 70%)' }}
                aria-hidden="true"
            />
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch justify-center">
                {nextRace && (
                    <NextRaceCard race={nextRace} submitted={nextRaceSubmitted} />
                )}
                {lastRace && (
                    <LastRaceCard
                        race={lastRace}
                        podium={lastRacePodium}
                        currentUserId={currentUserId}
                        yourScore={lastRaceYourScore}
                    />
                )}
            </div>
        </div>
    );
}
