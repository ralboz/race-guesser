'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { DRIVERS_2026 } from '@/libs/consts';
import { Race } from '@/libs/types';
import { API_URL } from '@/libs/api';

const ADMIN_IDS = (process.env.NEXT_PUBLIC_ADMIN_IDS ?? '').split(',').map(s => s.trim());

const POSITIONS = ['pole', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'] as const;
const POSITION_LABELS: Record<string, string> = {
    pole: 'Pole Position',
    p1: 'P1', p2: 'P2', p3: 'P3', p4: 'P4', p5: 'P5',
    p6: 'P6', p7: 'P7', p8: 'P8', p9: 'P9', p10: 'P10', p11: 'P11',
};

type FormData = Record<typeof POSITIONS[number], string>;

const emptyForm = (): FormData =>
    Object.fromEntries(POSITIONS.map(p => [p, ''])) as FormData;

export default function AdminPage() {
    const { userId, getToken } = useAuth();
    const [races, setRaces] = useState<Race[]>([]);
    const [selectedRace, setSelectedRace] = useState('');
    const [formData, setFormData] = useState<FormData>(emptyForm());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [lastResult, setLastResult] = useState<{ race: string; results: FormData } | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/public/races?year=2026`)
            .then(r => r.json())
            .then((data: Race[]) => setRaces(data))
            .catch(() => {});
    }, []);

    if (!userId || !ADMIN_IDS.includes(userId)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p style={{ color: 'var(--text-secondary)' }}>Not authorized.</p>
            </div>
        );
    }

    const allDrivers = [...DRIVERS_2026].sort((a, b) => a.full_name.localeCompare(b.full_name));

    const getAvailableDrivers = (currentPos: string) =>
        allDrivers.filter(d => {
            if (currentPos === 'pole') return true;
            return !Object.entries(formData).some(
                ([key, val]) => key !== 'pole' && key !== currentPos && val === d.full_name
            );
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const missing = POSITIONS.find(p => !formData[p]);
        if (missing) {
            setMessage({ type: 'error', text: `Missing selection for ${POSITION_LABELS[missing]}` });
            return;
        }
        if (!selectedRace) {
            setMessage({ type: 'error', text: 'Please select a race' });
            return;
        }

        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/superadmin/calculate-points/${selectedRace}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || `Error: ${res.status}` });
            } else {
                const raceName = races.find(r => r.race_id === selectedRace)?.meeting_name ?? selectedRace;
                setLastResult({ race: raceName, results: { ...formData } });
                setMessage({
                    type: 'success',
                    text: `Done — ${data.predictions_scored} predictions scored, ${data.user_race_scores_updated} user totals updated.`,
                });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col max-w-2xl mx-auto p-4">
            <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
                Calculate Race Points
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                        Race
                    </label>
                    <select
                        value={selectedRace}
                        onChange={e => setSelectedRace(e.target.value)}
                        className="w-full p-2 rounded-[var(--radius-sm)] text-sm"
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--bg-elevated)',
                        }}
                    >
                        <option value="">Select race...</option>
                        {races.map(r => (
                            <option key={r.race_id} value={r.race_id}>
                                {r.meeting_name} — {r.location}
                            </option>
                        ))}
                    </select>
                </div>

                {POSITIONS.map(pos => (
                    <div key={pos} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-[var(--radius-md)]"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-elevated)' }}
                    >
                        <span className="text-sm font-semibold sm:min-w-[110px]" style={{ color: 'var(--text-primary)' }}>
                            {POSITION_LABELS[pos]}
                        </span>
                        <select
                            value={formData[pos]}
                            onChange={e => setFormData(prev => ({ ...prev, [pos]: e.target.value }))}
                            className="flex-1 p-2 rounded-[var(--radius-sm)] text-sm"
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--bg-elevated)',
                            }}
                        >
                            <option value="">Select driver...</option>
                            {getAvailableDrivers(pos).map(d => (
                                <option key={d.full_name} value={d.full_name}>
                                    #{d.number} {d.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full mt-2"
                >
                    {loading ? 'Calculating...' : 'Calculate Points'}
                </button>
            </form>

            {message && (
                <div
                    className="mt-4 p-3 rounded-[var(--radius-md)] text-sm font-medium"
                    style={{
                        backgroundColor: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                        color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                    }}
                >
                    {message.text}
                </div>
            )}

            {lastResult && message?.type === 'success' && (
                <div
                    className="mt-4 p-4 rounded-[var(--radius-md)] text-sm"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-elevated)' }}
                >
                    <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {lastResult.race} — Submitted Results
                    </p>
                    <div className="grid grid-cols-2 gap-1" style={{ color: 'var(--text-secondary)' }}>
                        {POSITIONS.map(pos => (
                            <div key={pos}>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {POSITION_LABELS[pos]}:
                                </span>{' '}
                                {lastResult.results[pos]}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
