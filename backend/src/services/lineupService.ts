import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import RaceLineupChange from '../models/RaceLineupChange';
import UserPrediction from '../models/UserPrediction';
import RaceResult from '../models/RaceResult';
import PredictionScore from '../models/PredictionScore';
import {
  DriverData,
  LineupChange,
  applyLineupChanges,
  filterDriversForRace,
  getRaceOrder,
  getSeasonDrivers,
} from '../data/drivers';

/* ------------------------------------------------------------------ */
/* Pure planning / validation                                          */
/* ------------------------------------------------------------------ */

export interface PlanContext {
  raceOrder: string[];
  baseline: DriverData[]; // whole season JSON
  activeChanges: LineupChange[]; // non-reverted changes
}

export interface PlannedChange {
  race_identifier: string;
  scope: 'race' | 'onward';
  replaced_driver_name: string;
  new_driver_name: string;
  new_driver_number: number;
  new_driver_code: string;
  new_driver_team: string;
  affectedRaces: string[];
}

export type PlanResult = { ok: true; plan: PlannedChange } | { ok: false; error: string };

const NAME_PATTERN = /^\p{L}[\p{L} .'’-]*$/u;

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Same fallback the frontend uses for drivers it has no code for. */
export function deriveCode(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const surname = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return surname.slice(0, 3).toUpperCase();
}

/** Races a change touches: just the race, or the race and every later one. */
export function affectedRaces(raceOrder: string[], raceId: string, scope: 'race' | 'onward'): string[] {
  const idx = raceOrder.indexOf(raceId);
  if (idx === -1) return [];
  return scope === 'race' ? [raceId] : raceOrder.slice(idx);
}

function lineupFor(ctx: PlanContext, raceId: string): DriverData[] {
  return applyLineupChanges(
    filterDriversForRace(ctx.baseline, ctx.raceOrder, raceId),
    ctx.activeChanges,
    ctx.raceOrder,
    raceId,
  );
}

export function planLineupChange(input: unknown, ctx: PlanContext): PlanResult {
  const body = (input ?? {}) as Record<string, unknown>;
  const fail = (error: string): PlanResult => ({ ok: false, error });

  const raceId = typeof body.race_id === 'string' ? body.race_id : '';
  if (!raceId || !ctx.raceOrder.includes(raceId)) return fail('Unknown race');

  const scope = body.scope;
  if (scope !== 'race' && scope !== 'onward') return fail('scope must be "race" or "onward"');

  if (typeof body.replaced_driver_name !== 'string' || typeof body.new_driver_name !== 'string') {
    return fail('Both the replaced driver and the new driver name are required');
  }
  const replaced = normalizeName(body.replaced_driver_name);
  const newName = normalizeName(body.new_driver_name);

  if (newName.length < 2 || newName.length > 100 || !NAME_PATTERN.test(newName)) {
    return fail('New driver name must be 2-100 characters and contain only letters, spaces, . \' -');
  }
  if (newName.toLowerCase() === replaced.toLowerCase()) {
    return fail('New driver must be different from the replaced driver');
  }

  const number = Number(body.new_driver_number);
  if (!Number.isInteger(number) || number < 0 || number > 99) {
    return fail('Driver number must be a whole number between 0 and 99');
  }

  const raceLineup = lineupFor(ctx, raceId);
  const replacedEntry = raceLineup.find((d) => d.full_name === replaced);
  if (!replacedEntry) return fail(`"${replaced}" is not in the lineup for this race`);

  let code = typeof body.new_driver_code === 'string' ? body.new_driver_code.trim().toUpperCase() : '';
  if (!code) code = deriveCode(newName);
  if (code.length !== 3) return fail('Driver code must be exactly 3 characters');

  let team = typeof body.new_driver_team === 'string' ? body.new_driver_team.trim() : '';
  if (!team) team = replacedEntry.team; // a stand-in drives the same seat
  if (team.length > 100) return fail('Team name is too long');

  const races = affectedRaces(ctx.raceOrder, raceId, scope);

  // The new driver must not already be racing in any affected race.
  for (const r of races) {
    const clash = lineupFor(ctx, r).find((d) => d.full_name.toLowerCase() === newName.toLowerCase());
    if (clash) {
      return fail(`"${clash.full_name}" is already in the lineup for ${r}`);
    }
  }

  const numberClash = raceLineup.find((d) => d.number === number && d.full_name !== replaced);
  if (numberClash) return fail(`Number ${number} is already used by ${numberClash.full_name}`);

  return {
    ok: true,
    plan: {
      race_identifier: raceId,
      scope,
      replaced_driver_name: replaced,
      new_driver_name: newName,
      new_driver_number: number,
      new_driver_code: code,
      new_driver_team: team,
      affectedRaces: races,
    },
  };
}

/* ------------------------------------------------------------------ */
/* DB-backed lineup                                                    */
/* ------------------------------------------------------------------ */

async function loadActiveChanges(transaction?: Transaction): Promise<LineupChange[]> {
  const rows = await RaceLineupChange.findAll({
    where: { reverted_at: null },
    order: [['id', 'ASC']],
    transaction,
  });
  return rows.map((r) => ({
    id: Number(r.id),
    race_identifier: r.race_identifier,
    scope: r.scope,
    replaced_driver_name: r.replaced_driver_name,
    new_driver_name: r.new_driver_name,
    new_driver_number: r.new_driver_number,
    new_driver_code: r.new_driver_code,
    new_driver_team: r.new_driver_team,
  }));
}

async function buildContext(raceId: string, transaction?: Transaction): Promise<PlanContext | null> {
  const info = getRaceOrder(raceId);
  if (!info) return null;
  return {
    raceOrder: info.order,
    baseline: getSeasonDrivers(info.year),
    activeChanges: await loadActiveChanges(transaction),
  };
}

/** Lineup a user can predict / an admin can enter results for. null = unknown race. */
export async function getEffectiveLineup(raceId: string): Promise<DriverData[] | null> {
  const ctx = await buildContext(raceId);
  if (!ctx) return null;
  return lineupFor(ctx, raceId);
}

export async function isValidDriverInLineup(raceId: string, driverName: string): Promise<boolean> {
  const lineup = await getEffectiveLineup(raceId);
  if (!lineup) return false;
  const name = driverName.trim();
  return lineup.some((d) => d.full_name === name);
}

/* ------------------------------------------------------------------ */
/* Apply / preview / revert                                            */
/* ------------------------------------------------------------------ */

export interface RewriteCounts {
  predictions: number;
  results: number;
  scores: number;
}

async function countName(races: string[], name: string, transaction?: Transaction): Promise<RewriteCounts> {
  const [predictions, results, predictedScores, actualScores] = await Promise.all([
    UserPrediction.count({ where: { race_identifier: { [Op.in]: races }, driver_name: name }, transaction }),
    RaceResult.count({ where: { race_identifier: { [Op.in]: races }, driver_name: name }, transaction }),
    PredictionScore.count({ where: { race_identifier: { [Op.in]: races }, predicted_driver_name: name }, transaction }),
    PredictionScore.count({ where: { race_identifier: { [Op.in]: races }, actual_driver_name: name }, transaction }),
  ]);
  return { predictions, results, scores: predictedScores + actualScores };
}

async function renameName(
  races: string[],
  from: string,
  to: string,
  transaction: Transaction,
): Promise<RewriteCounts> {
  const [[predictions], [results], [predictedScores], [actualScores]] = await Promise.all([
    UserPrediction.update({ driver_name: to }, { where: { race_identifier: { [Op.in]: races }, driver_name: from }, transaction }),
    RaceResult.update({ driver_name: to }, { where: { race_identifier: { [Op.in]: races }, driver_name: from }, transaction }),
    PredictionScore.update({ predicted_driver_name: to }, { where: { race_identifier: { [Op.in]: races }, predicted_driver_name: from }, transaction }),
    PredictionScore.update({ actual_driver_name: to }, { where: { race_identifier: { [Op.in]: races }, actual_driver_name: from }, transaction }),
  ]);
  return { predictions, results, scores: predictedScores + actualScores };
}

export class LineupError extends Error {}

// Serialise lineup writes so two admins (or a double click) cannot interleave.
// Assumes a single API instance, like the rest of this backend's in-process state.
let writeQueue: Promise<unknown> = Promise.resolve();
function serialised<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.catch(() => undefined);
  return run;
}

export interface ChangePreview {
  plan: PlannedChange;
  will_rewrite: RewriteCounts;
}

async function planFromDb(input: unknown, transaction?: Transaction): Promise<PlannedChange> {
  const raceId = (input as { race_id?: unknown } | null)?.race_id;
  const ctx = typeof raceId === 'string' ? await buildContext(raceId, transaction) : null;
  if (!ctx) throw new LineupError('Unknown race');

  const result = planLineupChange(input, ctx);
  if (!result.ok) throw new LineupError(result.error);
  return result.plan;
}

/** Refuse if the new name already appears in stored data for the races involved. */
async function assertNoStoredClash(races: string[], name: string, transaction?: Transaction) {
  const existing = await countName(races, name, transaction);
  if (existing.predictions + existing.results + existing.scores > 0) {
    throw new LineupError(
      `Stored data for these races already contains "${name}"; refusing to merge it with another driver`,
    );
  }
}

export async function previewLineupChange(input: unknown): Promise<ChangePreview> {
  const plan = await planFromDb(input);
  await assertNoStoredClash(plan.affectedRaces, plan.new_driver_name);
  return { plan, will_rewrite: await countName(plan.affectedRaces, plan.replaced_driver_name) };
}

export async function applyLineupChange(input: unknown, adminId: string) {
  return serialised(async () => {
    const t = await sequelize.transaction();
    try {
      const plan = await planFromDb(input, t);
      await assertNoStoredClash(plan.affectedRaces, plan.new_driver_name, t);

      const counts = await renameName(plan.affectedRaces, plan.replaced_driver_name, plan.new_driver_name, t);

      const change = await RaceLineupChange.create(
        {
          race_identifier: plan.race_identifier,
          scope: plan.scope,
          replaced_driver_name: plan.replaced_driver_name,
          new_driver_name: plan.new_driver_name,
          new_driver_number: plan.new_driver_number,
          new_driver_code: plan.new_driver_code,
          new_driver_team: plan.new_driver_team,
          predictions_rewritten: counts.predictions,
          results_rewritten: counts.results,
          scores_rewritten: counts.scores,
          created_by: adminId,
        },
        { transaction: t },
      );

      await t.commit();
      return change;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  });
}

/** Only the most recent active change can be undone, so changes unwind in order. */
export async function revertLineupChange(changeId: number, adminId: string) {
  return serialised(async () => {
    const t = await sequelize.transaction();
    try {
      const change = await RaceLineupChange.findByPk(changeId, { transaction: t });
      if (!change) throw new LineupError('Change not found');
      if (change.reverted_at) throw new LineupError('Change is already reverted');

      const latest = await RaceLineupChange.findOne({
        where: { reverted_at: null },
        order: [['id', 'DESC']],
        transaction: t,
      });
      if (!latest || Number(latest.id) !== Number(change.id)) {
        throw new LineupError('Only the most recent change can be reverted; revert the newer one first');
      }

      const info = getRaceOrder(change.race_identifier);
      if (!info) throw new LineupError('Race for this change no longer exists');
      const races = affectedRaces(info.order, change.race_identifier, change.scope);

      await assertNoStoredClash(races, change.replaced_driver_name, t);
      const counts = await renameName(races, change.new_driver_name, change.replaced_driver_name, t);

      await change.update({ reverted_at: new Date(), reverted_by: adminId }, { transaction: t });
      await t.commit();
      return { change, restored: counts };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  });
}

export async function listLineupChanges() {
  return RaceLineupChange.findAll({ order: [['id', 'DESC']], limit: 200 });
}
