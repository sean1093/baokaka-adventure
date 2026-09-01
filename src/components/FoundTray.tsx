import type { Target } from '../game/types';
import { SPRITES } from '../art/sprites';

type Props = { targets: Target[]; found: string[] };

/**
 * The "three things to find" tray. Anything not yet found shows as a faded silhouette
 * plus its name, so the player never has to remember the goal (spec §7).
 */
export const FoundTray = ({ targets, found }: Props) => (
  <div className="mx-auto flex w-full max-w-md justify-center gap-2 px-3">
    {targets.map((target) => {
      const got = found.includes(target.id);
      const Art = SPRITES[target.sprite];
      return (
        <div
          key={target.id}
          className={[
            'flex flex-1 flex-col items-center gap-1 rounded-2xl border-4 px-1 py-2',
            got ? 'border-leaf bg-white' : 'border-dashed border-grey bg-cream',
          ].join(' ')}
        >
          <span className={`block h-12 w-12 ${got ? 'pop' : 'opacity-25'}`}>
            <Art />
          </span>
          <span className="text-base font-bold leading-none">{target.name}</span>
        </div>
      );
    })}
  </div>
);
