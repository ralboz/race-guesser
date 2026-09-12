import Image from "next/image";
import Link from "next/link";
import { FaTrophy, FaMedal, FaFlagCheckered } from "react-icons/fa";
import { CircuitMap } from "./CircuitMap";
import TiltCard from "./TiltCard";
import { getFlagUrl } from "@/libs/flags";
import { LeaderboardEntry, Race } from "@/libs/types";

interface LastRaceCardProps {
    race: Race;
    podium: LeaderboardEntry[];
    currentUserId: string;
    yourScore: number | null;
}

function PodiumIcon({ rank }: { rank: number }) {
    if (rank === 1) return <FaTrophy className="text-sm" style={{ color: 'var(--color-gold)' }} />;
    if (rank === 2) return <FaMedal className="text-sm" style={{ color: 'var(--color-silver)' }} />;
    return <FaMedal className="text-sm" style={{ color: 'var(--color-bronze)' }} />;
}

export function LastRaceCard({ race, podium, currentUserId, yourScore }: LastRaceCardProps) {
    const resultsPending = podium.length === 0;

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
                style={{ color: 'var(--text-muted)' }}
            >
                <FaFlagCheckered size={11} />
                Last Race
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

            {resultsPending ? (
                <p className="text-sm opacity-60 mb-3">Results pending</p>
            ) : (
                <div className="w-full mb-3">
                    <ul className="flex flex-col gap-1.5">
                        {podium.map((entry) => {
                            const isCurrentUser = entry.user_id === currentUserId;
                            return (
                                <li
                                    key={entry.user_id}
                                    className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm"
                                    style={{
                                        backgroundColor: isCurrentUser ? 'var(--color-accent-muted)' : 'var(--bg-surface)',
                                        fontWeight: isCurrentUser ? 600 : 400,
                                    }}
                                >
                                    <span className="flex items-center gap-2">
                                        <PodiumIcon rank={entry.rank} />
                                        {entry.display_name || entry.user_id}
                                    </span>
                                    <span>{entry.total_points} pts</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <div className="flex flex-col items-center gap-3">
                {!resultsPending && (
                    yourScore !== null ? (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            You scored <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{yourScore} pts</span>
                        </p>
                    ) : (
                        <p className="text-sm opacity-60">No prediction submitted</p>
                    )
                )}
                <Link
                    href={`/race/${race.race_id}`}
                    className="btn btn-secondary focus-ring"
                >
                    View race
                </Link>
            </div>
        </TiltCard>
    );
}
