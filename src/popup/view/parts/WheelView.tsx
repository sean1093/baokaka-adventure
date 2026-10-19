import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { VERBS, brad, depth, f1, ref, seal, wheelRim } from '../../art';
import { ArtG, hitBox, r2, squashFor, stateAt, type PartViewProps } from './common';
import { lerp, partProgress } from '../interp';

/**
 * 轉 wheel and the event-driven `section` (GDD § 2.1; bible § 4): a disc on a brass split pin,
 * one orientation per state (listed clockwise). Only the disc turns (`rotate`); the printed curved
 * arrow, the seal and the brad stay put. A wheel is marigold with a scalloped grip rim; a section
 * is printed grey-lilac card (not touchable).
 */

/** The disc's angle for a state. */
const angleOf = (index: number, count: number) => (count > 1 ? (index * 360) / count : 0);

/** The turn from one orientation to the next, the short way round (a step past the last wraps forward). */
export function turnDelta(fromIndex: number, toIndex: number, count: number): number {
  if (count <= 1 || fromIndex === toIndex) return 0;
  const step = 360 / count;
  const fwd = (toIndex - fromIndex + count) % count;
  return fwd <= count / 2 ? fwd * step : (fwd - count) * step;
}

export function WheelView(props: PartViewProps) {
  const { part, ctx, from, to, ms, reduced, preview } = props;
  const touchable = part.preset === 'wheel';
  const hb = hitBox(part);
  const [cx, cy] = part.center ?? [hb.cx, hb.cy];
  const r = part.radius ?? Math.max(20, Math.min(hb.w, hb.h) / 2 - 8);

  const disc = useMemo(() => {
    const rim = wheelRim(r, touchable ? 18 : 12);
    if (touchable) {
      return depth(ctx, 3, `<path d="${rim}" fill="${ref(ctx, 'tabR')}"/><circle r="${f1(r * 0.78)}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1" opacity=".5"/>`
        + `<circle r="${f1(r * 0.74)}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/><path d="M0 ${f1(-r * 0.7)}l6 10h-12z" fill="${C.marigoldEdge}" opacity=".7"/>`, `<path d="${rim}"/>`);
    }
    const spokes = [0, 45, 90, 135].map((a) => `<path d="M${f1(-r * 0.62)} 0H${f1(r * 0.62)}" transform="rotate(${a})"/>`).join('');
    return depth(ctx, 3, `<path d="${rim}" fill="${C.printLilac}"/><circle r="${f1(r * 0.72)}" fill="none" stroke="${C.printLilacDeep}" stroke-width="1.4"/>`
      + `<g stroke="${C.printLilacDeep}" stroke-width="1.2" opacity=".7">${spokes}</g><path d="M0 ${f1(-r * 0.95)}l5 9h-10z" fill="${C.cover}"/>`, `<path d="${rim}"/>`);
  }, [ctx, r, touchable]);

  const fixed = useMemo(() => {
    const arrow = touchable
      ? `<g stroke="${C.marigoldLight}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".95">`
        + `<path d="M${f1(-r * 0.55)} ${f1(-r * 1.32)}A${f1(r * 1.42)} ${f1(r * 1.42)} 0 0 1 ${f1(r * 0.9)} ${f1(-r * 1.1)}"/>`
        + `<path d="M${f1(r * 0.62)} ${f1(-r * 1.32)}l${f1(r * 0.3)} ${f1(r * 0.2)}l${f1(-r * 0.05)} ${f1(r * 0.34)}"/></g>`
      : '';
    return { arrow, top: brad(ctx, 0, 0, Math.max(3.5, r * 0.16)) + (touchable ? seal(ctx, r * 0.82, r * 0.82, VERBS.wheel, 11) : '') };
  }, [ctx, r, touchable]);

  const a = stateAt(part, from);
  const b = stateAt(part, to);
  const start = angleOf(a.index, a.count);
  const rot = preview !== undefined ? angleOf(1, b.count) * preview : start + lerp(0, turnDelta(a.index, b.index, b.count), from === to ? 1 : partProgress(ms, reduced));
  const sq = preview !== undefined ? 1 : squashFor(props);
  return (
    <g data-part={part.id} data-preset={part.preset} transform={`translate(${r2(cx)} ${r2(cy)})`}>
      <ArtG html={fixed.arrow} />
      <g data-anim="" transform={`rotate(${r2(rot)}) scale(${r2(sq)})`}>
        <ArtG html={disc} />
      </g>
      <ArtG html={fixed.top} />
    </g>
  );
}
