import { roll } from '../../shared/random';
import { FOES } from './foes';
import { ITEMS, SPELLS, partyStats, removeItem } from './heroes';
import {
  HERO_ORDER,
  type Battle,
  type BattleAction,
  type BattleEvent,
  type FoeId,
  type HeroId,
  type Phase,
  type Run,
  type Spell,
  type Who,
} from './types';

/** Every hit lands somewhere in [0.9, 1.1] of its base */
const VARIANCE = 0.1;
const CRIT_MULTIPLIER = 1.5;
/** 防禦 halves damage until the guard's next turn and gives back a little 真氣 */
const GUARD_MP = 4;
const FLEE_BASE = 0.55;

export const heroWho = (hero: HeroId): Who => ({ side: 'hero', hero });
export const foeWho = (slot: number): Who => ({ side: 'foe', slot });

export const sameWho = (a: Who, b: Who): boolean =>
  a.side === 'hero' ? b.side === 'hero' && a.hero === b.hero : b.side === 'foe' && a.slot === b.slot;

export const aliveFoeSlots = (battle: Battle): number[] =>
  battle.foes.flatMap((foe, slot) => (foe.hp > 0 ? [slot] : []));

export const aliveHeroes = (battle: Battle): HeroId[] => battle.party.filter((hero) => battle.heroes[hero].hp > 0);

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/** Fastest first; heroes win ties so the player always gets to react to an equal foe. */
function computeOrder(battle: Battle): Who[] {
  const heroes = aliveHeroes(battle).map((hero) => ({ who: heroWho(hero), spd: battle.stats[hero].spd, tie: 0 }));
  const foes = aliveFoeSlots(battle).map((slot) => ({ who: foeWho(slot), spd: FOES[battle.foes[slot].foe].stats.spd, tie: 1 }));
  return [...heroes, ...foes].sort((a, b) => b.spd - a.spd || a.tie - b.tie).map((entry) => entry.who);
}

export function startBattle(run: Run, foes: FoeId[], seed: number, boss: boolean): Battle {
  const heroes = {} as Battle['heroes'];
  for (const hero of HERO_ORDER) heroes[hero] = { hp: run.hp[hero], mp: run.mp[hero], guard: false, shield: false };

  const battle: Battle = {
    seed,
    boss,
    level: run.level,
    party: run.party,
    heroes,
    stats: partyStats(run),
    foes: foes.map((foe) => ({ foe, hp: FOES[foe].stats.hp, guard: false, move: 0 })),
    items: run.items,
    round: 1,
    order: [],
    turn: 0,
    phase: { kind: 'lost' },
    step: 0,
    events: [],
  };
  battle.order = computeOrder(battle);
  battle.phase = phaseFor(battle, battle.order[0]);
  return battle;
}

function phaseFor(battle: Battle, who: Who): Phase {
  if (who.side === 'hero') {
    battle.heroes[who.hero] = { ...battle.heroes[who.hero], guard: false };
    return { kind: 'hero', hero: who.hero };
  }
  battle.foes[who.slot] = { ...battle.foes[who.slot], guard: false };
  return { kind: 'foe', slot: who.slot };
}

/** True when the hero knows the spell and can pay for it right now. */
export function canCast(battle: Battle, hero: HeroId, spell: Spell): boolean {
  return spell.hero === hero && spell.level <= battle.level && battle.heroes[hero].mp >= spell.cost;
}

/** What the acting foe will do next; the UI shows it so 防禦 is an informed choice. */
export function foeIntent(battle: Battle, slot: number): string {
  const foe = FOES[battle.foes[slot].foe];
  return foe.moves[battle.foes[slot].move % foe.moves.length].name;
}

export const battleXp = (battle: Battle): number => battle.foes.reduce((sum, foe) => sum + FOES[foe.foe].xp, 0);
export const battleStickers = (battle: Battle): number => battle.foes.reduce((sum, foe) => sum + FOES[foe.foe].stickers, 0);

/**
 * One action by whoever's turn it is. Pure: returns the next battle with fresh `events`.
 * Heroes act on their phase; on a foe phase only `tick` is accepted.
 */
export function battleStep(battle: Battle, action: BattleAction): Battle {
  const { phase } = battle;
  if (phase.kind === 'won' || phase.kind === 'lost' || phase.kind === 'fled') return battle;
  if (phase.kind === 'foe' ? action.type !== 'tick' : action.type === 'tick') return battle;

  const draft: Battle = {
    ...battle,
    heroes: { ...battle.heroes },
    foes: battle.foes.map((foe) => ({ ...foe })),
    events: [],
    step: battle.step + 1,
  };
  const events: BattleEvent[] = draft.events;

  let seed = draft.seed;
  const draw = (): number => {
    const result = roll(seed);
    seed = result.seed;
    return result.value;
  };
  const vary = (base: number): number => Math.max(1, Math.round(base * (1 - VARIANCE + draw() * 2 * VARIANCE)));

  const hitFoe = (slot: number, amount: number, crit: boolean) => {
    const target = draft.foes[slot];
    const dealt = Math.max(1, Math.round(target.guard ? amount / 2 : amount));
    target.hp = Math.max(0, target.hp - dealt);
    events.push({ kind: 'hit', who: foeWho(slot), amount: dealt, crit });
    if (target.hp === 0) events.push({ kind: 'ko', who: foeWho(slot) });
  };

  const hitHero = (hero: HeroId, amount: number) => {
    const target = draft.heroes[hero];
    let dealt = amount;
    if (target.guard) dealt /= 2;
    if (target.shield) dealt /= 2;
    dealt = Math.max(1, Math.round(dealt));
    draft.heroes[hero] = { ...target, hp: Math.max(0, target.hp - dealt) };
    events.push({ kind: 'hit', who: heroWho(hero), amount: dealt, crit: false });
    if (draft.heroes[hero].hp === 0) events.push({ kind: 'ko', who: heroWho(hero) });
  };

  const healHero = (hero: HeroId, amount: number, revive = false) => {
    const target = draft.heroes[hero];
    if (target.hp === 0 && !revive) return;
    const max = draft.stats[hero].hp;
    const gained = Math.min(max - target.hp, Math.max(0, Math.round(amount)));
    if (target.hp === 0) events.push({ kind: 'revive', who: heroWho(hero) });
    draft.heroes[hero] = { ...target, hp: target.hp + gained };
    events.push({ kind: 'heal', who: heroWho(hero), amount: gained });
  };

  const restoreMp = (hero: HeroId, amount: number) => {
    const target = draft.heroes[hero];
    const gained = Math.min(draft.stats[hero].mp - target.mp, amount);
    draft.heroes[hero] = { ...target, mp: target.mp + gained };
    events.push({ kind: 'mp', who: heroWho(hero), amount: gained });
  };

  const firstAliveFoe = (preferred: number | undefined): number | null => {
    const alive = aliveFoeSlots(draft);
    if (alive.length === 0) return null;
    return preferred !== undefined && alive.includes(preferred) ? preferred : alive[0];
  };

  if (phase.kind === 'hero') {
    const hero = phase.hero;
    const stats = draft.stats[hero];
    const crit = () => draw() < 0.05 + stats.luck / 100;

    switch (action.type) {
      case 'attack': {
        const slot = firstAliveFoe(action.target);
        if (slot === null) return battle;
        events.push({ kind: 'act', who: heroWho(hero), name: '攻擊' });
        const isCrit = crit();
        const base = Math.max(1, stats.atk - FOES[draft.foes[slot].foe].stats.def * 0.5);
        hitFoe(slot, vary(base) * (isCrit ? CRIT_MULTIPLIER : 1), isCrit);
        break;
      }

      case 'spell': {
        const spell = SPELLS[action.spell];
        if (!canCast(draft, hero, spell)) return battle;
        draft.heroes[hero] = { ...draft.heroes[hero], mp: draft.heroes[hero].mp - spell.cost };
        events.push({ kind: 'act', who: heroWho(hero), name: spell.name });
        const strength = stats.atk * 0.7 + draft.level * 2;

        if (spell.effect.kind === 'damage') {
          const slots =
            spell.effect.target === 'all'
              ? aliveFoeSlots(draft)
              : [firstAliveFoe(typeof action.target === 'number' ? action.target : undefined)].filter((slot): slot is number => slot !== null);
          for (const slot of slots) {
            const isCrit = crit();
            const base = Math.max(1, strength * spell.effect.power - FOES[draft.foes[slot].foe].stats.def * 0.3);
            hitFoe(slot, vary(base) * (isCrit ? CRIT_MULTIPLIER : 1), isCrit);
          }
        } else if (spell.effect.kind === 'heal') {
          const { ratio, target, revive } = spell.effect;
          const targets = target === 'party' ? draft.party : [typeof action.target === 'string' ? action.target : hero];
          for (const ally of targets) healHero(ally, draft.stats[ally].hp * ratio, revive);
        } else {
          for (const ally of aliveHeroes(draft)) draft.heroes[ally] = { ...draft.heroes[ally], shield: true };
          events.push({ kind: 'shield' });
        }
        break;
      }

      case 'item': {
        const count = draft.items[action.item] ?? 0;
        const item = ITEMS[action.item];
        const target = draft.heroes[action.target];
        if (count === 0 || item.use.kind === 'equip' || !draft.party.includes(action.target)) return battle;
        if (item.use.kind === 'revive' ? target.hp > 0 : target.hp === 0) return battle;
        draft.items = removeItem(draft.items, action.item);
        events.push({ kind: 'act', who: heroWho(hero), name: item.name });
        switch (item.use.kind) {
          case 'hp':
            healHero(action.target, item.use.amount);
            break;
          case 'hpAll':
            for (const ally of aliveHeroes(draft)) healHero(ally, item.use.amount);
            break;
          case 'mp':
            restoreMp(action.target, item.use.amount);
            break;
          case 'full':
            healHero(action.target, draft.stats[action.target].hp);
            restoreMp(action.target, draft.stats[action.target].mp);
            break;
          case 'revive':
            healHero(action.target, draft.stats[action.target].hp * item.use.ratio, true);
            break;
        }
        break;
      }

      case 'guard':
        draft.heroes[hero] = { ...draft.heroes[hero], guard: true };
        events.push({ kind: 'guard', who: heroWho(hero) });
        restoreMp(hero, GUARD_MP);
        break;

      case 'flee': {
        if (draft.boss) return battle;
        events.push({ kind: 'act', who: heroWho(hero), name: '逃跑' });
        const partySpd = aliveHeroes(draft).reduce((sum, ally) => sum + draft.stats[ally].spd, 0) / aliveHeroes(draft).length;
        const foeSpd = Math.max(...aliveFoeSlots(draft).map((slot) => FOES[draft.foes[slot].foe].stats.spd));
        const chance = clamp(FLEE_BASE + (partySpd - foeSpd) * 0.03, 0.25, 0.9);
        const ok = draw() < chance;
        events.push({ kind: 'flee', ok });
        if (ok) {
          draft.seed = seed;
          draft.phase = { kind: 'fled' };
          return draft;
        }
        break;
      }

      case 'tick':
        return battle;
    }
  } else {
    const slot = phase.slot;
    const state = draft.foes[slot];
    const foe = FOES[state.foe];
    const move = foe.moves[state.move % foe.moves.length];
    state.move += 1;
    events.push({ kind: 'act', who: foeWho(slot), name: move.name });

    if (move.kind === 'attack') {
      const alive = aliveHeroes(draft);
      const targets = move.target === 'all' ? alive : [alive[Math.floor(draw() * alive.length)]];
      for (const hero of targets) {
        const base = Math.max(1, foe.stats.atk * move.power - draft.stats[hero].def * 0.5);
        hitHero(hero, vary(base));
      }
    } else if (move.kind === 'guard') {
      state.guard = true;
      events.push({ kind: 'guard', who: foeWho(slot) });
    } else {
      const gained = Math.min(foe.stats.hp - state.hp, Math.round(foe.stats.hp * move.ratio));
      state.hp += gained;
      events.push({ kind: 'heal', who: foeWho(slot), amount: gained });
    }
  }

  draft.seed = seed;
  return advance(draft);
}

/** Ends the acting side's turn: settles a win or loss, otherwise hands the phase to the next actor. */
function advance(draft: Battle): Battle {
  if (aliveFoeSlots(draft).length === 0) return { ...draft, phase: { kind: 'won' } };
  if (aliveHeroes(draft).length === 0) return { ...draft, phase: { kind: 'lost' } };

  let turn = draft.turn + 1;
  let order = draft.order;
  let round = draft.round;
  const isAlive = (who: Who) => (who.side === 'hero' ? draft.heroes[who.hero].hp > 0 : draft.foes[who.slot].hp > 0);
  while (turn < order.length && !isAlive(order[turn])) turn += 1;
  if (turn >= order.length) {
    // A new round: 泡泡護盾 lasted exactly one
    round += 1;
    order = computeOrder(draft);
    turn = 0;
    for (const hero of draft.party) draft.heroes[hero] = { ...draft.heroes[hero], shield: false };
  }
  const next = { ...draft, order, turn, round };
  next.phase = phaseFor(next, order[turn]);
  return next;
}
