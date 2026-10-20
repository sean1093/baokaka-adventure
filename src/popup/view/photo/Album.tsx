import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import type { PageDef } from '../../core/types';
import { ALBUM_COVER, albumLeaves, clampLeaf, flipLeaf, type LeafState } from '../../game/album';
import { keptPhoto, spreadPage, type Shot } from '../../game/photo';
import type { Photo, SaveV1 } from '../../game/progress';
import { GAME_PAGES } from '../../game/stickers';
import type { PageRegistry } from '../../pages';
import { AlbumCover } from './AlbumCover';
import { AlbumPage, type AlbumAction, type AlbumNav } from './AlbumPage';
import { PhotoMoment } from './PhotoMoment';

/**
 * A chapter's album page with its 「再拍一次」 (GDD § 2.9 step 7; #103): the page (`AlbumPage`), and
 * over it, on a retake, the 3-second photo moment again (no puzzle). The last photo taken is kept
 * at once (`onKeep`, a save trigger); after a retake the previous and the new shot lie side by side
 * and the one the player taps is kept.
 *
 * - `after` (straight from the spread): 「再拍一次」 and 「放進相簿」, which goes on (`onDone`).
 * - `browse` (from the cover's 相簿): 「返回」, and 「再拍一次」 once there is a photo.
 *
 * `AlbumBook` (#113) is the whole album the cover's 相簿 opens: its cover and every chapter's page,
 * turned with the arrows or a swipe.
 */

export interface AlbumProps {
  readonly chapter: number;
  readonly def?: Pick<PageDef, 'backdrop' | 'photoRect'>;
  /** The kept photo (none yet: an empty print) */
  readonly photo: Photo | null;
  readonly stickers: readonly (readonly [boolean, boolean, boolean])[];
  readonly mode: 'after' | 'browse';
  /** Just taken: the print flies in, the notes pop on */
  readonly fresh?: boolean;
  /** 摩卡 in the frame for a retake (the spread's +M); defaults to the kept photo's */
  readonly mocha?: boolean;
  readonly reduced: boolean;
  readonly still?: boolean;
  /** Visual QA: the last two shots after a retake, the second chosen */
  readonly retaken?: Photo;
  /** Keep this photo for the chapter (save it) */
  readonly onKeep: (photo: Photo) => void;
  /** 「放進相簿」 / 「返回」 */
  readonly onDone: () => void;
  /** The clock for a kept photo's time (tests) */
  readonly now?: () => number;
  /** #113: what the page shows (a placeholder for a chapter not reached), the album's paging, how the leaf came on, 左手模式 */
  readonly state?: LeafState;
  readonly nav?: AlbumNav;
  readonly turn?: 1 | -1 | 0;
  readonly leftHand?: boolean;
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};

export function Album({ chapter, def, photo, stickers, mode, fresh = false, mocha, reduced, still = false, retaken, onKeep, onDone, now = Date.now, state, nav, turn, leftHand }: AlbumProps) {
  const [photos, setPhotos] = useState<readonly Photo[]>(() => [...(photo ? [photo] : []), ...(retaken ? [retaken] : [])]);
  const [chosen, setChosen] = useState(() => (photo ? (retaken ? 1 : 0) : 0));
  const [retaking, setRetaking] = useState(false);
  const [flying, setFlying] = useState(fresh);
  const vw = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 390);

  const snap = useCallback(
    (shot: Shot) => {
      const p = keptPhoto(shot, now());
      setPhotos((list) => [...(list[chosen] ? [list[chosen]] : []), p]);
      setChosen((c) => (photos[c] ? 1 : 0));
      setRetaking(false);
      setFlying(true);
      onKeep(p);
    },
    [chosen, photos, now, onKeep],
  );
  const choose = useCallback(
    (i: number) => {
      if (i === chosen || photos[i] === undefined) return;
      setChosen(i);
      setFlying(false);
      onKeep(photos[i]);
    },
    [chosen, photos, onKeep],
  );

  const retake: AlbumAction = { id: 'retake', onClick: () => setRetaking(true) };
  const actions: AlbumAction[] =
    mode === 'after' ? [retake, { id: 'keep', onClick: onDone }] : [{ id: 'back', onClick: onDone }, ...(photos.length > 0 ? [retake] : [])];
  const current = photos[chosen];
  return (
    <>
      <AlbumPage
        chapter={chapter}
        def={def}
        shots={photos}
        chosen={chosen}
        stickers={stickers}
        fresh={flying}
        reduced={reduced}
        still={still}
        actions={actions}
        onChoose={choose}
        state={photos.length > 0 ? 'photo' : state}
        nav={retaking ? undefined : nav}
        turn={turn}
        leftHand={leftHand}
      />
      {retaking && (
        <div className="fixed inset-0 z-[60]">
          <PhotoMoment chapter={chapter} def={def} mocha={mocha ?? current?.mocha ?? false} reduced={reduced} vw={vw} onSnap={snap} />
        </div>
      )}
    </>
  );
}

export interface AlbumBookProps {
  readonly save: SaveV1;
  readonly reg: PageRegistry;
  /** The leaf it opens at (0 the cover, 1–10 the chapters) */
  readonly leaf: number;
  /** Pages the 「淘氣大王」 cover needs (the game's 65; fixtures pass a smaller book) */
  readonly rewardTotal?: number;
  readonly reduced: boolean;
  readonly still: boolean;
  readonly leftHand: boolean;
  readonly onKeep: (chapter: number, photo: Photo) => void;
  readonly onBack: () => void;
}

/**
 * The album from the cover's 相簿 (GDD § 2.9 album screen; #113): its cover (`AlbumCover`, the
 * 「淘氣大王」 one once earned) and a page per chapter — the photo with its notes, an empty print, or a
 * placeholder for a chapter the line hasn't reached — turned one leaf at a time with the arrows, a
 * one-finger swipe or ← / →. Each chapter's page keeps its 「再拍一次」.
 */
export function AlbumBook({ save, reg, leaf, rewardTotal = GAME_PAGES, reduced, still, leftHand, onKeep, onBack }: AlbumBookProps) {
  const [view, setView] = useState<{ readonly leaf: number; readonly turn: 1 | -1 | 0 }>(() => ({ leaf: clampLeaf(leaf), turn: 0 }));
  const leaves = useMemo(() => albumLeaves(save, reg, rewardTotal), [save, reg, rewardTotal]);
  const onFlip = useCallback(
    (dir: 1 | -1) =>
      setView((v) => {
        const next = flipLeaf(v.leaf, dir);
        return next === null ? v : { leaf: next, turn: dir };
      }),
    [],
  );
  const nav: AlbumNav = { leaves, leaf: view.leaf, onFlip };
  const current = leaves[view.leaf];
  const back: AlbumAction = { id: 'back', onClick: onBack };

  if (current.kind === 'cover') {
    const latest = current.latest;
    return (
      <AlbumCover
        key={ALBUM_COVER}
        leaf={current}
        photo={latest === null ? null : (save.photos[latest] ?? null)}
        def={latest === null ? undefined : spreadPage(latest, reg)}
        reduced={reduced}
        still={still}
        nav={nav}
        turn={view.turn}
        leftHand={leftHand}
        actions={[back]}
      />
    );
  }
  const { chapter } = current;
  return (
    <Album
      key={chapter}
      chapter={chapter}
      def={spreadPage(chapter, reg)}
      photo={current.photo}
      stickers={current.stickers}
      mode="browse"
      state={current.state}
      reduced={reduced}
      still={still}
      nav={nav}
      turn={view.turn}
      leftHand={leftHand}
      onKeep={(photo) => onKeep(chapter, photo)}
      onDone={onBack}
    />
  );
}
