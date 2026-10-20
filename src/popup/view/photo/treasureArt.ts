import { POPUP as C, POPUP_CAMPUS as K } from '../../../art/palette';
import { ref, softEllipse, sparkle, type KitCtx } from '../../art';
import { albumChapter } from '../../content/album';

/**
 * The chapter treasures as the spread and the photo draw them (GDD § 2.9, § 4.2; #103), flat SVG
 * in local units centred on (0, 0), about 40 units across. 雞腿 (chapter 1), 畫筆 (chapter 2,
 * #115) and 書 (chapter 3, #117) are drawn; the other chapters' treasures are a foil token with the treasure's first
 * character until their chapters' art issues draw them. Treasures are foil-trimmed (bible § 3.1: foil is the treasure's stock) and
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

/**
 * 畫筆 (chapter 2, #115): a fat child's paintbrush, its handle red lacquer with a cream tip, a foil
 * ferrule, the bristles dipped in the park's green with a drop on its point; laid at a slant.
 */
function paintbrush(ctx: KitCtx): string {
  return `<g transform="rotate(-34)">`
    + `<ellipse cx="0" cy="13" rx="19" ry="3.2" fill="${C.shadow}" opacity=".28"/>`
    // The handle: lacquered red, a cream end, a lit edge
    + `<path d="M-2 -3.2H17Q21 -3.2 21 0Q21 3.2 17 3.2H-2Z" fill="${C.hatRed}"/><path d="M15 -3.2h2q4 0 4 3.2q0 3.2 -4 3.2h-2z" fill="${C.bone}"/>`
    + `<path d="M0 -2H16" stroke="${C.peonyLight}" stroke-width="1" opacity=".8"/>`
    // The foil ferrule with its crimp lines
    + `<rect x="-9" y="-4.2" width="8" height="8.4" rx="1" fill="${ref(ctx, 'foil')}"/><path d="M-6.6 -4.2v8.4M-3.4 -4.2v8.4" stroke="${C.goldDeep}" stroke-width=".7"/>`
    // The bristles, dipped in green, a drop on the point
    + `<path d="M-9 -4.2Q-17 -4.6 -22 0Q-17 4.6 -9 4.2Z" fill="${C.bone}"/><path d="M-14 -3.6Q-19 -2.4 -22 0Q-19 2.4 -14 3.6Z" fill="${C.quiltLeaf}"/>`
    + `<path d="M-11 -2.6L-19 -.6M-11 0H-20M-11 2.6L-19 .6" stroke="${C.kraftDark}" stroke-width=".5" opacity=".6"/>`
    + `<circle cx="-24" cy="2.6" r="1.8" fill="${C.quiltLeaf}"/>`
    + `</g>`;
}

/**
 * 書 (chapter 3, #117): a small clothbound book, closed, laid at a slant: a lake-blue cover with
 * foil corners and a foil 「書」 on it, the cream page block showing, a red ribbon bookmark.
 */
function book(ctx: KitCtx): string {
  return `<g transform="rotate(-12)">`
    + `<ellipse cx="2" cy="15" rx="20" ry="3.4" fill="${C.shadow}" opacity=".28"/>`
    // The page block under the cover, then the back board's edge
    + `<path d="M-17 -10H17V12H-17Z" fill="${K.pageEdge}"/><path d="M-15 -4H15M-15 1H15M-15 6H15" stroke="${K.pageEdgeShade}" stroke-width=".7"/>`
    + `<path d="M-19 10H19V14H-19Z" fill="${K.magpieDeep}"/>`
    // The ribbon falling out of the pages
    + `<path d="M6 10l2 9l2.4 -2.6l2.6 2.4l-1 -9z" fill="${K.bookRed}"/>`
    // The front board: blue cloth, its spine band, foil corners, the foil title
    + `<path d="M-19 -14H17Q19 -14 19 -12V8H-19Z" fill="${K.magpie}"/><path d="M-19 -14H-12V8H-19Z" fill="${K.magpieDeep}"/>`
    + `<path d="M19 -14V-8L13 -14ZM19 8V2L13 8Z" fill="${ref(ctx, 'foil')}"/><path d="M-12 -12V6" stroke="${ref(ctx, 'foil')}" stroke-width="1.2"/>`
    + `<rect x="-4" y="-10" width="16" height="14" rx="1.5" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1"/>`
    + `<text data-art-text="" x="4" y="1.6" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="900" font-size="10" fill="${C.goldLight}">書</text>`
    + `<path d="M-18 -13.2H17" stroke="${C.cutRim}" stroke-width=".8" opacity=".5"/>`
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
  if (chapter === 1) return drumstick(ctx);
  if (chapter === 2) return paintbrush(ctx);
  if (chapter === 3) return book(ctx);
  return token(ctx, albumChapter(chapter).treasure);
}

/** The treasure where it lies on the spread: in its cup of foil light, with two glints (like the bead). */
export function treasureOnPage(ctx: KitCtx, chapter: number): string {
  return softEllipse(ctx, 0, 0, 30, 30, 'foil', 0.26, 'blur8') + `<g transform="scale(1.15)">${treasureArt(ctx, chapter)}</g>`
    + sparkle(ctx, -20, -16, 6) + sparkle(ctx, 19, -21, 4.5);
}
