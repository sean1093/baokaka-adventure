import { describe, expect, test } from 'vitest';
import { initialState } from '../../core';
import type { SimEvent } from '../../core/events';
import type { SimState } from '../../core/types';
import { pageById } from '../../pages';
import { BARK_TICKS, WORD_BUBBLE, barkLog, barksOf, type BarkShow } from './barks';

/** Bark bubbles (#98; GDD § 2.2.1, § 2.3): which line each character says on a tick, and how long it stays. */

const s0 = initialState(pageById('c1p2')!);
const at = (tick: number, baby: Partial<SimState['baby']> = {}): SimState => ({ ...s0, tick, baby: { ...s0.baby, ...baby } });
const texts = (prev: SimState, state: SimState, events: SimEvent[]) => barksOf(prev, state, events).map((b) => `${b.who}:${b.text}`);

describe('barksOf', () => {
  test.each([
    ['want', '要！'],
    ['wantWant', '要！要！'],
    ['meow', '喵喵！'],
    ['milk', 'ㄋㄟㄋㄟ'],
    ['pretty', '好看！'],
  ] as const)('Baokaka barks %s as 「%s」', (bark, text) => {
    expect(texts(at(0), at(1), [{ type: 'bark', bark }])).toEqual([`baby:${text}`]);
  });

  test('「這個！」 when he grabs (the completion beat, § 2.8; #101), over a bark on the same tick', () => {
    expect(texts(at(0), at(1, { mode: 'grabbing' }), [{ type: 'bark', bark: 'want' }, { type: 'grab', id: 'bead' }])).toEqual(['baby:這個！']);
  });

  test('好吃！ on eating, 哇—— when he starts crying (not every tick of it)', () => {
    expect(texts(at(0), at(1), [{ type: 'eat', id: 'milk' }])).toEqual(['baby:好吃！']);
    expect(texts(at(0, { mode: 'looking' }), at(1, { mode: 'crying' }), [{ type: 'cry' }])).toEqual(['baby:哇——']);
    expect(texts(at(1, { mode: 'crying' }), at(2, { mode: 'crying' }), [{ type: 'cry' }])).toEqual([]);
  });

  test.each([
    ['catArrive', '喵。'],
    ['mochaStare', '……'],
    ['mochaNope', '喵？'],
    ['mochaPuff', '不要。'],
    ['strain', '我坐上去？'],
  ] as const)('Mocha on %s: 「%s」', (type, text) => {
    expect(texts(at(0), at(1), [{ type, id: 'x' }])).toEqual([`mocha:${text}`]);
  });

  test('the stare wins over the arrival on the same tick; both speakers can bark at once', () => {
    expect(texts(at(0), at(1), [{ type: 'catArrive', id: 'p' }, { type: 'mochaStare', id: 'cup' }, { type: 'bark', bark: 'want' }])).toEqual(['baby:要！', 'mocha:……']);
  });

  test('Mocha purrs when Baokaka starts cuddling him', () => {
    expect(texts(at(0, { mode: 'moving', target: 'mocha' }), at(1, { mode: 'cuddling', target: 'mocha' }), [])).toEqual(['mocha:呼嚕嚕……']);
    expect(texts(at(1, { mode: 'cuddling', target: 'mocha' }), at(2, { mode: 'cuddling', target: 'mocha' }), [])).toEqual([]);
  });

  test('抱抱 with no carrier in reach: his word, and Mocha purrs (#120) — if Mocha is on the page', () => {
    const saying = at(1, { mode: 'saying' });
    expect(texts(at(0), saying, [{ type: 'hug' }, { type: 'hugNobody' }])).toEqual(['baby:抱抱', 'mocha:呼嚕嚕……']);
    const away = { ...saying, mocha: { perch: null, path: [] } };
    expect(texts(at(0), away, [{ type: 'hug' }, { type: 'hugNobody' }])).toEqual(['baby:抱抱']);
  });
});

describe('barkLog', () => {
  test('keeps each speaker\'s latest bark for BARK_TICKS ticks', () => {
    const b1 = barksOf(at(0), at(1), [{ type: 'bark', bark: 'want' }]);
    let log = barkLog([], b1, 1);
    expect(log.map((b) => b.text)).toEqual(['要！']);
    log = barkLog(log, barksOf(at(1), at(2), [{ type: 'bark', bark: 'wantWant' }]), 2);
    expect(log.map((b) => b.text)).toEqual(['要！要！']);
    log = barkLog(log, [], 2 + BARK_TICKS - 1);
    expect(log).toHaveLength(1);
    log = barkLog(log, [], 2 + BARK_TICKS);
    expect(log).toEqual([]);
  });

  test('a restarted page drops barks from the future', () => {
    expect(barkLog(barksOf(at(4), at(5), [{ type: 'bark', bark: 'want' }]), [], 0)).toEqual([]);
  });
});

describe('a said word (#99)', () => {
  test('on the say tick the word is his big speech bubble, over any other bark', () => {
    const shown = barksOf(at(0), at(1, { mode: 'saying' }), [{ type: 'beep', id: 'A1' }, { type: 'bark', bark: 'want' }]);
    expect(shown).toEqual([{ who: 'baby', bark: 'word', text: '嗶！', tick: 1, size: WORD_BUBBLE }]);
    expect(WORD_BUBBLE).toBeGreaterThan(1);
  });
  test('不要！ (no event): read off the grown refused set', () => {
    const shown = barksOf(at(0, { target: 'bead' }), at(1, { mode: 'saying', refused: ['bead'] }), []);
    expect(shown.map((b) => b.text)).toEqual(['不要！']);
  });
});

test('the 「要！」 poke holds its three ticks over his own barks (#99), not over a said word', () => {
  const poke: BarkShow = { who: 'baby', bark: 'want', text: '要！', tick: 4, point: [300, 400] };
  const own: BarkShow = { who: 'baby', bark: 'wantWant', text: '要！要！', tick: 5 };
  expect(barkLog([poke], [own], 5)).toEqual([poke]);
  expect(barkLog([poke, own], [], 7)).toEqual([own]);
  const word: BarkShow = { who: 'baby', bark: 'word', text: '嗶！', tick: 5, size: 1.6 };
  expect(barkLog([poke], [word], 5)).toEqual([word]);
});
