import { useCallback, useState, useSyncExternalStore } from 'react';
import type { PageDef } from '../../core/types';
import { keptPhoto, type Shot } from '../../game/photo';
import type { Photo } from '../../game/progress';
import { AlbumPage, type AlbumAction } from './AlbumPage';
import { PhotoMoment } from './PhotoMoment';

/**
 * A chapter's album page with its 「再拍一次」 (GDD § 2.9 step 7; #103): the page (`AlbumPage`), and
 * over it, on a retake, the 3-second photo moment again (no puzzle). The last photo taken is kept
 * at once (`onKeep`, a save trigger); after a retake the previous and the new shot lie side by side
 * and the one the player taps is kept.
 *
 * - `after` (straight from the spread): 「再拍一次」 and 「放進相簿」, which goes on (`onDone`).
 * - `browse` (from the cover's 相簿): 「返回」, and 「再拍一次」 once there is a photo.
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
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};

export function Album({ chapter, def, photo, stickers, mode, fresh = false, mocha, reduced, still = false, retaken, onKeep, onDone, now = Date.now }: AlbumProps) {
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
      <AlbumPage chapter={chapter} def={def} shots={photos} chosen={chosen} stickers={stickers} fresh={flying} reduced={reduced} still={still} actions={actions} onChoose={choose} />
      {retaking && (
        <div className="fixed inset-0 z-[60]">
          <PhotoMoment chapter={chapter} def={def} mocha={mocha ?? current?.mocha ?? false} reduced={reduced} vw={vw} onSnap={snap} />
        </div>
      )}
    </>
  );
}
