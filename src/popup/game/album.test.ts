import { describe, expect, test } from 'vitest';
import { registry } from '../pages';
import { ALBUM_COVER, ALBUM_LEAVES, albumHome, albumLeaf, albumLeaves, chapterLeaf, clampLeaf, coverLeaf, flipLeaf, photoChapters } from './album';
import { completePage, earnSticker, freshSave, keepPhoto, type Photo, type SaveV1 } from './progress';
import { GAME_PAGES } from './stickers';

/** The album page model from the save (#113; GDD § 2.9 album screen, § 2.8 rewards). */

const A: Photo = { frame: 'A', mocha: true, at: 1 };
const B: Photo = { frame: 'B', mocha: false, at: 2 };
const fresh = freshSave(registry);
const ALL = registry.pages.map((p) => p.id);
/** Every registered page solved; chapter 1's photo kept. */
const finished = keepPhoto(ALL.reduce((s, id) => completePage(s, id), fresh), 1, A);
/** …and every registered 淘氣 earned. */
const naughty = ALL.reduce((s: SaveV1, id) => earnSticker(s, id, 'mischief'), finished);

describe('leaves', () => {
  test('the cover, then a page for each of the ten chapters', () => {
    const leaves = albumLeaves(fresh);
    expect(leaves).toHaveLength(ALBUM_LEAVES);
    expect(ALBUM_LEAVES).toBe(11);
    expect(leaves[ALBUM_COVER].kind).toBe('cover');
    expect(leaves.slice(1).map((l) => (l.kind === 'chapter' ? l.chapter : -1))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test('a fresh save: every chapter is a placeholder (chapter 1 opens once the prologue is done)', () => {
    expect(albumLeaves(fresh).slice(1).map((l) => (l.kind === 'chapter' ? l.state : ''))).toEqual(Array(10).fill('locked'));
  });

  test('a chapter reached without its photo is open (an empty print); with one, the photo', () => {
    const atChapter1 = ['c0p1', 'c0p2', 'c0p3', 'c0p4'].reduce((s, id) => completePage(s, id), fresh);
    expect(chapterLeaf(atChapter1, 1)).toMatchObject({ state: 'open', photo: null });
    expect(chapterLeaf(finished, 1)).toMatchObject({ state: 'photo', photo: A });
    // The line hasn't reached chapter 7 (not built yet): a placeholder
    expect(chapterLeaf(finished, 7)).toMatchObject({ state: 'locked', photo: null });
  });

  test('a kept photo always shows, whatever the registry holds', () => {
    expect(chapterLeaf(keepPhoto(fresh, 3, B), 3)).toMatchObject({ state: 'photo', photo: B });
  });

  test('a chapter page carries its 6 × 3 sticker grid from the save', () => {
    const s = earnSticker(completePage(finished, 'c1p2', { tudigong: true }), 'c1p2', 'mischief');
    const leaf = chapterLeaf(s, 1);
    expect(leaf.stickers).toHaveLength(6);
    expect(leaf.stickers[1]).toEqual([true, true, true]);
    expect(leaf.stickers[0]).toEqual([true, false, false]);
    expect(chapterLeaf(fresh, 4).stickers).toEqual(Array(6).fill([false, false, false]));
  });

  test('albumLeaf clamps out-of-range leaves', () => {
    expect(albumLeaf(finished, -3).kind).toBe('cover');
    expect(albumLeaf(finished, 99)).toMatchObject({ kind: 'chapter', chapter: 10 });
  });
});

describe('the cover', () => {
  test('the plain cover until every 淘氣 of the game is earned', () => {
    expect(coverLeaf(fresh)).toMatchObject({ mischiefKing: false, mischief: 0, total: GAME_PAGES, latest: null });
    // All the registered pages' 淘氣 is not all the game's 65
    expect(coverLeaf(naughty)).toMatchObject({ mischiefKing: false, mischief: ALL.length, total: 65, latest: 1 });
  });

  test('「淘氣大王」 once every page of the book has its 淘氣 (a book the size of the registry, as fixtures show it)', () => {
    expect(coverLeaf(naughty, registry, ALL.length)).toMatchObject({ mischiefKing: true, mischief: ALL.length });
    // One missing is not enough
    const oneShort: SaveV1 = { ...naughty, pages: { ...naughty.pages, c1p4: { solved: true as const } } };
    expect(coverLeaf(oneShort, registry, ALL.length).mischiefKing).toBe(false);
  });

  test('the cover names the latest chapter photographed', () => {
    expect(coverLeaf(keepPhoto(keepPhoto(fresh, 2, A), 7, B)).latest).toBe(7);
  });
});

describe('opening and paging', () => {
  test('相簿 opens at the latest chapter with a photo, else at the album\'s cover', () => {
    expect(albumHome({})).toBe(ALBUM_COVER);
    expect(albumHome({ 1: A, 3: B })).toBe(3);
    // The ending's photo (a later issue) or junk keys never decide it
    expect(albumHome({ 2: A, 11: B, 0: B })).toBe(2);
    expect(photoChapters({ 4: A, 1: B, 12: A })).toEqual([1, 4]);
  });

  test('one leaf a turn, no wrap-around', () => {
    expect(flipLeaf(0, 1)).toBe(1);
    expect(flipLeaf(5, -1)).toBe(4);
    expect(flipLeaf(0, -1)).toBeNull();
    expect(flipLeaf(ALBUM_LEAVES - 1, 1)).toBeNull();
    expect(clampLeaf(4.4)).toBe(4);
    expect(clampLeaf(-1)).toBe(0);
    expect(clampLeaf(40)).toBe(10);
  });
});
