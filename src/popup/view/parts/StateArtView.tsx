import { useMemo } from 'react';
import { PRESET_ART } from '../../art';
import { partArt } from '../art/registry';
import { ArtG, artOpts, fitToHit, r2, squashFor, type PartViewProps } from './common';

/**
 * Parts whose look changes per state but which do not travel (bible § 9.1: a part bitmap per
 * state): the art for the new state swaps in as the tick lands and the part takes the 60 ms snap
 * squash. Drawn from the art registry (the preset's kit art until the key has its own), fitted
 * into the part's hit area.
 */
export function StateArtView(props: PartViewProps) {
  const { part, ctx, to } = props;
  const art = partArt(part.art, part.preset);
  const fit = fitToHit(part, PRESET_ART[part.preset].box);
  const touchable = part.input !== undefined && part.input !== 'none';
  const html = useMemo(() => art.draw(ctx, artOpts(part, to, touchable)), [art, ctx, part, to, touchable]);
  const sq = squashFor(props);
  const box = PRESET_ART[part.preset].box;
  const [px, py] = [box.x + box.w / 2, box.y + box.h / 2];
  return (
    <g data-part={part.id} data-preset={part.preset} transform={`translate(${r2(fit.tx)} ${r2(fit.ty)}) scale(${r2(fit.s)})`}>
      <g data-anim="" transform={sq === 1 ? undefined : `translate(${r2(px)} ${r2(py)}) scale(${r2(sq)}) translate(${r2(-px)} ${r2(-py)})`}>
        <ArtG html={html} />
      </g>
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
