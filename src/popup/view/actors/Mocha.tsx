import { useMemo } from 'react';
import type { KitCtx } from '../../art';
import { mochaStandee } from '../art/placeholders';
import { ArtG, r2 } from '../parts/common';

/**
 * 摩卡's sprite slot (GDD § 3.9 layer 6): a sitting tabby standee where he is. A vector stand-in
 * until #94 plays the baked v2 frames; #95 adds his hop, land and glare.
 */
export function Mocha({ ctx, x, y }: { ctx: KitCtx; x: number; y: number }) {
  const html = useMemo(() => mochaStandee(ctx), [ctx]);
  return (
    <g data-actor="mocha" data-anim="" transform={`translate(${r2(x)} ${r2(y)})`}>
      <ArtG html={html} />
    </g>
  );
}
