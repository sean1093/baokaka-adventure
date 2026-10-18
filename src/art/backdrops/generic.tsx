import { GLOW, LIGHTS, SKY_ART, STAGE_LIGHT, mixHex, skyAt } from '../palette';
import { dot, n, rng, sparkle } from '../sky/SkyLayer';
import { GENERIC_BACKDROP, GENERIC_ROOM_BACKDROP } from './keys';
import { STAGE_VIEW, Windows, canopy, leafDabs, skyline } from './Stage';
import type { PieceProps, StageConfig } from './types';

/**
 * The generic stages, in the main bundle so any battle can draw at once: `generic` (a city park
 * at night: hills, skyline, a hedge with lamps, street trees framing) and `genericRoom` (an
 * interior: a window onto the night, furniture shapes, curtains framing). Both take the map's
 * clock. Chapter backdrops replace them location by location.
 */

const X0 = STAGE_VIEW.x;
const X1 = STAGE_VIEW.x + STAGE_VIEW.w;

// ---------------------------------------------------------------------------------------------
// Open air

/** The far city: the basin's hills, then two rows of skyline with lit windows. */
export const CityFar = ({ t, horizon, seed }: PieceProps) => {
  const rand = rng(seed);
  const back = skyline(rand, horizon + 2, 22, 70);
  const front = skyline(rand, horizon + 4, 10, 34);
  return (
    <g>
      <path
        d={`M${X0},${horizon - 40}C-40,${horizon - 70} 20,${horizon - 84} 80,${horizon - 66}C140,${horizon - 96} 230,${horizon - 100} 290,${horizon - 74}C350,${horizon - 90} 420,${horizon - 80} ${X1},${horizon - 58}V${horizon + 6}H${X0}Z`}
        fill={mixHex(t.city, SKY_ART.haze, 0.18)}
        opacity={0.8}
      />
      <path d={back.d} fill={t.city} />
      <Windows windows={back.windows} opacity={0.8} />
      <path d={front.d} fill={t.cityNear} />
      <Windows windows={front.windows} />
    </g>
  );
};

/** A hedge along the far edge of the plaza, with a low railing and two distant round trees. */
export const HedgeMid = ({ t, horizon, seed }: PieceProps) => {
  const rand = rng(seed);
  const y = horizon + 20;
  let bumps = `M${X0},${y}`;
  for (let x = X0; x < X1; x += 14) bumps += `q7,${n(-5 - rand() * 4)} 14,0`;
  bumps += `V${y + 12}H${X0}Z`;
  const trees: [number, number][] = [
    [40, 0.9],
    [300, 1.1],
  ];
  return (
    <g>
      {trees.map(([x, s]) => {
        const clumps: [number, number, number][] = [
          [x - 14 * s, y - 36 * s, 16 * s],
          [x + 12 * s, y - 40 * s, 18 * s],
          [x, y - 56 * s, 17 * s],
        ];
        const leaves = canopy(rand, clumps, -1);
        return (
          <g key={x}>
            <path d={`M${x - 2},${y}V${y - 28 * s}`} stroke={t.trunk} strokeWidth={4 * s} />
            <path d={leaves.body} fill={t.hedge} />
            <path d={leaves.rim} stroke={t.hedgeRim} strokeWidth={1.2} fill="none" opacity={0.7} />
          </g>
        );
      })}
      <path d={bumps} fill={t.hedge} />
      <path d={`M${X0},${y - 3}H${X1}`} stroke={t.hedgeRim} strokeWidth={0.8} opacity={0.35} />
      <path d={`M${X0},${y + 15}H${X1}`} stroke={t.post} strokeWidth={1.6} />
      <path
        d={Array.from({ length: 40 }, (_, i) => `M${X0 + i * 16},${y + 15}v9`).join('')}
        stroke={t.post}
        strokeWidth={1.4}
      />
      <path d={`M${X0},${y + 14.4}H${X1}`} stroke={t.postRim} strokeWidth={0.5} opacity={0.5} />
    </g>
  );
};

/** A street tree: a big canopy over the top corner and a trunk down the frame's edge. */
const streetTree = (side: 1 | -1) =>
  function StreetTree({ t, seed }: PieceProps) {
    const rand = rng(seed);
    const mirror = (x: number) => (side > 0 ? x : 390 - x);
    const clumps: [number, number, number][] = [
      [mirror(-70), 10, 58],
      [mirror(-6), -6, 50],
      [mirror(48), 30, 40],
      [mirror(-40), 70, 46],
      [mirror(26), 84, 30],
      [mirror(-92), 120, 42],
    ];
    const leaves = canopy(rand, clumps, side > 0 ? 1 : -1);
    const dabs = leafDabs(rand, clumps, 40);
    const trunk = side > 0 ? `M-58,500C-46,420 -40,320 -36,240C-30,180 -16,140 4,96L18,104C2,150 -6,200 -10,250C-12,330 -8,420 -2,500Z` : `M448,500C436,420 430,320 426,240C420,180 406,140 386,96L372,104C388,150 396,200 400,250C402,330 398,420 392,500Z`;
    const trunkRim = side > 0 ? 'M-6,500C-12,420 -14,330 -12,250C-8,200 0,150 14,104' : 'M396,500C402,420 404,330 402,250C398,200 390,150 376,104';
    return (
      <g>
        <path d={trunk} fill={t.trunk} />
        <path d={trunkRim} stroke={t.trunkRim} strokeWidth={1.4} fill="none" opacity={0.55} />
        <path d={leaves.body} fill={t.leaf} />
        <path d={leaves.lit} fill={t.leafMid} opacity={0.7} />
        <path d={dabs} fill={t.leafLit} opacity={0.6} />
        <path d={leaves.rim} stroke={t.leafRim} strokeWidth={1.6} fill="none" opacity={0.75} strokeLinecap="round" />
      </g>
    );
  };

export const GENERIC: StageConfig = {
  key: GENERIC_BACKDROP,
  label: 'Generic: a city park at night (any map without its own backdrop)',
  sky: 'open',
  horizon: 262,
  far: CityFar,
  mid: HedgeMid,
  framers: [streetTree(1), streetTree(-1)],
  floor: {
    kind: 'pave',
    reflections: [
      { x: 92, w: 10, h: 120, color: LIGHTS.lampMid, y: 312 },
      { x: 318, w: 10, h: 120, color: LIGHTS.lampMid, y: 310 },
      { x: 195, w: 80, h: 60, color: LIGHTS.cityGlowWarm, opacity: 0.25 },
    ],
  },
  lights: [
    { x: 92, y: 236, r: 34, color: LIGHTS.lampMid, post: 306, pool: { x: 92, y: 318, rx: 70, ry: 18 } },
    { x: 318, y: 232, r: 34, color: LIGHTS.lampMid, post: 304, pool: { x: 318, y: 316, rx: 70, ry: 18 } },
    { x: 195, y: 420, r: 0, color: LIGHTS.lampCore, pool: { x: 195, y: 420, rx: 210, ry: 70, opacity: 0.55 } },
  ],
  bokeh: [
    { x: -6, y: 300, r: 14, color: LIGHTS.lampMid },
    { x: 14, y: 340, r: 8, color: SKY_ART.bokehPink, opacity: 0.35 },
    { x: 384, y: 286, r: 11, color: SKY_ART.bokehPink },
    { x: 372, y: 470, r: 16, color: LIGHTS.lampMid, opacity: 0.3 },
  ],
};

// ---------------------------------------------------------------------------------------------
// Indoors

/** The window onto the night: the clock's sky, stars, the moon and a skyline, behind a frame. */
export const WindowFar = ({ t, time, horizon, id, seed }: PieceProps) => {
  const rand = rng(seed);
  const sky = skyAt(time);
  const win = { x: 92, y: 62, w: 206, h: 168 };
  const city = skyline(rand, win.y + win.h, 18, 64, win.x - 10, win.x + win.w + 10);
  let stars = '';
  for (let i = 0; i < 26; i += 1) stars += dot(win.x + rand() * win.w, win.y + rand() * win.h * 0.6, [0.5, 0.7, 1][Math.floor(rand() * 3)]);
  return (
    <g>
      <defs>
        <clipPath id={id('win')}>
          <rect x={win.x} y={win.y} width={win.w} height={win.h} />
        </clipPath>
        <linearGradient id={id('winSky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset=".6" stopColor={sky.mid} />
          <stop offset="1" stopColor={sky.horizon} />
        </linearGradient>
        <radialGradient id={id('winMoon')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={SKY_ART.moon} stopOpacity=".85" />
          <stop offset=".3" stopColor={SKY_ART.moonHalo} stopOpacity=".3" />
          <stop offset="1" stopColor={SKY_ART.moonHaloOuter} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('winSpill')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={STAGE_LIGHT.moonShaft} stopOpacity=".28" />
          <stop offset="1" stopColor={STAGE_LIGHT.moonShaft} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={win.x + win.w / 2} cy={win.y + win.h / 2} rx={win.w * 0.95} ry={win.h * 0.85} fill={`url(#${id('winSpill')})`} />
      <g clipPath={`url(#${id('win')})`}>
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={`url(#${id('winSky')})`} />
        <path d={stars} fill={SKY_ART.star} opacity={0.8} />
        <path d={sparkle(win.x + 160, win.y + 30, 3.6)} fill={SKY_ART.star} />
        <circle cx={win.x + 58} cy={win.y + 46} r={40} fill={`url(#${id('winMoon')})`} />
        <circle cx={win.x + 58} cy={win.y + 46} r={11} fill={SKY_ART.moon} />
        <path d={city.d} fill={t.city} />
        <Windows windows={city.windows} />
      </g>
      {/* Frame, mullions, sill */}
      <path
        d={`M${win.x - 8},${win.y - 8}h${win.w + 16}v${win.h + 16}h${-win.w - 16}Z M${win.x},${win.y}v${win.h}h${win.w}v${-win.h}Z`}
        fill={t.frame}
        fillRule="evenodd"
      />
      <path d={`M${win.x + win.w / 2},${win.y}v${win.h} M${win.x},${win.y + win.h * 0.42}h${win.w}`} stroke={t.frame} strokeWidth={5} />
      <path d={`M${win.x - 8},${win.y - 8}h${win.w + 16} M${win.x + win.w / 2 - 2},${win.y}v${win.h}`} stroke={t.frameLit} strokeWidth={1} opacity={0.6} />
      <path d={`M${win.x - 16},${win.y + win.h + 8}h${win.w + 32}v7h${-win.w - 32}Z`} fill={t.frame} />
      <path d={`M${win.x - 16},${win.y + win.h + 8}h${win.w + 32}`} stroke={t.frameLit} strokeWidth={1.2} opacity={0.7} />
      {/* Skirting board where wall meets floor */}
      <rect x={X0} y={horizon - 10} width={STAGE_VIEW.w} height={10} fill={t.skirting} />
      <path d={`M${X0},${horizon - 10}H${X1}`} stroke={t.frameLit} strokeWidth={0.8} opacity={0.35} />
    </g>
  );
};

/** Furniture shapes against the wall: a sofa back on the left, a cabinet with a plant on the right. */
export const RoomMid = ({ t, horizon }: PieceProps) => (
  <g>
    <path d={`M-90,${horizon + 6}V${horizon - 46}q0,-14 14,-14h120q14,0 14,14V${horizon + 6}Z`} fill={t.furniture} />
    <path d={`M-90,${horizon - 46}q0,-14 14,-14h120q14,0 14,14`} stroke={t.furnitureRim} strokeWidth={1.4} fill="none" opacity={0.6} />
    <path d={`M-20,${horizon - 58}v40`} stroke={t.skirting} strokeWidth={1.2} opacity={0.8} />
    <path d={`M318,${horizon + 6}V${horizon - 70}h90V${horizon + 6}Z`} fill={t.furniture} />
    <path d={`M318,${horizon - 70}h90`} stroke={t.furnitureRim} strokeWidth={1.4} opacity={0.6} />
    <path d={`M322,${horizon - 36}h82`} stroke={t.skirting} strokeWidth={1.2} />
    <path d={`M340,${horizon - 70}l4,-14h18l4,14Z`} fill={t.furniture} />
    <path d={`M353,${horizon - 84}c-14,-6 -22,-22 -16,-34c8,6 14,18 16,34c2,-16 10,-30 22,-36c4,14 -6,30 -22,36Z`} fill={t.furniture} />
    <path d={`M353,${horizon - 84}c2,-16 10,-30 22,-36`} stroke={t.furnitureRim} strokeWidth={1} fill="none" opacity={0.5} />
  </g>
);

/** A curtain hanging down one side, gathered by a tie, its folds catching the window light. */
const curtain = (side: 1 | -1) =>
  function Curtain({ t }: PieceProps) {
    const m = (x: number) => (side > 0 ? x : 390 - x);
    const outline = `M${m(X0)},-4L${m(64)},-4C${m(70)},60 ${m(52)},150 ${m(18)},236C${m(30)},300 ${m(44)},400 ${m(36)},510L${m(X0)},510Z`;
    const folds = [-70, -40, -12, 14].map(
      (x, i) => `M${m(x + 20 + i * 4)},0C${m(x + 22 + i * 4)},90 ${m(x + 8)},170 ${m(x - 6 + i * 3)},236C${m(x + i * 4)},320 ${m(x + 6 + i * 4)},420 ${m(x + i * 5)},510`,
    );
    return (
      <g>
        <path d={outline} fill={t.curtain} />
        {folds.map((d, i) => (
          <path key={i} d={d} stroke={t.curtainFold} strokeWidth={9} fill="none" opacity={0.7} />
        ))}
        <path d={`M${m(64)},-4C${m(70)},60 ${m(52)},150 ${m(18)},236C${m(30)},300 ${m(44)},400 ${m(36)},510`} stroke={t.curtainLit} strokeWidth={2.4} fill="none" opacity={0.7} />
        <ellipse cx={m(10)} cy={238} rx={16} ry={5} fill={t.curtainFold} />
        <path d={`M${m(-6)},236q16,-6 32,0`} stroke={t.curtainLit} strokeWidth={1.2} fill="none" opacity={0.7} />
        <path d={`M${m(X0)},34H${m(120)}`} stroke={t.frame} strokeWidth={4} strokeLinecap="round" />
        <circle cx={m(120)} cy={34} r={4.5} fill={t.frame} />
        <path d={`M${m(X0)},32.6H${m(120)}`} stroke={t.frameLit} strokeWidth={0.8} opacity={0.6} />
      </g>
    );
  };

export const GENERIC_ROOM: StageConfig = {
  key: GENERIC_ROOM_BACKDROP,
  label: 'Generic: a room at night (interior maps without their own backdrop)',
  sky: 'room',
  horizon: 270,
  far: WindowFar,
  mid: RoomMid,
  framers: [curtain(1), curtain(-1)],
  floor: {
    kind: 'wood',
    reflections: [
      { x: 195, w: 120, h: 110, color: STAGE_LIGHT.moonShaft, opacity: 0.32 },
      { x: 356, w: 12, h: 90, color: LIGHTS.lampMid, opacity: 0.4 },
    ],
  },
  lights: [
    { x: 195, y: 360, r: 0, color: STAGE_LIGHT.moonShaft, pool: { x: 195, y: 372, rx: 190, ry: 64, opacity: 0.6 } },
    { x: 356, y: 172, r: 40, color: GLOW.door, post: 280, pool: { x: 352, y: 292, rx: 80, ry: 20 } },
  ],
  bokeh: [
    { x: 380, y: 160, r: 12, color: LIGHTS.lampMid, opacity: 0.35 },
    { x: 4, y: 460, r: 16, color: STAGE_LIGHT.moonShaft, opacity: 0.25 },
  ],
};
