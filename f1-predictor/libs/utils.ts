export function getScoreColor(basePoints: number): string {
  switch (basePoints) {
    case 2:
      return 'score-exact';
    case 1:
      return 'score-near';
    case 0:
      return 'score-wrong';
    default:
      return '';
  }
}
