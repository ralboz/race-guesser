/**
 * Lightweight row shape for qualifying session results.
 * Mirrors the relevant fields from the OpenF1 session_result response.
 */
export interface SessionResultRow {
  position: number;
  driver_number: number;
}

// gets pole position driver name from results array
export function extractPoleDriver(
  results: SessionResultRow[],
  driverNumToNameMap: Record<number, string>
): string | null {
  const poleRow = results.find((r) => r.position === 1);
  if (!poleRow) return null;

  const name = driverNumToNameMap[poleRow.driver_number];
  return name ?? null;
}
