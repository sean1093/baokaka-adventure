import type { Facing } from '../../sprites';
import { SpriteAnim } from '../../sprites';
import { r2 } from '../parts/common';

/**
 * 摩卡's sprite slot (GDD § 3.9 layer 6): the baked v2 standee (#94), sitting where he is, turned
 * toward 寶咖咖 (`facing`; frames face right and mirror about his feet). #95 adds his hop, land,
 * push and the glare frame.
 *
 * `glare` (GDD § 2.6 locked part, #90): a touch on a part he locks, or any locked part, makes him
 * glare: a short stiff lean (`.gx-glare`, `gestures.css`; still under reduced motion), and
 * `data-glare` for #95's face frame. Changing `glare` replays it.
 */
export function Mocha({ x, y, glare, facing = 'r', reduced = false }: { x: number; y: number; glare?: number; facing?: Facing; reduced?: boolean }) {
  const sprite = <SpriteAnim sprite="mocha.sit" facing={facing} playing={false} reduced={reduced} />;
  return (
    <g data-actor="mocha" data-glare={glare === undefined ? undefined : ''} data-anim="" transform={`translate(${r2(x)} ${r2(y)})`}>
      {glare === undefined ? (
        sprite
      ) : (
        <g key={glare} className="gx-glare">
          {sprite}
        </g>
      )}
    </g>
  );
}
