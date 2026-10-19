import { PAGELAB } from '../../art/palette';
import { KIND_PRIORITY, MOCHA, attractorNode, rankCandidates } from '../core/baby';
import { holds, partState } from '../core/cond';
import type { SimEvent } from '../core/events';
import { nodePos, walkGraph, type Point } from '../core/graph';
import { mochaAttractorNode } from '../core/mocha';
import { candidateInputs } from '../core/solver';
import { initialState } from '../core/state';
import { step, stepGrowth } from '../core/step';
import type { EdgeKind, Id, Input, Kind, PageDef, SimState } from '../core/types';
import type { PageReport } from '../pages/report';
import { isPlaceholder, hasBackdropArt, hasCreatureArt } from '../view/art/registry';
import { cutoutImage } from '../env/loader';
import { targetsOf } from '../view/gestures';

/**
 * PageLab's model (GDD § 3.10, #91), pure so it is unit-tested: the lab's own small runner (a
 * history-free stepper with an event log, so any state can be loaded and stepped by hand), what
 * the overlays draw, the edit operations, and the readability and art-key reports. The React side
 * (`LabWorkspace.tsx`, `Overlays.tsx`) only renders these.
 */

// ——— The runner ———

/** Ticks the event log keeps (GDD § 3.10: "the event log of the last 20 ticks"). */
export const LOG_TICKS = 20;

export interface LabTick {
  /** The tick number the input applied on (the state's `tick` before the step). */
  readonly tick: number;
  readonly input: Input;
  readonly events: readonly SimEvent[];
}

export interface LabSim {
  /** The state before the latest tick (equal to `state` right after a load). */
  readonly prev: SimState;
  readonly state: SimState;
  /** The latest ticks, oldest first, at most `LOG_TICKS`. */
  readonly log: readonly LabTick[];
  /** A step that threw (a reaction loop): the message, until the next load. */
  readonly error: string | null;
}

/** The state after `ticks` idle ticks from the page's start (`tick=` in the URL). */
export function idleState(def: PageDef, ticks: number): SimState {
  let s = initialState(def);
  for (let i = 0; i < ticks && !s.done; i++) s = step(def, s, { t: 'none' }).state;
  return s;
}

/** A fresh runner on `state`. */
export function labLoad(state: SimState): LabSim {
  return { prev: state, state, log: [], error: null };
}

/** One tick with `input`. A done page doesn't tick; a step that throws leaves the state and records the error. */
export function labStep(def: PageDef, sim: LabSim, input: Input): LabSim {
  if (sim.state.done) return sim;
  try {
    const r = step(def, sim.state, input);
    const log = [...sim.log, { tick: sim.state.tick, input, events: r.events }].slice(-LOG_TICKS);
    return { prev: sim.state, state: r.state, log, error: null };
  } catch (e) {
    return { ...sim, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Every legal non-wait input now (the solver's candidate list, GDD § 3.7): the input palette. */
export function legalInputs(def: PageDef, state: SimState): Input[] {
  return candidateInputs(def, state).filter((i) => i.t !== 'none');
}

/** A short label for an input (palette buttons, the log, the solution list). */
export function inputLabel(input: Input): string {
  switch (input.t) {
    case 'set':
      return `${input.part} → ${input.to}`;
    case 'tap':
      return `tap ${input.id}`;
    case 'mocha':
      return `摩卡 → ${input.perch}`;
    case 'pet':
      return 'pet 摩卡';
    case 'say':
      return `say ${input.word}`;
    case 'floor':
      return `floor ${input.node}`;
    default:
      return 'wait';
  }
}

/** Inputs as labels, runs of waits folded (`wait ×3`): solutions and dead-end paths in the solver panel. */
export function compactInputs(inputs: readonly Input[]): string[] {
  const out: string[] = [];
  let waits = 0;
  const flush = () => {
    if (waits > 0) out.push(waits === 1 ? 'wait' : `wait ×${waits}`);
    waits = 0;
  };
  for (const i of inputs) {
    if (i.t === 'none') waits++;
    else {
      flush();
      out.push(inputLabel(i));
    }
  }
  flush();
  return out;
}

/** A short label for an event in the log, e.g. `partEnter train=half`, `bark want`. */
export function eventLabel(e: SimEvent): string {
  const detail = [e.id, e.state === undefined ? undefined : `=${e.state}`, e.bark, e.word].filter((x) => x !== undefined).join(' ').replace(' =', '=');
  return detail ? `${e.type} ${detail}` : e.type;
}

// ——— What the overlays draw ———

/** Dot colours per node height (0 floor, 1 ledge, 2 high), and per edge kind. */
export const HEIGHT_COLORS = [PAGELAB.height0, PAGELAB.height1, PAGELAB.height2] as const;
export const EDGE_COLORS: Readonly<Record<EdgeKind, string>> = {
  crawl: PAGELAB.crawl,
  climb: PAGELAB.climb,
  cruise: PAGELAB.cruise,
  walk: PAGELAB.walk,
  jump: PAGELAB.jump,
  squeeze: PAGELAB.squeeze,
};
/** Edge kinds only Mocha uses (GDD § 2.3): drawn as cat edges. */
export const CAT_KINDS: ReadonlySet<EdgeKind> = new Set<EdgeKind>(['jump', 'squeeze']);

export interface NodeMark {
  readonly id: Id;
  readonly at: Point;
  readonly height: 0 | 1 | 2;
  /** Rides a part (`attach`): edit mode moves its position for the part's current state. */
  readonly attachedTo: Id | null;
}

export interface EdgeMark {
  readonly a: Id;
  readonly b: Id;
  readonly from: Point;
  readonly to: Point;
  readonly kind: EdgeKind;
  /** Its `when` holds now (closed edges are drawn dashed). */
  readonly open: boolean;
  readonly oneWay: boolean;
  readonly cat: boolean;
}

export interface PerchMark {
  readonly id: Id;
  readonly at: Point;
  /** Where Baokaka goes when Mocha here is his target. */
  readonly reach: Point | null;
  readonly occupied: boolean;
}

export interface AttractorMark {
  readonly id: Id;
  readonly kind: Kind;
  readonly at: Point;
  readonly priority: number;
  /** 1-based place in § 2.2.2's order, or null when he can't want it now (hidden, consumed, refused). */
  readonly rank: number | null;
  /** He has a path to it. */
  readonly reachable: boolean;
  readonly goal: boolean;
}

export interface TargetMark {
  readonly id: Id;
  readonly from: Point;
  readonly to: Point;
  /** His path toward it (the nearest reachable node if he can't get there), start first. */
  readonly path: readonly Point[];
}

export interface OverlayModel {
  readonly nodes: readonly NodeMark[];
  readonly edges: readonly EdgeMark[];
  readonly perches: readonly PerchMark[];
  readonly attractors: readonly AttractorMark[];
  readonly target: TargetMark | null;
  /** Mocha's remaining trip (his current node first), when travelling. */
  readonly mochaPath: readonly Point[];
}

const points = (def: PageDef, state: SimState, ids: readonly Id[]): Point[] =>
  ids.map((id) => nodePos(def, state, id)).filter((p): p is Point => p !== undefined);

/** Everything the overlays draw for `state`, in page units. */
export function overlayModel(def: PageDef, state: SimState): OverlayModel {
  const at = (id: Id) => nodePos(def, state, id);
  const nodes = def.nodes.flatMap((n): NodeMark[] => {
    const p = at(n.id);
    return p === undefined ? [] : [{ id: n.id, at: p, height: n.height, attachedTo: n.attach?.part ?? null }];
  });
  const edges = def.edges.flatMap((e): EdgeMark[] => {
    const from = at(e.a);
    const to = at(e.b);
    if (from === undefined || to === undefined) return [];
    return [{ a: e.a, b: e.b, from, to, kind: e.kind, open: holds(def, state, e.when), oneWay: e.oneWay === true, cat: CAT_KINDS.has(e.kind) }];
  });
  const perches = def.perches.flatMap((p): PerchMark[] => {
    const pos = at(p.node);
    if (pos === undefined) return [];
    return [{ id: p.id, at: pos, reach: (p.reachNode === undefined ? undefined : at(p.reachNode)) ?? null, occupied: state.mocha.perch === p.id }];
  });

  const ranked = rankCandidates(def, state);
  const attractors: AttractorMark[] = [];
  ranked.forEach((r, i) => {
    const p = at(r.node);
    if (p) attractors.push({ id: r.id, kind: r.kind, at: p, priority: r.priority, rank: i + 1, reachable: r.approach !== null, goal: r.goal });
  });
  for (const a of def.attractors) {
    if (ranked.some((r) => r.id === a.id) || state.consumed.includes(a.id)) continue;
    const node = attractorNode(def, state, a);
    const p = node === null ? undefined : at(node);
    if (p) attractors.push({ id: a.id, kind: a.kind, at: p, priority: def.priorityOverride?.[a.kind] ?? KIND_PRIORITY[a.kind], rank: null, reachable: false, goal: a.goal === true });
  }

  return { nodes, edges, perches, attractors, target: targetMark(def, state), mochaPath: points(def, state, state.mocha.path) };
}

/** Baokaka's current target: the line to it and his path preview. */
function targetMark(def: PageDef, state: SimState): TargetMark | null {
  const { target, node } = state.baby;
  if (target === null || state.done) return null;
  let goal: Id | null;
  if (target === MOCHA) goal = mochaAttractorNode(def, state);
  else {
    const a = def.attractors.find((x) => x.id === target);
    goal = a === undefined ? null : attractorNode(def, state, a);
  }
  const from = nodePos(def, state, node);
  const to = goal === null ? undefined : nodePos(def, state, goal);
  if (goal === null || from === undefined || to === undefined) return null;
  const near = walkGraph(def, state, { who: 'baby', growth: stepGrowth(def, state) }).nearestReachableTo(node, goal);
  return { id: target, from, to, path: near === null ? [from] : points(def, state, near.path) };
}

// ——— Edit mode ———

/**
 * `def` with node `id` moved to `to` (rounded to whole units). A node that rides a part (`attach`)
 * moves its position for the part's state in `state`; any other node moves its `x`/`y`.
 */
export function moveNode(def: PageDef, state: SimState, id: Id, to: Point): PageDef {
  const [x, y] = [Math.round(to[0]), Math.round(to[1])];
  const nodes = def.nodes.map((n) => {
    if (n.id !== id) return n;
    if (n.attach === undefined) return { ...n, x, y };
    const s = partState(state, n.attach.part);
    if (s === undefined) return n;
    return { ...n, attach: { ...n.attach, pos: { ...n.attach.pos, [s]: [x, y] as [number, number] } } };
  });
  return { ...def, nodes };
}

/** `def` with one end of part `id`'s track moved to `to` (rounded). Parts without a track are unchanged. */
export function moveTrackEnd(def: PageDef, id: Id, end: 'from' | 'to', to: Point): PageDef {
  const p: [number, number] = [Math.round(to[0]), Math.round(to[1])];
  const parts = def.parts.map((part) => (part.id !== id || part.track === undefined ? part : { ...part, track: { ...part.track, [end]: p } }));
  return { ...def, parts };
}

// ——— Readability (popup art bible § 4.2) and art keys ———

export interface TouchableCount {
  readonly parts: number;
  readonly perches: number;
  readonly total: number;
  /** The bible's cap for this page (3 on pages 1–3 of a chapter), or null when it sets none. */
  readonly limit: number | null;
}

/** Touchable parts plus perches a finger can use in `state` (bible § 4.2 "Count"). */
export function touchableCount(def: PageDef, state: SimState): TouchableCount {
  const targets = targetsOf(def, state);
  const parts = targets.filter((t) => t.kind === 'part').length;
  const perches = targets.filter((t) => t.kind === 'perch').length;
  return { parts, perches, total: parts + perches, limit: def.index <= 3 ? 3 : null };
}

export type ArtStatus = 'baked' | 'placeholder';

export interface ArtKeyRow {
  readonly kind: 'backdrop' | 'part' | 'creature' | 'cutout';
  readonly id: Id;
  readonly key: string;
  readonly status: ArtStatus;
}

/** Every art key the page names, and whether it has its own art yet or shows a placeholder. */
export function artReport(def: PageDef): ArtKeyRow[] {
  const status = (own: boolean): ArtStatus => (own ? 'baked' : 'placeholder');
  return [
    { kind: 'backdrop', id: def.id, key: def.backdrop, status: status(hasBackdropArt(def.backdrop)) },
    ...def.parts.map((p): ArtKeyRow => ({ kind: 'part', id: p.id, key: p.art, status: status(!isPlaceholder(p.art)) })),
    ...def.creatures.map((c): ArtKeyRow => ({ kind: 'creature', id: c.id, key: c.art, status: status(hasCreatureArt(c.art)) })),
    ...(def.cutouts ?? []).map((c): ArtKeyRow => ({ kind: 'cutout', id: def.id, key: c.art, status: status(cutoutImage(c.art) !== null) })),
  ];
}

// ——— The page list ———

export type PageBadge = 'pending' | 'ok' | 'dead-end' | 'over cap' | 'lint' | 'fail';

/** The page list's badge for a solver report (none yet: pending). The worst problem wins. */
export function pageBadge(report: PageReport | undefined): PageBadge {
  if (report === undefined) return 'pending';
  if (report.stop === 'cap') return 'over cap';
  if (report.deadEnds !== null && report.deadEnds > 0) return 'dead-end';
  if (report.lintErrors > 0) return 'lint';
  return report.failures.length > 0 ? 'fail' : 'ok';
}
