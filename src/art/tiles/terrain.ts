import { TILE_H, TILE_W } from '../../quest/engine/iso';
import type { Material } from '../../quest/engine/types';
import type { TileName, TileRamp } from '../palette';

/**
 * The tile material table (art direction § 4.4 *Tile material list* and *Tile rules*): how each
 * ground material is painted. Colours come from `TILES` in palette.ts, graded per map clock by
 * `gradeTiles(time)`; this file only says which pattern of marks a material carries.
 *
 * Every tile is one of `VARIANTS` symbols per material: the fill (base or alt) and a seeded layout
 * of 2–6 marks. `tileVariant(c, r, salt)` picks one per tile with a hash, so a floor never reads as
 * a checkerboard (except the station's marble, which *is* one) and never visibly repeats.
 *
 * Pure: no React, no randomness beyond the seeded hash, so tests can pin it down.
 */

const HW = TILE_W / 2;
const HH = TILE_H / 2;

/** The marks a material carries; each kind is one generator below. */
export type Pattern =
  | 'blades'
  | 'pebbles'
  | 'bond'
  | 'boards'
  | 'grid'
  | 'slots'
  | 'sheen'
  | 'zebra'
  | 'ripples'
  | 'slab'
  | 'checker'
  | 'motif'
  | 'mat'
  | 'lattice'
  | 'bushes'
  | 'dots'
  | 'threshold';

export type TileMaterial = {
  /** The `TILES` ramp it is painted with */
  ramp: TileName;
  pattern: Pattern;
  /** Wet or glossy: light sources draw a reflection streak on it (§ 2.7 *Ground*) */
  wet?: boolean;
  /** Water: banks get a shadow band, and `ripples` ambient FX may play on it */
  liquid?: boolean;
  /** One continuous surface (a rug, a carpet): no per-tile lit edge, so it doesn't read as a grid */
  seamless?: boolean;
};

/** Every engine `Material` (plus the door threshold), by name. */
export const TILE_MATERIALS: Readonly<Record<Material | 'door', TileMaterial>> = {
  grass: { ramp: 'grass', pattern: 'blades' },
  gravel: { ramp: 'gravel', pattern: 'pebbles' },
  brickWalk: { ramp: 'brickWalk', pattern: 'bond' },
  asphalt: { ramp: 'asphalt', pattern: 'sheen', wet: true },
  zebra: { ramp: 'zebra', pattern: 'zebra', wet: true },
  water: { ramp: 'water', pattern: 'ripples', wet: true, liquid: true },
  marble: { ramp: 'marble', pattern: 'checker', wet: true },
  undergroundTile: { ramp: 'undergroundTile', pattern: 'grid', wet: true },
  wood: { ramp: 'wood', pattern: 'boards' },
  rug: { ramp: 'rug', pattern: 'motif', seamless: true },
  playMat: { ramp: 'playMat', pattern: 'mat' },
  oldBrick: { ramp: 'oldBrick', pattern: 'bond' },
  stoneSlab: { ramp: 'stoneSlab', pattern: 'slab' },
  planks: { ramp: 'planks', pattern: 'boards' },
  stallTile: { ramp: 'stallTile', pattern: 'grid', wet: true },
  grate: { ramp: 'grate', pattern: 'slots' },
  apron: { ramp: 'apron', pattern: 'slab' },
  runway: { ramp: 'runway', pattern: 'sheen', wet: true },
  teaSoil: { ramp: 'teaSoil', pattern: 'bushes' },
  wetStone: { ramp: 'wetStone', pattern: 'slab', wet: true },
  deck: { ramp: 'deck', pattern: 'boards', wet: true },
  jadeWater: { ramp: 'jadeWater', pattern: 'ripples', wet: true, liquid: true },
  seawall: { ramp: 'seawall', pattern: 'slab' },
  polished: { ramp: 'polished', pattern: 'checker', wet: true },
  carpet: { ramp: 'carpet', pattern: 'lattice', seamless: true },
  deckGrate: { ramp: 'deckGrate', pattern: 'slots' },
  granite: { ramp: 'granite', pattern: 'pebbles' },
  carFloor: { ramp: 'carFloor', pattern: 'dots' },
  door: { ramp: 'door', pattern: 'threshold' },
};

/** Symbols per material: two fills × three mark layouts. */
export const VARIANTS = 6;

/** A 32-bit integer hash of a tile and a salt (the map's id), well mixed (xorshift-multiply). */
export function tileHash(c: number, r: number, salt = 0): number {
  let h = Math.imul(c | 0, 0x27d4eb2d) ^ Math.imul(r | 0, 0x165667b1) ^ Math.imul(salt | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A string's salt for `tileHash` (FNV-1a), so each map gets its own scatter. */
export function saltOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * Which of the `VARIANTS` symbols tile (c, r) uses. Deterministic. Checkerboard patterns take the
 * fill from the tile's parity (the station floor *is* a checkerboard) and only the marks at random.
 */
export function tileVariant(material: TileMaterial, c: number, r: number, salt = 0): number {
  const h = tileHash(c, r, salt);
  const layout = h % 3;
  const alt = material.pattern === 'checker' ? (c + r) % 2 === 1 : ((h >>> 8) & 3) === 0;
  return (alt ? 3 : 0) + layout;
}

/** A tile-local point: u runs along +c (down-right on screen), v along +r (down-left), both in [-0.5, 0.5]. */
export const q = (u: number, v: number): [number, number] => [(u - v) * HW, (u + v) * HH];

const n = (value: number) => Math.round(value * 10) / 10;
const pt = ([x, y]: [number, number]) => `${n(x)},${n(y)}`;
const line = (a: [number, number], b: [number, number]) => `M${pt(a)}L${pt(b)}`;
const quad = (points: [number, number][]) => `M${points.map(pt).join('L')}Z`;

/** The tile's diamond, centred on (0, 0). */
export const DIAMOND = quad([
  [0, -HH],
  [HW, 0],
  [0, HH],
  [-HW, 0],
]);

/** The two upper edges, inset a hair: the 1px lit top-left edge every tile catches. */
export const LIT_EDGE = `M${n(-HW + 2)},0L0,${n(-HH + 1)}L${n(HW - 2)},0`;

/** A small seeded generator for one symbol's marks (mulberry32). */
function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One painted layer of a symbol: path data in a ramp colour, filled or stroked. */
export type Mark = { d: string; tone: keyof TileRamp; stroke?: number; opacity?: number };

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)},${n(cy)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0Z`;

/** A point inside the diamond, kept off the edges. */
const inside = (rand: () => number, margin = 0.14): [number, number] => q(-0.5 + margin + rand() * (1 - margin * 2), -0.5 + margin + rand() * (1 - margin * 2));

/** A grass tuft: two tapered blades as one closed path. */
function tuft(x: number, y: number, s: number): string {
  return (
    `M${n(x - 2.4 * s)},${n(y)}Q${n(x - 1 * s)},${n(y - 5 * s)} ${n(x - 0.4 * s)},${n(y - 6 * s)}Q${n(x)},${n(y - 3 * s)} ${n(x + 0.4 * s)},${n(y)}Z` +
    `M${n(x + 0.6 * s)},${n(y)}Q${n(x + 2 * s)},${n(y - 4 * s)} ${n(x + 3.4 * s)},${n(y - 4.6 * s)}Q${n(x + 2.4 * s)},${n(y - 2 * s)} ${n(x + 2.2 * s)},${n(y)}Z`
  );
}

/**
 * The marks of one symbol: layout `layout` (0–2) of a pattern, seeded so each layout differs.
 * Each returned `Mark` is one SVG element, so a symbol stays within a handful (§ 8.2: tile ≤ 12).
 */
export function tileMarks(pattern: Pattern, layout: number, seed = 0): Mark[] {
  const rand = rng(seed * 31 + layout * 977 + pattern.length * 13 + 7);
  const count = 2 + Math.floor(rand() * 5); // 2–6
  switch (pattern) {
    case 'blades': {
      let dark = '';
      let light = '';
      for (let i = 0; i < Math.max(3, count); i += 1) {
        const [x, y] = inside(rand);
        const s = 0.8 + rand() * 0.45;
        if (i % 2 === 0) dark += tuft(x, y, s);
        else light += tuft(x, y, s * 0.85);
      }
      return [
        { d: dark, tone: 'mark' },
        { d: light, tone: 'accent' },
      ];
    }
    case 'pebbles': {
      let a = '';
      let b = '';
      let c = '';
      for (let i = 0; i < count + 1; i += 1) {
        const [x, y] = inside(rand, 0.1);
        const r = 0.9 + rand() * 1.5;
        const d = ellipse(x, y, r, r * 0.6);
        if (i % 3 === 0) a += d;
        else if (i % 3 === 1) b += d;
        else c += d;
      }
      return [
        { d: a, tone: 'mark' },
        { d: b, tone: 'line', opacity: 0.8 },
        { d: c, tone: 'accent' },
      ];
    }
    case 'bond': {
      // Running bond: three courses along u, head joints staggered half a brick per course
      const courses = [-0.25, 0, 0.25];
      let joints = courses.map((v) => line(q(-0.5, v), q(0.5, v))).join('');
      const shift = layout * 0.125;
      for (let k = 0; k < 4; k += 1) {
        const v0 = -0.5 + k * 0.25;
        for (const base of k % 2 === 0 ? [-0.25, 0.25] : [0]) {
          const u = ((base + shift + 1.5) % 1) - 0.5;
          if (Math.abs(u) < 0.47) joints += line(q(u, v0), q(u, v0 + 0.25));
        }
      }
      const marks: Mark[] = [{ d: joints, tone: 'line', stroke: 0.8, opacity: 0.75 }];
      // The grey accent paver (§ 4.4), on one layout in three
      if (layout === 1) {
        const v = -0.25 + Math.floor(rand() * 2) * 0.25;
        const u = -0.25 + rand() * 0.25;
        marks.push({ d: quad([q(u, v), q(u + 0.25, v), q(u + 0.25, v + 0.25), q(u, v + 0.25)]), tone: 'accent', opacity: 0.9 });
      }
      marks.push({ d: line(q(-0.45, -0.37), q(0.1 + rand() * 0.3, -0.37)), tone: 'mark', stroke: 0.9, opacity: 0.6 });
      return marks;
    }
    case 'boards': {
      // Boards along u: four seams, a butt joint or two, a knot
      const seams = [-0.3, -0.1, 0.1, 0.3].map((v) => line(q(-0.5, v), q(0.5, v))).join('');
      let butts = '';
      for (let k = 0; k < 1 + (layout % 2); k += 1) {
        const lane = Math.floor(rand() * 5);
        const v0 = -0.5 + lane * 0.2;
        const u = -0.35 + rand() * 0.7;
        butts += line(q(u, Math.max(-0.5, v0)), q(u, Math.min(0.5, v0 + 0.2)));
      }
      const [kx, ky] = inside(rand, 0.2);
      return [
        { d: seams + butts, tone: 'line', stroke: 0.8, opacity: 0.85 },
        { d: line(q(-0.42, -0.2 + layout * 0.2), q(0.1, -0.2 + layout * 0.2)), tone: 'mark', stroke: 1, opacity: 0.6 },
        { d: ellipse(kx, ky, 1.6, 0.8), tone: 'line', opacity: 0.7 },
      ];
    }
    case 'grid': {
      const cells = layout === 2 ? 3 : 2;
      let d = '';
      for (let k = 1; k < cells; k += 1) {
        const t = -0.5 + k / cells;
        d += line(q(t, -0.5), q(t, 0.5)) + line(q(-0.5, t), q(0.5, t));
      }
      const [x, y] = inside(rand, 0.2);
      return [
        { d, tone: 'line', stroke: 0.9, opacity: 0.8 },
        { d: ellipse(x, y, 5 + rand() * 3, 1.6), tone: 'mark', opacity: 0.45 },
      ];
    }
    case 'slots': {
      let d = '';
      const lanes = 6;
      for (let k = 1; k < lanes; k += 1) {
        const v = -0.5 + k / lanes;
        d += line(q(-0.42, v), q(0.42, v));
      }
      const cross = layout === 0 ? line(q(0, -0.5), q(0, 0.5)) : '';
      return [
        { d: d + cross, tone: 'line', stroke: 1.2, opacity: 0.9 },
        { d: line(q(-0.4, -0.5 + 1 / lanes - 0.03), q(0.4, -0.5 + 1 / lanes - 0.03)), tone: 'mark', stroke: 0.8, opacity: 0.7 },
      ];
    }
    case 'sheen': {
      // Wet asphalt: a soft puddle sheen and aggregate flecks
      const [x, y] = inside(rand, 0.22);
      let flecks = '';
      for (let i = 0; i < count; i += 1) {
        const [fx, fy] = inside(rand, 0.08);
        flecks += ellipse(fx, fy, 0.7, 0.5);
      }
      return [
        { d: ellipse(x, y, 9 + rand() * 6, 3 + rand() * 1.5), tone: 'accent', opacity: 0.55 },
        { d: flecks, tone: 'lit', opacity: 0.35 },
      ];
    }
    case 'zebra': {
      let d = '';
      for (const v of [-0.36, -0.12, 0.12, 0.36]) d += quad([q(-0.32, v - 0.065), q(0.32, v - 0.065), q(0.32, v + 0.065), q(-0.32, v + 0.065)]);
      return [
        { d, tone: 'mark', opacity: 0.85 },
        { d: line(q(-0.3 + rand() * 0.2, -0.36), q(0.1, -0.36)), tone: 'line', stroke: 1, opacity: 0.5 },
      ];
    }
    case 'ripples': {
      const [x, y] = inside(rand, 0.2);
      const [x2, y2] = inside(rand, 0.2);
      return [
        { d: `M${n(x - 7)},${n(y)}q6,-3 12,0M${n(x2 - 4)},${n(y2)}q4,-2.2 8,0`, tone: 'mark', stroke: 1, opacity: 0.7 },
        { d: ellipse(x + 4, y + 5, 3 + layout, 1), tone: 'accent', opacity: 0.6 },
      ];
    }
    case 'slab': {
      const u = -0.2 + rand() * 0.4;
      const v = -0.2 + rand() * 0.4;
      const joints = layout === 0 ? line(q(u, -0.5), q(u, 0.5)) : layout === 1 ? line(q(-0.5, v), q(0.5, v)) : line(q(u, -0.5), q(u, v)) + line(q(-0.5, v), q(0.5, v));
      const [cx, cy] = inside(rand, 0.2);
      let specks = '';
      for (let i = 0; i < count; i += 1) {
        const [sx, sy] = inside(rand, 0.1);
        specks += ellipse(sx, sy, 0.8, 0.5);
      }
      return [
        { d: joints, tone: 'line', stroke: 0.9, opacity: 0.8 },
        { d: `M${n(cx)},${n(cy)}l${n(3 + rand() * 3)},${n(1 + rand() * 2)}l${n(2 + rand() * 2)},${n(-1)}`, tone: 'line', stroke: 0.7, opacity: 0.6 },
        { d: specks, tone: 'mark', opacity: 0.8 },
      ];
    }
    case 'checker': {
      const [x, y] = inside(rand, 0.25);
      return [
        { d: `M${n(x - 8)},${n(y + 2)}q5,-4 9,-2t8,-3`, tone: 'accent', stroke: 0.7, opacity: 0.55 },
        { d: ellipse(-HW * 0.3, -HH * 0.25, 6, 1.4), tone: 'lit', opacity: 0.18 },
      ];
    }
    case 'motif': {
      // A woven rug: a faint field pattern of small diamonds, one per tile, and a few flecks
      const s = 0.07 + layout * 0.015;
      const dots = [q(-0.25, -0.25), q(0.25, 0.25)].map(([x, y]) => ellipse(x, y, 0.9, 0.5)).join('');
      return [
        { d: quad([q(0, -s), q(s, 0), q(0, s), q(-s, 0)]), tone: 'mark', opacity: 0.45 },
        { d: dots, tone: 'accent', opacity: 0.8 },
      ];
    }
    case 'mat': {
      // Interlocking foam squares: a seam with puzzle teeth along one edge, a little star
      const [sx, sy] = inside(rand, 0.25);
      return [
        { d: line(q(-0.5, 0), q(-0.12, 0)) + `M${pt(q(-0.12, 0))}l2,2l3,0l2,-2` + line(q(0.08, 0), q(0.5, 0)), tone: 'line', stroke: 0.9, opacity: 0.8 },
        { d: `M${n(sx)},${n(sy - 2.6)}l0.8,1.8l1.9,0.8l-1.9,0.8l-0.8,1.8l-0.8,-1.8l-1.9,-0.8l1.9,-0.8Z`, tone: 'mark', opacity: 0.9 },
      ];
    }
    case 'lattice': {
      let d = '';
      for (const u of [-0.25, 0.25]) for (const v of [-0.25, 0.25]) {
        const [x, y] = q(u, v);
        d += ellipse(x, y, 1.1, 0.6);
      }
      const [x, y] = q(0, 0);
      return [
        { d, tone: 'mark', opacity: 0.9 },
        { d: layout === 0 ? quad([q(0, -0.08), q(0.08, 0), q(0, 0.08), q(-0.08, 0)]) : ellipse(x, y, 1.2, 0.7), tone: 'accent', opacity: 0.7 },
      ];
    }
    case 'bushes': {
      // Tea rows: two clipped bush mounds along u, soil furrows between
      let bushes = '';
      let lights = '';
      for (const v of [-0.2, 0.22]) {
        for (const u of [-0.24, 0.12 + layout * 0.04]) {
          const [x, y] = q(u, v);
          bushes += ellipse(x, y - 1.5, 7, 3.6);
          lights += ellipse(x - 1.5, y - 3, 3.4, 1.4);
        }
      }
      return [
        { d: line(q(-0.5, 0), q(0.5, 0)), tone: 'line', stroke: 1, opacity: 0.8 },
        { d: bushes, tone: 'mark' },
        { d: lights, tone: 'accent' },
      ];
    }
    case 'dots': {
      let d = '';
      for (let i = -2; i <= 2; i += 1) for (let j = -2; j <= 2; j += 1) {
        if ((i + j + layout) % 2 !== 0) continue;
        const [x, y] = q(i * 0.18, j * 0.18);
        d += ellipse(x, y, 1, 0.55);
      }
      return [{ d, tone: 'mark', opacity: 0.9 }];
    }
    case 'threshold': {
      // Warm boards across the doorway and a soft chevron pointing out
      const seams = [-0.17, 0.17].map((u) => line(q(u, -0.5), q(u, 0.5))).join('');
      return [
        { d: seams, tone: 'line', stroke: 0.9, opacity: 0.8 },
        { d: `M${n(-7)},${n(-1)}L0,${n(3)}L${n(7)},${n(-1)}`, tone: 'accent', stroke: 1.6, opacity: 0.75 },
      ];
    }
  }
}
