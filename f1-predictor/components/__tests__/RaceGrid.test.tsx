import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RaceGrid } from '../RaceGrid';
import { Race } from '@/libs/types';

vi.mock('@/components/RaceCard', () => ({
    RaceCard: ({ race, hasGroup, showReminder }: { race: Race; hasGroup?: boolean; showReminder?: boolean }) => (
        <div data-testid="race-card" data-race-id={race.race_id} data-has-group={hasGroup} data-show-reminder={showReminder} />
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

describe('RaceGrid', () => {
    afterEach(() => cleanup());

    it('renders a RaceCard for each race', () => {
        const races = [makeRace({ race_id: 'a' }), makeRace({ race_id: 'b' })];
        render(<RaceGrid races={races} />);
        const cards = screen.getAllByTestId('race-card');
        expect(cards).toHaveLength(2);
    });

    it('renders nothing when races is empty', () => {
        render(<RaceGrid races={[]} />);
        expect(screen.queryAllByTestId('race-card')).toHaveLength(0);
    });

    it('passes hasGroup through to each RaceCard', () => {
        render(<RaceGrid races={[makeRace()]} hasGroup={false} />);
        expect(screen.getByTestId('race-card')).toHaveAttribute('data-has-group', 'false');
    });

    it('only shows the reminder on the first card when isOwner and reminderOnFirst are true', () => {
        const races = [makeRace({ race_id: 'a' }), makeRace({ race_id: 'b' })];
        render(<RaceGrid races={races} isOwner reminderOnFirst />);
        const cards = screen.getAllByTestId('race-card');
        expect(cards[0]).toHaveAttribute('data-show-reminder', 'true');
        expect(cards[1]).toHaveAttribute('data-show-reminder', 'false');
    });

    it('never shows the reminder when reminderOnFirst is false, even for owners', () => {
        render(<RaceGrid races={[makeRace()]} isOwner />);
        expect(screen.getByTestId('race-card')).toHaveAttribute('data-show-reminder', 'false');
    });

    it('never shows the reminder when isOwner is false, even with reminderOnFirst', () => {
        render(<RaceGrid races={[makeRace()]} reminderOnFirst />);
        expect(screen.getByTestId('race-card')).toHaveAttribute('data-show-reminder', 'false');
    });
});
