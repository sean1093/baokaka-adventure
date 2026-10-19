import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs, sparkle, type KitCtx } from '../../art';
import type { PageDef } from '../../core/types';
import { backdropImage } from '../../env/loader';
import type { PhotoFrame } from '../../game/progress';
import { SpriteAnim, type SpriteId } from '../../sprites';
import { chapterSky } from '../art/placeholders';
import { GUTTER_Y, PAGE_W } from '../geometry';
import { ArtG } from '../parts/common';
import { treasureArt } from './treasureArt';

/**
 * The chapter photo as a picture (GDD § 2.9; #103): the spread's backdrop, cropped to a 4 : 3
 * frame, with 寶咖咖 and the treasure (and 摩卡, for +M) composed in front of it. A photo is stored
 * as `{ frame, mocha, at }` (§ 3.8), so the album re-draws it from this, never from an image.
 *
 * The poses are placeholder composites from the baked character frames until the character artist
 * draws the photo frames (D-66):
 * - **B** (reaching, smiling): `reach`, crawling the last stretch toward the treasure on the floor;
 * - **A** (the 「哇！」 face): `bounce`, arms up, the treasure held high over his head;
 * - **C** (chewing it, a funny face): `eat`, the treasure at his mouth;
 * - **+M**: 摩卡 sitting for the photo (`mocha.album`) in the bottom-left corner.
 *
 * The live viewfinder (`PhotoMoment`) passes `approach` (0 → 1 over the slow-motion loop) to slide
 * him in during B. Flat SVG, no filters (bible § 9).
 */

/** The photo's aspect, 4 : 3 (an instant print's picture). */
export const PHOTO_W = 300;
export const PHOTO_H = 225;

export interface PhotoCrop {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * The part of the spread the photo shows: 300 × 225 page units inside the page, centred across on
 * the spread's `photoRect` (else the page), its floor line a little above the frame's foot.
 */
export function photoCrop(def: Pick<PageDef, 'photoRect'> | undefined): PhotoCrop {
  const r = def?.photoRect;
  const cx = r === undefined ? 195 : r.x + r.w / 2;
  const x = Math.max(0, Math.min(PAGE_W - PHOTO_W, cx - PHOTO_W / 2));
  return { x, y: GUTTER_Y + 50 - PHOTO_H, w: PHOTO_W, h: PHOTO_H };
}

/** Where the characters stand in the photo, relative to the crop's top-left. */
const FOOT_Y = 200;
const BABY_SCALE = 1.45;
const MOCHA_SCALE = 1.45;
const POSE: Readonly<Record<PhotoFrame, SpriteId>> = { A: 'baokaka.bounce', B: 'baokaka.reach', C: 'baokaka.eat' };

/** The sprites a photo can show (preload them before the moment). */
export const PHOTO_SPRITES: readonly SpriteId[] = ['baokaka.bounce', 'baokaka.reach', 'baokaka.eat', 'mocha.album'];

export interface PhotoSceneProps {
  readonly chapter: number;
  /** The spread (its backdrop and `photoRect`); absent: the chapter's night sky only */
  readonly def?: Pick<PageDef, 'backdrop' | 'photoRect'>;
  readonly frame: PhotoFrame;
  readonly mocha: boolean;
  /** B's slow approach, 0 (still crawling in) → 1 (there); 1 by default */
  readonly approach?: number;
  /** Width in CSS px (the picture is drawn 300 × 225) */
  readonly width?: number;
  readonly className?: string;
}

export function PhotoScene({ chapter, def, frame, mocha, approach = 1, width = PHOTO_W, className }: PhotoSceneProps) {
  const ids = useSvgIds('photo');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('photo'), id: ids }), [ids]);
  const crop = useMemo(() => photoCrop(def), [def]);
  const sky = chapterSky(chapter);
  const back = def === undefined ? null : backdropImage(def.backdrop);
  const art = useMemo(() => {
    const grad = ctx.id('photoSky');
    const vign = ctx.id('photoVign');
    return kitDefs(ctx, ['foil'])
      + `<defs><linearGradient id="${grad}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.horizon}"/></linearGradient>`
      + `<radialGradient id="${vign}" cx=".5" cy=".46" r=".72"><stop offset=".62" stop-color="${C.shadow}" stop-opacity="0"/><stop offset="1" stop-color="${C.shadow}" stop-opacity=".42"/></radialGradient></defs>`
      + `<rect x="${crop.x}" y="${crop.y}" width="${crop.w}" height="${crop.h}" fill="url(#${grad})"/>`
      + (back ? `<image href="${back.url}" x="${back.box.x}" y="${back.box.y}" width="${back.box.w}" height="${back.box.h}" preserveAspectRatio="none"/>` : '')
      // A warm flash-lit pool round the subject, so the photo reads as a snapshot at night
      + `<ellipse cx="${crop.x + 160}" cy="${crop.y + FOOT_Y - 30}" rx="150" ry="110" fill="${C.lampHot}" opacity=".16"/>`;
  }, [ctx, crop, sky, back]);
  const vignette = `url(#${ctx.id('photoVign')})`;
  const treasure = useMemo(() => treasureArt(ctx, chapter), [ctx, chapter]);
  const glints = useMemo(() => sparkle(ctx, 0, 0, 5, 0.95), [ctx]);

  const foot = crop.y + FOOT_Y;
  const pose = POSE[frame];
  // B: he crawls in from the left; A and C: he has it, centre stage
  const babyX = crop.x + (frame === 'B' ? 92 + 46 * approach : 150);
  // The treasure: on the floor ahead of him (B), held over his head (A), at his mouth (C)
  const [tx, ty, tScale, tRot] =
    frame === 'B' ? [crop.x + 232, foot - 12, 1.35, 0] : frame === 'A' ? [babyX + 12, foot - 136, 1.45, -12] : [babyX + 27, foot - 50, 1.05, 34];

  return (
    <svg
      className={className}
      width={width}
      height={(width * PHOTO_H) / PHOTO_W}
      viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      data-photo-scene={`${frame}${mocha ? '+M' : ''}`}
    >
      <ArtG html={art} />
      {mocha && <SpriteAnim sprite="mocha.album" x={crop.x + 48} y={foot + 6} scale={MOCHA_SCALE} playing={false} />}
      {frame === 'B' && <g transform={`translate(${tx} ${ty}) scale(${tScale})`} dangerouslySetInnerHTML={{ __html: treasure }} />}
      <SpriteAnim sprite={pose} x={babyX} y={foot} scale={BABY_SCALE} playing={false} />
      {frame !== 'B' && <g transform={`translate(${tx} ${ty}) rotate(${tRot}) scale(${tScale})`} dangerouslySetInnerHTML={{ __html: treasure }} />}
      {frame === 'A' && (
        <g aria-hidden="true">
          <g transform={`translate(${tx - 30} ${ty - 14})`} dangerouslySetInnerHTML={{ __html: glints }} />
          <g transform={`translate(${tx + 30} ${ty - 22}) scale(.7)`} dangerouslySetInnerHTML={{ __html: glints }} />
        </g>
      )}
      <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill={vignette} />
    </svg>
  );
}
