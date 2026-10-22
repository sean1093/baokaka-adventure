import { POPUP as C, POPUP_101 as K, POPUP_STAGE as S, POPUP_STATION as T } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';
import { outlineId } from '../../art/paper';

/**
 * Creature and cast art (#108; bible § 5): drawn live, feet at the origin, facing +x, flat fills
 * (no filters on a mover, GDD § 3.9). Creatures are **origami** — folded faceted paper in two or
 * three tones with a crease line. The cast who are not the v2 characters (the backpacker) are
 * **paper-style die-cut figures**: flat cut-paper colour inside the standee's warm-white card and
 * mauve cut line (`dieCut`), the same "printed piece glued into the book" read as Baokaka and
 * Mocha's baked standees.
 */

/**
 * A die-cut standee from silhouette shapes: the mauve cut line, the warm-white card border, then
 * the print. `outline` is the figure's silhouette (no fills of its own); `print` is drawn over the card.
 */
export function dieCut(outline: string, print: string): string {
  const id = sharing ? outlineId(outline) : null;
  if (id !== null) {
    return `<g fill="${C.standeeCard}" stroke="${C.standeeCut}" stroke-width="7.4" stroke-linejoin="round"><g id="${id}">${outline}</g></g>`
      + `<use href="#${id}" fill="${C.standeeCard}" stroke="${C.standeeCard}" stroke-width="6.2" stroke-linejoin="round"/>`
      + print;
  }
  return `<g fill="${C.standeeCard}" stroke="${C.standeeCut}" stroke-width="7.4" stroke-linejoin="round">${outline}</g>`
    + `<g fill="${C.standeeCard}" stroke="${C.standeeCard}" stroke-width="6.2" stroke-linejoin="round">${outline}</g>`
    + print;
}

/**
 * Shared outlines (#136, the animated-node budget). A die-cut repeats its silhouette for each of
 * its layers (the dropped shadow, the cut line, the card border): a three-dancer group was 21
 * elements of outline alone. Drawn live on the page, the silhouette is drawn once, in the cut
 * line's layer under an id, and the other layers are `<use>` of it (one element each; what they
 * show is identical pixel for pixel). The id is a hash of the silhouette, so two copies of one
 * figure on a page share an id over identical content. The bake never turns this on (its SVG,
 * and so its source hashes, stay as they were).
 */
let sharing = false;

/** Draws live art with shared outlines (see above). */
export function liveArt(draw: () => string): string {
  const was = sharing;
  sharing = true;
  try {
    return draw();
  } finally {
    sharing = was;
  }
}

/** The dropped shadow under a die-cut figure (`figure`): its silhouette, or a `<use>` of it when shared. */
export function cutShadow(outline: string): string {
  const id = sharing ? outlineId(outline) : null;
  return id !== null
    ? `<use href="#${id}" fill="${C.shadow}" opacity=".3" transform="translate(1.8 2.8)"/>`
    : `<g fill="${C.shadow}" opacity=".3" transform="translate(1.8 2.8)">${outline}</g>`;
}

/** The origami pigeon (bible § 5, proof A): three folded facets, a teal neck, a beak, a bead eye. */
export function origamiPigeon(ctx: KitCtx): string {
  const body = 'M-17 -7L-6 -15L3 -12L9 -20L14 -18L16 -9L8 -2L-3 0Z';
  const wing = 'M-6 -15L-1 -1L8 -2L3 -12Z';
  const tail = 'M-17 -7L-24 -11L-21 -4Z';
  return softEllipse(ctx, -2, 1, 13, 2.6, 'shadow', 0.42)
    + depth(ctx, 4, `<path d="${body}" fill="${T.dove}"/><path d="${tail}${wing}" fill="${T.doveShade}"/>`
      + `<path d="M9 -20L14 -18L13 -12L8 -11Z" fill="${T.doveNeck}"/><path d="M14 -18l6 1.6l-6 1.8zM-1.6 0h1.2v3h-1.2zM2.4 0h1.2v3h-1.2z" fill="${S.pigeonBeak}"/>`
      + `<path d="M-6 -15L-1 -1" stroke="${C.cutRim}" stroke-width=".7" opacity=".7"/><circle cx="11.4" cy="-16.6" r="1" fill="${C.ink}"/>`, `<path d="${body}"/>`);
}

/** 咻咻's cloud body (cast sheet: a pillow-sized puff, its top crowned with bumps), centred on the origin. */
const SHUSHU_CLOUD = 'M-26 12q-13 0 -13 -12q0 -11 11 -12q0 -14 14 -16q6 -11 18 -8q10 -8 20 1q12 0 13 13q11 3 9 15q-1 10 -13 10q-6 6 -17 4q-8 6 -20 2q-10 6 -22 3z';
/** Its wispy tail of wind, trailing behind (−x). */
const SHUSHU_WISP = 'M-36 2q-10 -2 -16 4M-38 -8q-8 -4 -14 0';

/** One of 咻咻's big anime eyes (cast sheet): white, a blue iris with its pupil, two highlights; looking up at them. */
function shushuEye(x: number, y: number, k = 1): string {
  return `<ellipse cx="${x}" cy="${y}" rx="${4.8 * k}" ry="${5.8 * k}" fill="${C.cutRim}"/>`
    + `<ellipse cx="${x + 0.6 * k}" cy="${y - 0.6 * k}" rx="${3.8 * k}" ry="${4.8 * k}" fill="${K.eye}"/>`
    + `<ellipse cx="${x + 0.6 * k}" cy="${y + 1.4 * k}" rx="${2.6 * k}" ry="${2.4 * k}" fill="${K.eyeLight}" opacity=".8"/>`
    + `<circle cx="${x + 0.8 * k}" cy="${y - 1.2 * k}" r="${1.9 * k}" fill="${C.ink}"/>`
    + `<circle cx="${x - 0.8 * k}" cy="${y - 2.6 * k}" r="${1.4 * k}" fill="${C.cutRim}"/><circle cx="${x + 2 * k}" cy="${y + 1.6 * k}" r="${0.7 * k}" fill="${C.cutRim}"/>`
    + `<ellipse cx="${x}" cy="${y}" rx="${4.8 * k}" ry="${5.8 * k}" fill="none" stroke="${C.ink}" stroke-width="${0.9 * k}"/>`;
}

/**
 * 咻咻 (GDD § 4.1; #128; its final look by #134 after the cast sheet,
 * `docs/art/options/d-anime/cast-sheet.png`), the baby typhoon, as a creature: a pillow-sized puff
 * of cloud with big glossy anime eyes, a blush, a typhoon's swirl on its side and a wisp of wind
 * trailing behind; its float point (feet) at the origin, facing +x. Three forms:
 * - **crying**, up in its rain cloud (`pos` 'cloud' or 'sky'): rain grey, brows tipped up, tears
 *   streaming from both eyes, rain drizzling on whatever is under it;
 * - **lonely**, anywhere else (down at the party, following the pair): pale blue-grey, hovering
 *   over its soft shadow, looking up at them, one tear still on its cheek;
 * - **calm** once hugged (`calm`, `up`): white and soft (「小雲，慢慢變白、變軟了。」), eyes curved
 *   happy, a smile, little sparkles.
 * Flat fills (it moves: no filters, GDD § 3.9).
 */
export function shushuCloud(ctx: KitCtx, pos?: string): string {
  const raining = pos === 'cloud' || pos === 'sky';
  const calm = pos === 'calm' || pos === 'up';
  const lift = raining ? 0 : -40;
  const body = raining ? S.rainCloud : calm ? K.cloudCalm : K.cloud;
  const shade = raining ? S.rainCloudDeep : calm ? K.cloudCalmShade : K.cloudShade;
  const deep = calm ? K.cloudShade : K.cloudDeep;
  // The underside's shade (a lower bulge), the swirl (the eye of the typhoon), the rim light on top
  const under = 'M-30 4q4 8 14 8q10 6 22 2q11 2 17 -4q12 0 13 -10q-4 8 -14 7q-6 6 -17 3q-9 5 -20 1q-10 3 -15 -7z';
  const swirl = 'M-24 2q0 -8 8 -8q7 0 7 6q0 5 -5 5q-4 0 -4 -3.4';
  const eyes = raining
    // Crying (cast sheet's 哭哭咻咻): eyes squeezed, brows up, tears streaming down
    ? `<path d="M2 -4q3 -2.6 6 0M14 -4q3 -2.6 6 0" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
      + `<path d="M1 -10l6 -2.4M21 -10l-6 -2.4" stroke="${deep}" stroke-width="1.2" stroke-linecap="round"/>`
      + `<path d="M4 -2v14M18 -2v14" stroke="${K.tear}" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`
      + `<path d="M9 4q2 -2 4 0" stroke="${C.ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
    : calm
      ? `<path d="M1.6 -4q3.4 -4 6.8 0M13.6 -4q3.4 -4 6.8 0" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
        + `<path d="M7.6 2q3.4 4 6.8 0z" fill="${S.blush}" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round"/>`
      : shushuEye(4.6, -4.6, 0.92) + shushuEye(17, -4.2, 0.92)
        + `<path d="M8.6 3.4q2.4 -1.4 4.8 0" stroke="${C.ink}" stroke-width="1" fill="none" stroke-linecap="round"/>`
        + `<path d="M21.6 0.4q1.8 2.8 0 4.2q-1.8 -1.4 0 -4.2z" fill="${K.tear}" stroke="${C.cutRim}" stroke-width=".5"/>`;
  let rain = '';
  if (raining) for (const [x, y, l] of [[-26, 18, 16], [-14, 24, 22], [-2, 18, 18], [10, 26, 20], [22, 18, 14], [32, 22, 12]] as const) rain += `M${x} ${y}l-3 ${l}`;
  const sparkles = calm ? `<path d="M-30 -30l1.6 4l4 1.6l-4 1.6l-1.6 4l-1.6 -4l-4 -1.6l4 -1.6zM34 -26l1.2 3l3 1.2l-3 1.2l-1.2 3l-1.2 -3l-3 -1.2l3 -1.2z" fill="${C.lampHot}" opacity=".9"/>` : '';
  return (raining ? '' : softEllipse(ctx, 0, 1, 22, 3.6, 'shadow', 0.28))
    + `<g transform="translate(0 ${lift})">`
    + (raining ? `<path d="${rain}" stroke="${S.drizzle}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="5 4" opacity=".85"/>` : '')
    + `<path d="${SHUSHU_WISP}" stroke="${body}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`
    + depth(ctx, 2, `<path d="${SHUSHU_CLOUD}" fill="${body}"/><path d="${under}" fill="${shade}" opacity=".7"/>`
      + `<path d="${swirl}" stroke="${shade}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      + `<path d="M-30 -2q1 -10 12 -11M-8 -26q8 -6 16 -2" stroke="${C.cutRim}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`
      + `<ellipse cx="-0.6" cy="2.4" rx="3.2" ry="2" fill="${S.blush}" opacity=".6"/><ellipse cx="23.4" cy="2.6" rx="3" ry="1.9" fill="${S.blush}" opacity=".6"/>`
      + eyes, `<path d="${SHUSHU_CLOUD}"/>`)
    + sparkles + `</g>`;
}

/** A rain puddle on the floor page (#128: 咻咻's tears, 10-5), centred on a node's floor point. */
export function puddle(): string {
  return `<g data-puddle=""><ellipse cx="0" cy="1" rx="26" ry="6.5" fill="${S.puddle}" opacity=".78"/>`
    + `<ellipse cx="-4" cy="0" rx="17" ry="3.6" fill="none" stroke="${S.puddleLight}" stroke-width="1.1" opacity=".75"/>`
    + `<path d="M8 -1.5q6 -1 10 1" stroke="${C.cutRim}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}

/** The backpacker's sleepy or open eyes and his face (paper style: dots, a blush, a small nose). */
function packerFace(x: number, y: number, asleep: boolean): string {
  const eyes = asleep
    ? `<path d="M${x - 5} ${y}q2 1.6 4 0M${x + 2} ${y}q2 1.6 4 0" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
    : `<circle cx="${x - 3}" cy="${y}" r="1.4" fill="${C.ink}"/><circle cx="${x + 4}" cy="${y}" r="1.4" fill="${C.ink}"/>`;
  return eyes + `<circle cx="${x - 6}" cy="${y + 4}" r="2" fill="${S.blush}" opacity=".65"/><circle cx="${x + 7}" cy="${y + 4}" r="2" fill="${S.blush}" opacity=".65"/>`
    + `<path d="M${x + 0.6} ${y + 2}l-1 2.6h2" stroke="${S.skinShade}" stroke-width="1" fill="none" stroke-linecap="round"/>`
    + (asleep ? `<ellipse cx="${x + 1}" cy="${y + 7.4}" rx="1.6" ry="1.2" fill="${C.ink}" opacity=".7"/>` : `<path d="M${x - 1.5} ${y + 7}q2 1.6 4 0" stroke="${C.ink}" stroke-width="1" fill="none" stroke-linecap="round"/>`);
}

/** The huge backpack: a rounded orange canvas body, a darker top flap with two buckled straps, a pocket, a rolled mat on top. */
function backpack(x: number, y: number, w: number, h: number): { outline: string; print: string } {
  const r = Math.min(14, w * 0.3);
  const d = `M${x} ${y + h - 4}V${y + r}q0 ${-r} ${r} ${-r}h${w - 2 * r}q${r} 0 ${r} ${r}V${y + h - 4}q0 4 -4 4h${-(w - 8)}q-4 0 -4 -4z`;
  const flap = `M${x + 2} ${y + r * 0.8}q0 ${-r * 0.8} ${r} ${-r * 0.8}h${w - 2 * r - 4}q${r} 0 ${r} ${r * 0.8}v${h * 0.22}q${-(w - 4) / 2} 8 ${-(w - 4)} 0z`;
  const mat = `M${x - 3} ${y - 9}h${w + 6}a6.5 6.5 0 0 1 0 13h${-(w + 6)}a6.5 6.5 0 0 1 0 -13z`;
  return {
    outline: `<path d="${d}"/><path d="${mat}"/>`,
    print: `<path d="${d}" fill="${T.backpack}"/><path d="${flap}" fill="${T.backpackDeep}"/>`
      + `<path d="M${x + w * 0.3} ${y + h * 0.2}v${h * 0.16}M${x + w * 0.7} ${y + h * 0.2}v${h * 0.16}" stroke="${C.printDark}" stroke-width="2.6" stroke-linecap="round"/>`
      + `<rect x="${x + w * 0.24}" y="${y + h * 0.56}" width="${w * 0.52}" height="${h * 0.3}" rx="7" fill="${T.backpackDeep}" opacity=".75"/>`
      + `<path d="M${x + w * 0.3} ${y + h * 0.6}h${w * 0.4}" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`
      + `<path d="${mat}" fill="${T.packer}"/><path d="M${x + w * 0.25} ${y - 9}v13M${x + w * 0.75} ${y - 9}v13" stroke="${T.packerDeep}" stroke-width="2"/>`
      + `<path d="M${x + 5} ${y + r + 2}q3 -8 10 -10" stroke="${C.cutRim}" stroke-width="1.2" fill="none" opacity=".4"/>`,
  };
}

/**
 * The backpacker (1-1; paper style). `sleep`: slumped asleep against his huge backpack, which stands
 * across the aisle at his node (it is what blocks Baokaka). `tucked`: sat up on the seat (his node
 * is the seat top), awake, the backpack hugged on his lap.
 */
export function backpacker(ctx: KitCtx, pos = 'sleep'): string {
  if (pos === 'tucked') {
    const pack = backpack(-20, -40, 40, 38);
    const outline = `<circle cx="2" cy="-66" r="14"/><path d="M-16 0q-2 -40 18 -42q20 2 18 42z"/><path d="M-12 0h30v36h-30z"/>${pack.outline}`;
    const print = `<path d="M-12 0h12v34h-12zM6 0h12v34h-12z" fill="${C.printLilacDeep}"/><path d="M-14 34h15v5h-15zM5 34h15v5h-15z" fill="${C.cutRim}"/>`
      + `<path d="M-16 0q-2 -40 18 -42q20 2 18 42z" fill="${T.packer}"/>`
      + `<circle cx="2" cy="-66" r="13" fill="${S.skin}"/><path d="M-11 -70q2 -12 13 -12q12 0 14 11q-6 -4 -14 -4q-8 0 -13 5z" fill="${T.packerHair}"/>`
      + `<path d="M-12 -72q0 -12 14 -12q14 0 14 12z" fill="${T.packerCap}"/><path d="M14 -73h9a2 2 0 0 1 0 4h-11z" fill="${T.packerCap}"/>`
      + packerFace(3, -64, false) + pack.print
      + `<path d="M-16 -18q-2 -8 4 -10M20 -18q2 -8 -4 -10" stroke="${S.skin}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    return softEllipse(ctx, 2, 40, 22, 3.5, 'shadow', 0.45) + depth(ctx, 4, dieCut(outline, print), outline);
  }
  const pack = backpack(-28, -60, 50, 60);
  // He sits on the floor behind it, legs out to the right, his head lolled on the rolled mat
  const outline = `<path d="M18 0q-4 -30 8 -40l26 2q8 18 4 38z"/><path d="M40 -6h44v8h-44z"/><circle cx="16" cy="-60" r="14"/>${pack.outline}`;
  const print = `<path d="M40 -8h40l6 8h-46z" fill="${C.printLilacDeep}"/><path d="M80 -14h7v14h-7z" fill="${C.cutRim}"/>`
    + `<path d="M18 0q-4 -30 8 -40l26 2q8 18 4 38z" fill="${T.packer}"/><path d="M26 -40q6 8 4 20" stroke="${T.packerDeep}" stroke-width="2" fill="none"/>`
    + pack.print
    + `<g transform="rotate(-24 16 -60)"><circle cx="16" cy="-60" r="13" fill="${S.skin}"/><path d="M3 -63q2 -12 13 -12q12 0 14 11q-6 -4 -14 -4q-8 0 -13 5z" fill="${T.packerHair}"/>`
    + `<path d="M2 -66q0 -12 14 -12q14 0 14 12z" fill="${T.packerCap}"/><path d="M28 -67h9a2 2 0 0 1 0 4h-11z" fill="${T.packerCap}"/>${packerFace(17, -58, true)}</g>`
    + `<path d="M34 -34q14 6 10 24" stroke="${S.skin}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    // Zzz, printed in chalk
    + `<text data-art-text="" x="38" y="-82" font-family="Fredoka" font-weight="700" font-size="13" fill="${C.chalk}" opacity=".9">z</text>`
    + `<text data-art-text="" x="47" y="-92" font-family="Fredoka" font-weight="700" font-size="17" fill="${C.chalk}">Z</text>`;
  return softEllipse(ctx, 22, 1, 52, 4, 'shadow', 0.45) + depth(ctx, 4, dieCut(outline, print), outline);
}
