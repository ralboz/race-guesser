export type PositionType =
  | 'pole'
  | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10';

// Pure function that scores a single prediction against the actual result.
export function scorePrediction(
  predictedDriverName: string,
  actualDriverName: string,
  positionType: PositionType,
  actualPositionByDriver: Map<string, number>
): number {
  if (positionType === 'pole') {
    return predictedDriverName === actualDriverName ? 2 : 0;
  }

  // p1–p10: extract slot number
  const slot = Number(positionType.slice(1));
  const actualPosOfPredicted = actualPositionByDriver.get(predictedDriverName);

  if (actualPosOfPredicted == null) return 0;

  const diff = Math.abs(actualPosOfPredicted - slot);
  return diff === 0 ? 2 : diff === 1 ? 1 : 0;
}
