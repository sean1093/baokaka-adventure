import { describe, expect, test } from 'vitest';
import {
  EYES,
  LIGHTS,
  LINE,
  MATERIALS,
  MRT,
  SKY_KEYS,
  UI,
  WORLD,
  characterGrade,
  clockMinutes,
  gradeCharacter,
  gradeTokens,
  mixHex,
  multiplyHex,
  skyAt,
  worldGrade,
} from './palette';

const HEX = /^#[0-9A-F]{6}$/;

describe('§ 3.1 master tokens', () => {
  test('line and neutrals', () => {
    expect(LINE).toEqual({ sil: '#5A2C34', ink: '#2E2235', inkOnDark: '#F4F2FF', mutedOnDark: '#BFC2EA', parchment: '#F3E6CC', contactShadow: '#1E1430' });
  });

  test('character ramps (base / cel / deep / line)', () => {
    expect(MATERIALS.skin).toEqual({ base: '#FFE7D6', cel: '#F6C0AA', deep: '#E89E8C', line: '#C9786A' });
    expect(MATERIALS.hair).toEqual({ base: '#6A4234', cel: '#46281F', deep: '#2E1913', line: '#2A1612', ring: '#8E5A46', ringLight: '#F0C4AC' });
    expect(MATERIALS.pajama).toEqual({ base: '#FFD86A', cel: '#EFA846', deep: '#D6863A', line: '#B06A28', far: '#F4C458' });
    expect(MATERIALS.cream).toEqual({ base: '#FFF6E6', cel: '#EBD3B4', deep: '#D6B48E', line: '#A8825E' });
    expect(MATERIALS.bearPatch).toEqual({ base: '#B98058', cel: '#93603E', deep: '#744628', line: '#5A3420' });
    expect(MATERIALS.redString).toEqual({ base: '#E5483E', cel: '#9E2A2A' });
    expect(MATERIALS.gold).toEqual({ base: '#FFD66A', cel: '#E0A83A', deep: '#B8822A', line: '#8A5E1E' });
    expect(MATERIALS.tabby).toEqual({ base: '#D7975E', cel: '#AE6C3E', deep: '#8A5232', line: '#6E3A22', stripe: '#7A4628' });
    expect(MATERIALS.furCream).toEqual({ base: '#FFF5E8', cel: '#EAD2B8', deep: '#D6B898', line: '#A8866A' });
    expect(MATERIALS.bandana).toEqual({ base: '#4A8BDA', cel: '#2F62B0', deep: '#234A8A', line: '#1E3E78' });
    expect(EYES).toEqual({ brown: ['#2E1A12', '#7A4628', '#D99A56'], cat: ['#2E4A12', '#86AE2A', '#ECEC72'] });
  });

  test('far-side ramps follow the reference generator, and the pajama far base matches § 3.1', () => {
    expect(MATERIALS.pajamaFar).toEqual({ base: '#F4C458', cel: '#DE9640', deep: '#C47634', line: '#A0602A' });
    expect(MATERIALS.pajamaFar.base).toBe(MATERIALS.pajama.far);
    expect(MATERIALS.tabbyFar).toEqual({ base: '#C4844E', cel: '#9C5E34', deep: '#7A4628', line: '#5E3020' });
  });

  test('world, lights, UI and MRT line colours', () => {
    expect(WORLD).toMatchObject({ grass: '#2E5A58', grassAlt: '#2A5452', brick: '#6E3A4E', brickAlt: '#683648', asphalt: '#2A2E58', water: '#24407E' });
    expect([WORLD.glassLit, WORLD.glassLitLow, WORLD.glassShade, WORLD.glassShadeLow]).toEqual(['#3E5A9A', '#2A3E78', '#1C2858', '#141C44']);
    expect(LIGHTS).toEqual({
      windowWarm: '#FFD98A',
      windowPale: '#FFE9C0',
      windowCool: '#9AE0FF',
      lampCore: '#FFE6B0',
      lampMid: '#FFC27A',
      rim101: '#8AF0E0',
      cityGlow: '#E88E8A',
      cityGlowWarm: '#FF9A7A',
    });
    expect(UI).toMatchObject({
      panelTopGlass: 'rgba(22,26,78,.96)',
      panelBottomGlass: 'rgba(10,11,34,.99)',
      gold: '#E8C77A',
      goldLight: '#FFE9B0',
      goldDeep: '#C9A04A',
      primaryTop: '#FFEFC0',
      primaryMid: '#F0C060',
      primaryBottom: '#D89A3A',
      primaryText: '#1A1440',
      hpFrom: '#3FC88A',
      hpTo: '#9AF0B8',
      hpLowFrom: '#F08A3A',
      hpLowTo: '#FFC27A',
      hpCritFrom: '#FF5A8A',
      hpCritTo: '#FF9AB8',
      mpFrom: '#4A8AF0',
      mpTo: '#9AC8FF',
      damage: '#FFFFFF',
      damageStroke: '#C2185B',
    });
    expect(MRT).toEqual({ red: '#E3002C', blue: '#0070BD', green: '#008659', orange: '#F8B61C', brown: '#C48C31' });
  });

  test('the solid panel stops are the glass stops without alpha', () => {
    expect(UI.panelTop).toBe('#161A4E'); // rgb(22, 26, 78)
    expect(UI.panelBottom).toBe('#0A0B22'); // rgb(10, 11, 34)
  });

  test('every hex token is upper-case #RRGGBB', () => {
    const hexes = [
      ...Object.values(LINE),
      ...Object.values(MATERIALS).flatMap((ramp) => Object.values(ramp)),
      ...Object.values(EYES).flat(),
      ...Object.values(WORLD),
      ...Object.values(LIGHTS),
      ...Object.values(MRT),
      ...Object.values(UI).filter((value) => !value.startsWith('rgba')),
    ];
    for (const hex of hexes) expect(hex).toMatch(HEX);
  });
});

describe('colour helpers', () => {
  test('clockMinutes parses HH:MM and rejects anything else', () => {
    expect(clockMinutes('00:00')).toBe(0);
    expect(clockMinutes('05:29')).toBe(329);
    expect(clockMinutes('23:59')).toBe(1439);
    for (const bad of ['5:29', '24:00', '05:60', '0529', '']) expect(() => clockMinutes(bad)).toThrow(/HH:MM/);
  });

  test('mixHex and multiplyHex', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mixHex('#102030', '#405060', 0)).toBe('#102030');
    expect(mixHex('#102030', '#405060', 1)).toBe('#405060');
    expect(multiplyHex('#808080', [0.5, 1, 2])).toBe('#4080FF'); // clamps at 255
  });
});

describe('skyAt (§ 3.2 night clock)', () => {
  test('equals the table at its keys', () => {
    expect(skyAt('00:00')).toEqual(SKY_KEYS[0]);
    expect(skyAt('05:29')).toEqual(SKY_KEYS[SKY_KEYS.length - 1]);
    for (const key of SKY_KEYS) expect(skyAt(key.time)).toEqual(key);
    expect(skyAt('00:00')).toMatchObject({ top: '#0A1034', mid: '#1A2A6A', horizon: '#3A3A86', grade: [0.55, 0.57, 0.72], rim: '#CFEAFF' });
    expect(skyAt('05:29')).toMatchObject({ top: '#4A5AA0', mid: '#E8A0A0', horizon: '#FFD27A', grade: [1, 1, 1], rim: '#FFE09A', dawn: 1 });
  });

  test('the keys run in time order from 00:00 to 05:29', () => {
    const minutes = SKY_KEYS.map((key) => clockMinutes(key.time));
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
    expect(SKY_KEYS.map((key) => key.time)).toEqual(['00:00', '01:00', '02:00', '03:00', '04:00', '04:30', '05:00', '05:15', '05:29']);
  });

  test('interpolates between keys (03:30 is halfway from 03:00 to 04:00)', () => {
    const sky = skyAt('03:30');
    expect(sky.time).toBe('03:30');
    expect(sky.top).toBe(mixHex('#101848', '#16205A', 0.5));
    expect(sky.mid).toBe(mixHex('#2E3684', '#3A3F92', 0.5));
    expect(sky.horizon).toBe(mixHex('#8A6AB0', '#A878B8', 0.5));
    expect(sky.grade).toEqual([0.62, 0.615, 0.765]);
    expect(sky.moon).toBeCloseTo(0.21);
    expect(sky.localRim).toBe(true);
    // Strictly between the two keys
    for (const field of ['top', 'mid', 'horizon'] as const) {
      expect(sky[field]).not.toBe(skyAt('03:00')[field]);
      expect(sky[field]).not.toBe(skyAt('04:00')[field]);
    }
  });

  test('dawn only starts after 04:30 and the moon sets', () => {
    expect(skyAt('04:30').dawn).toBe(0);
    expect(skyAt('05:07').dawn).toBeGreaterThan(0.35);
    expect(skyAt('04:30').moon).toBeLessThan(0);
  });

  test('later than 05:29 holds the sunrise sky; bad times throw', () => {
    expect(skyAt('10:00')).toEqual({ ...SKY_KEYS[SKY_KEYS.length - 1], time: '10:00' });
    expect(() => skyAt('3:30')).toThrow();
  });

  test('is memoised', () => {
    expect(skyAt('02:50')).toBe(skyAt('02:50'));
    expect(Object.isFrozen(skyAt('02:50'))).toBe(true);
  });
});

describe('gradeTokens / gradeCharacter', () => {
  test('00:00 is the painted world; 05:29 lifts it by the inverse of the midnight grade', () => {
    expect(gradeTokens('00:00')).toEqual(WORLD);
    expect(worldGrade('05:29')).toEqual([1.818, 1.754, 1.389]);
    expect(gradeTokens('05:29').asphalt).toBe(multiplyHex(WORLD.asphalt, [1.818, 1.754, 1.389]));
  });

  test('every world token is graded and the night gets brighter toward dawn', () => {
    const times = ['00:00', '02:00', '03:30', '04:30', '05:15', '05:29'];
    const sum = (hex: string) => [1, 3, 5].reduce((total, at) => total + parseInt(hex.slice(at, at + 2), 16), 0);
    for (const name of Object.keys(WORLD) as (keyof typeof WORLD)[]) {
      const values = times.map((time) => sum(gradeTokens(time)[name]));
      expect(values).toEqual([...values].sort((a, b) => a - b));
      for (const time of times) expect(gradeTokens(time)[name]).toMatch(HEX);
    }
  });

  test('is pure and memoised', () => {
    const before = JSON.stringify(WORLD);
    const a = gradeTokens('03:15');
    expect(gradeTokens('03:15')).toBe(a);
    expect(Object.isFrozen(a)).toBe(true);
    expect(JSON.stringify(WORLD)).toBe(before);
    expect(gradeCharacter('03:15')).toBe(gradeCharacter('03:15'));
  });

  test('characters get half the grade', () => {
    for (const time of ['00:00', '02:00', '03:30', '05:00', '05:29']) {
      const grade = skyAt(time).grade;
      const half = characterGrade(time);
      for (const i of [0, 1, 2]) expect(half[i]).toBeCloseTo(1 - (1 - grade[i]) / 2, 2);
    }
    expect(characterGrade('00:00')).toEqual([0.775, 0.785, 0.86]);
    expect(gradeCharacter('00:00').skin.base).toBe(multiplyHex(MATERIALS.skin.base, [0.775, 0.785, 0.86]));
    expect(gradeCharacter('00:00').hair).toHaveProperty('ring', multiplyHex(MATERIALS.hair.ring, [0.775, 0.785, 0.86]));
    expect(gradeCharacter('05:29')).toEqual(MATERIALS);
  });
});
