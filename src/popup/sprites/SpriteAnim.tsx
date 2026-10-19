import { useEffect, useMemo, useRef, useState } from 'react';
import { POPUP as C } from '../../art/palette';
import { eventsBetween, frameOfStep, spriteClock, stepAt, type SpriteClock } from './clock';
import { deviceScale, floorUrl, frameUrl, spriteDef, spriteUrls, useFramesReady, type SpriteLoader } from './loader';
import { spriteTransform, toPage, type Facing, type Scale } from './manifest';
import { SPRITE_MANIFEST, type SpriteId } from './sprites.gen';

/**
 * A baked character sprite (#94; GDD § 3.9 layer 6), drawn as one SVG `<image>` with its anchor
 * (the foot point) on (x, y).
 *
 * - **Frames** come from the shared rAF clock (`clock.ts`): the component re-renders only when the
 *   shown frame changes. `playing` false (or `reduced`) holds the animation's key frame; a `once`
 *   animation calls `onDone` after its last frame, and `onEvent` hears its named frames. `frame`
 *   shows one frame instead, for frames driven by the step (#95: the crawl stride, Mocha's hop).
 * - **Mirroring**: frames face right; `facing: 'l'` mirrors about the anchor, so the foot point
 *   never jumps (`noMirror` sprites never flip).
 * - **Loading**: until every frame of the animation is decoded, a placeholder card fills the
 *   frame's box (same size: no layout shift). Timing runs from mount regardless, so the game never
 *   waits on the network.
 * - **Floor contact** (bible § 5): the shared soft ellipse under the footprint, behind the card,
 *   nudged toward the light's fall (+x).
 *
 * No filters: the standee look is baked into the frames (`npm run sync:sprites`).
 */

export interface SpriteAnimProps {
  readonly sprite: SpriteId;
  /** The animation (`main` by default; `key` is the cheaper keyframe cycle) */
  readonly anim?: string;
  readonly facing?: Facing;
  readonly playing?: boolean;
  /**
   * Show this frame (an index into the animation's frames) instead of running the clock: frames
   * driven by something else, such as a crawl stride synced to the step's lerp (#95)
   */
  readonly frame?: number;
  /** Reduced motion: hold the key frame */
  readonly reduced?: boolean;
  readonly x?: number;
  readonly y?: number;
  /** Draw size (the sprite's `mapScale` is applied on top) */
  readonly scale?: number;
  /** Draw the floor contact ellipse (default true) */
  readonly floor?: boolean;
  /** Changing it restarts the animation */
  readonly restart?: unknown;
  readonly onDone?: () => void;
  readonly onEvent?: (name: string) => void;
  /** Tests and PageLab: a clock, a loader, a fixed scale */
  readonly clock?: SpriteClock;
  readonly loader?: SpriteLoader;
  readonly dpr?: Scale;
}

/** The light falls toward +x (bible § 5); the contact ellipse leans that way by this much. */
export const FLOOR_NUDGE = 2;

export function SpriteAnim({
  sprite,
  anim = 'main',
  facing = 'r',
  playing = true,
  frame: shown,
  reduced = false,
  x = 0,
  y = 0,
  scale = 1,
  floor = true,
  restart,
  onDone,
  onEvent,
  clock,
  loader,
  dpr,
}: SpriteAnimProps) {
  const def = spriteDef(sprite);
  const a = def.anims[anim] ?? def.anims.main;
  const res = useMemo(() => dpr ?? deviceScale(), [dpr]);
  const urls = useMemo(() => spriteUrls(sprite, res, anim in def.anims ? anim : 'main'), [sprite, res, anim, def]);
  const ready = useFramesReady(urls, loader);
  const [step, setStep] = useState(0);
  const cb = useRef({ onDone, onEvent });
  cb.current = { onDone, onEvent };

  const controlled = shown !== undefined;
  const live = playing && !reduced && !controlled;
  useEffect(() => {
    setStep(0);
    if (!live) return;
    const c = clock ?? spriteClock();
    const t0 = c.now();
    let last = -1;
    let off: (() => void) | null = null;
    const tick = (t: number) => {
      const n = stepAt(a, t - t0);
      if (n === last) return;
      for (const e of eventsBetween(a, last, n)) cb.current.onEvent?.(e);
      last = n;
      setStep(n);
      if (a.mode === 'once' && n >= a.frames.length) {
        off?.();
        off = null;
        cb.current.onDone?.();
      }
    };
    tick(t0);
    if (a.mode === 'once' && last >= a.frames.length) return;
    if (a.frames.length === 1 && a.mode !== 'once') return;
    off = c.subscribe(tick);
    return () => off?.();
  }, [sprite, a, live, clock, restart]);

  // Reduced motion and paused sprites hold the key frame; a held `once` is finished at once
  useEffect(() => {
    if (!live && reduced && !controlled && a.mode === 'once') cb.current.onDone?.();
  }, [live, reduced, controlled, a, restart]);

  const n = a.frames.length;
  const index = controlled ? ((Math.floor(shown) % n) + n) % n : live ? frameOfStep(a, step) : a.hold;
  const frame = a.frames[index];
  const href = ready ? frameUrl(def.files[frame], res) : undefined;
  const s = scale * def.mapScale;
  const [w, h] = def.size;

  let ellipse: JSX.Element | null = null;
  const fUrl = floorUrl(res);
  if (floor && fUrl) {
    const f = SPRITE_MANIFEST.floor;
    const cx = toPage(def, facing, x, y, [(def.foot[0] + def.foot[1]) / 2, def.anchor[1]], s)[0] + FLOOR_NUDGE * s;
    const kx = (((def.foot[1] - def.foot[0]) / 2 + 3) * s) / f.ellipse.rx;
    const ky = s;
    ellipse = (
      <image
        data-floor=""
        href={fUrl}
        width={f.size[0]}
        height={f.size[1]}
        transform={`matrix(${r3(kx)} 0 0 ${r3(ky)} ${r3(cx - f.ellipse.cx * kx)} ${r3(y + 1 - f.ellipse.cy * ky)})`}
        preserveAspectRatio="none"
      />
    );
  }

  return (
    <g data-sprite={sprite} data-frame={frame} data-facing={facing} data-ready={ready ? '' : undefined}>
      {ellipse}
      <g transform={spriteTransform(def, facing, x, y, s)}>
        {href !== undefined ? (
          <image href={href} width={w} height={h} preserveAspectRatio="none" />
        ) : (
          <Placeholder def={def} />
        )}
      </g>
    </g>
  );
}

/** The waiting card: the standee's warm white, a cut line, in the box the frame will fill. */
function Placeholder({ def }: { def: ReturnType<typeof spriteDef> }) {
  const x0 = Math.max(4, def.foot[0] - 2);
  const x1 = Math.min(def.size[0] - 4, Math.max(def.foot[1] + 2, x0 + 16));
  const y0 = Math.max(2, def.head[1]);
  const y1 = def.anchor[1];
  return (
    <rect data-placeholder="" x={r3(x0)} y={r3(y0)} width={r3(x1 - x0)} height={r3(y1 - y0)} rx={10} fill={C.standeeCard} fillOpacity={0.55} stroke={C.standeeCut} strokeOpacity={0.5} strokeWidth={0.8} />
  );
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** A sprite's head (bubble anchor) relative to its feet, as drawn for `facing`. */
export function spriteHead(sprite: SpriteId, facing: Facing = 'r', scale = 1): readonly [number, number] {
  const def = spriteDef(sprite);
  return toPage(def, facing, 0, 0, def.head, scale * def.mapScale);
}
