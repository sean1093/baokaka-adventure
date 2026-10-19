import { describe, expect, test } from 'vitest';
import { evalCond, holds, partState } from './cond';
import c1p2 from './fixtures/c1p2';
import { initialState } from './state';
import type { Cond, SimState } from './types';

/** c1p2 at the start, then the train half out, the pigeon away, a coin landed, Mocha on the pillar. */
const START = initialState(c1p2);
const MID: SimState = {
  ...START,
  parts: { ...START.parts, train: 'half' },
  creatures: { pigeon: 'away' },
  pushables: { coin: 'landed', card: 'falling' },
  mocha: { perch: 'pillar', path: [] },
  baby: { ...START.baby, node: 'L3' },
  consumed: ['snack'],
  flags: ['boardSeen'],
};
const TRAVELLING: SimState = { ...MID, mocha: { perch: 'pillar', path: ['bench', 'pillarTop'] } };

const T: Cond = { babyAt: 'L3' };
const F: Cond = { babyAt: 'L1' };

const ROWS: [string, Cond, SimState, boolean][] = [
  ['part in: matches', { part: 'train', in: ['half', 'full'] }, MID, true],
  ['part in: other state', { part: 'train', in: ['full'] }, MID, false],
  ['part in: unknown part', { part: 'ghost', in: ['half'] }, MID, false],
  ['part in: empty list', { part: 'train', in: [] }, MID, false],
  ['part in: reads a pushable', { part: 'coin', in: ['landed'] }, MID, true],
  ['mochaAt: settled', { mochaAt: 'pillar' }, MID, true],
  ['mochaAt: other perch', { mochaAt: 'bench' }, MID, false],
  ['mochaAt: still travelling', { mochaAt: 'pillar' }, TRAVELLING, false],
  ['mochaAt: not on page', { mochaAt: 'bench' }, { ...MID, mocha: { perch: null, path: [] } }, false],
  ['babyAt: there', { babyAt: 'L3' }, MID, true],
  ['babyAt: elsewhere', { babyAt: 'R2' }, MID, false],
  ['landed: landed', { landed: 'coin' }, MID, true],
  ['landed: falling', { landed: 'card' }, MID, false],
  ['landed: unknown', { landed: 'ghost' }, MID, false],
  ['creature at: there', { creature: 'pigeon', at: 'away' }, MID, true],
  ['creature at: elsewhere', { creature: 'pigeon', at: 'onTrack' }, MID, false],
  ['creature at: unknown', { creature: 'ghost', at: 'away' }, MID, false],
  ['consumed: yes', { consumed: 'snack' }, MID, true],
  ['consumed: no', { consumed: 'bead' }, MID, false],
  ['flag: set', { flag: 'boardSeen' }, MID, true],
  ['flag: unset', { flag: 'other' }, MID, false],
  ['all: every true', { all: [T, T] }, MID, true],
  ['all: one false', { all: [T, F] }, MID, false],
  ['all: empty is true', { all: [] }, MID, true],
  ['any: one true', { any: [F, T] }, MID, true],
  ['any: none true', { any: [F, F] }, MID, false],
  ['any: empty is false', { any: [] }, MID, false],
  ['not: of true', { not: T }, MID, false],
  ['not: of false', { not: F }, MID, true],
  ['nested: not(all(T, any(F, not(F))))', { not: { all: [T, { any: [F, { not: F }] }] } }, MID, false],
  ['nested: any(all(F), not(any()))', { any: [{ all: [F] }, { not: { any: [] } }] }, MID, true],
  ['nested: the GDD § 3.4 edge cond at the start', { part: 'train', in: ['half', 'full'] }, START, false],
];

describe('evalCond', () => {
  test.each(ROWS)('%s', (_name, cond, state, expected) => {
    expect(evalCond(c1p2, state, cond)).toBe(expected);
  });

  test('covers every Cond variant', () => {
    const variants = new Set(ROWS.map(([, cond]) => Object.keys(cond)[0]));
    expect([...variants].sort()).toEqual(['all', 'any', 'babyAt', 'consumed', 'creature', 'flag', 'landed', 'mochaAt', 'not', 'part']);
  });

  test('short-circuits all/any like && and ||', () => {
    // an `any` whose first member holds never looks at the rest (a cond that would throw if read)
    const poison = { get not(): Cond { throw new Error('read'); } } as Cond;
    expect(evalCond(c1p2, MID, { any: [T, poison] })).toBe(true);
    expect(evalCond(c1p2, MID, { all: [F, poison] })).toBe(false);
  });
});

describe('holds', () => {
  test('an absent condition holds', () => expect(holds(c1p2, MID, undefined)).toBe(true));
  test('a present condition is evaluated', () => {
    expect(holds(c1p2, MID, T)).toBe(true);
    expect(holds(c1p2, MID, F)).toBe(false);
  });
});

describe('partState', () => {
  test('reads parts, then pushables', () => {
    expect(partState(MID, 'train')).toBe('half');
    expect(partState(MID, 'coin')).toBe('landed');
    expect(partState(MID, 'ghost')).toBeUndefined();
  });
});
