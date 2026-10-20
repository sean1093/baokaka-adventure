import { describe, expect, test } from 'vitest';
import type { StorageLike } from '../../shared/storage';
import { PLAYTEST_KEY, PLAYTEST_MAX_EVENTS, PlaytestLog, clock, gates, pageLabel, report, summarize, type PlaytestEvent } from './playtest';

/**
 * The playtest log (#110): active time only while a page is live, attempts across 重來, hints per
 * level, the longest still stretch, the § 8 readings and the copied text; the store survives a
 * reload and never throws.
 */

const S = 1000;
const M = 60 * S;

/** A page opened and made live at `at`. */
const open = (page: string, at: number, replay = false): PlaytestEvent[] => [
  { t: 'open', page, at, replay },
  { t: 'live', on: true, at },
];

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('summarize', () => {
  test('counts only live time, and stops the clock at the solve', () => {
    const events: PlaytestEvent[] = [
      ...open('c0p1', 0),
      { t: 'move', at: 10 * S },
      { t: 'live', on: false, at: 20 * S }, // the menu
      { t: 'live', on: true, at: 80 * S },
      { t: 'move', at: 90 * S },
      { t: 'done', at: 95 * S, moves: 2 },
      { t: 'live', on: false, at: 96 * S },
    ];
    const [a] = summarize(events, 500 * S);
    expect(a.activeMs).toBe(35 * S);
    expect(a.done).toBe(true);
    expect(a.moves).toBe(2);
  });

  test('重來 continues the attempt; another page closes it unsolved', () => {
    const events: PlaytestEvent[] = [
      ...open('c1p4', 0),
      { t: 'retry', at: 30 * S },
      { t: 'live', on: false, at: 30 * S },
      ...open('c1p4', 31 * S),
      { t: 'hint', level: 1, at: 40 * S },
      { t: 'hint', level: 2, at: 45 * S },
      { t: 'hint', level: 3, at: 50 * S },
      { t: 'hint', level: 0, at: 60 * S },
      ...open('c1p5', 70 * S),
    ];
    const out = summarize(events, 100 * S);
    expect(out.map((a) => a.page)).toEqual(['c1p4', 'c1p5']);
    expect(out[0]).toMatchObject({ retries: 1, done: false, hints: [1, 1, 1, 1], activeMs: 69 * S });
    // The page still open when the report is copied runs to `now`
    expect(out[1].activeMs).toBe(30 * S);
  });

  test('the longest still stretch counts live time with no move and no 提示 press', () => {
    const events: PlaytestEvent[] = [
      ...open('c1p2', 0),
      { t: 'move', at: 30 * S },
      { t: 'live', on: false, at: 40 * S },
      { t: 'live', on: true, at: 400 * S }, // a long menu pause is not "stuck"
      { t: 'hint', level: 0, at: 450 * S }, // the nudge is not the player's doing
      { t: 'hint', level: 1, at: 500 * S },
      { t: 'done', at: 510 * S, moves: 1 },
    ];
    const [a] = summarize(events, 600 * S);
    expect(a.longestStillMs).toBe(110 * S);
    expect(a.hints).toEqual([1, 1, 0, 0]);
  });

  test('stickers, nopes, taps on him and marks are kept per attempt; a mark after the solve stays with the page', () => {
    const events: PlaytestEvent[] = [
      { t: 'mark', at: 0 }, // on the cover: no page
      ...open('c1p2', 1),
      { t: 'nope', at: 2 },
      { t: 'ring', at: 3 },
      { t: 'sticker', sticker: 'mischief', at: 4 },
      { t: 'sticker', sticker: 'mischief', at: 5 },
      { t: 'mark', at: 6 },
      { t: 'done', at: 7, moves: 3 },
      { t: 'mark', at: 8 },
    ];
    const [a] = summarize(events, 10);
    expect(a).toMatchObject({ nopes: 1, rings: 1, stickers: ['mischief'], marks: [6, 8] });
  });
});

describe('gates', () => {
  const prologue = (hintsOn: string | null): PlaytestEvent[] =>
    ['c0p1', 'c0p2', 'c0p3', 'c0p4'].flatMap((id, i) => {
      const t0 = i * 2 * M;
      return [...open(id, t0), ...(hintsOn === id ? [{ t: 'hint', level: 1, at: t0 + S } as const] : []), { t: 'move', at: t0 + 30 * S } as const, { t: 'done', at: t0 + M, moves: 1 } as const];
    });

  test('0-1 unaided, the prologue total and its 提示 presses', () => {
    const g = gates(summarize(prologue('c0p3'), 10 * M));
    expect(g.firstPage).toEqual({ ms: M, unaided: true, done: true });
    expect(g.prologue).toEqual({ ms: 4 * M, presses: 1, done: true });
  });

  test('chapter 1: show-me pages, the median, stuck and replays', () => {
    const events: PlaytestEvent[] = [
      ...open('c1p1', 0),
      { t: 'done', at: M, moves: 1 },
      ...open('c1p2', 2 * M),
      { t: 'hint', level: 1, at: 2 * M + S },
      { t: 'hint', level: 2, at: 2 * M + 2 * S },
      { t: 'hint', level: 3, at: 2 * M + 3 * S },
      { t: 'done', at: 5 * M, moves: 2 },
      ...open('c1p3', 6 * M),
      { t: 'done', at: 9 * M, moves: 2 },
      ...open('c1p2', 10 * M, true),
      { t: 'done', at: 11 * M, moves: 2 },
    ];
    const g = gates(summarize(events, 12 * M));
    expect(g.showMePages).toEqual(['c1p2']);
    expect(g.ch1MedianMs).toBe(3 * M);
    // 1-3 sat still for 3 minutes with no 提示; 1-2 had hints, so it is not "stuck without hints"
    expect(g.stuck).toEqual(['c1p3']);
    expect(g.replays).toEqual(['c1p2']);
  });
});

describe('report', () => {
  test('a markdown table per attempt, the readings and the marks; no names', () => {
    const events: PlaytestEvent[] = [...open('c0p1', 0), { t: 'mark', at: 20 * S }, { t: 'move', at: 40 * S }, { t: 'done', at: 83 * S, moves: 1 }];
    const text = report(events, { now: 100 * S, device: 'test', viewport: '390x844' });
    expect(text).toContain('| 1 | 0-1 |  | 1:23 | yes | 0/0/0 | 0 | 0 | 1 | 0 | 0 | 0:43 |  | 1 |');
    expect(text).toContain('0-1 time: 1:23 (target ≤ 1:30)');
    expect(text).toContain('- 0:20 on 0-1');
    expect(text).toContain('Viewport: 390x844');
  });

  test('an empty log still reports', () => {
    expect(report([], { now: 0 })).toContain('0-1: not played');
  });

  test('labels and clocks', () => {
    expect(pageLabel('c1p4')).toBe('1-4');
    expect(clock(0)).toBe('0:00');
    expect(clock(61_400)).toBe('1:01');
  });
});

describe('PlaytestLog', () => {
  test('writes through and reloads; clear empties it', () => {
    const storage = memory();
    const log = new PlaytestLog(storage);
    let heard = 0;
    log.subscribe(() => heard++);
    log.add({ t: 'mark', at: 1 });
    expect(new PlaytestLog(storage).get()).toEqual([{ t: 'mark', at: 1 }]);
    log.clear();
    expect(storage.data.has(PLAYTEST_KEY)).toBe(false);
    expect(log.get()).toEqual([]);
    expect(heard).toBe(2);
  });

  test('a malformed or throwing storage gives an empty log that still works in memory', () => {
    const bad = memory();
    bad.setItem(PLAYTEST_KEY, '{nope');
    expect(new PlaytestLog(bad).get()).toEqual([]);
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    const log = new PlaytestLog(throwing);
    log.add({ t: 'mark', at: 1 });
    expect(log.get()).toHaveLength(1);
    expect(() => log.clear()).not.toThrow();
  });

  test('stops growing at the cap', () => {
    const log = new PlaytestLog(null);
    for (let i = 0; i < PLAYTEST_MAX_EVENTS + 5; i++) log.add({ t: 'move', at: i });
    expect(log.get()).toHaveLength(PLAYTEST_MAX_EVENTS);
  });
});
