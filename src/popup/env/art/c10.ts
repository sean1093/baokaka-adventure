import { POPUP as C, mixHex } from '../../../art/palette';
import { depth, f1, softEllipse, type KitCtx } from '../../art';
import type { PartSource } from '../sources';

/**
 * Chapter 10 (台北101, 05:10) environment art, baked by `npm run bake:popup` (#96). The pages issue
 * (#133) draws placeholders only where a preset misleads (D-97): a blowable's default art is a cloud,
 * which reads wrong for 10-1's balloons and for 10-4's damper sphere. The chapter's art issue (#134)
 * draws the palette kit, the six backdrops and every part.
 */

/** A paper balloon on its string, tied to (sx, sy). */
function balloon(ctx: KitCtx, x: number, y: number, r: number, fill: string, sx: number, sy: number): string {
  const body = `M${f1(x)} ${f1(y - r)}C${f1(x + r * 1.1)} ${f1(y - r)} ${f1(x + r)} ${f1(y + r * 0.7)} ${f1(x)} ${f1(y + r)}C${f1(x - r)} ${f1(y + r * 0.7)} ${f1(x - r * 1.1)} ${f1(y - r)} ${f1(x)} ${f1(y - r)}Z`;
  return `<path d="M${f1(x)} ${f1(y + r)}Q${f1((x + sx) / 2 + 4)} ${f1((y + r + sy) / 2)} ${f1(sx)} ${f1(sy)}" stroke="${C.printDark}" stroke-width=".9" fill="none" opacity=".7"/>`
    + depth(ctx, 2, `<path d="${body}" fill="${fill}"/><path d="M${f1(x - r * 0.45)} ${f1(y - r * 0.4)}q${f1(r * 0.2)} ${f1(-r * 0.35)} ${f1(r * 0.5)} ${f1(-r * 0.4)}" stroke="${C.chalk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`
      + `<path d="M${f1(x - 2)} ${f1(y + r + 2)}l2 -3l2 3z" fill="${fill}"/>`, `<path d="${body}"/>`);
}

const BALLOONS: readonly (readonly [number, number, number, string])[] = [
  [-14, -14, 13, C.hatRed], [12, -20, 12, C.ochre], [0, 6, 14, C.noteSky], [-20, 12, 11, C.notePink], [18, 8, 11, C.noteMint],
];

/**
 * 10-1's birthday balloons (a `blowable`, placeholder until #134): `down`, a bunch bobbing against the
 * train's front window, their strings tied to the sill's rail; `up`, blown to the ceiling, the
 * strings hanging down to the rail and the window clear.
 */
const balloons: PartSource = {
  preset: 'blowable',
  states: ['down', 'up'],
  box: { x: -40, y: -96, w: 80, h: 132 },
  draw(ctx, state) {
    const dy = state === 'up' ? -64 : 0;
    const shrink = state === 'up' ? 0.8 : 1;
    return BALLOONS.map(([x, y, r, fill]) => balloon(ctx, x * shrink, y * shrink + dy, r * shrink, fill, 0, 30)).join('');
  },
};

/** The damper's stops, as offsets of the sphere's centre from the part's hit centre (its node rides on top). */
const SWING: Readonly<Record<string, readonly [number, number]>> = { left: [-80, 8], centre: [-20, 28], right: [40, 8] };
/** The cables' mount over the atrium's centre (the sphere hangs from it). */
const MOUNT: readonly [number, number] = [-20, -170];

/**
 * 10-4's tuned-mass damper (a `blowable` pendulum, placeholder until #134): the great gold sphere
 * hanging on its cables from the mount, swung to the near balcony, hanging at the centre, or out to
 * the far side. Gold banded steel plates, a darker equator band and a soft glow under it.
 */
const damper: PartSource = {
  preset: 'blowable',
  states: ['left', 'centre', 'right'],
  box: { x: -132, y: -184, w: 214, h: 252 },
  draw(ctx, state) {
    const [x, y] = SWING[state] ?? SWING.centre;
    const r = 30;
    const cables = [-14, -5, 5, 14].map((dx) => `M${f1(MOUNT[0] + dx * 0.4)} ${MOUNT[1]}L${f1(x + dx)} ${f1(y - r + 4)}`).join('');
    const ball = `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}"/>`;
    return softEllipse(ctx, x, y + r + 6, 40, 8, 'shadow', 0.18, 'blur8')
      + `<path d="${cables}" stroke="${C.printDark}" stroke-width="1.6" opacity=".75"/>`
      + depth(ctx, 3, `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${C.gold}"/>`
        + `<path d="M${f1(x - r)} ${f1(y)}Q${f1(x)} ${f1(y + 9)} ${f1(x + r)} ${f1(y)}" stroke="${C.goldDeep}" stroke-width="5" fill="none"/>`
        + `<path d="M${f1(x - r * 0.7)} ${f1(y - r * 0.7)}Q${f1(x)} ${f1(y - r * 0.4)} ${f1(x + r * 0.7)} ${f1(y - r * 0.7)}M${f1(x - r * 0.7)} ${f1(y + r * 0.7)}Q${f1(x)} ${f1(y + r)} ${f1(x + r * 0.7)} ${f1(y + r * 0.7)}" stroke="${C.goldDeep}" stroke-width="1.2" fill="none" opacity=".7"/>`
        + `<path d="M${f1(x - r * 0.55)} ${f1(y - r * 0.35)}q${f1(r * 0.25)} ${f1(-r * 0.4)} ${f1(r * 0.6)} ${f1(-r * 0.45)}" stroke="${mixHex(C.goldLight, C.chalk, 0.5)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`, ball);
  },
};

export const C10_PARTS: Readonly<Record<string, PartSource>> = {
  'c10/balloons': balloons,
  'c10/damper': damper,
};
