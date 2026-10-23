import { babyTick, keepRefusals } from './baby';
import { carrierIndex, carryMove, facingFor, hugCarrier } from './carrier';
import { evalCond, holds, partState } from './cond';
import { creaturePoint, moveCreature, skyPosition } from './creatures';
import { EVENT_RADIUS, isSimEvent, type SimEvent } from './events';
import { dist2, nodePos, type Point } from './graph';
import { catLocked, buttonWeighed, mochaCommand, mochaFloor, mochaLink, mochaNode, mochaPet, mochaSettled, mochaTick } from './mocha';
import { compilePart, reactionTarget, tapTarget } from './presets';
import { stableStringify, withPartState } from './state';
import type { EventPredicate, Growth, Id, Input, PageDef, PartDef, ReactionOn, SimState, Word } from './types';
import { inReach, sayNo, wordAvailable, wordEvent } from './words';

/**
 * The tick (GDD § 3.3): `step(def, state, input) → { state, events }` runs the seven phases in
 * exact order. Pure and deterministic — no randomness, no clock, data-order iteration — so a page
 * replays from `(def, inputs[])` (`replay.ts`) and the solver can search over it. Decisions in
 * D-45 (and D-43 / D-44 for the baby and Mocha phases).
 *
 * 1. **Input.** `set` (player-driven parts only; refused with `locked` when `lockedWhen` holds or
 *    Mocha sits on a `lockedByCat` part; walks stop by stop toward `to` and stops before the first
 *    stop whose `stateWhen` fails, emitting `jam`), `tap` (the preset's tap rule, same locks and
 *    jams; a turn also turns the part's `coupled` parts, one hop, `turn`), `mocha` / `pet`
 *    (`mocha.ts`), `say` (Baokaka enters `saying`; the word resolves in phase 5), `floor`
 *    (linked mode, #128: Mocha's walk over the floor, `mochaFloor`).
 * 2. **Cascade** of phase 1's events (`cascade`): FIFO; each § 3.2 event triggers, per part and
 *    per creature, its first matching reaction (conditions read the state before that event's
 *    transitions); a part entering a state queues `partEnter` and its `emit` events. More than
 *    `MAX_CASCADE` events in one cascade throws `CascadeOverflowError`.
 * 3. **Mocha** (`mochaTick`), then a cascade of what he did (arrival presses, `set`, landings).
 * 4. **Creatures.** Their moves and drops already happened in the cascades (`creatures.ts`). In
 *    linked mode `lonely` creatures follow the pair (`followPair`, #128).
 * 5. **Baby.** On a say tick: 不要！ refuses the target, any other word's event cascades from
 *    him (`words.ts`), and he stays `saying` — except 抱抱 next to a carrier, which picks him up
 *    (`carried`, `carrier.ts`; else `hugNobody`) — not while linked, when he holds on to Mocha; and
 *    一起 links them (`link`: Mocha hops down to him, #128). While carried, the carrier walks one edge of her
 *    route, or sets him down at its end. Otherwise the decision loop (`babyTick`, ≤ 1 edge,
 *    `babyEnter`) with his weight on buttons attached to the nodes he leaves and enters; then a
 *    cascade of his events (a `cry` opens the balcony door now, and he sees it next tick).
 *    Finally `ride` if he ends the tick on a node attached to a part that carried him this tick.
 *    Linked, the decision loop is `linkedTick` (`baby.ts`): he follows Mocha.
 * 6. **Arrival effects** (grab, eat, cuddle, watch) are inside `babyTick`; grabbing the goal sets `done`.
 * 7. **Learning and counters.** The page's `learns` fires once (`learn`); every mischief and line
 *    predicate counts its matching events (capped at its count), and `tick` advances.
 */

/** § 3.3 phase 2: the most events one cascade may process. */
export const MAX_CASCADE = 32;

/** Thrown when a cascade exceeds `MAX_CASCADE` events: a reaction loop in the page data. */
export class CascadeOverflowError extends Error {
  constructor(
    readonly page: Id,
    readonly parts: readonly Id[],
  ) {
    super(
      `cascade overflow on page '${page}': more than ${MAX_CASCADE} events in one cascade` +
        (parts.length > 0 ? `; looping parts: ${parts.join(', ')}` : '; no part changed (a creature or event loop)'),
    );
    this.name = 'CascadeOverflowError';
  }
}

export interface StepResult {
  readonly state: SimState;
  /** Everything that happened this tick, in order (UI events included). */
  readonly events: SimEvent[];
}

/** The `counters` key under which `learns` records that it fired. Not an event name, so no clash. */
export const LEARNED_KEY = '!learned';

/** Whether this page's `learns` has fired. */
export function learned(state: SimState): boolean {
  return state.counters[LEARNED_KEY] === 1;
}

/** Baokaka's growth stage now: the page's, raised by a growth `learns` once it has fired. */
export function stepGrowth(def: PageDef, state: SimState): Growth {
  const base = def.baby.growth ?? 0;
  const grown = def.learns?.growth;
  return grown !== undefined && grown > base && learned(state) ? grown : base;
}

// ——— Parts ———

function findPart(def: PageDef, id: Id): PartDef | undefined {
  return def.parts.find((p) => p.id === id);
}

/** A part's origin for event radii: the centre of its hit area (D-45). */
export function partOrigin(part: PartDef): Point {
  const h = part.hit;
  return 'r' in h ? [h.cx, h.cy] : [h.x + h.w / 2, h.y + h.h / 2];
}

/** Whether the player can't move part `id` now: `lockedWhen` holds, or Mocha sits on it (C4). */
export function partLocked(def: PageDef, state: SimState, id: Id): boolean {
  const part = findPart(def, id);
  if (part === undefined) return false;
  return (part.lockedWhen !== undefined && evalCond(def, state, part.lockedWhen)) || catLocked(def, state, id);
}

/** Whether `part` may enter state `to` now (its `stateWhen`). */
function allowed(def: PageDef, state: SimState, part: PartDef, to: string): boolean {
  return holds(def, state, part.stateWhen?.[to]);
}

/** Puts `part` in state `to` and queues `partEnter` (the cascade queues its `emit` events). */
function enter(state: SimState, part: PartDef, to: string, events: SimEvent[]): SimState {
  events.push({ type: 'partEnter', id: part.id, state: to, at: partOrigin(part) });
  return withPartState(state, part.id, to);
}

/**
 * Turns `part` from `from` to `to` (`enter`), then its `coupled` parts (GDD § 2.1, #127, D-91):
 * each turns the same number of steps the same way, in list order, unless it is locked (`lockedWhen`,
 * Mocha on it) or can't enter that state (`stateWhen`): then it holds still and the clutch slips.
 * One hop: a coupled turn drives nothing further (it is a plain `enter`), so coupling never loops
 * by itself; its `partEnter` still cascades like any other, under `MAX_CASCADE`.
 */
function turn(def: PageDef, state: SimState, part: PartDef, from: string, to: string, events: SimEvent[]): SimState {
  let s = enter(state, part, to, events);
  if (part.coupled === undefined || part.coupled.length === 0) return s;
  const states = compilePart(part).states;
  const n = states.length;
  const delta = (((states.indexOf(to) - states.indexOf(from)) % n) + n) % n;
  if (delta === 0) return s;
  for (const id of part.coupled) {
    const other = findPart(def, id);
    const current = partState(s, id);
    if (other === undefined || current === undefined || id === part.id) continue;
    const theirs = compilePart(other).states;
    const next = theirs[(theirs.indexOf(current) + delta) % theirs.length];
    if (next === current || partLocked(def, s, id) || !allowed(def, s, other, next)) continue;
    s = enter(s, other, next, events);
  }
  return s;
}

// ——— Cascade (phase 2, and the mini-cascades after phases 3 and 5) ———

/** The event's origin: its `at`, else where its subject (perch, node, part, creature) is. */
function eventOrigin(def: PageDef, state: SimState, ev: SimEvent): Point | undefined {
  if (ev.at !== undefined || ev.id === undefined) return ev.at;
  const id = ev.id;
  const perch = def.perches.find((p) => p.id === id);
  if (perch !== undefined) return nodePos(def, state, perch.node);
  const part = findPart(def, id);
  if (part !== undefined) return partOrigin(part);
  if (def.creatures.some((c) => c.id === id)) return creaturePoint(def, state, id);
  return nodePos(def, state, id);
}

function matchesOn(on: ReactionOn, ev: SimEvent): boolean {
  if (typeof on === 'string') return on === ev.type;
  return on.type === ev.type && (on.id === undefined || on.id === ev.id) && (on.state === undefined || on.state === ev.state);
}

const onWithin = (on: ReactionOn): number | undefined => (typeof on === 'string' ? undefined : on.within);

/** Whether any of `reactions` listens to events of `type` (then the built-in word effect steps aside). */
const listens = (reactions: readonly { on: ReactionOn }[] | undefined, type: string) =>
  reactions?.some((r) => (typeof r.on === 'string' ? r.on : r.on.type) === type) ?? false;

type Transition =
  | { kind: 'part'; part: PartDef; to: string; setFlag?: Id }
  | { kind: 'creature'; id: Id; to: string; drop?: Id };

/** Every reaction `ev` triggers, judged against `state`: at most one per part, then per creature. */
function collect(def: PageDef, state: SimState, ev: SimEvent): Transition[] {
  const out: Transition[] = [];
  const origin = eventOrigin(def, state, ev);
  const located: SimEvent = origin === undefined ? ev : { ...ev, at: origin };
  for (const part of def.parts) {
    const at = partOrigin(part);
    const r = part.react?.find((x) => matchesOn(x.on, ev) && inReach(located, at, onWithin(x.on) ?? ev.within) && holds(def, state, x.when));
    if (r !== undefined) out.push({ kind: 'part', part, to: r.to, setFlag: r.setFlag });
    else if (ev.type === 'whoosh' && part.preset === 'blowable' && !listens(part.react, 'whoosh') && inReach(located, at)) {
      out.push({ kind: 'part', part, to: 'next' });
    }
  }
  for (const c of def.creatures) {
    const at = creaturePoint(def, state, c.id);
    const r = c.react?.find((x) => matchesOn(x.on, ev) && inReach(located, at, x.within ?? onWithin(x.on) ?? ev.within) && holds(def, state, x.when));
    if (r !== undefined) out.push({ kind: 'creature', id: c.id, to: r.to, drop: r.drop });
    else if (ev.type === 'sky' && !listens(c.react, 'sky')) {
      const to = skyPosition(c, state.creatures[c.id]);
      if (to !== null) out.push({ kind: 'creature', id: c.id, to });
    }
  }
  return out;
}

/**
 * § 3.3 phase 2: processes `events` FIFO, with everything they trigger, and returns the new state
 * and the log in processing order. Each § 3.2 event triggers, per part and then per creature (data
 * order), the first reaction whose event (`on`, with optional `id` / `state`), radius and `when`
 * match — `when` is read before that event's transitions apply. A part reaction that changes the
 * part's state (respecting `lockedWhen` and `stateWhen`) queues `partEnter`; a `partEnter` queues
 * the part's `emit` events for that state, from the part's origin with the event's default radius.
 * `setFlag` sets a flag whenever its reaction fires. Blowables advance on 咻—— and winged creatures
 * toggle on 飛機！ unless they have their own reaction. A part turned here turns its `coupled`
 * parts too (`turn`). UI events pass through to the log.
 *
 * Throws `CascadeOverflowError` (naming the page and the parts that kept changing) after
 * `MAX_CASCADE` § 3.2 events.
 */
export function cascade(def: PageDef, state: SimState, events: readonly SimEvent[]): StepResult {
  const queue = [...events];
  const log: SimEvent[] = [];
  const entered = new Map<Id, number>();
  let processed = 0;
  let s = state;
  for (let i = 0; i < queue.length; i++) {
    const ev = queue[i];
    log.push(ev);
    if (!isSimEvent(ev.type)) continue;
    if (++processed > MAX_CASCADE) throw new CascadeOverflowError(def.id, loopingParts(entered));

    if (ev.type === 'partEnter' && ev.id !== undefined) {
      entered.set(ev.id, (entered.get(ev.id) ?? 0) + 1);
      const part = findPart(def, ev.id);
      for (const e of part?.emit ?? []) {
        if (e.onEnter !== ev.state) continue;
        const emitted: SimEvent = { type: e.event, id: part!.id, at: partOrigin(part!) };
        const within = EVENT_RADIUS[e.event];
        if (within !== undefined) emitted.within = within;
        queue.push(emitted);
      }
    }

    for (const t of collect(def, s, ev)) {
      if (t.kind === 'creature') {
        s = moveCreature(def, s, t.id, t.to, t.drop);
        continue;
      }
      if (t.setFlag !== undefined && !s.flags.includes(t.setFlag)) s = { ...s, flags: [...s.flags, t.setFlag] };
      const current = partState(s, t.part.id);
      if (current === undefined) continue;
      const to = reactionTarget(compilePart(t.part), current, t.to);
      if (to === null || to === current) continue;
      if (t.part.lockedWhen !== undefined && evalCond(def, s, t.part.lockedWhen)) continue;
      if (!allowed(def, s, t.part, to)) {
        // A 咻—— that can't swing it on (#221): it strains and stays (the view shows it; no state changes)
        if (ev.type === 'whoosh' && t.part.preset === 'blowable') queue.push({ type: 'strain', id: t.part.id, state: current });
        continue;
      }
      s = turn(def, s, t.part, current, to, queue);
    }
  }
  return { state: s, events: log };
}

/** Parts that entered a state more than once in the overflowing cascade (else every part that did), most first. */
function loopingParts(entered: ReadonlyMap<Id, number>): Id[] {
  // Map keys are unique, so ids never tie.
  const all = [...entered].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const repeat = all.filter(([, n]) => n > 1);
  return (repeat.length > 0 ? repeat : all).map(([id]) => id);
}

// ——— Phase 1: input ———

/**
 * `set`: the player drags or taps a player-driven part toward `to`. It moves stop by stop (in
 * state order) and stops before the first stop whose `stateWhen` fails (`jam`, the furthest allowed
 * stop). Locked parts don't move (`locked`).
 */
function inputSet(def: PageDef, state: SimState, id: Id, to: string, events: SimEvent[]): SimState {
  const part = findPart(def, id);
  if (part === undefined || part.preset === 'pushable') return state;
  const compiled = compilePart(part);
  const current = partState(state, id);
  if (compiled.input === 'none' || current === undefined || !compiled.states.includes(to) || to === current) return state;
  if (partLocked(def, state, id)) {
    events.push({ type: 'locked', id });
    return state;
  }
  const states = compiled.states;
  const target = states.indexOf(to);
  const dir = target > states.indexOf(current) ? 1 : -1;
  let k = states.indexOf(current);
  while (k !== target && allowed(def, state, part, states[k + dir])) k += dir;
  let s = state;
  if (states[k] !== current) s = turn(def, s, part, current, states[k], events);
  if (k !== target) events.push({ type: 'jam', id, state: states[k] });
  return s;
}

/** `tap`: the preset's tap rule (flaps, props, tappable lights, tabs, wheels, cranks). */
function inputTap(def: PageDef, state: SimState, id: Id, events: SimEvent[]): SimState {
  const part = findPart(def, id);
  const current = partState(state, id);
  if (part === undefined || current === undefined) return state;
  const to = tapTarget(compilePart(part), current);
  if (to === null || to === current) return state;
  if (partLocked(def, state, id)) {
    events.push({ type: 'locked', id });
    return state;
  }
  if (!allowed(def, state, part, to)) {
    events.push({ type: 'jam', id, state: current });
    return state;
  }
  return turn(def, state, part, current, to, events);
}

/**
 * Whether Baokaka can say `word` now: not done, the word available, and not `carried` (he is busy
 * being carried: words wait until she sets him down, #120, D-83). Linked (#128, D-92), every word
 * but 一起 (they already are) and 不要！ (he never refuses Mocha: he trusts you). The word ring
 * (`game/words.ts`) and the solver offer exactly these.
 */
export function sayable(def: PageDef, state: SimState, word: Word): boolean {
  if (state.done || state.baby.mode === 'carried') return false;
  if (state.baby.linked && (word === 'together' || word === 'no')) return false;
  return wordAvailable(def, word, learned(state));
}

function canSay(def: PageDef, state: SimState, input: Input): boolean {
  return input.t === 'say' && sayable(def, state, input.word);
}

function phaseInput(def: PageDef, state: SimState, input: Input, events: SimEvent[]): SimState {
  switch (input.t) {
    case 'set':
      return inputSet(def, state, input.part, input.to, events);
    case 'tap':
      return inputTap(def, state, input.id, events);
    case 'mocha':
    case 'pet': {
      const r = input.t === 'mocha' ? mochaCommand(def, state, input.perch) : mochaPet(def, state);
      events.push(...r.events);
      return r.state;
    }
    case 'say':
      return canSay(def, state, input) ? { ...state, baby: { ...state.baby, mode: 'saying' } } : state;
    case 'floor': {
      const r = mochaFloor(def, state, input.node);
      events.push(...r.events);
      return r.state;
    }
    case 'none':
      return state;
  }
}

// ——— Phase 5: the baby's weight and rides ———

function attachedPart(def: PageDef, nodeId: Id | null): Id | undefined {
  return nodeId === null ? undefined : def.nodes.find((n) => n.id === nodeId)?.attach?.part;
}

/**
 * § 2.1 `button`: Baokaka's weight. Leaving a node attached to a pressed button releases it unless
 * Mocha sits on it or a landed pushable holds it; entering one presses it (a press always emits
 * `partEnter`, as Mocha's does, D-44). `lockedWhen` and `stateWhen` still apply. A carry has no
 * weight on the ground: picked up he only leaves `from` (`to` null), set down he only enters `to`.
 */
function babyWeight(def: PageDef, state: SimState, from: Id | null, to: Id | null, events: SimEvent[]): SimState {
  const off = attachedPart(def, from);
  const on = attachedPart(def, to);
  if (off === on) return state;
  let s = state;
  const press = (id: Id | undefined, pressTo: 'up' | 'down') => {
    const part = id === undefined ? undefined : findPart(def, id);
    if (part === undefined || part.preset !== 'button') return;
    if (part.lockedWhen !== undefined && evalCond(def, s, part.lockedWhen)) return;
    if (!allowed(def, s, part, pressTo)) return;
    s = enter(s, part, pressTo, events);
  };
  if (off !== undefined && s.parts[off] === 'down') {
    const mocha = mochaSettled(s) && def.perches.find((p) => p.id === s.mocha.perch)?.onPart === off;
    if (!mocha && !buttonWeighed(def, s, off)) press(off, 'up');
  }
  press(on, 'down');
  return s;
}

/**
 * `ride` (§ 2.2.3): Baokaka ends the tick on a node attached to part P, and the part carried him —
 * his node moved while he sat on it, before his move (he started on P too) or after it. A doorway
 * or a pressure plate whose node stays put is no ride. `atMove` is the state just before his move.
 */
function rideEvent(def: PageDef, start: SimState, atMove: SimState, end: SimState): SimEvent | null {
  const p = attachedPart(def, end.baby.node);
  if (p === undefined) return null;
  // Only called for attached nodes, which exist.
  const moved = (a: SimState, b: SimState, node: Id) => {
    const [pa, pb] = [nodePos(def, a, node)!, nodePos(def, b, node)!];
    return pa[0] !== pb[0] || pa[1] !== pb[1];
  };
  const startNode = start.baby.node;
  const before = attachedPart(def, startNode) === p && moved(start, atMove, startNode);
  const after = moved(atMove, end, end.baby.node);
  return before || after ? { type: 'ride', id: p } : null;
}

// ——— Phase 5: 抱抱 and carriers (`carrier.ts`) ———

/**
 * 抱抱's effect, after its `hug` event cascaded: the carrier in reach picks him up — she enters
 * `carrying@k` (k = her end of the route), he moves onto her node (`babyEnter` when that is a
 * move), `carried`, wanting nothing for now. No carrier: `hugNobody` (arms up, Mocha purrs).
 */
function hugUp(def: PageDef, state: SimState, events: SimEvent[]): SimState {
  const hug = hugCarrier(def, state);
  if (hug === null) {
    events.push({ type: 'hugNobody' });
    return state;
  }
  const from = state.baby.node;
  const k = carrierIndex(hug.part, hug.back ? 'done' : 'idle');
  let s = enter(state, hug.part, `carrying@${k}`, events);
  if (hug.node !== from) events.push({ type: 'babyEnter', id: hug.node });
  const carriedBy: SimState['baby']['carriedBy'] = hug.back ? { id: hug.part.id, k, back: true } : { id: hug.part.id, k };
  const facing = facingFor(def, s, from, hug.node, s.baby.facing);
  s = { ...s, baby: { ...s.baby, node: hug.node, facing, mode: 'carried', carriedBy, target: null, reachTicks: 0, lookCount: 0 } };
  return babyWeight(def, s, from, null, events);
}

/** Phase 5 while `carried`: one edge along the route, a wait, or set down at its end. */
function carry(def: PageDef, state: SimState, events: SimEvent[]): SimState {
  const move = carryMove(def, state);
  if (move.kind === 'wait') return state;
  if (move.kind === 'step') {
    const s = enter(state, move.part, move.state, events);
    events.push({ type: 'babyEnter', id: move.node });
    const facing = facingFor(def, s, s.baby.node, move.node, s.baby.facing);
    return { ...s, baby: { ...s.baby, node: move.node, facing, carriedBy: { ...s.baby.carriedBy!, k: move.k } } };
  }
  let s = move.part === undefined ? state : enter(state, move.part, move.state!, events);
  const { carriedBy: _down, ...baby } = s.baby;
  s = { ...s, baby: { ...baby, mode: 'idle', target: null, reachTicks: 0, lookCount: 0 } };
  return babyWeight(def, s, null, s.baby.node, events);
}

// ——— Phase 4 and 5: linked mode (一起, #128) ———

/**
 * 一起's effect, after its `together` event cascaded (§ 2.4): Mocha hops down to his node
 * (`mochaLink`: leaving his perch releases what he held) and they are linked for the rest of the
 * page. He stays `saying` this tick; refusals are forgotten. Nothing when Mocha isn't on the page.
 */
function link(def: PageDef, state: SimState, events: SimEvent[]): SimState {
  const r = mochaLink(def, state);
  if (r.state === state) return state;
  events.push(...r.events);
  return { ...r.state, baby: { ...r.state.baby, linked: true, refused: [], target: 'mocha', lookCount: 0, reachTicks: 0 } };
}

/**
 * Phase 4 in linked mode (§ 2.4, #128): each `lonely` creature on the page (咻咻) follows the pair
 * — it moves to its position nearest Mocha (squared distance; ties keep it where it is, then go to
 * the first position in data order), never onto Mocha's or Baokaka's node. A creature off the page
 * stays away. No event: the view diffs positions, as for every creature move.
 */
export function followPair(def: PageDef, state: SimState): SimState {
  if (!state.baby.linked) return state;
  const lead = mochaNode(def, state);
  const at = lead === null ? undefined : nodePos(def, state, lead);
  if (at === undefined) return state;
  let s = state;
  for (const c of def.creatures) {
    if (c.lonely !== true) continue;
    const current = s.creatures[c.id];
    if (current === undefined || c.positions[current] === 'offpage') continue;
    const score = (pos: string): number => {
      const node = c.positions[pos];
      if (node === 'offpage' || node === lead || node === s.baby.node) return Infinity;
      const p = nodePos(def, s, node);
      return p === undefined ? Infinity : dist2(p, at);
    };
    let best = current;
    let bestD = score(current);
    for (const pos of Object.keys(c.positions)) {
      const d = score(pos);
      if (d < bestD) {
        best = pos;
        bestD = d;
      }
    }
    if (best !== current) s = { ...s, creatures: { ...s.creatures, [c.id]: best } };
  }
  return s;
}

// ——— Phase 7: learning and counters ———

/** The predicates the page counts: its mischief and its event lines. */
export function pagePredicates(def: PageDef): EventPredicate[] {
  return [def.mischief.when, ...(def.lines?.onEvent ?? []).map((l) => l.when)];
}

/** A predicate's `counters` key: its type, then `:id`, then `?` and its condition (stable JSON). */
export function predicateKey(pred: EventPredicate): string {
  let key = predicateKeys.get(pred);
  if (key === undefined) {
    key = pred.type + (pred.id === undefined ? '' : `:${pred.id}`) + (pred.when === undefined ? '' : `?${stableStringify(pred.when)}`);
    predicateKeys.set(pred, key);
  }
  return key;
}

/** `predicateKey` per predicate object (page data is immutable, D-42): the tick and the solver ask every tick. */
const predicateKeys = new WeakMap<EventPredicate, string>();

const eventMatches = (pred: EventPredicate, ev: SimEvent) => ev.type === pred.type && (pred.id === undefined || ev.id === pred.id);

/**
 * Whether a mischief or line predicate is satisfied (GDD § 3.3 phase 7: checked outside the
 * simulation, from the event stream). When the tick tracked it (`counters` has its key — every
 * page predicate is tracked), it holds once `count` (default 1) matching events have happened
 * while its `when` held. Otherwise it falls back to `events`: `count` matching events among them
 * (a `when` can't be judged from events alone, so such a predicate needs its counter).
 */
export function matchPredicate(events: readonly SimEvent[], pred: EventPredicate, counters: Readonly<Record<string, number>>): boolean {
  const need = pred.count ?? 1;
  const counted = counters[predicateKey(pred)];
  if (counted !== undefined) return counted >= need;
  if (pred.when !== undefined) return false;
  return events.filter((ev) => eventMatches(pred, ev)).length >= need;
}

function phaseCounters(def: PageDef, state: SimState, log: SimEvent[]): SimState {
  let s = state;
  const learns = def.learns;
  if (learns !== undefined && !learned(s)) {
    const when = learns.when;
    const fired = 'event' in when ? log.some((ev) => ev.type === when.event && (when.id === undefined || ev.id === when.id)) : evalCond(def, s, when);
    if (fired) {
      s = { ...s, counters: { ...s.counters, [LEARNED_KEY]: 1 } };
      const ev: SimEvent = { type: 'learn' };
      if (learns.word !== undefined) ev.word = learns.word;
      if (learns.growth !== undefined) ev.growth = learns.growth;
      log.push(ev);
    }
  }
  const seen = new Set<string>();
  for (const pred of pagePredicates(def)) {
    const key = predicateKey(pred);
    if (seen.has(key)) continue;
    seen.add(key);
    const need = pred.count ?? 1;
    const current = s.counters[key] ?? 0;
    if (current >= need) continue;
    const matches = log.filter((ev) => eventMatches(pred, ev)).length;
    if (matches === 0 || !holds(def, s, pred.when)) continue;
    s = { ...s, counters: { ...s.counters, [key]: Math.min(need, current + matches) } };
  }
  return s;
}

// ——— The tick ———

/** GDD § 3.3: one tick. See the file comment for the phases. */
export function step(def: PageDef, state: SimState, input: Input): StepResult {
  if (state.done) {
    return { state: { ...state, tick: state.tick + 1, baby: { ...state.baby, mode: 'done' } }, events: [] };
  }
  const log: SimEvent[] = [];
  const run = (s: SimState, events: SimEvent[]): SimState => {
    const r = cascade(def, s, events);
    log.push(...r.events);
    return r.state;
  };

  // 1–2. Input, then its cascade.
  const inputEvents: SimEvent[] = [];
  const saying = canSay(def, state, input);
  let s = run(phaseInput(def, state, input, inputEvents), inputEvents);

  // 3. Mocha, then what his arrival or a landing did.
  const mocha = mochaTick(def, s, input);
  s = run(mocha.state, mocha.events);

  // 4. Creatures: their reactions already moved them in the cascades (creatures.ts); lonely ones follow the pair.
  s = followPair(def, s);

  // 5–6. Baby.
  const atMove = s;
  if (saying && input.t === 'say') {
    const ev = wordEvent(def, s, input.word);
    if (ev !== null) s = run(s, [ev]);
    // Refusals of attractors that changed this tick lapse (§ 2.4), before 不要！ adds the target.
    const refused = keepRefusals(def, state, s);
    if (refused.length !== s.baby.refused.length) s = { ...s, baby: { ...s.baby, refused } };
    if (ev === null) s = sayNo(s);
    else if (input.word === 'hug' && !s.baby.linked) {
      const events: SimEvent[] = [];
      s = run(hugUp(def, s, events), events);
    } else if (input.word === 'together') {
      const events: SimEvent[] = [];
      s = run(link(def, s, events), events);
    }
  } else if (s.baby.mode === 'carried') {
    const events: SimEvent[] = [];
    s = run(carry(def, s, events), events);
  } else {
    const from = s.baby.node;
    const baby = babyTick(def, s, { prev: state, growth: stepGrowth(def, s) });
    const events = [...baby.events];
    s = babyWeight(def, baby.state, from, baby.state.baby.node, events);
    s = run(s, events);
  }
  const ride = rideEvent(def, state, atMove, s);
  if (ride !== null) s = run(s, [ride]);

  // 7. Learning, counters, the clock.
  s = phaseCounters(def, s, log);
  return { state: { ...s, tick: s.tick + 1 }, events: log };
}
