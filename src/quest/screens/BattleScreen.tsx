import { useEffect, useRef, useState } from 'react';
import { BACKDROPS } from '../../art/backdrops';
import { SPRITES } from '../../art/sprites';
import type { PaletteName } from '../../art/types';
import { CommandButton } from '../../components/Button';
import { GlassChip, Num } from '../../components/Chip';
import { CommandGrid, CommandPanel, PartyCard } from '../../components/CommandPanel';
import { Cube, Cup, Shield, Talent } from '../../components/icons';
import { SoundToggle } from '../../components/Screen';
import { playTone } from '../../shared/audio';
import { BattleFx, type Spot } from '../components/BattleFx';
import { HERO_SPRITE, HeroHead } from '../components/PartyPanel';
import { aliveFoeSlots, battleBoss, canCast, foeIntent, sameWho } from '../engine/battle';
import { FOES } from '../engine/foes';
import { HEROES, ITEMS, ITEM_ORDER, SPELLS, spellsFor } from '../engine/heroes';
import { UI } from '../engine/strings';
import type { Battle, BattleAction, BattleEvent, HeroId, ItemId, SpellId, Who } from '../engine/types';

/** Pause between foe actions so each one can be read (ms) */
const FOE_TICK_MS = 800;
const END_DELAY_MS = 900;

/** Column centres for 1..3 foes, as fractions of the arena width */
const COLUMNS: Record<number, number[]> = { 1: [0.5], 2: [0.3, 0.7], 3: [0.18, 0.5, 0.82] };
/** Vertical centre of the foe rank, as a fraction of the arena height */
const FOE_Y = 0.27;
/**
 * Where 1..4 heroes stand (centres, as fractions of the arena) and how wide each is drawn. Up to
 * three share one rank; four stand in two staggered rows, so no sprite covers another's face.
 */
const HERO_SPOTS: Record<number, { spots: Spot[]; width: number }> = {
  1: { spots: [{ x: 0.5, y: 0.79 }], width: 0.24 },
  2: { spots: [{ x: 0.33, y: 0.79 }, { x: 0.67, y: 0.79 }], width: 0.24 },
  3: { spots: [{ x: 0.24, y: 0.79 }, { x: 0.5, y: 0.79 }, { x: 0.76, y: 0.79 }], width: 0.24 },
  4: {
    spots: [
      { x: 0.16, y: 0.83 },
      { x: 0.38, y: 0.7 },
      { x: 0.62, y: 0.83 },
      { x: 0.84, y: 0.7 },
    ],
    width: 0.21,
  },
};

type Menu = 'root' | 'spell' | 'item';
type Pending = { kind: 'attack' } | { kind: 'spell'; spell: SpellId } | { kind: 'item'; item: ItemId };

const whoName = (who: Who, battle: Battle): string =>
  who.side === 'hero' ? HEROES[who.hero].name : FOES[battle.foes[who.slot].foe].name;

/** The one-line battle log: what just happened, in words. */
function logLine(battle: Battle): string {
  if (battle.step === 0) {
    const boss = battle.foes.find((foe) => FOES[foe.foe].boss);
    const taunt = boss && FOES[boss.foe].taunt;
    return taunt ? `${FOES[boss.foe].name}:「${taunt}」` : '搗蛋鬼出現了！';
  }
  const parts: string[] = [];
  for (const event of battle.events) {
    switch (event.kind) {
      case 'act':
        parts.push(`${whoName(event.who, battle)} 使出「${event.name}」`);
        break;
      case 'hit':
        parts.push(`${whoName(event.who, battle)} ${event.crit ? '暴擊 ' : ''}-${event.amount}`);
        break;
      case 'heal':
        parts.push(`${whoName(event.who, battle)} +${event.amount}`);
        break;
      case 'mp':
        if (event.amount > 0) parts.push(`${UI.mp} +${event.amount}`);
        break;
      case 'guard':
        parts.push(`${whoName(event.who, battle)} 防禦`);
        break;
      case 'shield':
        parts.push(UI.shielded);
        break;
      case 'revive':
        parts.push(`${whoName(event.who, battle)} 站起來了！`);
        break;
      case 'flee':
        parts.push(event.ok ? UI.fleeOk : UI.fleeFail);
        break;
      case 'ko':
        parts.push(event.who.side === 'hero' ? UI.heroKo(whoName(event.who, battle)) : UI.foeKo(whoName(event.who, battle)));
        break;
    }
  }
  // Lines that already end in their own punctuation (「溜走了！」) don't take another comma
  return parts.reduce((log, part) => (log === '' ? part : /[！…。]$/.test(log) ? `${log}${part}` : `${log}，${part}`), '') || '……';
}

/** Damage numbers (§ 7.4): Fredoka italic, white with a deep-pink stroke; heals in green, MP in blue. */
const NUMBER = 'font-num italic font-bold leading-none [paint-order:stroke_fill]';
/** Words (防禦, 累倒了): a small glass tag. */
const WORD = 'kit-glass rounded px-2 py-0.5 font-serif text-label not-italic';

/** A number that floats up off whoever it happened to. */
const floater = (event: BattleEvent): { text: string; tone: string } | null => {
  switch (event.kind) {
    case 'hit':
      return event.crit
        ? { text: `暴擊 ${event.amount}`, tone: `${NUMBER} text-[30px] text-gold-light [-webkit-text-stroke:5px_theme(colors.damage.stroke)]` }
        : { text: `${event.amount}`, tone: `${NUMBER} text-[34px] text-damage [-webkit-text-stroke:5px_theme(colors.damage.stroke)]` };
    case 'heal':
      return event.amount > 0 ? { text: `+${event.amount}`, tone: `${NUMBER} text-[30px] text-hp-to [-webkit-text-stroke:5px_theme(colors.panel.deep)]` } : null;
    case 'mp':
      return event.amount > 0 ? { text: `${UI.mp} +${event.amount}`, tone: `${NUMBER} text-[22px] text-mp-to [-webkit-text-stroke:4px_theme(colors.panel.deep)]` } : null;
    case 'guard':
      return { text: '防禦', tone: WORD };
    case 'ko':
      return { text: event.who.side === 'hero' ? '累倒了' : '頭暈暈', tone: WORD };
    default:
      return null;
  }
};

type Props = {
  battle: Battle;
  palette: PaletteName;
  /** Where and when: the map's name and clock for the stage's glass chip */
  place?: { title: string; time: string };
  soundOn: boolean;
  onAction: (action: BattleAction) => void;
  onEnd: () => void;
  onToggleSound: () => void;
};

export const BattleScreen = ({ battle, palette, place, soundOn, onAction, onEnd, onToggleSound }: Props) => {
  const { phase } = battle;
  const hero = phase.kind === 'hero' ? phase.hero : null;
  const alive = aliveFoeSlots(battle);
  const columns = COLUMNS[battle.foes.length] ?? COLUMNS[3];
  const rank = HERO_SPOTS[battle.party.length] ?? HERO_SPOTS[4];
  const Backdrop = BACKDROPS[palette];

  const [menu, setMenu] = useState<Menu>('root');
  const [pending, setPending] = useState<Pending | null>(null);

  const callbacks = useRef({ onAction, onEnd, soundOn });
  callbacks.current = { onAction, onEnd, soundOn };

  // Foes act on a timer; a finished battle waits a beat so the last number can be read
  useEffect(() => {
    if (phase.kind === 'foe') {
      const timer = window.setTimeout(() => callbacks.current.onAction({ type: 'tick' }), FOE_TICK_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase.kind === 'won' || phase.kind === 'lost' || phase.kind === 'fled') {
      const timer = window.setTimeout(() => callbacks.current.onEnd(), END_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [phase.kind, phase.kind === 'foe' ? phase.slot : phase.kind === 'hero' ? phase.hero : '', battle.step]);

  // A new actor gets a fresh menu
  useEffect(() => {
    setMenu('root');
    setPending(null);
  }, [hero, battle.round]);

  // Sound follows the events of the step that just resolved
  useEffect(() => {
    const { soundOn: on } = callbacks.current;
    const events = battle.events;
    if (events.some((event) => event.kind === 'heal' && event.amount > 0)) playTone('heal', on);
    else if (events.some((event) => event.kind === 'hit' && event.who.side === 'hero')) playTone('hit', on);
    else if (events.some((event) => event.kind === 'hit')) playTone('found', on);
  }, [battle.step]);

  // Where each combatant stands, as fractions of the arena. Shared by the layout below and the
  // effect layer, so a strike always lands exactly on the sprite it hit.
  const spot = (who: Who): Spot | null => {
    if (who.side === 'foe') {
      const column = columns[who.slot];
      return column === undefined ? null : { x: column, y: FOE_Y };
    }
    const index = battle.party.indexOf(who.hero);
    return index < 0 ? null : (rank.spots[index] ?? null);
  };

  // Heavy landings shake the arena: a crit, an AoE, or anything that knocks someone down
  const quake = battle.events.some(
    (event) => (event.kind === 'hit' && event.crit) || event.kind === 'ko' || battle.events.filter((e) => e.kind === 'hit').length > 1,
  );

  const spells = hero ? spellsFor(hero, battle.level) : [];
  const carried = ITEM_ORDER.filter((item) => (battle.items[item] ?? 0) > 0 && ITEMS[item].use.kind !== 'equip');

  /** What the pending choice still needs before it can be sent. */
  const needs: 'foe' | 'hero' | null = (() => {
    if (!pending) return null;
    if (pending.kind === 'attack') return 'foe';
    if (pending.kind === 'item') return 'hero';
    const effect = SPELLS[pending.spell].effect;
    if (effect.kind === 'damage') return effect.target === 'one' ? 'foe' : null;
    if (effect.kind === 'heal') return effect.target === 'ally' ? 'hero' : null;
    return null;
  })();

  const send = (action: BattleAction) => {
    setPending(null);
    setMenu('root');
    playTone('tap', soundOn);
    onAction(action);
  };

  /** Picks a command; anything that needs a target parks in `pending` until one is tapped. */
  const choose = (choice: Pending) => {
    playTone('tap', soundOn);
    if (choice.kind === 'spell') {
      const effect = SPELLS[choice.spell].effect;
      const single = (effect.kind === 'damage' && effect.target === 'one') || (effect.kind === 'heal' && effect.target === 'ally');
      if (!single) {
        send({ type: 'spell', spell: choice.spell });
        return;
      }
    }
    // With one foe left there is nothing to choose, so an attack resolves straight away
    if (choice.kind === 'attack' && alive.length === 1) {
      send({ type: 'attack', target: alive[0] });
      return;
    }
    setMenu('root');
    setPending(choice);
  };

  const pickFoe = (slot: number) => {
    if (!pending) return;
    if (pending.kind === 'attack') send({ type: 'attack', target: slot });
    else if (pending.kind === 'spell') send({ type: 'spell', spell: pending.spell, target: slot });
  };

  const pickHero = (target: HeroId) => {
    if (!pending) return;
    if (pending.kind === 'item') send({ type: 'item', item: pending.item, target });
    else if (pending.kind === 'spell') send({ type: 'spell', spell: pending.spell, target });
  };

  /** Who moves after the current actor: the reason 身手 is a stat worth reading. */
  const nextUp = (() => {
    const isAlive = (who: Who) => (who.side === 'hero' ? battle.heroes[who.hero].hp > 0 : battle.foes[who.slot].hp > 0);
    const upcoming = battle.order.slice(battle.turn + 1).find(isAlive) ?? battle.order.find(isAlive);
    return upcoming ? whoName(upcoming, battle) : '——';
  })();

  const boss = battleBoss(battle);
  const bossName = boss ? FOES[boss].name : null;

  const headline =
    phase.kind === 'won'
      ? bossName
        ? UI.bossVictory(bossName)
        : UI.victory
      : phase.kind === 'lost'
        ? UI.defeat[0]
        : phase.kind === 'fled'
          ? UI.fleeOk
          : phase.kind === 'foe'
            ? `${FOES[battle.foes[phase.slot].foe].name} 的回合`
            : needs === 'foe'
              ? '要打哪一個？'
              : needs === 'hero'
                ? '要給誰？'
                : `${HEROES[phase.hero].name}要做什麼？`;

  const cancel = () => {
    setPending(null);
    setMenu('root');
  };
  const link =
    hero && (pending || menu !== 'root')
      ? { label: '取消', onClick: cancel }
      : hero
        ? { label: battle.boss ? '逃不掉' : UI.commands.flee, onClick: () => send({ type: 'flee' }), disabled: battle.boss }
        : null;

  return (
    <main className="kit-fade-in mx-auto flex h-dvh w-full max-w-md flex-col">
      {/* The stage: foes on the far side, the party on the near side (restyled in #14) */}
      <div className={`relative min-h-0 flex-1 overflow-hidden ${quake ? 'fx-quake' : ''}`} key={`arena${quake ? battle.step : 0}`}>
        <Backdrop />
        <div className="absolute inset-0 bg-gradient-to-b from-scrim/30 via-transparent to-scrim/50" />

        <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),10px)]">
          <GlassChip className="min-w-0">
            <span className="truncate">{place ? place.title : battle.boss ? '頭目戰' : '遭遇戰'}</span>
            {place && <Num className="text-[14px]">{place.time}</Num>}
          </GlassChip>
          <span className="flex-1" />
          <GlassChip>
            第 <Num className="text-[16px]">{battle.round}</Num> 回合
          </GlassChip>
          <SoundToggle on={soundOn} onToggle={onToggleSound} />
        </header>


        {battle.foes.map((state, slot) => {
          const foe = FOES[state.foe];
          const Art = SPRITES[foe.sprite];
          const dead = state.hp === 0;
          const targetable = needs === 'foe';
          const size = foe.boss ? 0.42 : battle.foes.length === 1 ? 0.34 : battle.foes.length === 2 ? 0.3 : 0.26;
          const hit = battle.events.find((event) => event.kind !== 'flee' && event.kind !== 'shield' && sameWho(event.who, { side: 'foe', slot }));
          const struck = battle.events.some((event) => event.kind === 'hit' && sameWho(event.who, { side: 'foe', slot }));
          const acting = battle.events.some((event) => event.kind === 'act' && sameWho(event.who, { side: 'foe', slot }));
          const float = hit ? floater(hit) : null;

          return (
            <button
              key={slot}
              type="button"
              disabled={dead || !targetable}
              onClick={() => pickFoe(slot)}
              aria-label={foe.name}
              className="absolute min-h-[44px] min-w-[44px] disabled:pointer-events-none"
              style={{ left: `${columns[slot] * 100}%`, top: `${FOE_Y * 100}%`, width: `${size * 100}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span className={`relative block ${dead ? 'opacity-0' : ''} ${acting ? 'lunge-down' : ''} ${struck ? 'fx-hurt' : ''}`} key={`s${battle.step}`}>
                <span className="block aspect-square w-full">
                  <Art lod="battle" />
                </span>
                {state.guard && <span className="absolute -right-1 top-0 rounded-sm bg-mp-from px-1.5 font-serif text-caption text-inkOnDark shadow-gold">防</span>}
                {targetable && !dead && <span className="absolute inset-0 rounded-panel shadow-[0_0_0_2px_theme(colors.gold.light),0_0_18px_theme(colors.gold.DEFAULT/60%)]" />}
                {float && (
                  <span key={battle.step} className={`float-up pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap ${float.tone}`}>
                    {float.text}
                  </span>
                )}
              </span>
              <span className="mt-1 block">
                <span className="mx-auto block h-[5px] w-full max-w-[72px] overflow-hidden rounded-[1px] bg-black/50 shadow-[0_0_0_1px_theme(colors.gold.DEFAULT/35%)]">
                  <span
                    className="block h-full bg-gradient-to-r from-hp-critFrom to-hp-critTo transition-[width] duration-300"
                    style={{ width: `${(state.hp / foe.stats.hp) * 100}%` }}
                  />
                </span>
                <span className="kit-glass mx-auto mt-1 block w-fit max-w-full truncate rounded px-2 font-serif text-[13px] leading-snug tracking-[0.04em]">{foe.name}</span>
              </span>
            </button>
          );
        })}

        {/* The party lines up along the near edge; the far row is drawn first so the near row overlaps it */}
        {battle.party
          .map((member, index) => ({ member, at: rank.spots[index] ?? rank.spots[0] }))
          .sort((a, b) => a.at.y - b.at.y)
          .map(({ member, at }) => {
            const Art = SPRITES[HERO_SPRITE[member]];
            const state = battle.heroes[member];
            const dead = state.hp === 0;
            const acting = battle.events.some((event) => event.kind === 'act' && sameWho(event.who, { side: 'hero', hero: member }));
            const hit = battle.events.find((event) => event.kind !== 'flee' && event.kind !== 'shield' && sameWho(event.who, { side: 'hero', hero: member }));
            const float = hit ? floater(hit) : null;
            const pickable = needs === 'hero';
            const struck = battle.events.some((event) => event.kind === 'hit' && sameWho(event.who, { side: 'hero', hero: member }));

            return (
              <button
                key={member}
                type="button"
                disabled={!pickable}
                onClick={() => pickHero(member)}
                aria-label={HEROES[member].name}
                className="absolute disabled:pointer-events-none"
                style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: `${rank.width * 100}%`, transform: 'translate(-50%, -50%)' }}
              >
                {hero === member && (
                  <span className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm bg-gradient-to-b from-gold-diamond to-gold px-2 py-px font-serif text-[12px] tracking-[0.12em] text-primary-text shadow-gold">
                    輪到你
                  </span>
                )}
                <span className={`relative block ${dead ? 'opacity-35 grayscale' : ''} ${acting ? 'lunge-up' : ''} ${struck ? 'fx-hurt' : ''}`} key={`s${battle.step}`}>
                  <span className="block aspect-square w-full">
                    <Art lod="battle" />
                  </span>
                  {state.shield && <span className="absolute inset-0 rounded-full shadow-[0_0_0_3px_theme(colors.mp.to/60%),inset_0_0_16px_theme(colors.mp.to/35%)]" />}
                  {state.guard && <span className="absolute -right-1 top-1 rounded-sm bg-mp-from px-1.5 font-serif text-caption text-inkOnDark shadow-gold">防</span>}
                  {pickable && <span className="absolute inset-0 rounded-panel shadow-[0_0_0_2px_theme(colors.gold.light),0_0_18px_theme(colors.gold.DEFAULT/60%)]" />}
                  {float && (
                    <span key={battle.step} className={`float-up pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap ${float.tone}`}>
                      {float.text}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

        <BattleFx key={battle.step} battle={battle} spot={spot} />

        {/* What the foe is about to do */}
        {phase.kind === 'foe' && (
          <p className="kit-glass pop absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded px-4 py-1.5 font-serif text-body tracking-[0.06em]">
            {foeIntent(battle, phase.slot)}
          </p>
        )}

        {/* The battle log (what just happened, in words) and who moves next: the reason 身手 is a stat worth reading */}
        <div className="kit-glass absolute inset-x-3 bottom-2.5 flex items-center gap-3 rounded px-3 py-1 text-caption">
          <p className="min-w-0 flex-1 truncate text-inkOnDark" aria-live="polite">
            {logLine(battle)}
          </p>
          <p className="shrink-0 text-mutedOnDark">
            接下來 <span className="font-serif text-gold-light">{nextUp}</span>
          </p>
        </div>
      </div>

      <CommandPanel
        prompt={headline}
        link={link}
        party={
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${battle.party.length <= 2 ? 2 : battle.party.length}, minmax(0, 1fr))` }}>
            {battle.party.map((member) => {
              const state = battle.heroes[member];
              const stats = battle.stats[member];
              return (
                <PartyCard
                  key={member}
                  name={HEROES[member].name}
                  portrait={<HeroHead hero={member} />}
                  hp={state.hp}
                  hpMax={stats.hp}
                  mp={state.mp}
                  mpMax={stats.mp}
                  active={hero === member && !pending}
                  onPick={needs === 'hero' ? () => pickHero(member) : undefined}
                  layout={battle.party.length <= 2 ? 'wide' : 'narrow'}
                  head={battle.party.length <= 3}
                />
              );
            })}
          </div>
        }
      >
        {(!hero || (!pending && menu === 'root') || pending) && (
          <CommandGrid>
            <CommandButton
              primary
              icon={<Cube size={20} />}
              label={UI.commands.attack}
              sub={pending ? '點一下目標' : '普通攻擊'}
              onClick={() => choose({ kind: 'attack' })}
              disabled={!hero || Boolean(pending)}
            />
            <CommandButton
              icon={<Talent size={20} />}
              label={UI.commands.skill}
              sub={hero ? `${UI.mp} ${battle.heroes[hero].mp}` : '——'}
              onClick={() => setMenu('spell')}
              disabled={!hero || Boolean(pending) || spells.length === 0}
            />
            <CommandButton
              icon={<Cup size={20} />}
              label={UI.commands.item}
              sub={`${carried.length} 樣`}
              onClick={() => setMenu('item')}
              disabled={!hero || Boolean(pending) || carried.length === 0}
            />
            <CommandButton icon={<Shield size={20} />} label={UI.commands.guard} sub="減傷一半" onClick={() => send({ type: 'guard' })} disabled={!hero || Boolean(pending)} />
          </CommandGrid>
        )}

        {hero && !pending && menu === 'spell' && (
          <div className="grid max-h-[150px] grid-cols-2 gap-2 overflow-y-auto">
            {spells.map((spell) => {
              const usable = canCast(battle, hero, spell);
              return (
                <button
                  key={spell.id}
                  type="button"
                  disabled={!usable}
                  onClick={() => choose({ kind: 'spell', spell: spell.id })}
                  className="kit-inset kit-press flex min-h-[64px] flex-col justify-center px-3 py-1.5 text-left disabled:opacity-40"
                >
                  <span className="truncate font-serif text-[17px] font-black tracking-[0.06em]">{spell.name}</span>
                  <span className="text-caption text-mutedOnDark">
                    {UI.mp} <Num>{spell.cost}</Num>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {hero && !pending && menu === 'item' && (
          <div className="grid max-h-[150px] grid-cols-2 gap-2 overflow-y-auto">
            {carried.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => choose({ kind: 'item', item })}
                className="kit-inset kit-press flex min-h-[64px] items-center gap-2 px-2.5 py-1.5 text-left"
              >
                <span className="block h-9 w-9 shrink-0">
                  <ItemArt item={item} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[16px] font-black tracking-[0.04em]">{ITEMS[item].name}</span>
                  <span className="block text-caption text-mutedOnDark">
                    ×<Num>{battle.items[item]}</Num>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </CommandPanel>
    </main>
  );
};

const ItemArt = ({ item }: { item: ItemId }) => {
  const Art = SPRITES[ITEMS[item].sprite];
  return <Art lod="icon" />;
};
