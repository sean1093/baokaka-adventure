import { POPUP as C, mixHex } from '../../../art/palette';
import { depth, f1, scallopBand, softEllipse } from '../../art';
import type { KitCtx } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 8 (北投, 04:00) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#129) draws only the placeholders whose preset art
 * would mislead (D-77, D-81, D-84, D-86, D-89): the steam (the blowable preset is one cloud in
 * every state, so steam blown away would still hang there), 8-3's sun hat and 8-4's pinwheel (also
 * blowables: a cloud) and book lift (the loop preset is a level belt; its tray is a rider,
 * `view/art/beitou.ts`), 8-2's paper clouds and 8-5's wooden tubs and water (the lift preset is a bare
 * platform on cords), 8-1's seat cushions (the button preset is a push button) and 8-6's counter bell and
 * 番台 window. Baked, they also keep 8-6 inside the animated-node budget. The touchables (the
 * valves, the tap, the window, the abacus rods) keep their preset's live art: the affordance lint
 * reads their marigold. The chapter's art issue (#130) draws the palette kit, the six backdrops
 * and every part.
 */

/** A paper cloud (vellum over card), `w` wide, its flat base at y 0 and its puffs above. */
function paperCloud(ctx: KitCtx, w: number, h: number, seed: number, opacity = 0.9): string {
  const d = scallopBand(-w / 2, w / 2, -h, 0, seed, h * 0.35, Math.max(14, w / 4));
  return depth(ctx, 2, `<path d="${d}" fill="${C.vellum}" opacity="${opacity}"/><path d="${d}" fill="none" stroke="${C.standeeCard}" stroke-width="1.4"/>`, `<path d="${d}"/>`);
}

// ——— 8-1's seat cushions (a `button` each: the dent he leaves) ———

/** A flat cushion on a wooden seat, its centre at the origin; `down`, dented where he sat. */
const seatCushion: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -26, y: -14, w: 54, h: 24 },
  draw(ctx, state) {
    const down = state === 'down';
    const top = down ? 'M-22 2Q-12 -2 -6 1Q0 4 6 1Q12 -2 22 2V8H-22Z' : 'M-22 2Q0 -8 22 2V8H-22Z';
    return depth(ctx, 1, `<path d="${top}" fill="${C.washiPink}"/><path d="M-22 8H22" stroke="${C.peonyDeep}" stroke-width="1.6"/>`
      + `<path d="M-14 4h28" stroke="${C.standeeCard}" stroke-width=".8" opacity=".6" stroke-dasharray="2 2"/>`, `<path d="${top}"/>`);
  },
};

// ——— Steam ———

/**
 * Steam over a boardwalk or a counter (a `blowable`: `fog` / `clear`), its centre at the origin:
 * fogged, billows of vellum, densest low down; blown clear, two thin wisps curling away.
 */
const steam: PartSource = {
  preset: 'blowable',
  states: ['fog', 'clear'],
  box: { x: -44, y: -50, w: 88, h: 98 },
  draw(_ctx, state) {
    if (state === 'clear') {
      return `<g stroke="${C.vellum}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55">`
        + '<path d="M-20 24q-6 -10 2 -18t0 -18"/><path d="M14 28q6 -10 -2 -18t2 -16"/></g>';
    }
    // Billows of vellum, densest low down, thinning as they rise
    const puffs: readonly (readonly [number, number, number, number])[] = [
      [-24, 26, 16, 0.75], [0, 30, 18, 0.8], [24, 24, 15, 0.75], [-14, 6, 15, 0.7], [12, 4, 16, 0.7],
      [-2, -14, 14, 0.6], [-18, -24, 10, 0.45], [14, -28, 11, 0.45],
    ];
    return puffs.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.vellum}" opacity="${o}"/>`).join('')
      + `<path d="M-30 30q8 -6 16 0t16 0t16 0t16 0" stroke="${C.standeeCard}" stroke-width="1.2" fill="none" opacity=".6"/>`
      + `<path d="M-8 -30q-6 -8 0 -14M10 -36q6 -6 0 -12" stroke="${C.vellum}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`;
  },
};

// ——— 8-2's paper clouds over the vents (a `lift`, drawn where its node is: he sits on top) ———

const steamCloud: PartSource = {
  preset: 'lift',
  states: ['down', 'up'],
  box: { x: -38, y: -8, w: 76, h: 40 },
  draw(ctx, state) {
    // Up, it floats on a column of steam; down, it sags on its vent
    const rise = state === 'up'
      ? `<path d="M-10 28q-4 -8 2 -14M10 30q4 -8 -2 -14" stroke="${C.vellum}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>` : '';
    return rise + `<g transform="translate(0 ${state === 'up' ? 14 : 10}) scale(1 -1)">${paperCloud(ctx, 64, state === 'up' ? 16 : 12, 84)}</g>`
      + `<path d="M-28 0H28" stroke="${C.standeeCard}" stroke-width="1.6" stroke-linecap="round"/>`;
  },
};

// ——— 8-3's sun hat (a `blowable`: `on` her head / blown `off`) ———

/** The 溫泉阿嬤's straw sun hat, on her head at the origin; blown off, it tumbles up and away. */
const grannyHat: PartSource = {
  preset: 'blowable',
  states: ['on', 'off'],
  box: { x: -30, y: -46, w: 64, h: 62 },
  draw(ctx, state) {
    const hat = depth(ctx, 2, `<ellipse cx="0" cy="2" rx="20" ry="5" fill="${C.kraft}"/><path d="M-10 1Q-10 -12 0 -12Q10 -12 10 1Z" fill="${C.kraft}"/>`
      + `<path d="M-10 -2H10" stroke="${C.hatRed}" stroke-width="2.4"/><path d="M-16 3Q0 7 16 3" stroke="${C.kraftDark}" stroke-width=".8" fill="none"/>`,
    `<ellipse cx="0" cy="2" rx="20" ry="5"/>`);
    return state === 'off' ? `<g transform="translate(-4 -28) rotate(-28)">${hat}</g>` : hat;
  },
};

// ——— 8-4's pinwheel (a `blowable`: four quarter turns) ———

/** The pinwheel in the window box, its hub at the origin: four paper blades, a quarter turn a state. */
const pinwheel: PartSource = {
  preset: 'blowable',
  states: ['0', '1', '2', '3'],
  box: { x: -26, y: -26, w: 52, h: 60 },
  draw(ctx, state) {
    const blades = [C.washiPink, C.washiCeladon, C.printLilac, C.washi];
    const turn = Number(state) * 90;
    const blade = (i: number) => `<path d="M0 0L0 -20Q14 -16 0 0Z" fill="${blades[i]}" transform="rotate(${turn + i * 90})"/>`;
    return `<path d="M0 0V32" stroke="${C.woodDeep}" stroke-width="2.4" stroke-linecap="round"/>`
      + depth(ctx, 2, [0, 1, 2, 3].map(blade).join(''), '<circle r="20"/>')
      + `<circle r="2.6" fill="${C.printDark}"/>`;
  },
};

// ——— 8-5's wooden tubs (a `lift` each, drawn where its node is: he sits in it) ———

const woodenTub: PartSource = {
  preset: 'lift',
  states: ['low', 'mid', 'high'],
  box: { x: -30, y: -8, w: 60, h: 36 },
  draw(ctx) {
    const tub = 'M-24 -2H24L20 22H-20Z';
    return softEllipse(ctx, 0, 22, 22, 3, 'shadow', 0.3)
      + depth(ctx, 3, `<path d="${tub}" fill="${C.wood}"/><path d="M-23 4H23M-21.5 15H21.5" stroke="${C.woodDeep}" stroke-width="2"/>`
        + `<ellipse cx="0" cy="-2" rx="24" ry="4" fill="${C.woodDeep}"/><ellipse cx="0" cy="-2" rx="20" ry="2.6" fill="${mixHex(C.woodDeep, C.shadow, 0.3)}"/>`, `<path d="${tub}"/>`);
  },
};

// ——— 8-4's book lift (a `loop` the pinwheel drives: the belt itself; the tray is a rider) ———

/**
 * The book lift's belt (#129), drawn at its hit centre (the belt's middle): an upright loop of
 * canvas belt round a pulley at each floor, its slots (the ground floor 64 down, the reading room 68
 * up, the sides 36 out) on the belt. The same in every state: the tray rider shows where it is.
 */
const bookBelt: PartSource = {
  preset: 'loop',
  states: ['0', '1', '2', '3'],
  box: { x: -48, y: -84, w: 96, h: 168 },
  draw(ctx) {
    const loop = 'M-36 -2C-36 -52 -20 -68 0 -68C20 -68 36 -52 36 -2C36 48 20 64 0 64C-20 64 -36 48 -36 -2Z';
    const pulley = (y: number) => depth(ctx, 2, `<circle cy="${y}" r="10" fill="${C.printDark}"/><circle cy="${y}" r="6" fill="${C.nightCard}"/><circle cy="${y}" r="2" fill="${C.printDark}"/>`, `<circle cy="${y}" r="10"/>`);
    return `<path d="${loop}" fill="none" stroke="${C.kraftDark}" stroke-width="5"/><path d="${loop}" fill="none" stroke="${C.kraft}" stroke-width="1.6" stroke-dasharray="4 5"/>`
      + `<path d="M0 -58V54" stroke="${C.woodDeep}" stroke-width="3"/>` + pulley(-58) + pulley(54);
  },
};

// ——— 8-5's bath water (a `lift` with no node: its anchor rises up its hit area per level) ———

/**
 * The bath's water (#129), drawn at its level's anchor (the hit area's bottom when drained, its
 * middle half full, its top full; `MoverView`): the water from just under the tubs' rims down to
 * the bath's front lip (y 540), across the bath. Drained, nothing.
 */
const bathWater: PartSource = {
  preset: 'lift',
  states: ['low', 'mid', 'high'],
  box: { x: -108, y: 0, w: 216, h: 100 },
  draw(_ctx, state) {
    if (state === 'low') return '';
    const depthBelow = state === 'mid' ? 61 : 94;
    return `<rect x="-104" y="10" width="208" height="${depthBelow - 10}" fill="${C.washiCeladon}" opacity=".55"/>`
      + `<path d="M-104 10q13 -3 26 0t26 0t26 0t26 0t26 0t26 0t26 0t26 0" stroke="${C.standeeCard}" stroke-width="1.4" fill="none" opacity=".7"/>`;
  },
};

// ——— 8-6's counter bell and the 番台's window ———

/** A silver counter bell, its base at the origin; rung (`down`), the plunger pressed and a ring of sound. */
const counterBell: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -24, y: -26, w: 48, h: 34 },
  draw(ctx, state) {
    const down = state === 'down';
    const dome = 'M-12 4Q-12 -10 0 -10Q12 -10 12 4Z';
    return depth(ctx, 2, `<rect x="-14" y="4" width="28" height="4" rx="1" fill="${C.printDark}"/><path d="${dome}" fill="${C.glassine}"/>`
      + `<path d="M-7 -4Q-4 -8 0 -8" stroke="${C.standeeCard}" stroke-width="1.4" fill="none" opacity=".8"/>`
      + `<rect x="-1.4" y="${down ? -13 : -17}" width="2.8" height="${down ? 3 : 7}" fill="${C.printDark}"/>`, `<path d="${dome}"/>`)
      + (down ? `<path d="M-18 -14q-4 6 0 12M18 -14q4 6 0 12" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>` : '');
  },
};

/** The 番台's little sliding window, its centre at the origin: a lattice shoji, slid aside when `open`. */
const bantaiWindow: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -26, y: -26, w: 80, h: 52 },
  draw(ctx, state) {
    const frame = `<rect x="-20" y="-20" width="40" height="40" fill="${mixHex(C.nightCardDeep, C.shadow, 0.3)}"/>`;
    const shoji = (x: number) => depth(ctx, 1, `<rect x="${x}" y="-20" width="40" height="40" fill="${C.washi}"/>`
      + `<path d="M${x + 13.3} -20V20M${x + 26.7} -20V20M${x} -6.7H${x + 40}M${x} 6.7H${x + 40}" stroke="${C.woodDeep}" stroke-width="1.6"/>`
      + `<rect x="${x}" y="-20" width="40" height="40" fill="none" stroke="${C.woodDeep}" stroke-width="2.4"/>`, `<rect x="${x}" y="-20" width="40" height="40"/>`);
    return frame + shoji(state === 'open' ? f1(-20 + 30) : -20);
  },
};

export const C8_PARTS: Readonly<Record<string, PartSource>> = {
  'c8/seat-cushion': seatCushion,
  'c8/steam': steam,
  'c8/steam-cloud': steamCloud,
  'c8/granny-hat': grannyHat,
  'c8/pinwheel': pinwheel,
  'c8/book-belt': bookBelt,
  'c8/wooden-tub': woodenTub,
  'c8/bath-water': bathWater,
  'c8/counter-bell': counterBell,
  'c8/bantai-window': bantaiWindow,
};
