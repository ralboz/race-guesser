import { readFileSync } from 'fs';
import { join } from 'path';

export interface RaceData {
  race_id: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  country_code: string;
  circuit_short_name: string;
  circuit_id: string;
  date_start: string;
  date_end: string;
  fp1_start: string;
  year: number;
}

// Cache loaded files in memory — they never change at runtime
const cache = new Map<number, RaceData[]>();

function loadYear(year: number): RaceData[] {
  if (cache.has(year)) return cache.get(year)!;

  try {
    const filePath = join(__dirname, 'races', `${year}.json`);
    const raw = readFileSync(filePath, 'utf-8');
    const races: RaceData[] = JSON.parse(raw);
    cache.set(year, races);
    return races;
  } catch {
    return [];
  }
}

export function getRacesByYear(year: number): RaceData[] {
  return loadYear(year);
}

export function getRaceById(raceId: string): RaceData | undefined {
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear, currentYear - 1, currentYear + 1]) {
    const races = loadYear(year);
    const race = races.find(r => r.race_id === raceId);
    if (race) return race;
  }
  return undefined;
}