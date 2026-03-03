'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { API_URL } from '@/libs/api';
import { GroupMember, GroupOwner } from '@/libs/types';
import { IoMdClose } from 'react-icons/io';
import { createPortal } from 'react-dom';

interface GroupAdminPanelProps {
    groupId: string;
    groupType: 'public' | 'private';
}

export function GroupAdminPanel({ groupId, groupType }: GroupAdminPanelProps) {
    const { getToken } = useAuth();
    const [owner, setOwner] = useState<GroupOwner | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [kickingUserId, setKickingUserId] = useState<string | null>(null);
    const [confirmingKickUserId, setConfirmingKickUserId] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const res = await axios.get(`${API_URL}/admin/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOwner(res.data.owner);
            setMembers(res.data.members);
            setError('');
        } catch {
            setError('Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const handleKick = async (userId: string) => {
        try {
            setKickingUserId(userId);
            const token = await getToken();
            await axios.delete(`${API_URL}/admin/members/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(prev => prev.filter(m => m.user_id !== userId));
        } catch {
            setError('Failed to remove member');
        } finally {
            setKickingUserId(null);
        }
    };

    return (
        <div
            className="mt-6 p-5"
            style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--text-muted)'
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-h3">Manage Group</h3>
                {groupType === 'private' && (
                    <button
                        className="btn btn-secondary text-sm"
                        onClick={() => setShowPasswordModal(true)}
                    >
                        Change Password
                    </button>
                )}
            </div>

            {error && (
                <div
                    className="px-4 py-3 text-sm font-medium mb-4"
                    style={{
                        backgroundColor: 'var(--color-error-bg)',
                        color: 'var(--color-error)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-error)',
                    }}
                >
                    {error}
                </div>
            )}

            {loading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading members...</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {owner && (
                        <div
                            className="flex items-center justify-between px-4 py-3"
                            style={{
                                backgroundColor: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <div>
                                <span style={{ color: 'var(--text-primary)' }}>{owner.display_name}</span>
                                <span className="ml-2 text-xs" style={{ color: 'var(--color-success)' }}>Owner</span>
                            </div>
                        </div>
                    )}

                    {members.map(member => (
                        <div
                            key={member.user_id}
                            className="flex items-center justify-between px-4 py-3"
                            style={{
                                backgroundColor: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <span style={{ color: 'var(--text-primary)' }}>{member.display_name}</span>
                            {confirmingKickUserId === member.user_id ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Are you sure?</span>
                                    <button
                                        className="text-sm px-3 py-1 transition-colors"
                                        style={{
                                            color: 'var(--color-error)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-error)',
                                            backgroundColor: 'transparent'
                                        }}
                                        onClick={() => {
                                            setConfirmingKickUserId(null);
                                            handleKick(member.user_id);
                                        }}
                                        disabled={kickingUserId === member.user_id}
                                    >
                                        {kickingUserId === member.user_id ? 'Removing...' : 'Confirm'}
                                    </button>
                                    <button
                                        className="text-sm px-3 py-1 transition-colors"
                                        style={{
                                            color: 'var(--text-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--text-muted)',
                                            backgroundColor: 'transparent'
                                        }}
                                        onClick={() => setConfirmingKickUserId(null)}
                                        disabled={kickingUserId === member.user_id}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="text-sm px-3 py-1 transition-colors"
                                    style={{
                                        color: 'var(--color-error)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-error)',
                                        backgroundColor: 'transparent'
                                    }}
                                    onClick={() => setConfirmingKickUserId(member.user_id)}
                                    disabled={kickingUserId === member.user_id}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    {members.length === 0 && (
                        <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>
                            No members yet — share your group code to invite people.
                        </p>
                    )}
                </div>
            )}

            {showPasswordModal && createPortal(
                <ChangePasswordModal
                    onClose={() => setShowPasswordModal(false)}
                />,
                document.body
            )}
        </div>
    );
}


function ChangePasswordModal({ onClose }: { onClose: () => void }) {
    const { getToken } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!newPassword.trim()) {
            setError('Please enter a new password');
            return;
        }
        if (newPassword.length < 3) {
            setError('Password must be at least 3 characters');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            await axios.patch(`${API_URL}/admin/password`, { newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(true);
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="flex flex-col w-full max-w-md mx-4 sm:mx-0 overflow-hidden shadow-2xl"
                style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                    <h2 className="text-h3">Change Group Password</h2>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-[44px] h-[44px] rounded-md transition-colors focus-ring"
                        style={{ color: 'var(--text-secondary)' }}
                        aria-label="Close modal"
                    >
                        <IoMdClose size={22} />
                    </button>
                </div>

                <div className="flex flex-col gap-4 p-5">
                    {error && (
                        <div
                            className="px-4 py-3 text-sm font-medium"
                            style={{
                                backgroundColor: 'var(--color-error-bg)',
                                color: 'var(--color-error)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-error)',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div
                            className="px-4 py-3 text-sm font-medium"
                            style={{
                                backgroundColor: 'var(--color-success-bg, rgba(34,197,94,0.1))',
                                color: 'var(--color-success)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-success)',
                            }}
                        >
                            Password updated successfully
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-label">New Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new group password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm transition-shadow outline-none focus-ring"
                                    style={{
                                        backgroundColor: 'var(--bg-surface)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--text-muted)',
                                    }}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                className="btn btn-primary w-full mt-2"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
