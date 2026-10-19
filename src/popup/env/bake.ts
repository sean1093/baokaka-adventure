import { LIFT, kitCtx, kitDefs, liftShadow } from '../art';
import { envGrade, gradeSvg, keepColours } from './grade';
import { DRAGGED, type EnvBox } from './manifest';
import type { BackdropSource, CutoutSource, PartSource, ScreenSource } from './sources';

/**
 * What `npm run bake:popup` renders, as pure functions (#96): the exact SVG of every bitmap and
 * the hash that makes the bake idempotent. The script (`scripts/bake-popup.ts`) and `env.test.ts`
 * share them, so CI can tell when a source changed but its bitmap was not re-baked.
 */

/** Bump when the bake itself changes (crop, lift, fonts, encoder): every bitmap re-bakes. */
export const BAKE_VERSION = 'env-v1';

/** Pillow WebP settings (D-56's encoder): backdrops at 80, parts and cut-outs at 86 with a cheaper alpha. */
export const ENCODE = { backdrop: { quality: 80, alpha: 70 }, part: { quality: 86, alpha: 65 }, screen: { quality: 76, alpha: 70 } } as const;

/**
 * A short content hash (two FNV-1a lanes over the JSON, 16 hex digits): pure, so the test computes
 * the same value as the script without Node's crypto.
 */
export function envHash(...parts: unknown[]): string {
  const text = JSON.stringify([BAKE_VERSION, ...parts]);
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
    b ^= b >>> 13;
  }
  return a.toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

/** A backdrop's SVG body with its chapter's environment grade baked into the colours. */
export function backdropSvg(src: BackdropSource): string {
  return gradeSvg(src.draw(kitCtx('bk', { filters: true })), envGrade(src.chapter), keepColours(src.chapter));
}

export const backdropHash = (src: BackdropSource, svg = backdropSvg(src)): string => envHash('backdrop', svg, src.box, ENCODE.backdrop);

/** One drawing of a part to bake: a state, plain or lifted. */
export interface PartVariant {
  readonly state: string;
  readonly lifted: boolean;
  readonly svg: string;
}

/**
 * Every drawing of a part: one per state, plus a lifted one per state for the presets the finger
 * drags (bible § 4.1: risen 5 units, ×1.04, over a dropped shadow).
 */
export function partVariants(src: PartSource): PartVariant[] {
  const variants = DRAGGED.has(src.preset) ? [false, true] : [false];
  return variants.flatMap((lifted) =>
    src.states.map((state) => {
      const ctx = kitCtx('pt', { filters: true });
      const art = src.draw(ctx, state);
      const body = lifted
        ? `<g transform="translate(${LIFT.shadow[0]} ${LIFT.shadow[1]})">${liftShadow(ctx, src.box, 6)}</g><g transform="translate(0 ${-LIFT.rise}) scale(${LIFT.scale})">${art}</g>`
        : art;
      return { state, lifted, svg: kitDefs(ctx) + body };
    }),
  );
}

export const partHash = (key: string, src: PartSource, variants = partVariants(src)): string =>
  envHash('part', key, src.preset, src.box, src.pivot, src.hinge, variants.map((v) => v.svg), ENCODE.part);

/** A cut-out's SVG body, graded like its chapter. */
export function cutoutSvg(src: CutoutSource): string {
  const ctx = kitCtx('ct', { filters: true });
  return gradeSvg(kitDefs(ctx) + src.draw(ctx), envGrade(src.chapter), keepColours(src.chapter));
}

export const cutoutHash = (key: string, src: CutoutSource, svg = cutoutSvg(src)): string => envHash('cutout', key, svg, src.box, ENCODE.part);

/** Room around a part's authored box for its shadow before the crop. */
export const PART_PAD = 16;

/** The padded render box of a part. */
export const paddedBox = (box: EnvBox): EnvBox => ({ x: box.x - PART_PAD, y: box.y - PART_PAD, w: box.w + 2 * PART_PAD, h: box.h + 2 * PART_PAD });

/** A screen's SVG body (#97): the kit's defs and the drawing, not graded. */
export function screenSvg(src: ScreenSource): string {
  const ctx = kitCtx('sc', { filters: true });
  return kitDefs(ctx) + src.draw(ctx);
}

export const screenHash = (key: string, src: ScreenSource, svg = screenSvg(src)): string => envHash('screen', key, svg, src.box, ENCODE.screen);
