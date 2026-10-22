import { POPUP as C, POPUP_101 as K, POPUP_XIANGSHAN as X, mixHex } from '../../../art/palette';
import { depth, f1, filterAttr, pageBlock, seeded, softEllipse, sparkle, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import { ungradeSvg } from '../grade';
import type { BackdropDraw, PartSource } from '../sources';
import { dawnBirds, dawnClouds, eastHills, sunrise, t101Defs, tower101, xinyiSkyline } from './c10';
import { FLOOR_RECT, bookCues, floorPage, lin, standingPage } from './common';

/**
 * 番外 「象山的日出」 (the bonus page, #135; GDD § 4.4) environment art, baked by `npm run bake:popup`.
 * The top of the 象山 trail at sunrise: 101 across the basin with the sun coming up behind it (the
 * view the trail is famous for), 信義's towers, the hills round the basin; on the near side, the
 * trail's last stone steps with their wooden rail, a gully of ferns, and the 六巨石 boulders where the
 * 金珠珠 waits. 咻咻 plays as the breeze that blows the fallen leaf across (the `leaf` part).
 *
 * **Screen colours** (D-99): 05:30's grade is the full ×1.8 lift, so the backdrop pre-divides it
 * (`ungradeSvg`). The kit is chapter 10's dawn (`POPUP_101`) with the trail's greens and stone
 * (`POPUP_XIANGSHAN`).
 */

const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};
const screen = (draw: BackdropDraw): BackdropDraw => (ctx, def) => ungradeSvg(draw(ctx, def), 12);
const blur = (ctx: KitCtx, name: 'blur3' | 'blur8' | 'blur18' = 'blur3') => (ctx.filters ? filterAttr(ctx, name) : '');

/** The sun, just clearing the hills behind 101. */
const SUN = { x: 238, y: 236, r: 24 } as const;

/** A fern frond from (x, y), leaning `lean` (−1 left … 1 right), `s` its size. */
function fern(x: number, y: number, s: number, lean: number): string {
  const tip: [number, number] = [x + lean * 30 * s, y - 46 * s];
  let leaves = '';
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const px = x + (tip[0] - x) * t, py = y + (tip[1] - y) * t + Math.sin(t * Math.PI) * 6 * s;
    const l = (1 - t) * 13 * s + 3;
    leaves += `M${f1(px)} ${f1(py)}q${f1(-l * 0.6)} ${f1(-l * 0.2)} ${f1(-l)} ${f1(-l * 0.5)}M${f1(px)} ${f1(py)}q${f1(l * 0.6)} ${f1(-l * 0.2)} ${f1(l)} ${f1(-l * 0.5)}`;
  }
  return `<path d="M${x} ${y}Q${f1(x + lean * 10 * s)} ${f1(y - 30 * s)} ${f1(tip[0])} ${f1(tip[1])}${leaves}" stroke="${X.fern}" stroke-width="${f1(2 * s)}" fill="none" stroke-linecap="round"/>`;
}

/** A rounded boulder, (x, y) its foot centre, w × h, with its moss and a lit top. */
function boulder(ctx: KitCtx, x: number, y: number, w: number, h: number, seed: number): string {
  const r = seeded(seed);
  const d = `M${f1(x - w / 2)} ${y}Q${f1(x - w / 2 - 6)} ${f1(y - h * 0.7)} ${f1(x - w * 0.18)} ${f1(y - h)}Q${f1(x + w * 0.2)} ${f1(y - h - 8 * r())} ${f1(x + w / 2)} ${f1(y - h * 0.62)}Q${f1(x + w / 2 + 8)} ${f1(y - h * 0.2)} ${f1(x + w / 2)} ${y}Z`;
  return depth(ctx, 2, `<path d="${d}" fill="${X.stone}"/>`
    + `<path d="M${f1(x - w * 0.3)} ${f1(y - h * 0.9)}Q${f1(x)} ${f1(y - h - 4)} ${f1(x + w * 0.36)} ${f1(y - h * 0.7)}" stroke="${X.stoneLit}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`
    + `<path d="M${f1(x - w / 2 + 6)} ${f1(y - 4)}Q${f1(x)} ${f1(y - h * 0.3)} ${f1(x + w / 2 - 4)} ${f1(y - 6)}" stroke="${X.stoneShade}" stroke-width="8" fill="none" opacity=".5"/>`
    + `<path d="M${f1(x - w * 0.42)} ${f1(y - h * 0.5)}q${f1(w * 0.12)} ${f1(-h * 0.12)} ${f1(w * 0.24)} ${f1(-h * 0.06)}q${f1(-w * 0.04)} ${f1(h * 0.1)} ${f1(-w * 0.24)} ${f1(h * 0.06)}z" fill="${X.moss}"/>`
    + `<path d="M${f1(x + w * 0.1)} ${f1(y - h * 0.95)}q${f1(w * 0.12)} ${f1(-4)} ${f1(w * 0.22)} ${f1(2)}q${f1(-w * 0.1)} ${f1(5)} ${f1(-w * 0.22)} ${f1(-2)}z" fill="${X.moss}" opacity=".85"/>`, `<path d="${d}"/>`);
}

/** A tree crown silhouette against the dawn (the trail's acacias and camphors), (x, y) the crown's foot. */
function crown(x: number, y: number, s: number, fill: string): string {
  const d = `M${f1(x - 40 * s)} ${f1(y)}q${f1(-10 * s)} ${f1(-30 * s)} ${f1(14 * s)} ${f1(-38 * s)}q${f1(6 * s)} ${f1(-30 * s)} ${f1(34 * s)} ${f1(-24 * s)}q${f1(26 * s)} ${f1(-6 * s)} ${f1(30 * s)} ${f1(24 * s)}q${f1(26 * s)} ${f1(8 * s)} ${f1(12 * s)} ${f1(38 * s)}z`;
  return `<path d="${d}" fill="${fill}"/>`;
}

/**
 * The bonus page (the trail's top, sunrise): the sky from violet to gold, the sun clearing the
 * hills behind 101 (`tower101`, the classic 象山 view), 信義's towers in the basin's haze, vellum cloud
 * strips lit gold, birds. On the near side: tree crowns framing the view; on the floor page the
 * trail's last stone steps with a wooden rail (A1, x 44), a mossy rock (Mocha's `rock`, y 384), the
 * gully of ferns the leaf drifts across, and the 六巨石 boulders on the right (B1, B2 — the bead's
 * boulder top at y 430), a wooden 「象山」 trail sign. 咻咻 is drawn on the leaf's part (the breeze).
 */
const xiangshan: BackdropDraw = (ctx) => {
  const horizon = 262;
  const sky = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="url(#${ctx.id('sky')})"/>`
    + `<ellipse cx="${SUN.x}" cy="${horizon}" rx="320" ry="190" fill="url(#${ctx.id('dawnGlow')})"/>`
    + `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${horizon + 4}" fill="url(#${ctx.id('sunrise')})"/>`;
  const clouds = dawnClouds(ctx, [[90, 66, 160], [330, 96, 150], [40, 150, 110], [300, 168, 120]], 0.9)
    + dawnBirds([[118, 128, 0.6], [136, 118, 0.48], [150, 134, 0.52]]);
  const view = sunrise(ctx, SUN)
    + eastHills(ctx, -20, PAGE_W + 20, horizon, 18, 1201)
    + `<rect x="-20" y="${horizon}" width="${PAGE_W + 40}" height="${GUTTER_Y - horizon}" fill="${K.cityMid}"/>`
    + xinyiSkyline(ctx, -20, PAGE_W + 20, horizon + 30, 22, 1202, { lit: 0.14 })
    + tower101(ctx, { cx: 214, ground: horizon + 40, tip: 70, detail: true })
    + `<rect x="-20" y="${horizon}" width="${PAGE_W + 40}" height="${GUTTER_Y - horizon}" fill="url(#${ctx.id('cityHaze')})"/>`
    // The trail's own trees framing the view
    + crown(-6, 140, 1.4, X.leafDeep) + crown(30, 104, 0.9, X.leaf) + crown(388, 120, 1.3, X.leafDeep) + crown(352, 90, 0.8, X.leaf)
    + `<path d="M0 ${GUTTER_Y}V200q30 30 40 ${GUTTER_Y - 230}Z M${PAGE_W} ${GUTTER_Y}V190q-26 30 -34 ${GUTTER_Y - 220}Z" fill="${X.leafDeep}"/>`;
  // The floor page: the trail's earth, the gully, ferns, stone steps and rail, the boulders, the sign
  let ferns = '';
  for (const [x, y, s, l] of [[150, 560, 1.2, -0.6], [176, 556, 1, 0.3], [210, 562, 1.3, 0.1], [244, 556, 1.1, 0.5], [270, 560, 0.9, -0.2], [20, 600, 1.2, 0.4], [372, 604, 1.2, -0.5]] as const) ferns += fern(x, y, s, l);
  const floor = floorPage(ctx, `<rect x="${FLOOR_RECT.x}" y="${FLOOR_RECT.y}" width="${FLOOR_RECT.w}" height="${FLOOR_RECT.h}" fill="url(#${ctx.id('trailEarth')})"/>`
    // The gully: a dip of shade and ferns between the steps and the boulders
    + `<path d="M138 ${GUTTER_Y + 20}Q210 ${GUTTER_Y + 60} 300 ${GUTTER_Y + 20}L320 ${FLOOR_BOTTOM}H120Z" fill="${X.gully}" opacity=".85"/>`
    + `<path d="M138 ${GUTTER_Y + 20}Q210 ${GUTTER_Y + 60} 300 ${GUTTER_Y + 20}" stroke="${X.earthLit}" stroke-width="2" fill="none" opacity=".6"/>`
    + `<ellipse cx="${SUN.x}" cy="${GUTTER_Y + 40}" rx="220" ry="60" fill="${K.sunGlow}" opacity=".18"${blur(ctx, 'blur8')}/>`
    + ferns
    + `<rect x="${FLOOR_RECT.x}" y="${GUTTER_Y}" width="${FLOOR_RECT.w}" height="16" fill="${C.shadow}" opacity=".18"/>`);
  // The trail's last stone steps and their wooden rail (left)
  const steps = depth(ctx, 2, `<path d="M-20 474H96V500H-20Z" fill="${X.stone}"/><path d="M-20 474H96" stroke="${X.stoneLit}" stroke-width="3"/>`
    + `<path d="M-20 500H80V520H-20Z" fill="${X.stoneShade}"/><path d="M-20 520H64V544H-20Z" fill="${X.stone}"/>`, `<path d="M-20 474H96V544H-20Z"/>`)
    + depth(ctx, 3, `<path d="M4 476V420M60 476V422" stroke="${X.wood}" stroke-width="5" stroke-linecap="round"/><path d="M-6 424L72 428M-6 446L72 450" stroke="${X.woodLit}" stroke-width="4" stroke-linecap="round"/>`, `<path d="M0 420H66V478H0Z"/>`);
  const rock = boulder(ctx, 48, 400, 64, 34, 5);
  const boulders = boulder(ctx, 384, 470, 92, 104, 1) + boulder(ctx, 344, 470, 70, 52, 3) + boulder(ctx, 372, 452, 60, 38, 7);
  const sign = depth(ctx, 3, `<path d="M300 470V392" stroke="${X.wood}" stroke-width="5"/><rect x="276" y="384" width="50" height="22" rx="3" fill="${X.woodLit}"/>`, `<rect x="276" y="384" width="50" height="86"/>`)
    + `<text data-art-text="" x="301" y="400" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${X.wood}">象山</text>`;
  return t101Defs(ctx) + `<defs>${lin(ctx, 'trailEarth', [[0, X.earthLit], [0.5, X.earth], [1, X.earthDeep]])}</defs>`
    + standingPage(ctx, sky + clouds + view)
    + floor + steps + rock + boulders + sign
    + sparkle(ctx, 358, 404, 5) + bookCues(ctx) + block();
};

export const BONUS_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'bonus/xiangshan': screen(xiangshan),
};

// ——— The leaf ———

/** The leaf's place per state, from the part's hit centre (228, 476): where the node `L` is. */
const LEAF_AT: Readonly<Record<string, readonly [number, number]>> = { near: [-116, -14], mid: [-32, 2], far: [48, -14] };

/**
 * The fallen leaf (`bonus/leaf`, a blowable: `near` · `mid` · `far`), one drawing per state in the
 * part's local space (origin at its hit centre): a huge paper leaf, green-gold with its veins and a
 * curled tip, lying across the gully at its place — and 咻咻, small, white and happy, puffing a breeze
 * at it from behind (the wind's curls, the leaf's tip lifting in mid-drift).
 */
function leafArt(ctx: KitCtx, state: string): string {
  const [x, y] = LEAF_AT[state] ?? LEAF_AT.near;
  const lift = state === 'mid' ? -6 : 0;
  const d = `M-44 0Q-30 -16 0 -18Q34 -16 48 ${lift - 4}Q36 10 0 12Q-30 12 -44 0Z`;
  let veins = 'M-40 0Q0 -4 44 -4';
  for (let i = -3; i <= 3; i++) if (i) veins += `M${i * 11} -3l${i > 0 ? 6 : -6} ${i % 2 ? -10 : 9}`;
  const leaf = `<g transform="translate(${x} ${y})">`
    + softEllipse(ctx, 0, 14, 46, 5, 'shadow', 0.35)
    + depth(ctx, 3, `<path d="${d}" fill="${X.leafGold}"/><path d="M-44 0Q-30 -16 0 -18Q34 -16 48 ${lift - 4}" fill="none" stroke="${X.leafLit}" stroke-width="2" opacity=".8"/>`
      + `<path d="${veins}" stroke="${mixHex(X.leafGold, X.leafDeep, 0.5)}" stroke-width="1.4" fill="none"/><path d="M-44 0q-10 4 -16 2" stroke="${X.wood}" stroke-width="3" stroke-linecap="round"/>`, `<path d="${d}"/>`)
    + `</g>`;
  // 咻咻, the breeze: behind the leaf (to its left), cheeks puffed, its wind curling toward the leaf
  const sx = x - 70, sy = y - 44;
  const shushu = `<g transform="translate(${sx} ${sy}) scale(.7)">`
    + `<path d="M-30 6q-10 0 -10 -9q0 -9 10 -9q2 -12 15 -12q11 0 14 9q11 -1 12 9q2 12 -11 12z" fill="${X.cloud}"/>`
    + `<path d="M-6 -4q3 -3.6 6 0M6 -4q3 -3.6 6 0" stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="6" cy="3" r="2.4" fill="${C.ink}"/>`
    + `<ellipse cx="-12" cy="1" rx="2.6" ry="1.6" fill="${X.blush}" opacity=".7"/><ellipse cx="16" cy="1" rx="2.6" ry="1.6" fill="${X.blush}" opacity=".7"/></g>`
    + `<path d="M${sx + 16} ${sy}q14 -6 22 2t20 4M${sx + 14} ${sy + 8}q16 -2 26 8M${sx + 18} ${sy - 8}q10 -8 22 -4" stroke="${X.cloud}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>`;
  return leaf + shushu;
}

export const BONUS_PARTS: Readonly<Record<string, PartSource>> = {
  'bonus/leaf': {
    preset: 'blowable',
    states: ['near', 'mid', 'far'],
    box: { x: -200, y: -80, w: 300, h: 110 },
    draw: (ctx, state) => leafArt(ctx, state),
  },
};
