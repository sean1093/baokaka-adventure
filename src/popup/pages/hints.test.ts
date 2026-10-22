import { describe, expect, test } from 'vitest';
import { applyHint, nextHint, type HintOptions } from '../core/hint';
import { candidateInputs } from '../core/solver';
import { initialState } from '../core/state';
import { step } from '../core/step';
import type { PageDef, SimState } from '../core/types';
import { ALL_PAGES as PAGES } from './index';

/**
 * #100's acceptance test: on every registered page, pressing 提示 at level 3 ("show me", GDD § 2.7)
 * again and again reaches `done` — from the page's start and from states a player wandered into,
 * with the solver (the hint worker's logic, in-process) and with the stored-solution fallback alone
 * (a worker that failed or timed out). Content issues add pages to the registry, never to this file.
 * #137's spot check goes deeper: level 3 from 20 states per chapter reached by seeded random play.
 */

const MAX_PRESSES = 400;
const clock = () => performance.now();

function showMe(def: PageDef, from: SimState, opts: HintOptions): boolean {
  let state = from;
  for (let i = 0; i < MAX_PRESSES && !state.done; i++) state = applyHint(def, state, nextHint(def, state, opts));
  return state.done;
}

/** Every state one player input (then two waits) away from the start: the first places a player can wander to. */
function oneMoveAway(def: PageDef): SimState[] {
  const start = initialState(def);
  return candidateInputs(def, start)
    .filter((i) => i.t !== 'none')
    .map((input) => {
      let s = step(def, start, input).state;
      for (let k = 0; k < 2 && !s.done; k++) s = step(def, s, { t: 'none' }).state;
      return s;
    });
}

describe.each(PAGES.map((def) => [def.id, def] as const))('hints on page %s', (_id, def) => {
  test('level 3, pressed again and again, reaches done (the solver)', () => {
    expect(showMe(def, initialState(def), { clock })).toBe(true);
  });

  test('…from one move away too', () => {
    for (const from of oneMoveAway(def)) expect(showMe(def, from, { clock })).toBe(true);
  });

  test('…and with the fallback alone (no solver)', () => {
    expect(showMe(def, initialState(def), { cap: 0 })).toBe(true);
    for (const from of oneMoveAway(def)) expect(showMe(def, from, { cap: 0 })).toBe(true);
  });
});

/** A small deterministic generator (an LCG), so the spot check's states are the same on every run. */
function seeded(seed: number): () => number {
  let x = seed >>> 0;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

/**
 * A state a player wandered into: 1–10 random inputs from the start (any the solver would try,
 * waits included), each followed by two waits. Null when the walk happened to finish the page.
 */
function wander(def: PageDef, rnd: () => number): SimState | null {
  let s = initialState(def);
  const moves = 1 + Math.floor(rnd() * 10);
  for (let m = 0; m < moves && !s.done; m++) {
    const inputs = candidateInputs(def, s);
    s = step(def, s, inputs[Math.floor(rnd() * inputs.length)]).state;
    for (let k = 0; k < 2 && !s.done; k++) s = step(def, s, { t: 'none' }).state;
  }
  return s.done ? null : s;
}

/** States per chapter for the spot check (#137: "level-3 hints from 20 random states per chapter finish the page") */
const SPOT_STATES = 20;

describe.each([...new Set(PAGES.map((p) => p.chapter))].map((c) => [c] as const))('hints from wandered states, chapter %i (#137)', (chapter) => {
  test(`level 3 finishes the page from ${SPOT_STATES} random states (or as many as the chapter's pages give)`, () => {
    const pages = PAGES.filter((p) => p.chapter === chapter);
    const rnd = seeded(137 + chapter);
    const stuck: string[] = [];
    let tried = 0;
    // Round-robin over the chapter's pages; a trivial page (page E) may finish while wandering
    for (let i = 0; tried < SPOT_STATES && i < SPOT_STATES * 3; i++) {
      const def = pages[i % pages.length];
      const from = wander(def, rnd);
      if (from === null) continue;
      tried++;
      if (!showMe(def, from, { clock })) stuck.push(def.id);
    }
    expect(stuck).toEqual([]);
    expect(tried).toBeGreaterThan(0);
  });
});
