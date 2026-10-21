import { rankCandidates, visibleTie } from './baby';
import { EVENT_RADIUS, EVENT_TYPES } from './events';
import { PRESETS } from './presets';
import { initialState } from './state';
import type {
  AttractorDef,
  Cond,
  CreatureDef,
  EdgeKind,
  EventPredicate,
  EventType,
  Id,
  LineKey,
  PageDef,
  PartDef,
  PartInput,
  PartPreset,
  Reaction,
  ReactionOn,
} from './types';
import { PART_PRESETS } from './types';
import { inReach, WORDS } from './words';

/**
 * The page lint (GDD § 3.6). `lintPage(def, script?)` checks a page's static structure and returns
 * `{ errors, warnings }`; it runs in `pages.test.ts` (#87) and in PageLab on every edit (#91), so
 * it is total (it never throws, whatever the data) and fast (well under 5 ms per page). Every
 * issue has a **stable code** (PageLab and CI print it) and a message naming the page and the ids.
 * Decisions in D-47.
 *
 * | Code | Severity | § 3.6 rule: what fires it |
 * |---|---|---|
 * | `L01-duplicate-id` | error | 1: two nodes / parts / perches / attractors / creatures share an id |
 * | `L01-reserved-id` | error | 1: an attractor is called `'mocha'` (Mocha's own candidate id, D-43) |
 * | `L01-unknown-ref` | error | 1: a reference names no such node, part, perch, attractor, creature, flag or line |
 * | `L01-wrong-kind` | error | 1: a reference names the wrong kind of thing (`push` / `landed` / `followsPushable` a non-pushable, a light's `attractor` not a `light` one, `drop` an attractor that creature doesn't hold) |
 * | `L01-invalid-value` | error | 1: an unknown preset, input, edge kind, event type or word |
 * | `L01-invalid-filter` | error | 1: a reaction filters on `state` without listening to `partEnter` |
 * | `L01-shared-perch-node` | error | 1: two perches sit on one node |
 * | `L01-winged-no-sky` | error | 1: a `winged` creature has no `sky` or `away` position for 飛機！ |
 * | `L02-unknown-state` | error | 2: a named part state (in a `Cond`, `stateWhen`, `attach`, `nodeBy`, a reaction or perch `to`, `emit.onEnter`, `landSets`, a solution step) or creature position doesn't exist |
 * | `L03-missing-states` | error | 3: a count-based preset (`tab`, `slider`, `wheel`, `section`, `lift`, `loop`, `blowable`) or a `prop` lists no states |
 * | `L03-initial-not-in-states` | error | 3: `initial` isn't one of the (compiled) states; a creature's `initial` isn't a position |
 * | `L03-bad-states` | error | 3: duplicate states; a pushable whose states aren't `onPerch`/`falling`/`landed`; a tab/slider outside 2–4 stops or a wheel/section outside 2–8 |
 * | `L03-invalid-input` | error | 3: `input` isn't allowed for the preset (`PRESETS[preset].inputs`) |
 * | `L03-preset-field` | error | 3: a pushable without `fall`, a carrier without a `route` (or one under two nodes); a `route` on a non-carrier, a `counterweight` on a non-lift |
 * | `L03-carrier-start` | error | 3: a carrier starts mid-carry (`carrying@k`): it must start `idle` or `done` (#120) |
 * | `L03-carrier-driven` | error | 3: a carrier moved by anything but 抱抱 (a reaction, a perch `set` or `onPart`, a `landSets`): its state is where he is (#120) |
 * | `L03-coupled` | error | 3: `coupled` on, or naming, a part that isn't a `wheel` / `section` / `loop` / `blowable`; coupled parts with different numbers of states; a part coupled to itself or listed twice (#127) |
 * | `L03-counterweight` | error | 3: a counterweighted lift no perch weighs (`onPart`), or whose `initial` isn't the state Mocha's start puts it in (#120) |
 * | `L04-attach-missing-state` | error | 4: a node attached to a part lacks a position for one of its states |
 * | `L04-gate-node-moves` | error | 4: a node attached to a gate has different positions (a doorway stays put, D-42) |
 * | `L05-vanishing-ground` | error | 5: a node an edge leads to leaves the 390 × 560 page in some state, or rides a pushable |
 * | `L05-carrier-route` | error | 5: a carrier's route steps between two nodes no baby edge joins, or through a height-2 node (it would set him down where he can't be, #120) |
 * | `L06-dropping-baby` | error | 6: a node Baokaka can stand on is attached to a pushable or a carrier |
 * | `L07-pushable-unpushed` | error | 7: no perch `push`es a pushable |
 * | `L07-pushable-reaction` | error | 7: a pushable's reaction goes anywhere but back `onPerch` |
 * | `L08-budget-nodes` / `-parts` / `-interactive` / `-creatures` | error | 8: > 40 nodes, > 12 parts, > 8 player-interactive parts, > 6 creatures |
 * | `L09-hit-too-small` | error | 9: an interactive part's hit area is under 48 × 48 units (a circle: r < 24) |
 * | `L09-hit-overlap` | error | 9: two interactive hit areas overlap by more than 30 % of the smaller |
 * | `L10-title-too-long` | error | 10: `title` over 10 characters |
 * | `L10-text-too-long` | error | 10: a script line or the 淘氣 text over 30 characters |
 * | `L11-goal-count` | error | 11: not exactly one `goal` attractor |
 * | `L11-bad-goal` | error | 11: the goal is a decoy, or not `shiny` (only a grab completes a page) |
 * | `L11-no-tudigong` / `L11-no-mischief` | error | 11: the 土地公 or the 淘氣 is missing |
 * | `L12-cascade-loop` | error | 12: parts that re-trigger each other with unconditional `next`/`prev`/`toggle` reactions: every cascade through them overflows |
 * | `L12-cascade-cycle` | warning | 12: parts whose reactions can trigger each other in a cycle; the solver (#87) proves it stays under 32 |
 * | `L13-custom-reaction` | warning | 13: a function in the page data (the custom-reaction escape hatch, § 3.1) |
 * | `L14-visible-tie` | warning | 14: his first target ties with another on priority, reachability and path length in the initial state (GDD § 6 risk 4; the solver's `visibleTies` checks every reachable state, #112) |
 * | `L15-lock-order` | warning | 15: a part's `lockedWhen`/`stateWhen` reads a part that reacts to the same event earlier in data order, so it sees that event's new state (D-45) |
 * | `L16-always-wet-perch` | warning | 16: a `wet`/`steam` perch with no `blockedWhen` is refused forever (C7) |
 * | `L18-linked-edge` | error | 18: on a page where 一起 can be said, a baby edge touches a height-2 node — in linked mode Mocha would lead him onto a perch (#128) |
 * | `L18-lonely-blocks` | error | 18: a `lonely` creature blocks its node: following the pair, it would wall them in (#128) |
 * | `L18-lonely-unlinked` | warning | 18: a `lonely` creature on a page where 一起 can't be said never follows anyone (#128) |
 *
 * Text lengths count code points (`[...text].length`), 「」 and punctuation included (GDD § 5.1).
 * Rule 12's fuzzing is the solver's (#87): the lint finds what the structure alone proves. Rule 7's
 * dead-end half is the solver's too: `solutionPushables` names the pushables a solution relies on.
 */

export type LintSeverity = 'error' | 'warning';

export interface LintIssue {
  /** Stable code, e.g. `L05-vanishing-ground` (see the table above). */
  readonly code: string;
  readonly severity: LintSeverity;
  /** The page's id. */
  readonly page: Id;
  /** The ids the issue is about, in the order the message names them. */
  readonly ids: readonly Id[];
  /** English, starting with the page id. */
  readonly message: string;
}

export interface LintResult {
  readonly errors: LintIssue[];
  readonly warnings: LintIssue[];
}

/** The line table rule 10 checks keys against (`content/script.ts`): a key → the text, or `{ text }`. */
export type LineTable = Readonly<Record<LineKey, string | { readonly text: string }>>;

/** The page in page units (GDD § 2.1). */
export const PAGE_SIZE = { w: 390, h: 560 } as const;

/** § 3.6 rule 8. */
export const LINT_BUDGET = { nodes: 40, parts: 12, interactive: 8, creatures: 6 } as const;
/** § 3.6 rule 9 (and § 1.3 R6): smallest hit area side, in page units, and the largest overlap. */
export const MIN_HIT = 48;
export const MAX_HIT_OVERLAP = 0.3;
/** § 3.6 rule 10, § 5.1. */
export const MAX_TITLE_CHARS = 10;
export const MAX_LINE_CHARS = 30;

const EDGE_KINDS: readonly EdgeKind[] = ['crawl', 'climb', 'cruise', 'walk', 'jump', 'squeeze'];
const PART_INPUTS: readonly PartInput[] = ['drag-linear', 'drag-rotary', 'tap-toggle', 'tap-cycle', 'none'];
const RELATIVE_TO = new Set(['next', 'prev', 'toggle']);
/** The presets a `coupled` list may join (#127): parts that turn through a cycle of states. */
const COUPLED_PRESETS = new Set<PartPreset>(['wheel', 'section', 'loop', 'blowable']);
const PUSHABLE_STATES = ['onPerch', 'falling', 'landed'];
const BABY_KINDS = new Set<string>(['crawl', 'climb', 'cruise', 'walk']);
/** Allowed state counts (GDD § 2.1 *Part presets*). */
const STATE_COUNT: Partial<Record<PartPreset, readonly [number, number]>> = {
  tab: [2, 4],
  slider: [2, 4],
  wheel: [2, 8],
  section: [2, 8],
};

/** Code points, as GDD § 5.1 counts characters. */
export const textLength = (text: string): number => [...text].length;

type Hit = PartDef['hit'];

/** Area of a hit shape in square units. */
function hitArea(h: Hit): number {
  return 'r' in h ? Math.PI * h.r * h.r : h.w * h.h;
}

/** A hit shape's vertical extent at column `x` (only asked for columns inside the shape's extent). */
function hitSpan(h: Hit, x: number): [number, number] {
  if (!('r' in h)) return [h.y, h.y + h.h];
  const dx = x - h.cx;
  const dy = Math.sqrt(Math.max(0, h.r * h.r - dx * dx));
  return [h.cy - dy, h.cy + dy];
}

const hitLeft = (h: Hit) => ('r' in h ? h.cx - h.r : h.x);
const hitRight = (h: Hit) => ('r' in h ? h.cx + h.r : h.x + h.w);

/**
 * The area two hit shapes share. Rectangles exactly; with a circle, by integrating column spans
 * (quarter-unit midpoint columns: far below a pixel, and cheap at these sizes).
 */
export function hitOverlapArea(a: Hit, b: Hit): number {
  if (!('r' in a) && !('r' in b)) {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? w * h : 0;
  }
  const left = Math.max(hitLeft(a), hitLeft(b));
  const right = Math.min(hitRight(a), hitRight(b));
  const dx = 0.25;
  let area = 0;
  for (let x = left + dx / 2; x < right; x += dx) {
    const sa = hitSpan(a, x);
    const sb = hitSpan(b, x);
    const h = Math.min(sa[1], sb[1]) - Math.max(sa[0], sb[0]);
    if (h > 0) area += h * dx;
  }
  return area;
}

/** The share of the smaller shape that the two overlap (0 … 1). */
export function hitOverlap(a: Hit, b: Hit): number {
  const smaller = Math.min(hitArea(a), hitArea(b));
  return smaller > 0 ? hitOverlapArea(a, b) / smaller : 0;
}

/** A hit area's centre (the origin of the part's events, D-45). */
function hitCentre(h: Hit): [number, number] {
  return 'r' in h ? [h.cx, h.cy] : [h.x + h.w / 2, h.y + h.h / 2];
}

const onType = (on: ReactionOn): EventType => (typeof on === 'string' ? on : on.type);
const onId = (on: ReactionOn): Id | undefined => (typeof on === 'string' ? undefined : on.id);
const onState = (on: ReactionOn): string | undefined => (typeof on === 'string' ? undefined : on.state);
const onWithin = (on: ReactionOn): number | undefined => (typeof on === 'string' ? undefined : on.within);

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * The pushables a page's intended solution relies on: those knocked off by a perch the solution
 * sends Mocha to (or pets him on). § 3.6 rule 7: such a page must pass the solver's dead-end check
 * (`pages.test.ts`, #87).
 */
export function solutionPushables(def: PageDef): Id[] {
  const out = new Set<Id>();
  let perch: Id | null = def.mocha?.start ?? null;
  for (const step of def.solution ?? []) {
    if ('mocha' in step) perch = step.mocha;
    if (!('mocha' in step) && !('pet' in step)) continue;
    const push = def.perches?.find((p) => p.id === perch)?.push;
    if (push !== undefined) out.add(push);
  }
  return [...out].sort();
}

/** GDD § 3.6: lints a page. `script` is the line table for rule 10; without it, line keys aren't checked. */
export function lintPage(def: PageDef, script?: LineTable): LintResult {
  return new Linter(def, script).run();
}

/** Compiled facts about one part, or null states when its preset or states are broken. */
interface PartInfo {
  readonly def: PartDef;
  /** null when they can't be known (unknown preset, missing states): state checks skip the part. */
  readonly states: readonly string[] | null;
  readonly input: PartInput;
  readonly interactive: boolean;
}

class Linter {
  private readonly errors: LintIssue[] = [];
  private readonly warnings: LintIssue[] = [];
  private readonly page: Id;
  private readonly nodes: Set<Id>;
  private readonly perches: Set<Id>;
  private readonly attractors: Map<Id, AttractorDef>;
  private readonly creatures: Map<Id, CreatureDef>;
  private readonly parts = new Map<Id, PartInfo>();
  private readonly flags = new Set<Id>();
  /** Set when a check fails in a way that makes the initial state unbuildable. */
  private broken = false;

  constructor(
    private readonly def: PageDef,
    private readonly script: LineTable | undefined,
  ) {
    this.page = typeof def.id === 'string' ? def.id : '?';
    this.nodes = new Set(this.list(def.nodes).map((n) => n.id));
    this.perches = new Set(this.list(def.perches).map((p) => p.id));
    this.attractors = new Map(this.list(def.attractors).map((a) => [a.id, a]));
    this.creatures = new Map(this.list(def.creatures).map((c) => [c.id, c]));
    for (const part of this.list(def.parts)) {
      for (const r of part.react ?? []) if (r.setFlag !== undefined) this.flags.add(r.setFlag);
    }
  }

  private list<T>(xs: readonly T[] | undefined): readonly T[] {
    return Array.isArray(xs) ? xs : [];
  }

  private issue(severity: LintSeverity, code: string, ids: readonly Id[], text: string): void {
    const issue: LintIssue = { code, severity, page: this.page, ids, message: `${this.page}: ${text}` };
    (severity === 'error' ? this.errors : this.warnings).push(issue);
  }

  private error(code: string, ids: readonly Id[], text: string): void {
    this.issue('error', code, ids, text);
  }

  private warn(code: string, ids: readonly Id[], text: string): void {
    this.issue('warning', code, ids, text);
  }

  run(): LintResult {
    this.compileParts();
    this.checkIds();
    this.checkNodesAndEdges();
    this.checkParts();
    this.checkMovers();
    this.checkPerches();
    this.checkAttractors();
    this.checkCreatures();
    this.checkPage();
    this.checkBudget();
    this.checkHits();
    this.checkCascade();
    this.checkLockOrder();
    this.checkCustom();
    this.checkTie();
    this.checkLinked();
    return { errors: this.errors, warnings: this.warnings };
  }

  // ——— Parts: presets, states, inputs (rule 3) ———

  private compileParts(): void {
    for (const part of this.list(this.def.parts)) {
      if (this.parts.has(part.id)) continue; // duplicates are rule 1's
      const spec = (PART_PRESETS as readonly string[]).includes(part.preset) ? PRESETS[part.preset] : undefined;
      if (spec === undefined) {
        this.error('L01-invalid-value', [part.id], `part '${part.id}' has unknown preset '${String(part.preset)}'`);
        this.parts.set(part.id, { def: part, states: null, input: 'none', interactive: false });
        this.broken = true;
        continue;
      }
      let input = part.input ?? spec.input;
      if (!PART_INPUTS.includes(input)) {
        this.error('L01-invalid-value', [part.id], `part '${part.id}' has unknown input '${String(input)}'`);
        input = spec.input;
      } else if (!spec.inputs.includes(input)) {
        this.error('L03-invalid-input', [part.id], `part '${part.id}' (${part.preset}) can't take input '${input}'; allowed: ${spec.inputs.join(', ')}`);
      }
      const states = part.states ?? spec.states?.(part) ?? null;
      if (states === null || states.length === 0) {
        this.error('L03-missing-states', [part.id], `part '${part.id}' (${part.preset}) must list its states`);
        this.broken = true;
      }
      const known = states !== null && states.length > 0 ? states : null;
      this.parts.set(part.id, { def: part, states: known, input, interactive: input !== 'none' });
      if (known === null) continue;

      const dup = known.filter((s, i) => known.indexOf(s) !== i);
      if (dup.length > 0) this.error('L03-bad-states', [part.id], `part '${part.id}' lists state '${dup[0]}' twice`);
      if (part.preset === 'pushable' && known.join() !== PUSHABLE_STATES.join()) {
        this.error('L03-bad-states', [part.id], `pushable '${part.id}' must have the states ${PUSHABLE_STATES.join(', ')}`);
      }
      const range = STATE_COUNT[part.preset];
      if (range !== undefined && (known.length < range[0] || known.length > range[1])) {
        this.error('L03-bad-states', [part.id], `${part.preset} '${part.id}' has ${known.length} states; it needs ${range[0]}–${range[1]}`);
      }
      const initial = part.initial ?? known[0];
      if (!known.includes(initial)) {
        this.error('L03-initial-not-in-states', [part.id], `part '${part.id}' starts in '${initial}', which isn't one of its states (${known.join(', ')})`);
        this.broken = true;
      }
      if (part.preset === 'pushable' && part.fall === undefined) this.error('L03-preset-field', [part.id], `pushable '${part.id}' has no \`fall\``);
      if (part.preset === 'carrier' && (part.route === undefined || part.route.length === 0)) {
        this.error('L03-preset-field', [part.id], `carrier '${part.id}' has no \`route\``);
      }
    }
  }

  // ——— Rule 1: ids ———

  private checkIds(): void {
    const categories: [string, readonly { id: Id }[]][] = [
      ['node', this.list(this.def.nodes)],
      ['part', this.list(this.def.parts)],
      ['perch', this.list(this.def.perches)],
      ['attractor', this.list(this.def.attractors)],
      ['creature', this.list(this.def.creatures)],
    ];
    for (const [kind, items] of categories) {
      const seen = new Set<Id>();
      for (const { id } of items) {
        if (seen.has(id)) this.error('L01-duplicate-id', [id], `two ${kind}s are called '${id}'`);
        seen.add(id);
      }
    }
    if (this.attractors.has('mocha')) this.error('L01-reserved-id', ['mocha'], `the attractor id 'mocha' is reserved for Mocha himself`);
  }

  // ——— Reference helpers ———

  private ref(set: ReadonlySet<Id> | ReadonlyMap<Id, unknown>, kind: string, id: Id | undefined, where: string, owner: Id): boolean {
    if (id === undefined) return false;
    if (set.has(id)) return true;
    this.error('L01-unknown-ref', [owner, id], `${where} names ${kind} '${id}', which doesn't exist`);
    return false;
  }

  private node(id: Id | undefined, where: string, owner: Id): boolean {
    return this.ref(this.nodes, 'node', id, where, owner);
  }

  private part(id: Id | undefined, where: string, owner: Id): PartInfo | undefined {
    return this.ref(this.parts, 'part', id, where, owner) ? this.parts.get(id!) : undefined;
  }

  private pushable(id: Id | undefined, where: string, owner: Id): void {
    const info = this.part(id, where, owner);
    if (info !== undefined && info.def.preset !== 'pushable') this.error('L01-wrong-kind', [owner, id!], `${where} names '${id}', which isn't a pushable`);
  }

  /** `state` must be one of the part's states (skipped when they're unknown). */
  private partState(info: PartInfo | undefined, state: string, where: string, owner: Id): void {
    if (info === undefined || info.states === null || info.states.includes(state)) return;
    this.error('L02-unknown-state', [owner, info.def.id], `${where} names state '${state}' of '${info.def.id}', which has only ${info.states.join(', ')}`);
  }

  private position(c: CreatureDef | undefined, at: string, where: string, owner: Id): void {
    if (c === undefined || c.positions === undefined || at in c.positions) return;
    this.error('L02-unknown-state', [owner, c.id], `${where} names position '${at}' of creature '${c.id}', which has only ${Object.keys(c.positions).join(', ')}`);
  }

  private eventType(type: unknown, where: string, owner: Id): type is EventType {
    if ((EVENT_TYPES as readonly unknown[]).includes(type)) return true;
    this.error('L01-invalid-value', [owner], `${where} names unknown event '${String(type)}'`);
    return false;
  }

  private word(word: unknown, where: string, owner: Id): void {
    if (!(WORDS as readonly unknown[]).includes(word)) this.error('L01-invalid-value', [owner], `${where} names unknown word '${String(word)}'`);
  }

  /** Any id on the page (an event's subject): a node, part, perch, attractor or creature. */
  private anyId(id: Id | undefined, where: string, owner: Id): void {
    if (id === undefined) return;
    if (this.nodes.has(id) || this.parts.has(id) || this.perches.has(id) || this.attractors.has(id) || this.creatures.has(id)) return;
    this.error('L01-unknown-ref', [owner, id], `${where} names '${id}', which is nothing on this page`);
  }

  /** Rules 1 and 2 inside a condition. */
  private cond(cond: Cond | undefined, where: string, owner: Id): void {
    if (cond === undefined) return;
    if (!isObject(cond)) {
      this.error('L01-invalid-value', [owner], `${where} has a malformed condition`);
      return;
    }
    if ('part' in cond) {
      const info = this.part(cond.part, where, owner);
      for (const s of cond.in ?? []) this.partState(info, s, where, owner);
    } else if ('mochaAt' in cond) this.ref(this.perches, 'perch', cond.mochaAt, where, owner);
    else if ('babyAt' in cond) this.node(cond.babyAt, where, owner);
    else if ('landed' in cond) this.pushable(cond.landed, where, owner);
    else if ('creature' in cond) {
      if (this.ref(this.creatures, 'creature', cond.creature, where, owner)) this.position(this.creatures.get(cond.creature), cond.at, where, owner);
    } else if ('consumed' in cond) this.ref(this.attractors, 'attractor', cond.consumed, where, owner);
    else if ('flag' in cond) this.ref(this.flags, 'flag (set by no reaction)', cond.flag, where, owner);
    else if ('all' in cond) cond.all.forEach((c) => this.cond(c, where, owner));
    else if ('any' in cond) cond.any.forEach((c) => this.cond(c, where, owner));
    else if ('not' in cond) this.cond(cond.not, where, owner);
    else this.error('L01-invalid-value', [owner], `${where} has a malformed condition`);
  }

  private predicate(pred: EventPredicate, where: string, owner: Id): void {
    this.eventType(pred.type, where, owner);
    this.anyId(pred.id, where, owner);
    this.cond(pred.when, where, owner);
  }

  private reactionOn(on: ReactionOn, where: string, owner: Id): void {
    if (!this.eventType(onType(on), where, owner)) return;
    this.anyId(onId(on), where, owner);
    const state = onState(on);
    if (state === undefined) return;
    if (onType(on) !== 'partEnter') {
      this.error('L01-invalid-filter', [owner], `${where} filters on state '${state}' but listens to '${onType(on)}', not partEnter`);
      return;
    }
    const id = onId(on);
    if (id !== undefined) this.partState(this.parts.get(id), state, where, owner);
  }

  // ——— Rules 4–6: nodes and edges ———

  private checkNodesAndEdges(): void {
    const edgeEnds = new Set<Id>();
    const babyEnds = new Set<Id>();
    for (const [i, e] of this.list(this.def.edges).entries()) {
      const where = `edge #${i} (${e.a}–${e.b})`;
      this.node(e.a, where, e.a);
      this.node(e.b, where, e.b);
      if (!EDGE_KINDS.includes(e.kind)) this.error('L01-invalid-value', [e.a, e.b], `${where} has unknown kind '${String(e.kind)}'`);
      this.cond(e.when, where, e.a);
      edgeEnds.add(e.a).add(e.b);
      if (BABY_KINDS.has(e.kind)) babyEnds.add(e.a).add(e.b);
    }
    const start = this.def.baby?.start;
    if (start !== undefined) babyEnds.add(start);

    for (const n of this.list(this.def.nodes)) {
      const where = `node '${n.id}'`;
      const positions: [string, readonly [number, number]][] = [['', [n.x, n.y]]];
      if (n.attach !== undefined) {
        const info = this.part(n.attach.part, `${where} attach`, n.id);
        const pos = n.attach.pos ?? {};
        for (const s of Object.keys(pos)) this.partState(info, s, `${where} attach`, n.id);
        if (info?.states != null) {
          const missing = info.states.filter((s) => !(s in pos));
          if (missing.length > 0) {
            this.error('L04-attach-missing-state', [n.id, info.def.id], `${where} is attached to '${info.def.id}' but has no position for ${missing.map((s) => `'${s}'`).join(', ')}`);
          }
          if (info.def.preset === 'gate') {
            const distinct = new Set(info.states.filter((s) => s in pos).map((s) => `${pos[s][0]},${pos[s][1]}`));
            if (distinct.size > 1) this.error('L04-gate-node-moves', [n.id, info.def.id], `${where} is attached to gate '${info.def.id}' but moves between its states`);
          }
        }
        positions.length = 0;
        positions.push(...Object.entries(pos));
        const preset = info?.def.preset;
        if (edgeEnds.has(n.id) && preset === 'pushable') {
          this.error('L05-vanishing-ground', [n.id, info!.def.id], `${where} has edges but rides pushable '${info!.def.id}', which falls away`);
        }
        if (babyEnds.has(n.id) && (preset === 'pushable' || preset === 'carrier')) {
          this.error('L06-dropping-baby', [n.id, info!.def.id], `Baokaka can stand on ${where}, but it is attached to ${preset} '${info!.def.id}', whose states aren't places`);
        }
      }
      if (!edgeEnds.has(n.id)) continue;
      for (const [s, [x, y]] of positions) {
        if (x >= 0 && x <= PAGE_SIZE.w && y >= 0 && y <= PAGE_SIZE.h) continue;
        const when = s === '' ? '' : ` in state '${s}'`;
        this.error('L05-vanishing-ground', [n.id], `${where} has edges but sits off the page${when} (${x}, ${y})`);
      }
    }
  }

  // ——— Parts: references, reactions, rule 7 ———

  private checkParts(): void {
    const pushed = new Set(this.list(this.def.perches).map((p) => p.push));
    for (const info of this.parts.values()) {
      const p = info.def;
      const where = `part '${p.id}'`;
      this.cond(p.lockedWhen, `${where} lockedWhen`, p.id);
      for (const [s, c] of Object.entries(p.stateWhen ?? {})) {
        this.partState(info, s, `${where} stateWhen`, p.id);
        this.cond(c, `${where} stateWhen.${s}`, p.id);
      }
      for (const [i, r] of (p.react ?? []).entries()) this.partReaction(info, r, `${where} reaction #${i}`);
      for (const e of p.emit ?? []) {
        this.eventType(e.event, `${where} emit`, p.id);
        this.partState(info, e.onEnter, `${where} emit`, p.id);
      }
      if (p.fall !== undefined) {
        this.node(p.fall.fallTo, `${where} fall`, p.id);
        if (p.fall.landSets !== undefined) {
          const target = this.part(p.fall.landSets.part, `${where} landSets`, p.id);
          this.partState(target, p.fall.landSets.to, `${where} landSets`, p.id);
        }
      }
      for (const n of p.route ?? []) this.node(n, `${where} route`, p.id);
      this.node(p.ridesOn, `${where} ridesOn`, p.id);
      if (p.attractor !== undefined && this.ref(this.attractors, 'attractor', p.attractor, `${where} attractor`, p.id)) {
        if (this.attractors.get(p.attractor)!.kind !== 'light') this.error('L01-wrong-kind', [p.id, p.attractor], `${where} owns attractor '${p.attractor}', which isn't a light`);
      }
      if (p.preset === 'pushable' && !pushed.has(p.id)) this.error('L07-pushable-unpushed', [p.id], `no perch pushes pushable '${p.id}'`);
    }
  }

  // ——— Carriers and counterweights (#120) ———

  private checkMovers(): void {
    const nodes = new Map(this.list(this.def.nodes).map((n) => [n.id, n]));
    const perches = this.list(this.def.perches);
    const babyEdge = (a: Id, b: Id) =>
      this.list(this.def.edges).some((e) => BABY_KINDS.has(e.kind) && ((e.a === a && e.b === b) || (e.a === b && e.b === a)));
    for (const info of this.parts.values()) {
      const p = info.def;
      const where = `part '${p.id}'`;
      if (p.route !== undefined && p.preset !== 'carrier') this.error('L03-preset-field', [p.id], `${where} has a \`route\` but is a ${p.preset}, not a carrier`);
      if (p.counterweight !== undefined && p.preset !== 'lift') this.error('L03-preset-field', [p.id], `${where} has a \`counterweight\` but is a ${p.preset}, not a lift`);

      if (p.preset === 'carrier' && p.route !== undefined && p.route.length > 0) {
        const route = p.route;
        if (route.length < 2) this.error('L03-preset-field', [p.id], `carrier '${p.id}' has a one-node route: it must walk somewhere`);
        const initial = p.initial ?? 'idle';
        if (initial !== 'idle' && initial !== 'done') this.error('L03-carrier-start', [p.id], `carrier '${p.id}' starts in '${initial}'; it must start idle or done`);
        for (let k = 1; k < route.length; k++) {
          if (nodes.has(route[k - 1]) && nodes.has(route[k]) && !babyEdge(route[k - 1], route[k])) {
            this.error('L05-carrier-route', [p.id, route[k - 1], route[k]], `carrier '${p.id}' steps from '${route[k - 1]}' to '${route[k]}', which no baby edge joins`);
          }
        }
        for (const n of route) {
          if (nodes.get(n)?.height === 2) this.error('L05-carrier-route', [p.id, n], `carrier '${p.id}' walks through '${n}', a height-2 node he can't be set down on`);
        }
        const drivers = [
          ...(p.react !== undefined && p.react.length > 0 ? [`its own reaction`] : []),
          ...perches.filter((x) => x.set?.part === p.id || x.onPart === p.id).map((x) => `perch '${x.id}'`),
          ...this.list(this.def.parts).filter((x) => x.fall?.landSets?.part === p.id).map((x) => `pushable '${x.id}'`),
        ];
        if (drivers.length > 0) this.error('L03-carrier-driven', [p.id], `carrier '${p.id}' is moved by ${drivers.join(', ')}; only 抱抱 moves a carrier`);
      }

      if (p.coupled !== undefined) this.checkCoupled(info);

      const weight = p.preset === 'lift' ? p.counterweight : undefined;
      if (weight !== undefined) {
        this.partState(info, weight.on, `${where} counterweight`, p.id);
        this.partState(info, weight.off, `${where} counterweight`, p.id);
        const weighing = perches.filter((x) => x.onPart === p.id).map((x) => x.id);
        if (weighing.length === 0) this.error('L03-counterweight', [p.id], `lift '${p.id}' has a counterweight but no perch sits on it (\`onPart\`)`);
        const start = this.def.mocha?.start ?? null;
        const expected = start !== null && weighing.includes(start) ? weight.on : weight.off;
        const initial = p.initial ?? info.states?.[0];
        if (initial !== undefined && initial !== expected) {
          this.error('L03-counterweight', [p.id], `lift '${p.id}' starts '${initial}', but Mocha ${expected === weight.on ? 'starts on it' : "doesn't start on it"}, so it is '${expected}'`);
        }
      }
    }
  }

  /** `coupled` (#127, D-91): turning parts with the same number of states, never itself or twice. */
  private checkCoupled(info: PartInfo): void {
    const p = info.def;
    const where = `part '${p.id}'`;
    if (!Array.isArray(p.coupled)) return;
    if (!COUPLED_PRESETS.has(p.preset)) {
      this.error('L03-coupled', [p.id], `${where} is a ${p.preset}; only a wheel, section, loop or blowable can be \`coupled\``);
      return;
    }
    const seen = new Set<Id>();
    for (const id of p.coupled) {
      const other = this.part(id, `${where} coupled`, p.id);
      if (other === undefined) continue;
      if (id === p.id) this.error('L03-coupled', [p.id], `${where} is coupled to itself`);
      else if (seen.has(id)) this.error('L03-coupled', [p.id, id], `${where} lists '${id}' twice in \`coupled\``);
      else if (!COUPLED_PRESETS.has(other.def.preset)) this.error('L03-coupled', [p.id, id], `${where} is coupled to '${id}', a ${other.def.preset}; only a wheel, section, loop or blowable can turn with it`);
      else if (info.states !== null && other.states !== null && info.states.length !== other.states.length) {
        this.error('L03-coupled', [p.id, id], `${where} has ${info.states.length} states but '${id}', coupled to it, has ${other.states.length}: a turn must mean the same steps on both`);
      }
      seen.add(id);
    }
  }

  private partReaction(info: PartInfo, r: Reaction, where: string): void {
    const p = info.def;
    this.reactionOn(r.on, where, p.id);
    this.cond(r.when, where, p.id);
    if (p.preset === 'pushable') {
      if (r.to !== 'onPerch') this.error('L07-pushable-reaction', [p.id], `${where} sends pushable '${p.id}' to '${r.to}'; a reaction may only put it back onPerch`);
      return;
    }
    if (!RELATIVE_TO.has(r.to)) this.partState(info, r.to, where, p.id);
  }

  // ——— Perches ———

  private checkPerches(): void {
    const byNode = new Map<Id, Id>();
    for (const perch of this.list(this.def.perches)) {
      const where = `perch '${perch.id}'`;
      if (this.node(perch.node, where, perch.id)) {
        const other = byNode.get(perch.node);
        if (other !== undefined && other !== perch.id) this.error('L01-shared-perch-node', [other, perch.id, perch.node], `perches '${other}' and '${perch.id}' share node '${perch.node}'`);
        else byNode.set(perch.node, perch.id);
      }
      this.node(perch.reachNode, `${where} reachNode`, perch.id);
      this.part(perch.onPart, `${where} onPart`, perch.id);
      if (perch.push !== undefined) this.pushable(perch.push, `${where} push`, perch.id);
      if (perch.set !== undefined) this.partState(this.part(perch.set.part, `${where} set`, perch.id), perch.set.to, `${where} set`, perch.id);
      this.cond(perch.blockedWhen, `${where} blockedWhen`, perch.id);
      const tags = this.list(this.def.nodes).find((n) => n.id === perch.node)?.tags ?? [];
      if ((tags.includes('wet') || tags.includes('steam')) && perch.blockedWhen === undefined) {
        this.warn('L16-always-wet-perch', [perch.id], `${where} is on a ${tags.includes('wet') ? 'wet' : 'steam'} node with no blockedWhen: Mocha refuses it forever (C7)`);
      }
    }
    const start = this.def.mocha?.start;
    if (start != null) this.ref(this.perches, 'perch', start, 'mocha.start', 'mocha');
  }

  // ——— Attractors ———

  private checkAttractors(): void {
    for (const a of this.attractors.values()) {
      const where = `attractor '${a.id}'`;
      this.node(a.node, where, a.id);
      this.cond(a.visibleWhen, `${where} visibleWhen`, a.id);
      this.cond(a.activeWhen, `${where} activeWhen`, a.id);
      this.ref(this.creatures, 'creature', a.heldBy, `${where} heldBy`, a.id);
      if (a.nodeBy !== undefined) {
        const info = this.part(a.nodeBy.part, `${where} nodeBy`, a.id);
        for (const [s, n] of Object.entries(a.nodeBy.map ?? {})) {
          this.partState(info, s, `${where} nodeBy`, a.id);
          this.node(n, `${where} nodeBy`, a.id);
        }
      }
      if (a.followsPushable !== undefined) this.pushable(a.followsPushable, `${where} followsPushable`, a.id);
    }
  }

  // ——— Creatures ———

  private checkCreatures(): void {
    for (const c of this.creatures.values()) {
      const where = `creature '${c.id}'`;
      const positions = c.positions ?? {};
      for (const [name, n] of Object.entries(positions)) if (n !== 'offpage') this.node(n, `${where} position '${name}'`, c.id);
      if (!(c.initial in positions)) {
        this.error('L03-initial-not-in-states', [c.id], `${where} starts at '${c.initial}', which isn't one of its positions`);
      }
      if (c.winged === true && !('sky' in positions) && !('away' in positions)) {
        this.error('L01-winged-no-sky', [c.id], `${where} is winged but has no 'sky' or 'away' position for 飛機！`);
      }
      if (c.fleesFromCat !== undefined) {
        for (const perch of c.fleesFromCat.nearPerches ?? []) this.ref(this.perches, 'perch', perch, `${where} fleesFromCat`, c.id);
        this.position(c, c.fleesFromCat.to, `${where} fleesFromCat`, c.id);
      }
      for (const [i, r] of (c.react ?? []).entries()) {
        const rw = `${where} reaction #${i}`;
        this.reactionOn(r.on, rw, c.id);
        this.cond(r.when, rw, c.id);
        this.position(c, r.to, rw, c.id);
        if (r.drop !== undefined && this.ref(this.attractors, 'attractor', r.drop, `${rw} drop`, c.id)) {
          if (this.attractors.get(r.drop)!.heldBy !== c.id) this.error('L01-wrong-kind', [c.id, r.drop], `${rw} drops '${r.drop}', which ${c.id} doesn't hold (heldBy)`);
        }
      }
    }
  }

  // ——— Page-level fields: rules 1, 10, 11 ———

  private checkPage(): void {
    const def = this.def;
    this.node(def.baby?.start, 'baby.start', 'baby');
    for (const w of def.words ?? []) this.word(w, 'words', this.page);
    if (def.learns !== undefined) {
      if (def.learns.word !== undefined) this.word(def.learns.word, 'learns', this.page);
      const when = def.learns.when;
      if (isObject(when) && 'event' in when) {
        this.eventType(when.event, 'learns', this.page);
        this.anyId(when.id, 'learns', this.page);
      }
      else this.cond(when as Cond, 'learns', this.page);
    }

    // Rule 10: text.
    if (typeof def.title === 'string' && textLength(def.title) > MAX_TITLE_CHARS) {
      this.error('L10-title-too-long', [this.page], `title 「${def.title}」 has ${textLength(def.title)} characters; the limit is ${MAX_TITLE_CHARS}`);
    }
    const mischief = def.mischief;
    if (!isObject(mischief) || typeof mischief.text !== 'string' || mischief.text.trim() === '' || !isObject(mischief.when)) {
      this.error('L11-no-mischief', [this.page], 'the page has no 淘氣 (mischief text and predicate)');
    } else {
      this.predicate(mischief.when, 'mischief', this.page);
      if (textLength(mischief.text) > MAX_LINE_CHARS) {
        this.error('L10-text-too-long', [this.page], `the 淘氣 text 「${mischief.text}」 has ${textLength(mischief.text)} characters; the limit is ${MAX_LINE_CHARS}`);
      }
    }
    const lines: LineKey[] = [...(def.lines?.intro ?? [])];
    for (const l of def.lines?.onEvent ?? []) {
      this.predicate(l.when, `line '${l.line}'`, this.page);
      lines.push(l.line);
    }
    if (this.script !== undefined) {
      for (const key of lines) {
        const entry = this.script[key];
        if (entry === undefined) {
          this.error('L01-unknown-ref', [key], `line key '${key}' isn't in the script`);
          continue;
        }
        const text = typeof entry === 'string' ? entry : entry.text;
        if (textLength(text) > MAX_LINE_CHARS) this.error('L10-text-too-long', [key], `line '${key}' 「${text}」 has ${textLength(text)} characters; the limit is ${MAX_LINE_CHARS}`);
      }
    }

    // Rule 11: goal, 土地公.
    const goals = [...this.attractors.values()].filter((a) => a.goal === true);
    if (goals.length !== 1) {
      this.error('L11-goal-count', goals.length > 0 ? goals.map((g) => g.id) : [this.page], `the page has ${goals.length} goal attractors; it needs exactly one`);
    }
    for (const g of goals) {
      if (g.decoy === true) this.error('L11-bad-goal', [g.id], `goal '${g.id}' is a decoy, so he can never grab it`);
      else if (g.kind !== 'shiny') this.error('L11-bad-goal', [g.id], `goal '${g.id}' is a ${g.kind}; only grabbing a shiny completes a page`);
    }
    const t = def.tudigong;
    if (!isObject(t) || typeof t.x !== 'number' || typeof t.y !== 'number') this.error('L11-no-tudigong', [this.page], 'the page has no 土地公');
    else this.cond(t.visibleWhen, 'tudigong visibleWhen', this.page);

    // Solution steps name real things.
    for (const [i, step] of (def.solution ?? []).entries()) {
      const where = `solution step #${i}`;
      if ('set' in step) this.partState(this.part(step.set, where, this.page), step.to, where, this.page);
      else if ('mocha' in step) this.ref(this.perches, 'perch', step.mocha, where, this.page);
      else if ('tap' in step) this.part(step.tap, where, this.page);
      else if ('say' in step) this.word(step.say, where, this.page);
      else if ('floor' in step) this.node(step.floor, where, this.page);
    }
  }

  // ——— Rule 18: linked mode (一起, #128) ———

  /** Whether 一起 can be said on this page: its words allow it (all words when unlisted), or it learns it. */
  private linkable(): boolean {
    const def = this.def;
    return def.words === undefined || def.words.includes('together') || def.learns?.word === 'together';
  }

  /**
   * Linked mode walks Mocha over every baby edge, whatever Baokaka's growth, and he follows: so on a
   * page where 一起 can be said, no baby edge may touch a perch-height node (link nodes, `graph.ts`,
   * stay where people stand; the other unsafe kinds — a pushable or a carrier — are rules 5 and 6).
   * A `lonely` creature follows the pair, so it may not block, and is pointless without 一起.
   */
  private checkLinked(): void {
    const linkable = this.linkable();
    if (linkable) {
      const heights = new Map(this.list(this.def.nodes).map((n) => [n.id, n.height]));
      for (const [i, e] of this.list(this.def.edges).entries()) {
        if (!BABY_KINDS.has(e.kind)) continue;
        const high = [e.a, e.b].filter((n) => heights.get(n) === 2);
        if (high.length > 0) this.error('L18-linked-edge', [e.a, e.b], `edge #${i} (${e.a}–${e.b}) is a ${e.kind} edge to height-2 '${high[0]}': linked, Mocha would lead Baokaka onto a perch`);
      }
    }
    for (const c of this.list(this.def.creatures)) {
      if (c.lonely !== true) continue;
      if (c.blocks !== false) this.error('L18-lonely-blocks', [c.id], `lonely creature '${c.id}' blocks its node: following the pair it would wall them in (set blocks: false)`);
      if (!linkable) this.warn('L18-lonely-unlinked', [c.id], `lonely creature '${c.id}' is on a page where 一起 can't be said: it never follows anyone`);
    }
  }

  // ——— Rule 8: budget ———

  private checkBudget(): void {
    const parts = [...this.parts.values()];
    const counts: [string, number, number, string][] = [
      ['L08-budget-nodes', this.list(this.def.nodes).length, LINT_BUDGET.nodes, 'nodes'],
      ['L08-budget-parts', this.list(this.def.parts).length, LINT_BUDGET.parts, 'parts'],
      ['L08-budget-interactive', parts.filter((p) => p.interactive).length, LINT_BUDGET.interactive, 'player-interactive parts'],
      ['L08-budget-creatures', this.list(this.def.creatures).length, LINT_BUDGET.creatures, 'creatures'],
    ];
    for (const [code, n, max, what] of counts) {
      if (n > max) this.error(code, [this.page], `the page has ${n} ${what}; the budget is ${max}`);
    }
  }

  // ——— Rule 9: hit areas ———

  private checkHits(): void {
    const interactive = [...this.parts.values()].filter((p) => p.interactive && isObject(p.def.hit));
    for (const { def: p } of interactive) {
      const h = p.hit;
      const small = 'r' in h ? 2 * h.r < MIN_HIT : h.w < MIN_HIT || h.h < MIN_HIT;
      const size = 'r' in h ? `r ${h.r}` : `${h.w}×${h.h}`;
      if (small) this.error('L09-hit-too-small', [p.id], `part '${p.id}' has a ${size} hit area; it needs at least ${MIN_HIT}×${MIN_HIT}`);
    }
    for (let i = 0; i < interactive.length; i++) {
      for (let j = i + 1; j < interactive.length; j++) {
        const a = interactive[i].def;
        const b = interactive[j].def;
        const share = hitOverlap(a.hit, b.hit);
        if (share > MAX_HIT_OVERLAP) {
          this.error('L09-hit-overlap', [a.id, b.id], `the hit areas of '${a.id}' and '${b.id}' overlap by ${Math.round(share * 100)} %; the limit is ${MAX_HIT_OVERLAP * 100} %`);
        }
      }
    }
  }

  // ——— Rule 12: reaction cycles ———

  /**
   * Builds "entering a state of P can make Q react" over the parts: P's `partEnter` (any state) and
   * its `emit` events, reaching Q's reaction by radius from P's hit centre (part origins never move).
   * An edge is *certain* when that reaction is the first of Q's listening to the event, has no
   * `when` and no state filter, steps Q relatively (`next` / `prev` / `toggle`), and Q has two or
   * more states and no `lockedWhen` / `stateWhen`: then every trigger changes Q, which triggers
   * again. A cycle of certain edges always overflows (error); any other cycle may (warning).
   */
  private checkCascade(): void {
    const ids = [...this.parts.keys()];
    const n = ids.length;
    const any = ids.map(() => new Array<boolean>(n).fill(false));
    const certain = ids.map(() => new Array<boolean>(n).fill(false));
    ids.forEach((pid, i) => {
      const p = this.parts.get(pid)!;
      const pStates = p.states;
      if (pStates === null || !isObject(p.def.hit)) return;
      const at = hitCentre(p.def.hit);
      const triggers: { type: EventType; state?: string; within?: number }[] = [{ type: 'partEnter' }];
      for (const e of p.def.emit ?? []) triggers.push({ type: e.event, state: e.onEnter, within: EVENT_RADIUS[e.event] });
      ids.forEach((qid, j) => {
        const q = this.parts.get(qid)!;
        if (q.states === null || !isObject(q.def.hit)) return;
        const qAt = hitCentre(q.def.hit);
        const reactions = q.def.react ?? [];
        for (const t of triggers) {
          const ev = { type: t.type, id: pid, at, within: t.within };
          const listening = reactions.filter((r) => onType(r.on) === t.type && (onId(r.on) === undefined || onId(r.on) === pid));
          for (const [k, r] of listening.entries()) {
            const state = onState(r.on);
            if (state !== undefined && t.type === 'partEnter' && !pStates.includes(state)) continue;
            if (!inReach(ev, qAt, onWithin(r.on) ?? t.within)) continue;
            any[i][j] = true;
            const sure =
              k === 0 &&
              t.state === undefined &&
              state === undefined &&
              r.when === undefined &&
              RELATIVE_TO.has(r.to) &&
              q.states.length >= 2 &&
              q.def.preset !== 'pushable' &&
              q.def.lockedWhen === undefined &&
              q.def.stateWhen === undefined;
            if (sure) certain[i][j] = true;
          }
        }
      });
    });
    // Coupling (#127): a part a reaction turns also turns its `coupled` parts (one hop: a coupled
    // turn drives no further coupling), so "P can make Q change" also holds through P → X by a
    // reaction, then X → Q by X's coupling. Certain when the reaction is, and Q always follows.
    const index = new Map(ids.map((id, i) => [id, i] as const));
    const coupledTo = ids.map((xid) => {
      const x = this.parts.get(xid)!;
      const list = Array.isArray(x.def.coupled) && COUPLED_PRESETS.has(x.def.preset) ? x.def.coupled : [];
      return list.flatMap((qid) => {
        const j = index.get(qid);
        const q = j === undefined ? undefined : this.parts.get(qid)!;
        if (q === undefined || q.states === null || qid === xid) return [];
        const sure = q.def.lockedWhen === undefined && q.def.stateWhen === undefined && q.def.lockedByCat !== true && q.states.length >= 2;
        return [{ j: j!, sure }];
      });
    });
    const anyR = any.map((row) => [...row]);
    const certainR = certain.map((row) => [...row]);
    for (let i = 0; i < n; i++) {
      for (let x = 0; x < n; x++) {
        if (!anyR[i][x]) continue;
        for (const { j, sure } of coupledTo[x]) {
          any[i][j] = true;
          if (certainR[i][x] && sure) certain[i][j] = true;
        }
      }
    }
    const sureLoops = this.cycles(ids, certain);
    for (const group of sureLoops) {
      this.error('L12-cascade-loop', group, `parts ${group.map((id) => `'${id}'`).join(', ')} re-trigger each other unconditionally: every cascade through them exceeds 32 events`);
    }
    const inSure = new Set(sureLoops.flat());
    for (const group of this.cycles(ids, any)) {
      if (group.some((id) => inSure.has(id))) continue;
      this.warn('L12-cascade-cycle', group, `parts ${group.map((id) => `'${id}'`).join(', ')} can trigger each other in a cycle; the solver must show the cascade stays under 32`);
    }
  }

  /** The strongly connected groups of `adj` that contain a cycle, each in data order. */
  private cycles(ids: readonly Id[], adj: readonly (readonly boolean[])[]): Id[][] {
    const n = ids.length;
    const reach = adj.map((row) => [...row]);
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (reach[i][k]) for (let j = 0; j < n; j++) if (reach[k][j]) reach[i][j] = true;
    const done = new Set<number>();
    const out: Id[][] = [];
    for (let i = 0; i < n; i++) {
      if (done.has(i) || !reach[i][i]) continue;
      const group: Id[] = [];
      for (let j = 0; j < n; j++) {
        if (reach[i][j] && reach[j][i]) {
          group.push(ids[j]);
          done.add(j);
        }
      }
      out.push(group);
    }
    return out;
  }

  // ——— Warning 15: locks read mid-event ———

  private checkLockOrder(): void {
    const order = [...this.parts.keys()];
    const listensTo = (p: PartDef) => new Set((p.react ?? []).map((r) => onType(r.on)));
    for (const [ai, aid] of order.entries()) {
      const a = this.parts.get(aid)!.def;
      const conds = [a.lockedWhen, ...Object.values(a.stateWhen ?? {})].filter((c): c is Cond => c !== undefined);
      if (conds.length === 0) continue;
      const read = new Set<Id>();
      conds.forEach((c) => condParts(c, read));
      const aTypes = listensTo(a);
      for (const bid of order.slice(0, ai)) {
        if (!read.has(bid)) continue;
        const shared = [...listensTo(this.parts.get(bid)!.def)].filter((t) => aTypes.has(t)).sort();
        if (shared.length === 0) continue;
        this.warn(
          'L15-lock-order',
          [aid, bid],
          `part '${aid}' reacts to ${shared.join(', ')} like '${bid}' before it, and its lockedWhen/stateWhen reads '${bid}' as already changed by that event (reaction \`when\`s read the state before it)`,
        );
      }
    }
  }

  // ——— Rule 13: custom reaction functions ———

  private checkCustom(): void {
    const seen = new Set<unknown>();
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'function') {
        this.warn('L13-custom-reaction', [path], `${path} is a function: a custom reaction (the escape hatch, GDD § 3.1); keep it to one, small`);
        return;
      }
      if (!isObject(v) || seen.has(v)) return;
      seen.add(v);
      for (const [k, x] of Object.entries(v)) walk(x, Array.isArray(v) ? `${path}[${k}]` : path === '' ? k : `${path}.${k}`);
    };
    walk(this.def, '');
  }

  // ——— Warning 14: visible ties (GDD § 6 risk 4) ———

  private checkTie(): void {
    if (this.broken || this.errors.some((e) => e.code.startsWith('L01-'))) return;
    let ranked;
    try {
      ranked = rankCandidates(this.def, initialState(this.def), { growth: this.def.baby.growth ?? 0 });
      /* v8 ignore next 3 -- a defensive net: data that breaks the initial state is an error above */
    } catch {
      return;
    }
    const tie = visibleTie(ranked);
    if (tie !== null) {
      const [first, second] = tie;
      const how = first.approach === null ? 'both unreachable' : `both ${first.steps} edges away`;
      this.warn(
        'L14-visible-tie',
        [first.id, second.id],
        `at the start Baokaka's target '${first.id}' ties with '${second.id}' (priority ${first.priority}, ${how}): only distance or id decides, which players can't read`,
      );
    }
  }
}

/** The part ids a condition reads, into `out`. */
function condParts(cond: Cond, out: Set<Id>): void {
  if (!isObject(cond)) return;
  if ('part' in cond) out.add(cond.part);
  else if ('landed' in cond) out.add(cond.landed);
  else if ('all' in cond) cond.all.forEach((c) => condParts(c, out));
  else if ('any' in cond) cond.any.forEach((c) => condParts(c, out));
  else if ('not' in cond) condParts(cond.not, out);
}
