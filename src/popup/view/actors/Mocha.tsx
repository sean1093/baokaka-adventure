import { useEffect } from 'react';
import type { Facing } from '../../sprites';
import { SpriteAnim } from '../../sprites';
import { r2 } from '../parts/common';
import { noteFrameFallback, type ActorAnim, type FrameChoice } from './animMap';

/**
 * 摩卡's sprite slot (GDD § 3.9 layer 6): the baked v2 standee (#94), showing what `animMap.ts`
 * picked for his state (#95): sitting (a loaf on a part), the hop's crouch → air → land along his
 * step (the arc is `stepPose`'s), squeezing through a gap, the eye-contact tick, the push, the puff,
 * the tail flick at an unreachable perch, and the fallbacks for the frames #141 draws. He turns
 * toward 寶咖咖 at rest and toward where he is going while he travels (`facing`; frames face right
 * and mirror about his feet).
 *
 * `glare` (GDD § 2.6 locked part, #90): a touch on a part he locks, or any locked part, makes him
 * glare: a short stiff lean (`.gx-glare`, `gestures.css`; still under reduced motion). Changing
 * `glare` replays it.
 */
export interface MochaProps {
  readonly x: number;
  readonly y: number;
  readonly anim: ActorAnim;
  readonly frame: FrameChoice;
  /** The locked touch's serial while he glares */
  readonly glare?: number;
  readonly facing?: Facing;
  /** The step's lean or landing wobble, degrees clockwise about his feet */
  readonly tilt?: number;
  /** Reduced motion's fade-slide */
  readonly opacity?: number;
  readonly reduced?: boolean;
  readonly still?: boolean;
}

export function Mocha({ x, y, anim, frame, glare, facing = 'r', tilt = 0, opacity = 1, reduced = false, still = false }: MochaProps) {
  useEffect(() => noteFrameFallback(anim), [anim.fallback]);
  const sprite = <SpriteAnim sprite={anim.sprite} anim={frame.anim} frame={frame.frame} facing={facing} playing={frame.playing && !still} reduced={reduced} />;
  const rotate = Math.abs(tilt) < 0.01 ? '' : ` rotate(${r2(tilt)})`;
  return (
    <g
      data-actor="mocha"
      data-pose={anim.gdd ?? anim.sprite}
      data-fallback={anim.fallback === undefined ? undefined : ''}
      data-glare={glare === undefined ? undefined : ''}
      data-anim=""
      transform={`translate(${r2(x)} ${r2(y)})${rotate}`}
      opacity={opacity < 1 ? r2(opacity) : undefined}
    >
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
