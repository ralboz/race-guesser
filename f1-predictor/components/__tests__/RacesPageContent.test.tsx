import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RacesPageContent } from '../RacesPageContent';
import { Group, Race } from '@/libs/types';

vi.mock('@/components/CopyButton', () => ({
    CopyButton: ({ text }: { text: string }) => <span data-testid="copy-button">{text}</span>,
}));
vi.mock('@/components/RaceTabs', () => ({
    RaceTabs: () => <div data-testid="race-tabs" />,
}));
vi.mock('@/components/NotificationToggle', () => ({
    NotificationToggle: () => <div data-testid="notification-toggle" />,
}));
vi.mock('@/components/FeaturedRaces', () => ({
    FeaturedRaces: ({ nextRace, lastRace, nextRaceSubmitted }: { nextRace: Race | null; lastRace: Race | null; nextRaceSubmitted: boolean | null }) => (
        <div
            data-testid="featured-races"
            data-has-next={String(!!nextRace)}
            data-has-last={String(!!lastRace)}
            data-submitted={String(nextRaceSubmitted)}
        />
    ),
}));

const mockRace: Race = {
    race_id: 'bahrain-2026',
    meeting_key: 1,
    meeting_name: 'Bahrain Grand Prix',
    meeting_official_name: 'Bahrain Grand Prix 2026',
    location: 'Sakhir',
    country_name: 'Bahrain',
    country_code: 'BH',
    circuit_short_name: 'Sakhir',
    circuit_id: 'bahrain',
    date_start: '2026-03-15',
    date_end: '2026-03-17',
    fp1_start: '2026-03-15T10:00:00Z',
    year: 2026,
};

const ownerGroup: Group = {
    id: 1234,
    groupName: 'Test Group',
    groupType: 'private',
    ownerId: 'user-1',
    groupId: '1234',
    isOwner: true,
    memberCount: 1,
};

const memberGroup: Group = {
    ...ownerGroup,
    isOwner: false,
    memberCount: 5,
};

describe('RacesPageContent', () => {
    afterEach(() => cleanup());

    it('renders the group name, id, and member count', () => {
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[mockRace]} pastRaces={[]} />);
        expect(screen.getByText('Test Group')).toBeInTheDocument();
        expect(screen.getByText('#1234')).toBeInTheDocument();
        expect(screen.getByText('5 members')).toBeInTheDocument();
    });

    it('uses singular "member" label when memberCount is 1', () => {
        render(<RacesPageContent userGroup={ownerGroup} upcomingRaces={[mockRace]} pastRaces={[]} />);
        expect(screen.getByText('1 member')).toBeInTheDocument();
    });

    it('shows Manage Group link and no NotificationToggle for the owner', () => {
        render(<RacesPageContent userGroup={ownerGroup} upcomingRaces={[mockRace]} pastRaces={[]} />);
        expect(screen.getByRole('link', { name: 'Manage Group' })).toHaveAttribute('href', '/groups/manage');
        expect(screen.queryByTestId('notification-toggle')).not.toBeInTheDocument();
    });

    it('shows NotificationToggle and no Manage Group link for a non-owner member', () => {
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[mockRace]} pastRaces={[]} />);
        expect(screen.getByTestId('notification-toggle')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Manage Group' })).not.toBeInTheDocument();
    });

    it('renders the RaceTabs', () => {
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[mockRace]} pastRaces={[]} />);
        expect(screen.getByTestId('race-tabs')).toBeInTheDocument();
    });

    it('passes the next race and submitted status through to FeaturedRaces', () => {
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[mockRace]} pastRaces={[]} nextRaceSubmitted={true} />);
        const featured = screen.getByTestId('featured-races');
        expect(featured).toHaveAttribute('data-has-next', 'true');
        expect(featured).toHaveAttribute('data-submitted', 'true');
    });

    it('passes null nextRace to FeaturedRaces when there are no upcoming races', () => {
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[]} pastRaces={[]} />);
        expect(screen.getByTestId('featured-races')).toHaveAttribute('data-has-next', 'false');
    });

    it('passes the most recent past race to FeaturedRaces as lastRace', () => {
        const earlier: Race = { ...mockRace, race_id: 'earlier', date_end: '2026-01-10' };
        const later: Race = { ...mockRace, race_id: 'later', date_end: '2026-02-10' };
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[]} pastRaces={[earlier, later]} />);
        expect(screen.getByTestId('featured-races')).toHaveAttribute('data-has-last', 'true');
    });

    it('passes null lastRace to FeaturedRaces when there are no past races', () => {
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[mockRace]} pastRaces={[]} />);
        expect(screen.getByTestId('featured-races')).toHaveAttribute('data-has-last', 'false');
    });
});
