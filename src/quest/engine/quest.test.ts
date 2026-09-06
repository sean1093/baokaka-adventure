import { describe, expect, test } from 'vitest';
import { startBattle } from './battle';
import { CHAPTERS } from './chapters';
import { FOES } from './foes';
import { MAX_ITEM_COUNT, MAX_LEVEL, XP_TABLE, heroStats } from './heroes';
import {
  CAMP_PACK_ITEMS,
  CAMP_TRAIN_XP,
  applyCamp,
  applyVictory,
  freshRun,
  gainXp,
  initialState,
  questReducer,
  runStarted,
  type QuestAction,
  type QuestState,
} from './quest';
import type { Battle, Run } from './types';

const start = initialState(freshRun(), true);

const play = (state: QuestState, ...actions: QuestAction[]): QuestState =>
  actions.reduce((current, action) => questReducer(current, action), state);

/** A battle already in the won phase, with the heroes' HP as given. */
function wonBattle(run: Run, hp: Partial<Battle['heroes']> = {}): Battle {
  const node = CHAPTERS[run.chapter - 1].nodes[run.node];
  const foes = node.kind === 'camp' ? ['dustBunny' as const] : node.foes;
  const battle = startBattle(run, foes, 1, node.kind === 'boss');
  return {
    ...battle,
    heroes: { ...battle.heroes, ...hp },
    foes: battle.foes.map((foe) => ({ ...foe, hp: 0 })),
    phase: { kind: 'won' },
  };
}

/** Puts the reducer on the chapter screen at a given run. */
const atChapter = (run: Run): QuestState => ({ view: { screen: 'chapter' }, run, sound: true });

describe('gainXp', () => {
  test('levels up across several thresholds at once and heals fully', () => {
    const tired = { ...freshRun(), hp: { baokaka: 3, mocha: 3 } };
    const { run, leveled, unlocked } = gainXp(tired, XP_TABLE[2]);
    expect(run.level).toBe(3);
    expect(leveled).toBe(true);
    expect(unlocked).toEqual(['purr', 'hug']);
    expect(run.hp).toEqual({ baokaka: heroStats('baokaka', 3).maxHp, mocha: heroStats('mocha', 3).maxHp });
  });

  test('does not heal when no level was gained', () => {
    const tired = { ...freshRun(), hp: { baokaka: 3, mocha: 3 } };
    const { run, leveled } = gainXp(tired, 1);
    expect(leveled).toBe(false);
    expect(run.hp).toEqual({ baokaka: 3, mocha: 3 });
    expect(run.xp).toBe(1);
  });

  test('stops at the max level', () => {
    const { run } = gainXp({ ...freshRun(), level: MAX_LEVEL, xp: 1000 }, 1000);
    expect(run.level).toBe(MAX_LEVEL);
  });
});

describe('applyVictory', () => {
  test('carries HP and items out of the battle, adds XP and drops, and advances the node', () => {
    const run = freshRun();
    const battle = wonBattle(run, { baokaka: { hp: 20, guard: false } });
    const { run: next, summary } = applyVictory(run, { ...battle, items: { ...battle.items, bottle: 0 } }, ['cookie']);
    expect(next.hp.baokaka).toBe(20);
    expect(next.items.bottle).toBe(0);
    expect(next.items.cookie).toBe(run.items.cookie + 1);
    expect(next.xp).toBe(FOES.dustBunny.xp);
    expect(next.node).toBe(1);
    expect(summary).toEqual({ xp: FOES.dustBunny.xp, drops: ['cookie'], fromLevel: 1, toLevel: 1, unlocked: [] });
  });

  test('a hero knocked out during a won battle gets back up with a quarter of max HP', () => {
    const run = freshRun();
    const { run: next } = applyVictory(run, wonBattle(run, { mocha: { hp: 0, guard: false } }), []);
    expect(next.hp.mocha).toBe(Math.round(heroStats('mocha', 1).maxHp * 0.25));
  });

  test('drops never push an item past the cap', () => {
    const run = { ...freshRun(), items: { bottle: MAX_ITEM_COUNT, cookie: 0, driedFish: 0 } };
    const { run: next } = applyVictory(run, wonBattle(run), ['bottle', 'bottle']);
    expect(next.items.bottle).toBe(MAX_ITEM_COUNT);
  });
});

describe('applyCamp', () => {
  const tired = { ...freshRun(), node: 2, hp: { baokaka: 5, mocha: 5 } };

  test('nap heals both heroes fully', () => {
    const { run } = applyCamp(tired, 'nap');
    expect(run.hp).toEqual({ baokaka: heroStats('baokaka', 1).maxHp, mocha: heroStats('mocha', 1).maxHp });
    expect(run.node).toBe(3);
  });

  test('pack adds the fixed items', () => {
    const { run } = applyCamp(tired, 'pack');
    for (const item of CAMP_PACK_ITEMS) expect(run.items[item]).toBe(tired.items[item] + 1);
    expect(run.hp).toEqual(tired.hp);
  });

  test('train grants XP and reports a level-up', () => {
    const { run, result } = applyCamp({ ...tired, xp: XP_TABLE[1] - 1 }, 'train');
    expect(run.xp).toBe(XP_TABLE[1] - 1 + CAMP_TRAIN_XP);
    expect(run.level).toBe(2);
    expect(result).toEqual({ choice: 'train', leveled: true, unlocked: ['purr'] });
  });
});

describe('screen flow', () => {
  test('a new game opens on the prologue with a fresh run, then the chapter screen', () => {
    const dirty = { ...start, run: { ...freshRun(), chapter: 3, xp: 99, cleared: true } };
    const prologue = questReducer(dirty, { type: 'newGame' });
    expect(prologue.view).toEqual({ screen: 'story', chapter: 1, kind: 'prologue' });
    expect(prologue.run).toEqual(freshRun(true));
    expect(questReducer(prologue, { type: 'storyContinue' }).view).toEqual({ screen: 'chapter' });
  });

  test('continue skips straight to the chapter screen', () => {
    expect(questReducer(start, { type: 'continue' }).view).toEqual({ screen: 'chapter' });
  });

  test('beginning a battle node starts a battle against that node’s foes', () => {
    const state = questReducer(atChapter(freshRun()), { type: 'beginNode', seed: 5 });
    expect(state.view.screen).toBe('battle');
    if (state.view.screen !== 'battle') return;
    expect(state.view.battle.foes.map((foe) => foe.foe)).toEqual(['dustBunny']);
    expect(state.view.battle).toEqual(startBattle(freshRun(), ['dustBunny'], 5, false));
    expect(state.view.battle.boss).toBe(false);
  });

  test('beginning a camp node opens the camp, and a choice can only be made once', () => {
    const camp = questReducer(atChapter({ ...freshRun(), node: 2 }), { type: 'beginNode', seed: 5 });
    expect(camp.view).toEqual({ screen: 'camp' });
    const chosen = questReducer(camp, { type: 'camp', choice: 'nap' });
    expect(chosen.view).toEqual({ screen: 'camp', result: { choice: 'nap', leveled: false, unlocked: [] } });
    expect(chosen.run.node).toBe(3);
    expect(questReducer(chosen, { type: 'camp', choice: 'pack' })).toBe(chosen);
    expect(questReducer(chosen, { type: 'campContinue' }).view).toEqual({ screen: 'chapter' });
  });

  test('battle actions are forwarded and ignored when they change nothing', () => {
    const battle = questReducer(atChapter(freshRun()), { type: 'beginNode', seed: 5 });
    const acted = questReducer(battle, { type: 'battle', action: { type: 'skill', skill: 'throwBlock' } });
    expect(acted).not.toBe(battle);
    expect(questReducer(battle, { type: 'battle', action: { type: 'tick' } })).toBe(battle);
  });

  test('battleWon only fires from a won battle and shows the victory summary', () => {
    const fighting = questReducer(atChapter(freshRun()), { type: 'beginNode', seed: 5 });
    expect(questReducer(fighting, { type: 'battleWon' })).toBe(fighting);
    const run = { ...freshRun(), node: 1 };
    const won: QuestState = { ...atChapter(run), view: { screen: 'battle', battle: wonBattle(run) } };
    const victory = questReducer(won, { type: 'battleWon' });
    expect(victory.view.screen).toBe('victory');
    expect(victory.run.node).toBe(2);
    expect(victory.run.items.cookie).toBe(run.items.cookie + 1); // node 1 drops a cookie
    expect(questReducer(victory, { type: 'victoryContinue' }).view).toEqual({ screen: 'chapter' });
  });

  test('winning the boss leads to the chapter story, then the next chapter with full HP', () => {
    const run = { ...freshRun(), node: 3, hp: { baokaka: 9, mocha: 9 } };
    const won: QuestState = { ...atChapter(run), view: { screen: 'battle', battle: wonBattle(run) } };
    const story = play(won, { type: 'battleWon' }, { type: 'victoryContinue' });
    expect(story.view).toEqual({ screen: 'story', chapter: 1, kind: 'clear' });
    const next = questReducer(story, { type: 'storyContinue' });
    expect(next.view).toEqual({ screen: 'chapter' });
    expect(next.run.chapter).toBe(2);
    expect(next.run.node).toBe(0);
    expect(next.run.hp).toEqual({
      baokaka: heroStats('baokaka', next.run.level).maxHp,
      mocha: heroStats('mocha', next.run.level).maxHp,
    });
  });

  test('finishing the last chapter shows the ending and resets the run as cleared', () => {
    const last = CHAPTERS.length;
    const run = { ...freshRun(), chapter: last, node: CHAPTERS[last - 1].nodes.length - 1, level: MAX_LEVEL, xp: 999 };
    const won: QuestState = { ...atChapter(run), view: { screen: 'battle', battle: wonBattle(run) } };
    const ending = play(won, { type: 'battleWon' }, { type: 'victoryContinue' }, { type: 'storyContinue' });
    expect(ending.view).toEqual({ screen: 'ending' });
    expect(ending.run).toEqual(freshRun(true));
    expect(runStarted(ending.run)).toBe(false);
    expect(questReducer(ending, { type: 'endingContinue' }).view).toEqual({ screen: 'title' });
  });

  test('losing sends the party back to the start of the chapter with full HP, keeping XP and items', () => {
    const run = { ...freshRun(), chapter: 2, node: 3, xp: 50, level: 2, hp: { baokaka: 0, mocha: 0 } };
    const battle = { ...startBattle(run, ['moleKing'], 1, true), phase: { kind: 'lost' as const } };
    const lost: QuestState = { ...atChapter(run), view: { screen: 'battle', battle } };
    const defeat = questReducer(lost, { type: 'battleLost' });
    expect(defeat.view).toEqual({ screen: 'defeat' });
    const retry = questReducer(defeat, { type: 'retry' });
    expect(retry.view).toEqual({ screen: 'chapter' });
    expect(retry.run.chapter).toBe(2);
    expect(retry.run.node).toBe(0);
    expect(retry.run.xp).toBe(50);
    expect(retry.run.hp).toEqual({ baokaka: heroStats('baokaka', 2).maxHp, mocha: heroStats('mocha', 2).maxHp });
  });

  test('battleLost is ignored unless the battle is actually lost', () => {
    const fighting = questReducer(atChapter(freshRun()), { type: 'beginNode', seed: 5 });
    expect(questReducer(fighting, { type: 'battleLost' })).toBe(fighting);
  });

  test('sound toggles and the title is reachable from the chapter screen', () => {
    const state = atChapter(freshRun());
    expect(questReducer(state, { type: 'toggleSound' }).sound).toBe(false);
    expect(questReducer(state, { type: 'backToTitle' }).view).toEqual({ screen: 'title' });
  });
});

describe('runStarted', () => {
  test('a fresh run is not started; any progress is', () => {
    expect(runStarted(freshRun())).toBe(false);
    expect(runStarted({ ...freshRun(), node: 1 })).toBe(true);
    expect(runStarted({ ...freshRun(), xp: 3 })).toBe(true);
    expect(runStarted({ ...freshRun(), chapter: 2 })).toBe(true);
  });
});

describe('pickups', () => {
  const first = CHAPTERS[0].world.pickups[0];

  test('walking over a ground item adds it once and remembers it', () => {
    const state = atChapter(freshRun());
    const picked = questReducer(state, { type: 'pickup', id: first.id });
    expect(picked.run.items[first.item]).toBe(freshRun().items[first.item] + 1);
    expect(picked.run.picked).toEqual([first.id]);
    expect(questReducer(picked, { type: 'pickup', id: first.id })).toBe(picked);
  });

  test('unknown ids and pickups from other chapters are ignored', () => {
    const state = atChapter(freshRun());
    expect(questReducer(state, { type: 'pickup', id: 'nope' })).toBe(state);
    expect(questReducer(state, { type: 'pickup', id: CHAPTERS[1].world.pickups[0].id })).toBe(state);
  });

  test('picked items survive a defeat and a new chapter, but not a new game', () => {
    const picked = questReducer(atChapter(freshRun()), { type: 'pickup', id: first.id });
    const defeated: QuestState = { ...picked, view: { screen: 'defeat' } };
    expect(questReducer(defeated, { type: 'retry' }).run.picked).toEqual([first.id]);
    expect(questReducer(picked, { type: 'newGame' }).run.picked).toEqual([]);
  });
});
