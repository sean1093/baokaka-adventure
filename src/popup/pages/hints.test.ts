import { describe, expect, test } from 'vitest';
import { applyHint, nextHint, type HintOptions } from '../core/hint';
import { candidateInputs } from '../core/solver';
import { initialState } from '../core/state';
import { step } from '../core/step';
import type { PageDef, SimState } from '../core/types';
import { PAGES } from './index';

/**
 * #100's acceptance test: on every registered page, pressing 提示 at level 3 ("show me", GDD § 2.7)
 * again and again reaches `done` — from the page's start and from states a player wandered into,
 * with the solver (the hint worker's logic, in-process) and with the stored-solution fallback alone
 * (a worker that failed or timed out). Content issues add pages to the registry, never to this file.
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
