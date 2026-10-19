import { holds, partState } from './cond';
import type { Bark, SimEvent } from './events';
import { dist2, nodePos, walkGraph, type Point, type WalkGraph } from './graph';
import { mochaAttractorNode } from './mocha';
import type { AttractorDef, BabyMode, Growth, Id, Kind, PageDef, SimState } from './types';

/**
 * Baokaka's decision loop (GDD § 2.2, § 3.3 phases 5–6). He is never controlled: every tick he
 * picks a target by fixed rules and moves at most one edge. Players solve pages by reading these
 * rules, so they are exact and deterministic. Decisions in D-43.
 *
 * - **Candidates** (§ 2.2.1): page attractors whose `visibleWhen` and `activeWhen` hold, that
 *   are not consumed or refused, and that are somewhere on the page; plus Mocha (id `'mocha'`,
 *   priority 2) while he is settled on a perch that doesn't hide him, at the perch's `reachNode`
 *   (`mochaAttractorNode`, `mocha.ts`: a `hidesMocha` perch or a `box` node hides him, C9).
 * - **Target** (§ 2.2.2): candidates sorted by priority, reachable first, path length, squared
 *   straight-line distance from Baokaka, then id (code-unit order). Unreachable candidates tie on
 *   path length. Decoys always count as unreachable: he never grabs one.
 * - **Movement** (§ 2.2.3): one edge of the shortest path to a reachable target; toward the
 *   reachable node nearest an unreachable one; once there, `reaching` (facing the target, 「要！要！」
 *   every 4 ticks). Facing is the direction of the last move.
 * - **Arrival** (§ 3.3 phase 6, same tick as the move): shiny → `grabbing` (consumed; the goal
 *   sets `done`), snack → `eating` (consumed), Mocha → `cuddling`, light → `watching` (both last
 *   while the target stays). The first arrival clears `refused`.
 * - **Nothing to want** (§ 2.2.5): `looking` for 2 ticks, then `crying`, emitting `cry`
 *   (radius 220) each tick, until any candidate appears (silently: no bark on comfort).
 * - **reachHigh** (§ 2.5): from growth 2, a height-1 attractor can be grabbed from an adjacent
 *   node. Behind `REACH_HIGH_ENABLED` (off until M4) or `BabyOptions.reachHigh`.
 *
 * `carried`, `linked` and `saying` are the tick's (#84, M3/M4): `babyTick` leaves a carried or
 * linked baby alone and treats `saying` as already resolved.
 */

/** Mocha's id as a candidate (and in `baby.refused` / `baby.target`). */
export const MOCHA: Id = 'mocha';
/** § 2.2.5: radius of the `cry` event, in page units, from Baokaka's position. */
export const CRY_RADIUS = 220;
/** § 2.2.5: ticks of `looking` before `crying`. */
export const LOOK_TICKS = 2;
/** § 2.2.3: 「要！要！」 every this many ticks of `reaching`. */
export const REACH_BARK_EVERY = 4;
/** § 2.5 feature switch: M4 (扶著站) turns it on; pages can't until then. */
export const REACH_HIGH_ENABLED = false;

/** § 2.2.1: lower = wants it more. A page may override it (`priorityOverride`, page E). */
export const KIND_PRIORITY: Readonly<Record<Kind, number>> = { shiny: 1, mocha: 2, snack: 3, light: 4 };
/** § 2.2.1: the bark on choosing a target of each kind. */
export const CHOOSE_BARK: Readonly<Record<Kind, Bark>> = { shiny: 'want', mocha: 'meow', snack: 'milk', light: 'pretty' };
/** § 3.3 phase 6: the mode each kind's arrival puts him in. */
export const ARRIVAL_MODE: Readonly<Record<Kind, BabyMode>> = { shiny: 'grabbing', mocha: 'cuddling', snack: 'eating', light: 'watching' };

export interface BabyOptions {
  /** Growth stage; defaults to the page's `baby.growth`, else 0 (crawl). */
  growth?: Growth;
  /** Enables § 2.5's reachHigh (it still needs growth ≥ 2). Defaults to `REACH_HIGH_ENABLED`. */
  reachHigh?: boolean;
  /**
   * The state at the start of the tick. When given, refusals of attractors that changed in between
   * (moved, hidden, revealed, consumed) are cleared first (§ 2.4 不要！).
   */
  prev?: SimState;
}

/** Something he could want this tick. */
export interface Candidate {
  readonly id: Id;
  readonly kind: Kind;
  /** Where it is now (after `nodeBy`, `heldBy`, `followsPushable`). */
  readonly node: Id;
  readonly height: 0 | 1;
  readonly decoy: boolean;
  readonly goal: boolean;
}

/** A candidate with its § 2.2.2 sort key. */
export interface Ranked extends Candidate {
  readonly priority: number;
  /** The node he must stand on to have it (itself, or an adjacent node with reachHigh); null = unreachable. */
  readonly approach: Id | null;
  /** Path length in edges to `approach`; Infinity when unreachable. */
  readonly steps: number;
  /** Squared straight-line distance from Baokaka; Infinity for an unknown node. */
  readonly d2: number;
}

export interface BabyResult {
  readonly state: SimState;
  readonly events: SimEvent[];
}

/** The growth stage the decision loop uses. */
export function babyGrowth(def: PageDef, opts: BabyOptions = {}): Growth {
  return opts.growth ?? def.baby.growth ?? 0;
}

/**
 * Where an attractor is now, or null when it's nowhere he can see: held by a creature that is
 * off the page, or a pushable mid-fall.
 */
export function attractorNode(def: PageDef, state: SimState, a: AttractorDef): Id | null {
  if (a.followsPushable !== undefined) {
    const pushable = state.pushables[a.followsPushable];
    if (pushable === 'falling') return null;
    if (pushable === 'landed') return def.parts.find((p) => p.id === a.followsPushable)?.fall?.fallTo ?? a.node;
    return a.node;
  }
  if (a.heldBy !== undefined) {
    const creature = def.creatures.find((c) => c.id === a.heldBy);
    const pos = creature === undefined ? undefined : state.creatures[creature.id];
    const node = creature === undefined || pos === undefined ? undefined : creature.positions[pos];
    return node === undefined || node === 'offpage' ? null : node;
  }
  if (a.nodeBy !== undefined) {
    const s = partState(state, a.nodeBy.part);
    return (s === undefined ? undefined : a.nodeBy.map[s]) ?? a.node;
  }
  return a.node;
}

/** An attractor's node if it is visible, active and not consumed (refusal aside); else null. */
function availableNode(def: PageDef, state: SimState, a: AttractorDef): Id | null {
  if (state.consumed.includes(a.id)) return null;
  if (!holds(def, state, a.visibleWhen) || !holds(def, state, a.activeWhen)) return null;
  return attractorNode(def, state, a);
}

/** § 2.2.1: everything he could want this tick, in data order with Mocha last. */
export function candidates(def: PageDef, state: SimState): Candidate[] {
  const refused = state.baby.refused;
  const out: Candidate[] = [];
  for (const a of def.attractors) {
    if (refused.includes(a.id)) continue;
    const node = availableNode(def, state, a);
    if (node === null) continue;
    out.push({ id: a.id, kind: a.kind, node, height: a.height ?? 0, decoy: a.decoy === true, goal: a.goal === true });
  }
  const mocha = mochaAttractorNode(def, state);
  if (mocha !== null && !refused.includes(MOCHA)) out.push({ id: MOCHA, kind: 'mocha', node: mocha, height: 0, decoy: false, goal: false });
  return out;
}

const cmp = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);

/** § 2.2.2's order. */
export function compareRanked(a: Ranked, b: Ranked): number {
  return (
    cmp(a.priority, b.priority) ||
    cmp(a.approach === null ? 1 : 0, b.approach === null ? 1 : 0) ||
    cmp(a.steps, b.steps) ||
    cmp(a.d2, b.d2) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** Nodes joined to `node` by an edge whose condition holds (any kind, either direction), sorted by id. */
function adjacentNodes(def: PageDef, state: SimState, node: Id): Id[] {
  const out = new Set<Id>();
  for (const e of def.edges) {
    if (e.a !== node && e.b !== node) continue;
    if (!holds(def, state, e.when)) continue;
    out.add(e.a === node ? e.b : e.a);
  }
  return [...out].sort();
}

function rank(def: PageDef, state: SimState, opts: BabyOptions): { ranked: Ranked[]; graph: WalkGraph } {
  const growth = babyGrowth(def, opts);
  const reachHigh = (opts.reachHigh ?? REACH_HIGH_ENABLED) && growth >= 2;
  const graph = walkGraph(def, state, { who: 'baby', growth });
  const from = state.baby.node;
  const reach = graph.reachSet(from);
  const here = nodePos(def, state, from);
  const priorities = def.priorityOverride;

  const ranked = candidates(def, state).map((c): Ranked => {
    let approach: Id | null = null;
    let steps = Infinity;
    if (!c.decoy) {
      if (reach.has(c.node)) {
        approach = c.node;
        steps = reach.steps(c.node);
      } else if (reachHigh && c.height === 1) {
        for (const adj of adjacentNodes(def, state, c.node)) {
          const s = reach.steps(adj);
          if (s >= 0 && s < steps) {
            approach = adj;
            steps = s;
          }
        }
      }
    }
    const there = nodePos(def, state, c.node);
    const d2 = here === undefined || there === undefined ? Infinity : dist2(here, there);
    return { ...c, priority: priorities?.[c.kind] ?? KIND_PRIORITY[c.kind], approach, steps, d2 };
  });
  ranked.sort(compareRanked);
  return { ranked, graph };
}

/** Every candidate in § 2.2.2 order with its sort key (PageLab's "why" panel, tests). */
export function rankCandidates(def: PageDef, state: SimState, opts: BabyOptions = {}): Ranked[] {
  return rank(def, state, opts).ranked;
}

/** § 2.2.2: this tick's target, or null when he wants nothing. */
export function selectTarget(def: PageDef, state: SimState, opts: BabyOptions = {}): Ranked | null {
  return rankCandidates(def, state, opts)[0] ?? null;
}

/** What a refusal is tied to: an attractor's place and availability. A change clears the refusal. */
function refusalKey(def: PageDef, state: SimState, id: Id): string {
  let node: Id | null;
  if (id === MOCHA) node = mochaAttractorNode(def, state);
  else {
    const a = def.attractors.find((x) => x.id === id);
    node = a === undefined ? null : availableNode(def, state, a);
  }
  if (node === null) return '-';
  const pos = nodePos(def, state, node);
  return pos === undefined ? node : `${node}@${pos[0]},${pos[1]}`;
}

/** § 2.4: refusals whose attractor changed between `prev` and `state` are dropped. */
export function keepRefusals(def: PageDef, prev: SimState, state: SimState): Id[] {
  return state.baby.refused.filter((id) => refusalKey(def, prev, id) === refusalKey(def, state, id));
}

/** The facing for a move or a look from `from` toward `to`: by x, unchanged when level. */
function facingToward(from: Point | undefined, to: Point | undefined, facing: 'l' | 'r'): 'l' | 'r' {
  if (from === undefined || to === undefined || from[0] === to[0]) return facing;
  return to[0] < from[0] ? 'l' : 'r';
}

/**
 * § 3.3 phases 5 (decision loop, one edge) and 6 (arrival effects) for a baby who isn't carried
 * or linked. Pure: returns the new state and the events, in order. Doesn't advance `tick`.
 */
export function babyTick(def: PageDef, state: SimState, opts: BabyOptions = {}): BabyResult {
  const before = state.baby;
  if (state.done) {
    return { state: before.mode === 'done' ? state : { ...state, baby: { ...before, mode: 'done' } }, events: [] };
  }
  if (before.mode === 'carried' || before.mode === 'linked') return { state, events: [] };

  const events: SimEvent[] = [];
  let refused = opts.prev ? keepRefusals(def, opts.prev, state) : before.refused;
  let s: SimState = refused.length === before.refused.length ? state : { ...state, baby: { ...before, refused } };
  const { ranked, graph } = rank(def, s, opts);
  const target = ranked[0];

  // § 2.2.5: nothing to want.
  if (target === undefined) {
    let mode: BabyMode = 'looking';
    let lookCount = 1;
    if (before.mode === 'crying' || (before.mode === 'looking' && before.lookCount >= LOOK_TICKS)) {
      mode = 'crying';
      lookCount = 0;
    } else if (before.mode === 'looking') lookCount = before.lookCount + 1;
    if (mode === 'crying') {
      const at = nodePos(def, s, before.node);
      events.push(at === undefined ? { type: 'cry', within: CRY_RADIUS } : { type: 'cry', at, within: CRY_RADIUS });
    }
    return { state: { ...s, baby: { ...s.baby, mode, lookCount, target: null, reachTicks: 0 } }, events };
  }

  // A new target: the kind's bark — except when it ends crying (comfort is silent, § 2.2.5).
  const newTarget = target.id !== before.target;
  if (newTarget && before.mode !== 'crying') events.push({ type: 'bark', id: target.id, bark: CHOOSE_BARK[target.kind] });

  let node = before.node;
  let facing = before.facing;
  let mode: BabyMode;
  let reachTicks = 0;

  if (target.approach !== null) {
    // Reachable: one edge of the shortest path, then arrival effects if he's there.
    if (target.approach !== node) {
      const path = graph.bfs(node, target.approach)!;
      ({ node, facing } = step(def, s, node, path[1], facing, events));
    }
    mode = node === target.approach ? ARRIVAL_MODE[target.kind] : 'moving';
  } else {
    // Unreachable (or a decoy): get as close as possible, then reach for it.
    const nearest = graph.nearestReachableTo(node, target.node);
    if (nearest !== null && nearest.node !== node) {
      ({ node, facing } = step(def, s, node, nearest.path[1], facing, events));
      mode = 'moving';
    } else {
      mode = 'reaching';
      facing = facingToward(nodePos(def, s, node), nodePos(def, s, target.node), facing);
      reachTicks = before.mode === 'reaching' && !newTarget ? (before.reachTicks + 1) % REACH_BARK_EVERY : 0;
      // A new target already barked (or was a silent comfort), so 「要！要！」 waits for the next beat.
      if (reachTicks === 0 && !newTarget) events.push({ type: 'bark', id: target.id, bark: 'wantWant' });
    }
  }

  let consumed = s.consumed;
  let done = false;
  if (target.approach === node) {
    // § 3.3 phase 6. Staying with Mocha or a light is not a new arrival.
    const staying = before.mode === mode && !newTarget;
    if (!staying) refused = [];
    if (target.kind === 'shiny') {
      consumed = [...consumed, target.id];
      events.push({ type: 'grab', id: target.id });
      done = target.goal;
    } else if (target.kind === 'snack') {
      consumed = [...consumed, target.id];
      events.push({ type: 'eat', id: target.id });
    }
  }

  s = {
    ...s,
    consumed,
    done,
    baby: { ...s.baby, node, facing, mode, refused, lookCount: 0, target: target.id, reachTicks },
  };
  return { state: s, events };
}

/** Moves one edge and emits `babyEnter`; facing follows the move. */
function step(def: PageDef, state: SimState, from: Id, to: Id, facing: 'l' | 'r', events: SimEvent[]): { node: Id; facing: 'l' | 'r' } {
  events.push({ type: 'babyEnter', id: to });
  return { node: to, facing: facingToward(nodePos(def, state, from), nodePos(def, state, to), facing) };
}
