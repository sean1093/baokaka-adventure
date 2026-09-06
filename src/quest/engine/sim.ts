/**
 * Headless balance harness for 寶咖咖勇者團: scripted players run the whole quest across many
 * seeds. `npm run sim` prints a per-node report (loss rate, close calls, rounds, level, HP left);
 * sim.test.ts pins the two properties that must never regress: a player who heals can finish,
 * and a player who never heals cannot.
 *
 *   smart   heals, uses items, guards against telegraphed (post-charge) hits aimed at them
 *   casual  heals and uses items, never guards
 *   naive   only ever attacks, trains at every camp
 */
import { aliveFoeSlots, battleStep, canUseSkill, foeIntent, startBattle } from './battle';
import { CHAPTERS } from './chapters';
import { FOES } from './foes';
import { SKILLS, heroStats } from './heroes';
import { applyCamp, applyVictory, freshRun } from './quest';
import { HERO_ORDER, type Battle, type BattleAction, type HeroId, type Node, type Run } from './types';

type Policy = { guard: boolean; heal: boolean };

const fullHp = (run: Run): Record<HeroId, number> => ({
  baokaka: heroStats('baokaka', run.level).maxHp,
  mocha: heroStats('mocha', run.level).maxHp,
});

function decide(battle: Battle, policy: Policy): BattleAction {
  if (battle.phase.kind !== 'hero') return { type: 'tick' };
  const hero = battle.phase.hero;
  const alive = aliveFoeSlots(battle);
  const maxHp = (who: HeroId) => heroStats(who, battle.level).maxHp;
  const hp = (who: HeroId) => battle.heroes[who].hp;
  const ratio = (who: HeroId) => hp(who) / maxHp(who);
  const weakest = [...HERO_ORDER].filter((who) => ratio(who) < 1).sort((a, b) => ratio(a) - ratio(b))[0];
  const can = (id: keyof typeof SKILLS) => canUseSkill(battle, hero, SKILLS[id]);

  const telegraphedAtMe = alive.some((slot) => {
    const state = battle.foes[slot];
    const moves = FOES[state.foe].moves;
    const previous = moves[(state.move - 1 + moves.length) % moves.length];
    const intent = foeIntent(state, battle.heroes);
    return (
      previous.kind === 'charge' &&
      intent.kind === 'attack' &&
      (intent.aim === hero || intent.aim === 'all') &&
      intent.amount >= maxHp(hero) * 0.3
    );
  });

  if (policy.heal && weakest && ratio(weakest) < 0.35) {
    if (hero === 'baokaka' && can('hug')) return { type: 'skill', skill: 'hug', target: weakest };
    if (battle.items.bottle > 0) return { type: 'item', item: 'bottle', target: weakest };
    if (battle.items.cookie > 0 && HERO_ORDER.every((who) => ratio(who) < 0.6)) return { type: 'item', item: 'cookie' };
    if (hero === 'mocha' && can('purr')) return { type: 'skill', skill: 'purr' };
  }
  if (policy.guard && telegraphedAtMe && can('guard')) return { type: 'skill', skill: 'guard' };
  if (policy.heal && battle.boss && battle.energy <= 1 && battle.items.driedFish > 0) return { type: 'item', item: 'driedFish' };

  const target =
    alive.filter((slot) => !battle.foes[slot].guard).sort((a, b) => battle.foes[a].hp - battle.foes[b].hp)[0] ?? alive[0];
  if (hero === 'baokaka') {
    if (alive.length >= 2 && can('superScream')) return { type: 'skill', skill: 'superScream' };
    if (alive.length >= 2 && can('bigCry')) return { type: 'skill', skill: 'bigCry' };
    if (battle.boss && can('superScream')) return { type: 'skill', skill: 'superScream' };
    return { type: 'skill', skill: 'throwBlock', target };
  }
  if (alive.length >= 2 && can('frenzy')) return { type: 'skill', skill: 'frenzy' };
  if (can('pounce')) return { type: 'skill', skill: 'pounce', target };
  return { type: 'skill', skill: 'scratch', target };
}

function playBattle(run: Run, node: Exclude<Node, { kind: 'camp' }>, seed: number, policy: Policy): Battle {
  let battle = startBattle(run, node.foes, seed, node.kind === 'boss');
  while (battle.phase.kind === 'hero' || battle.phase.kind === 'foe') {
    const next = battleStep(battle, decide(battle, policy));
    if (next === battle) throw new Error(`policy is stuck: ${JSON.stringify(decide(battle, policy))}`);
    battle = next;
    if (battle.round > 80) break;
  }
  return battle;
}

type Outcome = { node: string; won: boolean; rounds: number; level: number; hpLeft: number };

function playGame(seed: number, policy: Policy): { finished: boolean; defeats: number; outcomes: Outcome[] } {
  let run = freshRun();
  let cursor = seed;
  let defeats = 0;
  const outcomes: Outcome[] = [];
  while (run.chapter <= CHAPTERS.length && defeats <= 40) {
    const chapter = CHAPTERS[run.chapter - 1];
    const node = chapter.nodes[run.node];
    if (node.kind === 'camp') {
      const low = HERO_ORDER.some((who) => run.hp[who] / heroStats(who, run.level).maxHp < 0.6);
      const choice = !policy.heal ? 'train' : low ? 'nap' : run.items.bottle + run.items.cookie < 3 ? 'pack' : 'train';
      run = applyCamp(run, choice).run;
      continue;
    }
    cursor = (cursor * 1103515245 + 12345) % 2147483648;
    const battle = playBattle(run, node, cursor, policy);
    const pool = heroStats('baokaka', run.level).maxHp + heroStats('mocha', run.level).maxHp;
    const key = `${run.chapter}-${run.node}`;
    if (battle.phase.kind === 'won') {
      const { run: next } = applyVictory(run, battle, node.drops ?? []);
      outcomes.push({ node: key, won: true, rounds: battle.round, level: next.level, hpLeft: (battle.heroes.baokaka.hp + battle.heroes.mocha.hp) / pool });
      run = next;
      if (run.node >= chapter.nodes.length) run = { ...run, chapter: run.chapter + 1, node: 0, hp: fullHp(run) };
    } else {
      defeats += 1;
      outcomes.push({ node: key, won: false, rounds: battle.round, level: run.level, hpLeft: 0 });
      run = { ...run, node: 0, hp: fullHp(run) };
    }
  }
  return { finished: run.chapter > CHAPTERS.length, defeats, outcomes };
}

export function summarize(policy: Policy, seeds: number): { finished: number; averageDefeats: number; rows: string[]; lossRates: Record<string, number> } {
  const perNode: Record<string, { fights: number; losses: number; close: number; rounds: number; levels: number; hp: number }> = {};
  let finished = 0;
  let defeats = 0;
  for (let seed = 1; seed <= seeds; seed += 1) {
    const game = playGame(seed, policy);
    if (game.finished) finished += 1;
    defeats += game.defeats;
    for (const outcome of game.outcomes) {
      const cell = (perNode[outcome.node] ??= { fights: 0, losses: 0, close: 0, rounds: 0, levels: 0, hp: 0 });
      cell.fights += 1;
      if (!outcome.won) cell.losses += 1;
      if (outcome.won && outcome.hpLeft < 0.25) cell.close += 1;
      cell.rounds += outcome.rounds;
      cell.levels += outcome.level;
      cell.hp += outcome.hpLeft;
    }
  }
  const lossRates: Record<string, number> = {};
  const rows = Object.entries(perNode).map(([node, cell]) => {
    lossRates[node] = cell.losses / cell.fights;
    const pct = (value: number) => `${(100 * value).toFixed(0).padStart(3)}%`;
    return `${node}: loss ${pct(cell.losses / cell.fights)}  close ${pct(cell.close / cell.fights)}  rounds ${(cell.rounds / cell.fights).toFixed(1).padStart(4)}  lvl ${(cell.levels / cell.fights).toFixed(1)}  hpLeft ${pct(cell.hp / cell.fights)}`;
  });
  return { finished, averageDefeats: defeats / seeds, rows, lossRates };
}

export const POLICIES: Record<'smart' | 'casual' | 'naive', Policy> = {
  smart: { guard: true, heal: true },
  casual: { guard: false, heal: true },
  naive: { guard: false, heal: false },
};
