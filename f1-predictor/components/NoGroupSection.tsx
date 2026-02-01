'use client';

import {useState} from "react";
import {createPortal} from "react-dom";
import { IoMdClose } from "react-icons/io";
import axios from 'axios';

const JoinGroupModal = ({ onClose }: { onClose: () => void }) => {
    const [groupCode, setGroupCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!groupCode.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post("http://localhost:3000/join-group", {
                groupCode,
                password
            });
            
            console.log('Successfully joined group:', response.data);
            // Handle success - maybe redirect or update state
            onClose();
        } catch (err: any) {
            console.error('Error joining group:', err);
            setError(err.response?.data?.message || 'Failed to join group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center mx-4">
            <div className="flex flex-col gap-6 h-fit items-center bg-[#252525] rounded-lg overflow-hidden max-w-[500px] w-full">
                <div className="flex flex-row justify-between items-center bg-[#202020] w-full px-2 py-1 h-16">
                    <p className="text-2xl ml-2">Join Group</p>
                    <IoMdClose className="cursor-pointer mr-3" onClick={onClose} />
                </div>
                <div className="flex flex-col gap-3 items-start w-full px-4">
                    {error && (
                        <div className="bg-red-600 text-white px-3 py-2 rounded-lg w-full text-center">
                            {error}
                        </div>
                    )}
                    <div className="flex flex-row gap-3">
                        <p className="text-lg w-28">Group Code</p>
                        <input
                            placeholder="23123"
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value)}
                            className="bg-[#4A4A4A] px-2 py-1 rounded-lg"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex flex-row gap-3">
                        <p className="text-lg w-28">Password</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-[#4A4A4A] px-2 py-1 rounded-lg"
                            disabled={loading}
                        />
                    </div>
                    <button 
                        className="h-12 px-6 bg-[#2C40BD] rounded-lg text-lg w-fit mx-auto my-6 disabled:opacity-50 disabled:cursor-not-allowed" 
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

const CreateGroupModal = ({ onClose }: { onClose: () => void }) => {
    const [groupName, setGroupName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!groupName.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post("http://localhost:3000/create-group", {
                groupName,
                password
            });
            
            console.log('Successfully created group:', response.data);
            // Handle success - maybe redirect or update state
            onClose();
        } catch (err: any) {
            console.error('Error creating group:', err);
            setError(err.response?.data?.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center mx-4">
            <div className="flex flex-col gap-6 h-fit items-center bg-[#252525] rounded-lg overflow-hidden max-w-[500px] w-full">
                <div className="flex flex-row justify-between items-center bg-[#202020] w-full px-2 py-1 h-16">
                    <p className="text-2xl ml-2">Create Group</p>
                    <IoMdClose className="cursor-pointer mr-3" onClick={onClose} />
                </div>
                <div className="flex flex-col gap-3 items-start w-full px-4">
                    {error && (
                        <div className="bg-red-600 text-white px-3 py-2 rounded-lg w-full text-center">
                            {error}
                        </div>
                    )}
                    <div className="flex flex-row gap-3">
                        <p className="text-lg w-28">Group Name</p>
                        <input
                            placeholder="The F1 Predictors"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="bg-[#4A4A4A] px-2 py-1 rounded-lg"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex flex-row gap-3">
                        <p className="text-lg w-28">Password</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-[#4A4A4A] px-2 py-1 rounded-lg"
                            disabled={loading}
                        />
                    </div>
                    <button 
                        className="h-12 px-6 bg-[#2C40BD] rounded-lg text-lg w-fit mx-auto my-6 disabled:opacity-50 disabled:cursor-not-allowed" 
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
    const [joinOpen, setJoinOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    return (
        
        <>
            <div className="flex flex-row gap-8 mt-10">
                <button className="w-64 h-14 text-xl rounded-lg bg-[#2C40BD]" onClick={() => setJoinOpen(true)}>Join Group</button>
                <button className="w-64 h-14 text-xl rounded-lg bg-[#2C40BD]" onClick={() => setCreateOpen(true)}>Create Group</button>
            </div>
            {joinOpen && createPortal(
                <JoinGroupModal onClose={() => setJoinOpen(false)} />,
                document.body
            )}
            {createOpen && createPortal(
                <CreateGroupModal onClose={() => setCreateOpen(false)} />,
                document.body
            )}
        </>
    )
}