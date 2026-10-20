import { PAGE_H, PAGE_W, type Pt } from '../geometry';

/**
 * Where bubbles go (GDD § 2.2.6, § 2.13; #98): the thought bubble, bark bubbles, subtitle bubbles
 * and the narration strip. Pure math in page units, shared by the view and the tests.
 *
 * - **Never over the baby or the goal** (#98 requirement 2): each bubble tries its candidate boxes
 *   in order (its preferred side, the other side, then the same two raised step by step, the top of
 *   the page being the HUD's edge) and takes the first that clears the boxes it must avoid; if none
 *   does, the one that covers least (a hard box costs a hundred times a soft one).
 * - **Text ≥ 20 screen px at every viewport** (GDD R5): `talkScale` grows a bubble against the book
 *   scale, so its 22-unit text never draws under 20 CSS px when the book shrinks (375 × 667: ≈ 0.66).
 */

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** GDD R5: the smallest text on screen, in CSS px. */
export const MIN_TEXT_PX = 20;
/** The bubbles' text size in page units at 1:1 (bible § 5: 「要！」 at 20 px; we draw 22). */
export const TALK_FONT = 22;

/**
 * How much the bubbles grow at book scale `scale` (page units → CSS px) so `TALK_FONT` stays
 * ≥ `MIN_TEXT_PX` on screen (with a hair of margin for rounding): 1 at 390 wide and up, ≈ 1.39 at
 * 375 × 667. With 大字 (`textScale` 1.25, #104) they grow by that much more, and the floor with
 * them (25 px; R5 asks ≥ 24).
 */
export function talkScale(scale: number, textScale = 1): number {
  const need = (MIN_TEXT_PX * textScale + 0.2) / (TALK_FONT * Math.max(0.05, scale));
  return Math.max(textScale, Math.round(need * 1000) / 1000);
}

/** Where bubbles may be: the page, under the HUD's edge (the page's top) and inside its sides. */
export const TALK_BOUNDS: Box = { x: 4, y: 4, w: PAGE_W - 8, h: PAGE_H - 8 };

/** The area two boxes share. */
export function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** A box shifted (never resized) to lie inside `bounds`; one larger than them aligns to their top-left. */
export function clampInto(b: Box, bounds: Box = TALK_BOUNDS): Box {
  const x = Math.max(bounds.x, Math.min(b.x, bounds.x + bounds.w - b.w));
  const y = Math.max(bounds.y, Math.min(b.y, bounds.y + bounds.h - b.h));
  return x === b.x && y === b.y ? b : { ...b, x, y };
}

export interface Avoid {
  /** Must not be covered: the baby, the goal */
  readonly hard: readonly Box[];
  /** Better not covered: Mocha, the other bubbles */
  readonly soft?: readonly Box[];
}

export interface Pick {
  readonly box: Box;
  /** Which candidate won */
  readonly index: number;
  /** It covers nothing it avoids */
  readonly clear: boolean;
}

/** The first candidate (clamped into `bounds`) that covers nothing, else the one that covers least. */
export function pickBox(candidates: readonly Box[], avoid: Avoid, bounds: Box = TALK_BOUNDS): Pick {
  let best: Pick | null = null;
  let bestCost = Infinity;
  for (const [index, cand] of candidates.entries()) {
    const box = clampInto(cand, bounds);
    let cost = 0;
    for (const a of avoid.hard) cost += overlap(box, a) * 100;
    for (const a of avoid.soft ?? []) cost += overlap(box, a);
    if (cost === 0) return { box, index, clear: true };
    if (cost < bestCost) {
      bestCost = cost;
      best = { box, index, clear: false };
    }
  }
  if (best === null) throw new Error('pickBox: no candidates');
  return best;
}

/** The thought bubble's preferred side: right of his head, left near the page's right edge. */
export const preferSide = (x: number): 1 | -1 => (x > 280 ? -1 : 1);

/** How far the bubbles climb when the low spots are taken (page units above the first try). */
const LIFTS = [0, 40, 84, 140, 210];

/**
 * The thought bubble's candidates (GDD § 2.2.6): a cloud of `size` on a spring `spring` units long
 * above `head`, leaning to `side`, then to the other side, then both raised step by step.
 */
export function thoughtCandidates(head: Pt, size: { w: number; h: number }, side: 1 | -1, spring = 26): Box[] {
  const out: Box[] = [];
  for (const lift of LIFTS) {
    for (const s of [side, -side]) {
      const cx = head[0] + s * size.w * 0.3;
      const bottom = head[1] - spring - lift;
      out.push({ x: cx - size.w / 2, y: bottom - size.h, w: size.w, h: size.h });
    }
  }
  return out;
}

/** A bark bubble's candidates: beside the head (on `side`, then the other), then above it, raised. */
export function barkCandidates(head: Pt, size: { w: number; h: number }, side: 1 | -1): Box[] {
  const out: Box[] = [];
  for (const s of [side, -side]) {
    const x = s > 0 ? head[0] + 14 : head[0] - 14 - size.w;
    out.push({ x, y: head[1] - size.h * 0.4, w: size.w, h: size.h });
  }
  for (const lift of LIFTS) {
    for (const s of [side, -side]) out.push({ x: head[0] - size.w / 2 + s * size.w * 0.45, y: head[1] - 12 - size.h - lift, w: size.w, h: size.h });
  }
  return out;
}

/** A subtitle bubble's candidates hanging from a speaker (`anchor`) on a spring, like the thought bubble's. */
export const subtitleCandidates = (anchor: Pt, size: { w: number; h: number }, side: 1 | -1): Box[] => thoughtCandidates(anchor, size, side, 22);

/** A subtitle with no one to hang from (an off-page voice): centred under the top, stepping down. */
export function voiceCandidates(top: number, size: { w: number; h: number }, steps = 6): Box[] {
  return Array.from({ length: steps }, (_, i) => i).map((i) => ({ x: (PAGE_W - size.w) / 2, y: top + i * (size.h * 0.6 + 8), w: size.w, h: size.h }));
}

/** The narration strip: across the top of the page, else low on the page when that covers him or the goal. */
export function stripCandidates(size: { w: number; h: number }): Box[] {
  const x = (PAGE_W - size.w) / 2;
  return [{ x, y: 6, w: size.w, h: size.h }, { x, y: PAGE_H - size.h - 6, w: size.w, h: size.h }];
}

// ——— Text: measuring and wrapping (SVG text does not wrap) ———

/** Closing punctuation that may not start a line (kinsoku). */
const NO_START = new Set([...'，。、！？；：」』）…—～.,!?;:)']);

/** A character's advance in em: CJK and full-width forms are square; Latin is about half. */
export function charEm(ch: string): number {
  const c = ch.codePointAt(0) ?? 0;
  if (c === 0x20) return 0.3;
  if (c < 0x2000) return 0.56;
  // General punctuation (… — ‘ ’) in a CJK serif sets full width
  return 1;
}

/** A run's width in em. */
export const textEm = (text: string): number => [...text].reduce((w, ch) => w + charEm(ch), 0);

/** Marks after which a line reads best broken: clause ends. */
const CLAUSE_END = /[，。、！？；：…—」』）,.!?;:)]+ ?/gu;

/** Greedy wrap: whole clauses while they fit, else token by token (CJK anywhere, Latin at spaces). */
function greedy(text: string, maxEm: number): string[] {
  // Clauses: the text cut after each run of closing marks
  const clauses: string[] = [];
  let at = 0;
  for (const m of text.matchAll(CLAUSE_END)) {
    const end = (m.index ?? 0) + m[0].length;
    clauses.push(text.slice(at, end));
    at = end;
  }
  if (at < text.length) clauses.push(text.slice(at));
  const lines: string[] = [];
  let line = '';
  let width = 0;
  const flush = () => {
    if (line.trim() !== '') lines.push(line.trimEnd());
    line = '';
    width = 0;
  };
  for (const clause of clauses) {
    const w = textEm(clause.trimEnd());
    if (width + w <= maxEm + 1e-6) {
      line += clause;
      width += textEm(clause);
      continue;
    }
    if (line !== '' && w <= maxEm + 1e-6) {
      flush();
      line = clause;
      width = textEm(clause);
      continue;
    }
    // Too long for a line of its own: token by token
    for (const tok of clause.match(/[\x21-\u1fff]+ ?| |[\s\S]/gu) ?? []) {
      const tw = textEm(tok.trimEnd());
      if (line !== '' && width + tw > maxEm + 1e-6 && !NO_START.has([...tok][0]!)) {
        flush();
        if (tok === ' ') continue;
      }
      line += tok;
      width += textEm(tok);
    }
  }
  flush();
  return lines;
}

/**
 * Wraps `text` into lines of at most `maxEm` (a closing mark never starts a line, so a line may run
 * over by one mark). Clauses stay whole where they fit; then the width is narrowed as far as it
 * goes without adding a line, so the lines come out even rather than one long and an orphan.
 */
export function wrapText(text: string, maxEm: number): string[] {
  const lines = greedy(text, maxEm);
  if (lines.length < 2) return lines;
  let lo = maxEm / lines.length;
  let hi = maxEm;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (greedy(text, mid).length <= lines.length) hi = mid;
    else lo = mid;
  }
  return greedy(text, hi);
}
