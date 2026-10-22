import { describe, expect, test } from 'vitest';
import { contrastRatio } from '../../art/contrast';
import { POPUP } from '../../art/palette';
import { MAX_LINE_CHARS, lintPage, textLength } from '../core/lint';
import { PAGES, pageById } from '../pages';
import { BONUS_CHAPTER, CHAPTERS, ENDING_CHAPTER, SOON_LINES, cardLines, chapterInfo, chapterLine, chapterName, endGroups, endLines, hasNextChapter } from './chapters';
import { CREDITS, CREDITS_DEDICATION, DAWN_BEATS, POST_BEATS } from './credits';
import { UI } from './ui';
import { SPEAKER_INK } from '../view/talk/Talk';
import { BABY_BARKS, MOCHA_BARKS } from './barks';
import { SCRIPT, SPEAKERS, loadLine } from './script';

/** The script infrastructure (#98; GDD § 5.1): the speaker table, the line table and its loader, lint rule 10. */

describe('SCRIPT', () => {
  test('every line belongs to a § 5.1 speaker and is ≤ 30 characters', () => {
    for (const [key, line] of Object.entries(SCRIPT)) {
      expect(SPEAKERS[line.who], key).toBeDefined();
      expect(textLength(line.text), `${key} 「${line.text}」`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      expect(key).toMatch(/^[a-z0-9]+(\.[a-zA-Z0-9]+)+$/);
    }
  });

  test('npc lines name their speaker', () => {
    for (const [key, line] of Object.entries(SCRIPT)) if (line.who === 'npc') expect(line.label, key).toBeTruthy();
  });

  test('loadLine: the speaker\'s label, anchor-ready', () => {
    expect(loadLine('c1.intro.1')).toEqual({ key: 'c1.intro.1', who: 'pa', label: '廣播姊姊', text: '下一站，台北車站。Next station…' });
    expect(loadLine('c1.intro.3')?.label).toBeNull();
    expect(loadLine('no.such.line')).toBeNull();
  });

  test('barks are ≤ 30 characters too', () => {
    for (const t of [...Object.values(BABY_BARKS), ...Object.values(MOCHA_BARKS)]) expect(textLength(t)).toBeLessThanOrEqual(MAX_LINE_CHARS);
  });
});

describe('the prologue and chapter 1 (#102, GDD § 5.2)', () => {
  test('every line key a page, a chapter card or a learn beat uses resolves, and is ≤ 30 characters', () => {
    const keys = [
      ...PAGES.flatMap((p) => [...(p.lines?.intro ?? []), ...(p.lines?.onEvent ?? []).map((l) => l.line)]),
      ...CHAPTERS.flatMap((c) => [...cardLines(c.chapter), ...endLines(c.chapter)]),
      ...SOON_LINES,
    ];
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect(SCRIPT[key], key).toBeDefined();
      expect(textLength(SCRIPT[key].text)).toBeLessThanOrEqual(MAX_LINE_CHARS);
    }
  });

  test('the prologue plays all twelve § 5.2 P lines in order: five on the card, the rest as 0-1 opens', () => {
    const prologue = [...cardLines(0), ...(pageById('c0p1')?.lines?.intro ?? [])];
    expect(prologue).toEqual(Array.from({ length: 12 }, (_, i) => `p.intro.${i + 1}`));
    expect(prologue.map((k) => SCRIPT[k].who)).toEqual(['nar', 'nar', 'grandma', 'grandma', 'nar', 'nar', 'shushu', 'nar', 'nar', 'shushu', 'nar', 'baby']);
    // 咻咻 is 「小小的雲」 until 9-5 (§ 5.1)
    expect(loadLine('p.intro.7')?.label).toBe('小小的雲');
    // 阿嬤's Hokkien exactly as written
    expect(SCRIPT['p.intro.4'].text).toBe('摩卡，今暗顧好喔。');
    expect(SCRIPT['c1p6.end.2'].text).toBe('雞腿，一世人呷好料。');
  });

  test('chapter 1 ends on its four end lines after the album; a chapter\'s card reads 未完待續 until it exists (#107)', () => {
    expect(endLines(1)).toEqual(['c1p6.end.1', 'c1p6.end.2', 'c1p6.end.3', 'c1p6.end.4']);
    expect(endLines(2)).toEqual(['c2p6.end.1', 'c2p6.end.2']);
    expect(endLines(3)).toEqual(['c3p6.end.1']);
    expect(endLines(4)).toEqual(['c4p6.end.1']);
    expect(endLines(5)).toEqual(['c5p6.end.1', 'c5p6.end.2']);
    expect(endLines(6)).toEqual(['c6p6.end.1']);
    expect(endLines(7)).toEqual(['c7p6.end.1']);
    expect(endLines(8)).toEqual(['c8p6.end.1']);
    expect(endLines(9)).toEqual(['c9p6.end.1']);
    expect(endLines(10)).toEqual(['c10p6.end.1', 'c10p6.end.2', 'c10p6.end.3', 'c10p6.end.4']);
    // Chapter 10's end is two beats (#133): 「一起。」 with Mocha's translation, then the sunrise and 廣播姊姊
    expect(endGroups(10)).toEqual([['c10p6.end.1', 'c10p6.end.2'], ['c10p6.end.3', 'c10p6.end.4']]);
    expect(endGroups(1)).toEqual([endLines(1)]);
    expect(endGroups(13)).toEqual([]);
    // 番外 (#135): the 土地公's stamp
    expect(endGroups(12)).toEqual([['x.stamp.1', 'x.stamp.2']]);
    // Page E (#135): his first word, then his second, in six beats
    expect(endGroups(11).map((g) => g.length)).toEqual([2, 1, 2, 2, 1, 2]);
    expect(SOON_LINES.map((k) => SCRIPT[k].who)).toEqual(['nar']);
    expect(hasNextChapter(1)).toBe(true);
    expect(hasNextChapter(10)).toBe(false);
    // 1-1, 1-5 wire their § 5.2 beats; 1-1 opens on 廣播姊姊's ride lines (§ 5.3)
    expect(pageById('c1p1')?.lines?.intro).toEqual(['rec.pa.ride.1', 'rec.pa.ride.2']);
    expect(pageById('c1p1')?.lines?.onEvent?.map((l) => l.line)).toEqual(['c1p1.pack.1', 'c1p1.pack.2']);
    expect(pageById('c1p5')?.lines?.onEvent?.map((l) => l.line)).toEqual(['c1p5.clerk.1', 'c1p5.clerk.2', 'c1p5.clerk.3']);
  });

  test('chapter 1\'s card plays its four intro lines; every § 5.2 beat of chapters 0–1 is in the table', () => {
    expect(cardLines(1)).toEqual(['c1.intro.1', 'c1.intro.2', 'c1.intro.3', 'c1.intro.4']);
    const beats: Record<string, number> = { 'c0p3.join': 10, 'c0p4.train': 3, 'c1p1.pack': 2, 'c1p5.clerk': 3, 'c1p6.end': 4 };
    for (const [prefix, n] of Object.entries(beats)) {
      for (let i = 1; i <= n; i++) expect(SCRIPT[`${prefix}.${i}`], `${prefix}.${i}`).toBeDefined();
      expect(SCRIPT[`${prefix}.${n + 1}`]).toBeUndefined();
    }
    // Baokaka says only his words (§ 5.1)
    const vocabulary = ['要！', '不要！', '抱抱', 'ㄋㄟㄋㄟ', '喵喵', '哇！', '這個！', '好吃！', '好看！', '掰掰', '一起', 'ㄅㄚ！', '嗶！', '飛機！', '咻——', '……哇。', '掰掰！', '抱抱！', '飛……飛機！', '咻——！', '……一起。', '抱抱。', '一起。', '一起！', '……摩卡。', '咻咻！'];
    for (const [key, line] of Object.entries(SCRIPT)) if (line.who === 'baby') expect(vocabulary, key).toContain(line.text);
  });

  test('the chapter card reads 第N章 | title | HH:MM | 下一站 (≤ 8 characters)', () => {
    expect(CHAPTERS[1]).toMatchObject({ time: '00:20', next: '台北車站' });
    for (const c of CHAPTERS) expect([...c.next].length, c.title).toBeLessThanOrEqual(8);
    expect(UI.chapterCard.next).toBe('下一站');
  });
});

describe('speakers (§ 5.1)', () => {
  test('narration goes on the strip; 寶咖咖, 摩卡, 廣播姊姊 and 阿伯 have anchors; the rest are voices', () => {
    expect(SPEAKERS.nar.anchor).toBe('strip');
    expect([SPEAKERS.baby.anchor, SPEAKERS.mocha.anchor, SPEAKERS.pa.anchor, SPEAKERS.uncle.anchor]).toEqual(['baby', 'mocha', 'speaker', 'tudigong']);
    for (const who of ['grandma', 'mom', 'dad', 'clerk', 'pack', 'shushu', 'npc'] as const) expect(SPEAKERS[who].anchor).toBe('none');
  });

  test('every label colour keeps its cream label text ≥ 7:1 (R5)', () => {
    for (const [who, ink] of Object.entries(SPEAKER_INK)) expect(contrastRatio(ink, POPUP.sealGlyph), who).toBeGreaterThanOrEqual(7);
  });
});

describe('lint rule 10 reads content/script.ts', () => {
  const def = pageById('c1p2')!;
  test('a known key passes; an unknown key is an error', () => {
    expect(lintPage({ ...def, lines: { intro: ['c1.intro.1'] } }, SCRIPT).errors).toEqual([]);
    const errors = lintPage({ ...def, lines: { intro: ['c1.intro.99'], onEvent: [{ when: { type: 'ride' }, line: 'nope.line' }] } }, SCRIPT).errors;
    expect(errors.map((e) => e.ids[0])).toEqual(['c1.intro.99', 'nope.line']);
  });

  test('尾聲 and 番外 (#135): named, timed and lined, outside the 月亮線\'s eleven stations', () => {
    expect(CHAPTERS.map((c) => c.chapter)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(chapterName(ENDING_CHAPTER)).toBe('尾聲');
    expect(chapterName(BONUS_CHAPTER)).toBe('番外');
    expect(chapterInfo(ENDING_CHAPTER)).toMatchObject({ title: '抓周', landmark: '家', time: '10:00', pages: 1 });
    expect(chapterInfo(BONUS_CHAPTER)).toMatchObject({ title: '象山的日出', landmark: '象山' });
    expect(chapterLine(ENDING_CHAPTER, 1)).toBe('尾聲');
    expect(cardLines(ENDING_CHAPTER)).toEqual(['e.intro.1']);
    // § 5.5 exactly: the dawn, the family, the first words, the post-credits
    expect(SCRIPT['e.dawn.2'].text).toBe('哎唷，摩卡真乖，顧規暝。');
    expect(SCRIPT['e.end.2']).toEqual({ who: 'baby', text: '……摩卡。' });
    expect(SCRIPT['e.end.8'].text).toBe('第二個字，也不是爸爸！');
    expect(SCRIPT['e.post.6']).toEqual({ who: 'pa', text: '下一站：兩歲。' });
    for (const key of [...DAWN_BEATS.flat(), ...POST_BEATS.flat(), ...endLines(ENDING_CHAPTER), 'e.credits.pack']) expect(SCRIPT[key], key).toBeDefined();
    for (const t of [...CREDITS.flatMap((c) => [c.role, ...c.names]), CREDITS_DEDICATION]) expect(textLength(t)).toBeLessThanOrEqual(MAX_LINE_CHARS);
  });
});
