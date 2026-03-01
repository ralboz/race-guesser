import { describe, it, expect } from 'vitest';
import { aggregateScores } from '../aggregateScores';

describe('aggregateScores', () => {
  describe('total_points sums all final_points', () => {
    it('returns total_points equal to the sum of all final_points', () => {
      const rows = [
        { final_points: 4, base_points: 2, unique_correct: true },
        { final_points: 1, base_points: 1, unique_correct: false },
        { final_points: 0, base_points: 0, unique_correct: false },
      ];
      const result = aggregateScores(rows);
      expect(result.total_points).toBe(5);
    });
  });

  describe('exact_hits counts rows with base_points === 2', () => {
    it('returns exact_hits equal to the count of rows where base_points is 2', () => {
      const rows = [
        { final_points: 2, base_points: 2, unique_correct: false },
        { final_points: 2, base_points: 2, unique_correct: false },
        { final_points: 1, base_points: 1, unique_correct: false },
      ];
      const result = aggregateScores(rows);
      expect(result.exact_hits).toBe(2);
    });
  });

  describe('near_hits counts rows with base_points === 1', () => {
    it('returns near_hits equal to the count of rows where base_points is 1', () => {
      const rows = [
        { final_points: 2, base_points: 2, unique_correct: false },
        { final_points: 1, base_points: 1, unique_correct: false },
        { final_points: 1, base_points: 1, unique_correct: false },
        { final_points: 0, base_points: 0, unique_correct: false },
      ];
      const result = aggregateScores(rows);
      expect(result.near_hits).toBe(2);
    });
  });

  describe('unique_correct_hits counts truthy unique_correct', () => {
    it('returns unique_correct_hits equal to the count of rows where unique_correct is truthy', () => {
      const rows = [
        { final_points: 4, base_points: 2, unique_correct: true },
        { final_points: 2, base_points: 2, unique_correct: false },
        { final_points: 2, base_points: 1, unique_correct: 1 },
      ];
      const result = aggregateScores(rows);
      expect(result.unique_correct_hits).toBe(2);
    });
  });

  describe('empty array returns all-zero AggregatedScore', () => {
    it('returns all fields as 0 when given an empty array', () => {
      const result = aggregateScores([]);
      expect(result).toEqual({
        total_points: 0,
        exact_hits: 0,
        near_hits: 0,
        unique_correct_hits: 0,
      });
    });

    it('returns the same zero result on repeated calls (idempotence)', () => {
      const first = aggregateScores([]);
      const second = aggregateScores([]);
      expect(first).toEqual(second);
    });
  });

  describe('unique_correct as 0 (falsy number) is not counted', () => {
    it('does not count unique_correct when it is the number 0', () => {
      const rows = [
        { final_points: 2, base_points: 2, unique_correct: 0 },
        { final_points: 1, base_points: 1, unique_correct: 0 },
      ];
      const result = aggregateScores(rows);
      expect(result.unique_correct_hits).toBe(0);
    });
  });

  describe('unique-guess doubling scenarios', () => {
    it('rows with unique_correct truthy have final_points = base_points * 2', () => {
      const rows = [
        { final_points: 4, base_points: 2, unique_correct: true },
        { final_points: 2, base_points: 1, unique_correct: 1 },
      ];
      for (const r of rows) {
        expect(r.final_points).toBe(r.base_points * 2);
      }
      const result = aggregateScores(rows);
      expect(result.total_points).toBe(6);
    });

    it('non-unique rows have final_points = base_points', () => {
      const rows = [
        { final_points: 2, base_points: 2, unique_correct: false },
        { final_points: 1, base_points: 1, unique_correct: 0 },
      ];
      for (const r of rows) {
        expect(r.final_points).toBe(r.base_points);
      }
      const result = aggregateScores(rows);
      expect(result.total_points).toBe(3);
    });

    it('mixed unique/non-unique rows produce correct total_points', () => {
      const rows = [
        { final_points: 4, base_points: 2, unique_correct: true },
        { final_points: 1, base_points: 1, unique_correct: false },
        { final_points: 2, base_points: 1, unique_correct: 1 },
        { final_points: 0, base_points: 0, unique_correct: false },
      ];
      const result = aggregateScores(rows);
      expect(result.total_points).toBe(4 + 1 + 2 + 0);
    });

    it('all-unique rows produce total_points = 2 * sum(base_points)', () => {
      const rows = [
        { final_points: 4, base_points: 2, unique_correct: true },
        { final_points: 2, base_points: 1, unique_correct: 1 },
        { final_points: 0, base_points: 0, unique_correct: true },
      ];
      const sumBase = rows.reduce((s, r) => s + r.base_points, 0);
      const result = aggregateScores(rows);
      expect(result.total_points).toBe(2 * sumBase);
    });

    it('no-unique rows produce total_points = sum(base_points)', () => {
      const rows = [
        { final_points: 2, base_points: 2, unique_correct: false },
        { final_points: 1, base_points: 1, unique_correct: 0 },
        { final_points: 0, base_points: 0, unique_correct: false },
      ];
      const sumBase = rows.reduce((s, r) => s + r.base_points, 0);
      const result = aggregateScores(rows);
      expect(result.total_points).toBe(sumBase);
    });
  });
});
