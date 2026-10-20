import { useMemo, useSyncExternalStore, type CSSProperties } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { cover, kitCtx, kitDefs, ref, sparkle, type KitCtx } from '../../art';
import { UI } from '../../content';
import type { PageDef } from '../../core/types';
import { backdropImage } from '../../env/loader';
import type { CoverLeaf } from '../../game/album';
import type { Photo } from '../../game/progress';
import { deviceScale, frameUrl, spriteDef, useFramesReady, useSpritesPreload } from '../../sprites';
import { AlbumScreen, type AlbumAction, type AlbumNav } from './AlbumPage';
import { PHOTO_H, PHOTO_SPRITES, PHOTO_W, PhotoScene } from './PhotoScene';

/**
 * The album's cover, its first leaf (GDD § 2.9, § 2.8; bible § 7 「a linen album」; #113): the navy
 * linen board with its gold-foil frame and corner brackets, a die-cut round window and the album's
 * name stamped in foil under it.
 *
 * - **The window** shows the latest photo (cropped round), or before the first one 寶咖咖's happy
 *   head under the moon.
 * - **「淘氣大王」** (every 淘氣 sticker of the game earned, § 2.8): the board is crowned. A foil crown
 *   sits on the window, a ring of foil 嘿 stickers runs round it, 寶咖咖 (laughing) and 摩卡 (smug)
 *   share the window, and a seal-red ribbon across it reads 「淘氣大王」.
 *
 * Every word is live text ≥ 20 px at ≥ 7 : 1 (pale gold on navy, cream on seal red).
 */

export interface AlbumCoverProps {
  readonly leaf: CoverLeaf;
  /** The latest photo and its chapter's spread (the window shows it) */
  readonly photo: Photo | null;
  readonly def?: Pick<PageDef, 'backdrop' | 'photoRect'>;
  readonly reduced: boolean;
  readonly still: boolean;
  readonly nav?: AlbumNav;
  readonly turn?: 1 | -1 | 0;
  readonly leftHand?: boolean;
  readonly actions: readonly AlbumAction[];
}

/** The board's design size; it is drawn at the leaf's width, never wider. */
const BW = 340;
const BH = 452;

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};

const headUrl = (id: string) => {
  const def = spriteDef(id);
  return { url: frameUrl(def.files[0], deviceScale()), w: def.size[0], h: def.size[1] };
};

export function AlbumCover({ leaf, photo, def, reduced, still, nav, turn, leftHand, actions }: AlbumCoverProps) {
  const ids = useSvgIds('albumcover');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('albumcover'), id: ids }), [ids]);
  const vw = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 390);
  // The leaf column is the screen less the binding (22 px) and the right margin (10 px)
  const width = Math.min(BW, Math.max(280, Math.min(vw, 420) - 32));
  const k = width / BW;
  const king = leaf.mischiefKing;
  const heads = useMemo(() => (king ? [headUrl('baokaka-head-laugh'), headUrl('mocha-head-smug')] : photo === null ? [headUrl('baokaka-head-happy')] : []), [king, photo]);
  const headsReady = useFramesReady(heads.map((h) => h.url).filter((u): u is string => u !== undefined));
  const showPhoto = !king && photo !== null;
  const spritesReady = useSpritesPreload(showPhoto ? PHOTO_SPRITES : []);
  const back = showPhoto && def !== undefined ? backdropImage(def.backdrop) : null;
  const backReady = useFramesReady(back ? [back.url] : []);
  const ready = (heads.length === 0 || headsReady) && (!showPhoto || (spritesReady && (back === null || backReady)));

  const win = king ? KING_WINDOW : PLAIN_WINDOW;
  const title = king ? { name: 330, sub: 376 } : { name: 318, sub: 366 };
  const art = useMemo(() => boardArt(ctx, win, king), [ctx, win, king]);
  const rim = useMemo(() => rimArt(ctx, win, king), [ctx, win, king]);
  const px = (v: number) => v * k;
  const at = (x: number, y: number): CSSProperties => ({ left: px(x), top: px(y) });

  return (
    <AlbumScreen ready={ready} still={still} reduced={reduced} label={`${UI.album.title} ${UI.album.cover}`} chapter={0} nav={nav} turn={turn} leftHand={leftHand} actions={actions}>
      <section
        className="relative mx-auto overflow-hidden rounded-[6px_12px_12px_6px]"
        style={{ width, height: BH * k, boxShadow: `2px 3px 0 ${C.coverDark}, 4px 7px 0 ${C.page}, 5px 9px 0 ${C.pageEdge}, 8px 16px 26px ${withAlpha(C.shadow, 0.6)}` }}
        aria-label={`${UI.album.title} ${UI.album.cover}`}
        data-album-cover={king ? 'mischief-king' : 'plain'}
      >
        <svg className="absolute inset-0" width={width} height={BH * k} viewBox={`0 0 ${BW} ${BH}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: art }} />

        {/* The window's picture, under the die-cut rim the board draws */}
        <div className="absolute overflow-hidden rounded-full" style={{ ...at(win.cx - win.r, win.cy - win.r), width: px(2 * win.r), height: px(2 * win.r), backgroundColor: king ? C.standeeCard : C.nightCard }} data-cover-window="">
          {showPhoto ? (
            // Cropped round a little left of centre, so 摩卡 (bottom left, +M) stays in the window
            <div className="absolute top-0" style={{ left: px(win.r + 16) - (px(2 * win.r) * PHOTO_W) / PHOTO_H / 2 }}>
              <PhotoScene chapter={leaf.latest ?? 1} def={def} frame={photo.frame} mocha={photo.mocha} width={(px(2 * win.r) * PHOTO_W) / PHOTO_H} />
            </div>
          ) : king ? (
            <>
              <Head head={heads[0]} style={{ left: px(4), top: px(42), width: px(84), transform: 'rotate(-7deg)' }} />
              <Head head={heads[1]} style={{ left: px(78), top: px(36), width: px(82), transform: 'rotate(8deg)' }} />
            </>
          ) : (
            <Head head={heads[0]} style={{ left: px(win.r - 50), top: px(win.r - 38), width: px(100) }} />
          )}
        </div>
        {/* The rim over the picture: the die-cut's bevel and the window's foil ring */}
        <svg className="pointer-events-none absolute inset-0" width={width} height={BH * k} viewBox={`0 0 ${BW} ${BH}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: rim }} />

        {king && (
          <p className="absolute inset-x-0 flex justify-center" style={{ top: px(win.cy + win.r - 6) - 22 }} data-cover-ribbon="">
            <span className="font-serif text-[28px] font-black leading-[44px] tracking-[0.22em]" style={{ color: C.sealGlyph, paddingLeft: '0.22em' }}>
              {UI.album.mischiefKing}
            </span>
          </p>
        )}

        {/* The album's name, stamped in foil */}
        <h2 className="absolute inset-x-0 flex flex-col items-center font-serif font-black" style={{ top: px(title.name) - 30, color: C.goldLight, textShadow: `0 1px 0 ${C.goldDeep}, 0 -1px 0 ${C.coverDark}` }}>
          <span className="text-[40px] leading-[52px] tracking-[0.3em]" style={{ paddingLeft: '0.3em' }}>
            寶咖咖
          </span>
          <span className="text-[26px] leading-[36px] tracking-[0.24em]" style={{ paddingLeft: '0.24em', marginTop: px(title.sub - title.name) - 52 }}>
            一歲的相簿
          </span>
        </h2>
      </section>
    </AlbumScreen>
  );
}

function Head({ head, style }: { head: { url?: string; w: number; h: number } | undefined; style: CSSProperties }) {
  if (head?.url === undefined) return null;
  return <img src={head.url} alt="" draggable={false} className="absolute block" style={{ ...style, height: 'auto', aspectRatio: `${head.w} / ${head.h}` }} />;
}

type Win = { readonly cx: number; readonly cy: number; readonly r: number };

/** The window: a round die-cut, a little higher and smaller on the crowned cover (the ribbon crosses its foot). */
const PLAIN_WINDOW: Win = { cx: 172, cy: 172, r: 90 };
const KING_WINDOW: Win = { cx: 172, cy: 168, r: 82 };

/** The board: linen, the binding's hinge, the foil frame, the window's shadowed opening; on the crowned cover the 嘿 ring. */
function boardArt(ctx: KitCtx, win: Win, king: boolean): string {
  const { cx, cy, r } = win;
  const frame = `<rect x="36" y="30" width="280" height="392" rx="3" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.6"/>`
    + `<rect x="42" y="36" width="268" height="380" rx="2" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".7" opacity=".85"/>`;
  // The hinge: the board bends at the spine
  const hinge = `<rect width="18" height="${BH}" fill="${C.shadow}" opacity=".28"/><path d="M21 0V${BH}" stroke="${C.shadow}" stroke-width="2" opacity=".45"/><path d="M22.5 0V${BH}" stroke="${C.coverLight}" stroke-width="1" opacity=".8"/>`;
  // The window's opening, a little deeper than the board (the die-cut's shadow falls inward)
  const opening = `<circle cx="${cx}" cy="${cy}" r="${r + 9}" fill="${C.coverDark}" opacity=".55"/>`;
  // A moon and two stars under the name (the night the book is set in)
  const moon = `<g transform="translate(${cx} ${BH - 44})"><path d="M-6 -9a10 10 0 1 0 12 13a8 8 0 1 1 -12 -13z" fill="${ref(ctx, 'foil')}"/></g>`
    + sparkle(ctx, cx - 30, BH - 46, 4.5, 0.9) + sparkle(ctx, cx + 28, BH - 40, 3.5, 0.9);
  let ring = '';
  if (king) {
    // A ring of 嘿 stickers round the window, clear of the crown (top) and the ribbon (foot)
    for (const deg of [-145, -118, -62, -35, -8, 18, 162, 188]) {
      const a = (deg * Math.PI) / 180;
      const x = cx + Math.cos(a) * (r + 22);
      const y = cy + Math.sin(a) * (r + 22);
      ring += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle cy="1.4" r="11" fill="${C.shadow}" opacity=".4"/><circle r="11" fill="${ref(ctx, 'foil')}" stroke="${C.goldDeep}" stroke-width=".9"/>`
        + `<text data-art-text="" y="4.6" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="900" font-size="12.5" fill="${C.foilInk}">嘿</text></g>`;
    }
  }
  return kitDefs(ctx, ['linen', 'vign', 'foil']) + cover(ctx, BW, BH) + hinge + frame + opening + moon + ring;
}

/** Over the picture: the window's cream die-cut rim and foil ring; on the crowned cover, the crown and the ribbon. */
function rimArt(ctx: KitCtx, win: Win, king: boolean): string {
  const { cx, cy, r } = win;
  const rim = `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="${C.standeeCard}" stroke-width="7"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r - 0.5}" fill="none" stroke="${C.shadow}" stroke-width="3" opacity=".35"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r + 7.5}" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="2"/>`;
  if (!king) return rim;
  // The crown sits on the window's top, foil with three seal-red jewels
  const top = cy - r - 4;
  const crown = `<g transform="translate(${cx} ${top})">`
    + `<path d="M-30 4L-34 -26L-15 -10L0 -34L15 -10L34 -26L30 4Z" fill="${C.shadow}" opacity=".35" transform="translate(1.5 2.5)"/>`
    + `<path d="M-30 4L-34 -26L-15 -10L0 -34L15 -10L34 -26L30 4Z" fill="${ref(ctx, 'foil')}" stroke="${C.goldDeep}" stroke-width="1.4" stroke-linejoin="round"/>`
    + `<rect x="-31" y="-3" width="62" height="8" rx="2" fill="${ref(ctx, 'foil')}" stroke="${C.goldDeep}" stroke-width="1.2"/>`
    + `<circle cx="-34" cy="-27" r="3.4" fill="${C.seal}" stroke="${C.goldDeep}"/><circle cy="-35" r="3.8" fill="${C.seal}" stroke="${C.goldDeep}"/><circle cx="34" cy="-27" r="3.4" fill="${C.seal}" stroke="${C.goldDeep}"/>`
    + `<circle cx="-14" cy="1" r="2.2" fill="${C.sealDark}"/><circle cy="1" r="2.6" fill="${C.wordBeep}"/><circle cx="14" cy="1" r="2.2" fill="${C.sealDark}"/>`
    + `</g>`;
  // The ribbon across the window's foot: swallowtail ends folded behind, a stitched gold edge
  const y = cy + r - 6;
  const half = 112;
  const ribbon = `<g transform="translate(${cx} ${y})">`
    + `<path d="M${-half - 26} -10H${-half + 8}V22H${-half - 26}L${-half - 14} 6Z" fill="${C.sealDark}"/>`
    + `<path d="M${half + 26} -10H${half - 8}V22H${half + 26}L${half + 14} 6Z" fill="${C.sealDark}"/>`
    + `<path d="M${-half + 8} 22L${-half + 8} 16L${-half - 2} 22Z" fill="${C.shadow}" opacity=".6"/><path d="M${half - 8} 22L${half - 8} 16L${half + 2} 22Z" fill="${C.shadow}" opacity=".6"/>`
    + `<rect x="${-half}" y="-22" width="${2 * half}" height="38" rx="2" fill="${C.shadow}" opacity=".35" transform="translate(1.5 3)"/>`
    + `<rect x="${-half}" y="-22" width="${2 * half}" height="38" rx="2" fill="${C.sealInk}"/>`
    + `<path d="M${-half + 5} -18H${half - 5}M${-half + 5} 12H${half - 5}" stroke="${C.gold}" stroke-width="1.1" stroke-dasharray="4 3" opacity=".9"/>`
    + `</g>`;
  return rim + crown + ribbon;
}
