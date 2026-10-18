import { describe, expect, test } from 'vitest';
import { parseRoute } from './route';

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
  ])('%j -> %s', (hash, route) => {
    expect(parseRoute(hash)).toBe(route);
  });
});
