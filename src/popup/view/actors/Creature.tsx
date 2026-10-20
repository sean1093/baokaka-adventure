import { useMemo } from 'react';
import type { KitCtx } from '../../art';
import { creatureArt } from '../art/registry';
import { ArtG, r2 } from '../parts/common';

/**
 * A creature's sprite slot (GDD § 3.9 layer 5): its registry art (an origami bird until the key
 * has its own), feet at its node, facing the way it last moved, drawn for its current position
 * (#108: the backpacker asleep or sat up).
 */
export function Creature({ ctx, id, art, x, y, flip, pos }: { ctx: KitCtx; id: string; art: string; x: number; y: number; flip: boolean; pos?: string }) {
  const html = useMemo(() => creatureArt(art)(ctx, pos), [art, ctx, pos]);
  return (
    <g data-creature={id} data-anim="" transform={`translate(${r2(x)} ${r2(y)})${flip ? ' scale(-1 1)' : ''}`}>
      <ArtG html={html} />
    </g>
  );
}
