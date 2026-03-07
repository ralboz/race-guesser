'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { API_URL } from '@/libs/api';
import { PublicGroupInfo } from '@/libs/types';

export function PublicGroupList({ groups, isSignedIn }: { groups: PublicGroupInfo[]; isSignedIn: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (groups.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const amount = 240;
        scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div className="mt-10">
            <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-h2">Public Groups</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors focus-ring"
                            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                            aria-label="Scroll left"
                        >
                            <FiChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors focus-ring"
                            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                            aria-label="Scroll right"
                        >
                            <FiChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <p className="text-lg mt-2 opacity-80">Join one of the already great existing predictions groups!</p>
            </div>
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {groups.map((group) => (
                    <PublicGroupCard key={group.id} group={group} isSignedIn={isSignedIn} />
                ))}
            </div>
        </div>
    );
}

function PublicGroupCard({ group, isSignedIn }: { group: PublicGroupInfo; isSignedIn: boolean }) {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            await axios.post(`${API_URL}/protected/join-group`, {
                groupId: group.id,
                groupPassword: '',
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to join group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="flex flex-col justify-between p-4 gap-3 shrink-0"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                width: '240px',
            }}
        >
            <div>
                <h3 className="text-h3 truncate">{group.groupName}</h3>
                <p className="text-sm opacity-60 mt-1">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </p>
            </div>
            {error && (
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
            )}
            {isSignedIn ? (
                <button
                    className="btn btn-primary text-sm w-full"
                    onClick={handleJoin}
                    disabled={loading}
                >
                    {loading ? 'Joining...' : 'Join'}
                </button>
            ) : (
                <Link
                    href="/sign-up?redirect_url=/groups"
                    className="btn btn-primary text-sm w-full text-center"
                >
                    Sign up to join
                </Link>
            )}
        </div>
    );
}
