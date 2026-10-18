import { startBattle } from '../quest/engine/battle';
import { EVENTS } from '../quest/engine/events';
import { SPELLS } from '../quest/engine/heroes';
import { freshRun, initialState, type QuestState, type QuestView } from '../quest/engine/quest';
import { fullHp, fullMp } from '../quest/engine/scene';
import { HERO_ORDER, type FoeId, type Line, type Run, type Step } from '../quest/engine/types';

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
export const SAMPLE_FLAGS: readonly string[] = ['trigger:home-intro', 'mochaJoined', 'dustDone', 'grandmaGave', 'duckJoined'];

const SAMPLE_LEVEL = 4;

/** A party a few fights in, standing in the living room, a little worn so the bars show. */
export function sampleRun(): Run {
  const base = freshRun(7);
  const run: Run = {
    ...base,
    party: [...HERO_ORDER],
    level: SAMPLE_LEVEL,
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

/** The world paused on step `at` of an event, exactly as the reducer leaves it. */
function worldAt(event: string, at: number): QuestState {
  const steps = EVENTS[event];
  const step = steps[at];
  const base = { ...world(), scene: { steps, at } };
  if (isLine(step)) return { ...base, line: step };
  if ('do' in step && step.do === 'chapter') return { ...base, card: { n: step.n, title: step.title } };
  throw new Error(`Fixture: step ${at} of ${event} is neither a line nor a chapter card`);
}

/** Three foes, so the battle layout is at its widest. */
export const BATTLE_FOES: readonly FoeId[] = ['dustBunny', 'sockMonster', 'dustBunny'];

export const ARTLAB_FIXTURES: readonly ArtLabFixture[] = [
  { name: 'title-continue', label: 'Title with a run to continue', state: () => withView({ screen: 'title' }) },
  { name: 'world', label: 'World: home map', state: world },
  { name: 'dialogue', label: 'World: dialogue line', state: () => worldAt('home.mom.hug', 0) },
  { name: 'chapter', label: 'World: chapter card', state: () => worldAt('home.intro', 0) },
  {
    name: 'battle',
    label: 'Battle: three foes',
    state: () => {
      const run = sampleRun();
      return withView({ screen: 'battle', battle: startBattle(run, [...BATTLE_FOES], run.seed, false) }, run);
    },
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
