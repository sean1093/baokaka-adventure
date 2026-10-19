import { describe, expect, test } from 'vitest';
import type { Growth, PageDef, Word } from '../core/types';
import { PAGES, buildRegistry, registry } from '../pages';
import type { StorageLike } from '../../shared/storage';
import {
  DEFAULT_SETTINGS,
  ProgressStore,
  RPG_FAREWELL,
  SAVE_KEY,
  completePage,
  decodeSave,
  earnSticker,
  encodeSave,
  freshSave,
  isChapterUnlocked,
  isStoredSave,
  isUnlocked,
  keepPhoto,
  loadSave,
  migrateSave,
  openPage,
  ownedAbilities,
  packPage,
  pageAbilities,
  resetSave,
  retireRpgSave,
  saveNow,
  unpackPage,
  updateSettings,
  type SaveV1,
  type VisibilitySource,
  type Versioned,
} from './progress';

/**
 * The save (#93, GDD § 2.10, § 3.8): the key, round trips, the guard, migration, unlock rules,
 * owned vs per-page abilities, the store's save triggers, the RPG saves, and storage that is
 * missing or throws. Storage is a fake `StorageLike`; the registry is a synthetic full game.
 */

const fakeStorage = (cells: Record<string, string> = {}) => {
  const writes: string[] = [];
  const storage: StorageLike = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(cells, key) ? cells[key] : null),
    setItem: (key, value) => {
      writes.push(key);
      cells[key] = value;
    },
    removeItem: (key) => {
      delete cells[key];
    },
  };
  return { storage, cells, writes };
};

const angryStorage: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

/** A minimal page: the registry and progress only read id, chapter, index, words, baby and learns. */
const fakePage = (chapter: number, index: number, learns?: { word?: Word; growth?: Growth }): PageDef =>
  ({
    id: chapter === 11 ? 'endp1' : `c${chapter}p${index}`,
    chapter,
    index,
    baby: { start: 'n', facing: 'r' },
    learns: learns && { ...learns, when: { event: 'goal' } },
  }) as unknown as PageDef;

/** The planned game (GDD § 4.2): prologue 0-1…0-4, ten chapters of six, page E — 65 pages. */
const GAME = buildRegistry([
  ...[1, 2, 3, 4].map((i) => fakePage(0, i)),
  ...Array.from({ length: 10 }, (_, c) =>
    [1, 2, 3, 4, 5, 6].map((i) => {
      const chapter = c + 1;
      if (chapter === 1 && i === 3) return fakePage(1, 3, { word: 'beep' });
      if (chapter === 2 && i === 3) return fakePage(2, 3, { word: 'bye' });
      if (chapter === 7 && i === 3) return fakePage(7, 3, { growth: 1 });
      if (chapter === 10 && i === 6) return fakePage(10, 6, { growth: 3 });
      return fakePage(chapter, i);
    }),
  ).flat(),
  fakePage(11, 1),
]);

/** Plays the synthetic game up to (not including) the page with this id. */
function playUntil(id: string, save = freshSave(GAME)): SaveV1 {
  let s = save;
  while (s.furthest !== id) s = completePage(s, s.furthest, {}, GAME);
  return s;
}

describe('the key and a fresh save', () => {
  test('the key is exactly popup.save.v1', () => {
    expect(SAVE_KEY).toBe('popup.save.v1');
    const { storage, cells } = fakeStorage();
    saveNow(freshSave(GAME), storage);
    expect(Object.keys(cells)).toEqual(['popup.save.v1']);
  });

  test('a fresh save starts on the first page with the § 2.11 defaults', () => {
    expect(GAME.pages).toHaveLength(65);
    expect(freshSave(GAME)).toEqual({ v: 1, pages: {}, photos: {}, furthest: 'c0p1', current: 'c0p1', settings: DEFAULT_SETTINGS });
    expect(DEFAULT_SETTINGS).toEqual({
      speed: 1, bigText: false, elder: false, autoHint: 30, sfx: 80, music: 50, vibrate: true, reduceMotion: null, leftHand: false,
    });
    expect(freshSave().furthest).toBe(PAGES[0].id);
  });
});

describe('round trip', () => {
  test('a mid-game save comes back equal', () => {
    let s = playUntil('c1p4');
    s = earnSticker(s, 'c1p2', 'mischief', GAME);
    s = completePage(s, 'c1p1', { tudigong: true, moves: 3 }, GAME);
    s = keepPhoto(s, 1, { frame: 'A', mocha: true, at: 1_760_000_000_000 });
    s = updateSettings(s, { speed: 0, bigText: true, reduceMotion: false });
    s = openPage(s, 'c0p2', GAME);
    const { storage } = fakeStorage();
    saveNow(s, storage);
    expect(loadSave(storage, GAME)).toEqual(s);
  });

  test('page records pack into short codes and back', () => {
    expect(packPage({ solved: true, mischief: true, tudigong: true, bestPar: 12 })).toBe('smt12');
    expect(packPage({ solved: true, bestPar: 0 })).toBe('s0');
    expect(packPage({ tudigong: true })).toBe('t');
    for (const code of ['s', 'm', 't', 'smt', 'st4', 'mt', 's0', 'smt9999']) expect(packPage(unpackPage(code)!)).toBe(code);
    for (const code of ['', 'x', 'ts', 'ms', 'm3', 's01', 's12345', 'S', 'smt-1', ' s']) expect(unpackPage(code)).toBeUndefined();
  });

  test('a complete game (all 65 pages, every sticker, 11 photos) saves under 4 KB', () => {
    let s = freshSave(GAME);
    for (const def of GAME.pages) s = completePage(s, def.id, { mischief: true, tudigong: true, moves: 7 }, GAME);
    for (let c = 1; c <= 11; c++) s = keepPhoto(s, c, { frame: 'C', mocha: true, at: 1_760_000_000_000 + c });
    s = updateSettings(s, { reduceMotion: true, sfx: 100, music: 100 });
    const { storage, cells } = fakeStorage();
    saveNow(s, storage);
    const bytes = new TextEncoder().encode(cells[SAVE_KEY]).length;
    expect(bytes).toBeLessThan(4096);
    expect(Object.keys(s.pages)).toHaveLength(65);
    expect(loadSave(storage, GAME)).toEqual(s);
  });

  test('empty page records are not written', () => {
    const s = { ...freshSave(GAME), pages: { c0p1: {} } };
    expect(encodeSave(s).pages).toEqual({});
  });
});

describe('the guard rejects malformed shapes', () => {
  const good = () => encodeSave(completePage(freshSave(GAME), 'c0p1', { moves: 2 }, GAME)) as unknown as Record<string, unknown>;

  test('a good record passes', () => {
    expect(isStoredSave(good())).toBe(true);
  });

  const cases: [string, (r: Record<string, unknown>) => unknown][] = [
    ['null', () => null],
    ['an array', () => []],
    ['a string', () => 'save'],
    ['no version', (r) => ({ ...r, v: undefined })],
    ['version 0', (r) => ({ ...r, v: 0 })],
    ['version "1"', (r) => ({ ...r, v: '1' })],
    ['pages as an array', (r) => ({ ...r, pages: [] })],
    ['a page record as an object', (r) => ({ ...r, pages: { c0p1: { solved: true } } })],
    ['a bad page code', (r) => ({ ...r, pages: { c0p1: 'solved' } })],
    ['a best without a solve', (r) => ({ ...r, pages: { c0p1: 'm3' } })],
    ['photos missing', (r) => ({ ...r, photos: undefined })],
    ['a photo with a bad frame', (r) => ({ ...r, photos: { 1: { frame: 'D', mocha: false, at: 1 } } })],
    ['a photo without mocha', (r) => ({ ...r, photos: { 1: { frame: 'A', at: 1 } } })],
    ['a photo with a bad time', (r) => ({ ...r, photos: { 1: { frame: 'A', mocha: false, at: -1 } } })],
    ['a photo under a non-chapter key', (r) => ({ ...r, photos: { one: { frame: 'A', mocha: false, at: 1 } } })],
    ['furthest empty', (r) => ({ ...r, furthest: '' })],
    ['current a number', (r) => ({ ...r, current: 3 })],
    ['settings missing', (r) => ({ ...r, settings: undefined })],
    ['speed 3', (r) => ({ ...r, settings: { ...DEFAULT_SETTINGS, speed: 3 } })],
    ['autoHint 20', (r) => ({ ...r, settings: { ...DEFAULT_SETTINGS, autoHint: 20 } })],
    ['sfx 101', (r) => ({ ...r, settings: { ...DEFAULT_SETTINGS, sfx: 101 } })],
    ['music 50.5', (r) => ({ ...r, settings: { ...DEFAULT_SETTINGS, music: 50.5 } })],
    ['reduceMotion "auto"', (r) => ({ ...r, settings: { ...DEFAULT_SETTINGS, reduceMotion: 'auto' } })],
    ['a setting missing', (r) => ({ ...r, settings: { ...DEFAULT_SETTINGS, leftHand: undefined } })],
  ];
  test.each(cases)('rejects %s', (_name, mutate) => {
    expect(isStoredSave(mutate(good()))).toBe(false);
  });

  test.each([
    ['nothing stored', undefined],
    ['malformed JSON', '{"v":1,'],
    ['JSON null', 'null'],
    ['a wrong shape', '{"v":1,"pages":[]}'],
    ['a newer version', JSON.stringify({ ...encodeSave(playUntil('c1p1')), v: 2 })],
    ['an RPG-shaped record', '{"version":6,"run":{}}'],
  ])('%s loads as a fresh save', (_name, raw) => {
    const { storage } = fakeStorage(raw === undefined ? {} : { [SAVE_KEY]: raw });
    expect(loadSave(storage, GAME)).toEqual(freshSave(GAME));
  });

  test('a __proto__ page key is dropped without touching prototypes', () => {
    const raw = JSON.stringify(encodeSave(freshSave(GAME))).replace('"pages":{}', '"pages":{"__proto__":"smt"}');
    const { storage } = fakeStorage({ [SAVE_KEY]: raw });
    const save = loadSave(storage, GAME);
    expect(Object.getPrototypeOf(save.pages)).toBe(Object.prototype);
    expect(Object.keys(save.pages)).toEqual([]);
    expect(({} as Record<string, unknown>).solved).toBeUndefined();
  });
});

describe('the migration hook', () => {
  const v1 = () => encodeSave(playUntil('c1p1')) as unknown as Versioned;

  test('v1 passes through; anything newer with no path is refused', () => {
    expect(migrateSave(v1())).toEqual(v1());
    expect(migrateSave({ ...v1(), v: 2 })).toBeUndefined();
    expect(migrateSave({ v: 'one' })).toBeUndefined();
  });

  test('an old version climbs the ladder one step at a time, then meets the guard', () => {
    const { v: _v, current, ...rest } = v1();
    // A pretend v0 called `current` `resume`; the step from 0 renames it.
    const v0: Versioned = { ...rest, v: 0, resume: current };
    const steps: number[] = [];
    const ladder = {
      0: ({ resume, ...old }: Versioned): Versioned => (steps.push(0), { ...old, v: 1, current: resume }),
    };
    expect(migrateSave(v0, ladder)).toEqual(v1());
    expect(steps).toEqual([0]);
    expect(migrateSave(v0)).toBeUndefined();
  });

  test('an upgrade that throws or goes backwards gives undefined', () => {
    expect(migrateSave({ v: 0 }, { 0: () => { throw new Error('bad'); } })).toBeUndefined();
    expect(migrateSave({ v: 0 }, { 0: () => ({ v: 0 }) })).toBeUndefined();
    expect(migrateSave({ v: 0 }, { 0: () => ({ ...v1() }) })).toEqual(v1());
  });
});

describe('unlock rules', () => {
  test('pages unlock one at a time, across chapters', () => {
    let s = freshSave(GAME);
    expect(isUnlocked(s, 'c0p1', GAME)).toBe(true);
    expect(isUnlocked(s, 'c0p2', GAME)).toBe(false);
    s = completePage(s, 'c0p1', {}, GAME);
    expect(s.furthest).toBe('c0p2');
    expect(s.current).toBe('c0p2');
    expect(isUnlocked(s, 'c0p2', GAME)).toBe(true);
    expect(isUnlocked(s, 'c0p3', GAME)).toBe(false);
    s = playUntil('c0p4', s);
    expect(isChapterUnlocked(s, 1, GAME)).toBe(false);
    s = completePage(s, 'c0p4', {}, GAME);
    expect(s.furthest).toBe('c1p1');
    expect(isChapterUnlocked(s, 1, GAME)).toBe(true);
    expect(isChapterUnlocked(s, 2, GAME)).toBe(false);
    expect(isChapterUnlocked(s, 42, GAME)).toBe(false);
  });

  test('locked and unknown pages cannot be completed, stickered or opened', () => {
    const s = freshSave(GAME);
    expect(completePage(s, 'c1p1', {}, GAME)).toBe(s);
    expect(completePage(s, 'nope', {}, GAME)).toBe(s);
    expect(earnSticker(s, 'c0p2', 'mischief', GAME)).toBe(s);
    expect(openPage(s, 'c0p2', GAME)).toBe(s);
    expect(isUnlocked(s, 'nope', GAME)).toBe(false);
  });

  test('replaying an earlier page keeps furthest and resumes after it', () => {
    let s = playUntil('c2p1');
    s = openPage(s, 'c1p2', GAME);
    expect(s.current).toBe('c1p2');
    s = completePage(s, 'c1p2', { mischief: true, moves: 9 }, GAME);
    expect(s.furthest).toBe('c2p1');
    expect(s.current).toBe('c1p3');
    expect(s.pages.c1p2).toEqual({ solved: true, mischief: true, bestPar: 9 });
  });

  test('stickers are kept forever and the best move count only improves', () => {
    let s = completePage(freshSave(GAME), 'c0p1', { tudigong: true, moves: 5 }, GAME);
    s = completePage(s, 'c0p1', { moves: 8 }, GAME);
    expect(s.pages.c0p1).toEqual({ solved: true, tudigong: true, bestPar: 5 });
    s = completePage(s, 'c0p1', { mischief: true, moves: 3 }, GAME);
    expect(s.pages.c0p1).toEqual({ solved: true, mischief: true, tudigong: true, bestPar: 3 });
    expect(completePage(s, 'c0p1', { moves: -1 }, GAME).pages.c0p1.bestPar).toBe(3);
    expect(completePage(s, 'c0p1', { moves: 2.5 }, GAME).pages.c0p1.bestPar).toBe(3);
  });

  test('a sticker earned mid-page is saved without solving it', () => {
    let s = earnSticker(freshSave(GAME), 'c0p1', 'mischief', GAME);
    expect(s.pages.c0p1).toEqual({ mischief: true });
    expect(s.furthest).toBe('c0p1');
    expect(earnSticker(s, 'c0p1', 'mischief', GAME)).toBe(s);
    s = earnSticker(s, 'c0p1', 'tudigong', GAME);
    expect(s.pages.c0p1).toEqual({ mischief: true, tudigong: true });
  });

  test('the last page stays furthest and current once solved', () => {
    const s = completePage(playUntil('endp1'), 'endp1', {}, GAME);
    expect(s.furthest).toBe('endp1');
    expect(s.current).toBe('endp1');
    expect(s.pages.endp1?.solved).toBe(true);
  });

  test('photos keep the latest per chapter; bad photos change nothing', () => {
    let s = keepPhoto(freshSave(GAME), 1, { frame: 'A', mocha: false, at: 1 });
    s = keepPhoto(s, 1, { frame: 'B', mocha: true, at: 2 });
    expect(s.photos).toEqual({ 1: { frame: 'B', mocha: true, at: 2 } });
    expect(keepPhoto(s, -1, { frame: 'A', mocha: false, at: 1 })).toBe(s);
    expect(keepPhoto(s, 1, { frame: 'Z' as 'A', mocha: false, at: 1 })).toBe(s);
  });

  test('settings: patched, volumes clamped, invalid values refused', () => {
    const s = updateSettings(freshSave(GAME), { elder: true, sfx: 140, music: -3.2 });
    expect(s.settings).toMatchObject({ elder: true, sfx: 100, music: 0 });
    expect(updateSettings(s, { speed: 7 as 0 })).toBe(s);
  });

  test('reset starts over and keeps the settings', () => {
    const s = updateSettings(playUntil('c3p1'), { bigText: true });
    expect(resetSave(s, GAME)).toEqual({ ...freshSave(GAME), settings: s.settings });
  });
});

describe('reconciling a save with the registry', () => {
  test('records of removed pages are dropped; an unknown furthest falls back to the solved point', () => {
    const stored = encodeSave(playUntil('c1p3'));
    stored.pages.c99p1 = 's';
    stored.furthest = 'c99p2';
    stored.current = 'c99p2';
    const s = decodeSave(stored, GAME);
    expect(s.pages.c99p1).toBeUndefined();
    expect(s.furthest).toBe('c1p3');
    expect(s.current).toBe('c1p3');
  });

  test('pages added after the furthest solved one open next (the game grows between visits)', () => {
    const small = buildRegistry([fakePage(0, 1), fakePage(1, 2)]);
    const s = completePage(completePage(freshSave(small), 'c0p1', {}, small), 'c1p2', {}, small);
    expect(s.furthest).toBe('c1p2');
    const grown = buildRegistry([fakePage(0, 1), fakePage(0, 2), fakePage(1, 2), fakePage(1, 3)]);
    const back = decodeSave(encodeSave(s), grown);
    expect(back.furthest).toBe('c1p3');
    expect(isUnlocked(back, 'c0p2', grown)).toBe(true);
  });

  test('a current beyond furthest resumes at furthest', () => {
    const stored = encodeSave(playUntil('c0p3'));
    stored.current = 'c5p1';
    expect(decodeSave(stored, GAME).current).toBe('c0p3');
  });
});

describe('abilities: owned from the furthest point, replays hide later words', () => {
  test('owned words and growth grow with furthest', () => {
    expect(ownedAbilities(playUntil('c1p3'), GAME)).toEqual({ words: [], growth: 0 });
    expect(ownedAbilities(playUntil('c1p4'), GAME)).toEqual({ words: ['beep'], growth: 0 });
    expect(ownedAbilities(playUntil('c7p4'), GAME)).toEqual({ words: ['beep', 'bye'], growth: 1 });
    expect(ownedAbilities(playUntil('endp1'), GAME)).toEqual({ words: ['beep', 'bye'], growth: 3 });
  });

  test('replaying an earlier page plays with its designed words and growth', () => {
    const s = playUntil('c8p1');
    expect(pageAbilities(s, 'c1p2', GAME)).toEqual({ words: [], growth: 0 });
    expect(pageAbilities(s, 'c2p4', GAME)).toEqual({ words: ['beep', 'bye'], growth: 0 });
    expect(pageAbilities(s, 'c1p5', GAME)).toEqual({ words: ['beep'], growth: 0 });
    expect(pageAbilities(s, 'c8p1', GAME)).toEqual({ words: ['beep', 'bye'], growth: 1 });
  });

  test('later words can be shown on request', () => {
    const s = playUntil('c8p1');
    expect(pageAbilities(s, 'c1p5', GAME, { laterWords: true })).toEqual({ words: ['beep', 'bye'], growth: 0 });
    expect(pageAbilities(s, 'nope', GAME)).toBeUndefined();
  });

  test('the real registry: 1-2 plays with no words on a fresh save', () => {
    expect(pageAbilities(freshSave(), 'c1p2')).toEqual({ words: [], growth: 0 });
    expect(registry.pages.map((p) => p.id)).toEqual(PAGES.map((p) => p.id));
  });
});

describe('ProgressStore: the save triggers', () => {
  const fakeDocument = () => {
    const listeners = new Set<() => void>();
    const doc = {
      visibilityState: 'visible',
      addEventListener: (_type: 'visibilitychange', fn: () => void) => void listeners.add(fn),
      removeEventListener: (_type: 'visibilitychange', fn: () => void) => void listeners.delete(fn),
    };
    const set = (state: string) => {
      doc.visibilityState = state;
      for (const fn of listeners) fn();
    };
    return { doc: doc as VisibilitySource, set, listeners };
  };

  test('loads, then writes on page complete, sticker, photo, settings and page open', () => {
    const { storage, cells, writes } = fakeStorage();
    saveNow(playUntil('c0p3'), storage);
    writes.length = 0;
    const store = new ProgressStore({ storage, registry: GAME, visibility: null });
    expect(store.get().furthest).toBe('c0p3');
    let notified = 0;
    store.subscribe(() => notified++);

    store.completePage('c0p3', { moves: 2 });
    store.earnSticker('c0p4', 'tudigong');
    store.keepPhoto(1, { frame: 'A', mocha: false, at: 5 });
    store.updateSettings({ leftHand: true });
    expect(store.openPage('c0p1')).toBe(true);
    expect(writes).toHaveLength(5);
    expect(notified).toBe(5);
    expect(loadSave(storage, GAME)).toEqual(store.get());
    expect(JSON.parse(cells[SAVE_KEY]).pages).toEqual({ c0p1: 's', c0p2: 's', c0p3: 's2', c0p4: 't' });
  });

  test('changes that change nothing write nothing', () => {
    const { storage, writes } = fakeStorage();
    const store = new ProgressStore({ storage, registry: GAME, visibility: null });
    expect(store.openPage('c5p1')).toBe(false);
    store.earnSticker('c5p1', 'mischief');
    store.updateSettings({ speed: 9 as 0 });
    expect(writes).toEqual([]);
  });

  test('writes again when the page goes hidden, and stops listening on dispose', () => {
    const { storage, writes } = fakeStorage();
    const { doc, set, listeners } = fakeDocument();
    const store = new ProgressStore({ storage, registry: GAME, visibility: doc });
    set('visible');
    expect(writes).toEqual([]);
    set('hidden');
    expect(writes).toEqual([SAVE_KEY]);
    store.dispose();
    expect(listeners.size).toBe(0);
  });

  test('reset writes a fresh save that keeps the settings', () => {
    const { storage } = fakeStorage();
    saveNow(updateSettings(playUntil('c2p2'), { bigText: true }), storage);
    const store = new ProgressStore({ storage, registry: GAME, visibility: null });
    store.reset();
    expect(loadSave(storage, GAME)).toEqual({ ...freshSave(GAME), settings: { ...DEFAULT_SETTINGS, bigText: true } });
  });

  test('works with no storage and with a throwing one: nothing persists, nothing throws', () => {
    for (const storage of [null, angryStorage]) {
      const store = new ProgressStore({ storage, registry: GAME, visibility: null });
      expect(store.get()).toEqual(freshSave(GAME));
      expect(() => {
        store.completePage('c0p1');
        store.updateSettings({ speed: 2 });
        store.flush();
        store.reset();
      }).not.toThrow();
      expect(store.get()).toEqual({ ...freshSave(GAME), settings: { ...DEFAULT_SETTINGS, speed: 2 } });
    }
    expect(() => saveNow(freshSave(GAME), angryStorage)).not.toThrow();
    expect(loadSave(angryStorage, GAME)).toEqual(freshSave(GAME));
    expect(loadSave(null, GAME)).toEqual(freshSave(GAME));
  });
});

describe('the RPG saves', () => {
  test('retireRpgSave deletes every RPG key once and says so once', () => {
    const { storage, cells } = fakeStorage({ 'baokaka.quest.v6': '{"version":6}', 'baokaka.quest': '{}', [SAVE_KEY]: 'x', other: 'y' });
    expect(retireRpgSave(storage)).toBe(true);
    expect(cells).toEqual({ [SAVE_KEY]: 'x', other: 'y' });
    expect(retireRpgSave(storage)).toBe(false);
    expect(RPG_FAREWELL).toBe('寶咖咖的新冒險開始了！');
  });

  test('a new player has nothing to retire; no or throwing storage is fine', () => {
    expect(retireRpgSave(fakeStorage().storage)).toBe(false);
    expect(retireRpgSave(null)).toBe(false);
    expect(retireRpgSave(angryStorage)).toBe(false);
  });

  test('an RPG save never leaks into the new save', () => {
    const { storage } = fakeStorage({ 'baokaka.quest.v6': JSON.stringify({ version: 6, run: { chapter: 3 } }) });
    expect(loadSave(storage, GAME)).toEqual(freshSave(GAME));
  });
});
