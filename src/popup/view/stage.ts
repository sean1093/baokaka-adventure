import type { Cond, EdgeDef, EdgeKind, Id, NodeDef, PageDef, PerchDef } from '../core/types';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, type Pt } from './geometry';

/** The foreground card stands just behind the floor page's front edge. */
const FLOOR_BOTTOM_FOR_CARD = FLOOR_BOTTOM - 6;

/**
 * The page's walkable scenery, derived from its walk graph (GDD § 2.1): where the placeholder
 * stage draws ledges, ramps, the rails that block a conditional crossing, perch furniture and the
 * track pit under a carriage. Pages have no ledge art of their own until chapter art lands (#96
 * bakes it into the backdrop), so the renderer reads the graph: every surface Baokaka can crawl on
 * is drawn as paper, and nothing else is. Pure data; `art/placeholders.ts` draws it.
 */

/** The baby's edge kinds: surfaces he moves on. Cat edges (jump, squeeze) draw nothing. */
const BABY_KINDS: ReadonlySet<EdgeKind> = new Set<EdgeKind>(['crawl', 'climb', 'cruise', 'walk']);
/** Nodes this close in y share one ledge. */
const SAME_LEVEL = 4;
/** A ledge reaches this far past its outermost nodes. */
export const LEDGE_PAD = 24;
/** A ledge whose end comes this close to the page side runs on to the edge (proof A's platforms). */
const EDGE_SNAP = 70;
/** A crossing's rail stands this far past the node it guards (clear of his head). */
export const RAIL_OFFSET = 50;
/** How far a carriage card reaches past its outermost riding nodes. */
export const CARRIAGE_REACH = 26;
/** How thick a ledge's front face is, in page units. */
export const LEDGE_DEPTH = 52;

/** A level run of nodes Baokaka can crawl along: one paper ledge. */
export interface LedgeRun {
  readonly nodes: readonly Id[];
  readonly x0: number;
  readonly x1: number;
  /** The top surface (the nodes' feet line) */
  readonly y: number;
  /** One node on its own: drawn as a cushion or a crate, not a long ledge */
  readonly single: boolean;
  /** Runs off the page's left / right side */
  readonly toLeft: boolean;
  readonly toRight: boolean;
}

/** An always-open crossing between two levels: a ramp. */
export interface Slope {
  readonly a: Id;
  readonly b: Id;
  readonly from: Pt;
  readonly to: Pt;
}

/**
 * A crossing between static nodes that opens only when its condition holds (a crib rail, a gate):
 * a rail stands at the end of `a`'s ledge while closed and folds flat when open; a ramp to `b`
 * appears when open if the levels differ.
 */
export interface Crossing {
  readonly a: Id;
  readonly b: Id;
  readonly from: Pt;
  readonly to: Pt;
  readonly when: Cond;
  /** Where the rail stands: the end of `a`'s ledge facing `b` */
  readonly rail: Pt;
  /** The part whose state opens it, when the condition names exactly one (its linked brad) */
  readonly part?: Id;
}

/**
 * Perch furniture (bible § 4 perches): a pillar for a high perch, a bench for a seat; indoors (the
 * prologue, page E) a perch up on the standing page is a wall shelf instead of a pillar or a bench,
 * and a box perch (C9, `hidesMocha`) is a laundry basket whose rim is the perch node (#106: Mocha's
 * in-box frame is his head and paws, cut flat at the rim). A perch on a node a moving part carries
 * (1-5's car panel, 1-6's cart awning; #107) gets no furniture: the part's art holds it.
 */
export interface PerchPost {
  readonly perch: Id;
  readonly kind: 'pillar' | 'bench' | 'shelf' | 'basket';
  readonly x: number;
  /** The perch node's y (where Mocha sits) */
  readonly top: number;
  /** Where it stands: the ledge below, else the floor near the gutter */
  readonly foot: number;
}

/** A carriage: the card a part moves that nodes ride on (the train), and the pit it runs in. */
export interface Carriage {
  readonly part: Id;
  readonly nodes: readonly Id[];
  /** Travel extent of its riding nodes over every state, and the level it runs at */
  readonly x0: number;
  readonly x1: number;
  readonly y: number;
  /** The stretch of its travel no ledge covers (the gap it bridges), where its pit shows; null if none */
  readonly gap: readonly [number, number] | null;
}

/** The longest piece of [a, b] that no interval in `cover` overlaps, or null. */
export function uncovered(a: number, b: number, cover: readonly (readonly [number, number])[]): [number, number] | null {
  let pieces: [number, number][] = [[a, b]];
  for (const [c0, c1] of cover) {
    pieces = pieces.flatMap(([p0, p1]): [number, number][] => {
      if (c1 <= p0 || c0 >= p1) return [[p0, p1]];
      return [[p0, Math.min(p1, c0)], [Math.max(p0, c1), p1]].filter(([q0, q1]) => q1 - q0 > 0.5) as [number, number][];
    });
  }
  pieces.sort((p, q) => q[1] - q[0] - (p[1] - p[0]));
  return pieces[0] ?? null;
}

export interface Stage {
  readonly runs: readonly LedgeRun[];
  readonly slopes: readonly Slope[];
  readonly crossings: readonly Crossing[];
  readonly posts: readonly PerchPost[];
  readonly carriages: readonly Carriage[];
}

const isBabyEdge = (e: EdgeDef) => BABY_KINDS.has(e.kind);

/** The single part a condition depends on, if it is a plain `{ part, in }`. */
function condPart(cond: Cond): Id | undefined {
  return 'part' in cond ? cond.part : undefined;
}

const cache = new WeakMap<PageDef, Stage>();

/** The stage for a page (memoised per page object). */
export function stageOf(def: PageDef): Stage {
  const hit = cache.get(def);
  if (hit) return hit;
  const stage = buildStage(def);
  cache.set(def, stage);
  return stage;
}

function buildStage(def: PageDef): Stage {
  const byId = new Map<Id, NodeDef>(def.nodes.map((n) => [n.id, n]));
  const perchNodes = new Set(def.perches.map((p) => p.node));
  // A node attached to a gate is a doorway: it never moves (lint L04), so it is floor like any other
  const gates = new Set(def.parts.filter((p) => p.preset === 'gate').map((p) => p.id));
  const isStatic = (id: Id) => {
    const n = byId.get(id);
    return n !== undefined && (n.attach === undefined || gates.has(n.attach.part)) && n.height < 2 && !perchNodes.has(id);
  };
  const pos = (id: Id): Pt => {
    const n = byId.get(id)!;
    // A doorway's one position (the same in every state of its gate)
    const at = n.attach === undefined ? undefined : Object.values(n.attach.pos)[0];
    return at ?? [n.x, n.y];
  };

  // Union-find over level, unconditional, static baby edges
  const parent = new Map<Id, Id>();
  const find = (id: Id): Id => {
    let r = id;
    while (parent.get(r) !== r) r = parent.get(r)!;
    parent.set(id, r);
    return r;
  };
  const slopes: Slope[] = [];
  const conditional: EdgeDef[] = [];
  for (const e of def.edges) {
    if (!isBabyEdge(e) || !isStatic(e.a) || !isStatic(e.b)) continue;
    for (const id of [e.a, e.b]) if (!parent.has(id)) parent.set(id, id);
    if (e.when !== undefined) conditional.push(e);
    else if (Math.abs(pos(e.a)[1] - pos(e.b)[1]) <= SAME_LEVEL) parent.set(find(e.a), find(e.b));
    else slopes.push({ a: e.a, b: e.b, from: pos(e.a), to: pos(e.b) });
  }
  // Static nodes on a baby edge to a moving node (a platform the train docks at) are ledges too
  for (const e of def.edges) {
    if (!isBabyEdge(e)) continue;
    for (const id of [e.a, e.b]) if (isStatic(id) && !parent.has(id)) parent.set(id, id);
  }

  // A ledge with a conditional crossing at its end runs on to the rail, which stands clear of
  // Baokaka's head when he waits at the edge (he crawls head first, ~45 units ahead of his node)
  const reach = new Map<Id, number>();
  for (const e of conditional) {
    const dir = pos(e.b)[0] >= pos(e.a)[0] ? 1 : -1;
    reach.set(e.a, pos(e.a)[0] + dir * (RAIL_OFFSET + 6));
  }

  const groups = new Map<Id, Id[]>();
  for (const n of def.nodes) {
    if (!parent.has(n.id)) continue;
    const root = find(n.id);
    groups.set(root, [...(groups.get(root) ?? []), n.id]);
  }
  const runs: LedgeRun[] = [...groups.values()]
    .map((ids) => {
      const xs = ids.map((id) => pos(id)[0]);
      const y = Math.max(...ids.map((id) => pos(id)[1]));
      const ends = ids.map((id) => reach.get(id)).filter((x): x is number => x !== undefined);
      let x0 = Math.min(...xs, ...ends.map((x) => x + LEDGE_PAD)) - LEDGE_PAD;
      let x1 = Math.max(...xs, ...ends.map((x) => x - LEDGE_PAD)) + LEDGE_PAD;
      const single = ids.length === 1;
      const toLeft = !single && x0 < EDGE_SNAP;
      const toRight = !single && x1 > PAGE_W - EDGE_SNAP;
      if (toLeft) x0 = -12;
      if (toRight) x1 = PAGE_W + 12;
      return { nodes: ids, x0, x1, y, single, toLeft, toRight };
    })
    // Back to front: farther ledges (smaller y) first
    .sort((a, b) => a.y - b.y || a.x0 - b.x0);

  const crossings: Crossing[] = conditional.map((e) => {
    const from = pos(e.a);
    const to = pos(e.b);
    const railX = from[0] + (to[0] >= from[0] ? RAIL_OFFSET : -RAIL_OFFSET);
    return { a: e.a, b: e.b, from, to, when: e.when!, rail: [railX, from[1]] as Pt, part: condPart(e.when!) };
  });

  const indoors = def.chapter === 0 || def.chapter === 11;
  const posts: PerchPost[] = def.perches
    .map((p: PerchDef) => {
      const n = byId.get(p.node);
      // A perch riding a moving part (1-5's car panel, 1-6's cart awning, #107) is carried by the part's own art
      if (n === undefined || (n.attach !== undefined && !gates.has(n.attach.part))) return null;
      const below = runs.filter((r) => r.y > n.y && n.x >= r.x0 && n.x <= r.x1).sort((a, b) => a.y - b.y)[0];
      const foot = below ? below.y - 6 : Math.max(n.y + 30, GUTTER_Y + 40);
      const kind: PerchPost['kind'] = p.hidesMocha ? 'basket' : indoors && n.y < GUTTER_Y ? 'shelf' : n.height >= 2 ? 'pillar' : 'bench';
      return { perch: p.id, kind, x: n.x, top: n.y, foot } as PerchPost;
    })
    .filter((p): p is PerchPost => p !== null);

  const carriages: Carriage[] = [];
  for (const part of def.parts) {
    // Mocha's perches riding it (a cart's awning) are not what the card carries Baokaka on
    const riders = def.nodes.filter((n) => n.attach?.part === part.id && !perchNodes.has(n.id));
    if (riders.length === 0 || part.preset === 'lift' || part.preset === 'carrier' || part.preset === 'gate') continue;
    const all = riders.flatMap((n) => Object.values(n.attach!.pos));
    const ys = new Set(all.map(([, y]) => y));
    if (ys.size !== 1) continue; // only level carriages (trains, carts) for now
    const xs = all.map(([x]) => x);
    const y = [...ys][0];
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const level = runs.filter((r) => Math.abs(r.y - y) <= SAME_LEVEL).map((r) => [r.x0, r.x1] as const);
    carriages.push({ part: part.id, nodes: riders.map((n) => n.id), x0, x1, y, gap: uncovered(x0 - CARRIAGE_REACH, x1 + CARRIAGE_REACH, level) });
  }

  return { runs, slopes, crossings, posts, carriages };
}

/** A box in page units. */
export interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The foreground card's footprint (the potted plant) with its foot at (x, foot). */
export const FOREGROUND_SIZE = { w: 70, h: 104 } as const;
export const foregroundBox = (x: number, foot: number): Box => ({ x0: x - FOREGROUND_SIZE.w / 2, y0: foot - FOREGROUND_SIZE.h, x1: x + FOREGROUND_SIZE.w / 2, y1: foot });

/**
 * What the foreground card must never cover (bible § 2.2): every part's hit area, the sweep of a
 * tab or slider card along its track, and every node with room for a standee on it (the walk
 * graph, Mocha's perches, creatures), all with a margin.
 */
export function keepClear(def: PageDef, margin = 10): Box[] {
  const boxes: Box[] = [];
  for (const p of def.parts) {
    const h = p.hit;
    boxes.push('r' in h ? { x0: h.cx - h.r, y0: h.cy - h.r, x1: h.cx + h.r, y1: h.cy + h.r } : { x0: h.x, y0: h.y, x1: h.x + h.w, y1: h.y + h.h });
    if (p.track) {
      const xs = [p.track.from[0], p.track.to[0]];
      const ys = [p.track.from[1], p.track.to[1]];
      boxes.push({ x0: Math.min(...xs) - 62, y0: Math.min(...ys) - 62, x1: Math.max(...xs) + 62, y1: Math.max(...ys) + 62 });
    }
  }
  for (const n of def.nodes) {
    const spots: Pt[] = n.attach ? Object.values(n.attach.pos) : [[n.x, n.y]];
    for (const [x, y] of spots) boxes.push({ x0: x - 40, y0: y - 80, x1: x + 40, y1: y + LEDGE_DEPTH });
  }
  return boxes.map((b) => ({ x0: b.x0 - margin, y0: b.y0 - margin, x1: b.x1 + margin, y1: b.y1 + margin }));
}

/**
 * The foreground card's slot (bible § 2.2: one card in a near corner to frame the stage): the first
 * of the bottom-right and bottom-left corners whose footprint stays clear of `keepClear`, or null
 * when neither does (then the page has none).
 */
export function foregroundSlot(def: PageDef): { x: number; foot: number } | null {
  const clear = keepClear(def);
  const foot = FLOOR_BOTTOM_FOR_CARD;
  for (const x of [PAGE_W - 16, 16]) {
    const box = foregroundBox(x, foot);
    if (!clear.some((b) => overlaps(b, box))) return { x, foot };
  }
  return null;
}
