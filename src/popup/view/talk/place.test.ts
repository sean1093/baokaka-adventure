import { describe, expect, test } from 'vitest';
import { bookLayout } from '../geometry';
import {
  MIN_TEXT_PX,
  TALK_BOUNDS,
  TALK_FONT,
  barkCandidates,
  clampInto,
  overlap,
  pickBox,
  preferSide,
  talkScale,
  textEm,
  thoughtCandidates,
  wrapText,
  type Box,
} from './place';

/** Bubble placement and text (#98): the flip, the fallbacks, the HUD edge, R5 text size, wrapping. */

const SIZE = { w: 104, h: 58 };
const inside = (b: Box) => b.x >= TALK_BOUNDS.x && b.y >= TALK_BOUNDS.y && b.x + b.w <= TALK_BOUNDS.x + TALK_BOUNDS.w && b.y + b.h <= TALK_BOUNDS.y + TALK_BOUNDS.h;
const centreX = (b: Box) => b.x + b.w / 2;

describe('talkScale: bubble text ≥ 20 screen px at every viewport (GDD R5)', () => {
  test.each([
    [390, 844],
    [375, 667],
    [360, 640],
    [430, 932],
    [768, 1024],
  ])('%i × %i', (w, h) => {
    const { scale } = bookLayout(w, h);
    const k = talkScale(scale);
    expect(TALK_FONT * k * scale).toBeGreaterThanOrEqual(MIN_TEXT_PX);
    expect(k).toBeGreaterThanOrEqual(1);
  });

  test('no growth when the book is drawn at 1:1 or larger', () => {
    expect(talkScale(1)).toBe(1);
    expect(talkScale(1.25)).toBe(1);
  });

  test('375 × 667 grows the bubbles by about 1.39', () => {
    expect(talkScale(bookLayout(375, 667).scale)).toBeCloseTo(1.39, 1);
  });
});

describe('pickBox and the thought bubble flip', () => {
  test('free page: the preferred side, right of his head', () => {
    const head = [120, 360] as const;
    const pick = pickBox(thoughtCandidates(head, SIZE, preferSide(head[0])), { hard: [] });
    expect(pick.index).toBe(0);
    expect(centreX(pick.box)).toBeGreaterThan(head[0]);
    expect(pick.box.y + pick.box.h).toBeLessThan(head[1]);
  });

  test('near the right edge it flips to his left and stays on the page', () => {
    const head = [360, 360] as const;
    expect(preferSide(head[0])).toBe(-1);
    const pick = pickBox(thoughtCandidates(head, SIZE, preferSide(head[0])), { hard: [] });
    expect(centreX(pick.box)).toBeLessThan(head[0]);
    expect(inside(pick.box)).toBe(true);
  });

  test('the goal on its side: it falls back to the other side', () => {
    const head = [200, 360] as const;
    const goal: Box = { x: 232, y: 270, w: 60, h: 60 };
    const pick = pickBox(thoughtCandidates(head, SIZE, 1), { hard: [goal] });
    expect(pick.clear).toBe(true);
    expect(pick.index).toBe(1);
    expect(overlap(pick.box, goal)).toBe(0);
    expect(centreX(pick.box)).toBeLessThan(head[0]);
  });

  test('both sides taken: it rises above them', () => {
    const head = [200, 360] as const;
    const hard: Box[] = [{ x: 0, y: 260, w: 390, h: 60 }];
    const pick = pickBox(thoughtCandidates(head, SIZE, 1), { hard });
    expect(pick.clear).toBe(true);
    expect(pick.box.y + pick.box.h).toBeLessThanOrEqual(260);
  });

  test('never above the HUD edge: a bubble near the top is pushed down onto the page', () => {
    const head = [200, 40] as const;
    const pick = pickBox(thoughtCandidates(head, SIZE, 1), { hard: [] });
    expect(pick.box.y).toBe(TALK_BOUNDS.y);
    expect(clampInto({ x: -30, y: -50, w: 50, h: 20 })).toEqual({ x: TALK_BOUNDS.x, y: TALK_BOUNDS.y, w: 50, h: 20 });
  });

  test('nowhere clear: the candidate covering least, hard boxes weighing more than soft ones', () => {
    const cands: Box[] = [
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 100, y: 100, w: 10, h: 10 },
    ];
    const pick = pickBox(cands, { hard: [{ x: 0, y: 0, w: 4, h: 4 }], soft: [{ x: 100, y: 100, w: 10, h: 10 }] }, { x: -1000, y: -1000, w: 3000, h: 3000 });
    expect(pick.index).toBe(1);
    expect(pick.clear).toBe(false);
  });

  test('a bark sits beside the head on its side when that is free', () => {
    const head = [200, 360] as const;
    const size = { w: 60, h: 34 };
    const right = pickBox(barkCandidates(head, size, 1), { hard: [] });
    expect(right.box.x).toBeGreaterThan(head[0]);
    const left = pickBox(barkCandidates(head, size, -1), { hard: [] });
    expect(left.box.x + left.box.w).toBeLessThan(head[0]);
  });
});

describe('wrapText', () => {
  test('one line when it fits', () => {
    expect(wrapText('請緊握扶手。', 12)).toEqual(['請緊握扶手。']);
  });

  test('breaks at clause ends and keeps the lines even (no orphan)', () => {
    expect(wrapText('台北最大的車站。也最好迷路。', 12.4)).toEqual(['台北最大的車站。', '也最好迷路。']);
    expect(wrapText('下一站，台北車站。Next station…', 12.4)).toEqual(['下一站，台北車站。', 'Next station…']);
  });

  test('a closing mark never starts a line; Latin words stay whole', () => {
    for (const m of [3, 4, 5, 6, 7]) {
      for (const text of ['……我是不是在哪裡看過你？', 'Excuse me… where is 101?', '呵呵，囡仔，慢慢仔來。']) {
        const lines = wrapText(text, m);
        expect(lines.join('').replace(/ /g, '')).toBe(text.replace(/ /g, ''));
        for (const l of lines.slice(1)) expect('，。、！？；：」…'.includes(l[0]!)).toBe(false);
        const words = new Set(text.split(' '));
        for (const l of lines) if (/[a-z]/i.test(l)) for (const w of l.split(' ')) expect(words.has(w), `${w} in ${text}`).toBe(true);
      }
    }
  });

  test('CJK is a square em, Latin about half', () => {
    expect(textEm('台北')).toBe(2);
    expect(textEm('ab')).toBeCloseTo(1.12);
  });
});
