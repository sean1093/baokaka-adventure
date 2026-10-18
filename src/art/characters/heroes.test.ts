import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HERO_BACKLIGHT, SPEAKERS } from '../../quest/engine/events';
import { HEROES, SPELLS } from '../../quest/engine/heroes';
import { CAT } from '../palette';
import rigCss from '../rig.css?raw';
import { LODS, SPRITE_BUDGETS, type Lod, type SpriteComponent } from '../sprite';
import { SPRITES } from '../sprites';
import { bannedElements, countElements, markupBytes } from '../spriteStats';
import { actionPose } from './actions';
import { Baokaka, BAOKAKA_POSE_NAMES } from './baokaka/Baokaka';
import { BAOKAKA_EXPRS } from './baokaka/Head';
import { BAOKAKA_SKELETONS } from './baokaka/skeleton';
import { MOCHA_EXPRS } from './mocha/Head';
import { Mocha, MOCHA_TAILS } from './mocha/Mocha';
import { MOCHA_POSES, MOCHA_SKELETONS } from './mocha/skeleton';

/** 寶咖咖 and 摩卡貓 (#16): budgets for every pose and face, the anatomy rules, the wiring. */

const render = (Art: SpriteComponent, props: Record<string, unknown>) => renderToStaticMarkup(createElement(Art, props as never));
const frames = (markup: string) => Math.max(1, (markup.match(/<svg[\s>]/g) ?? []).length);
type V = readonly [number, number];
const cross = (a: V, b: V, c: V) => (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);

describe('heroes: budgets and lint (§ 8.2)', () => {
  const cases: [string, SpriteComponent, readonly string[], readonly string[], Record<string, unknown>][] = [
    ['baokaka', Baokaka, BAOKAKA_POSE_NAMES, BAOKAKA_EXPRS, { lock: true }],
    ['mocha', Mocha, MOCHA_POSES, MOCHA_EXPRS, { tail: 'puff' }],
  ];
  it.each(cases)('%s: every pose × expression × LOD within the hero budget, no banned elements', (_name, Art, poses, exprs, extra) => {
    const budget = SPRITE_BUDGETS.hero;
    for (const pose of poses)
      for (const expr of exprs)
        for (const lod of LODS) {
          const markup = render(Art, { lod, pose, expr, ...extra });
          const n = frames(markup);
          expect(countElements(markup) / n, `${pose} ${expr} ${lod}`).toBeLessThanOrEqual(budget.elements);
          expect(markupBytes(markup) / n, `${pose} ${expr} ${lod}`).toBeLessThanOrEqual(budget.bytes);
          expect(bannedElements(markup)).toEqual([]);
        }
  });

  it('the registry draws the heroes with the new sprites', () => {
    expect(SPRITES.baokaka).toBe(Baokaka);
    expect(SPRITES.mochaCat).toBe(Mocha);
  });

  it('LOD defaults: crawl and walk on the map, sitting in battle, a head crop for the icon', () => {
    expect(render(Baokaka, { lod: 'map' })).toContain('rig--pose-crawl');
    expect(render(Baokaka, { lod: 'battle' })).toContain('rig--pose-throw');
    expect(render(Mocha, { lod: 'map' })).toContain('rig--pose-walk');
    expect(render(Mocha, { lod: 'battle' })).toContain('rig--pose-sit');
    expect(render(Baokaka, { lod: 'icon' })).toMatch(/viewBox="64 14 76 76"/);
    expect(render(Baokaka, { lod: 'icon' })).not.toContain('part-leg-near');
    expect(render(Mocha, { lod: 'icon' })).not.toContain('part-tail');
  });

  it('states pick the face and the KO pose', () => {
    expect(render(Baokaka, { lod: 'battle', state: 'ko' })).toContain('rig--rest');
    expect(render(Mocha, { lod: 'battle', state: 'ko' })).toContain('rig--pose-loaf');
    // An explicit expression always wins over the state's
    const teary = render(Baokaka, { lod: 'battle', expr: 'teary' });
    expect(render(Baokaka, { lod: 'battle', state: 'hurt', expr: 'teary' }).replace(/rig--hurt/, 'rig--idle').replace(/(id="|url\(#|href="#)[^")]+/g, '$1')).toBe(
      teary.replace(/(id="|url\(#|href="#)[^")]+/g, '$1'),
    );
  });

  it('expressions swap the eyes and mouth groups, never the head (§ 2.5)', () => {
    const hair = (markup: string) => /<g class="baokaka-hair-front[\s\S]*$/.exec(markup)?.[0].replace(/(id="|url\(#|href="#)[^")]+/g, '$1').slice(0, 2000);
    const [a, b] = [render(Baokaka, { lod: 'battle', expr: 'happy' }), render(Baokaka, { lod: 'battle', expr: 'surprised' })];
    expect(a).not.toBe(b);
    expect(hair(a)).toBe(hair(b));
    for (const part of ['eyes', 'mouth']) expect(a).toContain(`baokaka-${part} part-${part}`);
    expect(render(Mocha, { lod: 'battle' })).toContain('mocha-eye-near part-eye-near');
  });

  it("Mocha's tail moods are separate drawings; flick gets its animation class", () => {
    const tails = MOCHA_TAILS.map((tail) => render(Mocha, { lod: 'battle', tail }));
    expect(new Set(tails.map((m) => /class="mocha-tail[\s\S]*?<\/g>/.exec(m)?.[0])).size).toBe(MOCHA_TAILS.length);
    expect(tails[MOCHA_TAILS.indexOf('flick')]).toContain('rig--tail-flick');
  });

  it('the 金鎖片 shows only with `lock`', () => {
    expect(render(Baokaka, { lod: 'battle', pose: 'stand', lock: true })).toContain('part-lock');
    expect(render(Baokaka, { lod: 'battle', pose: 'stand' })).not.toContain('part-lock');
  });

  it('every LOD renders (no throw) for every state', () => {
    for (const Art of [Baokaka, Mocha] as SpriteComponent[])
      for (const lod of LODS as readonly Lod[]) for (const state of ['idle', 'attack', 'hurt', 'ko', 'victory', 'walk']) expect(() => render(Art, { lod, state })).not.toThrow();
  });
});

describe('heroes: anatomy (§ 2.1, § 2.2, § 2.6)', () => {
  it('寶咖咖 stands ≈ 3.4 heads tall (the sheet’s ruler: crown of the hair to the soles)', () => {
    const J = BAOKAKA_SKELETONS.stand;
    // The head is authored with its skull from y -50 to the chin at 46 and its hair from -58, at scale 0.56; the soles sit on y ≈ 186
    const skull = 96 * 0.56;
    const crown = J.head[1] - 58 * 0.56;
    const heads = (186 - crown) / skull;
    expect(heads).toBeGreaterThan(3);
    expect(heads).toBeLessThan(3.5);
  });

  it('limbs attach at the shoulders and hips', () => {
    for (const J of Object.values(BAOKAKA_SKELETONS)) {
      // Shoulders below the neck, hips beside the pelvis
      expect(J.shN[1]).toBeGreaterThan(J.neck[1] - 1);
      expect(Math.hypot(J.hipN[0] - J.pel[0], J.hipN[1] - J.pel[1])).toBeLessThan(16);
      expect(Math.hypot(J.hipF[0] - J.pel[0], J.hipF[1] - J.pel[1])).toBeLessThan(16);
    }
  });

  it('crawl: palms under the shoulders, thighs vertical under the hips, palms and knees on the floor', () => {
    const J = BAOKAKA_SKELETONS.crawl;
    expect(Math.abs(J.wrN[0] - J.shN[0])).toBeLessThan(20);
    expect(Math.abs(J.wrF[0] - J.shF[0])).toBeLessThan(10);
    expect(Math.abs(J.knN[0] - J.hipN[0])).toBeLessThan(8);
    expect(Math.abs(J.knF[0] - J.hipF[0])).toBeLessThan(8);
    for (const p of [J.wrN, J.wrF, J.knN, J.knF]) expect(p[1]).toBeGreaterThan(160);
    // Flat back: shoulders and pelvis within a few units of height
    expect(Math.abs(J.shN[1] - J.pel[1])).toBeLessThan(8);
  });

  it('knees bend forward and the cat’s hocks fold backwards (facing right)', () => {
    const S = BAOKAKA_SKELETONS.stand;
    // Standing knees are soft: a slight bend, not hyper-extended backwards
    expect(Math.abs(cross(S.hipN, S.knN, S.anN))).toBeLessThan(120);
    const W = MOCHA_SKELETONS.walk;
    // Digitigrade hind leg: the knee points forward (right of the hip line), the hock behind it
    expect(W.knN[0]).toBeGreaterThan(W.hipN[0]);
    expect(W.hkN[0]).toBeLessThan(W.knN[0]);
    expect(W.hkF[0]).toBeLessThan(W.knF[0]);
    // …so the knee and the hock turn in opposite directions
    expect(Math.sign(cross(W.hipN, W.knN, W.hkN))).toBe(-Math.sign(cross(W.knN, W.hkN, W.pwN)));
  });

  it('摩卡: straight front legs when sitting; round paws with toe splits (three show sitting, four walking)', () => {
    const S = MOCHA_SKELETONS.sit;
    expect(Math.abs(S.wrN[0] - S.shN[0])).toBeLessThan(4);
    expect(Math.abs(S.wrF[0] - S.shF[0])).toBeLessThan(4);
    for (const [pose, paws] of [['sit', 3], ['walk', 4], ['pounce', 4]] as const) {
      const markup = render(Mocha, { lod: 'portrait', pose });
      // Each paw carries its three toe splits (one path per paw), filled in the paw-split tone
      expect(markup.split(`fill="${CAT.pawSplit}"`).length - 1, pose).toBe(paws);
    }
  });
});

describe('heroes: wiring', () => {
  it('moves act out their pose (§ 5.1, § 5.2)', () => {
    expect(actionPose(HEROES.baokaka.attackFx)).toBe('throw');
    expect(actionPose(SPELLS.throwBlock.fx, SPELLS.throwBlock.fxAccent)).toBe('throw');
    expect(actionPose(SPELLS.bigCry.fx, SPELLS.bigCry.fxAccent)).toBe('cry');
    expect(actionPose(SPELLS.clapClap.fx, SPELLS.clapClap.fxAccent)).toBe('clap');
    expect(actionPose(SPELLS.firstStep.fx, SPELLS.firstStep.fxAccent)).toBe('firstStep');
    expect(actionPose(HEROES.mocha.attackFx)).toBe('pounce');
    expect(actionPose(SPELLS.purr.fx)).toBeUndefined();
  });

  it('dialogue backlights: butter for 寶咖咖, tabby orange for 摩卡', () => {
    expect(HERO_BACKLIGHT.baokaka).toBe('butter');
    expect(HERO_BACKLIGHT.mocha).toBe('tabby');
    expect(SPEAKERS.mochaNpc.color).toBe('tabby');
  });

  it('rig.css: the walk flipbook steps opacity only, and reduced motion stops it', () => {
    const flip = /@keyframes rig-flip \{([\s\S]*?)\n\}/.exec(rigCss)?.[1] ?? '';
    expect(flip).toContain('opacity');
    expect(flip).not.toMatch(/transform|visibility/);
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(rigCss)?.[1] ?? '';
    expect(reduced).toContain('.rig-flip > svg');
    expect(rigCss).toContain('.reduce-motion .rig-flip > svg');
  });

  it('rig.css: standing, he wobbles (an idle loop on the stand pose)', () => {
    expect(rigCss).toMatch(/\.rig--idle\.rig--pose-step \.rig-body \{\s*animation: rig-wobble/);
    expect(render(Baokaka, { lod: 'battle', pose: 'stand' })).toContain('rig--idle rig--gait-crawl rig--pose-step');
  });
});
