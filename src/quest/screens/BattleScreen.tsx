import { useEffect, useRef, useState } from 'react';
import { Scene } from '../../art/Scene';
import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';
import { playTone } from '../../shared/audio';
import { Bar } from '../components/Bar';
import { aliveFoeSlots, canUseSkill, foeIntent } from '../engine/battle';
import { FOES } from '../engine/foes';
import { HEROES, ITEMS, ITEM_ORDER, MAX_ENERGY, SKILLS, heroStats, skillsFor } from '../engine/heroes';
import {
  HERO_ORDER,
  type Battle,
  type BattleAction,
  type BattleEvent,
  type Chapter,
  type HeroId,
  type ItemId,
  type SkillId,
  type Who,
} from '../engine/types';

/** Pause between foe actions so each one can be read (ms) */
const FOE_TICK_MS = 850;
/** How long a won or lost battle stays on screen before moving on (ms) */
const WON_DELAY_MS = 1100;
const LOST_DELAY_MS = 1400;

/** Column centres for 1..3 foes, fractions of the box width */
const FOE_COLUMNS: Record<number, number[]> = { 1: [0.5], 2: [0.29, 0.71], 3: [0.18, 0.5, 0.82] };
const FOE_Y = 0.34;
const HERO_X: Record<HeroId, number> = { baokaka: 0.26, mocha: 0.74 };
const HERO_Y = 0.79;

const HERO_SPRITE = { baokaka: SPRITES.baokaka, mocha: SPRITES.mochaCat } as const;

type Pending = { kind: 'skill'; skill: SkillId } | { kind: 'item'; item: ItemId };

type Props = {
  chapter: Chapter;
  battle: Battle;
  soundOn: boolean;
  onAction: (action: BattleAction) => void;
  onWon: () => void;
  onLost: () => void;
  onToggleSound: () => void;
};

const whoName = (who: Who, battle: Battle): string =>
  who.side === 'hero' ? HEROES[who.hero].name : FOES[battle.foes[who.slot].foe].name;

const sameWho = (a: Who, b: Who): boolean =>
  a.side === 'hero' ? b.side === 'hero' && a.hero === b.hero : b.side === 'foe' && a.slot === b.slot;

function logLine(battle: Battle): string {
  if (battle.step === 0) {
    const boss = battle.foes.find((foe) => FOES[foe.foe].boss);
    const taunt = boss && FOES[boss.foe].taunt;
    return taunt ? `${FOES[boss.foe].name}：「${taunt}」` : '搗蛋鬼出現了！';
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
      case 'guard':
        parts.push(`${whoName(event.who, battle)} 防禦中`);
        break;
      case 'stun':
        parts.push(`${whoName(event.who, battle)} 嚇到了`);
        break;
      case 'skip':
        parts.push(`${whoName(event.who, battle)} 嚇到發呆，動不了`);
        break;
      case 'charge':
        parts.push(`${whoName(event.who, battle)} 正在蓄力`);
        break;
      case 'ko':
        parts.push(`${whoName(event.who, battle)} 倒下了`);
        break;
      case 'energy':
        parts.push(`元氣 ${event.delta > 0 ? '+' : ''}${event.delta}`);
        break;
    }
  }
  return parts.join('，');
}

function floater(event: BattleEvent): { text: string; tone: string } | null {
  switch (event.kind) {
    case 'hit':
      if (event.who.side === 'hero') return { text: `-${event.amount}`, tone: 'bg-berry text-white' };
      return event.crit
        ? { text: `暴擊 -${event.amount}`, tone: 'bg-sun text-ink text-body' }
        : { text: `-${event.amount}`, tone: 'bg-white text-ink' };
    case 'heal':
      return { text: `+${event.amount}`, tone: 'bg-leaf text-white' };
    case 'guard':
      return { text: '防禦', tone: 'bg-sky text-ink' };
    case 'stun':
      return { text: '嚇到了！', tone: 'bg-plum text-white' };
    case 'skip':
      return { text: '發呆中', tone: 'bg-plum text-white' };
    case 'charge':
      return { text: '蓄力中…', tone: 'bg-sun text-ink' };
    case 'ko':
      return { text: '倒下', tone: 'bg-ink text-white' };
    default:
      return null;
  }
}

export const BattleScreen = ({ chapter, battle, soundOn, onAction, onWon, onLost, onToggleSound }: Props) => {
  const { phase } = battle;
  const activeHero = phase.kind === 'hero' ? phase.hero : null;
  const alive = aliveFoeSlots(battle);
  const columns = FOE_COLUMNS[battle.foes.length] ?? FOE_COLUMNS[3];

  const [pending, setPending] = useState<Pending | null>(null);
  const [menu, setMenu] = useState<'skills' | 'items'>('skills');

  // Latest callbacks for the timers, so a re-render never restarts a pending tick
  const callbacks = useRef({ onAction, onWon, onLost, soundOn });
  callbacks.current = { onAction, onWon, onLost, soundOn };

  useEffect(() => {
    if (phase.kind !== 'foe') return;
    const timer = window.setTimeout(() => callbacks.current.onAction({ type: 'tick' }), FOE_TICK_MS);
    return () => window.clearTimeout(timer);
  }, [phase.kind, battle.step]);

  useEffect(() => {
    if (phase.kind !== 'won' && phase.kind !== 'lost') return;
    const won = phase.kind === 'won';
    playTone(won ? 'complete' : 'defeat', callbacks.current.soundOn);
    const timer = window.setTimeout(
      () => (won ? callbacks.current.onWon() : callbacks.current.onLost()),
      won ? WON_DELAY_MS : LOST_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase.kind]);

  useEffect(() => {
    const { events } = battle;
    const sound = callbacks.current.soundOn;
    if (events.some((event) => event.kind === 'heal')) playTone('heal', sound);
    else if (events.some((event) => event.kind === 'hit' && event.who.side === 'hero')) playTone('hit', sound);
    else if (events.some((event) => event.kind === 'hit')) playTone('found', sound);
    // Events belong to the step, so the step number is the only dependency that matters
  }, [battle.step]);

  const act = (action: BattleAction) => {
    setPending(null);
    setMenu('skills');
    onAction(action);
  };

  const pickSkill = (skill: SkillId) => {
    const { effect } = SKILLS[skill];
    if (effect.kind === 'attack' && effect.target === 'one' && alive.length > 1) {
      setPending({ kind: 'skill', skill });
      return;
    }
    if (effect.kind === 'heal' && effect.target === 'ally') {
      setPending({ kind: 'skill', skill });
      return;
    }
    act({ type: 'skill', skill, target: alive[0] });
  };

  const pickItem = (item: ItemId) => {
    if (ITEMS[item].effect.kind === 'heal' && ITEMS[item].effect.target === 'ally') {
      setPending({ kind: 'item', item });
      return;
    }
    act({ type: 'item', item });
  };

  const pendingNeedsFoe = pending?.kind === 'skill' && SKILLS[pending.skill].effect.kind === 'attack';
  const pendingNeedsHero = pending !== null && !pendingNeedsFoe;

  const chooseFoe = (slot: number) => {
    if (pending?.kind === 'skill') act({ type: 'skill', skill: pending.skill, target: slot });
  };
  const chooseHero = (hero: HeroId) => {
    if (pending?.kind === 'skill') act({ type: 'skill', skill: pending.skill, target: hero });
    if (pending?.kind === 'item') act({ type: 'item', item: pending.item, target: hero });
  };

  /** One-shot animation for this step: a jolt when hit, a lunge when acting. Keyed on the step so it replays. */
  const motion = (who: Who): { key: number; className: string } => {
    const hit = battle.events.some((event) => event.kind === 'hit' && sameWho(event.who, who));
    const acted = battle.events.some((event) => event.kind === 'act' && sameWho(event.who, who));
    if (hit) return { key: battle.step, className: 'shake' };
    if (acted) return { key: battle.step, className: who.side === 'hero' ? 'lunge-up' : 'lunge-down' };
    return { key: -1, className: '' };
  };

  const headline =
    phase.kind === 'won'
      ? '打贏了！'
      : phase.kind === 'lost'
        ? '兩個人都倒下了…'
        : phase.kind === 'foe'
          ? '搗蛋鬼的回合…'
          : pendingNeedsFoe
            ? '點一個敵人'
            : pendingNeedsHero
              ? '要用在誰身上？'
              : menu === 'items'
                ? '用哪一樣道具？'
                : `${HEROES[phase.hero].name}，要做什麼？`;

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col gap-2 py-2">
      <header className="flex items-center justify-between gap-3 px-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight">
            第 {chapter.id} 章 {chapter.title}
          </p>
          <p className="text-sm font-bold text-ink/60">
            {battle.boss ? '頭目戰 · ' : ''}第 {battle.round} 回合
          </p>
        </div>
        <BigButton tone="quiet" onClick={onToggleSound} label={soundOn ? '關閉聲音' : '打開聲音'}>
          {soundOn ? '聲音 開' : '聲音 關'}
        </BigButton>
      </header>

      <div className="flex justify-center px-3">
        <Scene
          palette={chapter.palette}
          decor={chapter.decor}
          aspectRatio="1 / 1"
          className="h-[min(calc(100vw-1.5rem),38dvh)] w-auto rounded-3xl border-4 border-ink"
        >
          {battle.foes.map((state, slot) => {
            const foe = FOES[state.foe];
            const Art = SPRITES[foe.sprite];
            const dead = state.hp <= 0;
            const targetable = pendingNeedsFoe && !dead;
            const intent = foeIntent(state, battle.heroes);
            const width = battle.foes.length === 1 ? (foe.boss ? 0.44 : 0.36) : battle.foes.length === 2 ? 0.32 : 0.27;
            return (
              <button
                key={slot}
                type="button"
                disabled={!targetable}
                onClick={() => chooseFoe(slot)}
                aria-label={foe.name}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-opacity ${dead ? 'opacity-25 grayscale' : ''}`}
                style={{ left: `${columns[slot] * 100}%`, top: `${FOE_Y * 100}%`, width: `${width * 100}%` }}
              >
                {!dead && (
                  <span
                    className={[
                      'whitespace-nowrap rounded-2xl border-2 border-ink px-2 py-0.5 text-center text-xs font-bold leading-4',
                      intent.kind === 'charge'
                        ? 'breathe bg-sun'
                        : intent.kind === 'stunned'
                          ? 'bg-plum text-white'
                          : intent.kind === 'guard'
                            ? 'bg-sky'
                            : intent.kind === 'heal'
                              ? 'bg-leaf text-white'
                              : 'bg-white',
                    ].join(' ')}
                  >
                    {intent.kind === 'attack' ? (
                      <>
                        {intent.name} {intent.amount}
                        <br />
                        <span className={intent.aim === 'all' ? 'text-berry' : 'text-ink/70'}>
                          → {intent.aim === 'all' ? '全體' : HEROES[intent.aim].name}
                        </span>
                      </>
                    ) : intent.kind === 'stunned' ? (
                      '嚇到了'
                    ) : intent.kind === 'charge' ? (
                      `${intent.name}…`
                    ) : (
                      intent.name
                    )}
                  </span>
                )}
                <span key={motion({ side: 'foe', slot }).key} className={`relative block aspect-square w-full ${motion({ side: 'foe', slot }).className}`}>
                  <Art />
                  {state.guard && !dead && (
                    <span className="absolute -right-1 top-0 rounded-full border-2 border-ink bg-sky px-1.5 text-xs font-bold">防</span>
                  )}
                  {targetable && (
                    <span className="breathe pointer-events-none absolute -inset-2 rounded-3xl border-4 border-dashed border-sun" />
                  )}
                </span>
                <Bar value={state.hp} max={foe.maxHp} className="h-2.5" />
                <span className="rounded-full bg-cream/80 px-2 text-xs font-bold leading-4">{foe.name}</span>
              </button>
            );
          })}

          {HERO_ORDER.map((hero) => {
            const Art = HERO_SPRITE[hero];
            const state = battle.heroes[hero];
            const { maxHp } = heroStats(hero, battle.level);
            const ko = state.hp <= 0;
            const active = activeHero === hero;
            const targetable = pendingNeedsHero;
            return (
              <button
                key={hero}
                type="button"
                disabled={!targetable}
                onClick={() => chooseHero(hero)}
                aria-label={HEROES[hero].name}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: `${HERO_X[hero] * 100}%`, top: `${HERO_Y * 100}%`, width: '27%' }}
              >
                <span key={motion({ side: 'hero', hero }).key} className={`relative block aspect-square w-full ${motion({ side: 'hero', hero }).className} ${ko ? 'opacity-40 grayscale' : ''}`}>
                  <Art />
                  {active && <span className="breathe pointer-events-none absolute -inset-1 rounded-full border-4 border-sun" />}
                  {targetable && (
                    <span className="breathe pointer-events-none absolute -inset-2 rounded-3xl border-4 border-dashed border-leaf" />
                  )}
                  {state.guard && (
                    <span className="absolute -right-1 top-0 rounded-full border-2 border-ink bg-sky px-1.5 text-xs font-bold">防</span>
                  )}
                </span>
                <Bar value={state.hp} max={maxHp} className="h-2.5" />
                <span className="whitespace-nowrap rounded-full bg-cream/80 px-2 text-xs font-bold leading-4">
                  {HEROES[hero].name} {state.hp}/{maxHp}
                </span>
              </button>
            );
          })}

          {battle.events.map((event, index) => {
            if (!('who' in event)) return null;
            const label = floater(event);
            if (!label) return null;
            const x = event.who.side === 'hero' ? HERO_X[event.who.hero] : columns[event.who.slot];
            const y = event.who.side === 'hero' ? HERO_Y - 0.14 : FOE_Y - 0.08;
            return (
              <span
                key={`${battle.step}-${index}`}
                className={`float-up pointer-events-none absolute whitespace-nowrap rounded-full border-2 border-ink px-2 text-base font-bold leading-7 ${label.tone}`}
                style={{
                  left: `${x * 100}%`,
                  top: `calc(${y * 100}% - ${(index % 3) * 22}px)`,
                  animationDelay: `${index * 80}ms`,
                }}
              >
                {label.text}
              </span>
            );
          })}
        </Scene>
      </div>

      <div className="flex items-center justify-center gap-1.5 px-3">
        <span className="mr-1 text-base font-bold">元氣</span>
        {Array.from({ length: MAX_ENERGY }, (_, index) => (
          <span
            key={index}
            className={`block h-5 w-5 rounded-full border-2 border-ink transition-colors ${index < battle.energy ? 'bg-sun' : 'bg-white'}`}
          />
        ))}
        <span className="ml-1 text-sm font-bold text-ink/70">
          {battle.energy}/{MAX_ENERGY}
        </span>
      </div>

      <div className="mx-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-3xl border-4 border-ink bg-white p-3">
        <p className="text-base font-bold leading-tight">{headline}</p>

        {activeHero && pending && (
          <BigButton tone="quiet" onClick={() => setPending(null)}>
            取消
          </BigButton>
        )}

        {activeHero && !pending && menu === 'items' && (
          <div className="grid grid-cols-2 gap-2">
            {ITEM_ORDER.map((item) => {
              const Art = SPRITES[ITEMS[item].sprite];
              const count = battle.items[item];
              return (
                <button
                  key={item}
                  type="button"
                  disabled={count <= 0}
                  onClick={() => pickItem(item)}
                  className="flex min-h-[60px] items-center gap-2 rounded-2xl border-4 border-ink bg-cream px-2 py-1 text-left shadow-[0_3px_0_#3B2A20] transition-transform active:translate-y-0.5 disabled:opacity-40"
                >
                  <span className="block h-10 w-10 shrink-0">
                    <Art />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base font-bold leading-tight">
                      {ITEMS[item].name} ×{count}
                    </span>
                    <span className="text-xs leading-tight text-ink/70 [@media(max-height:700px)]:hidden">{ITEMS[item].blurb}</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMenu('skills')}
              className="min-h-[60px] rounded-2xl border-4 border-ink bg-white px-2 text-base font-bold shadow-[0_3px_0_#3B2A20] transition-transform active:translate-y-0.5"
            >
              返回
            </button>
          </div>
        )}

        {activeHero && !pending && menu === 'skills' && (
          <div className="grid grid-cols-3 gap-2">
            {skillsFor(activeHero, battle.level).map((skill) => {
              const usable = canUseSkill(battle, activeHero, skill);
              return (
                <button
                  key={skill.id}
                  type="button"
                  disabled={!usable}
                  onClick={() => pickSkill(skill.id)}
                  className="flex min-h-[60px] flex-col gap-0.5 rounded-2xl border-4 border-ink bg-cream px-2 py-1.5 text-left shadow-[0_3px_0_#3B2A20] transition-transform active:translate-y-0.5 disabled:opacity-40"
                >
                  <span className="whitespace-nowrap text-base font-bold leading-tight">{skill.name}</span>
                  <span className="flex h-4 items-center gap-1 text-xs font-bold">
                    {skill.cost > 0 ? (
                      <>
                        <span className="text-ink/60">用</span>
                        {Array.from({ length: skill.cost }, (_, index) => (
                          <span key={index} className="block h-3 w-3 rounded-full border-2 border-ink bg-sun" />
                        ))}
                      </>
                    ) : (
                      <span className="text-leaf">元氣 +{skill.gain}</span>
                    )}
                  </span>
                  <span className="text-xs leading-tight text-ink/70 [@media(max-height:700px)]:hidden">{skill.blurb}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMenu('items')}
              className="flex min-h-[60px] flex-col justify-between rounded-2xl border-4 border-ink bg-white px-2 py-1.5 text-left shadow-[0_3px_0_#3B2A20] transition-transform active:translate-y-0.5"
            >
              <span className="text-base font-bold leading-tight">道具</span>
              <span className="text-xs leading-tight text-ink/70">
                {ITEM_ORDER.map((item) => battle.items[item]).reduce((sum, count) => sum + count, 0)} 樣
              </span>
            </button>
          </div>
        )}
      </div>

      <p className="mx-3 h-11 overflow-hidden text-sm font-bold leading-snug text-ink/80">{logLine(battle)}</p>
    </div>
  );
};
