import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Diamonds } from './Panel';
import { charCount, parseMarkup, plainText, splitTyped, typedChars } from './typing';

/**
 * The dialogue box with a bust portrait (art direction § 7.5). Dumb: text, a speaker and a
 * portrait in, `onAdvance` out.
 *
 * - The bottom box (12px margins, min 172px, four diamonds) over a dark scrim on the map.
 * - The bust (300px square, at most 38% of the screen height on short phones) rises from behind
 *   the box's top-left, with a radial backlight in the speaker's colour. The caller frames the
 *   sprite inside the square bust area.
 * - A slanted gold name plate; 21px text typed at 30ms per character (+120ms after 「，。！？」).
 *   Untyped text is laid out already and ghosted at 20%, so typing never reflows; `【詞】` key
 *   terms show in gold.
 * - Footer: diamond page dots, 「點一下繼續」 and a pulsing diamond. A tap anywhere finishes
 *   the line; the next tap advances.
 * - With `actions` (a choice, the inn), the buttons replace the footer and only they respond.
 */

export type Speaker = { name: string; /** Backlight colour, `#RRGGBB` */ color: string };

type Props = {
  /** Script text; `【詞】` marks a key term */
  text: string;
  speaker?: Speaker | null;
  /** The bust: a sprite framed for the square bust area (head and shoulders above the box edge) */
  portrait?: ReactNode;
  /** Where this line sits in its run of lines, for the page dots */
  page?: { index: number; count: number };
  onAdvance?: () => void;
  /** Buttons that replace the footer (choice options, the inn's yes/no) */
  actions?: ReactNode;
  /** Playing the exit animation: no input, slides away */
  leaving?: boolean;
  /** Where the typing starts, ms (the art lab freezes a line half typed); omit to type live */
  frozenAt?: number;
  /** The line's identity: typing restarts when it changes, even for the same words (defaults to the text) */
  lineId?: unknown;
};

/** At most this many page dots; a longer run shows a window around the current line. */
export const MAX_DOTS = 7;

/** The dots to draw for line `index` of `count`: a window of at most MAX_DOTS, and which one is lit. */
export function dotWindow(index: number, count: number, max = MAX_DOTS): { count: number; lit: number } {
  if (count <= max) return { count, lit: index };
  const start = Math.max(0, Math.min(count - max, index - Math.floor(max / 2)));
  return { count: max, lit: index - start };
}

/** Types `plain` out from zero whenever `restart` changes; `finish()` shows it all at once. */
function useTyping(plain: string, restart: unknown, frozenAt?: number): { shown: number; done: boolean; finish: () => void } {
  const total = charCount(plain);
  const [shown, setShown] = useState(frozenAt === undefined ? 0 : typedChars(plain, frozenAt));
  const finished = useRef(false);

  useEffect(() => {
    finished.current = false;
    if (frozenAt !== undefined) {
      setShown(typedChars(plain, frozenAt));
      return undefined;
    }
    setShown(0);
    const start = performance.now();
    let frame = 0;
    let last = -1;
    const tick = (now: number) => {
      if (finished.current) return;
      const count = typedChars(plain, now - start);
      if (count !== last) {
        last = count;
        setShown(count);
      }
      if (count < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `restart` is the line's identity: the same words spoken twice still retype
  }, [plain, restart, total, frozenAt]);

  return {
    shown,
    done: shown >= total,
    finish: () => {
      finished.current = true;
      setShown(total);
    },
  };
}

export const DialogueBox = ({ text, speaker, portrait, page, onAdvance, actions, leaving = false, frozenAt, lineId }: Props) => {
  const segments = useMemo(() => parseMarkup(text), [text]);
  const plain = useMemo(() => plainText(text), [text]);
  const { shown, done, finish } = useTyping(plain, lineId ?? text, frozenAt);
  const parts = splitTyped(segments, shown);
  const dots = page && page.count > 1 ? dotWindow(page.index, page.count) : null;

  const tap = () => {
    if (leaving || actions) return;
    if (!done) finish();
    else onAdvance?.();
  };

  const glow = speaker?.color;
  const backlight: CSSProperties | undefined = glow ? { background: `radial-gradient(circle, ${glow}A0 0%, ${glow}48 34%, ${glow}14 54%, ${glow}00 70%)` } : undefined;

  const body = (
    <>
      <span className={`pointer-events-none absolute inset-0 kit-scrim ${leaving ? 'kit-fade-out' : 'kit-fade-in'}`} aria-hidden="true" />
      <span className="relative block px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <span className="relative block">
          {portrait && speaker && (
            <span
              key={speaker.name}
              aria-hidden="true"
              data-dialogue-bust=""
              className={`pointer-events-none absolute -left-4 bottom-[calc(100%-44px)] block h-[min(300px,38dvh)] w-[min(300px,38dvh)] ${leaving ? 'kit-fade-out' : 'kit-bust-in'}`}
              style={{ clipPath: 'inset(-200px -200px 44px -200px)' }}
            >
              <span className="absolute left-[-27%] top-[-30%] block h-[153%] w-[153%] rounded-full" style={backlight} />
              <span className="absolute inset-0 block">{portrait}</span>
            </span>
          )}
          <span
            data-dialogue-box=""
            className={`kit-panel kit-box relative flex min-h-[172px] w-full flex-col text-left shadow-[0_18px_40px_-12px_rgb(0_0_0/0.9)] ${leaving ? 'kit-box-out' : 'kit-box-in'}`}
          >
            <Diamonds />
            {speaker && <span className="kit-nameplate">{speaker.name}</span>}
            <span
              data-dialogue-text=""
              className={`block min-h-[71px] whitespace-pre-wrap text-dialogue tracking-[0.02em] text-inkOnDark ${speaker ? '' : 'pt-0'}`}
            >
              {parts.map((part, index) => (
                <span key={index} className={[part.key ? 'kit-key' : '', part.ghost ? 'kit-ghost' : ''].join(' ')}>
                  {part.text}
                </span>
              ))}
            </span>
            {actions ? (
              <span className="mt-3 flex flex-col gap-2">{actions}</span>
            ) : (
              <span className="mt-auto grid grid-cols-[1fr_auto_1fr] items-center pt-2 text-caption text-mutedOnDark">
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  {dots && Array.from({ length: dots.count }, (_, index) => <span key={index} className={`kit-dot ${index === dots.lit ? 'kit-dot--on' : ''}`} />)}
                </span>
                <span>點一下繼續</span>
                <span className="flex justify-end pr-1">
                  <span aria-hidden="true" className={done ? 'kit-next' : 'kit-next opacity-25 [animation:none]'} />
                </span>
              </span>
            )}
          </span>
        </span>
      </span>
    </>
  );

  // The whole layer is the tap target, so a small hand can tap anywhere on the screen
  if (actions) {
    return (
      <div className={`absolute inset-0 z-30 flex flex-col justify-end ${leaving ? 'pointer-events-none' : ''}`} role="group" aria-label={plain}>
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={done ? `${speaker ? `${speaker.name}：` : ''}${plain}（點一下繼續）` : `${plain}（全部顯示）`}
      onClick={tap}
      disabled={leaving}
      className="absolute inset-0 z-30 flex w-full flex-col justify-end text-left"
    >
      {body}
    </button>
  );
};
