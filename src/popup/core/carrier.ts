import { evalCond, holds, partState } from './cond';
import { nodePos } from './graph';
import type { EdgeDef, EdgeKind, Id, PageDef, PartDef, SimState } from './types';

/**
 * Carriers and 抱抱 (GDD § 2.1 `carrier`, § 2.4 抱抱, § 3.3 phase 5; #120, D-83). An adult — 夜市阿姨,
 * the 雞排老闆, a sleepy 阿伯, 黑糖 the bear — who picks Baokaka up when he says 抱抱 next to her
 * and walks a fixed route, one edge per tick, then sets him down. The only state a carry adds is
 * the position index on the route (`carrying@k`, mirrored in `baby.carriedBy`), so the solver's
 * state space grows by the route's length, no more.
 *
 * - **Where she stands.** `idle`: on `route[0]`; `carrying@k`: on `route[k]`; `done`: on the
 *   route's last node.
 * - **Within reach** (one edge): she stands on his node, or on a node joined to it by a baby edge
 *   (`crawl`, `climb`, `cruise`, `walk`; any kind whatever his growth — he is lifted, not climbing)
 *   whose `when` holds, in either direction.
 * - **Picks him up** when she is `idle` (or `done`: then she carries him back to the start, so a
 *   carry is never a one-way door), not `lockedWhen`, and her whole route is clear: every step's
 *   edge `when` holds now ("抱抱 a carrier only once its route is clear", 5-5). The first such
 *   carrier in data order answers. He moves onto her node (at most the one edge), `carried`.
 * - **No one in reach:** he raises his arms and Mocha purrs (`hugNobody`, a UI event); no effect.
 * - **The walk** (phase 5 while `carried`): one edge per tick along the route; if a step's edge has
 *   closed since (the player changed a part), she waits there until it opens. Creatures don't stop
 *   her (adults step over a crowd of legs). At the end she sets him down (her state `done`, or
 *   `idle` after a walk back): he is `idle` on that node and decides again next tick.
 * - **Words** wait while he is carried (`canSay`, `step.ts`): he is busy being carried.
 */

/** The edge kinds a carrier walks and reaches over: the baby's (never Mocha's `jump` / `squeeze`). */
export const CARRY_KINDS: ReadonlySet<EdgeKind> = new Set<EdgeKind>(['crawl', 'climb', 'cruise', 'walk']);

/** Where a carrier in `state` stands on its route: 0 idle, k for `carrying@k`, the last index done. */
export function carrierIndex(part: PartDef, state: string): number {
  const last = Math.max(0, (part.route?.length ?? 1) - 1);
  if (state === 'idle') return 0;
  if (state === 'done') return last;
  const k = Number(state.slice('carrying@'.length));
  return Number.isInteger(k) ? Math.max(0, Math.min(last, k)) : 0;
}

/** The node a carrier stands on now, or undefined for a part without a route. */
export function carrierNode(part: PartDef, state: SimState): Id | undefined {
  const s = partState(state, part.id);
  return s === undefined ? undefined : part.route?.[carrierIndex(part, s)];
}

/** The baby edges joining `a` and `b` (either direction), in data order. */
export function edgesBetween(def: PageDef, a: Id, b: Id): EdgeDef[] {
  return def.edges.filter((e) => CARRY_KINDS.has(e.kind) && ((e.a === a && e.b === b) || (e.a === b && e.b === a)));
}

/** Whether a carrier can step from `a` to `b` now: some baby edge joins them and its `when` holds. */
export function carryStepOpen(def: PageDef, state: SimState, a: Id, b: Id): boolean {
  return edgesBetween(def, a, b).some((e) => holds(def, state, e.when));
}

/** Whether every step of `route` is open now. */
export function routeClear(def: PageDef, state: SimState, route: readonly Id[]): boolean {
  for (let k = 1; k < route.length; k++) if (!carryStepOpen(def, state, route[k - 1], route[k])) return false;
  return true;
}

/** A carrier that will pick him up now, and which way she'll walk. */
export interface Hug {
  readonly part: PartDef;
  /** She is at the route's end (`done`) and walks it back to the start. */
  readonly back: boolean;
  /** Her node: where he is lifted to. */
  readonly node: Id;
}

/**
 * 抱抱's answer (§ 2.4): the first carrier (data order) within one edge of Baokaka that is `idle` or
 * `done`, not locked, and whose route is clear; null when there is none.
 */
export function hugCarrier(def: PageDef, state: SimState): Hug | null {
  const here = state.baby.node;
  for (const part of def.parts) {
    if (part.preset !== 'carrier' || part.route === undefined || part.route.length < 2) continue;
    const s = partState(state, part.id);
    if (s !== 'idle' && s !== 'done') continue;
    if (part.lockedWhen !== undefined && evalCond(def, state, part.lockedWhen)) continue;
    const node = carrierNode(part, state)!;
    if (node !== here && !carryStepOpen(def, state, here, node)) continue;
    if (!routeClear(def, state, part.route)) continue;
    return { part, back: s === 'done', node };
  }
  return null;
}

/** The facing for a move from `a` to `b`: by x, unchanged when level. */
export function facingFor(def: PageDef, state: SimState, a: Id, b: Id, facing: 'l' | 'r'): 'l' | 'r' {
  const p = nodePos(def, state, a);
  const q = nodePos(def, state, b);
  if (p === undefined || q === undefined || p[0] === q[0]) return facing;
  return q[0] < p[0] ? 'l' : 'r';
}

/** What a carry does this tick (phase 5 while `carried`). */
export type CarryMove =
  /** Walk one edge: the carrier enters `state`, he is on `node`, at index `k`. */
  | { readonly kind: 'step'; readonly part: PartDef; readonly state: string; readonly node: Id; readonly k: number }
  /**
   * Set him down where he is: the carrier enters `state` (`done`, or `idle` after a walk back).
   * Without a part (a hand-made state with no such carrier) he is simply set down.
   */
  | { readonly kind: 'down'; readonly part?: PartDef; readonly state?: string }
  /** The next step's edge is closed: she waits. */
  | { readonly kind: 'wait' };

/** § 3.3 phase 5 for a carried baby: the carrier's next move. */
export function carryMove(def: PageDef, state: SimState): CarryMove {
  const by = state.baby.carriedBy;
  const part = by === undefined ? undefined : def.parts.find((p) => p.id === by.id);
  const route = part?.route;
  // Only a hug sets `carriedBy`, always to a carrier with a route; a hand-made state without one sets him down.
  if (by === undefined || part === undefined || route === undefined || route.length === 0) return { kind: 'down' };
  const end = by.back === true ? 0 : route.length - 1;
  if (by.k === end) return { kind: 'down', part, state: by.back === true ? 'idle' : 'done' };
  const k = by.k + (by.back === true ? -1 : 1);
  if (!carryStepOpen(def, state, route[by.k], route[k])) return { kind: 'wait' };
  return { kind: 'step', part, state: `carrying@${k}`, node: route[k], k };
}
