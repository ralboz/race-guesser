import { RaceCard } from "@/components/RaceCard";
import { Race } from "@/libs/types";

export function RaceList({ upcomingRaces, pastRaces, hasGroup = true, isOwner = false }: { upcomingRaces: Race[]; pastRaces: Race[]; hasGroup?: boolean; isOwner?: boolean }) {
    return (
        <>
            <h2 className="text-h2 mb-6 mt-10">Upcoming Races</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 justify-items-center">
                {upcomingRaces.map((race, index) => (
                    <RaceCard
                        key={race.race_id}
                        race={race}
                        hasGroup={hasGroup}
                        showReminder={isOwner && index === 0}
                    />
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
                            <RaceCard key={race.race_id} race={race} hasGroup={hasGroup} />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
