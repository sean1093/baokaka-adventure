import { describe, expect, it } from 'vitest';
import { TEST_MAP } from '../../artlab/testMap';
import { MAPS } from './maps';
import { isSolid } from './path';
import type { GameMap } from './types';
import { MAX_LIGHTS, validateMap } from './validate';

const errorsOf = (map: GameMap): string[] => {
  const errors: string[] = [];
  validateMap(map, errors);
  return errors;
};

describe('map lights and ambient FX (#13)', () => {
  it('the art lab test map is valid, and so is every old map with its new lights', () => {
    expect(errorsOf(TEST_MAP)).toEqual([]);
    for (const map of Object.values(MAPS)) expect(errorsOf(map), map.id).toEqual([]);
  });

  it('rejects neon on a map not flagged neon (§ 4.3)', () => {
    const errors = errorsOf({ ...TEST_MAP, neon: undefined });
    expect(errors.filter((error) => error.includes('neon is only allowed'))).toHaveLength(2);
    expect(errorsOf({ ...MAPS.park, lights: [{ c: 8, r: 5, kind: 'neon' }] }).join()).toMatch(/neon is only allowed/);
  });

  it('standing lights need a whole walkable tile of their own, and block it', () => {
    expect(errorsOf({ ...MAPS.park, lights: [{ c: 8.5, r: 5, kind: 'lamp' }] }).join()).toMatch(/needs a whole tile/);
    expect(errorsOf({ ...MAPS.park, lights: [{ c: 0, r: 3, kind: 'lamp' }] }).join()).toMatch(/unwalkable ground/);
    expect(errorsOf({ ...MAPS.park, lights: [{ c: 6, r: 3, kind: 'lantern' }] }).join()).toMatch(/overlaps npc uncle/);
    expect(isSolid(MAPS.park, 8, 5)).toBe(true);
    // Windows and moon glints are only light: they may sit between tiles and block nothing
    expect(errorsOf({ ...MAPS.park, lights: [{ c: 8.5, r: 5.5, kind: 'window' }] })).toEqual([]);
  });

  it('checks the grid, colours and the light budget', () => {
    expect(errorsOf({ ...MAPS.park, lights: [{ c: 40, r: 5, kind: 'window' }] }).join()).toMatch(/outside the grid/);
    expect(errorsOf({ ...MAPS.park, lights: [{ c: 4, r: 5, kind: 'window', color: 'pink' }] }).join()).toMatch(/expected #RRGGBB/);
    const many = Array.from({ length: MAX_LIGHTS + 1 }, () => ({ c: 4.5, r: 5.5, kind: 'window' as const }));
    expect(errorsOf({ ...MAPS.park, lights: many }).join()).toMatch(/at most 24/);
  });

  it('keeps ambient FX within six elements, without repeats, ripples only with water', () => {
    expect(errorsOf({ ...MAPS.park, ambient: ['fireflies', 'steam', 'leaves'] }).join()).toMatch(/at most 6/);
    expect(errorsOf({ ...MAPS.park, ambient: ['leaves', 'leaves'] }).join()).toMatch(/listed twice/);
    expect(errorsOf({ ...MAPS.park, ambient: ['ripples'] }).join()).toMatch(/ripples need water/);
    expect(errorsOf({ ...MAPS.beach, ambient: ['ripples'] })).toEqual([]);
  });
});

describe('battle backdrops (#14)', () => {
  it('accepts a known backdrop key and rejects an unknown one', () => {
    expect(errorsOf({ ...MAPS.park, backdrop: 'daan' })).toEqual([]);
    expect(errorsOf({ ...MAPS.park, backdrop: 'generic' })).toEqual([]);
    expect(errorsOf({ ...MAPS.park, backdrop: 'nowhere' }).join()).toMatch(/unknown battle backdrop "nowhere"/);
  });
});
