import { describe, expect, test } from 'vitest';
import c1p3 from '../core/fixtures/c1p3';
import { toyMoon, toySquirrel } from '../core/fixtures/m2';
import { toyClimb, toyHug, toyPlane } from '../core/fixtures/m3';
import { toyFerry, toyPinwheel, toySteam } from '../core/fixtures/m4';
import { SCRIPT } from '../content/script';
import { initialState, replay, step } from '../core';
import type { PageDef, SimState, Word } from '../core/types';
import { WORDS } from '../core/words';
import { buildRegistry, pageById } from '../pages';
import { completePage, freshSave, ownedAbilities, pageAbilities } from './progress';
import { MAX_RING_WORDS, NO_TUTORIAL, WORD_MOTIF, firstUseLine, learnLines, learnedNow, ringWords, tutorialShow, tutorialWord } from './words';

/** Words on the page (#99; GDD § 2.4, § 5.4, § 6 risk 1). */

/** Steps `def` through `inputs` from its start (or `from`). */
function run(def: PageDef, inputs: Parameters<typeof step>[2][], from: SimState = initialState(def)) {
  let s = from;
  let events: ReturnType<typeof step>['events'] = [];
  for (const input of inputs) ({ state: s, events } = step(def, s, input));
  return { state: s, events };
}
const idle = (n: number) => Array.from({ length: n }, () => ({ t: 'none' }) as const);

describe('ringWords: what the ring offers', () => {
  test('1-3: nothing before 嗶！ is learned, then 嗶！', () => {
    const start = initialState(c1p3);
    expect(ringWords(c1p3, start)).toEqual([]);
    // Mocha pushes the card onto the reader: its beep opens gate A and teaches 嗶！
    const learnt = run(c1p3, [{ t: 'mocha', perch: 'counter' }, ...idle(2)]);
    expect(learnedNow(learnt.events)).toBe('beep');
    expect(ringWords(c1p3, learnt.state)).toEqual(['beep']);
  });

  test('a page without a restriction offers every word, in the § 2.4 order, at most eight', () => {
    const open: PageDef = { ...c1p3, words: undefined };
    expect(ringWords(open, initialState(open))).toEqual([...WORDS]);
    expect(ringWords(open, initialState(open)).length).toBeLessThanOrEqual(MAX_RING_WORDS);
  });

  test('a page\'s words keep their order and the learn word joins once learned', () => {
    const def: PageDef = { ...c1p3, words: ['wow', 'beep'], learns: { word: 'bye', when: { event: 'beep' } } };
    expect(ringWords(def, initialState(def))).toEqual(['beep', 'wow']);
    const s = run(def, [{ t: 'mocha', perch: 'counter' }, ...idle(2)]).state;
    expect(ringWords(def, s)).toEqual(['beep', 'bye', 'wow']);
  });

  test('a replayed earlier page hides words learned later (§ 2.10, #93)', () => {
    // 1-2, then 1-3 (which teaches 嗶！); the save has solved both and owns 嗶！
    const reg = buildRegistry([pageById('c1p2')!, { ...c1p3, words: undefined }]);
    const save = completePage(completePage(freshSave(reg), 'c1p2', { moves: 1 }, reg), 'c1p3', { moves: 1 }, reg);
    expect(ownedAbilities(save, reg).words).toEqual(['beep']);
    // Replaying 1-2: its designed words (none), so the ring stays shut and tapping him shows 「要！」
    const replayed = reg.pageById('c1p2')!;
    expect(pageAbilities(save, 'c1p2', reg)?.words).toEqual([]);
    expect(ringWords(replayed, initialState(replayed))).toEqual([]);
    // 1-3 itself: nothing until it is learned there again
    const again = reg.pageById('c1p3')!;
    expect(ringWords(again, initialState(again))).toEqual([]);
  });

  test('the ring offers exactly what the engine accepts as a say', () => {
    const s = run(c1p3, [{ t: 'mocha', perch: 'counter' }, ...idle(4)]).state;
    for (const word of WORDS) {
      const said = step(c1p3, s, { t: 'say', word }).state.baby.mode === 'saying';
      expect(said, word).toBe(ringWords(c1p3, s).includes(word));
    }
  });
});

describe('the learn beat and the one-time translation', () => {
  test('learnedNow: the word, else the growth stage', () => {
    expect(learnedNow([])).toBeNull();
    expect(learnedNow([{ type: 'learn', word: 'bye' }])).toBe('bye');
    expect(learnedNow([{ type: 'learn', growth: 1 }])).toBe('climb');
    expect(learnedNow([{ type: 'learn', growth: 3 }])).toBe('walk');
  });

  test('learnLines: source → Baokaka → Mocha', () => {
    expect(learnLines('beep')).toEqual(['learn.beep.src', 'learn.beep.baby', 'learn.beep.mocha']);
    expect(learnLines('wow')).toEqual(['learn.wow.baby', 'learn.wow.mocha']);
    expect(learnLines('walk')).toEqual([]);
  });

  test('firstUseLine: the follow-up on the learn page, the translation anywhere else', () => {
    expect(firstUseLine(c1p3, 'beep')).toBe('learn.beep.then');
    const later: PageDef = { ...c1p3, words: ['beep'], learns: undefined };
    expect(firstUseLine(later, 'beep')).toBe('learn.beep.mocha');
    // A word with no follow-up says nothing more on its own learn page (its beat just played)
    expect(firstUseLine({ ...c1p3, learns: { word: 'bye', when: { event: 'beep' } } }, 'bye')).toBeNull();
  });
});

describe('the first-use tutorial (§ 2.4; 1-3)', () => {
  test('runs on the page of the player\'s first word only', () => {
    expect(tutorialWord(c1p3)).toBe('beep');
    expect(tutorialWord({ ...c1p3, words: ['beep'] })).toBe('beep');
    expect(tutorialWord({ ...c1p3, words: ['beep'], learns: { word: 'bye', when: { event: 'beep' } } })).toBeNull();
    expect(tutorialWord(pageById('c1p2')!)).toBeNull();
  });

  const learnt = run(c1p3, [{ t: 'mocha', perch: 'counter' }, ...idle(2)]).state;
  const stuck = run(c1p3, [...idle(4)], learnt).state;
  const base = { word: 'beep' as Word, used: false, busy: false, ringOpen: false };

  test('nothing before the word is learned, while the learn beat is up, or once it is said', () => {
    expect(tutorialShow({ ...base, state: initialState(c1p3) })).toEqual(NO_TUTORIAL);
    expect(tutorialShow({ ...base, state: stuck, busy: true })).toEqual(NO_TUTORIAL);
    expect(tutorialShow({ ...base, state: stuck, used: true })).toEqual(NO_TUTORIAL);
    expect(tutorialShow({ ...base, word: null, state: stuck })).toEqual(NO_TUTORIAL);
  });

  test('the portrait glows; the hand taps him once he is stuck; with the ring open it taps the word', () => {
    expect(learnt.baby.mode).toBe('moving');
    expect(tutorialShow({ ...base, state: learnt })).toEqual({ portrait: true, baby: false, disc: null });
    expect(stuck.baby.mode).toBe('reaching');
    expect(tutorialShow({ ...base, state: stuck })).toEqual({ portrait: true, baby: true, disc: null });
    expect(tutorialShow({ ...base, state: stuck, ringOpen: true })).toEqual({ portrait: false, baby: false, disc: 'beep' });
  });
});

describe('1-3 end to end through the ring\'s words', () => {
  test('learn 嗶！ from the reader, then say it from the ring: gate B opens and he grabs the bead', () => {
    let { state } = run(c1p3, [{ t: 'mocha', perch: 'counter' }, ...idle(2)]);
    expect(state.parts.gateA).toBe('open');
    ({ state } = run(c1p3, idle(4), state));
    expect(state.baby.mode).toBe('reaching');
    expect(state.parts.gateB).toBe('closed');
    const [word] = ringWords(c1p3, state);
    expect(word).toBe('beep');
    const said = step(c1p3, state, { t: 'say', word });
    expect(said.state.parts.gateB).toBe('open');
    expect(said.state.parts.robot).toBe('spin');
    ({ state } = run(c1p3, idle(4), said.state));
    expect(state.done).toBe(true);
  });

  test('the authored solution agrees', () => {
    expect(replay(c1p3, c1p3.solution).state.done).toBe(true);
  });
});

test('every word has a distinct sound motif (§ 6 risk 10)', () => {
  const motifs = WORDS.map((w) => WORD_MOTIF[w].join(','));
  expect(new Set(motifs).size).toBe(WORDS.length);
});

describe('the M2 words: 掰掰, 不要！, 哇！ through the #99 flow (#112)', () => {
  test('不要！ is learned on the moon toy page: the goose honks when Mocha lands on the rock', () => {
    expect(ringWords(toyMoon, initialState(toyMoon))).toEqual(['beep', 'bye']);
    const taught = run(toyMoon, [{ t: 'mocha', perch: 'rock' }]);
    expect(learnedNow(taught.events)).toBe('no');
    expect(ringWords(toyMoon, taught.state)).toEqual(['beep', 'bye', 'no']);
    // The learn beat: the goose, then Baokaka, then Mocha's translation; no follow-up on its learn page
    expect(learnLines('no')).toEqual(['learn.no.src', 'learn.no.baby', 'learn.no.mocha']);
    expect(firstUseLine(toyMoon, 'no')).toBeNull();
    expect(tutorialWord(toyMoon)).toBeNull();
  });

  test.each([
    ['bye', ['learn.bye.src', 'learn.bye.baby', 'learn.bye.mocha']],
    ['no', ['learn.no.src', 'learn.no.baby', 'learn.no.mocha']],
    ['wow', ['learn.wow.baby', 'learn.wow.mocha']],
  ] as const)('%s: its learn beat lines exist; on any other page its first say gets Mocha\'s translation', (word, lines) => {
    expect(learnLines(word)).toEqual(lines);
    for (const key of lines) expect(SCRIPT[key], key).toBeDefined();
    expect(firstUseLine(toySquirrel, word)).toBe(`learn.${word}.mocha`);
  });

  test('the ring with M2\'s four words (the `word-ring-4` stage): 嗶！ 掰掰 不要！ 哇！ in learning order', () => {
    const ring4: PageDef = { ...toyMoon, words: ['wow', 'no', 'bye', 'beep'], learns: undefined };
    expect(ringWords(ring4, initialState(ring4))).toEqual(['beep', 'bye', 'no', 'wow']);
  });
});

describe('the M3 words and growth: 抱抱, 飛機！, 爬樓梯 through the #99 flow (#120)', () => {
  test.each([
    ['hug', toyHug, ['learn.hug.src', 'learn.hug.baby', 'learn.hug.mocha']],
    ['plane', toyPlane, ['learn.plane.baby', 'learn.plane.mocha']],
  ] as const)('%s is learned on its toy page; its learn beat lines exist; the ring offers it after', (word, def, lines) => {
    expect(ringWords(def, initialState(def))).toEqual([]);
    const taught = run(def, [{ t: 'none' }]);
    expect(learnedNow(taught.events)).toBe(word);
    expect(ringWords(def, taught.state)).toEqual([word]);
    expect(learnLines(word)).toEqual(lines);
    for (const key of lines) expect(SCRIPT[key], key).toBeDefined();
    // Its own learn page has no follow-up; anywhere else its first say gets Mocha's translation
    expect(firstUseLine(def, word)).toBeNull();
    expect(firstUseLine(toyMoon, word)).toBe(`learn.${word}.mocha`);
  });

  test('爬樓梯 is a growth stage: learned when the farmer climbs; Mocha\'s line, no word in the ring', () => {
    const taught = run(toyClimb, [{ t: 'none' }, { t: 'say', word: 'bye' }]);
    expect(learnedNow(taught.events)).toBe('climb');
    expect(learnLines('climb')).toEqual(['learn.climb.mocha']);
    expect(ringWords(toyClimb, taught.state)).toEqual(['bye']);
  });

  test('the ring with M3\'s six words (the `word-ring-6` stage): 嗶！ 掰掰 不要！ 哇！ 抱抱 飛機！ in learning order', () => {
    const ring6: PageDef = { ...toyPlane, words: ['plane', 'hug', 'wow', 'no', 'bye', 'beep'], learns: undefined };
    expect(ringWords(ring6, initialState(ring6))).toEqual(['beep', 'bye', 'no', 'wow', 'hug', 'plane']);
  });
});

describe('the M4 word and growth: 咻—— and 扶著站 through the #99 flow (#127)', () => {
  test('咻—— is learned on the steam toy page; its learn beat lines exist; the ring offers it after', () => {
    expect(ringWords(toySteam, initialState(toySteam))).toEqual([]);
    const taught = run(toySteam, [{ t: 'none' }, { t: 'none' }]);
    expect(learnedNow(taught.events)).toBe('whoosh');
    expect(ringWords(toySteam, taught.state)).toEqual(['whoosh']);
    expect(learnLines('whoosh')).toEqual(['learn.whoosh.src', 'learn.whoosh.baby', 'learn.whoosh.mocha']);
    for (const key of learnLines('whoosh')) expect(SCRIPT[key], key).toBeDefined();
    expect(firstUseLine(toySteam, 'whoosh')).toBeNull();
    expect(firstUseLine(toyPinwheel, 'whoosh')).toBe('learn.whoosh.mocha');
  });

  test('扶著站 is a growth stage: learned pulling up on the railing; Mocha\'s line, no word in the ring', () => {
    const taught = run(toyFerry, [{ t: 'mocha', perch: 'rail' }]);
    expect(learnedNow(taught.events)).toBe('cruise');
    expect(learnLines('cruise')).toEqual(['learn.cruise.mocha']);
    expect(ringWords(toyFerry, taught.state)).toEqual([]);
  });

  test('the ring with the seven words to chapter 9 (the `word-ring-7` stage), in learning order', () => {
    const ring7: PageDef = { ...toyPinwheel, words: ['whoosh', 'plane', 'hug', 'wow', 'no', 'bye', 'beep'], learns: undefined };
    expect(ringWords(ring7, initialState(ring7))).toEqual(['beep', 'bye', 'no', 'wow', 'hug', 'plane', 'whoosh']);
  });
});
