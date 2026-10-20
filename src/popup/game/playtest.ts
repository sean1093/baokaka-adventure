import type { Id } from '../core/types';
import { browserStorage, loadJson, saveJson, type StorageLike } from '../../shared/storage';
import type { Sticker } from './progress';

/**
 * The playtest log (#110; `docs/playtest/`): what the M1 observation sheet needs from the device —
 * time per page, hints per level, 重來, and a few confusion signals — kept on this phone only and
 * copied out as text by the observer. It is on only with `debug=metrics` in the hash
 * (`#/?debug=metrics`); nothing is ever sent anywhere (the issue rules out analytics).
 *
 * - **Events** are appended by the shell (`GameShell`) as they happen and stored under
 *   `popup.playtest.v1`, so a reload mid-session loses nothing. Times are epoch ms (`Date.now`).
 * - **Active time** is the time a page is live: open, not held by a layer (the menu, the 目錄), not
 *   in a turn or the chapter card, and the tab visible. A page's intro lines count (reading is part
 *   of the page); the sticker card and the album after it don't.
 * - **An attempt** runs from a page's open to its solve, or until another page opens (abandoned).
 *   重來 continues the attempt (the GDD's "≤ 6 min with hints" is per page, resets included).
 * - **Longest still** is the longest stretch of active time with no move of the player's own and no
 *   提示 press: the § 8 gate "stuck with no idea for > 2 min without using hints".
 *
 * The pure fold (`summarize`) and the text (`report`) are tested; `PlaytestLog` is the live store.
 */

export const PLAYTEST_KEY = 'popup.playtest.v1';
/** The log stops growing here (a long session is ≈ 1–2k events) */
export const PLAYTEST_MAX_EVENTS = 6000;
/** § 8: "stuck with no idea" longer than this, without hints, fails the gate */
export const STUCK_MS = 120_000;

export type HintRung = 0 | 1 | 2 | 3;

export type PlaytestEvent =
  /** A page opened (`replay`: it was already solved in this save) */
  | { readonly t: 'open'; readonly page: Id; readonly at: number; readonly replay: boolean }
  /** The page became live or stopped being live (a layer, a turn, the tab hidden) */
  | { readonly t: 'live'; readonly on: boolean; readonly at: number }
  /** The player's own move: a part, a perch, Mocha, a drag landing on a stop, a word said */
  | { readonly t: 'move'; readonly at: number }
  /** A tap on a locked part (it shook its head) */
  | { readonly t: 'nope'; readonly at: number }
  /** A tap on Baokaka (the word ring, or 「要！」 before any word) */
  | { readonly t: 'ring'; readonly at: number }
  /** A hint shown: 0 is the automatic nudge, 1–3 are 提示 presses (where, how, show me) */
  | { readonly t: 'hint'; readonly level: HintRung; readonly at: number }
  /** 重來 */
  | { readonly t: 'retry'; readonly at: number }
  /** 淘氣 or 土地公 earned mid-page */
  | { readonly t: 'sticker'; readonly sticker: Sticker; readonly at: number }
  /** The goal grabbed */
  | { readonly t: 'done'; readonly at: number; readonly moves: number }
  /** The observer's ★: a moment to find again in their notes (a laugh, a question, a wrong guess) */
  | { readonly t: 'mark'; readonly at: number };

export interface AttemptSummary {
  readonly page: Id;
  readonly replay: boolean;
  readonly startedAt: number;
  /** Live time on the page so far (to the solve, or to the next page opening) */
  readonly activeMs: number;
  /** Hints shown per level: [auto nudges, where, how, show me] */
  readonly hints: readonly [number, number, number, number];
  readonly retries: number;
  /** Touches: taps and drags on something that can move (a part, a perch, Mocha), and words said */
  readonly moves: number;
  readonly nopes: number;
  readonly rings: number;
  readonly marks: readonly number[];
  readonly stickers: readonly Sticker[];
  readonly done: boolean;
  /** The longest live stretch with no move and no 提示 press */
  readonly longestStillMs: number;
}

interface Running {
  page: Id;
  replay: boolean;
  startedAt: number;
  active: number;
  liveSince: number | null;
  lastActivity: number;
  longestStill: number;
  hints: [number, number, number, number];
  retries: number;
  moves: number;
  nopes: number;
  rings: number;
  marks: number[];
  stickers: Sticker[];
  done: boolean;
  /** 重來 was pressed: the next open of the same page continues this attempt */
  retrying: boolean;
}

const activeAt = (r: Running, at: number): number => r.active + (r.liveSince === null ? 0 : Math.max(0, at - r.liveSince));

function still(r: Running, at: number): void {
  r.longestStill = Math.max(r.longestStill, activeAt(r, at) - r.lastActivity);
}

function activity(r: Running, at: number): void {
  still(r, at);
  r.lastActivity = activeAt(r, at);
}

function freeze(r: Running, at: number): AttemptSummary {
  if (!r.done) still(r, at);
  return {
    page: r.page,
    replay: r.replay,
    startedAt: r.startedAt,
    activeMs: activeAt(r, at),
    hints: [...r.hints],
    retries: r.retries,
    moves: r.moves,
    nopes: r.nopes,
    rings: r.rings,
    marks: [...r.marks],
    stickers: [...r.stickers],
    done: r.done,
    longestStillMs: r.longestStill,
  };
}

/**
 * Folds the log into attempts, oldest first. `now` closes the running attempt's clock (the page
 * still open as the observer copies the report).
 */
export function summarize(events: readonly PlaytestEvent[], now: number): AttemptSummary[] {
  const out: AttemptSummary[] = [];
  let r: Running | null = null;
  /** A finished attempt keeps its clock where it stopped; the summary is taken at the solve */
  let doneAt = 0;
  const close = (at: number) => {
    if (r !== null) out.push(freeze(r, r.done ? doneAt : at));
    r = null;
  };
  for (const e of events) {
    if (e.t === 'open') {
      if (r !== null && !r.done && r.retrying && r.page === e.page) {
        r.retrying = false;
        continue;
      }
      close(e.at);
      r = {
        page: e.page,
        replay: e.replay,
        startedAt: e.at,
        active: 0,
        liveSince: null,
        lastActivity: 0,
        longestStill: 0,
        hints: [0, 0, 0, 0],
        retries: 0,
        moves: 0,
        nopes: 0,
        rings: 0,
        marks: [],
        stickers: [],
        done: false,
        retrying: false,
      };
      continue;
    }
    // Before any page (the cover), only the observer's marks matter, and they belong to no page
    if (r === null) continue;
    const cur: Running = r;
    if (cur.done) {
      // After the solve the clock is stopped; a mark still belongs to the page just solved
      if (e.t === 'mark') cur.marks.push(e.at);
      continue;
    }
    switch (e.t) {
      case 'live':
        if (e.on && cur.liveSince === null) cur.liveSince = e.at;
        else if (!e.on && cur.liveSince !== null) {
          cur.active += Math.max(0, e.at - cur.liveSince);
          cur.liveSince = null;
        }
        break;
      case 'move':
        cur.moves++;
        activity(cur, e.at);
        break;
      case 'nope':
        cur.nopes++;
        break;
      case 'ring':
        cur.rings++;
        break;
      case 'hint':
        cur.hints[e.level]++;
        if (e.level > 0) activity(cur, e.at);
        break;
      case 'retry':
        cur.retries++;
        cur.retrying = true;
        activity(cur, e.at);
        break;
      case 'sticker':
        if (!cur.stickers.includes(e.sticker)) cur.stickers.push(e.sticker);
        break;
      case 'mark':
        cur.marks.push(e.at);
        break;
      case 'done':
        still(cur, e.at);
        cur.done = true;
        doneAt = e.at;
        cur.active = activeAt(cur, e.at);
        cur.liveSince = null;
        break;
    }
  }
  close(now);
  return out;
}

/** `c1p4` → `1-4` */
export const pageLabel = (id: Id): string => id.replace(/^c(\d+)p(\d+)$/, '$1-$2');

/** 83_000 → `1:23` */
export function clock(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const median = (xs: readonly number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** 提示 presses (levels 1–3), not counting the automatic nudge */
export const pressed = (a: AttemptSummary): number => a.hints[1] + a.hints[2] + a.hints[3];

export interface GateReadings {
  /** 0-1's first attempt: its active time, and whether it was solved with no 提示 and no 重來 */
  readonly firstPage: { readonly ms: number; readonly unaided: boolean; readonly done: boolean } | null;
  /** The prologue's first attempts (0-1 … 0-4): total active time, 提示 presses, all four solved */
  readonly prologue: { readonly ms: number; readonly presses: number; readonly done: boolean } | null;
  /** Chapter 1 pages (first attempts) on which 提示 reached level 3 */
  readonly showMePages: readonly Id[];
  /** Median active time of the solved chapter 1 first attempts */
  readonly ch1MedianMs: number | null;
  /** Attempts with a still stretch over `STUCK_MS` and no 提示 press on that page */
  readonly stuck: readonly Id[];
  /** Pages replayed after their solve (for 淘氣 or 土地公, the observer confirms why) */
  readonly replays: readonly Id[];
}

/** The § 8 readings the device can give (the rest are observed: see `docs/playtest/sheet.md`). */
export function gates(attempts: readonly AttemptSummary[]): GateReadings {
  const first = new Map<Id, AttemptSummary>();
  for (const a of attempts) if (!a.replay && !first.has(a.page)) first.set(a.page, a);
  const p1 = first.get('c0p1');
  const prologueIds = ['c0p1', 'c0p2', 'c0p3', 'c0p4'];
  const prologue = prologueIds.map((id) => first.get(id)).filter((a): a is AttemptSummary => a !== undefined);
  const ch1 = [...first.values()].filter((a) => a.page.startsWith('c1p'));
  return {
    firstPage: p1 ? { ms: p1.activeMs, unaided: pressed(p1) === 0 && p1.retries === 0, done: p1.done } : null,
    prologue:
      prologue.length === 0
        ? null
        : { ms: prologue.reduce((t, a) => t + a.activeMs, 0), presses: prologue.reduce((t, a) => t + pressed(a), 0), done: prologue.length === prologueIds.length && prologue.every((a) => a.done) },
    showMePages: ch1.filter((a) => a.hints[3] > 0).map((a) => a.page),
    ch1MedianMs: median(ch1.filter((a) => a.done).map((a) => a.activeMs)),
    stuck: attempts.filter((a) => a.longestStillMs > STUCK_MS && pressed(a) === 0).map((a) => a.page),
    replays: [...new Set(attempts.filter((a) => a.replay).map((a) => a.page))],
  };
}

export interface ReportMeta {
  readonly now: number;
  readonly device?: string;
  readonly viewport?: string;
}

const yesNo = (ok: boolean): string => (ok ? 'yes' : 'NO');

/**
 * The plain text the observer copies into the observation sheet (`docs/playtest/sheet.md`, part D):
 * a table per attempt, the device gate readings, and the ★ marks. Markdown, English, no names.
 */
export function report(events: readonly PlaytestEvent[], meta: ReportMeta): string {
  const attempts = summarize(events, meta.now);
  const g = gates(attempts);
  const start = events[0]?.at ?? meta.now;
  const lines: string[] = [];
  lines.push(`## Device log (翻翻台北 playtest, debug=metrics)`);
  lines.push('');
  lines.push(`- Copied: ${new Date(meta.now).toISOString()}  ·  log started: ${new Date(start).toISOString()}`);
  if (meta.device) lines.push(`- Device: ${meta.device}`);
  if (meta.viewport) lines.push(`- Viewport: ${meta.viewport}`);
  lines.push(`- Events: ${events.length}  ·  attempts: ${attempts.length}`);
  lines.push('');
  lines.push('| # | Page | Replay | Active | Solved | 提示 L1/L2/L3 | Auto nudges | 重來 | Touches | Nope taps | Taps on him | Longest still | Stickers | ★ |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  attempts.forEach((a, i) => {
    lines.push(
      `| ${i + 1} | ${pageLabel(a.page)} | ${a.replay ? 'yes' : ''} | ${clock(a.activeMs)} | ${a.done ? 'yes' : 'no'} | ${a.hints[1]}/${a.hints[2]}/${a.hints[3]} | ${a.hints[0]} | ${a.retries} | ${a.moves} | ${a.nopes} | ${a.rings} | ${clock(a.longestStillMs)} | ${a.stickers.join(', ')} | ${a.marks.length || ''} |`,
    );
  });
  lines.push('');
  lines.push('### § 8 gates the device can read (first attempts)');
  lines.push('');
  if (g.firstPage) lines.push(`- 0-1 time: ${clock(g.firstPage.ms)} (target ≤ 1:30) · solved: ${yesNo(g.firstPage.done)} · no 提示 / 重來: ${yesNo(g.firstPage.unaided)} (the observer confirms "no explanation, no help")`);
  else lines.push('- 0-1: not played in this log');
  if (g.prologue) lines.push(`- Prologue time: ${clock(g.prologue.ms)} (target ≤ 12:00) · 提示 presses: ${g.prologue.presses} (target ≤ 2) · all four solved: ${yesNo(g.prologue.done)}`);
  lines.push(`- Ch1 pages with 提示 level 3: ${g.showMePages.length} (target ≤ 1)${g.showMePages.length ? ` — ${g.showMePages.map(pageLabel).join(', ')}` : ''}`);
  lines.push(`- Ch1 median page time: ${g.ch1MedianMs === null ? '—' : clock(g.ch1MedianMs)} (target 1:00–3:00)`);
  lines.push(`- Stuck > 2:00 without 提示: ${g.stuck.length === 0 ? 'none' : g.stuck.map(pageLabel).join(', ')} (target none)`);
  lines.push(`- Pages replayed: ${g.replays.length === 0 ? 'none' : g.replays.map(pageLabel).join(', ')} (the sheet asks why)`);
  const marks = attempts.flatMap((a) => a.marks.map((at) => ({ at, page: a.page })));
  if (marks.length > 0) {
    lines.push('');
    lines.push('### ★ marks (time since the log started)');
    lines.push('');
    for (const m of marks) lines.push(`- ${clock(m.at - start)} on ${pageLabel(m.page)}`);
  }
  return lines.join('\n');
}

const isEvent = (e: unknown): e is PlaytestEvent => typeof e === 'object' && e !== null && typeof (e as { t?: unknown }).t === 'string' && typeof (e as { at?: unknown }).at === 'number';
const isLog = (v: unknown): v is PlaytestEvent[] => Array.isArray(v) && v.every(isEvent);

/**
 * The live log: append, read, clear; written through on every event (a reload keeps it). Never
 * throws (private mode keeps it in memory).
 */
export class PlaytestLog {
  private events: PlaytestEvent[];
  private readonly storage: StorageLike | null;
  private readonly listeners = new Set<() => void>();

  constructor(storage: StorageLike | null = browserStorage()) {
    this.storage = storage;
    this.events = loadJson(PLAYTEST_KEY, isLog, storage) ?? [];
  }

  readonly get = (): readonly PlaytestEvent[] => this.events;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  add(event: PlaytestEvent): void {
    if (this.events.length >= PLAYTEST_MAX_EVENTS) return;
    this.events = [...this.events, event];
    saveJson(PLAYTEST_KEY, this.events, this.storage);
    for (const l of this.listeners) l();
  }

  clear(): void {
    this.events = [];
    try {
      this.storage?.removeItem(PLAYTEST_KEY);
    } catch {
      // Nothing to do: the next add overwrites it
    }
    for (const l of this.listeners) l();
  }
}
