import { POPUP as C } from '../../art/palette';
import { depth, softEllipse, sparkle } from './paper';
import { f1, filterAttr, ref, translate, type KitCtx } from './svg';

/**
 * Characters and things in the paper world (popup art bible § 5): the die-cut standee, the thought
 * bubble on a coiled spring, and the 金珠珠 page goal. Ports of kit.js `standee`, `springBubble`, `bead`.
 */

export type StandeeOptions = { flip?: boolean; glow?: boolean; shadowW?: number; easel?: boolean };

/**
 * A character standee (bible § 5): the printed frame `href` die-cut with a warm-white border and a
 * stacked shadow (the `standee` filter), a kraft-grey easel tab and a floor contact ellipse. `x` is
 * the body centre, `yFeet` the ground line, `h` the drawn height, `aspect` = width / height.
 *
 * The border is a filter, so it shows only in PageLab and the bake; the game draws frames that
 * already carry it (baked by #96, played by #94), and gets just the ellipse and easel here.
 */
export function standee(ctx: KitCtx, href: string, x: number, yFeet: number, h: number, aspect: number, { flip = false, glow = false, shadowW, easel = true }: StandeeOptions = {}): string {
  const w = h * aspect;
  const sw = shadowW ?? w * 0.8;
  const mirror = flip ? ` transform="translate(${f1(2 * x)} 0) scale(-1 1)"` : '';
  return `<g>${softEllipse(ctx, x + (flip ? -6 : 6), yFeet + 2, sw / 2, Math.max(3, h * 0.035), 'shadow', 0.5)}`
    + (easel ? `<path d="M${f1(x - w * 0.18)} ${f1(yFeet + 1)}L${f1(x - w * 0.12)} ${f1(yFeet - h * 0.22)}L${f1(x + w * 0.12)} ${f1(yFeet - h * 0.22)}L${f1(x + w * 0.28)} ${f1(yFeet + 3)}Z" fill="${C.easel}" opacity=".9"/>` : '')
    + (glow ? softEllipse(ctx, x, yFeet - h * 0.5, w * 0.75, h * 0.55, 'lamp', 0.18, 'blur18') : '')
    + `<image href="${href}" x="${f1(x - w / 2)}" y="${f1(yFeet - h)}" width="${f1(w)}" height="${f1(h)}"${filterAttr(ctx, 'standee')}${mirror}/></g>`;
}

export type BubbleOptions = { w?: number; h?: number };

/** The die-cut cloud of a thought bubble, centred on (cx, cy), as a `d`. */
export function bubbleCloud(cx: number, cy: number, w = 96, h = 48): string {
  const bx = cx - w / 2, by = cy - h / 2;
  const p = (a: number, b: number) => `${f1(a)} ${f1(b)}`;
  return `M${p(bx + 14, by + h)}Q${p(bx - 6, by + h)} ${p(bx + 2, by + h * 0.55)}Q${p(bx - 4, by + 6)} ${p(bx + 18, by + 6)}`
    + `Q${p(bx + 26, by - 6)} ${p(bx + w * 0.45, by + 2)}Q${p(bx + w * 0.62, by - 7)} ${p(bx + w * 0.78, by + 4)}Q${p(bx + w + 6, by + 4)} ${p(bx + w - 2, by + h * 0.5)}`
    + `Q${p(bx + w + 6, by + h + 2)} ${p(bx + w - 16, by + h)}Z`;
}

/**
 * The thought bubble on a coiled wire spring (bible § 5): the spring zig-zags from his head
 * (x0, y0) to the cloud centred on (x1, y1); `content` (the icon) is drawn on top.
 */
export function springBubble(ctx: KitCtx, x0: number, y0: number, x1: number, y1: number, content = '', { w = 96, h = 48 }: BubbleOptions = {}): string {
  const cloud = bubbleCloud(x1, y1, w, h);
  return wireSpring(x0, y0, x1, y1 + h / 2)
    + depth(ctx, 3, `<path d="${cloud}" fill="${C.standeeCard}"/>`, `<path d="${cloud}"/>`)
    + content;
}

/** A coiled wire spring's zig-zag from (x0, y0) to (x1, y1), `n` coils of half-width `amp`, as a `d`. */
export function springPath(x0: number, y0: number, x1: number, y1: number, n = 7, amp = 4): string {
  let d = `M${f1(x0)} ${f1(y0)}`;
  for (let i = 1; i <= n * 2; i++) {
    const t = i / (n * 2), px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t, s = i % 2 ? amp : -amp;
    d += `L${f1(px + s)} ${f1(py)}`;
  }
  return d;
}

/** The spring drawn (bible § 5): its dropped shadow, then the wire. */
export function wireSpring(x0: number, y0: number, x1: number, y1: number, n = 7, amp = 4, width = 1.6): string {
  const d = springPath(x0, y0, x1, y1, n, amp);
  return `<path d="${d}" fill="none" stroke="${C.wireShadow}" stroke-width="${f1(width + 1)}" stroke-linejoin="round" opacity=".35" transform="translate(1 1.5)"/>`
    + `<path d="${d}" fill="none" stroke="${C.wire}" stroke-width="${f1(width)}" stroke-linejoin="round"/>`;
}

/** 金珠珠, the page goal (bible § 3.1 foil): a gold-foil bead in a little cup of light, three sparkles. */
export function bead(ctx: KitCtx, x: number, y: number, r = 9): string {
  const ball = `<circle r="${r}"/>`;
  return `<g transform="${translate(x, y)}">${softEllipse(ctx, 0, 0, r * 3.2, r * 3.2, 'foil', 0.28, 'blur8')}`
    + softEllipse(ctx, 0, r + 3, r * 1.2, r * 0.3, 'shadow', 0.45)
    + depth(ctx, 4, `<circle r="${r}" fill="${ref(ctx, 'foil')}"/>`, ball)
    + `<circle cx="${f1(-r * 0.35)}" cy="${f1(-r * 0.38)}" r="${f1(r * 0.3)}" fill="${C.foilShine}"/>`
    + sparkle(ctx, -r * 1.9, -r * 1.5, r * 0.7) + sparkle(ctx, r * 1.8, -r * 2.2, r * 0.5) + sparkle(ctx, r * 1.7, r * 0.2, r * 0.35)
    + `</g>`;
}
