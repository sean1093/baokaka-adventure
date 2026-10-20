import { grain, translate, type KitCtx } from '../art';
import type { PageDef, PartPreset } from '../core/types';
import { chapterSky, placeholderBackdrop, stageDefs } from '../view/art/placeholders';
import { BLOCK_DEPTH, FLOOR_BOTTOM, GUTTER_Y, PAGE_VIEW_BOX, PAGE_W, floorOutline, floorWiden } from '../view/geometry';
import { C0_BACKDROPS, C0_PARTS } from './art/c0';
import { C1_BACKDROPS, C1_PARTS } from './art/c1';
import { SCREEN_ART, type ScreenSource } from './art/screens';
import type { EnvBox } from './manifest';

/**
 * What `npm run bake:popup` bakes (#96): the environment art's **sources**, as kit-style SVG
 * drawn with filters on (`ctx.filters`: depth shadows, blurs, glows, grain). The game never
 * imports this file; it reads the baked bitmaps (`env.gen.ts`, `loader.ts`). PageLab may draw a
 * source live to preview art before it is baked.
 *
 * - **Backdrops:** every art key a registered page names (`PageDef.backdrop`). A key with its own
 *   drawing in `BACKDROP_ART` bakes that; any other bakes its chapter's placeholder stage
 *   (`view/art/placeholders.ts`), so every page ships a baked backdrop from day one and a
 *   chapter's art issue (#108 for chapter 1) only swaps the drawing.
 * - **Parts** (`PART_SOURCES`): art keys with a drawing per state. Keys without one keep the
 *   preset's live kit art (the touchables' seals, grips and cues stay live SVG: the affordance
 *   lint reads them).
 * - **Cut-outs** (`CUTOUT_SOURCES`): static standing pieces a page places with `PageDef.cutouts`.
 * - **Screens** (`SCREEN_SOURCES`, #97): the quilt, the cover scene and the 目錄 map, baked always
 *   (they belong to no page).
 */

/** A part's art: one drawing per state, in its local space (the origin at the part's hit centre). */
export interface PartSource {
  readonly preset: PartPreset;
  readonly states: readonly string[];
  /** The drawing's bounds with room for its shadow (the bake crops to what was drawn) */
  readonly box: EnvBox;
  /** Rotary parts: the turning point (local units) */
  readonly pivot?: readonly [number, number];
  /** Flaps: the fold line (local y) */
  readonly hinge?: number;
  readonly draw: (ctx: KitCtx, state: string) => string;
}

/** A static cut-out: one drawing, its origin where the page places it. */
export interface CutoutSource {
  readonly chapter: number;
  readonly box: EnvBox;
  readonly draw: (ctx: KitCtx) => string;
}

/** A backdrop drawing in page units (the stage defs are emitted for it). */
export type BackdropDraw = (ctx: KitCtx, def: Pick<PageDef, 'chapter'>) => string;

/** Backdrops with their own drawing (chapter art issues add theirs; until then the placeholder stage). */
export const BACKDROP_ART: Readonly<Record<string, BackdropDraw>> = { ...C0_BACKDROPS, ...C1_BACKDROPS };

/** Part art keys with their own drawing. */
export const PART_SOURCES: Readonly<Record<string, PartSource>> = {
  ...C0_PARTS,
  ...C1_PARTS,
};

/** Standing cut-outs by key (e.g. 'c1/lamp-post'). */
export const CUTOUT_SOURCES: Readonly<Record<string, CutoutSource>> = {};

/** One backdrop to bake. */
export interface BackdropSource {
  readonly key: string;
  readonly chapter: number;
  /** Its own drawing, or the chapter's placeholder stage */
  readonly placeholder: boolean;
  readonly box: EnvBox;
  /** The whole SVG body (defs, art, grain), in page units */
  readonly draw: (ctx: KitCtx) => string;
}

/** The paper the grain lies on: the backdrop page, the floor page and the page block. */
function paperClip(id: string): string {
  const w = floorWiden(FLOOR_BOTTOM);
  return `<clipPath id="${id}"><rect x="0" y="0" width="${PAGE_W}" height="${GUTTER_Y + 1}" rx="5"/><path d="${floorOutline()}"/>`
    + `<rect x="${-w - 2}" y="${FLOOR_BOTTOM - 1}" width="${PAGE_W + 2 * w + 4}" height="${BLOCK_DEPTH + 2}"/></clipPath>`;
}

/**
 * The backdrops the registered pages need, one per art key (a key shared by several pages bakes
 * once; its first page's chapter grades it).
 */
export function backdropSources(pages: readonly Pick<PageDef, 'backdrop' | 'chapter'>[]): BackdropSource[] {
  const seen = new Map<string, BackdropSource>();
  for (const page of pages) {
    if (seen.has(page.backdrop)) continue;
    const own = BACKDROP_ART[page.backdrop];
    const chapter = page.chapter;
    const box = PAGE_VIEW_BOX;
    seen.set(page.backdrop, {
      key: page.backdrop,
      chapter,
      placeholder: own === undefined,
      box,
      draw: (ctx) => {
        const clip = ctx.id('paperClip');
        // Grain and mottle (bible § 3.1) over the paper only, soft-light, baked (§ 9.1)
        return stageDefs(ctx, chapterSky(chapter), { all: true }) + paperClip(clip)
          + (own ?? placeholderBackdrop)(ctx, { chapter })
          + `<g clip-path="url(#${clip})"><g transform="${translate(box.x, box.y)}">${grain(ctx, box.w, box.h, 0.42)}</g></g>`;
      },
    });
  }
  return [...seen.values()];
}

/** The part art keys the registered pages use that have a drawing (what the bake renders). */
export function partSources(pages: readonly Pick<PageDef, 'parts'>[]): [string, PartSource][] {
  const keys = new Set(pages.flatMap((p) => p.parts.map((part) => part.art)));
  return Object.entries(PART_SOURCES).filter(([key]) => keys.has(key));
}

/** The cut-out keys the registered pages place that have a drawing. */
export function cutoutSources(pages: readonly Pick<PageDef, 'cutouts'>[]): [string, CutoutSource][] {
  const keys = new Set(pages.flatMap((p) => (p.cutouts ?? []).map((c) => c.art)));
  return Object.entries(CUTOUT_SOURCES).filter(([key]) => keys.has(key));
}

/** The screens' art (#97), by key: always baked. */
export const SCREEN_SOURCES: Readonly<Record<string, ScreenSource>> = SCREEN_ART;
export type { ScreenSource };
