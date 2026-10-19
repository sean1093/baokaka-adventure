import { memo } from 'react';
import type { KitCtx, PartArtOptions } from '../../art';
import { compilePart } from '../../core/presets';
import type { PartDef } from '../../core/types';
import type { PartLook } from '../affordance/look';
import { lerp, partProgress, snapSquash } from '../interp';

/**
 * What every part view shares (GDD § 3.9: parts are SVG groups moved by `transform` only —
 * translate, rotate, scaleY — with no filters; bible § 8: 250 ms ease-out with a 6 % overshoot,
 * then a 60 ms snap squash). A view gets the part's state before and after the latest tick and
 * the ms since that tick, and returns one `data-anim` group per moving piece.
 */

export interface PartViewProps {
  readonly part: PartDef;
  readonly ctx: KitCtx;
  /** The part's state before the latest tick, and now */
  readonly from: string;
  readonly to: string;
  /** ms since the latest tick started */
  readonly ms: number;
  readonly reduced: boolean;
  /** Nodes ride this part (it moves a carriage): show the linked brad (bible § 4 linked parts) */
  readonly linked: boolean;
  /**
   * A drag holds the part between stops (#90, GDD § 2.6 live preview): its state index as a
   * fraction (past the ends while rubber-banding; unwrapped for wheels). Overrides the tween.
   */
  readonly preview?: number;
  /** Its touchable state look (bible § 4.1, #140): wiggle, lift, locked veil, reduced outline, 長輩模式 */
  readonly look?: PartLook;
}

/** A memoised raw-SVG group: the art string is set once per change, not every frame. */
export const ArtG = memo(function ArtG({ html, className }: { html: string; className?: string }) {
  return <g className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

/** The part's states with defaults, and `state`'s index (0 when unknown) and fraction along them. */
export function stateAt(part: PartDef, state: string): { states: readonly string[]; index: number; count: number; t: number } {
  const { states } = compilePart(part);
  const index = Math.max(0, states.indexOf(state));
  const count = states.length;
  return { states, index, count, t: count > 1 ? index / (count - 1) : 0 };
}

/** Art options for a state (what `PRESET_ART[preset].draw` reads). */
export function artOpts(part: PartDef, state: string, touchable?: boolean): PartArtOptions {
  return { state, states: stateAt(part, state).states, touchable };
}

/** A value tweened from its `from`-state to its `to`-state value (overshoot included). */
export function tweened(a: number, b: number, ms: number, reduced: boolean): number {
  return a === b ? b : lerp(a, b, partProgress(ms, reduced));
}

/** The snap squash, only when the part actually changed state this tick. */
export function squashFor(props: Pick<PartViewProps, 'from' | 'to' | 'ms' | 'reduced'>): number {
  return props.from === props.to ? 1 : snapSquash(props.ms, props.reduced);
}

/** The hit area's box and centre (rect or circle). */
export function hitBox(part: PartDef): { x: number; y: number; w: number; h: number; cx: number; cy: number } {
  const h = part.hit;
  if ('r' in h) return { x: h.cx - h.r, y: h.cy - h.r, w: h.r * 2, h: h.r * 2, cx: h.cx, cy: h.cy };
  return { x: h.x, y: h.y, w: h.w, h: h.h, cx: h.x + h.w / 2, cy: h.y + h.h / 2 };
}

/** Rounds for transform strings (stable, short). */
export const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Fits an art box into the part's hit area (centred, scaled down or up to at most `max`). */
export function fitToHit(part: PartDef, box: { x: number; y: number; w: number; h: number }, max = 1.6): { tx: number; ty: number; s: number } {
  const hb = hitBox(part);
  const s = Math.min(max, hb.w / box.w, hb.h / box.h);
  return { tx: hb.cx - (box.x + box.w / 2) * s, ty: hb.cy - (box.y + box.h / 2) * s, s };
}

/**
 * A baked part bitmap (#96, `npm run bake:popup`) as an SVG string: the image over its local box,
 * shifted so `origin` (a pivot, a hinge point) sits at the local (0, 0). Its cut-edge rim and
 * stacked shadow are in the bitmap: no filter at runtime (GDD § 3.9).
 */
export function bakedImage(img: { url: string; box: { x: number; y: number; w: number; h: number } }, origin: readonly [number, number] = [0, 0]): string {
  const { x, y, w, h } = img.box;
  return `<image data-baked="part" href="${img.url}" x="${r2(x - origin[0])}" y="${r2(y - origin[1])}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
}
