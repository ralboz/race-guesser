'use client';

import {useState} from "react";
import {createPortal} from "react-dom";
import { useRouter } from "next/navigation";
import { IoMdClose } from "react-icons/io";
import axios from 'axios';
import { useAuth } from "@clerk/nextjs";
import { API_URL } from "@/libs/api";

const JoinGroupModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const { getToken } = useAuth();
    const [groupId, setGroupId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!groupId.trim()) {
            setError('Please enter a group code');
            return;
        }

        if (showPassword && !password.trim()) {
            setError('Password is required for this group');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = await getToken();

            const response = await axios.post(`${API_URL}/protected/join-group`, {
                groupId,
                groupPassword: password || undefined
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Successfully joined group:', response.data);
            onClose();
            onSuccess();
        } catch (err: any) {
            console.error('Error joining group:', err);
            const message = err.response?.data?.message || 'Failed to join group';
            if (message === 'Password is required for private groups') {
                setShowPassword(true);
                setError('This is a private group — enter the password to join.');
            } else {
                setError(message);
            }
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
                    <h2 className="text-h3">Join Group</h2>
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

                    <div className="flex flex-col gap-1.5">
                        <label className="text-label">Group Code</label>
                        <input
                            placeholder="Enter group code"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
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

                    {showPassword && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-label">Password</label>
                            <input
                                type="password"
                                placeholder="Enter group password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm transition-shadow outline-none focus-ring"
                                style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--text-muted)',
                                }}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    )}

                    <button
                        className="btn btn-primary w-full mt-2"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Joining...' : 'Join Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateGroupModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const { getToken } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [groupType, setGroupType] = useState('private');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!groupName.trim()) {
            setError('Please enter a group name');
            return;
        }

        if (groupType === 'private' && !password.trim()) {
            setError('Password is required for private groups');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = await getToken();

            const response = await axios.post(`${API_URL}/protected/create-group`, {
                group_name: groupName,
                group_type: groupType,
                password: groupType === 'private' ? password : null
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Successfully created group:', response.data);
            onClose();
            onSuccess();
        } catch (err: any) {
            console.error('Error creating group:', err);
            setError(err.response?.data?.message || 'Failed to create group');
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
                    <h2 className="text-h3">Create Group</h2>
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

                    <div className="flex flex-col gap-1.5">
                        <label className="text-label">Group Name</label>
                        <input
                            placeholder="The F1 Predictors"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
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

                    <div className="flex flex-col gap-1.5">
                        <label className="text-label">Group Type</label>
                        <div className="flex gap-5 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                                <input
                                    type="radio"
                                    value="private"
                                    checked={groupType === 'private'}
                                    onChange={() => setGroupType('private')}
                                    className="w-4 h-4 accent-[var(--color-accent)] focus-ring"
                                    disabled={loading}
                                />
                                <span className="text-sm">Private</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                                <input
                                    type="radio"
                                    value="public"
                                    checked={groupType === 'public'}
                                    onChange={() => setGroupType('public')}
                                    className="w-4 h-4 accent-[var(--color-accent)] focus-ring"
                                    disabled={loading}
                                />
                                <span className="text-sm">Public</span>
                            </label>
                        </div>
                    </div>

                    {groupType === 'private' && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm transition-shadow outline-none focus-ring"
                                style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--text-muted)',
                                }}
                                disabled={loading}
                                placeholder="Enter password for private group"
                            />
                        </div>
                    )}

                    <button
                        className="btn btn-primary w-full mt-2"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const NoGroupSection = () => {
    const router = useRouter();
    const [joinOpen, setJoinOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button className="btn btn-primary text-lg px-8 py-3" onClick={() => setJoinOpen(true)}>
                    Join Group
                </button>
                <button className="btn btn-secondary text-lg px-8 py-3" onClick={() => setCreateOpen(true)}>
                    Create Group
                </button>
            </div>
            {joinOpen && createPortal(
                <JoinGroupModal onClose={() => setJoinOpen(false)} onSuccess={handleSuccess} />,
                document.body
            )}
            {createOpen && createPortal(
                <CreateGroupModal onClose={() => setCreateOpen(false)} onSuccess={handleSuccess} />,
                document.body
            )}
        </>
    );
};
