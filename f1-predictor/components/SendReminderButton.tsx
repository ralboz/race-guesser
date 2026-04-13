'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL } from '@/libs/api';

export function SendReminderButton({ raceId }: { raceId: string }) {
    const { getToken } = useAuth();
    const [sending, setSending] = useState(false);
    const [alreadySent, setAlreadySent] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [windowOpen, setWindowOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                const [statusRes, windowRes] = await Promise.all([
                    fetch(`${API_URL}/admin/reminder-status/${raceId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_URL}/protected/prediction-window/${raceId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                if (statusRes.ok) {
                    const data = await statusRes.json();
                    if (data.sent) setAlreadySent(true);
                }
                if (windowRes.ok) {
                    const data = await windowRes.json();
                    setWindowOpen(data.status === 'open');
                }
            } catch {
                // not an admin or failed — hide gracefully
            } finally {
                setLoading(false);
            }
        })();
    }, [getToken, raceId]);

    const handleSend = async () => {
        setSending(true);
        setResult(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/admin/send-reminder/${raceId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setAlreadySent(true);
            setResult(data.message);
        } catch {
            setResult('Failed to send');
        } finally {
            setSending(false);
        }
    };

    if (loading || !windowOpen) return null;

    return (
        <div className="flex flex-col items-center gap-1 w-full">
            <button
                className="text-xs px-3 py-1.5 transition-colors focus-ring"
                style={{
                    backgroundColor: alreadySent ? 'var(--bg-elevated)' : 'var(--color-accent)',
                    color: alreadySent ? 'var(--text-muted)' : '#fff',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: alreadySent || sending ? 'default' : 'pointer',
                    opacity: sending ? 0.7 : 1,
                }}
                onClick={handleSend}
                disabled={sending || alreadySent}
            >
                {sending ? 'Sending...' : alreadySent ? 'Reminder sent' : 'Email reminder'}
            </button>
            {result && (
                <span className="text-caption" style={{ color: 'var(--text-muted)' }}>{result}</span>
            )}
        </div>
    );
}
