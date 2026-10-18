import { useMemo } from 'react';
import { GLOW, LIGHTS, SKY_ART, clockMinutes, gradeTiles, mixHex, skyAt, type Sky } from '../palette';
import { useSvgIds } from '../useSvgIds';

/**
 * The anime-film sky behind a map (art direction § 2.7 *Backgrounds*, § 8.4 *Map stack*): the
 * clock's gradient (`skyAt`), a faint milky band, stars with cross sparkles, the moon (or the
 * rising sun) by the hour, clouds lit from below by the city, a two-row skyline with lit windows,
 * horizon bokeh, and the dark floor of night the diorama floats over. Interiors get a dark room
 * with a moonlit window glow instead.
 *
 * Three parallax layers move at 0.1×, 0.2× and 0.35× of the camera (`shift`, world pixels from
 * the map's centre). Each layer is a static SVG, rendered once per time and size and moved only by
 * `transform`, so the blur on it (≤ 8 blurred elements, § 8.4) is rasterised once.
 */

type Props = {
  time: string;
  interior?: boolean;
  /** The layer's size in pixels (the map viewport) */
  width: number;
  height: number;
  /** Camera offset from the map's centre, in world pixels */
  shift: { x: number; y: number };
  /** Freeze parallax (reduced motion keeps the sky still) */
  still?: boolean;
};

/** Parallax factors of the far (stars, moon), mid (clouds) and near (skyline) layers. */
export const PARALLAX = [0.1, 0.2, 0.35] as const;
/** How far past the viewport each layer extends, so parallax never shows an edge. */
const MARGIN = 120;
/** The horizon's height in the viewport (0 = top). */
export const HORIZON = 0.4;

/** mulberry32, seeded per time and size so the sky is the same on every render. */
export function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const n = (value: number) => Math.round(value * 10) / 10;
export const dot = (x: number, y: number, r: number) => `M${n(x - r)},${n(y)}a${n(r)},${n(r)} 0 1,0 ${n(r * 2)},0a${n(r)},${n(r)} 0 1,0 ${n(-r * 2)},0Z`;
export const sparkle = (x: number, y: number, s: number) =>
  `M${n(x)},${n(y - s)}Q${n(x + 0.5)},${n(y - 0.5)} ${n(x + s)},${n(y)}Q${n(x + 0.5)},${n(y + 0.5)} ${n(x)},${n(y + s)}Q${n(x - 0.5)},${n(y + 0.5)} ${n(x - s)},${n(y)}Q${n(x - 0.5)},${n(y - 0.5)} ${n(x)},${n(y - s)}Z`;

/** One cloud silhouette (the reference generator's), around (cx, cy) at scale sc. */
export const cloudPath = (cx: number, cy: number, sc: number) =>
  `M${n(cx - 60 * sc)},${n(cy)}C${n(cx - 62 * sc)},${n(cy - 14 * sc)} ${n(cx - 44 * sc)},${n(cy - 22 * sc)} ${n(cx - 32 * sc)},${n(cy - 16 * sc)}` +
  `C${n(cx - 28 * sc)},${n(cy - 34 * sc)} ${n(cx - 4 * sc)},${n(cy - 38 * sc)} ${n(cx + 6 * sc)},${n(cy - 22 * sc)}` +
  `C${n(cx + 16 * sc)},${n(cy - 36 * sc)} ${n(cx + 44 * sc)},${n(cy - 30 * sc)} ${n(cx + 44 * sc)},${n(cy - 12 * sc)}` +
  `C${n(cx + 58 * sc)},${n(cy - 14 * sc)} ${n(cx + 66 * sc)},${n(cy - 4 * sc)} ${n(cx + 62 * sc)},${n(cy + 4 * sc)}` +
  `C${n(cx + 30 * sc)},${n(cy + 10 * sc)} ${n(cx - 30 * sc)},${n(cy + 10 * sc)} ${n(cx - 60 * sc)},${n(cy)}Z`;

type Layers = { far: JSX.Element; mid: JSX.Element; near: JSX.Element };

/** The open-sky layers for one time and size. */
function openSky(sky: Sky, w: number, h: number, id: (name: string) => string, time: string): Layers {
  const rand = rng(clockMinutes(time) * 7919 + Math.round(w) * 31 + Math.round(h));
  const W = w + MARGIN * 2;
  const H = h + MARGIN * 2;
  const horizon = MARGIN + h * HORIZON;
  const night = Math.max(0, 1 - sky.dawn * 1.1);
  const { scenery } = gradeTiles(time);

  // Stars: three brightness bands of dots, four cross sparkles with soft halos
  const bands = ['', '', ''];
  for (let i = 0; i < Math.round(W * 0.22); i += 1) {
    const x = rand() * W;
    const y = rand() * (horizon - 30);
    const r = [0.45, 0.6, 0.6, 0.9, 1.2][Math.floor(rand() * 5)];
    bands[Math.floor(rand() * 3)] += dot(x, y, r);
  }
  const sparkles: [number, number, number][] = [
    [MARGIN + w * 0.12, MARGIN + h * 0.06, 6],
    [MARGIN + w * 0.84, MARGIN + h * 0.05, 5],
    [MARGIN + w * 0.62, MARGIN + h * 0.13, 4],
    [MARGIN + w * 0.4, MARGIN + h * 0.03, 4.4],
  ];

  // The moon rides high at midnight and sets by 04:30; the sun breaks at 05:29 (§ 3.2)
  const moonUp = sky.moon > -0.05;
  const moonX = MARGIN + w * 0.22;
  // Highest at about a quarter of the view, below the HUD
  const moonY = horizon - Math.max(0, sky.moon) * (horizon - MARGIN - h * 0.24) - 8;
  const sunUp = sky.dawn >= 0.85;

  const far = (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <linearGradient id={id('milky')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SKY_ART.milky} stopOpacity="0" />
          <stop offset=".5" stopColor={SKY_ART.milky} stopOpacity=".22" />
          <stop offset="1" stopColor={SKY_ART.milky} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('moon')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={SKY_ART.moon} stopOpacity=".9" />
          <stop offset=".25" stopColor={SKY_ART.moonHalo} stopOpacity=".35" />
          <stop offset="1" stopColor={SKY_ART.moonHaloOuter} stopOpacity="0" />
        </radialGradient>
        <filter id={id('blur8')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={id('blur2')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <g opacity={night}>
        <path
          d={`M0,${n(MARGIN + h * 0.02)}C${n(W * 0.3)},${n(MARGIN + h * 0.1)} ${n(W * 0.65)},${n(MARGIN + h * 0.18)} ${W},${n(MARGIN + h * 0.32)}L${W},${n(MARGIN + h * 0.38)}C${n(W * 0.65)},${n(MARGIN + h * 0.24)} ${n(W * 0.3)},${n(MARGIN + h * 0.16)} 0,${n(MARGIN + h * 0.08)}Z`}
          fill={`url(#${id('milky')})`}
          filter={`url(#${id('blur8')})`}
        />
        <path d={bands[0]} fill={SKY_ART.star} opacity={0.4} />
        <path d={bands[1]} fill={SKY_ART.star} opacity={0.7} />
        <path d={bands[2]} fill={SKY_ART.star} />
        <g filter={`url(#${id('blur2')})`} fill={SKY_ART.starHalo} opacity={0.3}>
          {sparkles.map(([x, y, s]) => (
            <circle key={`${x}`} cx={n(x)} cy={n(y)} r={n(s * 1.6)} />
          ))}
        </g>
        <path d={sparkles.map(([x, y, s]) => sparkle(x, y, s)).join('')} fill={SKY_ART.star} />
      </g>
      {moonUp && (
        <g opacity={Math.min(1, 0.35 + night)}>
          <circle cx={n(moonX)} cy={n(moonY)} r={58} fill={`url(#${id('moon')})`} />
          <circle cx={n(moonX)} cy={n(moonY)} r={15} fill={SKY_ART.moon} />
          <circle cx={n(moonX - 5)} cy={n(moonY - 4)} r={3} fill={SKY_ART.moonCrater} opacity={0.7} />
          <circle cx={n(moonX + 6)} cy={n(moonY + 6)} r={2} fill={SKY_ART.moonCrater} opacity={0.6} />
        </g>
      )}
    </svg>
  );

  // Clouds: dark bodies, a moonlit inner lobe, a city-glow underside rim, a bright top edge
  const under = mixHex(SKY_ART.cloudUnder, sky.horizon, 0.35);
  const top = mixHex(SKY_ART.cloudTop, sky.mid, 0.4);
  const midTone = mixHex(SKY_ART.cloudMid, sky.horizon, 0.25);
  const clouds: [number, number, number, number, number][] = [
    [MARGIN + w * 0.78, MARGIN + h * 0.2, 1.2, 1, 1],
    [MARGIN + w * 0.26, MARGIN + h * 0.27, 0.95, -1, 0.8],
    [MARGIN + w * 0.66, MARGIN + h * 0.09, 0.75, -1, 1.15],
    [MARGIN + w * 0.04, MARGIN + h * 0.17, 0.7, 1, 0.7],
  ];
  const mid = (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <linearGradient id={id('cloud')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset=".7" stopColor={midTone} />
          <stop offset="1" stopColor={under} />
        </linearGradient>
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation=".9" />
        </filter>
      </defs>
      <g filter={`url(#${id('soft')})`}>
        {clouds.map(([cx, cy, sc, fx, fy]) => {
          const d = cloudPath(cx, cy, sc);
          return (
            <g key={`${cx}`} transform={`translate(${n(cx)} ${n(cy)}) scale(${fx * 1.15} ${fy}) translate(${n(-cx)} ${n(-cy)})`}>
              <path d={d} fill={`url(#${id('cloud')})`} opacity={0.95} />
              <path d={d} fill={SKY_ART.cloudLobe} opacity={0.32} transform={`translate(${n(cx)} ${n(cy)}) scale(.62 .55) translate(${n(-cx - 10 * sc)} ${n(-cy - 14 * sc)})`} />
              <path d={d} fill={SKY_ART.cloudLobeLight} opacity={0.22} transform={`translate(${n(cx)} ${n(cy)}) scale(.34 .3) translate(${n(-cx - 26 * sc)} ${n(-cy - 40 * sc)})`} />
              <path
                d={`M${n(cx - 58 * sc)},${n(cy + 1)}C${n(cx - 30 * sc)},${n(cy + 8 * sc)} ${n(cx + 30 * sc)},${n(cy + 8 * sc)} ${n(cx + 61 * sc)},${n(cy + 3 * sc)}`}
                stroke={SKY_ART.cloudRim}
                strokeWidth={2.4}
                fill="none"
                opacity={0.8}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </g>
      {clouds.map(([cx, cy, sc, fx, fy]) => (
        <path
          key={`${cx}`}
          transform={`translate(${n(cx)} ${n(cy)}) scale(${fx * 1.15} ${fy}) translate(${n(-cx)} ${n(-cy)})`}
          d={`M${n(cx - 30 * sc)},${n(cy - 17 * sc)}C${n(cx - 26 * sc)},${n(cy - 32 * sc)} ${n(cx - 6 * sc)},${n(cy - 36 * sc)} ${n(cx + 4 * sc)},${n(cy - 24 * sc)}C${n(cx + 14 * sc)},${n(cy - 36 * sc)} ${n(cx + 40 * sc)},${n(cy - 30 * sc)} ${n(cx + 42 * sc)},${n(cy - 14 * sc)}`}
          stroke={SKY_ART.cloudEdge}
          strokeWidth={1.2}
          fill="none"
          opacity={0.5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );

  // The city: far ridge, glow band, two skyline rows with lit windows, bokeh, the floor of night
  const skyline = (base: number, minH: number, maxH: number) => {
    let d = '';
    const windows = { warm: '', pale: '', cool: '', dim: '' };
    let x = -4;
    while (x < W + 4) {
      const bw = [10, 14, 18, 22, 26][Math.floor(rand() * 5)];
      const bh = minH + rand() * (maxH - minH);
      d += `M${n(x)},${n(base - bh)}h${bw}v${n(bh)}h${-bw}Z`;
      for (let k = 0; k < Math.floor((bw * bh) / 70); k += 1) {
        const wx = x + 1.5 + rand() * (bw - 3.5);
        const wy = base - 3 - rand() * (bh - 5);
        const pick = rand();
        const key = pick < 0.45 ? 'warm' : pick < 0.62 ? 'pale' : pick < 0.72 ? 'cool' : 'dim';
        windows[key] += `M${n(wx)},${n(wy)}h1.6v1.6h-1.6Z`;
      }
      x += bw + [0, 1, 3][Math.floor(rand() * 3)];
    }
    return { d, windows };
  };
  const back = skyline(horizon + 4, 26, 74);
  const front = skyline(horizon + 8, 12, 40);
  const bokeh: [number, number, number, string][] = [];
  const bokehTones = [LIGHTS.lampMid, SKY_ART.bokehPink, LIGHTS.windowCool, SKY_ART.bokehGold];
  for (let i = 0; i < Math.round(W / 16); i += 1) bokeh.push([rand() * W, horizon - 26 + rand() * 32, [2, 3, 4][Math.floor(rand() * 3)], bokehTones[Math.floor(rand() * 4)]]);
  const floorTop = horizon + 6;

  const near = (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(scenery.floorTop, sky.horizon, 0.25)} />
          <stop offset=".3" stopColor={scenery.floorMid} />
          <stop offset="1" stopColor={scenery.floorBottom} />
        </linearGradient>
        <radialGradient id={id('sun')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={SKY_ART.sunCore} stopOpacity="1" />
          <stop offset=".3" stopColor={SKY_ART.sun} stopOpacity=".7" />
          <stop offset="1" stopColor={SKY_ART.sun} stopOpacity="0" />
        </radialGradient>
        <filter id={id('blur8')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={id('blur2')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      {sunUp && <circle cx={n(MARGIN + w * 0.7)} cy={n(horizon - 6)} r={70} fill={`url(#${id('sun')})`} opacity={(sky.dawn - 0.85) / 0.15} />}
      <path
        d={`M0,${n(horizon - 54)}C${n(W * 0.1)},${n(horizon - 80)} ${n(W * 0.2)},${n(horizon - 88)} ${n(W * 0.29)},${n(horizon - 74)}C${n(W * 0.38)},${n(horizon - 98)} ${n(W * 0.5)},${n(horizon - 104)} ${n(W * 0.61)},${n(horizon - 84)}C${n(W * 0.71)},${n(horizon - 96)} ${n(W * 0.79)},${n(horizon - 92)} ${n(W * 0.87)},${n(horizon - 80)}C${n(W * 0.92)},${n(horizon - 86)} ${n(W * 0.97)},${n(horizon - 82)} ${W},${n(horizon - 76)}L${W},${n(horizon + 20)}L0,${n(horizon + 20)}Z`}
        fill={mixHex(scenery.ridge, sky.horizon, 0.2)}
      />
      <ellipse cx={n(W / 2)} cy={n(horizon - 4)} rx={n(W * 0.66)} ry={60} fill={mixHex(LIGHTS.cityGlowWarm, sky.horizon, 0.3)} opacity={0.35} filter={`url(#${id('blur8')})`} />
      <path d={back.d} fill={scenery.skyline} />
      <path d={back.windows.warm} fill={LIGHTS.windowWarm} opacity={0.85} />
      <path d={back.windows.pale} fill={LIGHTS.windowPale} opacity={0.7} />
      <path d={back.windows.cool} fill={LIGHTS.windowCool} opacity={0.75} />
      <path d={back.windows.dim} fill={LIGHTS.windowWarm} opacity={0.4} />
      <g filter={`url(#${id('blur2')})`} opacity={0.7}>
        {bokeh.map(([x, y, r, tone], index) => (
          <circle key={index} cx={n(x)} cy={n(y)} r={r} fill={tone} />
        ))}
      </g>
      <path d={front.d} fill={scenery.skylineNear} />
      <path d={front.windows.warm} fill={LIGHTS.windowWarm} opacity={0.9} />
      <path d={front.windows.pale + front.windows.cool} fill={LIGHTS.windowPale} opacity={0.6} />
      <rect x={0} y={n(floorTop)} width={W} height={n(H - floorTop)} fill={`url(#${id('floor')})`} />
      <ellipse cx={n(W / 2)} cy={n(floorTop + 4)} rx={n(W * 0.62)} ry={20} fill={SKY_ART.haze} opacity={0.3} filter={`url(#${id('blur8')})`} />
    </svg>
  );

  return { far, mid, near };
}

/** Indoors (§ 4.2 *家*: "sky only through the window"): a dark room with a cool moon glow and warm dust. */
function room(w: number, h: number, id: (name: string) => string, time: string): Layers {
  const rand = rng(clockMinutes(time) * 104729 + Math.round(w));
  const W = w + MARGIN * 2;
  const H = h + MARGIN * 2;
  const motes: [number, number, number][] = [];
  for (let i = 0; i < 9; i += 1) motes.push([MARGIN + rand() * w, MARGIN + rand() * h, 3 + rand() * 7]);
  const far = (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <radialGradient id={id('moonGlow')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={GLOW.moon} stopOpacity=".22" />
          <stop offset="1" stopColor={GLOW.moon} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('warm')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={SKY_ART.roomGlow} stopOpacity=".9" />
          <stop offset="1" stopColor={SKY_ART.roomGlow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('mote')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={LIGHTS.lampMid} stopOpacity=".35" />
          <stop offset="1" stopColor={LIGHTS.lampMid} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={n(MARGIN + w * 0.15)} cy={n(MARGIN + h * 0.1)} rx={n(w * 0.7)} ry={n(h * 0.35)} fill={`url(#${id('moonGlow')})`} />
      <ellipse cx={n(MARGIN + w * 0.5)} cy={n(MARGIN + h * 0.55)} rx={n(w * 0.8)} ry={n(h * 0.4)} fill={`url(#${id('warm')})`} />
      {motes.map(([x, y, r], index) => (
        <circle key={index} cx={n(x)} cy={n(y)} r={n(r)} fill={`url(#${id('mote')})`} />
      ))}
    </svg>
  );
  return { far, mid: <svg width={0} height={0} aria-hidden="true" />, near: <svg width={0} height={0} aria-hidden="true" /> };
}

const layerStyle = (dx: number, dy: number) => ({
  left: -MARGIN,
  top: -MARGIN,
  transform: `translate3d(${n(dx)}px, ${n(dy)}px, 0)`,
  willChange: 'transform',
});

const clamp = (value: number) => Math.max(-MARGIN * 0.9, Math.min(MARGIN * 0.9, value));

export const SkyLayer = ({ time, interior = false, width, height, shift, still = false }: Props) => {
  const sky = skyAt(time);
  const id = useSvgIds('sky');
  // Built once per time and size: re-renders while walking reuse the same elements, so React
  // skips the static SVGs and only the three wrappers' transforms change
  const layers = useMemo(
    () => (interior ? room(width, height, id, time) : openSky(sky, width, height, id, time)),
    [interior, width, height, id, time, sky],
  );
  const offset = (factor: number, axis: 'x' | 'y') => (still ? 0 : clamp(-shift[axis] * factor));
  const background = interior
    ? `radial-gradient(ellipse 90% 70% at 50% 45%, ${SKY_ART.roomTop} 0%, ${SKY_ART.roomBottom} 100%)`
    : `linear-gradient(180deg, ${sky.top} 0%, ${sky.mid} ${HORIZON * 100 * 0.62}%, ${sky.horizon} ${HORIZON * 100 + 6}%, ${SKY_ART.floorBottom} 100%)`;
  return (
    <div aria-hidden="true" data-sky={interior ? 'room' : time} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background, contain: 'paint' }}>
      <div className="absolute" style={layerStyle(offset(PARALLAX[0], 'x'), offset(PARALLAX[0], 'y'))}>
        {layers.far}
      </div>
      {!interior && (
        <>
          <div className="absolute" style={layerStyle(offset(PARALLAX[1], 'x'), offset(PARALLAX[1], 'y'))}>
            {layers.mid}
          </div>
          <div className="absolute" style={layerStyle(offset(PARALLAX[2], 'x'), offset(PARALLAX[2], 'y'))}>
            {layers.near}
          </div>
        </>
      )}
    </div>
  );
};
