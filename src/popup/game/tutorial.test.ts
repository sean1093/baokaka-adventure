import { describe, expect, test } from 'vitest';
import { initialState, replay, step } from '../core';
import type { PageDef, SimState, SolutionStep } from '../core/types';
import { PAGES, pageById } from '../pages';
import { BUBBLE_DELAY_MS, TUTORIAL_DELAY_MS, cueKey, hasTutorial, tutorialCue } from './tutorial';
import { targetsOf } from '../view/gestures';

/** The prologue's scripted tutorials (#106; GDD § 4.3 notes). */

const page = (id: string): PageDef => pageById(id)!;
const at = (def: PageDef, steps: readonly SolutionStep[]): SimState => replay(def, steps).state;

describe('scripted tutorials', () => {
  test('0-1, 0-2, 0-3 and 1-5 have one; 0-4 (the hint ladder\'s first real use) and the rest of chapter 1 do not', () => {
    expect(PAGES.filter(hasTutorial).map((p) => p.id)).toEqual(['c0p1', 'c0p2', 'c0p3', 'c1p5']);
  });

  test('1-5 (#183): once the car is down with him in it, Mocha nudges toward tapping him; gone once the car goes up', () => {
    const def = page('c1p5');
    expect(tutorialCue(def, at(def, [{ wait: 3 }]))).toBeNull(); // reaching at the B1 door, the car upstairs
    const down = at(def, [{ mocha: 'carPanel' }, { wait: 'settle' }]);
    expect(down.parts.elevator).toBe('B1');
    expect(down.baby).toMatchObject({ node: 'E', mode: 'reaching' });
    expect(tutorialCue(def, down)).toEqual({ show: { kind: 'nudge', key: 'mocha:mocha', mocha: 'wait', line: '再按一次？' }, afterMs: TUTORIAL_DELAY_MS });
    expect(targetsOf(def, down).some((t) => t.key === 'mocha:mocha')).toBe(true);
    expect(tutorialCue(def, step(def, down, { t: 'pet' }).state)).toBeNull();
  });

  test('0-1: the ghost hand on the rail tab once he reaches with the rail up, after 4 s; gone once it is down', () => {
    const def = page('c0p1');
    expect(tutorialCue(def, initialState(def))).toBeNull();
    const reaching = at(def, [{ wait: 3 }]);
    expect(reaching.baby.mode).toBe('reaching');
    expect(tutorialCue(def, reaching)).toEqual({ show: { kind: 'hand', key: 'crib-rail', stop: 1 }, afterMs: TUTORIAL_DELAY_MS });
    expect(tutorialCue(def, step(def, reaching, { t: 'set', part: 'crib-rail', to: 'down' }).state)).toBeNull();
  });

  test('0-2: the bubble spotlight while he watches the TV and while he goes back for the bead; off once he has it', () => {
    const def = page('c0p2');
    expect(tutorialCue(def, initialState(def))).toBeNull(); // still crawling over to the TV
    const watching = at(def, [{ wait: 2 }]);
    expect(watching.baby.mode).toBe('watching');
    expect(tutorialCue(def, watching)).toEqual({ show: { kind: 'bubble' }, afterMs: BUBBLE_DELAY_MS });
    const flipped = step(def, watching, { t: 'tap', id: 'cushion' }).state;
    expect(flipped.baby.target).toBe('bead');
    expect(cueKey(tutorialCue(def, flipped))).toBe(cueKey(tutorialCue(def, watching))); // the same spotlight carries on
    expect(tutorialCue(def, at(def, def.solution))).toBeNull();
  });

  test('0-3: the ghost hand on the table\'s paw print while he reaches and Mocha is elsewhere; gone once he is sent', () => {
    const def = page('c0p3');
    const reaching = at(def, [{ wait: 3 }]);
    expect(reaching.baby.mode).toBe('reaching');
    const cue = tutorialCue(def, reaching);
    expect(cue).toEqual({ show: { kind: 'hand', key: 'perch:table' }, afterMs: TUTORIAL_DELAY_MS });
    // The key names a real tap target on the page (the paw print the hand taps)
    expect(targetsOf(def, reaching).some((t) => t.key === 'perch:table')).toBe(true);
    expect(tutorialCue(def, step(def, reaching, { t: 'mocha', perch: 'table' }).state)).toBeNull();
    // Sent to the shelf instead (the 淘氣), he still reaches: the hand still points at the table
    expect(tutorialCue(def, at(def, [{ wait: 3 }, { mocha: 'shelf' }, { wait: 3 }]))).not.toBeNull();
  });

  test('the 0-1 hint key is a real target too', () => {
    const def = page('c0p1');
    expect(targetsOf(def, at(def, [{ wait: 3 }])).some((t) => t.key === 'crib-rail')).toBe(true);
  });
});
