import { babyTick, keepRefusals } from './baby';
import { evalCond, holds, partState } from './cond';
import { creaturePoint, moveCreature, skyPosition } from './creatures';
import { EVENT_RADIUS, isSimEvent, type SimEvent } from './events';
import { nodePos, type Point } from './graph';
import { catLocked, buttonWeighed, mochaCommand, mochaPet, mochaSettled, mochaTick } from './mocha';
import { compilePart, reactionTarget, tapTarget } from './presets';
import { stableStringify, withPartState } from './state';
import type { EventPredicate, Growth, Id, Input, PageDef, PartDef, ReactionOn, SimState } from './types';
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
 *    jams), `mocha` / `pet` (`mocha.ts`), `say` (Baokaka enters `saying`; the word resolves in
 *    phase 5), `floor` (linked mode, #128: ignored for now).
 * 2. **Cascade** of phase 1's events (`cascade`): FIFO; each § 3.2 event triggers, per part and
 *    per creature, its first matching reaction (conditions read the state before that event's
 *    transitions); a part entering a state queues `partEnter` and its `emit` events. More than
 *    `MAX_CASCADE` events in one cascade throws `CascadeOverflowError`.
 * 3. **Mocha** (`mochaTick`), then a cascade of what he did (arrival presses, `set`, landings).
 * 4. **Creatures.** Their moves and drops already happened in the cascades (`creatures.ts`).
 * 5. **Baby.** On a say tick: 不要！ refuses the target, any other word's event cascades from
 *    him (`words.ts`), and he stays `saying`. Otherwise the decision loop (`babyTick`, ≤ 1 edge,
 *    `babyEnter`) with his weight on buttons attached to the nodes he leaves and enters; then a
 *    cascade of his events (a `cry` opens the balcony door now, and he sees it next tick).
 *    Finally `ride` if he ends the tick on a node attached to a part that carried him this tick.
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
 * toggle on 飛機！ unless they have their own reaction. UI events pass through to the log.
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
      if (!allowed(def, s, t.part, to)) continue;
      s = enter(s, t.part, to, queue);
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
  if (states[k] !== current) s = enter(s, part, states[k], events);
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
  return enter(state, part, to, events);
}

/** Whether Baokaka can take a `say` now: not done, not carried or linked (#120, #128), word available. */
function canSay(def: PageDef, state: SimState, input: Input): boolean {
  if (input.t !== 'say' || state.done) return false;
  const mode = state.baby.mode;
  return mode !== 'carried' && mode !== 'linked' && wordAvailable(def, input.word, learned(state));
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
    case 'floor': // TODO(#128): linked mode walks Mocha to the floor node.
    case 'none':
      return state;
  }
}

// ——— Phase 5: the baby's weight and rides ———

function attachedPart(def: PageDef, nodeId: Id): Id | undefined {
  return def.nodes.find((n) => n.id === nodeId)?.attach?.part;
}

/**
 * § 2.1 `button`: Baokaka's weight. Leaving a node attached to a pressed button releases it unless
 * Mocha sits on it or a landed pushable holds it; entering one presses it (a press always emits
 * `partEnter`, as Mocha's does, D-44). `lockedWhen` and `stateWhen` still apply.
 */
function babyWeight(def: PageDef, state: SimState, from: Id, to: Id, events: SimEvent[]): SimState {
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

// ——— Phase 7: learning and counters ———

/** The predicates the page counts: its mischief and its event lines. */
export function pagePredicates(def: PageDef): EventPredicate[] {
  return [def.mischief.when, ...(def.lines?.onEvent ?? []).map((l) => l.when)];
}

/** A predicate's `counters` key: its type, then `:id`, then `?` and its condition (stable JSON). */
export function predicateKey(pred: EventPredicate): string {
  return pred.type + (pred.id === undefined ? '' : `:${pred.id}`) + (pred.when === undefined ? '' : `?${stableStringify(pred.when)}`);
}

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
    const fired = 'event' in learns.when ? log.some((ev) => ev.type === (learns.when as { event: string }).event) : evalCond(def, s, learns.when);
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

  // 4. Creatures: their reactions already moved them in the cascades (creatures.ts).

  // 5–6. Baby.
  const atMove = s;
  if (saying && input.t === 'say') {
    const ev = wordEvent(def, s, input.word);
    if (ev !== null) s = run(s, [ev]);
    // Refusals of attractors that changed this tick lapse (§ 2.4), before 不要！ adds the target.
    const refused = keepRefusals(def, state, s);
    if (refused.length !== s.baby.refused.length) s = { ...s, baby: { ...s.baby, refused } };
    if (ev === null) s = sayNo(s);
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
