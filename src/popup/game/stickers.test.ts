import { describe, expect, test } from 'vitest';
import { initialState, replay, step } from '../core';
import type { SimEvent } from '../core/events';
import { line, page } from '../core/fixtures/toy';
import type { EventPredicate, PageDef, SimState, SolutionStep } from '../core/types';
import { buildRegistry, pageById } from '../pages';
import { completePage, earnSticker, freshSave, loadSave, ProgressStore, SAVE_KEY } from './progress';
import { PageSession } from './session';
import { FRESH_ATTEMPT, GAME_PAGES, attemptResult, earnInAttempt, isMove, mischiefFired, rewardFlags } from './stickers';
import type { StorageLike } from '../../shared/storage';

/**
 * Stickers (#101, GDD § 2.8): the 淘氣 predicate matched against the tick's events with counts, the
 * attempt's bookkeeping, persistence at once, nothing ever lost, and the § 2.8 rewards.
 */

const c1p2 = pageById('c1p2')!;

/** Replays steps tick by tick and lists the ticks on which the 淘氣 fired. */
function firedAt(def: PageDef, steps: readonly SolutionStep[]): { ticks: number[]; state: SimState } {
  const { ticks } = replay(def, steps);
  let state = initialState(def);
  const fired: number[] = [];
  for (const t of ticks) {
    const prev = state;
    const r = step(def, state, t.input);
    state = r.state;
    if (mischiefFired(def, prev, state, r.events)) fired.push(state.tick);
  }
  return { ticks: fired, state };
}

/** 1-2: ride him on the train, back and forth, `n` times. */
const rides = (n: number): SolutionStep[] => {
  const out: SolutionStep[] = [{ set: 'train', to: 'half' }, { wait: 'settle' }];
  for (let i = 0; i < n; i++) out.push({ set: 'train', to: i % 2 === 0 ? 'out' : 'half' }, { wait: 1 });
  return out;
};

describe('淘氣: the mischief predicate against the event stream', () => {
  test('1-2: the fourth ride awards it, not the third', () => {
    expect(firedAt(c1p2, rides(3)).ticks).toEqual([]);
    const { ticks, state } = firedAt(c1p2, rides(4));
    expect(ticks).toHaveLength(1);
    expect(state.done).toBe(false); // awarded even though the page isn't finished
  });

  test('fires once: more rides after it do not fire it again', () => {
    expect(firedAt(c1p2, rides(7)).ticks).toHaveLength(1);
  });

  test('the intended solution alone does not fire it', () => {
    expect(firedAt(c1p2, c1p2.solution).ticks).toEqual([]);
  });

  test('0-1: spinning the mobile (a partEnter with a condition) fires it at once', () => {
    const c0p1 = pageById('c0p1')!;
    expect(firedAt(c0p1, [{ tap: 'mobile' }]).ticks).toEqual([1]);
    // Back to still is not the predicate's state: spinning it again fires nothing new
    expect(firedAt(c0p1, [{ tap: 'mobile' }, { tap: 'mobile' }, { tap: 'mobile' }]).ticks).toEqual([1]);
  });

  test.each([
    // count, counted before the tick, counted after it, fires
    [1, 0, 0, false],
    [1, 0, 1, true],
    [2, 0, 1, false],
    [2, 1, 2, true],
    [3, 2, 3, true],
    [2, 2, 2, false], // already held: not again
  ])('count %i: counted %i → %i fires: %s', (count, before, after, fires) => {
    const pred: EventPredicate = { type: 'push', count };
    const def: PageDef = { ...page(line('AB')), mischief: { text: 't', when: pred } };
    const s = initialState(def);
    const events: SimEvent[] = after > before ? [{ type: 'push', id: 'cup' }] : [];
    expect(mischiefFired(def, { ...s, counters: { push: before } }, { ...s, counters: { push: after } }, events)).toBe(fires);
  });
});

describe('the attempt', () => {
  test('earning is idempotent and the result carries it to completePage', () => {
    const a = earnInAttempt(FRESH_ATTEMPT, 'tudigong');
    expect(earnInAttempt(a, 'tudigong')).toBe(a);
    expect(attemptResult({ ...a, moves: 3 })).toEqual({ mischief: false, tudigong: true, moves: 3 });
  });

  test('moves are the non-wait inputs', () => {
    expect(isMove({ t: 'none' })).toBe(false);
    expect(isMove({ t: 'set', part: 'train', to: 'half' })).toBe(true);
    expect(isMove({ t: 'pet' })).toBe(true);
  });

  test('the session counts moves applied, not waits, and 重來 starts over', () => {
    const clockless = { now: () => 0, setTimeout: () => 0, clearTimeout: () => undefined };
    const s = new PageSession(c1p2, { clock: clockless });
    s.input({ t: 'set', part: 'train', to: 'half' });
    s.tick();
    s.tick();
    s.input({ t: 'mocha', perch: 'pillar' });
    s.tick();
    expect(s.moves).toBe(2);
    s.reset();
    expect(s.moves).toBe(0);
  });
});

/** An in-memory storage. */
function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('persistence (#93): a sticker is saved the moment it is earned', () => {
  test('淘氣 mid-page, unfinished: on disk at once', () => {
    const storage = memory();
    const store = new ProgressStore({ storage, visibility: null });
    for (const id of ['c0p1', 'c0p2', 'c0p3', 'c0p4']) store.completePage(id);
    store.earnSticker('c1p2', 'mischief');
    expect(JSON.parse(storage.data.get(SAVE_KEY)!).pages.c1p2).toBe('m');
    expect(loadSave(storage).pages.c1p2).toEqual({ mischief: true });
  });

  test('土地公 then completion: both kept, with the best moves', () => {
    const storage = memory();
    const store = new ProgressStore({ storage, visibility: null });
    for (const id of ['c0p1', 'c0p2', 'c0p3', 'c0p4']) store.completePage(id);
    store.earnSticker('c1p2', 'tudigong');
    store.completePage('c1p2', attemptResult({ mischief: false, tudigong: true, moves: 4 }));
    expect(loadSave(storage).pages.c1p2).toEqual({ solved: true, tudigong: true, bestPar: 4 });
  });

  test('never lost: a later attempt without stickers (a hint run, a replay) keeps them', () => {
    let save = completePage(freshSave(), 'c0p1', { mischief: true, tudigong: true, moves: 1 });
    save = completePage(save, 'c0p1', attemptResult({ ...FRESH_ATTEMPT, moves: 5 }));
    save = earnSticker(save, 'c0p1', 'mischief');
    expect(save.pages.c0p1).toEqual({ solved: true, mischief: true, tudigong: true, bestPar: 1 });
  });
});

describe('rewards (§ 2.8): every 土地公 → the bonus page, every 淘氣 → the 淘氣大王 cover', () => {
  const reg = buildRegistry([pageById('c0p1')!, pageById('c1p2')!]);

  test('the whole game is 65 pages', () => {
    expect(GAME_PAGES).toBe(65);
  });

  test('a half-built registry never unlocks them', () => {
    let save = completePage(freshSave(reg), 'c0p1', { mischief: true, tudigong: true }, reg);
    save = completePage(save, 'c1p2', { mischief: true, tudigong: true }, reg);
    expect(rewardFlags(save, reg)).toMatchObject({ bonusPage: false, mischiefCover: false, tudigong: 2, mischief: 2, total: 65 });
  });

  test('all of one kind unlocks its reward only', () => {
    let save = completePage(freshSave(reg), 'c0p1', { mischief: true, tudigong: true }, reg);
    save = completePage(save, 'c1p2', { tudigong: true }, reg);
    expect(rewardFlags(save, reg, 2)).toMatchObject({ bonusPage: true, mischiefCover: false });
    save = earnSticker(save, 'c1p2', 'mischief', reg);
    expect(rewardFlags(save, reg, 2)).toMatchObject({ bonusPage: true, mischiefCover: true });
  });
});
