import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BattleFx, HERO_EMBLEM, fxPlanFor } from '../../quest/components/BattleFx';
import { FX_ACCENTS, FX_KINDS, HERO_ORDER, type Battle, type BattleEvent, type FxAccent, type FxKind, type Who } from '../../quest/engine/types';
import {
  ANTICIPATION_MS,
  ATTACK_MS,
  FLASH_GAP_MS,
  FX_NODE_BUDGET,
  FX_NODE_MS,
  HIT_STOP_MS,
  IMPACT_AT,
  PARTICLES_MAX,
  PARTICLES_MIN,
  RECOVER_MS,
  SHAPE_NODES,
  STRIKE_MS,
  WASH_MAX_OPACITY,
  WASH_MS,
  flashAllowed,
  particlesFor,
  planFx,
  type Spot,
} from './battleFx';
import CSS from './battleFx.css?raw';

/** Issue #15 / art direction § 7.9–7.10: timing, budget, limits and the reduced-motion fallback. */


const spots = (count: number): Spot[] => Array.from({ length: count }, (_, i) => ({ x: 0.5 + i * 0.1, y: 0.4 + i * 0.05 }));
const CASTER = { spot: { x: 0.2, y: 0.7 }, emblem: 'block' as const };

describe('timing (§ 7.9)', () => {
  it('is anticipation 120 → strike 90 → hit-stop 60 → recover 220, impact at the strike', () => {
    expect([ANTICIPATION_MS, STRIKE_MS, HIT_STOP_MS, RECOVER_MS]).toEqual([120, 90, 60, 220]);
    expect(ATTACK_MS).toBe(490);
    expect(IMPACT_AT).toBe(210);
  });

  it('every target lands at or after the strike', () => {
    const plan = planFx({ kind: 'cry', caster: CASTER, spots: spots(3), flash: true, seed: 1 });
    expect(plan.targets.map((target) => target.delay)).toEqual([210, 260, 310]);
  });
});

describe('node budget (≤ 40 in flight)', () => {
  const accents: (FxAccent | undefined)[] = [undefined, ...FX_ACCENTS];
  // Foes stand at most three to a fight; only one-shape kinds (heals, sparkles) land on four heroes
  it('holds for every kind, accent and target count, with 6–10 particles each', () => {
    for (const kind of FX_KINDS)
      for (const accent of accents)
        for (let count = 1; count <= 4; count += 1)
          for (const caster of [null, CASTER]) {
            const plan = planFx({ kind, accent, caster, spots: spots(count), flash: true, seed: 3 });
            const label = `${kind}${accent ? `+${accent}` : ''} ×${count}`;
            expect(plan.nodes, label).toBeLessThanOrEqual(FX_NODE_BUDGET);
            for (const target of plan.targets) {
              if (count <= 3 || SHAPE_NODES[kind] === 1) expect(target.particles.length, label).toBeGreaterThanOrEqual(PARTICLES_MIN);
              expect(target.particles.length, label).toBeLessThanOrEqual(PARTICLES_MAX);
            }
          }
  });

  it('an all-target skill on three foes draws exactly the planned nodes, at most 40', () => {
    const plan = planFx({ kind: 'claw', caster: CASTER, spots: spots(3), flash: true, seed: 9 });
    expect(plan.nodes).toBeLessThanOrEqual(FX_NODE_BUDGET);
    expect(plan.nodes).toBeGreaterThan(30);
  });

  it('particles are deterministic per seed and spread around the target', () => {
    expect(particlesFor('blocks', 8, 4)).toEqual(particlesFor('blocks', 8, 4));
    expect(particlesFor('blocks', 8, 4)).not.toEqual(particlesFor('blocks', 8, 5));
    const burst = particlesFor('impact', 10, 2);
    expect(new Set(burst.map((p) => Math.sign(p.dx))).size).toBe(2);
    expect(particlesFor('heal', 8, 1).every((p) => p.dy < 0)).toBe(true);
    expect(particlesFor('feather', 8, 1).every((p) => p.dy > 0)).toBe(true);
  });
});

describe('flashes and washes (§ 7.10)', () => {
  it('washes only for several targets (or a typhoon), and only when a flash is allowed', () => {
    expect(planFx({ kind: 'cry', caster: null, spots: spots(3), flash: true, seed: 1 }).wash).not.toBeNull();
    expect(planFx({ kind: 'cry', caster: null, spots: spots(3), flash: false, seed: 1 }).wash).toBeNull();
    expect(planFx({ kind: 'claw', caster: null, spots: spots(1), flash: true, seed: 1 }).wash).toBeNull();
    expect(planFx({ kind: 'typhoon', caster: null, spots: spots(1), flash: true, seed: 1 }).wash).not.toBeNull();
  });

  it('allows at most two flashes a second', () => {
    expect(FLASH_GAP_MS).toBe(500);
    expect(flashAllowed(1000, null)).toBe(true);
    expect(flashAllowed(1499, 1000)).toBe(false);
    expect(flashAllowed(1500, 1000)).toBe(true);
  });

  it('the shield is one arch over the whole party', () => {
    const plan = planFx({ kind: 'shield', caster: CASTER, spots: spots(4), flash: true, seed: 1 });
    expect(plan.targets).toHaveLength(1);
    expect(plan.targets[0].span).toBeCloseTo(0.3);
    expect(plan.wash).toBeNull();
  });
});

describe('battleFx.css', () => {
  const keyframes = (name: string) => {
    const start = CSS.indexOf(`@keyframes ${name} {`);
    expect(start, name).toBeGreaterThanOrEqual(0);
    let depth = 0;
    for (let i = CSS.indexOf('{', start); i < CSS.length; i += 1) {
      if (CSS[i] === '{') depth += 1;
      if (CSS[i] === '}' && --depth === 0) return CSS.slice(start, i + 1);
    }
    return '';
  };

  it('animates transform and opacity only, with no filters', () => {
    expect(CSS).not.toMatch(/filter\s*:/);
    const properties = new Set([...CSS.matchAll(/@keyframes[\s\S]*?\n}\n/g)].flatMap((block) => [...block[0].matchAll(/^\s+([a-z-]+):/gm)].map((m) => m[1])));
    expect([...properties].sort()).toEqual(['animation-timing-function', 'opacity', 'transform']);
  });

  it('every animation class has its keyframes and stays within FX_NODE_MS', () => {
    const rules = [...CSS.matchAll(/\.fx-a-([a-z-]+) \{\s*(?:transform-origin[^;]*;\s*)?animation: ([a-z-]+) (\d+)ms/g)];
    expect(rules.length).toBeGreaterThanOrEqual(20);
    for (const [, , name, ms] of rules) {
      keyframes(name);
      expect(Number(ms), name).toBeLessThanOrEqual(FX_NODE_MS);
    }
  });

  it('the wash peaks at ≤ 0.35 for ≤ 200ms', () => {
    expect(CSS).toMatch(new RegExp(`\\.fx-a-wash \\{\\s*animation: fx-wash ${WASH_MS}ms`));
    expect(WASH_MS).toBeLessThanOrEqual(200);
    const peaks = [...keyframes('fx-wash').matchAll(/opacity: ([\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...peaks)).toBe(WASH_MAX_OPACITY);
    expect(WASH_MAX_OPACITY).toBeLessThanOrEqual(0.35);
  });

  it('under reduced motion only the impact shape stays, as an opacity-only still fade', () => {
    expect(keyframes('fx-still')).not.toMatch(/transform/);
    const media = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(media).toMatch(/\.fx-ring,\s*\.fx-particle,\s*\.fx-glyph,\s*\.fx-wash \{\s*display: none;/);
    expect(media).toMatch(/\.fx-shape,\s*\.fx-accent \{\s*animation: fx-still/);
    expect(CSS).toMatch(/\.reduce-motion \.fx-shape,\s*\.reduce-motion \.fx-accent \{\s*animation: fx-still/);
  });
});

describe('<BattleFx>', () => {
  const who = (side: 'foe', slot: number): Who => ({ side, slot });
  const castOnAll = (fx: FxKind, accent?: FxAccent): Pick<Battle, 'events' | 'party' | 'heroes' | 'step'> & Battle => {
    const events: BattleEvent[] = [
      { kind: 'act', who: { side: 'hero', hero: 'baokaka' }, name: '哇哇大哭', fx, arcane: true, ...(accent ? { accent } : {}) },
      ...[0, 1, 2].map((slot): BattleEvent => ({ kind: 'hit', who: who('foe', slot), amount: 9, crit: false })),
    ];
    const hero = { hp: 10, mp: 5, guard: false, shield: false };
    return { events, party: [...HERO_ORDER], heroes: { baokaka: hero, mocha: hero, magpie: hero, bear: hero }, step: 4 } as unknown as Battle;
  };
  const spot = (target: Who): Spot => (target.side === 'hero' ? { x: 0.2, y: 0.8 } : { x: 0.6 + target.slot * 0.1, y: 0.4 });

  it('draws the planned number of nodes for every kind, with no filter or text', () => {
    for (const kind of FX_KINDS) {
      const battle = castOnAll(kind);
      const html = renderToStaticMarkup(createElement(BattleFx, { battle, spot, flash: true }));
      const plan = fxPlanFor(battle, spot, true);
      const nodes = (html.match(/data-fx-node=/g) ?? []).length;
      expect(nodes, kind).toBe(plan?.nodes);
      expect(nodes, kind).toBeLessThanOrEqual(FX_NODE_BUDGET);
      expect(html, kind).not.toMatch(/filter|<text|<image|foreignObject/);
    }
  });

  it('puts the caster’s emblem in the glyph ring, and nothing for a foe or a plain attack', () => {
    const html = renderToStaticMarkup(createElement(BattleFx, { battle: castOnAll('cry'), spot, flash: true }));
    expect(html).toContain(`data-fx-glyph="${HERO_EMBLEM.baokaka}"`);
    const swing = castOnAll('blocks');
    swing.events[0] = { ...swing.events[0], arcane: false } as BattleEvent;
    expect(renderToStaticMarkup(createElement(BattleFx, { battle: swing, spot, flash: true }))).not.toContain('data-fx-glyph');
    expect(new Set(Object.values(HERO_EMBLEM))).toEqual(new Set(['block', 'paw', 'feather', 'moon']));
  });

  it('gives each layer its own gradient ids', () => {
    const html = renderToStaticMarkup(
      createElement('div', null, createElement(BattleFx, { battle: castOnAll('heal'), spot, flash: true }), createElement(BattleFx, { battle: castOnAll('heal'), spot, flash: true })),
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref);
  });

  it('draws nothing for a step without a look (guard, flee)', () => {
    const battle = castOnAll('cry');
    battle.events = [{ kind: 'guard', who: { side: 'hero', hero: 'mocha' } }];
    expect(renderToStaticMarkup(createElement(BattleFx, { battle, spot, flash: true }))).toBe('');
  });
});
