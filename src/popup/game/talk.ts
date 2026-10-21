import { loadLines, type ScriptLine, type TalkLine } from '../content/script';
import type { SimEvent } from '../core/events';
import { matchPredicate } from '../core/step';
import type { LineKey, PageDef, SimState } from '../core/types';

/**
 * The subtitle queue (GDD § 2.13, § 5.1): dialogue plays in short bubbles over the page, never a
 * box covering play. Lines arrive in groups (a page's intro, a line its event fired); each group is
 * cut into **beats** of at most three lines, shown together; a tap anywhere on the page (#183)
 * advances to the next beat, and the last tap clears the page. Pure: `PagePlayer` holds a
 * `TalkQueue` in state and `PageView` draws the current beat.
 */

/** § 2.13: at most three subtitle lines on the page at once. */
export const MAX_PER_BEAT = 3;

export interface TalkQueue {
  /** The beats still to show; the first is on the page */
  readonly beats: readonly (readonly TalkLine[])[];
  /** Counts beats shown, so a new beat (re)plays its entrance even when its lines repeat */
  readonly serial: number;
}

export const EMPTY_TALK: TalkQueue = { beats: [], serial: 0 };

/** Cuts a group of lines into beats of ≤ `perBeat` (`MAX_PER_BEAT`; 1 when 大字 bubbles are too big for 3 on a small book, #104). */
export function beatsOf(lines: readonly TalkLine[], perBeat = MAX_PER_BEAT): TalkLine[][] {
  const n = Math.max(1, Math.min(MAX_PER_BEAT, Math.floor(perBeat)));
  const out: TalkLine[][] = [];
  for (let i = 0; i < lines.length; i += n) out.push(lines.slice(i, i + n));
  return out;
}

/** Queues a group of lines after what is already waiting (a new group never joins a beat on screen). */
export function enqueue(q: TalkQueue, lines: readonly TalkLine[], perBeat = MAX_PER_BEAT): TalkQueue {
  if (lines.length === 0) return q;
  const beats = [...q.beats, ...beatsOf(lines, perBeat)];
  return { beats, serial: q.beats.length === 0 ? q.serial + 1 : q.serial };
}

/** A tap: the next beat, or an empty page after the last. */
export function advance(q: TalkQueue): TalkQueue {
  if (q.beats.length === 0) return q;
  const beats = q.beats.slice(1);
  return { beats, serial: beats.length > 0 ? q.serial + 1 : q.serial };
}

/**
 * The beat on the page is too much for it (#197: three lines at 375 × 667 would cover his thought
 * bubble): its first `n` lines stay up, the rest become the next beat. Only when `beat` is still the
 * one on the page; the serial stays, so the lines already up do not replay their entrance.
 */
export function splitBeat(q: TalkQueue, beat: readonly TalkLine[], n: number): TalkQueue {
  const [first, ...rest] = q.beats;
  if (first !== beat || n < 1 || n >= first.length) return q;
  return { beats: [first.slice(0, n), first.slice(n), ...rest], serial: q.serial };
}

/** The beat on the page, or null. */
export const currentBeat = (q: TalkQueue): readonly TalkLine[] | null => q.beats[0] ?? null;

/** The page's intro lines, loaded (GDD § 5.2: they play as the page opens). */
export function introLines(def: PageDef, table?: Readonly<Record<LineKey, ScriptLine>>): TalkLine[] {
  return loadLines(def.lines?.intro ?? [], table);
}

/**
 * The page's event lines that fired on the tick from `prev` to `state` (GDD § 3.3 phase 7): a line
 * plays once, on the tick its predicate first holds (its counter reaches `count`).
 */
export function firedLines(def: PageDef, prev: SimState, state: SimState, events: readonly SimEvent[], table?: Readonly<Record<LineKey, ScriptLine>>): TalkLine[] {
  const keys: LineKey[] = [];
  for (const l of def.lines?.onEvent ?? []) {
    if (!matchPredicate([], l.when, prev.counters) && matchPredicate(events, l.when, state.counters)) keys.push(l.line);
  }
  return loadLines(keys, table);
}
