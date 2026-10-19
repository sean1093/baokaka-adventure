import { describe, expect, it, test } from 'vitest';
import c1p2 from './fixtures/c1p2';
import { blockedNodes, dist2, nodePos, openEdges, walkerKinds, walkGraph, type Walker } from './graph';
import { initialState } from './state';
import type { CreatureDef, EdgeDef, NodeDef, PageDef, PartDef, SimState } from './types';

const CRAWL: Walker = { who: 'baby', growth: 0 };
const CAT: Walker = { who: 'cat' };

/** A minimal page around a toy graph; everything not passed is empty. */
function page(nodes: NodeDef[], edges: EdgeDef[], extra: { parts?: PartDef[]; creatures?: CreatureDef[] } = {}): PageDef {
  return {
    id: 'toy',
    chapter: 0,
    index: 1,
    title: '玩具',
    difficulty: 1,
    backdrop: 'toy',
    nodes,
    edges,
    parts: extra.parts ?? [],
    perches: [],
    attractors: [],
    creatures: extra.creatures ?? [],
    baby: { start: nodes[0].id, facing: 'r' },
    mocha: { start: null },
    mischief: { text: '', when: { type: 'ride' } },
    tudigong: { x: 0, y: 0, hat: '' },
    solution: [],
  };
}
const n = (id: string, x = 0, y = 0, height: 0 | 1 | 2 = 0): NodeDef => ({ id, x, y, height });
const e = (a: string, b: string, more: Partial<EdgeDef> = {}): EdgeDef => ({ a, b, kind: 'crawl', ...more });
const ids = (edges: EdgeDef[]) => edges.map((x) => `${x.a}-${x.b}`);

/** c1p2 with the train at each stop. */
const train = (stop: 'out' | 'half' | 'full'): SimState => {
  const s = initialState(c1p2);
  return { ...s, parts: { ...s.parts, train: stop } };
};

describe('nodePos', () => {
  test('a plain node is at its x, y', () => {
    expect(nodePos(c1p2, train('out'), 'pillarTop')).toEqual([280, 240]);
  });
  test.each([
    ['out', [60, 430], [100, 430]],
    ['half', [150, 430], [190, 430]],
    ['full', [190, 430], [230, 430]],
  ] as const)('attached nodes follow the train at %s', (stop, t1, t2) => {
    expect(nodePos(c1p2, train(stop), 'T1')).toEqual(t1);
    expect(nodePos(c1p2, train(stop), 'T2')).toEqual(t2);
  });
  test('an attached node reads a pushable part', () => {
    const def = page([{ ...n('C', 5, 6), attach: { part: 'card', pos: { landed: [50, 60] } } }], [], {
      parts: [{ id: 'card', preset: 'pushable', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 'x' }],
    });
    const s = initialState(def);
    expect(nodePos(def, s, 'C')).toEqual([5, 6]); // no position for onPerch: falls back to x, y
    expect(nodePos(def, { ...s, pushables: { card: 'landed' } }, 'C')).toEqual([50, 60]);
  });
  test('an attached node whose part is missing falls back to x, y', () => {
    const def = page([{ ...n('C', 5, 6), attach: { part: 'ghost', pos: { a: [1, 1] } } }], []);
    expect(nodePos(def, initialState(def), 'C')).toEqual([5, 6]);
  });
  test('an unknown node has no position', () => {
    expect(nodePos(c1p2, train('out'), 'nowhere')).toBeUndefined();
  });
});

test('dist2 is the exact squared distance', () => {
  expect(dist2([0, 0], [3, 4])).toBe(25);
  expect(dist2([140, 430], [320, 430])).toBe(180 * 180);
});

describe('who may use which edges', () => {
  test.each([
    [0, ['crawl']],
    [1, ['crawl', 'climb']],
    [2, ['crawl', 'climb', 'cruise']],
    [3, ['crawl', 'climb', 'cruise', 'walk']],
  ] as const)('Baokaka at growth %i', (growth, kinds) => {
    expect(walkerKinds({ who: 'baby', growth })).toEqual(kinds);
  });
  test('Mocha jumps and squeezes', () => {
    expect(walkerKinds(CAT)).toEqual(['jump', 'squeeze']);
  });

  const kinds = page(
    [n('A'), n('B'), n('C'), n('D'), n('E'), n('F'), n('G')],
    [
      e('A', 'B', { kind: 'crawl' }),
      e('B', 'C', { kind: 'climb' }),
      e('C', 'D', { kind: 'cruise' }),
      e('D', 'E', { kind: 'walk' }),
      e('E', 'F', { kind: 'jump' }),
      e('F', 'G', { kind: 'squeeze' }),
    ],
  );
  const s = initialState(kinds);
  test.each([
    [{ who: 'baby', growth: 0 } as Walker, ['A-B']],
    [{ who: 'baby', growth: 1 } as Walker, ['A-B', 'B-C']],
    [{ who: 'baby', growth: 2 } as Walker, ['A-B', 'B-C', 'C-D']],
    [{ who: 'baby', growth: 3 } as Walker, ['A-B', 'B-C', 'C-D', 'D-E']],
    [CAT, ['E-F', 'F-G']],
  ])('openEdges filters by kind (%o)', (walker, open) => {
    expect(ids(openEdges(kinds, s, walker))).toEqual(open);
  });
  test('reach follows the growth stage', () => {
    expect(walkGraph(kinds, s, { who: 'baby', growth: 1 }).reachSet('A').nodes).toEqual(['A', 'B', 'C']);
    expect(walkGraph(kinds, s, { who: 'baby', growth: 3 }).reachSet('A').nodes).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(walkGraph(kinds, s, CAT).reachSet('E').nodes).toEqual(['E', 'F', 'G']);
    expect(walkGraph(kinds, s, CAT).bfs('A', 'B')).toBeNull();
  });
});

describe('conditional edges (c1p2 in each train state)', () => {
  test.each([
    ['out', ['L1-L2', 'L2-L3', 'T1-T2', 'R1-R2']],
    ['half', ['L1-L2', 'L2-L3', 'L3-T1', 'T1-T2', 'R1-R2']],
    ['full', ['L1-L2', 'L2-L3', 'L3-T1', 'T1-T2', 'T2-R1', 'R1-R2']],
  ] as const)('baby edges open at %s', (stop, open) => {
    expect(ids(openEdges(c1p2, train(stop), CRAWL))).toEqual(open);
  });
  test('the cat graph is the jump between bench and pillar, in any train state', () => {
    for (const stop of ['out', 'half', 'full'] as const) {
      expect(ids(openEdges(c1p2, train(stop), CAT))).toEqual(['bench-pillarTop']);
      expect(walkGraph(c1p2, train(stop), CAT).bfs('bench', 'pillarTop')).toEqual(['bench', 'pillarTop']);
    }
  });
  test.each([
    ['out', null, ['L1', 'L2', 'L3']],
    ['half', null, ['L1', 'L2', 'L3', 'T1', 'T2']],
    ['full', ['L1', 'L2', 'L3', 'T1', 'T2', 'R1', 'R2'], ['L1', 'L2', 'L3', 'T1', 'T2', 'R1', 'R2']],
  ] as const)('from L1 at %s: path to the bead and reach set', (stop, path, reach) => {
    const g = walkGraph(c1p2, train(stop), CRAWL);
    expect(g.bfs('L1', 'R2')).toEqual(path);
    expect(g.reachSet('L1').nodes).toEqual(reach);
  });
  test.each([
    ['out', 'L3', ['L1', 'L2', 'L3']],
    ['half', 'T2', ['L1', 'L2', 'L3', 'T1', 'T2']],
    ['full', 'R2', ['L1', 'L2', 'L3', 'T1', 'T2', 'R1', 'R2']],
  ] as const)('at %s he heads for %s, the closest he can get to the bead', (stop, node, path) => {
    expect(walkGraph(c1p2, train(stop), CRAWL).nearestReachableTo('L1', 'R2')).toEqual({ node, path });
  });
  test('the graph is a snapshot of the state it was built from', () => {
    const s = train('out');
    const g = walkGraph(c1p2, s, CRAWL);
    expect(walkGraph(c1p2, train('full'), CRAWL).bfs('L1', 'R2')).not.toBeNull();
    expect(g.bfs('L1', 'R2')).toBeNull();
    expect(g.state).toBe(s);
  });
});

describe('one-way edges', () => {
  const def = page([n('A'), n('B'), n('C')], [e('A', 'B', { oneWay: true }), e('B', 'C')]);
  const g = walkGraph(def, initialState(def), CRAWL);
  test('go from a to b only', () => {
    expect(g.bfs('A', 'C')).toEqual(['A', 'B', 'C']);
    expect(g.bfs('C', 'A')).toBeNull();
    expect(g.reachSet('B').nodes).toEqual(['B', 'C']);
  });
  test('are listed once by openEdges', () => {
    expect(ids(openEdges(def, initialState(def), CRAWL))).toEqual(['A-B', 'B-C']);
  });
});

describe('shortest paths and the edge-order tie-break', () => {
  test('a shorter path wins over edge order', () => {
    const def = page([n('S'), n('A'), n('B'), n('T')], [e('S', 'A'), e('A', 'B'), e('B', 'T'), e('S', 'T')]);
    expect(walkGraph(def, initialState(def), CRAWL).bfs('S', 'T')).toEqual(['S', 'T']);
  });
  test('equal-length paths: the earlier first edge wins', () => {
    const viaB = page([n('S'), n('A'), n('B'), n('T')], [e('S', 'B'), e('S', 'A'), e('A', 'T'), e('B', 'T')]);
    const viaA = page([n('S'), n('A'), n('B'), n('T')], [e('S', 'A'), e('S', 'B'), e('B', 'T'), e('A', 'T')]);
    expect(walkGraph(viaB, initialState(viaB), CRAWL).bfs('S', 'T')).toEqual(['S', 'B', 'T']);
    expect(walkGraph(viaA, initialState(viaA), CRAWL).bfs('S', 'T')).toEqual(['S', 'A', 'T']);
  });
  test('equal-length paths sharing a prefix: the earlier edge at the split wins', () => {
    const def = page([n('S'), n('A'), n('B'), n('C'), n('T')], [e('S', 'A'), e('A', 'C'), e('A', 'B'), e('B', 'T'), e('C', 'T')]);
    expect(walkGraph(def, initialState(def), CRAWL).bfs('S', 'T')).toEqual(['S', 'A', 'C', 'T']);
  });
  test('edges are walked in either direction, keeping their rank', () => {
    // Both of S's edges are written with S second; the earlier one still wins.
    const def = page([n('S'), n('A'), n('B'), n('T')], [e('B', 'S'), e('A', 'S'), e('T', 'A'), e('T', 'B')]);
    expect(walkGraph(def, initialState(def), CRAWL).bfs('S', 'T')).toEqual(['S', 'B', 'T']);
  });
  test('node order does not matter, only edge order', () => {
    const def = page([n('T'), n('B'), n('A'), n('S')], [e('S', 'A'), e('S', 'B'), e('A', 'T'), e('B', 'T')]);
    expect(walkGraph(def, initialState(def), CRAWL).bfs('S', 'T')).toEqual(['S', 'A', 'T']);
  });
  test('trivial and impossible queries', () => {
    const def = page([n('A'), n('B'), n('Z')], [e('A', 'B'), e('A', 'ghost')]);
    const g = walkGraph(def, initialState(def), CRAWL);
    expect(g.bfs('A', 'A')).toEqual(['A']);
    expect(g.bfs('A', 'Z')).toBeNull();
    expect(g.bfs('A', 'ghost')).toBeNull();
    expect(g.bfs('ghost', 'A')).toBeNull();
    expect(ids(openEdges(def, initialState(def), CRAWL))).toEqual(['A-B']); // the dangling edge is ignored
  });
  test('an edge of an unknown kind is open for nobody; a duplicate node id resolves to the first', () => {
    const def = page([n('A', 1, 1), n('B'), n('A', 9, 9)], [e('A', 'B', { kind: 'fly' as EdgeDef['kind'] })]);
    const s = initialState(def);
    for (const w of [CAT, { who: 'baby', growth: 3 } as Walker]) expect(openEdges(def, s, w)).toEqual([]);
    expect(nodePos(def, s, 'A')).toEqual([1, 1]);
  });
  test('repeated queries on one graph give the same answers', () => {
    const g = walkGraph(c1p2, train('full'), CRAWL);
    for (let i = 0; i < 3; i++) {
      expect(g.bfs('R2', 'L1')).toEqual(['R2', 'R1', 'T2', 'T1', 'L3', 'L2', 'L1']);
      expect(g.bfs('L2', 'T1')).toEqual(['L2', 'L3', 'T1']);
      expect(g.bfs('L1', 'pillarTop')).toBeNull();
    }
  });
});

describe('blocked nodes (Baokaka only)', () => {
  const nodes = [n('A', 0, 0), n('B', 50, 0), n('C', 100, 0), n('D', 50, 50)];
  const edges = [e('A', 'B'), e('B', 'C'), e('A', 'D', { kind: 'squeeze' }), e('A', 'D'), e('D', 'C')];
  const goose = (blocks?: boolean): CreatureDef => ({
    id: 'goose',
    positions: { lane: 'B', pond: 'D', away: 'offpage' },
    initial: 'lane',
    ...(blocks === undefined ? {} : { blocks }),
    art: 'x',
  });

  test('a blocking creature blocks its node (blocks defaults to true); he detours', () => {
    const def = page(nodes, edges, { creatures: [goose()] });
    const s = initialState(def);
    expect(blockedNodes(def, s)).toEqual(['B']);
    const g = walkGraph(def, s, CRAWL);
    expect(g.bfs('A', 'C')).toEqual(['A', 'D', 'C']);
    expect(g.bfs('A', 'B')).toBeNull();
    expect(g.reachSet('A').has('B')).toBe(false);
  });
  test('with every way blocked, the far side is unreachable', () => {
    const def = page(nodes, edges, { creatures: [goose(), { ...goose(), id: 'goose2', initial: 'pond' }] });
    const s = initialState(def);
    expect(blockedNodes(def, s)).toEqual(['B', 'D']);
    expect(walkGraph(def, s, CRAWL).bfs('A', 'C')).toBeNull();
    expect(walkGraph(def, s, CRAWL).nearestReachableTo('A', 'C')).toEqual({ node: 'A', path: ['A'] });
  });
  test('a creature that moves away (or offpage) stops blocking', () => {
    const def = page(nodes, edges, { creatures: [goose()] });
    const s = initialState(def);
    expect(blockedNodes(def, { ...s, creatures: { goose: 'pond' } })).toEqual(['D']);
    expect(blockedNodes(def, { ...s, creatures: { goose: 'away' } })).toEqual([]);
    expect(blockedNodes(def, { ...s, creatures: {} })).toEqual([]);
    expect(walkGraph(def, { ...s, creatures: { goose: 'away' } }, CRAWL).bfs('A', 'C')).toEqual(['A', 'B', 'C']);
  });
  test('a creature with blocks: false (c1p2 pigeon) blocks nothing', () => {
    expect(blockedNodes(page(nodes, edges, { creatures: [goose(false)] }), initialState(page(nodes, edges, { creatures: [goose(false)] })))).toEqual([]);
    expect(blockedNodes(c1p2, train('half'))).toEqual([]);
  });
  test('a creature standing at an unknown node blocks nothing', () => {
    const def = page(nodes, edges, { creatures: [{ ...goose(), positions: { lane: 'ghost' } }] });
    expect(blockedNodes(def, initialState(def))).toEqual([]);
  });
  test('the start node never counts as blocked', () => {
    const def = page(nodes, edges, { creatures: [goose()] });
    expect(walkGraph(def, initialState(def), CRAWL).bfs('B', 'C')).toEqual(['B', 'C']);
  });
  test('Mocha is not blocked by creatures', () => {
    const def = page(nodes, edges, { creatures: [{ ...goose(), initial: 'pond' }] });
    expect(walkGraph(def, initialState(def), CAT).bfs('A', 'D')).toEqual(['A', 'D']);
    expect(walkGraph(def, initialState(def), CRAWL).bfs('A', 'D')).toBeNull();
  });

  const gatePage = page(
    [n('A'), { ...n('G', 50, 0), attach: { part: 'gateA', pos: { closed: [50, 0], open: [50, 0] } } }, n('C', 100, 0)],
    [e('A', 'G'), e('G', 'C')],
    { parts: [{ id: 'gateA', preset: 'gate', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 'x' }] },
  );
  test('a node attached to a closed gate is blocked; opening the gate clears it (D-42)', () => {
    const closed = initialState(gatePage);
    const open = { ...closed, parts: { gateA: 'open' } };
    expect(blockedNodes(gatePage, closed)).toEqual(['G']);
    expect(walkGraph(gatePage, closed, CRAWL).bfs('A', 'C')).toBeNull();
    expect(walkGraph(gatePage, closed, CRAWL).nearestReachableTo('A', 'C')).toEqual({ node: 'A', path: ['A'] });
    expect(blockedNodes(gatePage, open)).toEqual([]);
    expect(walkGraph(gatePage, open, CRAWL).bfs('A', 'C')).toEqual(['A', 'G', 'C']);
  });
  test('a node attached to a part that is not a gate is never blocked by it', () => {
    const def = page(gatePage.nodes, gatePage.edges, {
      parts: [{ id: 'gateA', preset: 'flap', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 'x' }],
    });
    expect(blockedNodes(def, initialState(def))).toEqual([]);
  });
});

describe('reachSet', () => {
  const def = page([n('A'), n('B'), n('C'), n('D'), n('X')], [e('A', 'B'), e('A', 'C'), e('C', 'D'), e('B', 'D')]);
  const g = walkGraph(def, initialState(def), CRAWL);
  test('lists reachable nodes in BFS order with their path lengths', () => {
    const r = g.reachSet('A');
    expect(r.from).toBe('A');
    expect(r.nodes).toEqual(['A', 'B', 'C', 'D']);
    expect(['A', 'B', 'C', 'D', 'X'].map((id) => r.steps(id))).toEqual([0, 1, 1, 2, -1]);
    expect(r.has('D')).toBe(true);
    expect(r.has('X')).toBe(false);
  });
  test('an isolated node reaches only itself; an unknown one reaches nothing', () => {
    expect(g.reachSet('X').nodes).toEqual(['X']);
    const none = g.reachSet('ghost');
    expect(none.nodes).toEqual([]);
    expect(none.has('A')).toBe(false);
    expect(none.steps('A')).toBe(-1);
  });
});

describe('nearestReachableTo', () => {
  test('the smallest straight-line distance wins, even over a longer path', () => {
    // Target T at (100, 0) is cut off. N1 (60, 0) is 1 edge away, N2 (90, 0) is 3 edges away.
    const def = page(
      [n('S', 0, 0), n('N1', 60, 0), n('M1', 0, 50), n('M2', 90, 50), n('N2', 90, 0), n('T', 100, 0)],
      [e('S', 'N1'), e('S', 'M1'), e('M1', 'M2'), e('M2', 'N2')],
    );
    expect(walkGraph(def, initialState(def), CRAWL).nearestReachableTo('S', 'T')).toEqual({ node: 'N2', path: ['S', 'M1', 'M2', 'N2'] });
  });
  test('equal distance: the shorter path wins', () => {
    // Far (100, 40) and Near (100, -40) are both 40 from T (100, 0); Near is closer to S by path.
    const def = page(
      [n('S', 0, 0), n('M', 50, 40), n('Far', 100, 40), n('Near', 100, -40), n('T', 100, 0)],
      [e('S', 'M'), e('M', 'Far'), e('S', 'Near')],
    );
    expect(walkGraph(def, initialState(def), CRAWL).nearestReachableTo('S', 'T')).toEqual({ node: 'Near', path: ['S', 'Near'] });
  });
  test('equal distance and path length: the smaller id wins, whatever the data order', () => {
    for (const order of [
      ['b', 'a'],
      ['a', 'b'],
    ]) {
      const def = page(
        [n('S', 0, 0), n('b', 100, 40), n('a', 100, -40), n('T', 100, 0)],
        order.map((id) => e('S', id)),
      );
      expect(walkGraph(def, initialState(def), CRAWL).nearestReachableTo('S', 'T')).toEqual({ node: 'a', path: ['S', 'a'] });
    }
  });
  test('a reachable target is its own nearest node', () => {
    const def = page([n('S', 0, 0), n('T', 30, 0)], [e('S', 'T')]);
    expect(walkGraph(def, initialState(def), CRAWL).nearestReachableTo('S', 'T')).toEqual({ node: 'T', path: ['S', 'T'] });
  });
  test('accepts a point, and uses attached positions', () => {
    const g = walkGraph(c1p2, train('half'), CRAWL);
    expect(g.nearestReachableTo('L1', [175, 300])?.node).toBe('T2'); // T1 at x 150 is 25 off, T2 at x 190 only 15
    expect(walkGraph(c1p2, train('full'), CRAWL).nearestReachableTo('L1', [175, 300])?.node).toBe('T1'); // the train moved: T1 at 190
  });
  test('unknown ids give null', () => {
    const g = walkGraph(c1p2, train('out'), CRAWL);
    expect(g.nearestReachableTo('ghost', 'R2')).toBeNull();
    expect(g.nearestReachableTo('L1', 'ghost')).toBeNull();
  });
});

/**
 * Micro-benchmark (issue #81 acceptance: ≥ 200,000 BFS calls/s on a 40-node page). Skipped in CI
 * because timings depend on the machine; flip `it.skip` to `it` to run it locally. Each call builds
 * the walk graph for a fresh state (evaluating every edge condition) and runs one corner-to-corner
 * BFS, as the solver will per state.
 */
it.skip('benchmark: ≥ 200k walk-graph + BFS calls per second on a 40-node page', () => {
  const W = 8;
  const H = 5;
  const nodes: NodeDef[] = [];
  const edges: EdgeDef[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      nodes.push(n(`n${y}${x}`, x * 45 + 20, y * 100 + 60));
      // Every third edge depends on the lever, so the build evaluates real conditions.
      if (x > 0) edges.push(e(`n${y}${x - 1}`, `n${y}${x}`, (x + y) % 3 === 0 ? { when: { part: 'lever', in: ['on'] } } : {}));
      if (y > 0) edges.push(e(`n${y - 1}${x}`, `n${y}${x}`, { kind: x % 2 ? 'crawl' : 'climb' }));
    }
  const def = page(nodes, edges, {
    parts: [{ id: 'lever', preset: 'flap', states: ['off', 'on'], hit: { x: 0, y: 0, w: 48, h: 48 }, art: 'x' }],
    creatures: [{ id: 'goose', positions: { a: 'n23' }, initial: 'a', art: 'x' }],
  });
  expect(def.nodes).toHaveLength(40);
  const base = initialState(def);
  const states = [base, { ...base, parts: { lever: 'on' } }];
  const walker: Walker = { who: 'baby', growth: 1 };
  const calls = 400_000;
  let found = 0;
  for (let i = 0; i < 20_000; i++) walkGraph(def, states[i & 1], walker).bfs('n00', 'n47'); // warm-up
  const t0 = performance.now();
  for (let i = 0; i < calls; i++) if (walkGraph(def, states[i & 1], walker).bfs('n00', 'n47')) found++;
  const perSecond = calls / ((performance.now() - t0) / 1000);
  console.log(`graph benchmark: ${Math.round(perSecond).toLocaleString('en')} walk-graph + BFS calls/s`);
  expect(found).toBe(calls);
  expect(perSecond).toBeGreaterThanOrEqual(200_000);
});
