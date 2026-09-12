import { RaceGrid } from "@/components/RaceGrid";
import { Race } from "@/libs/types";

export function RaceList({ upcomingRaces, pastRaces, hasGroup = true, isOwner = false }: { upcomingRaces: Race[]; pastRaces: Race[]; hasGroup?: boolean; isOwner?: boolean }) {
    return (
        <>
            <h2 className="text-h2 mb-6 mt-10">Upcoming Races</h2>
            <RaceGrid races={upcomingRaces} hasGroup={hasGroup} isOwner={isOwner} reminderOnFirst />
            {pastRaces.length > 0 && (
                <>
                    <div className="w-full mt-12 mb-8 flex items-center gap-4">
                        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--bg-elevated), var(--text-muted), var(--bg-elevated), transparent)' }} />
                    </div>
                    <h2 className="text-h2 mb-6">Past Races</h2>
                    <RaceGrid races={pastRaces} hasGroup={hasGroup} />
                </>
            )}
        </>
    );
}
