import { useMemo } from 'react';
import type { KitCtx } from '../../art';
import type { BabyMode } from '../../core/types';
import { babyPose, babyStandee } from '../art/placeholders';
import { clamp01 } from '../interp';
import { ArtG, r2 } from '../parts/common';

/**
 * 寶咖咖's sprite slot (GDD § 3.9 layer 6): a die-cut standee at his feet position. A vector
 * stand-in until #94 plays the baked v2 frames here. Turning around is a card flip (`scaleX`
 * 1 → 0 → −1 over 120 ms, bible § 5); everything else is the caller's lerp.
 *
 * **Touch-watch** (GDD § 2.6, bible § 5): while a finger pauses the world he watches it, the whole
 * standee tilted 3° toward it (`watch`: −1 left, 1 right). #94 swaps in the curious head frame.
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

export interface BabyProps {
  readonly ctx: KitCtx;
  readonly x: number;
  readonly y: number;
  readonly mode: BabyMode;
  readonly sx: number;
  /** The finger is down left (−1) or right (1) of him: he watches it */
  readonly watch?: -1 | 1;
}

export function Baby({ ctx, x, y, mode, sx, watch }: BabyProps) {
  const pose = babyPose(mode);
  const html = useMemo(() => babyStandee(ctx, pose), [ctx, pose]);
  const tilt = watch === undefined ? '' : ` rotate(${watch * WATCH_TILT})`;
  return (
    <g data-actor="baby" data-mode={mode} data-watch={watch === undefined ? undefined : watch < 0 ? 'l' : 'r'} data-anim="" transform={`translate(${r2(x)} ${r2(y)})${tilt} scale(${r2(sx)} 1)`}>
      <ArtG html={html} />
    </g>
  );
}
