import { describe, it, expect, vi, afterEach, beforeEach, type Mock } from 'vitest';
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import { GroupProvider, useUserGroup } from '../GroupContext';

function mockedFetch(): Mock {
    return fetch as unknown as Mock;
}

const mockGetToken = vi.fn().mockResolvedValue('test-token');
const clerkAuthState: {
    isLoaded: boolean;
    isSignedIn: boolean;
    userId: string | null;
    getToken: () => Promise<string>;
} = {
    isLoaded: true,
    isSignedIn: true,
    userId: 'user-1',
    getToken: mockGetToken,
};

vi.mock('@clerk/nextjs', () => ({
    useAuth: () => clerkAuthState,
}));

function Probe() {
    const { hasGroup, isOwner, isLoading } = useUserGroup();
    return (
        <div>
            <span data-testid="has-group">{String(hasGroup)}</span>
            <span data-testid="is-owner">{String(isOwner)}</span>
            <span data-testid="is-loading">{String(isLoading)}</span>
        </div>
    );
}

function renderProbe() {
    return render(
        <GroupProvider>
            <Probe />
        </GroupProvider>
    );
}

describe('GroupContext', () => {
    beforeEach(() => {
        sessionStorage.clear();
        clerkAuthState.isLoaded = true;
        clerkAuthState.isSignedIn = true;
        clerkAuthState.userId = 'user-1';
        mockGetToken.mockResolvedValue('test-token');
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('resolves hasGroup=true for a member group payload', async () => {
        mockedFetch().mockResolvedValue({
            ok: true,
            json: async () => ({ group: { id: 1 }, isOwner: false }),
        });

        renderProbe();

        await waitFor(() => expect(screen.getByTestId('has-group').textContent).toBe('true'));
        expect(screen.getByTestId('is-owner').textContent).toBe('false');
        expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    it('resolves hasGroup=false for a null group payload', async () => {
        mockedFetch().mockResolvedValue({
            ok: true,
            json: async () => ({ group: null }),
        });

        renderProbe();

        await waitFor(() => expect(screen.getByTestId('has-group').textContent).toBe('false'));
    });

    it('reports hasGroup=false without fetching when signed out', async () => {
        clerkAuthState.isSignedIn = false;
        clerkAuthState.userId = null;

        renderProbe();

        await waitFor(() => expect(screen.getByTestId('has-group').textContent).toBe('false'));
        expect(mockedFetch()).not.toHaveBeenCalled();
    });

    it('seeds from sessionStorage cache before the network resolves', async () => {
        sessionStorage.setItem('gg:hasGroup:user-1', JSON.stringify({ hasGroup: true, isOwner: true }));
        let resolveFetch: (value: unknown) => void = () => {};
        mockedFetch().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

        renderProbe();

        // Seeded synchronously from cache — no need to wait for the network.
        expect(screen.getByTestId('has-group').textContent).toBe('true');
        expect(screen.getByTestId('is-owner').textContent).toBe('true');
        expect(screen.getByTestId('is-loading').textContent).toBe('false');

        await act(async () => {
            resolveFetch({ ok: true, json: async () => ({ group: { id: 1 }, isOwner: true }) });
        });
    });

    it('clears the cache when the signed-in user changes', async () => {
        sessionStorage.setItem('gg:hasGroup:user-1', JSON.stringify({ hasGroup: true, isOwner: false }));
        mockedFetch().mockResolvedValue({
            ok: true,
            json: async () => ({ group: null }),
        });

        const { rerender } = renderProbe();
        await waitFor(() => expect(screen.getByTestId('is-loading').textContent).toBe('false'));

        clerkAuthState.userId = 'user-2';
        rerender(
            <GroupProvider>
                <Probe />
            </GroupProvider>
        );

        expect(sessionStorage.getItem('gg:hasGroup:user-1')).toBeNull();
    });

    it('refresh() re-fetches and overwrites a stale cached value', async () => {
        sessionStorage.setItem('gg:hasGroup:user-1', JSON.stringify({ hasGroup: true, isOwner: false }));
        mockedFetch().mockResolvedValue({
            ok: true,
            json: async () => ({ group: null }),
        });

        function RefreshProbe() {
            const { hasGroup, refresh } = useUserGroup();
            return (
                <div>
                    <span data-testid="has-group">{String(hasGroup)}</span>
                    <button onClick={() => refresh()}>refresh</button>
                </div>
            );
        }

        render(
            <GroupProvider>
                <RefreshProbe />
            </GroupProvider>
        );

        // Starts from the (stale) cached value.
        expect(screen.getByTestId('has-group').textContent).toBe('true');

        await act(async () => {
            screen.getByText('refresh').click();
        });

        await waitFor(() => expect(screen.getByTestId('has-group').textContent).toBe('false'));
        expect(JSON.parse(sessionStorage.getItem('gg:hasGroup:user-1')!).hasGroup).toBe(false);
    });
});
