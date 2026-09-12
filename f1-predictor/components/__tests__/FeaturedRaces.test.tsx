import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FeaturedRaces } from '../FeaturedRaces';
import { LeaderboardEntry, Race } from '@/libs/types';

vi.mock('@/components/NextRaceCard', () => ({
    NextRaceCard: ({ race }: { race: Race }) => <div data-testid="next-race-card">{race.race_id}</div>,
}));
vi.mock('@/components/LastRaceCard', () => ({
    LastRaceCard: ({ race }: { race: Race }) => <div data-testid="last-race-card">{race.race_id}</div>,
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

describe('FeaturedRaces', () => {
    afterEach(() => cleanup());

    it('renders both cards when next and last races are present', () => {
        render(
            <FeaturedRaces
                nextRace={makeRace({ race_id: 'next' })}
                nextRaceSubmitted={true}
                lastRace={makeRace({ race_id: 'last' })}
                lastRacePodium={[]}
                currentUserId="u1"
                lastRaceYourScore={null}
            />
        );
        expect(screen.getByTestId('next-race-card')).toHaveTextContent('next');
        expect(screen.getByTestId('last-race-card')).toHaveTextContent('last');
    });

    it('renders only the NextRaceCard when there is no past race yet', () => {
        render(
            <FeaturedRaces
                nextRace={makeRace({ race_id: 'next' })}
                nextRaceSubmitted={false}
                lastRace={null}
                lastRacePodium={[]}
                currentUserId="u1"
                lastRaceYourScore={null}
            />
        );
        expect(screen.getByTestId('next-race-card')).toBeInTheDocument();
        expect(screen.queryByTestId('last-race-card')).not.toBeInTheDocument();
    });

    it('renders only the LastRaceCard when there is no upcoming race', () => {
        render(
            <FeaturedRaces
                nextRace={null}
                nextRaceSubmitted={null}
                lastRace={makeRace({ race_id: 'last' })}
                lastRacePodium={[] as LeaderboardEntry[]}
                currentUserId="u1"
                lastRaceYourScore={5}
            />
        );
        expect(screen.queryByTestId('next-race-card')).not.toBeInTheDocument();
        expect(screen.getByTestId('last-race-card')).toBeInTheDocument();
    });

    it('renders nothing when there is neither a next nor a last race', () => {
        const { container } = render(
            <FeaturedRaces
                nextRace={null}
                nextRaceSubmitted={null}
                lastRace={null}
                lastRacePodium={[]}
                currentUserId="u1"
                lastRaceYourScore={null}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });
});
