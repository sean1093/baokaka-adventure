import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs, ref, type KitCtx } from '../../art';
import { LEARN_BEATS, UI, chapterInfo, chapterName } from '../../content';
import { NOTE_NAME, albumChapter, type NoteSpeaker } from '../../content/album';
import type { PageDef } from '../../core/types';
import { backdropImage } from '../../env/loader';
import { albumNotes, type Shot } from '../../game/photo';
import { useFramesReady, useSpritesPreload } from '../../sprites';
import { STICKER_KINDS } from '../hud/stickerArt';
import { AlbumIcon, BackIcon, RetakeIcon } from '../screens/icons';
import { wordSeal } from '../words';
import { PHOTO_H, PHOTO_SPRITES, PHOTO_W, PhotoScene } from './PhotoScene';
import { useTextScale } from '../textSize';
import './photo.css';
import { useSound } from '../sound';

/**
 * One chapter's page in 「寶咖咖一歲的相簿」 (GDD § 2.9; bible § 7 Album; #103): a cream album leaf
 * on 花磚 endpapers bound in the navy linen cover. It shows the chapter (第N章, its title and time),
 * the photo as an instant print (white border, a slight tilt, washi corners, the treasure's name
 * written under it), the word learned big in red serif on its seal, the chapter's sticker grid (6
 * pages × 3 stickers) and the four family notes — 阿嬤, 媽媽, 爸爸, 摩卡 — on coloured sticky notes
 * (`albumNotes`: chosen by chapter, frame and +M).
 *
 * `fresh` (straight after the photo moment): the print flies in from the camera and lands, then the
 * notes pop on 0.6 s apart (§ 2.9 step 5). After a retake both shots lie under the print as two
 * small prints to choose from; the notes follow the chosen one. No photo yet: an empty print with
 * the treasure's silhouette.
 *
 * Every word is ≥ 20 px at ≥ 7 : 1 on paper (R5); the buttons are ≥ 56 px. Reduced motion: the
 * print and the notes fade in. Multi-chapter browsing is #113.
 */

export interface AlbumPageProps {
  readonly chapter: number;
  /** The chapter's spread (its backdrop and `photoRect`) */
  readonly def?: Pick<PageDef, 'backdrop' | 'photoRect'>;
  /** The shots to show: the kept one alone, or the last two after a retake (the player picks) */
  readonly shots: readonly Shot[];
  /** Which of `shots` is shown big (and kept) */
  readonly chosen?: number;
  /** The chapter's stickers: its pages in order, each 解開 / 淘氣 / 土地公 */
  readonly stickers: readonly (readonly [boolean, boolean, boolean])[];
  /** Just taken: the print flies in and the notes pop on */
  readonly fresh?: boolean;
  readonly reduced: boolean;
  readonly still?: boolean;
  /** The buttons at the foot: the main one (marigold) and the quiet one */
  readonly actions: readonly AlbumAction[];
  readonly onChoose?: (index: number) => void;
}

export interface AlbumAction {
  readonly id: 'keep' | 'retake' | 'back';
  readonly onClick: () => void;
}

/** § 2.9 step 5: the notes pop on 0.6 s apart, after the print has landed. */
export const NOTE_GAP_MS = 600;
export const PRINT_LAND_MS = 620;

const NOTE_COLOR: Readonly<Record<NoteSpeaker, string>> = { grandma: C.notePink, mom: C.noteMint, dad: C.noteSky, mocha: C.noteLilac };
const NOTE_TILT: Readonly<Record<NoteSpeaker, number>> = { grandma: -2.2, mom: 1.6, dad: 1.2, mocha: -1.4 };
const TAPE: Readonly<Record<NoteSpeaker, string>> = { grandma: C.washiCeladon, mom: C.washiPink, dad: C.washiPink, mocha: C.washiCeladon };
const ROUND = "'Chiron GoRound TC', sans-serif";

export function AlbumPage({ chapter, def, shots, chosen = shots.length - 1, stickers, fresh = false, reduced, still = false, actions, onChoose }: AlbumPageProps) {
  const ids = useSvgIds('album');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('album'), id: ids }), [ids]);
  const info = chapterInfo(chapter);
  const entry = albumChapter(chapter);
  const shot = shots[chosen] ?? null;
  const notes = useMemo(() => (shot === null ? [] : albumNotes(chapter, shot)), [chapter, shot]);
  const spritesReady = useSpritesPreload(PHOTO_SPRITES);
  const back = def === undefined ? null : backdropImage(def.backdrop);
  const backReady = useFramesReady(back ? [back.url] : []);
  const ready = spritesReady && (back === null || backReady);
  const bg = useMemo(() => kitDefs(ctx, ['tiles', 'linen', 'foil']), [ctx]);
  const animate = fresh && !still;
  // Sound (#105): the print lands with a soft slap, each note pops on with a rising blip
  const sound = useSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const noteCount = notes.length;
  useEffect(() => {
    if (!animate) return undefined;
    const timers = [window.setTimeout(() => soundRef.current([{ cue: 'slap', gain: 0.6 }]), reduced ? 0 : PRINT_LAND_MS * 0.85)];
    for (let i = 0; i < noteCount; i++) timers.push(window.setTimeout(() => soundRef.current([{ cue: 'note', pitch: 2 ** ((i * 3) / 12) }]), PRINT_LAND_MS + i * NOTE_GAP_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [animate, reduced, chosen, noteCount]);
  const collected = stickers.reduce((n, s) => n + s.filter(Boolean).length, 0);
  const total = stickers.length * 3;
  const choosing = shots.length > 1 && onChoose !== undefined;

  return (
    <main
      className="fixed inset-0 flex select-none flex-col overflow-hidden font-body"
      lang="zh-Hant"
      style={{ backgroundColor: C.tile }}
      data-screen="album"
      data-screen-ready={ready ? '' : undefined}
      data-album-chapter={chapter}
      data-album-photo={shot === null ? undefined : `${shot.frame}${shot.mocha ? '+M' : ''}`}
      data-still={still ? '' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={UI.album.title}
    >
      {/* 花磚 endpapers, the linen cover's edge down the binding */}
      <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden="true">
        <g dangerouslySetInnerHTML={{ __html: bg }} />
        <rect width="100%" height="100%" fill={ref(ctx, 'tiles')} />
        <rect width="100%" height="100%" fill={C.shadow} opacity={0.18} />
        <rect width="14" height="100%" fill={ref(ctx, 'linen')} />
        <rect x="14" width="2" height="100%" fill={C.gold} opacity={0.7} />
      </svg>
      {/* The leaf scrolls on a short phone; the buttons stay in reach under it */}
      <div className="relative min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden" data-album-scroll="">
      <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col justify-center pb-1 pl-[22px] pr-[10px]" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <section className="relative flex flex-col gap-3 rounded-[8px] px-3 pb-4 pt-3" style={LEAF} aria-label={`${UI.album.title} ${chapterName(chapter)}`}>
          {/* The album's name on a washi strip, then the chapter, its title and time */}
          <header className="flex flex-col items-center gap-2">
            <h1 className="-rotate-[0.6deg] rounded-[2px] px-4 py-[3px] font-serif text-[20px] font-black tracking-[0.12em]" style={{ backgroundColor: withAlpha(C.washiPink, 0.55), color: C.ink }}>
              {UI.album.title}
            </h1>
            <div className="flex w-full items-center justify-between gap-2">
              <p className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 font-serif text-[20px] font-black" style={{ color: C.sealInk }}>
                  {chapterName(chapter)}
                </span>
                <span className="truncate font-serif text-[24px] font-black" style={{ color: C.ink }}>
                  {info.title}
                </span>
              </p>
              <span className="shrink-0 rounded-[8px] px-3 py-[2px] font-num text-[20px] font-semibold" style={{ backgroundColor: C.cover, color: C.goldLight }}>
                {info.time}
              </span>
            </div>
          </header>

          <div className="flex items-start gap-3">
            {/* The instant print */}
            <div className="relative shrink-0" style={{ width: PRINT_W, height: PRINT_H }}>
              <div key={`${chosen}-${shot?.frame}-${shot?.mocha}`} className={`al-print ${animate ? (reduced ? 'ph-fade' : 'al-fly') : ''}`} data-album-print="">
                <InstantPrint chapter={chapter} def={def} shot={shot} treasure={entry.treasure} />
              </div>
            </div>
            {choosing ? (
              /* After a retake: both shots, to choose the one to keep (the word and the stickers come back once one is kept) */
              <div className="flex min-w-0 flex-1 flex-col items-center gap-4 pt-1" role="radiogroup" aria-label={UI.photo.keep}>
                {shots.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={i === chosen}
                    aria-label={`${UI.photo.keep} ${i + 1}`}
                    className="kit-press relative rounded-[4px] p-[5px]"
                    style={{ backgroundColor: C.printWhite, boxShadow: i === chosen ? `0 0 0 3px ${C.marigold}, 0 0 0 5px ${C.marigoldEdge}, 2px 4px 8px ${withAlpha(C.shadow, 0.4)}` : `2px 4px 8px ${withAlpha(C.shadow, 0.35)}`, transform: `rotate(${i === 0 ? -3 : 2.5}deg)` }}
                    onClick={() => onChoose?.(i)}
                    data-album-choice={i}
                    data-chosen={i === chosen ? '' : undefined}
                  >
                    <PhotoScene chapter={chapter} def={def} frame={s.frame} mocha={s.mocha} width={CHOICE_W} />
                  </button>
                ))}
              </div>
            ) : (
              /* The word learned, big; the chapter's stickers */
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 pt-1">
                <span className="text-[20px] font-bold" style={{ color: C.inkSoft }}>
                  {UI.album.learned}
                </span>
                <span className="relative flex items-center justify-center" style={{ width: 112, height: 72 }}>
                  <svg className="absolute -left-1 top-0 -rotate-6" width={34} height={34} viewBox="-17 -17 34 34" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordSeal(entry.word, 30) }} />
                  <span className="ml-5 font-serif text-[44px] font-black leading-none" style={{ color: C.sealInk }} data-album-word={entry.word}>
                    {LEARN_BEATS[entry.word].title}
                  </span>
                </span>
                <StickerGrid ctx={ctx} stickers={stickers} label={`${UI.album.stickers} ${collected}／${total}`} />
                <span className="font-num text-[20px] font-semibold" style={{ color: C.ink }} aria-hidden="true">
                  {collected}／{total}
                </span>
              </div>
            )}
          </div>

          {/* The four sticky notes */}
          {notes.length > 0 && (
            <ul className="grid grid-cols-2 gap-x-2 gap-y-3 pt-1" data-album-notes="">
              {notes.map((note, i) => (
                <Note key={`${chosen}-${note.speaker}`} speaker={note.speaker} delay={animate ? PRINT_LAND_MS + i * NOTE_GAP_MS : null} reduced={reduced}>
                  {note.text}
                </Note>
              ))}
            </ul>
          )}
        </section>
      </div>
      </div>
      <div className="relative mx-auto flex w-full max-w-[420px] shrink-0 gap-3 pl-[22px] pr-[10px] pt-2" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {actions.map((a) => (
          <ActionButton key={a.id} action={a} main={a.id === 'keep' || (a.id === 'retake' && actions.length === 1)} />
        ))}
      </div>
    </main>
  );
}

/** The print: picture 196 × 147 inside a warm white border, a deeper strip at the foot. */
const PIC_W = 196;
const PIC_H = (PIC_W * PHOTO_H) / PHOTO_W;
const BORDER = 9;
const FOOT = 36;
const PRINT_W = PIC_W + 2 * BORDER;
const PRINT_H = PIC_H + BORDER + FOOT;
/** The two shots to choose between after a retake, beside the print */
const CHOICE_W = 84;

const LEAF: CSSProperties = {
  backgroundColor: C.page,
  backgroundImage: `linear-gradient(90deg, ${withAlpha(C.foldAo, 0.18)} 0, transparent 18px), linear-gradient(170deg, ${C.foldLitHigh} 0%, ${C.page} 60%, ${C.page} 100%)`,
  boxShadow: `inset 1px 1px 0 ${withAlpha(C.cutRim, 0.6)}, 2px 3px 0 ${C.pageEdge}, 4px 6px 0 ${C.pageDark}, 6px 12px 22px ${withAlpha(C.shadow, 0.55)}`,
};

function InstantPrint({ chapter, def, shot, treasure }: { chapter: number; def?: Pick<PageDef, 'backdrop' | 'photoRect'>; shot: Shot | null; treasure: string }) {
  // 大字 (#104): the caption's 25 px glyphs sit tight in the foot strip, clear of the picture
  const big = useTextScale() > 1;
  return (
    <div className="relative" style={{ width: PRINT_W, height: PRINT_H, backgroundColor: C.printWhite, boxShadow: `inset 0 -1px 0 ${C.printShade}, 2px 4px 0 ${withAlpha(C.shadow, 0.25)}, 4px 9px 16px ${withAlpha(C.shadow, 0.4)}` }}>
      <div className="absolute overflow-hidden" style={{ left: BORDER, top: BORDER, width: PIC_W, height: PIC_H, backgroundColor: C.nightInk }}>
        {shot === null ? (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: C.nightCardDeep }} data-album-empty="">
            <svg width={64} height={64} viewBox="-32 -32 64 64" aria-hidden="true">
              <circle r={26} fill="none" stroke={C.chalk} strokeWidth={2} strokeDasharray="5 6" opacity={0.5} />
            </svg>
          </div>
        ) : (
          <PhotoScene chapter={chapter} def={def} frame={shot.frame} mocha={shot.mocha} width={PIC_W} />
        )}
        {/* The print's gloss */}
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(125deg, ${withAlpha(C.printWhite, 0.18)} 0%, transparent 38%)` }} />
      </div>
      <p className="absolute inset-x-0 flex justify-center" style={{ bottom: big ? 6 : 5 }}>
        <span className="font-body text-[20px] font-bold" style={{ color: C.ink, lineHeight: big ? 1.1 : undefined }}>
          {treasure}
        </span>
      </p>
      {/* Washi corners */}
      <span className="absolute -left-3 -top-2 h-[16px] w-[46px] -rotate-[38deg]" style={{ backgroundColor: withAlpha(C.washiCeladon, 0.82) }} aria-hidden="true" />
      <span className="absolute -right-3 -top-2 h-[16px] w-[46px] rotate-[38deg]" style={{ backgroundColor: withAlpha(C.washiPink, 0.82) }} aria-hidden="true" />
    </div>
  );
}

/** A sticky note: its colour, a strip of tape, the speaker's name, the line (≥ 20 px, rounded hand). */
function Note({ speaker, delay, reduced, children }: { speaker: NoteSpeaker; delay: number | null; reduced: boolean; children: ReactNode }) {
  const tilt = NOTE_TILT[speaker];
  const style: CSSProperties = {
    ['--tilt' as string]: `${tilt}deg`,
    ['--tilt-from' as string]: `${tilt * 3}deg`,
    backgroundColor: NOTE_COLOR[speaker],
    boxShadow: `inset 0 -10px 12px -10px ${withAlpha(C.shadow, 0.12)}, 1px 3px 0 ${withAlpha(C.shadow, 0.18)}, 3px 7px 12px ${withAlpha(C.shadow, 0.3)}`,
    animationDelay: delay === null ? undefined : `${delay}ms`,
  };
  const anim = delay === null ? '' : reduced ? ' al-note-fade' : ' al-note';
  return (
    <li className={`al-note-still relative flex min-h-[96px] flex-col gap-1 rounded-[2px] px-3 pb-3 pt-3${anim}`} style={style} data-album-note={speaker}>
      <span className="absolute left-1/2 top-[-7px] h-[14px] w-[50px] -translate-x-1/2 -rotate-2" style={{ backgroundColor: withAlpha(TAPE[speaker], 0.85) }} aria-hidden="true" />
      <span className="self-start border-b-2 font-serif text-[20px] font-black leading-tight" style={{ color: C.ink, borderColor: withAlpha(C.seal, 0.7) }}>
        {NOTE_NAME[speaker]}
      </span>
      <span className="text-[20px] font-bold leading-[1.3]" style={{ color: C.ink, fontFamily: ROUND }}>
        {children}
      </span>
    </li>
  );
}

/** The chapter's 18 stickers: a column per page, its 解開 / 淘氣 / 土地公 down it — foil when earned, a dimple when not. */
function StickerGrid({ ctx, stickers, label }: { ctx: KitCtx; stickers: readonly (readonly [boolean, boolean, boolean])[]; label: string }) {
  const step = 19;
  const r = 7.5;
  const w = stickers.length * step;
  const h = STICKER_KINDS.length * step;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} data-album-stickers={stickers.map((s) => s.map((x) => (x ? 1 : 0)).join('')).join(' ')}>
      {stickers.map((page, col) =>
        page.map((earned, row) => {
          const cx = col * step + step / 2;
          const cy = row * step + step / 2;
          return earned ? (
            <g key={`${col}-${row}`}>
              <circle cx={cx} cy={cy + 1} r={r} fill={C.shadow} opacity={0.3} />
              <circle cx={cx} cy={cy} r={r} fill={ref(ctx, 'foil')} stroke={C.goldDeep} strokeWidth={0.8} />
            </g>
          ) : (
            <circle key={`${col}-${row}`} cx={cx} cy={cy} r={r - 0.5} fill={C.pageDark} stroke={C.dimpleShade} strokeWidth={1} strokeDasharray="2.4 2" />
          );
        }),
      )}
    </svg>
  );
}

function ActionButton({ action, main }: { action: AlbumAction; main: boolean }) {
  const label = action.id === 'keep' ? UI.photo.keep : action.id === 'retake' ? UI.photo.retake : UI.album.back;
  // 大字 (#104): the icon goes over the words, so 「再拍一次」 and 「放進相簿」 stay on one line
  const big = useTextScale() > 1;
  return (
    <button
      type="button"
      onClick={action.onClick}
      data-button={action.id}
      className={`kit-press flex min-h-[60px] flex-1 items-center justify-center rounded-[12px] px-3 ${big ? 'flex-col gap-0 py-1' : 'gap-2'}`}
      style={{ ...(main ? MAIN_BUTTON : QUIET_BUTTON), WebkitTapHighlightColor: 'transparent' }}
    >
      <span aria-hidden="true">{action.id === 'retake' ? <RetakeIcon /> : action.id === 'keep' ? <AlbumIcon /> : <BackIcon />}</span>
      <span className={`whitespace-nowrap font-serif text-[22px] font-black ${big ? 'tracking-[0.02em]' : 'tracking-[0.08em]'}`} style={{ color: C.ink }}>
        {label}
      </span>
    </button>
  );
}

const MAIN_BUTTON: CSSProperties = {
  backgroundColor: C.marigold,
  backgroundImage: `linear-gradient(175deg, ${C.marigoldLight} 0%, ${C.marigold} 48%, ${C.marigoldDeep} 100%)`,
  boxShadow: [`inset 0 0 0 1.5px ${withAlpha(C.marigoldEdge, 0.55)}`, `inset 0 0 0 3.5px ${withAlpha(C.marigoldShine, 0.45)}`, `2px 4px 0 ${withAlpha(C.shadow, 0.45)}`, `4px 9px 16px ${withAlpha(C.shadow, 0.4)}`].join(','),
};
const QUIET_BUTTON: CSSProperties = {
  backgroundColor: C.page,
  backgroundImage: `linear-gradient(170deg, ${C.foldLitHigh} 0%, ${C.page} 55%, ${C.pageDark} 100%)`,
  boxShadow: [`inset 1px 1px 0 ${withAlpha(C.cutRim, 0.55)}`, `0 0 0 1px ${C.pageEdge}`, `2px 4px 0 ${withAlpha(C.shadow, 0.45)}`, `4px 9px 16px ${withAlpha(C.shadow, 0.4)}`].join(','),
};
