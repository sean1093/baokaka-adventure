import { useEffect, useState } from 'react';
import { GENERIC, GENERIC_ROOM } from './generic';
import { BACKDROP_CHAPTER, GENERIC_BACKDROP, GENERIC_ROOM_BACKDROP } from './keys';
import type { BackdropModule, StageConfig } from './types';

export { Stage, STAGE_H, STAGE_W, stageScale } from './Stage';
export { backdropFor, isBackdrop } from './keys';
export type { StageConfig } from './types';

/**
 * Battle backdrops by key (art direction § 8.4): the generic stages are in the main bundle; each
 * chapter's live in their own chunk (`import()`; ≤ 120 KB gzip each, § 8.5), loaded the first time
 * a battle needs one. The world screen preloads its map's chunk, so by the time the MRT doors open
 * on a fight the backdrop is ready.
 */

/** One loader per chapter chunk. Vite names the chunks after the files (`ch01-<hash>.js`). */
export const CHAPTER_CHUNKS: Readonly<Record<number, () => Promise<BackdropModule>>> = {
  1: () => import('./ch01'),
};

const GENERIC_STAGES: Readonly<Record<string, StageConfig>> = { [GENERIC_BACKDROP]: GENERIC, [GENERIC_ROOM_BACKDROP]: GENERIC_ROOM };

const loaded = new Map<number, BackdropModule>();
const loading = new Map<number, Promise<BackdropModule | null>>();

/** The config for `key` if it can be drawn right now (generic, or its chapter chunk is in). */
export function backdropNow(key: string): StageConfig | null {
  if (GENERIC_STAGES[key]) return GENERIC_STAGES[key];
  const chapter = BACKDROP_CHAPTER[key];
  return chapter === undefined ? null : (loaded.get(chapter)?.BACKDROPS[key] ?? null);
}

/** Starts loading the chunk that draws `key` (no-op for generic keys or a chunk already in). */
export function preloadBackdrop(key: string): Promise<StageConfig | null> {
  const now = backdropNow(key);
  if (now) return Promise.resolve(now);
  const chapter = BACKDROP_CHAPTER[key];
  const load = chapter === undefined ? undefined : CHAPTER_CHUNKS[chapter];
  if (!load) return Promise.resolve(null);
  let promise = loading.get(chapter);
  if (!promise) {
    promise = load().then(
      (module) => {
        loaded.set(chapter, module);
        return module;
      },
      () => {
        // A failed chunk (offline): forget it so the next battle tries again; the stage stays generic
        loading.delete(chapter);
        return null;
      },
    );
    loading.set(chapter, promise);
  }
  return promise.then(() => backdropNow(key));
}

/**
 * The stage for a backdrop key: the real config once its chunk is in, the generic one until then
 * (or for good, if the key is unknown or the chunk fails to load).
 */
export function useBackdrop(key: string, interior = false): StageConfig {
  const fallback = interior ? GENERIC_ROOM : GENERIC;
  const [config, setConfig] = useState<StageConfig>(() => backdropNow(key) ?? fallback);
  useEffect(() => {
    let live = true;
    const now = backdropNow(key);
    if (now) setConfig(now);
    else {
      setConfig(fallback);
      void preloadBackdrop(key).then((ready) => {
        if (live && ready) setConfig(ready);
      });
    }
    return () => {
      live = false;
    };
  }, [key, fallback]);
  return config;
}
