import { POPUP as C, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import { ironEggGrannyArt } from '../../view/art/tamsui';
import type { CutoutSource, PartSource } from '../sources';
import { bakedFlap, kraftBack } from './common';

/**
 * Chapter 9 (淡水, 04:40) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#131) draws only the placeholders whose preset art
 * would mislead (D-77 … D-93): 9-1's window blind and 9-6's sail (the blowable preset is a cloud in
 * every state), 9-4's tide and dinghy (the lift preset is a bare platform on cords), 9-6's derrick (the
 * loop preset is a level belt; its net basket is a rider, `view/art/tamsui.ts`), 9-3's ferry horn (the
 * button preset is a push button), and — to keep 9-2 inside the animated-node budget beside the
 * 背包客 — 9-2's 鐵蛋阿婆 (baked per look) and its rolling shutters (baked flaps, the marigold dog-ear
 * their grip, `bakedFlap`). 9-5's stay cables are baked props (the prop preset is a split-flap card)
 * with their notes, and the maintenance box's plate a cut-out showing the tune. The sun dial keeps the
 * wheel's live art: the affordance lint reads its marigold. The chapter's art issue (#132) draws
 * the palette kit, the six backdrops and every part.
 */

// ——— 9-1's window blind (a `blowable`: `closed` / `open`) ———

/** A pleated paper blind over the car's window, its centre at the origin; blown `open`, rolled up on the dawn. */
const windowBlind: PartSource = {
  preset: 'blowable',
  states: ['closed', 'open'],
  box: { x: -32, y: -40, w: 64, h: 80 },
  draw(ctx, state) {
    const frame = `<rect x="-26" y="-34" width="52" height="66" rx="4" fill="none" stroke="${C.printDark}" stroke-width="3"/>`;
    if (state === 'open') {
      // The dawn through the glass: violet over a band of river, the roll of blind at the top
      return `<rect x="-24" y="-32" width="48" height="62" fill="${mixHex(C.printLilac, C.lamp, 0.25)}" opacity=".85"/>`
        + `<rect x="-24" y="8" width="48" height="22" fill="${C.washiCeladon}" opacity=".8"/><path d="M-24 8q12 -4 24 0t24 0" stroke="${C.standeeCard}" stroke-width="1.2" fill="none"/>`
        + frame + depth(ctx, 2, `<rect x="-26" y="-36" width="52" height="9" rx="4.5" fill="${C.washi}"/>`, '<rect x="-26" y="-36" width="52" height="9" rx="4.5"/>');
    }
    let pleats = '';
    for (let y = -26; y < 30; y += 8) pleats += `M-24 ${y}H24`;
    return frame + depth(ctx, 2, `<rect x="-25" y="-33" width="50" height="64" fill="${C.washi}"/><path d="${pleats}" stroke="${C.washiFiber}" stroke-width="1.2"/>`,
      '<rect x="-25" y="-33" width="50" height="64"/>')
      + `<path d="M18 31V40" stroke="${C.printDark}" stroke-width="1.2"/><circle cx="18" cy="41" r="2.2" fill="${C.ochre}"/>`;
  },
};

// ——— 9-3's ferry horn (a `button`: Mocha's weight honks it) ———

/** A brass horn on the cabin roof, its base at the origin; honking (`down`), rings of sound out of its bell. */
const ferryHorn: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -26, y: -26, w: 56, h: 40 },
  draw(ctx, state) {
    const horn = 'M-16 -6L6 -12Q14 -18 16 -10Q18 -2 6 -4L-16 -2Z';
    return depth(ctx, 2, `<rect x="-14" y="-2" width="20" height="8" rx="2" fill="${C.printDark}"/><path d="${horn}" fill="${C.gold}"/>`
      + `<path d="M-12 -5L6 -9" stroke="${C.goldLight}" stroke-width="1.2"/>`, `<path d="${horn}"/>`)
      + (state === 'down' ? `<path d="M20 -16q5 6 0 12M24 -20q8 10 0 20" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>` : '');
  },
};

// ——— 9-4's tide and dinghy (`lift`s that follow the sun dial) ———

/**
 * The water over the tidal flat (#131), drawn at its level's anchor (`MoverView`: the hit area's bottom at
 * dawn, its middle at noon, its top at sunset): at dawn only a channel through the mud, at noon a step
 * under the boardwalk, at sunset up by the piers. Its surface per state sits where the dinghy floats.
 */
const tide: PartSource = {
  preset: 'lift',
  states: ['dawn', 'noon', 'sunset'],
  box: { x: -140, y: -44, w: 280, h: 128 },
  draw(_ctx, state) {
    // Surface (local y) and the depth to the page's front edge, per level
    const [top, bottom] = state === 'dawn' ? [-4, 20] : state === 'noon' ? [-38, 50] : [-14, 80];
    const waves = `M-135 ${top}q11 -3 22 0t22 0t22 0t22 0t22 0t22 0t22 0t22 0t22 0t22 0t22 0t22 0`;
    return `<rect x="-135" y="${top}" width="270" height="${bottom - top}" fill="${C.washiCeladon}" opacity=".55"/>`
      + `<path d="${waves}" stroke="${C.standeeCard}" stroke-width="1.4" fill="none" opacity=".7"/>`;
  },
};

/** The dinghy (drawn where its node is: he sits in it), a little wooden rowing boat. */
const dinghy: PartSource = {
  preset: 'lift',
  states: ['dawn', 'noon', 'sunset'],
  box: { x: -34, y: -10, w: 68, h: 30 },
  draw(ctx) {
    const hull = 'M-30 0H30Q26 14 0 14Q-26 14 -30 0Z';
    return softEllipse(ctx, 0, 14, 26, 3, 'shadow', 0.3)
      + depth(ctx, 3, `<path d="${hull}" fill="${C.wood}"/><path d="M-30 0H30" stroke="${C.woodDeep}" stroke-width="2.4"/>`
        + `<path d="M-26 6Q0 10 26 6" stroke="${C.woodDeep}" stroke-width="1" fill="none" opacity=".7"/>`, `<path d="${hull}"/>`);
  },
};

// ——— 9-6's sail and derrick ———

/**
 * The fishing boat's sail (a `blowable`, four states: the boom a quarter round the derrick each), its
 * centre at the origin: a patched canvas sail on the mast, bellied out by 咻—— — the belly swings with
 * the boom.
 */
const sail: PartSource = {
  preset: 'blowable',
  states: ['0', '1', '2', '3'],
  box: { x: -36, y: -44, w: 72, h: 88 },
  draw(ctx, state) {
    const belly = [10, 16, 10, 4][Number(state)] ?? 10;
    const d = `M18 -38L18 30L-24 30Q${f1(-24 + belly)} -2 18 -38Z`;
    return `<path d="M20 -42V36" stroke="${C.woodDeep}" stroke-width="3"/>`
      + depth(ctx, 2, `<path d="${d}" fill="${C.washi}"/><path d="M-10 20h12v8h-12z" fill="${C.washiPink}" opacity=".7"/>`, `<path d="${d}"/>`)
      + `<path d="M-26 32H22" stroke="${C.woodDeep}" stroke-width="2.4" stroke-linecap="round"/>`;
  },
};

/**
 * The fishing boat's derrick (#131), drawn at its hit centre: the rope circuit the boom's hook runs
 * round — the quay, up over the water, the deck, down low — through its four stops. The same in every
 * state: the net basket rider shows where it is.
 */
const derrick: PartSource = {
  preset: 'loop',
  states: ['0', '1', '2', '3'],
  box: { x: -44, y: -44, w: 88, h: 96 },
  draw() {
    const loop = 'M-33 16C-33 -16 -16 -34 -1 -34C16 -34 29 -20 29 -6C29 20 14 44 -1 44C-18 44 -33 34 -33 16Z';
    return `<path d="${loop}" fill="none" stroke="${C.kraftDark}" stroke-width="2.4" stroke-dasharray="5 4" opacity=".8"/>`;
  },
};

// ——— 9-5's stay cables (a `prop` each: tap to ring) and the maintenance box's plate (a cut-out) ———

/**
 * A stay cable as you tap it (#131), its centre at the origin: the steel cable running up toward the
 * tower (up and right), a paper tag with its note; ringing (`hum`), chalk ripples either side.
 */
const stayCable = (note: string): PartSource => ({
  preset: 'prop',
  states: ['still', 'hum'],
  box: { x: -40, y: -40, w: 80, h: 80 },
  draw(ctx, state) {
    const hum = state === 'hum'
      ? `<path d="M-30 18q-6 -10 4 -18M-18 32q-8 -8 0 -18M18 -32q8 8 0 18M30 -18q6 10 -4 18" stroke="${C.chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>` : '';
    return `<path d="M-36 36L36 -36" stroke="${C.printDark}" stroke-width="3" stroke-linecap="round"/><path d="M-36 36L36 -36" stroke="${C.glassine}" stroke-width="1" opacity=".6"/>`
      + hum
      + depth(ctx, 2, `<circle r="13" fill="${C.washi}"/><circle r="13" fill="none" stroke="${C.printLilacDeep}" stroke-width="1.2"/>`, '<circle r="13"/>')
      + `<text data-art-text="" x="0" y="4.4" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="12" fill="${C.printDark}">${note}</text>`;
  },
});

/**
 * The maintenance box at the tower's foot with its plate (#131; a cut-out in page units): the tune
 * that lowers the platform, three notes on paper tags — Sol, Sol, La (生日快樂's first three).
 */
const tunePlate: CutoutSource = {
  chapter: 9,
  box: { x: 246, y: 260, w: 120, h: 60 },
  draw(ctx) {
    const tag = (x: number, note: string) => `<circle cx="${x}" cy="290" r="11" fill="${C.washi}"/><circle cx="${x}" cy="290" r="11" fill="none" stroke="${C.printLilacDeep}" stroke-width="1"/>`
      + `<text data-art-text="" x="${x}" y="294" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="10" fill="${C.printDark}">${note}</text>`;
    return depth(ctx, 2, `<rect x="252" y="266" width="104" height="48" rx="4" fill="${C.printLilacDeep}"/><rect x="256" y="270" width="96" height="40" rx="3" fill="${mixHex(C.printLilac, C.washi, 0.4)}"/>`, '<rect x="252" y="266" width="104" height="48" rx="4"/>')
      + tag(276, 'Sol') + tag(304, 'Sol') + tag(332, 'La')
      + `<path d="M288 290h4M316 290h4" stroke="${C.printDark}" stroke-width="1.4" stroke-linecap="round"/>`;
  },
};

// ——— 9-2's shop shutters (a `flap` each) and the 鐵蛋阿婆 (a carrier, baked per look) ———

/** A rolling shop shutter: closed, ribbed grey steel down to its handle; rolled up, its kraft back. */
const shutter = (() => {
  const { w, h } = { w: 40, h: 34 };
  const face = (_ctx: KitCtx) => {
    let ribs = '';
    for (let y = 4; y < h; y += 5) ribs += `M0 ${y}H${w}`;
    return `<rect width="${w}" height="${h}" fill="${mixHex(C.printLilac, C.washi, 0.45)}"/><path d="${ribs}" stroke="${C.printLilacDeep}" stroke-width="1.2" opacity=".6"/>`
      + `<rect x="${w / 2 - 6}" y="${h - 9}" width="12" height="3" rx="1.5" fill="${C.printDark}"/>`;
  };
  return bakedFlap(w, h, face, kraftBack(w, h, 191));
})();

const ironEggGranny: PartSource = {
  preset: 'carrier',
  states: ['idle', 'carrying', 'back', 'done'],
  box: { x: -60, y: -170, w: 130, h: 176 },
  draw: (ctx, look) => ironEggGrannyArt(ctx, look as 'idle'),
};

export const C9_PARTS: Readonly<Record<string, PartSource>> = {
  'c9/window-blind': windowBlind,
  'c9/shutter': shutter,
  'c9/ferry-horn': ferryHorn,
  'c9/tide': tide,
  'c9/dinghy': dinghy,
  'c9/sail': sail,
  'c9/derrick': derrick,
  'c9/iron-egg-granny': ironEggGranny,
  'c9/cable-sol': stayCable('Sol'),
  'c9/cable-la': stayCable('La'),
  'c9/cable-do': stayCable('Do'),
};

export const C9_CUTOUTS: Readonly<Record<string, CutoutSource>> = {
  'c9/tune-plate': tunePlate,
};
