import { describe, expect, test } from 'vitest';
import c1p2 from './fixtures/c1p2';
import { candidates, MOCHA } from './baby';
import type { SimEvent } from './events';
import { walkGraph } from './graph';
import {
  buttonWeighed,
  catLocked,
  catPath,
  MOCHA_EDGES_PER_TICK,
  mochaAttractorNode,
  mochaCommand,
  mochaNode,
  mochaPet,
  mochaSettled,
  mochaTick,
  perchHidesMocha,
  perchRefusal,
} from './mocha';
import { canonicalKey, initialState } from './state';
import type { EdgeDef, Input, NodeDef, PageDef, PartDef, PerchDef, SimState } from './types';

/** A tiny page; everything not passed is empty. */
function page(p: Partial<PageDef>): PageDef {
  return {
    id: 'toy',
    chapter: 0,
    index: 1,
    title: '玩具',
    difficulty: 1,
    backdrop: 'toy',
    nodes: [],
    edges: [],
    parts: [],
    perches: [],
    attractors: [],
    creatures: [],
    baby: { start: 'F', facing: 'r' },
    mocha: { start: 'p1' },
    mischief: { text: '', when: { type: 'ride' } },
    tudigong: { x: 0, y: 0, hat: '' },
    solution: [],
    ...p,
  };
}
const n = (id: string, x: number, y = 200, height: 0 | 1 | 2 = 2, more: Partial<NodeDef> = {}): NodeDef => ({ id, x, y, height, ...more });
const jump = (a: string, b: string, more: Partial<EdgeDef> = {}): EdgeDef => ({ a, b, kind: 'jump', ...more });
const perch = (id: string, node: string, more: Partial<PerchDef> = {}): PerchDef => ({ id, node, reachNode: 'F', ...more });
const hit = { cx: 0, cy: 0, r: 30 };
const part = (id: string, preset: PartDef['preset'], more: Partial<PartDef> = {}): PartDef => ({ id, preset, hit, art: 'x', ...more });

/**
 * The floor `F` and a row of high nodes P1–P4 joined by jumps, a perch on each (p1–p4, Baokaka
 * comes to `F` for him). Mocha starts on p1. `perches` patches individual perches.
 */
function row(p: Partial<PageDef> & { perchMore?: Record<string, Partial<PerchDef>>; nodeMore?: Record<string, Partial<NodeDef>> } = {}): PageDef {
  const { perchMore = {}, nodeMore = {}, ...rest } = p;
  return page({
    nodes: [n('F', 0, 400, 0), ...['P1', 'P2', 'P3', 'P4'].map((id, i) => n(id, i * 100, 200, 2, nodeMore[id]))],
    edges: [jump('P1', 'P2'), jump('P2', 'P3'), jump('P3', 'P4')],
    perches: ['p1', 'p2', 'p3', 'p4'].map((id, i) => perch(id, `P${i + 1}`, perchMore[id])),
    ...rest,
  });
}

type Step = { mocha: string } | { pet: true } | 'wait';

/** Runs Mocha's phases of the tick (1: the input, 3: mochaTick) for each step; events per tick. */
function play(def: PageDef, steps: Step[], start: SimState = initialState(def)): { state: SimState; ticks: SimEvent[][] } {
  let state = start;
  const ticks: SimEvent[][] = [];
  for (const step of steps) {
    const inp: Input = step === 'wait' ? { t: 'none' } : 'pet' in step ? { t: 'pet' } : { t: 'mocha', perch: step.mocha };
    const input = inp.t === 'pet' ? mochaPet(def, state) : inp.t === 'mocha' ? mochaCommand(def, state, inp.perch) : { state, events: [] };
    const tick = mochaTick(def, input.state, inp);
    state = tick.state;
    ticks.push([...input.events, ...tick.events]);
  }
  return { state, ticks };
}

interface Row {
  rule: string;
  def: PageDef;
  state?: (s: SimState) => SimState;
  steps: Step[];
  /** Expected subset of the final state. */
  expect: {
    mocha?: SimState['mocha'];
    parts?: SimState['parts'];
    pushables?: SimState['pushables'];
    creatures?: SimState['creatures'];
  };
  /** Expected events, per tick. */
  ticks?: SimEvent[][];
  /** Expected node where Baokaka would go for Mocha (C5), or null when Mocha isn't an attractor. */
  attractor?: string | null;
}

const button = part('btn', 'button');
const lockTab = part('tab', 'tab', { states: ['stop0', 'stop1'], lockedByCat: true });
const pigeon = { id: 'pigeon', positions: { here: 'F', away: 'offpage' as const }, initial: 'here', blocks: false, fleesFromCat: { nearPerches: ['p2'], to: 'away' }, art: 'x' };
const coin = part('coin', 'pushable', { fall: { path: [[100, 200], [100, 400]], fallTo: 'F' } });

const rows: Row[] = [
  // C1 Likes high places: perches are the only places he occupies.
  { rule: 'C1 a trip ends settled on a perch', def: row(), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p2', path: [] } }, ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]] },
  { rule: 'C1 a node that is not a perch cannot be tapped: mochaNope, nothing changes', def: row({ edges: [jump('P1', 'P2'), jump('P1', 'F')] }), steps: [{ mocha: 'F' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaNope', id: 'F' }]] },
  { rule: 'C1 2 edges per tick; mid-trip he is in the air, not on a perch', def: row(), steps: [{ mocha: 'p4' }],
    expect: { mocha: { perch: null, path: ['P3', 'P4'], to: 'p4' } }, ticks: [[{ type: 'catLeave', id: 'p1' }]] },
  { rule: 'C1 … and lands on the next tick', def: row(), steps: [{ mocha: 'p4' }, 'wait'],
    expect: { mocha: { perch: 'p4', path: [] } }, ticks: [[{ type: 'catLeave', id: 'p1' }], [{ type: 'catArrive', id: 'p4' }]] },
  { rule: 'C1 no open way: mochaNope, nothing changes', def: row({ edges: [jump('P1', 'P2', { when: { flag: 'plank' } })] }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaNope', id: 'p2' }]] },

  // C2 Squeezes through gaps.
  { rule: 'C2 a squeeze edge takes him where Baokaka cannot go', def: row({ edges: [{ a: 'P1', b: 'P2', kind: 'squeeze' }] }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p2', path: [] } } },
  { rule: 'C2 crawl edges are not his', def: row({ edges: [{ a: 'P1', b: 'P2', kind: 'crawl' }] }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaNope', id: 'p2' }]] },

  // C3 Knocks things off (the whole beat is in the push tests below).
  { rule: 'C3 arriving at a push perch: one tick of eye contact first', def: row({ parts: [coin], perchMore: { p2: { push: 'coin' } } }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p2', path: [], stare: 'coin' }, pushables: { coin: 'onPerch' } },
    ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }, { type: 'mochaStare', id: 'coin' }]] },

  // C4 Sits on things.
  { rule: 'C4 sitting on a button holds it down', def: row({ parts: [button], perchMore: { p2: { onPart: 'btn' } } }), steps: [{ mocha: 'p2' }],
    expect: { parts: { btn: 'down' } }, ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }, { type: 'partEnter', id: 'btn', state: 'down' }]] },
  { rule: 'C4 leaving the button releases it', def: row({ parts: [button], perchMore: { p2: { onPart: 'btn' } } }), steps: [{ mocha: 'p2' }, { mocha: 'p3' }],
    expect: { parts: { btn: 'up' }, mocha: { perch: 'p3', path: [] } },
    ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }, { type: 'partEnter', id: 'btn', state: 'down' }],
      [{ type: 'catLeave', id: 'p2' }, { type: 'partEnter', id: 'btn', state: 'up' }, { type: 'catArrive', id: 'p3' }]] },
  { rule: 'C4 a lockedByCat part he sits on keeps its state (the lock is read, not stored)', def: row({ parts: [lockTab], perchMore: { p2: { onPart: 'tab' } } }), steps: [{ mocha: 'p2' }],
    expect: { parts: { tab: 'stop0' } }, ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]] },

  // C5 Is irresistible.
  { rule: 'C5 settled and visible: an attractor at the perch\'s reachNode', def: row({ perchMore: { p2: { reachNode: 'P2' } } }), steps: [{ mocha: 'p2' }],
    expect: {}, attractor: 'P2' },
  { rule: 'C5 mid-jump he is not an attractor', def: row(), steps: [{ mocha: 'p4' }], expect: {}, attractor: null },

  // C6 Scares birds.
  { rule: 'C6 arriving at a near perch sends the creature away', def: row({ creatures: [pigeon] }), steps: [{ mocha: 'p2' }],
    expect: { creatures: { pigeon: 'away' } } },
  { rule: 'C6 other perches do not scare it', def: row({ creatures: [pigeon], edges: [jump('P1', 'P3')] }), steps: [{ mocha: 'p3' }],
    expect: { creatures: { pigeon: 'here' }, mocha: { perch: 'p3', path: [] } } },

  // C7 Hates water and steam.
  { rule: 'C7 a wet perch: his fur puffs up (mochaPuff), nothing changes', def: row({ nodeMore: { P2: { tags: ['wet'] } } }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaPuff', id: 'p2' }]] },
  { rule: 'C7 a steamy perch whose blockedWhen holds: mochaPuff', def: row({ parts: [part('vent', 'flap')], nodeMore: { P2: { tags: ['steam'] } }, perchMore: { p2: { blockedWhen: { part: 'vent', in: ['closed'] } } } }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaPuff', id: 'p2' }]] },
  { rule: 'C7 … and once the steam clears, he goes', def: row({ parts: [part('vent', 'flap')], nodeMore: { P2: { tags: ['steam'] } }, perchMore: { p2: { blockedWhen: { part: 'vent', in: ['closed'] } } } }),
    state: (s) => ({ ...s, parts: { vent: 'open' } }), steps: [{ mocha: 'p2' }], expect: { mocha: { perch: 'p2', path: [] } } },
  { rule: 'C7 he will not cross a wet perch on the way somewhere else', def: row({ nodeMore: { P2: { tags: ['wet'] } } }), steps: [{ mocha: 'p3' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaNope', id: 'p3' }]] },

  // C8 Won't step on glass.
  { rule: 'C8 a glass perch is unreachable: mochaNope', def: row({ nodeMore: { P2: { tags: ['glass'] } } }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaNope', id: 'p2' }]] },
  { rule: 'C8 … even with a blockedWhen that is false', def: row({ nodeMore: { P2: { tags: ['glass'] } }, perchMore: { p2: { blockedWhen: { flag: 'never' } } } }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaNope', id: 'p2' }]] },
  { rule: 'blockedWhen on an untagged perch: mochaNope while it holds', def: row({ perchMore: { p2: { blockedWhen: { not: { flag: 'dry' } } } } }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[{ type: 'mochaNope', id: 'p2' }]] },

  // C9 Is curious about boxes (visibility: see the C5/C9 tests below).
  { rule: 'C9 he sits in a box perch like any other, and is hidden there', def: row({ nodeMore: { P2: { tags: ['box'] } } }), steps: [{ mocha: 'p2' }],
    expect: { mocha: { perch: 'p2', path: [] } }, attractor: null },

  // Arrival actions.
  { rule: 'set: arrival pulls the cord', def: row({ parts: [part('lamp', 'light')], perchMore: { p2: { set: { part: 'lamp', to: 'on' } } } }), steps: [{ mocha: 'p2' }],
    expect: { parts: { lamp: 'on' } }, ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }, { type: 'partEnter', id: 'lamp', state: 'on' }]] },
  { rule: 'set: a locked part (lockedWhen) does not move', def: row({ parts: [part('lamp', 'light', { lockedWhen: { flag: 'fuse' } })], perchMore: { p2: { set: { part: 'lamp', to: 'on' } } } }),
    state: (s) => ({ ...s, flags: ['fuse'] }), steps: [{ mocha: 'p2' }], expect: { parts: { lamp: 'off' } }, ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]] },
  { rule: 'set: a state whose stateWhen fails is jammed', def: row({ parts: [part('lamp', 'light', { stateWhen: { on: { flag: 'power' } } })], perchMore: { p2: { set: { part: 'lamp', to: 'on' } } } }),
    steps: [{ mocha: 'p2' }], expect: { parts: { lamp: 'off' } } },
  { rule: 'set: lockedByCat does not stop the cat himself', def: row({ parts: [lockTab], perchMore: { p2: { onPart: 'tab', set: { part: 'tab', to: 'stop1' } } } }),
    steps: [{ mocha: 'p2' }], expect: { parts: { tab: 'stop1' } } },
  { rule: 'set: an unknown part or state is ignored', def: row({ parts: [part('lamp', 'light')], perchMore: { p2: { set: { part: 'lamp', to: 'blinking' } }, p3: { set: { part: 'nope', to: 'on' } } } }),
    steps: [{ mocha: 'p2' }, { mocha: 'p3' }], expect: { parts: { lamp: 'off' }, mocha: { perch: 'p3', path: [] } } },
  { rule: 'set cannot move a pushable', def: row({ parts: [coin], perchMore: { p2: { set: { part: 'coin', to: 'landed' } } } }),
    steps: [{ mocha: 'p2' }], expect: { pushables: { coin: 'onPerch' } }, ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]] },
  { rule: 'onPart on a part that is neither a button nor lockable: just catArrive', def: row({ parts: [part('lift', 'lift', { states: ['floor0', 'floor1'] })], perchMore: { p2: { onPart: 'lift' } } }),
    steps: [{ mocha: 'p2' }], expect: { parts: { lift: 'floor0' } }, ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]] },
  { rule: 'actions run in order: press, set, scare, then the stare', def: row({ parts: [button, part('lamp', 'light'), coin], creatures: [pigeon], perchMore: { p2: { onPart: 'btn', set: { part: 'lamp', to: 'on' }, push: 'coin' } } }),
    steps: [{ mocha: 'p2' }], expect: { parts: { btn: 'down', lamp: 'on' }, creatures: { pigeon: 'away' }, mocha: { perch: 'p2', path: [], stare: 'coin' } },
    ticks: [[{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }, { type: 'partEnter', id: 'btn', state: 'down' }, { type: 'partEnter', id: 'lamp', state: 'on' }, { type: 'mochaStare', id: 'coin' }]] },

  // Pet.
  { rule: 'pet re-presses the button he sits on (partEnter again, still down)', def: row({ parts: [button], perchMore: { p1: { onPart: 'btn' } } }),
    state: (s) => ({ ...s, parts: { btn: 'down' } }), steps: [{ pet: true }], expect: { parts: { btn: 'down' } }, ticks: [[{ type: 'partEnter', id: 'btn', state: 'down' }]] },
  { rule: 'pet pulls the cord again', def: row({ parts: [part('lamp', 'light')], perchMore: { p1: { set: { part: 'lamp', to: 'on' } } } }),
    steps: [{ pet: true }], expect: { parts: { lamp: 'on' } }, ticks: [[{ type: 'partEnter', id: 'lamp', state: 'on' }]] },
  { rule: 'pet does not scare creatures again or emit catArrive', def: row({ creatures: [pigeon], mocha: { start: 'p2' } }),
    state: (s) => ({ ...s, creatures: { pigeon: 'here' } }), steps: [{ pet: true }], expect: { creatures: { pigeon: 'here' } }, ticks: [[]] },
  { rule: 'pet on a perch without actions does nothing', def: row(), steps: [{ pet: true }], expect: { mocha: { perch: 'p1', path: [] } }, ticks: [[]] },
  { rule: 'pet while travelling does nothing', def: row({ parts: [button], perchMore: { p4: { onPart: 'btn' } } }), steps: [{ mocha: 'p4' }, { pet: true }],
    expect: { mocha: { perch: 'p4', path: [] } }, ticks: [[{ type: 'catLeave', id: 'p1' }], [{ type: 'catArrive', id: 'p4' }, { type: 'partEnter', id: 'btn', state: 'down' }]] },
];

describe('Mocha: one row per cat rule (GDD § 2.3) and per arrival action', () => {
  test('every rule C1–C9 has a row', () => {
    for (let c = 1; c <= 9; c++) expect(rows.some((r) => r.rule.startsWith(`C${c} `))).toBe(true);
  });

  test.each(rows.map((r) => [r.rule, r] as const))('%s', (_, row) => {
    const start = row.state ? row.state(initialState(row.def)) : initialState(row.def);
    const { state, ticks } = play(row.def, row.steps, start);
    const got: Row['expect'] = {};
    for (const key of Object.keys(row.expect) as (keyof Row['expect'])[]) got[key] = state[key] as never;
    expect(got).toEqual(row.expect);
    if (row.ticks) expect(ticks).toEqual(row.ticks);
    if (row.attractor !== undefined) expect(mochaAttractorNode(row.def, state)).toBe(row.attractor);
  });
});

describe('C3: the push, beat by beat', () => {
  const def = row({ parts: [coin], perchMore: { p2: { push: 'coin' } }, attractors: [{ id: 'bead', kind: 'shiny', node: 'P2', followsPushable: 'coin' }] });

  test('arrive + stare → push (falling) → land: three real ticks', () => {
    const { state, ticks } = play(def, [{ mocha: 'p2' }, 'wait', 'wait']);
    expect(ticks).toEqual([
      [{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }, { type: 'mochaStare', id: 'coin' }],
      [{ type: 'push', id: 'coin' }],
      [{ type: 'land', id: 'coin' }],
    ]);
    expect(state.pushables.coin).toBe('landed');
    expect(state.mocha).toEqual({ perch: 'p2', path: [] });
  });

  test('the stare tick is a state of its own (the view plays it); he is settled and visible', () => {
    const stare = play(def, [{ mocha: 'p2' }]).state;
    expect(stare.mocha.stare).toBe('coin');
    expect(mochaSettled(stare)).toBe(true);
    expect(mochaAttractorNode(def, stare)).toBe('F');
    const falling = play(def, ['wait'], stare).state;
    expect(falling.pushables.coin).toBe('falling');
    expect(falling.mocha.stare).toBeUndefined();
    expect(candidates(def, falling).map((c) => c.id)).toEqual([MOCHA]); // the bead is mid-air
  });

  test('pushables are one-way: once landed, nothing he does brings it back', () => {
    let { state } = play(def, [{ mocha: 'p2' }, 'wait', 'wait']);
    const seen = new Set<string>();
    for (const step of [{ pet: true }, 'wait', { mocha: 'p1' }, { mocha: 'p2' }, { pet: true }, 'wait', 'wait'] as Step[]) {
      ({ state } = play(def, [step], state));
      seen.add(state.pushables.coin);
      expect(state.mocha.stare).toBeUndefined();
    }
    expect([...seen]).toEqual(['landed']);
  });

  test('only a page reaction can put it back; then pet pushes it again', () => {
    const landed = play(def, [{ mocha: 'p2' }, 'wait', 'wait']).state;
    const reset = { ...landed, pushables: { coin: 'onPerch' as const } }; // stands in for a #84 reaction
    const { state, ticks } = play(def, [{ pet: true }, 'wait', 'wait'], reset);
    expect(ticks).toEqual([[{ type: 'mochaStare', id: 'coin' }], [{ type: 'push', id: 'coin' }], [{ type: 'land', id: 'coin' }]]);
    expect(state.pushables.coin).toBe('landed');
  });

  test('pet during the stare does nothing more', () => {
    const stare = play(def, [{ mocha: 'p2' }]).state;
    expect(mochaPet(def, stare)).toEqual({ state: stare, events: [] });
  });

  test('setting off during the stare cancels the push', () => {
    const { state, ticks } = play(def, [{ mocha: 'p2' }, { mocha: 'p1' }, 'wait']);
    expect(ticks[1]).toEqual([{ type: 'catLeave', id: 'p2' }, { type: 'catArrive', id: 'p1' }]);
    expect(state.pushables.coin).toBe('onPerch');
  });

  test('a landed pushable keeps falling to the floor even after he leaves', () => {
    const { state, ticks } = play(def, [{ mocha: 'p2' }, 'wait', { mocha: 'p3' }]);
    expect(ticks[2]).toEqual([{ type: 'land', id: 'coin' }, { type: 'catLeave', id: 'p2' }, { type: 'catArrive', id: 'p3' }]);
    expect(state.pushables.coin).toBe('landed');
  });

  test('landSets: the landing presses a button, which then counts as weight', () => {
    const plate = row({
      parts: [button, part('coin', 'pushable', { fall: { path: [], fallTo: 'F', landSets: { part: 'btn', to: 'down' } } })],
      perchMore: { p2: { push: 'coin' }, p1: { onPart: 'btn' } },
    });
    const start = { ...initialState(plate), parts: { btn: 'down' } };
    const { state, ticks } = play(plate, [{ mocha: 'p2' }, 'wait', 'wait', { mocha: 'p1' }, { mocha: 'p2' }], start);
    expect(ticks[0]).toEqual([{ type: 'catLeave', id: 'p1' }, { type: 'partEnter', id: 'btn', state: 'up' }, { type: 'catArrive', id: 'p2' }, { type: 'mochaStare', id: 'coin' }]);
    expect(ticks[2]).toEqual([{ type: 'land', id: 'coin' }, { type: 'partEnter', id: 'btn', state: 'down' }]);
    expect(buttonWeighed(plate, state, 'btn')).toBe(true);
    expect(ticks[4]).toEqual([{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]); // no release: the coin holds it
    expect(state.parts.btn).toBe('down');
  });
});

describe('C4: buttons and cat locks', () => {
  const def = row({ parts: [button, lockTab], perchMore: { p2: { onPart: 'btn' }, p3: { onPart: 'tab' } } });

  test('catLocked: only a lockedByCat part he is settled on', () => {
    const onTab = play(def, [{ mocha: 'p2' }, { mocha: 'p3' }]).state;
    expect(catLocked(def, onTab, 'tab')).toBe(true);
    expect(catLocked(def, onTab, 'btn')).toBe(false);
    const onButton = play(def, [{ mocha: 'p2' }]).state;
    expect(catLocked(def, onButton, 'tab')).toBe(false);
    const unlockable = row({ parts: [part('tab', 'tab', { states: ['a', 'b'] })], perchMore: { p1: { onPart: 'tab' } } });
    expect(catLocked(unlockable, initialState(unlockable), 'tab')).toBe(false);
  });

  test('leaving lifts the lock by itself', () => {
    const left = play(def, [{ mocha: 'p3' }, { mocha: 'p4' }]).state;
    expect(catLocked(def, left, 'tab')).toBe(false);
    const mid = mochaCommand(def, play(def, [{ mocha: 'p3' }]).state, 'p1').state; // set out, not yet left
    expect(catLocked(def, mid, 'tab')).toBe(false);
  });

  test('Baokaka on a node attached to the button is weight: leaving does not release it', () => {
    const plate = row({
      nodes: [n('F', 0, 400, 0, { attach: { part: 'btn', pos: { up: [0, 400], down: [0, 404] } } }), n('P1', 0), n('P2', 100)],
      edges: [jump('P1', 'P2')],
      parts: [button],
      perches: [perch('p1', 'P1', { onPart: 'btn' }), perch('p2', 'P2')],
    });
    const start = { ...initialState(plate), parts: { btn: 'down' } };
    expect(buttonWeighed(plate, start, 'btn')).toBe(true);
    const { state, ticks } = play(plate, [{ mocha: 'p2' }], start);
    expect(ticks[0]).toEqual([{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]);
    expect(state.parts.btn).toBe('down');
  });

  test('leaving a button that is already up emits nothing extra', () => {
    const start = initialState(row({ parts: [button], perchMore: { p1: { onPart: 'btn' } } }));
    const d = row({ parts: [button], perchMore: { p1: { onPart: 'btn' } } });
    expect(play(d, [{ mocha: 'p2' }], start).ticks[0]).toEqual([{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'p2' }]);
  });
});

describe('C5 and C9: Mocha as an attractor', () => {
  test('C5 settled and visible: a priority-2 candidate at the reachNode; not mid-trip', () => {
    const def = row({ perchMore: { p4: { reachNode: 'P4' } } });
    const start = initialState(def);
    expect(mochaAttractorNode(def, start)).toBe('F');
    expect(candidates(def, start)).toEqual([{ id: MOCHA, kind: 'mocha', node: 'F', height: 0, decoy: false, goal: false }]);
    const mid = play(def, [{ mocha: 'p4' }]).state;
    expect(mochaAttractorNode(def, mid)).toBeNull();
    expect(candidates(def, mid)).toEqual([]);
    expect(mochaAttractorNode(def, play(def, ['wait'], mid).state)).toBe('P4');
  });

  test('C5 a perch without reachNode: the perch node itself', () => {
    const def = row({ perchMore: { p1: { reachNode: undefined } } });
    expect(mochaAttractorNode(def, initialState(def))).toBe('P1');
  });

  test('C9 a box perch hides him (hidesMocha or a box tag)', () => {
    const tagged = row({ nodeMore: { P2: { tags: ['box'] } }, perchMore: { p3: { hidesMocha: true } } });
    expect(perchHidesMocha(tagged, tagged.perches[1])).toBe(true);
    expect(perchHidesMocha(tagged, tagged.perches[2])).toBe(true);
    expect(perchHidesMocha(tagged, tagged.perches[0])).toBe(false);
    const inBox = play(tagged, [{ mocha: 'p2' }]).state;
    expect(mochaAttractorNode(tagged, inBox)).toBeNull();
    expect(candidates(tagged, inBox)).toEqual([]);
    expect(candidates(tagged, play(tagged, [{ mocha: 'p3' }], inBox).state)).toEqual([]);
    expect(candidates(tagged, play(tagged, [{ mocha: 'p4' }], inBox).state).map((c) => c.id)).toEqual([MOCHA]);
  });

  test('not on the page: no attractor, and taps do nothing', () => {
    const def = row({ mocha: { start: null } });
    const start = initialState(def);
    expect(mochaAttractorNode(def, start)).toBeNull();
    expect(mochaNode(def, start)).toBeNull();
    expect(mochaCommand(def, start, 'p2')).toEqual({ state: start, events: [] });
    expect(mochaPet(def, start)).toEqual({ state: start, events: [] });
    expect(mochaTick(def, start)).toEqual({ state: start, events: [] });
    expect(catPath(def, start, 'p2')).toBeNull();
  });
});

describe('pathing', () => {
  test(`he travels ${MOCHA_EDGES_PER_TICK} edges per tick over the shortest cat path`, () => {
    const def = row({ edges: [jump('P1', 'P2'), jump('P2', 'P3'), jump('P3', 'P4'), jump('P1', 'P3')] });
    expect(catPath(def, initialState(def), 'p4')).toEqual(['P1', 'P3', 'P4']);
    expect(play(def, [{ mocha: 'p4' }]).state.mocha).toEqual({ perch: 'p4', path: [] });
  });

  test('tapping the perch he is on, or the one he is heading for, does nothing', () => {
    const def = row();
    const start = initialState(def);
    expect(mochaCommand(def, start, 'p1')).toEqual({ state: start, events: [] });
    const mid = play(def, [{ mocha: 'p4' }]).state;
    expect(mochaCommand(def, mid, 'p4')).toEqual({ state: mid, events: [] });
  });

  test('mid-trip he can be redirected from where he is', () => {
    const def = row();
    const { state, ticks } = play(def, [{ mocha: 'p4' }, { mocha: 'p2' }]);
    expect(ticks[1]).toEqual([{ type: 'catArrive', id: 'p2' }]); // no catLeave: he was in the air
    expect(state.mocha).toEqual({ perch: 'p2', path: [] });
  });

  test('the path is committed: closing an edge mid-trip does not strand him', () => {
    const def = row({ edges: [jump('P1', 'P2'), jump('P2', 'P3'), jump('P3', 'P4', { when: { not: { flag: 'shut' } } })] });
    const mid = play(def, [{ mocha: 'p4' }]).state;
    expect(play(def, ['wait'], { ...mid, flags: ['shut'] }).state.mocha).toEqual({ perch: 'p4', path: [] });
  });

  test('two perches on one node: a zero-edge trip still leaves and arrives', () => {
    const def = row({ perches: [perch('p1', 'P1'), perch('cushion', 'P1')] });
    expect(play(def, [{ mocha: 'cushion' }]).ticks[0]).toEqual([{ type: 'catLeave', id: 'p1' }, { type: 'catArrive', id: 'cushion' }]);
  });

  test('a hand-made trip to no known perch ends with him off the page', () => {
    const def = row();
    const s = { ...initialState(def), mocha: { perch: null, path: ['P2'], to: 'ghost' } };
    expect(mochaTick(def, s)).toEqual({ state: { ...s, mocha: { perch: null, path: [] } }, events: [] });
  });

  test('a refused perch has no path, and neither does an unknown one', () => {
    const def = row({ nodeMore: { P2: { tags: ['wet'] } } });
    const start = initialState(def);
    expect(catPath(def, start, 'p2')).toBeNull();
    expect(catPath(def, start, 'ghost')).toBeNull();
    expect(mochaCommand(def, start, 'ghost').events).toEqual([{ type: 'mochaNope', id: 'ghost' }]);
  });

  test('perchRefusal names the reason', () => {
    const def = row({
      parts: [part('tap', 'flap')],
      nodeMore: { P1: { tags: ['wet'] }, P2: { tags: ['steam'] }, P3: { tags: ['glass'] } },
      perchMore: { p1: { blockedWhen: { part: 'tap', in: ['open'] } }, p4: { blockedWhen: { part: 'tap', in: ['closed'] } } },
    });
    const s = initialState(def);
    expect(def.perches.map((p) => perchRefusal(def, s, p))).toEqual([null, 'steam', 'glass', 'blocked']);
    const open = { ...s, parts: { tap: 'open' } };
    expect(def.perches.map((p) => perchRefusal(def, open, p))).toEqual(['wet', 'steam', 'glass', null]);
  });

  test('Baokaka never uses the cat edges (C2) and the cat avoid list never applies to him', () => {
    const def = row({ edges: [{ a: 'F', b: 'P1', kind: 'squeeze' }, { a: 'F', b: 'P2', kind: 'jump' }] });
    const s = initialState(def);
    expect(walkGraph(def, s, { who: 'baby', growth: 3 }).reachSet('F').nodes).toEqual(['F']);
    expect(walkGraph(def, s, { who: 'cat' }).reachSet('F').nodes).toEqual(['F', 'P1', 'P2']);
    expect(walkGraph(def, s, { who: 'cat', avoid: ['P1', 'ghost'] }).reachSet('F').nodes).toEqual(['F', 'P2']);
    expect(walkGraph(def, s, { who: 'cat', avoid: ['F'] }).reachSet('F').nodes).toEqual(['F', 'P1', 'P2']); // start never counts
  });

  test('c1p2: Mocha hops from the bench to the pillar and the pigeon flies off (GDD § 3.4)', () => {
    const { state, ticks } = play(c1p2, [{ mocha: 'pillar' }]);
    expect(ticks[0]).toEqual([{ type: 'catLeave', id: 'bench' }, { type: 'catArrive', id: 'pillar' }]);
    expect(state.creatures.pigeon).toBe('away');
    expect(mochaAttractorNode(c1p2, state)).toBe('R1');
  });
});

/** GDD § 4.3, page 0-3 「摩卡起床」: Mocha pushes the bead off the high table. */
const p03 = page({
  nodes: [n('rug', 160, 470, 0), n('underTable', 220, 470, 0), n('sofaArm', 60, 330, 1), n('tableTop', 240, 360, 1), n('shelfTop', 330, 240, 2)],
  edges: [{ a: 'rug', b: 'underTable', kind: 'crawl' }, jump('sofaArm', 'tableTop'), jump('tableTop', 'shelfTop')],
  parts: [
    part('bead', 'pushable', { fall: { path: [[240, 350], [200, 420], [160, 470]], fallTo: 'rug' } }),
    part('redEnvelope', 'pushable', { fall: { path: [[330, 230], [300, 470]], fallTo: 'underTable' } }),
  ],
  perches: [
    { id: 'sofaArm', node: 'sofaArm', reachNode: 'rug' },
    { id: 'table', node: 'tableTop', reachNode: 'underTable', push: 'bead' },
    { id: 'shelf', node: 'shelfTop', push: 'redEnvelope' },
  ],
  attractors: [{ id: 'goldBead', kind: 'shiny', node: 'tableTop', height: 1, goal: true, followsPushable: 'bead' }],
  baby: { start: 'underTable', facing: 'l' },
  mocha: { start: 'sofaArm' },
});

/** GDD § 4.3, page 1-5 「便當店的電梯」: the elevator Mocha operates, and pet re-presses its button. */
const p15 = page({
  nodes: [
    n('b1Door', 100, 480, 0), n('b1Shelf', 40, 400, 1), n('counter', 330, 180, 1), n('bead', 300, 260, 0), n('upFloor', 240, 260, 0),
    n('E', 0, 0, 0, { attach: { part: 'elevator', pos: { B1: [180, 480], '1F': [180, 260] } } }),
    n('panelSpot', 0, 0, 1, { attach: { part: 'elevator', pos: { B1: [200, 420], '1F': [200, 200] } } }),
  ],
  edges: [
    { a: 'b1Door', b: 'E', kind: 'crawl', when: { part: 'elevator', in: ['B1'] } },
    { a: 'E', b: 'upFloor', kind: 'crawl', when: { part: 'elevator', in: ['1F'] } },
    { a: 'upFloor', b: 'bead', kind: 'crawl' },
    jump('counter', 'panelSpot', { when: { part: 'elevator', in: ['1F'] } }),
    jump('b1Shelf', 'panelSpot', { when: { part: 'elevator', in: ['B1'] } }),
  ],
  parts: [
    part('elevator', 'lift', { states: ['B1', '1F'], initial: '1F', react: [{ on: 'partEnter', when: { part: 'panel', in: ['down'] }, to: 'toggle' }] }),
    part('panel', 'button'),
  ],
  perches: [
    { id: 'counter', node: 'counter', reachNode: 'upFloor' },
    { id: 'panel', node: 'panelSpot', reachNode: 'E', onPart: 'panel' },
    { id: 'b1Shelf', node: 'b1Shelf', reachNode: 'b1Door' },
  ],
  attractors: [{ id: 'goldBead', kind: 'shiny', node: 'bead', goal: true }],
  baby: { start: 'b1Door', facing: 'r' },
  mocha: { start: 'counter' },
});

/** Stands in for #84's cascade on 1-5: a partEnter of the panel going down toggles the lift. */
function liftReacts(state: SimState, events: SimEvent[]): SimState {
  const presses = events.filter((e) => e.type === 'partEnter' && e.id === 'panel' && e.state === 'down').length;
  if (presses % 2 === 0) return state;
  return { ...state, parts: { ...state.parts, elevator: state.parts.elevator === 'B1' ? '1F' : 'B1' } };
}

describe('GDD shapes', () => {
  test('0-3: tap the table — eye contact, push, the bead lands on the rug and becomes his', () => {
    const { state, ticks } = play(p03, [{ mocha: 'table' }, 'wait', 'wait']);
    expect(ticks).toEqual([
      [{ type: 'catLeave', id: 'sofaArm' }, { type: 'catArrive', id: 'table' }, { type: 'mochaStare', id: 'bead' }],
      [{ type: 'push', id: 'bead' }],
      [{ type: 'land', id: 'bead' }],
    ]);
    expect(state.pushables).toEqual({ bead: 'landed', redEnvelope: 'onPerch' });
    expect(candidates(p03, state).find((c) => c.id === 'goldBead')?.node).toBe('rug');
  });

  test('0-3 淘氣: the shelf is two hops away and pushes the red envelope', () => {
    const { state, ticks } = play(p03, [{ mocha: 'shelf' }, 'wait', 'wait']);
    expect(ticks[0]).toEqual([{ type: 'catLeave', id: 'sofaArm' }, { type: 'catArrive', id: 'shelf' }, { type: 'mochaStare', id: 'redEnvelope' }]);
    expect(state.pushables).toEqual({ bead: 'onPerch', redEnvelope: 'landed' });
  });

  test('1-5: Mocha presses the panel in the car, then pet re-presses it while he rides', () => {
    let state = initialState(p15);
    // Tap panel: he jumps from the counter into the car at 1F and presses; the car goes down.
    let r = play(p15, [{ mocha: 'panel' }], state);
    expect(r.ticks[0]).toEqual([{ type: 'catLeave', id: 'counter' }, { type: 'catArrive', id: 'panel' }, { type: 'partEnter', id: 'panel', state: 'down' }]);
    state = liftReacts(r.state, r.ticks[0]);
    expect(state.parts).toEqual({ elevator: 'B1', panel: 'down' });
    expect(state.mocha).toEqual({ perch: 'panel', path: [] });
    // He rides down with the car: still on his perch, still holding the button.
    expect(mochaAttractorNode(p15, state)).toBe('E');
    // The counter is out of reach now (that edge needs the car at 1F); the B1 shelf is in reach.
    expect(catPath(p15, state, 'counter')).toBeNull();
    expect(catPath(p15, state, 'b1Shelf')).toEqual(['panelSpot', 'b1Shelf']);
    // Pet: press again — partEnter(down) though the button never went up; the car goes back up.
    r = play(p15, [{ pet: true }], state);
    expect(r.ticks[0]).toEqual([{ type: 'partEnter', id: 'panel', state: 'down' }]);
    state = liftReacts(r.state, r.ticks[0]);
    expect(state.parts).toEqual({ elevator: '1F', panel: 'down' });
    // And again: pet works as many times as you like.
    r = play(p15, [{ pet: true }], state);
    expect(liftReacts(r.state, r.ticks[0]).parts.elevator).toBe('B1');
  });

  test('1-5: hopping out of the car releases the panel', () => {
    let r = play(p15, [{ mocha: 'panel' }]);
    const atB1 = liftReacts(r.state, r.ticks[0]);
    r = play(p15, [{ mocha: 'b1Shelf' }], atB1);
    expect(r.ticks[0]).toEqual([{ type: 'catLeave', id: 'panel' }, { type: 'partEnter', id: 'panel', state: 'up' }, { type: 'catArrive', id: 'b1Shelf' }]);
    expect(r.state.parts.panel).toBe('up');
  });
});

describe('determinism', () => {
  test('the same inputs give the same states and events', () => {
    const steps: Step[] = [{ mocha: 'table' }, 'wait', { mocha: 'shelf' }, 'wait', 'wait', { pet: true }, { mocha: 'sofaArm' }];
    const a = play(p03, steps);
    const b = play(p03, steps);
    expect(canonicalKey(a.state)).toBe(canonicalKey(b.state));
    expect(a.ticks).toEqual(b.ticks);
    expect(a.ticks).toMatchSnapshot();
  });
});
