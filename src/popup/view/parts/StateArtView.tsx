import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { PRESET_ART, VERBS, brad, circleOutline, depth, doubleOutline, f1, lockVeil, rectOutline, ref, seal, sealR, wheelRim } from '../../art';
import { wiggleClass } from '../affordance/look';
import { partArt, partBitmap } from '../art/registry';
import { lerp, partProgress } from '../interp';
import { ArtG, artOpts, bakedImage, fitToHit, hitBox, r2, squashFor, stateAt, type PartViewProps } from './common';
import { turnDelta } from './WheelView';

/**
 * Parts whose look changes per state but which do not travel (bible § 9.1: a part bitmap per
 * state): the art for the new state swaps in as the tick lands and the part takes the 60 ms snap
 * squash. Drawn from the art registry: the key's baked bitmap for the state (#96), else the
 * preset's kit art fitted into the part's hit area.
 *
 * Touch states (bible § 4, § 4.1, `look`): a prop shakes when tapped (it stays unmarked otherwise),
 * a locked crank wears the 35 % veil, and a marigold crank carries the reduced-motion outline.
 */
export function StateArtView(props: PartViewProps) {
  const { part, ctx, to, look = {} } = props;
  const art = partArt(part.art, part.preset);
  const touchable = part.input !== undefined && part.input !== 'none';
  // A baked bitmap per state (#96) is drawn at scale 1 with its origin on the hit centre (how its
  // source is authored); the live kit art is fitted into the hit area
  const baked = partBitmap(part.art, to);
  const hb = hitBox(part);
  const fit = baked ? { tx: hb.cx, ty: hb.cy, s: 1 } : fitToHit(part, PRESET_ART[part.preset].box);
  const html = useMemo(() => (baked ? bakedImage(baked) : art.draw(ctx, artOpts(part, to, touchable))), [baked?.url, art, ctx, part, to, touchable]);
  const sq = squashFor(props);
  const box = baked?.box ?? PRESET_ART[part.preset].box;
  const [px, py] = [box.x + box.w / 2, box.y + box.h / 2];
  const extras = useMemo(() => {
    const shape = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="6"/>`;
    return { veil: lockVeil(shape), outline: doubleOutline(rectOutline(box, 6)) };
  }, [box]);
  return (
    <g data-part={part.id} data-preset={part.preset} transform={`translate(${r2(fit.tx)} ${r2(fit.ty)}) scale(${r2(fit.s)})`}>
      <g data-anim="" transform={sq === 1 ? undefined : `translate(${r2(px)} ${r2(py)}) scale(${r2(sq)}) translate(${r2(-px)} ${r2(-py)})`}>
        <g className={wiggleClass('prop', look.wiggle)}>
          <ArtG html={html} />
          {look.locked && <ArtG html={extras.veil} />}
        </g>
      </g>
      {look.outline && <ArtG html={extras.outline} />}
    </g>
  );
}

/** 閘 gate and the weight `button`: event-driven, printed card, art per state. */
export const GateView = StateArtView;
/** Lamps, neon, a music box (`light`), and steam or boats that 咻—— pushes along (`blowable`). */
export const LightView = StateArtView;
/**
 * A conveyor or carousel (`loop`): its slots advance a place per state; a crank is marigold when
 * touchable. With a baked bitmap (#124: 6-2's carousel, 6-6's X-ray belt) the bitmap is the belt
 * itself — printed, never marigold — and a touchable loop's crank is drawn live over it at the part's
 * `center`: a marigold 轉 wheel with its seal, grip rim and turn cue (bible § 4), turning a step per
 * state. What rides the slots is drawn by the page (`riderArt`).
 */
export function LoopView(props: PartViewProps) {
  const { part, ctx, from, to, ms, reduced, look = {} } = props;
  const baked = partBitmap(part.art, to);
  const touchable = part.input !== undefined && part.input !== 'none';
  const hb = hitBox(part);
  const [cx, cy] = part.center ?? [hb.cx, hb.cy];
  const r = Math.min(26, (part.radius ?? 30) * 0.8);
  // The crank: the disc turns (rim, rings, a pointer); the arrow, the brad and the upright seal stay put
  const crank = useMemo(() => {
    const rim = wheelRim(r, 14);
    const disc = depth(ctx, 3, `<path data-grip="rim" d="${rim}" fill="${ref(ctx, 'tabR')}"/><circle r="${f1(r * 0.76)}" fill="none" stroke="${C.marigoldEdge}" stroke-width="1" opacity=".5"/>`
      + `<circle r="${f1(r * 0.72)}" fill="none" stroke="${C.marigoldShine}" stroke-width="1" opacity=".6"/><path d="M0 ${f1(-r * 0.66)}l5 8h-10z" fill="${C.marigoldEdge}" opacity=".7"/>`, `<path d="${rim}"/>`);
    const arrow = `<g data-cue="turn" stroke="${C.marigoldLight}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".95">`
      + `<path d="M${f1(-r * 0.55)} ${f1(-r * 1.32)}A${f1(r * 1.42)} ${f1(r * 1.42)} 0 0 1 ${f1(r * 0.9)} ${f1(-r * 1.1)}"/>`
      + `<path d="M${f1(r * 0.62)} ${f1(-r * 1.32)}l${f1(r * 0.3)} ${f1(r * 0.2)}l${f1(-r * 0.05)} ${f1(r * 0.34)}"/></g>`;
    return { disc, arrow, top: brad(ctx, 0, 0, Math.max(3.5, r * 0.16)) + seal(ctx, r * 0.82, r * 0.82, VERBS.wheel, sealR(11, look.elder)) };
  }, [ctx, r, look.elder]);
  const extras = useMemo(() => ({ veil: lockVeil(`<circle r="${r * 1.12}"/>`), outline: doubleOutline(circleOutline(0, 0, r * 1.12)) }), [r]);
  if (!baked) return <StateArtView {...props} />;
  const a = stateAt(part, from);
  const b = stateAt(part, to);
  const rot = (a.index * 360) / Math.max(1, a.count) + lerp(0, turnDelta(a.index, b.index, b.count), from === to ? 1 : partProgress(ms, reduced));
  return (
    <g data-part={part.id} data-preset={part.preset}>
      <g transform={`translate(${r2(hb.cx)} ${r2(hb.cy)})`}>
        <ArtG html={bakedImage(baked)} />
      </g>
      {touchable && (
        <g transform={`translate(${r2(cx)} ${r2(cy)})`}>
          <ArtG html={crank.arrow} />
          <g className={wiggleClass('wheel', look.wiggle)}>
            <g data-anim="" transform={`rotate(${r2(rot)})`}>
              <ArtG html={crank.disc} />
            </g>
            {look.locked && <ArtG html={extras.veil} />}
          </g>
          {look.outline && <ArtG html={extras.outline} />}
          <ArtG html={crank.top} />
        </g>
      )}
    </g>
  );
}
/** A tap toy (`prop`: the split-flap board, a mobile): a discovery, never marigold. */
export const PropView = StateArtView;
