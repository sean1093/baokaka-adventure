import { battleStep, battleXp, startBattle } from './battle';
import { CHAPTERS } from './chapters';
import { MAX_ITEM_COUNT, MAX_LEVEL, SKILLS, STARTING_ITEMS, XP_TABLE, heroStats } from './heroes';
import {
  HERO_ORDER,
  type Battle,
  type BattleAction,
  type CampChoice,
  type HeroId,
  type Inventory,
  type ItemId,
  type Run,
  type SkillId,
} from './types';

/** XP for the camp's 練習 choice: about one ordinary fight */
export const CAMP_TRAIN_XP = 15;
/** Items from the camp's 翻翻包包 choice */
export const CAMP_PACK_ITEMS: readonly ItemId[] = ['bottle', 'cookie'];
/** A hero who ended a won battle knocked out gets back up with this much of their max HP */
const RECOVER_RATIO = 0.25;

export type VictorySummary = {
  xp: number;
  drops: ItemId[];
  fromLevel: number;
  toLevel: number;
  unlocked: SkillId[];
};

export type CampResult = { choice: CampChoice; leveled: boolean; unlocked: SkillId[] };

export type QuestView =
  | { screen: 'title' }
  | { screen: 'story'; chapter: number; kind: 'prologue' | 'clear' }
  | { screen: 'chapter' }
  | { screen: 'battle'; battle: Battle }
  | { screen: 'camp'; result?: CampResult }
  | { screen: 'victory'; summary: VictorySummary }
  | { screen: 'defeat' }
  | { screen: 'ending' };

export type QuestState = { view: QuestView; run: Run; sound: boolean };

export type QuestAction =
  | { type: 'newGame' }
  | { type: 'continue' }
  | { type: 'storyContinue' }
  /** The seed comes from the caller so the reducer stays pure and battles replay from their seed */
  | { type: 'beginNode'; seed: number }
  | { type: 'battle'; action: BattleAction }
  | { type: 'battleWon' }
  | { type: 'battleLost' }
  | { type: 'victoryContinue' }
  | { type: 'camp'; choice: CampChoice }
  | { type: 'campContinue' }
  | { type: 'retry' }
  | { type: 'toggleSound' }
  | { type: 'backToTitle' }
  | { type: 'endingContinue' };

const fullHp = (level: number): Record<HeroId, number> => ({
  baokaka: heroStats('baokaka', level).maxHp,
  mocha: heroStats('mocha', level).maxHp,
});

export const freshRun = (cleared = false): Run => ({
  chapter: 1,
  node: 0,
  level: 1,
  xp: 0,
  hp: fullHp(1),
  items: { ...STARTING_ITEMS },
  cleared,
});

/** A run worth offering 繼續冒險 for: anything past the very first fight's starting line. */
export const runStarted = (run: Run): boolean => run.chapter > 1 || run.node > 0 || run.xp > 0;

export const initialState = (run: Run, sound: boolean): QuestState => ({
  view: { screen: 'title' },
  run,
  sound,
});

/** Adds XP, walks the level table, and heals fully on every level gained. */
export function gainXp(run: Run, amount: number): { run: Run; leveled: boolean; unlocked: SkillId[] } {
  let level = run.level;
  const xp = run.xp + amount;
  const unlocked: SkillId[] = [];
  while (level < MAX_LEVEL && xp >= XP_TABLE[level]) {
    level += 1;
    for (const skill of Object.values(SKILLS)) {
      if (skill.unlockLevel === level) unlocked.push(skill.id);
    }
  }
  const leveled = level > run.level;
  return {
    run: { ...run, level, xp, hp: leveled ? fullHp(level) : run.hp },
    leveled,
    unlocked,
  };
}

function addItems(items: Inventory, drops: readonly ItemId[]): Inventory {
  const next = { ...items };
  for (const item of drops) next[item] = Math.min(MAX_ITEM_COUNT, next[item] + 1);
  return next;
}

/** Folds a won battle back into the run: HP and items as they ended, XP, drops, and the next node. */
export function applyVictory(run: Run, battle: Battle, drops: readonly ItemId[]): { run: Run; summary: VictorySummary } {
  const xp = battleXp(battle.foes.map((foe) => foe.foe));
  const hp = { ...run.hp };
  for (const hero of HERO_ORDER) {
    const { maxHp } = heroStats(hero, run.level);
    hp[hero] = Math.max(battle.heroes[hero].hp, Math.round(maxHp * RECOVER_RATIO));
  }
  const gained = gainXp({ ...run, hp, items: addItems(battle.items, drops), node: run.node + 1 }, xp);
  return {
    run: gained.run,
    summary: { xp, drops: [...drops], fromLevel: run.level, toLevel: gained.run.level, unlocked: gained.unlocked },
  };
}

export function applyCamp(run: Run, choice: CampChoice): { run: Run; result: CampResult } {
  const advanced = { ...run, node: run.node + 1 };
  switch (choice) {
    case 'nap':
      return { run: { ...advanced, hp: fullHp(run.level) }, result: { choice, leveled: false, unlocked: [] } };
    case 'pack':
      return {
        run: { ...advanced, items: addItems(run.items, CAMP_PACK_ITEMS) },
        result: { choice, leveled: false, unlocked: [] },
      };
    case 'train': {
      const gained = gainXp(advanced, CAMP_TRAIN_XP);
      return { run: gained.run, result: { choice, leveled: gained.leveled, unlocked: gained.unlocked } };
    }
  }
}

export function questReducer(state: QuestState, action: QuestAction): QuestState {
  const { view, run } = state;
  const chapter = CHAPTERS[run.chapter - 1];

  switch (action.type) {
    case 'newGame':
      return { ...state, run: freshRun(run.cleared), view: { screen: 'story', chapter: 1, kind: 'prologue' } };

    case 'continue':
      return { ...state, view: { screen: 'chapter' } };

    case 'storyContinue': {
      if (view.screen !== 'story') return state;
      if (view.kind === 'prologue') return { ...state, view: { screen: 'chapter' } };
      if (view.chapter >= CHAPTERS.length) {
        // The run is reset here, not on the ending screen, so a closed tab can never resume past the end
        return { ...state, run: freshRun(true), view: { screen: 'ending' } };
      }
      return {
        ...state,
        run: { ...run, chapter: run.chapter + 1, node: 0, hp: fullHp(run.level) },
        view: { screen: 'chapter' },
      };
    }

    case 'beginNode': {
      if (view.screen !== 'chapter') return state;
      const node = chapter.nodes[run.node];
      if (!node) return state;
      if (node.kind === 'camp') return { ...state, view: { screen: 'camp' } };
      return {
        ...state,
        view: { screen: 'battle', battle: startBattle(run, node.foes, action.seed, node.kind === 'boss') },
      };
    }

    case 'battle': {
      if (view.screen !== 'battle') return state;
      const battle = battleStep(view.battle, action.action);
      return battle === view.battle ? state : { ...state, view: { screen: 'battle', battle } };
    }

    case 'battleWon': {
      if (view.screen !== 'battle' || view.battle.phase.kind !== 'won') return state;
      const node = chapter.nodes[run.node];
      const drops = node && node.kind !== 'camp' ? (node.drops ?? []) : [];
      const outcome = applyVictory(run, view.battle, drops);
      return { ...state, run: outcome.run, view: { screen: 'victory', summary: outcome.summary } };
    }

    case 'battleLost':
      if (view.screen !== 'battle' || view.battle.phase.kind !== 'lost') return state;
      return { ...state, view: { screen: 'defeat' } };

    case 'victoryContinue':
      if (view.screen !== 'victory') return state;
      return {
        ...state,
        view:
          run.node >= chapter.nodes.length
            ? { screen: 'story', chapter: run.chapter, kind: 'clear' }
            : { screen: 'chapter' },
      };

    case 'camp': {
      if (view.screen !== 'camp' || view.result) return state;
      const outcome = applyCamp(run, action.choice);
      return { ...state, run: outcome.run, view: { screen: 'camp', result: outcome.result } };
    }

    case 'campContinue':
      if (view.screen !== 'camp' || !view.result) return state;
      return { ...state, view: { screen: 'chapter' } };

    case 'retry':
      if (view.screen !== 'defeat') return state;
      // Losing sends the party back to the start of the chapter with full HP; XP and items are kept
      return { ...state, run: { ...run, node: 0, hp: fullHp(run.level) }, view: { screen: 'chapter' } };

    case 'toggleSound':
      return { ...state, sound: !state.sound };

    case 'backToTitle':
    case 'endingContinue':
      return { ...state, view: { screen: 'title' } };
  }
}
