import { chapterInfo } from '../content/chapters';
import type { Id } from '../core/types';
import { registry as gameRegistry, type PageRegistry } from '../pages';
import { isChapterUnlocked, isUnlocked, type SaveV1 } from './progress';

/**
 * Where the player is (GDD § 2.13 screens and flow; #97): a pure state machine the shell
 * (`PopupGame.tsx`) renders. No React, no DOM.
 *
 * - **The base** is what lies on 阿嬤's table: the cover (the closed book) or a page being played.
 *   `run` counts restarts of the same page (重來, a replay from the 目錄), so the view remounts it
 *   from its initial state (mid-page state is never saved, § 2.10).
 * - **The layer** is what is open over it: the pause menu (選單), the 目錄, the album or the
 *   settings. While any layer is open over a page, the page's session is held (§ 2.6: "a menu is
 *   open"), and closing the layer resumes it where it was.
 *
 * Resume is ≤ 2 taps (R7, § 1.2): the cover's 「繼續」 opens `save.current` directly.
 */

export type Base = { readonly kind: 'cover' } | { readonly kind: 'page'; readonly id: Id; readonly run: number };

export type Layer =
  | null
  | { readonly kind: 'menu' }
  | { readonly kind: 'contents'; readonly chapter: number; readonly locked?: number }
  | { readonly kind: 'album' }
  | { readonly kind: 'settings' };

export interface NavState {
  readonly base: Base;
  readonly layer: Layer;
}

export type NavAction =
  /** The cover's 「繼續」 (or 「開始」 on first launch), the menu's 「繼續」 */
  | { readonly t: 'resume' }
  /** Open the 目錄 at a chapter (default: the chapter of the page to resume) */
  | { readonly t: 'contents'; readonly chapter?: number }
  /** A station on the 月亮線 map; a locked one shows 「月亮線還沒開到這裡。」 */
  | { readonly t: 'station'; readonly chapter: number }
  /** A page in the 目錄's strip (a replay, or the page to resume); locked pages do nothing */
  | { readonly t: 'play'; readonly id: Id }
  | { readonly t: 'album' }
  | { readonly t: 'settings' }
  /** The bottom bar's 「選單」 */
  | { readonly t: 'menu' }
  /** Close whatever layer is open (the scrim, 「返回」) */
  | { readonly t: 'close' }
  /** The menu's 「封面」, the 目錄's 「封面」 */
  | { readonly t: 'cover' }
  /** The bottom bar's 「重來」: the page from its initial state */
  | { readonly t: 'retry' }
  /** The page was completed: open the next one (null after the last registered page: the 目錄) */
  | { readonly t: 'next'; readonly id: Id | null };

export const COVER: NavState = { base: { kind: 'cover' }, layer: null };

/** The page 「繼續」 opens: the save's current page if it is playable, else the furthest unlocked one. */
export function resumeTarget(save: SaveV1, reg: PageRegistry = gameRegistry): Id {
  if (reg.pageById(save.current) && isUnlocked(save, save.current, reg)) return save.current;
  return reg.pageById(save.furthest) ? save.furthest : (reg.pages[0]?.id ?? save.current);
}

/**
 * First launch: nothing played yet (no page record, still on the first page). The cover then shows
 * only 「開始」 (§ 2.13).
 */
export function isFirstLaunch(save: SaveV1, reg: PageRegistry = gameRegistry): boolean {
  const first = reg.pages[0]?.id;
  return Object.keys(save.pages).length === 0 && save.current === first && save.furthest === first;
}

/**
 * Whether opening this page opens its chapter: it is the chapter's first registered page (GDD
 * § 2.13: the chapter card comes before it; #102). Until a chapter's page 1 is built its first
 * registered page stands in.
 */
export function opensChapter(id: Id, reg: PageRegistry = gameRegistry): boolean {
  const chapter = reg.chapterOf(id);
  return chapter !== undefined && reg.pages.find((p) => p.chapter === chapter)?.id === id;
}

/** The chapter the 目錄 opens at: the chapter of the page to resume. */
export function homeChapter(save: SaveV1, reg: PageRegistry = gameRegistry): number {
  return reg.chapterOf(resumeTarget(save, reg)) ?? 0;
}

const page = (id: Id, run = 0): Base => ({ kind: 'page', id, run });

/**
 * The next state. Actions that make no sense where the player is (a page that is locked, 「重來」 on
 * the cover) return the same state object.
 */
export function navigate(state: NavState, action: NavAction, save: SaveV1, reg: PageRegistry = gameRegistry): NavState {
  const { base, layer } = state;
  switch (action.t) {
    case 'resume': {
      if (base.kind === 'page' && layer !== null) return { base, layer: null };
      const id = resumeTarget(save, reg);
      if (base.kind === 'page' && base.id === id) return layer === null ? state : { base, layer: null };
      return { base: page(id), layer: null };
    }
    case 'contents':
      return { base, layer: { kind: 'contents', chapter: action.chapter ?? homeChapter(save, reg) } };
    case 'station': {
      if (layer?.kind !== 'contents') return state;
      if (!isChapterUnlocked(save, action.chapter, reg)) return { base, layer: { kind: 'contents', chapter: layer.chapter, locked: action.chapter } };
      return { base, layer: { kind: 'contents', chapter: action.chapter } };
    }
    case 'play': {
      if (reg.pageById(action.id) === undefined || !isUnlocked(save, action.id, reg)) return state;
      const run = base.kind === 'page' && base.id === action.id ? base.run + 1 : 0;
      return { base: page(action.id, run), layer: null };
    }
    case 'album':
      return { base, layer: { kind: 'album' } };
    case 'settings':
      return { base, layer: { kind: 'settings' } };
    case 'menu':
      return base.kind === 'page' && layer === null ? { base, layer: { kind: 'menu' } } : state;
    case 'close':
      return layer === null ? state : { base, layer: null };
    case 'cover':
      return base.kind === 'cover' && layer === null ? state : COVER;
    case 'retry':
      return base.kind === 'page' ? { base: page(base.id, base.run + 1), layer: null } : state;
    case 'next':
      if (action.id === null || reg.pageById(action.id) === undefined) {
        return { base: COVER.base, layer: { kind: 'contents', chapter: base.kind === 'page' ? (reg.chapterOf(base.id) ?? 0) : homeChapter(save, reg) } };
      }
      return { base: page(action.id), layer: null };
  }
}

/** Whether the page's session must be held: something is open over it (§ 2.6). */
export const holdsPage = (state: NavState): boolean => state.base.kind === 'page' && state.layer !== null;

/** Treasures found (the HUD's 抓周 tray): chapters whose spread, page 6, is solved (§ 2.9). At most 9 coins. */
export function treasuresFound(save: SaveV1): number {
  let n = 0;
  for (let chapter = 1; chapter <= 10; chapter++) if (save.pages[`c${chapter}p6`]?.solved) n++;
  return Math.min(9, n);
}

/** A page's stickers so far, in the bar's order: 解開, 淘氣, 土地公. */
export function pageStickers(save: SaveV1, id: Id): [boolean, boolean, boolean] {
  const r = save.pages[id];
  return [r?.solved === true, r?.mischief === true, r?.tudigong === true];
}

/**
 * A chapter's stickers in page order for the album's 6 × 3 grid (#103): each page (its registered
 * page with that index, else `c<chapter>p<index>`) as 解開, 淘氣, 土地公.
 */
export function chapterStickers(save: SaveV1, chapter: number, reg: PageRegistry = gameRegistry): [boolean, boolean, boolean][] {
  const out: [boolean, boolean, boolean][] = [];
  for (let i = 1; i <= chapterInfo(chapter).pages; i++) {
    const id = reg.pages.find((p) => p.chapter === chapter && p.index === i)?.id ?? `c${chapter}p${i}`;
    out.push(pageStickers(save, id));
  }
  return out;
}
