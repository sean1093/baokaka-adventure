import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs, sparkle, type KitCtx } from '../../art';
import type { PageDef } from '../../core/types';
import { backdropImage } from '../../env/loader';
import type { PhotoFrame } from '../../game/progress';
import { SPRITE_IDS, SpriteAnim, type SpriteId } from '../../sprites';
import { chapterSky } from '../art/placeholders';
import { GUTTER_Y, PAGE_W } from '../geometry';
import { ArtG } from '../parts/common';
import { treasureArt } from './treasureArt';
import { ENDING_LEAF_CHAPTER } from '../../content/album';

/**
 * The chapter photo as a picture (GDD § 2.9; #103): the spread's backdrop, cropped to a 4 : 3
 * frame, with 寶咖咖 and the treasure (and 摩卡, for +M) composed in front of it. A photo is stored
 * as `{ frame, mocha, at }` (§ 3.8), so the album re-draws it from this, never from an image.
 *
 * **The photo frames** (#193, D-102): every chapter with a spread has its own, drawn by the character
 * artist with the treasure in his hands or mouth (`baokaka.photo<N>`, composed in photo space and
 * baked at the photo's print scale, so they are drawn 1 : 1 with their anchor on the crop's floor
 * centre):
 * - **A** (the 「哇！」 face): the treasure lifted high in both hands, eyes wide, mouth open;
 * - **B** (reaching, smiling): crawling the last stretch, his hand out to it on the floor ahead
 *   (chapter 10, the photo of the first steps: walking in);
 * - **C** (chewing it, a funny face): sat with it in his mouth, eyes shut in glee;
 * - **+M**: 摩卡 in the bottom-left corner (`mocha.photo`): A 「哇！」 with him, B sat for the
 *   camera, C the glare.
 *
 * A chapter without frames (a later chapter, the lab stage) falls back to #103's composite of the
 * gameplay poses with `treasureArt` laid over them (D-66). The live viewfinder (`PhotoMoment`)
 * passes `approach` (0 → 1 over the slow-motion loop) to slide him in during the composite's B.
 * Flat SVG, no filters (bible § 9).
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

/**
 * The 抓周 photo (page E, #135): Mocha is the treasure — B, crawling in on him as he sits; A, the
 * grab: both hands round his tail as it shoots up (`mocha.glare`, tail up and stiff); C, chewing it.
 */
const ENDING_POSE: Readonly<Record<PhotoFrame, { baby: SpriteId; mocha: SpriteId }>> = {
  A: { baby: 'baokaka.hug', mocha: 'mocha.glare' },
  B: { baby: 'baokaka.reach', mocha: 'mocha.sit' },
  C: { baby: 'baokaka.eat', mocha: 'mocha.glare' },
};

/** A photo frame's index in its chapter's pose (`docs/art/v2/src/ph_poses.py`: frames A, B, C). */
const FRAME_INDEX: Readonly<Record<PhotoFrame, number>> = { A: 0, B: 1, C: 2 };

/** The chapter's own photo frames (#193), or null when it has none (the composite is drawn). */
export function photoFrames(chapter: number): SpriteId | null {
  const id = `baokaka.photo${chapter}`;
  return (SPRITE_IDS as readonly string[]).includes(id) ? (id as SpriteId) : null;
}

/** The composite's sprites (a chapter without frames; the 抓周 pair). */
const COMPOSITE_SPRITES: readonly SpriteId[] = ['baokaka.bounce', 'baokaka.reach', 'baokaka.eat', 'baokaka.hug', 'mocha.album', 'mocha.sit', 'mocha.glare'];

/** The sprites the photos of these chapters show (preload them before the moment, the leaf, the print). */
export function photoSprites(chapters: readonly number[]): SpriteId[] {
  const own = chapters.map(photoFrames);
  const out = new Set<SpriteId>(own.filter((id): id is SpriteId => id !== null));
  if (own.some((id) => id !== null)) out.add('mocha.photo');
  if (own.some((id) => id === null)) for (const id of COMPOSITE_SPRITES) out.add(id);
  return [...out];
}

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
  const ending = chapter === ENDING_LEAF_CHAPTER;
  const own = ending ? null : photoFrames(chapter);
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
      {ending ? (
        <EndingPair frame={frame} x={crop.x} foot={foot} approach={approach} glints={glints} />
      ) : own !== null ? (
        <g data-photo-frames={own}>
          {mocha && <SpriteAnim sprite="mocha.photo" frame={FRAME_INDEX[frame]} x={crop.x + 48} y={foot + 6} playing={false} floor={false} />}
          <SpriteAnim sprite={own} frame={FRAME_INDEX[frame]} x={crop.x + PHOTO_W / 2} y={foot} playing={false} floor={false} />
        </g>
      ) : (
        <>
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
        </>
      )}
      <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill={vignette} />
    </svg>
  );
}

/**
 * The 抓周 photo's pair (#135), feet on the crop's floor line: Mocha on the right, turned to him;
 * Baokaka on the left — crawling in (B), both hands round the tail Mocha shot up in surprise (A,
 * 「哇！」, a glint on it), or the tail in his mouth (C).
 */
function EndingPair({ frame, x, foot, approach, glints }: { frame: PhotoFrame; x: number; foot: number; approach: number; glints: string }) {
  const { baby, mocha } = ENDING_POSE[frame];
  const mochaX = x + (frame === 'B' ? 214 : 186);
  const babyX = frame === 'B' ? x + 70 + 52 * approach : frame === 'A' ? x + 112 : x + 116;
  return (
    <g data-photo-pair={frame}>
      <SpriteAnim sprite={mocha} x={mochaX} y={foot + 4} scale={MOCHA_SCALE * 1.15} facing={frame === 'B' ? 'l' : 'r'} playing={false} />
      <SpriteAnim sprite={baby} x={babyX} y={foot} scale={BABY_SCALE} playing={false} />
      {frame === 'A' && <g transform={`translate(${mochaX - 40} ${foot - 104})`} dangerouslySetInnerHTML={{ __html: glints }} />}
    </g>
  );
}
