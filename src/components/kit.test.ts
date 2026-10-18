import { describe, expect, test } from 'vitest';
import { HP_CRITICAL, HP_LOW, hpState, ratioOf } from './Bars';
import { dotWindow } from './DialogueBox';
import { DOT_FONT } from './DepartureClock';
import { PAUSE_MS, TYPE_MS, charCount, parseMarkup, plainText, splitTyped, typedChars, typingDuration } from './typing';

describe('typedChars (§ 7.5: 30ms per character, +120ms after 「，。！？」)', () => {
  test('nothing at 0ms, one character every 30ms', () => {
    expect(typedChars('早安呀', 0)).toBe(0);
    expect(typedChars('早安呀', 29)).toBe(0);
    expect(typedChars('早安呀', 30)).toBe(1);
    expect(typedChars('早安呀', 60)).toBe(2);
    expect(typedChars('早安呀', 90)).toBe(3);
    expect(typedChars('早安呀', 10_000)).toBe(3);
  });

  test('a pause mark holds the next character for 120ms more', () => {
    // 「好，走」: 好 30, ， 60, then 走 at 60 + 120 + 30 = 210
    expect(typedChars('好，走', 60)).toBe(2);
    expect(typedChars('好，走', 209)).toBe(2);
    expect(typedChars('好，走', 210)).toBe(3);
    for (const mark of ['，', '。', '！', '？']) expect(typedChars(`a${mark}b`, 60 + TYPE_MS + PAUSE_MS - 1)).toBe(2);
  });

  test('other punctuation does not pause', () => {
    expect(typedChars('a、b', 90)).toBe(3);
    expect(typedChars('「a」', 90)).toBe(3);
  });

  test('typingDuration is when the last character lands (no pause counted after it)', () => {
    for (const text of ['早安呀', '好，走', '「風是往這邊吹的。寶物應該掉在附近。」', '喵！']) {
      const done = typingDuration(text);
      expect(typedChars(text, done)).toBe(charCount(text));
      expect(typedChars(text, done - 1)).toBe(charCount(text) - 1);
    }
    expect(typingDuration('喵！')).toBe(2 * TYPE_MS);
    expect(typingDuration('')).toBe(0);
  });

  test('counts code points, so a character outside the BMP is one step', () => {
    expect(charCount('𠝹好')).toBe(2);
    expect(typedChars('𠝹好', 30)).toBe(1);
  });
});

describe('key-term markup', () => {
  test('【詞】 becomes a gold run without its brackets', () => {
    expect(parseMarkup('風往這邊吹。【寶物】在附近。')).toEqual([
      { text: '風往這邊吹。', key: false },
      { text: '寶物', key: true },
      { text: '在附近。', key: false },
    ]);
    expect(plainText('【月亮線】，出發！')).toBe('月亮線，出發！');
  });

  test('unmatched or empty brackets stay literal', () => {
    expect(plainText('【沒關')).toBe('【沒關');
    expect(plainText('【】')).toBe('【】');
    expect(parseMarkup('一般的句子')).toEqual([{ text: '一般的句子', key: false }]);
  });

  test('splitTyped cuts runs at the typed count and ghosts the rest, keeping every character', () => {
    const segments = parseMarkup('看【寶物】喔');
    expect(splitTyped(segments, 2)).toEqual([
      { text: '看', key: false, ghost: false },
      { text: '寶', key: true, ghost: false },
      { text: '物', key: true, ghost: true },
      { text: '喔', key: false, ghost: true },
    ]);
    for (let shown = 0; shown <= 4; shown += 1) {
      expect(
        splitTyped(segments, shown)
          .map((part) => part.text)
          .join(''),
      ).toBe('看寶物喔');
    }
    expect(splitTyped(segments, 0).every((part) => part.ghost)).toBe(true);
    expect(splitTyped(segments, 99).some((part) => part.ghost)).toBe(false);
  });
});

describe('HP states (§ 3.3: low under 40%, critical under 20%)', () => {
  test('thresholds', () => {
    expect(HP_LOW).toBe(0.4);
    expect(HP_CRITICAL).toBe(0.2);
    expect(hpState(100, 100)).toBe('ok');
    expect(hpState(40, 100)).toBe('ok');
    expect(hpState(39, 100)).toBe('low');
    expect(hpState(20, 100)).toBe('low');
    expect(hpState(19, 100)).toBe('critical');
    expect(hpState(0, 100)).toBe('critical');
  });

  test('ratios clamp, and a max of 0 is empty', () => {
    expect(ratioOf(150, 100)).toBe(1);
    expect(ratioOf(-5, 100)).toBe(0);
    expect(ratioOf(3, 0)).toBe(0);
  });
});

describe('page dots', () => {
  test('a short run shows every line', () => {
    expect(dotWindow(2, 4)).toEqual({ count: 4, lit: 2 });
  });

  test('a long run shows a window of seven around the current line', () => {
    expect(dotWindow(0, 20)).toEqual({ count: 7, lit: 0 });
    expect(dotWindow(10, 20)).toEqual({ count: 7, lit: 3 });
    expect(dotWindow(19, 20)).toEqual({ count: 7, lit: 6 });
  });
});

describe('departure board font', () => {
  test('every digit is a 5×7 dot matrix and no two digits look alike', () => {
    const digits = '0123456789'.split('');
    for (const digit of digits) {
      expect(DOT_FONT[digit]).toHaveLength(7);
      for (const row of DOT_FONT[digit]) expect(row).toMatch(/^[01]{5}$/);
    }
    expect(new Set(digits.map((digit) => DOT_FONT[digit].join(''))).size).toBe(10);
  });
});
