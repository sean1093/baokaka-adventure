import { useEffect, useRef, useState } from 'react';
import { BACKDROPS } from '../../art/backdrops';
import { SPRITES } from '../../art/sprites';
import type { PaletteName } from '../../art/types';
import { Button } from '../../components/Button';
import { SoundToggle } from '../../components/Screen';
import { playTone } from '../../shared/audio';
import { HERO_SPRITE } from '../components/PartyPanel';
import { aliveFoeSlots, canCast, foeIntent, sameWho } from '../engine/battle';
import { FOES } from '../engine/foes';
import { HEROES, ITEMS, ITEM_ORDER, SPELLS, spellsFor } from '../engine/heroes';
import type { Battle, BattleAction, BattleEvent, HeroId, ItemId, SpellId, Who } from '../engine/types';

/** Pause between foe actions so each one can be read (ms) */
const FOE_TICK_MS = 800;
const END_DELAY_MS = 900;

/** Column centres for 1..3 foes, as fractions of the arena width */
const COLUMNS: Record<number, number[]> = { 1: [0.5], 2: [0.3, 0.7], 3: [0.18, 0.5, 0.82] };

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
        if (event.amount > 0) parts.push(`真氣 +${event.amount}`);
        break;
      case 'guard':
        parts.push(`${whoName(event.who, battle)} 防禦`);
        break;
      case 'shield':
        parts.push('全隊被泡泡包住了');
        break;
      case 'revive':
        parts.push(`${whoName(event.who, battle)} 站起來了！`);
        break;
      case 'flee':
        parts.push(event.ok ? '成功逃走了！' : '逃不掉！');
        break;
      case 'ko':
        parts.push(`${whoName(event.who, battle)} 倒下`);
        break;
    }
  }
  return parts.join('，') || '……';
}

/** A number that floats up off whoever it happened to. */
const floater = (event: BattleEvent): { text: string; tone: string } | null => {
  switch (event.kind) {
    case 'hit':
      return event.crit ? { text: `暴擊 ${event.amount}`, tone: 'bg-sun text-ink' } : { text: `${event.amount}`, tone: 'bg-surface text-ink' };
    case 'heal':
      return event.amount > 0 ? { text: `+${event.amount}`, tone: 'bg-leaf text-white' } : null;
    case 'mp':
      return event.amount > 0 ? { text: `真氣 +${event.amount}`, tone: 'bg-sky text-white' } : null;
    case 'guard':
      return { text: '防禦', tone: 'bg-ink text-cream' };
    case 'ko':
      return { text: '倒下', tone: 'bg-ink text-cream' };
    default:
      return null;
  }
};

type Props = {
  battle: Battle;
  palette: PaletteName;
  soundOn: boolean;
  onAction: (action: BattleAction) => void;
  onEnd: () => void;
  onToggleSound: () => void;
};

export const BattleScreen = ({ battle, palette, soundOn, onAction, onEnd, onToggleSound }: Props) => {
  const { phase } = battle;
  const hero = phase.kind === 'hero' ? phase.hero : null;
  const alive = aliveFoeSlots(battle);
  const columns = COLUMNS[battle.foes.length] ?? COLUMNS[3];
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

  /** Who moves after the current actor: the reason 身法 is a stat worth reading. */
  const nextUp = (() => {
    const isAlive = (who: Who) => (who.side === 'hero' ? battle.heroes[who.hero].hp > 0 : battle.foes[who.slot].hp > 0);
    const upcoming = battle.order.slice(battle.turn + 1).find(isAlive) ?? battle.order.find(isAlive);
    return upcoming ? whoName(upcoming, battle) : '——';
  })();

  const headline =
    phase.kind === 'won'
      ? '打贏了！'
      : phase.kind === 'lost'
        ? '大家都倒下了……'
        : phase.kind === 'fled'
          ? '逃走了！'
          : phase.kind === 'foe'
            ? `${FOES[battle.foes[phase.slot].foe].name} 的回合`
            : needs === 'foe'
              ? '要打哪一個？'
              : needs === 'hero'
                ? '要給誰？'
                : `${HEROES[phase.hero].name}，要做什麼？`;

  return (
    <main className="screen-in mx-auto flex h-dvh w-full max-w-md flex-col gap-2 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-[max(env(safe-area-inset-top),10px)]">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-caption font-bold text-muted">{battle.boss ? '頭目戰' : '遭遇戰'}</p>
          <h1 className="text-heading font-extrabold leading-tight">第 {battle.round} 回合</h1>
        </div>
        <SoundToggle on={soundOn} onToggle={onToggleSound} />
      </header>

      {/* The arena: foes on the far side, the party on the near side */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl shadow-card">
        <Backdrop />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/0 via-ink/0 to-ink/25" />

        {battle.foes.map((state, slot) => {
          const foe = FOES[state.foe];
          const Art = SPRITES[foe.sprite];
          const dead = state.hp === 0;
          const targetable = needs === 'foe';
          const size = foe.boss ? 0.42 : battle.foes.length === 1 ? 0.34 : battle.foes.length === 2 ? 0.3 : 0.26;
          const hit = battle.events.find((event) => event.kind !== 'flee' && event.kind !== 'shield' && sameWho(event.who, { side: 'foe', slot }));
          const acting = battle.events.some((event) => event.kind === 'act' && sameWho(event.who, { side: 'foe', slot }));
          const float = hit ? floater(hit) : null;

          return (
            <button
              key={slot}
              type="button"
              disabled={dead || !targetable}
              onClick={() => pickFoe(slot)}
              aria-label={foe.name}
              className="absolute -translate-x-1/2 disabled:pointer-events-none"
              style={{ left: `${columns[slot] * 100}%`, top: '6%', width: `${size * 100}%` }}
            >
              <span className={`relative block ${dead ? 'opacity-0' : ''} ${acting ? 'lunge-down' : ''}`}>
                <span className="block aspect-square w-full">
                  <Art />
                </span>
                {state.guard && (
                  <span className="absolute -right-1 top-0 rounded-full bg-sky px-1.5 text-caption font-bold text-white shadow-card">防</span>
                )}
                {targetable && !dead && (
                  <span className="absolute inset-0 rounded-2xl ring-2 ring-sun/80 ring-offset-2 ring-offset-transparent" />
                )}
                {float && (
                  <span
                    key={battle.step}
                    className={`float-up pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-label font-extrabold shadow-card ${float.tone}`}
                  >
                    {float.text}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block">
                <span className="mx-auto block h-1.5 w-full max-w-[72px] overflow-hidden rounded-full bg-ink/25">
                  <span className="block h-full rounded-full bg-berry transition-[width] duration-300" style={{ width: `${(state.hp / foe.stats.hp) * 100}%` }} />
                </span>
                <span className="mt-0.5 block truncate rounded-full bg-ink/70 px-1.5 text-caption font-bold text-cream">{foe.name}</span>
              </span>
            </button>
          );
        })}

        {/* The party lines up along the near edge */}
        {battle.party.map((member, index) => {
          const Art = SPRITES[HERO_SPRITE[member]];
          const state = battle.heroes[member];
          const dead = state.hp === 0;
          const acting = battle.events.some((event) => event.kind === 'act' && sameWho(event.who, { side: 'hero', hero: member }));
          const hit = battle.events.find((event) => event.kind !== 'flee' && event.kind !== 'shield' && sameWho(event.who, { side: 'hero', hero: member }));
          const float = hit ? floater(hit) : null;
          const pickable = needs === 'hero';
          const left = [0.24, 0.5, 0.76][index] ?? 0.5;

          return (
            <button
              key={member}
              type="button"
              disabled={!pickable}
              onClick={() => pickHero(member)}
              aria-label={HEROES[member].name}
              className="absolute -translate-x-1/2 disabled:pointer-events-none"
              style={{ left: `${left * 100}%`, bottom: '4%', width: '24%' }}
            >
              <span className={`relative block ${dead ? 'opacity-35 grayscale' : ''} ${acting ? 'lunge-up' : ''}`}>
                <span className="block aspect-square w-full">
                  <Art />
                </span>
                {state.shield && <span className="absolute inset-0 rounded-full ring-4 ring-sky/60" />}
                {state.guard && <span className="absolute -right-1 top-1 rounded-full bg-sky px-1.5 text-caption font-bold text-white shadow-card">防</span>}
                {pickable && <span className="absolute inset-0 rounded-2xl ring-2 ring-leaf" />}
                {float && (
                  <span
                    key={battle.step}
                    className={`float-up pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-label font-extrabold shadow-card ${float.tone}`}
                  >
                    {float.text}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {/* Whose turn it is, and what the foe is about to do */}
        {phase.kind === 'foe' && (
          <p className="pop absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink/85 px-4 py-1.5 text-copy font-extrabold text-cream">
            {foeIntent(battle, phase.slot)}
          </p>
        )}
      </div>

      {/* Party bars. While a target is wanted these are the big, thumb-friendly way to pick one. */}
      <div className="flex gap-1.5">
        {battle.party.map((member) => {
          const state = battle.heroes[member];
          const stats = battle.stats[member];
          const active = hero === member;
          const pickable = needs === 'hero';
          return (
            <button
              key={member}
              type="button"
              disabled={!pickable}
              onClick={() => pickHero(member)}
              className={`min-w-0 flex-1 rounded-2xl px-2 py-1.5 text-left transition-transform duration-150 active:scale-[0.97] disabled:pointer-events-none ${
                pickable ? 'bg-leaf/15 ring-2 ring-leaf' : active ? 'bg-sun/25 ring-2 ring-sun' : 'bg-surface/90'
              }`}
            >
              <p className="truncate text-caption font-extrabold">{HEROES[member].name}</p>
              <p className="text-caption font-bold tabular-nums text-muted">
                {state.hp}/{stats.hp}
              </p>
              <span className="mt-0.5 block h-1.5 overflow-hidden rounded-full bg-ink/10">
                <span
                  className={`block h-full rounded-full transition-[width] duration-300 ${state.hp / stats.hp > 0.5 ? 'bg-leaf' : state.hp / stats.hp > 0.22 ? 'bg-sun' : 'bg-berry'}`}
                  style={{ width: `${(state.hp / stats.hp) * 100}%` }}
                />
              </span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/10">
                <span className="block h-full rounded-full bg-sky transition-[width] duration-300" style={{ width: `${(state.mp / stats.mp) * 100}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* The command window */}
      <div className="rounded-3xl bg-surface p-3 shadow-card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-copy font-extrabold">{headline}</p>
          {(pending || menu !== 'root') && hero && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPending(null);
                setMenu('root');
              }}
            >
              取消
            </Button>
          )}
        </div>

        {hero && !pending && menu === 'root' && (
          <div className="grid grid-cols-3 gap-1.5">
            <CommandButton label="攻擊" hint="普通攻擊" onClick={() => choose({ kind: 'attack' })} primary />
            <CommandButton label="仙術" hint={`${spells.length} 招`} onClick={() => setMenu('spell')} disabled={spells.length === 0} />
            <CommandButton label="道具" hint={`${carried.length} 種`} onClick={() => setMenu('item')} disabled={carried.length === 0} />
            <CommandButton label="防禦" hint="傷害減半" onClick={() => send({ type: 'guard' })} />
            <CommandButton label="逃跑" hint={battle.boss ? '逃不掉' : '離開戰鬥'} onClick={() => send({ type: 'flee' })} disabled={battle.boss} />
            <div className="flex min-h-12 flex-col items-center justify-center rounded-2xl bg-ink/[0.03]">
              <span className="text-caption font-bold text-muted">接下來</span>
              <span className="truncate px-1 text-label font-extrabold leading-tight">{nextUp}</span>
            </div>
          </div>
        )}

        {hero && !pending && menu === 'spell' && (
          <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto">
            {spells.map((spell) => {
              const usable = canCast(battle, hero, spell);
              return (
                <button
                  key={spell.id}
                  type="button"
                  disabled={!usable}
                  onClick={() => choose({ kind: 'spell', spell: spell.id })}
                  className="flex min-h-11 flex-col justify-center rounded-2xl bg-sky/15 px-3 py-1.5 text-left transition-transform active:scale-[0.97] disabled:opacity-35"
                >
                  <span className="text-label font-extrabold leading-tight">{spell.name}</span>
                  <span className="text-caption font-bold text-skyDeep">真氣 {spell.cost}</span>
                </button>
              );
            })}
          </div>
        )}

        {hero && !pending && menu === 'item' && (
          <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto">
            {carried.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => choose({ kind: 'item', item })}
                className="flex min-h-11 items-center gap-2 rounded-2xl bg-leaf/15 px-2.5 py-1.5 text-left transition-transform active:scale-[0.97]"
              >
                <span className="block h-7 w-7 shrink-0"><ItemArt item={item} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label font-extrabold leading-tight">{ITEMS[item].name}</span>
                  <span className="block text-caption font-bold text-leafDeep">×{battle.items[item]}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {(!hero || pending) && (
          <p className="py-2 text-center text-label font-bold text-muted">
            {pending ? '點一下要施展的目標' : phase.kind === 'foe' ? '……' : ''}
          </p>
        )}

        <p className="mt-2 h-9 overflow-hidden text-caption font-bold leading-snug text-muted">{logLine(battle)}</p>
      </div>
    </main>
  );
};

const CommandButton = ({
  label,
  hint,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`flex min-h-12 flex-col items-center justify-center rounded-2xl transition-transform active:scale-[0.96] disabled:opacity-35 ${
      primary ? 'bg-gradient-to-b from-sun to-sunDeep text-ink shadow-glow' : 'bg-ink/[0.06]'
    }`}
  >
    <span className="text-label font-extrabold leading-tight">{label}</span>
    <span className={`text-caption font-bold ${primary ? 'text-mochaDeep' : 'text-muted'}`}>{hint}</span>
  </button>
);

const ItemArt = ({ item }: { item: ItemId }) => {
  const Art = SPRITES[ITEMS[item].sprite];
  return <Art />;
};
