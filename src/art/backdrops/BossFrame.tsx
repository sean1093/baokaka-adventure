import { memo } from 'react';
import { FRAME } from '../palette';
import { n } from '../sky/SkyLayer';
import { useSvgIds } from '../useSvgIds';
import { STAGE_H, STAGE_VIEW } from './Stage';

/**
 * The 布袋戲 puppet-theatre proscenium (art direction § 7.4 *Boss fights*, § 6.3; borrowed from
 * option B, decisions D-08 and D-31). Drawn in stage units over the stage, so it lines up with the
 * backdrop at any phone shape; `left`/`right` are the visible edges of the stage (stage units).
 *
 *   boss   the valance only: a vermilion band with gold rules, scalloped lobes with gold studs
 *   final  the full proscenium: a cornice of studs over the valance, tassels, carved side pillars
 *          with gold inner rules and corner brackets, and an apron along the bottom
 *
 * The frame slides down over 400ms when the fight opens (`stage-frame-drop`, a transform on its
 * wrapper), so it holds no filter: its shadow is a gradient.
 */

export type FrameVariant = 'boss' | 'final';

type Props = { variant: FrameVariant; left: number; right: number };

/** Valance geometry (stage units). */
const BAND = 24;
const LOBE_W = 39;
const LOBE_H = 15;
const PILLAR = 20;

export const BossFrame = memo(function BossFrame({ variant, left, right }: Props) {
  const id = useSvgIds('frame');
  const final = variant === 'final';
  const top = final ? 9 : 0;
  const rule = top + BAND;
  // Lobes are laid out from the centre outward, so the valance is symmetric at any width
  const first = 195 - LOBE_W / 2 - Math.ceil((195 - LOBE_W / 2 - left) / LOBE_W) * LOBE_W;
  const lobes: number[] = [];
  for (let x = first; x < right; x += LOBE_W) lobes.push(x);
  const lobePath = lobes.map((x) => `M${n(x)},${rule + 2}a${LOBE_W / 2},${LOBE_H} 0 0,0 ${LOBE_W},0Z`).join('');
  const lobeEdge = lobes.map((x) => `M${n(x)},${rule + 2}a${LOBE_W / 2},${LOBE_H} 0 0,0 ${LOBE_W},0`).join('');
  const studs = lobes.map((x) => x + LOBE_W / 2);
  const cornice = final ? Array.from({ length: Math.ceil((right - left) / 13) + 1 }, (_, i) => left + 6 + i * 13) : [];
  const width = right - left;
  const inner = { l: final ? left + PILLAR : left, r: final ? right - PILLAR : right };
  // Carved panels down each pillar
  const panels = [70, 170, 270, 370].map((y) => [y, y + 80]);
  return (
    <svg
      data-boss-frame={variant}
      viewBox={`${STAGE_VIEW.x} ${STAGE_VIEW.y} ${STAGE_VIEW.w} ${STAGE_VIEW.h}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FRAME.vermilionLit} />
          <stop offset=".45" stopColor={FRAME.vermilion} />
          <stop offset="1" stopColor={FRAME.vermilionDeep} />
        </linearGradient>
        <linearGradient id={id('lobe')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FRAME.valanceLit} />
          <stop offset=".5" stopColor={FRAME.valance} />
          <stop offset="1" stopColor={FRAME.valanceDeep} />
        </linearGradient>
        <radialGradient id={id('stud')} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor={FRAME.studLit} />
          <stop offset=".45" stopColor={FRAME.stud} />
          <stop offset="1" stopColor={FRAME.studDeep} />
        </radialGradient>
        <linearGradient id={id('shade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FRAME.shadow} stopOpacity=".55" />
          <stop offset="1" stopColor={FRAME.shadow} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('pillarL')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={FRAME.vermilionDeep} />
          <stop offset=".35" stopColor={FRAME.vermilionLit} />
          <stop offset=".7" stopColor={FRAME.vermilion} />
          <stop offset="1" stopColor={FRAME.vermilionDeep} />
        </linearGradient>
        <linearGradient id={id('pillarR')} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={FRAME.vermilionDeep} />
          <stop offset=".35" stopColor={FRAME.vermilion} />
          <stop offset=".7" stopColor={FRAME.vermilion} />
          <stop offset="1" stopColor={FRAME.vermilionDeep} />
        </linearGradient>
        <linearGradient id={id('sideShade')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={FRAME.shadow} stopOpacity=".5" />
          <stop offset="1" stopColor={FRAME.shadow} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* The shadow the frame casts on the stage */}
      <rect x={left} y={rule} width={width} height={46} fill={`url(#${id('shade')})`} />
      {final && (
        <>
          <rect x={inner.l} y={0} width={16} height={STAGE_H} fill={`url(#${id('sideShade')})`} />
          <rect x={inner.r - 16} y={0} width={16} height={STAGE_H} fill={`url(#${id('sideShade')})`} transform={`rotate(180 ${inner.r - 8} ${STAGE_H / 2})`} />
        </>
      )}

      {/* Side pillars (final): carved panels, gold inner rules, studs */}
      {final && (
        <g>
          <rect x={left} y={0} width={PILLAR} height={STAGE_H} fill={`url(#${id('pillarL')})`} />
          <rect x={right - PILLAR} y={0} width={PILLAR} height={STAGE_H} fill={`url(#${id('pillarR')})`} />
          {panels.map(([y0, y1]) => (
            <g key={y0} fill="none" stroke={FRAME.vermilionDeep} strokeWidth={1.2}>
              <rect x={left + 4} y={y0} width={PILLAR - 9} height={y1 - y0} rx={2} />
              <rect x={right - PILLAR + 5} y={y0} width={PILLAR - 9} height={y1 - y0} rx={2} />
              <path d={`M${left + 4.6},${y0 + 1}h${PILLAR - 10} M${right - PILLAR + 5.6},${y0 + 1}h${PILLAR - 10}`} stroke={FRAME.vermilionLit} strokeWidth={0.8} opacity={0.8} />
            </g>
          ))}
          {panels.map(([y0, y1]) =>
            [left + PILLAR / 2 - 0.5, right - PILLAR / 2 + 0.5].map((x) => <circle key={`${x}${y0}`} cx={x} cy={(y0 + y1) / 2} r={3} fill={`url(#${id('stud')})`} />),
          )}
          <path d={`M${left + PILLAR - 1},0V${STAGE_H} M${right - PILLAR + 1},0V${STAGE_H}`} stroke={FRAME.gold} strokeWidth={2} />
          <path d={`M${left + PILLAR - 3.5},0V${STAGE_H} M${right - PILLAR + 3.5},0V${STAGE_H}`} stroke={FRAME.goldLit} strokeWidth={0.7} opacity={0.7} />
          {/* Apron along the bottom */}
          <rect x={left} y={STAGE_H - 10} width={width} height={10} fill={FRAME.vermilionDeep} />
          <path d={`M${left},${STAGE_H - 10}H${right}`} stroke={FRAME.gold} strokeWidth={1.6} />
          <path d={`M${left},${STAGE_H - 7.5}H${right}`} stroke={FRAME.goldDeep} strokeWidth={0.6} />
        </g>
      )}

      {/* Cornice (final): a deep strip with a row of small studs */}
      {final && (
        <g>
          <rect x={left} y={0} width={width} height={top} fill={FRAME.vermilionDeep} />
          {cornice.map((x) => (
            <circle key={x} cx={x} cy={top / 2} r={2.2} fill={`url(#${id('stud')})`} />
          ))}
          <path d={`M${left},${top}H${right}`} stroke={FRAME.gold} strokeWidth={1} />
        </g>
      )}

      {/* The valance: band, gold rules, lobes with studs */}
      <rect x={left} y={top} width={width} height={BAND} fill={`url(#${id('band')})`} />
      <path d={`M${left},${top + 3}H${right}`} stroke={FRAME.goldLit} strokeWidth={0.7} opacity={0.6} />
      <path d={lobePath} fill={`url(#${id('lobe')})`} />
      <path d={lobeEdge} stroke={FRAME.gold} strokeWidth={1.1} fill="none" />
      <path d={`M${left},${rule}H${right}`} stroke={FRAME.goldDeep} strokeWidth={3.2} />
      <path d={`M${left},${rule - 0.6}H${right}`} stroke={FRAME.gold} strokeWidth={1.4} />
      <path d={`M${left},${rule + 1.4}H${right}`} stroke={FRAME.goldLit} strokeWidth={0.6} opacity={0.8} />
      {studs.map((x) => (
        <g key={x}>
          <circle cx={n(x)} cy={rule + 8.6} r={3.4} fill={`url(#${id('stud')})`} />
          <circle cx={n(x - 1)} cy={rule + 7.6} r={0.9} fill={FRAME.studLit} />
        </g>
      ))}
      {/* A gold diamond at the centre of the band */}
      <path d={`M195,${top + 4}l7,8 -7,8 -7,-8Z`} fill={`url(#${id('stud')})`} stroke={FRAME.goldDeep} strokeWidth={0.8} />

      {/* Tassels between the lobes (final) */}
      {final &&
        lobes.slice(1).map((x) => (
          <g key={x}>
            <path d={`M${n(x)},${rule + 2}v12`} stroke={FRAME.gold} strokeWidth={0.8} />
            <path d={`M${n(x)},${rule + 13}c-2.6,2 -3,7 0,11c3,-4 2.6,-9 0,-11Z`} fill={FRAME.tassel} />
          </g>
        ))}

      {/* Corner brackets (final): gold-edged cloud scrolls where valance meets pillar */}
      {final &&
        [1, -1].map((side) => {
          const x = side > 0 ? inner.l : inner.r;
          const d = `M${x},${rule}h${side * 46}c${side * -8},4 ${side * -16},6 ${side * -22},14c${side * -4},6 ${side * -10},8 ${side * -16},6c${side * 2},8 ${side * -2},18 ${side * -8},24Z`;
          return (
            <g key={side}>
              <path d={d} fill={`url(#${id('band')})`} stroke={FRAME.gold} strokeWidth={1.4} strokeLinejoin="round" />
              <circle cx={x + side * 12} cy={rule + 14} r={2.6} fill={`url(#${id('stud')})`} />
            </g>
          );
        })}
    </svg>
  );
});
