import { useMemo, type CSSProperties } from 'react';
import { POPUP as C } from '../../../art/palette';
import { ghostHand, hintHalo, type KitCtx } from '../../art';
import type { Hit, Pt } from '../geometry';
import { ArtG, r2 } from '../parts/common';
import type { HaloShape } from './hints';
import type { HandGesture } from './look';

/**
 * The hint visuals (bible § 4.1; GDD § 2.7), drawn where `hints.ts` says: the L1 halo behind the
 * target, pulsing for 3 s (opacity only), and the L2 vellum ghost hand doing the gesture on a loop
 * over it. Under reduced motion the halo holds still and the hand rests at its start, with the
 * printed path of the gesture beside it; the path is drawn in every mode, so a still reads too.
 */

const boxOf = (hit: Hit) => ('r' in hit ? { x: hit.cx - hit.r, y: hit.cy - hit.r, w: hit.r * 2, h: hit.r * 2 } : hit);

/**
 * The L1 halo; `once` is the L0 nudge's single shimmer (it fades in and out once, then is gone; under
 * reduced motion it holds still for the nudge's moment like L1's).
 */
export function HintHalo({ ctx, shape, reduced, strong, once = false }: { ctx: KitCtx; shape: HaloShape; reduced: boolean; strong?: boolean; once?: boolean }) {
  const { hit, at, deg = 0 } = shape;
  const html = useMemo(() => hintHalo(ctx, boxOf(hit), 'r' in hit, strong), [ctx, hit, strong]);
  return (
    <g data-hint-halo={once ? 'nudge' : ''} transform={at ? `translate(${r2(at[0])} ${r2(at[1])}) rotate(${r2(deg)})` : undefined}>
      <g className={reduced ? undefined : once ? 'aff-halo-once' : 'aff-halo'}>
        <ArtG html={html} />
      </g>
    </g>
  );
}

/** The dotted marigold thread between a hinted part and what it moves (bible § 4 linked parts). */
export function LinkThread({ from, to }: { from: Pt; to: Pt }) {
  return (
    <path
      data-affordance="link"
      d={`M${r2(from[0])} ${r2(from[1])}L${r2(to[0])} ${r2(to[1])}`}
      fill="none"
      stroke={C.marigold}
      strokeWidth={2.2}
      strokeDasharray="1 6"
      strokeLinecap="round"
      opacity={0.9}
    />
  );
}

/** The printed path of a gesture: a dotted chalk line with an arrowhead. */
function gesturePath(g: HandGesture): string {
  const head = (x: number, y: number, ang: number) => {
    const a1 = ang + Math.PI * 0.82;
    const a2 = ang - Math.PI * 0.82;
    return `M${r2(x + Math.cos(a1) * 8)} ${r2(y + Math.sin(a1) * 8)}L${r2(x)} ${r2(y)}L${r2(x + Math.cos(a2) * 8)} ${r2(y + Math.sin(a2) * 8)}`;
  };
  if (g.kind === 'drag') {
    const ang = Math.atan2(g.to[1] - g.from[1], g.to[0] - g.from[0]);
    return `M${r2(g.from[0])} ${r2(g.from[1])}L${r2(g.to[0])} ${r2(g.to[1])}|${head(g.to[0], g.to[1], ang)}`;
  }
  if (g.kind === 'turn') {
    const r = g.radius + 14;
    const a0 = -Math.PI / 2 - 0.5;
    const a1 = a0 + Math.min(Math.PI * 1.6, (g.degrees * Math.PI) / 180);
    const p = (a: number): Pt => [g.center[0] + Math.cos(a) * r, g.center[1] + Math.sin(a) * r];
    const [sx, sy] = p(a0);
    const [ex, ey] = p(a1);
    return `M${r2(sx)} ${r2(sy)}A${r2(r)} ${r2(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r2(ex)} ${r2(ey)}|${head(ex, ey, a1 + Math.PI / 2)}`;
  }
  if (g.kind === 'lift') {
    const [x, y] = g.at;
    return `M${r2(x + 12)} ${r2(y)}L${r2(x + 12)} ${r2(y - g.rise)}|${head(x + 12, y - g.rise, -Math.PI / 2)}`;
  }
  return '';
}

/** Where the hand rests and how its animation moves it. */
function handMotion(g: HandGesture): { at: Pt; className: string; style?: CSSProperties; pivot?: Pt } {
  if (g.kind === 'drag') return { at: g.from, className: 'aff-hand aff-hand-drag', style: { ['--dx' as string]: `${r2(g.to[0] - g.from[0])}px`, ['--dy' as string]: `${r2(g.to[1] - g.from[1])}px` } };
  if (g.kind === 'turn') return { at: [g.center[0], g.center[1] - g.radius * 0.8], className: 'aff-hand aff-hand-turn', style: { ['--deg' as string]: `${r2(g.degrees)}deg` }, pivot: g.center };
  if (g.kind === 'lift') return { at: g.at, className: 'aff-hand aff-hand-lift', style: { ['--rise' as string]: `${r2(g.rise)}px` } };
  return { at: g.at, className: 'aff-hand aff-hand-tap' };
}

export function GhostHand({ gesture, reduced }: { gesture: HandGesture; reduced: boolean }) {
  const hand = useMemo(() => ghostHand(gesture.kind === 'tap'), [gesture.kind]);
  const [line, arrow] = gesturePath(gesture).split('|');
  const m = handMotion(gesture);
  const cls = reduced ? undefined : m.className;
  const body = m.pivot ? (
    // A turn: the hand orbits the wheel's centre, its fingertip on the rim
    <g transform={`translate(${r2(m.pivot[0])} ${r2(m.pivot[1])})`}>
      <g className={cls} style={reduced ? undefined : m.style}>
        <g transform={`translate(${r2(m.at[0] - m.pivot[0])} ${r2(m.at[1] - m.pivot[1])})`}>
          <ArtG html={hand} />
        </g>
      </g>
    </g>
  ) : (
    <g transform={`translate(${r2(m.at[0])} ${r2(m.at[1])})`}>
      <g className={cls} style={reduced ? undefined : m.style}>
        <ArtG html={hand} />
      </g>
    </g>
  );
  return (
    <g data-hint-hand={gesture.kind}>
      {line && (
        <g fill="none" stroke={C.chalk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
          <path d={line} strokeDasharray="2 7" />
          {arrow && <path d={arrow} />}
        </g>
      )}
      {body}
    </g>
  );
}
