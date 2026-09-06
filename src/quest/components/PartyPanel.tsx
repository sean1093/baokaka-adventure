import { SPRITES } from '../../art/sprites';
import { HEROES, ITEMS, ITEM_ORDER, MAX_LEVEL, XP_TABLE, heroStats } from '../engine/heroes';
import { HERO_ORDER, type Run } from '../engine/types';
import { Bar } from './Bar';

const HERO_SPRITE = { baokaka: SPRITES.baokaka, mocha: SPRITES.mochaCat } as const;

/** Level, XP, both heroes' HP and the bag: the between-battles status card. */
export const PartyPanel = ({ run }: { run: Run }) => {
  const maxed = run.level >= MAX_LEVEL;
  const nextXp = maxed ? run.xp : XP_TABLE[run.level];
  return (
    <div className="flex flex-col gap-3 rounded-3xl border-4 border-ink bg-white p-4">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold">等級 {run.level}</span>
          <span className="text-sm font-bold text-ink/70">{maxed ? '最高等級' : `經驗 ${run.xp} / ${nextXp}`}</span>
        </div>
        <Bar value={maxed ? 1 : run.xp - XP_TABLE[run.level - 1]} max={maxed ? 1 : nextXp - XP_TABLE[run.level - 1]} tone="sky" className="h-2" />
      </div>

      {HERO_ORDER.map((hero) => {
        const Art = HERO_SPRITE[hero];
        const { maxHp } = heroStats(hero, run.level);
        return (
          <div key={hero} className="flex items-center gap-3">
            <span className="block h-12 w-12 shrink-0">
              <Art />
            </span>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold">{HEROES[hero].name}</span>
                <span className="text-sm font-bold">
                  {run.hp[hero]} / {maxHp}
                </span>
              </div>
              <Bar value={run.hp[hero]} max={maxHp} />
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        {ITEM_ORDER.map((item) => {
          const Art = SPRITES[ITEMS[item].sprite];
          return (
            <span
              key={item}
              className={`flex items-center gap-1 rounded-full border-2 border-ink px-2 py-1 text-sm font-bold ${run.items[item] > 0 ? 'bg-cream' : 'bg-white opacity-40'}`}
            >
              <span className="block h-6 w-6">
                <Art />
              </span>
              {ITEMS[item].name} ×{run.items[item]}
            </span>
          );
        })}
      </div>
    </div>
  );
};
