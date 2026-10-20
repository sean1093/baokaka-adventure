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

/**
 * 3-1's ad poster on the platform wall (a `creature` that waves back to 掰掰; #116 placeholder until
 * #117): a framed print of a smiling figure holding up a 悠遊卡-style card. `waving`: the free arm up
 * in a wave, with two motion ticks. The poster's foot (its frame's bottom) is at the origin.
 */
export function adPoster(ctx: KitCtx, pos = 'still'): string {
  const frame = `<rect x="-26" y="-64" width="52" height="64" rx="2"/>`;
  const arm = pos === 'waving'
    ? `<path d="M8 -30l9 -16" stroke="${S.skin}" stroke-width="4" stroke-linecap="round"/><path d="M19 -54l3 -4M23 -48l4 -2" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/>`
    : `<path d="M8 -30l7 10" stroke="${S.skin}" stroke-width="4" stroke-linecap="round"/>`;
  return depth(ctx, 2, `<rect x="-26" y="-64" width="52" height="64" rx="2" fill="${C.printLilacDeep}"/><rect x="-22" y="-60" width="44" height="56" fill="${C.washiCeladon}"/>`
    + `<path d="M-22 -18h44v14h-44z" fill="${C.washi}"/><path d="M-16 -12h22M-16 -8h14" stroke="${C.inkSoft}" stroke-width="1.4"/>`
    + `<path d="M-10 -18q0 -16 10 -16q10 0 10 16z" fill="${C.wordBye}"/><circle cy="-40" r="7" fill="${S.skin}"/>`
    + `<path d="M-7 -42q1 -7 7 -7q6 0 7 7q-3 -3 -7 -3q-4 0 -7 3z" fill="${C.printDark}"/>`
    + `<circle cx="-2.4" cy="-40" r=".9" fill="${C.ink}"/><circle cx="2.4" cy="-40" r=".9" fill="${C.ink}"/><path d="M-2 -37q2 1.6 4 0" stroke="${C.ink}" stroke-width=".9" fill="none"/>`
    + `<path d="M-8 -30l-7 8" stroke="${S.skin}" stroke-width="4" stroke-linecap="round"/><rect x="-20" y="-26" width="9" height="6" rx="1" fill="${C.peony}"/>` + arm, frame);
}
