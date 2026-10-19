import { POPUP as C } from '../../art/palette';
import { depth, softEllipse } from './paper';
import { f1, filterAttr, ref, translate, type KitCtx } from './svg';

/**
 * The touchable language (popup art bible § 4): the reserved marigold card, the red verb seal,
 * a grip texture and a printed direction cue on every touchable, plus the brass brad and Mocha's
 * perch paw. Ports of kit.js `seal`, `brad`, `pullTab`, `wheel`, `flap`, `slider`, `perch`.
 */

/** The four verbs on the touchable presets (bible § 4 cue 2). */
export const VERBS = { tab: '拉', wheel: '轉', flap: '翻', slider: '推' } as const;

/**
 * The red verb seal (印章), centred on (x, y): torn edge (a filter, PageLab/bake only), an inner
 * hairline and a white serif glyph. `r` is the half-size: ≥ 11 keeps it ≥ 22 px (bible § 4).
 */
export function seal(ctx: KitCtx, x: number, y: number, glyph: string, r = 13): string {
  const inset = r - 2.2;
  return `<g transform="${translate(x, y)}">`
    + `<rect x="${f1(-r)}" y="${f1(-r)}" width="${f1(2 * r)}" height="${f1(2 * r)}" rx="${f1(r * 0.32)}" fill="${C.seal}"${filterAttr(ctx, 'deckle')}/>`
    + `<rect x="${f1(-inset)}" y="${f1(-inset)}" width="${f1(2 * inset)}" height="${f1(2 * inset)}" rx="${f1(r * 0.22)}" fill="none" stroke="${C.sealHairline}" stroke-width="1" opacity=".75"/>`
    + `<text y="${f1(r * 0.38)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${f1(r * 1.12)}" fill="${C.sealGlyph}">${glyph}</text></g>`;
}

/**
 * A brass split-pin (paper fastener): the pivot of a wheel. `linked` adds the dashed marigold ring
 * that pairs a touchable with the part it moves (bible § 4, linked parts).
 */
export function brad(ctx: KitCtx, x: number, y: number, r = 4.5, linked = false): string {
  return `<g transform="${translate(x, y)}"><circle r="${f1(r + 1)}" fill="${C.shadow}" opacity=".35" transform="translate(.8 1.2)"/>`
    + `<circle r="${f1(r)}" fill="${ref(ctx, 'foil')}"/><circle r="${f1(r * 0.45)}" cx="${f1(-r * 0.25)}" cy="${f1(-r * 0.3)}" fill="${C.brassShine}" opacity=".8"/>`
    + (linked ? `<circle r="${f1(r + 2.4)}" fill="none" stroke="${C.marigold}" stroke-width="1.6" stroke-dasharray="2 2"/>` : '')
    + `</g>`;
}

export type PullTabOptions = {
  /** Card size */
  w?: number;
  h?: number;
  /** 1 pulls right, -1 pulls left (the art mirrors; the seal stays readable) */
  dir?: 1 | -1;
  label?: string;
  /** Length of the dotted track to the end stop, past the card */
  track?: number;
  /** The three idle tick marks at the grip end (bible § 4.1 idle) */
  ticks?: boolean;
  /** Draw the verb seal (false when the caller draws it upright beside a rotated tab) */
  sealed?: boolean;
};

/**
 * 拉 Pull-tab (bible § 4): a marigold tongue with a ridged grip end, a seal and an arrow, riding a
 * dotted track to its end stop. The card's top-left is at (x, y).
 */
export function pullTab(ctx: KitCtx, x: number, y: number, { w = 112, h = 44, dir = 1, label = VERBS.tab, track = 120, ticks = true, sealed = true }: PullTabOptions = {}): string {
  const rx = f1(h * 0.34);
  const mid = h / 2;
  const trackSvg = track <= 0 ? '' : `<g opacity=".85" fill="none" stroke="${C.marigoldLight}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="M${w + 4} ${mid}H${w + track}" stroke-dasharray="1 7"/><path d="M${w + track - 8} ${mid - 6}L${w + track} ${mid}L${w + track - 8} ${mid + 6}"/></g>`;
  const tickSvg = ticks
    ? `<path d="M-8 6l-6 -4M-9 ${mid}h-7M-8 ${h - 6}l-6 4" stroke="${C.marigoldLight}" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>`
    : '';
  const arrow = `<path d="M${f1(w * 0.42)} ${mid}H${f1(w * 0.66)}M${f1(w * 0.62)} ${mid - 7}L${f1(w * 0.7)} ${mid}L${f1(w * 0.62)} ${mid + 7}" fill="none" stroke="${C.sealDark}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const body = `<rect width="${w}" height="${h}" rx="${rx}" fill="${ref(ctx, 'tabG')}"/>`
    + `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${f1(h * 0.3)}" fill="none" stroke="${C.marigoldShine}" stroke-width="1.2" opacity=".7"/>`
    + `<rect x="${w - 30}" y="6" width="22" height="${h - 12}" rx="4" fill="${ref(ctx, 'ridges')}"/>${arrow}`;
  return `<g transform="${translate(x, y)} scale(${dir} 1)">${trackSvg}${tickSvg}`
    + depth(ctx, 3, body, `<rect width="${w}" height="${h}" rx="${rx}"/>`)
    + (sealed ? `<g transform="scale(${dir} 1)">${seal(ctx, dir * 22, mid, label, 14)}</g>` : '')
    + `</g>`;
}

/** The scalloped rim of a paper wheel: `teeth` bumps around radius `r`, as a closed `d`. */
export function wheelRim(r: number, teeth: number): string {
  const p = (a: number, rr: number) => `${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr)}`;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.5) / teeth) * Math.PI * 2, a2 = ((i + 1) / teeth) * Math.PI * 2;
    d += `${i ? 'L' : 'M'}${p(a0, r)}Q${p(a1, r * 1.12)} ${p(a2, r)}`;
  }
  return `${d}Z`;
}

export type WheelOptions = { teeth?: number; label?: string; face?: string; rot?: number };

/**
 * 轉 Paper wheel (volvelle, bible § 4): a marigold disc with a scalloped grip rim, a brass brad at
 * the pivot, a curved arrow and the seal. Centred on (x, y); `face` is drawn on the disc and turns
 * with it (`rot`, degrees).
 */
export function wheel(ctx: KitCtx, x: number, y: number, r: number, { teeth = 18, label = VERBS.wheel, face = '', rot = 0 }: WheelOptions = {}): string {
  const rim = wheelRim(r, teeth);
  const turn = rot ? ` transform="rotate(${rot})"` : '';
  const arrow = `<g stroke="${C.marigoldLight}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".95">`
    + `<path d="M${f1(-r * 0.55)} ${f1(-r * 1.32)}A${f1(r * 1.42)} ${f1(r * 1.42)} 0 0 1 ${f1(r * 0.9)} ${f1(-r * 1.1)}"/>`
    + `<path d="M${f1(r * 0.62)} ${f1(-r * 1.32)}l${f1(r * 0.3)} ${f1(r * 0.2)}l${f1(-r * 0.05)} ${f1(r * 0.34)}"/></g>`;
  const body = `<g${turn}><path d="${rim}" fill="${ref(ctx, 'tabR')}"/>`
    + `<circle r="${f1(r * 0.78)}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1" opacity=".5"/>`
    + `<circle r="${f1(r * 0.74)}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/>${face}</g>`;
  return `<g transform="${translate(x, y)}">${arrow}${depth(ctx, 3, body, `<path d="${rim}"${turn}/>`)}`
    + brad(ctx, 0, 0, r * 0.16)
    + (label ? seal(ctx, r * 0.82, r * 0.82, label, 11) : '')
    + `</g>`;
}

export type FlapOptions = { face?: string; label?: string; open?: number };

/**
 * 翻 Flap (bible § 4): a printed card whose lifted dog-ear corner is the marigold grip, with a
 * finger notch and a curl cue. Top-left at (x, y); `open` (0–1) lifts the corner further.
 */
export function flap(ctx: KitCtx, x: number, y: number, w: number, h: number, { face = C.flapFace, label = VERBS.flap, open = 0 }: FlapOptions = {}): string {
  const c = 22 + open * 20;
  const card = `M0 0H${w}V${f1(h - c)}L${f1(w - c)} ${h}H0Z`;
  const ear = `M${w} ${f1(h - c)}L${f1(w - c)} ${h}L${f1(w - c * 0.35)} ${f1(h + c * 0.42)}Z`;
  return `<g transform="${translate(x, y)}">`
    + depth(ctx, 3, `<path d="${card}" fill="${face}"/><path d="M2 2H${w - 2}" stroke="${C.standeeCard}" stroke-width="1" opacity=".35"/>`, `<path d="${card}"/>`)
    + depth(ctx, 4, `<path d="${ear}" fill="${ref(ctx, 'tabG')}"/><path d="M${f1(w - c)} ${h}L${f1(w - c * 0.35)} ${f1(h + c * 0.42)}" stroke="${C.marigoldEdge}" stroke-width="1" opacity=".6"/>`, `<path d="${ear}"/>`)
    + `<path d="M${f1(w - c * 0.2)} ${f1(h + c * 0.62)}q8 6 14 2M${w + 4} ${f1(h - c * 0.4)}l6 -3M${f1(w - c * 0.5)} ${f1(h + c * 0.95)}l-1 6" stroke="${C.marigoldLight}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    + seal(ctx, 16, 16, label, 11)
    + `</g>`;
}

/**
 * 推 Slider (bible § 4): a ridged marigold knob riding a dark slot inside the scene, with a dotted
 * track to the end. The slot starts at (x, y) and runs `len` px right; `pos` (0–1) places the knob.
 */
export function slider(ctx: KitCtx, x: number, y: number, len: number, pos = 0.3, label: string = VERBS.slider): string {
  const kx = f1(len * pos);
  const knob = `<rect x="${f1(kx - 16)}" y="-15" width="32" height="30" rx="10"/>`;
  return `<g transform="${translate(x, y)}">`
    + `<rect x="-4" y="-5" width="${len + 8}" height="10" rx="5" fill="${C.shadow}" opacity=".55"/><rect x="-4" y="-5" width="${len + 8}" height="2" rx="1" fill="${C.shadow}" opacity=".6"/>`
    + `<path d="M${f1(kx + 26)} 0H${len}" stroke="${C.marigoldLight}" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>`
    + `<path d="M${len - 6} -5L${len} 0L${len - 6} 5" stroke="${C.marigoldLight}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    + depth(ctx, 3, `<rect x="${f1(kx - 16)}" y="-15" width="32" height="30" rx="10" fill="${ref(ctx, 'tabG')}"/><rect x="${f1(kx - 9)}" y="-9" width="18" height="18" rx="3" fill="${ref(ctx, 'ridges')}"/>`, knob)
    + seal(ctx, kx - 24, -22, label, 11)
    + `</g>`;
}

/** The chalk paw print alone (perch markers, the locked badge). Centred on the origin. */
export function paw(fill: string = C.chalk, s = 1): string {
  const c = (cx: number, cy: number) => `<circle cx="${f1(cx * s)}" cy="${f1(cy * s)}" r="${f1(1.9 * s)}"/>`;
  return `<g fill="${fill}"><ellipse cy="${f1(s)}" rx="${f1(4.6 * s)}" ry="${f1(3.6 * s)}"/>${c(-5.5, -4)}${c(-1.8, -6.4)}${c(2.2, -6.4)}${c(5.8, -4)}</g>`;
}

/**
 * Mocha's perch marker (bible § 4): a chalk paw print on a soft marigold halo, and no seal, because
 * the action is Mocha's, not the finger's. Centred on (x, y), scaled by `s`.
 */
export function perch(ctx: KitCtx, x: number, y: number, s = 1): string {
  return `<g transform="${translate(x, y)} scale(${s})">${softEllipse(ctx, 0, 0, 22, 7, 'marigold', 0.3)}${paw()}</g>`;
}
