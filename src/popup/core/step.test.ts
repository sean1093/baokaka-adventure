import { describe, expect, test } from 'vitest';
import type { SimEvent } from './events';
import c0p4 from './fixtures/c0p4';
import c1p2 from './fixtures/c1p2';
import c1p3 from './fixtures/c1p3';
import { e, line, n, page, part } from './fixtures/toy';
import { replay } from './replay';
import { canonicalKey, initialState } from './state';
import { LEARNED_KEY, learned, matchPredicate, pagePredicates, partLocked, partOrigin, predicateKey, step, stepGrowth } from './step';
import type { EventPredicate, Input, PageDef, SimState } from './types';

const NONE: Input = { t: 'none' };
const set = (p: string, to: string): Input => ({ t: 'set', part: p, to });
const tap = (id: string): Input => ({ t: 'tap', id });

function run(def: PageDef, inputs: Input[], from: SimState = initialState(def)) {
  let s = from;
  const ticks: SimEvent[][] = [];
  for (const input of inputs) {
    const r = step(def, s, input);
    ticks.push(r.events);
    s = r.state;
  }
  return { state: s, ticks, events: ticks.flat() };
}
const types = (events: SimEvent[]) => events.map((ev) => ev.type);

describe('phase order (§ 3.3)', () => {
  test("a cry opens the gate at the end of its tick; he only sees it on the next (phase 5's cascade comes after his decision)", () => {
    const def = page({
      nodes: [n('A', 0), n('B', 100, 0, 0, { attach: { part: 'gate', pos: { closed: [100, 0], open: [100, 0] } } }), n('C', 200)],
      edges: [e('A', 'B'), e('B', 'C')],
      parts: [part('gate', 'gate', 100, 0, { react: [{ on: 'cry', to: 'open' }] })],
      attractors: [{ id: 'bead', kind: 'shiny', node: 'C', goal: true, visibleWhen: { part: 'gate', in: ['open'] } }],
    });
    const { state, ticks } = run(def, [NONE, NONE, NONE]);
    expect(ticks.map(types)).toEqual([[], [], ['cry', 'partEnter']]);
    expect(state.parts.gate).toBe('open');
    expect(state.baby).toMatchObject({ node: 'A', mode: 'crying' });
    const next = step(def, state, NONE);
    expect(next.state.baby).toMatchObject({ node: 'B', mode: 'moving', target: 'bead' });
    // Comfort is silent (§ 2.2.5): no bark that tick.
    expect(types(next.events)).toEqual(['babyEnter']);
  });

  test('an input (phase 1) is seen by his decision (phase 5) in the same tick', () => {
    const settled = replay(c1p2, [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }]).state;
    expect(settled.baby.node).toBe('T2');
    const r = step(c1p2, settled, set('train', 'full'));
    expect(types(r.events)).toEqual(['partEnter', 'babyEnter']);
    expect(r.state.baby.node).toBe('R1');
  });

  test("Mocha's landing (phase 3) opens a gate he crosses in the same tick (phase 5)", () => {
    const { ticks, state } = run(c1p3, [{ t: 'mocha', perch: 'counter' }, NONE, NONE]);
    expect(types(ticks[0])).toEqual(['catLeave', 'catArrive', 'mochaStare', 'bark', 'babyEnter']);
    expect(types(ticks[1])).toEqual(['push', 'bark']);
    expect(types(ticks[2])).toEqual(['land', 'partEnter', 'beep', 'partEnter', 'babyEnter', 'learn']);
    expect(state.baby.node).toBe('gA');
  });

  test('the clock advances once per tick; inputs and events never touch it', () => {
    expect(run(c1p2, [NONE, set('train', 'half'), tap('board')]).state.tick).toBe(3);
  });
});

describe('phase 1: set', () => {
  const tab = part('tab', 'tab', 0, 0, { states: ['s0', 's1', 's2', 's3'], stateWhen: { s2: { flag: 'clear' } } });
  const def = page({
    ...line('AB'),
    parts: [
      tab,
      part('gate', 'gate', 0, 0),
      part('coin', 'pushable', 0, 0, { fall: { path: [], fallTo: 'B' } }),
      part('lid', 'flap', 0, 0, { lockedWhen: { flag: 'glued' } }),
      part('seat', 'slider', 0, 0, { states: ['l', 'r'], lockedByCat: true }),
    ],
    perches: [{ id: 'cushion', node: 'B', onPart: 'seat' }],
  });
  const s0 = initialState(def);

  test('moves a player-driven part and emits partEnter from its origin', () => {
    const r = step(def, s0, set('tab', 's1'));
    expect(r.state.parts.tab).toBe('s1');
    expect(r.events[0]).toEqual({ type: 'partEnter', id: 'tab', state: 's1', at: [0, 0] });
  });

  test('ignores event-driven parts, pushables, unknown parts and states, and the current state', () => {
    for (const input of [set('gate', 'open'), set('coin', 'landed'), set('ghost', 'x'), set('tab', 's9'), set('tab', 's0')]) {
      const r = step(def, s0, input);
      expect(r.state.parts).toEqual(s0.parts);
      expect(r.state.pushables).toEqual(s0.pushables);
      expect(r.events.filter((ev) => ev.type !== 'bark')).toEqual([]);
    }
  });

  test('a drag toward a disallowed stop ends at the furthest allowed one and jams', () => {
    const r = step(def, s0, set('tab', 's3'));
    expect(r.state.parts.tab).toBe('s1');
    expect(r.events).toEqual([{ type: 'partEnter', id: 'tab', state: 's1', at: [0, 0] }, { type: 'jam', id: 'tab', state: 's1' }]);
    // Already at the last allowed stop: a jam and nothing else.
    expect(step(def, r.state, set('tab', 's2')).events).toEqual([{ type: 'jam', id: 'tab', state: 's1' }]);
    // Backwards too.
    const s3 = { ...s0, parts: { ...s0.parts, tab: 's3' } };
    expect(step(def, s3, set('tab', 's0')).events).toEqual([{ type: 'jam', id: 'tab', state: 's3' }]);
    // Once the way is clear the drag goes through.
    expect(step(def, { ...s0, flags: ['clear'] }, set('tab', 's3')).state.parts.tab).toBe('s3');
  });

  test("the GDD's pigeon jams 1-2's train at half until it flies off", () => {
    const r = step(c1p2, initialState(c1p2), set('train', 'full'));
    expect(r.state.parts.train).toBe('half');
    expect(r.events.filter((ev) => ev.type === 'jam')).toEqual([{ type: 'jam', id: 'train', state: 'half' }]);
  });

  test('a locked part does not move and says so (lockedWhen; Mocha sitting on a lockedByCat part)', () => {
    const glued = { ...s0, flags: ['glued'] };
    expect(partLocked(def, glued, 'lid')).toBe(true);
    expect(step(def, glued, set('lid', 'open')).events).toEqual([{ type: 'locked', id: 'lid' }]);
    const satOn = { ...s0, mocha: { perch: 'cushion', path: [] } };
    expect(partLocked(def, satOn, 'seat')).toBe(true);
    const r = step(def, satOn, set('seat', 'r'));
    expect(r.state.parts.seat).toBe('l');
    expect(r.events[0]).toEqual({ type: 'locked', id: 'seat' });
    expect(partLocked(def, s0, 'seat')).toBe(false);
    expect(partLocked(def, s0, 'ghost')).toBe(false);
  });
});

describe('phase 1: tap, mocha, pet, floor', () => {
  const def = page({
    ...line('AB'),
    parts: [
      part('lid', 'flap', 0, 0),
      part('mobile', 'prop', 0, 0, { states: ['still', 'spin', 'slow'] }),
      part('gate', 'gate', 0, 0),
      part('lamp', 'light', 0, 0, { input: 'tap-toggle', stateWhen: { on: { flag: 'power' } } }),
      part('lock', 'flap', 0, 0, { lockedWhen: { flag: 'glued' } }),
    ],
  });
  const s0 = initialState(def);

  test('the preset tap rule: flaps toggle, props cycle; event-driven parts and unknown ids ignore taps', () => {
    expect(run(def, [tap('lid')]).state.parts.lid).toBe('open');
    expect(run(def, [tap('lid'), tap('lid')]).state.parts.lid).toBe('closed');
    expect(run(def, [tap('mobile'), tap('mobile'), tap('mobile')]).state.parts.mobile).toBe('still');
    expect(step(def, s0, tap('gate')).state.parts).toEqual(s0.parts);
    expect(step(def, s0, tap('ghost')).events).toEqual([]);
  });

  test('taps respect locks and stateWhen', () => {
    expect(step(def, s0, tap('lamp')).events).toEqual([{ type: 'jam', id: 'lamp', state: 'off' }]);
    expect(step(def, { ...s0, flags: ['power'] }, tap('lamp')).state.parts.lamp).toBe('on');
    expect(step(def, { ...s0, flags: ['glued'] }, tap('lock')).events).toEqual([{ type: 'locked', id: 'lock' }]);
  });

  test("Mocha's inputs go through mocha.ts: a refusal is logged and nothing changes", () => {
    const r = step(c1p2, initialState(c1p2), { t: 'mocha', perch: 'nowhere' });
    expect(r.events[0]).toEqual({ type: 'mochaNope', id: 'nowhere' });
    expect(r.state.mocha).toEqual(initialState(c1p2).mocha);
    const pet = step(c1p3, replay(c1p3, [{ mocha: 'counter' }, { wait: 3 }]).state, { t: 'pet' });
    // The card already landed: petting repeats nothing (no stare, no push).
    expect(types(pet.events).filter((t) => t !== 'bark' && t !== 'babyEnter')).toEqual([]);
  });

  test('`floor` outside linked mode (#128) and `none` change nothing but the clock and his decision', () => {
    const a = step(c1p2, initialState(c1p2), { t: 'floor', node: 'L2' });
    const b = step(c1p2, initialState(c1p2), NONE);
    expect(canonicalKey(a.state)).toBe(canonicalKey(b.state));
  });
});

describe('done', () => {
  test('once the goal is grabbed, ticks only advance the clock and he is `done`', () => {
    const done = replay(c1p2, c1p2.solution).state;
    expect(done.done).toBe(true);
    const r = step(c1p2, done, set('train', 'out'));
    expect(r.events).toEqual([]);
    expect(r.state).toEqual({ ...done, tick: done.tick + 1, baby: { ...done.baby, mode: 'done' } });
  });

  test('a say after the goal is ignored', () => {
    const done = replay(c1p2, c1p2.solution).state;
    expect(step(c1p2, done, { t: 'say', word: 'beep' }).state.baby.mode).toBe('done');
  });
});

describe('phase 5: his weight on buttons', () => {
  const pad = (id: string, x: number) => n(id, x, 0, 0, { attach: { part: id === 'P' ? 'pad' : 'plate', pos: { up: [x, 0], down: [x, 0] } } });
  const def = page({
    nodes: [n('A', 0), pad('P', 100), n('C', 200), pad('Q', 300)],
    edges: [e('A', 'P'), e('P', 'C'), e('C', 'Q')],
    parts: [part('pad', 'button', 100, 0, { emit: [{ onEnter: 'down', event: 'beep' }] }), part('plate', 'button', 300, 0, { lockedWhen: { flag: 'rusty' } })],
    perches: [{ id: 'shelf', node: 'S', onPart: 'pad' }],
    attractors: [{ id: 'milk', kind: 'snack', node: 'C' }, { id: 'toy', kind: 'snack', node: 'Q', visibleWhen: { consumed: 'milk' } }],
  });

  test('stepping on a button presses it (and its emit fires); stepping off releases it', () => {
    const { ticks, state } = run(def, [NONE, NONE]);
    expect(ticks[0]).toContainEqual({ type: 'partEnter', id: 'pad', state: 'down', at: [100, 0] });
    expect(types(ticks[0])).toContain('beep');
    expect(ticks[1]).toContainEqual({ type: 'partEnter', id: 'pad', state: 'up', at: [100, 0] });
    expect(state.parts.pad).toBe('up');
  });

  test('stepping off leaves the button down while Mocha sits on it', () => {
    const onPad = run(def, [NONE]).state;
    const withMocha = { ...onPad, mocha: { perch: 'shelf', path: [] } };
    expect(step(def, withMocha, NONE).state.parts.pad).toBe('down');
  });

  test('stepping off releases the button when Mocha sits elsewhere', () => {
    const onPad = run(def, [NONE]).state;
    const elsewhere = { ...onPad, mocha: { perch: 'shelf2', path: [] } };
    const d2 = { ...def, perches: [...def.perches, { id: 'shelf2', node: 'S2', reachNode: 'C' }] };
    expect(step(d2, elsewhere, NONE).state.parts.pad).toBe('up');
  });

  test('a button whose `down` is not allowed ignores his weight', () => {
    const d2 = { ...def, parts: def.parts.map((p) => (p.id === 'pad' ? { ...p, stateWhen: { down: { flag: 'armed' } } } : p)) };
    expect(run(d2, [NONE]).state.parts.pad).toBe('up');
  });

  test('a locked button ignores his weight', () => {
    const s = run(def, [NONE, NONE, NONE, NONE], { ...initialState(def), flags: ['rusty'] }).state;
    expect(s.baby.node).toBe('Q');
    expect(s.parts.plate).toBe('up');
  });
});

describe('phase 5: ride', () => {
  test('he rides when the part he sits on carries him (1-2: the train with him on it)', () => {
    const settled = replay(c1p2, [{ set: 'train', to: 'half' }, { wait: 'settle' }]).state;
    const r = step(c1p2, settled, set('train', 'out'));
    expect(r.state.baby.node).toBe('T2');
    expect(r.events).toContainEqual({ type: 'ride', id: 'train' });
  });

  test('no ride when he crawls onto the part after it moved, or off it', () => {
    // Tick 0 moves the train to half while he is on L1; he never ends on it moved.
    const r = step(c1p2, initialState(c1p2), set('train', 'half'));
    expect(types(r.events)).not.toContain('ride');
    const settled = replay(c1p2, [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }]).state;
    expect(types(step(c1p2, settled, set('train', 'full')).events)).not.toContain('ride');
  });

  test('a part that moves after he stepped on it (his own babyEnter) carries him', () => {
    const def = page({
      nodes: [n('A', 0), n('car', 0, 0, 0, { attach: { part: 'lift', pos: { low: [100, 0], high: [100, -100] } } }), n('top', 200, -100)],
      edges: [e('A', 'car'), e('car', 'top', { when: { part: 'lift', in: ['high'] } })],
      parts: [part('lift', 'lift', 100, 0, { states: ['low', 'high'], react: [{ on: { type: 'babyEnter', id: 'car' }, to: 'high' }] })],
      attractors: [{ id: 'bead', kind: 'shiny', node: 'top', goal: true }],
    });
    const r = step(def, initialState(def), NONE);
    expect(types(r.events)).toEqual(['bark', 'babyEnter', 'partEnter', 'ride']);
    expect(r.state.parts.lift).toBe('high');
  });

  test('a doorway that changes state under him is no ride (its node stays put)', () => {
    const def = page({
      nodes: [n('door', 0, 0, 0, { attach: { part: 'gate', pos: { closed: [0, 0], open: [0, 0] } } }), n('B', 100)],
      edges: [e('door', 'B')],
      parts: [part('gate', 'gate', 0, 0, { react: [{ on: 'beep', to: 'open' }] })],
    });
    const r = step(def, initialState(def), { t: 'say', word: 'beep' });
    expect(r.state.parts.gate).toBe('open');
    expect(types(r.events)).not.toContain('ride');
  });

  test('riding while saying a word counts too (the tab moves him during the say tick)', () => {
    const def = page({
      nodes: [n('seat', 0, 0, 0, { attach: { part: 'cart', pos: { a: [0, 0], b: [50, 0] } } })],
      edges: [],
      parts: [part('cart', 'slider', 0, 0, { states: ['a', 'b'], react: [{ on: 'wow', to: 'next' }] })],
    });
    expect(step(def, initialState(def), { t: 'say', word: 'wow' }).events).toContainEqual({ type: 'ride', id: 'cart' });
  });
});

describe('phase 7: learning and counters', () => {
  test('`learns` with an event fires once, on the tick of the event', () => {
    const { ticks, state } = run(c1p3, [{ t: 'mocha', perch: 'counter' }, NONE, NONE, NONE, { t: 'say', word: 'beep' }]);
    expect(ticks.flat().filter((ev) => ev.type === 'learn')).toEqual([{ type: 'learn', word: 'beep' }]);
    expect(types(ticks[2])).toContain('learn');
    expect(learned(state)).toBe(true);
  });

  test('`learns` with a condition; a growth stage it teaches opens new edges', () => {
    const def = page({
      nodes: [n('A', 0), n('step', 100, -50, 1), n('B', 200, -50, 1)],
      edges: [e('A', 'step', { kind: 'climb' }), e('step', 'B', { kind: 'climb' })],
      parts: [part('lamp', 'light', 0, 0, { input: 'tap-toggle' })],
      attractors: [{ id: 'bead', kind: 'shiny', node: 'B', goal: true }],
      learns: { growth: 1, when: { part: 'lamp', in: ['on'] } },
    });
    const s0 = initialState(def);
    expect(stepGrowth(def, s0)).toBe(0);
    const r = step(def, s0, tap('lamp'));
    expect(r.events.filter((ev) => ev.type === 'learn')).toEqual([{ type: 'learn', growth: 1 }]);
    expect(r.state.counters[LEARNED_KEY]).toBe(1);
    expect(stepGrowth(def, r.state)).toBe(1);
    expect(r.state.baby.node).toBe('A');
    const end = run(def, [NONE, NONE], r.state).state;
    expect(end.done).toBe(true);
    expect(run(def, [tap('lamp')], r.state).events.filter((ev) => ev.type === 'learn')).toEqual([]);
  });

  test('a page growth at or above the learned one stays', () => {
    const def = page({ ...line('AB'), baby: { start: 'A', facing: 'r', growth: 2 }, learns: { growth: 1, when: { all: [] } } });
    const s = step(def, initialState(def), NONE).state;
    expect(stepGrowth(def, s)).toBe(2);
  });

  test("counters count a predicate's events while its `when` holds, capped at its count", () => {
    const shuttle = (k: number): Input[] => Array.from({ length: k }, (_, i) => set('train', i % 2 === 0 ? 'out' : 'half'));
    const settled = replay(c1p2, [{ set: 'train', to: 'half' }, { wait: 'settle' }]).state;
    const pred = c1p2.mischief.when;
    expect(predicateKey(pred)).toBe('ride');
    const three = run(c1p2, shuttle(3), settled).state;
    expect(three.counters).toEqual({ ride: 3 });
    expect(matchPredicate([], pred, three.counters)).toBe(false);
    const six = run(c1p2, shuttle(6), settled).state;
    expect(six.counters).toEqual({ ride: 4 });
    expect(matchPredicate([], pred, six.counters)).toBe(true);
  });

  test("a predicate's `when` gates counting (0-4: close the curtain while Mocha is on the rod)", () => {
    const pred = c0p4.mischief.when;
    const key = predicateKey(pred);
    expect(key).toBe('partEnter:curtain?{"all":[{"in":["closed"],"part":"curtain"},{"mochaAt":"rod"}]}');
    const open = run(c0p4, [tap('curtain')]).state;
    expect(run(c0p4, [tap('curtain')], open).state.counters[key]).toBeUndefined();
    const onRod = run(c0p4, [{ t: 'mocha', perch: 'rod' }, tap('curtain'), tap('curtain')]).state;
    expect(onRod.counters[key]).toBe(1);
    expect(matchPredicate([], pred, onRod.counters)).toBe(true);
  });

  test('every page predicate is tracked once: mischief plus event lines, deduplicated by key', () => {
    const ride: EventPredicate = { type: 'ride' };
    const def = { ...c1p2, lines: { onEvent: [{ when: ride, line: 'c1.ride' }, { when: { type: 'grab', id: 'bead' } as EventPredicate, line: 'c1.got' }] } };
    expect(pagePredicates(def).map(predicateKey)).toEqual(['ride', 'ride', 'grab:bead']);
    const done = replay(def, def.solution).state;
    expect(done.counters).toEqual({ 'grab:bead': 1 });
  });

  test('matchPredicate falls back to the events when a predicate is not tracked', () => {
    const events: SimEvent[] = [{ type: 'grab', id: 'bead' }, { type: 'grab', id: 'coin' }, { type: 'bark', bark: 'want' }];
    expect(matchPredicate(events, { type: 'grab' }, {})).toBe(true);
    expect(matchPredicate(events, { type: 'grab', count: 2 }, {})).toBe(true);
    expect(matchPredicate(events, { type: 'grab', count: 3 }, {})).toBe(false);
    expect(matchPredicate(events, { type: 'grab', id: 'coin' }, {})).toBe(true);
    expect(matchPredicate(events, { type: 'eat' }, {})).toBe(false);
    expect(matchPredicate(events, { type: 'grab', when: { flag: 'x' } }, {})).toBe(false);
  });
});

describe('determinism: event-log snapshots of three scripted scenarios', () => {
  const scenarios: [string, PageDef, Parameters<typeof replay>[1]][] = [
    // 1-2: the solution, after riding the train back and forth twice (the 淘氣).
    [
      'c1p2 ride and solve',
      c1p2,
      [{ set: 'train', to: 'half' }, { wait: 'settle' }, { set: 'train', to: 'out' }, { set: 'train', to: 'half' }, { set: 'train', to: 'out' }, { set: 'train', to: 'half' }, { mocha: 'pillar' }, { set: 'train', to: 'full' }, { wait: 'goal' }],
    ],
    // 1-3: Mocha's card beeps gate A open, he learns 嗶！, his 嗶！ opens gate B and spins the robot.
    ['c1p3 fare gates', c1p3, c1p3.solution],
    // 0-4: the 淘氣 first, then hide Mocha, cry, open the curtain.
    ['c0p4 crying is a tool', c0p4, [{ mocha: 'rod' }, { tap: 'curtain' }, { tap: 'curtain' }, ...c0p4.solution]],
  ];

  test.each(scenarios)('%s', (_, def, steps) => {
    const once = replay(def, steps);
    const twice = replay(def, steps);
    expect(twice).toEqual(once);
    expect(once.state.done).toBe(true);
    expect(matchPredicate([], def.mischief.when, once.state.counters)).toBe(true);
    const log = once.ticks.map((t) => `${t.tick} ${JSON.stringify(t.input)} → ${t.events.map((ev) => JSON.stringify(ev)).join(' ')}`);
    expect(log).toMatchSnapshot();
  });

  test('no Math.random, no clock: the same inputs give the same canonical states', () => {
    const a = replay(c1p3, c1p3.solution).state;
    const b = replay(c1p3, c1p3.solution).state;
    expect(canonicalKey(a)).toBe(canonicalKey(b));
  });
});

test('partOrigin is the centre of the hit area (rectangles and circles)', () => {
  expect(partOrigin(part('a', 'gate', 10, 20))).toEqual([10, 20]);
  expect(partOrigin({ ...part('b', 'wheel', 0, 0), hit: { cx: 5, cy: 6, r: 30 } })).toEqual([5, 6]);
});
