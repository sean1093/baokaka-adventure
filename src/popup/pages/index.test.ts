import { describe, expect, test } from 'vitest';
import c1p2Fixture from '../core/fixtures/c1p2';
import { solve } from '../core/solver';
import type { PageDef } from '../core/types';
import c0p1 from './c0/p1';
import c1p2 from './c1/p2';
import { buildRegistry, chapterOf, nextPage, pageById, PAGES } from './index';

/** A minimal page shell: only the fields the registry reads matter here. */
const page = (id: string, chapter: number, index: number, extra: Partial<PageDef> = {}): PageDef => ({
  ...c0p1,
  id,
  chapter,
  index,
  ...extra,
  baby: { ...c0p1.baby, ...extra.baby },
});

describe('the registry (PAGES)', () => {
  test('is in play order: the prologue (chapter 0) first, then strictly by chapter and index', () => {
    expect(PAGES[0].chapter).toBe(0);
    for (let i = 1; i < PAGES.length; i++) {
      const [a, b] = [PAGES[i - 1], PAGES[i]];
      expect(b.chapter > a.chapter || (b.chapter === a.chapter && b.index > a.index), `${a.id} → ${b.id}`).toBe(true);
    }
  });

  test('ids are unique and look like cNpK', () => {
    expect(new Set(PAGES.map((p) => p.id)).size).toBe(PAGES.length);
    for (const p of PAGES) expect(p.id).toBe(`c${p.chapter}p${p.index}`);
  });

  test('starts with 0-1 and 1-2', () => {
    expect(PAGES.map((p) => p.id).slice(0, 2)).toEqual(['c0p1', 'c1p2']);
  });

  test('pageById, nextPage and chapterOf', () => {
    expect(pageById('c1p2')?.title).toBe('月台的縫');
    expect(pageById('nope')).toBeUndefined();
    expect(nextPage('c0p1')?.id).toBe('c1p2');   // across chapters
    expect(nextPage(PAGES[PAGES.length - 1].id)).toBeNull();
    expect(nextPage('nope')).toBeNull();
    expect(chapterOf('c0p1')).toBe(0);
    expect(chapterOf('c1p2')).toBe(1);
    expect(chapterOf('nope')).toBeUndefined();
  });

  test('fills in words and growth: nothing is learned before 1-2', () => {
    expect(pageById('c0p1')).toMatchObject({ words: [], baby: { growth: 0 } });
    expect(pageById('c1p2')).toMatchObject({ words: [], baby: { growth: 0 } });
  });
});

describe('buildRegistry', () => {
  const pages = [
    page('c0p3', 0, 3),
    page('c0p4', 0, 4),
    page('c1p1', 1, 1),
    page('c1p3', 1, 3, { learns: { word: 'beep', when: { event: 'beep' } } }),
    page('c1p4', 1, 4),
    page('c3p3', 3, 3, { learns: { word: 'no', when: { event: 'cry' } } }),
    page('c7p3', 7, 3, { learns: { growth: 1, when: { flag: 'stairs' } } }),
    page('c7p4', 7, 4),
    page('c8p1', 8, 1, { words: ['bye'] }),
    page('c9p3', 9, 3, { learns: { growth: 2, when: { flag: 'stand' } } }),
    page('c9p4', 9, 4, { learns: { word: 'beep', when: { event: 'beep' } } }),
    page('c10p1', 10, 1, { baby: { start: 'crib1', facing: 'r', growth: 3 } }),
  ];
  const reg = buildRegistry(pages);
  const of = (id: string) => reg.pageById(id)!;

  test('words default to the words learned on earlier pages, in learning order, without repeats', () => {
    expect(of('c1p1').words).toEqual([]);
    expect(of('c1p3').words).toEqual([]);   // its own word is learned while it is played
    expect(of('c1p4').words).toEqual(['beep']);
    expect(of('c7p4').words).toEqual(['beep', 'no']);
    expect(of('c10p1').words).toEqual(['beep', 'no']);
  });

  test('an explicit words list wins and does not change later defaults', () => {
    expect(of('c8p1').words).toEqual(['bye']);
    expect(of('c9p3').words).toEqual(['beep', 'no']);
  });

  test('growth defaults to the highest growth learned on earlier pages; an explicit one wins', () => {
    expect(of('c7p3').baby.growth).toBe(0);
    expect(of('c7p4').baby.growth).toBe(1);
    expect(of('c9p4').baby.growth).toBe(2);
    expect(of('c10p1').baby.growth).toBe(3);
  });

  test('does not mutate the authored pages', () => {
    expect(pages[4].words).toBeUndefined();
    expect(pages[4].baby.growth).toBeUndefined();
  });

  test('nextPage crosses chapters; chapterOf reads the chapter', () => {
    expect(reg.nextPage('c0p4')?.id).toBe('c1p1');
    expect(reg.nextPage('c1p4')?.id).toBe('c3p3');
    expect(reg.nextPage('c10p1')).toBeNull();
    expect(reg.chapterOf('c7p3')).toBe(7);
  });

  test('rejects duplicate ids and out-of-order pages', () => {
    expect(() => buildRegistry([page('c0p1', 0, 1), page('c0p1', 0, 2)])).toThrow(/duplicate page id 'c0p1'/);
    expect(() => buildRegistry([page('c0p2', 0, 2), page('c0p1', 0, 1)])).toThrow(/'c0p1' \(0-1\) comes after 'c0p2'/);
    expect(() => buildRegistry([page('c1p1', 1, 1), page('c0p4', 0, 4)])).toThrow(/comes after/);
    expect(() => buildRegistry([page('a', 1, 1), page('b', 1, 1)])).toThrow(/comes after/);
    expect(buildRegistry([]).pages).toEqual([]);
  });
});

describe('the first pages (GDD § 4.3)', () => {
  test('0-1 「嬰兒床」 solves in par 1 by pulling the crib rail down', () => {
    const r = solve(pageById('c0p1')!);
    expect(r.par).toBe(1);
    expect(r.solution?.filter((i) => i.t !== 'none')).toEqual([{ t: 'set', part: 'crib-rail', to: 'down' }]);
  });

  test('0-1 has no Mocha, and the 土地公 is always visible', () => {
    expect(c0p1.mocha.start).toBeNull();
    expect(c0p1.perches).toEqual([]);
    expect(c0p1.tudigong.visibleWhen).toBeUndefined();
  });

  test('1-2 「月台的縫」 solves in par 2', () => {
    expect(solve(pageById('c1p2')!).par).toBe(2);
  });

  test('1-2 is the § 3.4 example: the engine fixture with the board states from § 4.3', () => {
    const board = (d: PageDef) => d.parts.find((p) => p.id === 'board')!;
    expect(board(c1p2).states).toEqual(['times', 'flip']);
    const strip = (d: PageDef) => ({ ...d, parts: d.parts.filter((p) => p.id !== 'board') });
    expect(strip(c1p2)).toEqual(strip(c1p2Fixture));
  });
});
