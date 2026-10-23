import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { LIFT, VERBS, brad, circleOutline, depth, doubleOutline, f1, liftShadow, lockVeil, ref, seal, sealR, wheelRim } from '../../art';
import { wiggleClass } from '../affordance/look';
import { partBitmap } from '../art/registry';
import { ArtG, bakedImage, hitBox, r2, squashFor, stateAt, type PartViewProps } from './common';
import { lerp, partProgress } from '../interp';
import { dialPointer, dialSealAt, levelDial } from './cues';

/**
 * 轉 wheel and the event-driven `section` (GDD § 2.1; bible § 4): a disc on a brass split pin,
 * one orientation per state (listed clockwise). Only the disc turns (`rotate`); the printed curved
 * arrow, the seal and the brad stay put. A wheel is marigold with a scalloped grip rim; a section
 * is printed grey-lilac card (not touchable).
 *
 * Touchable states (bible § 4.1, `look`): the disc wiggles ±4°, lifts over its dropped shadow while
 * dragged, wears a 35 % veil while locked, and the reduced-motion double outline rings its rim.
 *
 * A level wheel (`levels`, #221) prints a dial round its rim instead of the curved arrow: a level
 * gauge at each stop with clockwise arrows between them, the stop it is at (or is being dragged to)
 * ringed, and a pointer on the disc.
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
  const { part, ctx, from, to, ms, reduced, preview, look = {}, levels } = props;
  const touchable = part.preset === 'wheel';
  const hb = hitBox(part);
  const [cx, cy] = part.center ?? [hb.cx, hb.cy];
  const r = part.radius ?? Math.max(20, Math.min(hb.w, hb.h) / 2 - 8);

  const disc = useMemo(() => {
    const rim = wheelRim(r, touchable ? 18 : 12);
    if (touchable) {
      return depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/><circle r="${f1(r * 0.78)}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1" opacity=".5"/>`
        + `<circle r="${f1(r * 0.74)}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/><path d="M0 ${f1(-r * 0.7)}l6 10h-12z" fill="${C.marigoldEdge}" opacity=".7"/>`, `<path d="${rim}"/>`);
    }
    const spokes = [0, 45, 90, 135].map((a) => `<path d="M${f1(-r * 0.62)} 0H${f1(r * 0.62)}" transform="rotate(${a})"/>`).join('');
    return depth(ctx, 3, `<path d="${rim}" fill="${C.printLilac}"/><circle r="${f1(r * 0.72)}" fill="none" stroke="${C.printLilacDeep}" stroke-width="1.4"/>`
      + `<g stroke="${C.printLilacDeep}" stroke-width="1.2" opacity=".7">${spokes}</g><path d="M0 ${f1(-r * 0.95)}l5 9h-10z" fill="${C.cover}"/>`, `<path d="${rim}"/>`);
  }, [ctx, r, touchable]);

  const dial = touchable && levels !== undefined && levels.length > 1;
  const fixed = useMemo(() => {
    const arrow = touchable && !dial
      ? `<g data-cue="turn" stroke="${C.marigoldLight}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".95">`
        + `<path d="M${f1(-r * 0.55)} ${f1(-r * 1.32)}A${f1(r * 1.42)} ${f1(r * 1.42)} 0 0 1 ${f1(r * 0.9)} ${f1(-r * 1.1)}"/>`
        + `<path d="M${f1(r * 0.62)} ${f1(-r * 1.32)}l${f1(r * 0.3)} ${f1(r * 0.2)}l${f1(-r * 0.05)} ${f1(r * 0.34)}"/></g>`
      : '';
    // A level wheel's seal sits between two of its dial's stops, on the rim
    const [sx, sy] = dial ? dialSealAt(levels!.length, r) : [r * 0.82, r * 0.82];
    return { arrow, top: brad(ctx, 0, 0, Math.max(3.5, r * 0.16)) + (touchable ? seal(ctx, sx, sy, VERBS.wheel, sealR(11, look.elder)) : '') };
  }, [ctx, r, touchable, dial, levels?.length, look.elder]);
  // The rim's reach (its scallops bulge to 1.12 r): the veil, the reduced-motion rings, the lifted shadow
  const states = useMemo(() => {
    const rim = wheelRim(r, touchable ? 18 : 12);
    const reach = r * 1.12;
    return { veil: lockVeil(`<path d="${rim}"/>`), outline: doubleOutline(circleOutline(0, 0, reach)), shadow: liftShadow(ctx, { x: -r, y: -r, w: 2 * r, h: 2 * r }, r) };
  }, [ctx, r, touchable]);

  // A baked disc (#96): the state's bitmap turned about its pivot; dragged, its lifted variant
  // carries the rise, the scale and the dropped shadow itself
  const baked = partBitmap(part.art, to, look.lifted);
  const discHtml = useMemo(() => (baked ? bakedImage(baked, baked.pivot) : disc), [baked?.url, baked?.pivot, disc]);
  const bakedLift = baked?.lifted === true;

  const a = stateAt(part, from);
  const b = stateAt(part, to);
  const start = angleOf(a.index, a.count);
  const rot = preview !== undefined ? angleOf(1, b.count) * preview : start + lerp(0, turnDelta(a.index, b.index, b.count), from === to ? 1 : partProgress(ms, reduced));
  const sq = preview !== undefined ? 1 : squashFor(props);
  const lift = look.lifted ? LIFT.rise : 0;
  // The dial rings the stop the disc is at, or the one a drag would land on
  const stop = preview !== undefined ? ((Math.round(preview) % b.count) + b.count) % b.count : b.index;
  const dialHtml = useMemo(() => (dial ? levelDial(levels!, r, stop) : ''), [dial, levels, r, stop]);
  const pointer = useMemo(() => (dial ? dialPointer(r) : ''), [dial, r]);
  const k = look.lifted && !bakedLift ? LIFT.scale : 1;
  return (
    <g data-part={part.id} data-preset={part.preset} transform={`translate(${r2(cx)} ${r2(cy)})`}>
      <ArtG html={fixed.arrow} />
      {dial && <ArtG html={dialHtml} />}
      {look.lifted && !bakedLift && (
        <g transform={`translate(${LIFT.shadow[0]} ${LIFT.shadow[1]})`}>
          <ArtG html={states.shadow} />
        </g>
      )}
      <g data-anim="" transform={`translate(0 ${bakedLift ? 0 : -lift}) rotate(${r2(rot)}) scale(${r2(sq * k)})`}>
        <g className={wiggleClass('wheel', look.wiggle)} data-grip={baked && touchable ? 'rim' : undefined} data-baked-marigold={baked && touchable ? '' : undefined}>
          <ArtG html={discHtml} />
          {dial && <ArtG html={pointer} />}
          {look.locked && <ArtG html={states.veil} />}
        </g>
      </g>
      {look.outline && <ArtG html={states.outline} />}
      <g transform={lift ? `translate(0 ${-lift})` : undefined}>
        <ArtG html={fixed.top} />
      </g>
    </g>
  );
}
