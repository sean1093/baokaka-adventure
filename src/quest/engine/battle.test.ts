import { describe, expect, test } from 'vitest';
import { aliveFoeSlots, aliveHeroes, battleStep, battleStickers, battleXp, canCast, foeIntent, startBattle } from './battle';
import { FOES } from './foes';
import { SPELLS, heroStats } from './heroes';
import { freshRun } from './quest';
import type { Battle, FoeId, HeroId, Run } from './types';

const runAt = (level: number, party: HeroId[] = ['baokaka', 'mocha', 'duck']): Run => {
  const base = freshRun(7);
  const run: Run = { ...base, level, party };
  const hp = { ...run.hp };
  const mp = { ...run.mp };
  for (const hero of party) {
    hp[hero] = heroStats(hero, level).hp;
    mp[hero] = heroStats(hero, level).mp;
  }
  return { ...run, hp, mp };
};

const fight = (level: number, foes: FoeId[], boss = false, party?: HeroId[]): Battle =>
  startBattle(runAt(level, party), foes, 12345, boss);

/** Drives the battle until it is a given hero's turn, ticking through any foes on the way. */
function untilHero(battle: Battle, hero: HeroId): Battle {
  let current = battle;
  for (let guard = 0; guard < 40; guard += 1) {
    if (current.phase.kind === 'hero' && current.phase.hero === hero) return current;
    if (current.phase.kind === 'foe') current = battleStep(current, { type: 'tick' });
    else if (current.phase.kind === 'hero') current = battleStep(current, { type: 'guard' });
    else return current;
  }
  throw new Error(`never reached ${hero}'s turn`);
}

describe('turn order', () => {
  test('is fastest first and heroes win ties', () => {
    const battle = fight(3, ['snail']);
    const speeds = battle.order.map((who) => (who.side === 'hero' ? battle.stats[who.hero].spd : FOES[battle.foes[who.slot].foe].stats.spd));
    expect(speeds).toEqual([...speeds].sort((a, b) => b - a));
    // Mocha is the fastest hero, so she opens the round
    expect(battle.phase).toEqual({ kind: 'hero', hero: 'mocha' });
  });

  test('skips the fallen and rebuilds every round', () => {
    let battle = fight(3, ['dustBunny']);
    const rounds = new Set<number>();
    for (let step = 0; step < 12 && battle.phase.kind !== 'won' && battle.phase.kind !== 'lost'; step += 1) {
      rounds.add(battle.round);
      battle = battle.phase.kind === 'foe' ? battleStep(battle, { type: 'tick' }) : battleStep(battle, { type: 'guard' });
    }
    expect(rounds.size).toBeGreaterThan(1);
  });
});

describe('attacking', () => {
  test('deals damage and knocks a foe out', () => {
    let battle = fight(6, ['dustBunny']);
    battle = untilHero(battle, 'mocha');
    const after = battleStep(battle, { type: 'attack', target: 0 });
    expect(after.foes[0].hp).toBeLessThan(FOES.dustBunny.stats.hp);
    expect(after.events.some((event) => event.kind === 'hit')).toBe(true);
  });

  test('a guarding foe takes half damage', () => {
    // 蝸牛 opens with 縮進殼裡
    let battle = fight(4, ['snail']);
    expect(foeIntent(battle, 0)).toBe('縮進殼裡');
    battle = untilHero(battle, 'mocha');
    const open = battleStep(battle, { type: 'attack', target: 0 });
    const openDamage = FOES.snail.stats.hp - open.foes[0].hp;

    let guarded = battleStep(fight(4, ['snail']), { type: 'guard' });
    while (guarded.phase.kind !== 'foe') guarded = battleStep(guarded, { type: 'guard' });
    guarded = battleStep(guarded, { type: 'tick' });
    expect(guarded.foes[0].guard).toBe(true);
    guarded = untilHero(guarded, 'mocha');
    const hit = battleStep(guarded, { type: 'attack', target: 0 });
    expect(FOES.snail.stats.hp - hit.foes[0].hp).toBeLessThan(openDamage);
  });

  test('attacking a dead foe falls back to a living one', () => {
    let battle = fight(9, ['dustBunny', 'dustBunny']);
    battle = untilHero(battle, 'mocha');
    battle = battleStep(battle, { type: 'attack', target: 0 });
    while (battle.foes[0].hp > 0) battle = battleStep(untilHero(battle, 'mocha'), { type: 'attack', target: 0 });
    const next = battleStep(untilHero(battle, 'mocha'), { type: 'attack', target: 0 });
    expect(next.foes[1].hp).toBeLessThan(FOES.dustBunny.stats.hp);
  });

  test('clearing every foe wins and freezes the battle', () => {
    let battle = fight(12, ['dustBunny']);
    battle = untilHero(battle, 'mocha');
    while (battle.phase.kind !== 'won' && battle.foes[0].hp > 0) {
      battle = battle.phase.kind === 'foe' ? battleStep(battle, { type: 'tick' }) : battleStep(battle, { type: 'attack', target: 0 });
    }
    expect(battle.phase).toEqual({ kind: 'won' });
    expect(battleStep(battle, { type: 'attack', target: 0 })).toBe(battle);
  });
});

describe('spells', () => {
  test('cost 真氣 and refuse when there is not enough', () => {
    let battle = untilHero(fight(3, ['dustBunny']), 'baokaka');
    const before = battle.heroes.baokaka.mp;
    battle = battleStep(battle, { type: 'spell', spell: 'throwBlock', target: 0 });
    expect(battle.heroes.baokaka.mp).toBe(before - SPELLS.throwBlock.cost);

    const broke = untilHero(fight(3, ['dustBunny']), 'baokaka');
    const empty: Battle = { ...broke, heroes: { ...broke.heroes, baokaka: { ...broke.heroes.baokaka, mp: 0 } } };
    expect(canCast(empty, 'baokaka', SPELLS.throwBlock)).toBe(false);
    expect(battleStep(empty, { type: 'spell', spell: 'throwBlock', target: 0 })).toBe(empty);
  });

  test('an unlearned spell cannot be cast', () => {
    const battle = untilHero(fight(1, ['dustBunny']), 'baokaka');
    expect(canCast(battle, 'baokaka', SPELLS.crawlDash)).toBe(false);
  });

  test('a party spell hits every living foe', () => {
    const battle = untilHero(fight(8, ['dustBunny', 'dustBunny', 'sockMonster']), 'duck');
    const after = battleStep(battle, { type: 'spell', spell: 'splash' });
    expect(after.foes.every((foe, slot) => foe.hp < FOES[battle.foes[slot].foe].stats.hp)).toBe(true);
  });

  test('healing tops up an ally without passing their maximum', () => {
    const start = untilHero(fight(6, ['dustBunny']), 'mocha');
    const hurt: Battle = { ...start, heroes: { ...start.heroes, baokaka: { ...start.heroes.baokaka, hp: 5 } } };
    const healed = battleStep(hurt, { type: 'spell', spell: 'purr', target: 'baokaka' });
    expect(healed.heroes.baokaka.hp).toBeGreaterThan(5);

    const topped = battleStep(untilHero(healed, 'mocha'), { type: 'spell', spell: 'purr', target: 'mocha' });
    expect(topped.heroes.mocha.hp).toBe(topped.stats.mocha.hp);
  });

  test('九命回春 brings a fallen hero back', () => {
    const start = untilHero(fight(9, ['dustBunny']), 'mocha');
    const down: Battle = { ...start, heroes: { ...start.heroes, baokaka: { ...start.heroes.baokaka, hp: 0 } } };
    const revived = battleStep(down, { type: 'spell', spell: 'nineLives' });
    expect(revived.heroes.baokaka.hp).toBeGreaterThan(0);
    expect(revived.events.some((event) => event.kind === 'revive')).toBe(true);
  });

  test('泡泡護盾 halves what the party takes for the round', () => {
    const shielded = battleStep(untilHero(fight(7, ['sockMonster']), 'duck'), { type: 'spell', spell: 'bubbleShield' });
    expect(shielded.events.some((event) => event.kind === 'shield')).toBe(true);
    expect(shielded.party.every((hero) => shielded.heroes[hero].shield)).toBe(true);
  });
});

describe('items and guarding', () => {
  test('an item is spent and heals its target', () => {
    const start = untilHero(fight(4, ['dustBunny']), 'mocha');
    const hurt: Battle = { ...start, items: { cookie: 2 }, heroes: { ...start.heroes, baokaka: { ...start.heroes.baokaka, hp: 10 } } };
    const used = battleStep(hurt, { type: 'item', item: 'cookie', target: 'baokaka' });
    expect(used.items.cookie).toBe(1);
    expect(used.heroes.baokaka.hp).toBe(35);
  });

  test('an item the party does not carry does nothing', () => {
    const battle = untilHero(fight(4, ['dustBunny']), 'mocha');
    const empty: Battle = { ...battle, items: {} };
    expect(battleStep(empty, { type: 'item', item: 'bottle', target: 'mocha' })).toBe(empty);
  });

  test('guarding halves the next hit and gives back a little 真氣', () => {
    let battle = fight(3, ['pigeon'], false, ['baokaka']);
    battle = { ...battle, heroes: { ...battle.heroes, baokaka: { ...battle.heroes.baokaka, mp: 0 } } };
    const guarded = battleStep(battle, { type: 'guard' });
    expect(guarded.heroes.baokaka.guard).toBe(true);
    expect(guarded.heroes.baokaka.mp).toBeGreaterThan(0);
  });
});

describe('fleeing', () => {
  test('is refused in a boss fight', () => {
    const battle = fight(5, ['blockGolem'], true);
    expect(battleStep(battle, { type: 'flee' })).toBe(battle);
  });

  test('either escapes or costs the turn', () => {
    const battle = untilHero(fight(5, ['dustBunny']), 'mocha');
    const after = battleStep(battle, { type: 'flee' });
    const event = after.events.find((entry) => entry.kind === 'flee');
    expect(event).toBeDefined();
    if (event && event.kind === 'flee' && event.ok) expect(after.phase).toEqual({ kind: 'fled' });
    else expect(after.phase.kind).not.toBe('fled');
  });
});

describe('losing', () => {
  test('the party falling ends the battle', () => {
    let battle = fight(1, ['snoreKing'], true, ['baokaka']);
    for (let step = 0; step < 40 && battle.phase.kind !== 'lost'; step += 1) {
      battle = battle.phase.kind === 'foe' ? battleStep(battle, { type: 'tick' }) : battleStep(battle, { type: 'guard' });
    }
    expect(battle.phase).toEqual({ kind: 'lost' });
    expect(aliveHeroes(battle)).toEqual([]);
  });
});

describe('rewards', () => {
  test('sum over the foes present', () => {
    const battle = fight(4, ['dustBunny', 'sockMonster']);
    expect(battleXp(battle)).toBe(FOES.dustBunny.xp + FOES.sockMonster.xp);
    expect(battleStickers(battle)).toBe(FOES.dustBunny.stickers + FOES.sockMonster.stickers);
    expect(aliveFoeSlots(battle)).toEqual([0, 1]);
  });
});

describe('determinism', () => {
  test('the same seed and actions replay identically', () => {
    const play = () => {
      let battle = fight(5, ['pigeon', 'pigeon']);
      for (let step = 0; step < 10 && battle.phase.kind !== 'won' && battle.phase.kind !== 'lost'; step += 1) {
        battle = battle.phase.kind === 'foe' ? battleStep(battle, { type: 'tick' }) : battleStep(battle, { type: 'attack', target: 0 });
      }
      return battle;
    };
    expect(play()).toEqual(play());
  });
});
