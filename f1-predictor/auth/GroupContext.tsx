'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { API_URL } from '@/libs/api';

type GroupContextType = {
    // null means "not yet known" (still resolving for the first time this session)
    hasGroup: boolean | null;
    isOwner: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

const storageKey = (userId: string) => `gg:hasGroup:${userId}`;

type CachedGroupState = { hasGroup: boolean; isOwner: boolean };

function readCache(userId: string): CachedGroupState | null {
    try {
        const raw = sessionStorage.getItem(storageKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return { hasGroup: !!parsed.hasGroup, isOwner: !!parsed.isOwner };
    } catch {
        return null;
    }
}

function writeCache(userId: string, state: CachedGroupState) {
    try {
        sessionStorage.setItem(storageKey(userId), JSON.stringify(state));
    } catch {
        // sessionStorage unavailable (e.g. private browsing) — safe to ignore, it's only a cache
    }
}

function clearCache(userId: string) {
    try {
        sessionStorage.removeItem(storageKey(userId));
    } catch {
        // ignore
    }
}

export function GroupProvider({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn, userId, getToken } = useClerkAuth();
    const [hasGroup, setHasGroup] = useState<boolean | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const lastUserId = useRef<string | null>(null);

    const fetchGroup = useCallback(async (forUserId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/protected/group`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;

            const data = await res.json();
            const nextHasGroup = !!data.group;
            const nextIsOwner = !!data.isOwner;
            setHasGroup(nextHasGroup);
            setIsOwner(nextIsOwner);
            writeCache(forUserId, { hasGroup: nextHasGroup, isOwner: nextIsOwner });
        } catch {
            // Network/backend error — leave existing state as-is rather than guessing.
        } finally {
            setIsLoading(false);
        }
    }, [getToken]);

    const refresh = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        await fetchGroup(userId);
    }, [userId, fetchGroup]);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            if (lastUserId.current) clearCache(lastUserId.current);
            lastUserId.current = null;
            setHasGroup(false);
            setIsOwner(false);
            setIsLoading(false);
            return;
        }

        if (!userId || userId === lastUserId.current) return;

        // A different (or first) user has signed in — drop any stale cache from a
        // previous account, then seed from this user's cache before revalidating.
        if (lastUserId.current && lastUserId.current !== userId) {
            clearCache(lastUserId.current);
        }
        lastUserId.current = userId;

        const cached = readCache(userId);
        if (cached) {
            setHasGroup(cached.hasGroup);
            setIsOwner(cached.isOwner);
            setIsLoading(false);
        } else {
            setHasGroup(null);
            setIsOwner(false);
            setIsLoading(true);
        }

        fetchGroup(userId);
    }, [isLoaded, isSignedIn, userId, fetchGroup]);

    return (
        <GroupContext.Provider value={{ hasGroup, isOwner, isLoading, refresh }}>
            {children}
        </GroupContext.Provider>
    );
}

export function useUserGroup() {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error('useUserGroup must be used within a GroupProvider');
    }
    return context;
}
