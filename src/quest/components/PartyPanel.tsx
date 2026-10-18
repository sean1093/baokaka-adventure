import { SPRITES } from '../../art/sprites';
import type { SpriteName } from '../../art/types';
import { HEROES, XP_TABLE, heroStats } from '../engine/heroes';
import { UI } from '../engine/strings';
import type { HeroId, Run } from '../engine/types';

/**
 * How each hero is drawn. 阿藍 and 黑糖 borrow existing sprites (the pigeon, the mole king) until
 * their own art lands in issue #17.
 */
export const HERO_SPRITE: Record<HeroId, SpriteName> = { baokaka: 'baokaka', mocha: 'mochaCat', magpie: 'pigeon', bear: 'moleKing' };

const Meter = ({ value, max, tone }: { value: number; max: number; tone: 'hp' | 'mp' }) => {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const fill = tone === 'mp' ? 'bg-sky' : ratio > 0.5 ? 'bg-leaf' : ratio > 0.22 ? 'bg-sun' : 'bg-berry';
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
      <span className={`block h-full rounded-full ${fill} transition-[width] duration-300`} style={{ width: `${ratio * 100}%` }} />
    </span>
  );
};

/** The party strip: one row per hero with 體力 and 元氣, plus the shared 等級 and 銅板 line. */
export const PartyPanel = ({ run, compact = false }: { run: Run; compact?: boolean }) => {
  const next = XP_TABLE[run.level] ?? null;
  // Four heroes across a phone leave each compact card ~75px: room for the name, the number and
  // the bars, but not for a portrait too (the map already shows everyone)
  const portraits = !compact || run.party.length <= 3;
  return (
    <div className="rounded-3xl bg-surface/95 p-3 text-ink shadow-card backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2 text-caption font-bold">
        <span className="inline-flex items-center gap-1.5">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-cream">{run.level}</span>
          <span className="text-muted">等級</span>
        </span>
        <span className="text-muted">{next === null ? '經驗 已滿' : `經驗 ${run.xp} / ${next}`}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-sun/25 px-2 py-0.5 text-mochaDeep">{UI.coins} {run.coins}</span>
      </div>

      <div className={compact ? 'flex gap-2' : 'flex flex-col gap-2'}>
        {run.party.map((hero) => {
          const Art = SPRITES[HERO_SPRITE[hero]];
          const stats = heroStats(hero, run.level, run.equip[hero]);
          const hp = run.hp[hero];
          return (
            <div key={hero} className={`flex min-w-0 items-center gap-2 ${compact ? 'flex-1' : ''}`}>
              {portraits && (
                <span className={`block h-9 w-9 shrink-0 ${hp === 0 ? 'opacity-30 grayscale' : ''}`}>
                  <Art />
                </span>
              )}
              <span className="min-w-0 flex-1">
                {/* Three heroes across a 375px phone leaves no room for a name and a number side by side */}
                <span className={compact ? 'block' : 'flex items-baseline justify-between gap-1'}>
                  <span className="block truncate text-caption font-extrabold leading-tight">{HEROES[hero].name}</span>
                  <span className="block shrink-0 text-caption font-bold leading-tight tabular-nums text-muted">
                    {hp}/{stats.hp}
                  </span>
                </span>
                <Meter value={hp} max={stats.hp} tone="hp" />
                <span className="mt-1 block">
                  <Meter value={run.mp[hero]} max={stats.mp} tone="mp" />
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
