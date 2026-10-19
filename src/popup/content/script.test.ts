import { describe, expect, test } from 'vitest';
import { contrastRatio } from '../../art/contrast';
import { POPUP } from '../../art/palette';
import { MAX_LINE_CHARS, lintPage, textLength } from '../core/lint';
import { pageById } from '../pages';
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
});
