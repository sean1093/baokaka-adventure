import { FOES } from './foes';
import { ITEMS, MAX_ENERGY, SKILLS, START_ENERGY, heroStats } from './heroes';
import {
  HERO_ORDER,
  type Battle,
  type BattleAction,
  type FoeId,
  type FoeState,
  type HeroId,
  type Item,
  type Run,
  type Skill,
  type Who,
} from './types';

/** Critical hits multiply damage by this */
const CRIT_MULTIPLIER = 1.5;
/** Every hit lands somewhere in atk * power * [0.9, 1.1) */
const VARIANCE = 0.2;

/** mulberry32: a few integer ops, good enough for dice, and replays identically from its seed. */
export function roll(seed: number): { value: number; seed: number } {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next };
}

const heroWho = (hero: HeroId): Who => ({ side: 'hero', hero });
const foeWho = (slot: number): Who => ({ side: 'foe', slot });

export const aliveHeroes = (battle: Battle): HeroId[] => HERO_ORDER.filter((hero) => battle.heroes[hero].hp > 0);
export const aliveFoeSlots = (battle: Battle): number[] =>
  battle.foes.flatMap((foe, slot) => (foe.hp > 0 ? [slot] : []));

export function startBattle(run: Run, foes: FoeId[], seed: number, boss: boolean): Battle {
  const heroes = {
    baokaka: { hp: run.hp.baokaka, guard: false },
    mocha: { hp: run.hp.mocha, guard: false },
  };
  const alive = HERO_ORDER.filter((hero) => heroes[hero].hp > 0);
  let cursor = seed;
  return {
    level: run.level,
    heroes,
    foes: foes.map((foe) => {
      const rolled = roll(cursor);
      cursor = rolled.seed;
      return {
        foe,
        hp: FOES[foe].maxHp,
        guard: false,
        stunned: false,
        move: 0,
        aim: alive[Math.floor(rolled.value * alive.length)] ?? 'baokaka',
      };
    }),
    items: { ...run.items },
    energy: START_ENERGY,
    round: 1,
    phase: { kind: 'hero', hero: alive[0] ?? 'baokaka' },
    boss,
    seed: cursor,
    step: 0,
    events: [],
  };
}

/** The hero a single-target foe attack lands on: the aimed one, or whoever is still standing. */
const resolveAim = (state: FoeState, heroes: Battle['heroes']): HeroId =>
  heroes[state.aim].hp > 0 ? state.aim : (HERO_ORDER.find((hero) => heroes[hero].hp > 0) ?? state.aim);

/** True when the acting hero may use this skill right now (owner, unlock level, energy). */
export function canUseSkill(battle: Battle, hero: HeroId, skill: Skill): boolean {
  return (
    (skill.hero === hero || skill.hero === 'both') &&
    skill.unlockLevel <= battle.level &&
    skill.cost <= battle.energy
  );
}

/**
 * One step of the battle state machine. Pure: returns a new Battle and never touches the input.
 * Illegal actions (wrong phase, dead target, unaffordable skill) return the input unchanged.
 */
export function battleStep(battle: Battle, action: BattleAction): Battle {
  if (battle.phase.kind === 'won' || battle.phase.kind === 'lost') return battle;

  const draft: Battle = {
    ...battle,
    heroes: {
      baokaka: { ...battle.heroes.baokaka },
      mocha: { ...battle.heroes.mocha },
    },
    foes: battle.foes.map((foe) => ({ ...foe })),
    items: { ...battle.items },
    events: [],
    step: battle.step + 1,
  };

  switch (action.type) {
    case 'skill': {
      if (draft.phase.kind !== 'hero') return battle;
      const hero = draft.phase.hero;
      const skill = SKILLS[action.skill];
      if (!canUseSkill(draft, hero, skill)) return battle;
      if (
        skill.effect.kind === 'attack' &&
        skill.effect.target === 'one' &&
        typeof action.target === 'number' &&
        !(draft.foes[action.target]?.hp > 0)
      ) {
        return battle;
      }
      useSkill(draft, hero, skill, action.target);
      afterHeroAction(draft, hero);
      return draft;
    }
    case 'item': {
      if (draft.phase.kind !== 'hero') return battle;
      const hero = draft.phase.hero;
      if (draft.items[action.item] <= 0) return battle;
      useItem(draft, hero, ITEMS[action.item], action.target);
      afterHeroAction(draft, hero);
      return draft;
    }
    case 'tick': {
      if (draft.phase.kind !== 'foe') return battle;
      foeTurn(draft, draft.phase.index);
      return draft;
    }
  }
}

function rand(draft: Battle): number {
  const result = roll(draft.seed);
  draft.seed = result.seed;
  return result.value;
}

function damageRoll(draft: Battle, atk: number, power: number, critChance: number): { amount: number; crit: boolean } {
  const variance = 1 - VARIANCE / 2 + rand(draft) * VARIANCE;
  const crit = critChance > 0 && rand(draft) < critChance;
  const amount = Math.max(1, Math.round(atk * power * variance * (crit ? CRIT_MULTIPLIER : 1)));
  return { amount, crit };
}

function strikeFoe(draft: Battle, slot: number, atk: number, power: number, critChance: number, stunChance: number): void {
  const foe = draft.foes[slot];
  const hit = damageRoll(draft, atk, power, critChance);
  const amount = foe.guard ? Math.max(1, Math.round(hit.amount / 2)) : hit.amount;
  foe.hp = Math.max(0, foe.hp - amount);
  draft.events.push({ kind: 'hit', who: foeWho(slot), amount, crit: hit.crit });
  if (foe.hp === 0) {
    draft.events.push({ kind: 'ko', who: foeWho(slot) });
  } else if (stunChance > 0 && !foe.stunned && rand(draft) < stunChance) {
    foe.stunned = true;
    draft.events.push({ kind: 'stun', who: foeWho(slot) });
  }
}

function healHero(draft: Battle, hero: HeroId, ratio: number): void {
  const { maxHp } = heroStats(hero, draft.level);
  const state = draft.heroes[hero];
  const amount = Math.min(maxHp - state.hp, Math.round(maxHp * ratio));
  state.hp += amount;
  draft.events.push({ kind: 'heal', who: heroWho(hero), amount });
}

function changeEnergy(draft: Battle, delta: number): void {
  const before = draft.energy;
  draft.energy = Math.max(0, Math.min(MAX_ENERGY, before + delta));
  if (draft.energy !== before) draft.events.push({ kind: 'energy', delta: draft.energy - before });
}

function useSkill(draft: Battle, hero: HeroId, skill: Skill, target: number | HeroId | undefined): void {
  const { atk } = heroStats(hero, draft.level);
  const { effect } = skill;
  draft.events.push({ kind: 'act', who: heroWho(hero), name: skill.name });
  changeEnergy(draft, -skill.cost);

  switch (effect.kind) {
    case 'attack': {
      const alive = aliveFoeSlots(draft);
      if (effect.target === 'one') {
        const slot = typeof target === 'number' ? target : alive[0];
        for (let hit = 0; hit < effect.hits && draft.foes[slot].hp > 0; hit += 1) {
          strikeFoe(draft, slot, atk, effect.power, effect.crit, effect.stun);
        }
      } else if (effect.target === 'all') {
        for (const slot of alive) strikeFoe(draft, slot, atk, effect.power, effect.crit, effect.stun);
      } else {
        for (let hit = 0; hit < effect.hits; hit += 1) {
          const targets = aliveFoeSlots(draft);
          if (targets.length === 0) break;
          const slot = targets[Math.floor(rand(draft) * targets.length)];
          strikeFoe(draft, slot, atk, effect.power, effect.crit, effect.stun);
        }
      }
      break;
    }
    case 'heal':
      if (effect.target === 'party') {
        for (const ally of HERO_ORDER) healHero(draft, ally, effect.ratio);
      } else {
        healHero(draft, typeof target === 'string' ? target : hero, effect.ratio);
      }
      break;
    case 'guard':
      draft.heroes[hero].guard = true;
      draft.events.push({ kind: 'guard', who: heroWho(hero) });
      break;
  }

  changeEnergy(draft, skill.gain);
}

function useItem(draft: Battle, hero: HeroId, item: Item, target: HeroId | undefined): void {
  draft.items[item.id] -= 1;
  draft.events.push({ kind: 'act', who: heroWho(hero), name: item.name });
  if (item.effect.kind === 'energy') {
    changeEnergy(draft, MAX_ENERGY);
  } else if (item.effect.target === 'party') {
    for (const ally of HERO_ORDER) healHero(draft, ally, item.effect.ratio);
  } else {
    healHero(draft, target ?? hero, item.effect.ratio);
  }
}

function afterHeroAction(draft: Battle, hero: HeroId): void {
  if (aliveFoeSlots(draft).length === 0) {
    draft.phase = { kind: 'won' };
    return;
  }
  const next = HERO_ORDER.slice(HERO_ORDER.indexOf(hero) + 1).find((ally) => draft.heroes[ally].hp > 0);
  draft.phase = next ? { kind: 'hero', hero: next } : { kind: 'foe', index: aliveFoeSlots(draft)[0] };
}

function foeTurn(draft: Battle, index: number): void {
  const state = draft.foes[index];
  const foe = FOES[state.foe];
  // A foe's guard covers the heroes' turns in between and drops as soon as it acts again
  state.guard = false;

  if (state.stunned) {
    state.stunned = false;
    draft.events.push({ kind: 'skip', who: foeWho(index) });
  } else {
    const move = foe.moves[state.move % foe.moves.length];
    state.move += 1;
    draft.events.push({ kind: 'act', who: foeWho(index), name: move.name });

    switch (move.kind) {
      case 'attack': {
        const targets = move.target === 'all' ? aliveHeroes(draft) : [resolveAim(state, draft.heroes)];
        for (const hero of targets) {
          const hit = damageRoll(draft, foe.atk, move.power, 0);
          const heroState = draft.heroes[hero];
          const amount = heroState.guard ? Math.max(1, Math.round(hit.amount / 2)) : hit.amount;
          heroState.hp = Math.max(0, heroState.hp - amount);
          draft.events.push({ kind: 'hit', who: heroWho(hero), amount, crit: false });
          if (heroState.hp === 0) draft.events.push({ kind: 'ko', who: heroWho(hero) });
        }
        break;
      }
      case 'guard':
        state.guard = true;
        draft.events.push({ kind: 'guard', who: foeWho(index) });
        break;
      case 'charge':
        draft.events.push({ kind: 'charge', who: foeWho(index) });
        break;
      case 'heal': {
        const amount = Math.min(foe.maxHp - state.hp, Math.round(foe.maxHp * move.ratio));
        state.hp += amount;
        draft.events.push({ kind: 'heal', who: foeWho(index), amount });
        break;
      }
    }
    // Aim the next move now, so the intent bubble can name the hero before it happens
    const alive = aliveHeroes(draft);
    state.aim = alive[Math.floor(rand(draft) * alive.length)] ?? state.aim;
  }

  if (aliveHeroes(draft).length === 0) {
    draft.phase = { kind: 'lost' };
    return;
  }

  const next = aliveFoeSlots(draft).find((slot) => slot > index);
  if (next !== undefined) {
    draft.phase = { kind: 'foe', index: next };
    return;
  }
  // New round: hero guards were for this foe phase only
  draft.round += 1;
  for (const hero of HERO_ORDER) draft.heroes[hero].guard = false;
  draft.phase = { kind: 'hero', hero: aliveHeroes(draft)[0] };
}

export type Intent =
  | { kind: 'stunned' }
  | { kind: 'attack'; name: string; amount: number; aim: HeroId | 'all' }
  | { kind: 'guard' | 'charge' | 'heal'; name: string };

/** What this foe will do on its next turn, shown to the player so guarding is a real decision. */
export function foeIntent(state: FoeState, heroes: Battle['heroes']): Intent {
  if (state.stunned) return { kind: 'stunned' };
  const foe = FOES[state.foe];
  const move = foe.moves[state.move % foe.moves.length];
  if (move.kind === 'attack') {
    return {
      kind: 'attack',
      name: move.name,
      amount: Math.round(foe.atk * move.power),
      aim: move.target === 'all' ? 'all' : resolveAim(state, heroes),
    };
  }
  return { kind: move.kind, name: move.name };
}

export const battleXp = (foes: FoeId[]): number => foes.reduce((sum, foe) => sum + FOES[foe].xp, 0);
