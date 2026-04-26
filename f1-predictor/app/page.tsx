import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { FiUsers, FiTarget, FiAward, FiArrowRight } from "react-icons/fi";
import type { Metadata } from "next";
import { API_URL } from "@/libs/api";
import { Race } from "@/libs/types";
import { CircuitMap } from "@/components/CircuitMap";
import { getFlagUrl } from "@/libs/flags";
import { LocalDate } from "@/components/LocalDate";
import ScrollToTop from "@/components/ScrollToTop";
import TiltCard from "@/components/TiltCard";

export const metadata: Metadata = {
    title: {
        absolute: "Grid Guesser — Free F1 Prediction Game | Predict Formula 1 Race Results",
    },
    description:
        "Play Grid Guesser, the free Formula 1 prediction game. Predict the top 10 finishing positions, create private leagues with friends, earn points, and compete across the full F1 season.",
    alternates: {
        canonical: "https://gridguesser.com",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Grid Guesser",
    url: "https://gridguesser.com",
    description:
        "Free Formula 1 prediction game. Predict race results, compete in leagues with friends, and climb the season leaderboard.",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
    },
    genre: ["Sports", "Prediction Game", "Formula 1"],
};

export default async function Home() {
    const user = await currentUser();

    let stats: { groupCount: number; userCount: number } | null = null;
    try {
        const res = await fetch(`${API_URL}/public/stats`, { next: { revalidate: 300 } });
        if (res.ok) stats = await res.json();
    } catch (e) {
        console.error('Failed to fetch public stats:', e);
    }

    // Fetch next upcoming race
    let nextRace: Race | null = null;
    try {
        const res = await fetch(`${API_URL}/public/races?year=${new Date().getFullYear()}`, { next: { revalidate: 300 } });
        if (res.ok) {
            const races: Race[] = await res.json();
            const now = new Date();
            nextRace = races.find(r => new Date(r.date_start) > now) ?? null;
        }
    } catch (e) {
        console.error('Failed to fetch races:', e);
    }

    return (
        <div>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main>
                <section className="relative overflow-hidden" id="hero-section">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(59,91,219,0.15) 0%, transparent 70%)',
                        }}
                    />
                    <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
                        <p
                            className="text-sm font-semibold tracking-widest uppercase mb-4"
                            style={{ color: 'var(--color-accent)' }}
                        >
                            Free to play &middot; 2026 Season
                        </p>
                        <h1
                            className="text-4xl md:text-6xl font-bold leading-tight mb-5"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Predict the Grid.<br />
                            <span style={{ color: 'var(--color-accent)' }}>Beat Your Friends.</span>
                        </h1>
                        <p
                            className="text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Pick the top 10 for every Formula 1 race, create a league with your mates, and compete across the full season. No fantasy budget — just pure racing knowledge.
                        </p>

                        {user ? (
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                                    Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.firstName}</span>
                                </p>
                                <Link href="/groups" className="btn btn-primary text-lg px-8 py-3">
                                    Go to My Group
                                    <FiArrowRight className="ml-2 inline" />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link href="/sign-up?redirect_url=/groups" className="btn btn-primary text-lg px-8 py-3">
                                    Get Started — It&apos;s Free
                                </Link>
                                <Link href="/sign-in" className="btn btn-ghost text-lg px-6 py-3" style={{ color: 'var(--text-secondary)' }}>
                                    Already have an account?
                                </Link>
                            </div>
                        )}

                        
                        {stats && (stats.groupCount > 0 || stats.userCount > 0) && (
                            <div className="flex items-center justify-center gap-8 mt-10" id="stats">
                                <div className="text-center">
                                    <span className="block text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {stats.userCount}
                                    </span>
                                    <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                        {stats.userCount === 1 ? 'Player' : 'Players'}
                                    </span>
                                </div>
                                <div className="w-px h-10" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                                <div className="text-center">
                                    <span className="block text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {stats.groupCount}
                                    </span>
                                    <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                        {stats.groupCount === 1 ? 'League' : 'Leagues'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {nextRace && (
                    <section className="max-w-5xl mx-auto px-4 mb-16" id="next-race-spotlight">
                        <TiltCard
                            accentLine
                            className="relative p-6 md:p-8"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--bg-elevated)',
                            }}
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                <div className="shrink-0 opacity-80">
                                    <CircuitMap circuitId={nextRace.circuit_id} width={200} height={150} />
                                </div>

                                <div className="flex-1 text-center md:text-left" id="race-info">
                                    <p
                                        className="text-xs font-semibold tracking-widest uppercase mb-2"
                                        style={{ color: 'var(--color-accent)' }}
                                    >
                                        Next Race
                                    </p>
                                    <div className="flex items-center justify-center md:justify-start gap-2.5 mb-1">
                                        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {nextRace.meeting_name}
                                        </h2>
                                        <Image
                                            src={getFlagUrl(nextRace.country_code)}
                                            alt={`${nextRace.country_name} flag`}
                                            width={80}
                                            height={60}
                                            className="w-[32px] h-[20px] object-cover rounded-sm"
                                        />
                                    </div>
                                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        {nextRace.circuit_short_name} &middot; {nextRace.location}
                                    </p>
                                    <LocalDate iso={nextRace.fp1_start} className="text-sm text-[var(--text-muted)]" />
                                </div>

                                <div className="shrink-0">
                                    {user ? (
                                        <Link
                                            href={`/race/${nextRace.race_id}`}
                                            className="btn btn-primary px-6 py-3"
                                        >
                                            Make Prediction
                                            <FiArrowRight className="ml-2 inline" />
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/sign-up"
                                            className="btn btn-primary px-6 py-3"
                                        >
                                            Join &amp; Predict
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </TiltCard>
                    </section>
                )}

                <section className="max-w-5xl mx-auto px-4 mb-16" id="how-it-works">
                    <h2 className="text-h2 mb-8 text-center">How it works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                        {[
                            { icon: <FiUsers size={22} />, title: 'Create a League', desc: 'Set up a group and share the code with friends or colleagues.' },
                            { icon: <FiTarget size={22} />, title: 'Predict the Top 10', desc: 'Pick the finishing order for each race before the window closes.' },
                            { icon: <FiAward size={22} />, title: 'Win the Season', desc: 'Rack up points race by race. The leader at Abu Dhabi is champion.' },
                        ].map((step, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center text-center p-8"
                                style={{ backgroundColor: 'var(--bg-secondary)' }}
                            >
                                <div
                                    className="flex items-center justify-center w-11 h-11 mb-4 rounded-full"
                                    style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                                >
                                    {step.icon}
                                </div>
                                <h3 className="text-h4 mb-2">{step.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-4 mb-16" id="points-explained">
                    <h2 className="text-h2 mb-8 text-center">Scoring</h2>

                    <div
                        className="p-6 md:p-8"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--bg-elevated)',
                        }}
                    >
                        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                            <div>
                                <span className="inline-block w-3 h-3 rounded-full mb-2" style={{ backgroundColor: 'var(--color-success)' }} />
                                <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>2 pts</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Exact Match</p>
                            </div>
                            <div>
                                <span className="inline-block w-3 h-3 rounded-full mb-2" style={{ backgroundColor: 'var(--color-warning)' }} />
                                <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>1 pt</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>One Off</p>
                            </div>
                            <div>
                                <span className="inline-block w-3 h-3 rounded-full mb-2" style={{ backgroundColor: 'var(--color-error)' }} />
                                <p className="text-2xl font-bold" style={{ color: 'var(--color-error)' }}>0 pts</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Wrong</p>
                            </div>
                        </div>

                        <div className="h-px mb-6" style={{ backgroundColor: 'var(--bg-elevated)' }} />

                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Unique pick?</span>{' '}
                            If nobody else in your group picked the same driver for that position and you scored, your points are doubled.
                        </p>

                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Example:</span>{' '}
                            You predict 1: Verstappen | 2: Hamilton | 3: Alonso. The result is 1: Hamilton | 2: Antonelli | 3: Alonso.
                            You score 0 + 1 + 2 = 3 pts. If Alonso was unique, that becomes 0 + 1 + 4 = 5 pts.
                        </p>
                    </div>
                </section>

                <ScrollToTop />
            </main>
        </div>
    );
}
