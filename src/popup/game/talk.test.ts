import { describe, expect, test } from 'vitest';
import { initialState, step } from '../core';
import type { PageDef } from '../core/types';
import type { ScriptLine, TalkLine } from '../content/script';
import { pageById } from '../pages';
import { EMPTY_TALK, MAX_PER_BEAT, advance, beatsOf, currentBeat, enqueue, firedLines, introLines, splitBeat } from './talk';

/** The subtitle queue (#98; GDD § 2.13): beats of at most three lines, a tap advances, event lines fire once. */

const line = (n: number): TalkLine => ({ key: `t.${n}`, who: 'mocha', label: null, text: `第${n}句` });
const lines = (n: number) => Array.from({ length: n }, (_, i) => line(i + 1));

describe('beats', () => {
  test('a group is cut into beats of at most three', () => {
    expect(MAX_PER_BEAT).toBe(3);
    expect(beatsOf(lines(7)).map((b) => b.length)).toEqual([3, 3, 1]);
    expect(beatsOf([])).toEqual([]);
    // 大字 on a small book (#104): one line a beat; never more than 3, never fewer than 1
    expect(beatsOf(lines(3), 1).map((b) => b.length)).toEqual([1, 1, 1]);
    expect(enqueue(EMPTY_TALK, lines(4), 2).beats.map((b) => b.length)).toEqual([2, 2]);
    expect(beatsOf(lines(4), 9).map((b) => b.length)).toEqual([3, 1]);
    expect(beatsOf(lines(2), 0).map((b) => b.length)).toEqual([1, 1]);
  });

  test('a tap shows the next beat; the last tap clears the page', () => {
    let q = enqueue(EMPTY_TALK, lines(5));
    expect(currentBeat(q)?.map((l) => l.key)).toEqual(['t.1', 't.2', 't.3']);
    const s1 = q.serial;
    q = advance(q);
    expect(currentBeat(q)?.map((l) => l.key)).toEqual(['t.4', 't.5']);
    expect(q.serial).toBe(s1 + 1);
    q = advance(q);
    expect(currentBeat(q)).toBeNull();
    expect(advance(q)).toBe(q);
  });

  test('a new group waits behind the beat on the page, never joining it', () => {
    let q = enqueue(EMPTY_TALK, lines(2));
    const serial = q.serial;
    q = enqueue(q, [line(9)]);
    expect(q.serial).toBe(serial);
    expect(currentBeat(q)?.length).toBe(2);
    q = advance(q);
    expect(currentBeat(q)?.map((l) => l.key)).toEqual(['t.9']);
  });

  test('a beat too big for the page is split where it stops fitting (#197), keeping its serial', () => {
    const q = enqueue(enqueue(EMPTY_TALK, lines(3)), [line(9)]);
    const beat = currentBeat(q)!;
    const split = splitBeat(q, beat, 2);
    expect(split.beats.map((b) => b.map((l) => l.key))).toEqual([['t.1', 't.2'], ['t.3'], ['t.9']]);
    expect(split.serial).toBe(q.serial);
    // The rest follow on the next tap, as a new beat
    expect(currentBeat(advance(split))!.map((l) => l.key)).toEqual(['t.3']);
    expect(advance(split).serial).toBe(q.serial + 1);
    // A stale report (another beat is up now) or one that splits nothing changes nothing
    expect(splitBeat(advance(q), beat, 1)).toEqual(advance(q));
    expect(splitBeat(q, beat, 3)).toBe(q);
    expect(splitBeat(q, beat, 0)).toBe(q);
  });

  test('queuing nothing changes nothing', () => {
    expect(enqueue(EMPTY_TALK, [])).toBe(EMPTY_TALK);
  });
});

describe('page lines', () => {
  const table: Record<string, ScriptLine> = {
    'x.intro': { who: 'nar', text: '月台很安靜。' },
    'x.ride': { who: 'pa', text: '請緊握扶手。' },
    'x.npc': { who: 'npc', text: '嘎！', label: '鵝' },
  };
  const base = pageById('c1p2')!;
  const def: PageDef = { ...base, lines: { intro: ['x.intro', 'x.missing'], onEvent: [{ when: { type: 'ride' }, line: 'x.ride' }] } };

  test('the intro loads through the script, dropping unknown keys (lint rule 10 makes them errors)', () => {
    expect(introLines(def, table)).toEqual([{ key: 'x.intro', who: 'nar', label: null, text: '月台很安靜。' }]);
  });

  test('an npc line carries its own label; a speaker line gets the speaker table label', () => {
    const d: PageDef = { ...base, lines: { intro: ['x.npc', 'x.ride'] } };
    expect(introLines(d, table).map((l) => l.label)).toEqual(['鵝', '廣播姊姊']);
  });

  test('an event line fires once, on the tick its predicate first holds', () => {
    let s = initialState(def);
    const fired: string[][] = [];
    const inputs = [{ t: 'set', part: 'train', to: 'half' }, { t: 'none' }, { t: 'none' }, { t: 'none' }, { t: 'set', part: 'train', to: 'out' }, { t: 'set', part: 'train', to: 'half' }] as const;
    for (const input of inputs) {
      const r = step(def, s, input);
      fired.push(firedLines(def, s, r.state, r.events, table).map((l) => l.key));
      s = r.state;
    }
    expect(fired.flat()).toEqual(['x.ride']);
  });
});
