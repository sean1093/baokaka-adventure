import { POPUP as C } from '../../../art/palette';
import { depth, softEllipse, type KitCtx } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 3 (台灣大學, 01:20) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#116) draws only the pieces a preset placeholder
 * can't show at all: a slider draws its marigold knob, not the thing it moves, so 3-2's bikes and
 * 3-5's shelves get a drawing per state (the view lays a tab's or slider's bitmap under its knob,
 * and draws one that nobody drives as printed card). The chapter's art issue (#117) draws the
 * backdrops, the cast and the rest, and restyles these in the campus kit.
 */

// ——— 3-2's bikes ———

/** Where a bike's wheels sit per state, in its part's local space (origin at the hit centre). */
const BIKE_Y: Readonly<Record<string, number>> = { path: 18, rack: -32 };

/** The rack's hoop, where a bike parks: printed lilac card, drawn in both states so the slot reads. */
const rackHoop = `<path d="M-26 -14V-40q0 -10 10 -10h32q10 0 10 10V-14" stroke="${C.printLilacDeep}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;

/**
 * A parked campus bike, side on, facing +x: two spoked wheels, a lilac frame, a saddle and swept
 * handlebars, with `extra` (the delivery box) drawn over its rear rack. Wheel centres at y `wy`.
 */
function bike(ctx: KitCtx, wy: number, extra = ''): string {
  const wheel = (x: number) => `M${x - 12} ${wy}a12 12 0 1 0 24 0a12 12 0 1 0 -24 0z`;
  const spokes = (x: number) => `M${x - 9} ${wy}H${x + 9}M${x} ${wy - 9}V${wy + 9}M${x - 6} ${wy - 6}L${x + 6} ${wy + 6}M${x - 6} ${wy + 6}L${x + 6} ${wy - 6}`;
  const frame = `M-18 ${wy}L-6 ${wy - 22}H12L18 ${wy}M-6 ${wy - 22}L2 ${wy}L12 ${wy - 22}M-18 ${wy}H2`;
  const outline = `<path d="${wheel(-18)}${wheel(18)}"/><path d="M-10 ${wy - 30}h14v6h-14zM8 ${wy - 32}h12v6h-12z"/>`;
  return softEllipse(ctx, 0, wy + 13, 34, 3.2, 'shadow', 0.4)
    + depth(ctx, 2, `<path d="${wheel(-18)}${wheel(18)}" fill="none" stroke="${C.printDark}" stroke-width="3.6"/>`
      + `<path d="${spokes(-18)}${spokes(18)}" stroke="${C.printLilac}" stroke-width=".8"/>`
      + `<path d="${frame}" stroke="${C.printLilacDeep}" stroke-width="3" fill="none" stroke-linejoin="round"/>`
      + `<path d="M-6 ${wy - 22}l-2 -6M12 ${wy - 22}l2 -8" stroke="${C.printDark}" stroke-width="2.4"/>`
      + `<path d="M-14 ${wy - 30}h12a3 3 0 0 1 0 6h-12z" fill="${C.printDark}"/>`
      + `<path d="M10 ${wy - 31}q6 -3 12 1" stroke="${C.printDark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      + extra, outline);
}

/**
 * 3-2's parked bikes (`slider` `path` / `rack`; the knob is the handlebar grip the player pulls):
 * across the path in front of the palms, or pushed back into the rack's hoop.
 */
const campusBike: PartSource = {
  preset: 'slider',
  states: ['path', 'rack'],
  box: { x: -46, y: -66, w: 92, h: 116 },
  draw: (ctx, state) => rackHoop + bike(ctx, BIKE_Y[state] ?? BIKE_Y.path),
};

/**
 * 3-2's middle bike, the 店員小哥's delivery bike (`slider` with no input: its neighbours shove it):
 * the same bike with a red delivery box on its rear rack. Mocha's `seat` perch is its saddle.
 */
const deliveryBike: PartSource = {
  preset: 'slider',
  states: ['path', 'rack'],
  box: { x: -46, y: -78, w: 92, h: 128 },
  draw(ctx, state) {
    const wy = BIKE_Y[state] ?? BIKE_Y.path;
    const box = `<rect x="-30" y="${wy - 46}" width="22" height="18" rx="2" fill="${C.peony}"/>`
      + `<path d="M-30 ${wy - 40}h22" stroke="${C.peonyDeep}" stroke-width="1.4"/><circle cx="-19" cy="${wy - 35}" r="2.4" fill="${C.cutRim}" opacity=".8"/>`;
    return rackHoop + bike(ctx, wy, box);
  },
};

// ——— 3-5's mobile shelves ———

/** The colours of the books' spines, in a fixed order (every shelf reads as full). */
const SPINES = [C.peony, C.washiCeladon, C.kraft, C.printLilac, C.nightCard, C.washiPink, C.corrugatedLight, C.flapFace];

/**
 * A compact-shelving unit seen end-on, side by side with its neighbours: a tall kraft-edged card,
 * five rows of book spines, a lilac cap with its washi label. `top` and `bottom` are its
 * local y extent; `dx` is where it stands in this state.
 */
function shelfUnit(ctx: KitCtx, dx: number, top: number, bottom: number): string {
  const w = 34;
  const x0 = dx - w / 2;
  const rows = 5;
  const rh = (bottom - top - 12) / rows;
  let books = '';
  for (let r = 0; r < rows; r++) {
    const y = top + 8 + r * rh;
    for (let i = 0; i < 5; i++) {
      const bw = 5.2;
      const bx = x0 + 3 + i * 5.8;
      const bh = rh - 6 - ((i * 7 + r * 3) % 5);
      books += `<rect x="${bx.toFixed(1)}" y="${(y + rh - 3 - bh).toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" fill="${SPINES[(i + r * 3) % SPINES.length]}"/>`;
    }
    books += `<rect x="${x0 + 2}" y="${(y + rh - 3).toFixed(1)}" width="${w - 4}" height="2.6" fill="${C.kraftDark}"/>`;
  }
  const body = `<rect x="${x0}" y="${top}" width="${w}" height="${bottom - top}" rx="2"/>`;
  return softEllipse(ctx, dx, bottom + 2, 22, 3, 'shadow', 0.45)
    + depth(ctx, 3, `<rect x="${x0}" y="${top}" width="${w}" height="${bottom - top}" rx="2" fill="${C.kraft}"/>`
      + `<rect x="${x0 + 2}" y="${top + 2}" width="${w - 4}" height="${bottom - top - 4}" fill="${C.nightInk}"/>` + books
      + `<rect x="${x0}" y="${top}" width="${w}" height="5" fill="${C.printLilacDeep}"/>`
      + `<rect x="${dx - 7}" y="${top + 1}" width="14" height="3" rx="1" fill="${C.washi}"/>`
      + `<path d="M${x0 + 4} ${bottom}v4M${x0 + w - 4} ${bottom}v4" stroke="${C.printDark}" stroke-width="3" stroke-linecap="round"/>`, body);
}

/** Half the travel between a shelf's two stops (they stand 24 apart). */
const SHELF_DX: Readonly<Record<string, number>> = { w: -12, e: 12 };

/**
 * 3-5's inner shelves (`slider` with no input: each rolls with its outer neighbour), drawn on
 * their hit area's centre (y 300–470 on the page: local −85 to 85).
 */
const shelf: PartSource = {
  preset: 'slider',
  states: ['w', 'e'],
  box: { x: -34, y: -90, w: 68, h: 184 },
  draw: (ctx, state) => shelfUnit(ctx, SHELF_DX[state] ?? 0, -85, 85),
};

/**
 * 3-5's end shelves (`slider`; the knob is the crank's handle down at the rail): the same unit,
 * drawn from the crank's centre on the rail (local y 0 = page y 544, the shelf at −244 to −74), with
 * the printed crank wheel on its end panel and the rail it rolls on.
 */
const shelfCrank: PartSource = {
  preset: 'slider',
  states: ['w', 'e'],
  box: { x: -40, y: -250, w: 80, h: 266 },
  draw(ctx, state) {
    const dx = SHELF_DX[state] ?? 0;
    const rail = `<path d="M-30 -66H30" stroke="${C.printLilacDeep}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
    const crank = `<circle cx="${dx}" cy="-120" r="9" fill="none" stroke="${C.printLilac}" stroke-width="2.4"/>`
      + `<path d="M${dx - 9} -120H${dx + 9}M${dx} -129V-111" stroke="${C.printLilac}" stroke-width="1.6"/>`
      + `<path d="M${dx} -111V-20" stroke="${C.printLilacDeep}" stroke-width="2" stroke-dasharray="2 4" opacity=".7"/>`;
    return rail + shelfUnit(ctx, dx, -244, -74) + crank;
  },
};

export const C3_PARTS: Readonly<Record<string, PartSource>> = {
  'c3/bike': campusBike,
  'c3/delivery-bike': deliveryBike,
  'c3/shelf': shelf,
  'c3/shelf-crank': shelfCrank,
};
