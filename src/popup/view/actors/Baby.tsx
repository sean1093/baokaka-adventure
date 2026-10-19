import type { BabyMode } from '../../core/types';
import { SpriteAnim, type SpriteId } from '../../sprites';
import { clamp01 } from '../interp';
import { r2 } from '../parts/common';

/**
 * 寶咖咖's sprite slot (GDD § 3.9 layer 6): the baked v2 standee frames (#94), his feet (the
 * frame's anchor) at his position. Turning around is a card flip (`scaleX` 1 → 0 → −1 over 120 ms,
 * bible § 5) about his feet, which is also how a frame is mirrored for facing left; everything else
 * is the caller's lerp.
 *
 * **Touch-watch** (GDD § 2.6, bible § 5): while a finger pauses the world he watches it, the whole
 * standee tilted 3° toward it (`watch`: −1 left, 1 right). #141 adds the curious head frame.
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

/**
 * His frames for a sim mode, and whether they play: a first mapping that proves the pipeline on
 * every page; #95 owns the full one (look L/R, ride-giggle, carried, the growth stages).
 */
export function babySprite(mode: BabyMode): { sprite: SpriteId; playing: boolean } {
  switch (mode) {
    case 'moving':
      return { sprite: 'baokaka.crawl', playing: true };
    case 'idle':
    case 'carried':
    case 'linked':
      return { sprite: 'baokaka.crawl', playing: false };
    case 'reaching':
      return { sprite: 'baokaka.reach', playing: false };
    case 'grabbing':
      return { sprite: 'baokaka.hold', playing: false };
    case 'eating':
      return { sprite: 'baokaka.eat', playing: false };
    case 'crying':
      return { sprite: 'baokaka.cry', playing: true };
    case 'saying':
      return { sprite: 'baokaka.point', playing: false };
    case 'done':
      return { sprite: 'baokaka.clap', playing: true };
    case 'looking':
    case 'watching':
    case 'cuddling':
      return { sprite: 'baokaka.sit', playing: false };
  }
}

export interface BabyProps {
  readonly x: number;
  readonly y: number;
  readonly mode: BabyMode;
  readonly sx: number;
  /** The finger is down left (−1) or right (1) of him: he watches it */
  readonly watch?: -1 | 1;
  /** Reduced motion: hold each pose's key frame */
  readonly reduced?: boolean;
  /** A still (screenshots): no frame animation */
  readonly still?: boolean;
}

export function Baby({ x, y, mode, sx, watch, reduced = false, still = false }: BabyProps) {
  const { sprite, playing } = babySprite(mode);
  const tilt = watch === undefined ? '' : ` rotate(${watch * WATCH_TILT})`;
  return (
    <g data-actor="baby" data-mode={mode} data-watch={watch === undefined ? undefined : watch < 0 ? 'l' : 'r'} data-anim="" transform={`translate(${r2(x)} ${r2(y)})${tilt} scale(${r2(sx)} 1)`}>
      <SpriteAnim sprite={sprite} playing={playing && !still} reduced={reduced} />
    </g>
  );
}
