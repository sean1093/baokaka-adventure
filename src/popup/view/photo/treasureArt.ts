import { POPUP as C, POPUP_AIRPORT as A, POPUP_BEITOU as BT, POPUP_CAMPUS as K, POPUP_MAOKONG as G, POPUP_MARKET as M, POPUP_TAMSUI as W } from '../../../art/palette';
import { f1, ref, softEllipse, sparkle, type KitCtx } from '../../art';
import { albumChapter } from '../../content/album';

/**
 * The chapter treasures as the spread and the photo draw them (GDD § 2.9, § 4.2; #103), flat SVG
 * in local units centred on (0, 0), about 40 units across. 雞腿 (chapter 1), 畫筆 (chapter 2,
 * #115), 書 (chapter 3, #117), 麥克風 (chapter 4, #119), 蔥 (chapter 5, #122), 印章 (chapter 6, #124), 芹菜 (chapter 7, #126), 算盤 (chapter 8, #130) and 聽診器 (chapter 9, #132) are drawn; the other chapters' treasures are a foil token with the treasure's first
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

/**
 * 麥克風 (chapter 4, #119): a hand-held microphone laid at a slant — its round head in silver foil
 * (bible § 3.1: microphone heads are silver) with a mesh and a gold band, a dark handle with a neon
 * pink stripe and its switch, a little sparkle.
 */
function microphone(ctx: KitCtx): string {
  return `<g transform="rotate(32)">`
    + `<ellipse cx="2" cy="18" rx="14" ry="3" fill="${C.shadow}" opacity=".28" transform="rotate(-32)"/>`
    // The handle: tapering, dark, the pink stripe and the switch
    + `<path d="M-5 4L-3.4 26Q0 29 3.4 26L5 4Z" fill="${C.printDark}"/><path d="M-4.4 12h8.8" stroke="${C.neonPink}" stroke-width="2"/>`
    + `<rect x="-1.6" y="16" width="3.2" height="5" rx="1" fill="${C.printLilac}"/><path d="M-3.6 5L-2.4 24" stroke="${C.cutRim}" stroke-width=".8" opacity=".4"/>`
    // The gold band and the silver head with its mesh
    + `<rect x="-7" y="0" width="14" height="5" rx="1.6" fill="${ref(ctx, 'foil')}"/>`
    + `<circle cy="-9" r="11" fill="${C.printLilac}"/><circle cx="2.4" cy="-7" r="8.4" fill="${C.printLilacDeep}" opacity=".45"/>`
    + `<path d="M-10 -12H10M-11 -8H11M-10 -4H10M-6 -19V1M-2 -20V2M2 -20V2M6 -19V1" stroke="${C.foilShine}" stroke-width=".6" opacity=".7"/>`
    + `<circle cy="-9" r="11" fill="none" stroke="${C.printLilacDeep}" stroke-width="1"/><ellipse cx="-4" cy="-14" rx="3.4" ry="2.4" fill="${C.foilShine}" opacity=".9"/>`
    + `</g>` + sparkle(ctx, 16, -16, 4);
}

/**
 * 蔥 (chapter 5, #122; 聰明): two fresh scallions laid at a slant and tied with a foil band — white
 * bulbs with their little roots, the pale stalks greening up into hollow leaves (one leaf folded
 * over), a gleam on the band.
 */
function scallion(ctx: KitCtx): string {
  const stalk = (dy: number, bend: number) => `M-20 ${dy}Q0 ${dy - 2} 14 ${dy - 6}Q20 ${dy - 8 + bend} 24 ${dy - 14 + bend}`;
  return `<g transform="rotate(-18)">`
    + `<ellipse cx="0" cy="14" rx="22" ry="3" fill="${C.shadow}" opacity=".28"/>`
    // Roots, then the white bulbs and stalks greening into leaves
    + `<path d="M-22 1l-5 -2M-22 3l-6 1M-22 5l-5 3M-21 8l-6 1M-21 10l-4 4" stroke="${M.awningCreamShade}" stroke-width=".8" stroke-linecap="round"/>`
    + `<path d="${stalk(4, 0)}" stroke="${M.scallionDeep}" stroke-width="5.6" fill="none" stroke-linecap="round"/><path d="${stalk(9, 4)}" stroke="${M.scallion}" stroke-width="5.6" fill="none" stroke-linecap="round"/>`
    + `<path d="M-21 4H-6M-21 9H-6" stroke="${M.scallionWhite}" stroke-width="5.8" stroke-linecap="round"/>`
    + `<path d="M-6 4h8M-6 9h8" stroke="${M.scallionLight}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`
    // A leaf folded over the top, and the leaves' fine light lines
    + `<path d="M14 -2Q24 -16 30 -10Q24 -8 18 0" fill="${M.scallion}"/><path d="M0 2.6h12M0 7.6h12" stroke="${M.scallionLight}" stroke-width="1" stroke-linecap="round"/>`
    // The foil band
    + `<rect x="-10" y="0" width="6" height="13" rx="1.4" fill="${ref(ctx, 'foil')}"/><path d="M-8.6 1.4v10" stroke="${C.foilShine}" stroke-width=".9"/>`
    + `</g>` + sparkle(ctx, 18, -16, 4);
}

/**
 * 印章 (chapter 6, #124; 有印象, a good memory): the customs officer's passport stamp, which literally
 * reuses the seal style (bible § 6 row 6) — a turned wooden handle with a foil collar over a red
 * seal base, standing beside a fresh imprint: a red ring with a little plane and 松山 in it.
 */
function passportStamp(ctx: KitCtx): string {
  const plane = 'M0 -6q1 0 1 2v2.4l5 3v1.4l-5 -1.4v3l1.6 1.2v1l-2.6 -.8l-2.6 .8v-1l1.6 -1.2v-3l-5 1.4v-1.4l5 -3v-2.4q0 -2 1 -2z';
  return `<ellipse cx="2" cy="17" rx="20" ry="3" fill="${C.shadow}" opacity=".28"/>`
    // The imprint, left, a little tilted
    + `<g transform="translate(-9 8) rotate(-12)"><circle r="10" fill="none" stroke="${C.seal}" stroke-width="1.6" opacity=".85"/><circle r="7.4" fill="none" stroke="${C.seal}" stroke-width=".7" opacity=".85"/>`
    + `<path d="${plane}" fill="${C.seal}" opacity=".85" transform="scale(.7) rotate(-45)"/>`
    + `<text data-art-text="" y="9.4" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="900" font-size="3.6" fill="${C.seal}" opacity=".85">松山</text></g>`
    // The stamp, right: red base, foil collar, wooden handle with its knob
    + `<g transform="translate(9 0)"><rect x="-9" y="6" width="18" height="9" rx="2" fill="${C.seal}"/><path d="M-9 13h18" stroke="${C.sealDark}" stroke-width="1.6"/>`
    + `<rect x="-6" y="3" width="12" height="4" rx="1" fill="${ref(ctx, 'foil')}"/>`
    + `<path d="M-3.6 3V-8Q-3.6 -12 0 -12Q3.6 -12 3.6 -8V3Z" fill="${A.counterLight}"/><circle cy="-14" r="5" fill="${A.counter}"/>`
    + `<path d="M-2 -15.6q2 -2 4 -1M-2 -9v10" stroke="${C.cutRim}" stroke-width=".8" fill="none" opacity=".5"/></g>`
    + sparkle(ctx, 18, -14, 4);
}

/**
 * 芹菜 (chapter 7, #126; 勤勞, hard-working): a bunch of fresh celery laid at a slant — pale ribbed
 * stalks greening toward their tops, a spray of bright leaves, the cut ends below, tied with a foil
 * band; a little dew sparkles on it.
 */
function celery(ctx: KitCtx): string {
  const stalk = (dy: number, len: number, bend: number) => `M-20 ${dy}Q${f1(len * 0.4)} ${f1(dy - 2)} ${f1(len)} ${f1(dy - 8 + bend)}`;
  const leaf = (x: number, y: number, a: number, s: number) => `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0q4 -6 2 -12q5 2 6 7q3 -4 7 -3q-2 5 -6 7q4 1 6 5q-6 1 -10 -2q0 5 -5 6q0 -5 0 -8z"/>`;
  return `<g transform="rotate(-24)">`
    + `<ellipse cx="0" cy="13" rx="23" ry="3" fill="${C.shadow}" opacity=".28"/>`
    // The leaves first (behind the stalks' tops), then the stalks, the cut ends, the foil band
    + `<g fill="${G.celery}">${leaf(14, -8, -20, 0.9)}${leaf(20, -2, 10, 1)}${leaf(16, 4, 30, 0.8)}${leaf(24, -10, -40, 0.7)}</g>`
    + `<g fill="${G.celeryDeep}" opacity=".6">${leaf(18, -4, 0, 0.5)}${leaf(22, 2, 40, 0.45)}</g>`
    + `<path d="${stalk(2, 18, 0)}" stroke="${G.celeryDeep}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    + `<path d="${stalk(7, 20, 3)}" stroke="${G.celery}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    + `<path d="${stalk(12, 16, 6)}" stroke="${G.celeryLight}" stroke-width="5.4" fill="none" stroke-linecap="round"/>`
    + `<path d="M-14 1H8M-14 6H10M-14 11H8" stroke="${G.celeryLight}" stroke-width=".8" opacity=".8"/>`
    + `<path d="M-22 1v12" stroke="${G.porcelainShade}" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="-11" y="-1" width="6" height="16" rx="1.4" fill="${ref(ctx, 'foil')}"/><path d="M-9.6 .4v13" stroke="${C.foilShine}" stroke-width=".9"/>`
    + `</g>` + sparkle(ctx, 16, -18, 4);
}

/**
 * 算盤 (chapter 8, #130; 會算錢, good with money): the bathhouse cashier's old abacus at a slant — a
 * rosewood frame with foil-capped corners, the beam across it, seven brass rods of ebony beads (two
 * above the beam, four below), a few beads pushed up to the beam as if counting; a glint.
 */
function abacus(ctx: KitCtx): string {
  const [w, h] = [44, 28];
  const beam = -h / 2 + 9;
  const rods = Array.from({ length: 7 }, (_, i) => -w / 2 + 5 + i * ((w - 10) / 6));
  const bead = (x: number, y: number) => `M${f1(x - 2.8)} ${f1(y)}L${f1(x)} ${f1(y - 1.9)}L${f1(x + 2.8)} ${f1(y)}L${f1(x)} ${f1(y + 1.9)}Z`;
  let beads = '';
  rods.forEach((x, i) => {
    const up = i % 3 === 1;
    beads += bead(x, up ? beam - 2.4 : -h / 2 + 3.6) + bead(x, up ? beam - 6.2 : -h / 2 + 7.2);
    // Four below the beam, stacked at the bottom; on two rods the top one is pushed up to the beam (counting)
    const counted = i === 2 || i === 5;
    for (let k = 0; k < 4; k++) beads += bead(x, counted && k === 3 ? beam + 2.4 : h / 2 - 2.6 - k * 3.6);
  });
  // Few elements (it is drawn twice on 8-6, on the page and in his bubble, inside the animated budget):
  // the frame with its beam as one card, the rods, the beads, the foil corners
  const frame = `M${-w / 2 - 3} ${-h / 2 - 3}h${w + 6}v${h + 6}h${-w - 6}zM${-w / 2} ${-h / 2}v${beam - 1 + h / 2}h${w}v${-(beam - 1 + h / 2)}zM${-w / 2} ${beam + 1.4}v${h / 2 - beam - 1.4}h${w}v${-(h / 2 - beam - 1.4)}z`;
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => `M${f1(sx * (w / 2 + 1.5) - 2.5)} ${f1(sy * (h / 2 + 1.5) - 2.5)}h5v5h-5z`).join('');
  return `<g transform="rotate(-16)">`
    + `<ellipse cx="0" cy="${h / 2 + 4}" rx="24" ry="3" fill="${C.shadow}" opacity=".28"/>`
    + `<path d="${frame}" fill-rule="evenodd" fill="${BT.cedarDeep}"/>`
    + `<path d="${rods.map((x) => `M${f1(x)} ${-h / 2}V${h / 2}`).join('')}" stroke="${BT.brass}" stroke-width=".9"/>`
    + `<path d="${beads}" fill="${BT.ebony}" stroke="${BT.ebonyLit}" stroke-width=".5"/>`
    + `<path d="${corners}" fill="${ref(ctx, 'foil')}"/>`
    + `</g>` + sparkle(ctx, 20, -16, 4);
}

/**
 * 聽診器 (chapter 9, #132; 當醫生, to be a doctor): a stethoscope hung in a loop — the two silver ear
 * tubes and their tips at the top, the dark rubber tube curving down and round, the foil chest piece
 * with its pale diaphragm at the bottom; a glint. Few elements (drawn twice on 9-6: on the page and in
 * his bubble, inside the animated budget): the ear tubes, the tube, the chest piece, its face.
 */
function stethoscope(ctx: KitCtx): string {
  return `<ellipse cx="2" cy="19" rx="16" ry="2.6" fill="${C.shadow}" opacity=".28"/>`
    // The ear tubes (a silver Y) with their round tips
    + `<path d="M-10 -18Q-12 -6 -2 -2M10 -18Q12 -6 2 -2M-12.4 -18.4h4.8M7.6 -18.4h4.8" stroke="${W.steel}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    // The rubber tube from the Y down and round to the chest piece
    + `<path d="M0 -2Q0 8 -8 12Q-16 16 -10 20Q-2 24 8 16Q14 10 12 4" stroke="${W.tube}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    + `<path d="M-1 0Q-1 7 -7 10.6" stroke="${W.tubeLit}" stroke-width="1" fill="none" stroke-linecap="round"/>`
    // The chest piece: foil rim, a pale diaphragm
    + `<circle cx="13" cy="1" r="6.4" fill="${ref(ctx, 'foil')}"/><circle cx="13" cy="1" r="4" fill="${C.glassine}"/>`
    + sparkle(ctx, 19, -12, 4);
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
  if (chapter === 4) return microphone(ctx);
  if (chapter === 5) return scallion(ctx);
  if (chapter === 6) return passportStamp(ctx);
  if (chapter === 7) return celery(ctx);
  if (chapter === 8) return abacus(ctx);
  if (chapter === 9) return stethoscope(ctx);
  return token(ctx, albumChapter(chapter).treasure);
}

/** The treasure where it lies on the spread: in its cup of foil light, with two glints (like the bead). */
export function treasureOnPage(ctx: KitCtx, chapter: number): string {
  return softEllipse(ctx, 0, 0, 30, 30, 'foil', 0.26, 'blur8') + `<g transform="scale(1.15)">${treasureArt(ctx, chapter)}</g>`
    + sparkle(ctx, -20, -16, 6) + sparkle(ctx, 19, -21, 4.5);
}
