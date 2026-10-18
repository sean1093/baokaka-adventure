import { memo, useMemo, type ReactElement } from 'react';
import { LIGHTS, SKY_ART, STAGE_LIGHT, gradeStage, mixHex, skyAt, type StageTokens } from '../palette';
import { cloudPath, dot, n, rng, sparkle } from '../sky/SkyLayer';
import { useSvgIds } from '../useSvgIds';
import type { Bokeh, PieceProps, Reflection, StageConfig, StageLight } from './types';

/**
 * The battle stage backdrop (art direction § 4.1 item 5, § 7.4, § 8.4): one component driven by a
 * per-location `StageConfig`. Everything here is one static SVG, built once per (config, clock)
 * and memoised, so a battle's turns never touch it: blur is allowed on it (≤ 8 blurred elements,
 * § 8.4), and nothing in it animates.
 */

/** Stage units: the 390×500 frame the layout is authored in (the § 7.4 stage at 390×844). */
export const STAGE_W = 390;
export const STAGE_H = 500;
/** The painted area: wider than the frame, so any phone shape sees a full scene (the sides crop). */
export const STAGE_VIEW = { x: -110, y: 0, w: 610, h: 500 } as const;
const VIEWBOX = `${STAGE_VIEW.x} ${STAGE_VIEW.y} ${STAGE_VIEW.w} ${STAGE_VIEW.h}`;
const X0 = STAGE_VIEW.x;
const X1 = STAGE_VIEW.x + STAGE_VIEW.w;

/**
 * Where a stage-unit point lands in a stage box of `width`×`height` pixels. The SVG uses
 * `xMidYMid slice` on the wide view box, so on a portrait phone it scales to the box height (`k`)
 * and crops the sides. Actors use the same `k` for their size and height, and spread across the
 * box's whole width (`x` as a fraction of the 390 frame), so nobody is ever cropped.
 */
export function stageScale(width: number, height: number): number {
  return Math.max(width / STAGE_VIEW.w, height / STAGE_VIEW.h);
}

/** A string hash for seeds (FNV-1a). */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Number of `filter` references in the stage's markup must stay ≤ this (§ 8.4). */
export const STAGE_BLUR_BUDGET = 8;

// ---------------------------------------------------------------------------------------------
// Drawing helpers for pieces

/**
 * A skyline: a row of blocks between x0 and x1 standing on `base`, heights in [minH, maxH], plus
 * lit windows in four tones. Returns path data, so a whole skyline is a handful of elements.
 */
export function skyline(rand: () => number, base: number, minH: number, maxH: number, x0: number = X0, x1: number = X1) {
  let d = '';
  const windows = { warm: '', pale: '', cool: '', dim: '' };
  let x = x0;
  while (x < x1) {
    const bw = [9, 12, 16, 20, 24][Math.floor(rand() * 5)];
    const bh = minH + rand() * (maxH - minH);
    d += `M${n(x)},${n(base - bh)}h${bw}v${n(bh)}h${-bw}Z`;
    // A stepped crown on some of the taller blocks
    if (bh > minH + (maxH - minH) * 0.6 && rand() < 0.5) d += `M${n(x + bw * 0.25)},${n(base - bh - 5)}h${n(bw * 0.5)}v5h${n(-bw * 0.5)}Z`;
    for (let k = 0; k < Math.floor((bw * bh) / 60); k += 1) {
      const wx = x + 1.5 + rand() * (bw - 3.5);
      const wy = base - 3 - rand() * (bh - 5);
      const pick = rand();
      const key = pick < 0.42 ? 'warm' : pick < 0.6 ? 'pale' : pick < 0.7 ? 'cool' : 'dim';
      windows[key] += `M${n(wx)},${n(wy)}h1.6v1.6h-1.6Z`;
    }
    x += bw + [0, 1, 3][Math.floor(rand() * 3)];
  }
  return { d, windows };
}

/** Lit windows of a skyline, in their four tones. */
export const Windows = ({ windows, opacity = 1 }: { windows: ReturnType<typeof skyline>['windows']; opacity?: number }) => (
  <g opacity={opacity}>
    <path d={windows.warm} fill={LIGHTS.windowWarm} opacity={0.85} />
    <path d={windows.pale} fill={LIGHTS.windowPale} opacity={0.7} />
    <path d={windows.cool} fill={LIGHTS.windowCool} opacity={0.75} />
    <path d={windows.dim} fill={LIGHTS.windowWarm} opacity={0.3} />
  </g>
);

/**
 * A canopy: overlapping leaf clumps (circles) as one path, a lighter lobe on each clump toward the
 * light, and moonlit rim arcs over their tops. `light` is where the moon is: −1 left, 1 right.
 */
export function canopy(rand: () => number, clumps: readonly (readonly [number, number, number])[], light: 1 | -1) {
  let body = '';
  let lit = '';
  let rim = '';
  for (const [cx, cy, r] of clumps) {
    body += dot(cx, cy, r * 0.9);
    // A leafy edge: small lobes all round the clump, so it never reads as a plain disc
    const lobes = 9;
    const turn = rand() * Math.PI;
    for (let i = 0; i < lobes; i += 1) {
      const a = turn + (i / lobes) * Math.PI * 2;
      const lr = r * (0.26 + rand() * 0.12);
      body += dot(cx + Math.cos(a) * (r * 0.9 - lr * 0.55), cy + Math.sin(a) * (r * 0.9 - lr * 0.55), lr);
    }
    // The lit side: two overlapping lobes up and toward the light
    lit += dot(cx + light * r * 0.26, cy - r * 0.3, r * 0.42);
    lit += dot(cx + light * r * 0.02, cy - r * 0.42, r * 0.3);
    const a0 = light < 0 ? -2.6 : -1.6;
    const a1 = a0 + 0.8 + rand() * 0.4;
    const rr = r * 0.86;
    rim += `M${n(cx + Math.cos(a0) * rr)},${n(cy + Math.sin(a0) * rr)}A${n(rr)},${n(rr)} 0 0,1 ${n(cx + Math.cos(a1) * rr)},${n(cy + Math.sin(a1) * rr)}`;
  }
  return { body, lit, rim };
}

/** Leaf texture: little crescent dabs scattered over a canopy. */
export function leafDabs(rand: () => number, clumps: readonly (readonly [number, number, number])[], count: number) {
  let d = '';
  for (let i = 0; i < count; i += 1) {
    const [cx, cy, r] = clumps[Math.floor(rand() * clumps.length)];
    const a = rand() * Math.PI * 2;
    const dist = rand() * r * 0.85;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    const s = 2 + rand() * 3;
    d += `M${n(x - s)},${n(y)}q${n(s)},${n(-s * 0.9)} ${n(s * 2)},0q${n(-s)},${n(-s * 0.35)} ${n(-s * 2)},0Z`;
  }
  return d;
}

/** A soft radial bloom gradient for a light colour (centre bright, edge clear). */
export const BloomStops = ({ color, core = 0.85 }: { color: string; core?: number }) => (
  <>
    <stop offset="0" stopColor={mixHex(color, STAGE_LIGHT.uplightCore, 0.5)} stopOpacity={core} />
    <stop offset=".25" stopColor={color} stopOpacity={core * 0.45} />
    <stop offset="1" stopColor={color} stopOpacity="0" />
  </>
);

// ---------------------------------------------------------------------------------------------
// The layers every stage shares

const DEFAULT_MOON = { x: 118, y: 96 };

/** The night sky of the clock (§ 2.7, § 3.2): gradient, milky band, stars, moon or sun, two lit clouds. */
function OpenSky({ time, horizon, id, seed, moon }: { time: string; horizon: number; id: (name: string) => string; seed: number; moon: { x: number; y: number } }) {
  const sky = skyAt(time);
  const rand = rng(seed);
  const night = Math.max(0, 1 - sky.dawn * 1.1);
  const bands = ['', '', ''];
  for (let i = 0; i < 110; i += 1) {
    const x = X0 + rand() * STAGE_VIEW.w;
    const y = rand() * (horizon - 50);
    const r = [0.45, 0.6, 0.6, 0.85, 1.15][Math.floor(rand() * 5)];
    bands[Math.floor(rand() * 3)] += dot(x, y, r);
  }
  const sparkles: [number, number, number][] = [
    [40, 54, 5.5],
    [356, 30, 4.6],
    [236, 132, 4],
    [180, 36, 4.4],
  ];
  const moonUp = sky.moon > -0.05;
  const moonY = horizon - 40 - Math.max(0, sky.moon) * (horizon - 40 - moon.y);
  const sunUp = sky.dawn >= 0.85;
  const under = mixHex(SKY_ART.cloudUnder, sky.horizon, 0.35);
  const top = mixHex(SKY_ART.cloudTop, sky.mid, 0.4);
  const midTone = mixHex(SKY_ART.cloudMid, sky.horizon, 0.25);
  const clouds: [number, number, number, number][] = [
    [312, 150, 0.85, -1],
    [-34, 176, 0.75, 1],
  ];
  return (
    <g>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset=".46" stopColor={sky.mid} />
          <stop offset=".88" stopColor={sky.horizon} />
          <stop offset="1" stopColor={mixHex(sky.horizon, LIGHTS.cityGlowWarm, 0.3)} />
        </linearGradient>
        <linearGradient id={id('milky')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SKY_ART.milky} stopOpacity="0" />
          <stop offset=".5" stopColor={SKY_ART.milky} stopOpacity=".24" />
          <stop offset="1" stopColor={SKY_ART.milky} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('moon')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={SKY_ART.moon} stopOpacity=".9" />
          <stop offset=".22" stopColor={SKY_ART.moonHalo} stopOpacity=".38" />
          <stop offset="1" stopColor={SKY_ART.moonHaloOuter} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('sun')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={SKY_ART.sunCore} />
          <stop offset=".3" stopColor={SKY_ART.sun} stopOpacity=".7" />
          <stop offset="1" stopColor={SKY_ART.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('cloud')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset=".7" stopColor={midTone} />
          <stop offset="1" stopColor={under} />
        </linearGradient>
        <filter id={id('blur8')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id={id('blur2')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation=".9" />
        </filter>
      </defs>
      <rect x={X0} y={0} width={STAGE_VIEW.w} height={horizon + 12} fill={`url(#${id('sky')})`} />
      <g opacity={night}>
        <path
          d={`M${X0},${n(horizon * 0.1)}C${n(40)},${n(horizon * 0.2)} ${n(260)},${n(horizon * 0.34)} ${X1},${n(horizon * 0.62)}L${X1},${n(horizon * 0.74)}C${n(260)},${n(horizon * 0.46)} ${n(40)},${n(horizon * 0.32)} ${X0},${n(horizon * 0.24)}Z`}
          fill={`url(#${id('milky')})`}
          filter={`url(#${id('blur8')})`}
        />
        <path d={bands[0]} fill={SKY_ART.star} opacity={0.4} />
        <path d={bands[1]} fill={SKY_ART.star} opacity={0.7} />
        <path d={bands[2]} fill={SKY_ART.star} />
        <g filter={`url(#${id('blur2')})`} fill={SKY_ART.starHalo} opacity={0.35}>
          {sparkles.map(([x, y, s]) => (
            <circle key={x} cx={x} cy={y} r={n(s * 1.7)} />
          ))}
        </g>
        <path d={sparkles.map(([x, y, s]) => sparkle(x, y, s)).join('')} fill={SKY_ART.star} />
      </g>
      {moonUp && (
        <g opacity={Math.min(1, 0.35 + night)}>
          <circle cx={moon.x} cy={n(moonY)} r={70} fill={`url(#${id('moon')})`} />
          <circle cx={moon.x} cy={n(moonY)} r={14} fill={SKY_ART.moon} />
          <circle cx={moon.x - 5} cy={n(moonY - 4)} r={3.2} fill={SKY_ART.moonCrater} opacity={0.7} />
          <circle cx={moon.x + 5} cy={n(moonY + 5)} r={2.2} fill={SKY_ART.moonCrater} opacity={0.6} />
          <circle cx={moon.x + 2} cy={n(moonY - 8)} r={1.3} fill={SKY_ART.moonCrater} opacity={0.5} />
        </g>
      )}
      {sunUp && <circle cx={300} cy={horizon - 8} r={90} fill={`url(#${id('sun')})`} opacity={(sky.dawn - 0.85) / 0.15} />}
      <g filter={`url(#${id('soft')})`}>
        {clouds.map(([cx, cy, sc, fx]) => {
          const d = cloudPath(cx, cy, sc);
          return (
            <g key={cx} transform={`translate(${cx} ${cy}) scale(${fx * 1.2} 1) translate(${-cx} ${-cy})`}>
              <path d={d} fill={`url(#${id('cloud')})`} opacity={0.92} />
              <path d={d} fill={SKY_ART.cloudLobe} opacity={0.3} transform={`translate(${cx} ${cy}) scale(.62 .55) translate(${n(-cx - 10 * sc)} ${n(-cy - 14 * sc)})`} />
              <path
                d={`M${n(cx - 58 * sc)},${n(cy + 1)}C${n(cx - 30 * sc)},${n(cy + 8 * sc)} ${n(cx + 30 * sc)},${n(cy + 8 * sc)} ${n(cx + 61 * sc)},${n(cy + 3 * sc)}`}
                stroke={SKY_ART.cloudRim}
                strokeWidth={2.2}
                fill="none"
                opacity={0.8}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </g>
      {/* The city's glow along the horizon */}
      <ellipse cx={195} cy={horizon - 6} rx={380} ry={54} fill={mixHex(LIGHTS.cityGlowWarm, sky.horizon, 0.3)} opacity={0.32} filter={`url(#${id('blur8')})`} />
    </g>
  );
}

/** An interior wall: dark, faintly lifted where the window's moonlight falls. */
function RoomWall({ t, horizon, id }: { t: StageTokens; horizon: number; id: (name: string) => string }) {
  return (
    <g>
      <defs>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.wallTop} />
          <stop offset="1" stopColor={t.wallBottom} />
        </linearGradient>
        <radialGradient id={id('wallGlow')} cx=".5" cy=".42" r=".5">
          <stop offset="0" stopColor={STAGE_LIGHT.moonShaft} stopOpacity=".2" />
          <stop offset="1" stopColor={STAGE_LIGHT.moonShaft} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={X0} y={0} width={STAGE_VIEW.w} height={horizon + 12} fill={`url(#${id('wall')})`} />
      <ellipse cx={195} cy={150} rx={260} ry={170} fill={`url(#${id('wallGlow')})`} />
    </g>
  );
}

/** The perspective floor, its joints and wet sheen, and the soft reflection streaks of the lights. */
function Floor({ t, time, horizon, kind, reflections, id }: { t: StageTokens; time: string; horizon: number; kind: 'pave' | 'wood'; reflections: readonly Reflection[]; id: (name: string) => string }) {
  const sky = skyAt(time);
  const wood = kind === 'wood';
  const [top, mid, bottom] = wood ? [t.woodTop, t.woodMid, t.woodBottom] : [mixHex(t.paveTop, sky.horizon, 0.22), t.paveMid, t.paveBottom];
  const vanish = { x: 195, y: horizon - 60 };
  const depth = STAGE_H - horizon;
  // Lines running away from the camera, converging past the horizon
  let rays = '';
  const step = wood ? 30 : 46;
  for (let x = -760; x <= 1150; x += step) {
    const along = (horizon - vanish.y) / (STAGE_H - vanish.y);
    rays += `M${n(vanish.x + (x - vanish.x) * along)},${horizon}L${x},${STAGE_H}`;
  }
  // Joints across, closer together toward the horizon
  let joints = '';
  const rows = wood ? 9 : 7;
  for (let k = 1; k <= rows; k += 1) {
    const y = horizon + depth * (k / rows) ** 1.9;
    joints += `M${X0},${n(y)}H${X1}`;
  }
  return (
    <g>
      <defs>
        <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset=".38" stopColor={mid} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={id('sheen')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wood ? t.woodLine : t.paveSheen} stopOpacity=".32" />
          <stop offset="1" stopColor={wood ? t.woodLine : t.paveSheen} stopOpacity="0" />
        </linearGradient>
        {reflections.map((streak, i) => (
          <linearGradient key={i} id={id(`refl${i}`)} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={streak.color} stopOpacity=".9" />
            <stop offset=".45" stopColor={streak.color} stopOpacity=".45" />
            <stop offset="1" stopColor={streak.color} stopOpacity="0" />
          </linearGradient>
        ))}
        <filter id={id('blur3')} x="-60%" y="-10%" width="220%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect x={X0} y={horizon} width={STAGE_VIEW.w} height={depth} fill={`url(#${id('floor')})`} />
      <rect x={X0} y={horizon} width={STAGE_VIEW.w} height={depth * 0.3} fill={`url(#${id('sheen')})`} />
      <path d={rays} stroke={wood ? t.woodJoint : t.paveLine} strokeWidth={wood ? 1.4 : 1} opacity={wood ? 0.55 : 0.2} fill="none" />
      <path d={joints} stroke={wood ? t.woodJoint : t.paveJoint} strokeWidth={1.3} opacity={wood ? 0.35 : 0.55} fill="none" />
      {wood && <path d={rays} stroke={t.woodLine} strokeWidth={0.6} opacity={0.12} fill="none" transform="translate(1.4 0)" />}
      <rect x={X0} y={horizon - 1} width={STAGE_VIEW.w} height={2} fill={wood ? t.skirting : t.paveJoint} opacity={0.6} />
      <g filter={`url(#${id('blur3')})`}>
        {reflections.map((streak, i) => (
          <rect key={i} x={n(streak.x - streak.w / 2)} y={streak.y ?? horizon + 4} width={streak.w} height={streak.h} fill={`url(#${id(`refl${i}`)})`} opacity={streak.opacity ?? 0.55} />
        ))}
      </g>
    </g>
  );
}

/** Lamp posts, blooms and floor pools. Blooms are radial gradients (no blur): they are light. */
function Lights({ t, lights, id }: { t: StageTokens; lights: readonly StageLight[]; id: (name: string) => string }) {
  return (
    <g>
      <defs>
        {lights.map((light, i) => (
          <radialGradient key={i} id={id(`bloom${i}`)} cx=".5" cy=".5" r=".5">
            <BloomStops color={light.color} />
          </radialGradient>
        ))}
        {lights.map((light, i) => (
          <radialGradient key={i} id={id(`pool${i}`)} cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor={light.color} stopOpacity=".55" />
            <stop offset=".5" stopColor={light.color} stopOpacity=".18" />
            <stop offset="1" stopColor={light.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {lights.map((light, i) =>
        light.pool ? (
          <ellipse key={`p${i}`} cx={light.pool.x} cy={light.pool.y} rx={light.pool.rx} ry={light.pool.ry} fill={`url(#${id(`pool${i}`)})`} opacity={light.pool.opacity ?? 1} />
        ) : null,
      )}
      {lights.map((light, i) =>
        light.post !== undefined ? (
          <g key={`l${i}`}>
            <path d={`M${light.x},${light.y + 3}V${light.post}`} stroke={t.post} strokeWidth={2.6} />
            <path d={`M${light.x - 0.8},${light.y + 5}V${light.post}`} stroke={t.postRim} strokeWidth={0.7} opacity={0.6} />
            <path d={`M${light.x - 3},${light.post}h6`} stroke={t.post} strokeWidth={2.2} strokeLinecap="round" />
            <path d={`M${light.x - 4},${light.y}h8l-1.5,-4h-5Z`} fill={t.post} />
            <circle cx={light.x} cy={light.y + 1.5} r={2.2} fill={mixHex(light.color, STAGE_LIGHT.uplightCore, 0.6)} />
          </g>
        ) : null,
      )}
      {lights.map((light, i) => (
        <circle key={`b${i}`} cx={light.x} cy={light.y} r={light.r} fill={`url(#${id(`bloom${i}`)})`} />
      ))}
    </g>
  );
}

/** Out-of-focus lights at the frame's corners. */
function BokehLayer({ bokeh, id }: { bokeh: readonly Bokeh[]; id: (name: string) => string }) {
  if (bokeh.length === 0) return null;
  return (
    <g>
      <defs>
        <filter id={id('blur6')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g filter={`url(#${id('blur6')})`}>
        {bokeh.map((ball, i) => (
          <circle key={i} cx={ball.x} cy={ball.y} r={ball.r} fill={ball.color} opacity={ball.opacity ?? 0.45} />
        ))}
      </g>
    </g>
  );
}

/** The battle vignette (§ 2.7 *Depth*), darker at the top for the HUD and at the bottom into the panel. */
function Vignette({ id }: { id: (name: string) => string }) {
  return (
    <g>
      <defs>
        <radialGradient id={id('vig')} cx=".5" cy=".52" r=".72">
          <stop offset=".5" stopColor={STAGE_LIGHT.vignette} stopOpacity="0" />
          <stop offset="1" stopColor={STAGE_LIGHT.vignette} stopOpacity=".62" />
        </radialGradient>
        <linearGradient id={id('edge')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={STAGE_LIGHT.vignette} stopOpacity=".45" />
          <stop offset=".14" stopColor={STAGE_LIGHT.vignette} stopOpacity="0" />
          <stop offset=".86" stopColor={STAGE_LIGHT.vignette} stopOpacity="0" />
          <stop offset="1" stopColor={STAGE_LIGHT.vignette} stopOpacity=".55" />
        </linearGradient>
      </defs>
      <rect x={-20} y={0} width={430} height={STAGE_H} fill={`url(#${id('vig')})`} />
      <rect x={X0} y={0} width={STAGE_VIEW.w} height={STAGE_H} fill={`url(#${id('edge')})`} />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// The stage

type StageProps = {
  config: StageConfig;
  /** The clock; `config.time` wins when the backdrop has its own */
  time: string;
};

/** Draws one stage. Pure in (config, time); the component around it memoises. */
function StageArt({ config, time, id }: StageProps & { id: (name: string) => string }): ReactElement {
  const clock = config.time ?? time;
  const t = gradeStage(clock);
  const seed = hashSeed(`${config.key}@${clock}`);
  const { horizon } = config;
  const piece = (k: number): PieceProps => ({ t, time: clock, horizon, id, seed: seed + k * 7919 });
  const { far: Far, mid: Mid } = config;
  const [Left, Right] = config.framers;
  return (
    <>
      {config.sky === 'open' ? <OpenSky time={clock} horizon={horizon} id={id} seed={seed} moon={config.moon ?? DEFAULT_MOON} /> : <RoomWall t={t} horizon={horizon} id={id} />}
      <Far {...piece(1)} />
      <Floor t={t} time={clock} horizon={horizon} kind={config.floor.kind} reflections={config.floor.reflections} id={id} />
      <Mid {...piece(2)} />
      <Lights t={t} lights={config.lights} id={id} />
      <Left {...piece(3)} />
      <Right {...piece(4)} />
      <BokehLayer bokeh={config.bokeh} id={id} />
      <Vignette id={id} />
    </>
  );
}

/**
 * The backdrop SVG. Memoised on (config, time): config objects come from module tables, so a
 * battle's turns re-render the screen around it without ever touching it (`data-stage-static`
 * lets the UI check count mutations inside it: there must be none).
 */
export const Stage = memo(function Stage({ config, time }: StageProps) {
  const id = useSvgIds('stage');
  const art = useMemo(() => <StageArt config={config} time={time} id={id} />, [config, time, id]);
  return (
    <svg
      data-stage-static=""
      data-stage={config.key}
      viewBox={VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
});
