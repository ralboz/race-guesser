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

// Fetches the prediction close time based on first practice session's date_start for a given meeting key
export async function fetchCloseTime(meetingKey: string): Promise<Date> {
  const now = Date.now();
  const cached = sessionCache.get(meetingKey);

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.closeTime;
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.openf1.org/v1/sessions?meeting_key=${encodeURIComponent(meetingKey)}`,
    );
  } catch (error) {
    throw new Error(
      `Failed to fetch sessions from OpenF1 API for meeting_key "${meetingKey}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `OpenF1 API returned status ${response.status} for meeting_key "${meetingKey}"`,
    );
  }

  const sessions: { date_start: string }[] = await response.json();

  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error(
      `No sessions available for meeting_key "${meetingKey}"`,
    );
  }

  const closeTime = new Date(sessions[0].date_start); // first session is closing time

  sessionCache.set(meetingKey, { closeTime, fetchedAt: Date.now() });

  return closeTime;
}

// just used for testing
export function clearCache(): void {
  sessionCache.clear();
}

// returns prediction window object for a given meetingkey/raceid
export async function getPredictionWindow(
  meetingKey: string,
  now?: Date,
): Promise<PredictionWindowInfo> {
  const closeTime = await fetchCloseTime(meetingKey);
  const openTime = computeOpenTime(closeTime);
  const status = computeStatus(now ?? new Date(), openTime, closeTime);
  return { openTime, closeTime, status };
}
