import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { VERBS, brad, depth, pullTab, ref, seal } from '../../art';
import { ArtG, hitBox, r2, squashFor, stateAt, tweened, type PartViewProps } from './common';

/**
 * 拉 tab and 推 slider (GDD § 2.1; bible § 4): a marigold card riding a straight track, one stop
 * per state. The track (a slot cut in the paper, a dotted line to an end arrow) is printed and
 * still; the card slides along it by `translate` and rotates to the track's angle, while its verb
 * seal stays upright beside it so 拉 always reads. A tab whose part carries nodes (the train) wears
 * the linked brad with the dashed marigold ring.
 */

/** The card's size along and across the track. */
const TAB = { len: 96, thick: 40 };
const KNOB = 32;

/** Where the card's centre is for a state: stop i evenly spaced from `track.from` to `track.to`. */
function stopPoint(part: PartViewProps['part'], state: string): [number, number] {
  const track = part.track;
  if (track === undefined) {
    const hb = hitBox(part);
    return [hb.cx, hb.cy];
  }
  const { t } = stateAt(part, state);
  return [track.from[0] + (track.to[0] - track.from[0]) * t, track.from[1] + (track.to[1] - track.from[1]) * t];
}

export function TabView(props: PartViewProps) {
  const { part, ctx, from, to, ms, reduced, linked } = props;
  const slider = part.preset === 'slider';
  const [ax, ay] = part.track?.from ?? stopPoint(part, from);
  const [bx, by] = part.track?.to ?? [ax + 1, ay];
  const angle = Math.atan2(by - ay, bx - ax);
  const deg = (angle * 180) / Math.PI;
  const [ux, uy] = [Math.cos(angle), Math.sin(angle)];

  // The printed track: a slot, a dotted line past the last stop, an arrow at its end
  const track = useMemo(() => {
    const reach = slider ? KNOB / 2 + 10 : TAB.len / 2 + 14;
    const [ex, ey] = [bx + ux * reach, by + uy * reach];
    const [sx, sy] = [ax - ux * (slider ? KNOB / 2 : TAB.len / 2 - 6), ay - uy * (slider ? KNOB / 2 : TAB.len / 2 - 6)];
    const head = (k: number) => [ex - ux * 9 + -uy * k * 6, ey - uy * 9 + ux * k * 6];
    const [h1x, h1y] = head(1);
    const [h2x, h2y] = head(-1);
    return `<path d="M${r2(sx)} ${r2(sy)}L${r2(ex)} ${r2(ey)}" stroke="${C.shadow}" stroke-width="${slider ? 10 : 5}" stroke-linecap="round" opacity=".55"/>`
      + `<path d="M${r2(sx)} ${r2(sy)}L${r2(ex - ux * 4)} ${r2(ey - uy * 4)}" stroke="${C.marigoldLight}" stroke-width="2.2" stroke-dasharray="1 7" stroke-linecap="round" opacity=".85"/>`
      + `<path d="M${r2(h1x)} ${r2(h1y)}L${r2(ex)} ${r2(ey)}L${r2(h2x)} ${r2(h2y)}" stroke="${C.marigoldLight}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
  }, [ax, ay, bx, by, ux, uy, slider]);

  // The card (tab) or knob (slider), drawn once, centred on its origin and pointing +x
  const card = useMemo(() => {
    if (slider) {
      const knob = `<rect x="${-KNOB / 2}" y="-15" width="${KNOB}" height="30" rx="10"/>`;
      return depth(ctx, 3, `<rect x="${-KNOB / 2}" y="-15" width="${KNOB}" height="30" rx="10" fill="${ref(ctx, 'tabG')}"/><rect x="-9" y="-9" width="18" height="18" rx="3" fill="${ref(ctx, 'ridges')}"/>`, knob)
        + (linked ? brad(ctx, 0, 12, 3.2, true) : '');
    }
    return `<g transform="translate(${-TAB.len / 2} ${-TAB.thick / 2})">${pullTab(ctx, 0, 0, { w: TAB.len, h: TAB.thick, track: 0, sealed: false })}`
      + (linked ? brad(ctx, TAB.len * 0.56, TAB.thick - 8, 3.4, true) : '')
      + `</g>`;
  }, [ctx, slider, linked]);
  const sealSvg = useMemo(() => seal(ctx, 0, 0, slider ? VERBS.slider : VERBS.tab, slider ? 11 : 14), [ctx, slider]);

  const [fx, fy] = stopPoint(part, from);
  const [tx, ty] = stopPoint(part, to);
  const x = tweened(fx, tx, ms, reduced);
  const y = tweened(fy, ty, ms, reduced);
  const sq = squashFor(props);
  // The seal sits on the card's trailing end (tab) or above-left of the knob (slider), upright
  const [ox, oy] = slider ? [-24, -22] : [(22 - TAB.len / 2) * ux, (22 - TAB.len / 2) * uy];
  return (
    <g data-part={part.id} data-preset={part.preset}>
      <ArtG html={track} />
      <g data-anim="" transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(deg)}) scale(${r2(sq)})`}>
        <ArtG html={card} />
      </g>
      <g data-anim="" transform={`translate(${r2(x + ox)} ${r2(y + oy)})`}>
        <ArtG html={sealSvg} />
      </g>
    </g>
  );
}
