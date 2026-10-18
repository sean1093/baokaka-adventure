import { startBattle } from '../quest/engine/battle';
import { EVENTS } from '../quest/engine/events';
import { SPELLS } from '../quest/engine/heroes';
import { MAPS } from '../quest/engine/maps';
import { freshRun, initialState, type QuestState, type QuestView } from '../quest/engine/quest';
import type { Follower } from '../quest/engine/progress';
import type { SheetStart } from '../quest/screens/PartySheet';
import { fullHp, fullMp } from '../quest/engine/scene';
import { HERO_ORDER, type FoeId, type HeroId, type Line, type Run, type Step } from '../quest/engine/types';

/**
 * Named game states for the art lab (`#/artlab?section=fixtures&only=<name>`). Each one is
 * rendered by the real QuestScreens over a live reducer, so a fixture is just a starting state.
 * They are built from the engine's own constructors (freshRun, startBattle, EVENTS), so they stay
 * valid as the engine changes; fixtures.test.ts checks every one. Later issues add entries here
 * and the visual check picks them up automatically.
 */
export type ArtLabFixture = {
  /** URL- and file-safe: it names the screenshot */
  name: string;
  label: string;
  state: () => QuestState;
  /** Open the party sheet on mount, optionally on a tab with an item picked */
  menu?: boolean | SheetStart;
  /** Escort table for the world screen, standing in for the content's (empty until the chapters) */
  followers?: readonly Follower[];
  /** The 路線圖's 「你在這裡」 station, standing in until the station maps exist */
  travelHere?: string;
};

/** Story flags of a run a few fights in: the intro has played and the whole party has joined. */
export const SAMPLE_FLAGS: readonly string[] = ['trigger:home-intro', 'mochaJoined', 'dustDone', 'grandmaGave', 'magpieJoined', 'bearJoined'];

const SAMPLE_LEVEL = 4;

/** A party a few fights in, standing in the living room, a little worn so the bars show. */
export function sampleRun(party: readonly HeroId[] = HERO_ORDER, level = SAMPLE_LEVEL): Run {
  const base = freshRun(7);
  const run: Run = {
    ...base,
    party: [...party],
    level,
    xp: 120,
    coins: 46,
    items: { teaEgg: 3, pineappleCake: 1, braisedRice: 2, bib: 1 },
    equip: { ...base.equip, baokaka: 'bib' },
    flags: [...SAMPLE_FLAGS],
    chapter: 2,
  };
  const hp = { ...run.hp };
  const mp = { ...run.mp };
  for (const hero of HERO_ORDER) {
    hp[hero] = fullHp(run, hero);
    mp[hero] = fullMp(run, hero);
  }
  hp.baokaka = Math.round(hp.baokaka * 0.7);
  mp.mocha = Math.round(mp.mocha * 0.5);
  return { ...run, hp, mp };
}

const isLine = (step: Step): step is Line => 'text' in step;

/** The state with the given view over the sample run, sound off (the art lab never plays audio). */
const withView = (view: QuestView, run = sampleRun()): QuestState => ({ ...initialState(run, false), view });

const world = (): QuestState => withView({ screen: 'world' });

/** The world paused on step `at` of a script, exactly as the reducer leaves it. */
function sceneAt(steps: Step[], at: number, where: string): QuestState {
  const step = steps[at];
  const base = { ...world(), scene: { steps, at } };
  if (isLine(step)) return { ...base, line: step };
  if ('do' in step && step.do === 'chapter') {
    const { do: _do, ...card } = step;
    return { ...base, card };
  }
  if ('do' in step && step.do === 'choice') return { ...base, choice: { prompt: step.prompt, options: step.options } };
  throw new Error(`Fixture: step ${at} of ${where} is not a line, a chapter card or a choice`);
}

const worldAt = (event: string, at: number): QuestState => sceneAt(EVENTS[event], at, event);

/** Chapter 1 of the new story with its clock (decision D-16), until the content lands in #21. */
const CHAPTER_CARD: Step = { do: 'chapter', n: 1, title: '度晬前一晚', time: '00:00' };

/**
 * The first question of the post-game quiz (script `post.quiz.q1`). Its branches point at an old
 * event that exists today, so tapping an answer in the art lab plays on.
 */
const QUIZ_CHOICE: Step = {
  do: 'choice',
  prompt: '「台北車站的大廳，地板是什麼顏色？」',
  options: [
    { label: '黑白格子', event: 'home.mom.hug' },
    { label: '紅色地毯', event: 'home.mom.hug' },
    { label: '藍色水晶', event: 'home.mom.hug' },
  ],
};

/**
 * A stand-in escort for `world-follower`: the content's FOLLOWERS stays empty until Ch5 adds the
 * pigeon chick, so the fixture brings its own entry under a test-only flag. The snail is just an
 * existing sprite that reads clearly at 0.95 tiles and looks like nobody in the party.
 */
export const FOLLOWER_FLAG = 'artlabFollower';
export const ARTLAB_FOLLOWERS: readonly Follower[] = [{ flag: FOLLOWER_FLAG, until: 'artlabFollowerDone', sprite: 'snail', name: '小蝸牛' }];

/** The whole party just arrived in the park (roomier than the living room), the stand-in escort beside them. */
function worldFollower(): QuestState {
  const run = sampleRun();
  return withView({ screen: 'world' }, { ...run, map: 'park', pos: MAPS.park.entry, flags: [...run.flags, FOLLOWER_FLAG] });
}

/** Three foes, so the battle layout is at its widest. */
export const BATTLE_FOES: readonly FoeId[] = ['dustBunny', 'sockMonster', 'dustBunny'];

/** A random fight against BATTLE_FOES, opening on a hero's turn. */
function battleWith(party: readonly HeroId[], level = SAMPLE_LEVEL): QuestState {
  const run = sampleRun(party, level);
  return withView({ screen: 'battle', battle: startBattle(run, [...BATTLE_FOES], run.seed, false) }, run);
}

/**
 * The 路線圖 just after 月亮票 (Ch3): the four `moonPass` stations are lit, the party stands at
 * 台北車站, 公館 lights up for the first time (its 「叮！」), and the other ten are still locked.
 * The 「叮！」 narration has been read, so the whole map shows.
 */
export const TRAVEL_HERE = 'station';
function travelScreen(): QuestState {
  const run = sampleRun();
  return withView(
    { screen: 'travel', fresh: ['ntu'], note: null },
    { ...run, flags: [...run.flags, 'moonPass'], seenStations: ['daan', 'station', 'ximen', 'ntu'] },
  );
}

export const ARTLAB_FIXTURES: readonly ArtLabFixture[] = [
  { name: 'title-continue', label: 'Title with a run to continue', state: () => withView({ screen: 'title' }) },
  { name: 'world', label: 'World: home map', state: world },
  { name: 'world-follower', label: 'World: an escort behind the party', state: worldFollower, followers: ARTLAB_FOLLOWERS },
  { name: 'dialogue', label: 'World: dialogue line', state: () => worldAt('home.mom.hug', 0) },
  { name: 'chapter-card', label: 'World: chapter card with its clock', state: () => sceneAt([CHAPTER_CARD], 0, 'chapter-card') },
  { name: 'dialogue-choice', label: 'World: a choice with three options', state: () => sceneAt([QUIZ_CHOICE], 0, 'dialogue-choice') },
  { name: 'battle', label: 'Battle: three heroes, three foes', state: () => battleWith(HERO_ORDER.slice(0, 3)) },
  // 黑糖's expected join level (story bible § 2.1), so every hero has a few 才藝
  { name: 'battle-4-heroes', label: 'Battle: four heroes, three foes', state: () => battleWith(HERO_ORDER, 10) },
  {
    name: 'victory',
    label: 'Victory: level up',
    state: () =>
      withView({
        screen: 'victory',
        summary: {
          xp: 31,
          coins: 14,
          drops: ['teaEgg'],
          levels: 1,
          learned: Object.values(SPELLS)
            .filter((spell) => spell.level === SAMPLE_LEVEL + 1)
            .map((spell) => spell.id),
          level: SAMPLE_LEVEL + 1,
          boss: null,
        },
      }),
  },
  { name: 'shop', label: 'Shop', state: () => withView({ screen: 'shop', stock: ['teaEgg', 'pineappleCake', 'braisedRice', 'douhua', 'bib'] }) },
  { name: 'menu', label: 'Menu: party sheet', state: world, menu: true },
  {
    name: 'party-sheet-equip',
    label: 'Menu: equipping signature gear',
    // 摩卡's collar picked in the bag: only 摩卡貓 can wear it, the other three are greyed out
    state: () => withView({ screen: 'world' }, { ...sampleRun(), items: { teaEgg: 3, redTurtleCake: 1, bib: 1, bellCollar: 1, tigerHat: 1 } }),
    menu: { tab: 'bag', picking: 'bellCollar' },
  },
  { name: 'travel-screen', label: '路線圖: 3 lit, 1 new, 10 locked', state: travelScreen, travelHere: TRAVEL_HERE },
  { name: 'defeat', label: 'Defeat', state: () => withView({ screen: 'defeat' }) },
  { name: 'ending', label: 'Ending', state: () => withView({ screen: 'ending' }) },
];
