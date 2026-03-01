import { describe, it, expect } from 'vitest';
import { scorePrediction } from '../scorePrediction';

describe('scorePrediction', () => {
  it('returns 2 for exact position match', () => {
    const m = new Map([['Verstappen', 1]]);
    expect(scorePrediction('Verstappen', 'Verstappen', 'p1', m)).toBe(2);
  });

  it('returns 1 for off-by-one', () => {
    const m = new Map([['Leclerc', 2]]);
    expect(scorePrediction('Leclerc', 'Verstappen', 'p3', m)).toBe(1);
  });

  it('returns 0 for off-by-two-or-more', () => {
    const m = new Map([['Norris', 5]]);
    expect(scorePrediction('Norris', 'Verstappen', 'p1', m)).toBe(0);
  });

  it('returns 0 when driver not in map', () => {
    expect(scorePrediction('Alonso', 'Verstappen', 'p1', new Map())).toBe(0);
  });

  it('returns 2 for pole match', () => {
    expect(scorePrediction('Verstappen', 'Verstappen', 'pole', new Map())).toBe(2);
  });

  it('returns 0 for pole mismatch', () => {
    expect(scorePrediction('Hamilton', 'Verstappen', 'pole', new Map())).toBe(0);
  });
});
