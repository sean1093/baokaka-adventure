import { selectTarget } from '../core/baby';
import { nodePos } from '../core/graph';
import { mochaNode } from '../core/mocha';
import { stepGrowth } from '../core/step';
import type { Id, PageDef, SimState } from '../core/types';
import { CHAPTER_NOTES, NOTE_POOL, NOTE_SPEAKERS, type NoteSpeaker } from '../content/album';
import type { PageRegistry } from '../pages';
import type { Photo, PhotoFrame } from './progress';

/**
 * The chapter spread's photo moment and the album's notes (GDD § 2.9, § 5.6; #103), pure. No React,
 * no DOM, no clock: the view passes the moment's time in.
 *
 * - **When** (`photoReady`): on a spread, once Baokaka's target is the treasure and it is reachable
 *   **2 edges** away or closer (a clear path), before he grabs it. The view pauses the session there.
 * - **The 3 s loop** (`PHOTO_LOOP_MS`): his final approach in slow motion. The 「哇！」 meter
 *   (`wowMeter`) rises as his face lights up, peaks at the grab (`PHOTO_PEAK_MS`), then eases.
 * - **The frame a tap takes** (`photoFrameAt`): within ±0.4 s of the peak **A** (the 「哇！」 face),
 *   earlier **B** (reaching, smiling), later **C** (chewing the treasure). No tap in 6 s
 *   (`AUTO_SNAP_MS`): **B**. Nobody is ever late.
 * - **+M** (`mochaInFrame`): Mocha settled on a perch whose node is inside the spread's `photoRect`.
 * - **The notes** (`albumNotes`): Frame A takes the chapter's § 5.6 row; B and C each speaker's
 *   shared pool at `(chapter × 7 + frame) mod poolSize`, 摩卡's pool by whether he is in the frame.
 *
 * A photo is stored as `{ frame, mocha, at }` (§ 3.8), never as an image: the album re-draws it.
 */

/** § 2.9: the slow-motion approach loops every 3 s. */
export const PHOTO_LOOP_MS = 3000;
/** The grab, the meter's peak, within the loop. */
export const PHOTO_PEAK_MS = 1800;
/** § 2.9: a tap within ±0.4 s of the peak is Frame A. */
export const PHOTO_PEAK_WINDOW_MS = 400;
/** § 2.9: no tap within 6 s, the camera snaps Frame B by itself. */
export const AUTO_SNAP_MS = 6000;
/** § 2.9: the moment's trigger, in edges between Baokaka and the treasure's approach node. */
export const PHOTO_EDGES = 2;

/** The frame's number in the § 5.6 pool formula: A 0, B 1, C 2. */
export const FRAME_INDEX: Readonly<Record<PhotoFrame, number>> = { A: 0, B: 1, C: 2 };

/** Where in the loop `ms` (time since the moment began) falls: 0 ≤ t < `PHOTO_LOOP_MS`. */
export const loopTime = (ms: number): number => ((ms % PHOTO_LOOP_MS) + PHOTO_LOOP_MS) % PHOTO_LOOP_MS;

/** The frame a 咔嚓 at `ms` takes (§ 2.9 step 3). */
export function photoFrameAt(ms: number): PhotoFrame {
  const t = loopTime(ms);
  if (Math.abs(t - PHOTO_PEAK_MS) <= PHOTO_PEAK_WINDOW_MS) return 'A';
  return t < PHOTO_PEAK_MS ? 'B' : 'C';
}

/**
 * The 「哇！」 meter at `ms`, 0–1: it starts low, rises (easing in, his face lighting up) to 1 at the
 * grab, then eases back to about half as he chews.
 */
export function wowMeter(ms: number): number {
  const t = loopTime(ms);
  if (t <= PHOTO_PEAK_MS) {
    const k = t / PHOTO_PEAK_MS;
    return 0.12 + 0.88 * k * k;
  }
  const k = (t - PHOTO_PEAK_MS) / (PHOTO_LOOP_MS - PHOTO_PEAK_MS);
  return 1 - 0.45 * (1 - (1 - k) * (1 - k));
}

/** How far through the approach the slow-motion Baokaka is at `ms`, 0–1 (1 from the grab on). */
export function approachAt(ms: number): number {
  const t = loopTime(ms);
  if (t >= PHOTO_PEAK_MS) return 1;
  const k = t / PHOTO_PEAK_MS;
  return k * k * (3 - 2 * k);
}

/** The page's treasure: its goal attractor (a spread has one). */
export function treasureOf(def: PageDef): Id | null {
  return def.attractors.find((a) => a.goal)?.id ?? null;
}

/**
 * § 2.9 step 1: the photo moment begins — a spread, not done, his target is the treasure, and it is
 * reachable at most `PHOTO_EDGES` edges away (and he isn't on it yet).
 */
export function photoReady(def: PageDef, state: SimState): boolean {
  if (!def.spread || state.done) return false;
  const treasure = treasureOf(def);
  if (treasure === null) return false;
  const target = selectTarget(def, state, { growth: stepGrowth(def, state) });
  return target !== null && target.id === treasure && target.approach !== null && target.steps >= 1 && target.steps <= PHOTO_EDGES;
}

/** § 2.9 +M: Mocha is settled on a perch inside the spread's `photoRect`. */
export function mochaInFrame(def: PageDef, state: SimState): boolean {
  const rect = def.photoRect;
  if (rect === undefined || state.mocha.perch === null) return false;
  const node = mochaNode(def, state);
  const at = node === null ? undefined : nodePos(def, state, node);
  return at !== undefined && at[0] >= rect.x && at[0] <= rect.x + rect.w && at[1] >= rect.y && at[1] <= rect.y + rect.h;
}

/** A shot as the moment takes it (the time is added when it is kept). */
export interface Shot {
  readonly frame: PhotoFrame;
  readonly mocha: boolean;
}

/** One sticky note on the album page. */
export interface AlbumNote {
  readonly speaker: NoteSpeaker;
  readonly text: string;
}

/** `(chapter × 7 + frame) mod poolSize` (§ 5.6). */
export const poolIndex = (chapter: number, frame: PhotoFrame, size: number): number => (chapter * 7 + FRAME_INDEX[frame]) % size;

/**
 * The four notes for a chapter's photo, in pop-in order (阿嬤, 媽媽, 爸爸, 摩卡; § 2.9 step 5, § 5.6).
 * Frame A: the chapter's row (its Mocha line replaces `mocha.in` / `mocha.out`). B and C: the shared
 * pool, 摩卡's in or out by `mocha`. A chapter without a row uses the pool for every frame.
 */
export function albumNotes(chapter: number, photo: Shot): AlbumNote[] {
  const row = photo.frame === 'A' ? CHAPTER_NOTES[chapter] : undefined;
  return NOTE_SPEAKERS.map((speaker) => {
    if (row !== undefined) return { speaker, text: row[speaker] };
    const pool = speaker === 'mocha' ? (photo.mocha ? NOTE_POOL.mochaIn : NOTE_POOL.mochaOut) : NOTE_POOL[speaker];
    return { speaker, text: pool[poolIndex(chapter, photo.frame, pool.length)] };
  });
}

/** The kept photo for a shot taken at `at` (epoch ms; the caller's clock). */
export const keptPhoto = (shot: Shot, at: number): Photo => ({ frame: shot.frame, mocha: shot.mocha, at });

/** The chapter's spread (page 6), or else its last registered page: the album draws its backdrop. */
export function spreadPage(chapter: number, reg: PageRegistry): PageDef | undefined {
  const pages = reg.pages.filter((p) => p.chapter === chapter);
  return pages.find((p) => p.spread) ?? pages[pages.length - 1];
}

/** The chapter whose album page opens first: the latest chapter with a photo, else chapter 1 (#113 adds the others). */
export function albumHome(photos: Readonly<Record<number, Photo>>): number {
  const chapters = Object.keys(photos).map(Number).filter((c) => c >= 1);
  return chapters.length === 0 ? 1 : Math.max(...chapters);
}
