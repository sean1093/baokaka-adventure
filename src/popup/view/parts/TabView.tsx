import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { LIFT, VERBS, brad, depth, doubleOutline, liftShadow, lockVeil, pullTab, rectOutline, ref, seal, sealR } from '../../art';
import { wiggleClass } from '../affordance/look';
import { partBitmap } from '../art/registry';
import { ArtG, bakedImage, hitBox, r2, squashFor, stateAt, tweened, type PartViewProps } from './common';

/**
 * 拉 tab and 推 slider (GDD § 2.1; bible § 4): a marigold card riding a straight track, one stop
 * per state. The track (a slot cut in the paper, a dotted line to an end arrow) is printed and
 * still; the card slides along it by `translate` and rotates to the track's angle, while its verb
 * seal stays upright beside it so 拉 always reads. A tab whose part carries nodes (the train) wears
 * the linked brad with the dashed marigold ring. When its art key has a baked bitmap per state (the
 * thing it moves: 3-2's bikes, 3-5's shelves, #116), that is drawn under the track, its origin on
 * the hit centre as its source is authored, and swaps as the state lands.
 *
 * Touchable states (bible § 4.1, `look`): the card wiggles ±2° about its centre, lifts 5 units at
 * 1.04 over its dropped shadow while dragged, wears a 35 % veil while locked, and carries the
 * reduced-motion double outline; the seal grows to 28 px in 長輩模式.
 */

/** The card's size along and across the track. */
export const TAB = { len: 96, thick: 40 } as const;
/** A slider knob's width (it is 30 across the slot). */
export const KNOB = 32;

/** Where the card's centre is for a state: stop i evenly spaced from `track.from` to `track.to`. */
function stopPoint(part: PartViewProps['part'], state: string): [number, number] {
  const { index } = stateAt(part, state);
  return indexPoint(part, index);
}

/** The card's centre at a fractional stop index (a drag preview; past the ends while rubber-banding). */
function indexPoint(part: PartViewProps['part'], index: number): [number, number] {
  const track = part.track;
  if (track === undefined) {
    const hb = hitBox(part);
    return [hb.cx, hb.cy];
  }
  const { count } = stateAt(part, part.initial ?? '');
  const t = count > 1 ? index / (count - 1) : 0;
  return [track.from[0] + (track.to[0] - track.from[0]) * t, track.from[1] + (track.to[1] - track.from[1]) * t];
}

export function TabView(props: PartViewProps) {
  const { part, ctx, from, to, ms, reduced, linked, preview, look = {} } = props;
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
    return `<g data-cue="track"><path d="M${r2(sx)} ${r2(sy)}L${r2(ex)} ${r2(ey)}" stroke="${C.shadow}" stroke-width="${slider ? 10 : 5}" stroke-linecap="round" opacity=".55"/>`
      + `<path d="M${r2(sx)} ${r2(sy)}L${r2(ex - ux * 4)} ${r2(ey - uy * 4)}" stroke="${C.marigoldLight}" stroke-width="2.2" stroke-dasharray="1 7" stroke-linecap="round" opacity=".85"/>`
      + `<path d="M${r2(h1x)} ${r2(h1y)}L${r2(ex)} ${r2(ey)}L${r2(h2x)} ${r2(h2y)}" stroke="${C.marigoldLight}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/></g>`;
  }, [ax, ay, bx, by, ux, uy, slider]);

  // The card (tab) or knob (slider), drawn once, centred on its origin and pointing +x
  const card = useMemo(() => {
    if (slider) {
      const knob = `<rect x="${-KNOB / 2}" y="-15" width="${KNOB}" height="30" rx="10"/>`;
      return depth(ctx, 3, `<rect x="${-KNOB / 2}" y="-15" width="${KNOB}" height="30" rx="10" fill="${ref(ctx, 'tabG')}"/><rect data-grip="knob" x="-9" y="-9" width="18" height="18" rx="3" fill="${ref(ctx, 'ridges')}"/>`, knob)
        + (linked ? brad(ctx, 0, 12, 3.2, true) : '');
    }
    return `<g transform="translate(${-TAB.len / 2} ${-TAB.thick / 2})">${pullTab(ctx, 0, 0, { w: TAB.len, h: TAB.thick, track: 0, sealed: false })}`
      + (linked ? brad(ctx, TAB.len * 0.56, TAB.thick - 8, 3.4, true) : '')
      + `</g>`;
  }, [ctx, slider, linked]);
  const sealSvg = useMemo(() => seal(ctx, 0, 0, slider ? VERBS.slider : VERBS.tab, sealR(slider ? 11 : 14, look.elder)), [ctx, slider, look.elder]);
  // The card's own outline, centred on its origin (the veil, the reduced-motion outline, the lifted shadow)
  const box = slider ? { x: -KNOB / 2, y: -15, w: KNOB, h: 30 } : { x: -TAB.len / 2, y: -TAB.thick / 2, w: TAB.len, h: TAB.thick };
  const round = slider ? 10 : TAB.thick * 0.34;
  const states = useMemo(() => {
    const shape = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${r2(round)}"/>`;
    return { veil: lockVeil(shape), outline: doubleOutline(rectOutline(box, round)), shadow: liftShadow(ctx, box, round) };
  }, [ctx, box.x, box.y, box.w, box.h, round]);

  const [fx, fy] = stopPoint(part, from);
  const [tx, ty] = stopPoint(part, to);
  const held = preview === undefined ? null : indexPoint(part, preview);
  const x = held ? held[0] : tweened(fx, tx, ms, reduced);
  const y = held ? held[1] : tweened(fy, ty, ms, reduced);
  const sq = held ? 1 : squashFor(props);
  // The seal sits on the card's trailing end (tab) or above-left of the knob (slider), upright
  const [ox, oy] = slider ? [-24, -22] : [(22 - TAB.len / 2) * ux, (22 - TAB.len / 2) * uy];
  const lift = look.lifted ? LIFT.rise : 0;
  const k = look.lifted ? LIFT.scale : 1;
  const baked = partBitmap(part.art, to);
  const hb = hitBox(part);
  return (
    <g data-part={part.id} data-preset={part.preset}>
      {baked && (
        <g transform={`translate(${r2(hb.cx)} ${r2(hb.cy)})`}>
          <ArtG html={bakedImage(baked)} />
        </g>
      )}
      <ArtG html={track} />
      {look.lifted && (
        <g data-anim="" transform={`translate(${r2(x + LIFT.shadow[0])} ${r2(y + LIFT.shadow[1])}) rotate(${r2(deg)})`}>
          <ArtG html={states.shadow} />
        </g>
      )}
      <g data-anim="" transform={`translate(${r2(x)} ${r2(y - lift)}) rotate(${r2(deg)}) scale(${r2(sq * k)})`}>
        <g className={wiggleClass('tab', look.wiggle)}>
          <ArtG html={card} />
          {look.locked && <ArtG html={states.veil} />}
        </g>
        {look.outline && <ArtG html={states.outline} />}
      </g>
      <g data-anim="" transform={`translate(${r2(x + ox)} ${r2(y + oy - lift)})`} dangerouslySetInnerHTML={{ __html: sealSvg }} />
    </g>
  );
}
