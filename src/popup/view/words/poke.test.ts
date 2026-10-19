import { describe, expect, test } from 'vitest';
import c1p3 from '../../core/fixtures/c1p3';
import { initialState, step } from '../../core';
import { nodePos } from '../../core/graph';
import { targetPoint, wantPoke } from './poke';
import { BURST_R, PAGE_R, sayRadius } from './SayFx';

/** Before any word: tapping Baokaka shows 「要！」 pointing at his target (GDD § 6 risk 1; #99). */

describe('the 「要！」 poke', () => {
  const s = step(c1p3, initialState(c1p3), { t: 'none' }).state;

  test('points at what he wants: the bead past the gates', () => {
    expect(s.baby.target).toBe('bead');
    const bead = nodePos(c1p3, s, 'B1')!;
    expect(targetPoint(c1p3, s)).toEqual([bead[0], bead[1] - 16]);
    expect(wantPoke(c1p3, s)).toEqual({ who: 'baby', bark: 'want', text: '要！', tick: s.tick, point: [bead[0], bead[1] - 16] });
  });

  test('with nothing to want, the bubble alone', () => {
    const lost = { ...s, baby: { ...s.baby, target: null } };
    expect(targetPoint(c1p3, lost)).toBeNull();
    expect(wantPoke(c1p3, lost).point).toBeUndefined();
  });
});

describe('the say effect ring', () => {
  test('each word\'s reach (§ 2.4): 嗶！ 120, 掰掰 / 哇！ 160, 咻—— 140, 飛機！ the page, a burst for the rest', () => {
    expect(sayRadius('beep')).toBe(120);
    expect(sayRadius('bye')).toBe(160);
    expect(sayRadius('wow')).toBe(160);
    expect(sayRadius('whoosh')).toBe(140);
    expect(sayRadius('plane')).toBe(PAGE_R);
    for (const w of ['no', 'hug', 'together'] as const) expect(sayRadius(w)).toBe(BURST_R);
  });
});
