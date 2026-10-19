import { SPEAKERS, type TalkLine } from '../../content/script';
import type { BubbleShow } from '../art/placeholders';
import { PAGE_W, type Pt } from '../geometry';
import type { BarkShow } from './barks';
import {
  TALK_FONT,
  barkCandidates,
  pickBox,
  preferSide,
  stripCandidates,
  subtitleCandidates,
  textEm,
  thoughtCandidates,
  voiceCandidates,
  wrapText,
  type Box,
} from './place';

/**
 * Lays out everything said on the page at once (#98): the thought bubble first (the main teaching
 * device, GDD § 2.2.6), then the barks, the narration strip and the subtitle bubbles, each placed
 * by `pickBox` so it never covers Baokaka or the goal, and avoids Mocha and the bubbles placed
 * before it. Page units at the tick's end positions; the view moves a speaker's bubbles with him
 * between ticks. Every size is multiplied by `k` (`talkScale`) so the text stays ≥ 20 screen px.
 */

/** A character on the page at the tick's end: feet, head (the spring's root) and frame box. */
export interface TalkActor {
  readonly at: Pt;
  readonly head: Pt;
  readonly box: Box;
}

export interface TalkScene {
  /** `talkScale(scale)` */
  readonly k: number;
  readonly baby: TalkActor | null;
  readonly mocha: TalkActor | null;
  /** The goal where it lies (what no bubble may cover) */
  readonly goal: Box | null;
  /** The 土地公's spot (阿伯's lines hang from it) */
  readonly tudigong: Pt | null;
  readonly thought: BubbleShow | null;
  readonly barks: readonly BarkShow[];
  /** The subtitle beat on the page (≤ 3 lines) */
  readonly beat: readonly TalkLine[] | null;
  /**
   * The touchables' hit boxes: subtitle bubbles take taps (to advance), so they keep off these
   * where they can (a soft avoid; the thought bubble and barks let taps through).
   */
  readonly touch?: readonly Box[];
}

export interface PlacedThought {
  readonly box: Box;
  /** The cloud's centre and size before `k` */
  readonly c: Pt;
  readonly w: number;
  readonly h: number;
  readonly clear: boolean;
}

export interface PlacedBark {
  readonly bark: BarkShow;
  readonly box: Box;
  /** The head its tail points at */
  readonly to: Pt;
}

export interface PlacedStrip {
  readonly box: Box;
  /** Each narration line's rows */
  readonly rows: readonly (readonly string[])[];
  readonly lines: readonly TalkLine[];
}

export interface PlacedSub {
  readonly line: TalkLine;
  readonly box: Box;
  readonly rows: readonly string[];
  /** The label tab's text, or null */
  readonly label: string | null;
  /** Where its spring starts (a head, the 土地公, the loudspeaker), or null for an off-page voice */
  readonly from: Pt | null;
  /** Who it hangs from, for the view to move it along */
  readonly rides: 'baby' | 'mocha' | null;
}

export interface TalkLayout {
  readonly thought: PlacedThought | null;
  readonly barks: readonly PlacedBark[];
  readonly strip: PlacedStrip | null;
  readonly subs: readonly PlacedSub[];
  /** 廣播姊姊's loudspeaker, when she speaks */
  readonly horn: Pt | null;
}

/** The thought cloud's size at k = 1 (the art's 92 × 46, plus its bumps). */
export const THOUGHT_SIZE = { w: 92, h: 46 } as const;
const CLOUD_PAD = 12;
/** Speech text: line height and padding, × k. */
const LINE_H = 1.32;
const PAD = 12;
const BARK_PAD = { x: 11, y: 7 } as const;
/** Subtitle widths: hanging from someone, and an off-page voice. */
const SUB_MAX_W = 300;
const VOICE_MAX_W = 340;
const STRIP_W = PAGE_W - 24;
/** The label tab's height, and how far it rises over the card's top edge. */
export const LABEL_H = TALK_FONT + 10;
export const LABEL_RISE = 0.55;
/** 廣播姊姊's loudspeaker: top right, under the strip */
export const HORN_AT: Pt = [PAGE_W - 34, 92];

/** A bark's bubble size. */
export function barkSize(text: string, k: number): { w: number; h: number } {
  return { w: (textEm(text) * TALK_FONT + 2 * BARK_PAD.x) * k, h: (TALK_FONT * 1.2 + 2 * BARK_PAD.y) * k };
}

/** A subtitle card's rows and size (the label tab included in its height). */
export function subtitleSize(text: string, label: string | null, k: number, maxW: number): { rows: string[]; w: number; h: number } {
  const f = TALK_FONT * k;
  const pad = PAD * k;
  const rows = wrapText(text, (maxW - 2 * pad) / f);
  const textW = Math.max(...rows.map(textEm)) * f;
  const labelW = label === null ? 0 : (textEm(label) * TALK_FONT + 24) * k + 10;
  const w = Math.min(maxW, Math.max(textW + 2 * pad, labelW + 8, 64 * k));
  // The tab rises over the card's top edge and hangs into it: room for both, so it never sits on the text
  const tab = label === null ? 0 : LABEL_H * k;
  return { rows, w, h: rows.length * f * LINE_H + 2 * pad + tab };
}

/** The narration strip's rows and height for its lines. */
export function stripSize(lines: readonly TalkLine[], k: number): { rows: string[][]; w: number; h: number } {
  const f = TALK_FONT * k;
  const rows = lines.map((l) => wrapText(l.text, (STRIP_W - 2 * PAD * k) / f));
  const n = rows.reduce((s, r) => s + r.length, 0);
  return { rows, w: STRIP_W, h: n * f * LINE_H + 1.6 * PAD * k };
}

/** The goal's box where it lies at `p` (the shiny hovers 14 units up in its cup of light). */
export const goalBox = (p: Pt): Box => ({ x: p[0] - 22, y: p[1] - 38, w: 44, h: 42 });

export function layoutTalk(scene: TalkScene): TalkLayout {
  const { k, baby, mocha, goal } = scene;
  const hard: Box[] = [];
  if (baby) hard.push(baby.box);
  if (goal) hard.push(goal);
  const soft: Box[] = [];
  if (mocha) soft.push(mocha.box);

  // 1. The thought bubble, over his head
  let thought: PlacedThought | null = null;
  let side: 1 | -1 = 1;
  if (baby && scene.thought) {
    side = preferSide(baby.at[0]);
    const size = { w: (THOUGHT_SIZE.w + CLOUD_PAD) * k, h: (THOUGHT_SIZE.h + CLOUD_PAD) * k };
    const pick = pickBox(thoughtCandidates(baby.head, size, side), { hard, soft });
    const box = pick.box;
    thought = { box, c: [box.x + box.w / 2, box.y + box.h / 2], w: THOUGHT_SIZE.w, h: THOUGHT_SIZE.h, clear: pick.clear };
    soft.push(box);
    // The barks lean the other way from where the cloud went
    side = box.x + box.w / 2 >= baby.head[0] ? -1 : 1;
  }

  // 2. Barks beside the speaker's head
  const barks: PlacedBark[] = [];
  for (const bark of scene.barks) {
    const who = bark.who === 'baby' ? baby : mocha;
    if (!who) continue;
    const s: 1 | -1 = bark.who === 'baby' ? side : who.at[0] > PAGE_W / 2 ? -1 : 1;
    const pick = pickBox(barkCandidates(who.head, barkSize(bark.text, k * (bark.size ?? 1)), s), { hard, soft: [...soft, who.box] });
    barks.push({ bark, box: pick.box, to: who.head });
    soft.push(pick.box);
  }

  // 3. The narration strip, then 4. the subtitle bubbles, in the beat's order
  const beat = scene.beat ?? [];
  const narration = beat.filter((l) => SPEAKERS[l.who].anchor === 'strip');
  let strip: PlacedStrip | null = null;
  if (narration.length > 0) {
    const size = stripSize(narration, k);
    const pick = pickBox(stripCandidates(size), { hard, soft });
    strip = { box: pick.box, rows: size.rows, lines: narration };
    soft.push(pick.box);
  }
  let horn: Pt | null = null;
  const subs: PlacedSub[] = [];
  const voiceTop = (strip && strip.box.y < 100 ? strip.box.y + strip.box.h : 0) + 12;
  for (const line of beat) {
    const anchor = SPEAKERS[line.who].anchor;
    if (anchor === 'strip') continue;
    let from: Pt | null = null;
    let rides: PlacedSub['rides'] = null;
    if (anchor === 'baby' && baby) [from, rides] = [baby.head, 'baby'];
    else if (anchor === 'mocha' && mocha) [from, rides] = [mocha.head, 'mocha'];
    else if (anchor === 'tudigong' && scene.tudigong) from = [scene.tudigong[0], scene.tudigong[1] - 10];
    else if (anchor === 'speaker') from = horn = [HORN_AT[0] - 22, HORN_AT[1]];
    const size = subtitleSize(line.text, line.label, k, from === null ? VOICE_MAX_W : SUB_MAX_W);
    const own = rides === 'baby' ? [] : rides === 'mocha' && mocha ? [mocha.box] : [];
    let candidates: Box[];
    if (from === null) candidates = voiceCandidates(voiceTop, size);
    else if (anchor === 'speaker') candidates = belowLeft(from, size);
    else {
      const s = from[0] > PAGE_W / 2 ? -1 : 1;
      candidates = [...subtitleCandidates(from, size, s), ...belowLeft(from, size), ...voiceCandidates(voiceTop, size)];
    }
    const pick = pickBox(candidates, { hard, soft: [...soft, ...own, ...(scene.touch ?? [])] });
    subs.push({ line, box: pick.box, rows: size.rows, label: line.label, from, rides });
    soft.push(pick.box);
  }
  return { thought, barks, strip, subs, horn };
}

/** Under and to the left of an anchor near the top right (the loudspeaker, a 土地公 up high), stepping down. */
function belowLeft(from: Pt, size: { w: number; h: number }): Box[] {
  return [0, 1, 2, 3].flatMap((i) => {
    const y = from[1] + 26 + i * (size.h * 0.6 + 10);
    return [
      { x: from[0] - size.w + 24, y, w: size.w, h: size.h },
      { x: from[0] - 24, y, w: size.w, h: size.h },
    ];
  });
}
