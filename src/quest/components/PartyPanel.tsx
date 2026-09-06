import { SPRITES } from '../../art/sprites';
import { HEROES, ITEMS, ITEM_ORDER, MAX_LEVEL, XP_TABLE, heroStats } from '../engine/heroes';
import { HERO_ORDER, type Run } from '../engine/types';
import { Bar } from './Bar';

const HERO_SPRITE = { baokaka: SPRITES.baokaka, mocha: SPRITES.mochaCat } as const;

type Props = {
  run: Run;
  /** Shorter layout for the chapter map, where the scene and the walking controls need the room */
  compact?: boolean;
};

/** Level, XP, both heroes' HP and the bag: the between-battles status card. */
export const PartyPanel = ({ run, compact = false }: Props) => {
  const maxed = run.level >= MAX_LEVEL;
  const nextXp = maxed ? run.xp : XP_TABLE[run.level];

  return (
    <div className={`flex flex-col rounded-3xl bg-surface shadow-card ${compact ? 'gap-2 px-4 py-3' : 'gap-3 p-5'}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-label font-extrabold text-cream">{run.level}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-label font-bold">等級 {run.level}</span>
            <span className="text-caption font-bold text-muted">{maxed ? '最高等級' : `經驗 ${run.xp} / ${nextXp}`}</span>
          </div>
          <Bar
            value={maxed ? 1 : run.xp - XP_TABLE[run.level - 1]}
            max={maxed ? 1 : nextXp - XP_TABLE[run.level - 1]}
            tone="sky"
            className="mt-1 h-1.5"
          />
        </div>
      </div>

      {HERO_ORDER.map((hero) => {
        const Art = HERO_SPRITE[hero];
        const { maxHp } = heroStats(hero, run.level);
        return (
          <div key={hero} className="flex items-center gap-3">
            <span className={`block shrink-0 ${compact ? 'h-9 w-9' : 'h-12 w-12'}`}>
              <Art />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-label font-bold">{HEROES[hero].name}</span>
                <span className="text-caption font-bold text-muted">
                  {run.hp[hero]} / {maxHp}
                </span>
              </div>
              <Bar value={run.hp[hero]} max={maxHp} className={compact ? 'mt-1 h-2' : 'mt-1 h-2.5'} />
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2 pt-1">
        {ITEM_ORDER.map((item) => {
          const Art = SPRITES[ITEMS[item].sprite];
          return (
            <span
              key={item}
              className={`inline-flex items-center gap-1 rounded-full py-1 pl-1 pr-2.5 text-caption font-bold ${run.items[item] > 0 ? 'bg-ink/[0.06] text-ink' : 'bg-ink/[0.03] text-muted opacity-60'}`}
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
