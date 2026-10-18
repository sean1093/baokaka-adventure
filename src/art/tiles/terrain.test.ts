import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MAPS } from '../../quest/engine/maps';
import { TERRAIN, TERRAIN_ALIAS, surfaceOf } from '../../quest/engine/iso';
import type { Material, Terrain } from '../../quest/engine/types';
import { TEST_MAP } from '../../artlab/testMap';
import { TILES, gradeTiles } from '../palette';
import { Ground } from './Ground';
import { CUT_WALL_HEIGHT, buildGround, raisedHeight } from './ground';
import { TILE_MATERIALS, VARIANTS, tileHash, tileMarks, tileVariant, type Pattern } from './terrain';

const TERRAINS = Object.keys(TERRAIN) as Terrain[];
const MATERIALS = Object.keys(TILE_MATERIALS).filter((name) => name !== 'door') as Material[];
const PATTERNS = [...new Set(Object.values(TILE_MATERIALS).map((material) => material.pattern))] as Pattern[];

describe('tile materials (§ 4.4)', () => {
  it('terrain.ts covers every Terrain: a material to paint, or a structure', () => {
    for (const terrain of TERRAINS) {
      const surface = surfaceOf(terrain);
      if (surface === 'wall' || surface === 'fence' || surface === 'void') continue;
      expect(TILE_MATERIALS[surface], terrain).toBeDefined();
    }
  });

  it('old terrain names are aliased to new materials until #21', () => {
    for (const [legacy, material] of Object.entries(TERRAIN_ALIAS)) {
      expect(TILE_MATERIALS[material], legacy).toBeDefined();
      expect(TERRAIN[legacy as Terrain].walk).toBe(TERRAIN[material].walk);
    }
  });

  it('every material has a night ramp in the palette, graded per clock', () => {
    for (const material of MATERIALS) expect(TILES[TILE_MATERIALS[material].ramp], material).toBeDefined();
    const midnight = gradeTiles('00:00').tiles.grass.base;
    expect(midnight).toBe(TILES.grass.base);
    expect(gradeTiles('05:15').tiles.grass.base).not.toBe(midnight);
    expect(gradeTiles('05:15')).toBe(gradeTiles('05:15'));
  });

  it('only water is unwalkable among the materials', () => {
    for (const material of MATERIALS) expect(TERRAIN[material].walk, material).toBe(!TILE_MATERIALS[material].liquid);
  });
});

describe('seeded tile variants', () => {
  it('the picker is deterministic and in range', () => {
    for (const material of Object.values(TILE_MATERIALS)) {
      for (let c = 0; c < 12; c += 1) {
        for (let r = 0; r < 12; r += 1) {
          const variant = tileVariant(material, c, r, 99);
          expect(variant).toBe(tileVariant(material, c, r, 99));
          expect(variant).toBeGreaterThanOrEqual(0);
          expect(variant).toBeLessThan(VARIANTS);
        }
      }
    }
    expect(tileHash(3, 4, 1)).toBe(tileHash(3, 4, 1));
    expect(tileHash(3, 4, 1)).not.toBe(tileHash(4, 3, 1));
  });

  it('no checkerboard: base and alt are scattered, not by parity', () => {
    let parityMatches = 0;
    let alts = 0;
    const layouts = new Set<number>();
    for (let c = 0; c < 20; c += 1) {
      for (let r = 0; r < 20; r += 1) {
        const variant = tileVariant(TILE_MATERIALS.grass, c, r, 7);
        const alt = variant >= 3;
        alts += alt ? 1 : 0;
        parityMatches += alt === ((c + r) % 2 === 1) ? 1 : 0;
        layouts.add(variant % 3);
      }
    }
    expect(alts).toBeGreaterThan(40);
    expect(alts).toBeLessThan(200);
    expect(parityMatches).toBeLessThan(330);
    expect(parityMatches).toBeGreaterThan(70);
    expect(layouts.size).toBe(3);
  });

  it('the station marble *is* a checkerboard', () => {
    for (let c = 0; c < 8; c += 1) for (let r = 0; r < 8; r += 1) expect(tileVariant(TILE_MATERIALS.marble, c, r) >= 3).toBe((c + r) % 2 === 1);
  });

  it('every pattern draws a few marks, the same each time, within the tile budget', () => {
    for (const pattern of PATTERNS) {
      for (let layout = 0; layout < 3; layout += 1) {
        const marks = tileMarks(pattern, layout, layout);
        expect(marks.length, pattern).toBeGreaterThanOrEqual(1);
        // fill + marks + lit edge ≤ 12 elements (§ 8.2 tile budget)
        expect(marks.length + 2, pattern).toBeLessThanOrEqual(12);
        for (const mark of marks) expect(mark.d, pattern).toMatch(/^M/);
        expect(tileMarks(pattern, layout, layout)).toEqual(marks);
      }
    }
  });
});

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

describe('ground geometry', () => {
  it('has one tile per floor cell and a box around all of them', () => {
    for (const map of [...Object.values(MAPS), TEST_MAP]) {
      const ground = buildGround(map);
      let floors = 0;
      for (const row of map.grid) {
        for (const glyph of row) {
          const surface = surfaceOf(map.legend[glyph]);
          if (surface !== 'wall' && surface !== 'fence' && surface !== 'void') floors += 1;
        }
      }
      expect(ground.tiles.length, map.id).toBe(floors);
      for (const tile of ground.tiles) {
        expect(tile.x - 36).toBeGreaterThanOrEqual(ground.box.x);
        expect(tile.x + 36).toBeLessThanOrEqual(ground.box.x + ground.box.w);
        expect(tile.y + 18).toBeLessThanOrEqual(ground.box.y + ground.box.h);
      }
    }
  });

  it('walls are merged runs: a back wall shows one long face, not a zigzag', () => {
    const strip = { ...MAPS.home, id: 'home' as const, legend: { '#': 'wall', '.': 'wood' } as const, grid: ['######', '......'] };
    const wall = buildGround(strip).walls.find((group) => group.kind === 'wall');
    expect(wall).toBeDefined();
    // Six wall tiles in a row: six front faces side by side, and a side face only at the run's end
    // (the old renderer drew both faces of every tile, which read as a sawtooth)
    expect(count(wall!.left, /M/g)).toBe(6);
    expect(count(wall!.right, /M/g)).toBe(1);
  });

  it('back walls stand full height; walls on the camera side are cut to a kerb', () => {
    const home = MAPS.home;
    expect(raisedHeight(home, 3, 0)).toBe(TERRAIN.wall.height);
    expect(raisedHeight(home, 0, 3)).toBe(TERRAIN.wall.height);
    expect(raisedHeight(home, 3, home.grid.length - 1)).toBe(CUT_WALL_HEIGHT);
    expect(raisedHeight(home, home.grid[0].length - 1, 3)).toBe(CUT_WALL_HEIGHT);
    expect(raisedHeight(home, 3, 3)).toBe(0);
  });

  it('kerbs mark material changes, banks line the water', () => {
    const park = buildGround(MAPS.park);
    expect(park.kerbs.length).toBeGreaterThan(0);
    const test = buildGround(TEST_MAP);
    expect(test.banks.some((bank) => bank.material === 'water')).toBe(true);
  });
});

describe('<Ground>', () => {
  it('is a single SVG with one <use> per tile and no filters', () => {
    const map = MAPS.park;
    const markup = renderToStaticMarkup(createElement(Ground, { map, time: '01:10' }));
    expect(count(markup, /<svg/g)).toBe(1);
    expect(count(markup, /<use /g)).toBe(buildGround(map).tiles.length);
    expect(markup).not.toMatch(/filter/);
    // Only the symbols the map uses are defined
    expect(count(markup, /<symbol /g)).toBe(buildGround(map).symbols.length);
  });
});
