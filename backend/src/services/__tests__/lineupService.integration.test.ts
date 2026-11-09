import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import sequelize from '../../config/database';
import Group from '../../models/Group';
import UserPrediction from '../../models/UserPrediction';
import RaceResult from '../../models/RaceResult';
import PredictionScore from '../../models/PredictionScore';
import RaceLineupChange from '../../models/RaceLineupChange';
import {
  LineupError,
  applyLineupChange,
  getEffectiveLineup,
  isValidDriverInLineup,
  listLineupChanges,
  previewLineupChange,
  revertLineupChange,
} from '../lineupService';

/**
 * Integration tests for the DB side of lineup changes (renames + audit + undo).
 *
 * Skipped unless LINEUP_IT=1, and refuses to run against anything but a local
 * database whose name ends in "_it", because it deletes rows from the tables.
 *
 *   docker compose -f docker-compose-dev.yml up -d
 *   (create database f1_lineup_it, run `npm run migrate` against it)
 *   LINEUP_IT=1 DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=sequelize_user \
 *     DB_PASSWORD=sequelize_pass DB_NAME=f1_lineup_it npx vitest --run lineupService.integration
 */
const enabled = process.env.LINEUP_IT === '1';

if (enabled) {
  const host = process.env.DB_HOST ?? '';
  const name = process.env.DB_NAME ?? '';
  if (!['localhost', '127.0.0.1'].includes(host) || !name.endsWith('_it')) {
    throw new Error(`Refusing to run destructive integration tests against ${host}/${name}`);
  }
}

const LV = 'las-vegas-2026';
const QA = 'qatar-2026';
const ADMIN = 'admin_user';

const swap = (over: Record<string, unknown> = {}) => ({
  race_id: LV,
  scope: 'race',
  replaced_driver_name: 'Rafael Camara',
  new_driver_name: 'Tom Sub',
  new_driver_number: 88,
  ...over,
});

let groupId: number;

async function seed() {
  const group = await Group.create({ id: 900001, group_name: 'IT group', group_type: 'public', owner_id: 'u1' });
  groupId = Number(group.id);

  const mk = async (user: string, race: string, pos: string, driver: string) =>
    UserPrediction.create({ user_id: user, group_id: groupId, race_identifier: race, position_type: pos, driver_name: driver } as never);

  // Las Vegas: Camara predicted 3 times (pole + p3 by u1, p5 by u2), plus an unrelated pick
  const p1 = await mk('u1', LV, 'pole', 'Rafael Camara');
  const p2 = await mk('u1', LV, 'p3', 'Rafael Camara');
  const p3 = await mk('u2', LV, 'p5', 'Rafael Camara');
  await mk('u2', LV, 'p1', 'Max Verstappen');
  // Qatar (later race): Camara predicted once
  await mk('u1', QA, 'p2', 'Rafael Camara');

  // Las Vegas is already scored, with Camara finishing p4
  await RaceResult.create({ race_identifier: LV, position_type: 'p4', driver_name: 'Rafael Camara' } as never);
  await RaceResult.create({ race_identifier: LV, position_type: 'p1', driver_name: 'Max Verstappen' } as never);
  const score = (p: UserPrediction, pred: string, actual: string) =>
    PredictionScore.create({
      prediction_id: Number(p.id), user_id: p.user_id, group_id: groupId, race_identifier: LV,
      position_type: p.position_type, predicted_driver_name: pred, actual_driver_name: actual,
      base_points: 1, unique_correct: false, final_points: 1,
    } as never);
  await score(p1, 'Rafael Camara', 'Max Verstappen');
  await score(p2, 'Rafael Camara', 'Rafael Camara');
  await score(p3, 'Rafael Camara', 'Max Verstappen');
}

async function counts(race: string, name: string) {
  return {
    predictions: await UserPrediction.count({ where: { race_identifier: race, driver_name: name } }),
    results: await RaceResult.count({ where: { race_identifier: race, driver_name: name } }),
    predicted: await PredictionScore.count({ where: { race_identifier: race, predicted_driver_name: name } }),
    actual: await PredictionScore.count({ where: { race_identifier: race, actual_driver_name: name } }),
  };
}

const names = async (race: string) => ((await getEffectiveLineup(race)) ?? []).map((d) => d.full_name);

describe.skipIf(!enabled)('lineupService (database)', () => {
  beforeEach(async () => {
    await PredictionScore.destroy({ where: {} });
    await UserPrediction.destroy({ where: {} });
    await RaceResult.destroy({ where: {} });
    await RaceLineupChange.destroy({ where: {} });
    await Group.destroy({ where: {} });
    await seed();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('previews the rewrite counts without changing anything', async () => {
    const preview = await previewLineupChange(swap());
    expect(preview.will_rewrite).toEqual({ predictions: 3, results: 1, scores: 3 + 1 });
    expect(await counts(LV, 'Rafael Camara')).toEqual({ predictions: 3, results: 1, predicted: 3, actual: 1 });
    expect(await RaceLineupChange.count()).toBe(0);
  });

  it('applies a one-race change: renames that race only, updates the lineup, records history', async () => {
    const change = await applyLineupChange(swap(), ADMIN);

    expect(await counts(LV, 'Rafael Camara')).toEqual({ predictions: 0, results: 0, predicted: 0, actual: 0 });
    expect(await counts(LV, 'Tom Sub')).toEqual({ predictions: 3, results: 1, predicted: 3, actual: 1 });
    // unrelated rows and the later race are untouched
    expect(await counts(LV, 'Max Verstappen')).toMatchObject({ predictions: 1, results: 1 });
    expect(await counts(QA, 'Rafael Camara')).toMatchObject({ predictions: 1 });

    expect(await names(LV)).toContain('Tom Sub');
    expect(await names(LV)).not.toContain('Rafael Camara');
    expect(await names(QA)).toContain('Rafael Camara');
    expect(await isValidDriverInLineup(LV, 'Tom Sub')).toBe(true);
    expect(await isValidDriverInLineup(LV, 'Rafael Camara')).toBe(false);

    expect(change.predictions_rewritten).toBe(3);
    expect(change.results_rewritten).toBe(1);
    expect(change.created_by).toBe(ADMIN);
    expect(change.new_driver_team).toBe('Haas'); // inherited from the replaced seat
    expect((await listLineupChanges())).toHaveLength(1);
  });

  it('keeps scores consistent: renamed on both sides, points untouched', async () => {
    await applyLineupChange(swap(), ADMIN);
    const scores = await PredictionScore.findAll({ where: { race_identifier: LV } });
    expect(scores).toHaveLength(3);
    for (const s of scores) {
      expect(s.predicted_driver_name).toBe('Tom Sub');
      expect(s.final_points).toBe(1);
    }
    expect(scores.filter((s) => s.actual_driver_name === 'Tom Sub')).toHaveLength(1);
  });

  it('refuses to apply the same change twice', async () => {
    await applyLineupChange(swap(), ADMIN);
    await expect(applyLineupChange(swap(), ADMIN)).rejects.toBeInstanceOf(LineupError);
    expect(await RaceLineupChange.count()).toBe(1);
  });

  it('applies two simultaneous identical requests exactly once', async () => {
    const results = await Promise.allSettled([applyLineupChange(swap(), ADMIN), applyLineupChange(swap(), ADMIN)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(await RaceLineupChange.count()).toBe(1);
    expect(await counts(LV, 'Tom Sub')).toMatchObject({ predictions: 3 });
  });

  it('onward scope renames this race and later races, and undo restores both', async () => {
    await applyLineupChange(swap({ scope: 'onward' }), ADMIN);
    expect(await counts(LV, 'Tom Sub')).toMatchObject({ predictions: 3 });
    expect(await counts(QA, 'Tom Sub')).toMatchObject({ predictions: 1 });
    expect(await names(QA)).toContain('Tom Sub');
    expect(await names('abu-dhabi-2026')).toContain('Tom Sub');

    const [change] = await listLineupChanges();
    await revertLineupChange(Number(change.id), ADMIN);

    expect(await counts(LV, 'Rafael Camara')).toEqual({ predictions: 3, results: 1, predicted: 3, actual: 1 });
    expect(await counts(QA, 'Rafael Camara')).toMatchObject({ predictions: 1 });
    expect(await names(QA)).toContain('Rafael Camara');
    expect(await names(QA)).not.toContain('Tom Sub');
  });

  it('undo also renames predictions the stand-in received after the change', async () => {
    await applyLineupChange(swap(), ADMIN);
    await UserPrediction.create({
      user_id: 'u3', group_id: groupId, race_identifier: LV, position_type: 'p7', driver_name: 'Tom Sub',
    } as never);

    const [change] = await listLineupChanges();
    await revertLineupChange(Number(change.id), ADMIN);
    expect(await counts(LV, 'Tom Sub').then((c) => c.predictions)).toBe(0);
    expect(await counts(LV, 'Rafael Camara').then((c) => c.predictions)).toBe(4);
  });

  it('only lets the most recent active change be undone, and only once', async () => {
    const first = await applyLineupChange(swap(), ADMIN);
    const second = await applyLineupChange(
      swap({ replaced_driver_name: 'Tom Sub', new_driver_name: 'Second Sub', new_driver_number: 89 }),
      ADMIN,
    );
    expect(await counts(LV, 'Second Sub')).toMatchObject({ predictions: 3 });

    await expect(revertLineupChange(Number(first.id), ADMIN)).rejects.toThrow(/most recent/);
    await revertLineupChange(Number(second.id), ADMIN);
    expect(await counts(LV, 'Tom Sub')).toMatchObject({ predictions: 3 });
    await revertLineupChange(Number(first.id), ADMIN);
    expect(await counts(LV, 'Rafael Camara')).toMatchObject({ predictions: 3 });
    await expect(revertLineupChange(Number(first.id), ADMIN)).rejects.toThrow(/already reverted/);
  });

  it('refuses when stored data already contains the new name, changing nothing', async () => {
    await UserPrediction.create({
      user_id: 'u9', group_id: groupId, race_identifier: LV, position_type: 'p9', driver_name: 'Tom Sub',
    } as never);
    await expect(applyLineupChange(swap(), ADMIN)).rejects.toThrow(/already contains/);
    expect(await counts(LV, 'Rafael Camara')).toMatchObject({ predictions: 3 });
    expect(await RaceLineupChange.count()).toBe(0);
  });

  it('rolls the renames back if recording the change fails part-way', async () => {
    // created_by is VARCHAR(255): the insert fails after the renames have run
    await expect(applyLineupChange(swap(), 'x'.repeat(300))).rejects.toThrow();
    expect(await counts(LV, 'Rafael Camara')).toEqual({ predictions: 3, results: 1, predicted: 3, actual: 1 });
    expect(await counts(LV, 'Tom Sub')).toEqual({ predictions: 0, results: 0, predicted: 0, actual: 0 });
    expect(await RaceLineupChange.count()).toBe(0);
    // and the lineup is unchanged
    expect(await names(LV)).toContain('Rafael Camara');
  });
});
