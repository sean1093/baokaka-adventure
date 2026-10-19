import { describe, expect, test } from 'vitest';
import { hashParams } from '../../shared/route';
import { DEFAULT_OVERLAYS, MAX_START_TICK, OVERLAYS, labHash, parseLabParams, toggle, type LabParams } from './labParams';

/** PageLab's URL (#91): parsing, defaults, clamping and the round trip. */

const parse = (hash: string) => parseLabParams(hashParams(hash));

describe('parseLabParams', () => {
  test("the issue's example link", () => {
    expect(parse('#/pagelab?page=c1p2&overlay=nodes,edges&tick=12')).toEqual({
      section: null,
      page: 'c1p2',
      overlays: ['nodes', 'edges'],
      tick: 12,
      speed: 'normal',
      edit: false,
      views: [],
    });
  });

  test('defaults with no parameters', () => {
    const p = parse('#/pagelab');
    expect(p.page).toBeNull();
    expect(p.overlays).toEqual(DEFAULT_OVERLAYS);
    expect(p.tick).toBe(0);
    expect(p.edit).toBe(false);
  });

  test('an empty overlay list means none; unknown names are dropped; order follows OVERLAYS', () => {
    expect(parse('#/pagelab?overlay=').overlays).toEqual([]);
    expect(parse('#/pagelab?overlay=target,bogus,nodes, hits').overlays).toEqual(['nodes', 'hits', 'target']);
    expect(parse(`#/pagelab?overlay=${OVERLAYS.join(',')}`).overlays).toEqual([...OVERLAYS]);
  });

  test.each([
    ['-3', 0],
    ['abc', 0],
    ['7.9', 7],
    ['99999', MAX_START_TICK],
    ['', 0],
  ])('tick=%s → %d', (raw, tick) => {
    expect(parse(`#/pagelab?tick=${raw}`).tick).toBe(tick);
  });

  test('speed, edit, views and section', () => {
    expect(parse('#/pagelab?speed=fast').speed).toBe('fast');
    expect(parse('#/pagelab?speed=warp').speed).toBe('normal');
    expect(parse('#/pagelab?speed=toString').speed).toBe('normal');
    expect(parse('#/pagelab?edit=1').edit).toBe(true);
    expect(parse('#/pagelab?edit=yes').edit).toBe(false);
    expect(parse('#/pagelab?view=squint,grey,blur').views).toEqual(['grey', 'squint']);
    expect(parse('#/pagelab?section=kit').section).toBe('kit');
  });
});

describe('labHash', () => {
  test('writes page and overlays always, the rest only off their defaults', () => {
    expect(labHash(parse('#/pagelab?page=c1p2&overlay=nodes,edges&tick=12'))).toBe('#/pagelab?page=c1p2&overlay=nodes,edges&tick=12');
    expect(labHash(parse('#/pagelab'))).toBe('#/pagelab?overlay=nodes,edges,target');
    expect(labHash(parse('#/pagelab?overlay='))).toBe('#/pagelab?overlay=');
  });

  test('round-trips every setting', () => {
    const p: LabParams = { section: null, page: 'c0p1', overlays: ['hits', 'perches'], tick: 4, speed: 'slow', edit: true, views: ['squint', 'grey'] };
    const hash = labHash(p);
    expect(hash).toBe('#/pagelab?page=c0p1&overlay=perches,hits&tick=4&speed=slow&edit=1&view=grey,squint');
    expect(parse(hash)).toEqual({ ...p, overlays: ['perches', 'hits'], views: ['grey', 'squint'] });
  });

  test('the kit section keeps its short link', () => {
    expect(labHash(parse('#/pagelab?section=kit'))).toBe('#/pagelab?section=kit');
  });

  test('page ids are escaped', () => {
    expect(parse(labHash({ ...parse('#/pagelab'), page: 'a&b=c' })).page).toBe('a&b=c');
  });
});

test('toggle adds once and removes', () => {
  expect(toggle(['a', 'b'], 'c', true)).toEqual(['a', 'b', 'c']);
  expect(toggle(['a', 'b'], 'a', true)).toEqual(['b', 'a']);
  expect(toggle(['a', 'b'], 'a', false)).toEqual(['b']);
});
