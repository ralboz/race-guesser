import { getRaceById } from '../data/races';

export interface PredictionWindowInfo {
  openTime: Date;
  closeTime: Date;
  status: 'not_yet_open' | 'open' | 'closed';
}

// Computes the prediction open time based on close time which is midnight on monday of race week.
export function computeOpenTime(closeTime: Date): Date {
  const d = new Date(closeTime);
  const day = d.getUTCDay();
  //day 0 = Sunday -> 6 days to Monday, any other day of the week we can - 1
  const daysSinceMonday = day === 0 ? 6 : day - 1; 
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// returns prediction window status
export function computeStatus(
  now: Date,
  openTime: Date,
  closeTime: Date,
): 'not_yet_open' | 'open' | 'closed' {
  if (now.getTime() < openTime.getTime()) {
    return 'not_yet_open';
  }
  if (now.getTime() >= closeTime.getTime()) {
    return 'closed';
  }
  return 'open';
}

interface CacheEntry {
  closeTime: Date;
  fetchedAt: number;
}

const sessionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000 * 24; // 24 hours cache

// Fetches the prediction close time from the static race data's fp1_start for a given race id
export async function fetchCloseTime(raceId: string): Promise<Date> {
  const now = Date.now();
  const cached = sessionCache.get(raceId);

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.closeTime;
  }

  const race = getRaceById(raceId);

  if (!race) {
    throw new Error(`No race found for race_id "${raceId}"`);
  }

  const closeTime = new Date(race.fp1_start);

  sessionCache.set(raceId, { closeTime, fetchedAt: Date.now() });

  return closeTime;
}

// just used for testing
export function clearCache(): void {
  sessionCache.clear();
}

// returns prediction window object for a given race id
export async function getPredictionWindow(
  raceId: string,
  now?: Date,
): Promise<PredictionWindowInfo> {
  const closeTime = await fetchCloseTime(raceId);
  const openTime = computeOpenTime(closeTime);
  const status = computeStatus(now ?? new Date(), openTime, closeTime);
  return { openTime, closeTime, status };
}
