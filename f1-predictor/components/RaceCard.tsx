import Image from "next/image";
import Link from "next/link";

interface RaceCardProps {
    meeting_key: number
    meeting_name: string
    country_name: string
    country_flag: string
    circuit_short_name: string;
    circuit_image: string
    gmt_offset: string
    date_start: string
    date_end: string
    year: number
}

export function RaceCard({race}: {race: RaceCardProps}) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const dateStartFormatted = formatter.format(new Date(race.date_start));

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
                    src={race.country_flag}
                    alt={`${race.country_name} flag`}
                    width={120}
                    height={68}
                    className="w-[30px] h-[17px] object-cover"
                />
            </div>
            <Image
                src={race.circuit_image}
                alt={`${race.circuit_short_name} track`}
                width={250}
                height={188}
                className="object-cover"
            />
            <div className="flex flex-col items-center gap-3">
                <p className="text-label">{dateStartFormatted}</p>
                <Link
                    href={`/race/${race.meeting_key}`}
                    className="btn btn-primary focus-ring"
                >
                    Go to event
                </Link>
            </div>
        </div>
    );
}
