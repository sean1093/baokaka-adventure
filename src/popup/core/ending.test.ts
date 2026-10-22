import { describe, expect, test } from 'vitest';
import pageE from '../pages/end/e';
import { MOCHA, candidates, selectTarget } from './baby';
import { lintPage } from './lint';
import { solve } from './solver';
import { initialState } from './state';
import { step } from './step';
import type { Input, PageDef, SimState } from './types';

/**
 * Page E's engine (GDD § 4.4 「抓周」; #135): **Mocha is the goal** (`mochaGoal`) and he outranks
 * every treasure (`priorityOverride: { mocha: 0 }`). Arriving at him, Baokaka grabs his tail (a
 * `grab` of `'mocha'`) and the page is done; while Mocha hops between perches he is still what
 * Baokaka wants, at the perch he is heading for, so no treasure is ever grabbed. The lint holds the
 * rules that make that true.
 */

const NONE: Input = { t: 'none' };
function run(def: PageDef, inputs: readonly Input[], from: SimState = initialState(def)): SimState {
  return inputs.reduce((s, input) => step(def, s, input).state, from);
}

describe('Mocha as the goal', () => {
  test('he is the target from the start, above all ten treasures, and the only goal', () => {
    const start = initialState(pageE);
    const target = selectTarget(pageE, start);
    expect(target).toMatchObject({ id: MOCHA, kind: 'mocha', goal: true, priority: 0, approach: 'R' });
    expect(candidates(pageE, start).filter((c) => c.goal).map((c) => c.id)).toEqual([MOCHA]);
    expect(candidates(pageE, start).filter((c) => c.kind === 'shiny')).toHaveLength(10);
  });

  test("with no input he crawls past every treasure to the sofa's arm and grabs the tail: done, nothing consumed", () => {
    let s = initialState(pageE);
    const nodes: string[] = [s.baby.node];
    let grabbed: string | undefined;
    for (let i = 0; i < 12 && !s.done; i++) {
      const r = step(pageE, s, NONE);
      s = r.state;
      nodes.push(s.baby.node);
      grabbed ??= r.events.find((e) => e.type === 'grab')?.id;
    }
    expect(s.done).toBe(true);
    expect(grabbed).toBe(MOCHA);
    expect([...new Set(nodes)]).toEqual(['B0', 'T1', 'T2', 'T3', 'R']);
    expect(s.consumed).toEqual([]);
    // The arrival is a cuddle: he holds on to Mocha (the hug pose) as the page ends
    expect(s.baby.mode).toBe('cuddling');
  });

  test('Mocha sent to the 抓周盤 (the 淘氣): wanted where he is going while he hops, grabbed there', () => {
    const s = step(pageE, initialState(pageE), { t: 'mocha', perch: 'tray' }).state;
    if (s.mocha.perch === null) expect(selectTarget(pageE, s)).toMatchObject({ id: MOCHA, node: 'T2' });
    const end = run(pageE, Array(8).fill(NONE), s);
    expect(end.done).toBe(true);
    expect(end.baby.node).toBe('T2');
    expect(end.consumed).toEqual([]);
  });

  test('trivially solvable (allowTrivial), no dead ends or traps, the 淘氣 and 土地公 reachable', () => {
    const r = solve(pageE);
    expect({ solvable: r.solvable, par: r.par, trivial: r.trivial, dead: r.deadEndCount, mischief: r.mischiefReachable, tudigong: r.tudigongReachable }).toEqual({
      solvable: true, par: 0, trivial: true, dead: 0, mischief: true, tudigong: true,
    });
    expect(r.softTraps()).toEqual([]);
  });
});

describe('the lint for a Mocha goal (rule 11)', () => {
  const codes = (def: PageDef) => lintPage(def).errors.map((e) => e.code);

  test('page E lints clean', () => {
    expect(lintPage(pageE).errors).toEqual([]);
  });

  test('no goal attractor beside him, he must be on the page, no box perch, no 一起', () => {
    const withGoal = { ...pageE, attractors: pageE.attractors.map((a, i) => (i === 0 ? { ...a, goal: true } : a)) };
    expect(codes(withGoal)).toContain('L11-goal-count');
    expect(codes({ ...pageE, mocha: { start: null } })).toContain('L11-bad-goal');
    expect(codes({ ...pageE, perches: pageE.perches.map((p) => (p.id === 'sill' ? { ...p, hidesMocha: true } : p)) })).toContain('L11-bad-goal');
    expect(codes({ ...pageE, words: ['together'] })).toContain('L11-bad-goal');
  });

  test('without mochaGoal a page still needs exactly one goal attractor', () => {
    const { mochaGoal: _drop, ...plain } = pageE;
    expect(codes(plain)).toContain('L11-goal-count');
  });
});
