import { holds } from './cond';
import { mochaNode, mochaSettled, catPath } from './mocha';
import { compilePart } from './presets';
import { initialState } from './state';
import { CascadeOverflowError, learned, matchPredicate, partLocked, step } from './step';
import type { Input, PageDef, SimState, SolutionStep } from './types';
import { WORDS, wordAvailable } from './words';

/**
 * The solver (GDD § 3.7): a search over the same `step` the game runs, from a page's initial state
 * (or any state). It proves a page solvable and free of soft-locks (R2), measures par, checks that
 * the 淘氣 and the 土地公 can happen without spoiling the page, and answers "what next?" for hints
 * (#100). Decisions in D-46.
 *
 * - **Graph.** One vertex per state, keyed by `solverKey` (compact; no clock, no bark beat).
 *   From each state the candidate inputs are `candidateInputs`; an input whose next state equals
 *   the `none` successor is pruned (it did nothing a wait wouldn't), as are self-loops and inputs
 *   that repeat an earlier input's successor. Done states are terminal.
 * - **Cost.** A wait costs 0 moves, any other input 1, so par (the fewest non-wait inputs) comes
 *   from a 0-1 BFS: layer by layer in moves, each layer a FIFO over its wait edges.
 * - **Memory.** Vertices are integers (`Map<string, number>`), everything else lives in growable
 *   typed arrays: per vertex the moves, the parent and its input, flags and its edge range; per
 *   edge the target and the input (an index into a small table of distinct inputs). States
 *   themselves are dropped once expanded; a dead end's state is rebuilt by replaying its path.
 * - **Reverse passes** on the explored graph, after the search: which vertices can still reach a
 *   done state (dead ends, mischief and 土地公 reachability), and — lazily, on the first
 *   `nextAction` — each vertex's cost to the goal, (moves, then ticks), by Dijkstra. The tick
 *   tie-break means following `nextAction` always makes progress, even through wait loops.
 *
 * Pure: no clock unless the caller passes one (`opts.clock`; the core may not read the wall clock),
 * which is needed for `timeMs` and fills `ms`.
 */

/** The default state cap (GDD § 3.7). Exceeding it fails a page's test: simplify the page. */
export const DEFAULT_CAP = 2_000_000;
/** Most dead ends a result lists (it counts them all). */
export const MAX_DEAD_ENDS = 20;

export interface SolveOptions {
  /** Most states to explore (default `DEFAULT_CAP`). The search stops with `stop: 'cap'` past it. */
  readonly cap?: number;
  /** Time budget in ms, read from `clock`. The search stops with `stop: 'time'` past it. */
  readonly timeMs?: number;
  /** A millisecond clock (e.g. `() => performance.now()`), for `timeMs` and `ms`. */
  readonly clock?: () => number;
  /**
   * Stop as soon as the first done state is settled (`stop: 'goal'`): par, a shortest solution and
   * `nextAction` from the start are exact, but dead ends aren't analysed (runtime hints, #100).
   */
  readonly stopAtGoal?: boolean;
}

/** A reachable state from which no done state is reachable. */
export interface DeadEnd {
  readonly key: string;
  /** Inputs from the search's start state (waits as `none`), fewest moves first. */
  readonly path: Input[];
  /** The state, rebuilt by replaying `path`. */
  readonly state: SimState;
}

/** A page error the search ran into (GDD § 3.6 rule 12: a reaction loop). */
export interface SolveError {
  readonly kind: 'cascadeOverflow';
  readonly message: string;
  /** The inputs that lead to the overflowing tick, that tick's input last. */
  readonly path: Input[];
}

export interface SolveResult {
  /** A done state was reached. */
  readonly solvable: boolean;
  /** Every reachable state was explored (no cap, timeout, early goal stop or error). */
  readonly complete: boolean;
  /** Why the search ended early, or null when it is complete. */
  readonly stop: null | 'cap' | 'time' | 'goal' | 'error';
  /** The fewest non-wait inputs to a done state, or null when none was reached. */
  readonly par: number | null;
  /** A shortest solution (par moves; waits as `none`, one per tick), or null. */
  readonly solution: Input[] | null;
  /** Up to `MAX_DEAD_ENDS` dead ends in search order (fewest moves first). Empty unless complete. */
  readonly deadEnds: DeadEnd[];
  /** How many dead ends there are, or null when the search is incomplete (unknown). */
  readonly deadEndCount: number | null;
  /** Solvable with waits alone (par 0). */
  readonly trivial: boolean;
  /**
   * Some reachable state from which the goal is still reachable fires the page's mischief. On an
   * incomplete search, `true` is still certain and `false` means "not found".
   */
  readonly mischiefReachable: boolean;
  /** Likewise for the 土地公's `visibleWhen` (absent: always visible). */
  readonly tudigongReachable: boolean;
  readonly statesExplored: number;
  readonly edges: number;
  /** Wall time in ms, or null without `opts.clock`. */
  readonly ms: number | null;
  readonly error: SolveError | null;
  /**
   * The first input of a shortest way (fewest moves, then fewest ticks) from `state` to a done
   * state, `none` meaning "wait"; null when `state` is done or no done state is reachable from it.
   * A state the search didn't expand — or, after an incomplete search, one with no known way to the
   * goal — gets a fresh `solve` from it (same options, stopping at the goal).
   */
  nextAction(state: SimState): Input | null;
}

const NONE: Input = { t: 'none' };

/** A distinct string per distinct input (ids never contain control characters). */
function inputKey(input: Input): string {
  switch (input.t) {
    case 'set':
      return 's\x1f' + input.part + '\x1f' + input.to;
    case 'mocha':
      return 'm\x1f' + input.perch;
    case 'say':
      return 'w\x1f' + input.word;
    case 'tap':
      return 't\x1f' + input.id;
    /* v8 ignore next 2 -- floor is a no-op until #128, so the search prunes it before interning */
    case 'floor':
      return 'f\x1f' + input.node;
    default:
      return input.t;
  }
}

/** Field, group and list separators for `solverKey` (page ids never contain control characters; lint, #86). */
const F = '\x1f';
const G = '\x1e';
const L = '\x1d';

interface KeyOrder {
  readonly parts: readonly string[];
  readonly pushables: readonly string[];
  readonly creatures: readonly string[];
}
const keyOrders = new WeakMap<PageDef, KeyOrder>();
function keyOrder(def: PageDef): KeyOrder {
  let order = keyOrders.get(def);
  if (order === undefined) {
    const isPushable = (p: PageDef['parts'][number]) => p.preset === 'pushable';
    order = {
      parts: def.parts.filter((p) => !isPushable(p)).map((p) => p.id),
      pushables: def.parts.filter(isPushable).map((p) => p.id),
      creatures: def.creatures.map((c) => c.id),
    };
    keyOrders.set(def, order);
  }
  return order;
}

const list = (ids: readonly string[]) => (ids.length < 2 ? (ids.length === 0 ? '' : ids[0]) : [...ids].sort().join(L));
function record(r: Readonly<Record<string, string | number>> | undefined): string {
  if (r === undefined) return '-';
  let out = '';
  for (const k of Object.keys(r).sort()) out += k + '=' + r[k] + L;
  return out;
}

/** The fields `solverKey` reads (or deliberately skips), per object: `KeyCheck` fails to compile when `SimState` gains one. */
type KeyFields = {
  state: 'tick' | 'parts' | 'pushables' | 'creatures' | 'baby' | 'mocha' | 'consumed' | 'flags' | 'dropped' | 'counters' | 'done';
  baby: 'reachTicks' | 'node' | 'mode' | 'facing' | 'refused' | 'lookCount' | 'target' | 'carriedBy' | 'linked';
  mocha: 'perch' | 'path' | 'to' | 'stare' | 'floorNode';
};
type Missing<T, K> = Exclude<keyof T, K>;
type KeyCheck = [Missing<SimState, KeyFields['state']>, Missing<SimState['baby'], KeyFields['baby']>, Missing<SimState['mocha'], KeyFields['mocha']>];
const keyCheck: KeyCheck extends [never, never, never] ? true : KeyCheck = true;
void keyCheck;

/**
 * The solver's key for a state: one compact string per distinct state of `def`, about a fifth of
 * `canonicalKey`'s length and much faster to build. It holds every `SimState` field except two
 * that change nothing but themselves: `tick` (it only grows) and `baby.reachTicks` (the 「要！要！」
 * bark beat, D-43). Sets and records are sorted; part, pushable and creature states follow the
 * page's data order. `KeyCheck` fails to compile when `SimState` gains a field, so the key can't
 * silently miss one.
 */
export function solverKey(def: PageDef, state: SimState): string {
  const order = keyOrder(def);
  let k = '';
  for (const id of order.parts) k += state.parts[id] + F;
  k += G;
  for (const id of order.pushables) k += state.pushables[id] + F;
  k += G;
  for (const id of order.creatures) k += state.creatures[id] + F;
  const b = state.baby;
  const carried = b.carriedBy === undefined ? '-' : b.carriedBy.id + '@' + b.carriedBy.k;
  k += G + b.node + F + b.mode + F + b.facing + F + list(b.refused) + F + b.lookCount + F + (b.target ?? '-') + F + carried + F + (b.linked ? 1 : 0);
  const m = state.mocha;
  k += G + (m.perch ?? '-') + F + m.path.join(L) + F + (m.to ?? '-') + F + (m.stare ?? '-') + F + (m.floorNode ?? '-');
  k += G + list(state.consumed) + G + list(state.flags) + G + record(state.dropped) + G + record(state.counters) + G + (state.done ? 1 : 0);
  return k;
}

/**
 * The inputs the solver tries from `state` (GDD § 3.7), `none` first: a drag to every other stop
 * of each unlocked drag part (tab, slider, wheel, crank), a tap on every unlocked tappable part
 * (flap, prop, tappable light, crank — and tab, slider and wheel, whose tap cycles), `mocha` to
 * every perch he has a path to, `pet` while he's settled, `say` for every available word, and
 * `floor` to every floor node in linked mode. None for a done state.
 */
export function candidateInputs(def: PageDef, state: SimState): Input[] {
  if (state.done) return [];
  const out: Input[] = [NONE];
  for (const part of def.parts) {
    if (part.preset === 'pushable') continue;
    const compiled = compilePart(part);
    if (compiled.input === 'none' || partLocked(def, state, part.id)) continue;
    const current = state.parts[part.id];
    if (compiled.input === 'drag-linear' || compiled.input === 'drag-rotary') {
      for (const to of compiled.states) if (to !== current) out.push({ t: 'set', part: part.id, to });
    }
    if (compiled.tap !== 'none') out.push({ t: 'tap', id: part.id });
  }
  if (mochaNode(def, state) !== null) {
    const m = state.mocha;
    const here = m.path.length > 0 ? m.to : m.perch;
    for (const perch of def.perches) {
      if (perch.id !== here && catPath(def, state, perch.id) !== null) out.push({ t: 'mocha', perch: perch.id });
    }
  }
  if (mochaSettled(state) && state.mocha.stare === undefined) out.push({ t: 'pet' });
  const { mode, linked } = state.baby;
  if (mode !== 'carried' && mode !== 'linked') {
    const knows = learned(state);
    for (const word of WORDS) if (wordAvailable(def, word, knows)) out.push({ t: 'say', word });
  }
  if (linked) for (const node of def.nodes) if (node.height === 0) out.push({ t: 'floor', node: node.id });
  return out;
}

/** Whether the state fires the page's mischief (its counter has reached the count). */
export function firesMischief(def: PageDef, state: SimState): boolean {
  return matchPredicate([], def.mischief.when, state.counters);
}

/** Whether the 土地公 is visible in the state. */
export function tudigongVisible(def: PageDef, state: SimState): boolean {
  return holds(def, state, def.tudigong.visibleWhen);
}

/** `inputs` as `SolutionStep`s, runs of waits folded into `{ wait: n }` (for reports and authoring). */
export function toSolutionSteps(inputs: readonly Input[]): SolutionStep[] {
  const out: SolutionStep[] = [];
  for (const input of inputs) {
    if (input.t === 'none') {
      const last = out.at(-1);
      if (last !== undefined && 'wait' in last && typeof last.wait === 'number') out[out.length - 1] = { wait: last.wait + 1 };
      else out.push({ wait: 1 });
      continue;
    }
    switch (input.t) {
      case 'set':
        out.push({ set: input.part, to: input.to });
        break;
      case 'tap':
        out.push({ tap: input.id });
        break;
      case 'mocha':
        out.push({ mocha: input.perch });
        break;
      case 'pet':
        out.push({ pet: true });
        break;
      case 'say':
        out.push({ say: input.word });
        break;
      case 'floor':
        throw new Error(`toSolutionSteps: 'floor' has no SolutionStep form (linked mode, #128)`);
    }
  }
  return out;
}

// ——— Compact storage ———

/** A growable Int32Array. */
class IntList {
  data: Int32Array;
  length = 0;
  constructor(capacity = 1024) {
    this.data = new Int32Array(capacity);
  }
  push(v: number): void {
    if (this.length === this.data.length) this.grow(this.length * 2);
    this.data[this.length++] = v;
  }
  private grow(capacity: number): void {
    const next = new Int32Array(capacity);
    next.set(this.data);
    this.data = next;
  }
}

/** `moves` of a vertex no edge has improved yet. */
const UNSEEN = 0x7fffffff;

const FLAG_DONE = 1;
const FLAG_MISCHIEF = 2;
const FLAG_TUDIGONG = 4;
const FLAG_EXPANDED = 8;

/** Weights for the goal-cost pass: moves dominate, ticks break ties (2^24 > any path's ticks while the cap is ≤ 16M states). */
const TICK_SPAN = 2 ** 24;

interface Graph {
  readonly n: number;
  readonly flags: Uint8Array;
  readonly edgeStart: Int32Array;
  readonly edgeCount: Int32Array;
  readonly edgeTo: Int32Array;
  readonly edgeInput: Int32Array;
  readonly inputs: readonly Input[];
}

/** The reverse adjacency (CSR) of `g`: for each vertex, the edges that lead into it. */
function reverse(g: Graph): { start: Int32Array; from: Int32Array; input: Int32Array } {
  const start = new Int32Array(g.n + 1);
  for (let u = 0; u < g.n; u++) for (let e = g.edgeStart[u], end = e + g.edgeCount[u]; e < end; e++) start[g.edgeTo[e] + 1]++;
  for (let v = 0; v < g.n; v++) start[v + 1] += start[v];
  const fill = start.slice(0, g.n);
  const total = start[g.n];
  const from = new Int32Array(total);
  const input = new Int32Array(total);
  for (let u = 0; u < g.n; u++) {
    for (let e = g.edgeStart[u], end = e + g.edgeCount[u]; e < end; e++) {
      const slot = fill[g.edgeTo[e]]++;
      from[slot] = u;
      input[slot] = g.edgeInput[e];
    }
  }
  return { start, from, input };
}

/** Which vertices reach a done vertex, by BFS over reversed edges. */
function goalReach(g: Graph, rev: ReturnType<typeof reverse>): Uint8Array {
  const alive = new Uint8Array(g.n);
  const queue = new Int32Array(g.n);
  let tail = 0;
  for (let v = 0; v < g.n; v++) if (g.flags[v] & FLAG_DONE) (alive[v] = 1), (queue[tail++] = v);
  for (let head = 0; head < tail; head++) {
    const v = queue[head];
    for (let e = rev.start[v]; e < rev.start[v + 1]; e++) {
      const u = rev.from[e];
      if (alive[u] === 0) (alive[u] = 1), (queue[tail++] = u);
    }
  }
  return alive;
}

/**
 * Each vertex's cost to a done vertex, `moves * TICK_SPAN + ticks` (Infinity if none), by Dijkstra
 * over reversed edges with a binary heap.
 */
function goalCost(g: Graph, rev: ReturnType<typeof reverse>): Float64Array {
  const cost = new Float64Array(g.n).fill(Infinity);
  const heapCost: number[] = [];
  const heapId: number[] = [];
  const push = (c: number, id: number) => {
    let i = heapCost.length;
    heapCost.push(c);
    heapId.push(id);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapCost[p] <= c) break;
      heapCost[i] = heapCost[p];
      heapId[i] = heapId[p];
      i = p;
    }
    heapCost[i] = c;
    heapId[i] = id;
  };
  const pop = (): number => {
    const top = heapId[0];
    const lastC = heapCost.pop()!;
    const lastId = heapId.pop()!;
    const n = heapCost.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && heapCost[c + 1] < heapCost[c]) c++;
        if (heapCost[c] >= lastC) break;
        heapCost[i] = heapCost[c];
        heapId[i] = heapId[c];
        i = c;
      }
      heapCost[i] = lastC;
      heapId[i] = lastId;
    }
    return top;
  };
  for (let v = 0; v < g.n; v++) if (g.flags[v] & FLAG_DONE) (cost[v] = 0), push(0, v);
  const done = new Uint8Array(g.n);
  while (heapId.length > 0) {
    const c = heapCost[0];
    const v = pop();
    if (done[v] || c > cost[v]) continue;
    done[v] = 1;
    for (let e = rev.start[v]; e < rev.start[v + 1]; e++) {
      const u = rev.from[e];
      const w = (g.inputs[rev.input[e]].t === 'none' ? 0 : TICK_SPAN) + 1;
      if (c + w < cost[u]) (cost[u] = c + w), push(c + w, u);
    }
  }
  return cost;
}

// ——— The search ———

/** GDD § 3.7: solves `def` from `from` (default: its initial state). See the file comment. */
export function solve(def: PageDef, from: SimState = initialState(def), opts: SolveOptions = {}): SolveResult {
  const cap = opts.cap ?? DEFAULT_CAP;
  const clock = opts.clock;
  const t0 = clock?.();

  const ids = new Map<string, number>();
  const moves = new IntList();
  const parent = new IntList();
  const parentInput = new IntList();
  const edgeStart = new IntList();
  const edgeCount = new IntList();
  const edgeTo = new IntList(4096);
  const edgeInput = new IntList(4096);
  let flags = new Uint8Array(1024);

  const inputs: Input[] = [];
  const inputIds = new Map<string, number>();
  const internInput = (input: Input): number => {
    const k = inputKey(input);
    let i = inputIds.get(k);
    if (i === undefined) {
      i = inputs.length;
      inputs.push(input);
      inputIds.set(k, i);
    }
    return i;
  };
  const noneId = internInput(NONE);

  /** The vertex for `state`, created (with its flags) when new. */
  const vertex = (key: string, state: SimState): number => {
    let id = ids.get(key);
    if (id !== undefined) return id;
    id = ids.size;
    ids.set(key, id);
    moves.push(UNSEEN);
    parent.push(-1);
    parentInput.push(0);
    edgeStart.push(0);
    edgeCount.push(0);
    if (id >= flags.length) {
      const next = new Uint8Array(flags.length * 2);
      next.set(flags);
      flags = next;
    }
    let f = 0;
    if (state.done) f |= FLAG_DONE;
    if (firesMischief(def, state)) f |= FLAG_MISCHIEF;
    if (tudigongVisible(def, state)) f |= FLAG_TUDIGONG;
    flags[id] = f;
    return id;
  };

  /** Inputs from the start to vertex `id`, along parent pointers. */
  const pathTo = (id: number): Input[] => {
    const out: Input[] = [];
    for (let v = id; parent.data[v] !== -1; v = parent.data[v]) out.push(inputs[parentInput.data[v]]);
    return out.reverse();
  };

  const root = vertex(solverKey(def, from), from);
  moves.data[root] = 0;

  // 0-1 BFS: `cur` holds the vertices at `layer` moves (wait edges append to it), `next` those at layer + 1.
  let curIds: number[] = [root];
  let curStates: SimState[] = [from];
  let nextIds: number[] = [];
  let nextStates: SimState[] = [];
  let layer = 0;
  let stop: SolveResult['stop'] = null;
  let error: SolveError | null = null;
  let goal = -1;
  let expandedCount = 0;

  search: while (curIds.length > 0) {
    for (let qi = 0; qi < curIds.length; qi++) {
      const u = curIds[qi];
      if (flags[u] & FLAG_EXPANDED || moves.data[u] !== layer) continue;
      if (flags[u] & FLAG_DONE) {
        flags[u] |= FLAG_EXPANDED;
        if (goal === -1) goal = u;
        if (opts.stopAtGoal) {
          stop = 'goal';
          break search;
        }
        continue;
      }
      // Checked before marking `u` expanded, so a stopped search never claims to know u's edges.
      if (ids.size > cap) {
        stop = 'cap';
        break search;
      }
      if (clock !== undefined && opts.timeMs !== undefined && (++expandedCount & 255) === 0 && clock() - t0! > opts.timeMs) {
        stop = 'time';
        break search;
      }
      flags[u] |= FLAG_EXPANDED;
      const state = curStates[qi];

      edgeStart.data[u] = edgeTo.length;
      const seen = new Set<number>([u]);
      let noneVertex = -1;
      for (const input of candidateInputs(def, state)) {
        let next: SimState;
        try {
          next = step(def, state, input).state;
        } catch (e) {
          if (!(e instanceof CascadeOverflowError)) throw e;
          stop = 'error';
          error = { kind: 'cascadeOverflow', message: e.message, path: [...pathTo(u), input] };
          break search;
        }
        const v = vertex(solverKey(def, next), next);
        const wait = input.t === 'none';
        if (wait) noneVertex = v;
        else if (v === noneVertex) continue;
        if (seen.has(v)) continue;
        seen.add(v);
        const inputId = wait ? noneId : internInput(input);
        edgeTo.push(v);
        edgeInput.push(inputId);
        const d = layer + (wait ? 0 : 1);
        if (d < moves.data[v]) {
          moves.data[v] = d;
          parent.data[v] = u;
          parentInput.data[v] = inputId;
          if (wait) curIds.push(v), curStates.push(next);
          else nextIds.push(v), nextStates.push(next);
        }
      }
      edgeCount.data[u] = edgeTo.length - edgeStart.data[u];
    }
    [curIds, curStates, nextIds, nextStates] = [nextIds, nextStates, [], []];
    layer++;
  }

  const n = ids.size;
  const graph: Graph = {
    n,
    flags,
    edgeStart: edgeStart.data,
    edgeCount: edgeCount.data,
    edgeTo: edgeTo.data,
    edgeInput: edgeInput.data,
    inputs,
  };
  const complete = stop === null;
  const rev = reverse(graph);
  const alive = goalReach(graph, rev);

  let mischiefReachable = false;
  let tudigongReachable = false;
  const deadIds: number[] = [];
  let deadEndCount = 0;
  for (let v = 0; v < n; v++) {
    if (alive[v]) {
      if (flags[v] & FLAG_MISCHIEF) mischiefReachable = true;
      if (flags[v] & FLAG_TUDIGONG) tudigongReachable = true;
    } else if (complete) {
      deadEndCount++;
      deadIds.push(v);
    }
  }
  // Search order: fewest moves first, then discovery.
  deadIds.sort((a, b) => moves.data[a] - moves.data[b] || a - b);
  const deadEnds = deadIds.slice(0, MAX_DEAD_ENDS).map((id): DeadEnd => {
    const path = pathTo(id);
    let state = from;
    for (const input of path) state = step(def, state, input).state;
    return { key: solverKey(def, state), path, state };
  });

  const par = goal === -1 ? null : moves.data[goal];
  let cost: Float64Array | null = null;

  const nextAction = (state: SimState): Input | null => {
    if (state.done) return null;
    const u = ids.get(solverKey(def, state));
    const afresh = () => {
      const sub = solve(def, state, { ...opts, stopAtGoal: true });
      return sub.solvable ? sub.nextAction(state) : null;
    };
    if (u === undefined || !(flags[u] & FLAG_EXPANDED)) return afresh();
    cost ??= goalCost(graph, rev);
    // On a partial graph "no way found" may just mean "not explored yet".
    if (cost[u] === Infinity) return complete ? null : afresh();
    // cost[u] is finite, so one of u's edges realises it; the first in candidate order wins.
    const weight = (e: number) => (inputs[graph.edgeInput[e]].t === 'none' ? 0 : TICK_SPAN) + 1;
    let e = graph.edgeStart[u];
    while (weight(e) + cost[graph.edgeTo[e]] !== cost[u]) e++;
    return inputs[graph.edgeInput[e]];
  };

  return {
    solvable: goal !== -1,
    complete,
    stop,
    par,
    solution: goal === -1 ? null : pathTo(goal),
    deadEnds,
    deadEndCount: complete ? deadEndCount : null,
    trivial: par === 0,
    mischiefReachable,
    tudigongReachable,
    statesExplored: n,
    edges: edgeTo.length,
    ms: clock === undefined ? null : clock() - t0!,
    error,
    nextAction,
  };
}
