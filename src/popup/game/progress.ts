import type { Growth, Id, Word } from '../core/types';
import { registry as gameRegistry, type PageRegistry } from '../pages';
import { hadRpgSave, cleanupLegacyStorage } from '../../shared/legacy';
import { browserStorage, loadJson, saveJson, type StorageLike } from '../../shared/storage';
import { elderPatch } from './settings';

/**
 * Progress and the save (GDD § 2.10, § 3.8): `SaveV1` in memory, `popup.save.v1` in storage.
 *
 * - **What is saved:** pages solved and their stickers (淘氣, 土地公) and best move count, the kept
 *   chapter photos, the furthest unlocked page, the page to resume, and the settings (§ 2.11).
 *   Mid-page state is never saved: resuming restarts the current page (R7).
 * - **Unlocks are linear** over the registry's play order, which runs across chapters: a page is
 *   open when it is at or before `furthest`; completing the furthest page opens the next one.
 * - **Abilities** (words, growth) are owned from the furthest learned point (`ownedAbilities`),
 *   but a replayed earlier page plays with its own designed set (`pageAbilities`): later words are
 *   hidden unless asked for, so old puzzles stay as designed (D-55).
 * - **On disk** each page record is packed into a short code (`'smt12'`: solved, 淘氣, 土地公, best
 *   12 moves) so a complete game stays under 4 KB; everything else is stored as `SaveV1` has it
 *   (D-55).
 * - **Never throws:** no storage (private mode), a throwing storage, malformed JSON, a wrong shape
 *   or an unknown version all give a fresh save and the game goes on.
 *
 * The pure functions take the save and return a new one; `ProgressStore` holds the live save and
 * writes it on every change (page complete, sticker, photo, settings, opening a page) and on
 * `visibilitychange: hidden`.
 */

export const SAVE_KEY = 'popup.save.v1';
export const SAVE_VERSION = 1;

/** One page's record. `bestPar` is the fewest moves (non-wait inputs, § 3.7) the player solved it in. */
export interface PageRecord {
  solved?: true;
  mischief?: true;
  tudigong?: true;
  bestPar?: number;
}

export type PhotoFrame = 'A' | 'B' | 'C';

/** A kept album photo (§ 2.9): which frame, whether 摩卡 was in it, and when (epoch ms). */
export interface Photo {
  frame: PhotoFrame;
  mocha: boolean;
  at: number;
}

/**
 * § 2.11. `speed` 0 慢 / 1 普通 / 2 快; `autoHint` in seconds (0 = off); volumes 0–100 %; `reduceMotion`
 * null = follow the system. These are the player's own choices: 長輩模式 (`elder`) never overwrites
 * them, it is applied over them when read (`game/settings.ts` `effectiveSettings`, D-67).
 */
export interface Settings {
  speed: 0 | 1 | 2;
  bigText: boolean;
  elder: boolean;
  autoHint: 0 | 15 | 30;
  sfx: number;
  music: number;
  vibrate: boolean;
  reduceMotion: boolean | null;
  leftHand: boolean;
  /**
   * The gyro tilt (popup art bible § 2.3, #104): off by default, never in 長輩模式. Optional so a
   * save written before #104 still loads (D-67).
   */
  tilt?: boolean;
}

/** GDD § 3.8, exactly. */
export interface SaveV1 {
  v: 1;
  pages: Record<Id, PageRecord>;
  /** chapter → kept photo */
  photos: Record<number, Photo>;
  /** last unlocked page id */
  furthest: Id;
  /** page to resume */
  current: Id;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  speed: 1,
  bigText: false,
  elder: false,
  autoHint: 30,
  sfx: 80,
  music: 50,
  vibrate: true,
  reduceMotion: null,
  leftHand: false,
  tilt: false,
});

/** The record as stored: `SaveV1` with each page record packed into a code (`packPage`). */
export interface StoredV1 extends Omit<SaveV1, 'pages'> {
  pages: Record<Id, string>;
}

// ---------------------------------------------------------------------------------------------
// Fresh save, and the order helpers

/** The first page of the game, or a thrown error for an empty registry (a programming mistake). */
function firstPageId(reg: PageRegistry): Id {
  const first = reg.pages[0];
  if (first === undefined) throw new Error('progress: the page registry is empty');
  return first.id;
}

/** A new game: the first page open and current, nothing earned. Settings default unless given. */
export function freshSave(reg: PageRegistry = gameRegistry, settings: Settings = DEFAULT_SETTINGS): SaveV1 {
  const first = firstPageId(reg);
  return { v: 1, pages: {}, photos: {}, furthest: first, current: first, settings: { ...settings } };
}

/** The page's position in play order, or -1 for an unknown id (or a post-game page: outside the order). */
function orderOf(reg: PageRegistry, id: Id): number {
  return reg.pages.findIndex((p) => p.id === id);
}

/** A post-game page (#135: the bonus page 「象山的日出」), outside the play order. */
const isBonusPage = (reg: PageRegistry, id: Id): boolean => reg.bonus.some((p) => p.id === id);

/**
 * The bonus page 「象山的日出」 is open (GDD § 2.8; #135): every 土地公 of the book's pages is found —
 * the play order's pages only (the bonus page's own never counts), all 65 of them, so a half-built
 * registry never opens it. Read off the save, never stored (D-64).
 */
export function isBonusUnlocked(save: SaveV1, reg: PageRegistry = gameRegistry, total = BOOK_PAGES): boolean {
  if (reg.pages.length < total) return false;
  return reg.pages.every((p) => save.pages[p.id]?.tudigong === true);
}

/** The book's pages (§ 4.2): the prologue's 4, 6 per chapter, page E — what the § 2.8 rewards count. */
export const BOOK_PAGES = 65;

// ---------------------------------------------------------------------------------------------
// The stored form: pack, guard, migrate

const PAGE_CODE = /^(s?)(m?)(t?)(0|[1-9]\d{0,3})?$/;

/** `{ solved, mischief, tudigong, bestPar: 12 }` → `'smt12'`. An empty record packs to ''. */
export function packPage(record: PageRecord): string {
  return `${record.solved ? 's' : ''}${record.mischief ? 'm' : ''}${record.tudigong ? 't' : ''}${record.bestPar ?? ''}`;
}

/** The inverse of `packPage`, or undefined for a malformed code, an empty one, or a best without a solve. */
export function unpackPage(code: string): PageRecord | undefined {
  const m = PAGE_CODE.exec(code);
  if (m === null || code === '') return undefined;
  const [, s, mi, t, best] = m;
  if (best !== undefined && s === '') return undefined;
  const record: PageRecord = {};
  if (s) record.solved = true;
  if (mi) record.mischief = true;
  if (t) record.tudigong = true;
  if (best !== undefined) record.bestPar = Number(best);
  return record;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is Id => typeof value === 'string' && value.length > 0 && value.length <= 32;
const isVolume = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 100;
const CHAPTER_KEY = /^(0|[1-9]\d?)$/;

export function isSettings(value: unknown): value is Settings {
  if (!isRecord(value)) return false;
  const s = value;
  return (
    (s.speed === 0 || s.speed === 1 || s.speed === 2) &&
    typeof s.bigText === 'boolean' &&
    typeof s.elder === 'boolean' &&
    (s.autoHint === 0 || s.autoHint === 15 || s.autoHint === 30) &&
    isVolume(s.sfx) &&
    isVolume(s.music) &&
    typeof s.vibrate === 'boolean' &&
    (s.reduceMotion === null || typeof s.reduceMotion === 'boolean') &&
    typeof s.leftHand === 'boolean' &&
    (s.tilt === undefined || typeof s.tilt === 'boolean')
  );
}

export function isPhoto(value: unknown): value is Photo {
  return (
    isRecord(value) &&
    (value.frame === 'A' || value.frame === 'B' || value.frame === 'C') &&
    typeof value.mocha === 'boolean' &&
    typeof value.at === 'number' &&
    Number.isFinite(value.at) &&
    value.at >= 0
  );
}

/** The type guard run on load (§ 3.8): the stored shape, version 1, every field well formed. */
export function isStoredSave(value: unknown): value is StoredV1 {
  if (!isRecord(value)) return false;
  const { v, pages, photos, furthest, current, settings } = value;
  return (
    v === SAVE_VERSION &&
    isRecord(pages) &&
    Object.entries(pages).every(([id, code]) => isId(id) && typeof code === 'string' && unpackPage(code) !== undefined) &&
    isRecord(photos) &&
    Object.entries(photos).every(([chapter, photo]) => CHAPTER_KEY.test(chapter) && isPhoto(photo)) &&
    isId(furthest) &&
    isId(current) &&
    isSettings(settings)
  );
}

/** Anything with a numeric version stamp; what a migration step reads and writes. */
export type Versioned = { v: number } & Record<string, unknown>;

/**
 * The migration hook (§ 3.8). Each entry upgrades a record **from** that version to the next; a
 * future `SaveV2` adds `1: (old) => ({ ...old, v: 2, … })` here, bumps `SAVE_VERSION`, and keeps
 * the key. Empty while v1 is the only version.
 */
export const UPGRADES: Readonly<Partial<Record<number, (old: Versioned) => Versioned>>> = {};

/**
 * Brings a parsed record up to `SAVE_VERSION` and checks it. Undefined for anything that isn't a
 * versioned object, a version with no upgrade path (including a newer game's save), or a record
 * that fails the guard after upgrading.
 */
export function migrateSave(raw: unknown, upgrades = UPGRADES, target = SAVE_VERSION): StoredV1 | undefined {
  if (!isRecord(raw) || !Number.isInteger(raw.v)) return undefined;
  let record = raw as Versioned;
  try {
    while (record.v < target) {
      const up = upgrades[record.v];
      if (up === undefined) return undefined;
      const next = up(record);
      if (!isRecord(next) || !Number.isInteger(next.v) || next.v <= record.v) return undefined;
      record = next;
    }
  } catch {
    return undefined;
  }
  return record.v === target && isStoredSave(record) ? record : undefined;
}

/** The stored form of a save. Empty page records are dropped. */
export function encodeSave(save: SaveV1): StoredV1 {
  const pages: Record<Id, string> = {};
  for (const [id, record] of Object.entries(save.pages)) {
    const code = packPage(record);
    if (code !== '') pages[id] = code;
  }
  return { v: 1, pages, photos: save.photos, furthest: save.furthest, current: save.current, settings: save.settings };
}

/**
 * A stored save back in memory, made consistent with the registry: records of pages that no
 * longer exist are dropped; `furthest` is at least the page after the last one solved (pages
 * added since stay linear) and falls back to that, or the first page, when unknown; `current`
 * must be an unlocked page, else it becomes `furthest`.
 */
export function decodeSave(stored: StoredV1, reg: PageRegistry = gameRegistry): SaveV1 {
  const pages: Record<Id, PageRecord> = {};
  let reached = 0;
  for (const [id, code] of Object.entries(stored.pages)) {
    const i = orderOf(reg, id);
    const record = unpackPage(code);
    if (record === undefined) continue;
    // A post-game page keeps its record; it is outside the order (#135)
    if (i < 0) {
      if (isBonusPage(reg, id)) pages[id] = record;
      continue;
    }
    pages[id] = record;
    if (record.solved) reached = Math.max(reached, Math.min(i + 1, reg.pages.length - 1));
  }
  const photos: Record<number, Photo> = {};
  for (const [chapter, photo] of Object.entries(stored.photos)) {
    photos[Number(chapter)] = { frame: photo.frame, mocha: photo.mocha, at: photo.at };
  }
  const furthestAt = Math.max(orderOf(reg, stored.furthest), reached);
  const furthest = reg.pages[furthestAt]?.id ?? firstPageId(reg);
  const currentAt = orderOf(reg, stored.current);
  const current = currentAt >= 0 && currentAt <= furthestAt ? stored.current : furthest;
  return { v: 1, pages, photos, furthest, current, settings: { ...stored.settings } };
}

/** `loadJson` only parses here; `migrateSave` does the checking, after any upgrade. */
const isAnything = (_value: unknown): _value is unknown => true;

/**
 * Reads the save. A missing, unreadable, malformed or unknown-version record, or no storage at all,
 * gives a fresh save: nothing throws, and nothing is written until the next save trigger.
 */
export function loadSave(storage: StorageLike | null = browserStorage(), reg: PageRegistry = gameRegistry): SaveV1 {
  const raw = loadJson(SAVE_KEY, isAnything, storage);
  const stored = migrateSave(raw);
  return stored === undefined ? freshSave(reg) : decodeSave(stored, reg);
}

/** Writes the save. Without storage, or with a full or refusing one, it silently doesn't persist. */
export function saveNow(save: SaveV1, storage: StorageLike | null = browserStorage()): void {
  saveJson(SAVE_KEY, encodeSave(save), storage);
}

// ---------------------------------------------------------------------------------------------
// Progress rules (pure: each returns a new save, or the same one when nothing changes)

/**
 * Whether a page can be played: it exists and is at or before the furthest unlocked page — or it is
 * a post-game page whose reward is earned (#135: 「象山的日出」, every 土地公).
 */
export function isUnlocked(save: SaveV1, id: Id, reg: PageRegistry = gameRegistry): boolean {
  if (isBonusPage(reg, id)) return isBonusUnlocked(save, reg);
  const i = orderOf(reg, id);
  return i >= 0 && i <= orderOf(reg, save.furthest);
}

/** Whether a chapter is open (its first page is unlocked). Chapters unlock in order. */
export function isChapterUnlocked(save: SaveV1, chapter: number, reg: PageRegistry = gameRegistry): boolean {
  const first = reg.pages.find((p) => p.chapter === chapter);
  return first !== undefined && isUnlocked(save, first.id, reg);
}

/** How a page was completed: stickers earned during the attempt and the moves it took. */
export interface PageResult {
  mischief?: boolean;
  tudigong?: boolean;
  /** non-wait inputs used (§ 3.7); kept as `bestPar` when it beats the record */
  moves?: number;
}

/**
 * A page completed (a save trigger): solved, plus any stickers from the attempt, and the best move
 * count. Completing the furthest page unlocks the next one; the page to resume becomes the next
 * page (or this one, after the last). A locked or unknown page changes nothing.
 */
export function completePage(save: SaveV1, id: Id, result: PageResult = {}, reg: PageRegistry = gameRegistry): SaveV1 {
  if (!isUnlocked(save, id, reg)) return save;
  const old = save.pages[id] ?? {};
  const record: PageRecord = { ...old, solved: true };
  if (result.mischief) record.mischief = true;
  if (result.tudigong) record.tudigong = true;
  const moves = result.moves;
  if (moves !== undefined && Number.isInteger(moves) && moves >= 0 && moves <= 9999) {
    record.bestPar = old.bestPar === undefined ? moves : Math.min(old.bestPar, moves);
  }
  // A post-game page is outside the order: solving it moves neither `furthest` nor the page to resume (#135)
  if (isBonusPage(reg, id)) return { ...save, pages: { ...save.pages, [id]: record } };
  const next = reg.nextPage(id);
  const nextId = next?.id ?? id;
  const furthest = orderOf(reg, nextId) > orderOf(reg, save.furthest) ? nextId : save.furthest;
  return { ...save, pages: { ...save.pages, [id]: record }, furthest, current: nextId };
}

export type Sticker = 'mischief' | 'tudigong';

/** A sticker earned mid-page (a save trigger; 淘氣 is awarded at once, even unfinished, § 2.8). */
export function earnSticker(save: SaveV1, id: Id, sticker: Sticker, reg: PageRegistry = gameRegistry): SaveV1 {
  if (!isUnlocked(save, id, reg) || save.pages[id]?.[sticker]) return save;
  return { ...save, pages: { ...save.pages, [id]: { ...save.pages[id], [sticker]: true } } };
}

/** A photo kept for a chapter's album page (a save trigger). Replaces the chapter's last one. */
export function keepPhoto(save: SaveV1, chapter: number, photo: Photo): SaveV1 {
  if (!CHAPTER_KEY.test(String(chapter)) || !isPhoto(photo)) return save;
  return { ...save, photos: { ...save.photos, [chapter]: { frame: photo.frame, mocha: photo.mocha, at: photo.at } } };
}

/**
 * Changed settings (a save trigger). Volumes are rounded and clamped to 0–100; an invalid result
 * changes nothing. While 長輩模式 is on (and stays on) the settings it holds (速度, 字的大小, 自動提示)
 * keep the player's own values: the patch's changes to them are dropped (`elderPatch`, D-67).
 */
export function updateSettings(save: SaveV1, patch: Partial<Settings>): SaveV1 {
  const settings = { ...save.settings, ...elderPatch(save.settings, patch) };
  settings.sfx = Math.min(100, Math.max(0, Math.round(settings.sfx)));
  settings.music = Math.min(100, Math.max(0, Math.round(settings.music)));
  const same = (Object.keys(settings) as (keyof Settings)[]).every((k) => settings[k] === save.settings[k]);
  return isSettings(settings) && !same ? { ...save, settings } : save;
}

/** A page opened from the 目錄 or the cover: it becomes the page to resume. Locked pages can't be opened. */
export function openPage(save: SaveV1, id: Id, reg: PageRegistry = gameRegistry): SaveV1 {
  // A post-game page never becomes the page 「繼續」 opens (#135)
  return save.current === id || !isUnlocked(save, id, reg) || isBonusPage(reg, id) ? save : { ...save, current: id };
}

/** 設定 → 「重新開始」 (the 3-second hold is #104's UI): a new game that keeps the settings (D-55). */
export function resetSave(save: SaveV1, reg: PageRegistry = gameRegistry): SaveV1 {
  return freshSave(reg, save.settings);
}

/** What Baokaka knows: words in the order learned and his growth stage. */
export interface Abilities {
  words: Word[];
  growth: Growth;
}

/**
 * The abilities owned, from the furthest learned point (§ 2.10): every page before `furthest`, and
 * any solved page (the furthest itself once the game's last page is solved), taught its `learns`.
 */
export function ownedAbilities(save: SaveV1, reg: PageRegistry = gameRegistry): Abilities {
  const furthestAt = orderOf(reg, save.furthest);
  const words: Word[] = [];
  let growth: Growth = 0;
  reg.pages.forEach((def, i) => {
    if (i >= furthestAt && !save.pages[def.id]?.solved) return;
    const learned = def.learns;
    if (learned?.word !== undefined && !words.includes(learned.word)) words.push(learned.word);
    if (learned?.growth !== undefined && learned.growth > growth) growth = learned.growth;
  });
  return { words, growth };
}

/**
 * The abilities a page plays with: its designed words (by default, those learned before it, from
 * the registry) and its designed growth. A replayed earlier page hides words learned later unless
 * `laterWords` is set; growth always stays as designed, the state the solver proved (D-55).
 * Undefined for an unknown page.
 */
export function pageAbilities(save: SaveV1, id: Id, reg: PageRegistry = gameRegistry, options: { laterWords?: boolean } = {}): Abilities | undefined {
  const def = reg.pageById(id);
  if (def === undefined) return undefined;
  const designed = def.words ?? [];
  const words = options.laterWords ? [...designed, ...ownedAbilities(save, reg).words.filter((w) => !designed.includes(w))] : [...designed];
  return { words, growth: def.baby.growth ?? 0 };
}

// ---------------------------------------------------------------------------------------------
// The RPG's old saves (#109 calls this at the routing switch)

/** The one-time line the cover shows when an RPG save was found and discarded (§ 2.10). */
export const RPG_FAREWELL = '寶咖咖的新冒險開始了！';

/**
 * Deletes the RPG saves and says whether there were any, so the cover can show `RPG_FAREWELL`
 * once: the next boot finds none. Not called before #109 — the RPG is still routed until then.
 */
export function retireRpgSave(storage: StorageLike | null = browserStorage()): boolean {
  const had = hadRpgSave(storage);
  if (had) cleanupLegacyStorage(storage, { rpg: true });
  return had;
}

// ---------------------------------------------------------------------------------------------
// The live store

/** What the store listens to for `visibilitychange` (the `document`, or a fake in tests). */
export interface VisibilitySource {
  readonly visibilityState: string;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

export interface ProgressStoreOptions {
  storage?: StorageLike | null;
  registry?: PageRegistry;
  /** Defaults to `document` in a browser; null to not listen */
  visibility?: VisibilitySource | null;
}

/**
 * The live save. Loads on construction; every change that alters the save writes it at once (the
 * § 2.10 triggers), and the page going hidden writes it again as a safety net. Subscribe for
 * `useSyncExternalStore`.
 */
export class ProgressStore {
  private save: SaveV1;
  private readonly storage: StorageLike | null;
  private readonly reg: PageRegistry;
  private readonly visibility: VisibilitySource | null;
  private readonly listeners = new Set<() => void>();
  private readonly onVisibility = (): void => {
    if (this.visibility?.visibilityState === 'hidden') this.flush();
  };

  constructor(options: ProgressStoreOptions = {}) {
    this.storage = options.storage === undefined ? browserStorage() : options.storage;
    this.reg = options.registry ?? gameRegistry;
    this.visibility = options.visibility === undefined ? (typeof document === 'undefined' ? null : document) : options.visibility;
    this.save = loadSave(this.storage, this.reg);
    this.visibility?.addEventListener('visibilitychange', this.onVisibility);
  }

  readonly get = (): SaveV1 => this.save;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  /** Writes the current save now. */
  flush(): void {
    saveNow(this.save, this.storage);
  }

  completePage(id: Id, result?: PageResult): void {
    this.commit(completePage(this.save, id, result, this.reg));
  }

  earnSticker(id: Id, sticker: Sticker): void {
    this.commit(earnSticker(this.save, id, sticker, this.reg));
  }

  keepPhoto(chapter: number, photo: Photo): void {
    this.commit(keepPhoto(this.save, chapter, photo));
  }

  updateSettings(patch: Partial<Settings>): void {
    this.commit(updateSettings(this.save, patch));
  }

  /** Returns whether the page is open (and now current). */
  openPage(id: Id): boolean {
    this.commit(openPage(this.save, id, this.reg));
    return this.save.current === id;
  }

  /** 「重新開始」: a new game with the same settings, written at once. */
  reset(): void {
    this.commit(resetSave(this.save, this.reg), true);
  }

  /** Stops listening for `visibilitychange`. */
  dispose(): void {
    this.visibility?.removeEventListener('visibilitychange', this.onVisibility);
    this.listeners.clear();
  }

  private commit(next: SaveV1, force = false): void {
    if (next === this.save && !force) return;
    this.save = next;
    this.flush();
    for (const listener of [...this.listeners]) listener();
  }
}
