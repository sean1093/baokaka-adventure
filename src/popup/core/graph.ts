import { holds, partState } from './cond';
import type { EdgeDef, EdgeKind, Growth, Id, PageDef, SimState } from './types';

/**
 * The walk graph (GDD § 2.1, § 2.2.3, § 2.3, § 2.5): node positions, which edges are open for
 * whom, shortest paths, reach sets and the "get as close as you can" fallback. Baokaka's decision
 * loop (#82), Mocha's pathing (#83), the solver and PageLab's overlays all build on this file.
 *
 * Rules:
 * - **Who walks.** Baokaka uses the edge kinds his growth stage allows (0 `crawl`, 1 + `climb`,
 *   2 + `cruise`, 3 + `walk`); Mocha uses `jump` and `squeeze` (linked-mode floor walking is #128).
 * - **Open edges.** An edge is open when its kind is allowed and its `when` holds. A `oneWay` edge
 *   only goes from `a` to `b`.
 * - **Blocked nodes (Baokaka only).** A node is blocked while a blocking creature (`blocks`
 *   defaults to true) stands on it, or while it is attached to a `gate` part that is `closed`
 *   (D-42). A blocked node can't be entered or crossed; the start node never counts as blocked
 *   (he is already there). Mocha is blocked only by the nodes his walker `avoid`s (#83, D-44).
 * - **Shortest path.** BFS in edges. Among equally short paths the one whose sequence of edge
 *   indices (in the data, from the start) is lexicographically smallest wins — "ties broken by
 *   edge order in the data". It falls out of a BFS that expands each node's edges in data order.
 * - **Nearest reachable.** The reachable node with the smallest straight-line distance to a target,
 *   then the shorter path, then the smaller id (code-unit order). Distances are compared squared,
 *   so integer page units compare exactly.
 *
 * Performance (GDD § 3.7: the solver may visit 2,000,000 states): the page's topology is compiled
 * once per `PageDef` (cached by identity, so treat defs as immutable) into typed arrays; a
 * `WalkGraph` costs one condition check per edge and two small typed arrays; BFS reuses scratch
 * buffers owned by the compiled page and allocates only the path it returns.
 */

/**
 * Who is walking: Baokaka at a growth stage, or Mocha. Mocha isn't blocked by creatures or gates;
 * `avoid` lists the nodes he won't step on this tick (perches he refuses, C7/C8, decided by
 * `mocha.ts`). As for Baokaka, the start node never counts.
 */
export type Walker = { who: 'baby'; growth: Growth } | { who: 'cat'; avoid?: readonly Id[] };

export type Point = readonly [number, number];

/** A BFS result over every node reachable from `from`. */
export interface Reach {
  readonly from: Id;
  /** Reachable nodes in BFS order (the start first), so ties come out in edge order. */
  readonly nodes: readonly Id[];
  has(id: Id): boolean;
  /** Path length in edges, or -1 when `id` isn't reachable. */
  steps(id: Id): number;
}

/** Where to head for a target, and the shortest path there (the start first). */
export interface Nearest {
  readonly node: Id;
  readonly path: readonly Id[];
}

const KIND_BIT: Readonly<Record<EdgeKind, number>> = { crawl: 1, climb: 2, cruise: 4, walk: 8, jump: 16, squeeze: 32 };
/** Edge kinds per growth stage (GDD § 2.5): each stage adds one kind. */
const BABY_MASK: readonly number[] = [1, 3, 7, 15];
const CAT_MASK = KIND_BIT.jump | KIND_BIT.squeeze;

/** The edge kinds a walker may use. */
export function walkerKinds(walker: Walker): EdgeKind[] {
  const mask = kindMask(walker);
  return (Object.keys(KIND_BIT) as EdgeKind[]).filter((k) => (mask & KIND_BIT[k]) !== 0);
}

function kindMask(walker: Walker): number {
  return walker.who === 'cat' ? CAT_MASK : BABY_MASK[walker.growth];
}

/** A page's topology as typed arrays, built once per def. */
interface Compiled {
  readonly ids: readonly Id[];
  readonly index: ReadonlyMap<Id, number>;
  /** The edges whose ends both exist, in data order (an edge's index here is its tie-break rank). */
  readonly edges: readonly EdgeDef[];
  readonly edgeKind: Uint8Array;
  /** Directed half-edges in CSR form: node n's are `adjStart[n] … adjStart[n + 1] - 1`, in edge order. */
  readonly adjStart: Int32Array;
  readonly adjTo: Int32Array;
  readonly adjEdge: Int32Array;
  /** Nodes attached to a gate part: [node index, part id]. */
  readonly gateNodes: readonly (readonly [number, Id])[];
  // BFS scratch, reused by every call on this page (the core is single-threaded and synchronous).
  readonly queue: Int32Array;
  readonly prev: Int32Array;
  readonly dist: Int32Array;
  readonly seen: Uint32Array;
  stamp: number;
}

const COMPILED = new WeakMap<PageDef, Compiled>();

function compile(def: PageDef): Compiled {
  const cached = COMPILED.get(def);
  if (cached) return cached;
  const ids = def.nodes.map((n) => n.id);
  const index = new Map<Id, number>();
  ids.forEach((id, i) => {
    if (!index.has(id)) index.set(id, i);
  });
  const n = ids.length;
  // Edges with an unknown end are skipped: lint (#86) reports them.
  const edges = def.edges.filter((e) => index.has(e.a) && index.has(e.b));
  const edgeKind = Uint8Array.from(edges, (e) => KIND_BIT[e.kind] ?? 0);

  const degree = new Int32Array(n + 1);
  for (const e of edges) {
    degree[index.get(e.a)! + 1]++;
    if (!e.oneWay) degree[index.get(e.b)! + 1]++;
  }
  const adjStart = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) adjStart[i + 1] = adjStart[i] + degree[i + 1];
  const fill = adjStart.slice(0, n);
  const adjTo = new Int32Array(adjStart[n]);
  const adjEdge = new Int32Array(adjStart[n]);
  edges.forEach((e, k) => {
    const a = index.get(e.a)!;
    const b = index.get(e.b)!;
    adjTo[fill[a]] = b;
    adjEdge[fill[a]++] = k;
    if (!e.oneWay) {
      adjTo[fill[b]] = a;
      adjEdge[fill[b]++] = k;
    }
  });

  const gates = new Set(def.parts.filter((p) => p.preset === 'gate').map((p) => p.id));
  const gateNodes = def.nodes.flatMap((node, i) => (node.attach && gates.has(node.attach.part) ? [[i, node.attach.part] as const] : []));

  const compiled: Compiled = {
    ids,
    index,
    edges,
    edgeKind,
    adjStart,
    adjTo,
    adjEdge,
    gateNodes,
    queue: new Int32Array(n),
    prev: new Int32Array(n),
    dist: new Int32Array(n),
    seen: new Uint32Array(n),
    stamp: 0,
  };
  COMPILED.set(def, compiled);
  return compiled;
}

/**
 * A node's position in page units: an attached node takes the position for its part's current
 * state (falling back to its own `x, y` if that state has none — lint rule 4 forbids it).
 * Unknown ids are `undefined`.
 */
export function nodePos(def: PageDef, state: SimState, nodeId: Id): Point | undefined {
  const i = compile(def).index.get(nodeId);
  return i === undefined ? undefined : posAt(def, state, i);
}

function posAt(def: PageDef, state: SimState, i: number): Point {
  const node = def.nodes[i];
  if (node.attach) {
    const s = partState(state, node.attach.part);
    const pos = s === undefined ? undefined : node.attach.pos[s];
    if (pos) return pos;
  }
  return [node.x, node.y];
}

/** Squared straight-line distance between two points (exact for integer page units). */
export function dist2(p: Point, q: Point): number {
  const dx = p[0] - q[0];
  const dy = p[1] - q[1];
  return dx * dx + dy * dy;
}

/** The edges open for `walker` in `state`, in data order (PageLab draws the rest dashed). */
export function openEdges(def: PageDef, state: SimState, walker: Walker): EdgeDef[] {
  const g = compile(def);
  const mask = kindMask(walker);
  return g.edges.filter((e, k) => (g.edgeKind[k] & mask) !== 0 && holds(def, state, e.when));
}

/**
 * Nodes Baokaka can't enter in `state`, in node order: those under a blocking creature, and those
 * attached to a closed gate (D-42). Mocha is never blocked by them.
 */
export function blockedNodes(def: PageDef, state: SimState): Id[] {
  const g = compile(def);
  const blocked = blockedMask(def, state, g);
  return g.ids.filter((_, i) => blocked[i] === 1);
}

function blockedMask(def: PageDef, state: SimState, g: Compiled): Uint8Array {
  const blocked = new Uint8Array(g.ids.length);
  for (const c of def.creatures) {
    if (c.blocks === false) continue;
    const posName = state.creatures[c.id];
    const node = posName === undefined ? undefined : c.positions[posName];
    const i = node === undefined || node === 'offpage' ? undefined : g.index.get(node);
    if (i !== undefined) blocked[i] = 1;
  }
  for (const [i, part] of g.gateNodes) if (partState(state, part) === 'closed') blocked[i] = 1;
  return blocked;
}

/** The cat walker's `avoid` list as a mask, or null when it avoids nothing (unknown ids are ignored). */
function avoidMask(g: Compiled, avoid: readonly Id[] | undefined): Uint8Array | null {
  if (avoid === undefined || avoid.length === 0) return null;
  const mask = new Uint8Array(g.ids.length);
  for (const id of avoid) {
    const i = g.index.get(id);
    if (i !== undefined) mask[i] = 1;
  }
  return mask;
}

/**
 * The walk graph for one walker in one state. Build it once per tick (or per solver state) and
 * ask it as many questions as needed; it doesn't see later changes to `state`.
 */
export class WalkGraph {
  private readonly g: Compiled;
  private readonly open: Uint8Array;
  private readonly blocked: Uint8Array | null;

  constructor(
    readonly def: PageDef,
    readonly state: SimState,
    readonly walker: Walker,
  ) {
    const g = (this.g = compile(def));
    const mask = kindMask(walker);
    const open = (this.open = new Uint8Array(g.edges.length));
    for (let k = 0; k < open.length; k++) {
      if ((g.edgeKind[k] & mask) === 0) continue;
      const when = g.edges[k].when;
      if (when === undefined || holds(def, state, when)) open[k] = 1;
    }
    this.blocked = walker.who === 'baby' ? blockedMask(def, state, g) : avoidMask(g, walker.avoid);
  }

  /**
   * BFS from `from` (stopping once `stopAt` is dequeued; -1 = explore everything). Fills the page's
   * scratch arrays: `queue[0 … tail-1]` are the visited nodes in BFS order, `seen[v] === g.stamp`
   * marks them, `dist`/`prev` hold their path lengths and parents. Returns `tail`.
   */
  private search(from: number, stopAt: number): number {
    const g = this.g;
    const { queue, prev, dist, seen, adjStart, adjTo, adjEdge } = g;
    const open = this.open;
    const blocked = this.blocked;
    /* v8 ignore next 4 -- the stamp wraps after 2³² searches on one page */
    if (g.stamp === 0xffffffff) {
      seen.fill(0);
      g.stamp = 0;
    }
    const stamp = ++g.stamp;
    seen[from] = stamp;
    dist[from] = 0;
    prev[from] = -1;
    queue[0] = from;
    let head = 0;
    let tail = 1;
    while (head < tail) {
      const u = queue[head++];
      if (u === stopAt) break;
      const du = dist[u] + 1;
      for (let h = adjStart[u], end = adjStart[u + 1]; h < end; h++) {
        if (open[adjEdge[h]] === 0) continue;
        const v = adjTo[h];
        if (seen[v] === stamp || (blocked !== null && blocked[v] === 1)) continue;
        seen[v] = stamp;
        dist[v] = du;
        prev[v] = u;
        queue[tail++] = v;
      }
    }
    return tail;
  }

  private pathTo(target: number): Id[] {
    const { prev, dist, ids } = this.g;
    const path = new Array<Id>(dist[target] + 1);
    for (let v = target, k = path.length - 1; v !== -1; v = prev[v], k--) path[k] = ids[v];
    return path;
  }

  /**
   * The shortest path from `from` to `to` (both included; `[from]` when they're equal), ties broken
   * by edge order; `null` when `to` is unreachable or either id is unknown.
   */
  bfs(from: Id, to: Id): Id[] | null {
    const { index, seen } = this.g;
    const s = index.get(from);
    const t = index.get(to);
    if (s === undefined || t === undefined) return null;
    this.search(s, t);
    return seen[t] === this.g.stamp ? this.pathTo(t) : null;
  }

  /** Every node reachable from `from` (empty for an unknown id). */
  reachSet(from: Id): Reach {
    const g = this.g;
    const s = g.index.get(from);
    if (s === undefined) return { from, nodes: [], has: () => false, steps: () => -1 };
    const tail = this.search(s, -1);
    const steps = new Map<Id, number>();
    for (let i = 0; i < tail; i++) steps.set(g.ids[g.queue[i]], g.dist[g.queue[i]]);
    const nodes = [...steps.keys()];
    return { from, nodes, has: (id) => steps.has(id), steps: (id) => steps.get(id) ?? -1 };
  }

  /**
   * The reachable node closest to `target` (a node id or a point): smallest squared straight-line
   * distance, then shortest path, then smallest id — and the path there. `null` for an unknown
   * `from` or target node. When the target node itself is reachable, that's the answer.
   */
  nearestReachableTo(from: Id, target: Id | Point): Nearest | null {
    const g = this.g;
    const s = g.index.get(from);
    const goal = typeof target === 'string' ? nodePos(this.def, this.state, target) : target;
    if (s === undefined || goal === undefined) return null;
    const tail = this.search(s, -1);
    let best = -1;
    let bestD2 = Infinity;
    for (let i = 0; i < tail; i++) {
      const v = g.queue[i];
      const d2 = dist2(posAt(this.def, this.state, v), goal);
      if (
        best === -1 ||
        d2 < bestD2 ||
        (d2 === bestD2 && (g.dist[v] < g.dist[best] || (g.dist[v] === g.dist[best] && g.ids[v] < g.ids[best])))
      ) {
        best = v;
        bestD2 = d2;
      }
    }
    return { node: g.ids[best], path: this.pathTo(best) };
  }
}

/** Shorthand for `new WalkGraph(def, state, walker)`. */
export function walkGraph(def: PageDef, state: SimState, walker: Walker): WalkGraph {
  return new WalkGraph(def, state, walker);
}
