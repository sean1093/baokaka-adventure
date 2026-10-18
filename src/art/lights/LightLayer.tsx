import { memo, useMemo } from 'react';
import type { GameMap } from '../../quest/engine/types';
import { gradeTiles, withAlpha } from '../palette';
import { useSvgIds } from '../useSvgIds';
import { LAMP_HEAD, LIGHT_SPECS, lightBox, placeLights } from './lights';

/**
 * Every light on a map in **one** `mix-blend-mode: screen` SVG (art direction § 8.4: the only
 * blend layer on the map; § 8.5 allows three). Blooms, ground pools, a soft cone under lamps and
 * reflection streaks on wet ground are radial and linear gradients only: no filters, so the layer
 * is cheap to composite over the walking party, who pick up the glow as they pass a lamp.
 *
 * Memoised on the map: it never re-renders while walking.
 */
const Lights = ({ map }: { map: GameMap }) => {
  const id = useSvgIds('light');
  const lights = useMemo(() => placeLights(map), [map]);
  const box = lightBox(lights);
  if (!box) return null;
  const colours = [...new Set(lights.map((light) => light.color))];
  const grad = (color: string, kind: 'bloom' | 'streak' | 'cone') => id(`${kind}-${colours.indexOf(color)}`);

  return (
    <svg
      aria-hidden="true"
      data-lights={lights.length}
      className="pointer-events-none absolute"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h, mixBlendMode: 'screen', willChange: 'transform' }}
      width={box.w}
      height={box.h}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
    >
      <defs>
        {colours.map((color) => (
          <g key={color}>
            <radialGradient id={grad(color, 'bloom')} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor={withAlpha(color, 0.95)} />
              <stop offset=".35" stopColor={withAlpha(color, 0.42)} />
              <stop offset="1" stopColor={withAlpha(color, 0)} />
            </radialGradient>
            <linearGradient id={grad(color, 'streak')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={withAlpha(color, 0.7)} />
              <stop offset="1" stopColor={withAlpha(color, 0)} />
            </linearGradient>
            <linearGradient id={grad(color, 'cone')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={withAlpha(color, 0.3)} />
              <stop offset="1" stopColor={withAlpha(color, 0.04)} />
            </linearGradient>
          </g>
        ))}
      </defs>
      {lights.map((light) => {
        const { bloom, pool, poolOpacity, streak } = light.spec;
        return (
          <g key={light.key} data-light={light.kind}>
            {light.kind === 'lamp' && (
              <path
                d={`M${light.gx - 3},${light.gy + 4}L${light.x - 24},${light.y + 4}L${light.x + 24},${light.y + 4}L${light.gx + 3},${light.gy + 4}Z`}
                fill={`url(#${grad(light.color, 'cone')})`}
              />
            )}
            <ellipse cx={light.x} cy={light.y} rx={pool[0]} ry={pool[1]} fill={`url(#${grad(light.color, 'bloom')})`} opacity={poolOpacity} />
            {light.wet && (
              <g opacity={0.8}>
                <rect x={light.x - 4} y={light.y - 2} width={8} height={streak} fill={`url(#${grad(light.color, 'streak')})`} transform={`skewX(-6) translate(${(light.y * Math.tan((6 * Math.PI) / 180)).toFixed(1)} 0)`} />
                <rect x={light.x + 7} y={light.y + 2} width={3} height={streak * 0.6} fill={`url(#${grad(light.color, 'streak')})`} opacity={0.7} />
              </g>
            )}
            {light.kind === 'moon' && (
              <path d={`M${light.x - 7},${light.y + 5}h14M${light.x - 4},${light.y + 8}h8`} stroke={light.core} strokeWidth={0.8} opacity={0.6} />
            )}
            {bloom > 0 && (
              <>
                <circle cx={light.gx} cy={light.gy} r={bloom} fill={`url(#${grad(light.color, 'bloom')})`} />
                <ellipse cx={light.gx} cy={light.gy} rx={light.kind === 'neon' ? 5 : 3.4} ry={1.6} fill={light.core} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const LightLayer = memo(Lights, (a, b) => a.map === b.map);

/**
 * The thing a light hangs on, drawn as a map actor so it sorts with the party (§ 8.4): a street
 * lamp's post and shepherd's-crook arm, a red lantern on a stand, a neon sign on a pole. Graded
 * by the map's clock like any prop; the glow itself is in `LightLayer`.
 */
export const LightFixture = ({ kind, color, time }: { kind: 'lamp' | 'lantern' | 'neon'; color?: string; time: string }) => {
  const tone = gradeTiles(time).fixture;
  // A 40×80 box over the actor box (whose bottom edge is the tile's lower corner, 18 px below its
  // centre), so local (20, 80) is the tile centre
  if (kind === 'lamp') {
    const hx = 20 + LAMP_HEAD.dx;
    const hy = 80 + LAMP_HEAD.dy;
    return (
      <svg viewBox="0 18 40 80" className="h-full w-full" aria-hidden="true">
        <ellipse cx={20} cy={79} rx={5} ry={1.8} fill={tone.post} opacity={0.6} />
        <path d={`M20,79L20,${hy + 8}q0,-6 6,-6h${hx - 26}`} stroke={tone.post} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <path d={`M21.4,78L21.4,${hy + 9}`} stroke={tone.postLit} strokeWidth={0.7} opacity={0.7} />
        <path d={`M${hx - 5},${hy - 2}h10l-2,4h-6Z`} fill={tone.head} />
      </svg>
    );
  }
  if (kind === 'lantern') {
    return (
      <svg viewBox="0 18 40 80" className="h-full w-full" aria-hidden="true">
        <path d="M14,79L14,38q0,-4 4,-4h4" stroke={tone.lanternCap} strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M22,34v4" stroke={tone.lanternCap} strokeWidth={1} />
        <ellipse cx={22} cy={44} rx={6.5} ry={7} fill={tone.lanternBody} />
        <path d="M22,37c-3,2 -3,12 0,14" stroke={tone.lanternDeep} strokeWidth={0.8} fill="none" />
        <rect x={18.5} y={36} width={7} height={2} rx={0.6} fill={tone.lanternCap} />
        <rect x={18.5} y={50} width={7} height={2} rx={0.6} fill={tone.lanternCap} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 18 40 80" className="h-full w-full" aria-hidden="true">
      <path d="M20,79V44" stroke={tone.post} strokeWidth={2} />
      <rect x={6} y={30} width={28} height={16} rx={3} fill={tone.signBack} />
      <rect x={8.5} y={32.5} width={23} height={11} rx={5.5} fill="none" stroke={color ?? LIGHT_SPECS.neon.color} strokeWidth={1.8} />
      <path d="M14,38h12" stroke={color ?? LIGHT_SPECS.neon.color} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
};
