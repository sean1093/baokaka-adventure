import { useMemo } from 'react';
import type { KitCtx } from '../../art';
import { creatureArt } from '../art/registry';
import { ArtG, r2 } from '../parts/common';

/**
 * A creature's sprite slot (GDD § 3.9 layer 5): its registry art (an origami bird until the key
 * has its own), feet at its node, facing the way it last moved.
 */
export function Creature({ ctx, id, art, x, y, flip }: { ctx: KitCtx; id: string; art: string; x: number; y: number; flip: boolean }) {
  const html = useMemo(() => creatureArt(art)(ctx), [art, ctx]);
  return (
    <g data-creature={id} data-anim="" transform={`translate(${r2(x)} ${r2(y)})${flip ? ' scale(-1 1)' : ''}`}>
      <ArtG html={html} />
    </g>
  );
}
