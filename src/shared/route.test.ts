import { describe, expect, test } from 'vitest';
import { hashParams, parseRoute } from './route';

describe('parseRoute', () => {
  test.each([
    ['', 'game'],
    ['#', 'game'],
    ['#/', 'game'],
    ['#/quest', 'game'],
    ['#/quest/', 'game'],
    ['#/garbage', 'game'],
    ['#/find', 'legacy'],
    ['#/find/', 'legacy'],
    ['#find', 'legacy'],
    ['#/sudoku', 'legacy'],
    ['#/find?x=1', 'legacy'],
    ['#/artlab', 'artlab'],
    ['#/artlab/', 'artlab'],
    ['#/artlab?section=sprites&bg=night', 'artlab'],
    ['#/artlabs', 'game'],
    ['#/?page=c1p2', 'game'],
    ['#/popup', 'game'],
    ['#/popup/', 'game'],
    ['#/popup?page=c1p2', 'game'],
    ['#popup', 'game'],
    ['#/popups', 'game'],
    ['#/popup/1-2', 'game'],
    ['#/pagelab', 'pagelab'],
    ['#/pagelab/', 'pagelab'],
    ['#/pagelab?page=1-2&overlay=nodes', 'pagelab'],
    ['#/pagelabs', 'game'],
  ])('%j -> %s', (hash, route) => {
    expect(parseRoute(hash)).toBe(route);
  });
});

describe('hashParams', () => {
  test('reads the query after the route', () => {
    const params = hashParams('#/artlab?section=sprites&bg=night&size=124&only=baokaka');
    expect(params.get('section')).toBe('sprites');
    expect(params.get('bg')).toBe('night');
    expect(params.get('size')).toBe('124');
    expect(params.get('only')).toBe('baokaka');
  });

  test('is empty without a query', () => {
    expect([...hashParams('#/artlab').keys()]).toEqual([]);
    expect([...hashParams('').keys()]).toEqual([]);
  });
});
