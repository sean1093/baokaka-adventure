import { POPUP as C } from '../../art/palette';
import type { Depth } from './defs';
import { f1, f2, filterAttr, ref, seeded, translate, type KitCtx } from './svg';

/**
 * Paper: depth, grain, fibres, cut-paper silhouettes, pinholes, foil sparkles, washi tape, folds
 * and the linen cover (popup art bible § 2.2, § 3.1, § 3.2, § 7; kit.js).
 */

/**
 * Lifts `body` to tunnel-book depth `z` (bible § 2.2).
 *
 * With filters (PageLab, bake) it is kit.js `filter="url(#zN)"`. Without (the in-game path) the
 * same read comes from flat copies of `outline`, the piece's silhouette with no `fill` of its own:
 * a two-step soft shadow, a tight contact shadow and the 1 px top-left cut-edge rim, all offsets
 * from the depth filter's formula, under the body. Four extra nodes for a one-element outline;
 * a longer outline is drawn once and the other three copies are `<use>` of it. No filter.
 */
export function depth(ctx: KitCtx, z: Depth, body: string, outline: string): string {
  if (ctx.filters) return `<g${filterAttr(ctx, `z${z}`)}>${body}</g>`;
  const sdx = 1 + z * 1.1, sdy = 2 + z * 2.2;
  const cdx = 0.5 + z * 0.25, cdy = 0.8 + z * 0.45;
  // A single self-closing outline element takes the copy's attributes itself: one node per copy, not two
  const single = /^<([a-zA-Z]+)((?:(?!\/>)[^<>])*)\/>$/.exec(outline.trim());
  // A several-element outline is drawn once, under an id, and the other copies are `<use>` of it
  // (#136: one element a copy, against the animated-node budget; the same pixels)
  const id = single ? null : outlineId(outline);
  let first = true;
  const copy = (fill: string, opacity: number, x: number, y: number) => {
    const attrs = `fill="${fill}" opacity="${f2(opacity)}" transform="${translate(x, y)}"`;
    if (single && !/\b(fill|opacity|transform)=/.test(single[2])) return `<${single[1]}${single[2]} ${attrs}/>`;
    if (id === null) return `<g ${attrs}>${outline}</g>`;
    if (!first) return `<use href="#${id}" ${attrs}/>`;
    first = false;
    return `<g ${attrs}><g id="${id}">${outline}</g></g>`;
  };
  return copy(C.shadow, 0.1 + z * 0.015, sdx, sdy)
    + copy(C.shadow, 0.12 + z * 0.015, sdx / 2, sdy / 2)
    + copy(C.shadow, 0.45, cdx, cdy)
    + copy(C.cutRim, 0.42, -1, -1)
    + body;
}

/**
 * An id for a silhouette drawn once and reused with `<use>` (#136): a hash of its markup, so the
 * same silhouette twice on a page shares one id over identical content.
 */
export function outlineId(outline: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < outline.length; i++) h = Math.imul(h ^ outline.charCodeAt(i), 0x01000193);
  return `ol${(h >>> 0).toString(36)}`;
}

/**
 * A soft blurred ellipse (contact shadows, halos, glows). With filters it is a flat ellipse under a
 * Gaussian blur; without, a radial-gradient blob of the same footprint (`soft*` paint defs).
 */
export function softEllipse(
  ctx: KitCtx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tone: 'shadow' | 'marigold' | 'lamp' | 'foil',
  opacity: number,
  blur: 'blur3' | 'blur8' | 'blur18' = 'blur3',
): string {
  const at = `cx="${f1(cx)}" cy="${f1(cy)}"`;
  if (ctx.filters) {
    const color = { shadow: C.shadow, marigold: C.marigold, lamp: C.lamp, foil: C.windowMid }[tone];
    return `<ellipse ${at} rx="${f1(rx)}" ry="${f1(ry)}" fill="${color}" opacity="${f2(opacity)}"${filterAttr(ctx, blur)}/>`;
  }
  // The blur spreads the footprint; the gradient blob is drawn a little larger to match
  const grow = { blur3: 3, blur8: 8, blur18: 18 }[blur];
  const name = { shadow: 'softShadow', marigold: 'softMarigold', lamp: 'softLamp', foil: 'softFoil' }[tone];
  return `<ellipse ${at} rx="${f1(rx + grow)}" ry="${f1(ry + grow * 0.6)}" fill="${ref(ctx, name)}" opacity="${f2(opacity)}"/>`;
}

/**
 * Full-scene paper grain plus low-frequency mottle, soft-light over everything but UI text
 * (bible § 3.1). Bake and PageLab only: without filters it draws nothing, because grain is baked
 * into every bitmap and never a live full-screen layer (§ 9.1).
 */
export function grain(ctx: KitCtx, w = 390, h = 844, opacity = 0.55): string {
  if (!ctx.filters) return '';
  return `<rect width="${w}" height="${h}"${filterAttr(ctx, 'mottle')} opacity=".18" style="mix-blend-mode:soft-light" pointer-events="none"/>`
    + `<rect width="${w}" height="${h}"${filterAttr(ctx, 'grain')} opacity="${opacity}" style="mix-blend-mode:soft-light" pointer-events="none"/>`;
}

/** Washi or kraft fibres (bible § 3.1): `n` short curved hairlines, 4–18 px, seeded. */
export function fibers(x: number, y: number, w: number, h: number, n: number, color: string, seed = 1, opacity = 0.25): string {
  const r = seeded(seed);
  let paths = '';
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h, a = r() * Math.PI * 2, len = 4 + r() * 14;
    const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len;
    const cx = (px + ex) / 2 + (r() - 0.5) * 6, cy = (py + ey) / 2 + (r() - 0.5) * 6;
    paths += `M${f1(px)} ${f1(py)}Q${f1(cx)} ${f1(cy)} ${f1(ex)} ${f1(ey)}`;
  }
  // One path for all fibres (kit.js drew one element each): same look, a fraction of the nodes
  return `<path d="${paths}" fill="none" stroke="${color}" stroke-width=".55" stroke-linecap="round" opacity="${opacity}"/>`;
}

/**
 * A scalloped cut-paper band (clouds, hedges, steam): the `d` of a shape whose top edge is
 * scalloped around `yTop` and whose bottom is flat at `yBottom`.
 */
export function scallopBand(x0: number, x1: number, yTop: number, yBottom: number, seed: number, amp = 10, step = 26): string {
  const r = seeded(seed);
  let d = `M${x0} ${yBottom}L${x0} ${yTop}`;
  let x = x0;
  while (x < x1) {
    const w = step * (0.7 + r() * 0.7), h = amp * (0.5 + r());
    d += `Q${f1(x + w / 2)} ${f1(yTop - h * 1.6)} ${f1(Math.min(x + w, x1))} ${f1(yTop + (r() - 0.5) * amp * 0.6)}`;
    x += w;
  }
  return `${d}L${x1} ${yBottom}Z`;
}

export type SkylineOptions = { minH?: number; maxH?: number; win?: string; winP?: number; winOpacity?: number };

/** A city silhouette (`d`) and its lit pinprick windows (`windows`, one path), seeded. */
export function skyline(x0: number, x1: number, base: number, seed: number, { minH = 20, maxH = 70, win = C.lamp, winP = 0.18, winOpacity = 0.85 }: SkylineOptions = {}): { d: string; windows: string } {
  const r = seeded(seed);
  let d = `M${x0} ${base}`;
  let x = x0;
  let wins = '';
  while (x < x1) {
    const w = 10 + r() * 24, h = minH + r() * (maxH - minH);
    d += `L${f1(x)} ${f1(base - h)}`;
    if (r() < 0.25) {
      // A rooftop box
      d += `L${f1(x + w * 0.3)} ${f1(base - h)}L${f1(x + w * 0.3)} ${f1(base - h - 6)}L${f1(x + w * 0.45)} ${f1(base - h - 6)}L${f1(x + w * 0.45)} ${f1(base - h)}`;
    }
    d += `L${f1(x + w)} ${f1(base - h)}`;
    for (let wy = base - h + 5; wy < base - 4; wy += 6) {
      for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < winP) wins += `M${f1(wx)} ${f1(wy)}h1.8v2.4h-1.8z`;
    }
    x += w;
  }
  d += `L${x1} ${base}Z`;
  return { d, windows: wins ? `<path d="${wins}" fill="${win}" opacity="${winOpacity}"/>` : '' };
}

/**
 * Pinhole stars (bible § 3.2): needle holes in the backdrop with light behind them, warm white,
 * a 5 px cross glint on about 12 %. The glow is a filter, so it only shows in PageLab and the bake.
 */
export function pinholes(ctx: KitCtx, x: number, y: number, w: number, h: number, n: number, seed: number, color: string = C.pinhole): string {
  const r = seeded(seed);
  let dots = '';
  let glints = '';
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h * r();
    const big = r() < 0.12;
    const rr = big ? 1.4 : 0.55 + r() * 0.6;
    dots += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(rr)}" opacity="${f1(0.55 + r() * 0.45)}"/>`;
    if (big) glints += `M${f1(px - 5)} ${f1(py)}H${f1(px + 5)}M${f1(px)} ${f1(py - 5)}V${f1(py + 5)}`;
  }
  const cross = glints ? `<path d="${glints}" stroke="${color}" stroke-width=".5" opacity=".7"/>` : '';
  return `<g fill="${color}"${filterAttr(ctx, 'glowS')}>${dots}${cross}</g>`;
}

/** A four-point foil sparkle (bible § 3.1: foil is the only thing allowed to sparkle). */
export function sparkle(ctx: KitCtx, x: number, y: number, r: number, opacity = 1): string {
  const k = r * 0.16;
  const p = (a: number, b: number) => `${f1(a)} ${f1(b)}`;
  return `<path d="M${p(x, y - r)}Q${p(x + k, y - k)} ${p(x + r, y)}Q${p(x + k, y + k)} ${p(x, y + r)}Q${p(x - k, y + k)} ${p(x - r, y)}Q${p(x - k, y - k)} ${p(x, y - r)}Z" fill="${ref(ctx, 'foil')}"${opacity === 1 ? '' : ` opacity="${opacity}"`}/>`;
}

/** A strip of washi tape (bible § 3.1): torn ends (a filter, so PageLab/bake only), pale fibre ticks. */
export function washi(ctx: KitCtx, x: number, y: number, w: number, h: number, rot: number, color: string = C.washiPink, opacity = 0.78): string {
  let ticks = '';
  for (let i = 0; i < Math.floor(w / 6); i++) ticks += `M${f1(-w / 2 + 3 + i * 6)} ${f1(-h / 2 + 2)}l3 ${f1(h - 4)}`;
  return `<g transform="${translate(x, y)} rotate(${rot})"><rect x="${f1(-w / 2)}" y="${f1(-h / 2)}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}"${filterAttr(ctx, 'torn')}/>`
    + `<path d="${ticks}" stroke="${C.standeeCard}" stroke-width="1" opacity=".35"/></g>`;
}

/**
 * A mountain fold (bible § 3.2): a lit face, a face ×0.8 darker and a 1.4 px light ridge beside a
 * 0.8 px dark one. `w` × `h` card folded down its centre, peak `lift` px above the sides.
 */
export function mountainFold(ctx: KitCtx, x: number, y: number, w = 84, h = 88, lift = 18): string {
  const m = w / 2;
  return `<g transform="${translate(x, y)}"><path d="M0 ${lift}L${m} 0L${w} ${lift}V${h}L${m} ${h - lift}L0 ${h}Z" fill="${ref(ctx, 'foldL')}"/>`
    + `<path d="M${m} 0L${w} ${lift}V${h}L${m} ${h - lift}Z" fill="${ref(ctx, 'foldR')}"/>`
    + `<path d="M${m} 0V${h - lift}" stroke="${C.cutRim}" stroke-width="1.4"/><path d="M${m + 1.4} 0V${h - lift}" stroke="${C.foldRidge}" stroke-width=".8" opacity=".6"/></g>`;
}

/** A valley fold (bible § 3.2): both faces darker toward the crease, a blurred AO strip and a dark crease line. */
export function valleyFold(ctx: KitCtx, x: number, y: number, w = 84, h = 88, lift = 18): string {
  const m = w / 2;
  const ao = ctx.filters
    ? `<rect x="${m - 8}" y="${lift - 2}" width="16" height="${h - lift}" fill="${C.foldAo}" opacity=".18"${filterAttr(ctx, 'blur3')}/>`
    : `<rect x="${m - 5}" y="${lift}" width="10" height="${h - lift}" fill="${C.foldAo}" opacity=".12"/>`;
  return `<g transform="${translate(x, y)}"><path d="M0 0L${m} ${lift}L${w} 0V${h - lift}L${m} ${h}L0 ${h - lift}Z" fill="${ref(ctx, 'foldL')}"/>`
    + `<path d="M${m} ${lift}L${w} 0V${h - lift}L${m} ${h}Z" fill="${ref(ctx, 'foldR')}"/>${ao}`
    + `<path d="M${m} ${lift}V${h}" stroke="${C.foldValley}" stroke-width="1"/></g>`;
}

/**
 * The book's navy linen cover (bible § 7): weave pattern, vignette and four gold-foil corner
 * brackets. Fills `w` × `h` from the origin.
 */
export function cover(ctx: KitCtx, w = 390, h = 844): string {
  const corner = (x: number, y: number, sx: number, sy: number) =>
    `<g transform="${translate(x, y)} scale(${sx} ${sy})" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.4" opacity=".9">`
    + `<path d="M0 28V0H28M5 22V5H22M9 9l7 7"/><circle cx="16" cy="16" r="2.2" fill="${ref(ctx, 'foil')}" stroke="none"/></g>`;
  return `<rect width="${w}" height="${h}" fill="${ref(ctx, 'linen')}"/><rect width="${w}" height="${h}" fill="${ref(ctx, 'vign')}"/>`
    + corner(8, 8, 1, 1) + corner(w - 8, 8, -1, 1) + corner(8, h - 8, 1, -1) + corner(w - 8, h - 8, -1, -1);
}
