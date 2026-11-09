import { readFileSync } from 'fs';
import { join } from 'path';
import { getRacesByYear, getRaceById } from './races';

/**
 * A driver entry in `drivers/<year>.json` (the season baseline).
 *
 * `first_race` / `last_race` are race_ids (inclusive, both optional) that
 * bound the races the driver is part of the prediction lineup for. Omit both
 * for a driver who is on the grid all season.
 *
 * Mid-season swaps and stand-ins do NOT need a JSON edit: an admin records
 * them from the admin page (stored as RaceLineupChanges and layered on top of
 * this baseline by applyLineupChanges).
 */
export interface DriverData {
  number: number;
  full_name: string;
  code: string;
  team: string;
  first_race?: string;
  last_race?: string;
}

/** A stored admin lineup change (subset of the RaceLineupChange model). */
export interface LineupChange {
  id: number;
  race_identifier: string;
  scope: 'race' | 'onward';
  replaced_driver_name: string;
  new_driver_name: string;
  new_driver_number: number;
  new_driver_code: string;
  new_driver_team: string;
}

const cache = new Map<number, DriverData[]>();

function loadYear(year: number): DriverData[] {
  if (cache.has(year)) return cache.get(year)!;

  try {
    const filePath = join(__dirname, 'drivers', `${year}.json`);
    const drivers: DriverData[] = JSON.parse(readFileSync(filePath, 'utf-8'));
    cache.set(year, drivers);
    return drivers;
  } catch {
    return [];
  }
}

/** Pure helper (exported for tests): baseline lineup for a race from a driver list. */
export function filterDriversForRace(
  drivers: DriverData[],
  raceOrder: string[],
  raceId: string,
): DriverData[] {
  const idx = raceOrder.indexOf(raceId);
  if (idx === -1) return [];

  const position = (id: string | undefined): number | null => {
    if (!id) return null;
    const i = raceOrder.indexOf(id);
    return i === -1 ? null : i;
  };

  return drivers.filter((d) => {
    const first = position(d.first_race);
    const last = position(d.last_race);
    if (first !== null && idx < first) return false;
    if (last !== null && idx > last) return false;
    return true;
  });
}

/**
 * Pure helper (exported for tests): layer admin changes on a baseline lineup.
 * Changes apply in id order, so a stand-in can itself be replaced later.
 * A change applies to a race when it is for that race ("race" scope) or for
 * that race or an earlier one ("onward" scope).
 */
export function applyLineupChanges(
  baseline: DriverData[],
  changes: LineupChange[],
  raceOrder: string[],
  raceId: string,
): DriverData[] {
  const idx = raceOrder.indexOf(raceId);
  if (idx === -1) return baseline;

  let lineup = [...baseline];
  const ordered = [...changes].sort((a, b) => a.id - b.id);

  for (const c of ordered) {
    const changeIdx = raceOrder.indexOf(c.race_identifier);
    if (changeIdx === -1) continue;
    const applies = c.scope === 'race' ? changeIdx === idx : idx >= changeIdx;
    if (!applies) continue;

    lineup = lineup.filter((d) => d.full_name !== c.replaced_driver_name);
    if (!lineup.some((d) => d.full_name === c.new_driver_name)) {
      lineup.push({
        number: c.new_driver_number,
        full_name: c.new_driver_name,
        code: c.new_driver_code,
        team: c.new_driver_team,
      });
    }
  }

  return lineup;
}

/** Races of the season in calendar order, for the year that contains raceId. */
export function getRaceOrder(raceId: string): { year: number; order: string[] } | null {
  const race = getRaceById(raceId);
  if (!race) return null;

  const order = [...getRacesByYear(race.year)]
    .sort((a, b) => a.date_start.localeCompare(b.date_start))
    .map((r) => r.race_id);
  return { year: race.year, order };
}

/** Every driver in the season baseline JSON, regardless of race. */
export function getSeasonDrivers(year: number): DriverData[] {
  return loadYear(year);
}

/** Baseline (JSON only) lineup for a race. Use lineupService for the effective lineup. */
export function getDriversForRace(raceId: string): DriverData[] {
  const info = getRaceOrder(raceId);
  if (!info) return [];
  return filterDriversForRace(loadYear(info.year), info.order, raceId);
}

export function isValidDriverForRace(raceId: string, driverName: string): boolean {
  const name = driverName.trim();
  return getDriversForRace(raceId).some((d) => d.full_name === name);
}
