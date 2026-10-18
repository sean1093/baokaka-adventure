import { GLOW, LIGHTS, SKY_ART, STAGE_LIGHT, mixHex } from '../palette';
import { n, rng } from '../sky/SkyLayer';
import { BloomStops, STAGE_VIEW, Windows, canopy, leafDabs, skyline } from './Stage';
import type { BackdropModule, PieceProps, StageConfig } from './types';

/**
 * Chapter 1 battle backdrops (lazy chunk). `daan` is the template every chapter art issue copies:
 * 大安森林公園's 露天音樂台 at 00:20 (art direction § 4.2: "band-shell lit from below, banyan
 * silhouettes framing, wet path reflecting lamps, 101 tiny on the horizon").
 */

const X0 = STAGE_VIEW.x;
const X1 = STAGE_VIEW.x + STAGE_VIEW.w;

/** The band-shell's centre and the stage it stands on (stage units). */
const SHELL = { cx: 262, base: 282, rx: 116, ry: 134, front: 304 };
/** 台北101, tiny on the horizon between the left banyan and the shell. */
const TOWER = { x: 48, top: 128 };

/** 台北101: the podium, eight flared segments, the crown and spire, ledge lights. */
const Tower101 = ({ t, horizon, id }: PieceProps) => {
  const { x, top } = TOWER;
  const segH = 8.4;
  const segTop = top + 30;
  const segments = Array.from({ length: 8 }, (_, i) => segTop + i * segH);
  const podium = segTop + 8 * segH;
  const body = segments.map((y) => `M${n(x - 6)},${n(y + segH)}L${n(x - 7.6)},${n(y)}H${n(x + 7.6)}L${n(x + 6)},${n(y + segH)}Z`).join('');
  const lit = segments.map((y) => `M${n(x - 6)},${n(y + segH)}L${n(x - 7.6)},${n(y)}H${n(x - 1)}V${n(y + segH)}Z`).join('');
  const ledges = segments.map((y) => `M${n(x - 7.4)},${n(y + 0.6)}h1.4v1h-1.4Z M${n(x + 6)},${n(y + 0.6)}h1.4v1h-1.4Z M${n(x - 0.7)},${n(y + 3)}h1.4v1h-1.4Z`).join('');
  return (
    <g>
      <defs>
        <radialGradient id={id('towerGlow')} cx=".5" cy=".5" r=".5">
          <BloomStops color={LIGHTS.rim101} core={0.35} />
        </radialGradient>
        <linearGradient id={id('towerColumn')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LIGHTS.rim101} stopOpacity=".22" />
          <stop offset="1" stopColor={LIGHTS.rim101} stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx={x} cy={top + 34} rx={34} ry={48} fill={`url(#${id('towerGlow')})`} />
      <rect x={x - 14} y={top + 20} width={28} height={horizon - top - 20} fill={`url(#${id('towerColumn')})`} />
      {/* Spire and crown */}
      <path d={`M${x},${top}V${top + 18}`} stroke={t.tower} strokeWidth={1.4} />
      <circle cx={x} cy={top} r={1.4} fill={STAGE_LIGHT.towerTip} />
      <path d={`M${x - 3},${top + 18}h6l1,6h-8Z M${x - 4.4},${top + 24}h8.8l1,6h-10.8Z`} fill={t.tower} />
      <path d={`M${x - 3},${top + 18}h2.4v6h-3.2Z`} fill={t.towerLit} />
      <path d={body} fill={t.tower} />
      <path d={lit} fill={t.towerLit} opacity={0.8} />
      <path d={`M${x - 7},${n(podium)}L${x - 11},${horizon + 2}H${x + 11}L${x + 7},${n(podium)}Z`} fill={t.towerShade} />
      <path d={ledges} fill={STAGE_LIGHT.towerLight} opacity={0.9} />
      <path d={`M${n(x + 7.6)},${segTop}L${n(x + 6)},${n(podium)}`} stroke={LIGHTS.rim101} strokeWidth={0.6} opacity={0.6} />
    </g>
  );
};

/** The far side of the park: a low skyline, 101, then the park's own dark tree line. */
const DaanFar = (props: PieceProps) => {
  const { t, horizon, seed } = props;
  const rand = rng(seed);
  const back = skyline(rand, horizon + 2, 14, 46);
  const front = skyline(rand, horizon + 4, 8, 22);
  let trees = `M${X0},${horizon + 8}`;
  for (let x = X0; x < X1; ) {
    const w = 14 + rand() * 22;
    const h = 10 + rand() * 18;
    trees += `Q${n(x + w * 0.1)},${n(horizon - h)} ${n(x + w / 2)},${n(horizon - h)}Q${n(x + w * 0.9)},${n(horizon - h)} ${n(x + w)},${n(horizon + 2 - rand() * 4)}`;
    x += w;
  }
  trees += `V${horizon + 12}H${X0}Z`;
  return (
    <g>
      <path d={back.d} fill={t.city} />
      <Windows windows={back.windows} opacity={0.7} />
      <Tower101 {...props} />
      <path d={front.d} fill={t.cityNear} />
      <Windows windows={front.windows} opacity={0.85} />
      <path d={trees} fill={t.treeLine} />
      <path d={trees} fill="none" stroke={t.treeLineRim} strokeWidth={0.8} opacity={0.45} />
    </g>
  );
};

/** A half ellipse standing on `base` (the band-shell's arches). */
const arch = (cx: number, base: number, rx: number, ry: number) => `M${n(cx - rx)},${base}A${n(rx)},${n(ry)} 0 0,1 ${n(cx + rx)},${base}Z`;
const archLine = (cx: number, base: number, rx: number, ry: number) => `M${n(cx - rx)},${base}A${n(rx)},${n(ry)} 0 0,1 ${n(cx + rx)},${base}`;

/** 露天音樂台: the white band-shell lit from below, concentric ribs, the stage, footlights and steps. */
const BandShell = ({ t, id }: PieceProps) => {
  const { cx, base, rx, ry, front } = SHELL;
  const ribs = [0.84, 0.69, 0.55, 0.42, 0.3];
  const footlights = Array.from({ length: 11 }, (_, i) => cx - 140 + i * 28);
  return (
    <g>
      <defs>
        <linearGradient id={id('shell')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.shellTop} />
          <stop offset=".5" stopColor={t.shellMid} />
          <stop offset="1" stopColor={t.shellLow} />
        </linearGradient>
        <linearGradient id={id('shellEdge')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.shellMid} />
          <stop offset=".55" stopColor={t.shellRim} />
          <stop offset="1" stopColor={STAGE_LIGHT.uplightCore} />
        </linearGradient>
        <radialGradient id={id('shellUp')} cx=".5" cy="1" r=".9">
          <stop offset="0" stopColor={STAGE_LIGHT.shellGlow} stopOpacity=".85" />
          <stop offset=".45" stopColor={STAGE_LIGHT.shellGlow} stopOpacity=".3" />
          <stop offset="1" stopColor={STAGE_LIGHT.shellGlow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('stageFace')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.stageFace} />
          <stop offset="1" stopColor={t.stageFaceLow} />
        </linearGradient>
        <clipPath id={id('shellIn')}>
          <path d={arch(cx, base, rx, ry)} />
        </clipPath>
        <radialGradient id={id('foot')} cx=".5" cy=".5" r=".5">
          <BloomStops color={STAGE_LIGHT.foot} />
        </radialGradient>
      </defs>
      {/* The shell's outer back and its moonlit crown */}
      <path d={arch(cx, base, rx + 9, ry + 9)} fill={t.shellOuter} />
      <path d={archLine(cx, base - 30, rx + 9, ry - 21)} stroke={t.shellRibShade} strokeWidth={1} fill="none" opacity={0.4} />
      {/* The inner surface: dark at the top, bright where the uplights hit */}
      <path d={arch(cx, base, rx, ry)} fill={`url(#${id('shell')})`} />
      <g clipPath={`url(#${id('shellIn')})`}>
        {ribs.map((k, i) => (
          <path key={k} d={arch(cx, base, rx * k, ry * k ** 0.9)} fill={t.shellTop} opacity={0.1 + i * 0.015} />
        ))}
        <ellipse cx={cx} cy={base} rx={rx * 1.05} ry={ry * 0.95} fill={`url(#${id('shellUp')})`} />
        {ribs.map((k) => (
          <g key={k}>
            <path d={archLine(cx, base, rx * k, ry * k ** 0.9)} stroke={t.shellRibShade} strokeWidth={2.4} fill="none" opacity={0.5} />
            <path d={archLine(cx, base, rx * k - 1.6, ry * k ** 0.9 - 1.6)} stroke={t.shellRib} strokeWidth={1} fill="none" opacity={0.8} />
          </g>
        ))}
      </g>
      {/* The front edge, brightest low down by the lights */}
      <path d={archLine(cx, base, rx + 1, ry + 1)} stroke={`url(#${id('shellEdge')})`} strokeWidth={4} fill="none" />
      <path d={archLine(cx, base, rx + 6, ry + 6)} stroke={t.shellRim} strokeWidth={0.8} fill="none" opacity={0.35} />
      {/* The stage: top, lip, face, two steps */}
      <path d={`M${cx - 150},${base}H${cx + 150}L${cx + 164},${base + 8}H${cx - 164}Z`} fill={t.stageTop} />
      <path d={`M${cx - 164},${base + 8}H${cx + 164}`} stroke={t.stageLip} strokeWidth={1.4} />
      <rect x={cx - 164} y={base + 8} width={328} height={front - base - 8} fill={`url(#${id('stageFace')})`} />
      <path d={`M${cx - 38},${front}h76v5h-76Z M${cx - 48},${front + 5}h96v6h-96Z`} fill={t.step} />
      <path d={`M${cx - 38},${front}h76 M${cx - 48},${front + 5}h96`} stroke={t.stageLip} strokeWidth={0.9} opacity={0.7} />
      {/* Footlights along the lip */}
      {footlights.map((x) => (
        <g key={x}>
          <circle cx={x} cy={base + 5} r={9} fill={`url(#${id('foot')})`} />
          <circle cx={x} cy={base + 5} r={1.3} fill={STAGE_LIGHT.uplightCore} />
        </g>
      ))}
    </g>
  );
};

/** A banyan: a trunk with buttress roots, a heavy canopy over the corner, aerial roots hanging down. */
const banyan = (side: 1 | -1) =>
  function Banyan({ t, seed }: PieceProps) {
    const rand = rng(seed);
    const m = (x: number) => (side > 0 ? x : 390 - x);
    const clumps: [number, number, number][] = [
      [m(-80), 0, 70],
      [m(-10), -16, 58],
      [m(58), 2, 44],
      [m(110), -18, 32],
      [m(96), 28, 20],
      [m(-72), 82, 62],
      [m(-6), 64, 44],
      [m(50), 50, 30],
      [m(-94), 158, 52],
      [m(-38), 138, 36],
    ];
    const leaves = canopy(rand, clumps, side > 0 ? 1 : -1);
    const dabs = leafDabs(rand, clumps, 70);
    // The clumps' undersides catch the band-shell's warm light
    let warm = '';
    for (const [cx, cy, r] of clumps) {
      if (cy < 20) continue;
      const a0 = side > 0 ? 0.35 : 1.6;
      const a1 = a0 + 1.2;
      warm += `M${n(cx + Math.cos(a0) * r)},${n(cy + Math.sin(a0) * r)}A${n(r)},${n(r)} 0 0,1 ${n(cx + Math.cos(a1) * r)},${n(cy + Math.sin(a1) * r)}`;
    }
    // Aerial roots hanging from the branches; the longest reach toward the ground
    let roots = '';
    let rootsLit = '';
    const strands: [number, number, number][] = [
      [-30, 190, 2.4],
      [-12, 132, 1.4],
      [6, 116, 2],
      [22, 104, 1.2],
      [36, 86, 1.8],
      [54, 74, 1.1],
      [-52, 214, 1.6],
    ];
    const widths: number[] = [];
    for (const [x0, y0, w] of strands) {
      const x = m(x0 + rand() * 4);
      const y1 = y0 + 60 + rand() * 110;
      const sway = (rand() - 0.5) * 7;
      const d = `M${n(x)},${n(y0 - 10)}C${n(x + sway)},${n((y0 + y1) / 2)} ${n(x - sway)},${n(y1 - 20)} ${n(x + sway * 0.4)},${n(y1)}`;
      roots += d;
      rootsLit += `M${n(x - side * w * 0.4)},${n(y0)}C${n(x + sway - side * w * 0.4)},${n((y0 + y1) / 2)} ${n(x - sway - side * w * 0.4)},${n(y1 - 20)} ${n(x + sway * 0.4 - side * w * 0.4)},${n(y1 - 6)}`;
      widths.push(w);
    }
    const trunk =
      side > 0
        ? 'M-110,500V476C-84,456 -70,420 -64,360C-60,300 -54,236 -40,176C-30,136 -12,108 16,88L30,100C8,124 -4,156 -10,192C-18,246 -18,304 -12,362C-8,412 4,448 30,472C38,482 44,492 50,500Z'
        : 'M500,500V476C474,456 460,420 454,360C450,300 444,236 430,176C420,136 402,108 374,88L360,100C382,124 394,156 400,192C408,246 408,304 402,362C398,412 386,448 360,472C352,482 346,492 340,500Z';
    const buttress =
      side > 0
        ? 'M-24,432C-8,462 14,480 42,500M-40,446C-36,474 -22,490 -10,500M-12,384C-4,402 0,418 -2,436'
        : 'M414,432C398,462 376,480 348,500M430,446C426,474 412,490 400,500M402,384C394,402 390,418 392,436';
    const rim = side > 0 ? 'M-12,362C-18,304 -18,246 -10,192C-4,156 8,124 30,100' : 'M402,362C408,304 408,246 400,192C394,156 382,124 360,100';
    return (
      <g>
        <path d={trunk} fill={t.trunk} />
        <path d={buttress} stroke={t.trunkMid} strokeWidth={2.4} fill="none" />
        <path d={rim} stroke={t.trunkRim} strokeWidth={1.8} fill="none" opacity={0.65} />
        <path d={roots} stroke={t.root} strokeWidth={Math.max(...widths)} fill="none" opacity={0.95} strokeLinecap="round" />
        <path d={rootsLit} stroke={t.rootLit} strokeWidth={0.7} fill="none" opacity={0.6} />
        <path d={leaves.body} fill={t.leaf} />
        <path d={leaves.lit} fill={t.leafMid} opacity={0.7} />
        <path d={dabs} fill={t.leafLit} opacity={0.75} />
        <path d={warm} stroke={t.leafWarm} strokeWidth={1.6} fill="none" opacity={0.55} strokeLinecap="round" />
        <path d={leaves.rim} stroke={t.leafRim} strokeWidth={2} fill="none" opacity={0.85} strokeLinecap="round" />
      </g>
    );
  };

/** Fireflies over the lawn edges: static points of light (the live ones are the map's ambient FX). */
const fireflies: [number, number, number][] = [
  [22, 300, 2.4],
  [70, 286, 1.8],
  [142, 318, 2],
  [378, 300, 2.2],
  [354, 330, 1.6],
];

export const DAAN: StageConfig = {
  key: 'daan',
  label: '大安森林公園・露天音樂台 00:20 (template)',
  time: '00:20',
  sky: 'open',
  horizon: 262,
  moon: { x: 128, y: 92 },
  far: DaanFar,
  mid: BandShell,
  framers: [banyan(1), banyan(-1)],
  floor: {
    kind: 'pave',
    reflections: [
      { x: SHELL.cx, w: 150, h: 150, color: STAGE_LIGHT.shellGlow, y: SHELL.front + 10, opacity: 0.42 },
      { x: SHELL.cx, w: 26, h: 170, color: STAGE_LIGHT.uplightCore, y: SHELL.front + 10, opacity: 0.5 },
      { x: 120, w: 9, h: 110, color: LIGHTS.lampMid, y: 300 },
      { x: TOWER.x, w: 6, h: 60, color: LIGHTS.rim101, opacity: 0.35 },
    ],
  },
  lights: [
    // Uplights at the ends of the shell
    { x: SHELL.cx - 106, y: SHELL.base, r: 30, color: STAGE_LIGHT.uplight },
    { x: SHELL.cx + 106, y: SHELL.base, r: 30, color: STAGE_LIGHT.uplight },
    // A park lamp by the path, and the warm pool where the party stands
    { x: 120, y: 226, r: 30, color: LIGHTS.lampMid, post: 294, pool: { x: 120, y: 298, rx: 58, ry: 14 } },
    { x: SHELL.cx, y: SHELL.front, r: 0, color: STAGE_LIGHT.shellGlow, pool: { x: SHELL.cx, y: SHELL.front + 26, rx: 170, ry: 34, opacity: 0.8 } },
    { x: 130, y: 420, r: 0, color: LIGHTS.lampCore, pool: { x: 130, y: 418, rx: 190, ry: 64, opacity: 0.5 } },
    ...fireflies.map(([x, y, r]) => ({ x, y, r: r * 4, color: GLOW.firefly })),
  ],
  bokeh: [
    { x: -4, y: 330, r: 14, color: LIGHTS.lampMid },
    { x: 18, y: 372, r: 7, color: STAGE_LIGHT.firefly, opacity: 0.4 },
    { x: 392, y: 250, r: 12, color: SKY_ART.bokehPink, opacity: 0.4 },
    { x: 374, y: 466, r: 18, color: mixHex(LIGHTS.lampMid, SKY_ART.bokehGold, 0.5), opacity: 0.3 },
  ],
};

export const BACKDROPS: BackdropModule['BACKDROPS'] = { daan: DAAN };
