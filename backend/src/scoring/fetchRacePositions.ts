import { driverNumToNameMap } from "../data";

type OpenF1SessionResultRow = {
  position: number;
  driver_number: number;
  session_key: number;
};

export interface RacePositionsResult {
  /** Map of position (1–11) → driver name */
  actualByPosition: Map<number, string>;
}

export interface RacePositionsError {
  status: number;
  error: string;
  missingMappings?: Array<{ position: number; driver_number: number }>;
}

// fetches top 11 race results from raceId/meetingkey and returns result with driver names
export async function fetchRacePositions(
  meetingKey: string
): Promise<{ ok: true; data: RacePositionsResult } | { ok: false; error: RacePositionsError }> {
  const sessionsRes = await fetch(
    `https://api.openf1.org/v1/sessions?meeting_key=${encodeURIComponent(meetingKey)}&session_name=Race`
  );
  if (!sessionsRes.ok) {
    throw new Error(`OpenF1 error ${sessionsRes.status} fetching race session`);
  }
  const sessions: { session_key: number }[] = await sessionsRes.json();
  const sessionKey = sessions[0]?.session_key;

  if (!sessionKey) {
    return { ok: false, error: { status: 500, error: "Unable to get session key from raceId provided" } };
  }

  // Fetch top-11 results
  const resultsRes = await fetch(
    `https://api.openf1.org/v1/session_result?session_key=${encodeURIComponent(sessionKey)}&position<=11`
  );
  if (!resultsRes.ok) {
    throw new Error(`OpenF1 error ${resultsRes.status} fetching session results`);
  }
  const results: OpenF1SessionResultRow[] = await resultsRes.json();

  // Map driver numbers to names, track missing mappings
  const actualByPosition = new Map<number, string>();
  const missingMappings: Array<{ position: number; driver_number: number }> = [];

  for (const r of results) {
    const name = driverNumToNameMap[r.driver_number];
    if (!name) {
      missingMappings.push({ position: r.position, driver_number: r.driver_number });
    } else {
      actualByPosition.set(r.position, name);
    }
  }

  if (missingMappings.length) {
    return {
      ok: false,
      error: {
        status: 400,
        error: "Static driver mapping missing numbers used in this session_result",
        missingMappings,
      },
    };
  }

  for (let p = 1; p <= 11; p++) {
    if (!actualByPosition.get(p)) {
      return {
        ok: false,
        error: {
          status: 400,
          error: `Missing actual driver for position ${p} (check OpenF1 data or static mapping)`,
        },
      };
    }
  }

  return { ok: true, data: { actualByPosition } };
}
