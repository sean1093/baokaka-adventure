import { describe, expect, test } from 'vitest';
import type { PageDef } from '../core/types';
import { buildRegistry, registry } from '../pages';
import { COVER, chapterStickers, holdsPage, homeChapter, opensChapter, isFirstLaunch, navigate, pageStickers, resumeTarget, stationOf, treasuresFound, type NavAction, type NavState } from './nav';
import { completePage, freshSave, openPage, type SaveV1 } from './progress';

/** The navigation state machine (#97; GDD § 2.13): cover → page → menu → contents, and the resume target. */

const fresh = freshSave(registry);
const played = ['c0p1', 'c0p2', 'c0p3', 'c0p4', 'c1p1'].reduce((s, id) => completePage(s, id), fresh); // the prologue and 1-1 solved, 1-2 current

const run = (save: SaveV1, ...actions: NavAction[]): NavState => actions.reduce((s, a) => navigate(s, a, save), COVER);

describe('resume', () => {
  test('a fresh save resumes the first page and is a first launch', () => {
    expect(resumeTarget(fresh)).toBe('c0p1');
    expect(isFirstLaunch(fresh)).toBe(true);
  });

  test('a saved game is not a first launch and resumes its current page', () => {
    expect(isFirstLaunch(played)).toBe(false);
    expect(resumeTarget(played)).toBe('c1p2');
    // A replay from the 目錄 makes an earlier page current (still not a first launch)
    expect(resumeTarget(openPage(played, 'c0p1'))).toBe('c0p1');
  });

  test('cover → 繼續 → the current page in one tap (R7: ≤ 2)', () => {
    const s = run(played, { t: 'resume' });
    expect(s).toEqual({ base: { kind: 'page', id: 'c1p2', run: 0 }, layer: null });
  });

  test('an unknown or locked current page falls back to the furthest one', () => {
    expect(resumeTarget({ ...played, current: 'nope' })).toBe('c1p2');
    expect(resumeTarget({ ...fresh, current: 'c1p2' })).toBe('c0p1');
  });

  test('the 目錄 opens at the chapter of the page to resume', () => {
    expect(homeChapter(fresh)).toBe(0);
    expect(homeChapter(played)).toBe(1);
  });
});

describe('navigate', () => {
  test('cover → page → menu → contents → back to the page, held while the layers are open', () => {
    let s = run(played, { t: 'resume' });
    expect(holdsPage(s)).toBe(false);
    s = navigate(s, { t: 'menu' }, played);
    expect(s.layer).toEqual({ kind: 'menu' });
    expect(holdsPage(s)).toBe(true);
    s = navigate(s, { t: 'contents' }, played);
    expect(s).toEqual({ base: { kind: 'page', id: 'c1p2', run: 0 }, layer: { kind: 'contents', chapter: 1 } });
    expect(holdsPage(s)).toBe(true);
    s = navigate(s, { t: 'close' }, played);
    expect(s).toEqual({ base: { kind: 'page', id: 'c1p2', run: 0 }, layer: null });
  });

  test('the menu: 繼續 closes it, 封面 goes to the cover, 設定 opens the settings', () => {
    const menu = run(played, { t: 'resume' }, { t: 'menu' });
    expect(navigate(menu, { t: 'resume' }, played).layer).toBeNull();
    expect(navigate(menu, { t: 'cover' }, played)).toBe(COVER);
    expect(navigate(menu, { t: 'settings' }, played).layer).toEqual({ kind: 'settings' });
  });

  test('the menu opens only over a page with nothing else open', () => {
    expect(run(played, { t: 'menu' })).toBe(COVER);
    const contents = run(played, { t: 'contents' });
    expect(navigate(contents, { t: 'menu' }, played)).toBe(contents);
  });

  test('the 目錄 from the cover: stations, a locked station, a replay', () => {
    let s = run(played, { t: 'contents' });
    expect(s).toEqual({ base: { kind: 'cover' }, layer: { kind: 'contents', chapter: 1 } });
    s = navigate(s, { t: 'station', chapter: 0 }, played);
    expect(s.layer).toEqual({ kind: 'contents', chapter: 0 });
    // A station the 月亮線 hasn't reached: the strip stays, the locked line shows
    s = navigate(s, { t: 'station', chapter: 4 }, played);
    expect(s.layer).toEqual({ kind: 'contents', chapter: 0, locked: 4 });
    s = navigate(s, { t: 'play', id: 'c0p1' }, played);
    expect(s).toEqual({ base: { kind: 'page', id: 'c0p1', run: 0 }, layer: null });
  });

  test('locked or unknown pages cannot be played', () => {
    const s = run(fresh, { t: 'contents' });
    expect(navigate(s, { t: 'play', id: 'c1p2' }, fresh)).toBe(s);
    expect(navigate(s, { t: 'play', id: 'nope' }, fresh)).toBe(s);
  });

  test('重來 and replaying the same page remount it (run + 1)', () => {
    let s = run(played, { t: 'resume' }, { t: 'retry' });
    expect(s.base).toEqual({ kind: 'page', id: 'c1p2', run: 1 });
    s = navigate(navigate(s, { t: 'contents' }, played), { t: 'play', id: 'c1p2' }, played);
    expect(s.base).toEqual({ kind: 'page', id: 'c1p2', run: 2 });
    expect(run(played, { t: 'retry' })).toBe(COVER);
  });

  test('a completed page opens the next; after the last, the 目錄 on the cover', () => {
    const s = run(fresh, { t: 'resume' });
    expect(navigate(s, { t: 'next', id: 'c1p2' }, played)).toEqual({ base: { kind: 'page', id: 'c1p2', run: 0 }, layer: null });
    const last = run(played, { t: 'resume' });
    expect(navigate(last, { t: 'next', id: null }, played)).toEqual({ base: { kind: 'cover' }, layer: { kind: 'contents', chapter: 1 } });
  });

  test('album and settings open over whatever is there and close back to it', () => {
    const s = run(played, { t: 'album' });
    expect(s.layer).toEqual({ kind: 'album' });
    expect(navigate(s, { t: 'close' }, played)).toEqual(COVER);
    expect(navigate(COVER, { t: 'close' }, played)).toBe(COVER);
    // #113: the album can open at a leaf (0 the cover, 1–10 the chapters)
    expect(run(played, { t: 'album', leaf: 0 }).layer).toEqual({ kind: 'album', leaf: 0 });
  });

  test('#113: the bonus station opens its panel in the 目錄 only; a station tap leaves it', () => {
    const contents = run(played, { t: 'contents' });
    const bonus = navigate(contents, { t: 'bonus' }, played);
    expect(bonus.layer).toEqual({ kind: 'contents', chapter: 1, bonus: true });
    expect(navigate(bonus, { t: 'station', chapter: 0 }, played).layer).toEqual({ kind: 'contents', chapter: 0 });
    expect(navigate(COVER, { t: 'bonus' }, played)).toBe(COVER);
  });

  test('a custom registry: resume follows its order', () => {
    const page = (id: string, chapter: number, index: number) => ({ ...registry.pages[0], id, chapter, index }) as PageDef;
    const reg = buildRegistry([page('a', 0, 1), page('b', 0, 2)]);
    const save = completePage(freshSave(reg), 'a', {}, reg);
    expect(resumeTarget(save, reg)).toBe('b');
    expect(isFirstLaunch(freshSave(reg), reg)).toBe(true);
  });
});

describe('opensChapter (#102: the chapter card comes first)', () => {
  test('a chapter\'s first registered page opens it; the others and unknown ids do not', () => {
    expect(opensChapter('c0p1', registry)).toBe(true);
    // 1-1 opens chapter 1 (#107); 1-2 no longer does
    expect(opensChapter('c1p1', registry)).toBe(true);
    expect(opensChapter('c1p2', registry)).toBe(false);
    const page = (id: string, chapter: number, index: number) => ({ ...registry.pageById('c0p1')!, id, chapter, index });
    const reg = buildRegistry([page('c0p1', 0, 1), page('c0p2', 0, 2), page('c1p1', 1, 1)]);
    expect(opensChapter('c0p2', reg)).toBe(false);
    expect(opensChapter('c1p1', reg)).toBe(true);
    expect(opensChapter('nope', reg)).toBe(false);
  });
});

describe('the HUD and the bar read the save', () => {
  test('treasures are solved spreads (page 6), at most 9', () => {
    expect(treasuresFound(fresh)).toBe(0);
    const pages = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`c${i + 1}p6`, { solved: true as const }]));
    expect(treasuresFound({ ...fresh, pages: { ...pages, c1p5: { solved: true } } })).toBe(9);
    expect(treasuresFound({ ...fresh, pages: { c1p6: { solved: true }, c2p6: { mischief: true } } })).toBe(1);
  });

  test('a chapter’s stickers for the album grid (#103): its six pages in order, by registered index', () => {
    const save = { ...fresh, pages: { c1p2: { solved: true as const, mischief: true as const }, c1p6: { tudigong: true as const } } };
    const grid = chapterStickers(save, 1);
    expect(grid).toHaveLength(6);
    expect(grid[1]).toEqual([true, true, false]);
    expect(grid[5]).toEqual([false, false, true]);
    expect(grid[0]).toEqual([false, false, false]);
    // The prologue has four pages
    expect(chapterStickers(fresh, 0)).toHaveLength(4);
    // A registered page with that index is read by its own id
    const spread = { ...registry.pageById('c1p6')!, id: 'other-spread' } as PageDef;
    const reg = buildRegistry(registry.pages.map((p) => (p.id === 'c1p6' ? spread : p)));
    expect(chapterStickers({ ...fresh, pages: { 'other-spread': { solved: true } } }, 1, reg)[5]).toEqual([true, false, false]);
  });

  test('a page’s stickers', () => {
    expect(pageStickers(fresh, 'c0p1')).toEqual([false, false, false]);
    expect(pageStickers({ ...fresh, pages: { c0p1: { solved: true, tudigong: true } } }, 'c0p1')).toEqual([true, false, true]);
  });

  test('page E (#135): after 10-6 the next page is 尾聲\'s; the 目錄 lists it on 家, its station', () => {
    expect(registry.nextPage('c10p6')?.id).toBe('c11p1');
    expect(registry.nextPage('c11p1')).toBeNull();
    expect(stationOf(11)).toBe(0);
    expect(stationOf(10)).toBe(10);
    const atE = { ...fresh, furthest: 'c11p1', current: 'c11p1' };
    expect(homeChapter(atE)).toBe(0);
    // Done with page E: the 目錄 at 家
    expect(navigate({ base: { kind: 'page', id: 'c11p1', run: 0 }, layer: null }, { t: 'next', id: null }, atE).layer).toEqual({ kind: 'contents', chapter: 0 });
  });
});
