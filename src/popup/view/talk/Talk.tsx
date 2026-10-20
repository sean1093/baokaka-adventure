import { useMemo, type PointerEvent as ReactPointerEvent } from 'react';
import { POPUP as C } from '../../../art/palette';
import { ref, type KitCtx } from '../../art';
import type { Speaker } from '../../content/script';
import type { PageDef, SimState } from '../../core/types';
import { thoughtContent, type BubbleShow } from '../art/placeholders';
import type { Pt } from '../geometry';
import { ArtG, r2 } from '../parts/common';
import { barkCard, cloudCard, labelTab, paHorn, speechCard, springEnd, stripCard, talkSpring } from './art';
import { LABEL_H, LABEL_RISE, type PlacedBark, type PlacedStrip, type PlacedSub, type PlacedThought } from './layout';
import { TALK_BOUNDS, TALK_FONT, textEm, type Box } from './place';
import './talk.css';

/**
 * The bubbles drawn (#98; GDD § 2.2.6, § 2.13; popup art bible § 5, § 7, § 8), from `layoutTalk`'s
 * placements: the thought bubble on its spring with the change-of-mind pop, inflate and wobble,
 * the bark bubbles, the narration strip and the subtitle bubbles (a tap on any of them advances
 * the beat). Page units; `k` (`talkScale`) grows them so their text stays ≥ 20 screen px.
 */

/** What the thought bubble shows for his state, or null for none (GDD § 2.2.6). */
export function bubbleShow(def: PageDef, state: SimState): BubbleShow | null {
  const { mode, target } = state.baby;
  const attractor = target === null || target === 'mocha' ? undefined : def.attractors.find((a) => a.id === target);
  const kind = target === null ? null : target === 'mocha' ? 'mocha' : attractor?.kind ?? null;
  // A spread's goal is the chapter treasure (#107), a decoy itself (#116): the bubble shows it, not the bead
  const treasure = def.spread && attractor?.goal ? { treasure: def.chapter } : attractor?.decoy ? { decoy: attractor.art ?? '' } : {};
  switch (mode) {
    case 'moving':
      return kind === null ? null : { kind: 'want', target: kind, reach: false, ...treasure };
    case 'reaching':
      return kind === null ? { kind: 'text', text: '要！' } : { kind: 'want', target: kind, reach: true, ...treasure };
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

/** A stable key for what a bubble shows (its identity changes every frame). */
export const showKey = (show: BubbleShow | null): string => (show === null ? '' : JSON.stringify(show));

const SERIF = "'Noto Serif TC', serif";

/** A rider's offset, cut so `box` moved by it stays inside the page's talk bounds (it may stay where it was placed). */
export function rideWithin(box: Box, [dx, dy]: Pt, bounds: Box = TALK_BOUNDS): Pt {
  const clamp = (d: number, lo: number, size: number, blo: number, bsize: number) => {
    const min = Math.min(0, blo - lo);
    const max = Math.max(0, blo + bsize - (lo + size));
    return Math.max(min, Math.min(max, d));
  };
  return [clamp(dx, box.x, box.w, bounds.x, bounds.w), clamp(dy, box.y, box.h, bounds.y, bounds.h)];
}

export interface ThoughtProps {
  readonly ctx: KitCtx;
  readonly show: BubbleShow;
  /** What it showed before this tick when that differs (the change of mind), else null */
  readonly was: BubbleShow | null;
  /** It just appeared (nothing before this tick) */
  readonly appeared: boolean;
  readonly placed: PlacedThought;
  /** His head at the tick's end (page units) */
  readonly head: Pt;
  /** How far he is from his tick-end spot this frame (the bubble rides with him) */
  readonly offset: Pt;
  readonly k: number;
  readonly reduced: boolean;
  /** Stills draw the settled bubble only */
  readonly still: boolean;
  /**
   * The scripted tutorial's spotlight (0-2, #106): a moonlight glow and a dotted chalk ring round the
   * cloud, breathing — "look at what he wants". Not marigold: the bubble is not a touchable.
   */
  readonly spotlight?: boolean;
}

/** The spotlight behind the cloud (centred on it, cloud units). */
function spotlightArt(ctx: KitCtx, w: number, h: number): string {
  const rx = w / 2 + 14;
  const ry = h / 2 + 12;
  return `<ellipse rx="${r2(rx + 14)}" ry="${r2(ry + 12)}" fill="${ref(ctx, 'softLamp')}" opacity=".95"/>`
    + `<ellipse rx="${r2(rx)}" ry="${r2(ry)}" fill="${C.lamp}" opacity=".22"/>`
    + `<ellipse rx="${r2(rx)}" ry="${r2(ry)}" fill="none" stroke="${C.chalk}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 7" opacity=".95"/>`;
}

/**
 * The thought bubble (GDD § 2.2.6; bible § 5, § 8): a die-cut cloud on a coiled wire spring from
 * his head. When the target changes the old icon pops and the new one inflates (200 ms) while the
 * spring wobbles; 「要！」 pulses while he reaches. Under reduced motion: fades only.
 */
export function ThoughtBubble({ ctx, show, was, appeared, placed, head, offset, k, reduced, still, spotlight = false }: ThoughtProps) {
  const key = showKey(show);
  const wasKey = showKey(was);
  const now = useMemo(() => thoughtContent(ctx, JSON.parse(key) as BubbleShow), [ctx, key]);
  const old = useMemo(() => (wasKey === '' ? '' : thoughtContent(ctx, JSON.parse(wasKey) as BubbleShow)), [ctx, wasKey]);
  const cloud = useMemo(() => cloudCard(placed.w, placed.h), [placed.w, placed.h]);
  const spot = useMemo(() => (spotlight ? spotlightArt(ctx, placed.w, placed.h) : ''), [ctx, spotlight, placed.w, placed.h]);
  const [cx, cy] = placed.c;
  // The spring meets the cloud itself (the placed box has room for its bumps)
  const end = springEnd({ x: cx - (placed.w * k) / 2, y: cy - (placed.h * k) / 2, w: placed.w * k, h: placed.h * k }, head);
  const spring = useMemo(() => talkSpring(head, end, k), [head[0], head[1], end[0], end[1], k]);
  const changed = !still && was !== null && wasKey !== key;
  const pulse = show.kind === 'want' && show.reach && !reduced && !still;
  const inClass = changed ? (reduced ? 'tb-fade-in tb-late' : 'tb-inflate tb-late') : undefined;
  return (
    <g data-bubble={show.kind} data-anim="" transform={`translate(${r2(offset[0])} ${r2(offset[1])})`}>
      {/* The wobble turns the spring and the cloud about his head; keyed so a change replays it */}
      <g transform={`translate(${r2(head[0])} ${r2(head[1])})`}>
        <g key={changed && !reduced ? `w:${key}` : 'w'} className={changed && !reduced ? 'tb-wobble' : undefined}>
          <g transform={`translate(${r2(-head[0])} ${r2(-head[1])})`}>
            <ArtG html={spring} />
            <g transform={`translate(${r2(cx)} ${r2(cy)}) scale(${k})`}>
              <g key={appeared && !still ? `a:${key}` : 'a'} className={appeared && !still ? (reduced ? 'tb-fade-in' : 'tb-inflate') : undefined}>
                {spot && (
                  <g data-bubble-spotlight="">
                    <ArtG html={spot} className={reduced || still ? undefined : 'tb-spot'} />
                  </g>
                )}
                <ArtG html={cloud} />
                {changed && old && <ArtG key={`o:${wasKey}`} html={old} className={reduced ? 'tb-fade-out' : 'tb-pop'} />}
                <g key={`n:${key}`} className={inClass}>
                  <g className={pulse ? 'tb-pulse' : undefined}>
                    <ArtG html={now} />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

/** The 「要！」 poke's pointer (#99): a dotted chalk line from the bubble to his target, with an arrowhead. */
function pointerPath(box: { x: number; y: number; w: number; h: number }, to: Pt): string {
  const c: Pt = [box.x + box.w / 2, box.y + box.h / 2];
  const dx = to[0] - c[0];
  const dy = to[1] - c[1];
  const len = Math.hypot(dx, dy);
  if (len < 1) return '';
  const ux = dx / len;
  const uy = dy / len;
  // Leave the bubble at its edge, stop short of the target
  const t0 = Math.min(Math.abs(ux) > 1e-6 ? box.w / 2 / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-6 ? box.h / 2 / Math.abs(uy) : Infinity) + 6;
  const t1 = Math.max(t0 + 8, len - 22);
  const a: Pt = [c[0] + ux * t0, c[1] + uy * t0];
  const b: Pt = [c[0] + ux * t1, c[1] + uy * t1];
  const head = (s: number) => `${r2(b[0] - ux * 9 + -uy * 6 * s)} ${r2(b[1] - uy * 9 + ux * 6 * s)}`;
  return `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}|M${head(1)}L${r2(b[0])} ${r2(b[1])}L${head(-1)}`;
}

/** A bark bubble beside the speaker's head: pops in, holds, fades out (a fade under reduced motion). */
export function BarkBubble({ placed, offset, k, reduced }: { placed: PlacedBark; offset: Pt; k: number; reduced: boolean }) {
  const { box, to, bark } = placed;
  const card = useMemo(() => barkCard(box, to), [box, to]);
  const f = TALK_FONT * k * (bark.size ?? 1);
  const baby = bark.who === 'baby';
  const [line, arrow] = bark.point ? pointerPath(box, bark.point).split('|') : [];
  const within = rideWithin(box, offset);
  return (
    <g data-bark={bark.who} data-bark-kind={bark.bark} data-anim="" transform={`translate(${r2(within[0])} ${r2(within[1])})`}>
      <g key={`${bark.who}:${bark.tick}:${bark.bark}`} className={reduced ? 'tb-bark-fade' : 'tb-bark'}>
        {line && (
          <g data-bark-point="" fill="none" stroke={C.chalk} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d={line} strokeDasharray="2 7" />
            <path d={arrow} />
          </g>
        )}
        <ArtG html={card} />
        <text
          x={r2(box.x + box.w / 2)}
          y={r2(box.y + box.h / 2 + f * 0.36)}
          textAnchor="middle"
          fontFamily={SERIF}
          fontWeight={900}
          fontSize={r2(f)}
          fill={baby ? C.sealInk : C.ink}
          stroke={C.standeeCard}
          strokeWidth={r2(3 * k)}
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {bark.text}
        </text>
      </g>
    </g>
  );
}

/** Each speaker's label colour (GDD § 5.1): dark inks that keep the cream label text ≥ 7:1. */
export const SPEAKER_INK: Readonly<Record<Speaker, string>> = {
  nar: C.ink,
  baby: C.lockBadge,
  mocha: C.kraftFiber,
  grandma: C.sealDark,
  mom: C.printDark,
  dad: C.cover,
  pa: C.nightInk,
  uncle: C.foldAo,
  clerk: C.tile,
  pack: C.coverLight,
  shushu: C.nightCardDeep,
  npc: C.inkSoft,
};

export interface SubtitlesProps {
  readonly strip: PlacedStrip | null;
  readonly subs: readonly PlacedSub[];
  readonly horn: Pt | null;
  readonly k: number;
  /** How far each rider is from his tick-end spot this frame */
  readonly ride: { readonly baby: Pt; readonly mocha: Pt };
  /** Counts beats: a new beat replays the entrances */
  readonly serial: number;
  readonly reduced: boolean;
  readonly onAdvance?: () => void;
}

/**
 * The beat on the page (GDD § 2.13): the narration strip at the top and up to three subtitle
 * bubbles, each on a spring from its speaker (§ 5.1). Tapping any of them advances; the tap never
 * reaches the page (no play input, no pause). In the game a tap anywhere else on the page does the
 * same (`PagePlayer`, #183); a still with no `onAdvance` only draws them.
 */
export function Subtitles({ strip, subs, horn, k, ride, serial, reduced, onAdvance }: SubtitlesProps) {
  const tap = (e: ReactPointerEvent<SVGGElement>) => {
    e.stopPropagation();
    onAdvance?.();
  };
  const f = TALK_FONT * k;
  return (
    <g data-talk={serial} onPointerDown={tap}>
      {strip && (
        <g key={`s:${serial}`} data-narration="" className={reduced ? 'tb-fade-in' : 'tb-strip'}>
          <StripArt strip={strip} f={f} />
        </g>
      )}
      {horn && <HornArt at={horn} />}
      {subs.map((sub, i) => {
        // A bubble rides its speaker between ticks, but never off the page (#183: a long trip held
        // mid-way by the photo moment left one under the HUD)
        const off = sub.rides === null ? ([0, 0] as Pt) : rideWithin(sub.box, ride[sub.rides]);
        return (
          <g key={`${serial}:${i}`} data-subtitle={sub.line.who} data-anim={sub.rides ? '' : undefined} transform={sub.rides ? `translate(${r2(off[0])} ${r2(off[1])})` : undefined}>
            <g className={reduced ? 'tb-fade-in' : 'tb-sub'} style={{ animationDelay: `${(i + (strip ? 1 : 0)) * 180}ms` }}>
              <SubtitleArt sub={sub} f={f} k={k} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

function StripArt({ strip, f }: { strip: PlacedStrip; f: number }) {
  const card = useMemo(() => stripCard(strip.box), [strip.box]);
  const rows = strip.rows.flat();
  const lh = f * 1.32;
  const top = strip.box.y + (strip.box.h - rows.length * lh) / 2;
  return (
    <>
      <ArtG html={card} />
      {rows.map((row, i) => (
        <text key={i} x={r2(strip.box.x + strip.box.w / 2)} y={r2(top + lh * i + lh * 0.5 + f * 0.36)} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight={600} fontSize={r2(f)} fill={C.ink}>
          {row}
        </text>
      ))}
    </>
  );
}

function HornArt({ at }: { at: Pt }) {
  const html = useMemo(() => paHorn(), []);
  return (
    <g data-pa-horn="" transform={`translate(${r2(at[0] + 22)} ${r2(at[1])})`}>
      <ArtG html={html} />
    </g>
  );
}

function SubtitleArt({ sub, f, k }: { sub: PlacedSub; f: number; k: number }) {
  const { box, rows, label, from } = sub;
  const top = label === null ? 0 : LABEL_H * k * LABEL_RISE;
  const card = { x: box.x, y: box.y + top, w: box.w, h: box.h - top };
  // The part of the tab that hangs inside the card: the text sits below it
  const inside = label === null ? 0 : LABEL_H * k - top;
  const springTo = from === null ? null : springEnd(card, from);
  const art = useMemo(() => {
    const spring = from && springTo ? talkSpring(from, springTo, k) : '';
    const tab = label === null ? '' : labelTab(card.x + 10, box.y, (textEm(label) * TALK_FONT + 24) * k, LABEL_H * k, SPEAKER_INK[sub.line.who]);
    return spring + speechCard(card, 12 * k) + tab;
  }, [box, label, from?.[0], from?.[1], k, sub.line.who]);
  const lh = f * 1.32;
  const textTop = card.y + inside + (card.h - inside - rows.length * lh) / 2;
  return (
    <>
      <ArtG html={art} />
      {label !== null && (
        // A halo in the tab's own ink keeps the name ≥ 7:1 wherever its glyphs overhang the tab (#108: lighter page art)
        <text x={r2(card.x + 10 + 12 * k)} y={r2(box.y + (LABEL_H * k) / 2 + f * 0.36)} fontFamily={SERIF} fontWeight={900} fontSize={r2(f)} fill={C.sealGlyph} stroke={SPEAKER_INK[sub.line.who]} strokeWidth={r2(3 * k)} paintOrder="stroke" strokeLinejoin="round">
          {label}
        </text>
      )}
      {rows.map((row, i) => (
        <text key={i} x={r2(card.x + card.w / 2)} y={r2(textTop + lh * i + lh * 0.5 + f * 0.36)} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={r2(f)} fill={C.ink}>
          {row}
        </text>
      ))}
    </>
  );
}
