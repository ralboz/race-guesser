import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { RaceTabs } from '../RaceTabs';
import { Race } from '@/libs/types';

vi.mock('@/components/RaceGrid', () => ({
    RaceGrid: ({ races }: { races: Race[] }) => (
        <div data-testid="race-grid">{races.map((r) => r.race_id).join(',')}</div>
    ),
}));

function makeRace(overrides: Partial<Race> = {}): Race {
    return {
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
        ...overrides,
    };
}

describe('RaceTabs', () => {
    afterEach(() => cleanup());

    it('defaults to the Upcoming tab', () => {
        const upcoming = [makeRace({ race_id: 'up-1' })];
        const past = [makeRace({ race_id: 'past-1' })];
        render(<RaceTabs upcomingRaces={upcoming} pastRaces={past} />);

        expect(screen.getByRole('tab', { name: 'Upcoming' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: 'Past' })).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByTestId('race-grid')).toHaveTextContent('up-1');
    });

    it('switches to Past tab on click and hides upcoming', () => {
        const upcoming = [makeRace({ race_id: 'up-1' })];
        const past = [makeRace({ race_id: 'past-1' })];
        render(<RaceTabs upcomingRaces={upcoming} pastRaces={past} />);

        fireEvent.click(screen.getByRole('tab', { name: 'Past' }));

        expect(screen.getByRole('tab', { name: 'Past' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('race-grid')).toHaveTextContent('past-1');
        expect(screen.queryByText('up-1')).not.toBeInTheDocument();
    });

    it('switches tabs via keyboard (Enter)', () => {
        const upcoming = [makeRace({ race_id: 'up-1' })];
        const past = [makeRace({ race_id: 'past-1' })];
        render(<RaceTabs upcomingRaces={upcoming} pastRaces={past} />);

        fireEvent.keyDown(screen.getByRole('tab', { name: 'Past' }), { key: 'Enter' });

        expect(screen.getByTestId('race-grid')).toHaveTextContent('past-1');
    });

    it('shows an empty-state message when the active tab has no races', () => {
        render(<RaceTabs upcomingRaces={[]} pastRaces={[]} />);
        expect(screen.getByText('No upcoming races scheduled.')).toBeInTheDocument();
    });

    it('shows an empty-state message for past when switched with no past races', () => {
        render(<RaceTabs upcomingRaces={[makeRace()]} pastRaces={[]} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
        expect(screen.getByText('No past races yet.')).toBeInTheDocument();
    });

    it('renders past races in reverse order (most recent first)', () => {
        const past = [
            makeRace({ race_id: 'past-1' }),
            makeRace({ race_id: 'past-2' }),
            makeRace({ race_id: 'past-3' }),
        ];
        render(<RaceTabs upcomingRaces={[]} pastRaces={past} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
        expect(screen.getByTestId('race-grid')).toHaveTextContent('past-3,past-2,past-1');
    });

    it('does not mutate the pastRaces array passed in', () => {
        const past = [makeRace({ race_id: 'past-1' }), makeRace({ race_id: 'past-2' })];
        render(<RaceTabs upcomingRaces={[]} pastRaces={past} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
        expect(past.map((r) => r.race_id)).toEqual(['past-1', 'past-2']);
    });
});
