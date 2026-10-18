import { battleStep, startBattle, type StageFrame } from '../quest/engine/battle';
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
  /** The battle stage's frame, standing in until a `final` foe exists (咻咻's forms) */
  battleFrame?: StageFrame;
  /** Render inside a phone-sized box (CSS px) instead of the viewport: the small-phone layout at any viewport */
  phone?: { width: number; height: number };
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
const CHAPTER_CARD: Step = { do: 'chapter', n: 1, title: '度晬前一晚', time: '00:00', next: '大安森林公園' };

/** Chapter 14 at 05:15, the first light of dawn behind the skyline (script `[chapter 14｜…｜05:15]`). */
const CHAPTER_CARD_DAWN: Step = { do: 'chapter', n: 14, title: '離天空最近的地方', time: '05:15', next: '象山' };

/**
 * Script `ch1.daan.intro` (until #21 adds it), paused on 摩卡's first line: the bust with its jade
 * backlight, a 【寶物】 key term in gold, and the page dots (line 3 of 4).
 */
const DAAN_INTRO: Step[] = [
  { who: null, text: '大安森林公園。半夜的樹，好高好高。' },
  { who: null, text: '落葉自己在地上，轉圈圈。' },
  { who: 'mocha', text: '「風是往這邊吹的。【寶物】應該掉在附近。」', expr: 'smug' },
  { who: 'mocha', text: '「草地上會有搗蛋鬼。打不過就『逃跑』。」' },
];

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
 * The battle stage v2 fixtures (#14) stand in 大安森林公園 (the old park map carries the `daan`
 * backdrop until #21): four heroes at 黑糖's join level against `foes`, on a hero's turn.
 */
export const STAGE_FOES: readonly FoeId[] = ['dustBunny', 'sockMonster', 'dustBunny'];
/** A boss for the frame fixtures: an existing one until the chapter bosses are drawn. */
export const STAGE_BOSS: FoeId = 'crowBoss';
/** Sturdy enough to stand through 哇哇大哭 at level 10 */
const FX_FOES: readonly FoeId[] = ['crab', 'jellyfish', 'crab'];

function stageBattle(foes: readonly FoeId[], boss: boolean): QuestState {
  const run = { ...sampleRun(HERO_ORDER, 10), map: 'park' as const, pos: MAPS.park.entry };
  return withView({ screen: 'battle', battle: startBattle(run, [...foes], run.seed, boss) }, run);
}

/**
 * The battle VFX fixture (#15): the 4v3 stage just as 寶咖咖 casts 哇哇大哭 on all three foes, the
 * busiest effect the game draws (glyph ring, wash, three impacts). Played on the real engine: other
 * heroes guard and foes act until it is 寶咖咖's turn, then the cast; the step after it is the next
 * actor's, so the screen holds on the effect's events.
 */
function fxBattle(): QuestState {
  const state = stageBattle(FX_FOES, false);
  if (state.view.screen !== 'battle') throw new Error('Fixture: not a battle');
  let battle = state.view.battle;
  for (let guard = 0; guard < 60; guard += 1) {
    const { phase } = battle;
    if (phase.kind === 'hero' && phase.hero === 'baokaka') {
      battle = battleStep(battle, { type: 'spell', spell: 'bigCry' });
      // Hold on the cast only when a hero acts next (a foe's turn would play on by itself)
      if (battle.phase.kind === 'hero' && battle.events.filter((event) => event.kind === 'hit').length === 3) return { ...state, view: { screen: 'battle', battle } };
      continue;
    }
    if (phase.kind !== 'hero' && phase.kind !== 'foe') break;
    battle = battleStep(battle, phase.kind === 'foe' ? { type: 'tick' } : { type: 'guard' });
  }
  throw new Error('Fixture: no 哇哇大哭 on three foes followed by a hero turn');
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
  { name: 'dialogue', label: 'World: dialogue with a bust, a key term and page dots', state: () => sceneAt(DAAN_INTRO, 2, 'dialogue') },
  { name: 'dialogue-npc', label: 'World: an NPC line (warm backlight)', state: () => worldAt('home.mom.hug', 0) },
  { name: 'chapter-card', label: 'World: chapter card at 00:00 with its clock', state: () => sceneAt([CHAPTER_CARD], 0, 'chapter-card') },
  { name: 'chapter-card-0515', label: 'World: chapter card at 05:15 (dawn)', state: () => sceneAt([CHAPTER_CARD_DAWN], 0, 'chapter-card-0515') },
  {
    name: 'chapter-card-reduced',
    label: 'World: chapter card with 減少動態 on (no flip, no draw-on)',
    state: () => ({ ...sceneAt([CHAPTER_CARD], 0, 'chapter-card-reduced'), settings: { skipRides: false, reducedMotion: true } }),
  },
  { name: 'dialogue-choice', label: 'World: a choice with three options', state: () => sceneAt([QUIZ_CHOICE], 0, 'dialogue-choice') },
  { name: 'battle', label: 'Battle: three heroes, three foes', state: () => battleWith(HERO_ORDER.slice(0, 3)) },
  // 黑糖's expected join level (story bible § 2.1), so every hero has a few 才藝
  { name: 'battle-4-heroes', label: 'Battle: four heroes, three foes', state: () => battleWith(HERO_ORDER, 10) },
  { name: 'battle-4v3', label: 'Battle stage: 大安 band-shell at 00:20, four heroes v three foes', state: () => stageBattle(STAGE_FOES, false) },
  { name: 'battle-boss', label: 'Battle stage: boss fight, the 布袋戲 valance', state: () => stageBattle([STAGE_BOSS], true) },
  { name: 'battle-final', label: 'Battle stage: final fight, the full 布袋戲 proscenium', state: () => stageBattle([STAGE_BOSS], true), battleFrame: 'final' },
  { name: 'battle-fx', label: 'Battle VFX: 寶咖咖 casts 哇哇大哭 on three foes (still = the impact frame)', state: fxBattle },
  {
    name: 'battle-375',
    label: 'Battle stage: four v three in a 375×667 phone at any viewport',
    state: () => stageBattle(STAGE_FOES, false),
    phone: { width: 375, height: 667 },
  },
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
  { name: 'menu-settings', label: 'Menu: settings (減少動態 on)', state: () => ({ ...world(), settings: { skipRides: false, reducedMotion: true } }), menu: { tab: 'settings' } },
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
