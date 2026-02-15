import { extractPoleDriver, SessionResultRow } from "./extractPoleDriver";
import { driverNumToNameMap } from "../data";

// fetches qualifier results from raceId/meetingkey and returns top qualifier with driver name
export async function fetchQualifyingPoleDriver(
  meetingKey: string
): Promise<string | null> {
  try {
    const sessionsUrl = `https://api.openf1.org/v1/sessions?meeting_key=${encodeURIComponent(meetingKey)}&session_name=Qualifying`;
    const sessionsRes = await fetch(sessionsUrl);
    if (!sessionsRes.ok) {
      throw new Error(`OpenF1 error ${sessionsRes.status} for ${sessionsUrl}`);
    }
    const sessions: { session_key: number }[] = await sessionsRes.json();

    if (!sessions.length) {
      console.warn(
        `[fetchQualifyingPoleDriver] No qualifying session found for meeting_key=${meetingKey}`
      );
      return null;
    }

    const qualifyingSessionKey = sessions[0].session_key;

    // Unfortunately needs sleep timeout to avoid hitting API rate limit
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const resultsUrl = `https://api.openf1.org/v1/session_result?session_key=${encodeURIComponent(qualifyingSessionKey)}`;
    const resultsRes = await fetch(resultsUrl);
    if (!resultsRes.ok) {
      throw new Error(`OpenF1 error ${resultsRes.status} for ${resultsUrl}`);
    }
    const results: SessionResultRow[] = await resultsRes.json();

    return extractPoleDriver(results, driverNumToNameMap);
  } catch (err) {
    console.error("[fetchQualifyingPoleDriver] Error fetching qualifying data:", err);
    return null;
  }
}
