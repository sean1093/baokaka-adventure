import { useMemo } from 'react';
import { POPUP_PARK as P } from '../../art/palette';
import { seeded, type KitCtx } from '../art';
import { GUTTER_Y, PAGE_W } from './geometry';
import './fireflies.css';

/**
 * Fireflies drifting over a park page (#115; bible § 6 row 2: "fireflies as pinholes that drift,
 * the only moving pinholes in the game"). A page's dress names how many (`dress.ts`); each is a
 * lime pinhole in a soft glow, seeded over the standing page above the play path, wandering on a
 * slow CSS loop (transform and opacity only; no filter). Under reduced motion, and in a screenshot
 * still (`[data-still]`), they hold still.
 */
export function Fireflies({ ctx, count, seed, reduced }: { ctx: KitCtx; count: number; seed: number; reduced: boolean }) {
  const glow = ctx.id('fireflyGlow');
  const flies = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({
      x: Math.round(20 + r() * (PAGE_W - 40)),
      y: Math.round(110 + r() * (GUTTER_Y - 150)),
      dur: (7 + r() * 5).toFixed(1),
      delay: (-r() * 8).toFixed(1),
      path: r() < 0.5 ? 'ff-a' : 'ff-b',
    }));
  }, [count, seed]);
  return (
    <g data-fireflies={count} pointerEvents="none">
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={P.fireflyCore} />
          <stop offset=".22" stopColor={P.fireflyCore} />
          <stop offset=".3" stopColor={P.firefly} stopOpacity={0.45} />
          <stop offset="1" stopColor={P.firefly} stopOpacity={0} />
        </radialGradient>
      </defs>
      {flies.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y})`}>
          {/* One node each (counted in the animated budget): the lit core fading into its glow */}
          <g data-anim="" className={reduced ? undefined : `ff ${f.path}`} style={reduced ? undefined : { animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>
            <circle r={6} fill={`url(#${glow})`} />
          </g>
        </g>
      ))}
    </g>
  );
}
