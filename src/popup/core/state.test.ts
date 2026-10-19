import { describe, expect, test } from 'vitest';
import { definePage } from './define';
import c1p2 from './fixtures/c1p2';
import { canonicalKey, initialState, stableStringify } from './state';
import type { PageDef, SimState } from './types';

describe('initialState', () => {
  test('builds the GDD § 3.4 page’s start', () => {
    expect(initialState(c1p2)).toEqual({
      tick: 0,
      parts: { train: 'out', board: 'still' },
      baby: { node: 'L1', mode: 'idle', facing: 'r', refused: [], lookCount: 0, target: null, reachTicks: 0, linked: false },
      mocha: { perch: 'bench', path: [] },
      creatures: { pigeon: 'onTrack' },
      pushables: {},
      consumed: [],
      flags: [],
      counters: {},
      done: false,
    } satisfies SimState);
  });

  const page: PageDef = {
    ...c1p2,
    parts: [
      ...c1p2.parts,
      { id: 'coin', preset: 'pushable', hit: { cx: 0, cy: 0, r: 30 }, fall: { path: [[0, 0], [0, 10]], fallTo: 'L2' }, art: 'x' },
      { id: 'spare', preset: 'pushable', initial: 'landed', hit: { cx: 0, cy: 0, r: 30 }, art: 'x' },
      { id: 'cushion', preset: 'flap', hit: { x: 0, y: 0, w: 60, h: 60 }, art: 'x' },
      { id: 'auntie', preset: 'carrier', route: ['L1', 'L2'], hit: { x: 0, y: 0, w: 60, h: 60 }, art: 'x' },
    ],
    creatures: [...c1p2.creatures, { id: 'goose', positions: { pond: 'L3', bank: 'R1' }, initial: 'bank', art: 'x' }],
    baby: { start: 'R2', facing: 'l' },
    mocha: { start: null },
  };

  test('pushables start onPerch in their own record; preset defaults fill omitted states', () => {
    const s = initialState(page);
    expect(s.pushables).toEqual({ coin: 'onPerch', spare: 'landed' });
    expect(s.parts).toEqual({ train: 'out', board: 'still', cushion: 'closed', auntie: 'idle' });
    expect(s.creatures).toEqual({ pigeon: 'onTrack', goose: 'bank' });
    expect(s.baby).toMatchObject({ node: 'R2', facing: 'l', mode: 'idle' });
    expect(s.mocha).toEqual({ perch: null, path: [] });
  });

  test('is plain JSON and a fresh object every call', () => {
    const a = initialState(page);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    a.flags.push('x');
    a.parts.train = 'full';
    expect(initialState(page).flags).toEqual([]);
    expect(initialState(page).parts.train).toBe('out');
  });
});

describe('stableStringify', () => {
  test.each([
    [null, 'null'],
    [3, '3'],
    ['a"b', '"a\\"b"'],
    [true, 'true'],
    [[1, [2, 'x']], '[1,[2,"x"]]'],
    [{ b: 1, a: { d: [], c: null } }, '{"a":{"c":null,"d":[]},"b":1}'],
    [{ a: undefined, b: 1 }, '{"b":1}'],
    [[undefined, 1], '[null,1]'],
  ])('%j', (value, expected) => {
    expect(stableStringify(value)).toBe(expected);
    expect(JSON.parse(stableStringify(value))).toEqual(JSON.parse(JSON.stringify(value)));
  });
});

describe('canonicalKey', () => {
  const base = initialState(c1p2);
  const a: SimState = {
    ...base,
    tick: 7,
    parts: { train: 'half', board: 'flip' },
    creatures: { pigeon: 'away', goose: 'pond' },
    baby: { ...base.baby, refused: ['bead', 'mocha'], carriedBy: { id: 'auntie', k: 1 } },
    mocha: { perch: 'pillar', path: ['bench', 'pillarTop'] },
    consumed: ['snack', 'cake'],
    flags: ['z', 'a', 'm'],
    counters: { ride: 2, wave: 1 },
  };
  /** The same state built in a different key and set order. */
  const b: SimState = {
    done: false,
    counters: { wave: 1, ride: 2 },
    flags: ['m', 'z', 'a'],
    consumed: ['cake', 'snack'],
    pushables: {},
    creatures: { goose: 'pond', pigeon: 'away' },
    mocha: { path: ['bench', 'pillarTop'], perch: 'pillar' },
    baby: { linked: false, carriedBy: { k: 1, id: 'auntie' }, lookCount: 0, target: null, reachTicks: 0, refused: ['mocha', 'bead'], facing: 'r', mode: 'idle', node: 'L1' },
    parts: { board: 'flip', train: 'half' },
    tick: 7,
  };

  test('is equal for structurally equal states, whatever the insertion order', () => {
    expect(canonicalKey(b)).toBe(canonicalKey(a));
  });

  test('treats an undefined optional field as absent', () => {
    expect(canonicalKey({ ...base, mocha: { ...base.mocha, floorNode: undefined } })).toBe(canonicalKey(base));
  });

  test('does not sort the input’s arrays in place', () => {
    canonicalKey(a);
    expect(a.flags).toEqual(['z', 'a', 'm']);
    expect(a.baby.refused).toEqual(['bead', 'mocha']);
  });

  test.each<[string, (s: SimState) => SimState]>([
    ['tick', (s) => ({ ...s, tick: 8 })],
    ['a part', (s) => ({ ...s, parts: { ...s.parts, train: 'full' } })],
    ['a creature', (s) => ({ ...s, creatures: { ...s.creatures, goose: 'bank' } })],
    ['Mocha’s path order', (s) => ({ ...s, mocha: { ...s.mocha, path: ['pillarTop', 'bench'] } })],
    ['a flag', (s) => ({ ...s, flags: [...s.flags, 'q'] })],
    ['a refusal', (s) => ({ ...s, baby: { ...s.baby, refused: ['bead'] } })],
    ['the carrier step', (s) => ({ ...s, baby: { ...s.baby, carriedBy: { id: 'auntie', k: 2 } } })],
    ['a counter', (s) => ({ ...s, counters: { ...s.counters, ride: 3 } })],
    ['done', (s) => ({ ...s, done: true })],
  ])('differs when %s differs', (_name, change) => {
    expect(canonicalKey(change(a))).not.toBe(canonicalKey(a));
  });

  test('round-trips to the same state (sets sorted)', () => {
    const back = JSON.parse(canonicalKey(a)) as SimState;
    expect(back.flags).toEqual(['a', 'm', 'z']);
    expect(canonicalKey(back)).toBe(canonicalKey(a));
  });
});

describe('definePage', () => {
  test('returns its argument unchanged', () => {
    expect(definePage(c1p2)).toBe(c1p2);
  });
});
