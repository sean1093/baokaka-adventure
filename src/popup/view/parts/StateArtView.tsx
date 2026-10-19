import { useMemo } from 'react';
import { PRESET_ART, doubleOutline, lockVeil, rectOutline } from '../../art';
import { wiggleClass } from '../affordance/look';
import { partArt, partBitmap } from '../art/registry';
import { ArtG, artOpts, bakedImage, fitToHit, hitBox, r2, squashFor, type PartViewProps } from './common';

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
/** A conveyor or carousel (`loop`): its slots advance a place per state; a crank is marigold when touchable. */
export const LoopView = StateArtView;
/** A tap toy (`prop`: the split-flap board, a mobile): a discovery, never marigold. */
export const PropView = StateArtView;
