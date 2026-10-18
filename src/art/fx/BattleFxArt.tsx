import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import type { FxAccent, FxKind } from '../../quest/engine/types';
import { FX, LINE, withAlpha } from '../palette';
import { useSvgIds } from '../useSvgIds';
import { FX_TINT, type Emblem, type FxTargetPlan, type Particle, type Spot } from './battleFx';
import './battleFx.css';

/**
 * The battle VFX drawings (art direction § 7.10, issue #15). Every piece is an SVG group that
 * animates only `transform` and `opacity` (battleFx.css); glows are radial gradients, never
 * filters. Each piece carries `fx-node` plus a role:
 *
 *   shape    the element's impact shape (the only thing left under reduced motion, as a still fade)
 *   ring     the shock ring spreading from the impact
 *   particle 6–10 little things thrown out
 *   accent   a skill's flourish (clap, stomp, comet, moon)
 *   glyph    the gold ring under a casting hero, and its emblem
 *
 * A node's resting style (no animation) is its impact frame, so `?still=1` in the art lab and the
 * reduced-motion fade both show the moment of impact. Drawings use 0..100 boxes, centre 50,50.
 */

/** How wide one combatant is, as a fraction of the stage box. Effects are sized against this. */
export const SPRITE_WIDTH = 0.28;

/** Each target's effect box, in sprite widths (the shield's arch is sized to the party instead). */
const BOX: Partial<Record<FxKind, number>> = { typhoon: 1.6, cry: 1.4 };
const DEFAULT_BOX = 1.5;

// ---------------------------------------------------------------------------------------------
// Shared gradients: one set per effect layer, ids from useSvgIds

type IdFn = (name: string) => string;
const FxIds = createContext<IdFn>((name) => `fx-${name}`);

/** Glow colours that get a radial bloom gradient. */
const BLOOMS = {
  gold: FX.gold,
  white: FX.core,
  pink: FX.pink,
  sound: FX.sound,
  feather: FX.featherLight,
  bridge: FX.bridge,
  storm: FX.storm,
  cyan: FX.neonCyan,
  water: FX.water,
  moon: FX.moon,
  dust: FX.dust,
} as const;
type Bloom = keyof typeof BLOOMS;

/** Provides the layer's gradient ids and draws them once in a 0×0 SVG (§ 8.2 rule 6: not display:none). */
export const FxDefsProvider = ({ children }: { children: ReactNode }) => {
  const id = useSvgIds('fx');
  return (
    <FxIds.Provider value={id}>
      <svg aria-hidden="true" width="0" height="0" className="absolute" focusable="false">
        <defs>
          {(Object.keys(BLOOMS) as Bloom[]).map((name) => (
            <radialGradient key={name} id={id(`bloom-${name}`)}>
              <stop offset="0" stopColor={BLOOMS[name]} stopOpacity="0.95" />
              <stop offset="0.35" stopColor={BLOOMS[name]} stopOpacity="0.55" />
              <stop offset="1" stopColor={BLOOMS[name]} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
      </svg>
      {children}
    </FxIds.Provider>
  );
};

const useBloom = () => {
  const id = useContext(FxIds);
  return (name: Bloom) => `url(#${id(`bloom-${name}`)})`;
};

// ---------------------------------------------------------------------------------------------
// Primitives

type Role = 'shape' | 'ring' | 'particle' | 'accent' | 'glyph';

/** One separately animated piece. `anim` names its keyframes (battleFx.css); `delay` is ms from the action. */
const Node = ({ role, anim, delay, style, children }: { role: Role; anim: string; delay: number; style?: CSSProperties; children: ReactNode }) => (
  <g className={`fx-node fx-${role} fx-a-${anim}`} data-fx-node={role} style={{ ...style, animationDelay: `${delay}ms` }}>
    {children}
  </g>
);

const SIL = LINE.sil;

/** A four-point star (heals, sparkles, impacts). */
export const star4 = (cx: number, cy: number, r: number, pinch = 0.22) =>
  `M${cx},${cy - r}Q${cx + r * pinch},${cy - r * pinch} ${cx + r},${cy}Q${cx + r * pinch},${cy + r * pinch} ${cx},${cy + r}Q${cx - r * pinch},${cy + r * pinch} ${cx - r},${cy}Q${cx - r * pinch},${cy - r * pinch} ${cx},${cy - r}Z`;

/** A five-point star with rounded-ish points (dizzy stars, the block's face). */
const star5 = (cx: number, cy: number, r: number) => {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.48;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return `M${points.join('L')}Z`;
};

/** A soft, many-lobed burst (the generic 「咚」): lobes on a circle joined by quadratic curves. */
const softBurst = (cx: number, cy: number, outer: number, inner: number, lobes: number) => {
  let d = '';
  for (let i = 0; i < lobes; i += 1) {
    const a0 = (i / lobes) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / lobes) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / lobes) * Math.PI * 2 - Math.PI / 2;
    const p = (a: number, r: number) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
    if (i === 0) d += `M${p(a0, inner)}`;
    d += `Q${p(a1, outer * 1.18)} ${p(a2, inner)}`;
  }
  return `${d}Z`;
};

/** A toy block: front face, lit top, shaded side, a cream star on the front. */
const Cube = ({ x, y, s, rot, fill, deep }: { x: number; y: number; s: number; rot: number; fill: string; deep: string }) => {
  const d = s * 0.3;
  return (
    <g transform={`rotate(${rot} ${x + s / 2} ${y + s / 2})`} strokeLinejoin="round">
      <path d={`M${x},${y} l${d},${-d} h${s} l${-d},${d} z`} fill={fill} stroke={SIL} strokeWidth={2} />
      <path d={`M${x},${y} l${d},${-d} h${s} l${-d},${d} z`} fill={FX.core} opacity={0.38} />
      <path d={`M${x + s},${y} l${d},${-d} v${s} l${-d},${d} z`} fill={deep} stroke={SIL} strokeWidth={2} />
      <rect x={x} y={y} width={s} height={s} rx={s * 0.12} fill={fill} stroke={SIL} strokeWidth={2.2} />
      <path d={`M${x + s * 0.12},${y + s * 0.82} v${-s * 0.6} a${s * 0.1},${s * 0.1} 0 0 1 ${s * 0.1},${-s * 0.1} h${s * 0.5}`} stroke={FX.core} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.55} />
      <path d={star5(x + s / 2, y + s / 2 + s * 0.02, s * 0.27)} fill={FX.cream} opacity={0.92} />
    </g>
  );
};

/**
 * One 阿藍 tail feather, quill at the bottom: a rounded cobalt vane with a lighter inner half, a
 * dark band and a white tip (the 藍鵲's tail), a cream quill and two barb notches.
 */
const Feather = ({ x, y, len, rot, lite = false }: { x: number; y: number; len: number; rot: number; lite?: boolean }) => {
  const w = len * 0.26;
  const h = len / 2;
  const vane = `M0,${h} C${w * 0.8},${h * 0.35} ${w * 1.1},${-h * 0.55} 0,${-h} C${-w * 1.1},${-h * 0.55} ${-w * 0.8},${h * 0.35} 0,${h} Z`;
  const band = (top: number, bottom: number) =>
    `M${-w * 0.84},${-h * bottom} C${-w * 0.7},${-h * top} ${w * 0.7},${-h * top} ${w * 0.84},${-h * bottom} C${w * 0.5},${-h * (bottom + 0.06)} ${-w * 0.5},${-h * (bottom + 0.06)} ${-w * 0.84},${-h * bottom} Z`;
  // A small drifting feather: just the vane, its light half and the white tip
  if (lite)
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <path d={vane} fill={FX.feather} />
        <path d={`M0,${h * 0.9} C${w * 0.7},${h * 0.3} ${w * 0.95},${-h * 0.5} 0,${-h * 0.92} Z`} fill={FX.featherLight} opacity={0.8} />
        <path d={`M${-w * 0.62},${-h * 0.72} C${-w * 0.5},${-h * 1.02} ${w * 0.5},${-h * 1.02} ${w * 0.62},${-h * 0.72} Z`} fill={FX.core} />
      </g>
    );
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} strokeLinejoin="round" strokeLinecap="round">
      <path d={vane} fill={FX.feather} stroke={SIL} strokeWidth={1.6} />
      <path d={`M0,${h * 0.9} C${w * 0.7},${h * 0.3} ${w * 0.95},${-h * 0.5} 0,${-h * 0.92} Z`} fill={FX.featherLight} opacity={0.7} />
      <path d={band(0.82, 0.5)} fill={FX.featherHood} />
      <path d={`M${-w * 0.62},${-h * 0.72} C${-w * 0.5},${-h * 1.02} ${w * 0.5},${-h * 1.02} ${w * 0.62},${-h * 0.72} C${w * 0.4},${-h * 0.78} ${-w * 0.4},${-h * 0.78} ${-w * 0.62},${-h * 0.72} Z`} fill={FX.core} />
      <path d={`M0,${h * 1.12} L0,${-h * 0.5}`} stroke={FX.cream} strokeWidth={1.5} />
      {[0.05, 0.38].map((t) => (
        <path key={t} d={`M${-w * 0.8},${h * t} l${w * 0.36},${-h * 0.12} M${w * 0.8},${h * (t - 0.1)} l${-w * 0.36},${-h * 0.12}`} stroke={FX.featherDeep} strokeWidth={1.3} />
      ))}
    </g>
  );
};

/** The magpie bridge's arch, legs on the floor at y 66 of its 100×70 box. */
const ARCH = 'M4,66 C6,0 94,0 96,66';

/**
 * A crescent moon (月牙衝擊, 黑糖's emblem): a disc of radius r with a smaller disc bitten out of
 * its upper right, joined at the two points where the circles cross.
 */
const moonPath = (cx: number, cy: number, r: number) => {
  const [bx, by, br] = [cx + r * 0.5, cy - r * 0.28, r * 0.86];
  // Where the two circles meet
  const d = Math.hypot(bx - cx, by - cy);
  const a = (r * r - br * br + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const [mx, my] = [cx + (a * (bx - cx)) / d, cy + (a * (by - cy)) / d];
  const p1 = [mx + (h * (by - cy)) / d, my - (h * (bx - cx)) / d];
  const p2 = [mx - (h * (by - cy)) / d, my + (h * (bx - cx)) / d];
  const f = (n: number) => n.toFixed(2);
  return `M${f(p1[0])},${f(p1[1])} A${r},${r} 0 1 0 ${f(p2[0])},${f(p2[1])} A${br},${br} 0 0 1 ${f(p1[0])},${f(p1[1])} Z`;
};

/** Short 「咚」 ticks around an impact. */
const ticks = (cx: number, cy: number, r0: number, r1: number, count: number, offset: number, colour: string, width: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + offset;
    return (
      <path
        key={i}
        d={`M${(cx + Math.cos(a) * r0).toFixed(1)},${(cy + Math.sin(a) * r0).toFixed(1)}L${(cx + Math.cos(a) * r1).toFixed(1)},${(cy + Math.sin(a) * r1).toFixed(1)}`}
        stroke={colour}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  });

// ---------------------------------------------------------------------------------------------
// Impact shapes, one function per kind. `delay` is the target's impact time.

type ShapeArgs = { delay: number; bloom: (name: Bloom) => string };

function shapesFor(kind: FxKind, { delay, bloom }: ShapeArgs): ReactNode[] {
  switch (kind) {
    // 積木: three blocks tumble in on an arc and bounce on the target
    case 'blocks':
      return [
        <Node key="s" role="shape" anim="drop" delay={delay}>
          <circle cx={50} cy={52} r={34} fill={bloom('gold')} opacity={0.75} />
          {ticks(50, 52, 36, 46, 6, 0.3, FX.goldLight, 3)}
          <Cube x={56} y={22} s={20} rot={18} fill={FX.blockBlue} deep={FX.blockBlueDeep} />
          <Cube x={18} y={52} s={19} rot={-14} fill={FX.blockGreen} deep={FX.blockGreenDeep} />
          <Cube x={36} y={36} s={27} rot={-6} fill={FX.blockRed} deep={FX.blockRedDeep} />
        </Node>,
      ];

    // 哭聲: a white wail core and sound arcs either side, then rings
    case 'cry':
      return [
        <Node key="c" role="shape" anim="pop" delay={delay}>
          <circle cx={50} cy={50} r={26} fill={bloom('sound')} />
          <path d={star4(50, 50, 15, 0.26)} fill={FX.core} />
        </Node>,
        <Node key="a" role="shape" anim="throb" delay={delay + 30}>
          {[0, 1, 2].map((i) => {
            const r = 20 + i * 9;
            return (
              <g key={i} fill="none" strokeLinecap="round" opacity={1 - i * 0.22}>
                <path d={`M${50 - r * 0.62},${50 - r * 0.78} A${r},${r} 0 0 0 ${50 - r * 0.62},${50 + r * 0.78}`} stroke={FX.soundDeep} strokeWidth={6 - i} />
                <path d={`M${50 + r * 0.62},${50 - r * 0.78} A${r},${r} 0 0 1 ${50 + r * 0.62},${50 + r * 0.78}`} stroke={FX.soundDeep} strokeWidth={6 - i} />
                <path d={`M${50 - r * 0.62},${50 - r * 0.78} A${r},${r} 0 0 0 ${50 - r * 0.62},${50 + r * 0.78}`} stroke={FX.core} strokeWidth={2.6 - i * 0.5} />
                <path d={`M${50 + r * 0.62},${50 - r * 0.78} A${r},${r} 0 0 1 ${50 + r * 0.62},${50 + r * 0.78}`} stroke={FX.core} strokeWidth={2.6 - i * 0.5} />
              </g>
            );
          })}
        </Node>,
      ];

    // 貓爪: three pink-white crescents raked diagonally, one after another
    case 'claw':
      return [0, 1, 2].map((i) => {
        const y = 32 + i * 16;
        return (
          <g key={i} transform="rotate(-38 50 50)">
            <Node role="shape" anim="slash" delay={delay + i * 45}>
              {i === 1 && <ellipse cx={50} cy={50} rx={40} ry={26} fill={bloom('pink')} opacity={0.7} />}
              <path d={`M8,${y + 4} Q50,${y - 20} 92,${y + 2} Q50,${y - 7} 8,${y + 4} Z`} fill={FX.pinkDeep} opacity={0.9} />
              <path d={`M12,${y + 2} Q50,${y - 17} 88,${y + 1} Q50,${y - 9} 12,${y + 2} Z`} fill={FX.pinkLight} />
              <path d={`M24,${y - 2} Q50,${y - 13} 76,${y - 3}`} stroke={FX.core} strokeWidth={1.8} strokeLinecap="round" fill="none" />
            </Node>
          </g>
        );
      });

    // 羽毛: a fan of blue feathers bursting from a bright point
    case 'feather':
      return [
        <Node key="s" role="shape" anim="pop" delay={delay}>
          <circle cx={50} cy={50} r={34} fill={bloom('feather')} opacity={0.85} />
          <Feather x={36} y={50} len={40} rot={-42} />
          <Feather x={64} y={50} len={40} rot={42} />
          <Feather x={50} y={42} len={46} rot={0} />
          <circle cx={50} cy={66} r={9} fill={bloom('white')} />
          <path d={star4(50, 66, 11)} fill={FX.core} />
        </Node>,
      ];

    // 熊掌: a big soft paw print stamped on the target, 「咚」 ticks around it
    case 'paw':
      return [
        <Node key="s" role="shape" anim="stamp" delay={delay}>
          <circle cx={50} cy={52} r={36} fill={bloom('gold')} opacity={0.6} />
          {ticks(50, 54, 34, 44, 8, 0.2, FX.cream, 3.2)}
          <g stroke={SIL} strokeWidth={2.2} strokeLinejoin="round">
            <path d="M50,44 C64,44 72,56 70,66 C68,76 58,74 50,72 C42,74 32,76 30,66 C28,56 36,44 50,44 Z" fill={FX.pad} />
            {[
              [30, 40, 7],
              [42, 31, 7.5],
              [58, 31, 7.5],
              [70, 40, 7],
            ].map(([cx, cy, r]) => (
              <ellipse key={cx} cx={cx} cy={cy} rx={r} ry={r * 1.15} fill={FX.pad} />
            ))}
          </g>
          <path d="M36,66 C40,72 60,72 64,66 C60,70 40,70 36,66 Z" fill={FX.padDeep} />
          <ellipse cx={44} cy={52} rx={6} ry={3.5} fill={FX.core} opacity={0.7} />
        </Node>,
      ];

    // 治療: a big gold four-point star in a bloom, two little ones beside it
    case 'heal':
      return [
        <Node key="s" role="shape" anim="rise" delay={delay}>
          <circle cx={50} cy={50} r={36} fill={bloom('gold')} />
          <path d={star4(50, 46, 26)} fill={FX.gold} stroke={FX.goldDeep} strokeWidth={1.4} strokeLinejoin="round" />
          <path d={star4(50, 46, 13)} fill={FX.core} />
          <path d={star4(24, 64, 10)} fill={FX.goldLight} />
          <path d={star4(77, 60, 12)} fill={FX.gold} />
          <path d={star4(77, 60, 5)} fill={FX.core} />
        </Node>,
      ];

    // 護盾: the magpie bridge, a glowing arch of planks with little 藍鵲 along it (a 100×70 box)
    case 'shield':
      return [
        <Node key="s" role="shape" anim="arch" delay={delay}>
          <path d="M4,66 C6,0 94,0 96,66 Z" fill={bloom('bridge')} opacity={0.42} />
          <path d={ARCH} stroke={FX.bridgeDeep} strokeWidth={7.5} fill="none" strokeLinecap="round" opacity={0.85} />
          <path d={ARCH} stroke={FX.bridge} strokeWidth={4.8} fill="none" strokeLinecap="round" />
          <path d="M6,64 C8,4 92,4 94,64" stroke={FX.bridgeLight} strokeWidth={1.3} fill="none" strokeLinecap="round" strokeDasharray="4 3.5" />
          {[0.14, 0.32, 0.5, 0.68, 0.86].map((t) => {
            // A point on the arch's cubic, for each perched magpie
            const u = 1 - t;
            const x = u * u * u * 4 + 3 * u * u * t * 6 + 3 * u * t * t * 94 + t * t * t * 96;
            const y = u * u * u * 66 + 3 * u * u * t * 0 + 3 * u * t * t * 0 + t * t * t * 66;
            const flip = t > 0.5 ? -1 : 1;
            return (
              <g key={t} transform={`translate(${x.toFixed(1)} ${(y - 3.5).toFixed(1)}) scale(${flip * 0.62} 0.62)`} strokeLinejoin="round" strokeLinecap="round">
                <path d="M-9,1 Q-15,-1 -20,4" stroke={FX.feather} strokeWidth={2.4} fill="none" />
                <path d="M-8,0 C-6,-6 4,-7 7,-2 C8,2 2,4 -2,4 C-5,4 -8,3 -8,0 Z" fill={FX.feather} stroke={SIL} strokeWidth={1.2} />
                <circle cx={5} cy={-3} r={3.2} fill={FX.featherHood} />
                <path d="M7.6,-3 l3,0.8 l-3,0.8 z" fill={FX.pink} />
                <path d="M-3,-3 Q0,-8 4,-4" stroke={FX.featherLight} strokeWidth={1.6} fill="none" />
              </g>
            );
          })}
        </Node>,
      ];

    // 颱風: 咻咻's spiral turning over the target, and rain from it
    case 'typhoon':
      return [
        <Node key="s" role="shape" anim="spin" delay={delay}>
          <circle cx={50} cy={50} r={38} fill={bloom('storm')} opacity={0.8} />
          {[0, 120, 240].map((a) => (
            <g key={a} transform={`rotate(${a} 50 50)`} fill="none" strokeLinecap="round">
              <path d="M50,50 C50,36 62,30 72,34 C84,40 84,58 74,66" stroke={FX.stormDeep} strokeWidth={7} />
              <path d="M50,50 C50,36 62,30 72,34 C84,40 84,58 74,66" stroke={FX.storm} strokeWidth={4} />
              <path d="M56,38 C62,34 70,35 74,40" stroke={FX.core} strokeWidth={1.6} opacity={0.8} />
            </g>
          ))}
          <circle cx={50} cy={50} r={7} fill={FX.stormDeep} />
          <circle cx={48} cy={48} r={2.4} fill={FX.core} />
        </Node>,
        <Node key="r" role="shape" anim="rain" delay={delay + 40}>
          {[
            [22, 30],
            [36, 18],
            [50, 34],
            [64, 20],
            [78, 32],
            [30, 56],
            [70, 58],
          ].map(([x, y]) => (
            <path key={`${x}${y}`} d={`M${x},${y} l-4,12`} stroke={FX.rain} strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
          ))}
        </Node>,
      ];

    // A generic foe hit: a soft pink-white 「咚」 burst, no spikes
    case 'impact':
      return [
        <Node key="s" role="shape" anim="pop" delay={delay}>
          <circle cx={50} cy={50} r={38} fill={bloom('pink')} opacity={0.65} />
          <path d={softBurst(50, 50, 34, 22, 8)} fill={FX.cream} stroke={FX.pink} strokeWidth={2.4} strokeLinejoin="round" />
          <path d={softBurst(50, 50, 24, 15, 8)} fill={FX.pinkLight} />
          <circle cx={50} cy={50} r={13} fill={FX.core} />
          <path d={star4(50, 50, 20, 0.18)} fill={FX.core} />
        </Node>,
      ];

    // Gold glints: items and little magic
    case 'sparkle':
      return [
        <Node key="s" role="shape" anim="rise" delay={delay}>
          <circle cx={50} cy={50} r={34} fill={bloom('gold')} opacity={0.8} />
          <path d={star4(50, 44, 22)} fill={FX.gold} />
          <path d={star4(50, 44, 10)} fill={FX.core} />
          <path d={star4(22, 62, 9)} fill={FX.goldLight} />
          <path d={star4(78, 58, 12)} fill={FX.gold} />
          <path d={star4(66, 22, 7)} fill={FX.goldLight} />
        </Node>,
      ];

    // Neon foes: a pink-and-cyan zigzag with a fork, a white-hot core (it jitters, never flickers)
    case 'neon':
      return [
        <Node key="s" role="shape" anim="zap" delay={delay}>
          <circle cx={50} cy={50} r={34} fill={bloom('cyan')} opacity={0.7} />
          {[
            [FX.neonPink, 10, 0.55],
            [FX.neonCyan, 5.5, 1],
            [FX.core, 2, 1],
          ].map(([colour, width, opacity]) => (
            <g key={String(colour)} fill="none" stroke={String(colour)} strokeWidth={Number(width)} strokeLinecap="round" strokeLinejoin="round" opacity={Number(opacity)}>
              <path d="M62,8 L40,40 L58,46 L34,92" />
              <path d="M49,43 L72,58 L66,74" />
            </g>
          ))}
        </Node>,
      ];

    // River foes: a splash crown over a ripple
    case 'water':
      return [
        <Node key="s" role="shape" anim="splash" delay={delay}>
          <circle cx={50} cy={54} r={34} fill={bloom('water')} opacity={0.7} />
          <ellipse cx={50} cy={70} rx={30} ry={8} fill={FX.water} stroke={FX.waterDeep} strokeWidth={2} />
          <ellipse cx={50} cy={69} rx={20} ry={4.5} fill={FX.waterLight} opacity={0.75} />
          {[
            [24, 64, -34, 20],
            [37, 60, -14, 28],
            [50, 58, 0, 34],
            [63, 60, 14, 28],
            [76, 64, 34, 20],
          ].map(([x, y, rot, len]) => (
            <g key={x} transform={`rotate(${rot} ${x} ${y})`}>
              <path d={`M${x - 5},${y} C${x - 5},${y - len * 0.5} ${x - 2},${y - len} ${x},${y - len} C${x + 2},${y - len} ${x + 5},${y - len * 0.5} ${x + 5},${y} Z`} fill={FX.water} stroke={FX.waterDeep} strokeWidth={1.8} strokeLinejoin="round" />
              <path d={`M${x - 1.5},${y - 3} L${x - 1},${y - len * 0.7}`} stroke={FX.waterLight} strokeWidth={1.8} strokeLinecap="round" />
              <circle cx={x} cy={y - len - 6} r={3} fill={FX.water} stroke={FX.waterDeep} strokeWidth={1.2} />
            </g>
          ))}
        </Node>,
      ];

    // A puff of steam: three soft cloud blobs
    case 'steam':
      return [
        <Node key="s" role="shape" anim="puff" delay={delay}>
          {[
            [34, 58, 17],
            [56, 46, 21],
            [70, 62, 15],
          ].map(([cx, cy, r]) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r={r} fill={FX.steam} opacity={0.8} stroke={FX.steamDeep} strokeWidth={1.4} />
              <path d={`M${cx - r * 0.86},${cy + r * 0.32} A${r},${r} 0 0 0 ${cx + r * 0.86},${cy + r * 0.32} Z`} fill={FX.steamDeep} opacity={0.55} />
              <circle cx={cx - r * 0.35} cy={cy - r * 0.38} r={r * 0.24} fill={FX.core} opacity={0.85} />
            </g>
          ))}
        </Node>,
      ];

    // Calmed or sleepy: stars circling over the head on a tilted orbit
    case 'dizzy':
      return [
        <Node key="s" role="shape" anim="wobble" delay={delay}>
          <ellipse cx={50} cy={30} rx={34} ry={11} fill="none" stroke={FX.starDeep} strokeWidth={1.4} strokeDasharray="3 4" opacity={0.7} />
          {[0, 72, 144, 216, 288].map((a) => {
            const angle = ((a + 20) * Math.PI) / 180;
            const front = Math.sin(angle);
            return <path key={a} d={star5(50 + Math.cos(angle) * 34, 30 + front * 11, 7.5 + front * 2.5)} fill={FX.star} stroke={FX.starDeep} strokeWidth={1.4} strokeLinejoin="round" />;
          })}
        </Node>,
      ];
  }
}

/** The ring that spreads from an impact: a glowing circle, or a ground ring under the feet. */
function ringFor(kind: FxKind, accent: FxAccent | null, delay: number): ReactNode {
  const tint = FX_TINT[kind];
  const ground = kind === 'paw' || kind === 'shield' || accent === 'stomp';
  if (ground) {
    const big = accent === 'stomp' || kind === 'shield';
    return (
      <Node key="ring" role="ring" anim="ring" delay={delay} style={{ transformOrigin: `50px ${kind === 'shield' ? 66 : 82}px` }}>
        <ellipse cx={50} cy={kind === 'shield' ? 66 : 82} rx={big ? 48 : 40} ry={big ? 9 : 10} fill="none" stroke={tint} strokeWidth={3.4} />
        <ellipse cx={50} cy={kind === 'shield' ? 66 : 82} rx={big ? 44 : 36} ry={big ? 7 : 8} fill="none" stroke={FX.core} strokeWidth={1.1} opacity={0.8} />
      </Node>
    );
  }
  return (
    <Node key="ring" role="ring" anim="ring" delay={delay}>
      <circle cx={50} cy={50} r={38} fill="none" stroke={tint} strokeWidth={kind === 'cry' ? 4 : 2.6} opacity={0.9} />
      <circle cx={50} cy={50} r={kind === 'cry' ? 31 : 35} fill="none" stroke={FX.core} strokeWidth={1} opacity={0.7} />
    </Node>
  );
}

/** A skill's flourish (§ 5.1–5.4 battle actions). */
function accentFor(accent: FxAccent, delay: number, bloom: (name: Bloom) => string): ReactNode {
  switch (accent) {
    // 拍拍手: a clap — white 「拍」 marks either side and a pop of glints
    case 'clap':
      return (
        <Node key="accent" role="accent" anim="pop" delay={delay + 40}>
          {ticks(26, 26, 6, 14, 3, -2.4, FX.core, 3)}
          {ticks(74, 26, 6, 14, 3, -1.25, FX.core, 3)}
          <path d={star4(26, 26, 7)} fill={FX.goldLight} />
          <path d={star4(74, 26, 7)} fill={FX.goldLight} />
        </Node>
      );
    // 勇敢的第一步: a big stomp — dust kicked up both ways along the floor
    case 'stomp':
      return (
        <Node key="accent" role="accent" anim="stamp" delay={delay}>
          {[
            [16, 82, 7],
            [26, 78, 9.5],
            [36, 82, 6],
            [64, 82, 6],
            [74, 78, 9.5],
            [84, 82, 7],
          ].map(([cx, cy, r]) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r={r} fill={FX.dust} stroke={FX.dustDeep} strokeWidth={1.2} />
              <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill={FX.cream} opacity={0.85} />
            </g>
          ))}
        </Node>
      );
    // 長尾流星: a comet streaking down onto the target, its tail 阿藍's tail feathers
    case 'comet':
      return (
        <Node key="accent" role="accent" anim="comet" delay={delay - 40}>
          <path d="M-30,-34 L56,44 L46,52 Z" fill={FX.featherLight} opacity={0.45} />
          <path d="M-14,-20 L56,46 L50,50 Z" fill={FX.core} opacity={0.85} />
          <circle cx={52} cy={48} r={14} fill={bloom('white')} />
          <path d={star4(52, 48, 12)} fill={FX.core} />
          <Feather x={8} y={6} len={18} rot={-48} lite />
          <Feather x={24} y={22} len={15} rot={-44} lite />
        </Node>
      );
    // 月牙衝擊: a golden crescent rising over the paw
    case 'moon':
      return (
        <Node key="accent" role="accent" anim="rise" delay={delay + 30}>
          <circle cx={52} cy={20} r={20} fill={bloom('moon')} />
          <path d={moonPath(52, 20, 15)} fill={FX.moon} stroke={FX.moonDeep} strokeWidth={2} strokeLinejoin="round" />
        </Node>
      );
  }
}

/** One particle, drawn at the centre; battleFx.css flies it to (--dx, --dy). */
function particleShape(p: Particle): ReactNode {
  const s = p.size;
  switch (p.shape) {
    case 'spark':
      return <path d={star4(50, 50, s * 0.9, 0.2)} fill={p.colour} />;
    case 'star':
      return <path d={star4(50, 50, s, 0.26)} fill={p.colour} stroke={FX.goldDeep} strokeWidth={0.8} />;
    case 'dot':
      return <circle cx={50} cy={50} r={s * 0.38} fill={p.colour} />;
    case 'drop':
      return <path d={`M50,${50 - s} C${50 + s * 0.7},${50 - s * 0.1} ${50 + s * 0.6},${50 + s * 0.7} 50,${50 + s * 0.7} C${50 - s * 0.6},${50 + s * 0.7} ${50 - s * 0.7},${50 - s * 0.1} 50,${50 - s} Z`} fill={p.colour} stroke={FX.soundDeep} strokeWidth={0.8} />;
    case 'cube':
      return <rect x={50 - s * 0.55} y={50 - s * 0.55} width={s * 1.1} height={s * 1.1} rx={s * 0.2} fill={p.colour} stroke={SIL} strokeWidth={1.2} />;
    case 'feather':
      return <Feather x={50} y={50} len={s * 2.2} rot={0} lite />;
    case 'puff':
      return <circle cx={50} cy={50} r={s * 0.75} fill={p.colour} opacity={0.9} />;
    case 'note':
      return (
        <g fill={p.colour} stroke={FX.soundDeep} strokeWidth={0.8}>
          <ellipse cx={50 - s * 0.3} cy={50 + s * 0.45} rx={s * 0.42} ry={s * 0.32} />
          <path d={`M${50 + s * 0.08},${50 + s * 0.4} V${50 - s * 0.8} l${s * 0.6},${s * 0.25}`} fill="none" stroke={p.colour} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      );
  }
}

// ---------------------------------------------------------------------------------------------
// Exported pieces

const boxStyle = (spot: Spot, widthInSprites: number, unit: number): CSSProperties => ({
  left: `${spot.x * 100}%`,
  top: `${spot.y * 100}%`,
  width: `${widthInSprites * unit * 100}%`,
  aspectRatio: '1',
  transform: 'translate(-50%, -50%)',
});

/**
 * Everything that lands on one target: its shape(s), ring, accent and particles. `unit` is one
 * sprite's width as a fraction of the layer (the battle stage's by default; the art lab's cards
 * draw bigger sprites).
 */
export const FxImpact = ({ kind, accent, target, unit = SPRITE_WIDTH }: { kind: FxKind; accent: FxAccent | null; target: FxTargetPlan; unit?: number }) => {
  const bloom = useBloom();
  const { delay } = target;
  // The shield's arch spans the party and stands on the front row's floor; everything else is a
  // square centred on the target
  const style =
    kind === 'shield'
      ? {
          ...boxStyle(target.spot, (target.span ?? 0) / unit + 1.3, unit),
          aspectRatio: '10 / 7',
          // Legs (y 66 of 70) on the floor: half a sprite below the front row's middle
          transform: 'translate(-50%, -94%)',
          marginTop: `${unit * 50}%`,
        }
      : boxStyle(target.spot, BOX[kind] ?? DEFAULT_BOX, unit);
  // Particles keep their size in sprite terms however wide the box is
  const shrink = kind === 'shield' ? DEFAULT_BOX / ((target.span ?? 0) / unit + 1.3) : 1;
  return (
    <span aria-hidden="true" data-fx-target={kind} className="pointer-events-none absolute block" style={style}>
      <svg viewBox={kind === 'shield' ? '0 0 100 70' : '0 0 100 100'} className="block h-full w-full overflow-visible">
        {ringFor(kind, accent, delay)}
        {target.particles.map((particle, index) => (
          <Node
            key={index}
            role="particle"
            anim={`fly-${particle.shape === 'feather' || particle.shape === 'puff' ? 'drift' : 'burst'}`}
            delay={delay + 30 + particle.delay}
            style={{ '--dx': `${particle.dx}px`, '--dy': `${particle.dy}px`, '--spin': `${particle.spin}deg` } as CSSProperties}
          >
            {shrink === 1 ? particleShape(particle) : <g transform={`translate(50 50) scale(${shrink.toFixed(3)}) translate(-50 -50)`}>{particleShape(particle)}</g>}
          </Node>
        ))}
        {shapesFor(kind, { delay, bloom })}
        {accent && accentFor(accent, delay, bloom)}
      </svg>
    </span>
  );
};

/** The emblem inside a hero's glyph ring, drawn as gold line art in a 40×40 box (it lies flat on the floor). */
function emblemShape(emblem: Emblem): ReactNode {
  const ink = { fill: FX.goldLight, stroke: FX.goldDeep, strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  switch (emblem) {
    case 'block':
      return (
        <>
          <rect x={8} y={8} width={24} height={24} rx={4} {...ink} />
          <path d={star5(20, 20.5, 7.5)} fill={FX.goldDeep} />
        </>
      );
    case 'paw':
      return (
        <g {...ink}>
          <path d="M20,19 C27,19 31,25 30,29 C29,34 24,33 20,32 C16,33 11,34 10,29 C9,25 13,19 20,19 Z" />
          <ellipse cx={10.5} cy={14} rx={3.6} ry={4.2} />
          <ellipse cx={16.5} cy={9} rx={3.6} ry={4.2} />
          <ellipse cx={23.5} cy={9} rx={3.6} ry={4.2} />
          <ellipse cx={29.5} cy={14} rx={3.6} ry={4.2} />
        </g>
      );
    case 'feather':
      return (
        <g transform="rotate(35 20 20)" {...ink}>
          <path d="M20,36 C26,28 29,14 20,4 C11,14 14,28 20,36 Z" />
          <path d="M20,38 L20,10" fill="none" />
        </g>
      );
    case 'moon':
      return <path d={moonPath(19, 20, 13)} {...ink} />;
  }
}

/**
 * The anticipation layer: a soft gold glyph ring on the floor under a casting hero (it replaces
 * the old 法陣), the hero's emblem lying in it like a seal. `spot` is the sprite's middle.
 */
export const FxAnticipation = ({ spot, emblem, unit = SPRITE_WIDTH }: { spot: Spot; emblem: Emblem; unit?: number }) => {
  const bloom = useBloom();
  const width = unit * 1.3;
  return (
    <span
      aria-hidden="true"
      data-fx-glyph={emblem}
      className="pointer-events-none absolute block"
      // The ring sits at the feet: half a sprite below its middle (margins in % follow the box's width)
      style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%`, width: `${width * 100}%`, aspectRatio: '2 / 1', transform: 'translate(-50%, -50%)', marginTop: `${unit * 44}%` }}
    >
      <svg viewBox="0 0 100 50" className="block h-full w-full overflow-visible">
        <Node role="glyph" anim="glyph" delay={0}>
          <ellipse cx={50} cy={25} rx={48} ry={15} fill={bloom('gold')} opacity={0.5} />
          <ellipse cx={50} cy={25} rx={45} ry={13} fill="none" stroke={FX.gold} strokeWidth={2} opacity={0.9} />
          <ellipse cx={50} cy={25} rx={38} ry={10.5} fill="none" stroke={FX.goldLight} strokeWidth={0.9} strokeDasharray="3 3" opacity={0.85} />
          {[
            [5, 25],
            [95, 25],
            [50, 12],
            [50, 38],
          ].map(([x, y]) => (
            <path key={`${x}${y}`} d={star4(x, y, 3.2, 0.3)} fill={FX.goldLight} />
          ))}
        </Node>
        <Node role="glyph" anim="emblem" delay={40}>
          <g transform="translate(50 25) scale(0.9 0.4) translate(-20 -20)" opacity={0.92}>
            {emblemShape(emblem)}
          </g>
        </Node>
      </svg>
    </span>
  );
};

/** The full-stage colour wash (≤ 0.3 opacity, 200ms) for a move that hits several targets. */
export const FxWash = ({ colour, delay }: { colour: string; delay: number }) => (
  <span
    aria-hidden="true"
    data-fx-node="wash"
    className="fx-node fx-wash fx-a-wash pointer-events-none absolute inset-0 block"
    style={{ background: `radial-gradient(70% 60% at 60% 45%, ${withAlpha(colour, 1)}, ${withAlpha(colour, 0.35)} 60%, transparent)`, animationDelay: `${delay}ms` }}
  />
);
