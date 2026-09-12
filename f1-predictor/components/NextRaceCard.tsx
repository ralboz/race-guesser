import Image from "next/image";
import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { LocalDate } from "./LocalDate";
import { CircuitMap } from "./CircuitMap";
import TiltCard from "./TiltCard";
import { getFlagUrl } from "@/libs/flags";
import { Race } from "@/libs/types";

interface NextRaceCardProps {
    race: Race;
    hasGroup?: boolean;
    submitted?: boolean | null;
}

export function NextRaceCard({ race, hasGroup = true, submitted = null }: NextRaceCardProps) {
    return (
        <TiltCard
            accentLine
            className="flex flex-col justify-between items-center w-full max-w-[380px] p-6"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--bg-elevated)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            }}
        >
            <span
                className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: 'var(--color-accent)' }}
            >
                <FiClock size={12} />
                Next Race
            </span>
            <div className="flex flex-row items-center gap-2.5">
                <h3 className="text-h3">{race.meeting_name}</h3>
                <Image
                    src={getFlagUrl(race.country_code)}
                    alt={`${race.country_name} flag`}
                    width={80}
                    height={60}
                    className="w-[30px] h-[17px] object-cover rounded-sm"
                />
            </div>
            <CircuitMap
                circuitId={race.circuit_id}
                width={250}
                height={188}
                className="object-cover my-2"
            />
            <div className="flex flex-col items-center gap-3">
                <LocalDate iso={race.fp1_start} className="text-label" />
                {hasGroup && submitted !== null && (
                    <span
                        className="text-xs font-medium px-3 py-1 rounded-full"
                        style={{
                            backgroundColor: submitted ? 'var(--color-exact-bg)' : 'var(--color-warning-bg)',
                            color: submitted ? 'var(--color-exact)' : 'var(--color-warning)',
                        }}
                    >
                        {submitted ? '✓ Prediction submitted' : 'Prediction pending'}
                    </span>
                )}
                {hasGroup ? (
                    <Link
                        href={`/race/${race.race_id}`}
                        className="btn btn-primary focus-ring"
                    >
                        Go to event
                    </Link>
                ) : (
                    <span className="text-sm opacity-60">Join a group to start predicting</span>
                )}
            </div>
        </TiltCard>
    );
}
