import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { frameFile, pickScale, type Scale, type SpriteDef } from './manifest';
import { SPRITE_MANIFEST } from './sprites.gen';

/**
 * Sprite URLs and the loader (#94; Art v2 § 2.4).
 *
 * **URLs.** The baked files live in `src/popup/assets/sprites/` and are imported by Vite as URLs
 * (`?url`, eager): the bundle holds only the hashed file names (≈ 10 KB of strings), nothing is
 * fetched until an image asks for it, and no lazy chunk per frame is made (D-56). `vite.config.ts`
 * keeps every sprite a file (never inlined as base64), so each is cached on its own.
 *
 * **Loading.** `@2x` for DPR ≤ 2, else `@3x`. A frame is *ready* once fetched and decoded
 * (`img.decode()`), and the decoded image is kept referenced so it stays warm; `SpriteAnim` draws a
 * placeholder card in the frame's box until its frames are ready (no layout shift). A page preloads
 * the core set plus its chapter's sprites (`pageSprites`); later chapters' poses load with them.
 */

const FILES = import.meta.glob<string>('../assets/sprites/**/*.webp', { eager: true, query: '?url', import: 'default' });
const PREFIX = '../assets/sprites/';

/** The URL of a frame stem at a scale (undefined when the file is missing: the test forbids it). */
export const frameUrl = (stem: string, scale: Scale): string | undefined => FILES[PREFIX + frameFile(stem, scale)];

/** Every file the glob found, as stems with scale (the files ↔ manifest test). */
export const bundledFiles = (): string[] => Object.keys(FILES).map((k) => k.slice(PREFIX.length));

export function spriteDef(id: string): SpriteDef {
  const def = (SPRITE_MANIFEST.sprites as Readonly<Record<string, SpriteDef>>)[id];
  if (def === undefined) throw new Error(`No sprite 「${id}」`);
  return def;
}

/** The URLs of a sprite's frames (one animation's, or all) at a scale. */
export function spriteUrls(id: string, scale: Scale, anim?: string): string[] {
  const def = spriteDef(id);
  const frames = anim === undefined ? def.files.map((_, i) => i) : [...new Set(def.anims[anim]?.frames ?? [])];
  return frames.map((i) => frameUrl(def.files[i], scale)).filter((u): u is string => u !== undefined);
}

export const floorUrl = (scale: Scale): string | undefined => frameUrl(SPRITE_MANIFEST.floor.file, scale);

/** The sprites of a lazy-load group (`config.ts`: 0 is the core set). */
export const groupSprites = (group: SpriteDef['group']): string[] =>
  Object.entries(SPRITE_MANIFEST.sprites).filter(([, s]) => s.group === group).map(([id]) => id);

/** What a page of `chapter` preloads: the core poses, plus the poses its chapter first needs. */
export function pageSprites(chapter: number): string[] {
  return Object.entries(SPRITE_MANIFEST.sprites)
    .filter(([, s]) => s.kind === 'pose' && (s.group === 0 || s.group === chapter))
    .map(([id]) => id);
}

/** Bytes a list of sprites costs at a scale (the payload report and its test). */
export function payloadBytes(ids: readonly string[], scale: Scale): number {
  const k = scale === 2 ? 0 : 1;
  return ids.reduce((n, id) => n + spriteDef(id).bytes.reduce((m, b) => m + b[k], 0), 0) + SPRITE_MANIFEST.floor.bytes[k];
}

// ——— The loader ———

export type LoadState = 'loading' | 'ready' | 'error';

/** Fetches and decodes one URL; resolves to something to keep referenced (the decoded image). */
export type Decode = (url: string) => Promise<unknown>;

const browserDecode: Decode = async (url) => {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return img;
};

export class SpriteLoader {
  private readonly states = new Map<string, LoadState>();
  private readonly pending = new Map<string, Promise<void>>();
  private readonly keep = new Map<string, unknown>();
  private readonly subs = new Set<() => void>();
  private serial = 0;

  constructor(private readonly decode: Decode = browserDecode) {}

  state(url: string): LoadState | undefined {
    return this.states.get(url);
  }

  /** All ready (an error counts as settled: the placeholder stays, the game goes on). */
  ready(urls: readonly string[]): boolean {
    return urls.every((u) => this.states.get(u) === 'ready');
  }

  settled(urls: readonly string[]): boolean {
    return urls.every((u) => {
      const s = this.states.get(u);
      return s === 'ready' || s === 'error';
    });
  }

  load(url: string): Promise<void> {
    const known = this.pending.get(url);
    if (known) return known;
    this.states.set(url, 'loading');
    const p = this.decode(url).then(
      (kept) => {
        this.keep.set(url, kept);
        this.set(url, 'ready');
      },
      () => this.set(url, 'error'),
    );
    this.pending.set(url, p);
    return p;
  }

  preload(urls: readonly string[]): Promise<void> {
    return Promise.all(urls.map((u) => this.load(u))).then(() => undefined);
  }

  /** Changes whenever any URL settles (for `useSyncExternalStore`). */
  version(): number {
    return this.serial;
  }

  subscribe(cb: () => void): () => void {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  }

  private set(url: string, s: LoadState) {
    this.states.set(url, s);
    this.serial++;
    for (const cb of [...this.subs]) cb();
  }
}

/** The game's one loader. */
export const spriteLoader = new SpriteLoader(typeof Image === 'undefined' ? () => Promise.reject(new Error('no Image')) : browserDecode);

/** The scale for this device (read once: a DPR change mid-session keeps the loaded set). */
export function deviceScale(): Scale {
  return pickScale(typeof window === 'undefined' ? 2 : window.devicePixelRatio || 1);
}

/** Whether `urls` are ready, starting their load; re-renders when they settle. */
export function useFramesReady(urls: readonly string[], loader: SpriteLoader = spriteLoader): boolean {
  const key = urls.join('|');
  useEffect(() => {
    if (key !== '') void loader.preload(key.split('|'));
  }, [key, loader]);
  const subscribe = useCallback((cb: () => void) => loader.subscribe(cb), [loader]);
  useSyncExternalStore(subscribe, () => loader.version(), () => 0);
  return urls.length > 0 && loader.ready(urls);
}

/**
 * Preloads sprites (every frame, plus the floor ellipse) and reports `true` once all of it has
 * settled (decoded, or failed: the placeholder stays and the game goes on).
 */
export function useSpritesPreload(ids: readonly string[], loader: SpriteLoader = spriteLoader): boolean {
  const key = ids.join(',');
  const urls = useMemo(() => {
    const scale = deviceScale();
    const floor = floorUrl(scale);
    return [...(key === '' ? [] : key.split(',')).flatMap((id) => spriteUrls(id, scale)), ...(floor ? [floor] : [])];
  }, [key]);
  const [done, setDone] = useState(() => loader.settled(urls));
  useEffect(() => {
    let live = true;
    setDone(loader.settled(urls));
    void loader.preload(urls).then(() => live && setDone(true));
    return () => {
      live = false;
    };
  }, [urls, loader]);
  return done;
}

/**
 * What a page of `chapter` draws (`pageSprites`), preloaded as it opens. `PagePlayer` marks its
 * page `data-sprites="ready"` with it, which the screenshot targets wait for.
 */
export function usePagePreload(chapter: number, loader: SpriteLoader = spriteLoader): boolean {
  const ids = useMemo(() => pageSprites(chapter), [chapter]);
  return useSpritesPreload(ids, loader);
}
