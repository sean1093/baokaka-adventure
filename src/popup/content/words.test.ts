import { describe, expect, test } from 'vitest';
import { textLength } from '../core/lint';
import { WORDS } from '../core/words';
import { SCRIPT } from './script';
import { LEARN_BEATS, WORD_LABEL, cardLine, learnLineKeys, type LearnKey } from './words';

/** Words as the screens name them and the § 5.4 learn beats (#99). */

/** GDD § 5.4's word-card column, in its order. */
const CARDS: readonly [LearnKey, string][] = [
  ['beep', '嗶！：閘門開開'],
  ['bye', '掰掰：請讓一讓'],
  ['no', '不要！：換一個想要的'],
  ['wow', '哇！：燈亮起來'],
  ['hug', '抱抱：大人載你走'],
  ['plane', '飛機！：鳥都飛起來'],
  ['climb', '爬樓梯：爬上一階'],
  ['whoosh', '咻——：吹動輕的東西'],
  ['cruise', '扶著站：搆到高的地方'],
  ['together', '一起：摩卡帶你走'],
  ['walk', '第一步！'],
];

describe('learn beats (GDD § 5.4)', () => {
  test('all 11 entries, in the GDD order', () => {
    expect(Object.keys(LEARN_BEATS)).toEqual(CARDS.map(([k]) => k));
  });

  test.each(CARDS)('%s: the card reads 「%s」 (≤ 14 characters)', (key, card) => {
    expect(cardLine(LEARN_BEATS[key])).toBe(card);
    expect(textLength(card)).toBeLessThanOrEqual(14);
  });

  test('every line a beat names is in the script, spoken by the right speaker', () => {
    for (const [key, b] of Object.entries(LEARN_BEATS)) {
      for (const k of [b.source, b.baby, b.mocha, b.then]) if (k !== null) expect(SCRIPT[k], `${key}: ${k}`).toBeDefined();
      if (b.baby) expect(SCRIPT[b.baby].who).toBe('baby');
      if (b.mocha) expect(SCRIPT[b.mocha].who).toBe('mocha');
      if (b.then) expect(SCRIPT[b.then].who).toBe('mocha');
      if (b.source) expect(SCRIPT[b.source].label, key).toBeTruthy();
    }
  });

  test('嗶！: 讀卡機「嗶！」 → 「嗶！」 → 「他說：『芝麻開門。』」, then 「……閘門真的開了。」', () => {
    const b = LEARN_BEATS.beep;
    expect(learnLineKeys(b).map((k) => [SCRIPT[k].label ?? SCRIPT[k].who, SCRIPT[k].text])).toEqual([
      ['讀卡機', '嗶！'],
      ['baby', '嗶！'],
      ['mocha', '他說：『芝麻開門。』'],
    ]);
    expect(SCRIPT[b.then!].text).toBe('……閘門真的開了。');
  });

  test('silent sources and growth stages have no line of their own; 第一步 is the card alone', () => {
    expect(LEARN_BEATS.wow.source).toBeNull();
    expect(LEARN_BEATS.plane.source).toBeNull();
    expect(LEARN_BEATS.climb.baby).toBeNull();
    expect(learnLineKeys(LEARN_BEATS.walk)).toEqual([]);
  });
});

describe('word labels (§ 2.4, § 5.1)', () => {
  test('every word has its label, as § 2.4 spells it', () => {
    expect(WORDS.map((w) => WORD_LABEL[w])).toEqual(['嗶！', '掰掰', '不要！', '哇！', '抱抱', '飛機！', '咻——', '一起']);
  });
  test('a word\'s card title is its label', () => {
    for (const w of WORDS) expect(LEARN_BEATS[w].title).toBe(WORD_LABEL[w]);
  });
});
