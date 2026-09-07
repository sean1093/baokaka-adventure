/**
 * Headless balance harness for 寶咖咖奇俠傳: scripted players walk the whole story across many
 * seeds and report, per chapter, the loss rate and how much HP was left. `npm run sim` prints it.
 *
 * The two properties that must never regress: a player who heals and rests can finish, and a
 * player who ignores 防禦 and items must lose sometimes on the late bosses.
 */
import { roll } from '../../shared/random';
import { aliveFoeSlots, battleStep, canCast, startBattle } from './battle';
import { EVENTS } from './events';
import { FOES } from './foes';
import { ITEMS, SPELLS, heroStats } from './heroes';
import { MAPS } from './maps';
import { applyVictory, freshRun } from './quest';
import { healParty } from './scene';
import { HERO_ORDER, type Battle, type FoeId, type HeroId, type ItemId, type MapId, type Run, type Step } from './types';

export type Policy = {
  /** Heals a hero below this fraction of their max HP, when something is available */
  healBelow: number;
  /** Guards when below this fraction */
  guardBelow: number;
  /** Goes back for a rest (媽媽 / 客棧) when the party drops below this fraction */
  restBelow: number;
  /** Buys what the shops stock */
  shop: boolean;
};

export const POLICIES: Record<'careful' | 'casual' | 'reckless', Policy> = {
  careful: { healBelow: 0.45, guardBelow: 0.25, restBelow: 0.7, shop: true },
  casual: { healBelow: 0.3, guardBelow: 0, restBelow: 0.4, shop: true },
  reckless: { healBelow: 0, guardBelow: 0, restBelow: 0, shop: false },
};

const HEAL_ITEMS: readonly ItemId[] = ['cookie', 'bottle', 'banana', 'apple'];

/** One fight to the finish. Returns the battle in its final phase. */
export function playBattle(run: Run, foes: FoeId[], boss: boolean, seed: number, policy: Policy): Battle {
  let battle = startBattle(run, foes, seed, boss);

  for (let step = 0; step < 400; step += 1) {
    const { phase } = battle;
    if (phase.kind === 'won' || phase.kind === 'lost' || phase.kind === 'fled') return battle;
    if (phase.kind === 'foe') {
      battle = battleStep(battle, { type: 'tick' });
      continue;
    }

    const hero = phase.hero;
    const stats = battle.stats[hero];
    const state = battle.heroes[hero];
    const target = aliveFoeSlots(battle)[0];

    // Someone badly hurt: a heal spell first, then an item
    const hurt = battle.party
      .filter((ally) => battle.heroes[ally].hp > 0)
      .map((ally) => ({ ally, ratio: battle.heroes[ally].hp / battle.stats[ally].hp }))
      .sort((a, b) => a.ratio - b.ratio)[0];

    if (hurt && hurt.ratio < policy.healBelow) {
      const heal = Object.values(SPELLS).find((spell) => spell.effect.kind === 'heal' && canCast(battle, hero, spell));
      if (heal) {
        battle = battleStep(battle, { type: 'spell', spell: heal.id, target: hurt.ally });
        continue;
      }
      const potion = HEAL_ITEMS.find((item) => (battle.items[item] ?? 0) > 0);
      if (potion) {
        battle = battleStep(battle, { type: 'item', item: potion, target: hurt.ally });
        continue;
      }
    }

    if (state.hp / stats.hp < policy.guardBelow) {
      battle = battleStep(battle, { type: 'guard' });
      continue;
    }

    // Otherwise the best damage spell that is affordable, else a plain attack
    const alive = aliveFoeSlots(battle).length;
    const attack = Object.values(SPELLS)
      .filter((spell) => spell.effect.kind === 'damage' && canCast(battle, hero, spell))
      .filter((spell) => (spell.effect.kind === 'damage' && spell.effect.target === 'all' ? alive > 1 : true))
      .sort((a, b) => (b.effect.kind === 'damage' ? b.effect.power : 0) - (a.effect.kind === 'damage' ? a.effect.power : 0))[0];

    battle = attack ? battleStep(battle, { type: 'spell', spell: attack.id, target }) : battleStep(battle, { type: 'attack', target });
  }
  return battle;
}

export type NodeResult = { chapter: number; label: string; lost: boolean; rounds: number; level: number; hpLeft: number };

const scriptedFights = (steps: Step[]): { foes: FoeId[]; boss: boolean }[] =>
  steps.flatMap((step) => ('do' in step && step.do === 'battle' ? [{ foes: step.foes, boss: step.boss ?? false }] : []));

/** Every scripted fight of the story, in order, with the map it happens on. */
export function storyFights(): { map: MapId; key: string; foes: FoeId[]; boss: boolean }[] {
  const order: MapId[] = ['home', 'yard', 'park', 'market', 'bath', 'beach', 'night'];
  const seen = new Set<string>();
  const fights: { map: MapId; key: string; foes: FoeId[]; boss: boolean }[] = [];
  for (const map of order) {
    for (const npc of MAPS[map].npcs) {
      for (const rule of npc.talk) {
        if (seen.has(rule.event)) continue;
        seen.add(rule.event);
        for (const fight of scriptedFights(EVENTS[rule.event])) fights.push({ map, key: rule.event, ...fight });
      }
    }
  }
  return fights;
}

const hpFraction = (run: Run): number => {
  const total = run.party.reduce((sum, hero) => sum + heroStats(hero, run.level, run.equip[hero]).hp, 0);
  return run.party.reduce((sum, hero) => sum + run.hp[hero], 0) / total;
};

/** Walks one whole playthrough: wanders a little on each map, then takes its scripted fight. */
export function playStory(seed: number, policy: Policy): { finished: boolean; nodes: NodeResult[]; wipes: number } {
  let run: Run = { ...freshRun(seed), party: ['baokaka'] };
  let cursor = seed;
  let wipes = 0;
  const draw = () => {
    const result = roll(cursor);
    cursor = result.seed;
    return result.value;
  };

  const nodes: NodeResult[] = [];
  const fights = storyFights();

  for (const fight of fights) {
    const map = MAPS[fight.map];
    run = { ...run, map: fight.map };

    // Heroes join before the fight they are introduced by
    if (fight.key === 'home.dust' && !run.party.includes('mocha')) run = join(run, 'mocha');
    if (fight.key === 'beach.octo' && !run.party.includes('duck')) run = join(run, 'duck');

    // Wandering fights, the way a player picks up levels crossing a map
    for (let index = 0; index < (map.encounters ? 6 : 0); index += 1) {
      if (hpFraction(run) < policy.restBelow) run = healParty(run);
      const groups = map.encounters?.groups ?? [];
      const battle = playBattle(run, groups[Math.floor(draw() * groups.length)], false, Math.floor(draw() * 1e9), policy);
      if (battle.phase.kind === 'lost') {
        // A wipe is not the end for a real player: they wake at the entrance and try again
        wipes += 1;
        run = healParty(run);
        continue;
      }
      if (battle.phase.kind === 'won') run = applyVictory(run, battle).run;
    }

    if (policy.shop) run = buy(run);
    if (hpFraction(run) < policy.restBelow) run = healParty(run);

    const battle = playBattle(run, fight.foes, fight.boss, Math.floor(draw() * 1e9), policy);
    const lost = battle.phase.kind === 'lost';
    if (!lost && battle.phase.kind === 'won') run = applyVictory(run, battle).run;
    nodes.push({ chapter: map.chapter, label: fight.key, lost, rounds: battle.round, level: run.level, hpLeft: lost ? 0 : hpFraction(run) });
    if (lost) return { finished: false, nodes, wipes };
  }
  return { finished: true, nodes, wipes };
}

function join(run: Run, hero: HeroId): Run {
  return {
    ...run,
    party: [...run.party, hero],
    hp: { ...run.hp, [hero]: heroStats(hero, run.level, run.equip[hero]).hp },
    mp: { ...run.mp, [hero]: heroStats(hero, run.level, run.equip[hero]).mp },
  };
}

/** Spends the stickers on healing, the way a player stocking up before a boss would. */
function buy(run: Run): Run {
  let stickers = run.stickers;
  const items = { ...run.items };
  const stock = (item: ItemId, cap: number) => {
    while (stickers >= ITEMS[item].price && (items[item] ?? 0) < cap) {
      stickers -= ITEMS[item].price;
      items[item] = (items[item] ?? 0) + 1;
    }
  };
  stock('bottle', 5);
  stock('driedFish', 3);
  stock('cookie', 5);
  return { ...run, stickers, items };
}

export type Report = {
  finished: number;
  seeds: number;
  /** Average number of wandering-fight wipes per playthrough */
  wipes: number;
  rows: string[];
  /** Loss rate per scripted fight */
  lossRates: Record<string, number>;
};

export function summarize(policy: Policy, seeds: number): Report {
  const totals = new Map<string, { plays: number; losses: number; rounds: number; hp: number; level: number }>();
  let finished = 0;
  let wipes = 0;

  for (let seed = 1; seed <= seeds; seed += 1) {
    const game = playStory(seed * 7919, policy);
    if (game.finished) finished += 1;
    wipes += game.wipes;
    for (const node of game.nodes) {
      const cell = totals.get(node.label) ?? { plays: 0, losses: 0, rounds: 0, hp: 0, level: 0 };
      cell.plays += 1;
      cell.losses += node.lost ? 1 : 0;
      cell.rounds += node.rounds;
      cell.hp += node.hpLeft;
      cell.level += node.level;
      totals.set(node.label, cell);
    }
  }

  const rows: string[] = [];
  const lossRates: Record<string, number> = {};
  for (const [label, cell] of totals) {
    lossRates[label] = cell.losses / cell.plays;
    rows.push(
      `${label.padEnd(14)} played ${String(cell.plays).padStart(3)}  loss ${((cell.losses / cell.plays) * 100).toFixed(0).padStart(3)}%  rounds ${(cell.rounds / cell.plays).toFixed(1).padStart(4)}  lvl ${(cell.level / cell.plays).toFixed(1)}  hp ${((cell.hp / cell.plays) * 100).toFixed(0)}%`,
    );
  }
  return { finished, seeds, wipes: wipes / seeds, rows, lossRates };
}

export const heroNames = HERO_ORDER.map((hero) => hero);
export const foeCount = Object.keys(FOES).length;
