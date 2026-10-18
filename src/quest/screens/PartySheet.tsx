import { useState } from 'react';
import { SPRITES } from '../../art/sprites';
import { StatBars } from '../../components/Bars';
import { Button, Switch } from '../../components/Button';
import { Tag } from '../../components/Chip';
import { HeadRing } from '../../components/CommandPanel';
import { ListRow, Sheet } from '../../components/Sheet';
import { HeroHead } from '../components/PartyPanel';
import { HEROES, ITEMS, ITEM_ORDER, XP_TABLE, canWear, heroStats, isEquip, spellsFor } from '../engine/heroes';
import { UI } from '../engine/strings';
import type { HeroId, ItemId, Run } from '../engine/types';

type Tab = 'party' | 'bag' | 'settings';

/** Where the sheet opens: a tab, and optionally an item already picked (the art lab's fixtures). */
export type SheetStart = { tab: Tab; picking?: ItemId };

type Props = {
  open: boolean;
  start?: SheetStart;
  run: Run;
  sound: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onUseItem: (item: ItemId, hero: HeroId) => void;
  onEquip: (item: ItemId | null, hero: HeroId) => void;
  onToggleSound: () => void;
  onReducedMotion: (on: boolean) => void;
};

const STAT_ROWS: { key: 'atk' | 'def' | 'spd' | 'luck'; label: string }[] = [
  { key: 'atk', label: UI.atk },
  { key: 'def', label: UI.def },
  { key: 'spd', label: UI.spd },
  { key: 'luck', label: UI.luck },
];

const TAB_TITLE: Record<Tab, string> = { party: '隊伍', bag: '百寶袋', settings: '設定' };

/**
 * 隊伍, 百寶袋 and 設定 in the bottom sheet (art direction § 7.8): stats, 才藝 learned, what each
 * hero wears, using or equipping things, and the 減少動態 / sound switches. The tabs' final
 * content (抓周盤, 任務) is #19; this is the frame and the rows.
 */
export const PartySheet = ({ open, start, run, sound, reducedMotion, onClose, onUseItem, onEquip, onToggleSound, onReducedMotion }: Props) => {
  const [tab, setTab] = useState<Tab>(start?.tab ?? 'party');
  const [who, setWho] = useState<HeroId>(run.party[0]);
  const [picking, setPicking] = useState<ItemId | null>(start?.picking ?? null);

  const hero = run.party.includes(who) ? who : run.party[0];
  const stats = heroStats(hero, run.level, run.equip[hero]);
  const carried = ITEM_ORDER.filter((item) => (run.items[item] ?? 0) > 0);
  const next = XP_TABLE[run.level] ?? null;
  const worn = run.equip[hero];

  const close = () => {
    setPicking(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title={TAB_TITLE[tab]}>
      <div role="tablist" aria-label="選單" className="mb-3 grid grid-cols-3 gap-1.5">
        {(['party', 'bag', 'settings'] as Tab[]).map((entry) => (
          <button
            key={entry}
            type="button"
            role="tab"
            aria-selected={tab === entry}
            onClick={() => {
              setTab(entry);
              setPicking(null);
            }}
            className={`kit-inset kit-press min-h-[44px] font-serif text-label tracking-[0.1em] ${tab === entry ? 'kit-inset--on text-gold-light' : 'text-mutedOnDark'}`}
          >
            {entry === 'bag' ? (
              <>
                百寶袋 <span className="font-num text-[14px]">{carried.length}</span>
              </>
            ) : (
              TAB_TITLE[entry]
            )}
          </button>
        ))}
      </div>

      {tab === 'party' && (
        <div className="max-h-[56vh] overflow-y-auto pb-1">
          <div className="mb-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${run.party.length}, minmax(0, 1fr))` }}>
            {run.party.map((member) => (
              <button
                key={member}
                type="button"
                aria-pressed={member === hero}
                onClick={() => setWho(member)}
                className={`kit-inset kit-press flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 py-2 ${member === hero ? 'kit-inset--on' : ''}`}
              >
                <HeadRing size={36} dim={run.hp[member] === 0}>
                  <HeroHead hero={member} />
                </HeadRing>
                <span className="w-full truncate px-1 text-center font-serif text-caption tracking-[0.04em]">{HEROES[member].name}</span>
              </button>
            ))}
          </div>

          <div className="kit-inset p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-serif text-heading tracking-[0.1em]">{HEROES[hero].name}</span>
              <Tag>
                等級 <span className="ml-1 font-num">{run.level}</span>
              </Tag>
            </div>
            <p className="mb-3 text-caption leading-relaxed text-mutedOnDark">{HEROES[hero].blurb}</p>

            <StatBars hp={run.hp[hero]} hpMax={stats.hp} mp={run.mp[hero]} mpMax={stats.mp} className="mb-3" />

            <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {STAT_ROWS.map((row) => (
                <Row key={row.key} label={row.label} value={String(stats[row.key])} />
              ))}
              <Row label="經驗" value={next === null ? '已滿' : `${run.xp} / ${next}`} />
            </div>

            <p className="mb-1.5 font-serif text-caption tracking-[0.1em] text-gold">{UI.skill}</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {spellsFor(hero, run.level).map((spell) => (
                <Tag key={spell.id}>
                  {spell.name}
                  <span className="ml-1 font-num text-mutedOnDark">{spell.cost}</span>
                </Tag>
              ))}
              {spellsFor(hero, run.level).length === 0 && <span className="text-caption text-mutedOnDark">還沒學會</span>}
            </div>

            <p className="mb-1.5 font-serif text-caption tracking-[0.1em] text-gold">裝備</p>
            {worn ? (
              <ListRow>
                <ItemIcon item={worn} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-label tracking-[0.04em]">{ITEMS[worn].name}</span>
                  <span className="line-clamp-2 block text-caption leading-snug text-mutedOnDark">{ITEMS[worn].blurb}</span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => onEquip(null, hero)}>
                  脫下
                </Button>
              </ListRow>
            ) : (
              <p className="text-caption text-mutedOnDark">沒有裝備。到百寶袋選一件穿上。</p>
            )}
          </div>
        </div>
      )}

      {tab === 'bag' && (
        <div className="max-h-[56vh] overflow-y-auto pb-1">
          {carried.length === 0 && <p className="py-8 text-center text-body text-mutedOnDark">百寶袋是空的。</p>}
          <div className="flex flex-col gap-2">
            {carried.map((item) => (
              <div key={item} className={`kit-inset px-3 py-2 ${picking === item ? 'kit-inset--on' : ''}`}>
                <div className="flex min-h-[48px] items-center gap-3">
                  <ItemIcon item={item} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="font-serif text-label tracking-[0.04em]">{ITEMS[item].name}</span>
                      <span className="shrink-0 font-num text-caption text-gold-light">×{run.items[item]}</span>
                      {ITEMS[item].only && <Tag tone="gold">{UI.onlyTag(ITEMS[item].only)}</Tag>}
                    </span>
                    <span className="line-clamp-2 block text-caption leading-snug text-mutedOnDark">{ITEMS[item].blurb}</span>
                  </span>
                  <Button size="sm" variant={picking === item ? 'primary' : 'secondary'} onClick={() => setPicking(picking === item ? null : item)}>
                    {isEquip(item) ? '穿上' : '使用'}
                  </Button>
                </div>

                {picking === item && (
                  <>
                    <p className="mb-1.5 mt-2 text-caption text-mutedOnDark">{isEquip(item) ? '要給誰穿？' : '要給誰用？'}</p>
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${run.party.length}, minmax(0, 1fr))` }}>
                      {run.party.map((member) => {
                        // Signature gear greys out everyone but its owner; the reason sits under the row
                        const barred = isEquip(item) && !canWear(member, item);
                        return (
                          <Button
                            key={member}
                            size="sm"
                            variant="secondary"
                            disabled={barred}
                            label={barred ? `${HEROES[member].name}：${UI.onlyWear(ITEMS[item].only as HeroId)}` : undefined}
                            onClick={() => {
                              if (isEquip(item)) onEquip(item, member);
                              else onUseItem(item, member);
                              setPicking(null);
                            }}
                            className="min-w-0 !px-1 !tracking-normal"
                          >
                            <span className="truncate">{HEROES[member].name}</span>
                          </Button>
                        );
                      })}
                    </div>
                    {ITEMS[item].only && <p className="mt-1.5 text-center text-caption text-mutedOnDark">{UI.onlyWear(ITEMS[item].only)}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="kit-inset flex flex-col divide-y divide-gold/20 px-3 py-1">
          <Switch label="減少動態" hint="不閃爍、不翻轉、不晃動，換成淡入淡出" on={reducedMotion} onToggle={onReducedMotion} />
          <Switch label="聲音" hint="音樂和音效" on={sound} onToggle={() => onToggleSound()} />
        </div>
      )}

      <Button size="lg" full variant="secondary" className="mt-3" onClick={close}>
        關起來
      </Button>
    </Sheet>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <span className="flex items-baseline justify-between gap-2 text-label">
    <span className="text-mutedOnDark">{label}</span>
    <span className="font-num font-semibold tabular-nums text-inkOnDark">{value}</span>
  </span>
);

/** An item's art in a small round gold-edged well. */
export const ItemIcon = ({ item, size = 44 }: { item: ItemId; size?: number }) => {
  const Art = SPRITES[ITEMS[item].sprite];
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full border border-gold/45 bg-[radial-gradient(circle_at_50%_35%,theme(colors.command.top),theme(colors.panel.deep))] p-1.5"
      style={{ width: size, height: size }}
    >
      <Art lod="icon" />
    </span>
  );
};
