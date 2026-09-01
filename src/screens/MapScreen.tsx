import type { Level, Progress } from '../game/types';
import { SPRITES } from '../art/sprites';

const MochaCat = SPRITES.mochaCat;

type Props = {
  levels: Level[];
  progress: Progress;
  onOpenLevel: (levelId: number) => void;
};

export const MapScreen = ({ levels, progress, onOpenLevel }: Props) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-6">
    <h1 className="text-title font-bold">選一個地方去冒險</h1>

    {levels.map((level) => {
      const done = progress.completed.includes(level.id);
      const locked = level.id > progress.unlockedLevel;
      return (
        <button
          key={level.id}
          type="button"
          disabled={locked}
          onClick={() => onOpenLevel(level.id)}
          className={[
            'flex min-h-touch items-center gap-4 rounded-3xl border-4 border-ink px-5 py-4 text-left',
            'transition-transform active:translate-y-1',
            locked ? 'bg-grey/30 opacity-50' : done ? 'bg-leaf/25' : 'bg-sun',
            'shadow-[0_5px_0_#3B2A20]',
          ].join(' ')}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-ink bg-cream text-body font-bold">
            {level.id}
          </span>
          <span className="flex-1 text-body font-bold leading-tight">{level.title}</span>
          {done && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-ink bg-leaf text-white">
              ✓
            </span>
          )}
          {locked && <span className="shrink-0 text-base font-bold">還沒開</span>}
        </button>
      );
    })}

    <div className="mt-2 flex items-center gap-3 text-base text-ink/70">
      <span className="block h-16 w-16 shrink-0">
        <MochaCat />
      </span>
      <span>找齊三樣東西就可以往下一個地方走。</span>
    </div>
  </div>
);
