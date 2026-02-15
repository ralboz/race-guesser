/**
 * Maps a base_points value to a Tailwind CSS background color class.
 *
 * @param basePoints - The score for a prediction position:
 *   2 = exact match (green), 1 = off by one (orange),
 *   0 = wrong (red)
 * @returns The corresponding Tailwind background color class, or empty string for unknown values
 */
export function getScoreColor(basePoints: number): string {
  switch (basePoints) {
    case 2:
      return 'bg-green-500';
    case 1:
      return 'bg-orange-500';
    case 0:
      return 'bg-red-500';
    default:
      return '';
  }
}
