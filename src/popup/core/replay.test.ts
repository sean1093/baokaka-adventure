import { describe, expect, test } from 'vitest';
import c0p4 from './fixtures/c0p4';
import c1p2 from './fixtures/c1p2';
import c1p3 from './fixtures/c1p3';
import { line, page, part } from './fixtures/toy';
import { GOAL_CAP, replay, SETTLE_CAP, toInput } from './replay';
import { initialState } from './state';

describe('toInput', () => {
  test.each([
    [{ set: 'train', to: 'half' }, { t: 'set', part: 'train', to: 'half' }],
    [{ mocha: 'pillar' }, { t: 'mocha', perch: 'pillar' }],
    [{ pet: true }, { t: 'pet' }],
    [{ say: 'beep' }, { t: 'say', word: 'beep' }],
    [{ tap: 'board' }, { t: 'tap', id: 'board' }],
    [{ wait: 3 }, null],
    [{ wait: 'settle' }, null],
    [{ wait: 'goal' }, null],
  ] as const)('%j → %j', (s, expected) => {
    expect(toInput(s)).toEqual(expected);
  });
});

describe('replay', () => {
  test('the GDD § 3.4 page (1-2) replays its solution to done', () => {
    const r = replay(c1p2, c1p2.solution);
    expect(r.state.done).toBe(true);
    expect(r.state.consumed).toEqual(['bead']);
    expect(r.ticks.map((t) => t.tick)).toEqual(r.ticks.map((_, i) => i));
    expect(r.ticks[0].input).toEqual({ t: 'set', part: 'train', to: 'half' });
  });

  test.each([
    ['1-3', c1p3],
    ['0-4', c0p4],
  ])('the %s fixture replays its solution to done', (_, def) => {
    expect(replay(def, def.solution).state.done).toBe(true);
  });

  test('`wait: n` runs n empty ticks; an empty solution changes nothing', () => {
    const r = replay(c1p2, [{ wait: 3 }]);
    expect(r.ticks).toHaveLength(3);
    expect(r.ticks.every((t) => t.input.t === 'none')).toBe(true);
    expect(replay(c1p2, []).state).toEqual(initialState(c1p2));
  });

  test("`settle` stops at the first tick that changes nothing but the clock and the reach beat", () => {
    const r = replay(c1p2, [{ set: 'train', to: 'half' }, { wait: 'settle' }]);
    // He crawls to T2 (ticks 1–3), starts reaching (4), then only the beat changes (5).
    expect(r.ticks).toHaveLength(6);
    expect(r.state.baby).toMatchObject({ node: 'T2', mode: 'reaching', reachTicks: 1 });
  });

  test('`settle` throws when the page never settles', () => {
    // Crying toggles the lamp every tick, forever.
    const def = page({ ...line('AB'), parts: [part('lamp', 'light', 0, 0, { react: [{ on: 'cry', to: 'toggle' }] })] });
    expect(() => replay(def, [{ wait: 'settle' }])).toThrow(`replay of page 'toy': step 0 (wait settle) did not settle in ${SETTLE_CAP} ticks`);
  });

  test('`goal` throws when the goal is never reached', () => {
    expect(() => replay(c1p2, [{ wait: 'goal' }])).toThrow(`replay of page 'c1p2': step 0 (wait goal) did not reach the goal in ${GOAL_CAP} ticks`);
  });

  test('`goal` on a finished page runs no ticks; a replay can start from any state', () => {
    const done = replay(c1p2, c1p2.solution).state;
    const r = replay(c1p2, [{ wait: 'goal' }], done);
    expect(r.ticks).toEqual([]);
    expect(r.state).toBe(done);
  });
});
