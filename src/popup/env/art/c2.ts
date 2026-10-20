import { POPUP as C } from '../../../art/palette';
import { depth, f1, ref, softEllipse, wheelRim } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 2 (大安森林公園) environment art, drawn in the kit's paper language and baked by
 * `npm run bake:popup` (#96). The pages issue (#114) draws only the pieces whose preset placeholder
 * would mislead a player — a pushable's default is a bead, a lift's an elevator car and a button's
 * a little box; the chapter's art issue (#115) draws the backdrops and the rest here.
 */

/**
 * 2-1's commuter's long umbrella (a pushable, C3): a navy folded umbrella with a crook handle.
 * Leaning on the bench while he sleeps (`onPerch`, local origin at the fall path's start), tipping
 * (`falling`), and lying flat across the gap between the car and the platform (`landed`, origin
 * at the gap: it reaches the doorway and the platform's edge).
 */
const umbrella: PartSource = {
  preset: 'pushable',
  states: ['onPerch', 'falling', 'landed'],
  box: { x: -52, y: -48, w: 104, h: 96 },
  draw(ctx, state) {
    // Drawn lying along +x, the tip at -44 and the crook at +40; then turned for the state
    const canopy = 'M-44 0L-30 -4.6Q-4 -7.6 22 -5L30 -3.4V3.4L22 5Q-4 7.6 -30 4.6Z';
    const body = depth(ctx, 3, `<path d="${canopy}" fill="${C.nightCard}"/>`
      + `<path d="M-30 -1.4Q-4 -3.4 22 -2.2M-26 2.2Q0 3.8 22 2.6" stroke="${C.nightCardDeep}" stroke-width="1.1" fill="none" opacity=".8"/>`
      + `<path d="M-16 -6.6L-12 6.4M2 -7L5 7" stroke="${C.nightInk}" stroke-width=".9" opacity=".5"/>`
      + `<rect x="-6" y="-7.6" width="7" height="15.2" rx="2" fill="${C.washiPink}"/>`
      + `<path d="M30 0H38" stroke="${C.printDark}" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M38 0q8 0 8 7t-7 7" stroke="${C.kraftDark}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
      + `<path d="M-44 0h-4" stroke="${C.printDark}" stroke-width="2" stroke-linecap="round"/>`, `<path d="${canopy}"/>`);
    const turn = state === 'landed' ? 0 : state === 'falling' ? -40 : -74;
    const shadow = state === 'landed' ? softEllipse(ctx, 0, 9, 46, 3, 'shadow', 0.4) : '';
    // Leaning, its tip rests on the platform and the crook hooks the bench's arm
    const at = state === 'onPerch' ? 'translate(-4 22)' : '';
    return shadow + `<g transform="${at} rotate(${turn})">${body}</g>`;
  },
};

/**
 * 2-2's bandshell curtain (a `lift` the trap-door plate raises; event-driven, so it wears no
 * marigold). Down, the red velvet hangs from the proscenium to the stage (local origin at its
 * foot, the hit area's bottom centre); up, it is gathered into a swag under the proscenium
 * (origin at the hit area's top: `MoverView` slides it there), and the stage behind shows.
 */
const curtain: PartSource = {
  preset: 'lift',
  states: ['down', 'up'],
  box: { x: -50, y: -170, w: 100, h: 214 },
  draw(ctx, state) {
    if (state === 'up') {
      const swag = 'M-44 0H44V10Q30 34 0 30Q-30 34 -44 10Z';
      return depth(ctx, 3, `<path d="${swag}" fill="${C.peony}"/>`
        + `<path d="M-36 8Q-20 26 0 24Q20 26 36 8" stroke="${C.peonyDeep}" stroke-width="2" fill="none"/>`
        + `<path d="M-40 4Q-22 16 0 15Q22 16 40 4" stroke="${C.peonyLight}" stroke-width="1.4" fill="none" opacity=".8"/>`
        + `<path d="M-46 -2H46" stroke="${C.printDark}" stroke-width="4" stroke-linecap="round"/>`, `<path d="${swag}"/>`);
    }
    const drape = 'M-44 -160H44V-6Q40 2 30 0Q20 4 10 0Q0 4 -10 0Q-20 4 -30 0Q-40 2 -44 -6Z';
    let folds = '';
    for (let i = 0; i < 8; i++) {
      const x = -38 + i * 11;
      folds += `<path d="M${f1(x)} -156Q${f1(x + 3)} -80 ${f1(x)} -4" stroke="${i % 2 ? C.peonyDeep : C.peonyLight}" stroke-width="${i % 2 ? 2.4 : 1.4}" fill="none" opacity="${i % 2 ? 0.7 : 0.55}"/>`;
    }
    return softEllipse(ctx, 0, 4, 46, 4, 'shadow', 0.4)
      + depth(ctx, 3, `<path d="${drape}" fill="${C.peony}"/>${folds}`
        + `<path d="M-46 -162H46" stroke="${C.printDark}" stroke-width="4" stroke-linecap="round"/>`, `<path d="${drape}"/>`);
  },
};

/**
 * 2-2's trap-door plate (a weight `button` on the stage's front edge): a round wooden lid with an
 * iron ring, flush with the boards (`up`), and pushed down a little under his weight (`down`, darker,
 * the ring tipped). Local origin at its hit centre, the plate's middle.
 */
const trapPlate: PartSource = {
  preset: 'button',
  states: ['up', 'down'],
  box: { x: -32, y: -14, w: 64, h: 28 },
  draw(ctx, state) {
    const down = state === 'down';
    const lid = `<ellipse cx="0" cy="0" rx="26" ry="8"/>`;
    return depth(ctx, down ? 1 : 2, `<ellipse cx="0" cy="0" rx="26" ry="8" fill="${down ? C.kraftDark : C.kraft}"/>`
      + `<path d="M-22 -2.6H22M-24 1.6H24" stroke="${C.kraftFiber}" stroke-width=".9" opacity=".55"/>`
      + `<ellipse cx="0" cy="0" rx="26" ry="8" fill="none" stroke="${C.kraftFiber}" stroke-width="1.4"/>`
      + `<ellipse cx="${down ? 2 : 0}" cy="${down ? 1 : 0}" rx="5" ry="${down ? 1.6 : 2.2}" fill="none" stroke="${C.printDark}" stroke-width="1.6"/>`, lid);
  },
};

/**
 * 2-5's lily-pad wheel (a `wheel`; the pond's ferry): a disk of pond water ringed by the marigold
 * knurled rim (its grip), the great lily pad at its `west` place (local (-56, 0)) with a lotus bud,
 * and a few small pads and ripples. The view turns each state's bitmap by the state's angle (90° a
 * step, clockwise: west → north → east → south), so every state draws the disk unturned. Pivot at
 * the centre (206, 478), radius 76.
 */
const lilyPad: PartSource = {
  preset: 'wheel',
  states: ['west', 'north', 'east', 'south'],
  pivot: [0, 0],
  box: { x: -90, y: -90, w: 180, h: 180 },
  draw(ctx) {
    const r = 76;
    const pad = 'M-56 0m-22 0a22 22 0 1 0 22 -22L-56 0Z';
    const small = (x: number, y: number, s: number) => `<path d="M${x} ${y}m${-9 * s} 0a${9 * s} ${9 * s} 0 1 0 ${9 * s} ${-9 * s}L${x} ${y}Z" fill="${C.quiltLeaf}" opacity=".85"/>`;
    const water = `<circle r="${r - 6}" fill="${C.washiCeladon}"/><circle r="${r - 6}" fill="${C.nightCard}" opacity=".28"/>`
      + `<path d="M-20 -40q10 -4 20 0M10 30q12 -4 24 0M-30 34q8 -3 16 0M24 -22q8 -3 16 0" stroke="${C.vellum}" stroke-width="1.2" fill="none" opacity=".55"/>`
      + small(30, -38, 1) + small(40, 28, 0.8) + small(-6, 46, 0.7);
    const leaf = depth(ctx, 2, `<path d="${pad}" fill="${C.quiltLeaf}"/><path d="M-56 0L-74 -8M-56 0L-60 18M-56 0L-40 14M-56 0L-46 -16" stroke="${C.washiCeladon}" stroke-width="1" opacity=".55"/>`
      + `<path d="M-36 -6q4 -8 0 -14q-6 4 -4 12z" fill="${C.washiPink}"/><path d="M-36 -6q-4 -8 0 -14q6 4 4 12z" fill="${C.peonyLight}" opacity=".8"/>`, `<path d="${pad}"/>`);
    const rim = wheelRim(r, 28);
    return depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/>${water}`
      + `<circle r="${r - 6}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1.4" opacity=".6"/><circle r="${r - 4}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/>`, `<path d="${rim}"/>`)
      + leaf;
  },
};

export const C2_PARTS: Readonly<Record<string, PartSource>> = {
  'c2/umbrella': umbrella,
  'c2/curtain': curtain,
  'c2/plate': trapPlate,
  'c2/lily-pad': lilyPad,
};
