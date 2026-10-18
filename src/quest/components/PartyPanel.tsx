import { memo } from 'react';
import { SPRITES } from '../../art/sprites';
import type { SpriteName } from '../../art/types';
import { Bar, HP_NUMBER, hpState } from '../../components/Bars';
import { Num } from '../../components/Chip';
import { HeadRing } from '../../components/CommandPanel';
import { Alert } from '../../components/icons';
import { HEROES, XP_TABLE, heroStats } from '../engine/heroes';
import { UI } from '../engine/strings';
import type { HeroId, Run } from '../engine/types';

/**
 * How each hero is drawn. 阿藍 and 黑糖 borrow existing sprites (the pigeon, the mole king) until
 * their own art lands in issue #17.
 */
export const HERO_SPRITE: Record<HeroId, SpriteName> = { baokaka: 'baokaka', mocha: 'mochaCat', magpie: 'pigeon', bear: 'moleKing' };

/**
 * A hero's head for a gold ring: the icon LOD (option D sprites crop to the head), drawn larger
 * than the ring and nudged up so a legacy full-figure sprite shows its face.
 */
export const HeroHead = ({ hero }: { hero: HeroId }) => {
  const Art = SPRITES[HERO_SPRITE[hero]];
  return (
    <span className="absolute left-[-30%] top-[-8%] block h-[160%] w-[160%]">
      <Art lod="icon" />
    </span>
  );
};

/**
 * The party strip over the bottom of the map: 等級 and 經驗 on the left, 銅板 on the right, then one
 * mini card per hero with 體力 and 元氣 bars. With four heroes on a phone there is no room for the
 * heads (the map shows everyone), so they drop out. Memoised on the run: the world screen
 * re-renders every frame while walking, the panel only when the run changes.
 */
export const PartyPanel = memo(function PartyPanel({ run }: { run: Run }) {
  const next = XP_TABLE[run.level] ?? null;
  const heads = run.party.length <= 3;
  return (
    <section aria-label="隊伍狀態" className="kit-panel px-3 pb-3 pt-2.5">
      <div className="relative mb-2 flex items-center gap-2 text-caption">
        <span className="inline-flex items-baseline gap-1 font-serif tracking-[0.08em] text-gold">
          等級 <Num className="text-[17px]">{run.level}</Num>
        </span>
        <span className="min-w-0 flex-1 truncate text-mutedOnDark">
          經驗 <span className="font-num font-semibold tabular-nums">{next === null ? '已滿' : `${run.xp} / ${next}`}</span>
        </span>
        <span className="inline-flex items-baseline gap-1 text-mutedOnDark">
          {UI.coins} <Num className="text-[17px]">{run.coins}</Num>
        </span>
      </div>

      <div className="relative grid gap-2" style={{ gridTemplateColumns: `repeat(${run.party.length}, minmax(0, 1fr))` }}>
        {run.party.map((hero) => {
          const stats = heroStats(hero, run.level, run.equip[hero]);
          const hp = run.hp[hero];
          const state = hpState(hp, stats.hp);
          return (
            <div key={hero} className="flex min-w-0 items-center gap-2" data-hero={hero}>
              {heads && (
                <HeadRing size={34} dim={hp === 0}>
                  <HeroHead hero={hero} />
                </HeadRing>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-1">
                  <span className="truncate font-serif text-[14px] font-black leading-tight tracking-[0.04em]">{HEROES[hero].name}</span>
                  <span className={`inline-flex shrink-0 items-center font-num text-[12px] font-semibold tabular-nums leading-tight ${HP_NUMBER[state]}`}>
                    {state === 'critical' && <Alert size={11} />}
                    {hp}
                  </span>
                </span>
                <Bar value={hp} max={stats.hp} kind="hp" className="mt-1" />
                <Bar value={run.mp[hero]} max={stats.mp} kind="mp" className="mt-[3px]" />
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
});
