import { describe, expect, test } from 'vitest';
import c1p2 from './fixtures/c1p2';
import {
  ARRIVAL_MODE,
  attractorNode,
  babyGrowth,
  babyTick,
  candidates,
  CHOOSE_BARK,
  compareRanked,
  CRY_RADIUS,
  keepRefusals,
  KIND_PRIORITY,
  LOOK_TICKS,
  MOCHA,
  rankCandidates,
  REACH_BARK_EVERY,
  REACH_HIGH_ENABLED,
  selectTarget,
  type BabyOptions,
} from './baby';
import { BABY_BARKS as BARK_TEXT } from '../content/barks';
import type { SimEvent } from './events';
import { initialState } from './state';
import type { AttractorDef, BabyMode, EdgeDef, NodeDef, PageDef, SimState } from './types';

/** A tiny page; everything not passed is empty. Baokaka starts on the first node, facing right. */
function page(p: Partial<PageDef> & Pick<PageDef, 'nodes' | 'edges'>): PageDef {
  return {
    id: 'toy',
    chapter: 0,
    index: 1,
    title: '玩具',
    difficulty: 1,
    backdrop: 'toy',
    parts: [],
    perches: [],
    attractors: [],
    creatures: [],
    baby: { start: p.nodes[0].id, facing: 'r' },
    mocha: { start: null },
    mischief: { text: '', when: { type: 'ride' } },
    tudigong: { x: 0, y: 0, hat: '' },
    solution: [],
    ...p,
  };
}
const n = (id: string, x: number, y = 0, height: 0 | 1 | 2 = 0): NodeDef => ({ id, x, y, height });
const e = (a: string, b: string, more: Partial<EdgeDef> = {}): EdgeDef => ({ a, b, kind: 'crawl', ...more });
/** Nodes 'A', 'B', … 100 units apart on a line, chained by crawl edges. */
const line = (ids: string) => ({
  nodes: [...ids].map((id, i) => n(id, i * 100)),
  edges: [...ids].slice(1).map((id, i) => e(ids[i], id)),
});
const att = (id: string, kind: AttractorDef['kind'], node: string, more: Partial<AttractorDef> = {}): AttractorDef => ({ id, kind, node, ...more });
const withBaby = (s: SimState, baby: Partial<SimState['baby']>): SimState => ({ ...s, baby: { ...s.baby, ...baby } });

interface Row {
  rule: string;
  def: PageDef;
  state?: (s: SimState) => SimState;
  opts?: BabyOptions;
  /** Expected target, mode and node after the tick. */
  target: string | null;
  mode: BabyMode;
  node: string;
  facing?: 'l' | 'r';
  events?: SimEvent[];
}

const box = { id: 'basket', node: 'P', reachNode: 'B', hidesMocha: true };
const perchP = { id: 'shelf', node: 'P', reachNode: 'B' };

const rows: Row[] = [
  // § 2.2.1 Desires and visibility
  { rule: '2.2.1 a reachable shiny: one edge toward it', def: page({ ...line('ABC'), attractors: [att('bead', 'shiny', 'C')] }),
    target: 'bead', mode: 'moving', node: 'B', facing: 'r',
    events: [{ type: 'bark', id: 'bead', bark: 'want' }, { type: 'babyEnter', id: 'B' }] },
  { rule: '2.2.1 shiny arrival grabs; the goal completes the page', def: page({ ...line('AB'), attractors: [att('bead', 'shiny', 'B', { goal: true })] }),
    state: (s) => withBaby(s, { target: 'bead', mode: 'moving' }),
    target: 'bead', mode: 'grabbing', node: 'B', events: [{ type: 'babyEnter', id: 'B' }, { type: 'grab', id: 'bead' }] },
  { rule: '2.2.1 a non-goal shiny is grabbed and consumed', def: page({ ...line('A'), attractors: [att('coin', 'shiny', 'A')] }),
    target: 'coin', mode: 'grabbing', node: 'A', events: [{ type: 'bark', id: 'coin', bark: 'want' }, { type: 'grab', id: 'coin' }] },
  { rule: '2.2.1 snack arrival: eat (consumed)', def: page({ ...line('AB'), attractors: [att('milk', 'snack', 'B')] }),
    target: 'milk', mode: 'eating', node: 'B', events: [{ type: 'bark', id: 'milk', bark: 'milk' }, { type: 'babyEnter', id: 'B' }, { type: 'eat', id: 'milk' }] },
  { rule: '2.2.1 Mocha on a perch: cuddle at the reachNode', def: page({ nodes: [...line('AB').nodes, n('P', 100, -100, 1)], edges: line('AB').edges, perches: [perchP], mocha: { start: 'shelf' } }),
    target: MOCHA, mode: 'cuddling', node: 'B', events: [{ type: 'bark', id: MOCHA, bark: 'meow' }, { type: 'babyEnter', id: 'B' }] },
  { rule: '2.2.1 an active light: watch', def: page({ ...line('AB'), attractors: [att('lamp', 'light', 'B')] }),
    target: 'lamp', mode: 'watching', node: 'B', events: [{ type: 'bark', id: 'lamp', bark: 'pretty' }, { type: 'babyEnter', id: 'B' }] },
  { rule: '2.2.1 activeWhen false (light off): not a candidate', def: page({ ...line('AB'), parts: [{ id: 'sw', preset: 'light', hit: { cx: 0, cy: 0, r: 1 }, art: 'x' }], attractors: [att('lamp', 'light', 'B', { activeWhen: { part: 'sw', in: ['on'] } })] }),
    target: null, mode: 'looking', node: 'A' },
  { rule: '2.2.1 visibleWhen false (flap closed) hides the shiny; the snack wins', def: page({ ...line('ABC'), parts: [{ id: 'flap', preset: 'flap', hit: { cx: 0, cy: 0, r: 1 }, art: 'x' }], attractors: [att('bead', 'shiny', 'B', { visibleWhen: { part: 'flap', in: ['open'] } }), att('milk', 'snack', 'C')] }),
    target: 'milk', mode: 'moving', node: 'B' },
  { rule: '2.2.1 a consumed attractor is gone', def: page({ ...line('AB'), attractors: [att('milk', 'snack', 'B')] }), state: (s) => ({ ...s, consumed: ['milk'] }),
    target: null, mode: 'looking', node: 'A' },
  { rule: '2.2.1 a refused attractor is ignored', def: page({ ...line('ABC'), attractors: [att('bead', 'shiny', 'B'), att('milk', 'snack', 'C')] }), state: (s) => withBaby(s, { refused: ['bead'] }),
    target: 'milk', mode: 'moving', node: 'B' },
  { rule: '2.2.1 Mocha in a box perch is hidden', def: page({ nodes: [...line('AB').nodes, n('P', 100, -100, 1)], edges: line('AB').edges, perches: [box], mocha: { start: 'basket' } }),
    target: null, mode: 'looking', node: 'A' },
  { rule: '2.2.1 Mocha mid-jump is not a candidate', def: page({ nodes: [...line('AB').nodes, n('P', 100, -100, 1)], edges: line('AB').edges, perches: [perchP], mocha: { start: 'shelf' } }),
    state: (s) => ({ ...s, mocha: { perch: 'shelf', path: ['P'] } }), target: null, mode: 'looking', node: 'A' },
  { rule: '2.2.1 nodeBy: the attractor follows the part (spotlight)', def: page({ ...line('ABC'), parts: [{ id: 'spot', preset: 'wheel', states: ['0', '1'], hit: { cx: 0, cy: 0, r: 1 }, art: 'x' }], attractors: [att('glow', 'light', 'C', { nodeBy: { part: 'spot', map: { '1': 'A' } } })] }),
    state: (s) => ({ ...s, parts: { spot: '1' } }), target: 'glow', mode: 'watching', node: 'A' },
  { rule: '2.2.1 priorityOverride (page E): a light can outrank a shiny', def: page({ ...line('ABC'), attractors: [att('bead', 'shiny', 'C'), att('lamp', 'light', 'A')], priorityOverride: { light: 0 } }),
    target: 'lamp', mode: 'watching', node: 'A' },

  // § 2.2.2 Target selection
  { rule: '2.2.2-1 priority: a far shiny beats a near snack', def: page({ ...line('ABCD'), attractors: [att('milk', 'snack', 'B'), att('bead', 'shiny', 'D')] }),
    target: 'bead', mode: 'moving', node: 'B' },
  { rule: '2.2.2 the puzzle rule: an unreachable shiny beats a reachable Mocha', def: page({ nodes: [...line('ABC').nodes, n('X', 400), n('P', 0, -100, 1)], edges: line('ABC').edges, perches: [{ id: 'shelf', node: 'P', reachNode: 'A' }], mocha: { start: 'shelf' }, attractors: [att('bead', 'shiny', 'X')] }),
    target: 'bead', mode: 'moving', node: 'B' },
  { rule: '2.2.2-2 reachable before unreachable (same priority)', def: page({ nodes: [...line('ABCD').nodes, n('X', -50)], edges: line('ABCD').edges, attractors: [att('near', 'shiny', 'X'), att('far', 'shiny', 'D')] }),
    target: 'far', mode: 'moving', node: 'B' },
  { rule: '2.2.2-3 path length beats straight-line distance', def: page({ nodes: [n('A', 0), n('B', 100), n('C', 200), n('D', 0, 50), n('E', 0, 100)], edges: [e('A', 'B'), e('B', 'C'), e('A', 'D', { kind: 'crawl', when: { flag: 'never' } }), e('C', 'E'), e('A', 'E', { when: { flag: 'never' } }), e('B', 'D')], attractors: [att('m1', 'snack', 'E'), att('m2', 'snack', 'C')] }),
    target: 'm2', mode: 'moving', node: 'B' },
  { rule: '2.2.2-4 straight-line distance between unreachable ones', def: page({ nodes: [n('A', 0), n('X', 300), n('Y', -200)], edges: [], attractors: [att('far', 'shiny', 'X'), att('near', 'shiny', 'Y')] }),
    target: 'near', mode: 'reaching', node: 'A', facing: 'l' },
  { rule: '2.2.2-5 id breaks a full tie', def: page({ nodes: [n('A', 0), n('L', -100), n('R', 100)], edges: [e('A', 'L'), e('A', 'R')], attractors: [att('zebra', 'snack', 'L'), att('apple', 'snack', 'R')] }),
    target: 'apple', mode: 'eating', node: 'R', facing: 'r' },

  // § 2.2.3 Movement
  { rule: '2.2.3 facing follows the last move (left)', def: page({ nodes: [n('A', 100), n('B', 0)], edges: [e('A', 'B')], attractors: [att('bead', 'shiny', 'B')] }),
    target: 'bead', mode: 'grabbing', node: 'B', facing: 'l' },
  { rule: '2.2.3 equal paths: edge order decides', def: page({ nodes: [n('A', 0), n('U', 100, -50), n('D', 100, 50), n('Z', 200)], edges: [e('A', 'D'), e('A', 'U'), e('U', 'Z'), e('D', 'Z')], attractors: [att('bead', 'shiny', 'Z')] }),
    target: 'bead', mode: 'moving', node: 'D' },
  { rule: '2.2.3 unreachable: head for the reachable node nearest the target', def: page({ nodes: [...line('ABC').nodes, n('X', 290, 0)], edges: line('ABC').edges, attractors: [att('bead', 'shiny', 'X')] }),
    target: 'bead', mode: 'moving', node: 'B' },
  { rule: '2.2.3 unreachable and already nearest: reaching, facing it, 「要！要！」', def: page({ nodes: [n('A', 100), n('X', 0, -100)], edges: [], attractors: [att('bead', 'shiny', 'X')] }),
    state: (s) => withBaby(s, { target: 'bead', mode: 'moving' }), target: 'bead', mode: 'reaching', node: 'A', facing: 'l', events: [{ type: 'bark', id: 'bead', bark: 'wantWant' }] },
  { rule: '2.2.3 nearest tie on distance: the shorter path', def: page({ nodes: [n('A', 0), n('B', 100), n('C', 200, -100), n('D', 200, 100), n('X', 300)], edges: [e('A', 'B'), e('B', 'D'), e('A', 'C')], attractors: [att('bead', 'shiny', 'X')] }),
    target: 'bead', mode: 'moving', node: 'C' },
  { rule: '2.2.3 nearest tie on distance and path: the smaller id', def: page({ nodes: [n('A', 0), n('Q', 200, -100), n('P', 200, 100), n('X', 300)], edges: [e('A', 'Q'), e('A', 'P')], attractors: [att('bead', 'shiny', 'X')] }),
    target: 'bead', mode: 'moving', node: 'P' },
  { rule: '2.2.3 a creature blocks the way: he waits at the nearest node', def: page({ ...line('ABC'), attractors: [att('bead', 'shiny', 'C')], creatures: [{ id: 'goose', positions: { here: 'B' }, initial: 'here', art: 'x' }] }),
    target: 'bead', mode: 'reaching', node: 'A' },
  { rule: '2.2.3 growth 0 cannot climb', def: page({ nodes: [n('A', 0), n('S', 100, 0, 1)], edges: [e('A', 'S', { kind: 'climb' })], attractors: [att('bead', 'shiny', 'S')] }),
    target: 'bead', mode: 'reaching', node: 'A' },
  { rule: '2.2.3 growth 1 climbs', def: page({ nodes: [n('A', 0), n('S', 100, 0, 1)], edges: [e('A', 'S', { kind: 'climb' })], attractors: [att('bead', 'shiny', 'S')], baby: { start: 'A', facing: 'r', growth: 1 } }),
    target: 'bead', mode: 'grabbing', node: 'S' },

  // § 2.2.4 Never falls
  { rule: '2.2.4 a closed edge is a drop-off: he sits and reaches', def: page({ nodes: [n('A', 0), n('B', 100)], edges: [e('A', 'B', { when: { flag: 'bridge' } })], attractors: [att('bead', 'shiny', 'B')] }),
    target: 'bead', mode: 'reaching', node: 'A', facing: 'r' },
  { rule: '2.2.4 a decoy is never grabbed, even on a reachable node', def: page({ ...line('AB'), attractors: [att('moon', 'shiny', 'B', { decoy: true })] }),
    state: (s) => withBaby(s, { node: 'B', target: 'moon', mode: 'moving' }), target: 'moon', mode: 'reaching', node: 'B' },
  { rule: '2.2.4 a decoy outranks Mocha: he fixates on it', def: page({ nodes: [...line('AB').nodes, n('X', 200, -100), n('P', 0, -100, 1)], edges: line('AB').edges, perches: [{ id: 'shelf', node: 'P', reachNode: 'A' }], mocha: { start: 'shelf' }, attractors: [att('moon', 'shiny', 'X', { decoy: true })] }),
    target: 'moon', mode: 'moving', node: 'B' },
  { rule: '2.2.4 Mocha on a perch without reachNode: he reaches up for him', def: page({ nodes: [n('A', 0), n('P', 0, -100, 1)], edges: [], perches: [{ id: 'shelf', node: 'P' }], mocha: { start: 'shelf' } }),
    target: MOCHA, mode: 'reaching', node: 'A' },

  // § 2.2.5 Looking → crying
  { rule: '2.2.5 nothing to want: looking (1)', def: page(line('AB')), target: null, mode: 'looking', node: 'A', events: [] },
  { rule: '2.2.5 looking (2)', def: page(line('AB')), state: (s) => withBaby(s, { mode: 'looking', lookCount: 1 }), target: null, mode: 'looking', node: 'A' },
  { rule: '2.2.5 after 2 ticks of looking: crying, with a cry event', def: page(line('AB')), state: (s) => withBaby(s, { mode: 'looking', lookCount: 2 }),
    target: null, mode: 'crying', node: 'A', events: [{ type: 'cry', at: [0, 0], within: CRY_RADIUS }] },
  { rule: '2.2.5 crying emits cry every tick', def: page(line('AB')), state: (s) => withBaby(s, { node: 'B', mode: 'crying' }),
    target: null, mode: 'crying', node: 'B', events: [{ type: 'cry', at: [100, 0], within: CRY_RADIUS }] },
  { rule: '2.2.5 comfort: crying stops the moment a candidate appears, silently', def: page({ ...line('ABC'), attractors: [att('milk', 'snack', 'C')] }),
    state: (s) => withBaby(s, { mode: 'crying' }), target: 'milk', mode: 'moving', node: 'B', events: [{ type: 'babyEnter', id: 'B' }] },
  { rule: '2.2.5 comfort into reaching is silent too', def: page({ nodes: [n('A', 0), n('X', 100)], edges: [], attractors: [att('bead', 'shiny', 'X')] }),
    state: (s) => withBaby(s, { mode: 'crying' }), target: 'bead', mode: 'reaching', node: 'A', events: [] },
  { rule: '2.2.5 a shiny that changed its mind ends looking too', def: page({ ...line('AB'), attractors: [att('bead', 'shiny', 'B')] }),
    state: (s) => withBaby(s, { mode: 'looking', lookCount: 2 }), target: 'bead', mode: 'grabbing', node: 'B' },

  // § 2.5 reachHigh
  { rule: '2.5 reachHigh: a height-1 shiny grabbed from the adjacent node', def: page({ nodes: [n('A', 0), n('B', 100), n('H', 200, -60, 1)], edges: [e('A', 'B'), e('B', 'H', { kind: 'jump' })], attractors: [att('bead', 'shiny', 'H', { height: 1, goal: true })], baby: { start: 'A', facing: 'r', growth: 2 } }),
    opts: { reachHigh: true }, target: 'bead', mode: 'grabbing', node: 'B' },
  { rule: '2.5 reachHigh on by default since M4 (#127): grabbed from the adjacent node', def: page({ nodes: [n('A', 0), n('B', 100), n('H', 200, -60, 1)], edges: [e('A', 'B'), e('B', 'H', { kind: 'jump' })], attractors: [att('bead', 'shiny', 'H', { height: 1 })], baby: { start: 'B', facing: 'r', growth: 2 } }),
    target: 'bead', mode: 'grabbing', node: 'B' },
  { rule: '2.5 reachHigh switched off: he reaches instead', def: page({ nodes: [n('A', 0), n('B', 100), n('H', 200, -60, 1)], edges: [e('A', 'B'), e('B', 'H', { kind: 'jump' })], attractors: [att('bead', 'shiny', 'H', { height: 1 })], baby: { start: 'B', facing: 'r', growth: 2 } }),
    opts: { reachHigh: false }, target: 'bead', mode: 'reaching', node: 'B' },
  { rule: '2.5 reachHigh only for height 1: a height-0 attractor next door is still unreachable', def: page({ nodes: [n('A', 0), n('B', 100), n('H', 200, -60, 0)], edges: [e('A', 'B'), e('B', 'H', { kind: 'jump' })], attractors: [att('bead', 'shiny', 'H')], baby: { start: 'B', facing: 'r', growth: 2 } }),
    target: 'bead', mode: 'reaching', node: 'B' },
  { rule: '2.5 reachHigh needs the edge open: a closed `when` keeps it out of reach', def: page({ nodes: [n('A', 0), n('B', 100), n('H', 200, -60, 1)], edges: [e('A', 'B'), e('B', 'H', { kind: 'jump', when: { flag: 'never' } })], attractors: [att('bead', 'shiny', 'H', { height: 1 })], baby: { start: 'B', facing: 'r', growth: 2 } }),
    target: 'bead', mode: 'reaching', node: 'B' },
  { rule: '2.5 reachHigh needs growth 2', def: page({ nodes: [n('A', 0), n('B', 100), n('H', 200, -60, 1)], edges: [e('A', 'B'), e('B', 'H', { kind: 'jump' })], attractors: [att('bead', 'shiny', 'H', { height: 1 })], baby: { start: 'B', facing: 'r', growth: 1 } }),
    opts: { reachHigh: true }, target: 'bead', mode: 'reaching', node: 'B' },
];

describe('babyTick: one row per rule of GDD § 2.2.1–2.2.5', () => {
  test('the table has at least 25 rows', () => expect(rows.length).toBeGreaterThanOrEqual(25));

  test.each(rows.map((r) => [r.rule, r] as const))('%s', (_, row) => {
    const start = row.state ? row.state(initialState(row.def)) : initialState(row.def);
    const { state, events } = babyTick(row.def, start, row.opts);
    expect({ target: state.baby.target, mode: state.baby.mode, node: state.baby.node }).toEqual({ target: row.target, mode: row.mode, node: row.node });
    if (row.facing) expect(state.baby.facing).toBe(row.facing);
    if (row.events) expect(events).toEqual(row.events);
  });
});

describe('arrival effects and page state', () => {
  test('grabbing the goal sets done and consumes it; the next tick is done, quietly', () => {
    const def = page({ ...line('AB'), attractors: [att('bead', 'shiny', 'B', { goal: true })] });
    const first = babyTick(def, initialState(def)).state;
    expect(first.done).toBe(true);
    expect(first.consumed).toEqual(['bead']);
    const next = babyTick(def, first);
    expect(next.state.baby.mode).toBe('done');
    expect(next.events).toEqual([]);
    expect(babyTick(def, next.state).state).toBe(next.state);
  });

  test('eating lasts one tick: the snack is consumed and he looks for something else', () => {
    const def = page({ ...line('A'), attractors: [att('milk', 'snack', 'A')] });
    const ate = babyTick(def, initialState(def)).state;
    expect(ate.consumed).toEqual(['milk']);
    expect(ate.done).toBe(false);
    expect(babyTick(def, ate).state.baby.mode).toBe('looking');
  });

  test('cuddling and watching last while the target stays (no new bark)', () => {
    const def = page({ ...line('A'), attractors: [att('lamp', 'light', 'A')] });
    const s1 = babyTick(def, initialState(def)).state;
    const r2 = babyTick(def, s1);
    expect(r2.state.baby.mode).toBe('watching');
    expect(r2.events).toEqual([]);
  });

  test('a carried baby is the tick’s business', () => {
    const def = page({ ...line('AB'), attractors: [att('bead', 'shiny', 'B')] });
    const s = withBaby(initialState(def), { mode: 'carried' });
    expect(babyTick(def, s)).toEqual({ state: s, events: [] });
  });

  test('saying is treated as resolved: the decision loop takes over', () => {
    const def = page({ ...line('AB'), attractors: [att('bead', 'shiny', 'B')] });
    expect(babyTick(def, withBaby(initialState(def), { mode: 'saying', target: 'bead' })).state.baby.mode).toBe('grabbing');
  });

  test('the ARRIVAL_MODE and KIND_PRIORITY tables follow § 2.2.1', () => {
    expect(KIND_PRIORITY).toEqual({ shiny: 1, mocha: 2, snack: 3, light: 4 });
    expect(ARRIVAL_MODE).toEqual({ shiny: 'grabbing', mocha: 'cuddling', snack: 'eating', light: 'watching' });
    expect(BARK_TEXT).toMatchObject({ want: '要！', meow: '喵喵！', milk: 'ㄋㄟㄋㄟ', pretty: '好看！', wantWant: '要！要！' });
    expect(CHOOSE_BARK).toEqual({ shiny: 'want', mocha: 'meow', snack: 'milk', light: 'pretty' });
    expect([LOOK_TICKS, REACH_BARK_EVERY, CRY_RADIUS]).toEqual([2, 4, 220]);
    expect(REACH_HIGH_ENABLED).toBe(true);
  });

  test('growth: options, then the page, then crawl', () => {
    const def = page(line('A'));
    expect(babyGrowth(def)).toBe(0);
    expect(babyGrowth({ ...def, baby: { ...def.baby, growth: 2 } })).toBe(2);
    expect(babyGrowth({ ...def, baby: { ...def.baby, growth: 2 } }, { growth: 3 })).toBe(3);
  });

  test('compareRanked is a total order ending in the id', () => {
    const def = page({ nodes: [n('A', 0), n('L', -100), n('R', 100)], edges: [], attractors: [att('b', 'snack', 'L'), att('a', 'snack', 'R')] });
    const [a, b] = rankCandidates(def, initialState(def));
    expect([a.id, b.id]).toEqual(['a', 'b']);
    expect(compareRanked(a, b)).toBe(-1);
    expect(compareRanked(b, a)).toBe(1);
    expect(compareRanked(a, a)).toBe(0);
  });
});

describe('reaching barks every 4 ticks', () => {
  test('「要！要！」 on ticks 0, 4, 8 of reaching', () => {
    const def = page({ nodes: [n('A', 0), n('X', 100)], edges: [], attractors: [att('bead', 'shiny', 'X')] });
    let s = withBaby(initialState(def), { target: 'bead', mode: 'moving' });
    const barks: number[] = [];
    for (let t = 0; t < 10; t++) {
      const r = babyTick(def, s);
      if (r.events.some((ev) => ev.bark === 'wantWant')) barks.push(t);
      s = r.state;
    }
    expect(barks).toEqual([0, 4, 8]);
  });

  test('a target chosen while already in place barks 「要！」, not both', () => {
    const def = page({ nodes: [n('A', 0), n('X', 100)], edges: [], attractors: [att('bead', 'shiny', 'X')] });
    expect(babyTick(def, initialState(def)).events).toEqual([{ type: 'bark', id: 'bead', bark: 'want' }]);
  });
});

describe('refused (不要！ bookkeeping, § 2.4)', () => {
  const def = page({
    ...line('ABC'),
    parts: [{ id: 'flap', preset: 'flap', initial: 'open', hit: { cx: 0, cy: 0, r: 1 }, art: 'x' }],
    attractors: [att('bead', 'shiny', 'C', { visibleWhen: { part: 'flap', in: ['open'] } }), att('milk', 'snack', 'B')],
  });

  test('clears when he arrives at his new target', () => {
    const s = withBaby(initialState(def), { refused: ['bead'] });
    const r = babyTick(def, s);
    expect(r.state.baby).toMatchObject({ mode: 'eating', node: 'B', refused: [] });
  });

  test('stays while he is on his way', () => {
    const far = page({ ...line('ABCD'), attractors: [att('bead', 'shiny', 'B'), att('milk', 'snack', 'D')] });
    const r = babyTick(far, withBaby(initialState(far), { refused: ['bead'] }));
    expect(r.state.baby).toMatchObject({ mode: 'moving', refused: ['bead'], target: 'milk' });
  });

  test('clears when the refused attractor changes state (hidden or revealed)', () => {
    const open = withBaby(initialState(def), { refused: ['bead'] });
    const closed: SimState = { ...open, parts: { flap: 'closed' } };
    expect(keepRefusals(def, open, closed)).toEqual([]);
    expect(keepRefusals(def, closed, open)).toEqual([]);
    expect(keepRefusals(def, open, open)).toEqual(['bead']);
    // Revealed again this tick: the bead is wanted again.
    expect(babyTick(def, open, { prev: closed }).state.baby.target).toBe('bead');
    expect(babyTick(def, open, { prev: open }).state.baby.target).toBe('milk');
  });

  test('a refused Mocha clears when he moves perch; an unknown id never changes', () => {
    const d = page({ nodes: [...line('AB').nodes, n('P', 0, -100, 1), n('Q', 100, -100, 1)], edges: line('AB').edges, perches: [{ id: 'p', node: 'P', reachNode: 'A' }, { id: 'q', node: 'Q', reachNode: 'B' }], mocha: { start: 'p' } });
    const s = withBaby(initialState(d), { refused: [MOCHA, 'ghost'] });
    expect(keepRefusals(d, s, { ...s, mocha: { perch: 'q', path: [] } })).toEqual(['ghost']);
    expect(keepRefusals(d, s, s)).toEqual([MOCHA, 'ghost']);
    // An attractor on an unknown node keeps its refusal while it stays there.
    const lost = page({ ...line('A'), attractors: [att('bead', 'shiny', 'nowhere')] });
    const ls = withBaby(initialState(lost), { refused: ['bead'] });
    expect(keepRefusals(lost, ls, ls)).toEqual(['bead']);
  });

  test('refusing his only want sends him looking', () => {
    const only = page({ ...line('AB'), attractors: [att('bead', 'shiny', 'B')] });
    expect(babyTick(only, withBaby(initialState(only), { refused: ['bead'], target: 'bead' })).state.baby.mode).toBe('looking');
  });
});

describe('candidates and ranking', () => {
  test('heldBy: at the creature’s node, gone while it is off the page', () => {
    const def = page({ ...line('AB'), creatures: [{ id: 'squirrel', positions: { tree: 'B', away: 'offpage' }, initial: 'tree', blocks: false, art: 'x' }], attractors: [att('bead', 'shiny', 'A', { heldBy: 'squirrel' })] });
    const s = initialState(def);
    expect(attractorNode(def, s, def.attractors[0])).toBe('B');
    expect(attractorNode(def, { ...s, creatures: { squirrel: 'away' } }, def.attractors[0])).toBeNull();
    expect(attractorNode(def, s, att('x', 'shiny', 'A', { heldBy: 'nobody' }))).toBeNull();
    expect(attractorNode(def, { ...s, creatures: {} }, def.attractors[0])).toBeNull();
    expect(attractorNode(def, { ...s, creatures: { squirrel: 'lost' } }, def.attractors[0])).toBeNull();
  });

  test('followsPushable: on the perch, gone mid-fall, at fallTo once landed', () => {
    const def = page({ ...line('AB'), parts: [{ id: 'cake', preset: 'pushable', fall: { path: [[0, 0]], fallTo: 'B' }, hit: { cx: 0, cy: 0, r: 1 }, art: 'x' }], attractors: [att('treat', 'snack', 'A', { followsPushable: 'cake' })] });
    const a = def.attractors[0];
    const s = initialState(def);
    expect(attractorNode(def, s, a)).toBe('A');
    expect(attractorNode(def, { ...s, pushables: { cake: 'falling' } }, a)).toBeNull();
    expect(attractorNode(def, { ...s, pushables: { cake: 'landed' } }, a)).toBe('B');
    const noFall = { ...def, parts: [{ ...def.parts[0], fall: undefined }] };
    expect(attractorNode(noFall, { ...s, pushables: { cake: 'landed' } }, a)).toBe('A');
    expect(attractorNode({ ...def, parts: [] }, { ...s, pushables: { cake: 'landed' } }, a)).toBe('A');
  });

  test('nodeBy falls back to the attractor’s node for unmapped states', () => {
    const def = page({ ...line('AB'), attractors: [att('glow', 'light', 'B', { nodeBy: { part: 'missing', map: {} } })] });
    expect(attractorNode(def, initialState(def), def.attractors[0])).toBe('B');
  });

  test('Mocha is listed last and only when settled on a known perch', () => {
    const def = page({ nodes: [...line('AB').nodes, n('P', 0, -100, 1)], edges: line('AB').edges, perches: [perchP], mocha: { start: 'shelf' }, attractors: [att('milk', 'snack', 'A')] });
    const s = initialState(def);
    expect(candidates(def, s).map((c) => c.id)).toEqual(['milk', MOCHA]);
    expect(candidates(def, { ...s, mocha: { perch: 'nowhere', path: [] } }).map((c) => c.id)).toEqual(['milk']);
    expect(candidates(def, withBaby(s, { refused: [MOCHA] })).map((c) => c.id)).toEqual(['milk']);
  });

  test('rankCandidates exposes the sort key; selectTarget is its head', () => {
    const def = page({ nodes: [...line('ABC').nodes, n('X', 500)], edges: line('ABC').edges, attractors: [att('milk', 'snack', 'B'), att('bead', 'shiny', 'X'), att('coin', 'shiny', 'C')] });
    const ranked = rankCandidates(def, initialState(def));
    expect(ranked.map((r) => [r.id, r.priority, r.approach, r.steps, r.d2])).toEqual([
      ['coin', 1, 'C', 2, 40000],
      ['bead', 1, null, Infinity, 250000],
      ['milk', 3, 'B', 1, 10000],
    ]);
    expect(selectTarget(def, initialState(def))?.id).toBe('coin');
    expect(selectTarget(page(line('A')), initialState(page(line('A'))))).toBeNull();
  });

  test('an attractor on an unknown node is unreachable and infinitely far; he stays and reaches', () => {
    const def = page({ ...line('AB'), attractors: [att('bead', 'shiny', 'nowhere')] });
    const [r] = rankCandidates(def, initialState(def));
    expect(r).toMatchObject({ approach: null, d2: Infinity });
    expect(babyTick(def, initialState(def)).state.baby).toMatchObject({ mode: 'reaching', node: 'A', facing: 'r' });
  });

  test('a baby on an unknown node: unreachable everything, no position for the cry', () => {
    const def = page(line('AB'));
    const s = withBaby(initialState(def), { node: 'void', mode: 'crying' });
    expect(babyTick(def, s).events).toEqual([{ type: 'cry', within: CRY_RADIUS }]);
    const want = page({ ...line('AB'), attractors: [att('bead', 'shiny', 'B')] });
    expect(babyTick(want, withBaby(initialState(want), { node: 'void' })).state.baby).toMatchObject({ node: 'void', mode: 'reaching' });
  });

  test('reachHigh picks the adjacent node with the shortest path', () => {
    const def = page({
      nodes: [n('A', 0), n('B', 100), n('C', 300), n('H', 200, -60, 1), n('K', 200, -200, 2)],
      edges: [e('A', 'B'), e('B', 'C'), e('B', 'H', { kind: 'jump', when: { flag: 'x' } }), e('C', 'H', { kind: 'jump' }), e('H', 'K', { kind: 'jump' })],
      attractors: [att('bead', 'shiny', 'H', { height: 1 })],
      baby: { start: 'A', facing: 'r', growth: 3 },
    });
    // B–H is closed, so only C counts as adjacent (K is adjacent but out of reach).
    expect(selectTarget(def, initialState(def), { reachHigh: true })).toMatchObject({ approach: 'C', steps: 2 });
    const open = { ...initialState(def), flags: ['x'] };
    expect(selectTarget(def, open, { reachHigh: true })).toMatchObject({ approach: 'B', steps: 1 });
  });
});

describe('determinism: a 50-tick scenario on c1p2', () => {
  /** A scripted run: page changes at fixed ticks stand in for the player (the real step is #84). */
  function run(): string[] {
    const script: Record<number, (s: SimState) => SimState> = {
      5: (s) => ({ ...s, parts: { ...s.parts, train: 'half' } }),
      12: (s) => ({ ...s, baby: { ...s.baby, refused: ['bead'] } }), // 不要！ while reaching
      20: (s) => ({ ...s, mocha: { perch: 'pillar', path: [] }, creatures: { pigeon: 'away' } }),
      30: (s) => ({ ...s, parts: { ...s.parts, train: 'full' } }),
    };
    let s = initialState(c1p2);
    const log: string[] = [];
    for (let tick = 1; tick <= 50; tick++) {
      const prev = s;
      s = { ...s, tick };
      if (script[tick]) s = script[tick](s);
      const r = babyTick(c1p2, s, { prev });
      s = r.state;
      const b = s.baby;
      log.push(`${tick} ${b.node} ${b.mode} ${b.facing} →${b.target ?? '-'}${r.events.map((ev) => ` ${ev.type}${ev.id ? `:${ev.id}` : ''}${ev.bark ? `(${BARK_TEXT[ev.bark]})` : ''}`).join('')}`);
    }
    return log;
  }

  test('two runs give identical event logs (snapshot)', () => {
    const a = run();
    expect(run()).toEqual(a);
    expect(a).toMatchSnapshot();
    expect(a.at(-1)).toMatch(/done/);
  });
});
