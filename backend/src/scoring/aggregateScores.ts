export interface ScoreRow {
  final_points: number;
  base_points: number;
  unique_correct: number | boolean;
}

export interface AggregatedScore {
  total_points: number;
  exact_hits: number;
  near_hits: number;
  unique_correct_hits: number;
}

/**
 * Pure function that aggregates an array of score rows into totals.
 *
 * - total_points: sum of all final_points
 * - exact_hits: count of rows where base_points === 2 (includes pole exact matches)
 * - near_hits: count of rows where base_points === 1 (pole never produces 1, so excluded automatically)
 * - unique_correct_hits: count of rows where unique_correct is truthy (1 or true)
 */
export function aggregateScores(rows: ScoreRow[]): AggregatedScore {
  let total_points = 0;
  let exact_hits = 0;
  let near_hits = 0;
  let unique_correct_hits = 0;

  for (const r of rows) {
    total_points += r.final_points;
    if (r.base_points === 2) exact_hits += 1;
    if (r.base_points === 1) near_hits += 1;
    if (r.unique_correct) unique_correct_hits += 1;
  }

  return { total_points, exact_hits, near_hits, unique_correct_hits };
}
