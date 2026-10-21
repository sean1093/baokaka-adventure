import { describe, expect, test } from 'vitest';
import { loadLines } from '../../content/script';
import { nodePos } from '../../core/graph';
import { initialState } from '../../core';
import { pageById } from '../../pages';
import { spriteBox, spriteHead, type SpriteId } from '../../sprites';
import { bookLayout, type Pt } from '../geometry';
import { attractorNode } from '../../core/baby';
import { mochaNode } from '../../core/mocha';
import { stepGrowth } from '../../core/step';
import { fixtureFrame, popupFixture } from '../../dev/fixtures';
import { learnLines } from '../../game/words';
import { babyAnim } from '../actors/animMap';
import { targetsOf } from '../gestures';
import { BIG_TEXT_SCALE } from '../../game/settings';
import { goalBox, layoutTalk, talkClash, type TalkActor } from './layout';
import { bubbleShow, rideWithin } from './Talk';
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

/**
 * #197: a three-line beat over a reaching Baokaka at 375 × 667 covered his thought bubble. Scenes
 * built from the fixtures' frames as `PageView` builds them (the sprite his mode shows, Mocha at his
 * node, the goal, the touchables and the perch paws), at both viewports and in 大字.
 */
describe('a crowded beat never covers his thought bubble or him (#197)', () => {
  const sceneOf = (fixture: string, keys: readonly string[], k: number) => {
    const { def, state } = fixtureFrame(popupFixture(fixture)!);
    const sprite = babyAnim({ mode: state.baby.mode, edge: null, growth: stepGrowth(def, state) }).sprite;
    const mNode = mochaNode(def, state);
    const goal = def.attractors.find((a) => a.goal)!;
    const goalNode = attractorNode(def, state, goal);
    const targets = targetsOf(def, state);
    const box = (h: (typeof targets)[number]['hit']): Box => ('r' in h ? { x: h.cx - h.r, y: h.cy - h.r, w: 2 * h.r, h: 2 * h.r } : h);
    return {
      k,
      baby: actor(nodePos(def, state, state.baby.node)!, sprite),
      mocha: mNode === null ? null : actor(nodePos(def, state, mNode)!, 'mocha.sit'),
      goal: goalNode === null ? null : goalBox(nodePos(def, state, goalNode)!),
      tudigong: [def.tudigong.x, def.tudigong.y] as Pt,
      thought: bubbleShow(def, state),
      barks: [],
      beat: loadLines(keys),
      touch: targets.map((t) => box(t.hit)),
      marks: targets.filter((t) => t.kind === 'perch').map((t) => box(t.hit)),
    };
  };
  const cases: [string, string, readonly string[]][] = [
    ['5-3 learn beat', 'c5p3-start', learnLines('hug')],
    ['6-2 clerk cameo', 'c6p2-clerk', ['c6p2.clerk.1', 'c6p2.clerk.2', 'c6p2.clerk.3']],
  ];
  const sizes: [string, number][] = [
    ['390x844', talkScale(bookLayout(390, 844).scale)],
    ['375x667', talkScale(bookLayout(375, 667).scale)],
    ['390x844 大字', talkScale(bookLayout(390, 844).scale, BIG_TEXT_SCALE)],
  ];

  test.each(cases.flatMap(([what, fixture, keys]) => sizes.map(([at, k]) => [what, at, fixture, keys, k] as const)))('%s at %s', (_what, _at, fixture, keys, k) => {
    const scene = sceneOf(fixture, keys, k);
    expect(scene.thought).not.toBeNull();
    // The beat as the queue shows it: split where the layout says it stops fitting, each part laid out again
    let rest = scene.beat;
    while (rest.length > 0) {
      const { fit } = layoutTalk({ ...scene, beat: rest });
      expect(fit).toBeGreaterThanOrEqual(1);
      const layout = layoutTalk({ ...scene, beat: rest.slice(0, fit) });
      expect(layout.fit).toBe(Math.min(fit, rest.length));
      expect(talkClash(layout, scene)).toBe(0);
      for (const card of [...layout.subs.map((s) => s.box), ...(layout.strip ? [layout.strip.box] : [])]) {
        expect(overlap(card, layout.thought!.box)).toBe(0);
        expect(overlap(card, scene.baby.box)).toBe(0);
        expect(inPage(card)).toBe(true);
      }
      rest = rest.slice(fit);
    }
  });

  test('5-3: the learn beat stays one beat at 390 × 844, its cloud over his head at full size', () => {
    const layout = layoutTalk(sceneOf('c5p3-start', learnLines('hug'), sizes[0][1]));
    expect(layout.fit).toBe(3);
    expect(layout.thought!.tucked).toBe(false);
  });

  // 375 × 667 in 大字 (k ≈ 1.73): the game shows one line a beat there (#104); laid out whole, the
  // three lines cannot all clear him and the cloud, so the layout says where to split
  test.each(cases.map(([what, fixture, keys]) => [what, fixture, keys] as const))('%s at 375x667 大字 laid out whole: split, not drawn over the cloud', (_what, fixture, keys) => {
    const scene = sceneOf(fixture, keys, talkScale(bookLayout(375, 667).scale, BIG_TEXT_SCALE));
    const whole = layoutTalk(scene);
    expect(whole.fit).toBeLessThan(3);
    expect(whole.fit).toBeGreaterThanOrEqual(1);
    const part = layoutTalk({ ...scene, beat: scene.beat.slice(0, whole.fit) });
    expect(talkClash(part, scene)).toBe(0);
    expect(part.thought!.tucked).toBe(false);
  });

  test('6-2: at 375 × 667 the cameo stays one beat, its last line wrapped beside the full cloud', () => {
    const scene = sceneOf('c6p2-clerk', cases[1][2], sizes[1][1]);
    const layout = layoutTalk(scene);
    expect(layout.fit).toBe(3);
    expect(layout.thought!.tucked).toBe(false);
    expect(layout.subs[2]!.rows).toHaveLength(2);
  });
});

describe('talkClash', () => {
  test('counts a card over the cloud once and over him a hundred times', () => {
    const thought = { box: { x: 0, y: 0, w: 10, h: 10 }, c: [5, 5] as Pt, w: 92, h: 46, clear: true, tucked: false };
    const sub = (box: Box) => ({ line: { key: 'x', who: 'mocha' as const, label: null, text: 'x' }, box, rows: ['x'], label: null, from: null, rides: null });
    const scene = { baby: { at: [0, 0] as Pt, head: [0, 0] as Pt, box: { x: 20, y: 0, w: 10, h: 10 } }, goal: null };
    expect(talkClash({ thought, barks: [], strip: null, horn: null, subs: [sub({ x: 5, y: 0, w: 10, h: 10 })] }, scene)).toBe(50);
    expect(talkClash({ thought, barks: [], strip: null, horn: null, subs: [sub({ x: 25, y: 0, w: 10, h: 10 })] }, scene)).toBe(5000);
    expect(talkClash({ thought, barks: [], strip: null, horn: null, subs: [sub({ x: 40, y: 0, w: 10, h: 10 })] }, scene)).toBe(0);
  });
});
