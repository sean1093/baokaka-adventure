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
  test('the cover, then a page for each of the ten chapters, then the 抓周 photo (#135)', () => {
    const leaves = albumLeaves(fresh);
    expect(leaves).toHaveLength(ALBUM_LEAVES);
    expect(ALBUM_LEAVES).toBe(12);
    expect(leaves[ALBUM_COVER].kind).toBe('cover');
    expect(leaves.slice(1).map((l) => (l.kind === 'chapter' ? l.chapter : -1))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  test('the 抓周 photo\'s page: page E\'s, locked until the line reaches home again, then open, then the photo', () => {
    expect(chapterLeaf(fresh, 11)).toMatchObject({ state: 'locked', photo: null });
    expect(chapterLeaf(finished, 11)).toMatchObject({ state: 'open', photo: null, stickers: [[true, false, false]] });
    expect(chapterLeaf(keepPhoto(finished, 11, A), 11)).toMatchObject({ state: 'photo', photo: A });
  });

  test('a fresh save: every chapter is a placeholder (chapter 1 opens once the prologue is done)', () => {
    expect(albumLeaves(fresh).slice(1).map((l) => (l.kind === 'chapter' ? l.state : ''))).toEqual(Array(11).fill('locked'));
  });

  test('a chapter reached without its photo is open (an empty print); with one, the photo', () => {
    const atChapter1 = ['c0p1', 'c0p2', 'c0p3', 'c0p4'].reduce((s, id) => completePage(s, id), fresh);
    expect(chapterLeaf(atChapter1, 1)).toMatchObject({ state: 'open', photo: null });
    expect(chapterLeaf(finished, 1)).toMatchObject({ state: 'photo', photo: A });
    // Every chapter is built (#133): the line has reached chapter 10, its print still empty
    expect(chapterLeaf(finished, 10)).toMatchObject({ state: 'open', photo: null });
    // A chapter the player hasn't reached yet: a placeholder
    expect(chapterLeaf(atChapter1, 10)).toMatchObject({ state: 'locked', photo: null });
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
    expect(albumLeaf(finished, 99)).toMatchObject({ kind: 'chapter', chapter: 11 });
  });
});

describe('the cover', () => {
  test('the plain cover until every 淘氣 of the game is earned', () => {
    expect(coverLeaf(fresh)).toMatchObject({ mischiefKing: false, mischief: 0, total: GAME_PAGES, latest: null });
    // Since page E (#135) the registry is the whole book: every page's 淘氣 is the game's 65
    expect(ALL).toHaveLength(65);
    expect(coverLeaf(naughty)).toMatchObject({ mischiefKing: true, mischief: 65, total: 65, latest: 1 });
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
    // The 抓周 photo is the last leaf (#135); junk keys never decide it
    expect(albumHome({ 2: A, 11: B, 0: B })).toBe(11);
    expect(albumHome({ 2: A, 12: B, 0: B })).toBe(2);
    expect(photoChapters({ 4: A, 1: B, 12: A, 11: B })).toEqual([1, 4, 11]);
  });

  test('one leaf a turn, no wrap-around', () => {
    expect(flipLeaf(0, 1)).toBe(1);
    expect(flipLeaf(5, -1)).toBe(4);
    expect(flipLeaf(0, -1)).toBeNull();
    expect(flipLeaf(ALBUM_LEAVES - 1, 1)).toBeNull();
    expect(clampLeaf(4.4)).toBe(4);
    expect(clampLeaf(-1)).toBe(0);
    expect(clampLeaf(40)).toBe(11);
  });
});
