import { POPUP as C } from '../../../art/palette';
import { f1, pawBadge } from '../../art';
import { compilePart } from '../../core/presets';
import type { PageDef, PartDef } from '../../core/types';

/**
 * Legibility cues for the late-game machines (#221, the AI playthrough's friction 13–15): pure
 * functions reading the page's data, and the printed art they draw. None of them touches the
 * simulation or the puzzle; they show what the data already says.
 *
 * - **Level wheels** (13: 7-5's teapot, 8-5's tap, 9-4's sun dial): a wheel whose stops a lift
 *   follows gets a printed dial — a level gauge at each stop round its rim, clockwise arrows between
 *   them, the current (or dragged-to) stop ringed — so the player sees where it is, which way it
 *   goes and what each stop does to the water.
 * - **Coupled drives** (15: 10-3's crank): a printed drive belt from a wheel to every part it turns
 *   (`coupled`); a part Mocha holds still shows its belt slack and the locked paw badge.
 * - **Swings** (14: 10-4's damper): a blowable's stops as a printed path under it, arrows on to the
 *   next stop and the long way back; the next stop says when it needs Mocha's weight.
 */

/**
 * Where each of `wheel`'s stops leaves a lift that follows it, 0 (bottom) … 1 (top); null when no
 * lift does, or for a two-stop wheel (an on/off switch, 8-2's valves: no way to turn it wrong).
 */
export function wheelLevels(def: PageDef, wheel: PartDef): number[] | null {
  if (wheel.preset !== 'wheel') return null;
  const stops = compilePart(wheel).states;
  if (stops.length < 3) return null;
  for (const lift of def.parts) {
    if (lift.preset !== 'lift' || lift.react === undefined) continue;
    const floors = compilePart(lift).states;
    if (floors.length < 2) continue;
    const levels = stops.map((s) => {
      const r = lift.react!.find((x) => typeof x.on !== 'string' && x.on.type === 'partEnter' && x.on.id === wheel.id && x.on.state === s && x.when === undefined);
      const k = r === undefined ? -1 : floors.indexOf(r.to);
      return k < 0 ? null : k / (floors.length - 1);
    });
    if (levels.every((l): l is number => l !== null)) return levels;
  }
  return null;
}

/** A stop's angle on a wheel of `count` stops, clockwise from the top (radians). */
const stopAngle = (i: number, count: number) => (i * 2 * Math.PI) / count;
const polar = (radius: number, a: number): [number, number] => [radius * Math.sin(a), -radius * Math.cos(a)];

/** The size of a level gauge on a wheel of radius `r`. */
export const gaugeR = (r: number) => Math.max(11.5, Math.min(14, r * 0.34));
/** The printed dial's track, round the wheel's rim. */
export const dialR = (r: number) => r * 1.12 + gaugeR(r) + 3;

/** A level gauge: a cream disc, the water in it up to `level`. */
function gauge(level: number, g: number, current: boolean): string {
  // The water line: a film when drained, the brim when full
  const y0 = g * 0.78 - level * g * 1.4;
  const x0 = Math.sqrt(Math.max(0, g * g - y0 * y0));
  const water = `<path d="M${f1(-x0)} ${f1(y0)}A${f1(g)} ${f1(g)} 0 ${y0 < 0 ? 1 : 0} 0 ${f1(x0)} ${f1(y0)}Z" fill="${C.wordBeep}"/>`
    + `<path d="M${f1(-x0 + 1)} ${f1(y0)}q${f1(x0 / 2)} -2.4 ${f1(x0 - 1)} 0t${f1(x0 - 1)} 0" fill="none" stroke="${C.moonRim}" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>`;
  return `<circle r="${f1(g + 1.2)}" fill="${C.shadow}" opacity=".3" transform="translate(.8 1.4)"/>`
    + `<circle r="${f1(g)}" fill="${C.page}"/>${water}`
    + `<circle r="${f1(g)}" fill="none" stroke="${current ? C.marigoldEdge : C.inkSoft}" stroke-width="${current ? 1.6 : 1.2}"/>`
    + (current ? `<circle r="${f1(g + 3)}" fill="none" stroke="${C.marigold}" stroke-width="2.6"/>` : '');
}

/**
 * The printed dial round a level wheel (centred on it): a gauge per stop, the current one ringed
 * in marigold, and a clockwise arrow from each stop to the next (the last one back to the first:
 * the turn goes round). `current` is the stop shown ringed.
 */
export function levelDial(levels: readonly number[], r: number, current: number): string {
  const n = levels.length;
  const g = gaugeR(r);
  const R = dialR(r);
  const gap = (g + 5) / R;
  let out = `<g data-cue="dial" data-dial-stop="${current}">`;
  for (let i = 0; i < n; i++) {
    const a0 = stopAngle(i, n) + gap;
    const a1 = stopAngle(i + 1, n) - gap - 0.08;
    const [x0, y0] = polar(R, a0);
    const [x1, y1] = polar(R, a1);
    // The arrowhead at the end of the arc, along its tangent
    const [hx, hy] = polar(R, a1 + 0.08);
    const tx = Math.cos(a1 + 0.08), ty = Math.sin(a1 + 0.08);
    const nx = Math.sin(a1 + 0.08), ny = -Math.cos(a1 + 0.08);
    const head = `M${f1(hx - tx * 6 + nx * 4)} ${f1(hy - ty * 6 + ny * 4)}L${f1(hx)} ${f1(hy)}L${f1(hx - tx * 6 - nx * 4)} ${f1(hy - ty * 6 - ny * 4)}`;
    out += `<path d="M${f1(x0)} ${f1(y0)}A${f1(R)} ${f1(R)} 0 0 1 ${f1(x1)} ${f1(y1)}" fill="none" stroke="${C.cutRim}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 5" opacity=".9"/>`
      + `<path d="${head}" fill="none" stroke="${C.cutRim}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = polar(R, stopAngle(i, n));
    out += `<g data-dial-gauge="${i}" transform="translate(${f1(x)} ${f1(y)})"${i === current ? '' : ' opacity=".82"'}>${gauge(levels[i], g, i === current)}</g>`;
  }
  return out + '</g>';
}

/**
 * Where a level wheel's 轉 seal goes (centred on the wheel): on the rim, in the gap between two
 * stops nearest the usual lower-right corner, so no gauge sits under it.
 */
export function dialSealAt(count: number, r: number): [number, number] {
  const step = 360 / count;
  const a = ((Math.floor(135 / step) + 0.5) * step * Math.PI) / 180;
  return polar(r * 1.02, a);
}

/** A level wheel's dial as a box in page units (the bubbles keep off it, #221). */
export function dialBox(cx: number, cy: number, r: number): { x: number; y: number; w: number; h: number } {
  const R = dialR(r) + gaugeR(r) + 3;
  return { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R };
}

/** The pointer on a level wheel's disc, at its top (it turns with the disc and points at its stop). */
export function dialPointer(r: number): string {
  const y = -r * 1.1;
  return `<path data-cue="pointer" d="M0 ${f1(y - 7)}l6.5 9h-13z" fill="${C.marigold}" stroke="${C.marigoldEdge}" stroke-width="1.4" stroke-linejoin="round"/>`;
}

// ——— Coupled drives (10-3) ———

type Pt2 = readonly [number, number];

/** A drive branch from the shaft to a part a wheel turns (page units, ending at the part's rim). */
export interface DriveBelt {
  readonly part: string;
  readonly points: readonly Pt2[];
}

/** The belts of a page's coupled wheels: a trunk across from each wheel, a branch up or down to each part. */
export interface Drives {
  readonly trunks: readonly (readonly Pt2[])[];
  readonly branches: readonly DriveBelt[];
}

const partCentre = (p: PartDef): [number, number] => {
  if (p.center !== undefined) return [p.center[0], p.center[1]];
  const h = p.hit;
  return 'r' in h ? [h.cx, h.cy] : [h.x + h.w / 2, h.y + h.h / 2];
};
/** A wheel or section's disc radius (as `WheelView` draws it). */
const discR = (p: PartDef): number => {
  if (p.radius !== undefined) return p.radius;
  const h = p.hit;
  return 'r' in h ? Math.max(20, h.r - 8) : Math.max(20, Math.min(h.w, h.h) / 2 - 8);
};

/**
 * The belts from every wheel to the parts it turns (`coupled`, D-91): a trunk across from the
 * wheel's rim at its height to the parts' column, then a branch up or down to each part's rim (two
 * parts in one column share the trunk).
 */
export function driveBelts(def: PageDef): Drives {
  const trunks: Pt2[][] = [];
  const branches: DriveBelt[] = [];
  for (const w of def.parts) {
    if (w.preset !== 'wheel' || w.coupled === undefined) continue;
    const [wx, wy] = partCentre(w);
    const columns = new Set<number>();
    for (const id of w.coupled) {
      const p = def.parts.find((q) => q.id === id);
      if (p === undefined) continue;
      const [px, py] = partCentre(p);
      columns.add(px);
      const dy = Math.sign(py - wy);
      if (dy !== 0) branches.push({ part: id, points: [[px, wy], [px, py - dy * (discR(p) * 1.12 + 2)]] });
    }
    for (const x of columns) trunks.push([[wx + Math.sign(x - wx) * (discR(w) * 1.12 + 2), wy], [x, wy]]);
  }
  return { trunks, branches };
}

const pathOf = (points: readonly Pt2[]) => points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${f1(x)} ${f1(y)}`).join('');
/** A printed brass chain along `points`. */
const chain = (d: string) => `<path d="${d}" fill="none" stroke="${C.shadow}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".35" transform="translate(1 1.5)"/>`
  + `<path d="${d}" fill="none" stroke="${C.goldDeep}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<path d="${d}" fill="none" stroke="${C.goldLight}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="4 4"/>`;

/** The trunk: always driven by its wheel; a brass hub where the branches leave it. */
export function trunkArt(points: readonly Pt2[]): string {
  const [x, y] = points[points.length - 1];
  return `<g data-belt="trunk">${chain(pathOf(points))}<circle cx="${f1(x)}" cy="${f1(y)}" r="5.5" fill="${C.gold}" stroke="${C.goldDeep}" stroke-width="1.6"/>`
    + `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.8" fill="${C.brassShine}"/></g>`;
}

/** A branch: brass with a collar at the part's rim, or slack grey with the locked paw where Mocha holds the part. */
export function branchArt(belt: DriveBelt, held: boolean): string {
  const d = pathOf(belt.points);
  const [x, y] = belt.points[belt.points.length - 1];
  if (held) {
    return `<g data-belt="${belt.part}" data-held="">`
      + `<path d="${d}" fill="none" stroke="${C.printLilacDeep}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 6" opacity=".95"/>`
      + pawBadge(x, y, 10) + '</g>';
  }
  return `<g data-belt="${belt.part}">${chain(d)}<rect x="${f1(x - 6)}" y="${f1(y - 3)}" width="12" height="6" rx="2" fill="${C.gold}" stroke="${C.goldDeep}" stroke-width="1.4"/></g>`;
}

// ——— Swings (10-4) ———

/** The stops of a blowable that carries a node (where it is in each state), in state order; null when none. */
export function swingStops(def: PageDef, part: PartDef): [number, number][] | null {
  if (part.preset !== 'blowable') return null;
  const states = compilePart(part).states;
  const node = def.nodes.find((n) => n.attach?.part === part.id);
  if (node?.attach === undefined) return null;
  const pos = node.attach.pos;
  if (!states.every((s) => pos[s] !== undefined)) return null;
  return states.map((s) => [pos[s][0], pos[s][1]]);
}

/**
 * The printed path of a swing under its stops (`dy` below them): a dot per stop, an arrow on to
 * each next stop, and the long arc back from the last to the first. `next` is the stop a 咻—— would
 * send it to; `needsMocha` marks that stop with the paw (it won't go there without her weight).
 */
export function swingPath(stops: readonly (readonly [number, number])[], dy: number, current: number, next: number, needsMocha: boolean): string {
  const pts = stops.map(([x, y]) => [x, y + dy] as const);
  let out = `<g data-cue="swing" data-swing-next="${next}"${needsMocha ? ' data-needs-mocha=""' : ''}>`;
  const ink = C.cutRim;
  const arrow = (x: number, y: number, dir: number) => `<path d="M${f1(x - dir * 6)} ${f1(y - 4.5)}L${f1(x)} ${f1(y)}L${f1(x - dir * 6)} ${f1(y + 4.5)}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  // On, stop by stop: a shallow dotted arc with its arrow
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dir = Math.sign(bx - ax) || 1;
    const sx = ax + dir * 12, ex = bx - dir * 14;
    out += `<path d="M${f1(sx)} ${f1(ay)}Q${f1((sx + ex) / 2)} ${f1(Math.max(ay, by) + 10)} ${f1(ex)} ${f1(by)}" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 5" opacity=".9"/>`
      + arrow(ex, by, dir);
  }
  // And the long way back, from the last stop to the first, lower down
  if (pts.length > 2) {
    const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[0];
    const low = Math.max(ay, by) + 34;
    out += `<path d="M${f1(ax)} ${f1(ay + 12)}C${f1(ax)} ${f1(low)} ${f1(bx)} ${f1(low)} ${f1(bx)} ${f1(by + 13)}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5" opacity=".7"/>`
      + `<path d="M${f1(bx - 4.5)} ${f1(by + 19)}L${f1(bx)} ${f1(by + 13)}L${f1(bx + 4.5)} ${f1(by + 19)}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`;
  }
  // The stops: a chalk dot each, the current one filled; the next one ringed (or the paw: Mocha's weight)
  pts.forEach(([x, y], i) => {
    out += `<circle data-swing-stop="${i}" cx="${f1(x)}" cy="${f1(y)}" r="${i === current ? 5 : 4}" fill="${i === current ? C.chalk : 'none'}" stroke="${C.chalk}" stroke-width="2"/>`;
  });
  const [nx, ny] = pts[next];
  out += needsMocha ? pawBadge(nx, ny, 11) : `<circle cx="${f1(nx)}" cy="${f1(ny)}" r="9" fill="none" stroke="${C.chalk}" stroke-width="2.2" opacity=".95"/>`;
  return out + '</g>';
}
