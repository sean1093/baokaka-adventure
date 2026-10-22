import { useEffect, useMemo, useRef, useState } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, type KitCtx } from '../../art';
import { CAMEO_ROLE, CREDITS, CREDITS_DEDICATION, CREDITS_TITLE, ENDING_LEAF_CHAPTER, UI, chapterInfo, chapterName, loadLine, type Credit } from '../../content';
import { photoChapters } from '../../game/album';
import { spreadPage } from '../../game/photo';
import type { Photo } from '../../game/progress';
import type { PageRegistry } from '../../pages';
import { backpackerFound } from '../art/ending';
import { PHOTO_H, PHOTO_W, PhotoScene, PHOTO_SPRITES } from '../photo/PhotoScene';
import { useSpritesPreload } from '../../sprites';
import { Endpaper } from './Contents';
import { cardShadow } from './paper';

/**
 * The credits (GDD § 2.13 item 8, § 4.1; #135): they roll over the album's photos — the player's own
 * kept prints, chapter by chapter, the 抓周 photo last. Each card is a print drifting onto the navy
 * endpapers with its chapter under it, and a credit beside it (the cast as the night met them, then
 * who made the book); the 背包客's card has his cameo at the foot of 101, 「I found it!」.
 *
 * A card holds `CREDITS_SLIDE_MS`, then the next; a tap anywhere is the next card now; 「跳過」 ends
 * the roll (then the post-credits). Reduced motion: the cards only fade. A still holds `startSlide`.
 */

export const CREDITS_SLIDE_MS = 4200;

/** One card of the roll. */
export type CreditSlide =
  | { readonly kind: 'title' }
  | { readonly kind: 'card'; readonly chapter: number | null; readonly photo: Photo | null; readonly credit: Credit | null }
  | { readonly kind: 'end'; readonly photo: Photo | null };

/**
 * The roll for these kept photos: the title; then each chapter's print (in order) with the next
 * credit, the credits left over on their own; then the dedication over the 抓周 photo (if kept).
 */
export function creditSlides(photos: Readonly<Record<number, Photo>>): CreditSlide[] {
  const chapters = photoChapters(photos).filter((c) => c !== ENDING_LEAF_CHAPTER);
  const slides: CreditSlide[] = [{ kind: 'title' }];
  const n = Math.max(chapters.length, CREDITS.length);
  for (let i = 0; i < n; i++) {
    const chapter = chapters[i] ?? null;
    slides.push({ kind: 'card', chapter, photo: chapter === null ? null : photos[chapter], credit: CREDITS[i] ?? null });
  }
  slides.push({ kind: 'end', photo: photos[ENDING_LEAF_CHAPTER] ?? null });
  return slides;
}

export interface CreditsProps {
  readonly photos: Readonly<Record<number, Photo>>;
  readonly registry: PageRegistry;
  readonly reduced: boolean;
  readonly still?: boolean;
  /** The card a still shows (fixtures) */
  readonly startSlide?: number;
  readonly onDone: () => void;
}

const PRINT_W = 250;

export function Credits({ photos, registry: reg, reduced, still = false, startSlide = 0, onDone }: CreditsProps) {
  const slides = useMemo(() => creditSlides(photos), [photos]);
  const [i, setI] = useState(Math.min(startSlide, slides.length - 1));
  const ids = useSvgIds('credits');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('credits'), id: ids }), [ids]);
  const ready = useSpritesPreload(PHOTO_SPRITES);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const next = () => setI((n) => n + 1);
  useEffect(() => {
    if (still) return undefined;
    if (i >= slides.length) {
      doneRef.current();
      return undefined;
    }
    const t = window.setTimeout(next, CREDITS_SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [i, slides.length, still]);
  const slide = slides[Math.min(i, slides.length - 1)];
  return (
    <div
      className="fixed inset-0 z-[46] select-none overflow-hidden font-body"
      lang="zh-Hant"
      role="dialog"
      aria-modal={true}
      aria-label={UI.ending.credits}
      style={{ backgroundColor: C.coverDark, color: C.page }}
      data-screen="credits"
      data-screen-ready={ready ? '' : undefined}
      data-still={still ? '' : undefined}
      data-slide={i}
    >
      <Endpaper />
      <button type="button" className="absolute inset-0 cursor-default opacity-0" aria-label={UI.ending.next} onClick={next} data-credits-next="" />
      <div key={i} className="pointer-events-none relative flex h-full flex-col items-center justify-center gap-5 px-4" aria-live="polite">
        {slide.kind === 'title' && (
          <div className={`flex flex-col items-center gap-3 ${reduced ? 'credits-fade' : 'credits-print'}`} data-credits-title="">
            <span className="font-serif text-[44px] font-black tracking-[0.2em]" style={{ color: C.goldLight }}>
              《{CREDITS_TITLE.title}》
            </span>
            <span className="font-num text-[24px] font-semibold tracking-[0.1em]" style={{ color: C.page }}>
              {CREDITS_TITLE.sub}
            </span>
          </div>
        )}
        {slide.kind === 'card' && (
          <>
            {slide.chapter !== null && slide.photo !== null && <Print reg={reg} chapter={slide.chapter} photo={slide.photo} tilt={i % 2 ? 2.4 : -2.2} reduced={reduced} />}
            {slide.credit?.role === CAMEO_ROLE && <Cameo ctx={ctx} reduced={reduced} />}
            {slide.credit !== null && <CreditText credit={slide.credit} reduced={reduced} />}
          </>
        )}
        {slide.kind === 'end' && (
          <>
            {slide.photo !== null && <Print reg={reg} chapter={ENDING_LEAF_CHAPTER} photo={slide.photo} tilt={-1.2} reduced={reduced} />}
            <p className={`text-center font-serif text-[28px] font-black leading-snug ${reduced ? 'credits-fade' : 'credits-fade'}`} style={{ color: C.goldLight }} data-credits-end="">
              {CREDITS_DEDICATION}
            </p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => doneRef.current()}
        className="kit-press absolute right-3 flex min-h-[56px] min-w-[88px] items-center justify-center rounded-[12px] px-4 text-[20px] font-black"
        style={{ top: 'calc(12px + env(safe-area-inset-top))', backgroundColor: withAlpha(C.page, 0.94), color: C.ink, boxShadow: cardShadow(0.6) }}
        data-button="skip"
      >
        {UI.ending.skip}
      </button>
    </div>
  );
}

/** A kept photo as an instant print drifting onto the endpapers, its chapter under it. */
function Print({ reg, chapter, photo, tilt, reduced }: { reg: PageRegistry; chapter: number; photo: Photo; tilt: number; reduced: boolean }) {
  const def = useMemo(() => spreadPage(chapter, reg), [chapter, reg]);
  const info = chapterInfo(chapter);
  const picH = (PRINT_W - 16) * (PHOTO_H / PHOTO_W);
  return (
    <figure className={reduced ? 'credits-fade' : 'credits-print'} style={{ ['--tilt' as string]: `${tilt}deg`, width: PRINT_W, padding: '8px 8px 0', backgroundColor: C.printWhite, boxShadow: cardShadow(1.4) }} data-credits-print={chapter}>
      <div className="overflow-hidden" style={{ width: PRINT_W - 16, height: picH, backgroundColor: C.nightInk }}>
        <PhotoScene chapter={chapter} def={def} frame={photo.frame} mocha={photo.mocha} width={PRINT_W - 16} />
      </div>
      <figcaption className="flex items-baseline justify-center gap-2 py-2">
        <span className="text-[20px] font-black" style={{ color: C.sealInk }}>
          {chapterName(chapter)}
        </span>
        <span className="text-[20px] font-bold" style={{ color: C.ink }}>
          {info.title}
        </span>
      </figcaption>
    </figure>
  );
}

/** A credit: its role small in gold, its names big in cream. */
function CreditText({ credit, reduced }: { credit: Credit; reduced: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 text-center ${reduced ? 'credits-fade' : 'credits-fade'}`} data-credit={credit.role}>
      <span className="text-[20px] font-bold tracking-[0.08em]" style={{ color: C.goldLight }}>
        {credit.role}
      </span>
      <span className="font-serif text-[30px] font-black leading-tight tracking-[0.06em]" style={{ color: C.page }}>
        {credit.names.join('・')}
      </span>
    </div>
  );
}

/** The 背包客 at the foot of 101 at last: 「I found it!」 */
function Cameo({ ctx, reduced }: { ctx: KitCtx; reduced: boolean }) {
  const html = useMemo(() => backpackerFound(ctx), [ctx]);
  const line = loadLine('e.credits.pack');
  return (
    <div className={`relative flex items-end gap-2 ${reduced ? 'credits-fade' : 'credits-print'}`} data-credits-cameo="">
      <svg width={180} height={200} viewBox="-90 -196 180 204" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
      {line && (
        <span className="mb-[120px] rounded-[14px] px-3 py-2 font-num text-[24px] font-semibold" style={{ backgroundColor: C.page, color: C.ink, boxShadow: cardShadow(0.8) }} lang="en">
          {line.text}
        </span>
      )}
    </div>
  );
}
