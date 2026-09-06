import type { Level, Progress } from '../game/types';
import { SPRITES } from '../../art/sprites';
import { AppBar, Card, Chip, Screen } from '../../components/Screen';
import { Check, Lock } from '../../components/icons';

const MochaCat = SPRITES.mochaCat;

type Props = {
  levels: Level[];
  progress: Progress;
  onOpenLevel: (levelId: number) => void;
  onExit: () => void;
};

export const MapScreen = ({ levels, progress, onOpenLevel, onExit }: Props) => {
  const done = levels.filter((level) => progress.completed.includes(level.id)).length;
  const percent = Math.round((done / Math.max(levels.length, 1)) * 100);

  return (
    <Screen>
      <AppBar title="選一個地方去冒險" kicker="找找看" onBack={onExit} backLabel="回遊戲選單" />

      <Card className="px-5 py-4">
        <p className="text-heading font-bold">
          已完成 {done} / {levels.length}
        </p>
        <span aria-hidden="true" className="mt-3 block h-3 overflow-hidden rounded-full bg-ink/10">
          <span
            className="block h-full rounded-full bg-leaf transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </span>
      </Card>

      {levels.map((level) => {
        const cleared = progress.completed.includes(level.id);
        const locked = level.id > progress.unlockedLevel;
        return (
          <button
            key={level.id}
            type="button"
            disabled={locked}
            onClick={() => onOpenLevel(level.id)}
            className={[
              'flex min-h-touch w-full items-center gap-4 rounded-3xl bg-surface px-5 py-4 text-left shadow-card',
              'transition-transform duration-150 active:scale-[0.98] disabled:pointer-events-none',
              locked ? 'opacity-60' : '',
            ].join(' ')}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sun text-heading font-extrabold">
              {level.id}
            </span>
            <span className="min-w-0 flex-1 text-headline font-extrabold leading-tight">{level.title}</span>
            {cleared && (
              <Chip tone="leaf" className="shrink-0">
                <Check size={18} />
                <span className="sr-only">已完成</span>
              </Chip>
            )}
            {locked && (
              <span className="flex shrink-0 items-center gap-1 text-heading font-bold text-muted">
                <Lock size={20} />
                還沒開
              </span>
            )}
          </button>
        );
      })}

      <div className="mt-2 flex items-center gap-3 text-heading text-muted">
        <span className="block h-16 w-16 shrink-0">
          <MochaCat />
        </span>
        <span>找齊三樣東西就可以往下一個地方走。</span>
      </div>
    </Screen>
  );
};
