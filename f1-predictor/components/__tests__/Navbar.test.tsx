import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Navbar from '../Navbar';

const mockUseAuth = vi.fn();
const mockUseUserGroup = vi.fn();
const mockUsePathname = vi.fn();

vi.mock('@/auth/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));
vi.mock('@/auth/GroupContext', () => ({
    useUserGroup: () => mockUseUserGroup(),
}));
vi.mock('next/navigation', () => ({
    usePathname: () => mockUsePathname(),
}));

function setAuthState({ isLoggedIn = false, hasGroup = null as boolean | null, pathname = '/' } = {}) {
    mockUseAuth.mockReturnValue({ isLoggedIn, logout: vi.fn() });
    mockUseUserGroup.mockReturnValue({ hasGroup, isOwner: false, isLoading: hasGroup === null, refresh: vi.fn() });
    mockUsePathname.mockReturnValue(pathname);
}

describe('Navbar', () => {
    afterEach(() => cleanup());

    it('shows Groups (not Races) and no Leaderboard when signed out', () => {
        setAuthState({ isLoggedIn: false, hasGroup: false });
        render(<Navbar />);
        const groupsLinks = screen.getAllByRole('link', { name: 'Groups' });
        expect(groupsLinks.length).toBeGreaterThan(0);
        expect(groupsLinks[0]).toHaveAttribute('href', '/groups');
        expect(screen.queryByRole('link', { name: 'Races' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Leaderboard' })).not.toBeInTheDocument();
    });

    it('shows Groups and no Leaderboard when signed in without a group', () => {
        setAuthState({ isLoggedIn: true, hasGroup: false });
        render(<Navbar />);
        expect(screen.getAllByRole('link', { name: 'Groups' })[0]).toHaveAttribute('href', '/groups');
        expect(screen.queryByRole('link', { name: 'Races' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Leaderboard' })).not.toBeInTheDocument();
    });

    it('shows Races (not Groups) and Leaderboard for a signed-in member', () => {
        setAuthState({ isLoggedIn: true, hasGroup: true });
        render(<Navbar />);
        expect(screen.getAllByRole('link', { name: 'Races' })[0]).toHaveAttribute('href', '/races');
        expect(screen.queryByRole('link', { name: 'Groups' })).not.toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Leaderboard' })[0]).toHaveAttribute('href', '/leader-board');
    });

    it('shows neither Races nor Groups while membership is still resolving', () => {
        setAuthState({ isLoggedIn: true, hasGroup: null });
        render(<Navbar />);
        expect(screen.queryByRole('link', { name: 'Races' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Groups' })).not.toBeInTheDocument();
    });

    it('marks the Races link active when on /races', () => {
        setAuthState({ isLoggedIn: true, hasGroup: true, pathname: '/races' });
        render(<Navbar />);
        const racesLinks = screen.getAllByRole('link', { name: 'Races' });
        expect(racesLinks[0]).toHaveStyle({ color: 'var(--text-primary)' });
    });

    it('shows Login/Signup when signed out and Logout when signed in', () => {
        setAuthState({ isLoggedIn: false, hasGroup: false });
        render(<Navbar />);
        expect(screen.getAllByRole('link', { name: 'Login' }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('link', { name: 'Signup' }).length).toBeGreaterThan(0);

        cleanup();
        setAuthState({ isLoggedIn: true, hasGroup: true });
        render(<Navbar />);
        expect(screen.getAllByRole('button', { name: 'Logout' }).length).toBeGreaterThan(0);
    });
});
