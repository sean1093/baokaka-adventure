import { describe, expect, test } from 'vitest';
import { initialState, replay, step } from '../core';
import type { PageDef, SimState, SolutionStep } from '../core/types';
import { CHAPTER_NOTES, NOTE_POOL } from '../content/album';
import { registry } from '../pages';
import {
  AUTO_SNAP_MS,
  PHOTO_LOOP_MS,
  PHOTO_PEAK_MS,
  albumNotes,
  approachAt,
  keptPhoto,
  mochaInFrame,
  photoFrameAt,
  photoReady,
  poolIndex,
  spreadPage,
  wowMeter,
} from './photo';

/** The photo moment and the album notes (#103; GDD § 2.9, § 5.6). */

const spread = registry.pageById('c1p6')!;

/** Every state a step list passes through, in order. */
function states(def: PageDef, steps: readonly SolutionStep[]): SimState[] {
  let s = initialState(def);
  const out = [s];
  for (const tick of replay(def, steps).ticks) {
    s = step(def, s, tick.input).state;
    out.push(s);
  }
  return out;
}

describe('photoFrameAt: the frame a 咔嚓 takes (§ 2.9 step 3)', () => {
  test.each([
    [0, 'B'],
    [PHOTO_PEAK_MS - 401, 'B'],
    [PHOTO_PEAK_MS - 400, 'A'],
    [PHOTO_PEAK_MS, 'A'],
    [PHOTO_PEAK_MS + 400, 'A'],
    [PHOTO_PEAK_MS + 401, 'C'],
    [PHOTO_LOOP_MS - 1, 'C'],
    // The loop repeats
    [PHOTO_LOOP_MS, 'B'],
    [PHOTO_LOOP_MS + PHOTO_PEAK_MS, 'A'],
    [2 * PHOTO_LOOP_MS + PHOTO_PEAK_MS + 600, 'C'],
  ] as const)('at %i ms → %s', (ms, frame) => {
    expect(photoFrameAt(ms)).toBe(frame);
  });

  test('the auto snap comes after two loops, never before', () => {
    expect(AUTO_SNAP_MS).toBe(6000);
    expect(AUTO_SNAP_MS).toBeGreaterThan(PHOTO_LOOP_MS);
  });
});

describe('the 「哇！」 meter and the slow approach', () => {
  test('the meter rises to 1 at the peak, then eases back', () => {
    expect(wowMeter(0)).toBeLessThan(0.2);
    expect(wowMeter(PHOTO_PEAK_MS)).toBeCloseTo(1);
    expect(wowMeter(PHOTO_PEAK_MS / 2)).toBeLessThan(wowMeter(PHOTO_PEAK_MS));
    expect(wowMeter(PHOTO_LOOP_MS - 1)).toBeLessThan(0.6);
    expect(wowMeter(PHOTO_LOOP_MS - 1)).toBeGreaterThan(0.5);
    for (let t = 0; t < PHOTO_LOOP_MS; t += 50) {
      expect(wowMeter(t)).toBeGreaterThanOrEqual(0);
      expect(wowMeter(t)).toBeLessThanOrEqual(1);
    }
  });

  test('he is there by the grab', () => {
    expect(approachAt(0)).toBe(0);
    expect(approachAt(PHOTO_PEAK_MS / 2)).toBeCloseTo(0.5);
    expect(approachAt(PHOTO_PEAK_MS)).toBe(1);
    expect(approachAt(PHOTO_LOOP_MS - 1)).toBe(1);
  });
});

describe('photoReady: 2 edges from the treasure with a clear path (§ 2.9 step 1)', () => {
  const to: SolutionStep[] = [{ tap: 'lid' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }, { set: 'cart', to: 'platform' }, { wait: 'settle' }, { mocha: 'canopy' }, { wait: 'goal' }];
  const run = states(spread, to);

  test('only once the treasure is reachable, and before the grab', () => {
    const first = run.findIndex((s) => photoReady(spread, s));
    expect(first).toBeGreaterThan(0);
    // Not while the pigeon sits on the cart's step (the 雞腿 is out of reach)
    for (const s of run.slice(0, first)) expect(s.creatures.pigeon === 'roof' && s.parts.cart === 'platform' && s.parts.exitGate === 'open').toBe(false);
    expect(run[first].creatures.pigeon).toBe('roof');
    expect(run[first].baby.node).toBe('cartStep');
    expect(run[first].done).toBe(false);
    expect(run.at(-1)!.done).toBe(true);
    expect(photoReady(spread, run.at(-1)!)).toBe(false);
  });

  test('never on a page that is not a spread', () => {
    const c1p2 = registry.pageById('c1p2')!;
    const steps: SolutionStep[] = [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { wait: 'settle' }, { set: 'train', to: 'full' }, { wait: 'goal' }];
    for (const s of states(c1p2, steps)) expect(photoReady(c1p2, s)).toBe(false);
  });
});

describe('mochaInFrame: +M (§ 2.9)', () => {
  test('摩卡 on the cart\'s awning is inside the photoRect; on the station clock he is not', () => {
    const start = initialState(spread);
    expect(start.mocha.perch).toBe('clock');
    expect(mochaInFrame(spread, start)).toBe(false);
    const onAwning = states(spread, [{ set: 'cart', to: 'platform' }, { mocha: 'canopy' }, { wait: 'settle' }]).at(-1)!;
    expect(onAwning.mocha.perch).toBe('canopy');
    expect(mochaInFrame(spread, onAwning)).toBe(true);
  });

  test('travelling or without a photoRect, he is not in it', () => {
    const onAwning = states(spread, [{ set: 'cart', to: 'platform' }, { mocha: 'canopy' }, { wait: 'settle' }]).at(-1)!;
    expect(mochaInFrame(spread, { ...onAwning, mocha: { ...onAwning.mocha, perch: null, path: ['clockTop', 'canopyTop'], to: 'canopy' } })).toBe(false);
    expect(mochaInFrame({ ...spread, photoRect: undefined }, onAwning)).toBe(false);
  });
});

describe('albumNotes (§ 5.6)', () => {
  test('poolIndex is (chapter × 7 + frame) mod poolSize, A = 0, B = 1, C = 2', () => {
    expect(poolIndex(1, 'B', 3)).toBe(2);
    expect(poolIndex(1, 'C', 3)).toBe(0);
    expect(poolIndex(1, 'B', 2)).toBe(0);
    expect(poolIndex(1, 'C', 2)).toBe(1);
    expect(poolIndex(2, 'B', 3)).toBe(0);
  });

  test('chapter 1, Frame A (with or without 摩卡): the chapter row', () => {
    const row = ['嘴巴開開，雞腿比臉還大！', '第一次搭捷運，就這麼開心。', '這個手勢……是在說『爸』吧？', '我在左下角。很帥。'];
    expect(albumNotes(1, { frame: 'A', mocha: true }).map((n) => n.text)).toEqual(row);
    expect(albumNotes(1, { frame: 'A', mocha: false }).map((n) => n.text)).toEqual(row);
    expect(albumNotes(1, { frame: 'A', mocha: true }).map((n) => n.speaker)).toEqual(['grandma', 'mom', 'dad', 'mocha']);
  });

  test('chapter 1, Frame B: the pool at index 2 (摩卡\'s at 0, in or out)', () => {
    expect(albumNotes(1, { frame: 'B', mocha: false }).map((n) => n.text)).toEqual(['這張要放在客廳。', '這個表情，跟爸爸一模一樣。', '這張，我要設成手機桌布。', '又沒有我。……喔。']);
    expect(albumNotes(1, { frame: 'B', mocha: true }).at(-1)!.text).toBe('我入鏡了。這張可以。');
  });

  test('chapter 1, Frame C: the pool at index 0 (摩卡\'s at 1)', () => {
    expect(albumNotes(1, { frame: 'C', mocha: false }).map((n) => n.text)).toEqual(['怎麼拍，乖孫都古錐。', '有點糊，可是好有感覺。', '構圖不錯，爸爸給九十分。', '大家手機裡，都是你的照片。']);
    expect(albumNotes(1, { frame: 'C', mocha: true }).at(-1)!.text).toBe('我的尾巴，很上相。');
  });

  test('every chapter row is complete, and every note fits a line (≤ 30 characters)', () => {
    for (let c = 1; c <= 10; c++) {
      for (const frame of ['A', 'B', 'C'] as const) {
        for (const mocha of [false, true]) {
          const notes = albumNotes(c, { frame, mocha });
          expect(notes).toHaveLength(4);
          for (const n of notes) {
            expect(n.text.length).toBeGreaterThan(0);
            expect([...n.text].length).toBeLessThanOrEqual(30);
          }
        }
      }
      expect(Object.keys(CHAPTER_NOTES[c])).toEqual(['grandma', 'mom', 'dad', 'mocha']);
    }
    for (const pool of Object.values(NOTE_POOL)) expect(pool.length).toBeGreaterThan(0);
  });
});

describe('the album\'s pages', () => {
  test('a kept photo is { frame, mocha, at }', () => {
    expect(keptPhoto({ frame: 'C', mocha: true }, 1234)).toEqual({ frame: 'C', mocha: true, at: 1234 });
  });

  test('spreadPage: the chapter\'s spread, else its last page', () => {
    expect(spreadPage(1, registry)?.id).toBe('c1p6');
    expect(spreadPage(0, registry)?.id).toBe('c0p4');
    expect(spreadPage(5, registry)?.id).toBe('c5p6');
    expect(spreadPage(6, registry)).toBeUndefined();
  });

});
