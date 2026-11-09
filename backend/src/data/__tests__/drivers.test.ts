import { describe, it, expect } from 'vitest';
import {
  DriverData,
  filterDriversForRace,
  getDriversForRace,
  isValidDriverForRace,
} from '../drivers';

const names = (drivers: DriverData[]) => drivers.map((d) => d.full_name);

describe('filterDriversForRace', () => {
  const order = ['r1', 'r2', 'r3', 'r4'];
  const base = { number: 1, code: 'XXX', team: 'T' };
  const drivers: DriverData[] = [
    { ...base, full_name: 'Full Season' },
    { ...base, full_name: 'Leaves After R2', last_race: 'r2' },
    { ...base, full_name: 'Joins At R3', first_race: 'r3' },
    { ...base, full_name: 'Only R2', first_race: 'r2', last_race: 'r2' },
  ];

  it('applies first_race / last_race inclusively', () => {
    expect(names(filterDriversForRace(drivers, order, 'r1'))).toEqual(['Full Season', 'Leaves After R2']);
    expect(names(filterDriversForRace(drivers, order, 'r2'))).toEqual(['Full Season', 'Leaves After R2', 'Only R2']);
    expect(names(filterDriversForRace(drivers, order, 'r3'))).toEqual(['Full Season', 'Joins At R3']);
    expect(names(filterDriversForRace(drivers, order, 'r4'))).toEqual(['Full Season', 'Joins At R3']);
  });

  it('returns nothing for an unknown race', () => {
    expect(filterDriversForRace(drivers, order, 'nope')).toEqual([]);
  });
});

describe('2026 Haas lineup', () => {
  it('keeps Ocon up to Mexico, with Hirakawa as the Mexico substitute', () => {
    expect(isValidDriverForRace('united-states-2026', 'Esteban Ocon')).toBe(true);
    expect(isValidDriverForRace('united-states-2026', 'Ryo Hirakawa')).toBe(false);
    expect(isValidDriverForRace('mexico-2026', 'Esteban Ocon')).toBe(true);
    expect(isValidDriverForRace('mexico-2026', 'Ryo Hirakawa')).toBe(true);
  });

  it('lists both Ocon and Camara for Sao Paulo (Ocon picks were treated as Camara)', () => {
    expect(isValidDriverForRace('sao-paulo-2026', 'Esteban Ocon')).toBe(true);
    expect(isValidDriverForRace('sao-paulo-2026', 'Rafael Camara')).toBe(true);
    expect(isValidDriverForRace('sao-paulo-2026', 'Ryo Hirakawa')).toBe(false);
  });

  it('swaps Ocon for Camara from Las Vegas onwards', () => {
    for (const race of ['las-vegas-2026', 'qatar-2026', 'abu-dhabi-2026']) {
      expect(isValidDriverForRace(race, 'Esteban Ocon')).toBe(false);
      expect(isValidDriverForRace(race, 'Ryo Hirakawa')).toBe(false);
      expect(isValidDriverForRace(race, 'Rafael Camara')).toBe(true);
      expect(isValidDriverForRace(race, 'Oliver Bearman')).toBe(true);
    }
    expect(isValidDriverForRace('mexico-2026', 'Rafael Camara')).toBe(false);
  });

  it('has 22 drivers on a normal grid (23 entries for Sao Paulo, where both names are listed)', () => {
    expect(getDriversForRace('australia-2026')).toHaveLength(22);
    expect(getDriversForRace('las-vegas-2026')).toHaveLength(22);
    expect(getDriversForRace('sao-paulo-2026')).toHaveLength(23);
  });

  it('trims input and rejects unknown names and races', () => {
    expect(isValidDriverForRace('las-vegas-2026', '  Max Verstappen ')).toBe(true);
    expect(isValidDriverForRace('las-vegas-2026', 'Nobody')).toBe(false);
    expect(getDriversForRace('unknown-2026')).toEqual([]);
  });
});
