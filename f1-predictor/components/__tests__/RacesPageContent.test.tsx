import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RacesPageContent } from '../RacesPageContent';
import { Group, Race } from '@/libs/types';

vi.mock('@/components/CopyButton', () => ({
    CopyButton: ({ text }: { text: string }) => <span data-testid="copy-button">{text}</span>,
}));
vi.mock('@/components/RaceList', () => ({
    RaceList: () => <div data-testid="race-list" />,
}));
vi.mock('@/components/NotificationToggle', () => ({
    NotificationToggle: () => <div data-testid="notification-toggle" />,
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

    it('renders the RaceList', () => {
        render(<RacesPageContent userGroup={memberGroup} upcomingRaces={[mockRace]} pastRaces={[]} />);
        expect(screen.getByTestId('race-list')).toBeInTheDocument();
    });
});
