import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { depth, flap, ref } from '../../art';
import { ArtG, hitBox, r2, tweened, type PartViewProps } from './common';

/**
 * 翻 flap (GDD § 2.1; bible § 4): a printed card hinged on its top edge, its marigold dog-ear the
 * grip. Opening folds it up over the hinge (`scaleY` 1 → −0.35); past the fold the kraft back
 * shows, as on a real lifted flap.
 */

/** The fold for each state: closed lies flat, open is folded up past the hinge. */
const FOLD = { closed: 1, open: -0.35 } as const;

export function FlapView(props: PartViewProps) {
  const { part, ctx, from, to, ms, reduced } = props;
  const hb = hitBox(part);
  const w = Math.max(40, hb.w - 22);
  const h = Math.max(32, hb.h - 22);
  const front = useMemo(() => flap(ctx, 0, 0, w, h), [ctx, w, h]);
  const back = useMemo(() => depth(ctx, 3, `<rect width="${w}" height="${h}" rx="2" fill="${ref(ctx, 'kraft')}"/><path d="M3 3H${w - 3}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`, `<rect width="${w}" height="${h}" rx="2"/>`), [ctx, w, h]);
  const fold = (s: string) => (s === 'open' ? FOLD.open : FOLD.closed);
  const sy = tweened(fold(from), fold(to), ms, reduced);
  return (
    <g data-part={part.id} data-preset={part.preset} transform={`translate(${r2(hb.x + 4)} ${r2(hb.y + 4)})`}>
      <g data-anim="" transform={`scale(1 ${r2(Math.abs(sy) < 0.02 ? 0.02 : sy)})`}>
        <ArtG html={sy >= 0 ? front : back} />
      </g>
    </g>
  );
}
