import { describe, it, expect } from 'vitest';
import { DriverData, LineupChange, applyLineupChanges, getRaceOrder, getSeasonDrivers } from '../../data/drivers';
import {
  PlanContext,
  affectedRaces,
  deriveCode,
  planLineupChange,
} from '../lineupService';

const order = ['r1', 'r2', 'r3', 'r4'];
const d = (number: number, full_name: string, extra: Partial<DriverData> = {}): DriverData => ({
  number,
  full_name,
  code: full_name.slice(0, 3).toUpperCase(),
  team: 'Haas',
  ...extra,
});
const change = (id: number, over: Partial<LineupChange>): LineupChange => ({
  id,
  race_identifier: 'r2',
  scope: 'race',
  replaced_driver_name: 'Alice Smith',
  new_driver_name: 'Stand In',
  new_driver_number: 99,
  new_driver_code: 'STA',
  new_driver_team: 'Haas',
  ...over,
});
const names = (l: DriverData[]) => l.map((x) => x.full_name).sort();

describe('applyLineupChanges', () => {
  const baseline = [d(1, 'Alice Smith'), d(2, 'Bob Jones')];

  it('race scope only affects that race', () => {
    const c = [change(1, {})];
    expect(names(applyLineupChanges(baseline, c, order, 'r1'))).toEqual(['Alice Smith', 'Bob Jones']);
    expect(names(applyLineupChanges(baseline, c, order, 'r2'))).toEqual(['Bob Jones', 'Stand In']);
    expect(names(applyLineupChanges(baseline, c, order, 'r3'))).toEqual(['Alice Smith', 'Bob Jones']);
  });

  it('onward scope affects that race and every later one', () => {
    const c = [change(1, { scope: 'onward' })];
    expect(names(applyLineupChanges(baseline, c, order, 'r1'))).toEqual(['Alice Smith', 'Bob Jones']);
    expect(names(applyLineupChanges(baseline, c, order, 'r2'))).toEqual(['Bob Jones', 'Stand In']);
    expect(names(applyLineupChanges(baseline, c, order, 'r4'))).toEqual(['Bob Jones', 'Stand In']);
  });

  it('applies changes in id order so a stand-in can be replaced again', () => {
    const c = [
      change(2, { replaced_driver_name: 'Stand In', new_driver_name: 'Second Sub', new_driver_number: 98 }),
      change(1, {}),
    ];
    expect(names(applyLineupChanges(baseline, c, order, 'r2'))).toEqual(['Bob Jones', 'Second Sub']);
  });

  it('does not duplicate a replacement already in the baseline', () => {
    const base = [d(1, 'Alice Smith'), d(50, 'Stand In')];
    const result = applyLineupChanges(base, [change(1, {})], order, 'r2');
    expect(names(result)).toEqual(['Stand In']);
  });
});

describe('affectedRaces', () => {
  it('returns the race or the race and all later ones', () => {
    expect(affectedRaces(order, 'r2', 'race')).toEqual(['r2']);
    expect(affectedRaces(order, 'r2', 'onward')).toEqual(['r2', 'r3', 'r4']);
    expect(affectedRaces(order, 'nope', 'onward')).toEqual([]);
  });
});

describe('deriveCode', () => {
  it('uses the first three letters of the surname', () => {
    expect(deriveCode('Rafael Camara')).toBe('CAM');
    expect(deriveCode('Ryo Hirakawa')).toBe('HIR');
  });
});

describe('planLineupChange', () => {
  const ctx: PlanContext = {
    raceOrder: order,
    baseline: [d(1, 'Alice Smith', { team: 'Haas' }), d(2, 'Bob Jones', { team: 'Ferrari' })],
    activeChanges: [],
  };
  const valid = {
    race_id: 'r2',
    scope: 'race',
    replaced_driver_name: 'Alice Smith',
    new_driver_name: '  Tom   Tsunoda ',
    new_driver_number: 22,
  };

  it('accepts a valid change, normalising the name and defaulting code and team', () => {
    const result = planLineupChange(valid, ctx);
    expect(result).toEqual({
      ok: true,
      plan: {
        race_identifier: 'r2',
        scope: 'race',
        replaced_driver_name: 'Alice Smith',
        new_driver_name: 'Tom Tsunoda',
        new_driver_number: 22,
        new_driver_code: 'TSU',
        new_driver_team: 'Haas', // same seat as the replaced driver
        affectedRaces: ['r2'],
      },
    });
  });

  it('rejects bad input', () => {
    const bad = (over: Record<string, unknown>) => planLineupChange({ ...valid, ...over }, ctx);
    expect(bad({ race_id: 'nope' }).ok).toBe(false);
    expect(bad({ scope: 'forever' }).ok).toBe(false);
    expect(bad({ new_driver_name: 'X' }).ok).toBe(false);
    expect(bad({ new_driver_name: 'Robert\'); DROP TABLE' }).ok).toBe(false);
    expect(bad({ new_driver_name: 'alice smith' }).ok).toBe(false); // same as replaced
    expect(bad({ new_driver_number: 100 }).ok).toBe(false);
    expect(bad({ new_driver_number: 1.5 }).ok).toBe(false);
    expect(bad({ new_driver_code: 'ABCD' }).ok).toBe(false);
    expect(planLineupChange(null, ctx).ok).toBe(false);
  });

  it('rejects a replaced driver who is not in the lineup for that race', () => {
    const result = planLineupChange({ ...valid, replaced_driver_name: 'Nobody Here' }, ctx);
    expect(result).toEqual({ ok: false, error: '"Nobody Here" is not in the lineup for this race' });
  });

  it('rejects a new driver who is already racing, case-insensitively', () => {
    const result = planLineupChange({ ...valid, new_driver_name: 'bob jones' }, ctx);
    expect(result.ok).toBe(false);
  });

  it('rejects a number already used by another driver but allows reusing the replaced number', () => {
    expect(planLineupChange({ ...valid, new_driver_number: 2 }, ctx).ok).toBe(false);
    expect(planLineupChange({ ...valid, new_driver_number: 1 }, ctx).ok).toBe(true);
  });

  it('for onward scope, rejects a name already in any later lineup', () => {
    const withLater: PlanContext = {
      ...ctx,
      baseline: [...ctx.baseline, d(9, 'Tom Tsunoda', { first_race: 'r4' })],
    };
    expect(planLineupChange({ ...valid, scope: 'race' }, withLater).ok).toBe(true);
    expect(planLineupChange({ ...valid, scope: 'onward' }, withLater).ok).toBe(false);
  });

  it('sees earlier active changes (replacing a previous stand-in)', () => {
    const withSub: PlanContext = { ...ctx, activeChanges: [change(1, { new_driver_name: 'Stand In', new_driver_number: 99 })] };
    expect(planLineupChange({ ...valid, replaced_driver_name: 'Alice Smith' }, withSub).ok).toBe(false);
    expect(planLineupChange({ ...valid, replaced_driver_name: 'Stand In' }, withSub).ok).toBe(true);
  });
});

describe('real 2026 data', () => {
  it('plans a stand-in for a real race against the season baseline', () => {
    const info = getRaceOrder('las-vegas-2026')!;
    const result = planLineupChange(
      {
        race_id: 'las-vegas-2026',
        scope: 'race',
        replaced_driver_name: 'Rafael Camara',
        new_driver_name: 'Ryo Hirakawa',
        new_driver_number: 50,
      },
      { raceOrder: info.order, baseline: getSeasonDrivers(info.year), activeChanges: [] },
    );
    expect(result.ok).toBe(true);
  });
});
