import { describe, expect, test } from 'vitest';
import { clockMinutes } from '../../art/palette';
import { CHAPTER_CLOCK, LOCATION_CLOCK, mapClock } from './clock';
import { MAPS, MAP_ORDER } from './maps';
import { CLOCK, validateMap } from './validate';

describe('the night clock', () => {
  test('chapter cards use the bible chapter times (D-16)', () => {
    expect(Object.values(CHAPTER_CLOCK)).toEqual(['00:00', '00:40', '01:10', '01:35', '02:00', '02:25', '02:50', '03:15', '03:40', '04:05', '04:25', '04:45', '05:00', '05:15']);
    expect(Object.keys(CHAPTER_CLOCK).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  test('location times are valid clocks inside the night', () => {
    for (const time of [...Object.values(CHAPTER_CLOCK), ...Object.values(LOCATION_CLOCK)]) {
      expect(time).toMatch(CLOCK);
      expect(clockMinutes(time)).toBeLessThanOrEqual(clockMinutes('05:29'));
    }
    expect(LOCATION_CLOCK).toMatchObject({ daan: '00:15', maokong: '03:55', xinyi: '05:10' });
  });

  test('mapClock: own time, else the location table, else the chapter card', () => {
    expect(mapClock({ id: 'park' as never, chapter: 3 })).toBe('01:10');
    expect(mapClock({ id: 'daan' as never, chapter: 1 })).toBe('00:15');
    expect(mapClock({ id: 'daan' as never, chapter: 1, time: '00:20' })).toBe('00:20');
    expect(mapClock({ id: 'post' as never, chapter: 99 })).toBe('00:00');
    for (const id of MAP_ORDER) expect(mapClock(MAPS[id])).toMatch(CLOCK);
  });

  test('the validator rejects a malformed map time', () => {
    const map = MAPS[MAP_ORDER[0]];
    const check = (time: string | undefined) => {
      const errors: string[] = [];
      validateMap({ ...map, time }, errors);
      return errors.filter((error) => error.includes('time'));
    };
    expect(check(undefined)).toEqual([]);
    expect(check('00:15')).toEqual([]);
    expect(check('0:15')).toEqual([`map ${map.id}: time "0:15" is not HH:MM`]);
  });
});
