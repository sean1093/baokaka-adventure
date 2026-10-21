import { SPEAKERS, type TalkLine } from '../../content/script';
import type { BubbleShow } from '../art/placeholders';
import { PAGE_W, type Pt } from '../geometry';
import type { BarkShow } from './barks';
import {
  TALK_BOUNDS,
  TALK_FONT,
  barkCandidates,
  clampInto,
  overlap,
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
 * by `pickBox` so it never covers Baokaka or the goal, and avoids Mocha, his perch paws, the
 * hinted target and the bubbles placed before it. Page units at the tick's end positions; the view moves a speaker's bubbles with him
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
  /**
   * Mocha's perch paws and the hinted target (#183): every bubble keeps off these where it can (a
   * soft avoid); the paws are drawn over the thought bubble and the barks anyway.
   */
  readonly marks?: readonly Box[];
}

export interface PlacedThought {
  readonly box: Box;
  /** The cloud's centre and size before `k` */
  readonly c: Pt;
  readonly w: number;
  readonly h: number;
  readonly clear: boolean;
  /** Folded small at his ear while a beat needs the room over his head (#197): it shows only what he wants */
  readonly tucked: boolean;
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
  /**
   * How many of the beat's lines (from its first) lay out clean together: no card over Baokaka, the
   * goal, his thought bubble or another card (#197). Less than the beat's length when the page is too
   * small for the whole beat at once (three lines at 375 × 667, or in 大字): the view asks the queue
   * to split the beat there, so the rest follow on the next tap.
   */
  readonly fit: number;
}

/** The thought cloud's size at k = 1 (the art's 92 × 46, plus its bumps). */
export const THOUGHT_SIZE = { w: 92, h: 46 } as const;
/** The tucked cloud (#197): room for one icon or 「要！」 at the cloud's own text size. */
export const THOUGHT_TUCK = { w: 60, h: 40 } as const;
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
  // A closing mark may hang past `maxW` (kinsoku): the card takes it in rather than let it spill (#197)
  const w = Math.min(TALK_BOUNDS.w, Math.max(textW + 2 * pad, labelW + 8, 64 * k));
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

/**
 * How a layout pass treats the thought bubble (#197). `over`: the first pass, the cloud over his head
 * and the subtitles placed as before, keeping off it only where they can. When a beat's cards would
 * still cover the cloud or him (three lines on a small book: 375 × 667, or 大字), the later passes
 * make the cloud as hard to cover as he is and search the whole page for each card (`denseCandidates`):
 * `firm` keeps the cloud over his head, `beside` moves it level with his head on the side with room,
 * and `tucked`, the last resort, folds it into a small cloud at his ear (`THOUGHT_TUCK`) that shows
 * only what he wants.
 */
export type CloudPlan = 'over' | 'firm' | 'beside' | 'tucked';
const FULL_CLOUD: readonly CloudPlan[] = ['over', 'firm', 'beside'];
const TUCKED: readonly CloudPlan[] = ['tucked'];

/**
 * Lays out everything said on the page (see above). A beat whose cards would cover the cloud or him
 * tries the other plans; one too big for the page with the full cloud is split (`fit`) before the
 * cloud is ever tucked: the next tap brings the rest.
 */
export function layoutTalk(scene: TalkScene): TalkLayout {
  const beat = scene.beat ?? [];
  const first = bestPlan(scene, FULL_CLOUD);
  if (first.cost === 0 || beat.length === 0) return { ...first.layout, fit: beat.length };
  for (const plans of [FULL_CLOUD, TUCKED]) {
    for (let n = beat.length; n >= 1; n--) {
      const part = n === beat.length && plans === FULL_CLOUD ? first : bestPlan({ ...scene, beat: beat.slice(0, n) }, plans);
      if (part.cost !== 0) continue;
      // The whole beat lays out clean (tucked), or the first n lines do and the queue splits it there
      // (until it does, the whole beat as best it goes)
      return n === beat.length ? { ...part.layout, fit: n } : { ...first.layout, fit: n };
    }
  }
  // Not even one line clears him and the cloud: splitting would not help
  const tucked = bestPlan(scene, TUCKED);
  return { ...(tucked.cost < first.cost ? tucked : first).layout, fit: beat.length };
}

/** The first plan that lays the scene out clean, else the one that clashes least. */
function bestPlan(scene: TalkScene, plans: readonly CloudPlan[]): { layout: Omit<TalkLayout, 'fit'>; cost: number } {
  let best: { layout: Omit<TalkLayout, 'fit'>; cost: number } | null = null;
  for (const plan of plans) {
    // With no beat on the page nothing can cover the cloud: the first pass is the layout
    if (best !== null && (scene.beat ?? []).length === 0) break;
    // The cloud's first clear spot; then, after the first pass, each of its other spots that keeps
    // off him and the goal, even over Mocha or a paw (they are drawn over it), until the cards fit
    const tries: (number | undefined)[] = [undefined, ...(plan === 'over' ? [] : cloudSpots(scene, plan))];
    for (const only of tries) {
      const layout = arrange(scene, plan, only);
      const cost = talkClash(layout, scene);
      if (best === null || cost < best.cost) best = { layout, cost };
      if (cost === 0) return best;
    }
  }
  return best!;
}

/**
 * What a layout's text cards (the subtitles and the narration strip) cover that they must not, as
 * an area: Baokaka, the goal and one another a hundred times over, the thought bubble once. Zero for
 * a clean layout (what `check:ui` asserts on every fixture, #197).
 */
export function talkClash(layout: Omit<TalkLayout, 'fit'>, scene: Pick<TalkScene, 'baby' | 'goal'>): number {
  const cards = [...(layout.strip ? [layout.strip.box] : []), ...layout.subs.map((s) => s.box)];
  let cost = 0;
  for (const [i, c] of cards.entries()) {
    if (scene.baby) cost += overlap(c, scene.baby.box) * 100;
    if (scene.goal) cost += overlap(c, scene.goal) * 100;
    if (layout.thought) cost += overlap(c, layout.thought.box);
    for (const d of cards.slice(i + 1)) cost += overlap(c, d) * 100;
  }
  return cost;
}

/** Where a plan may put the cloud (`size` with its padding), in the order it tries them. */
function cloudCandidates(baby: TalkActor, plan: CloudPlan, size: { w: number; h: number }, side: 1 | -1): Box[] {
  if (plan === 'beside') return besideCandidates(baby, size, side);
  if (plan === 'tucked') return barkCandidates(baby.head, size, side);
  return thoughtCandidates(baby.head, size, side);
}

/** A plan's cloud spots that keep off him and the goal (indices into `cloudCandidates`). */
function cloudSpots(scene: TalkScene, plan: CloudPlan): number[] {
  const { baby, goal, k } = scene;
  if (!baby || !scene.thought) return [];
  const form = plan === 'tucked' ? THOUGHT_TUCK : THOUGHT_SIZE;
  const size = { w: (form.w + CLOUD_PAD) * k, h: (form.h + CLOUD_PAD) * k };
  const hard = goal ? [baby.box, goal] : [baby.box];
  return cloudCandidates(baby, plan, size, preferSide(baby.at[0]))
    .map((c, i) => [clampInto(c), i] as const)
    .filter(([c]) => hard.every((h) => overlap(c, h) === 0))
    .map(([, i]) => i);
}

/**
 * Lays the scene out under `plan`. The cloud takes its first clear spot (keeping off Mocha and the
 * marks too), or, given `only`, that one of its candidates.
 */
function arrange(scene: TalkScene, plan: CloudPlan, only?: number): Omit<TalkLayout, 'fit'> {
  const { k, baby, mocha, goal } = scene;
  const hard: Box[] = [];
  if (baby) hard.push(baby.box);
  if (goal) hard.push(goal);
  const soft: Box[] = [];
  if (mocha) soft.push(mocha.box);
  soft.push(...(scene.marks ?? []));
  // After the first pass the cloud is as hard for the cards to cover as he is
  const cardHard = [...hard];
  const dense = plan !== 'over';

  // 1. The thought bubble, over his head (or beside it, or tucked at his ear)
  let thought: PlacedThought | null = null;
  let side: 1 | -1 = 1;
  if (baby && scene.thought) {
    side = preferSide(baby.at[0]);
    const form = plan === 'tucked' ? THOUGHT_TUCK : THOUGHT_SIZE;
    const size = { w: (form.w + CLOUD_PAD) * k, h: (form.h + CLOUD_PAD) * k };
    const candidates = cloudCandidates(baby, plan, size, side);
    const pick = pickBox(only === undefined ? candidates : [candidates[only]!], { hard, soft });
    const box = pick.box;
    thought = { box, c: [box.x + box.w / 2, box.y + box.h / 2], w: form.w, h: form.h, clear: pick.clear, tucked: plan === 'tucked' };
    soft.push(box);
    if (plan !== 'over') cardHard.push(box);
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
    const pick = pickBox(stripCandidates(size), { hard: cardHard, soft });
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
    const maxW = from === null ? VOICE_MAX_W : SUB_MAX_W;
    const size = subtitleSize(line.text, line.label, k, maxW);
    const own = rides === 'baby' ? [] : rides === 'mocha' && mocha ? [mocha.box] : [];
    let candidates: Box[];
    // An off-page voice may step further down the page, so a beat's lines keep their reading order
    if (from === null) candidates = voiceCandidates(voiceTop, size, 10);
    // 廣播姊姊 under her loudspeaker; then anywhere down the page's open middle, so her lines never
    // have to sit on a strap or a perch paw (#183: 1-1's intro covered them)
    else if (anchor === 'speaker') candidates = [...belowLeft(from, size), ...voiceCandidates(voiceTop, size)];
    else {
      const s = from[0] > PAGE_W / 2 ? -1 : 1;
      candidates = [...subtitleCandidates(from, size, s), ...belowLeft(from, size), ...voiceCandidates(voiceTop, size)];
    }
    // A beat's earlier subtitles are as hard to cover as he is: one line never hides another (#122)
    const avoid = { hard: [...cardHard, ...subs.map((x) => x.box)], soft: [...soft, ...own, ...(scene.touch ?? [])] };
    const hardFree = (b: Box) => avoid.hard.every((h) => overlap(b, h) === 0);
    // The later passes may take any open spot on the page, top first; only when none keeps off him,
    // the goal, the cloud and the other cards do they wrap the line narrower and taller (#197)
    // ...below the line before, so the beat still reads top to bottom
    const below = Math.max(voiceTop, ...subs.map((x) => x.box.y + 1));
    let fitted = size;
    let pick = pickBox(dense ? [...candidates, ...denseCandidates(below, size, from)] : candidates, avoid);
    if (dense && !hardFree(pick.box)) {
      let width = size.w;
      for (const f of NARROWER) {
        const narrow = subtitleSize(line.text, line.label, k, maxW * f);
        if (narrow.w >= width - 1) continue;
        width = narrow.w;
        const spots = denseCandidates(below, narrow, from);
        if (spots.length === 0) continue;
        const p = pickBox(spots, avoid);
        if (hardFree(p.box)) {
          [pick, fitted] = [p, narrow];
          break;
        }
      }
    }
    subs.push({ line, box: pick.box, rows: fitted.rows, label: line.label, from, rides });
    soft.push(pick.box);
  }
  return { thought, barks, strip, subs, horn };
}

/**
 * Every spot on the page from `top` down for a card of `size` (#197), in `DENSE_STEP` rows: against
 * the left edge, centred, against the right edge, and centred under its speaker when it has one.
 */
function denseCandidates(top: number, size: { w: number; h: number }, from: Pt | null): Box[] {
  const xs = [TALK_BOUNDS.x, (PAGE_W - size.w) / 2, TALK_BOUNDS.x + TALK_BOUNDS.w - size.w];
  if (from !== null) xs.push(from[0] - size.w / 2);
  const out: Box[] = [];
  for (let y = Math.max(TALK_BOUNDS.y, top); y + size.h <= TALK_BOUNDS.y + TALK_BOUNDS.h; y += DENSE_STEP) {
    for (const x of xs) out.push({ x, y, w: size.w, h: size.h });
  }
  return out;
}
const DENSE_STEP = 8;
/** The narrower wraps a later pass may try for a card, as fractions of its usual width (#197). */
const NARROWER = [0.72, 0.52];

/**
 * The thought bubble beside him (#197): level with his head and a little above or below it, on the
 * side with room first, clear of his frame. A beat's cards then have the page over his head.
 */
function besideCandidates(baby: TalkActor, size: { w: number; h: number }, side: 1 | -1): Box[] {
  const { box, head } = baby;
  const out: Box[] = [];
  for (const dy of [-0.5, -0.15, 0.2, -0.9]) {
    for (const s of [side, -side]) {
      const x = s > 0 ? box.x + box.w + 6 : box.x - 6 - size.w;
      out.push({ x, y: head[1] + dy * size.h - size.h / 2, w: size.w, h: size.h });
    }
  }
  return out;
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
