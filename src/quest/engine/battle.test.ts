import { describe, expect, test } from 'vitest';
import { aliveFoeSlots, battleStep, battleXp, canUseSkill, foeIntent, startBattle } from './battle';
import { roll } from '../../shared/random';
import { FOES } from './foes';
import { MAX_ENERGY, SKILLS, START_ENERGY, heroStats } from './heroes';
import { freshRun } from './quest';
import type { Battle, BattleAction, HeroId, Run } from './types';

const runAt = (level: number, hp: Partial<Record<HeroId, number>> = {}): Run => ({
  ...freshRun(),
  level,
  hp: { baokaka: heroStats('baokaka', level).maxHp, mocha: heroStats('mocha', level).maxHp, ...hp },
});

const play = (battle: Battle, ...actions: BattleAction[]): Battle =>
  actions.reduce((state, action) => battleStep(state, action), battle);

/** Sends ticks until the foe phase is over (or the battle ends). */
function foePhase(battle: Battle): Battle {
  let state = battle;
  for (let guard = 0; guard < 10 && state.phase.kind === 'foe'; guard += 1) {
    state = battleStep(state, { type: 'tick' });
  }
  return state;
}

describe('roll', () => {
  test('is deterministic and advances the seed', () => {
    const a = roll(42);
    const b = roll(42);
    expect(a).toEqual(b);
    expect(a.seed).not.toBe(42);
    expect(roll(a.seed).value).not.toBe(a.value);
    expect(a.value).toBeGreaterThanOrEqual(0);
    expect(a.value).toBeLessThan(1);
  });
});

describe('startBattle', () => {
  test('opens on the first hero with fresh foes and the starting energy', () => {
    const battle = startBattle(runAt(1), ['dustBunny', 'sockMonster'], 7, false);
    expect(battle.phase).toEqual({ kind: 'hero', hero: 'baokaka' });
    expect(battle.energy).toBe(START_ENERGY);
    expect(battle.round).toBe(1);
    expect(battle.foes.map((foe) => foe.hp)).toEqual([FOES.dustBunny.maxHp, FOES.sockMonster.maxHp]);
    expect(battle.heroes.baokaka.hp).toBe(heroStats('baokaka', 1).maxHp);
  });

  test('skips a hero who starts the fight knocked out', () => {
    const battle = startBattle(runAt(1, { baokaka: 0 }), ['dustBunny'], 7, false);
    expect(battle.phase).toEqual({ kind: 'hero', hero: 'mocha' });
  });
});

describe('hero skills', () => {
  test('a basic attack damages the foe within atk * power * variance and gains energy', () => {
    const battle = startBattle(runAt(1), ['blockGolem'], 1, true);
    const next = battleStep(battle, { type: 'skill', skill: 'throwBlock' });
    const dealt = FOES.blockGolem.maxHp - next.foes[0].hp;
    const { atk } = heroStats('baokaka', 1);
    expect(dealt).toBeGreaterThanOrEqual(Math.floor(atk * 0.9));
    expect(dealt).toBeLessThanOrEqual(Math.ceil(atk * 1.1 * 1.5));
    expect(next.energy).toBe(START_ENERGY + 1);
    expect(next.phase).toEqual({ kind: 'hero', hero: 'mocha' });
    expect(next.step).toBe(1);
    expect(next.events[0]).toEqual({ kind: 'act', who: { side: 'hero', hero: 'baokaka' }, name: '丟積木' });
  });

  test('never mutates the previous state', () => {
    const battle = startBattle(runAt(1), ['dustBunny'], 1, false);
    const snapshot = JSON.stringify(battle);
    battleStep(battle, { type: 'skill', skill: 'throwBlock' });
    expect(JSON.stringify(battle)).toBe(snapshot);
  });

  test('an unaffordable skill is ignored', () => {
    const battle = { ...startBattle(runAt(1), ['dustBunny'], 1, false), energy: 0 };
    expect(battleStep(battle, { type: 'skill', skill: 'bigCry' })).toBe(battle);
  });

  test("another hero's skill or a locked skill is ignored", () => {
    const battle = startBattle(runAt(1), ['dustBunny'], 1, false);
    expect(battleStep(battle, { type: 'skill', skill: 'scratch' })).toBe(battle);
    expect(canUseSkill(battle, 'baokaka', SKILLS.hug)).toBe(false);
    expect(battleStep(battle, { type: 'skill', skill: 'hug' })).toBe(battle);
  });

  test('energy never exceeds the cap', () => {
    const battle = { ...startBattle(runAt(1), ['blockGolem'], 1, true), energy: MAX_ENERGY };
    const next = battleStep(battle, { type: 'skill', skill: 'throwBlock' });
    expect(next.energy).toBe(MAX_ENERGY);
    expect(next.events.some((event) => event.kind === 'energy')).toBe(false);
  });

  test('attacking a dead foe is ignored, and omitting the target picks the first living foe', () => {
    const base = startBattle(runAt(6), ['dustBunny', 'sockMonster'], 3, false);
    const battle = { ...base, foes: base.foes.map((foe, slot) => (slot === 0 ? { ...foe, hp: 0 } : foe)) };
    expect(battleStep(battle, { type: 'skill', skill: 'throwBlock', target: 0 })).toBe(battle);
    const next = battleStep(battle, { type: 'skill', skill: 'throwBlock' });
    expect(next.foes[1].hp).toBeLessThan(FOES.sockMonster.maxHp);
  });

  test('an all-target attack hits every living foe', () => {
    const battle = startBattle(runAt(1), ['dustBunny', 'dustBunny', 'sockMonster'], 5, false);
    const next = battleStep(battle, { type: 'skill', skill: 'bigCry' });
    expect(next.foes.every((foe) => foe.hp < FOES[foe.foe].maxHp)).toBe(true);
    expect(next.energy).toBe(START_ENERGY - SKILLS.bigCry.cost);
  });

  test('a guaranteed stun makes the foe skip its next action and then wears off', () => {
    const battle = play(startBattle(runAt(5), ['blockGolem'], 11, true), { type: 'skill', skill: 'throwBlock' });
    // mocha's turn: pass it with a guard so baokaka can scream next round
    let state = play(battle, { type: 'skill', skill: 'guard' });
    state = foePhase(state);
    expect(state.round).toBe(2);
    state = { ...state, energy: MAX_ENERGY };
    state = battleStep(state, { type: 'skill', skill: 'superScream' });
    expect(state.foes[0].stunned).toBe(true);
    expect(foeIntent(state.foes[0], state.heroes)).toEqual({ kind: 'stunned' });
    state = battleStep(state, { type: 'skill', skill: 'guard' });
    const hpBefore = { ...state.heroes };
    state = battleStep(state, { type: 'tick' });
    expect(state.events.some((event) => event.kind === 'skip')).toBe(true);
    expect(state.heroes.baokaka.hp).toBe(hpBefore.baokaka.hp);
    expect(state.heroes.mocha.hp).toBe(hpBefore.mocha.hp);
    expect(state.foes[0].stunned).toBe(false);
    expect(state.foes[0].move).toBe(1); // the skipped turn did not advance the move cycle
  });

  test('a guard halves the next foe hit and is cleared at the new round', () => {
    // Only mocha stands, so the dust bunny's single-target attack must hit her
    const base = startBattle(runAt(1, { baokaka: 0 }), ['dustBunny'], 99, false);
    const guarded = foePhase(battleStep(base, { type: 'skill', skill: 'guard' }));
    const exposed = foePhase(battleStep(base, { type: 'skill', skill: 'scratch' }));
    const maxHp = heroStats('mocha', 1).maxHp;
    const guardedDamage = maxHp - guarded.heroes.mocha.hp;
    const exposedDamage = maxHp - exposed.heroes.mocha.hp;
    expect(exposedDamage).toBeGreaterThan(0);
    expect(guardedDamage).toBe(Math.max(1, Math.round(exposedDamage / 2)));
    expect(guarded.heroes.mocha.guard).toBe(false);
    expect(guarded.round).toBe(2);
  });

  test('healing an ally restores up to max HP and revives a knocked-out hero', () => {
    const battle = startBattle(runAt(3, { mocha: 0 }), ['dustBunny'], 2, false);
    const next = battleStep(battle, { type: 'skill', skill: 'hug', target: 'mocha' });
    const maxHp = heroStats('mocha', 3).maxHp;
    expect(next.heroes.mocha.hp).toBe(Math.round(maxHp * 0.4));
    // The revived hero gets her turn this very round
    expect(next.phase).toEqual({ kind: 'hero', hero: 'mocha' });
    const capped = battleStep(startBattle(runAt(3), ['dustBunny'], 2, false), { type: 'skill', skill: 'hug', target: 'baokaka' });
    expect(capped.heroes.baokaka.hp).toBe(heroStats('baokaka', 3).maxHp);
    expect(capped.events).toContainEqual({ kind: 'heal', who: { side: 'hero', hero: 'baokaka' }, amount: 0 });
  });

  test('purr trades the turn for energy and a small party heal', () => {
    const battle = play(startBattle(runAt(2, { baokaka: 10, mocha: 10 }), ['blockGolem'], 4, true), { type: 'skill', skill: 'guard' });
    const next = battleStep(battle, { type: 'skill', skill: 'purr' });
    expect(next.energy).toBe(START_ENERGY + 1 + 2);
    expect(next.heroes.baokaka.hp).toBe(10 + Math.round(heroStats('baokaka', 2).maxHp * 0.12));
    expect(next.heroes.mocha.hp).toBe(10 + Math.round(heroStats('mocha', 2).maxHp * 0.12));
    expect(next.foes[0].hp).toBe(FOES.blockGolem.maxHp);
    expect(next.phase.kind).toBe('foe');
  });

  test('frenzy lands four hits spread over living foes', () => {
    const battle = play(
      { ...startBattle(runAt(4), ['snail', 'snail', 'snail'], 8, false), energy: MAX_ENERGY },
      { type: 'skill', skill: 'guard' },
    );
    const next = battleStep(battle, { type: 'skill', skill: 'frenzy' });
    expect(next.events.filter((event) => event.kind === 'hit')).toHaveLength(4);
  });
});

describe('items', () => {
  test('a bottle heals the chosen hero and is used up', () => {
    const battle = startBattle(runAt(1, { baokaka: 10 }), ['dustBunny'], 1, false);
    const next = battleStep(battle, { type: 'item', item: 'bottle', target: 'baokaka' });
    expect(next.heroes.baokaka.hp).toBe(10 + Math.round(heroStats('baokaka', 1).maxHp * 0.5));
    expect(next.items.bottle).toBe(battle.items.bottle - 1);
    expect(next.phase).toEqual({ kind: 'hero', hero: 'mocha' });
  });

  test('dried fish fills the energy bar', () => {
    const next = battleStep(startBattle(runAt(1), ['dustBunny'], 1, false), { type: 'item', item: 'driedFish' });
    expect(next.energy).toBe(MAX_ENERGY);
  });

  test('an item with none left is ignored', () => {
    const battle = startBattle({ ...runAt(1), items: { bottle: 0, cookie: 0, driedFish: 0 } }, ['dustBunny'], 1, false);
    expect(battleStep(battle, { type: 'item', item: 'cookie' })).toBe(battle);
  });
});

describe('turn flow', () => {
  test('after both heroes act, every living foe acts once, then round two begins', () => {
    let battle = startBattle(runAt(6), ['snail', 'snail'], 12, false);
    battle = play(battle, { type: 'skill', skill: 'guard' }, { type: 'skill', skill: 'guard' });
    expect(battle.phase).toEqual({ kind: 'foe', index: 0 });
    battle = battleStep(battle, { type: 'tick' });
    expect(battle.phase).toEqual({ kind: 'foe', index: 1 });
    battle = battleStep(battle, { type: 'tick' });
    expect(battle.phase).toEqual({ kind: 'hero', hero: 'baokaka' });
    expect(battle.round).toBe(2);
    expect(battle.foes.every((foe) => foe.move === 1)).toBe(true);
  });

  test('dead foes are skipped in the foe phase', () => {
    let battle = startBattle(runAt(6), ['dustBunny', 'dustBunny', 'dustBunny'], 12, false);
    battle = { ...battle, foes: battle.foes.map((foe, slot) => (slot === 1 ? { ...foe, hp: 0 } : foe)) };
    battle = play(battle, { type: 'skill', skill: 'guard' }, { type: 'skill', skill: 'guard' });
    expect(battle.phase).toEqual({ kind: 'foe', index: 0 });
    battle = battleStep(battle, { type: 'tick' });
    expect(battle.phase).toEqual({ kind: 'foe', index: 2 });
  });

  test('ticks are ignored outside the foe phase and skills outside the hero phase', () => {
    const battle = startBattle(runAt(1), ['dustBunny'], 1, false);
    expect(battleStep(battle, { type: 'tick' })).toBe(battle);
    const foeTurn = play(battle, { type: 'skill', skill: 'guard' }, { type: 'skill', skill: 'guard' });
    expect(battleStep(foeTurn, { type: 'skill', skill: 'throwBlock' })).toBe(foeTurn);
  });

  test('a knocked-out hero loses their turn', () => {
    const battle = startBattle(runAt(1, { mocha: 0 }), ['dustBunny'], 1, false);
    const next = battleStep(battle, { type: 'skill', skill: 'throwBlock' });
    expect(next.phase.kind === 'foe' || next.phase.kind === 'won').toBe(true);
  });

  test('defeating the last foe wins immediately and freezes the battle', () => {
    const fresh = startBattle(runAt(6), ['dustBunny'], 1, false);
    const battle = { ...fresh, foes: [{ ...fresh.foes[0], hp: 1 }] };
    const won = battleStep(battle, { type: 'skill', skill: 'throwBlock' });
    expect(won.foes[0].hp).toBe(0);
    expect(won.phase).toEqual({ kind: 'won' });
    expect(battleStep(won, { type: 'skill', skill: 'scratch' })).toBe(won);
    expect(aliveFoeSlots(won)).toEqual([]);
  });

  test('losing both heroes ends the battle as lost', () => {
    // 大打呼 hits everyone; two heroes on 1 HP cannot survive it
    let battle = startBattle(runAt(1, { baokaka: 1, mocha: 1 }), ['snoreKing'], 1, true);
    battle = { ...battle, foes: [{ ...battle.foes[0], move: 1 }] };
    battle = play(battle, { type: 'skill', skill: 'throwBlock' }, { type: 'skill', skill: 'scratch' });
    battle = foePhase(battle);
    expect(battle.phase).toEqual({ kind: 'lost' });
    expect(battle.events.filter((event) => event.kind === 'ko')).toHaveLength(2);
  });
});

describe('foe moves', () => {
  test('a guarding foe takes half damage until it acts again', () => {
    // Snail opens with 縮進殼裡
    const battle = play(startBattle(runAt(6), ['snail'], 21, false), { type: 'skill', skill: 'guard' }, { type: 'skill', skill: 'guard' });
    const guarded = battleStep(battle, { type: 'tick' });
    expect(guarded.foes[0].guard).toBe(true);
    const hitGuarded = battleStep(guarded, { type: 'skill', skill: 'throwBlock' });
    const hitOpen = battleStep({ ...guarded, foes: [{ ...guarded.foes[0], guard: false }] }, { type: 'skill', skill: 'throwBlock' });
    const guardedDamage = FOES.snail.maxHp - hitGuarded.foes[0].hp;
    const openDamage = FOES.snail.maxHp - hitOpen.foes[0].hp;
    expect(guardedDamage).toBe(Math.max(1, Math.round(openDamage / 2)));
    const acted = foePhase(play(hitGuarded, { type: 'skill', skill: 'guard' }));
    expect(acted.foes[0].guard).toBe(false);
  });

  test('a charging foe does no damage and telegraphs the big hit, naming its target', () => {
    // kiteGhost: 尾巴掃, 飛高高 (charge), 俯衝
    let battle = startBattle(runAt(6), ['kiteGhost'], 5, false);
    battle = { ...battle, foes: [{ ...battle.foes[0], move: 1 }] };
    expect(foeIntent(battle.foes[0], battle.heroes)).toEqual({ kind: 'charge', name: '飛高高' });
    battle = foePhase(play(battle, { type: 'skill', skill: 'guard' }, { type: 'skill', skill: 'guard' }));
    expect(battle.heroes.baokaka.hp).toBe(heroStats('baokaka', 6).maxHp);
    expect(battle.heroes.mocha.hp).toBe(heroStats('mocha', 6).maxHp);
    const intent = foeIntent(battle.foes[0], battle.heroes);
    expect(intent).toMatchObject({ kind: 'attack', name: '俯衝', amount: 22 });
    expect(intent.kind === 'attack' && intent.aim).toBe(battle.foes[0].aim);
  });

  test('a single-target attack lands on the aimed hero, or the other one if the aim is down', () => {
    const base = startBattle(runAt(6), ['dustBunny'], 9, false);
    const aimed = base.foes[0].aim;
    const other: HeroId = aimed === 'baokaka' ? 'mocha' : 'baokaka';
    const hit = foePhase(play(base, { type: 'skill', skill: 'guard' }, { type: 'skill', skill: 'guard' }));
    expect(hit.heroes[aimed].hp).toBeLessThan(heroStats(aimed, 6).maxHp);
    expect(hit.heroes[other].hp).toBe(heroStats(other, 6).maxHp);

    const downed = {
      ...base,
      heroes: { ...base.heroes, [aimed]: { hp: 0, guard: false } },
      phase: { kind: 'hero' as const, hero: other },
    };
    expect(foeIntent(downed.foes[0], downed.heroes)).toMatchObject({ kind: 'attack', aim: other });
    const fallback = foePhase(play(downed, { type: 'skill', skill: 'guard' }));
    expect(fallback.heroes[other].hp).toBeLessThan(heroStats(other, 6).maxHp);
  });

  test('a healing foe recovers a share of its max HP, capped', () => {
    // mosquito: 叮一口, 叮一口, 吸飽飽 (heal 0.3)
    let battle = startBattle(runAt(6), ['mosquito'], 5, false);
    battle = { ...battle, foes: [{ ...battle.foes[0], move: 2, hp: 5 }] };
    battle = foePhase(play(battle, { type: 'skill', skill: 'guard' }, { type: 'skill', skill: 'guard' }));
    expect(battle.foes[0].hp).toBe(5 + Math.round(FOES.mosquito.maxHp * 0.3));
  });

  test('an all-target foe attack hits both heroes', () => {
    // sockMonster's second move is 臭臭攻擊 on everyone
    let battle = startBattle(runAt(6), ['sockMonster'], 5, false);
    battle = { ...battle, foes: [{ ...battle.foes[0], move: 1 }] };
    battle = foePhase(play(battle, { type: 'skill', skill: 'throwBlock' }, { type: 'skill', skill: 'purr' }));
    expect(battle.heroes.baokaka.hp).toBeLessThan(heroStats('baokaka', 6).maxHp);
    expect(battle.heroes.mocha.hp).toBeLessThan(heroStats('mocha', 6).maxHp);
  });
});

test('battleXp sums the foes', () => {
  expect(battleXp(['dustBunny', 'sockMonster'])).toBe(FOES.dustBunny.xp + FOES.sockMonster.xp);
});
