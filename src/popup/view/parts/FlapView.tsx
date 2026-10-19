import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { LIFT, VERBS, depth, doubleOutline, f1, flap, liftShadow, lockVeil, rectOutline, ref, seal, sealR } from '../../art';
import { wiggleClass } from '../affordance/look';
import { ArtG, hitBox, r2, stateAt, tweened, type PartViewProps } from './common';

/**
 * 翻 flap (GDD § 2.1; bible § 4): a printed card hinged on its top edge, its marigold dog-ear the
 * grip. Opening folds it up over the hinge (`scaleY` 1 → −0.35); past the fold the kraft back
 * shows, as on a real lifted flap, with the marigold ear still at its free edge. The 翻 seal stays
 * upright at the hinge end, outside the fold's scale, so it reads in every state.
 *
 * Touchable states (bible § 4.1, `look`): the card lifts its free corner 3 units about the hinge
 * (the wiggle), rises over its dropped shadow while dragged, wears a 35 % veil while locked, and
 * the reduced-motion double outline follows its folded extent.
 */

/** The fold for each state: closed lies flat, open is folded up past the hinge. */
const FOLD = { closed: 1, open: -0.35 } as const;

export function FlapView(props: PartViewProps) {
  const { part, ctx, from, to, ms, reduced, preview, look = {} } = props;
  const hb = hitBox(part);
  const w = Math.max(40, hb.w - 22);
  const h = Math.max(32, hb.h - 22);
  const art = useMemo(() => {
    const c = 22;
    const ear = `M${w} ${h - c}L${w - c} ${h}L${f1(w - c * 0.35)} ${f1(h + c * 0.42)}Z`;
    const card = `M0 0H${w}V${h - c}L${w - c} ${h}H0Z`;
    const back = depth(ctx, 3, `<path d="${card}" fill="${ref(ctx, 'kraft')}"/><path d="M3 3H${w - 3}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`, `<path d="${card}"/>`)
      + depth(ctx, 4, `<path data-grip="ear" d="${ear}" fill="${ref(ctx, 'tabG')}"/>`, `<path d="${ear}"/>`)
      + `<path data-cue="curl" d="M${f1(w - c * 0.2)} ${f1(h + c * 0.62)}q8 6 14 2" stroke="${C.marigoldLight}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return { front: flap(ctx, 0, 0, w, h, { sealed: false }), back, veil: lockVeil(`<path d="${card}"/>`), shadow: liftShadow(ctx, { x: 0, y: 0, w, h }, 2) };
  }, [ctx, w, h]);
  const sealSvg = useMemo(() => seal(ctx, 0, 0, VERBS.flap, sealR(11, look.elder)), [ctx, look.elder]);
  const fold = (s: string) => (s === 'open' ? FOLD.open : FOLD.closed);
  // A corner drag (#90) lifts it part way: 0 = its first state's fold, 1 = its second's
  const { states } = stateAt(part, to);
  const sy = preview !== undefined
    ? fold(states[0]) + (fold(states[1] ?? states[0]) - fold(states[0])) * Math.min(1, Math.max(0, preview))
    : tweened(fold(from), fold(to), ms, reduced);
  const shown = Math.abs(sy) < 0.02 ? 0.02 : sy;
  const lift = look.lifted ? LIFT.rise : 0;
  const k = look.lifted ? LIFT.scale : 1;
  // The folded extent (for the reduced-motion outline): below the hinge when closed, above when open
  const extent = shown >= 0 ? { x: 0, y: 0, w, h: h * shown } : { x: 0, y: h * shown, w, h: -h * shown };
  const outline = useMemo(() => (look.outline ? doubleOutline(rectOutline(extent, 3)) : ''), [look.outline, extent.y, extent.h, w]);
  return (
    <g data-part={part.id} data-preset={part.preset} transform={`translate(${r2(hb.x + 4)} ${r2(hb.y + 4)})`}>
      {look.lifted && (
        <g transform={`translate(${LIFT.shadow[0]} ${LIFT.shadow[1]}) scale(1 ${r2(Math.max(0.2, Math.abs(shown)))})`}>
          <ArtG html={art.shadow} />
        </g>
      )}
      <g data-anim="" transform={`translate(0 ${-lift}) scale(${k} ${r2(shown * k)})`}>
        <g className={wiggleClass('flap', look.wiggle)}>
          <ArtG html={shown >= 0 ? art.front : art.back} />
          {look.locked && <ArtG html={art.veil} />}
        </g>
      </g>
      {outline && <ArtG html={outline} />}
      <g data-anim="" transform={`translate(16 ${r2(16 * shown - lift)})`}>
        <ArtG html={sealSvg} />
      </g>
    </g>
  );
}
