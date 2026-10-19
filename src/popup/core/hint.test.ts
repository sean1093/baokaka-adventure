import { describe, expect, test } from 'vitest';
import { roll } from '../../shared/random';
import c0p4 from './fixtures/c0p4';
import c1p2 from './fixtures/c1p2';
import c1p3 from './fixtures/c1p3';
import { jam, loop, threeNode } from './fixtures/solver';
import { applyHint, fallbackHint, HINT_CAP, nextHint, restartAction, solutionAction, type HintOptions } from './hint';
import { candidateInputs, solve } from './solver';
import { initialState } from './state';
import { step } from './step';
import type { Input, PageDef, SimState } from './types';

/** Most hint presses a page may take to finish (every page is ≤ a few moves and a few dozen ticks). */
const MAX_PRESSES = 400;

/** Presses 提示 at level 3 until the page is done; returns how many presses and the sources used. */
function showMeUntilDone(def: PageDef, from: SimState, opts: HintOptions = {}): { done: boolean; presses: number; sources: Set<string> } {
  let state = from;
  const sources = new Set<string>();
  let presses = 0;
  while (!state.done && presses < MAX_PRESSES) {
    const answer = nextHint(def, state, opts);
    sources.add(answer.source);
    state = applyHint(def, state, answer);
    presses++;
  }
  return { done: state.done, presses, sources };
}

/** A deterministic wander through the page: `moves` random player inputs, each followed by a few waits. */
function wander(def: PageDef, seed: number, moves: number): SimState {
  let state = initialState(def);
  let s = seed;
  for (let i = 0; i < moves && !state.done; i++) {
    const options = candidateInputs(def, state).filter((c) => c.t !== 'none');
    if (options.length === 0) break;
    const r = roll(s);
    s = r.seed;
    state = step(def, state, options[Math.floor(r.value * options.length)]).state;
    for (let k = 0; k < 2 && !state.done; k++) state = step(def, state, { t: 'none' }).state;
  }
  return state;
}

const PAGES: readonly PageDef[] = [c0p4, c1p2, c1p3, threeNode, jam];
const SOLVED: readonly PageDef[] = [c0p4, c1p2, c1p3];

describe('nextHint: the solver from the current state (GDD § 2.7)', () => {
  test.each(PAGES.map((p) => [p.id, p] as const))('%s: level 3 pressed again and again reaches done', (_id, def) => {
    const run = showMeUntilDone(def, initialState(def));
    expect(run.done).toBe(true);
    expect([...run.sources]).toEqual(['solver']);
  });

  test.each(PAGES.map((p) => [p.id, p] as const))('%s: from wandered states too', (_id, def) => {
    for (let seed = 1; seed <= 8; seed++) {
      const from = wander(def, seed * 7919, 1 + (seed % 4));
      expect(showMeUntilDone(def, from).done, `seed ${seed}`).toBe(true);
    }
  });

  test('the first action is the shortest way: fewest moves, then fewest ticks', () => {
    const start = initialState(c1p2);
    const exact = solve(c1p2, start).nextAction(start);
    expect(nextHint(c1p2, start).action).toEqual(exact);
  });

  test('a done page has nothing to hint', () => {
    let state = initialState(threeNode);
    state = step(threeNode, state, { t: 'tap', id: 'latch' }).state;
    while (!state.done) state = step(threeNode, state, { t: 'none' }).state;
    expect(nextHint(threeNode, state)).toEqual({ action: null, source: 'solver' });
    expect(fallbackHint(threeNode, state).action).toBeNull();
    expect(applyHint(threeNode, state, { action: null, source: 'solver' })).toBe(state);
  });

  test('a wait is an action ("等等看。"): after the last gesture he still has to crawl', () => {
    let state = initialState(threeNode);
    state = step(threeNode, state, { t: 'tap', id: 'latch' }).state;
    expect(nextHint(threeNode, state).action).toEqual({ t: 'none' });
  });

  test('the runtime cap is GDD § 3.7\'s', () => {
    expect(HINT_CAP).toBe(200_000);
  });
});

describe('the fallback when the solver gives up (§ 2.7; requirement 2: silently)', () => {
  test('a timeout falls back to the stored solution step', () => {
    let t = 0;
    const clock = () => (t += 1000); // every reading is a second later: the 300 ms budget is gone at once
    // The time check runs every 256 expansions, so a tiny page can finish first; c1p2 explores more
    const start = initialState(c1p2);
    const answer = nextHint(c1p2, start, { clock, timeMs: 0, cap: 100 });
    expect(answer.source).toBe('solution');
    expect(answer.action).toEqual({ t: 'set', part: 'train', to: 'half' });
  });

  test('a page error mid-search never throws: the fallback answers', () => {
    const start = initialState(loop);
    expect(() => nextHint(loop, start)).not.toThrow();
    expect(nextHint(loop, start).source).not.toBe('solver');
  });

  test.each(SOLVED.map((p) => [p.id, p] as const))('%s: the fallback alone reaches done from the start', (_id, def) => {
    const run = showMeUntilDone(def, initialState(def), { cap: 0 });
    expect(run.done).toBe(true);
    expect(run.sources.has('solver')).toBe(false);
  });

  test.each(SOLVED.map((p) => [p.id, p] as const))('%s: …and from wandered states (restarting when lost)', (_id, def) => {
    for (let seed = 1; seed <= 8; seed++) {
      const from = wander(def, seed * 104729, 1 + (seed % 4));
      expect(showMeUntilDone(def, from, { cap: 0 }).done, `seed ${seed}`).toBe(true);
    }
  });

  test('solutionAction follows the solution step by step (c1p2)', () => {
    const wait: Input = { t: 'none' };
    let state = initialState(c1p2);
    expect(solutionAction(c1p2, state)).toEqual({ t: 'set', part: 'train', to: 'half' });
    state = step(c1p2, state, { t: 'set', part: 'train', to: 'half' }).state;
    // The solution let him ride to the gap and settle before sending Mocha: so does the hint
    expect(solutionAction(c1p2, state)).toEqual(wait);
    let ticks = 0;
    while (solutionAction(c1p2, state)?.t === 'none' && ticks++ < 50) state = step(c1p2, state, wait).state;
    expect(state.baby.mode).toBe('reaching');
    // Same part states as before the drag to full: the first step that still does something
    expect(solutionAction(c1p2, state)).toEqual({ t: 'mocha', perch: 'pillar' });
    state = step(c1p2, state, { t: 'mocha', perch: 'pillar' }).state;
    expect(solutionAction(c1p2, state)).toEqual({ t: 'set', part: 'train', to: 'full' });
  });

  test('parts the solution never drives don\'t hide the way (the relaxed match)', () => {
    let state = initialState(c1p2);
    state = step(c1p2, state, { t: 'tap', id: 'board' }).state; // the board flipped: not in the solution
    expect(solutionAction(c1p2, state)).toEqual({ t: 'set', part: 'train', to: 'half' });
  });

  test('nothing matches: 重來 + step 1', () => {
    // The bridge left at mid with the latch open: no step of the solution starts from these parts
    const def: PageDef = { ...jam, solution: [{ tap: 'latch' }, { set: 'bridge', to: 'down' }, { wait: 'goal' }] };
    const start = initialState(def);
    const lost: SimState = { ...start, parts: { ...start.parts, latch: 'open', bridge: 'mid' } };
    const answer = fallbackHint(def, lost);
    expect(answer).toEqual({ action: { t: 'tap', id: 'latch' }, source: 'restart' });
    const after = applyHint(def, lost, answer);
    expect(after.parts).toEqual({ ...start.parts, latch: 'open' });
    expect(after.tick).toBe(1); // played from the page's start
  });

  test('restartAction is the solution\'s first gesture (a wait for a page of waits)', () => {
    expect(restartAction(c0p4)).toEqual({ t: 'mocha', perch: 'basket' });
    expect(restartAction({ ...c0p4, solution: [{ wait: 'goal' }] })).toEqual({ t: 'none' } satisfies Input);
  });

  test('a page without a usable solution still answers (restart with a wait)', () => {
    const start = initialState(threeNode);
    expect(fallbackHint(threeNode, start)).toEqual({ action: { t: 'none' }, source: 'restart' });
  });
});
