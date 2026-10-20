import { describe, expect, test } from 'vitest';
import { carrierIndex, carryMove, hugCarrier, routeClear } from './carrier';
import { loopAttach } from './define';
import type { SimEvent } from './events';
import { M3_TOYS, toyBalloon, toyCarousel, toyClimb, toyHug, toyPlane } from './fixtures/m3';
import { e, line, n, page, part } from './fixtures/toy';
import { nodePos } from './graph';
import { lintPage } from './lint';
import { replay } from './replay';
import { solve, toSolutionSteps } from './solver';
import { initialState } from './state';
import { step, stepGrowth } from './step';
import type { Input, PageDef, SimState } from './types';

/**
 * The M3 engine (#120): carriers and 抱抱, the counterweight lift, the cranked loop, 飛機！ and the
 * 爬樓梯 growth — each on a toy page that is solver-green by the same bar as a real page
 * (`pages.test.ts`), plus the rules in detail on tiny pages.
 */

const NONE: Input = { t: 'none' };
const HUG: Input = { t: 'say', word: 'hug' };
function run(def: PageDef, inputs: readonly Input[], from: SimState = initialState(def)): { state: SimState; events: SimEvent[] } {
  let s = from;
  const events: SimEvent[] = [];
  for (const input of inputs) {
    const r = step(def, s, input);
    events.push(...r.events);
    s = r.state;
  }
  return { state: s, events };
}
const waits = (k: number): Input[] => Array.from({ length: k }, () => NONE);

describe.each(M3_TOYS.map((def) => [def.id, def] as const))('toy page %s', (_id, def) => {
  const r = solve(def);

  test('lints clean, no warnings', () => {
    const lint = lintPage(def);
    expect(lint.errors.map((x) => x.message)).toEqual([]);
    expect(lint.warnings.map((x) => x.message)).toEqual([]);
  });

  test('the authored solution reaches done', () => {
    expect(replay(def, def.solution).state.done).toBe(true);
  });

  test('solver-green: complete, solvable, no dead ends, no soft traps, not trivial, 淘氣 and 土地公 reachable', () => {
    expect(r).toMatchObject({ complete: true, solvable: true, deadEndCount: 0, trivial: false, mischiefReachable: true, tudigongReachable: true });
    expect(r.softTraps().map((t) => toSolutionSteps([...t.path, t.move]))).toEqual([]);
    expect(r.decoysReachable).toEqual([]);
    expect(r.visibleTies).toEqual([]);
  });

  test('par is the designed one, and the state count is tiny (a carry adds only its route index)', () => {
    expect(r.par).toBe(def.solution.filter((s) => !('wait' in s)).length);
    expect(r.statesExplored).toBeLessThan(100);
  });
});

// ——— 抱抱 and carriers ———

/** A lane A–E, 100 apart; the auntie walks B → C → D. */
const lane = (more: Partial<PageDef> = {}): PageDef =>
  page({ ...line('ABCDE'), parts: [part('auntie', 'carrier', 100, -50, { route: ['B', 'C', 'D'] })], ...more });

describe('抱抱 (GDD § 2.4): an idle carrier within one edge picks him up', () => {
  test('from the next node: he is lifted onto hers, then carried one edge a tick, then set down', () => {
    const def = lane();
    const said = step(def, initialState(def), HUG);
    expect(said.state.baby).toMatchObject({ node: 'B', mode: 'carried', carriedBy: { id: 'auntie', k: 0 }, target: null });
    expect(said.state.parts.auntie).toBe('carrying@0');
    expect(said.events.map((x) => x.type)).toEqual(['hug', 'partEnter', 'babyEnter']);
    const nodes = [said.state];
    for (let i = 0; i < 3; i++) nodes.push(step(def, nodes[nodes.length - 1], NONE).state);
    expect(nodes.map((s) => [s.baby.node, s.baby.mode, s.parts.auntie])).toEqual([
      ['B', 'carried', 'carrying@0'],
      ['C', 'carried', 'carrying@1'],
      ['D', 'carried', 'carrying@2'],
      ['D', 'idle', 'done'],
    ]);
    expect(nodes[3].baby.carriedBy).toBeUndefined();
  });

  test('on her own node he is lifted where he is (no babyEnter)', () => {
    const def = lane({ baby: { start: 'B', facing: 'r' } });
    const said = step(def, initialState(def), HUG);
    expect(said.state.baby).toMatchObject({ node: 'B', mode: 'carried' });
    expect(said.events.some((x) => x.type === 'babyEnter')).toBe(false);
  });

  test('two edges away, or with nobody, he raises his arms (hugNobody) and stays saying', () => {
    const far = lane({ baby: { start: 'E', facing: 'l' } });
    const s = step(far, initialState(far), HUG);
    expect(s.state.baby.mode).toBe('saying');
    expect(s.events.map((x) => x.type)).toEqual(['hug', 'hugNobody']);
    expect(s.state.parts.auntie).toBe('idle');
  });

  test('hugged again at the far end (done), she carries him back and ends idle: a carry is never one-way', () => {
    const def = lane();
    const there = run(def, [HUG, ...waits(3)]).state;
    expect(there.parts.auntie).toBe('done');
    const back = run(def, [HUG, ...waits(3)], there).state;
    expect(back.baby).toMatchObject({ node: 'B', mode: 'idle' });
    expect(back.parts.auntie).toBe('idle');
    const mid = run(def, [HUG, NONE], there).state;
    expect(mid.baby.carriedBy).toEqual({ id: 'auntie', k: 1, back: true });
  });

  test('she picks him up only while her whole route is clear, and waits mid-route for a step that closes', () => {
    const gate = part('gate', 'tab', 300, 100, { states: ['shut', 'open'] });
    const def = lane({ parts: [part('auntie', 'carrier', 100, -50, { route: ['B', 'C', 'D'] }), gate] });
    const closed: PageDef = { ...def, edges: def.edges.map((x) => (x.a === 'C' && x.b === 'D' ? { ...x, when: { part: 'gate', in: ['open'] } } : x)) };
    expect(routeClear(closed, initialState(closed), ['B', 'C', 'D'])).toBe(false);
    expect(hugCarrier(closed, initialState(closed))).toBeNull();
    const opened = step(closed, initialState(closed), { t: 'set', part: 'gate', to: 'open' }).state;
    const carried = run(closed, [HUG, NONE], opened).state;
    expect(carried.baby).toMatchObject({ node: 'C', mode: 'carried' });
    // The gate shuts while she's on C: she waits there holding him until it opens
    const shut = run(closed, [{ t: 'set', part: 'gate', to: 'shut' }, NONE, NONE], carried).state;
    expect(shut.baby).toMatchObject({ node: 'C', mode: 'carried', carriedBy: { k: 1 } });
    expect(carryMove(closed, shut)).toEqual({ kind: 'wait' });
    expect(run(closed, [{ t: 'set', part: 'gate', to: 'open' }, NONE], shut).state.baby).toMatchObject({ node: 'D', mode: 'idle' });
  });

  test('a locked carrier (lockedWhen: the sleepy 阿伯) does not answer', () => {
    const def = lane({ parts: [part('auntie', 'carrier', 100, -50, { route: ['B', 'C', 'D'], lockedWhen: { flag: 'asleep' } })] });
    const asleep = { ...initialState(def), flags: ['asleep'] };
    expect(step(def, asleep, HUG).state.baby.mode).toBe('saying');
  });

  test('the first carrier in data order answers; a busy one is skipped', () => {
    const def = lane({
      parts: [part('a1', 'carrier', 100, -50, { route: ['B', 'C'], initial: 'done' }), part('a2', 'carrier', 100, -50, { route: ['A', 'B'] })],
    });
    // a1 stands on C (done): not within one edge of A; a2 stands on A
    expect(hugCarrier(def, initialState(def))?.part.id).toBe('a2');
  });

  test('carrier states map to route indices', () => {
    const p = part('auntie', 'carrier', 0, 0, { route: ['B', 'C', 'D'] });
    expect(['idle', 'carrying@0', 'carrying@2', 'done', 'carrying@9', 'carrying@x'].map((s) => carrierIndex(p, s))).toEqual([0, 0, 2, 2, 2, 0]);
  });

  test('while carried no word is taken and the carrier keeps walking; Mocha still moves', () => {
    const def = lane({ words: ['hug', 'beep'] });
    const lifted = step(def, initialState(def), HUG).state;
    const r = step(def, lifted, { t: 'say', word: 'beep' });
    expect(r.state.baby).toMatchObject({ mode: 'carried', node: 'C' });
    expect(r.events.some((x) => x.type === 'beep')).toBe(false);
  });

  test('carried, he weighs nothing: leaving a pressure plate releases it, set down on one presses it', () => {
    const def = page({
      nodes: [n('P', 0, 0, 0, { attach: { part: 'plate', pos: { up: [0, 0], down: [0, 0] } } }), n('B', 100), n('Q', 200, 0, 0, { attach: { part: 'plate2', pos: { up: [200, 0], down: [200, 0] } } })],
      edges: [e('P', 'B'), e('B', 'Q')],
      parts: [part('plate', 'button', 0, 50), part('plate2', 'button', 200, 50), part('auntie', 'carrier', 100, -50, { route: ['B', 'Q'] })],
      baby: { start: 'B', facing: 'l' },
    });
    const onPlate = { ...initialState(def), baby: { ...initialState(def).baby, node: 'P' }, parts: { ...initialState(def).parts, plate: 'down' } };
    const lifted = step(def, onPlate, HUG).state;
    expect(lifted.parts.plate).toBe('up');
    const carried = step(def, lifted, NONE).state;
    expect(carried.parts.plate2).toBe('up');
    expect(step(def, carried, NONE).state.parts.plate2).toBe('down');
  });

  test('toy-hug: he learns 抱抱 beside the auntie, and she carries him over the crowd', () => {
    const learnt = run(toyHug, waits(1));
    expect(learnt.events.some((x) => x.type === 'learn' && x.word === 'hug')).toBe(true);
    expect(learnt.state.baby).toMatchObject({ node: 'L2', target: 'bead' });
    const over = run(toyHug, [HUG, NONE], learnt.state).state;
    // L3 is under the crowd of legs, which blocks his own crawl, not her walk
    expect(over.baby).toMatchObject({ node: 'L3', mode: 'carried' });
    expect(run(toyHug, waits(4), over).state.done).toBe(true);
  });

  test('without 抱抱 the page cannot be solved', () => {
    expect(solve({ ...toyHug, learns: undefined }).solvable).toBe(false);
  });
});

// ——— Counterweight lift (C4) ———

describe('the counterweight lift (C4): Mocha’s weight on a perch drives a lift', () => {
  test('toy-balloon: Mocha jumps out, the basket rises with him, and he crawls off onto the ledge', () => {
    const out = step(toyBalloon, initialState(toyBalloon), { t: 'mocha', perch: 'post' });
    expect(out.state.parts.basket).toBe('up');
    expect(out.events.map((x) => [x.type, x.id])).toEqual(expect.arrayContaining([['catLeave', 'rim'], ['partEnter', 'basket'], ['babyEnter', 'H1']]));
    expect(nodePos(toyBalloon, out.state, 'B')).toEqual([170, 300]);
    expect(run(toyBalloon, waits(2), out.state).state.done).toBe(true);
  });

  test('back in the basket, it goes down again; petting him re-presses it (partEnter on)', () => {
    const pet = step(toyBalloon, initialState(toyBalloon), { t: 'pet' });
    expect(pet.events).toContainEqual(expect.objectContaining({ type: 'partEnter', id: 'basket', state: 'down' }));
    // Mocha out while Baokaka is still in the basket's way: he rides it up, then back down when Mocha returns
    const stay: PageDef = { ...toyBalloon, edges: toyBalloon.edges.filter((x) => x.a !== 'B' || x.b !== 'H1') };
    const up = step(stay, initialState(stay), { t: 'mocha', perch: 'post' });
    expect(up.events.some((x) => x.type === 'ride')).toBe(true);
    const back = step(stay, up.state, { t: 'mocha', perch: 'rim' }).state;
    expect([back.parts.basket, back.baby.node]).toEqual(['down', 'B']);
  });

  test('without the counterweight the basket never moves', () => {
    const plain: PageDef = { ...toyBalloon, parts: toyBalloon.parts.map((p) => ({ ...p, counterweight: undefined })) };
    expect(step(plain, initialState(plain), { t: 'mocha', perch: 'post' }).state.parts.basket).toBe('down');
  });
});

// ——— Cranked loop ———

describe('the cranked loop: attached nodes rotate around N positions', () => {
  test('loopAttach puts seat s on slot (s + i) mod N in state i', () => {
    const slots: [number, number][] = [[0, 0], [10, 0], [20, 0]];
    expect(loopAttach('belt', ['a', 'b', 'c'], slots, 0).pos).toEqual({ a: [0, 0], b: [10, 0], c: [20, 0] });
    expect(loopAttach('belt', ['a', 'b', 'c'], slots, 2).pos).toEqual({ a: [20, 0], b: [0, 0], c: [10, 0] });
    expect(() => loopAttach('belt', ['a', 'b'], slots, 0)).toThrow(/2 states need 2 slots/);
  });

  test('toy-carousel: a crank turn carries his suitcase round (ride); a tap advances one slot, wrapping', () => {
    const part = step(toyCarousel, initialState(toyCarousel), { t: 'set', part: 'belt', to: '2' });
    expect(part.events.some((x) => x.type === 'ride')).toBe(true);
    const turned = step(toyCarousel, part.state, { t: 'set', part: 'belt', to: '3' });
    expect(nodePos(toyCarousel, turned.state, 'S')).toEqual([290, 430]);
    // The far end opens: he crawls off the suitcase the same tick (so no ride), then grabs
    expect(turned.state.baby.node).toBe('F2');
    expect(run(toyCarousel, waits(1), turned.state).state.done).toBe(true);
    expect(step(toyCarousel, initialState(toyCarousel), { t: 'tap', id: 'belt' }).state.parts.belt).toBe('1');
    const atEnd = { ...initialState(toyCarousel), parts: { belt: '3' }, baby: { ...initialState(toyCarousel).baby, node: 'F1' } };
    expect(step(toyCarousel, atEnd, { t: 'tap', id: 'belt' }).state.parts.belt).toBe('0');
  });
});

// ——— 飛機！ ———

describe('飛機！ (GDD § 2.4): winged creatures toggle ground ↔ sky; parts react from anywhere', () => {
  test('toy-plane: learnt on the deck; the pigeons fly up, the runway lights blink, and again brings them back', () => {
    const learnt = run(toyPlane, waits(1));
    expect(learnt.events.some((x) => x.type === 'learn' && x.word === 'plane')).toBe(true);
    const once = step(toyPlane, learnt.state, { t: 'say', word: 'plane' }).state;
    expect(once.creatures.pigeons).toBe('sky');
    expect(once.parts.runway).toBe('on');
    const twice = step(toyPlane, once, { t: 'say', word: 'plane' }).state;
    expect([twice.creatures.pigeons, twice.parts.runway]).toEqual(['deck', 'off']);
  });
});

// ——— 爬樓梯 ———

describe('爬樓梯 (GDD § 2.5): climb edges open from growth 1', () => {
  test('before learning he stops at the step; the farmer goes up, he learns it and climbs the riser', () => {
    const stuck = run(toyClimb, waits(3)).state;
    expect(stuck.baby).toMatchObject({ node: 'T1', mode: 'reaching' });
    expect(stepGrowth(toyClimb, stuck)).toBe(0);
    const waved = run(toyClimb, [{ t: 'say', word: 'bye' }], stuck);
    expect(waved.events).toContainEqual(expect.objectContaining({ type: 'learn', growth: 1 }));
    expect(stepGrowth(toyClimb, waved.state)).toBe(1);
    const climbed = step(toyClimb, waved.state, NONE).state;
    expect(climbed.baby).toMatchObject({ node: 'T2', mode: 'moving' });
    // The riser the climb frames are drawn for (#141, D-58)
    expect(nodePos(toyClimb, stuck, 'T1')![1] - nodePos(toyClimb, stuck, 'T2')![1]).toBe(22);
  });

  test('with the farmer gone but no growth, the step stays shut: the farmer is what he copies', () => {
    const noGrowth: PageDef = { ...toyClimb, learns: undefined };
    expect(solve(noGrowth).solvable).toBe(false);
  });
});

// ——— Lint ———

describe('lint (§ 3.6) for carriers and counterweights', () => {
  const codes = (def: PageDef) => lintPage(def).errors.map((x) => x.code);

  test('a carrier route must step over baby edges, never through a height-2 node', () => {
    const def = lane({ parts: [part('auntie', 'carrier', 100, -50, { route: ['B', 'D'] })] });
    expect(codes(def)).toContain('L05-carrier-route');
    const high = lane({ nodes: [...line('ABCDE').nodes.slice(0, 4), n('E', 400, 0, 2)], parts: [part('auntie', 'carrier', 100, -50, { route: ['D', 'E'] })] });
    expect(codes(high)).toContain('L05-carrier-route');
    expect(codes(lane())).not.toContain('L05-carrier-route');
  });

  test('a carrier starts idle or done, walks somewhere, and only 抱抱 moves it', () => {
    expect(codes(lane({ parts: [part('auntie', 'carrier', 100, -50, { route: ['B', 'C'], initial: 'carrying@0' })] }))).toContain('L03-carrier-start');
    expect(codes(lane({ parts: [part('auntie', 'carrier', 100, -50, { route: ['B'] })] }))).toContain('L03-preset-field');
    expect(codes(lane({ parts: [part('auntie', 'carrier', 100, -50, { route: ['B', 'C'], react: [{ on: 'cry', to: 'done' }] })] }))).toContain('L03-carrier-driven');
    expect(codes(lane({ perches: [{ id: 'p', node: 'E', set: { part: 'auntie', to: 'done' } }] }))).toContain('L03-carrier-driven');
  });

  test('route and counterweight belong to their presets', () => {
    expect(codes(lane({ parts: [part('auntie', 'lift', 100, -50, { states: ['a', 'b'], route: ['B', 'C'] })] }))).toContain('L03-preset-field');
    expect(codes(lane({ parts: [part('t', 'tab', 100, -50, { states: ['a', 'b'], counterweight: { on: 'a', off: 'b' } })] }))).toContain('L03-preset-field');
  });

  test('a counterweight needs a perch on it, states it has, and an initial that matches Mocha’s start', () => {
    const noPerch: PageDef = { ...toyBalloon, perches: toyBalloon.perches.map((p) => ({ ...p, onPart: undefined })) };
    expect(codes(noPerch)).toContain('L03-counterweight');
    const wrongStart: PageDef = { ...toyBalloon, mocha: { start: 'post' } };
    expect(codes(wrongStart)).toContain('L03-counterweight');
    const badState: PageDef = { ...toyBalloon, parts: [{ ...toyBalloon.parts[0], counterweight: { on: 'down', off: 'sky' } }] };
    expect(codes(badState)).toContain('L02-unknown-state');
  });
});
