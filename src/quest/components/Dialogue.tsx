import { useEffect, useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { HEROES } from '../engine/heroes';
import { SPEAKERS } from '../engine/events';
import { HERO_ORDER, type HeroId, type Line } from '../engine/types';

/** How fast the text types itself out (ms per character) */
const TYPE_MS = 26;

const isHero = (who: string): who is HeroId => HERO_ORDER.includes(who as HeroId);

const speaker = (who: Line['who']): { name: string; sprite: keyof typeof SPRITES } | null => {
  if (who === null) return null;
  if (isHero(who)) return { name: HEROES[who].name, sprite: who === 'mocha' ? 'mochaCat' : who };
  const entry = SPEAKERS[who];
  return entry ? { name: entry.name, sprite: entry.sprite } : null;
};

/**
 * The 仙劍-style talk box: a portrait, a name plate, and text that types itself out. Tapping
 * anywhere finishes the line instantly, then moves on — the same gesture, never a hunt for a button.
 */
export const Dialogue = ({ line, onAdvance }: { line: Line; onAdvance: () => void }) => {
  const [shown, setShown] = useState(0);
  const who = speaker(line.who);
  const done = shown >= line.text.length;

  useEffect(() => {
    setShown(0);
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor += 1;
      setShown(cursor);
      if (cursor >= line.text.length) window.clearInterval(timer);
    }, TYPE_MS);
    return () => window.clearInterval(timer);
  }, [line]);

  const Art = who ? SPRITES[who.sprite] : null;

  return (
    <button
      type="button"
      aria-label={done ? '繼續' : '全部顯示'}
      onClick={() => (done ? onAdvance() : setShown(line.text.length))}
      className="absolute inset-x-0 bottom-0 z-20 block w-full px-3 pb-3 text-left"
    >
      <div className="sheet-in relative rounded-3xl border border-ink/10 bg-surface/95 p-4 pb-5 shadow-float backdrop-blur">
        {who && Art && (
          <span className="absolute -top-12 left-3 flex items-end gap-2">
            <span className="block h-16 w-16 drop-shadow-[0_6px_10px_rgba(59,42,32,0.35)]">
              <Art />
            </span>
          </span>
        )}
        {who && <p className="mb-1 text-label font-extrabold text-mochaDeep">{who.name}</p>}
        <p className="min-h-[3.4rem] whitespace-pre-wrap text-copy font-bold leading-relaxed">
          {line.text.slice(0, shown)}
          {!done && <span className="opacity-30">{line.text.slice(shown)}</span>}
        </p>
        <span
          aria-hidden="true"
          className={`absolute bottom-2 right-4 text-caption font-bold text-muted ${done ? 'blink' : 'opacity-0'}`}
        >
          ▼
        </span>
      </div>
    </button>
  );
};

/** The chapter title card: a full-bleed wipe with the chapter number and name. */
export const ChapterCard = ({ n, title, onDismiss }: { n: number; title: string; onDismiss: () => void }) => (
  <button
    type="button"
    onClick={onDismiss}
    className="fade-in absolute inset-0 z-30 flex w-full flex-col items-center justify-center gap-3 bg-ink/85 px-8 text-cream backdrop-blur-sm"
  >
    <span className="text-label font-bold tracking-[0.4em] text-cream/60">第 {n} 章</span>
    <span className="h-px w-16 bg-cream/30" />
    <span className="text-display font-extrabold leading-tight">{title}</span>
    <span className="mt-4 text-caption font-bold text-cream/50">點一下繼續</span>
  </button>
);

/** The inn question, asked in the same box the NPC was just talking from. */
export const InnPrompt = ({ price, stickers, onAnswer }: { price: number; stickers: number; onAnswer: (yes: boolean) => void }) => (
  <div className="sheet-in absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
    <div className="rounded-3xl border border-ink/10 bg-surface/95 p-4 shadow-float backdrop-blur">
      <p className="mb-3 text-copy font-bold leading-relaxed">
        睡一下要 {price} 張貼紙。（現在有 {stickers} 張）
      </p>
      <div className="flex gap-2">
        <Button full size="md" onClick={() => onAnswer(true)}>
          好，睡一下
        </Button>
        <Button full size="md" variant="tonal" onClick={() => onAnswer(false)}>
          不用了
        </Button>
      </div>
    </div>
  </div>
);
