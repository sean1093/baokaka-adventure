import { useMemo } from 'react';
import type { KitCtx } from '../../art';
import { mochaStandee } from '../art/placeholders';
import { ArtG, r2 } from '../parts/common';

/**
 * 摩卡's sprite slot (GDD § 3.9 layer 6): a sitting tabby standee where he is. A vector stand-in
 * until #94 plays the baked v2 frames; #95 adds his hop, land and the glare frame.
 *
 * `glare` (GDD § 2.6 locked part, #90): a touch on a part he locks, or any locked part, makes him
 * glare: a short stiff lean (`.gx-glare`, `gestures.css`; still under reduced motion), and
 * `data-glare` for #95's face frame. Changing `glare` replays it.
 */
export function Mocha({ ctx, x, y, glare }: { ctx: KitCtx; x: number; y: number; glare?: number }) {
  const html = useMemo(() => mochaStandee(ctx), [ctx]);
  return (
    <g data-actor="mocha" data-glare={glare === undefined ? undefined : ''} data-anim="" transform={`translate(${r2(x)} ${r2(y)})`}>
      {glare === undefined ? (
        <ArtG html={html} />
      ) : (
        <g key={glare} className="gx-glare">
          <ArtG html={html} />
        </g>
      )}
    </g>
  );
}
