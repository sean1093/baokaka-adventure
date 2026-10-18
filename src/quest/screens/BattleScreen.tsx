import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { BossFrame } from '../../art/backdrops/BossFrame';
import { STAGE_H, STAGE_W, Stage, stageScale, useBackdrop } from '../../art/backdrops';
import { FRAME, RIM, STAGE_LIGHT, UI as UI_TOKENS, withAlpha } from '../../art/palette';
import { SceneClock, sceneRim } from '../../art/scene';
import { actionPose } from '../../art/characters/actions';
import { spriteMeta } from '../../art/sprite';
import { SPRITES } from '../../art/sprites';
import { CommandButton } from '../../components/Button';
import { GlassChip, Num } from '../../components/Chip';
import { CommandGrid, CommandPanel, PartyCard } from '../../components/CommandPanel';
import { Cube, Cup, Shield, Talent } from '../../components/icons';
import { SoundToggle } from '../../components/Screen';
import { playTone } from '../../shared/audio';
import { flashAllowed } from '../../art/fx/battleFx';
import { BattleFx, type Spot } from '../components/BattleFx';
import { HERO_SPRITE, HeroHead } from '../components/PartyPanel';
import { aliveFoeSlots, battleBoss, battleFrame, canCast, foeIntent, sameWho, type StageFrame } from '../engine/battle';
import { FOES } from '../engine/foes';
import { HEROES, ITEMS, ITEM_ORDER, SPELLS, spellsFor } from '../engine/heroes';
import { UI } from '../engine/strings';
import type { Battle, BattleAction, BattleEvent, HeroId, ItemId, SpellId, Who } from '../engine/types';
import './battle.css';

/** Pause between foe actions so each one can be read (ms) */
const FOE_TICK_MS = 800;
/** A finished fight waits a beat so the last number can be read; a won one lets the foe calm and the gold wash in */
const END_DELAY_MS = 900;
const WON_DELAY_MS = 1300;
/** Below this screen height the party strip drops to small heads and one number row (375×667 and similar) */
const SHORT_SCREEN = 740;

// ---------------------------------------------------------------------------------------------
// Layout (art direction § 7.4), in stage units: the 390×500 frame of Stage.tsx. `y` is where the
// feet touch the floor, `s` the sprite box's size. Heroes stand lower left facing right on two
// staggered diagonal rows (黑糖 at the back); foes stand upper right, up to three.

type Place = { x: number; y: number; s: number };

const HERO_PLACES: Record<number, Place[]> = {
  1: [{ x: 110, y: 462, s: 130 }],
  2: [
    { x: 80, y: 460, s: 120 },
    { x: 196, y: 470, s: 108 },
  ],
  3: [
    { x: 66, y: 462, s: 114 },
    { x: 180, y: 474, s: 102 },
    { x: 130, y: 382, s: 96 },
  ],
  // HERO_ORDER: 寶咖咖 and 摩卡 in front; 阿藍 and 黑糖 behind, each between and above the front pair
  4: [
    { x: 64, y: 464, s: 112 },
    { x: 176, y: 476, s: 100 },
    { x: 228, y: 394, s: 90 },
    { x: 118, y: 378, s: 120 },
  ],
};

/** Regular foes: 90–110px (§ 6.1). */
const FOE_PLACES: Record<number, Place[]> = {
  1: [{ x: 282, y: 312, s: 112 }],
  2: [
    { x: 240, y: 296, s: 104 },
    { x: 334, y: 318, s: 104 },
  ],
  3: [
    { x: 240, y: 270, s: 94 },
    { x: 342, y: 286, s: 96 },
    { x: 304, y: 346, s: 100 },
  ],
};
/** A boss (170–220px) and whoever came with it; a final foe is drawn 320px+. */
const BOSS_PLACE: Place = { x: 276, y: 318, s: 204 };
const FINAL_PLACE: Place = { x: 262, y: 336, s: 330 };
const ESCORT_PLACES: Place[] = [
  { x: 190, y: 340, s: 86 },
  { x: 356, y: 362, s: 86 },
];

/** Where each foe stands: bosses take the centre of the stage and escorts flank them. */
function foePlaces(battle: Battle, frame: StageFrame): Place[] {
  const bossSlot = battle.foes.findIndex((foe) => FOES[foe.foe].boss);
  if (bossSlot < 0) return FOE_PLACES[battle.foes.length] ?? FOE_PLACES[3];
  let escort = 0;
  return battle.foes.map((_, slot) => (slot === bossSlot ? (frame === 'final' ? FINAL_PLACE : BOSS_PLACE) : (ESCORT_PLACES[escort++] ?? ESCORT_PLACES[1])));
}

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

// ---------------------------------------------------------------------------------------------
// Damage numbers (§ 7.4): Fredoka 44 italic, white with a deep-pink stroke and a pink glow, a
// serif sub-line under it; heals green, 元氣 blue; words (防禦, 累倒了) in a small glass tag.

type Floater = { text: string; sub?: string; tone: 'damage' | 'crit' | 'heal' | 'mp' | 'word' };

const floater = (event: BattleEvent): Floater | null => {
  switch (event.kind) {
    case 'hit':
      return event.crit ? { text: `${event.amount}`, sub: '效果絕佳！', tone: 'crit' } : { text: `${event.amount}`, sub: '好痛！', tone: 'damage' };
    case 'heal':
      return event.amount > 0 ? { text: `+${event.amount}`, sub: '好多了', tone: 'heal' } : null;
    case 'mp':
      return event.amount > 0 ? { text: `${UI.mp} +${event.amount}`, tone: 'mp' } : null;
    case 'guard':
      return { text: '防禦', tone: 'word' };
    case 'ko':
      return event.who.side === 'hero' ? { text: '累倒了', tone: 'word' } : null;
    default:
      return null;
  }
};

const NUMBER_STYLE: Record<Exclude<Floater['tone'], 'word'>, CSSProperties> = {
  damage: {
    color: UI_TOKENS.damage,
    WebkitTextStroke: `5px ${UI_TOKENS.damageStroke}`,
    textShadow: `0 0 14px ${withAlpha(UI_TOKENS.hpCritFrom, 0.8)}, 0 3px 0 ${FRAME.shadow}`,
    fontSize: 44,
  },
  crit: {
    color: UI_TOKENS.goldLight,
    WebkitTextStroke: `5px ${UI_TOKENS.damageStroke}`,
    textShadow: `0 0 18px ${withAlpha(UI_TOKENS.gold, 0.9)}, 0 3px 0 ${FRAME.shadow}`,
    fontSize: 50,
  },
  heal: {
    color: UI_TOKENS.hpTo,
    WebkitTextStroke: `5px ${UI_TOKENS.panelBottom}`,
    textShadow: `0 0 14px ${withAlpha(UI_TOKENS.hpFrom, 0.7)}`,
    fontSize: 38,
  },
  mp: {
    color: UI_TOKENS.mpTo,
    WebkitTextStroke: `4px ${UI_TOKENS.panelBottom}`,
    textShadow: `0 0 12px ${withAlpha(UI_TOKENS.mpFrom, 0.7)}`,
    fontSize: 24,
  },
};
const SUB_STYLE: CSSProperties = { WebkitTextStroke: `3px ${FRAME.shadow}` };

const FloatingNumber = ({ float, step }: { float: Floater; step: number }) =>
  float.tone === 'word' ? (
    <span key={step} className="dmg-rise kit-glass pointer-events-none absolute left-1/2 top-0 z-20 whitespace-nowrap rounded px-2 py-0.5 font-serif text-label">
      {float.text}
    </span>
  ) : (
    <span key={step} className="dmg-rise pointer-events-none absolute left-1/2 top-0 z-20 flex flex-col items-center whitespace-nowrap" aria-hidden="true">
      <span className="font-num font-bold italic leading-none [paint-order:stroke_fill]" style={NUMBER_STYLE[float.tone]}>
        {float.text}
      </span>
      {float.sub && (
        <span className="-mt-1 font-serif text-[15px] font-black not-italic text-gold-light [paint-order:stroke_fill]" style={SUB_STYLE}>
          {float.sub}
        </span>
      )}
    </span>
  );

/** A four-point star, for the calmed state's dizzy ring and sparkle. */
const StarMark = ({ className = '', style }: { className?: string; style?: CSSProperties }) => (
  <svg viewBox="-10 -10 20 20" className={className} style={style} aria-hidden="true">
    <path d="M0,-10Q1.6,-1.6 10,0Q1.6,1.6 0,10Q-1.6,1.6 -10,0Q-1.6,-1.6 0,-10Z" fill="currentColor" />
  </svg>
);

/** The calmed state over a foe (§ 6.1): a ring of dizzy stars, then a sparkle as it smiles and hops off. */
const Calmed = () => (
  <>
    <span className="calm-stars pointer-events-none absolute left-1/2 top-[8%] block h-[34%] w-[70%] text-gold-light">
      {[0, 72, 144, 216, 288].map((angle) => (
        <StarMark
          key={angle}
          className="absolute left-1/2 top-1/2 h-[26%] w-[16%]"
          style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-140%) rotate(${-angle}deg)` }}
        />
      ))}
    </span>
    <span className="calm-spark pointer-events-none absolute left-1/2 top-[38%] block h-[56%] w-[56%] text-gold-diamond">
      <StarMark className="h-full w-full" />
    </span>
  </>
);

/** The stage box in pixels, measured before paint and on resize. */
function useBox(ref: RefObject<HTMLElement>, fallback: { w: number; h: number }) {
  const [box, setBox] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setBox((old) => (old.w === element.clientWidth && old.h === element.clientHeight ? old : { w: element.clientWidth, h: element.clientHeight }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return box;
}

type Props = {
  battle: Battle;
  /** The battle backdrop key (`backdropFor(map)`) and whether the map is indoors (the generic fallback) */
  backdrop: string;
  interior?: boolean;
  /** The map's clock: the stage's sky and the heroes' rim, unless the backdrop has its own time */
  time: string;
  /** Where and when: the map's name and clock for the stage's glass chip */
  place?: { title: string; time: string };
  /** Overrides the frame (the art lab's final fight, until 咻咻's forms exist) */
  frame?: StageFrame;
  soundOn: boolean;
  onAction: (action: BattleAction) => void;
  onEnd: () => void;
  onToggleSound: () => void;
};

export const BattleScreen = ({ battle, backdrop, interior = false, time, place, frame: frameOverride, soundOn, onAction, onEnd, onToggleSound }: Props) => {
  const { phase } = battle;
  const hero = phase.kind === 'hero' ? phase.hero : null;
  const alive = aliveFoeSlots(battle);
  const stage = useBackdrop(backdrop, interior);
  const clock = stage.time ?? time;
  const frame = frameOverride ?? battleFrame(battle);

  const mainRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const screen = useBox(mainRef, { w: 390, h: 844 });
  const box = useBox(stageRef, { w: 390, h: 498 });
  const short = screen.h < SHORT_SCREEN;

  const [menu, setMenu] = useState<Menu>('root');
  const [pending, setPending] = useState<Pending | null>(null);

  // At most two flashes a second (§ 7.10): a step that would flash (a hurt blink, a wash) only does
  // so 500ms after the last one. Decided once per step, so re-renders and StrictMode agree.
  const flashLog = useRef<{ last: number | null; step: number; ok: boolean }>({ last: null, step: -1, ok: true });
  if (flashLog.current.step !== battle.step) {
    const log = flashLog.current;
    const touched = battle.events.filter((event) => event.kind === 'hit' || event.kind === 'heal').length;
    const wants = touched > 1 || battle.events.some((event) => event.kind === 'hit');
    const now = performance.now();
    const ok = flashAllowed(now, log.last);
    flashLog.current = { last: wants && ok ? now : log.last, step: battle.step, ok };
  }
  const flash = flashLog.current.ok;

  const callbacks = useRef({ onAction, onEnd, soundOn });
  callbacks.current = { onAction, onEnd, soundOn };

  // Foes act on a timer; a finished battle waits a beat so the last number can be read
  useEffect(() => {
    if (phase.kind === 'foe') {
      const timer = window.setTimeout(() => callbacks.current.onAction({ type: 'tick' }), FOE_TICK_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase.kind === 'won' || phase.kind === 'lost' || phase.kind === 'fled') {
      const timer = window.setTimeout(() => callbacks.current.onEnd(), phase.kind === 'won' ? WON_DELAY_MS : END_DELAY_MS);
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

  // ---- Stage geometry: stage units → pixels in the measured box (see stageScale in Stage.tsx)
  const k = stageScale(box.w, box.h);
  const kx = box.w / STAGE_W;
  const offsetY = (box.h - STAGE_H * k) / 2;
  // The full proscenium's pillars take the edges, so everyone steps in a little
  const inset = frame === 'final' ? 22 : 0;
  const px = (x: number) => box.w / 2 + (inset + (x * (STAGE_W - inset * 2)) / STAGE_W - STAGE_W / 2) * kx;
  const py = (y: number) => offsetY + y * k;
  const half = box.w / 2 / k;
  // The HUD sits under the 布袋戲 valance when there is one (its lobes end ~40 units down, 50 with the cornice)
  const hudTop = frame === 'none' ? 10 : Math.round((frame === 'final' ? 52 : 42) * k);
  const edges = { left: STAGE_W / 2 - half, right: STAGE_W / 2 + half };

  const heroPlaces = HERO_PLACES[battle.party.length] ?? HERO_PLACES[4];
  const enemyPlaces = foePlaces(battle, frame);
  const heroPlace = (member: HeroId) => heroPlaces[battle.party.indexOf(member)] ?? heroPlaces[0];

  // Where each combatant stands, as fractions of the stage box (the effect layer's units), at its middle
  const spot = (who: Who): Spot | null => {
    const place = who.side === 'foe' ? enemyPlaces[who.slot] : battle.party.includes(who.hero) ? heroPlace(who.hero) : null;
    if (!place) return null;
    return { x: px(place.x) / box.w, y: (py(place.y) - place.s * k * 0.5) / box.h };
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

  // The foe plate: one name and ×count, or the mix of names
  const groups: { name: string; count: number }[] = [];
  // Calmed foes leave the count (all of them, once the fight is won, so the plate never empties)
  const standing = battle.foes.filter((state) => state.hp > 0);
  for (const state of standing.length > 0 ? standing : battle.foes) {
    const name = FOES[state.foe].name;
    const group = groups.find((entry) => entry.name === name);
    if (group) group.count += 1;
    else groups.push({ name, count: 1 });
  }

  // Everyone on the stage, drawn far to near so nearer sprites overlap
  const actors = [
    ...battle.foes.map((_, slot) => ({ who: { side: 'foe', slot } as Who, place: enemyPlaces[slot] })),
    ...battle.party.map((member) => ({ who: { side: 'hero', hero: member } as Who, place: heroPlace(member) })),
  ].sort((a, b) => a.place.y - b.place.y);

  const eventFor = (who: Who) => battle.events.find((event) => event.kind !== 'flee' && event.kind !== 'shield' && sameWho(event.who, who));
  const struck = (who: Who) => battle.events.some((event) => event.kind === 'hit' && sameWho(event.who, who));
  const acting = (who: Who) => battle.events.some((event) => event.kind === 'act' && sameWho(event.who, who));
  const knocked = (who: Who) => battle.events.some((event) => event.kind === 'ko' && sameWho(event.who, who));

  return (
    <main ref={mainRef} className="kit-fade-in mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden" data-battle-frame={frame}>
      {/* The stage (§ 7.4): the backdrop, the fighters, the boss frame, then the HUD */}
      <div
        ref={stageRef}
        data-battle-stage=""
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ '--rim': sceneRim(clock) } as CSSProperties}
      >
        <Stage config={stage} time={clock} />

        {/* The fighters and effects shake when something heavy lands; the backdrop under them never re-renders */}
        <div className={`absolute inset-0 ${quake ? 'fx-quake' : ''}`} key={`quake${quake ? battle.step : 0}`}>
        <SceneClock.Provider value={clock}>
          {actors.map(({ who, place }) => {
            const size = place.s * k;
            const left = px(place.x);
            const feet = py(place.y);
            const hit = struck(who);
            const act = acting(who);

            if (who.side === 'foe') {
              const state = battle.foes[who.slot];
              const foe = FOES[state.foe];
              const Art = SPRITES[foe.sprite];
              const calming = state.hp === 0 && knocked(who);
              const gone = state.hp === 0 && !calming;
              const targetable = needs === 'foe' && !gone && state.hp > 0;
              const intent = phase.kind === 'foe' && phase.slot === who.slot;
              return (
                <button
                  key={`foe${who.slot}`}
                  type="button"
                  disabled={!targetable}
                  onClick={() => pickFoe(who.slot)}
                  aria-label={foe.name}
                  data-foe={who.slot}
                  className="absolute disabled:pointer-events-none"
                  style={{ left: left - size / 2, top: feet - size * 0.94, width: size, height: size, zIndex: Math.round(place.y), '--rim': RIM.foe } as CSSProperties}
                >
                  {/* The foe's aura (§ 6.1: faint violet; bosses add a gold bloom): a gradient, never a blur */}
                  {!gone && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-[-12%] block rounded-full"
                      style={{
                        background: foe.boss
                          ? `radial-gradient(closest-side, ${withAlpha(STAGE_LIGHT.auraBoss, 0.32)}, ${withAlpha(STAGE_LIGHT.aura, 0.18)} 55%, transparent)`
                          : `radial-gradient(closest-side, ${withAlpha(STAGE_LIGHT.aura, 0.26)}, transparent)`,
                      }}
                    />
                  )}
                  {/* Contact shadow and, when picking a target, a gold ring on the floor */}
                  <span aria-hidden="true" className={`absolute left-[14%] top-[89%] block h-[10%] w-[72%] rounded-[50%] bg-scrim/50 ${gone ? 'opacity-0' : ''}`} />
                  {targetable && <span aria-hidden="true" className="absolute left-[8%] top-[86%] block h-[16%] w-[84%] rounded-[50%] border-2 border-gold-light bg-gold/15 shadow-[0_0_16px_theme(colors.gold.DEFAULT/70%)]" />}
                  <span className={`relative block h-full w-full ${gone ? 'opacity-0' : ''} ${calming ? 'foe-calm' : act ? 'foe-lunge' : ''}`} key={`s${battle.step}`}>
                    <span className={`block h-full w-full ${hit && !calming ? (flash ? 'fx-hurt' : 'fx-hurt-soft') : ''}`}>
                      <Art lod="battle" state={calming ? 'ko' : hit ? 'hurt' : 'idle'} facing="left" />
                    </span>
                    {state.guard && <span className="absolute right-[6%] top-[8%] rounded-sm bg-mp-from px-1.5 font-serif text-caption text-inkOnDark shadow-gold">防</span>}
                  </span>
                  {calming && <Calmed key={`c${battle.step}`} />}
                  {/* Mini HP bar under the sprite */}
                  {!gone && (
                    <span aria-hidden="true" className="absolute left-1/2 top-full block -translate-x-1/2" style={{ width: Math.min(84, size * 0.72), marginTop: 2 }}>
                      <span className="block h-[5px] overflow-hidden rounded-[1px] bg-black/55 shadow-[0_0_0_1px_theme(colors.gold.DEFAULT/40%)]">
                        <span className="block h-full bg-gradient-to-r from-hp-critFrom to-hp-critTo transition-[width] duration-300" style={{ width: `${(state.hp / foe.stats.hp) * 100}%` }} />
                      </span>
                    </span>
                  )}
                  {/* While picking a target: the name and what it will do next (the engine's intent preview) */}
                  {targetable && (
                    <span className="kit-glass pointer-events-none absolute left-1/2 top-full mt-3 block -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-center leading-tight">
                      <span className="block font-serif text-[13px] tracking-[0.04em]">{foe.name}</span>
                      <span className="block text-[11px] text-mutedOnDark">下一招 {foeIntent(battle, who.slot)}</span>
                    </span>
                  )}
                  {intent && (
                    <span className="kit-glass pop pointer-events-none absolute bottom-full left-1/2 mb-1 block -translate-x-1/2 whitespace-nowrap rounded px-3 py-1 font-serif text-label tracking-[0.06em]">
                      {foeIntent(battle, who.slot)}
                    </span>
                  )}
                </button>
              );
            }

            const member = who.hero;
            const Art = SPRITES[HERO_SPRITE[member]];
            // Option D heroes act their move out and lie down when KO'd (#16); legacy sprites are tipped over
            const rigged = Boolean(spriteMeta(Art));
            const state = battle.heroes[member];
            const down = state.hp === 0;
            const move = act ? battle.events.find((event) => event.kind === 'act' && sameWho(event.who, who)) : undefined;
            const pose = move?.kind === 'act' ? actionPose(move.fx, move.accent) : undefined;
            const cheering = phase.kind === 'won' && !down;
            const pickable = needs === 'hero';
            const turn = hero === member;
            return (
              <button
                key={member}
                type="button"
                disabled={!pickable}
                onClick={() => pickHero(member)}
                aria-label={HEROES[member].name}
                data-hero={member}
                className="absolute disabled:pointer-events-none"
                style={{ left: left - size / 2, top: feet - size * 0.94, width: size, height: size, zIndex: Math.round(place.y) }}
              >
                <span aria-hidden="true" className="absolute left-[16%] top-[89%] block h-[10%] w-[68%] rounded-[50%] bg-scrim/55" />
                {/* The active hero's gold light ring (a gradient, not a blur) */}
                {turn && (
                  <span
                    aria-hidden="true"
                    className="turn-ring absolute left-[2%] top-[83%] block h-[22%] w-[96%] rounded-[50%] border-[1.5px] border-gold-light/90 bg-[radial-gradient(closest-side,theme(colors.gold.light/55%),theme(colors.gold.DEFAULT/25%)_60%,transparent)]"
                  />
                )}
                {pickable && <span aria-hidden="true" className="absolute left-[6%] top-[84%] block h-[18%] w-[88%] rounded-[50%] border-2 border-gold-light bg-gold/15 shadow-[0_0_16px_theme(colors.gold.DEFAULT/70%)]" />}
                <span className={`relative block h-full w-full ${down ? (rigged ? '' : 'hero-down') : act ? 'hero-lunge' : ''}`} key={`s${battle.step}`}>
                  <span className={`block h-full w-full ${hit ? (flash ? 'fx-hurt' : 'fx-hurt-soft') : ''}`}>
                    <Art lod="battle" state={down ? 'ko' : hit ? 'hurt' : act ? 'attack' : cheering ? 'victory' : 'idle'} pose={pose} facing="right" />
                  </span>
                  {state.shield && <span className="absolute inset-[6%] rounded-full shadow-[0_0_0_3px_theme(colors.mp.to/60%),inset_0_0_16px_theme(colors.mp.to/35%)]" />}
                  {state.guard && <span className="absolute right-[4%] top-[10%] rounded-sm bg-mp-from px-1.5 font-serif text-caption text-inkOnDark shadow-gold">防</span>}
                </span>
                {turn && (
                  <span className="pointer-events-none absolute bottom-[96%] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm bg-gradient-to-b from-gold-diamond to-gold px-2.5 py-0.5 font-serif text-[13px] font-black tracking-[0.12em] text-primary-text shadow-[0_0_12px_theme(colors.gold.light/80%)]">
                    輪到你
                    <span aria-hidden="true" className="absolute left-1/2 top-full block h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-gold" />
                  </span>
                )}
              </button>
            );
          })}
        </SceneClock.Provider>

        <div className="pointer-events-none absolute inset-0 z-[550]">
          <BattleFx key={battle.step} battle={battle} spot={spot} flash={flash} />
        </div>

        {/* The resolution layer (§ 7.10): damage numbers over the effects, each over its sprite's box */}
        <div className="pointer-events-none absolute inset-0 z-[560]">
          {actors.map(({ who, place }) => {
            const event = eventFor(who);
            const float = event ? floater(event) : null;
            if (!float) return null;
            const size = place.s * k;
            return (
              <span key={who.side === 'foe' ? `n${who.slot}` : `n${who.hero}`} className="absolute block" style={{ left: px(place.x) - size / 2, top: py(place.y) - size * 0.94, width: size, height: size }}>
                <FloatingNumber float={float} step={battle.step} />
              </span>
            );
          })}
        </div>
        </div>

        {/* Battle → victory: the gold radial wash once the last foe has calmed */}
        {phase.kind === 'won' && (
          <span aria-hidden="true" className="victory-wash pointer-events-none absolute inset-0 z-[600] block bg-[radial-gradient(70%_55%_at_60%_45%,theme(colors.gold.light/45%),theme(colors.gold.DEFAULT/12%)_55%,transparent_80%)]" />
        )}

        {/* The 布袋戲 frame (boss: valance; final: full proscenium) drops in over 400ms */}
        {frame !== 'none' && (
          <div className="stage-frame-drop pointer-events-none absolute inset-0 z-[700]">
            <BossFrame variant={frame} left={edges.left} right={edges.right} />
          </div>
        )}

        <header className="absolute inset-x-0 top-0 z-[800] flex items-center gap-2 px-3" style={{ paddingTop: `max(env(safe-area-inset-top), ${hudTop}px)` }}>
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

        {/* The foe plate (§ 7.4): a slanted ribbon with gold rules, the kicker, the serif name, ×count */}
        <div
          className="foe-plate-in pointer-events-none absolute right-0 z-[800] w-[62%] max-w-[250px]"
          data-foe-plate=""
          style={{ top: hudTop + 52, clipPath: 'polygon(9% 0, 100% 0, 100% 100%, 0 100%)' }}
        >
          <div className="border-y border-gold bg-[linear-gradient(90deg,transparent,theme(colors.panel.top/92%)_16%,theme(colors.panel.bottom/95%))] py-1.5 pl-[16%] pr-4">
            <p className={`font-num text-[11px] font-semibold tracking-[0.32em] ${battle.boss ? 'text-gold-light' : 'text-hp-critTo'}`}>{battle.boss ? '頭目' : 'ENEMY'}</p>
            <p className="flex items-baseline gap-x-2 overflow-hidden whitespace-nowrap font-serif font-black tracking-[0.08em]">
              {groups.map((group) => (
                <span key={group.name} className={`inline-flex items-baseline ${groups.length > 1 ? 'text-[16px]' : 'text-[19px]'}`}>
                  {group.name}
                  {group.count > 1 && <span className="ml-1 font-num text-[13px] font-semibold tracking-normal text-gold-light">×{group.count}</span>}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* The battle log (what just happened, in words) and who moves next: the reason 身手 is a stat worth reading */}
        <div className="absolute inset-x-0 bottom-0 z-[800] flex items-center gap-3 bg-gradient-to-t from-scrim/85 via-scrim/50 to-transparent px-4 pb-1.5 pt-4 text-caption">
          <p className="min-w-0 flex-1 truncate text-inkOnDark [text-shadow:0_1px_2px_theme(colors.scrim)]" aria-live="polite">
            {logLine(battle)}
          </p>
          <p className="shrink-0 text-mutedOnDark [text-shadow:0_1px_2px_theme(colors.scrim)]">
            接下來 <span className="font-serif text-gold-light">{nextUp}</span>
          </p>
        </div>
      </div>

      <CommandPanel
        tight
        prompt={headline}
        link={link}
        party={
          <div className="grid grid-cols-2 gap-1.5">
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
                  layout="strip"
                  headSize={short ? 34 : 48}
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
          <div className="grid h-[150px] grid-cols-2 content-start gap-2 overflow-y-auto">
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
          <div className="grid h-[150px] grid-cols-2 content-start gap-2 overflow-y-auto">
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
