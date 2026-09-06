import type { Target } from '../game/types';
import { SPRITES } from '../../art/sprites';
import { Check } from '../../components/icons';

type Props = { targets: Target[]; found: string[] };

/**
 * The "three things to find" tray. Anything not yet found shows as a faded silhouette
 * plus its name, so the player never has to remember the goal (spec §7).
 */
export const FoundTray = ({ targets, found }: Props) => (
  <div className="flex justify-center gap-2">
    {targets.map((target) => {
      const got = found.includes(target.id);
      const Art = SPRITES[target.sprite];
      return (
        <div
          key={target.id}
          className={[
            'relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2',
            got ? 'bg-surface shadow-card' : 'bg-ink/[0.05]',
          ].join(' ')}
        >
          <span className={`block h-12 w-12 ${got ? 'pop' : 'opacity-30'}`}>
            <Art />
          </span>
          <span className="text-center text-heading font-bold leading-tight">{target.name}</span>
          {got && (
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-leaf text-white">
              <Check size={16} />
            </span>
          )}
        </div>
      );
    })}
  </div>
);
