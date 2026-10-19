import { useEffect, useMemo, useState } from 'react';
import type { PageDef } from '../core/types';
import { spriteLoader, type SpriteLoader } from '../sprites/loader';
import { ENV_MANIFEST } from './env.gen';
import { envFile, type EnvBox, type EnvManifest, type PartEntry } from './manifest';

/**
 * The environment bitmaps in the game (#96; bible § 9.1; D-59).
 *
 * **URLs.** The baked WebPs in `src/popup/assets/env/` are imported by Vite as URLs (`?url`,
 * eager, never inlined: `vite.config.ts`), as the sprites are (D-56): the bundle holds the hashed
 * names, and nothing is fetched until a page draws or preloads it. That is the per-chapter lazy
 * loading: a page fetches only its own bitmaps, and while it plays the next page's backdrop is
 * preloaded (`usePageArt`).
 *
 * **Resolution** (`registry.ts` is the one caller in the view): an art key with a bitmap draws it;
 * any other key falls back to the live placeholder paper style, with no error.
 */

const FILES = import.meta.glob<string>('../assets/env/**/*.webp', { eager: true, query: '?url', import: 'default' });
const PREFIX = '../assets/env/';

/** A bitmap's URL (undefined when the file is missing: `env.test.ts` forbids it). */
export const envUrl = (stem: string): string | undefined => FILES[PREFIX + envFile(stem)];

/** Every file the glob found, relative to `assets/env/` (the files ↔ manifest test). */
export const bundledEnvFiles = (): string[] => Object.keys(FILES).map((k) => k.slice(PREFIX.length));

/** A bitmap placed in page or local units. */
export interface EnvImage {
  readonly url: string;
  readonly box: EnvBox;
}

/** The baked backdrop for an art key, or null (the placeholder stage is drawn live). */
export function backdropImage(key: string, m: EnvManifest = ENV_MANIFEST): EnvImage | null {
  const e = m.backdrops[key];
  const url = e === undefined ? undefined : envUrl(e.file);
  return e === undefined || url === undefined ? null : { url, box: e.box };
}

/** The baked art of a part key, or undefined (the preset's kit art is drawn live). */
export const partEntry = (key: string, m: EnvManifest = ENV_MANIFEST): PartEntry | undefined => m.parts[key];

/**
 * The bitmap for a part in a state (bible § 9.1: a bitmap per state): the state's own, else the
 * first listed (a state the art has no drawing for looks like the first); `lifted` picks the
 * pre-baked drag variant when the art has one. Null when the key has no baked art.
 */
export interface PartImage extends EnvImage {
  /** The lifted drag variant was found (it carries its own rise, scale and dropped shadow) */
  readonly lifted: boolean;
  readonly pivot?: readonly [number, number];
  readonly hinge?: number;
}

export function partImage(key: string, state: string, { lifted = false }: { lifted?: boolean } = {}, m: EnvManifest = ENV_MANIFEST): PartImage | null {
  const e = m.parts[key];
  if (e === undefined) return null;
  const pick = (set: PartEntry['states'] | undefined) => (set === undefined ? undefined : (set[state] ?? Object.values(set)[0]));
  const up = lifted ? pick(e.lifted) : undefined;
  const file = up ?? pick(e.states);
  const url = file === undefined ? undefined : envUrl(file.file);
  return url === undefined ? null : { url, box: e.box, lifted: up !== undefined, pivot: e.pivot, hinge: e.hinge };
}

/** The baked art of a cut-out key, or null. */
export function cutoutImage(key: string, m: EnvManifest = ENV_MANIFEST): EnvImage | null {
  const e = m.cutouts[key];
  const url = e === undefined ? undefined : envUrl(e.file);
  return e === undefined || url === undefined ? null : { url, box: e.box };
}

/** A screen's baked art (#97: 'quilt', 'cover-scene', 'map-sheet'), or null. */
export function screenImage(key: string, m: EnvManifest = ENV_MANIFEST): EnvImage | null {
  const e = m.screens[key];
  const url = e === undefined ? undefined : envUrl(e.file);
  return e === undefined || url === undefined ? null : { url, box: e.box };
}

/** Every bitmap URL a page draws: its backdrop, every state of its parts, its cut-outs. */
export function pageArtUrls(def: Pick<PageDef, 'backdrop' | 'parts' | 'cutouts'>, m: EnvManifest = ENV_MANIFEST): string[] {
  const stems: string[] = [];
  const b = m.backdrops[def.backdrop];
  if (b) stems.push(b.file);
  for (const key of new Set(def.parts.map((p) => p.art))) {
    const e = m.parts[key];
    if (e) stems.push(...[...Object.values(e.states), ...Object.values(e.lifted ?? {})].map((f) => f.file));
  }
  for (const key of new Set((def.cutouts ?? []).map((c) => c.art))) {
    const e = m.cutouts[key];
    if (e) stems.push(e.file);
  }
  return stems.map(envUrl).filter((u): u is string => u !== undefined);
}

/**
 * Preloads (fetches and decodes) a page's environment bitmaps as it opens, and reports `true` once
 * they have all settled (an error counts: the placeholder stays, the game goes on). Meanwhile the
 * next page's backdrop is preloaded too, so turning the page shows it at once.
 */
export function usePageArt(def: Pick<PageDef, 'backdrop' | 'parts' | 'cutouts'>, next?: Pick<PageDef, 'backdrop'> | null, loader: SpriteLoader = spriteLoader): boolean {
  const urls = useMemo(() => pageArtUrls(def), [def]);
  const [done, setDone] = useState(() => loader.settled(urls));
  useEffect(() => {
    let live = true;
    setDone(loader.settled(urls));
    void loader.preload(urls).then(() => {
      if (!live) return;
      setDone(true);
      const after = next ? backdropImage(next.backdrop) : null;
      if (after) void loader.load(after.url);
    });
    return () => {
      live = false;
    };
  }, [urls, loader, next]);
  return done;
}
