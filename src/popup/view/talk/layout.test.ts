import { describe, expect, test } from 'vitest';
import { loadLines } from '../../content/script';
import { nodePos } from '../../core/graph';
import { initialState } from '../../core';
import { pageById } from '../../pages';
import { spriteBox, spriteHead, type SpriteId } from '../../sprites';
import { bookLayout, type Pt } from '../geometry';
import { goalBox, layoutTalk, type TalkActor } from './layout';
import { rideWithin } from './Talk';
import { TALK_BOUNDS, overlap, talkScale, type Box } from './place';

/** Everything said at once (#98, requirement 2): nothing covers Baokaka or the goal, at both viewports. */

const actor = (at: Pt, sprite: SpriteId): TalkActor => {
  const h = spriteHead(sprite);
  const b = spriteBox(sprite);
  return { at, head: [at[0] + h[0], at[1] + h[1]], box: { ...b, x: at[0] + b.x, y: at[1] + b.y } };
};
const inPage = (b: Box) => b.y >= TALK_BOUNDS.y && b.x >= TALK_BOUNDS.x && b.x + b.w <= TALK_BOUNDS.x + TALK_BOUNDS.w;

const def = pageById('c1p2')!;
const s0 = initialState(def);
const baby = actor(nodePos(def, s0, 'L1')!, 'baokaka.sit');
const mocha = actor(nodePos(def, s0, 'bench')!, 'mocha.sit');
const goal = goalBox(nodePos(def, s0, 'R2')!);

describe.each([
  ['390x844', bookLayout(390, 844).scale],
  ['375x667', bookLayout(375, 667).scale],
])('layoutTalk at %s', (_name, scale) => {
  const k = talkScale(scale);

  test('a full beat (strip, 廣播姊姊, 摩卡) plus a thought bubble and two barks: none over him or the goal', () => {
    const layout = layoutTalk({
      k,
      baby,
      mocha,
      goal,
      tudigong: [def.tudigong.x, def.tudigong.y],
      thought: { kind: 'want', target: 'shiny', reach: true },
      barks: [
        { who: 'baby', bark: 'wantWant', text: '要！要！', tick: 1 },
        { who: 'mocha', bark: 'arrive', text: '喵。', tick: 1 },
      ],
      beat: loadLines(['c1.intro.1', 'c1.intro.2', 'c1.intro.3']),
    });
    const boxes = [layout.thought!.box, ...layout.barks.map((b) => b.box), layout.strip!.box, ...layout.subs.map((s) => s.box)];
    expect(boxes).toHaveLength(6);
    for (const b of boxes) {
      expect(overlap(b, baby.box)).toBe(0);
      expect(overlap(b, goal)).toBe(0);
      expect(inPage(b)).toBe(true);
    }
    expect(layout.strip!.box.y).toBeLessThan(20);
    expect(layout.horn).not.toBeNull();
    expect(layout.subs.map((s) => [s.line.who, s.rides, s.from !== null])).toEqual([
      ['pa', null, true],
      ['mocha', 'mocha', true],
    ]);
  });

  test('the thought bubble over him reaching at the gap clears the goal and the page edges', () => {
    const s = actor([190, 430], 'baokaka.reach');
    const layout = layoutTalk({ k, baby: s, mocha, goal, tudigong: null, thought: { kind: 'want', target: 'shiny', reach: true }, barks: [], beat: null });
    expect(layout.thought!.clear).toBe(true);
    expect(overlap(layout.thought!.box, goal)).toBe(0);
    expect(overlap(layout.thought!.box, s.box)).toBe(0);
  });

  test('an off-page voice (阿嬤) hangs under the strip with its label and no spring', () => {
    const layout = layoutTalk({ k, baby, mocha: null, goal, tudigong: null, thought: null, barks: [], beat: [
      { key: 'a', who: 'nar', label: null, text: '……然後，摩卡就睡著了。' },
      { key: 'b', who: 'grandma', label: '阿嬤', text: '摩卡，今暗顧好喔。' },
    ] });
    const [sub] = layout.subs;
    expect(sub!.from).toBeNull();
    expect(sub!.label).toBe('阿嬤');
    expect(sub!.box.y).toBeGreaterThanOrEqual(layout.strip!.box.y + layout.strip!.box.h);
  });
});

describe('perch paws and riders (#183)', () => {
  const c1p1 = pageById('c1p1')!;
  const s = initialState(c1p1);
  const paw = (perch: string): Box => {
    const p = nodePos(c1p1, s, c1p1.perches.find((x) => x.id === perch)!.node)!;
    return { x: p[0] - 27, y: p[1] - 33, w: 54, h: 54 };
  };
  const k = talkScale(bookLayout(390, 844).scale);

  test("1-1's opening announcements keep off the strap and rack paws", () => {
    const marks = [paw('strap2'), paw('rack')];
    const layout = layoutTalk({
      k,
      baby: actor(nodePos(c1p1, s, 'door')!, 'baokaka.sit'),
      mocha: actor(nodePos(c1p1, s, 'strap1')!, 'mocha.sit'),
      goal: goalBox(nodePos(c1p1, s, 'priority')!),
      tudigong: [c1p1.tudigong.x, c1p1.tudigong.y],
      thought: { kind: 'want', target: 'shiny', reach: true },
      barks: [],
      beat: loadLines(['rec.pa.ride.1', 'rec.pa.ride.2']),
      touch: marks,
      marks,
    });
    expect(layout.subs).toHaveLength(2);
    for (const sub of layout.subs) for (const m of marks) expect(overlap(sub.box, m)).toBe(0);
    expect(overlap(layout.thought!.box, marks[0]) + overlap(layout.thought!.box, marks[1])).toBe(0);
  });

  test('a riding bubble never leaves the page: its offset is cut at the bounds', () => {
    const box = { x: 40, y: 30, w: 120, h: 50 };
    expect(rideWithin(box, [5, -4])).toEqual([5, -4]);
    // A long trip held mid-way (1-6's photo moment): the bubble stops at the top and left edges
    expect(rideWithin(box, [-200, -300])).toEqual([TALK_BOUNDS.x - box.x, TALK_BOUNDS.y - box.y]);
    // One already past an edge where it was placed is never pushed further out, nor jumped in
    const out = { x: 0, y: 0, w: 120, h: 50 };
    expect(rideWithin(out, [-10, -10])).toEqual([0, 0]);
    expect(rideWithin(out, [10, 10])).toEqual([10, 10]);
  });
});
