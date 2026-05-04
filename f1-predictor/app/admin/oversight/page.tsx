'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL } from '@/libs/api';

const ADMIN_IDS = (process.env.NEXT_PUBLIC_ADMIN_IDS ?? '').split(',').map(s => s.trim());

interface PlatformStats {
    total_users: number;
    total_groups: number;
    total_memberships: number;
    avg_group_size: number;
    max_group_size: number;
    users_with_predictions: number;
    total_prediction_rows: number;
    email_opt_ins: number;
}

interface RaceEngagement {
    race_id: string;
    meeting_name: string;
    country_name: string;
    date_start: string;
    has_results: boolean;
    unique_predictors: number;
    active_groups: number;
    avg_points: number | null;
    max_points: number | null;
    avg_exact_hits: number | null;
}

interface OversightData {
    year: number;
    platform: PlatformStats;
    races: RaceEngagement[];
}

export default function OversightPage() {
    const { userId, getToken } = useAuth();
    const [data, setData] = useState<OversightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [notifying, setNotifying] = useState<string | null>(null);
    const [notifyResult, setNotifyResult] = useState<{ raceId: string; type: 'success' | 'error'; text: string } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/superadmin/oversight?year=${year}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            setData(await res.json());
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [getToken, year]);

    const notifyAdmins = async (raceId: string) => {
        if (!confirm('Send race-week reminder to all group admins?')) return;
        setNotifying(raceId);
        setNotifyResult(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/superadmin/notify-admins/${raceId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
            setNotifyResult({ raceId, type: 'success', text: body.message });
        } catch (err: any) {
            setNotifyResult({ raceId, type: 'error', text: err.message || 'Failed to send' });
        } finally {
            setNotifying(null);
        }
    };

    useEffect(() => {
        if (userId && ADMIN_IDS.includes(userId)) fetchData();
    }, [userId, fetchData]);

    if (!userId || !ADMIN_IDS.includes(userId)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p style={{ color: 'var(--text-secondary)' }}>Not authorized.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p style={{ color: 'var(--text-secondary)' }}>Loading oversight data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <p style={{ color: 'var(--color-error)' }}>{error}</p>
                <button onClick={fetchData} className="btn btn-primary">Retry</button>
            </div>
        );
    }

    if (!data) return null;

    const { platform, races } = data;
    const racesWithPredictions = races.filter(r => r.unique_predictors > 0);
    const peakRace = racesWithPredictions.length
        ? racesWithPredictions.reduce((a, b) => a.unique_predictors > b.unique_predictors ? a : b)
        : null;

    return (
        <div className="flex flex-col max-w-5xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Platform Oversight
                </h1>
                <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="p-2 rounded-[var(--radius-sm)] text-sm"
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--bg-elevated)',
                    }}
                >
                    {[2026, 2025].map(y => (
                        <option key={y} value={y}>{y} Season</option>
                    ))}
                </select>
            </div>

            <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
            >
                {[
                    { label: 'Total Users', value: platform.total_users },
                    { label: 'Active Predictors', value: platform.users_with_predictions },
                    { label: 'Groups', value: platform.total_groups },
                    { label: 'Memberships', value: platform.total_memberships },
                    { label: 'Avg Group Size', value: platform.avg_group_size },
                    { label: 'Largest Group', value: platform.max_group_size },
                    { label: 'Email Opt-ins', value: platform.email_opt_ins },
                    { label: 'Peak Race', value: peakRace ? peakRace.unique_predictors : '—', sub: peakRace?.meeting_name },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="p-4 rounded-[var(--radius-md)] flex flex-col"
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--bg-elevated)',
                        }}
                    >
                        <span className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                            {stat.label}
                        </span>
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {stat.value}
                        </span>
                        {stat.sub && (
                            <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</span>
                        )}
                    </div>
                ))}
            </div>

            {platform.total_memberships > 0 && (
                <div
                    className="p-4 rounded-[var(--radius-md)] mb-8 flex items-center gap-4"
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--bg-elevated)',
                    }}
                >
                    <div className="flex-1">
                        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Overall Prediction Rate
                        </span>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {platform.users_with_predictions} of {platform.total_users} registered users have submitted at least one prediction this season
                        </p>
                    </div>
                    <span className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                        {Math.round((platform.users_with_predictions / platform.total_users) * 100)}%
                    </span>
                </div>
            )}

            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Race-by-Race Engagement
            </h2>
            <div
                className="rounded-[var(--radius-md)] overflow-x-auto"
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--bg-elevated)',
                }}
            >
                <table className="w-full text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--bg-elevated)' }}>
                            {['Race', 'Date', 'Status', 'Predictors', 'Groups', 'Avg Pts', 'Best Pts', 'Avg Exact', ''].map(h => (
                                <th
                                    key={h}
                                    className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {races.map((race, i) => {
                            const isPast = new Date(race.date_start) < new Date();
                            return (
                                <tr
                                    key={race.race_id}
                                    style={{
                                        borderBottom: i < races.length - 1 ? '1px solid var(--bg-elevated)' : undefined,
                                        opacity: !isPast && !race.has_results ? 0.5 : 1,
                                    }}
                                >
                                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {race.meeting_name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {new Date(race.date_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="px-4 py-3">
                                        {race.has_results ? (
                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                                style={{ backgroundColor: 'var(--color-success-bg, rgba(34,197,94,0.1))', color: 'var(--color-success)' }}>
                                                Scored
                                            </span>
                                        ) : isPast ? (
                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                                style={{ backgroundColor: 'var(--color-warning-bg, rgba(234,179,8,0.1))', color: 'var(--color-warning)' }}>
                                                Pending
                                            </span>
                                        ) : (
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Upcoming</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium" style={{ color: race.unique_predictors > 0 ? 'var(--text-primary)' : undefined }}>
                                        {race.unique_predictors || '—'}
                                    </td>
                                    <td className="px-4 py-3">{race.active_groups || '—'}</td>
                                    <td className="px-4 py-3">{race.avg_points ?? '—'}</td>
                                    <td className="px-4 py-3">{race.max_points ?? '—'}</td>
                                    <td className="px-4 py-3">{race.avg_exact_hits ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {!race.has_results && (
                                            <button
                                                onClick={() => notifyAdmins(race.race_id)}
                                                disabled={notifying === race.race_id}
                                                className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)] font-medium whitespace-nowrap"
                                                style={{
                                                    backgroundColor: 'var(--color-accent-muted)',
                                                    color: 'var(--color-accent)',
                                                    opacity: notifying === race.race_id ? 0.6 : 1,
                                                }}
                                            >
                                                {notifying === race.race_id ? 'Sending...' : 'Notify Admins'}
                                            </button>
                                        )}
                                        {notifyResult?.raceId === race.race_id && (
                                            <span
                                                className="block text-xs mt-1"
                                                style={{ color: notifyResult.type === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}
                                            >
                                                {notifyResult.text}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
