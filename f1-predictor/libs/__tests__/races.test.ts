import { describe, it, expect } from 'vitest';
import { splitRacesByStatus } from '../races';
import { Race } from '@/libs/types';

function makeRace(overrides: Partial<Race>): Race {
    return {
        race_id: 'test-race',
        meeting_key: 1,
        meeting_name: 'Test Grand Prix',
        meeting_official_name: 'Test Grand Prix 2026',
        location: 'Testville',
        country_name: 'Testland',
        country_code: 'TL',
        circuit_short_name: 'Test',
        circuit_id: 'test',
        date_start: '2026-01-01',
        date_end: '2026-01-01',
        fp1_start: '2026-01-01T10:00:00Z',
        year: 2026,
        ...overrides,
    };
}

describe('splitRacesByStatus', () => {
    const now = new Date('2026-06-15T12:00:00Z');

    it('classifies a race that ended yesterday as past', () => {
        const race = makeRace({ date_end: '2026-06-14' });
        const { upcomingRaces, pastRaces } = splitRacesByStatus([race], now);
        expect(pastRaces).toHaveLength(1);
        expect(upcomingRaces).toHaveLength(0);
    });

    it('classifies a race ending today as still upcoming (end-of-day bump)', () => {
        const race = makeRace({ date_end: '2026-06-15' });
        const { upcomingRaces, pastRaces } = splitRacesByStatus([race], now);
        expect(upcomingRaces).toHaveLength(1);
        expect(pastRaces).toHaveLength(0);
    });

    it('classifies a race starting next month as upcoming', () => {
        const race = makeRace({ date_start: '2026-07-01', date_end: '2026-07-03' });
        const { upcomingRaces, pastRaces } = splitRacesByStatus([race], now);
        expect(upcomingRaces).toHaveLength(1);
        expect(pastRaces).toHaveLength(0);
    });

    it('correctly splits a mix of past and upcoming races', () => {
        const past = makeRace({ race_id: 'past', date_end: '2026-01-10' });
        const upcoming = makeRace({ race_id: 'upcoming', date_end: '2026-12-10' });
        const { upcomingRaces, pastRaces } = splitRacesByStatus([past, upcoming], now);
        expect(pastRaces.map(r => r.race_id)).toEqual(['past']);
        expect(upcomingRaces.map(r => r.race_id)).toEqual(['upcoming']);
    });
});
