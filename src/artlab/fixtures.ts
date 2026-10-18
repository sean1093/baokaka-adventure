import { startBattle } from '../quest/engine/battle';
import { EVENTS } from '../quest/engine/events';
import { SPELLS } from '../quest/engine/heroes';
import { freshRun, initialState, type QuestState, type QuestView } from '../quest/engine/quest';
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
  /** Open the party sheet on mount */
  menu?: boolean;
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
    items: { cookie: 3, bottle: 1, banana: 2, sunHat: 1 },
    equip: { ...base.equip, baokaka: 'sunHat' },
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

/** Three foes, so the battle layout is at its widest. */
export const BATTLE_FOES: readonly FoeId[] = ['dustBunny', 'sockMonster', 'dustBunny'];

/** A random fight against BATTLE_FOES, opening on a hero's turn. */
function battleWith(party: readonly HeroId[], level = SAMPLE_LEVEL): QuestState {
  const run = sampleRun(party, level);
  return withView({ screen: 'battle', battle: startBattle(run, [...BATTLE_FOES], run.seed, false) }, run);
}

export const ARTLAB_FIXTURES: readonly ArtLabFixture[] = [
  { name: 'title-continue', label: 'Title with a run to continue', state: () => withView({ screen: 'title' }) },
  { name: 'world', label: 'World: home map', state: world },
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
          drops: ['cookie'],
          levels: 1,
          learned: Object.values(SPELLS)
            .filter((spell) => spell.level === SAMPLE_LEVEL + 1)
            .map((spell) => spell.id),
          level: SAMPLE_LEVEL + 1,
          boss: null,
        },
      }),
  },
  { name: 'shop', label: 'Shop', state: () => withView({ screen: 'shop', stock: ['cookie', 'bottle', 'banana', 'driedFish', 'sunHat'] }) },
  { name: 'menu', label: 'Menu: party sheet', state: world, menu: true },
  { name: 'defeat', label: 'Defeat', state: () => withView({ screen: 'defeat' }) },
  { name: 'ending', label: 'Ending', state: () => withView({ screen: 'ending' }) },
];
