import { useMemo } from 'react';
import type { KitCtx } from '../../art';
import type { PageDef, SimState } from '../../core/types';
import { thoughtBubble, type BubbleShow } from '../art/placeholders';
import { ArtG, r2 } from '../parts/common';

/**
 * Baokaka's thought bubble on its spring (GDD § 2.2.6; bible § 5), riding with him: what he wants
 * (the target's icon), 「要！」 while he reaches, 「？」 while looking, tears while crying, a note
 * while watching, a heart while cuddling or done. #98 adds the change-of-mind pop and inflate,
 * barks and subtitles; this is the static slot.
 */

/** What the bubble shows for his state, or null for no bubble. */
export function bubbleShow(def: PageDef, state: SimState): BubbleShow | null {
  const { mode, target } = state.baby;
  const kind = target === null ? null : target === 'mocha' ? 'mocha' : def.attractors.find((a) => a.id === target)?.kind ?? null;
  switch (mode) {
    case 'moving':
      return kind === null ? null : { kind: 'want', target: kind, reach: false };
    case 'reaching':
      return kind === null ? { kind: 'text', text: '要！' } : { kind: 'want', target: kind, reach: true };
    case 'looking':
      return { kind: 'text', text: '？' };
    case 'crying':
      return { kind: 'cry' };
    case 'watching':
      return { kind: 'note' };
    case 'cuddling':
    case 'eating':
    case 'grabbing':
    case 'done':
      return { kind: 'heart' };
    default:
      return null;
  }
}

/** The bubble flips to his left near the page's right side so it stays on the page. */
export const bubbleSide = (x: number): 1 | -1 => (x > 280 ? -1 : 1);

export function Bubble({ ctx, show, x, y }: { ctx: KitCtx; show: BubbleShow; x: number; y: number }) {
  const side = bubbleSide(x);
  // Keyed on what it shows, not the object's identity (a new object every frame)
  const key = JSON.stringify(show);
  const html = useMemo(() => thoughtBubble(ctx, JSON.parse(key) as BubbleShow, side), [ctx, key, side]);
  return (
    <g data-bubble={show.kind} data-anim="" transform={`translate(${r2(x)} ${r2(y)})`}>
      <ArtG html={html} />
    </g>
  );
}
