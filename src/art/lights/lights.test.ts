import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TEST_MAP } from '../../artlab/testMap';
import { MAPS } from '../../quest/engine/maps';
import { MAX_AMBIENT_ELEMENTS, type GameMap } from '../../quest/engine/types';
import { AMBIENT_REGISTRY, ambientSpots } from '../fx/Ambient';
import { GLOW, skyAt } from '../palette';
import { sceneRim } from '../scene';
import { SkyLayer } from '../sky/SkyLayer';
import { LightLayer } from './LightLayer';
import { LIGHT_SPECS, hasFixture, lightBox, placeLights } from './lights';

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

describe('light sources (§ 2.7, § 8.4)', () => {
  it('places every map light plus a warm glow at each door', () => {
    const lights = placeLights(TEST_MAP);
    expect(lights.filter((light) => light.kind !== 'door')).toHaveLength(TEST_MAP.lights!.length);
    expect(lights.filter((light) => light.kind === 'door')).toHaveLength(TEST_MAP.exits.length);
  });

  it('neon defaults to pink, takes a colour override, and glows above its tile', () => {
    const neon = placeLights(TEST_MAP).filter((light) => light.kind === 'neon');
    expect(neon.map((light) => light.color)).toEqual([GLOW.neonPink, GLOW.neonCyan]);
    for (const light of neon) expect(light.y - light.gy).toBe(LIGHT_SPECS.neon.height);
  });

  it('streaks only on wet ground', () => {
    const lights = placeLights(TEST_MAP);
    // A lamp on the brick sidewalk: brick is dry
    expect(lights.find((light) => light.key === 'l0')?.wet).toBe(false);
    // Neon over the marble (glossy) reflects
    expect(lights.find((light) => light.key === 'l6')?.wet).toBe(true);
  });

  it('the light box holds every bloom, pool and streak', () => {
    const lights = placeLights(TEST_MAP);
    const box = lightBox(lights)!;
    for (const light of lights) {
      expect(light.gx - light.spec.bloom).toBeGreaterThanOrEqual(box.x);
      expect(light.gy - light.spec.bloom).toBeGreaterThanOrEqual(box.y);
      expect(light.y + light.spec.streak).toBeLessThanOrEqual(box.y + box.h);
    }
    expect(lightBox([])).toBeNull();
  });

  it('draws in one screen-blended SVG with gradients only', () => {
    const markup = renderToStaticMarkup(createElement(LightLayer, { map: TEST_MAP }));
    expect(count(markup, /<svg/g)).toBe(1);
    expect(markup).toContain('mix-blend-mode:screen');
    expect(markup).not.toMatch(/filter/);
  });

  it('fixtures stand only for lamps, lanterns and neon', () => {
    expect(['lamp', 'lantern', 'neon', 'window', 'screen', 'moon'].filter((kind) => hasFixture(kind as never))).toEqual(['lamp', 'lantern', 'neon']);
  });
});

describe('ambient FX (§ 4.1, § 8.5)', () => {
  it('Ch1–2 kinds are registered; the rest wait for their chapters', () => {
    expect(Object.keys(AMBIENT_REGISTRY).sort()).toEqual(['fireflies', 'leaves', 'ripples']);
  });

  it('caps a map at six animated elements and skips kinds without art', () => {
    const busy: GameMap = { ...TEST_MAP, ambient: ['fireflies', 'leaves', 'ripples', 'steam'] };
    const spots = ambientSpots(busy, '00:00');
    expect(spots.length).toBeLessThanOrEqual(MAX_AMBIENT_ELEMENTS);
    expect(spots.length).toBeGreaterThan(0);
    expect(ambientSpots({ ...TEST_MAP, ambient: ['steam'] }, '00:00')).toEqual([]);
  });

  it('ripples land on water, deterministically', () => {
    const a = ambientSpots({ ...TEST_MAP, ambient: ['ripples'] }, '00:00');
    const b = ambientSpots({ ...TEST_MAP, ambient: ['ripples'] }, '00:00');
    expect(a.map((spot) => [spot.x, spot.y])).toEqual(b.map((spot) => [spot.x, spot.y]));
    expect(a).toHaveLength(2);
  });
});

describe('SkyLayer (§ 2.7, § 3.2)', () => {
  const sky = (time: string, interior = false) =>
    renderToStaticMarkup(createElement(SkyLayer, { time, interior, width: 390, height: 600, shift: { x: 0, y: 0 } }));

  it('changes between midnight and sunrise', () => {
    const midnight = sky('00:00');
    const dawn = sky('05:29');
    expect(midnight).not.toBe(dawn);
    expect(midnight).toContain(skyAt('00:00').top);
    expect(dawn).toContain(skyAt('05:29').top);
  });

  it('blurs at most eight elements, all inside the static sky', () => {
    for (const time of ['00:00', '03:00', '05:29']) expect(count(sky(time), / filter="url/g), time).toBeLessThanOrEqual(8);
  });

  it('interiors show a dark room, not stars and skyline', () => {
    const room = sky('00:00', true);
    expect(room).toContain('data-sky="room"');
    expect(room).not.toMatch(/filter/);
  });

  it('is the same markup on every render (seeded)', () => {
    expect(sky('02:00')).toBe(sky('02:00'));
  });
});

describe('scene rim (§ 2.4, § 4.3)', () => {
  it('neon maps tint characters pink; local hours take the lamps; otherwise the clock', () => {
    expect(sceneRim('03:00', true)).toBe(GLOW.neonPink);
    expect(sceneRim('00:00')).toBe(skyAt('00:00').rim);
    expect(sceneRim('03:00')).not.toBe(skyAt('03:00').rim);
  });
});

/** Art direction § 8.4: nothing that moves may use a filter. Blur lives only in the static sky. */
describe('no filters on moving things', () => {
  const SOURCES = import.meta.glob(['../../quest/components/IsoMap.tsx', '../fx/*.tsx', './*.tsx', '../tiles/*.tsx', '../../quest/screens/WorldScreen.tsx'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  it('the map, actors, lights, ambient FX and ground carry no filter', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThanOrEqual(5);
    for (const [path, source] of Object.entries(SOURCES)) expect(source, path).not.toMatch(/filter[=:]|feGaussianBlur|backdrop-filter/);
  });

  it('every old map still renders its lights', () => {
    for (const map of Object.values(MAPS)) expect(() => renderToStaticMarkup(createElement(LightLayer, { map }))).not.toThrow();
  });
});
