'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL } from '@/libs/api';
import { getRaceDrivers } from '@/libs/drivers';
import { Driver, Race } from '@/libs/types';

type Scope = 'race' | 'onward';

type RewriteCounts = { predictions: number; results: number; scores: number };

type Preview = {
    plan: {
        race_identifier: string;
        scope: Scope;
        replaced_driver_name: string;
        new_driver_name: string;
        new_driver_number: number;
        new_driver_code: string;
        new_driver_team: string;
        affectedRaces: string[];
    };
    will_rewrite: RewriteCounts;
};

type LineupChangeRow = {
    id: number;
    race_identifier: string;
    scope: Scope;
    replaced_driver_name: string;
    new_driver_name: string;
    new_driver_number: number;
    predictions_rewritten: number;
    results_rewritten: number;
    scores_rewritten: number;
    created_at: string;
    reverted_at: string | null;
};

type Props = {
    races: Race[];
    /** Called after a change is applied or reverted so other forms can reload their lineup. */
    onChanged: () => void;
};

const inputStyle = {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--bg-elevated)',
};

export default function LineupManager({ races, onChanged }: Props) {
    const { getToken } = useAuth();
    const [raceId, setRaceId] = useState('');
    const [lineup, setLineup] = useState<Driver[]>([]);
    const [replaced, setReplaced] = useState('');
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [scope, setScope] = useState<Scope>('race');
    const [preview, setPreview] = useState<Preview | null>(null);
    const [changes, setChanges] = useState<LineupChangeRow[]>([]);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const api = useCallback(async (path: string, init?: RequestInit) => {
        const token = await getToken();
        const res = await fetch(`${API_URL}/superadmin/lineup${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Error: ${res.status}`);
        return data;
    }, [getToken]);

    const loadChanges = useCallback(async () => {
        try {
            setChanges(await api('/changes'));
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load history' });
        }
    }, [api]);

    const loadLineup = useCallback(async (id: string) => {
        setLineup([]);
        if (!id) return;
        try {
            setLineup(await getRaceDrivers(id));
        } catch {
            setMessage({ type: 'error', text: 'Failed to load the lineup for this race' });
        }
    }, []);

    useEffect(() => { loadChanges(); }, [loadChanges]);
    useEffect(() => { loadLineup(raceId); }, [raceId, loadLineup]);

    const resetForm = () => {
        setReplaced('');
        setNewName('');
        setNewNumber('');
        setPreview(null);
    };

    const body = () => ({
        race_id: raceId,
        scope,
        replaced_driver_name: replaced,
        new_driver_name: newName,
        new_driver_number: newNumber === '' ? NaN : Number(newNumber),
    });

    const handlePreview = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setPreview(null);
        setBusy(true);
        try {
            setPreview(await api('/preview', { method: 'POST', body: JSON.stringify(body()) }));
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Preview failed' });
        } finally {
            setBusy(false);
        }
    };

    const handleApply = async () => {
        if (!preview) return;
        setMessage(null);
        setBusy(true);
        try {
            // Apply exactly what was previewed
            await api('/changes', { method: 'POST', body: JSON.stringify({
                race_id: preview.plan.race_identifier,
                scope: preview.plan.scope,
                replaced_driver_name: preview.plan.replaced_driver_name,
                new_driver_name: preview.plan.new_driver_name,
                new_driver_number: preview.plan.new_driver_number,
                new_driver_code: preview.plan.new_driver_code,
                new_driver_team: preview.plan.new_driver_team,
            }) });
            const { predictions, results, scores } = preview.will_rewrite;
            setMessage({
                type: 'success',
                text: `${preview.plan.replaced_driver_name} replaced by ${preview.plan.new_driver_name}. ` +
                    `Updated ${predictions} predictions, ${results} results and ${scores} score fields.`,
            });
            resetForm();
            await Promise.all([loadChanges(), loadLineup(raceId)]);
            onChanged();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to apply change' });
        } finally {
            setBusy(false);
        }
    };

    const handleRevert = async (change: LineupChangeRow) => {
        if (!window.confirm(`Undo: ${change.replaced_driver_name} → ${change.new_driver_name} for ${change.race_identifier}?`)) return;
        setMessage(null);
        setBusy(true);
        try {
            await api(`/changes/${change.id}/revert`, { method: 'POST' });
            setMessage({ type: 'success', text: 'Change reverted.' });
            setPreview(null);
            await Promise.all([loadChanges(), loadLineup(raceId)]);
            onChanged();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to revert' });
        } finally {
            setBusy(false);
        }
    };

    const raceName = (id: string) => races.find(r => r.race_id === id)?.meeting_name ?? id;
    const latestActiveId = changes.find(c => !c.reverted_at)?.id;
    const formComplete = !!raceId && !!replaced && newName.trim() !== '' && newNumber !== '';

    return (
        <section className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--bg-elevated)' }}>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Driver changes
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Replace a driver with a stand-in or new signing. Their name is swapped in everyone&apos;s
                saved predictions, results and scores for the race, and the new driver appears in the
                prediction and results dropdowns. Points do not change.
            </p>

            <form onSubmit={handlePreview} className="flex flex-col gap-3">
                <select
                    value={raceId}
                    onChange={e => { setRaceId(e.target.value); setReplaced(''); setPreview(null); }}
                    className="w-full p-2 rounded-[var(--radius-sm)] text-sm"
                    style={inputStyle}
                    aria-label="Race"
                >
                    <option value="">Select race...</option>
                    {races.map(r => (
                        <option key={r.race_id} value={r.race_id}>{r.meeting_name} — {r.location}</option>
                    ))}
                </select>

                <select
                    value={replaced}
                    onChange={e => { setReplaced(e.target.value); setPreview(null); }}
                    className="w-full p-2 rounded-[var(--radius-sm)] text-sm"
                    style={inputStyle}
                    disabled={!raceId}
                    aria-label="Driver being replaced"
                >
                    <option value="">Driver being replaced...</option>
                    {[...lineup].sort((a, b) => a.full_name.localeCompare(b.full_name)).map(d => (
                        <option key={d.full_name} value={d.full_name}>#{d.number} {d.full_name} ({d.team})</option>
                    ))}
                </select>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => { setNewName(e.target.value); setPreview(null); }}
                        placeholder="New driver full name"
                        maxLength={100}
                        className="flex-1 p-2 rounded-[var(--radius-sm)] text-sm"
                        style={inputStyle}
                        aria-label="New driver full name"
                    />
                    <input
                        type="number"
                        min={0}
                        max={99}
                        value={newNumber}
                        onChange={e => { setNewNumber(e.target.value); setPreview(null); }}
                        placeholder="Car #"
                        className="sm:w-28 p-2 rounded-[var(--radius-sm)] text-sm"
                        style={inputStyle}
                        aria-label="New driver car number"
                    />
                </div>

                <fieldset className="flex flex-col gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <legend className="mb-1">Applies to</legend>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="scope" checked={scope === 'race'} onChange={() => { setScope('race'); setPreview(null); }} />
                        This race only (e.g. a sick driver and a stand-in)
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="scope" checked={scope === 'onward'} onChange={() => { setScope('onward'); setPreview(null); }} />
                        This race and all later races (permanent swap)
                    </label>
                </fieldset>

                <button type="submit" disabled={busy || !formComplete} className="btn btn-primary w-full">
                    {busy && !preview ? 'Checking...' : 'Preview change'}
                </button>
            </form>

            {preview && (
                <div
                    className="mt-4 p-4 rounded-[var(--radius-md)] text-sm"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-elevated)', color: 'var(--text-secondary)' }}
                >
                    <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {preview.plan.replaced_driver_name} → {preview.plan.new_driver_name} (#{preview.plan.new_driver_number}, {preview.plan.new_driver_team})
                    </p>
                    <p>
                        {preview.plan.scope === 'race'
                            ? `For ${raceName(preview.plan.race_identifier)} only.`
                            : `From ${raceName(preview.plan.race_identifier)} onwards (${preview.plan.affectedRaces.length} races).`}
                    </p>
                    <p className="mt-1">
                        This will rename the driver in {preview.will_rewrite.predictions} saved predictions,{' '}
                        {preview.will_rewrite.results} results and {preview.will_rewrite.scores} score fields.
                    </p>
                    <div className="flex gap-3 mt-3">
                        <button type="button" onClick={handleApply} disabled={busy} className="btn btn-primary flex-1">
                            {busy ? 'Applying...' : 'Confirm and apply'}
                        </button>
                        <button type="button" onClick={() => setPreview(null)} disabled={busy} className="btn flex-1">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

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

            {changes.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>History</h3>
                    <ul className="flex flex-col gap-2">
                        {changes.map(c => (
                            <li
                                key={c.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-md)] text-sm"
                                style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--bg-elevated)',
                                    color: 'var(--text-secondary)',
                                    opacity: c.reverted_at ? 0.6 : 1,
                                }}
                            >
                                <span>
                                    <span style={{ color: 'var(--text-primary)' }}>
                                        {c.replaced_driver_name} → {c.new_driver_name}
                                    </span>
                                    {' '}· {raceName(c.race_identifier)}{c.scope === 'onward' ? ' onwards' : ''}
                                    {' '}· {c.predictions_rewritten} predictions
                                    {c.reverted_at ? ' · reverted' : ''}
                                </span>
                                {c.id === latestActiveId && (
                                    <button type="button" onClick={() => handleRevert(c)} disabled={busy} className="btn">
                                        Undo
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
