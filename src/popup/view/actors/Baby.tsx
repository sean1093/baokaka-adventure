import { useEffect } from 'react';
import type { BabyMode } from '../../core/types';
import { SpriteAnim } from '../../sprites';
import { clamp01 } from '../interp';
import { r2 } from '../parts/common';
import { babyAnim, noteFrameFallback, type ActorAnim, type FrameChoice } from './animMap';
import './actors.css';

/**
 * 寶咖咖's sprite slot (GDD § 3.9 layer 6): the baked v2 standee frames (#94), his feet (the
 * frame's anchor) at his position, showing what `animMap.ts` picked for his mode (#95).
 *
 * - **Turning** is a card flip (`scaleX` 1 → 0 → −1 over 120 ms, bible § 5) about his feet, which
 *   is also how a frame is mirrored for facing left (`sx`).
 * - **Stepping** leans the card into the travel direction and wobbles it on landing (`tilt`,
 *   `standee.ts`); under reduced motion a step is a fade-slide (`opacity`).
 * - **Touch-watch** (GDD § 2.6, bible § 5): while a finger pauses the world he watches it, the
 *   whole standee tilted 3° toward it (`watch`: −1 left, 1 right).
 * - **Watch-sway** (fallback until #141): the card rocks ±3° (a CSS loop, so stills and reduced
 *   motion stop it).
 * - **Lamp glow** (bible § 5): a soft warm glow behind him near a lit light (`glow`).
 */

/** The touch-watch tilt toward the finger (bible § 5: 3°). */
export const WATCH_TILT = 3;

/** The card-flip turn (bible § 8: 120 ms). */
export const FLIP_MS = 120;

/** scaleX for a turn from `from` to `to` facing, `ms` into the tick. */
export function flipScale(from: 'l' | 'r', to: 'l' | 'r', ms: number, reduced: boolean): number {
  const a = from === 'r' ? 1 : -1;
  const b = to === 'r' ? 1 : -1;
  return a === b || reduced ? b : a + (b - a) * clamp01(ms / FLIP_MS);
}

/** His sprite for a mode with nothing else going on (the bubble anchor's default). */
export const babySprite = (mode: BabyMode) => babyAnim({ mode, edge: null, growth: 0 }).sprite;

export interface BabyProps {
  readonly x: number;
  readonly y: number;
  readonly mode: BabyMode;
  /** What he shows (`babyAnim`) and the frame of it (`chooseFrame`) */
  readonly anim: ActorAnim;
  readonly frame: FrameChoice;
  /** scaleX: the card flip and the mirror for facing left */
  readonly sx: number;
  /** The step's lean or landing wobble, degrees clockwise about his feet */
  readonly tilt?: number;
  /** Reduced motion's fade-slide */
  readonly opacity?: number;
  /** The finger is down left (−1) or right (1) of him: he watches it */
  readonly watch?: -1 | 1;
  /** Near a lit lamp: the warm glow behind him, as its paint (the page's `standeeGlow` gradient) */
  readonly glow?: string;
  /** Reduced motion: hold each pose's key frame */
  readonly reduced?: boolean;
  /** A still (screenshots): no frame animation */
  readonly still?: boolean;
}

export function Baby({ x, y, mode, anim, frame, sx, tilt = 0, opacity = 1, watch, glow, reduced = false, still = false }: BabyProps) {
  useEffect(() => noteFrameFallback(anim), [anim.fallback]);
  const lean = tilt + (watch === undefined ? 0 : watch * WATCH_TILT);
  const rotate = Math.abs(lean) < 0.01 ? '' : ` rotate(${r2(lean)})`;
  const sway = anim.sway === true && !reduced && !still;
  const sprite = <SpriteAnim sprite={anim.sprite} anim={frame.anim} frame={frame.frame} playing={frame.playing && !still} reduced={reduced} />;
  return (
    <g
      data-actor="baby"
      data-mode={mode}
      data-pose={anim.gdd ?? anim.sprite}
      data-fallback={anim.fallback === undefined ? undefined : ''}
      data-watch={watch === undefined ? undefined : watch < 0 ? 'l' : 'r'}
      data-anim=""
      transform={`translate(${r2(x)} ${r2(y)})${rotate} scale(${r2(sx)} 1)`}
      opacity={opacity < 1 ? r2(opacity) : undefined}
    >
      {glow !== undefined && <ellipse data-lamp-glow="" cx={0} cy={-32} rx={50} ry={44} fill={glow} />}
      {sway ? <g className="actor-sway">{sprite}</g> : sprite}
    </g>
  );
}
