import type { ReactElement, ReactNode } from 'react';
import type { PaletteName } from './types';
import { C } from './palette';

/**
 * Battle backdrops. Each is a painted stage rather than two flat bands: a graded sky, a
 * silhouetted middle distance, a graded floor and a pool of light where the fight happens.
 * Depth is what lets the shaded sprites sit in the scene instead of on top of it.
 *
 * The scene box is 3:4, so a 300x400 viewBox maps straight onto the layout; `slice` crops
 * rather than letterboxes when a screen uses a different shape (the battle box is squarer).
 */
const Frame = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
    {children}
  </svg>
);

type StageProps = {
  id: string;
  /** Sky gradient, top to horizon */
  sky: [string, string];
  /** Floor gradient, horizon to foreground */
  ground: [string, string];
  split: number;
  /** Distant shapes on the horizon line */
  far?: ReactNode;
  /** Anything painted on top of the floor */
  near?: ReactNode;
  /** Warm pool of light on the floor, centred where the party stands */
  glow?: string;
};

/**
 * The shared stage: sky, horizon haze, floor, a soft vignette and a light pool.
 * `id` prefixes the gradient ids so two backdrops can never collide on one page.
 */
const Stage = ({ id, sky, ground, split, far, near, glow = C.cream }: StageProps) => (
  <Frame>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={sky[0]} />
        <stop offset="1" stopColor={sky[1]} />
      </linearGradient>
      <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ground[0]} />
        <stop offset="1" stopColor={ground[1]} />
      </linearGradient>
      <radialGradient id={`${id}-pool`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={glow} stopOpacity="0.42" />
        <stop offset="1" stopColor={glow} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stopColor={C.ink} stopOpacity="0" />
        <stop offset="1" stopColor={C.ink} stopOpacity="0.4" />
      </radialGradient>
    </defs>

    <rect x={0} y={0} width={300} height={split} fill={`url(#${id}-sky)`} />
    {far}
    {/* Haze along the horizon: what separates the far plane from the floor */}
    <rect x={0} y={split - 26} width={300} height={26} fill={C.white} opacity={0.16} />
    <rect x={0} y={split} width={300} height={400 - split} fill={`url(#${id}-ground)`} />
    <rect x={0} y={split - 2} width={300} height={3} fill={C.ink} opacity={0.22} />
    {near}
    <ellipse cx={150} cy={split + 110} rx={215} ry={95} fill={`url(#${id}-pool)`} />
    <rect x={0} y={0} width={300} height={400} fill={`url(#${id}-vig)`} />
  </Frame>
);

/** A row of soft hills or dunes along the horizon. */
const hills = (y: number, colour: string, opacity = 1) => (
  <path
    d={`M-10,${y} Q40,${y - 34} 90,${y} Q130,${y - 22} 175,${y} Q225,${y - 40} 275,${y} Q295,${y - 14} 310,${y} L310,${y + 60} L-10,${y + 60} Z`}
    fill={colour}
    opacity={opacity}
  />
);

export const BACKDROPS: Record<PaletteName, () => ReactElement> = {
  // The living room: warm wall, skirting board, wooden floor running away from you
  living: () => (
    <Stage
      id="bd-living"
      sky={[C.paper, C.sand]}
      ground={[C.sandDeep, C.mochaDeep]}
      split={250}
      far={
        <>
          <rect x={30} y={70} width={110} height={90} rx={6} fill={C.sky} opacity={0.55} stroke={C.ink} strokeWidth={5} />
          <path d="M85,70 v90 M30,115 h110" stroke={C.ink} strokeWidth={5} />
          <rect x={0} y={232} width={300} height={18} fill={C.cream} opacity={0.6} />
        </>
      }
      near={[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${-40 + i * 90},400 L${120 + i * 26},250`} stroke={C.mochaDeep} strokeWidth={3} opacity={0.35} />
      ))}
    />
  ),

  // The yard: bright sky, hedge line, grass
  yard: () => (
    <Stage
      id="bd-yard"
      sky={[C.sky, C.cream]}
      ground={[C.leaf, C.leafDeep]}
      split={185}
      far={
        <>
          <circle cx={238} cy={56} r={30} fill={C.sun} opacity={0.75} />
          {hills(185, C.leafDeep, 0.55)}
        </>
      }
      near={<ellipse cx={150} cy={212} rx={200} ry={26} fill={C.leafDeep} opacity={0.3} />}
      glow={C.sun}
    />
  ),

  // The park: open sky, distant treeline, a worn sandy path in the foreground
  park: () => (
    <Stage
      id="bd-park"
      sky={[C.sky, C.cream]}
      ground={[C.leaf, C.leafDeep]}
      split={215}
      far={
        <>
          <ellipse cx={60} cy={62} rx={46} ry={22} fill={C.white} opacity={0.7} />
          <ellipse cx={92} cy={54} rx={30} ry={18} fill={C.white} opacity={0.7} />
          <ellipse cx={228} cy={92} rx={38} ry={17} fill={C.white} opacity={0.5} />
          {hills(215, C.leafDeep, 0.5)}
        </>
      }
      near={<ellipse cx={150} cy={360} rx={205} ry={72} fill={C.sand} opacity={0.55} />}
      glow={C.sun}
    />
  ),

  // The market: awning stripes overhead, cobbles underfoot
  market: () => (
    <Stage
      id="bd-market"
      sky={[C.sand, C.paper]}
      ground={[C.sandDeep, C.mochaDeep]}
      split={235}
      far={
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={i * 52 - 10} y={0} width={26} height={54} fill={C.berry} opacity={0.55} />
          ))}
          <rect x={-10} y={54} width={320} height={9} fill={C.ink} opacity={0.25} />
          <rect x={20} y={150} width={70} height={85} rx={5} fill={C.mochaDeep} opacity={0.4} />
          <rect x={205} y={140} width={80} height={95} rx={5} fill={C.mochaDeep} opacity={0.4} />
        </>
      }
      near={[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M0,${268 + i * 38} h300`} stroke={C.sand} strokeWidth={2} opacity={0.35} />
      ))}
      glow={C.sun}
    />
  ),

  // The beach: sky, sea with a foam line, wet then dry sand
  beach: () => (
    <Stage
      id="bd-beach"
      sky={[C.sky, C.cream]}
      ground={[C.sand, C.sandDeep]}
      split={230}
      far={
        <>
          <circle cx={70} cy={52} r={26} fill={C.sun} opacity={0.8} />
          <rect x={0} y={150} width={300} height={80} fill={C.skyDeep} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M-10,${172 + i * 20} q40,-8 80,0 t80,0 t80,0 t80,0`} stroke={C.white} strokeWidth={3} fill="none" opacity={0.4} />
          ))}
          <ellipse cx={150} cy={230} rx={210} ry={14} fill={C.white} opacity={0.7} />
        </>
      }
      near={<ellipse cx={150} cy={252} rx={190} ry={12} fill={C.skyDeep} opacity={0.2} />}
    />
  ),

  // Dreamland: a deep dusk sky, stars, a moon and quilted hills
  night: () => (
    <Stage
      id="bd-night"
      sky={[C.plumDeep, C.plum]}
      ground={[C.plumDeep, C.ink]}
      split={250}
      far={
        <>
          <circle cx={232} cy={58} r={30} fill={C.cream} opacity={0.9} />
          <circle cx={218} cy={50} r={26} fill={C.plumDeep} />
          {[
            [40, 40, 2.6],
            [96, 78, 2],
            [150, 34, 3],
            [190, 96, 1.8],
            [66, 132, 2.2],
            [268, 140, 2.4],
            [122, 158, 1.8],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={C.cream} opacity={0.85} />
          ))}
          {hills(250, C.ink, 0.45)}
        </>
      }
      near={<ellipse cx={150} cy={286} rx={200} ry={30} fill={C.plum} opacity={0.25} />}
      glow={C.plum}
    />
  ),
};
