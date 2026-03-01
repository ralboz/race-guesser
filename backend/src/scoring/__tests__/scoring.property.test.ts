import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { scorePrediction } from '../scorePrediction';
import type { PositionType } from '../scorePrediction';
import { aggregateScores } from '../aggregateScores';
import type { ScoreRow } from '../aggregateScores';
import { extractPoleDriver } from '../extractPoleDriver';
import type { SessionResultRow } from '../extractPoleDriver';

//  Random data generators 

const arbPositionType: fc.Arbitrary<PositionType> = fc.constantFrom(
  'pole',
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10',
);

// Race positions only (no pole)
const arbSlotPositionType: fc.Arbitrary<PositionType> = fc.constantFrom(
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10',
);

const arbDriverName: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z0-9]+$/, { minLength: 1 });

const arbScoreRow: fc.Arbitrary<ScoreRow> = fc
  .record({
    base_points: fc.constantFrom(0, 1, 2),
    unique_correct: fc.boolean(),
  })
  .map(({ base_points, unique_correct }) => ({
    base_points,
    unique_correct,
    final_points: unique_correct ? base_points * 2 : base_points,
  }));

const arbSessionResultRow: fc.Arbitrary<SessionResultRow> = fc.record({
  position: fc.integer({ min: 1, max: 20 }),
  driver_number: fc.integer({ min: 1, max: 99 }),
});

// Sanity check: make sure our generators produce valid data 

describe('scoring property test setup', () => {
  it('arbitraries produce valid values', () => {
    fc.assert(
      fc.property(
        arbPositionType,
        arbSlotPositionType,
        arbDriverName,
        arbScoreRow,
        arbSessionResultRow,
        (posType, slotType, driverName, scoreRow, sessionRow) => {
          expect(
            ['pole', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
          ).toContain(posType);
          expect(slotType).not.toBe('pole');
          expect(driverName.length).toBeGreaterThan(0);
          expect(driverName).toMatch(/^[a-zA-Z0-9]+$/);
          expect([0, 1, 2]).toContain(scoreRow.base_points);
          expect(typeof scoreRow.unique_correct).toBe('boolean');
          const expectedFinal = scoreRow.unique_correct
            ? scoreRow.base_points * 2
            : scoreRow.base_points;
          expect(scoreRow.final_points).toBe(expectedFinal);
          expect(sessionRow.position).toBeGreaterThanOrEqual(1);
          expect(sessionRow.position).toBeLessThanOrEqual(20);
          expect(sessionRow.driver_number).toBeGreaterThanOrEqual(1);
          expect(sessionRow.driver_number).toBeLessThanOrEqual(99);
        },
      ),
    );
  });
});

// scorePrediction tests
describe('scorePrediction – position-based scoring', () => {
  // Scoring rules: exact position = 2pts, off-by-one = 1pt, anything else = 0
  it('awards points based on how close the prediction was to the actual finish', () => {
    fc.assert(
      fc.property(
        arbSlotPositionType,
        arbDriverName,
        arbDriverName,
        fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
        (positionType, predictedDriver, actualDriver, actualPosOrMissing) => {
          const slotNumber = Number(positionType.slice(1));

          const actualPositionByDriver = new Map<string, number>();
          if (actualPosOrMissing !== undefined) {
            actualPositionByDriver.set(predictedDriver, actualPosOrMissing);
          }

          const result = scorePrediction(
            predictedDriver,
            actualDriver,
            positionType,
            actualPositionByDriver,
          );

          if (actualPosOrMissing === undefined) {
            expect(result).toBe(0);
          } else {
            const diff = Math.abs(actualPosOrMissing - slotNumber);
            const expectedPoints = diff === 0 ? 2 : diff === 1 ? 1 : 0;
            expect(result).toBe(expectedPoints);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('scorePrediction – pole position scoring', () => {
  // Pole is simpler: you either nailed the name or you didn't
  it('gives 2 points for a correct pole pick, 0 otherwise', () => {
    fc.assert(
      fc.property(
        arbDriverName,
        arbDriverName,
        (driverA, driverB) => {
          const result = scorePrediction(driverA, driverB, 'pole', new Map());
          expect(result).toBe(driverA === driverB ? 2 : 0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('scorePrediction – output bounds', () => {
  // No matter what garbage we throw at it, the score should always be 0, 1, or 2
  it('never returns a value outside {0, 1, 2}', () => {
    fc.assert(
      fc.property(
        arbPositionType,
        arbDriverName,
        arbDriverName,
        fc.option(
          fc.array(
            fc.record({
              name: arbDriverName,
              position: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 0, maxLength: 10 },
          ),
          { nil: undefined },
        ),
        (positionType, predictedDriver, actualDriver, mapEntries) => {
          const actualPositionByDriver = new Map<string, number>();
          if (mapEntries !== undefined) {
            for (const entry of mapEntries) {
              actualPositionByDriver.set(entry.name, entry.position);
            }
          }

          const result = scorePrediction(
            predictedDriver,
            actualDriver,
            positionType,
            actualPositionByDriver,
          );

          expect([0, 1, 2]).toContain(result);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// aggregateScores tests
describe('aggregateScores – totals and hit counts', () => {
  // The aggregator just sums things up — make sure the math is right
  it('total_points matches the sum of final_points across all rows', () => {
    fc.assert(
      fc.property(
        fc.array(arbScoreRow),
        (rows) => {
          const result = aggregateScores(rows);

          expect(result.total_points).toBe(rows.reduce((s, r) => s + r.final_points, 0));
          expect(result.exact_hits).toBe(rows.filter((r) => r.base_points === 2).length);
          expect(result.near_hits).toBe(rows.filter((r) => r.base_points === 1).length);
          expect(result.unique_correct_hits).toBe(rows.filter((r) => r.unique_correct).length);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Every row falls into exactly one bucket: exact, near, or zero
  it('exact + near + zero hits always equals the total number of predictions', () => {
    fc.assert(
      fc.property(
        fc.array(arbScoreRow),
        (rows) => {
          const result = aggregateScores(rows);
          const zeroHits = rows.filter((r) => r.base_points === 0).length;
          expect(result.exact_hits + result.near_hits + zeroHits).toBe(rows.length);
          expect(result.unique_correct_hits).toBeLessThanOrEqual(rows.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Unique-correct rows get their base points doubled — verify the total reflects that
  it('correctly doubles base_points for unique-correct rows in the total', () => {
    fc.assert(
      fc.property(
        fc.array(arbScoreRow),
        (rows) => {
          const result = aggregateScores(rows);
          const expectedTotal = rows.reduce((sum, r) => {
            return sum + (r.unique_correct ? r.base_points * 2 : r.base_points);
          }, 0);
          expect(result.total_points).toBe(expectedTotal);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// extractPoleDriver
describe('extractPoleDriver – finding who got pole', () => {
  // Given qualifying results and a driver number to name map, we should get the
  // P1 driver's name back (or null if the data is incomplete)
  it('returns the pole sitter name when the data lines up, null otherwise', () => {
    fc.assert(
      fc.property(
        fc.array(arbSessionResultRow),
        fc.dictionary(
          fc.integer({ min: 1, max: 99 }).map(String),
          arbDriverName,
        ),
        (results, dictMap) => {
          const driverNumToNameMap: Record<number, string> = {};
          for (const [key, value] of Object.entries(dictMap)) {
            driverNumToNameMap[Number(key)] = value;
          }

          const actual = extractPoleDriver(results, driverNumToNameMap);
          const poleRow = results.find((r) => r.position === 1);

          if (!poleRow) {
            expect(actual).toBeNull();
          } else if (!(poleRow.driver_number in driverNumToNameMap)) {
            expect(actual).toBeNull();
          } else {
            expect(actual).toBe(driverNumToNameMap[poleRow.driver_number]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
