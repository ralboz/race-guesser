import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LastRaceCard } from '../LastRaceCard';
import { LeaderboardEntry, Race } from '@/libs/types';

vi.mock('next/image', () => ({
    __esModule: true,
    // eslint-disable-next-line @next/next/no-img-element
    default: (props: Record<string, unknown>) => <img alt={props.alt as string} {...props} />,
}));
vi.mock('@/components/CircuitMap', () => ({
    CircuitMap: () => <div data-testid="circuit-map" />,
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

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
    return {
        user_id: 'user-1',
        display_name: 'Alice',
        total_points: 18,
        exact_hits: 2,
        near_hits: 1,
        unique_correct_hits: 0,
        rank: 1,
        ...overrides,
    };
}

describe('LastRaceCard', () => {
    afterEach(() => cleanup());

    it('renders the top 3 podium entries with points', () => {
        const podium = [
            makeEntry({ user_id: 'u1', display_name: 'Alice', total_points: 18, rank: 1 }),
            makeEntry({ user_id: 'u2', display_name: 'Bob', total_points: 14, rank: 2 }),
            makeEntry({ user_id: 'u3', display_name: 'Carol', total_points: 12, rank: 3 }),
        ];
        render(<LastRaceCard race={mockRace} podium={podium} currentUserId="u4" yourScore={9} />);

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('18 pts')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Carol')).toBeInTheDocument();
    });

    it('shows your own score when provided', () => {
        const podium = [makeEntry()];
        render(<LastRaceCard race={mockRace} podium={podium} currentUserId="user-1" yourScore={18} />);
        expect(screen.getByText('18 pts', { selector: 'span.font-semibold' })).toBeInTheDocument();
        expect(screen.getByText(/You scored/)).toBeInTheDocument();
    });

    it('shows "No prediction submitted" when yourScore is null', () => {
        const podium = [makeEntry()];
        render(<LastRaceCard race={mockRace} podium={podium} currentUserId="someone-else" yourScore={null} />);
        expect(screen.getByText('No prediction submitted')).toBeInTheDocument();
    });

    it('renders fewer than 3 entries without padding when the group has fewer scored members', () => {
        const podium = [makeEntry({ user_id: 'u1', display_name: 'Alice', rank: 1 })];
        render(<LastRaceCard race={mockRace} podium={podium} currentUserId="u1" yourScore={18} />);
        expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('shows "Results pending" and no podium/score when podium is empty', () => {
        render(<LastRaceCard race={mockRace} podium={[]} currentUserId="u1" yourScore={null} />);
        expect(screen.getByText('Results pending')).toBeInTheDocument();
        expect(screen.queryByText('No prediction submitted')).not.toBeInTheDocument();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('links to the race detail page', () => {
        const podium = [makeEntry()];
        render(<LastRaceCard race={mockRace} podium={podium} currentUserId="user-1" yourScore={18} />);
        expect(screen.getByRole('link', { name: 'View race' })).toHaveAttribute('href', '/race/bahrain-2026');
    });
});
