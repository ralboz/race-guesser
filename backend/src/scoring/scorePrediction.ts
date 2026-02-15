export type PositionType =
  | 'pole'
  | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9' | 'p10';

export interface ScoreResult {
  base_points: number;
  is_exact: boolean;
}

// Pure function that scores a single prediction against the actual result.
export function scorePrediction(
  predictedDriverName: string,
  actualDriverName: string,
  positionType: PositionType,
  actualPositionByDriver: Map<string, number>
): ScoreResult {
  if (positionType === 'pole') {
    const match = predictedDriverName === actualDriverName;
    return { base_points: match ? 2 : 0, is_exact: match };
  }

  // p1–p10: extract slot number
  const slot = Number(positionType.slice(1));
  const actualPosOfPredicted = actualPositionByDriver.get(predictedDriverName);

  let basePoints = 0;
  if (actualPosOfPredicted != null) {
    const diff = Math.abs(actualPosOfPredicted - slot);
    basePoints = diff === 0 ? 2 : diff === 1 ? 1 : 0;
  }

  const isExact = basePoints === 2 && predictedDriverName === actualDriverName;
  return { base_points: basePoints, is_exact: isExact };
}
