import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { loadLines } from '../../content';
import type { LineKey } from '../../core/types';
import { screenImage } from '../../env/loader';
import { EMPTY_TALK, MAX_PER_BEAT, advance, currentBeat, enqueue, type TalkQueue } from '../../game/talk';
import { CardTalk } from '../hud/ChapterBoard';
import { useTextScale } from '../textSize';
import { Quilt, cardShadow, useScreenReady } from './paper';

/**
 * A story scene of 尾聲 (GDD § 5.5; #135): a picture laid on the 花布 quilt like a page of the book —
 * 05:30 at home before page E (`dawn-scene`), the 土地公's little shrine after the credits
 * (`shrine-scene`) — and its lines under it, a tap a beat (the chapter card's tap-through subtitles,
 * `CardTalk`). The last tap ends it. The picture is baked screen art (`env/art/end.ts`); a time chip
 * (「05:30」) can be taped on its corner. A modal: nothing else is in reach while it is up.
 */

export interface StorySceneProps {
  /** Baked screen art key */
  readonly art: string;
  /** The lines, a group per beat (a group longer than a beat holds is split) */
  readonly beats: readonly (readonly LineKey[])[];
  /** The dialog's accessible name */
  readonly label: string;
  /** A time chip taped on the picture's corner (atmosphere only, R3) */
  readonly time?: string;
  readonly reduced: boolean;
  readonly still?: boolean;
  /** The beat to show first (fixtures) */
  readonly startBeat?: number;
  /** The tap layer's accessible name */
  readonly nextLabel: string;
  readonly onDone: () => void;
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;

/** The picture's aspect (`SCENE_BOX`: 390 × 500). */
const ASPECT = 500 / 390;

export function StoryScene({ art, beats, label, time, reduced, still = false, startBeat = 0, nextLabel, onDone }: StorySceneProps) {
  const img = screenImage(art);
  const ready = useScreenReady([art, 'quilt']);
  const [vw, vh] = useSyncExternalStore(subscribeResize, readSize, () => '390x844').split('x').map(Number);
  // 大字 (#104): fewer lines a beat
  const perBeat = useTextScale() > 1 ? 2 : MAX_PER_BEAT;
  const initial = useMemo(() => {
    let q = beats.reduce((acc: TalkQueue, group) => enqueue(acc, loadLines(group), perBeat), EMPTY_TALK);
    for (let i = 0; i < startBeat; i++) q = advance(q);
    return q;
  }, [beats, perBeat, startBeat]);
  const [talk, setTalk] = useState(initial);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const ended = useRef(false);
  useEffect(() => {
    if (currentBeat(talk) !== null || ended.current || still) return;
    ended.current = true;
    doneRef.current();
  }, [talk, still]);
  // The picture as large as leaves room for a beat of lines under it
  const width = Math.min(vw - 32, 366, (vh - 300) / ASPECT);
  const height = width * ASPECT;
  return (
    <div
      className="fixed inset-0 z-[46] select-none overflow-hidden font-body"
      lang="zh-Hant"
      role="dialog"
      aria-modal={true}
      aria-label={label}
      data-screen={art}
      data-screen-ready={ready ? '' : undefined}
      data-still={still ? '' : undefined}
    >
      <Quilt />
      <div className="absolute inset-0" style={{ backgroundColor: C.nightInk, opacity: 0.28 }} />
      <div className="relative flex h-full flex-col items-center" style={{ paddingTop: 'calc(18px + env(safe-area-inset-top))' }}>
        <figure
          className={`relative shrink-0 ${reduced || still ? '' : 'story-in'}`}
          style={{ width, height, padding: 6, backgroundColor: C.standeeCard, boxShadow: cardShadow(1.2), transform: 'rotate(-0.8deg)' }}
          data-story-picture=""
        >
          {img && <img src={img.url} alt="" width={width - 12} height={height - 12} className="block h-full w-full" draggable={false} />}
          <span className="absolute -left-3 -top-2 h-[18px] w-[58px] -rotate-[28deg]" style={{ backgroundColor: withAlpha(C.washiPink, 0.85) }} aria-hidden="true" />
          <span className="absolute -right-3 -top-2 h-[18px] w-[58px] rotate-[28deg]" style={{ backgroundColor: withAlpha(C.washiCeladon, 0.85) }} aria-hidden="true" />
          {time !== undefined && (
            <span className="absolute bottom-3 right-3 rounded-[12px] px-4 py-[6px] font-num text-[20px] font-semibold leading-none" style={{ backgroundColor: C.cover, color: C.goldLight, boxShadow: `0 0 0 3px ${C.cover}`, transform: 'rotate(0.8deg)' }} data-story-time="">
              {time}
            </span>
          )}
        </figure>
        <div className="mt-3 flex w-full justify-center">
          <CardTalk beat={currentBeat(talk)} serial={talk.serial} width={Math.min(vw - 24, 366)} reduced={reduced} />
        </div>
      </div>
      <button type="button" className="absolute inset-0 cursor-default opacity-0" aria-label={nextLabel} onClick={() => setTalk(advance)} data-story-next="" />
    </div>
  );
}
