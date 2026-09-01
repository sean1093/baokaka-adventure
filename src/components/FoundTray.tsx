import type { Target } from '../game/types';
import { SPRITES } from '../art/sprites';

type Props = { targets: Target[]; found: string[] };

/**
 * 底部「要找的三樣東西」。未找到的用淡色剪影 + 名字，
 * 讓玩家隨時知道目標是什麼，不必記住題目（spec §7）。
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
