import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { FiUsers, FiTarget, FiAward, FiCheckCircle, FiTrendingUp, FiZap } from "react-icons/fi";

export default async function Home() {
    const user = await currentUser();

    return (
        <div>
            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <section className="text-center py-12 md:py-20" id='hero-section'>
                    <h1 className="text-h1 mb-4">
                        Welcome to Grid Guesser
                    </h1>
                    <p className="text-body max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
                        Predict the F1 grid, compete with friends, and prove you know the sport better than anyone.
                    </p>

                    {user ? (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-h3" style={{ color: 'var(--text-secondary)' }}>
                                Welcome back, {user.firstName}!
                            </p>
                            <Link href="/groups" className="btn btn-primary text-lg">
                                Go to My Group
                            </Link>
                        </div>
                    ) : (
                        <Link href="/sign-in" className="btn btn-primary text-lg">
                            Get Started
                        </Link>
                    )}
                </section>

                <section className="mb-12" id="how-it-works">
                    <h2 className="text-h2 mb-6 text-center">How it works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 text-center" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full" style={{ background: 'var(--color-accent-muted)' }}>
                                <FiUsers size={24} style={{ color: 'var(--color-accent)' }} />
                            </div>
                            <h3 className="text-h3 mb-2">Create a League</h3>
                            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                                Set up a prediction league and share your group code with your friends or colleagues.
                            </p>
                        </div>

                        <div className="p-6 text-center" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full" style={{ background: 'var(--color-accent-muted)' }}>
                                <FiTarget size={24} style={{ color: 'var(--color-accent)' }} />
                            </div>
                            <h3 className="text-h3 mb-2">Make Predictions</h3>
                            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                                Predict the top 10 finishing positions for each race before the prediction window closes.
                            </p>
                        </div>

                        <div className="p-6 text-center" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full" style={{ background: 'var(--color-accent-muted)' }}>
                                <FiAward size={24} style={{ color: 'var(--color-accent)' }} />
                            </div>
                            <h3 className="text-h3 mb-2">Compete over the full season</h3>
                            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                                Rack up points across the season. The leader at Abu Dhabi is crowned champion!
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mb-12" id='points-explained'>
                    <h2 className="text-h2 mb-6 text-center">Points System</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full" style={{ background: 'var(--color-success-bg)' }}>
                                <FiCheckCircle size={24} style={{ color: 'var(--color-success)' }} />
                            </div>
                            <h3 className="text-h3 mb-1">Exact Match</h3>
                            <p className="text-h1 mb-1" style={{ color: 'var(--color-success)' }}>2 pts</p>
                            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                                Nail the exact finishing position.
                            </p>
                        </div>

                        <div className="p-6 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full" style={{ background: 'var(--color-warning-bg)' }}>
                                <FiTrendingUp size={24} style={{ color: 'var(--color-warning)' }} />
                            </div>
                            <h3 className="text-h3 mb-1">One Off</h3>
                            <p className="text-h1 mb-1" style={{ color: 'var(--color-warning)' }}>1 pt</p>
                            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                                Just one position away from the result.
                            </p>
                        </div>

                        <div className="p-6 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full" style={{ background: 'var(--color-error-bg)' }}>
                                <FiZap size={24} style={{ color: 'var(--color-error)' }} />
                            </div>
                            <h3 className="text-h3 mb-1">Wrong</h3>
                            <p className="text-h1 mb-1" style={{ color: 'var(--color-error)' }}>0 pts</p>
                            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                                More than one position off — no points.
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-5" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <p className="text-body" style={{ color: 'var(--text-primary)'}}>ALSO if your pick was unique you get double points! Doesn't matter if it was an exact guess or one off.</p>
                        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Points example:</strong> You predict 1: Verstappen | 2: Hamilton | 3: Alonso. The actual result is 1: Hamilton | 2: Antonelli | 3: Alonso. You score 0 for Verstappen, 1 for Hamilton (one off), and 2 for Alonso (exact) — that&apos;s 3 points! But say Alonso was also a unique guess you would have gotten 2x2=4 points for that prediction!
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
