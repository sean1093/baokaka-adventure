import { POPUP as C, POPUP_STAGE as S, POPUP_STATION as T } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';

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
  return `<g fill="${C.standeeCard}" stroke="${C.standeeCut}" stroke-width="7.4" stroke-linejoin="round">${outline}</g>`
    + `<g fill="${C.standeeCard}" stroke="${C.standeeCard}" stroke-width="6.2" stroke-linejoin="round">${outline}</g>`
    + print;
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

/** 咻咻's cloud outline (the prologue's peeking cloud, `shushuPeek`, at creature size), centred on the origin. */
const SHUSHU_CLOUD = 'M-22 9q-13 0 -13 -11q0 -11 13 -11q2 -14 18 -14q13 0 18 11q13 -2 14 11q2 14 -13 14z';

/**
 * 咻咻 (GDD § 4.1; #128), the baby typhoon, as a creature: a little paper cloud with a face, feet
 * (its float point) at the origin. Up in its rain cloud (`pos` 'cloud' or 'sky') it is lilac grey,
 * eyes shut tight, and drizzles on whatever is under it; anywhere else — down on the floor,
 * following the pair (`lonely`) — a small white cloud hovering over its own soft shadow, looking up
 * at them with a tear still on its cheek.
 */
export function shushuCloud(ctx: KitCtx, pos?: string): string {
  const raining = pos === 'cloud' || pos === 'sky';
  const lift = raining ? 0 : -40;
  const body = raining ? S.rainCloud : C.vellum;
  const shade = raining ? S.rainCloudDeep : C.printLilac;
  const eyes = raining
    ? `<path d="M2 -4q2.6 2.2 5.2 0M11 -4q2.6 2.2 5.2 0" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`
    : `<circle cx="4.6" cy="-4.4" r="1.9" fill="${C.ink}"/><circle cx="13.4" cy="-3.8" r="1.9" fill="${C.ink}"/><circle cx="5.2" cy="-5.1" r=".6" fill="${C.cutRim}"/><circle cx="14" cy="-4.5" r=".6" fill="${C.cutRim}"/>`;
  const tear = `<path d="M17.6 -0.6q1.8 2.8 0 4.2q-1.8 -1.4 0 -4.2z" fill="${S.drizzle}" stroke="${shade}" stroke-width=".5"/>`;
  let drizzle = '';
  if (raining) for (const [x, y, l] of [[-24, 18, 16], [-12, 24, 22], [0, 18, 18], [12, 26, 20], [24, 18, 14]] as const) drizzle += `M${x} ${y}l-3 ${l}`;
  return (raining ? '' : softEllipse(ctx, 0, 1, 20, 3.4, 'shadow', 0.3))
    + `<g transform="translate(0 ${lift})">`
    + (raining ? `<path d="${drizzle}" stroke="${S.drizzle}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="5 4" opacity=".85"/>` : '')
    + depth(ctx, 2, `<path d="${SHUSHU_CLOUD}" fill="${body}"/>`
      + `<path d="M-14 4q0 -9 9 -9q8 0 8 6q0 5 -5 5q-3 0 -3 -3" stroke="${shade}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      + `<path d="M-30 1q2 -8 10 -8" stroke="${C.cutRim}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/>`
      + eyes + `<circle cx="1.6" cy="1.4" r="2.6" fill="${S.blush}" opacity=".55"/><circle cx="17" cy="2" r="2.4" fill="${S.blush}" opacity=".55"/>`
      + (raining ? '' : tear), `<path d="${SHUSHU_CLOUD}"/>`)
    + `</g>`;
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
