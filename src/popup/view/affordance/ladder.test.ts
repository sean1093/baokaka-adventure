import { describe, expect, test } from 'vitest';
import { HINT_LINE_MAX, HINT_LINES, sayWordLine } from '../../content/hints';
import { WORD_LABEL } from '../../content/words';
import { textLength } from '../../core/lint';
import c0p4 from '../../core/fixtures/c0p4';
import c1p2 from '../../core/fixtures/c1p2';
import c1p3 from '../../core/fixtures/c1p3';
import { page, part, line } from '../../core/fixtures/toy';
import type { Input, PageDef } from '../../core/types';
import { autoHintMs, hintDisplay, hintLine, hintTarget, NO_HINT, pressHint } from './ladder';

/** The hint ladder's rules (GDD § 2.7, § 2.11, § 5.3; #100). */

const wheelPage: PageDef = page({ ...line('AB'), parts: [part('dial', 'wheel', 50, -80, { states: ['a', 'b', 'c', 'd'] }), part('lamp', 'prop', 0, -80, { states: ['off', 'on'] })] });

describe('pressing 提示', () => {
  test('climbs 1 → 2 → 3, and 3 again ("show me" repeats)', () => {
    expect(pressHint(0)).toBe(1);
    expect(pressHint(1)).toBe(2);
    expect(pressHint(2)).toBe(3);
    expect(pressHint(3)).toBe(3);
  });
});

describe('the auto nudge (§ 2.11 自動提示)', () => {
  test('30 s by default, 15 s, off; 長輩模式 always makes it 15 s (D-67)', () => {
    expect(autoHintMs({ autoHint: 30, elder: false })).toBe(30_000);
    expect(autoHintMs({ autoHint: 15, elder: false })).toBe(15_000);
    expect(autoHintMs({ autoHint: 0, elder: false })).toBeNull();
    expect(autoHintMs({ autoHint: 30, elder: true })).toBe(15_000);
    expect(autoHintMs({ autoHint: 0, elder: true })).toBe(15_000);
  });
});

describe('what a hint points at', () => {
  test.each<[string, PageDef, Input, ReturnType<typeof hintTarget>]>([
    ['a drag to a stop', c1p2, { t: 'set', part: 'train', to: 'full' }, { key: 'train', stop: 2 }],
    ['a tap on a flap', c0p4, { t: 'tap', id: 'curtain' }, { key: 'curtain' }],
    ['Mocha to a perch', c1p2, { t: 'mocha', perch: 'pillar' }, { key: 'perch:pillar' }],
    ['petting Mocha', c1p2, { t: 'pet' }, { key: 'mocha:mocha' }],
    ['a word (the ring opens from him)', c1p3, { t: 'say', word: 'beep' }, { key: 'baby:baby' }],
    ['a wait', c1p2, { t: 'none' }, null],
  ])('%s', (_, def, action, target) => {
    expect(hintTarget(def, action)).toEqual(target);
  });
});

describe('the hint line (§ 5.3, ≤ 12 characters)', () => {
  test.each<[string, PageDef, Input, string | null]>([
    ['a tab', c1p2, { t: 'set', part: 'train', to: 'half' }, '拉拉看這裡'],
    ['a wheel', wheelPage, { t: 'set', part: 'dial', to: 'c' }, '轉轉看'],
    ['a flap', c0p4, { t: 'tap', id: 'curtain' }, '翻開看看'],
    ['a perch', c1p2, { t: 'mocha', perch: 'pillar' }, '讓摩卡上去'],
    ['a box perch (he hides)', c0p4, { t: 'mocha', perch: 'basket' }, '藏起來看看？'],
    ['a word', c1p3, { t: 'say', word: 'beep' }, '試試看說話'],
    ['a wait', c1p2, { t: 'none' }, '等等看。'],
    ['a tap toy: no line in § 5.3', wheelPage, { t: 'tap', id: 'lamp' }, null],
    ['petting: no line', c1p2, { t: 'pet' }, null],
  ])('%s', (_, def, action, text) => {
    expect(hintLine(def, action)).toBe(text);
  });

  test('every line is ≤ 12 characters', () => {
    for (const text of Object.values(HINT_LINES)) expect(textLength(text), text).toBeLessThanOrEqual(HINT_LINE_MAX);
  });

  test('from level 2 a word\'s line names the word (#221, friction 16)', () => {
    const say: Input = { t: 'say', word: 'whoosh' };
    expect(hintLine(c1p3, say, 1)).toBe('試試看說話');
    expect(hintLine(c1p3, say, 2)).toBe('試試看說『咻——』');
    expect(hintLine(c1p3, say, 3)).toBe('試試看說『咻——』');
    expect(hintDisplay(c1p3, { action: say, source: 'solver' }, 2).line).toBe('試試看說『咻——』');
    for (const label of Object.values(WORD_LABEL)) expect(textLength(sayWordLine(label)), label).toBeLessThanOrEqual(HINT_LINE_MAX);
  });
});

describe('what each level shows', () => {
  const drag = { action: { t: 'set', part: 'train', to: 'full' } as Input, source: 'solver' as const };

  test('level 0, the nudge: a single shimmer, Mocha yawns toward it, no line', () => {
    expect(hintDisplay(c1p2, drag, 0)).toEqual({ show: { level: 0, key: 'train', stop: 2 }, mocha: 'yawn', line: null, retry: false, ringWord: null });
  });

  test('level 1, where: the halo, Mocha looks, his line', () => {
    expect(hintDisplay(c1p2, drag, 1)).toEqual({ show: { level: 1, key: 'train', stop: 2 }, mocha: 'look', line: '拉拉看這裡', retry: false, ringWord: null });
  });

  test('levels 2 and 3, how and show me: the ghost hand (level 3 then plays it)', () => {
    expect(hintDisplay(c1p2, drag, 2).show).toEqual({ level: 2, key: 'train', stop: 2 });
    expect(hintDisplay(c1p2, drag, 3).show).toEqual({ level: 2, key: 'train', stop: 2 });
  });

  test('a word at level 2+: the hand on Baokaka, and on the word\'s disc once the ring is open', () => {
    const say = { action: { t: 'say', word: 'beep' } as Input, source: 'solver' as const };
    expect(hintDisplay(c1p3, say, 1).ringWord).toBeNull();
    expect(hintDisplay(c1p3, say, 2)).toMatchObject({ show: { level: 2, key: 'baby:baby' }, ringWord: 'beep' });
  });

  test('a wait: Mocha taps his paw, 「等等看。」 (the nudge: just the yawn)', () => {
    const wait = { action: { t: 'none' } as Input, source: 'solver' as const };
    expect(hintDisplay(c1p2, wait, 1)).toEqual({ show: null, mocha: 'wait', line: '等等看。', retry: false, ringWord: null });
    expect(hintDisplay(c1p2, wait, 3).mocha).toBe('wait');
    expect(hintDisplay(c1p2, wait, 0)).toEqual({ ...NO_HINT, mocha: 'yawn' });
  });

  test('lost (重來 + step 1): 重來 glows; nothing on the page', () => {
    const restart = { action: { t: 'set', part: 'train', to: 'half' } as Input, source: 'restart' as const };
    expect(hintDisplay(c1p2, restart, 1)).toEqual({ ...NO_HINT, retry: true });
    expect(hintDisplay(c1p2, restart, 3)).toEqual({ ...NO_HINT, retry: true });
    expect(hintDisplay(c1p2, restart, 0)).toEqual(NO_HINT);
  });

  test('nothing to hint (done)', () => {
    expect(hintDisplay(c1p2, { action: null, source: 'solver' }, 2)).toEqual(NO_HINT);
  });
});
