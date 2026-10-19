import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { WORDS } from '../../core/words';
import { bookLayout } from '../geometry';
import { BottomBar } from '../hud/BottomBar';
import { WORD_ICON, WORD_SEAL } from './icons';
import { ringSafeArea } from './ringLayout';
import { WordCard } from './WordCard';
import { WordRing } from './WordRing';

/** The word ring and the word card as markup (#99): labels, sizes (R5, R6), the glow, the hand, the card's text. */

const noop = () => undefined;
const safe = ringSafeArea(bookLayout(390, 844));
const fontSizes = (markup: string) => [...markup.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));

describe('WordRing', () => {
  const ring = (props: Partial<Parameters<typeof WordRing>[0]> = {}) =>
    renderToStaticMarkup(createElement(WordRing, { around: [195, 420], words: ['beep'], safe, reduced: false, onSay: noop, onClose: noop, ...props }));

  test('a disc per word and 「好了」, 72 px buttons named by their word', () => {
    const html = ring({ words: [...WORDS] });
    const labels = [...html.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(labels).toEqual(['好了', '嗶！', '掰掰', '不要！', '哇！', '抱抱', '飛機！', '咻——', '一起']);
    expect(html.match(/width:72px;height:72px/g)).toHaveLength(9);
  });

  test('every glyph is ≥ 20 px (R5)', () => {
    for (const size of fontSizes(ring({ words: [...WORDS] }))) expect(size).toBeGreaterThanOrEqual(20);
  });

  test('the new word glows; the tutorial\'s hand taps its disc', () => {
    expect(ring()).not.toContain('data-fresh=');
    const html = ring({ fresh: 'beep', hand: 'beep' });
    expect(html).toContain('data-word="beep" data-fresh=""');
    expect(html).toContain('data-ring-hand="beep"');
    expect(html).toContain('data-ghost-hand');
  });

  test('reduced motion: fades only (no turn, no pop, no breathing glow)', () => {
    const html = ring({ fresh: 'beep', reduced: true });
    expect(html).not.toMatch(/wr-turn|wr-upright|wr-pop|wr-glow/);
    expect(html).toContain('wr-fade');
  });
});

describe('WordCard', () => {
  test('嗶！: the seal, 「嗶！」 big, 「閘門開開」, ≥ 20 px', () => {
    const html = renderToStaticMarkup(createElement(WordCard, { learn: 'beep', vw: 390, cy: 400, reduced: false, onDone: noop }));
    expect(html).toContain('data-word-card="beep"');
    expect(html).toContain('>嗶！</text>');
    expect(html).toContain('>閘門開開</text>');
    for (const size of fontSizes(html)) expect(size).toBeGreaterThanOrEqual(20);
  });
  test('第一步！ alone, no effect line', () => {
    const html = renderToStaticMarkup(createElement(WordCard, { learn: 'walk', vw: 390, cy: 400, reduced: true, onDone: noop }));
    expect([...html.matchAll(/<text /g)]).toHaveLength(1);
    expect(html).toContain('wr-fade');
  });
});

test('every word and growth stage has an icon and a seal colour', () => {
  expect(Object.keys(WORD_ICON).sort()).toEqual(Object.keys(WORD_SEAL).sort());
  expect(new Set(WORDS.map((w) => WORD_SEAL[w])).size).toBe(WORDS.length);
});

test('the portrait glows during the tutorial (still under reduced motion)', () => {
  const html = (glow: boolean, reduced = false) => renderToStaticMarkup(createElement(BottomBar, { glow, reduced }));
  expect(html(false)).not.toContain('data-glow');
  expect(html(true)).toContain('wr-portrait-glow');
  expect(html(true, true)).not.toContain('wr-portrait-glow');
});
