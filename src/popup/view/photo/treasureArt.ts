import { POPUP as C } from '../../../art/palette';
import { ref, softEllipse, sparkle, type KitCtx } from '../../art';
import { albumChapter } from '../../content/album';

/**
 * The chapter treasures as the spread and the photo draw them (GDD § 2.9, § 4.2; #103), flat SVG
 * in local units centred on (0, 0), about 40 units across. 雞腿 (chapter 1) is drawn; the other
 * chapters' treasures are a foil token with the treasure's first character until their chapters'
 * art issues draw them. Treasures are foil-trimmed (bible § 3.1: foil is the treasure's stock) and
 * never marigold (reserved for touchables). The caller's defs must hold `foil`.
 */

/** 雞腿: a glazed drumstick, the bone to the upper right, a foil band on the bone. */
function drumstick(ctx: KitCtx): string {
  return `<g transform="rotate(-28)">`
    // The shadow it casts on what it lies on
    + `<ellipse cx="2" cy="13" rx="17" ry="3.4" fill="${C.shadow}" opacity=".28"/>`
    // The bone, with its two knuckles, then the foil frill round it
    + `<rect x="7" y="-2.6" width="14" height="5.2" rx="2" fill="${C.bone}"/>`
    + `<circle cx="21.5" cy="-3.4" r="3.6" fill="${C.bone}"/><circle cx="21.5" cy="3.4" r="3.6" fill="${C.bone}"/>`
    + `<path d="M9 -2.6v5.2" stroke="${C.printShade}" stroke-width="1"/>`
    + `<path d="M6 -5.4l3 2l-3 2l3 2l-3 2l3 2" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="2.6" stroke-linejoin="round"/>`
    // The leg: the dark crust, the glazed meat over it, the shine and a few crisp spots
    + `<path d="M-6 -12C-19 -12 -23 0 -17 8C-11 15 1 14 6 8L9 2C11 -4 7 -12 -6 -12Z" fill="${C.drumstickDeep}"/>`
    + `<path d="M-6 -10.5C-17 -10.5 -20.5 -0.5 -15.5 6.5C-10.5 12.5 0 11.5 4.5 6.5L7.5 1.5C9.5 -3.5 5.5 -10.5 -6 -10.5Z" fill="${C.drumstick}"/>`
    + `<path d="M-15 -2C-13 -7.5 -7.5 -8.5 -3 -7.5" fill="none" stroke="${C.drumstickGlaze}" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`
    + `<g fill="${C.drumstickDeep}" opacity=".55"><circle cx="-9" cy="2" r="1.1"/><circle cx="-4" cy="5" r=".9"/><circle cx="-12" cy="6" r=".8"/><circle cx="-1" cy="-1" r=".8"/></g>`
    + `</g>`;
}

/** A treasure not drawn yet: a foil token with its first character. */
function token(ctx: KitCtx, name: string): string {
  return `<ellipse cx="1" cy="17" rx="15" ry="3" fill="${C.shadow}" opacity=".28"/>`
    + `<circle r="16" fill="${ref(ctx, 'foil')}"/><circle r="13" fill="none" stroke="${C.goldDeep}" stroke-width="1.2"/>`
    + `<text data-art-text="" y="6" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="900" font-size="16" fill="${C.foilInk}">${name.slice(0, 1)}</text>`;
}

/** The chapter's treasure, centred on (0, 0). */
export function treasureArt(ctx: KitCtx, chapter: number): string {
  return chapter === 1 ? drumstick(ctx) : token(ctx, albumChapter(chapter).treasure);
}

/** The treasure where it lies on the spread: in its cup of foil light, with two glints (like the bead). */
export function treasureOnPage(ctx: KitCtx, chapter: number): string {
  return softEllipse(ctx, 0, 0, 30, 30, 'foil', 0.26, 'blur8') + `<g transform="scale(1.15)">${treasureArt(ctx, chapter)}</g>`
    + sparkle(ctx, -20, -16, 6) + sparkle(ctx, 19, -21, 4.5);
}
