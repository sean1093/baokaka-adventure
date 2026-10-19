import { describe, expect, test } from 'vitest';
import { compilePart, nextState, PRESETS, reactionTarget, tapTarget, type TapRule } from './presets';
import { PART_PRESETS, type PartDef, type PartInput, type PartPreset } from './types';

const HIT = { x: 0, y: 0, w: 48, h: 48 };
const part = (preset: PartPreset, extra: Partial<PartDef> = {}): PartDef => ({ id: `p-${preset}`, preset, hit: HIT, art: 'test', ...extra });

/** States to give presets that have no defaults. */
const LISTED: Partial<Record<PartPreset, string[]>> = {
  tab: ['stop0', 'stop1', 'stop2'],
  slider: ['stop0', 'stop1'],
  wheel: ['0', '1', '2', '3'],
  section: ['0', '1', '2'],
  lift: ['floor0', 'floor1'],
  loop: ['0', '1', '2'],
  blowable: ['0', '1'],
  prop: ['a', 'b', 'c'],
};

/**
 * Every preset: default states (null = must be listed), default input, allowed inputs, tap rule
 * with the default input, and the tap result from the first state (with `LISTED` states where needed).
 */
const TABLE: [PartPreset, string[] | null, PartInput, PartInput[], TapRule, string | null][] = [
  ['tab', null, 'drag-linear', ['drag-linear', 'none'], 'advance', 'stop1'],
  ['slider', null, 'drag-linear', ['drag-linear', 'none'], 'advance', 'stop1'],
  ['wheel', null, 'drag-rotary', ['drag-rotary', 'none'], 'rotate-cw', '1'],
  ['flap', ['closed', 'open'], 'tap-toggle', ['tap-toggle', 'none'], 'toggle', 'open'],
  ['section', null, 'none', ['none'], 'none', null],
  ['gate', ['closed', 'open'], 'none', ['none'], 'none', null],
  ['button', ['up', 'down'], 'none', ['none'], 'none', null],
  ['lift', null, 'none', ['none'], 'none', null],
  ['loop', null, 'none', ['none', 'drag-rotary', 'tap-cycle'], 'none', null],
  ['pushable', ['onPerch', 'falling', 'landed'], 'none', ['none'], 'none', null],
  ['light', ['off', 'on'], 'none', ['none', 'tap-toggle'], 'none', null],
  ['blowable', null, 'none', ['none'], 'none', null],
  ['carrier', ['idle', 'done'], 'none', ['none'], 'none', null],
  ['prop', null, 'tap-cycle', ['tap-cycle'], 'cycle', 'b'],
];

describe('PRESETS', () => {
  test('the table covers all fourteen presets in GDD order', () => {
    expect(TABLE.map(([p]) => p)).toEqual([...PART_PRESETS]);
    expect(Object.keys(PRESETS).sort()).toEqual([...PART_PRESETS].sort());
    for (const p of PART_PRESETS) expect(PRESETS[p].preset).toBe(p);
  });

  test.each(TABLE)('%s', (preset, defaults, input, inputs, tap, firstTap) => {
    const spec = PRESETS[preset];
    expect(spec.input).toBe(input);
    expect(spec.inputs).toEqual(inputs);
    expect(spec.inputs).toContain(spec.input);

    if (defaults === null) {
      expect(spec.states).toBeNull();
      expect(() => compilePart(part(preset))).toThrow(`part 'p-${preset}' (${preset}) must list its states`);
    } else {
      expect(compilePart(part(preset)).states).toEqual(defaults);
    }

    const compiled = compilePart(part(preset, { states: LISTED[preset] }));
    expect(compiled.input).toBe(input);
    expect(compiled.tap).toBe(tap);
    expect(compiled.initial).toBe(compiled.states[0]);
    expect(tapTarget(compiled, compiled.initial)).toBe(firstTap);
  });
});

describe('compilePart', () => {
  test('keeps what the part declares', () => {
    const def = part('tab', { states: ['out', 'half', 'full'], initial: 'half', input: 'none' });
    const c = compilePart(def);
    expect(c).toEqual({ def, id: 'p-tab', preset: 'tab', states: ['out', 'half', 'full'], initial: 'half', input: 'none', tap: 'none' });
  });

  test('throws on an empty state list', () => {
    expect(() => compilePart(part('flap', { states: [] }))).toThrow('must list its states');
  });

  test('carrier states follow the route', () => {
    expect(compilePart(part('carrier', { route: ['a', 'b', 'c'] })).states).toEqual(['idle', 'carrying@0', 'carrying@1', 'carrying@2', 'done']);
  });

  test('a loop with a crank and a tappable light opt into taps', () => {
    const crank = compilePart(part('loop', { states: ['0', '1', '2'], input: 'drag-rotary' }));
    expect(crank.tap).toBe('cycle');
    expect(tapTarget(crank, '2')).toBe('0');
    const lamp = compilePart(part('light', { input: 'tap-toggle' }));
    expect(lamp.tap).toBe('toggle');
    expect(tapTarget(lamp, 'off')).toBe('on');
    expect(tapTarget(lamp, 'on')).toBe('off');
  });

  test('does not mutate the part', () => {
    const def = part('flap');
    compilePart(def);
    expect(def).toEqual(part('flap'));
  });
});

describe('tapTarget', () => {
  const tab = compilePart(part('tab', { states: ['stop0', 'stop1', 'stop2'] }));
  const wheel = compilePart(part('wheel', { states: ['0', '1', '2', '3'] }));
  const flap = compilePart(part('flap'));
  const prop = compilePart(part('prop', { states: ['a', 'b', 'c'] }));

  test.each([
    ['tab advances one stop', tab, 'stop1', 'stop2'],
    ['tab cycles back at the end', tab, 'stop2', 'stop0'],
    ['wheel rotates one step clockwise', wheel, '2', '3'],
    ['wheel wraps a full turn', wheel, '3', '0'],
    ['flap opens', flap, 'closed', 'open'],
    ['flap closes', flap, 'open', 'closed'],
    ['prop cycles', prop, 'c', 'a'],
    ['an unknown current state goes to the first (cycle)', prop, 'zzz', 'a'],
    ['an unknown current state goes to the first (toggle)', flap, 'zzz', 'closed'],
  ])('%s', (_name, compiled, from, to) => {
    expect(tapTarget(compiled, from)).toBe(to);
  });

  test('a one-state toggle stays put', () => {
    const one = compilePart(part('flap', { states: ['only'] }));
    expect(tapTarget(one, 'only')).toBe('only');
  });

  test('parts whose input is none ignore taps, whatever the preset', () => {
    const lockedTab = compilePart(part('tab', { states: ['a', 'b'], input: 'none' }));
    expect(tapTarget(lockedTab, 'a')).toBeNull();
  });
});

describe('nextState', () => {
  test('wraps and restarts from unknown states', () => {
    expect(nextState(['a', 'b'], 'a')).toBe('b');
    expect(nextState(['a', 'b'], 'b')).toBe('a');
    expect(nextState(['a', 'b'], 'x')).toBe('a');
  });
});

describe('reactionTarget', () => {
  const lift = compilePart({ id: 'l', preset: 'lift', states: ['f0', 'f1', 'f2'], hit: { x: 0, y: 0, w: 48, h: 48 }, art: 'l' });
  const solo = compilePart({ id: 's', preset: 'prop', states: ['only'], hit: { x: 0, y: 0, w: 48, h: 48 }, art: 's' });
  test.each([
    ['next', 'f0', 'f1'],
    ['next', 'f2', 'f0'],
    ['prev', 'f1', 'f0'],
    ['prev', 'f0', 'f2'],
    ['prev', 'unknown', 'f0'],
    ['toggle', 'f0', 'f1'],
    ['toggle', 'f1', 'f0'],
    ['toggle', 'f2', 'f0'],
    ['f2', 'f0', 'f2'],
    ['nowhere', 'f0', null],
  ] as const)('%s from %s → %s', (to, from, expected) => {
    expect(reactionTarget(lift, from, to)).toBe(expected);
  });
  test('toggle on a one-state part stays', () => {
    expect(reactionTarget(solo, 'only', 'toggle')).toBe('only');
  });
});
