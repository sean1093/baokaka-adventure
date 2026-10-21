import { describe, expect, test } from 'vitest';
import type { SimEvent } from './events';
import { LINKED_TOYS, toyParty, toySteps } from './fixtures/linked';
import { e, n, page, part } from './fixtures/toy';
import { isLinkNode, linkNodes } from './graph';
import { lintPage } from './lint';
import { LEAD_EDGES_PER_TICK, mochaFloor, mochaLink, mochaNode } from './mocha';
import { replay, toInput } from './replay';
import { candidateInputs, solve, solverKey, toSolutionSteps } from './solver';
import { initialState } from './state';
import { followPair, sayable, step, stepGrowth } from './step';
import type { Input, PageDef, SimState } from './types';

/**
 * The M4 engine II (#128): 一起's linked mode (Mocha hops down and walks the floor where you tap,
 * Baokaka follows: Mocha is priority 0), the first steps (`walk` edges from growth 3) and the
 * `lonely` creature 咻咻 that follows the pair — each on a toy page that is solver-green by the same
 * bar as a real page (`pages.test.ts`), plus the rules in detail on tiny pages.
 */

const NONE: Input = { t: 'none' };
const TOGETHER: Input = { t: 'say', word: 'together' };
const HUG: Input = { t: 'say', word: 'hug' };
const floor = (node: string): Input => ({ t: 'floor', node });
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

describe.each(LINKED_TOYS.map((def) => [def.id, def] as const))('toy page %s', (_id, def) => {
  const r = solve(def);

  test('lints clean, no warnings', () => {
    const lint = lintPage(def);
    expect(lint.errors.map((x) => x.message)).toEqual([]);
    expect(lint.warnings.map((x) => x.message)).toEqual([]);
  });

  test('the authored solution reaches done, linked', () => {
    const end = replay(def, def.solution).state;
    expect(end.done).toBe(true);
    expect(end.baby.linked).toBe(true);
  });

  test('solver-green: complete, solvable, no dead ends, no soft traps, not trivial, 淘氣 and 土地公 reachable', () => {
    expect(r).toMatchObject({ complete: true, solvable: true, deadEndCount: 0, trivial: false, mischiefReachable: true, tudigongReachable: true });
    expect(r.softTraps().map((t) => toSolutionSteps([...t.path, t.move]))).toEqual([]);
    expect(r.decoysReachable).toEqual([]);
    expect(r.visibleTies).toEqual([]);
  });

  test('par is the designed one (in the difficulty band), and the state count is far under the cap', () => {
    expect(r.par).toBe(def.solution.filter((s) => !('wait' in s)).length);
    expect(r.par).toBeGreaterThanOrEqual(def.difficulty);
    expect(r.par).toBeLessThanOrEqual(def.difficulty + 1);
    expect(r.statesExplored).toBeLessThan(5_000);
  });

  test('requirement 1: in every reachable linked state, Mocha and Baokaka stand on link nodes only', () => {
    // A plain BFS over candidateInputs and step: every state a player can reach
    const seen = new Map<string, SimState>([[solverKey(def, initialState(def)), initialState(def)]]);
    const queue = [initialState(def)];
    let linked = 0;
    while (queue.length > 0) {
      const s = queue.shift()!;
      if (s.baby.linked) {
        linked++;
        expect(isLinkNode(def, s.baby.node), s.baby.node).toBe(true);
        expect(isLinkNode(def, mochaNode(def, s)!), mochaNode(def, s)!).toBe(true);
        for (const id of s.mocha.path) expect(isLinkNode(def, id), id).toBe(true);
      }
      for (const input of candidateInputs(def, s)) {
        const next = step(def, s, input).state;
        const key = solverKey(def, next);
        if (seen.has(key)) continue;
        seen.set(key, next);
        queue.push(next);
      }
    }
    expect(linked).toBeGreaterThan(100);
  });
});

// ——— 一起: linked mode ———

/** A floor A–B–C–D (100 apart, D wet), a bench on a button over B and a high shelf; he starts on B, Mocha on the bench. */
function room(more: Partial<PageDef> = {}): PageDef {
  return page({
    nodes: [n('A', 0, 400), n('B', 100, 400), n('C', 200, 400), n('D', 300, 400, 0, { tags: ['wet'] }), n('bench', 100, 300, 1), n('shelf', 200, 200, 2)],
    edges: [e('A', 'B'), e('B', 'C'), e('C', 'D'), e('bench', 'shelf', { kind: 'jump' })],
    parts: [part('plate', 'button', 100, 300)],
    perches: [
      { id: 'bench', node: 'bench', reachNode: 'B', onPart: 'plate' },
      { id: 'shelf', node: 'shelf', reachNode: 'C' },
    ],
    baby: { start: 'B', facing: 'r' },
    mocha: { start: 'bench' },
    words: ['no', 'hug', 'together'],
    ...more,
  });
}

describe('一起 (GDD § 2.4): linked for the rest of the page', () => {
  test('Mocha hops down to his node: he leaves the perch (catLeave) and lets the button up', () => {
    const def = room();
    // Petted, he presses the button he sits on
    const settled = run(def, [{ t: 'pet' }, NONE]).state;
    expect(settled.parts.plate).toBe('down');
    expect(settled.baby).toMatchObject({ node: 'B', mode: 'cuddling' });
    const r = step(def, settled, TOGETHER);
    expect(r.state.baby).toMatchObject({ linked: true, mode: 'saying', target: 'mocha', refused: [] });
    expect(r.state.mocha).toEqual({ perch: null, path: [], floorNode: 'B' });
    expect(r.state.parts.plate).toBe('up');
    expect(r.events.map((x) => x.type)).toEqual(['together', 'catLeave', 'partEnter']);
    expect(r.events[2]).toMatchObject({ id: 'plate', state: 'up' });
    // The next tick he is with Mocha: linked
    expect(step(def, r.state, NONE).state.baby).toMatchObject({ node: 'B', mode: 'linked', target: 'mocha' });
  });

  test('mid-trip he drops the trip and hops down; a stare is forgotten; with no Mocha nothing links', () => {
    const def = room();
    const going = run(def, [{ t: 'mocha', perch: 'shelf' }]).state;
    // Arrived in one tick (one edge): send him back and link on the way
    const back = step(def, going, { t: 'mocha', perch: 'bench' }).state;
    expect(mochaLink(def, { ...back, mocha: { perch: null, path: ['shelf', 'bench'], to: 'bench', stare: 'x' } }).state.mocha).toEqual({ perch: null, path: [], floorNode: back.baby.node });
    const alone = room({ mocha: { start: null } });
    expect(step(alone, initialState(alone), TOGETHER).state.baby.linked).toBe(false);
    // Already linked: nothing more
    const linked = step(def, initialState(def), TOGETHER).state;
    expect(mochaLink(def, linked).state).toBe(linked);
  });

  test('linked, perches and pets are ignored; the words are all but 一起 and 不要！ (he never refuses Mocha)', () => {
    const def = room();
    const linked = run(def, [TOGETHER, NONE]).state;
    expect(step(def, linked, { t: 'mocha', perch: 'shelf' }).state.mocha).toEqual(linked.mocha);
    expect(step(def, linked, { t: 'pet' }).state.mocha).toEqual(linked.mocha);
    expect((['no', 'hug', 'together'] as const).filter((w) => sayable(def, linked, w))).toEqual(['hug']);
    expect(step(def, linked, { t: 'say', word: 'no' }).state.baby.mode).toBe('linked');
    const inputs = candidateInputs(def, linked);
    expect(inputs.filter((i) => i.t === 'say')).toEqual([HUG]);
    expect(inputs.some((i) => i.t === 'mocha' || i.t === 'pet')).toBe(false);
  });

  test('抱抱 while linked picks up no carrier: he holds on to Mocha (the event still reaches reactions)', () => {
    const def = room({ parts: [part('auntie', 'carrier', 0, 350, { route: ['A', 'B'] })], perches: [{ id: 'bench', node: 'bench', reachNode: 'A' }] });
    const linked = run(def, [TOGETHER, NONE]).state;
    const hug = step(def, linked, HUG);
    expect(hug.state.baby.mode).toBe('saying');
    expect(hug.state.parts.auntie).toBe('idle');
    expect(hug.events.map((x) => x.type)).toEqual(['hug']);
  });
});

describe('the floor: tap a node, Mocha walks there and he follows', () => {
  test('one edge a tick, side by side (Mocha first, he the same tick), through the puddle (C7 suspended); lead on arrival', () => {
    const def = room();
    const linked = run(def, [TOGETHER]).state;
    expect(LEAD_EDGES_PER_TICK).toBe(1);
    const t1 = step(def, linked, floor('D'));
    expect(t1.state.mocha).toEqual({ perch: null, path: ['C', 'D'], floorNode: 'C' });
    expect(t1.state.baby).toMatchObject({ node: 'C', mode: 'linked', facing: 'r' });
    const t2 = step(def, t1.state, NONE);
    expect(t2.state.mocha).toEqual({ perch: null, path: [], floorNode: 'D' });
    expect(t2.state.baby).toMatchObject({ node: 'D', mode: 'linked' });
    expect(t2.events.map((x) => x.type)).toEqual(['lead', 'babyEnter']);
    expect(t2.events[0]).toMatchObject({ id: 'D' });
  });

  test('a node no one stands on (a perch, a cat ledge) or can get to is a 「喵？」; his own node stops him', () => {
    const def = room();
    const linked = run(def, [TOGETHER]).state;
    expect(linkNodes(def)).toEqual(['A', 'B', 'C', 'D']);
    expect(mochaFloor(def, linked, 'shelf')).toEqual({ state: linked, events: [{ type: 'mochaNope', id: 'shelf' }] });
    expect(mochaFloor(def, linked, 'bench').events).toEqual([{ type: 'mochaNope', id: 'bench' }]);
    expect(mochaFloor(def, linked, 'B')).toEqual({ state: linked, events: [] });
    expect(mochaFloor(def, linked, 'A').state.mocha.path).toEqual(['B', 'A']);
    const walking = mochaFloor(def, linked, 'D').state;
    expect(mochaFloor(def, walking, 'D')).toEqual({ state: walking, events: [] });
    expect(mochaFloor(def, walking, 'B').state.mocha.path).toEqual([]);
    // Not linked: the floor is no input at all
    expect(mochaFloor(def, initialState(def), 'C')).toEqual({ state: initialState(def), events: [] });
  });

  test('he is blocked where Baokaka is: a blocking creature on the way is a 「喵？」, a non-blocking one is walked past', () => {
    const block = (blocks: boolean) => room({ creatures: [{ id: 'goose', positions: { here: 'C' }, initial: 'here', blocks, art: 'toy/goose' }] });
    const walled = run(block(true), [TOGETHER]).state;
    expect(step(block(true), walled, floor('D')).events).toContainEqual({ type: 'mochaNope', id: 'D' });
    const open = block(false);
    expect(run(open, [TOGETHER, floor('D'), NONE]).state.baby.node).toBe('D');
  });

  test('where he can’t follow (a walk edge before 第一步) he reaches for Mocha, 「要！要！」 every 4 ticks; then he walks', () => {
    const def = room({ edges: [e('A', 'B'), e('B', 'C', { kind: 'walk' }), e('C', 'D'), e('bench', 'shelf', { kind: 'jump' })], baby: { start: 'B', facing: 'r', growth: 2 } });
    const linked = run(def, [TOGETHER]).state;
    const across = run(def, [floor('D'), NONE], linked);
    expect(across.state.mocha.floorNode).toBe('D');
    expect(across.state.baby).toMatchObject({ node: 'B', mode: 'reaching', target: 'mocha' });
    const barks = run(def, waits(8), across.state).events.filter((x) => x.type === 'bark');
    expect(barks).toEqual([{ type: 'bark', id: 'mocha', bark: 'wantWant' }, { type: 'bark', id: 'mocha', bark: 'wantWant' }]);
    const grown: PageDef = { ...def, baby: { ...def.baby, growth: 3 } };
    const walked = run(grown, [NONE, NONE], across.state).state;
    expect(walked.baby).toMatchObject({ node: 'D', mode: 'linked' });
  });

  test('linked he picks up what he passes: a shiny on or next to his node, never a decoy, never one still held', () => {
    const plain = room({ attractors: [{ id: 'bead', kind: 'shiny', node: 'D', goal: true }] });
    const linked = run(plain, [TOGETHER, NONE]).state;
    // On B, two edges from the bead: nothing
    expect(linked).toMatchObject({ done: false, consumed: [] });
    const next = run(plain, [floor('C')], linked);
    // On C, the bead on D is one edge away: grabbed, done
    expect(next.state).toMatchObject({ done: true, consumed: ['bead'] });
    expect(next.state.baby).toMatchObject({ node: 'C', mode: 'grabbing', target: 'bead' });
    expect(next.events).toContainEqual({ type: 'grab', id: 'bead' });
    const held = room({
      creatures: [{ id: 'cloud', positions: { d: 'D' }, initial: 'd', blocks: false, art: 'toy/cloud' }],
      attractors: [{ id: 'bead', kind: 'shiny', node: 'D', heldBy: 'cloud', goal: true }],
    });
    expect(run(held, [TOGETHER, floor('D'), NONE, NONE]).state).toMatchObject({ done: false, consumed: [] });
    const decoy = room({ attractors: [{ id: 'moon', kind: 'shiny', node: 'D', decoy: true }, { id: 'bead', kind: 'shiny', node: 'A', goal: true }] });
    expect(run(decoy, [TOGETHER, floor('D'), NONE]).state.consumed).toEqual([]);
  });
});

describe('lonely creatures follow the pair (咻咻)', () => {
  const cloudy = (more: Partial<PageDef['creatures'][number]> = {}) =>
    room({ creatures: [{ id: 'shushu', positions: { sky: 'shelf', a: 'A', b: 'B', c: 'C', d: 'D' }, initial: 'sky', blocks: false, lonely: true, art: 'toy/shushu', ...more }] });

  test('only linked; then to its position nearest Mocha, never on Mocha’s or his node', () => {
    const def = cloudy();
    const start = initialState(def);
    expect(followPair(def, start)).toBe(start);
    const linked = step(def, initialState(def), TOGETHER).state;
    // Mocha and he are on B: the nearest free positions are A and C; the first in data order wins
    expect(step(def, linked, NONE).state.creatures.shushu).toBe('a');
    // Phase 4 comes before his move: with Mocha on D and him still on C, it trails behind them, on B
    const walked = run(def, [floor('D'), NONE], linked).state;
    expect(walked.creatures.shushu).toBe('b');
  });

  test('ties keep it where it is; off the page it stays away; not lonely, it never moves', () => {
    const def = cloudy({ positions: { sky: 'offpage', a: 'A', c: 'C' }, initial: 'c' });
    // From B, A and C are equally near: it stays on C
    const s: SimState = { ...initialState(def), baby: { ...initialState(def).baby, linked: true, node: 'B' }, mocha: { perch: null, path: [], floorNode: 'B' } };
    expect(followPair(def, s).creatures.shushu).toBe('c');
    expect(followPair(def, { ...s, creatures: { shushu: 'sky' } }).creatures.shushu).toBe('sky');
    const plain = cloudy({ lonely: false });
    expect(followPair(plain, { ...s, creatures: { shushu: 'a' } }).creatures.shushu).toBe('a');
  });
});

describe('第一步 (GDD § 2.5): walk edges from growth 3', () => {
  test('toy-steps: at the rail’s end he reaches; Mocha leads across and waits; he learns 第一步 and walks three steps', () => {
    const atRail = run(toySteps, waits(3)).state;
    expect(atRail.baby).toMatchObject({ node: 'R2', mode: 'reaching', target: 'lock' });
    const across = run(toySteps, [TOGETHER, floor('G'), NONE, NONE], atRail);
    expect(across.state.mocha.floorNode).toBe('G');
    expect(across.state.baby).toMatchObject({ node: 'R2', mode: 'reaching' });
    expect(across.events).toContainEqual({ type: 'learn', growth: 3 });
    expect(stepGrowth(toySteps, across.state)).toBe(3);
    // 咻咻 has come down off its cloud and keeps off Mocha's node
    expect(across.state.creatures.shushu).toBe('e');
    const steps = run(toySteps, waits(3), across.state);
    expect(steps.events.filter((x) => x.type === 'babyEnter').map((x) => x.id)).toEqual(['S1', 'S2', 'G']);
    expect(steps.state.baby).toMatchObject({ node: 'G', mode: 'linked' });
    const hugged = run(toySteps, [HUG, NONE], steps.state).state;
    expect(hugged).toMatchObject({ done: true, dropped: { lock: 'E' } });
  });

  test('a lead elsewhere teaches nothing: learns narrows its event by id', () => {
    const atRail = run(toySteps, [...waits(2), TOGETHER]).state;
    const s1 = run(toySteps, [floor('S1')], atRail);
    expect(s1.events).toContainEqual({ type: 'lead', id: 'S1' });
    expect(s1.events.some((x) => x.type === 'learn')).toBe(false);
  });

  test('toy-party: 不要！ to Mocha, the only thing he wants: both cry, and he learns 一起', () => {
    const r = run(toyParty, [NONE, { t: 'say', word: 'no' }, ...waits(3)]);
    expect(r.events).toContainEqual({ type: 'learn', word: 'together' });
    // Every perch is wet while 咻咻 rains: Mocha puffs
    expect(step(toyParty, r.state, { t: 'mocha', perch: 'shelf' }).events).toContainEqual({ type: 'mochaPuff', id: 'shelf' });
  });
});

describe('the floor in solutions and lint', () => {
  test('floor steps replay and fold', () => {
    expect(toInput({ floor: 'D' })).toEqual(floor('D'));
    expect(toSolutionSteps([floor('D'), NONE])).toEqual([{ floor: 'D' }, { wait: 1 }]);
  });

  test('L18: a baby edge to a perch node on a page that can say 一起; a lonely creature that blocks, or can’t follow', () => {
    const codes = (def: PageDef) => [...lintPage(def).errors, ...lintPage(def).warnings].map((x) => x.code).filter((c) => c.startsWith('L18') || c === 'L01-unknown-ref');
    expect(codes(room())).toEqual([]);
    const ramp = room({ edges: [...room().edges, e('C', 'shelf', { kind: 'climb' })] });
    expect(codes(ramp)).toEqual(['L18-linked-edge']);
    expect(codes({ ...ramp, words: ['hug'] })).toEqual([]);
    expect(codes({ ...ramp, words: ['hug'], learns: { word: 'together', when: { event: 'cry' } } })).toEqual(['L18-linked-edge']);
    const lonely = room({ creatures: [{ id: 'shushu', positions: { a: 'A' }, initial: 'a', lonely: true, art: 'toy/shushu' }] });
    expect(codes(lonely)).toEqual(['L18-lonely-blocks']);
    expect(codes({ ...lonely, words: [] })).toEqual(['L18-lonely-blocks', 'L18-lonely-unlinked']);
    expect(codes({ ...room(), solution: [{ floor: 'nowhere' }] })).toEqual(['L01-unknown-ref']);
    expect(codes({ ...room(), learns: { growth: 3, when: { event: 'lead', id: 'nowhere' } } })).toEqual(['L01-unknown-ref']);
  });
});
