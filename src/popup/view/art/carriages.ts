import { POPUP as C, POPUP_BEITOU as B, POPUP_NEON as N, POPUP_STATION as T } from '../../../art/palette';
import { brad, depth, f1, ref, type KitCtx } from '../../art';
import { LEDGE_DEPTH } from '../stage';
import { bridgeSection } from './airport';
import { carriage } from './placeholders';
import { sectionLedge } from './taipei101';

/**
 * Carriage art by part art key (#108): the card a tab or slider moves that Baokaka rides (the
 * stage's `Carriage`). Live SVG with flat fills, its top-left at the origin and its deck (the
 * riders' feet line) at y 0, `w` wide; the view slides it with the part's tween. A key without a
 * drawing keeps the placeholder carriage.
 */
export type CarriageArt = (ctx: KitCtx, w: number, linked: boolean) => string;

/**
 * 1-2's train (proof A): a cream 台鐵 car with its blue band and thin orange line, lit windows and a
 * rounded navy-glassed nose toward +x. The body runs a little past the card's left end (it is a
 * long train; the platform hides the rest), and the linked brad pairs it with its pull-tab.
 */
function trainBlue(ctx: KitCtx, w: number, linked: boolean): string {
  const h = LEDGE_DEPTH - 2;
  const x0 = -34;
  const body = `M${x0} -4H${w - 18}q16 0 20 16V${h}H${x0}Z`;
  const windows = Array.from({ length: Math.max(2, Math.floor((w - x0 - 40) / 24)) }, (_, i) => `M${x0 + 10 + i * 24} 3h16v14a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z`).join('');
  const art = depth(ctx, 3, `<path d="${body}" fill="${ref(ctx, 'carriage')}"/>`
    + `<rect x="${x0}" y="26" width="${w - x0 + 2}" height="8" fill="${T.trainBlue}"/><rect x="${x0}" y="35.5" width="${w - x0 + 2}" height="2.4" fill="${T.trainLine}"/>`
    + `<path d="${windows}" fill="${ref(ctx, 'window')}"/><path d="${windows}" fill="none" stroke="${T.trainCreamShade}" stroke-width="1"/>`
    + `<path d="M${w - 14} 0q10 2 13 16h-14z" fill="${T.trainNose}"/><path d="M${w - 12} 2.6q6 1.6 8 7" stroke="${C.cutRim}" stroke-width="1" opacity=".5" fill="none"/>`
    + `<circle cx="${w - 2}" cy="24" r="2.2" fill="${C.lampHot}"/>`
    + `<path d="M${x0} -3.5H${w - 18}" stroke="${C.cutRim}" stroke-width="1" opacity=".7"/>`
    + `<path d="M${x0} ${h - 6}H${w + 2}" stroke="${T.trainCreamShade}" stroke-width="3"/>`, `<path d="${body}"/>`)
    + (linked ? brad(ctx, w - 30, h - 9, 4.5, true) : '');
  return art;
}

/**
 * 1-6's bento cart: a wooden barrow on two wheels with a striped awning on poles (Mocha's
 * `canopy` perch is its top, 88 above the deck), a little step at its left end (where the pigeon
 * lands and Baokaka climbs on) and the giant bento's box on the deck — its lid is the `lid` flap
 * riding the cart; under it the rice and the side dishes show once it is open.
 */
function bentoCart(ctx: KitCtx, w: number, linked: boolean): string {
  const h = 36;
  const awn = -88;
  // Few nodes (GDD § 3.9's animated budget): stripes, wheels and dishes are one path per colour
  const n = 7;
  const sw = (w + 8) / n;
  let red = '';
  let cream = '';
  for (let i = 0; i < n; i++) {
    const x = -4 + i * sw;
    const d = `M${f1(x)} ${awn}h${f1(sw)}v12q${f1(-sw / 2)} 8 ${f1(-sw)} 0z`;
    if (i % 2) cream += d;
    else red += d;
  }
  const awning = depth(ctx, 3, `<path d="M-6 ${awn - 2}h${w + 12}v3h${-(w + 12)}zM8 0V${awn + 6}h-3.2V0zM${w - 8} 0V${awn + 6}h3.2V0z" fill="${T.cartWoodDeep}"/><path d="${red}" fill="${T.awningRed}"/><path d="${cream}" fill="${T.awningCream}"/>`,
    `<path d="M-4 ${awn}h${w + 8}v14h${-(w + 8)}z"/>`);
  // The bento's box: dark lacquer-brown base, rice and dishes inside, the kraft band low on its front
  const bx0 = 38, bx1 = 82, by = -52;
  const box = `<rect x="${bx0}" y="${by}" width="${bx1 - bx0}" height="${-by}" rx="3" fill="${T.bentoBox}"/>`
    + `<rect x="${bx0 + 3}" y="${by + 3}" width="${bx1 - bx0 - 6}" height="${-by - 16}" rx="2" fill="${C.printWhite}"/>`
    + `<path d="M${bx0 + 17} ${by + 12}a5 5 0 1 1 -10 0a5 5 0 1 1 10 0zM${bx1 - 16} ${by + 8}h10v8h-10z" fill="${T.priority}"/>`
    + `<rect x="${bx0}" y="-12" width="${bx1 - bx0}" height="7" fill="${T.bentoBand}"/>`;
  const wheel = (r: number) => [18, w - 18].map((x) => `M${x - r} ${h + 4}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
  // The planks' seams and the wheels' hubs share one path (one colour)
  const cart = depth(ctx, 3, `<path d="M0 0H${w}V${h}H0ZM-14 16h18v6h-18z" fill="${T.cartWood}"/>`
    + `<path d="M0 12H${w}v1.4H0zM0 24H${w}v1.4H0z${wheel(5)}" fill="${T.cartWoodDeep}"/>`, `<rect x="0" y="0" width="${w}" height="${h}"/>`);
  const wheels = `<path d="${wheel(10)}" fill="${C.printDark}"/>`;
  return wheels + cart + box + awning + (linked ? brad(ctx, w / 2, h - 10, 4.5, true) : '');
}

/**
 * 4-4's claw (#119): it hangs from the cart on the gantry (its cable runs up to the rail, 272 above
 * the deck) round the riders' deck — a chrome motor hub with a pink cap lamp, and three chrome
 * prongs curling down around him (the middle one behind, paler), each ending in a little hook, so the
 * "carriage" reads as the claw that carries him. Flat fills only (it moves).
 */
function clawCart(ctx: KitCtx, w: number, linked: boolean): string {
  const cx = w / 2;
  const x = (n: number) => f1(cx + n);
  const prong = (side: -1 | 1) => `M${x(side * 9)} -70q${side * 30} 18 ${side * 22} 64q-2 6 ${-side * 7} 4`;
  const hub = `M${x(-15)} -70L${x(-11)} -90H${x(11)}L${x(15)} -70Z`;
  return `<path d="M${f1(cx)} -272V-96" stroke="${C.printDark}" stroke-width="1.8"/><path d="M${f1(cx + 1)} -272V-96" stroke="${N.chrome}" stroke-width=".7" opacity=".7"/>`
    + `<path d="M${f1(cx)} -72q0 34 -2 62q-1 6 5 6" stroke="${N.chromeDeep}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".75"/>`
    + `<path d="${prong(-1)}${prong(1)}" stroke="${C.printDark}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${prong(-1)}${prong(1)}" stroke="${N.chrome}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<rect x="${x(-8)}" y="-100" width="16" height="11" rx="2" fill="${N.chromeDeep}"/>`
    + `<path d="${hub}" fill="${N.chromeDeep}"/><path d="M${x(-12)} -72L${x(-9)} -88H${x(-2)}L${x(-4)} -72Z" fill="${N.chrome}"/>`
    + `<ellipse cx="${f1(cx)}" cy="-70" rx="15" ry="3" fill="${C.printDark}"/><circle cx="${f1(cx)}" cy="-93" r="3" fill="${C.neonPink}"/>`
    + `<path d="M${x(-14)} -89.4H${x(14)}" stroke="${C.cutRim}" stroke-width=".8" opacity=".6"/>`
    + (linked ? brad(ctx, cx, -80, 4.5, true) : '');
}

/**
 * 8-6's abacus rods (#129; drawn in the chapter's kit by #130): the block of ebony beads on a brass
 * rod that Baokaka climbs onto — three faceted beads side by side under the deck, each with its lit
 * upper face, the rod through them. The rod's slider is pulled by its handle at the bottom of the page.
 */
function abacusBeads(ctx: KitCtx, w: number, linked: boolean): string {
  const xs = [w / 2 - 17, w / 2, w / 2 + 17];
  // Each bead a rounded double cone seen from the side: its body, its lit upper facet
  const bead = (x: number) => `M${f1(x - 9)} 9Q${f1(x - 7)} 1 ${f1(x)} 0Q${f1(x + 7)} 1 ${f1(x + 9)} 9Q${f1(x + 7)} 17 ${f1(x)} 18Q${f1(x - 7)} 17 ${f1(x - 9)} 9Z`;
  const lit = (x: number) => `M${f1(x - 7.4)} 8Q${f1(x - 5.6)} 2 ${f1(x)} 1.4Q${f1(x + 5.6)} 2 ${f1(x + 7.4)} 8Z`;
  // Flat (no stacked shadow): three of these move on the spread, inside its animated-node budget
  return `<path d="${xs.map(bead).join('')}" fill="${B.ebony}"/><path d="${xs.map(lit).join('')}" fill="${B.ebonyLit}"/>`
    + (linked ? brad(ctx, w / 2, 9, 3.5, true) : '');
}

const CARRIAGES: Readonly<Record<string, CarriageArt>> = {
  'c1/train-blue': trainBlue,
  'c1/bento-cart': bentoCart,
  'c4/claw-cart': clawCart,
  // 6-4's telescoping jet-bridge section (#124, `airport.ts`)
  'c6/bridge-extend': bridgeSection,
  // 8-6's abacus rods (#129)
  'c8/abacus-rod': abacusBeads,
  // 10-3's ledges on 101's sections (#134, `taipei101.ts`): the bottom and top sections', and the middle's (its crank's key)
  'c10/tower-section': sectionLedge,
  'c10/section-crank': sectionLedge,
};

/** True when a part art key has its own carriage drawing (#138: the release's art-gap gate). */
export const hasCarriageArt = (key: string): boolean => key in CARRIAGES;

/** The carriage drawing for a part art key (the placeholder carriage when it has none). */
export function carriageArt(key: string): CarriageArt {
  return CARRIAGES[key] ?? ((ctx, w, linked) => carriage(ctx, w, 1, linked));
}
