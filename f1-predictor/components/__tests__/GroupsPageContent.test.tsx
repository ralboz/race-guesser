import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GroupsPageContent } from '../GroupsPageContent';
import { Group, Race, PublicGroupInfo } from '@/libs/types';

vi.mock('@/components/CopyButton', () => ({
    CopyButton: ({ text }: { text: string }) => <span data-testid="copy-button">{text}</span>,
}));
vi.mock('@/components/NoGroupSection', () => ({
    NoGroupSection: () => <div data-testid="no-group-section" />,
}));
vi.mock('@/components/PublicGroupList', () => ({
    PublicGroupList: ({ isSignedIn }: { isSignedIn: boolean }) => (
        <div data-testid="public-group-list" data-signed-in={isSignedIn} />
    ),
}));
vi.mock('@/components/RaceList', () => ({
    RaceList: () => <div data-testid="race-list" />,
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

const mockGroup: Group = {
    id: 1234,
    groupName: 'Test Group',
    groupType: 'private',
    ownerId: 'user-1',
    groupId: '1234',
    isOwner: false,
    memberCount: 5,
};

const mockPublicGroups: PublicGroupInfo[] = [
    { id: 100, groupName: 'Open League', memberCount: 12 },
];

describe('GroupsPageContent', () => {
    afterEach(() => cleanup());
    // Public
    describe('when not signed in', () => {
        it('shows the public landing heading', () => {
            render(
                <GroupsPageContent
                    isSignedIn={false}
                    userGroup={null}
                    publicGroups={mockPublicGroups}
                    upcomingRaces={[mockRace]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByText('Predict F1 Results With Your Friends and Colleagues')).toBeInTheDocument();
        });

        it('shows sign-up CTAs linking to /sign-up', () => {
            render(
                <GroupsPageContent
                    isSignedIn={false}
                    userGroup={null}
                    publicGroups={mockPublicGroups}
                    upcomingRaces={[mockRace]}
                    pastRaces={[]}
                />
            );
            const joinLink = screen.getByRole('link', { name: 'Join a Group' });
            const createLink = screen.getByRole('link', { name: 'Create a Group' });
            expect(joinLink).toHaveAttribute('href', '/sign-up?redirect_url=/groups');
            expect(createLink).toHaveAttribute('href', '/sign-up?redirect_url=/groups');
        });

        it('renders PublicGroupList with isSignedIn=false', () => {
            render(
                <GroupsPageContent
                    isSignedIn={false}
                    userGroup={null}
                    publicGroups={mockPublicGroups}
                    upcomingRaces={[mockRace]}
                    pastRaces={[]}
                />
            );
            const list = screen.getByTestId('public-group-list');
            expect(list).toHaveAttribute('data-signed-in', 'false');
        });

        it('renders the race list', () => {
            render(
                <GroupsPageContent
                    isSignedIn={false}
                    userGroup={null}
                    publicGroups={[]}
                    upcomingRaces={[mockRace]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByTestId('race-list')).toBeInTheDocument();
        });

        it('does not show NoGroupSection', () => {
            render(
                <GroupsPageContent
                    isSignedIn={false}
                    userGroup={null}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.queryByTestId('no-group-section')).not.toBeInTheDocument();
        });
    });

    // Signed in not in group
    describe('when signed in without a group', () => {
        it('shows the no-group heading', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={null}
                    publicGroups={mockPublicGroups}
                    upcomingRaces={[mockRace]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByText(/You aren.t in a group yet/)).toBeInTheDocument();
        });

        it('renders NoGroupSection', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={null}
                    publicGroups={mockPublicGroups}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByTestId('no-group-section')).toBeInTheDocument();
        });

        it('renders PublicGroupList with isSignedIn=true', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={null}
                    publicGroups={mockPublicGroups}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            const list = screen.getByTestId('public-group-list');
            expect(list).toHaveAttribute('data-signed-in', 'true');
        });

        it('does not show sign-up CTAs', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={null}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.queryByRole('link', { name: 'Join a Group' })).not.toBeInTheDocument();
        });
    });

    // Signed in and in a group
    describe('when signed in with a group', () => {
        it('shows the group name as heading', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={mockGroup}
                    publicGroups={[]}
                    upcomingRaces={[mockRace]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByText('Test Group')).toBeInTheDocument();
        });

        it('shows the group ID', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={mockGroup}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByText('#1234')).toBeInTheDocument();
        });

        it('shows member count', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={mockGroup}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByText('5 members')).toBeInTheDocument();
        });

        it('shows singular "member" when count is 1', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={{ ...mockGroup, memberCount: 1 }}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByText('1 member')).toBeInTheDocument();
        });

        it('shows Manage Group link when user is owner', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={{ ...mockGroup, isOwner: true }}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByRole('link', { name: 'Manage Group' })).toHaveAttribute('href', '/groups/manage');
        });

        it('does not show Manage Group link when user is not owner', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={{ ...mockGroup, isOwner: false }}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.queryByRole('link', { name: 'Manage Group' })).not.toBeInTheDocument();
        });

        it('does not show NoGroupSection or sign-up CTAs', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={mockGroup}
                    publicGroups={[]}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.queryByTestId('no-group-section')).not.toBeInTheDocument();
            expect(screen.queryByRole('link', { name: 'Join a Group' })).not.toBeInTheDocument();
        });

        it('does not show PublicGroupList', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={mockGroup}
                    publicGroups={mockPublicGroups}
                    upcomingRaces={[]}
                    pastRaces={[]}
                />
            );
            expect(screen.queryByTestId('public-group-list')).not.toBeInTheDocument();
        });

        it('renders the race list', () => {
            render(
                <GroupsPageContent
                    isSignedIn={true}
                    userGroup={mockGroup}
                    publicGroups={[]}
                    upcomingRaces={[mockRace]}
                    pastRaces={[]}
                />
            );
            expect(screen.getByTestId('race-list')).toBeInTheDocument();
        });
    });
});
