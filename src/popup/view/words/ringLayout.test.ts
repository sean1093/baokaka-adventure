import { describe, expect, test } from 'vitest';
import { WORDS } from '../../core/words';
import { bookLayout, toScreen, type Pt } from '../geometry';
import { DISC, DISC_GAP, MAX_STEP, RING_GUTTER, ringLayout, ringSafeArea } from './ringLayout';

/** The word ring's layout (#99; GDD § 2.4; bible § 7): 1–8 words, every viewport, anywhere on the page. */

const VIEWPORTS = [
  [390, 844],
  [375, 667],
  [360, 640],
  [430, 932],
  [320, 568],
] as const;

/** Where Baokaka might be (page units): corners and edges of the walkable page, and the middle. */
const SPOTS: Pt[] = [
  [20, 120],
  [195, 120],
  [370, 120],
  [20, 430],
  [195, 430],
  [370, 430],
  [20, 620],
  [195, 620],
  [370, 620],
];

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('ringLayout', () => {
  for (const [vw, vh] of VIEWPORTS) {
    const layout = bookLayout(vw, vh);
    const safe = ringSafeArea(layout);
    for (let n = 0; n <= WORDS.length; n++) {
      const words = WORDS.slice(0, n);
      test(`${n} word(s) at ${vw}×${vh}: every disc inside the safe area, none overlapping`, () => {
        for (const leftHand of [false, true]) {
          for (const spot of SPOTS) {
            const ring = ringLayout(toScreen(layout, spot), words, { leftHand, safe });
            expect(ring.slots).toHaveLength(n + 1);
            for (const slot of ring.slots) {
              const [x, y] = slot.at;
              expect(x - DISC / 2).toBeGreaterThanOrEqual(safe.x - 1e-6);
              expect(x + DISC / 2).toBeLessThanOrEqual(safe.x + safe.w + 1e-6);
              expect(y - DISC / 2).toBeGreaterThanOrEqual(safe.y - 1e-6);
              expect(y + DISC / 2).toBeLessThanOrEqual(safe.y + safe.h + 1e-6);
            }
            for (let i = 0; i < ring.slots.length; i++) {
              // A full gap on every supported phone; only a full ring on a 320 px phone closes it up
              const gap = vw >= 360 ? DISC_GAP : 0;
              for (let j = i + 1; j < ring.slots.length; j++) expect(dist(ring.slots[i].at, ring.slots[j].at)).toBeGreaterThanOrEqual(DISC + gap - 1e-6);
            }
          }
        }
      });
    }
  }

  test('the safe area keeps the 16 px gutters, the HUD and the bottom bar clear', () => {
    const safe = ringSafeArea(bookLayout(390, 844));
    expect(safe.x).toBe(RING_GUTTER);
    expect(safe.x + safe.w).toBe(390 - RING_GUTTER);
    expect(safe.y).toBeGreaterThanOrEqual(96);
    expect(safe.y + safe.h).toBeLessThanOrEqual(844 - 120);
  });

  const safe = ringSafeArea(bookLayout(390, 844));
  const mid: Pt = [195, 420];

  test('「好了」 sits straight under him; the words start beside it on the thumb\'s side', () => {
    const right = ringLayout(mid, ['beep', 'bye'], { safe });
    expect(right.center).toEqual(mid);
    const [close, first, second] = right.slots;
    expect(close.kind).toBe('close');
    expect(close.at[0]).toBeCloseTo(mid[0]);
    expect(close.at[1]).toBeGreaterThan(mid[1]);
    // Right hand: the first word to the lower right, the next further round
    expect(first.kind === 'word' && first.word).toBe('beep');
    expect(first.at[0]).toBeGreaterThan(mid[0]);
    expect(first.at[1]).toBeGreaterThan(mid[1]);
    expect(second.at[1]).toBeLessThan(first.at[1]);
    // 左手模式: the mirror image
    const left = ringLayout(mid, ['beep', 'bye'], { safe, leftHand: true });
    left.slots.forEach((s, i) => {
      expect(s.at[0]).toBeCloseTo(2 * mid[0] - right.slots[i].at[0]);
      expect(s.at[1]).toBeCloseTo(right.slots[i].at[1]);
    });
  });

  test('few words stay close under the thumb; eight close the circle', () => {
    expect(ringLayout(mid, ['beep'], { safe }).step).toBe(MAX_STEP);
    const full = ringLayout(mid, WORDS, { safe });
    expect(full.step * full.slots.length).toBeCloseTo(360);
  });

  test('the ring slides in from a screen edge, keeping its shape', () => {
    const edge: Pt = [20, 700];
    const ring = ringLayout(edge, ['beep'], { safe });
    expect(ring.center).not.toEqual(edge);
    for (const s of ring.slots) expect(dist(s.at, ring.center)).toBeCloseTo(ring.radius);
  });

  test("M2's four words (嗶！ 掰掰 不要！ 哇！, #112): all on the thumb's side, the first two in the lower half, the last at the top", () => {
    const four = ['beep', 'bye', 'no', 'wow'] as const;
    for (const leftHand of [false, true]) {
      const ring = ringLayout(mid, four, { safe, leftHand });
      expect(ring.step).toBe(MAX_STEP);
      const words = ring.slots.filter((s) => s.kind === 'word');
      expect(words.map((s) => s.kind === 'word' && s.word)).toEqual([...four]);
      const side = leftHand ? -1 : 1;
      // Every word on the thumb's side of him (the last one, at the top, a hair past the middle at most)
      for (const w of words) expect(side * (w.at[0] - mid[0])).toBeGreaterThan(-DISC / 2);
      // 嗶！ and 掰掰 in the lower half (by its centre, 掰掰 sits just under his middle), 哇！ near the top
      expect(words[0].at[1]).toBeGreaterThan(mid[1]);
      expect(words[1].at[1]).toBeGreaterThan(mid[1] - 1);
      expect(words[3].at[1]).toBeLessThan(mid[1] - ring.radius * 0.9);
    }
  });

  test('discs are at least 64 px (bible § 7, R6)', () => {
    expect(DISC).toBeGreaterThanOrEqual(64);
  });
});
