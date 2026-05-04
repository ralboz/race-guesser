'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL } from '@/libs/api';
import { FiCheck, FiClock } from 'react-icons/fi';

interface MemberStatus {
    user_id: string;
    display_name: string;
    has_predicted: boolean;
    is_owner: boolean;
}

export default function MemberPredictionStatus({ raceId }: { raceId: string }) {
    const { getToken } = useAuth();
    const [members, setMembers] = useState<MemberStatus[] | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/admin/member-status/${raceId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return; // 403 means not owner, just hide
                const data = await res.json();
                setMembers(data.members);
            } catch {
            }
        })();
    }, [getToken, raceId]);

    if (!members) return null;

    const predicted = members.filter(m => m.has_predicted);
    const notYet = members.filter(m => !m.has_predicted);

    return (
        <div
            className="w-full"
            style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
            }}
        >
            <p className="text-label mb-2" style={{ color: 'var(--text-primary)' }}>
                Member Submissions
            </p>
            <div className="flex flex-col gap-1.5">
                {notYet.map(m => (
                    <div key={m.user_id} className="flex items-center justify-between py-1">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {m.display_name}
                            {m.is_owner && <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>(admin)</span>}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-warning)' }}>
                            <FiClock size={13} /> Waiting
                        </span>
                    </div>
                ))}
                {predicted.map(m => (
                    <div key={m.user_id} className="flex items-center justify-between py-1">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {m.display_name}
                            {m.is_owner && <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>(admin)</span>}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-success)' }}>
                            <FiCheck size={13} /> Submitted
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
