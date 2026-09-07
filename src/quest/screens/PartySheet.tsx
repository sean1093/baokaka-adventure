import { useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { HERO_SPRITE } from '../components/PartyPanel';
import { HEROES, ITEMS, ITEM_ORDER, XP_TABLE, heroStats, isEquip, spellsFor } from '../engine/heroes';
import type { HeroId, ItemId, Run } from '../engine/types';

type Tab = 'party' | 'bag';

type Props = {
  open: boolean;
  run: Run;
  onClose: () => void;
  onUseItem: (item: ItemId, hero: HeroId) => void;
  onEquip: (item: ItemId | null, hero: HeroId) => void;
};

const STAT_ROWS: { key: 'atk' | 'def' | 'spd' | 'luck'; label: string }[] = [
  { key: 'atk', label: '武術' },
  { key: 'def', label: '防禦' },
  { key: 'spd', label: '身法' },
  { key: 'luck', label: '幸運' },
];

/** 隊伍 and 百寶袋: stats, spells learned, what each hero wears, and using or equipping things. */
export const PartySheet = ({ open, run, onClose, onUseItem, onEquip }: Props) => {
  const [tab, setTab] = useState<Tab>('party');
  const [who, setWho] = useState<HeroId>(run.party[0]);
  const [picking, setPicking] = useState<ItemId | null>(null);

  const hero = run.party.includes(who) ? who : run.party[0];
  const stats = heroStats(hero, run.level, run.equip[hero]);
  const carried = ITEM_ORDER.filter((item) => (run.items[item] ?? 0) > 0);
  const next = XP_TABLE[run.level] ?? null;

  const close = () => {
    setPicking(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title={tab === 'party' ? '隊伍' : '百寶袋'}>
      <div className="mb-3 flex rounded-full bg-ink/[0.06] p-1">
        {(['party', 'bag'] as Tab[]).map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => {
              setTab(entry);
              setPicking(null);
            }}
            className={`h-10 flex-1 rounded-full text-label font-extrabold transition-colors ${tab === entry ? 'bg-surface shadow-card' : 'text-muted'}`}
          >
            {entry === 'party' ? '隊伍' : `百寶袋 ${carried.length}`}
          </button>
        ))}
      </div>

      {tab === 'party' && (
        <div className="max-h-[58vh] overflow-y-auto pb-2">
          <div className="mb-3 flex gap-1.5">
            {run.party.map((member) => {
              const Art = SPRITES[HERO_SPRITE[member]];
              return (
                <button
                  key={member}
                  type="button"
                  onClick={() => setWho(member)}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-colors ${member === hero ? 'bg-sun/25 ring-2 ring-sun' : 'bg-ink/[0.05]'}`}
                >
                  <span className={`block h-10 w-10 ${run.hp[member] === 0 ? 'opacity-30 grayscale' : ''}`}>
                    <Art />
                  </span>
                  <span className="truncate px-1 text-caption font-extrabold">{HEROES[member].name}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-ink/[0.04] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-copy font-extrabold">{HEROES[hero].name}</span>
              <Chip tone="ink">等級 {run.level}</Chip>
            </div>
            <p className="mb-3 text-caption leading-relaxed text-muted">{HEROES[hero].blurb}</p>

            <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1">
              <Row label="體力" value={`${run.hp[hero]} / ${stats.hp}`} />
              <Row label="真氣" value={`${run.mp[hero]} / ${stats.mp}`} />
              {STAT_ROWS.map((row) => (
                <Row key={row.key} label={row.label} value={String(stats[row.key])} />
              ))}
              <Row label="經驗" value={next === null ? '已滿' : `${run.xp} / ${next}`} />
            </div>

            <p className="mb-1 text-caption font-bold text-muted">仙術</p>
            <div className="mb-3 flex flex-wrap gap-1">
              {spellsFor(hero, run.level).map((spell) => (
                <span key={spell.id} className="rounded-full bg-sky/20 px-2 py-0.5 text-caption font-bold text-skyDeep">
                  {spell.name} · {spell.cost}
                </span>
              ))}
              {spellsFor(hero, run.level).length === 0 && <span className="text-caption text-muted">還沒學會</span>}
            </div>

            <p className="mb-1 text-caption font-bold text-muted">裝備</p>
            {run.equip[hero] ? (
              <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-card">
                <span className="block h-8 w-8 shrink-0">{art(run.equip[hero] as ItemId)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label font-extrabold">{ITEMS[run.equip[hero] as ItemId].name}</span>
                  <span className="block truncate text-caption text-muted">{ITEMS[run.equip[hero] as ItemId].blurb}</span>
                </span>
                <Button size="sm" variant="tonal" onClick={() => onEquip(null, hero)}>
                  脫下
                </Button>
              </div>
            ) : (
              <p className="text-caption text-muted">沒有裝備。到百寶袋選一件穿上。</p>
            )}
          </div>
        </div>
      )}

      {tab === 'bag' && (
        <div className="max-h-[58vh] overflow-y-auto pb-2">
          {carried.length === 0 && <p className="py-8 text-center text-copy text-muted">百寶袋是空的。</p>}
          <div className="flex flex-col gap-1.5">
            {carried.map((item) => (
              <div key={item} className="rounded-2xl bg-ink/[0.04] p-2">
                <div className="flex items-center gap-2">
                  <span className="block h-9 w-9 shrink-0">{art(item)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="truncate text-label font-extrabold">{ITEMS[item].name}</span>
                      <span className="shrink-0 text-caption font-bold text-muted">×{run.items[item]}</span>
                    </span>
                    <span className="block truncate text-caption text-muted">{ITEMS[item].blurb}</span>
                  </span>
                  <Button size="sm" variant={picking === item ? 'primary' : 'tonal'} onClick={() => setPicking(picking === item ? null : item)}>
                    {isEquip(item) ? '穿上' : '使用'}
                  </Button>
                </div>

                {picking === item && (
                  <div className="mt-2 flex gap-1.5">
                    {run.party.map((member) => (
                      <button
                        key={member}
                        type="button"
                        onClick={() => {
                          if (isEquip(item)) onEquip(item, member);
                          else onUseItem(item, member);
                          setPicking(null);
                        }}
                        className="min-h-10 flex-1 rounded-xl bg-surface px-2 text-label font-extrabold shadow-card transition-transform active:scale-[0.96]"
                      >
                        {HEROES[member].name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button size="lg" full variant="tonal" className="mt-3" onClick={close}>
        關起來
      </Button>
    </Sheet>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <span className="flex items-baseline justify-between gap-2 text-label">
    <span className="font-bold text-muted">{label}</span>
    <span className="font-extrabold tabular-nums">{value}</span>
  </span>
);

function art(item: ItemId) {
  const Art = SPRITES[ITEMS[item].sprite];
  return <Art />;
}
