import { evalCond, holds } from './cond';
import type { SimEvent } from './events';
import { isLinkNode, walkGraph } from './graph';
import { compilePart } from './presets';
import type { Id, Input, NodeDef, PageDef, PerchDef, SimState } from './types';

/**
 * Mocha, the player's one movable piece (GDD § 2.3, § 3.3 phases 1 and 3). He is a cat, so he only
 * goes where cats go, and every cat rule is a mechanic. Decisions in D-44.
 *
 * - **C1 perches only.** Mocha settles only on perches. A trip is a shortest path over the cat
 *   graph (`jump` + `squeeze` edges whose `when` holds, `graph.ts`), committed when the player taps
 *   the perch and walked 2 edges per tick; mid-trip he is in the air (`perch` null).
 * - **C2 squeezes.** `squeeze` edges are cat-only (the cat walker; Baokaka never uses them).
 * - **C3 knocks things off.** On arriving at a `push` perch whose pushable is still `onPerch`, he
 *   spends that tick making eye contact (`mocha.stare`, `mochaStare`); next tick he pushes it
 *   (`falling`, `push`); the tick after, it lands (`landed`, `land`, then `landSets`). One-way:
 *   nothing here ever moves a pushable back to `onPerch` (only a page reaction can, #84).
 * - **C4 sits on things.** `onPart` on a `button` presses it (`down`) and holds it while he sits;
 *   leaving releases it (`up`) unless other weight holds it. `onPart` on a `lift` with a
 *   `counterweight` puts it in its `on` state, and leaving puts it in `off` (#120, D-83: 5-2's
 *   balloon basket rises when he jumps out). A part with `lockedByCat` can't be moved while he
 *   sits on it (`catLocked`, read by the tick's input phase).
 * - **C5 irresistible.** Settled and not hidden, he is a priority-2 attractor at the perch's
 *   `reachNode` (`mochaAttractorNode`, read by `baby.ts`).
 * - **C6 scares small creatures.** Arriving at one of a creature's `fleesFromCat.nearPerches`
 *   sends it to its `to` position.
 * - **C7 / C8 / blockedWhen.** A perch on a `wet` or `steam` node is unreachable while its
 *   `blockedWhen` holds (always, without one): tapping it puffs him up (`mochaPuff`). A `glass`
 *   perch is always unreachable, and any perch is while its `blockedWhen` holds (`mochaNope`). He
 *   won't pass through such perches on the way somewhere else either.
 * - **C9 boxes.** A perch with `hidesMocha` or on a `box` node hides him: he's not an attractor.
 * - **Arrival** emits `catArrive`, then applies `onPart`, `set`, `fleesFromCat` and `push`, in that
 *   order. **Leaving** emits `catLeave` and releases what he held.
 * - **Pet** (tap Mocha) repeats the perch's actions — press the button again, pull the cord again,
 *   push again if the pushable is back `onPerch` — with no new `catArrive` and no scaring.
 *
 * **Linked mode** (一起, GDD § 2.4, #128, D-92): C1, C7 and C8 are suspended. `mochaLink` hops him
 * down from wherever he is to Baokaka's node (leaving his perch as any trip does); from then on he
 * stands on the floor (`floorNode`), perches and pets are ignored, and a `floor` input
 * (`mochaFloor`) walks him to a link node over every baby edge kind (`lead` walker, `graph.ts`),
 * one edge per tick (`LEAD_EDGES_PER_TICK`, Baokaka's pace, so they walk side by side), through
 * puddles and all. Arriving he emits `lead`.
 *
 * A press or a `set` always emits `partEnter` (with `state`), even when the part is already in
 * that state: that is what "press again" means, and what 1-5's elevator reacts to. The cascade
 * that turns these events into reactions is the tick's (#84).
 */

/** § 2.3: edges Mocha travels per tick. */
export const MOCHA_EDGES_PER_TICK = 2;
/** Linked mode (#128): Mocha walks the floor at Baokaka's pace, one edge per tick. */
export const LEAD_EDGES_PER_TICK = 1;

/** Why a perch is out of bounds for Mocha right now. */
export type PerchRefusal = 'wet' | 'steam' | 'glass' | 'blocked';

export interface MochaResult {
  readonly state: SimState;
  readonly events: SimEvent[];
}

function findPerch(def: PageDef, id: Id | null | undefined): PerchDef | undefined {
  return id == null ? undefined : def.perches.find((p) => p.id === id);
}

function findNode(def: PageDef, id: Id): NodeDef | undefined {
  return def.nodes.find((n) => n.id === id);
}

/** C7 / C8 / `blockedWhen`: why `perch` is unreachable now, or null when it isn't. */
export function perchRefusal(def: PageDef, state: SimState, perch: PerchDef): PerchRefusal | null {
  const tags = findNode(def, perch.node)?.tags ?? [];
  if (tags.includes('glass')) return 'glass';
  const water = tags.includes('wet') ? 'wet' : tags.includes('steam') ? 'steam' : null;
  if (water !== null) return holds(def, state, perch.blockedWhen) ? water : null;
  return perch.blockedWhen !== undefined && evalCond(def, state, perch.blockedWhen) ? 'blocked' : null;
}

/** C9: a box perch (`hidesMocha`, or a node tagged `box`) hides him. */
export function perchHidesMocha(def: PageDef, perch: PerchDef): boolean {
  return perch.hidesMocha === true || (findNode(def, perch.node)?.tags?.includes('box') ?? false);
}

/** Mocha is settled: on a perch, not travelling. */
export function mochaSettled(state: SimState): boolean {
  return state.mocha.perch !== null && state.mocha.path.length === 0;
}

/** Mocha is on the floor in linked mode (一起, #128). */
export function mochaLinked(state: SimState): boolean {
  return state.mocha.floorNode !== undefined;
}

/** The node Mocha is on (mid-trip, the node he has reached), or null when he isn't on the page. */
export function mochaNode(def: PageDef, state: SimState): Id | null {
  const { perch, path, floorNode } = state.mocha;
  if (floorNode !== undefined) return floorNode;
  if (path.length > 0) return path[0];
  return findPerch(def, perch)?.node ?? null;
}

/**
 * C5: where Baokaka goes for Mocha — the perch's `reachNode` (else the perch node) — or null when
 * Mocha isn't settled on a known perch, or is hidden in a box (C9).
 */
export function mochaAttractorNode(def: PageDef, state: SimState): Id | null {
  if (!mochaSettled(state)) return null;
  const perch = findPerch(def, state.mocha.perch);
  if (perch === undefined || perchHidesMocha(def, perch)) return null;
  return perch.reachNode ?? perch.node;
}

/** C4: part `partId` has `lockedByCat` and settled Mocha sits on it. */
export function catLocked(def: PageDef, state: SimState, partId: Id): boolean {
  if (!mochaSettled(state)) return false;
  if (findPerch(def, state.mocha.perch)?.onPart !== partId) return false;
  return def.parts.find((p) => p.id === partId)?.lockedByCat === true;
}

/**
 * Weight on a button other than Mocha's (§ 2.1 `button`): Baokaka on a node attached to it, or a
 * landed pushable whose `landSets` pressed it.
 */
export function buttonWeighed(def: PageDef, state: SimState, partId: Id): boolean {
  // Carried (抱抱, #120), he weighs nothing on the ground
  if (state.baby.mode !== 'carried' && findNode(def, state.baby.node)?.attach?.part === partId) return true;
  return def.parts.some(
    (p) => p.fall?.landSets?.part === partId && p.fall.landSets.to === 'down' && state.pushables[p.id] === 'landed',
  );
}

/** Nodes of the perches Mocha refuses now (C7, C8, `blockedWhen`), in perch order. */
function avoided(def: PageDef, state: SimState): Id[] {
  return def.perches.filter((p) => perchRefusal(def, state, p) !== null).map((p) => p.node);
}

/**
 * The cat path from where Mocha is to `perchId` (his node first, the perch's node last), or null
 * when there is none: not on the page, unknown perch, refused perch, or no open way.
 */
export function catPath(def: PageDef, state: SimState, perchId: Id): Id[] | null {
  const from = mochaNode(def, state);
  const perch = findPerch(def, perchId);
  if (from === null || mochaLinked(state) || perch === undefined || perchRefusal(def, state, perch) !== null) return null;
  return walkGraph(def, state, { who: 'cat', avoid: avoided(def, state) }).bfs(from, perch.node);
}

/**
 * § 3.3 phase 1, input `mocha`: tapping a perch. Commits the cat path (`path`, `to`) for phase 3,
 * or emits `mochaPuff` (C7) / `mochaNope` (no path, C8, `blockedWhen`, not a perch) and changes
 * nothing. Tapping the perch he is on or already heading for, or tapping while he isn't on the
 * page, does nothing.
 */
export function mochaCommand(def: PageDef, state: SimState, perchId: Id): MochaResult {
  const m = state.mocha;
  if (mochaNode(def, state) === null || mochaLinked(state)) return { state, events: [] };
  if (perchId === (m.path.length > 0 ? m.to : m.perch)) return { state, events: [] };
  const perch = findPerch(def, perchId);
  const refusal = perch === undefined ? null : perchRefusal(def, state, perch);
  if (refusal === 'wet' || refusal === 'steam') return { state, events: [{ type: 'mochaPuff', id: perchId }] };
  const path = catPath(def, state, perchId);
  if (path === null) return { state, events: [{ type: 'mochaNope', id: perchId }] };
  const { stare: _cancelled, ...rest } = m;
  return { state: { ...state, mocha: { ...rest, path, to: perchId } }, events: [] };
}

/**
 * § 3.3 phase 1, input `pet`: tapping Mocha repeats his perch's actions (press, set, push). Only
 * while he's settled and not already staring.
 */
export function mochaPet(def: PageDef, state: SimState): MochaResult {
  const perch = findPerch(def, state.mocha.perch);
  if (perch === undefined || !mochaSettled(state) || state.mocha.stare !== undefined) return { state, events: [] };
  const events: SimEvent[] = [];
  return { state: perchActions(def, state, perch, events), events };
}

/**
 * § 3.3 phase 3: pushables that were falling land, a finished stare becomes a push, then Mocha
 * leaves, travels up to 2 edges and arrives. Pure; doesn't advance `tick`.
 *
 * `input` is the tick's input (phase 1). After a `pet`, a stare is the one that pet just started
 * (`mochaPet` does nothing during a stare), so it lasts this tick and pushes on the next.
 */
export function mochaTick(def: PageDef, state: SimState, input?: Input): MochaResult {
  const events: SimEvent[] = [];
  let s = state;

  // C3: last tick's push lands now.
  for (const part of def.parts) {
    if (part.preset !== 'pushable' || s.pushables[part.id] !== 'falling') continue;
    s = { ...s, pushables: { ...s.pushables, [part.id]: 'landed' } };
    events.push({ type: 'land', id: part.id });
    if (part.fall?.landSets) s = setPart(def, s, part.fall.landSets.part, part.fall.landSets.to, events);
  }

  // C3: the eye-contact beat is over; push. (Setting off cancels the stare: `mochaCommand` drops it.)
  const { stare } = s.mocha;
  if (stare !== undefined && input?.t !== 'pet') {
    const { stare: _done, ...mocha } = s.mocha;
    s = { ...s, mocha };
    if (s.pushables[stare] === 'onPerch') {
      s = { ...s, pushables: { ...s.pushables, [stare]: 'falling' } };
      events.push({ type: 'push', id: stare });
    }
  }

  if (s.mocha.path.length === 0) return { state: s, events };
  if (mochaLinked(s)) return { state: leadStep(s, events), events };

  // Leaving: catLeave, release the button he held (locks are derived and lift by themselves).
  s = leavePerch(def, s, events);

  const path = s.mocha.path.slice(Math.min(MOCHA_EDGES_PER_TICK, s.mocha.path.length - 1));
  if (path.length > 1) return { state: { ...s, mocha: { ...s.mocha, path } }, events };

  // Arrival.
  const { to, ...mocha } = s.mocha;
  const perch = findPerch(def, to);
  // `mochaCommand` only commits trips to known perches; a hand-made state without one leaves him off the page.
  if (perch === undefined) return { state: { ...s, mocha: { ...mocha, perch: null, path: [] } }, events };
  s = { ...s, mocha: { ...mocha, perch: perch.id, path: [] } };
  events.push({ type: 'catArrive', id: perch.id });
  s = perchActions(def, s, perch, events, true);
  return { state: s, events };
}

/** Leaving his perch: `catLeave`, and the button or counterweight he held lets go. No-op off a perch. */
function leavePerch(def: PageDef, state: SimState, events: SimEvent[]): SimState {
  const origin = findPerch(def, state.mocha.perch);
  if (state.mocha.perch === null) return state;
  events.push({ type: 'catLeave', id: state.mocha.perch });
  let s: SimState = { ...state, mocha: { ...state.mocha, perch: null } };
  const held = origin?.onPart;
  if (held !== undefined && isButton(def, held) && s.parts[held] === 'down' && !buttonWeighed(def, s, held)) {
    s = setPart(def, s, held, 'up', events);
  }
  const weight = counterweightOf(def, held);
  if (weight !== undefined) s = setPart(def, s, held!, weight.off, events);
  return s;
}

/**
 * 一起 (§ 2.4, #128): Mocha hops down to Baokaka's node and stands on the floor for the rest of the
 * page. From a perch he leaves it (`catLeave`, releases); mid-trip, the trip is dropped; a stare is
 * forgotten. Nothing happens when he isn't on the page (or is already linked).
 */
export function mochaLink(def: PageDef, state: SimState): MochaResult {
  if (mochaNode(def, state) === null || mochaLinked(state)) return { state, events: [] };
  const events: SimEvent[] = [];
  const s = leavePerch(def, state, events);
  return { state: { ...s, mocha: { perch: null, path: [], floorNode: state.baby.node } }, events };
}

/**
 * § 3.3 phase 1, input `floor` (linked mode, #128): walk Mocha to link node `node` over the floor
 * (the `lead` walker: every baby edge kind, never through a creature, a closed gate or a place no
 * one stands). Commits the path for phase 3; `mochaNope` when there is no way (or it isn't a link
 * node); the node he stands on stops him. Ignored unless he is linked.
 */
export function mochaFloor(def: PageDef, state: SimState, node: Id): MochaResult {
  const m = state.mocha;
  if (m.floorNode === undefined) return { state, events: [] };
  if (node === (m.path.at(-1) ?? m.floorNode)) return { state, events: [] };
  const path = isLinkNode(def, node) ? walkGraph(def, state, { who: 'lead' }).bfs(m.floorNode, node) : null;
  if (path === null) return { state, events: [{ type: 'mochaNope', id: node }] };
  return { state: { ...state, mocha: { ...m, path: path.length > 1 ? path : [] } }, events: [] };
}

/** Phase 3 in linked mode: one edge along his floor path; arriving, `lead` (with where, for radii). */
function leadStep(state: SimState, events: SimEvent[]): SimState {
  const path = state.mocha.path.slice(Math.min(LEAD_EDGES_PER_TICK, state.mocha.path.length - 1));
  const floorNode = path[0];
  if (path.length > 1) return { ...state, mocha: { ...state.mocha, floorNode, path } };
  events.push({ type: 'lead', id: floorNode });
  return { ...state, mocha: { ...state.mocha, floorNode, path: [] } };
}

function isButton(def: PageDef, partId: Id): boolean {
  return def.parts.find((p) => p.id === partId)?.preset === 'button';
}

/** C4: the counterweight of lift `partId` (#120), or undefined when it isn't a counterweighted lift. */
export function counterweightOf(def: PageDef, partId: Id | undefined): { on: string; off: string } | undefined {
  const part = partId === undefined ? undefined : def.parts.find((p) => p.id === partId);
  return part?.preset === 'lift' ? part.counterweight : undefined;
}

/** A perch's actions, in § 3.3 order: press (onPart button) or weigh (onPart counterweight), set, scare (arrival only), push. */
function perchActions(def: PageDef, state: SimState, perch: PerchDef, events: SimEvent[], arriving = false): SimState {
  let s = state;
  if (perch.onPart !== undefined && isButton(def, perch.onPart)) s = setPart(def, s, perch.onPart, 'down', events);
  const weight = counterweightOf(def, perch.onPart);
  if (weight !== undefined) s = setPart(def, s, perch.onPart!, weight.on, events);
  if (perch.set !== undefined) s = setPart(def, s, perch.set.part, perch.set.to, events);
  if (arriving) {
    for (const c of def.creatures) {
      const flee = c.fleesFromCat;
      if (flee === undefined || !flee.nearPerches.includes(perch.id) || s.creatures[c.id] === flee.to) continue;
      s = { ...s, creatures: { ...s.creatures, [c.id]: flee.to } };
    }
  }
  if (perch.push !== undefined && s.pushables[perch.push] === 'onPerch') {
    s = { ...s, mocha: { ...s.mocha, stare: perch.push } };
    events.push({ type: 'mochaStare', id: perch.push });
  }
  return s;
}

/**
 * Mocha (or a landing pushable) puts part `id` into state `to` and emits `partEnter`, even when it
 * is already there (a re-press). Nothing happens for an unknown or pushable part, an unknown state,
 * a part whose `lockedWhen` holds, or a state whose `stateWhen` doesn't (it's jammed). `lockedByCat`
 * doesn't stop the cat himself.
 */
function setPart(def: PageDef, state: SimState, id: Id, to: string, events: SimEvent[]): SimState {
  const part = def.parts.find((p) => p.id === id);
  if (part === undefined || part.preset === 'pushable' || !compilePart(part).states.includes(to)) return state;
  if (part.lockedWhen !== undefined && evalCond(def, state, part.lockedWhen)) return state;
  if (!holds(def, state, part.stateWhen?.[to])) return state;
  events.push({ type: 'partEnter', id, state: to });
  return state.parts[id] === to ? state : { ...state, parts: { ...state.parts, [id]: to } };
}
