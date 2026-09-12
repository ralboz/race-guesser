import { RaceCard } from "@/components/RaceCard";
import { Race } from "@/libs/types";

export function RaceGrid({ races, hasGroup = true, isOwner = false, reminderOnFirst = false }: { races: Race[]; hasGroup?: boolean; isOwner?: boolean; reminderOnFirst?: boolean }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 justify-items-center">
            {races.map((race, index) => (
                <RaceCard
                    key={race.race_id}
                    race={race}
                    hasGroup={hasGroup}
                    showReminder={isOwner && reminderOnFirst && index === 0}
                />
            ))}
        </div>
    );
}
