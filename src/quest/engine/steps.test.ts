/**
 * Script steps v2 (issue #6): chapter clock and labels, choice, goEvent, include, heal ratio,
 * free inn, spending coins in events, and the two-phase boss retry pattern.
 */
import { describe, expect, test } from 'vitest';
import { EVENTS } from './events';
import { MAPS } from './maps';
import { freshRun, initialState, play, questReducer, type QuestState } from './quest';
import { fullHp, fullMp, healParty, runScene, type Scene, type SceneResult } from './scene';
import { UI } from './strings';
import type { Line, Run, Step } from './types';
import { validateIncludes, validateSteps } from './validate';

const run0 = (): Run => freshRun(5);

/** Plays a script start to finish, taking every line, and returns the lines it showed. */
function linesOf(run: Run, steps: Step[]): { lines: string[]; result: SceneResult } {
  const lines: string[] = [];
  let result = runScene(run, { steps, at: 0 });
  for (let guard = 0; guard < 100 && result.stop.kind === 'line'; guard += 1) {
    lines.push(result.stop.line.text);
    result = runScene(result.run, { steps: result.scene.steps, at: result.scene.at + 1 });
  }
  return { lines, result };
}

const textsOf = (event: string): string[] => EVENTS[event].filter((step): step is Line => 'text' in step).map((step) => step.text);

const errorsFor = (steps: Step[]): string[] => {
  const errors: string[] = [];
  validateSteps('test', steps, errors);
  return errors;
};

/** The world, with a hand-written script started on it. */
const playing = (steps: Step[], run = run0()): QuestState => play({ ...initialState(run, false), view: { screen: 'world' } }, steps, run);

/** Taps through lines and cards until the script wants something else. */
function readAll(state: QuestState): QuestState {
  let current = state;
  for (let guard = 0; guard < 100 && (current.line || current.card); guard += 1) current = questReducer(current, { type: 'advance' });
  return current;
}

/** Ends the battle on screen with the given outcome, the way the battle screen reports it. */
function finishBattle(state: QuestState, outcome: 'won' | 'lost'): QuestState {
  if (state.view.screen !== 'battle') throw new Error(`expected a battle, got ${state.view.screen}`);
  const ended = { ...state, view: { screen: 'battle' as const, battle: { ...state.view.battle, phase: { kind: outcome } } } };
  return questReducer(ended, { type: 'battleEnd' });
}

describe('the chapter card', () => {
  test('carries the clock and moves the chapter counter', () => {
    const result = runScene(run0(), { steps: [{ do: 'chapter', n: 3, title: '月亮線，出發！', time: '01:10' }], at: 0 });
    expect(result.stop).toEqual({ kind: 'chapter', n: 3, title: '月亮線，出發！', time: '01:10' });
    expect(result.run.chapter).toBe(3);
  });

  test('a label replaces the number and leaves run.chapter alone (D-15)', () => {
    const run = { ...run0(), chapter: 14 };
    const result = runScene(run, { steps: [{ do: 'chapter', n: 15, title: '度晬', time: '05:30', label: '尾聲' }], at: 0 });
    expect(result.stop).toEqual({ kind: 'chapter', n: 15, title: '度晬', time: '05:30', label: '尾聲' });
    expect(result.run.chapter).toBe(14);
  });

  test('the reducer shows time and label on the card', () => {
    const state = playing([{ do: 'chapter', n: 0, title: '象山看日出', time: '05:30', label: '番外' }]);
    expect(state.card).toEqual({ n: 0, title: '象山看日出', time: '05:30', label: '番外' });
    expect(readAll(state).card).toBeNull();
  });

  test('the validator wants HH:MM', () => {
    expect(errorsFor([{ do: 'chapter', n: 1, title: 't', time: '00:00' }])).toEqual([]);
    expect(errorsFor([{ do: 'chapter', n: 1, title: 't', time: '23:59' }])).toEqual([]);
    for (const time of ['2:00', '24:00', '01:60', '0100', '01:10 ', '']) {
      expect(errorsFor([{ do: 'chapter', n: 1, title: 't', time }])).toEqual([`test[0]: chapter time must be HH:MM, got "${time}"`]);
    }
    expect(errorsFor([{ do: 'chapter', n: 1, title: 't', label: '' }])).toEqual(['test[0]: empty chapter label']);
  });
});

describe('the choice step', () => {
  const choice: Step = {
    do: 'choice',
    prompt: '「要去哪裡？」',
    options: [
      { label: '找爸爸', event: 'home.dad' },
      { label: '找阿嬤', event: 'home.grandma.again' },
    ],
  };
  const script: Step[] = [{ who: null, text: '問題來了。' }, choice, { who: null, text: '這一行不會出現。' }];

  test('runScene stops with the prompt and the options', () => {
    const result = runScene(run0(), { steps: script, at: 1 });
    expect(result.stop).toEqual({ kind: 'choice', prompt: '「要去哪裡？」', options: choice.options });
    expect(result.scene.at).toBe(1);
  });

  test.each([
    [0, 'home.dad'],
    [1, 'home.grandma.again'],
  ] as const)('option %i branches to %s and drops the rest of the scene', (index, event) => {
    const asked = readAll(playing(script));
    expect(asked.choice).toEqual({ prompt: '「要去哪裡？」', options: choice.options });
    expect(asked.line).toBeNull();

    let state = questReducer(asked, { type: 'choose', index });
    expect(state.choice).toBeNull();
    const shown: string[] = [];
    while (state.line) {
      shown.push(state.line.text);
      state = questReducer(state, { type: 'advance' });
    }
    expect(shown).toEqual(textsOf(event));
    expect(state.scene).toBeNull();
    expect(state.view).toEqual({ screen: 'world' });
  });

  test('while a choice is up, tapping, walking and talking do nothing; a bad index is ignored', () => {
    const asked = readAll(playing(script));
    expect(questReducer(asked, { type: 'advance' })).toBe(asked);
    expect(questReducer(asked, { type: 'step', tile: { c: 1, r: 1 }, facing: 'left' })).toBe(asked);
    expect(questReducer(asked, { type: 'interact', id: 'mom' })).toBe(asked);
    expect(questReducer(asked, { type: 'choose', index: 2 })).toBe(asked);
    expect(questReducer(asked, { type: 'choose', index: -1 })).toBe(asked);
    const idle = { ...initialState(run0(), false), view: { screen: 'world' as const } };
    expect(questReducer(idle, { type: 'choose', index: 0 })).toBe(idle);
  });

  test('the validator wants 2–3 short labels pointing at real events', () => {
    const option = (label: string, event = 'home.dad') => ({ label, event });
    expect(errorsFor([{ do: 'choice', options: [option('一'), option('二'), option('三')] }])).toEqual([]);
    expect(errorsFor([{ do: 'choice', options: [option('一')] }])).toEqual(['test[0]: choice needs 2..3 options, got 1']);
    expect(errorsFor([{ do: 'choice', options: [option('一'), option('二'), option('三'), option('四')] }])).toEqual([
      'test[0]: choice needs 2..3 options, got 4',
    ]);
    expect(errorsFor([{ do: 'choice', options: [option(''), option('一二三四五六七八九十一二三')] }])).toEqual([
      'test[0]: choice option 0 has no label',
      'test[0]: choice label "一二三四五六七八九十一二三" is over 12 characters',
    ]);
    expect(errorsFor([{ do: 'choice', options: [option('一'), option('二', 'no.such.event')] }])).toEqual([
      'test[0]: choice option 1 points at missing event no.such.event',
    ]);
  });
});

describe('goEvent', () => {
  test('jumps to the event and drops the rest of the scene', () => {
    const { lines, result } = linesOf(run0(), [{ who: null, text: '先說這句。' }, { do: 'goEvent', event: 'home.dad' }, { who: null, text: '不會出現。' }]);
    expect(lines).toEqual(['先說這句。', ...textsOf('home.dad')]);
    expect(result.stop).toEqual({ kind: 'done' });
  });

  test('the validator wants a real target', () => {
    expect(errorsFor([{ do: 'goEvent', event: 'home.dad' }])).toEqual([]);
    expect(errorsFor([{ do: 'goEvent', event: 'nope' }])).toEqual(['test[0]: goEvent points at missing event nope']);
  });
});

describe('include', () => {
  const script: Step[] = [
    { who: null, text: '開始。' },
    { do: 'include', event: 'home.dad', when: 'gotLily' },
    { who: null, text: '結束。' },
  ];

  test('splices the event in when the condition holds, then carries on', () => {
    const run = { ...run0(), flags: ['gotLily'] };
    expect(linesOf(run, script).lines).toEqual(['開始。', ...textsOf('home.dad'), '結束。']);
  });

  test('skips it when the condition fails', () => {
    expect(linesOf(run0(), script).lines).toEqual(['開始。', '結束。']);
  });

  test('`not` works like a talk rule, and a flag set earlier in the scene counts', () => {
    const skip: Step[] = [{ do: 'include', event: 'home.dad', not: 'done' }, { who: null, text: '結束。' }];
    expect(linesOf({ ...run0(), flags: ['done'] }, skip).lines).toEqual(['結束。']);
    expect(linesOf(run0(), skip).lines).toEqual([...textsOf('home.dad'), '結束。']);

    const flagged: Step[] = [{ do: 'flag', flag: 'gotLily' }, ...script];
    expect(linesOf(run0(), flagged).lines).toEqual(['開始。', ...textsOf('home.dad'), '結束。']);
  });

  test('an included battle pauses and the rest of the scene resumes after the win', () => {
    let state = readAll(playing([{ do: 'include', event: 'home.dust' }, { who: null, text: '包含之後。' }]));
    expect(state.view.screen).toBe('battle');
    state = questReducer(finishBattle(state, 'won'), { type: 'victoryContinue' });
    const shown: string[] = [];
    while (state.line) {
      shown.push(state.line.text);
      state = questReducer(state, { type: 'advance' });
    }
    expect(shown).toEqual([...textsOf('home.dust').slice(2), '包含之後。']);
    expect(state.run.flags).toContain('dustDone');
  });

  test('the validator wants a real target', () => {
    expect(errorsFor([{ do: 'include', event: 'nope', when: 'x' }])).toEqual(['test[0]: include points at missing event nope']);
  });

  test('the validator rejects include cycles, deep nesting, and branches inside an include', () => {
    const line: Step = { who: null, text: '。' };
    const inc = (event: string): Step => ({ do: 'include', event });
    const check = (events: Record<string, Step[]>): string[] => {
      const errors: string[] = [];
      validateIncludes(events, errors);
      return errors;
    };

    expect(check({ a: [inc('b')], b: [inc('c')], c: [line] })).toEqual([]);
    expect(check({ a: [inc('b')], b: [inc('a')] })).toContain('event a: include cycle a → b → a');
    expect(check({ a: [inc('a')] })).toEqual(['event a: include cycle a → a']);

    // Four levels are fine, a fifth is not
    expect(check({ a: [inc('b')], b: [inc('c')], c: [inc('d')], d: [inc('e')], e: [line] })).toEqual([]);
    expect(check({ a: [inc('b')], b: [inc('c')], c: [inc('d')], d: [inc('e')], e: [inc('f')], f: [line] })).toContain(
      'event a: includes nest deeper than 4 (a → b → c → d → e → f)',
    );

    expect(check({ a: [inc('b')], b: [{ do: 'goEvent', event: 'a' }] })).toEqual([
      'event b: is included (by a) but has a goEvent, which would drop the rest of a',
    ]);
  });
});

describe('heal with a ratio', () => {
  test('raises everyone to at least the ratio, revives the fallen, and never lowers', () => {
    const base = run0();
    const max = { hp: fullHp(base, 'mocha'), mp: fullMp(base, 'mocha') };
    const run: Run = {
      ...base,
      hp: { ...base.hp, baokaka: 1, mocha: 0, magpie: base.hp.magpie, bear: Math.round(fullHp(base, 'bear') * 0.8) },
      mp: { ...base.mp, baokaka: 0, mocha: max.mp, magpie: 1, bear: Math.round(fullMp(base, 'bear') * 0.9) },
    };
    const healed = runScene(run, { steps: [{ do: 'heal', ratio: 0.5 }], at: 0 }).run;

    expect(healed.hp.baokaka).toBe(Math.ceil(fullHp(base, 'baokaka') * 0.5));
    expect(healed.hp.mocha).toBe(Math.ceil(max.hp * 0.5));
    expect(healed.hp.magpie).toBe(base.hp.magpie);
    expect(healed.hp.bear).toBe(run.hp.bear);
    expect(healed.mp.baokaka).toBe(Math.ceil(fullMp(base, 'baokaka') * 0.5));
    expect(healed.mp.mocha).toBe(max.mp);
    expect(healed.mp.magpie).toBe(Math.ceil(fullMp(base, 'magpie') * 0.5));
    expect(healed.mp.bear).toBe(run.mp.bear);
  });

  test('ratio 1 and no ratio both heal fully', () => {
    const base = run0();
    const hurt: Run = { ...base, hp: { ...base.hp, baokaka: 0, mocha: 3 }, mp: { ...base.mp, magpie: 0 } };
    const full = healParty(hurt);
    expect(runScene(hurt, { steps: [{ do: 'heal', ratio: 1 }], at: 0 }).run).toEqual(full);
    expect(runScene(hurt, { steps: [{ do: 'heal' }], at: 0 }).run).toEqual(full);
  });

  test('the validator wants a ratio in (0, 1]', () => {
    expect(errorsFor([{ do: 'heal', ratio: 0.5 }, { do: 'heal', ratio: 1 }, { do: 'heal' }])).toEqual([]);
    expect(errorsFor([{ do: 'heal', ratio: 0 }, { do: 'heal', ratio: 1.5 }])).toEqual([
      'test[0]: heal ratio must be in (0, 1], got 0',
      'test[1]: heal ratio must be in (0, 1], got 1.5',
    ]);
  });
});

describe('the free inn', () => {
  test('heals without asking or charging and says so', () => {
    const base = run0();
    const run: Run = { ...base, coins: 7, hp: { ...base.hp, baokaka: 1 } };
    const result = runScene(run, { steps: [{ do: 'inn', price: 0 }, { who: null, text: '之後。' }], at: 0 });
    expect(result.stop).toEqual({ kind: 'line', line: { who: null, text: '休息了一下，大家的體力和元氣都滿了。' } });
    expect(UI.innFree).toBe('休息了一下，大家的體力和元氣都滿了。');
    expect(result.run.coins).toBe(7);
    expect(result.run.hp.baokaka).toBe(fullHp(base, 'baokaka'));
  });

  test('in the reducer: no question, the rest line, then the scene carries on', () => {
    const base = run0();
    const state = playing([{ do: 'inn', price: 0 }, { who: null, text: '之後。' }], { ...base, hp: { ...base.hp, baokaka: 1 } });
    expect(state.inn).toBeNull();
    expect(state.line?.text).toBe(UI.innFree);
    expect(state.run.hp.baokaka).toBe(fullHp(base, 'baokaka'));
    expect(questReducer(state, { type: 'advance' }).line?.text).toBe('之後。');
  });

  test('a paid inn still asks', () => {
    expect(playing([{ do: 'inn', price: 10 }]).inn).toBe(10);
  });

  test('the validator wants a whole price, 0 allowed', () => {
    expect(errorsFor([{ do: 'inn', price: 0 }])).toEqual([]);
    expect(errorsFor([{ do: 'inn', price: -5 }])).toEqual(['test[0]: inn price must be a whole number ≥ 0, got -5']);
  });
});

describe('spending coins in an event', () => {
  test('`coins -20` with 5 coins always succeeds and leaves 0 (玉蘭花, claw machine, 海芋)', () => {
    const { lines, result } = linesOf({ ...run0(), coins: 5 }, [
      { do: 'coins', amount: -20 },
      { do: 'give', item: 'cookie' },
      { who: null, text: '買到了！' },
    ]);
    expect(lines).toEqual(['買到了！']);
    expect(result.run.coins).toBe(0);
    expect(result.run.items.cookie).toBe((run0().items.cookie ?? 0) + 1);
  });
});

describe('a two-phase boss and its retry', () => {
  const final: Step[] = [
    { do: 'battle', foes: ['octopus'], boss: true },
    { do: 'flag', flag: 'phase1' },
    { do: 'heal', ratio: 0.5 },
    { do: 'battle', foes: ['snoreKing'], boss: true },
    { do: 'flag', flag: 'phase2' },
    { who: null, text: '贏了！' },
  ];
  const foesOn = (state: QuestState) => (state.view.screen === 'battle' ? state.view.battle.foes.map((foe) => foe.foe) : null);

  test('plays both phases, healing in between, and the scene resumes after the last win', () => {
    let state = playing(final);
    expect(foesOn(state)).toEqual(['octopus']);

    state = questReducer(finishBattle(state, 'won'), { type: 'victoryContinue' });
    expect(foesOn(state)).toEqual(['snoreKing']);
    expect(state.run.flags).toContain('phase1');
    for (const hero of state.run.party) expect(state.run.hp[hero]).toBeGreaterThanOrEqual(Math.ceil(fullHp(state.run, hero) * 0.5));

    state = questReducer(finishBattle(state, 'won'), { type: 'victoryContinue' });
    expect(state.line?.text).toBe('贏了！');
    expect(state.run.flags).toContain('phase2');
  });

  test('losing phase 2 respawns at the map entry with the phase flag kept and the scene cleared', () => {
    let state = playing(final, { ...run0(), pos: { c: 3, r: 3 } });
    state = questReducer(finishBattle(state, 'won'), { type: 'victoryContinue' });
    expect(foesOn(state)).toEqual(['snoreKing']);

    state = finishBattle(state, 'lost');
    expect(state.view).toEqual({ screen: 'defeat' });
    state = questReducer(state, { type: 'retry' });

    expect(state.view).toEqual({ screen: 'world' });
    expect(state.run.pos).toEqual(MAPS[state.run.map].entry);
    expect(state.run.flags).toContain('phase1');
    expect(state.run.flags).not.toContain('phase2');
    expect(state.scene).toBeNull();
    expect(state.line).toBeNull();
    expect(state.choice).toBeNull();
  });

  test('an include rewrites the scene in place, so `at` keeps indexing the steps that play', () => {
    const scene: Scene = runScene({ ...run0(), flags: ['x'] }, { steps: [{ do: 'include', event: 'home.dust', when: 'x' }], at: 0 }).scene;
    expect(scene.steps).toEqual(EVENTS['home.dust']);
    expect(scene.steps[scene.at]).toBe(EVENTS['home.dust'][0]);
  });
});
