/**
 * Construction geometry for option D characters (art direction § 2.1, § 2.6, § 8.1): a port of
 * `limb()`, `blob()`, `crs()`, `crease()`, `hand()` and `footie()` from
 * `docs/art/options/_gen/anime2.py`, the reference implementation. Every function is pure and
 * returns SVG path data (`d` strings) on the 200u sprite canvas; colour, cel and line passes are
 * `Fig`'s job, so nothing here knows about materials.
 *
 * Numbers are printed like the Python's `f()` (two decimals, trailing zeros dropped), so the
 * output can be compared with the generators' (`geom.test.ts`).
 */

/** A point on the 200u canvas. */
export type Vec = readonly [number, number];

/** A number as path data: at most two decimals, no trailing zeros (`12.50` → `12.5`, `3.00` → `3`). */
export function num(value: number): string {
  const fixed = value.toFixed(2);
  return fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
}

/** Tenths of a unit: integers, so relative offsets between rounded points are exact (no drift). */
const tenths = (n: number) => Math.round(n * 10);

/** A tenths value as the shortest decimal: `-0.5` → `-.5`, `12.0` → `12`. */
const short = (t: number): string => {
  const text = String((t === 0 ? 0 : t) / 10);
  return text.replace(/^(-?)0\./, '$1.');
};

/** Joins numbers as path data allows: no separator before a minus sign, or before `.5` after a number that already has a decimal point. */
const join = (numbers: readonly string[]): string => {
  let out = '';
  numbers.forEach((n, i) => {
    const glued = i === 0 || n.startsWith('-') || (n.startsWith('.') && numbers[i - 1].includes('.'));
    out += glued ? n : ` ${n}`;
  });
  return out;
};

const ARITY: Record<string, number> = { M: 2, L: 2, C: 6, Q: 4, S: 4, T: 2, H: 1, V: 1, Z: 0 };

/**
 * Path data as sprites put it in the DOM: coordinates rounded to 0.1u (0.15px on a 300px
 * portrait) and written relative (`c`, `q`, `l`…), which is about 40% smaller than the two-decimal
 * absolute output of the construction functions (what the tests compare with the generators).
 * Only absolute M/L/C/Q/S/T/H/V/Z paths are rewritten; anything else is returned rounded only.
 */
export function compactPath(d: string): string {
  let out = COMPACT_CACHE.get(d);
  if (out === undefined) {
    out = compact(d);
    // Sprites re-render the same paths (a hero starting and stopping a walk): keep the last few thousand
    if (COMPACT_CACHE.size >= 4000) COMPACT_CACHE.clear();
    COMPACT_CACHE.set(d, out);
  }
  return out;
}

const COMPACT_CACHE = new Map<string, string>();

function compact(d: string): string {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  if (tokens.some((token) => /[a-z]/.test(token) || (/[A-Z]/.test(token) && !(token in ARITY)))) {
    return d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (n) => short(tenths(Number(n)))).replace(/ (?=[-A-Za-z])/g, '');
  }
  let out = '';
  let [x, y] = [0, 0];
  let [sx, sy] = [0, 0];
  let i = 0;
  let command = '';
  while (i < tokens.length) {
    if (/[A-Z]/.test(tokens[i])) command = tokens[i++];
    else if (command === 'M') command = 'L'; // implicit lineto after a moveto
    const arity = ARITY[command];
    if (command === 'Z') {
      out += 'z';
      [x, y] = [sx, sy];
      continue;
    }
    const args = tokens.slice(i, i + arity).map((token) => tenths(Number(token)));
    i += arity;
    let rel: number[];
    if (command === 'H') {
      rel = [args[0] - x];
      x = args[0];
    } else if (command === 'V') {
      rel = [args[0] - y];
      y = args[0];
    } else {
      rel = args.map((value, k) => value - (k % 2 === 0 ? x : y));
      [x, y] = [args[arity - 2], args[arity - 1]];
    }
    if (command === 'M') [sx, sy] = [x, y];
    // The first moveto stays absolute (relative to 0,0 it is the same numbers)
    out += command.toLowerCase() + join(rel.map(short));
  }
  return out;
}

/** A point as path data, `x,y`. */
export const pt = (p: Vec): string => `${num(p[0])},${num(p[1])}`;

/** Catmull-Rom spline through `pts` as cubic segments, without the initial `M`. */
export function crs(pts: readonly Vec[]): string {
  const out: string[] = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : pts[i + 1];
    const c1: Vec = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Vec = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out.push(`C${pt(c1)} ${pt(c2)} ${pt(p2)}`);
  }
  return out.join(' ');
}

const unit = (dx: number, dy: number): Vec => {
  const length = Math.hypot(dx, dy) || 1;
  return [dx / length, dy / length];
};

/** Bezier handle factor for a round cap (≈ 4/3 of the radius gives a half circle). */
const CAP = 1.33;

/**
 * The closed outline of a tapered capsule along joints `pts`, with a radius per joint and round
 * caps. Radii dip at elbows, wrists, knees and ankles and bulge at the forearm and calf (§ 2.1),
 * so joints exist in the geometry rather than being drawn on.
 */
export function limb(pts: readonly Vec[], rs: readonly number[]): string {
  const n = pts.length;
  if (n < 2 || rs.length !== n) throw new Error(`limb needs ≥ 2 joints and one radius per joint (got ${n} joints, ${rs.length} radii)`);
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, n - 1)];
    const [tx, ty] = unit(b[0] - a[0], b[1] - a[1]);
    const [nx, ny] = [-ty, tx];
    left.push([pts[i][0] + nx * rs[i], pts[i][1] + ny * rs[i]]);
    right.push([pts[i][0] - nx * rs[i], pts[i][1] - ny * rs[i]]);
  }
  const tangent = (i: number, j: number) => unit(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]);
  const te = tangent(n - 2, n - 1);
  const ts = tangent(1, 0);
  const [le, re] = [left[n - 1], right[n - 1]];
  const [ls, rsStart] = [left[0], right[0]];
  const re_ = rs[n - 1] * CAP;
  const rs_ = rs[0] * CAP;
  const capEnd = `C${num(le[0] + te[0] * re_)},${num(le[1] + te[1] * re_)} ${num(re[0] + te[0] * re_)},${num(re[1] + te[1] * re_)} ${pt(re)}`;
  const capStart = `C${num(rsStart[0] + ts[0] * rs_)},${num(rsStart[1] + ts[1] * rs_)} ${num(ls[0] + ts[0] * rs_)},${num(ls[1] + ts[1] * rs_)} ${pt(ls)}`;
  return `M${pt(left[0])} ${crs(left)} ${capEnd} ${crs([...right].reverse())} ${capStart} Z`;
}

/** A closed smooth shape through `pts` (a closed Catmull-Rom loop): torsos, heads, paws. */
export function blob(pts: readonly Vec[]): string {
  if (pts.length < 3) throw new Error(`blob needs ≥ 3 points (got ${pts.length})`);
  const q = [...pts, ...pts.slice(0, 3)];
  const out: string[] = [];
  for (let i = 1; i <= pts.length; i += 1) {
    const [p0, p1, p2, p3] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
    const c1: Vec = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Vec = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out.push(`C${pt(c1)} ${pt(c2)} ${pt(p2)}`);
  }
  return `M${pt(pts[1])} ${out.join(' ')} Z`;
}

/**
 * A tapered fold mark from `p0` to `p1`: thick in the middle (`w` to one side), pointed at both
 * ends (§ 2.3: interior details are tapered fills, never uniform strokes). Fill it with the
 * material's line tint.
 */
export function crease(p0: Vec, p1: Vec, w = 1.2): string {
  const [mx, my] = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
  const [dx, dy] = [p1[0] - p0[0], p1[1] - p0[1]];
  const length = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [(-dy / length) * w, (dx / length) * w];
  return `M${pt(p0)} Q${num(mx + nx)},${num(my + ny)} ${pt(p1)} Q${num(mx - nx * 0.2)},${num(my - ny * 0.2)} ${pt(p0)} Z`;
}

// ---------------------------------------------------------------------------------------------
// Hands and feet (§ 2.6)

export type HandPose = 'open' | 'flat' | 'grab' | 'fist';

/** Hand outlines in hand space: u along the hand from the wrist, v across it (thumb at −v). */
const HAND: Record<Exclude<HandPose, 'fist'>, readonly Vec[]> = {
  open: [[0, -4.4], [4.2, -5.4], [6.4, -8.2], [8.6, -9.2], [9.8, -8], [8.6, -5.8], [11, -5.4], [13.8, -4.8], [14.2, -3.2], [11.8, -2.6], [14.6, -2.2], [15, -0.5], [12.2, 0],
    [14.4, 0.6], [14.4, 2.3], [11.8, 2.6], [12.9, 3.2], [12.5, 4.7], [10, 5.1], [8, 5.8], [4, 5.6], [0, 4.4]],
  flat: [[0, -4.4], [4.2, -5.4], [6.6, -7], [9, -7.2], [9.6, -5.8], [8.6, -4.8], [11.6, -4.4], [13.6, -3.6], [13.6, -2.4], [11.6, -2.2], [14.2, -1.6], [14.4, -0.2], [12, 0.1],
    [14, 0.6], [14, 2], [11.8, 2.2], [12.8, 2.8], [12.4, 4.2], [10, 4.6], [8, 5.4], [4, 5.6], [0, 4.4]],
  grab: [[0, -4.4], [4.2, -5.6], [6.8, -8.2], [9.4, -8.6], [10.4, -7], [9, -5.4], [10.8, -5], [12.6, -3.8], [12.4, -2.4], [10.9, -2], [13, -1.2], [12.8, 0.4], [11, 0.6],
    [12.8, 1.4], [12.4, 2.8], [10.8, 3], [11.6, 3.6], [11, 4.8], [9.4, 5], [7.6, 5.8], [4, 5.6], [0, 4.4]],
};

/** The valleys between fingers, where the short split creases start. */
const VALLEYS: Record<Exclude<HandPose, 'fist'>, readonly Vec[]> = {
  open: [[11.8, -2.6], [12.2, 0], [11.8, 2.6]],
  flat: [[11.6, -2.2], [12, 0.1], [11.8, 2.2]],
  grab: [[10.9, -2], [11, 0.6], [10.8, 3]],
};

/** A hand: one clean contour plus tapered creases (finger splits and the thumb's base). */
export type HandShape = { readonly d: string; readonly creases: readonly string[] };

/**
 * A toddler hand as ONE clean contour (chubby palm, four short fat fingers and a thumb), placed at
 * `wrist`, pointing along `angle` degrees, scaled by `scale`. Finger splits come back as separate
 * creases, so the map LOD can drop them and keep a mitten (§ 8.3).
 */
export function hand(wrist: Vec, angle: number, scale = 1, pose: HandPose = 'open'): HandShape {
  const a = (angle * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  const [vx, vy] = [-uy, ux];
  const at = (u: number, v: number): Vec => [wrist[0] + ux * u * scale + vx * v * scale, wrist[1] + uy * u * scale + vy * v * scale];
  if (pose === 'fist') {
    return {
      d: blob([at(0, -4.6), at(5, -6), at(10.4, -5), at(12, 0), at(10.4, 5), at(5, 6), at(0, 4.6)]),
      creases: [...[-2.6, 0, 2.6].map((v) => crease(at(9, v), at(11.6, v + 0.4), 0.5)), crease(at(4, -5), at(9, -4.4), 0.6)],
    };
  }
  return {
    d: blob(HAND[pose].map(([u, v]) => at(u, v))),
    creases: [...VALLEYS[pose].map(([u, v]) => crease(at(u - 2.6, v), at(u + 0.2, v), 0.45)), crease(at(5.6, -5.2), at(8.4, -6.4), 0.45)],
  };
}

/** A footie foot: the outline, plus the side view's grip strip and toe crease, or the sole view's grip dots. */
export type FootieShape = {
  readonly d: string;
  /** Side view: the cream grip strip along the sole (an open path, stroked) */
  readonly strip?: string;
  /** Side view: the toe-cap crease */
  readonly crease?: string;
  /** Sole view: grip dot centres */
  readonly dots?: readonly Vec[];
};

export type FootieOptions = {
  /** Show the sole toward the viewer (a cream sole with grip dots) */
  readonly sole?: boolean;
  /** +1 or −1: which side of heel → toe is the top of the foot */
  readonly up?: 1 | -1;
};

/**
 * A footie-pajama foot in 3/4 view from `heel` to `toe`, `w` units wide: rounded heel, instep
 * rising to the ankle on the `up` side, flat sole, toe cap with a big-toe bump. With `sole` the
 * foot shows its cream sole and grip dots instead.
 */
export function footie(heel: Vec, toe: Vec, w = 6.2, { sole = false, up = 1 }: FootieOptions = {}): FootieShape {
  const [dx, dy] = [toe[0] - heel[0], toe[1] - heel[1]];
  const length = Math.hypot(dx, dy);
  const [ux, uy] = [dx / length, dy / length];
  const [vx, vy] = [-uy * up, ux * up];
  const at = (u: number, v: number): Vec => [heel[0] + ux * u * length + vx * v, heel[1] + uy * u * length + vy * v];
  if (sole) {
    return {
      d: blob([at(-0.04, 0), at(0.12, -w * 0.8), at(0.5, -w * 0.9), at(0.9, -w * 0.85), at(1.06, -w * 0.2), at(1.0, w * 0.55), at(0.6, w * 0.9), at(0.12, w * 0.8)]),
      dots: [at(0.16, 0), at(0.42, -w * 0.4), at(0.42, w * 0.4), at(0.7, -w * 0.45), at(0.7, w * 0.25), at(0.9, -w * 0.1)],
    };
  }
  return {
    d: blob([at(-0.06, -w * 0.2), at(0.05, -w * 1.2), at(0.3, -w * 1.05), at(0.62, -w * 0.8), at(0.92, -w * 0.66), at(1.06, -w * 0.1), at(1.0, w * 0.55), at(0.6, w * 0.72), at(0.15, w * 0.7)]),
    strip: `M${pt(at(0.12, w * 0.58))} C${pt(at(0.4, w * 0.66))} ${pt(at(0.75, w * 0.64))} ${pt(at(0.98, w * 0.42))}`,
    crease: crease(at(0.78, -w * 0.62), at(0.86, -w * 0.1), 0.5),
  };
}

/** A four-point sparkle star centred on (x, y), `s` from centre to tip (the pajama star print). */
export function star4(x: number, y: number, s: number): string {
  return `M${num(x)},${num(y - s)} Q${num(x + 0.5)},${num(y - 0.5)} ${num(x + s)},${num(y)} Q${num(x + 0.5)},${num(y + 0.5)} ${num(x)},${num(y + s)} Q${num(x - 0.5)},${num(y + 0.5)} ${num(x - s)},${num(y)} Q${num(x - 0.5)},${num(y - 0.5)} ${num(x)},${num(y - s)} Z`;
}

/** `points` turned `deg` degrees about `c`, then moved by `by`: re-posing authored volumes (a leap tilts the walk's body). */
export function rotatePoints(points: readonly Vec[], c: Vec, deg: number, by: Vec = [0, 0]): Vec[] {
  const a = (deg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(a), Math.sin(a)];
  return points.map(([x, y]): Vec => [c[0] + (x - c[0]) * cos - (y - c[1]) * sin + by[0], c[1] + (x - c[0]) * sin + (y - c[1]) * cos + by[1]]);
}

/**
 * Tapered bands across a tube (tail rings, leg stripes): `count` creases evenly spaced along the
 * joint polyline `pts` (skipping the ends), each spanning the tube's width there. Path data.
 */
export function rings(pts: readonly Vec[], rs: readonly number[], count: number, w = 1.6): string {
  const lengths = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const out: string[] = [];
  for (let k = 1; k <= count; k += 1) {
    let at = (total * k) / (count + 1);
    let i = 0;
    while (i < lengths.length - 1 && at > lengths[i]) at -= lengths[i++];
    const t = lengths[i] ? at / lengths[i] : 0;
    const [a, b] = [pts[i], pts[i + 1]];
    const p: Vec = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const r = (rs[i] + (rs[i + 1] - rs[i]) * t) * 1.25;
    const [ux, uy] = unit(b[0] - a[0], b[1] - a[1]);
    out.push(crease([p[0] - uy * r + ux * 1.2, p[1] + ux * r + uy * 1.2], [p[0] + uy * r - ux * 1.2, p[1] - ux * r - uy * 1.2], w));
  }
  return out.join(' ');
}
