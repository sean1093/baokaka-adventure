import { describe, expect, test } from 'vitest';
import { initialState } from '../../core';
import { compilePart } from '../../core/presets';
import { step } from '../../core/step';
import type { PageDef } from '../../core/types';
import { PAGES, pageById } from '../../pages';
import { dialSealAt, driveBelts, gaugeR, levelDial, swingPath, swingStops, wheelLevels } from './cues';

/** The late-game legibility cues (#221, friction 13–15): what each reads off the page data. */

const page = (id: string): PageDef => pageById(id)!;
const part = (def: PageDef, id: string) => def.parts.find((p) => p.id === id)!;

describe('level wheels (friction 13)', () => {
  test('7-5, 8-5 and 9-4: each stop\'s level, the lift following the wheel (drained · half · full)', () => {
    expect(wheelLevels(page('c7p5'), part(page('c7p5'), 'teapot'))).toEqual([0, 0.5, 1]);
    expect(wheelLevels(page('c8p5'), part(page('c8p5'), 'tap'))).toEqual([0, 0.5, 1]);
    expect(wheelLevels(page('c9p4'), part(page('c9p4'), 'dial'))).toEqual([0, 0.5, 1]);
  });

  test('exactly those three wheels in the book are level wheels (8-2\'s two-stop valves are on/off switches)', () => {
    const level = PAGES.flatMap((def) => def.parts.filter((p) => wheelLevels(def, p) !== null).map((p) => `${def.id}:${p.id}`));
    expect(level).toEqual(['c7p5:teapot', 'c8p5:tap', 'c9p4:dial']);
  });

  test('the dial: a gauge per stop, the current one ringed; the seal between two stops', () => {
    const html = levelDial([0, 0.5, 1], 32, 2);
    expect(html.match(/data-dial-gauge=/g)).toHaveLength(3);
    expect(html).toContain('data-dial-stop="2"');
    // The seal sits at least a gauge away from every stop's gauge
    const [sx, sy] = dialSealAt(3, 32);
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3;
      const R = 32 * 1.12 + gaugeR(32) + 3;
      expect(Math.hypot(sx - R * Math.sin(a), sy + R * Math.cos(a))).toBeGreaterThan(gaugeR(32) + 11);
    }
  });
});

describe('coupled drives (friction 15)', () => {
  test('10-3: one trunk from the crank to the tower\'s column, a branch up to the top section and down to the bottom', () => {
    const { trunks, branches } = driveBelts(page('c10p3'));
    expect(trunks).toHaveLength(1);
    expect(trunks[0][1]).toEqual([210, 374]);
    expect(branches.map((b) => b.part).sort()).toEqual(['low', 'top']);
    for (const b of branches) expect(b.points[0]).toEqual([210, 374]);
  });

  test('no other page has a wheel drive (9-6\'s sail drives its boom by the wind)', () => {
    expect(PAGES.filter((def) => driveBelts(def).branches.length > 0).map((d) => d.id)).toEqual(['c10p3']);
  });
});

describe('swings (friction 14)', () => {
  const def = page('c10p4');
  const damper = part(def, 'damper');

  test('10-4: the damper\'s three stops where the sphere carries him', () => {
    expect(swingStops(def, damper)).toEqual([[150, 456], [210, 476], [270, 456]]);
  });

  test('the far stop wears the paw while Mocha isn\'t aboard', () => {
    expect(swingPath(swingStops(def, damper)!, 128, 1, 2, true)).toContain('data-badge="locked"');
    expect(swingPath(swingStops(def, damper)!, 128, 1, 2, false)).not.toContain('data-badge');
  });

  test('a 咻—— that can\'t swing it on without the cat: it strains (a UI event) and nothing changes', () => {
    let s0 = initialState(def);
    for (let i = 0; i < 20 && s0.baby.mode !== 'reaching'; i++) s0 = step(def, s0, { t: 'none' }).state;
    const r = step(def, s0, { t: 'say', word: 'whoosh' });
    expect(r.events.some((e) => e.type === 'strain' && e.id === 'damper' && e.state === 'centre')).toBe(true);
    expect(r.state.parts.damper).toBe('centre');
  });

  test('every blowable with a stateWhen asks for Mocha (the strain\'s 「我坐上去？」 is about her weight)', () => {
    for (const d of PAGES) {
      for (const p of d.parts.filter((q) => q.preset === 'blowable' && q.stateWhen !== undefined)) {
        for (const s of compilePart(p).states) if (p.stateWhen![s] !== undefined) expect(JSON.stringify(p.stateWhen![s]), `${d.id}:${p.id}`).toContain('mochaAt');
      }
    }
  });
});
