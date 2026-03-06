import Image from "next/image";
import Link from "next/link";
import { LocalDate } from "./LocalDate";
import { CircuitMap } from "./CircuitMap";
import { getFlagUrl } from "@/libs/flags";
import { Race } from "@/libs/types";

export function RaceCard({race}: {race: Race}) {
    return (
        <div
            className="flex flex-col justify-between items-center w-[320px] h-[360px] p-5 border border-transparent transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-[var(--color-accent-muted)]"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
            }}
        >
            <div className="flex flex-row items-center gap-2.5">
                <h3 className="text-h3">{race.meeting_name}</h3>
                <Image
                    src={getFlagUrl(race.country_code)}
                    alt={`${race.country_name} flag`}
                    width={80}
                    height={60}
                    className="w-[30px] h-[17px] object-cover"
                />
            </div>
            <CircuitMap
                circuitId={race.circuit_id}
                width={250}
                height={188}
                className="object-cover"
            />
            <div className="flex flex-col items-center gap-3">
                <LocalDate iso={race.fp1_start} className="text-label" />
                <Link
                    href={`/race/${race.race_id}`}
                    className="btn btn-primary focus-ring"
                >
                    Go to event
                </Link>
            </div>
        </div>
    );
}
