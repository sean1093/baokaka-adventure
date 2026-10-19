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
 */

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
}

export function Baby({ ctx, x, y, mode, sx }: BabyProps) {
  const pose = babyPose(mode);
  const html = useMemo(() => babyStandee(ctx, pose), [ctx, pose]);
  return (
    <g data-actor="baby" data-mode={mode} data-anim="" transform={`translate(${r2(x)} ${r2(y)}) scale(${r2(sx)} 1)`}>
      <ArtG html={html} />
    </g>
  );
}
