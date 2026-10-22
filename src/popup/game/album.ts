import { registry as gameRegistry, type PageRegistry } from '../pages';
import { chapterStickers } from './nav';
import { isChapterUnlocked, type Photo, type SaveV1 } from './progress';
import { GAME_PAGES, rewardFlags } from './stickers';

/**
 * The album 「寶咖咖一歲的相簿」 as a book of leaves (GDD § 2.9 album screen, § 2.8 rewards; #113),
 * read off the save. Pure: no React, no DOM.
 *
 * - **Leaf 0 is the cover**: the navy linen board, or the 「淘氣大王」 cover once every 淘氣 sticker of
 *   the game is earned (`rewardFlags(save).mischiefCover`, D-64: read off the save, never stored).
 * - **Leaves 1–10 are the chapters**, one page each: `photo` (the kept photo, its notes and the
 *   chapter's word), `open` (the chapter is reached but its spread's photo isn't taken yet: an empty
 *   print) or `locked` (the 月亮線 hasn't reached it: a placeholder with 「月亮線還沒開到這裡。」).
 *   A kept photo always shows, whatever the registry holds.
 * - **Leaf 11 is the ending's 抓周 photo** (§ 2.8: the album's eleventh photo; § 5.6 row E; #135):
 *   page E's, a chapter page like the others (chapter 11, 尾聲) — his first word printed big.
 *
 * Paging is by one leaf, with no wrap-around: the arrows and a one-finger swipe (`flipLeaf`).
 */

/** The cover's leaf index. */
export const ALBUM_COVER = 0;
/** The chapters with an album page (§ 2.9: ten chapter photos, then the 抓周 photo, page E's, as chapter 11). */
export const ALBUM_CHAPTERS_COUNT = 11;
/** Leaves in the album: the cover and a page per chapter (the 抓周 photo last). */
export const ALBUM_LEAVES = ALBUM_CHAPTERS_COUNT + 1;

/** What a chapter's page shows. */
export type LeafState = 'photo' | 'open' | 'locked';

export interface CoverLeaf {
  readonly kind: 'cover';
  /** Every 淘氣 of the game earned: the 「淘氣大王」 cover (§ 2.8) */
  readonly mischiefKing: boolean;
  /** 淘氣 stickers earned, out of `total` */
  readonly mischief: number;
  readonly total: number;
  /** The chapter of the latest photo (the cover's window shows it), or null before the first */
  readonly latest: number | null;
}

export interface ChapterLeaf {
  readonly kind: 'chapter';
  readonly chapter: number;
  readonly state: LeafState;
  /** The kept photo (`state === 'photo'`), else null */
  readonly photo: Photo | null;
  /** The chapter's 6 × 3 sticker grid: its pages in order, each 解開 / 淘氣 / 土地公 */
  readonly stickers: readonly (readonly [boolean, boolean, boolean])[];
}

export type AlbumLeaf = CoverLeaf | ChapterLeaf;

/** Chapters with a kept photo, in order (only 1–11 have album pages: 11 is the 抓周 photo). */
export function photoChapters(photos: Readonly<Record<number, Photo>>): number[] {
  return Object.keys(photos)
    .map(Number)
    .filter((c) => Number.isInteger(c) && c >= 1 && c <= ALBUM_CHAPTERS_COUNT)
    .sort((a, b) => a - b);
}

/** The leaf the album opens at from the cover's 相簿: the latest chapter with a photo, else the album's cover. */
export function albumHome(photos: Readonly<Record<number, Photo>>): number {
  const chapters = photoChapters(photos);
  return chapters.length === 0 ? ALBUM_COVER : chapters[chapters.length - 1];
}

/** A leaf index clamped into the album. */
export const clampLeaf = (leaf: number): number => Math.max(ALBUM_COVER, Math.min(ALBUM_LEAVES - 1, Math.round(leaf)));

/** The leaf one turn away (`dir` +1: the next, −1: the previous), or null at either end (no wrap). */
export function flipLeaf(leaf: number, dir: 1 | -1): number | null {
  const next = leaf + dir;
  return next < ALBUM_COVER || next >= ALBUM_LEAVES ? null : next;
}

/** One chapter's page, read off the save. */
export function chapterLeaf(save: SaveV1, chapter: number, reg: PageRegistry = gameRegistry): ChapterLeaf {
  const photo = save.photos[chapter] ?? null;
  const state: LeafState = photo !== null ? 'photo' : isChapterUnlocked(save, chapter, reg) ? 'open' : 'locked';
  return { kind: 'chapter', chapter, state, photo, stickers: chapterStickers(save, chapter, reg) };
}

/**
 * The album's cover, read off the save. `total` is the number of pages the 淘氣大王 needs (the whole
 * game's 65; visual QA fixtures pass the registered pages' count to show the cover today).
 */
export function coverLeaf(save: SaveV1, reg: PageRegistry = gameRegistry, total: number = GAME_PAGES): CoverLeaf {
  const flags = rewardFlags(save, reg, total);
  const chapters = photoChapters(save.photos);
  return { kind: 'cover', mischiefKing: flags.mischiefCover, mischief: flags.mischief, total: flags.total, latest: chapters.length === 0 ? null : chapters[chapters.length - 1] };
}

/** The leaf at `leaf` (0: the cover, 1–10: the chapters, 11: the 抓周 photo). */
export function albumLeaf(save: SaveV1, leaf: number, reg: PageRegistry = gameRegistry, total: number = GAME_PAGES): AlbumLeaf {
  const i = clampLeaf(leaf);
  return i === ALBUM_COVER ? coverLeaf(save, reg, total) : chapterLeaf(save, i, reg);
}

/** Every leaf, in order: what the page dots show. */
export function albumLeaves(save: SaveV1, reg: PageRegistry = gameRegistry, total: number = GAME_PAGES): AlbumLeaf[] {
  return Array.from({ length: ALBUM_LEAVES }, (_, i) => albumLeaf(save, i, reg, total));
}
