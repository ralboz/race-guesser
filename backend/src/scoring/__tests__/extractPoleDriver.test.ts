import { describe, it, expect } from 'vitest';
import { extractPoleDriver } from '../extractPoleDriver';

describe('extractPoleDriver', () => {
  describe('returns correct driver name', () => {
    it('returns the mapped driver name when a position-1 row exists and driver_number is in the map', () => {
      const results = [
        { position: 1, driver_number: 1 },
        { position: 2, driver_number: 44 },
      ];
      const nameMap: Record<number, string> = { 1: 'Verstappen', 44: 'Hamilton' };
      expect(extractPoleDriver(results, nameMap)).toBe('Verstappen');
    });
  });

  describe('no position-1 row', () => {
    it('returns null when no row has position equal to 1', () => {
      const results = [
        { position: 2, driver_number: 44 },
        { position: 3, driver_number: 16 },
      ];
      const nameMap: Record<number, string> = { 44: 'Hamilton', 16: 'Leclerc' };
      expect(extractPoleDriver(results, nameMap)).toBeNull();
    });
  });

  describe('pole driver_number not in name map', () => {
    it('returns null when the pole row driver_number has no entry in the map', () => {
      const results = [{ position: 1, driver_number: 99 }];
      const nameMap: Record<number, string> = { 1: 'Verstappen' };
      expect(extractPoleDriver(results, nameMap)).toBeNull();
    });
  });

  describe('empty results array', () => {
    it('returns null when the results array is empty', () => {
      const nameMap: Record<number, string> = { 1: 'Verstappen' };
      expect(extractPoleDriver([], nameMap)).toBeNull();
    });
  });
});
