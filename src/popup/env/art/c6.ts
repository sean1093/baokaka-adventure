import { POPUP as C, POPUP_STATION as T, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, sparkle, type KitCtx } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 6 (松山機場, 02:50) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#123) draws only the placeholders whose preset art
 * would mislead (D-77, D-81, D-84): 6-1's front window (the train's state part is a tab nobody
 * drives, which would draw as a pull-tab) and 6-6's 印章 (a pushable's default is a bead, and the
 * treasure itself is drawn by the goal). The chapter's art issue (#124) draws the palette kit, the
 * six backdrops and every other part.
 */

// ——— 6-1's front window ———

/** The window's frame (page (14, 226)–(206, 356)), in local units round the front panel's centre (80, 420). */
const PANE = { x: -66, y: -194, w: 192, h: 130 };

/** Two rails and their sleepers from the window's foot to a vanishing point, bending by `bend`. */
function track(from: [number, number], to: [number, number], bend: number, colour: string): string {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const cx = (x0 + x1) / 2 + bend;
  const cy = (y0 + y1) / 2;
  const rail = (dx: number) => `M${f1(x0 + dx)} ${f1(y0)}Q${f1(cx + dx * 0.5)} ${f1(cy)} ${f1(x1 + dx * 0.15)} ${f1(y1)}`;
  return `<path d="${rail(-14)}${rail(14)}" stroke="${colour}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
}

/**
 * 6-1's driverless train, as its front window shows it (a `tab` nobody drives: printed art per
 * state, D-79), local origin at the front panel's centre (80, 420). The window over the night
 * track: at the `junction` the rails fork (the depot loop bending away left, the airport branch
 * straight on to a far 「松山機場」); on the `loop` the rails curve round the depot past its shed
 * (where the 土地公 waves); at the `airport` the station's platform lights and its sign fill the
 * glass. Under it the front panel: no driver, just a speaker grille and a lamp that waits for 嗶！.
 */
const frontWindow: PartSource = {
  preset: 'tab',
  states: ['junction', 'loop', 'airport'],
  box: { x: -72, y: -200, w: 204, h: 236 },
  draw(ctx: KitCtx, state) {
    const { x, y, w, h } = PANE;
    const frame = `M${x - 6} ${y - 6}H${x + w + 6}V${y + h + 6}H${x - 6}Z`;
    const glass = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.nightCardDeep}"/>`
      + `<rect x="${x}" y="${y + h * 0.55}" width="${w}" height="${h * 0.45}" rx="10" fill="${mixHex(C.nightCardDeep, C.printDark, 0.5)}"/>`;
    const foot: [number, number] = [x + w / 2, y + h];
    let view = '';
    if (state === 'junction') {
      view = track(foot, [x + 40, y + 58], -40, T.steel) + track(foot, [x + w / 2 + 30, y + 52], 6, T.steel)
        + `<circle cx="${x + w / 2 + 10}" cy="${y + 70}" r="3" fill="${C.lampHot}"/>`
        + `<text data-art-text="" x="${x + w / 2 + 34}" y="${y + 44}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.lampAmber}">松山機場</text>`;
    } else if (state === 'loop') {
      view = track(foot, [x + 30, y + 70], -90, T.steel)
        + `<path d="M${x + 60} ${y + 56}h46v-18l-23 -12l-23 12z" fill="${T.navyLight}"/><rect x="${x + 76}" y="${y + 42}" width="14" height="14" fill="${C.lampAmber}" opacity=".8"/>`;
    } else {
      view = `<path d="M${x} ${y + h}L${x + 60} ${y + 70}H${x + w}V${y + h}Z" fill="${T.granite}"/>`
        + `<path d="M${x + 60} ${y + 70}H${x + w}" stroke="${C.marigoldLight}" stroke-width="2" stroke-dasharray="6 4" opacity=".7"/>`
        + `<rect x="${x + 96}" y="${y + 22}" width="76" height="22" rx="3" fill="${T.navy}"/>`
        + `<text data-art-text="" x="${x + 134}" y="${y + 38}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.chalk}">松山機場</text>`
        + softEllipse(ctx, x + 134, y + 60, 60, 16, 'lamp', 0.35, 'blur8');
    }
    const shine = `<path d="M${x + 8} ${y + 8}L${x + 50} ${y + 8}L${x + 8} ${y + 60}Z" fill="${C.glassine}" opacity=".16"/>`;
    const pane = depth(ctx, 3, `<path d="${frame}" fill="${T.steelDeep}"/>${glass}${view}${shine}`, `<path d="${frame}"/>`);
    // The front panel: a speaker grille and the lamp that waits for a beep
    const panelBody = 'M-36 -24H36Q40 -24 40 -20V26H-40V-20Q-40 -24 -36 -24Z';
    const panel = depth(ctx, 2, `<path d="${panelBody}" fill="${T.carWallShade}"/>`
      + `<path d="M-26 -10h30M-26 -3h30M-26 4h30M-26 11h30" stroke="${T.steelDeep}" stroke-width="2" stroke-linecap="round"/>`
      + `<circle cx="22" cy="0" r="7" fill="${state === 'junction' ? C.wordBeep : C.doneGreen}" stroke="${T.steelDeep}" stroke-width="1.4"/>`, `<path d="${panelBody}"/>`);
    return pane + panel;
  },
};

// ——— 6-6's 印章 ———

/**
 * 6-6's 印章 as Mocha knocks it off the counter (a pushable, C3), local origin at its hit centre.
 * While it stands on the counter (`onPerch`) and once it has landed the goal draws the treasure
 * there (`treasureOnPage`), so this draws only a faint ink ring under it; `falling`, it is the
 * 印章 tumbling — a turned wooden handle over a red seal base.
 */
const stamp: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -22, y: -26, w: 44, h: 52 },
  draw(ctx: KitCtx, state) {
    if (state !== 'falling') return `<ellipse cx="0" cy="14" rx="10" ry="2.6" fill="${C.sealDark}" opacity=".25"/>`;
    return `<g transform="rotate(28)">` + depth(ctx, 2, `<rect x="-9" y="2" width="18" height="10" rx="2" fill="${C.seal}"/>`
      + `<path d="M-7 12h14" stroke="${C.sealDark}" stroke-width="1.6"/>`
      + `<path d="M-4 2V-8Q-4 -14 0 -14Q4 -14 4 -8V2Z" fill="${C.wood}"/><circle cx="0" cy="-16" r="5" fill="${C.woodDeep}"/>`,
    `<path d="M-9 2H9V12H-9ZM-5 2V-20H5V2Z"/>`) + `</g>` + sparkle(ctx, 14, -14, 3.6);
  },
};

export const C6_PARTS: Readonly<Record<string, PartSource>> = {
  'c6/front-window': frontWindow,
  'c6/stamp': stamp,
};
