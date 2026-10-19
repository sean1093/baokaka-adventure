import { describe, expect, test } from 'vitest';
import { ARTLAB_FIXTURES } from '../../artlab/fixtures';
import { hashParams } from '../../shared/route';
import { initialState } from '../core';
import { POPUP_FIXTURES, fixtureFrame, fixtureParams, fixtureStore, popupFixture } from './fixtures';
import { nextHint } from '../core/hint';
import { hintDisplay } from '../view/affordance/ladder';
import { isFirstLaunch, resumeTarget } from '../game/nav';
import { SAVE_KEY } from '../game/progress';

/** The visual QA fixtures (#92): valid, unique, deterministic, and still showing what they claim. */

describe('POPUP_FIXTURES', () => {
  test('the first three from the issue are there', () => {
    expect(POPUP_FIXTURES.map((f) => f.name)).toEqual(expect.arrayContaining(['c0p1-start', 'c1p2-reaching', 'c1p2-riding']));
  });

  test('names are kebab-case and unique among popup and art lab fixtures (they are screenshot names)', () => {
    const names = [...POPUP_FIXTURES.map((f) => f.name), ...ARTLAB_FIXTURES.map((f) => f.name)];
    expect(new Set(names).size).toBe(names.length);
    for (const f of POPUP_FIXTURES) expect(f.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test.each(POPUP_FIXTURES.map((f) => [f.name, f] as const))('%s replays through the engine to what it claims', (_, fixture) => {
    const frame = fixtureFrame(fixture);
    expect(frame.def.id).toBe(fixture.page);
    if (fixture.expect?.mode) expect(frame.state.baby.mode).toBe(fixture.expect.mode);
    if (fixture.expect?.event) expect(frame.events.map((e) => e.type)).toContain(fixture.expect.event);
    expect(fixture.note.length).toBeGreaterThan(0);
    // Deterministic: the same steps give the same states
    expect(fixtureFrame(fixture)).toEqual(frame);
  });

  test('an empty step list is the page as it opens, with nothing in flight', () => {
    const frame = fixtureFrame(popupFixture('c0p1-start')!);
    expect(frame.state).toEqual(initialState(frame.def));
    expect(frame.prev).toBe(frame.state);
    expect(frame.events).toEqual([]);
  });

  test('prev is the state before the last tick', () => {
    const frame = fixtureFrame(popupFixture('c1p2-riding')!);
    expect(frame.prev.tick).toBe(frame.state.tick - 1);
    expect(frame.prev.parts.train).toBe('half');
    expect(frame.state.parts.train).toBe('out');
    expect(frame.state.baby.node).toBe(frame.prev.baby.node);
  });

  test('#97: the UI shell fixtures are there, on the screens and saves they claim', () => {
    expect(POPUP_FIXTURES.map((f) => f.name)).toEqual(expect.arrayContaining(['cover-first', 'cover-continue', 'contents-ch1', 'page-hud']));
    const first = popupFixture('cover-first')!.screen!;
    expect(first.nav.base.kind).toBe('cover');
    expect(isFirstLaunch(first.save)).toBe(true);
    const cont = popupFixture('cover-continue')!.screen!;
    expect(isFirstLaunch(cont.save)).toBe(false);
    expect(resumeTarget(cont.save)).toBe('c1p2');
    expect(popupFixture('contents-ch1')!.screen!.nav.layer).toEqual({ kind: 'contents', chapter: 1 });
    expect(popupFixture('page-hud')!.screen!.nav.base).toEqual({ kind: 'page', id: 'c1p2', run: 0 });
    expect(popupFixture('page-hud-left')!.screen!.save.settings.leftHand).toBe(true);
  });

  test('a fixture store is seeded in memory and loads its save back', () => {
    const save = popupFixture('cover-continue')!.screen!.save;
    const store = fixtureStore(save);
    expect(store.get()).toEqual(save);
    store.openPage('c0p1');
    expect(store.get().current).toBe('c0p1');
    // The real storage is never touched
    expect(typeof localStorage === 'undefined' || localStorage.getItem(SAVE_KEY) === null).toBe(true);
    store.dispose();
  });

  test('an unknown page throws', () => {
    expect(() => fixtureFrame({ name: 'x', page: 'nope', steps: [], note: 'x' })).toThrow(/no page 'nope'/);
  });
});

test('fixtureParams', () => {
  expect(fixtureParams(hashParams('#/pagelab?fixture=c1p2-riding&still=1'))).toEqual({ fixture: 'c1p2-riding', still: true });
  expect(fixtureParams(hashParams('#/pagelab?fixture=&still=yes'))).toEqual({ fixture: null, still: false });
  expect(fixtureParams(hashParams('#/pagelab'))).toEqual({ fixture: null, still: false });
});

describe('the hint fixtures (#100) show what the solver says', () => {
  const shown = (name: string) => {
    const fixture = popupFixture(name)!;
    const { def, state } = fixtureFrame(fixture);
    return hintDisplay(def, nextHint(def, state), fixture.show!.hint!);
  };

  test('hint-nudge: Mocha yawns toward the pillar, no line', () => {
    expect(shown('hint-nudge')).toEqual({ show: { level: 0, key: 'perch:pillar' }, mocha: 'yawn', line: null, retry: false, ringWord: null });
  });

  test('hint-level1: Mocha to the pillar — its paw print halos, he looks, 「讓摩卡上去」', () => {
    expect(shown('hint-level1')).toEqual({ show: { level: 1, key: 'perch:pillar' }, mocha: 'look', line: '讓摩卡上去', retry: false, ringWord: null });
  });

  test('hint-ghost-hand: the hand drags the train to its last stop', () => {
    expect(shown('hint-ghost-hand')).toMatchObject({ show: { level: 2, key: 'train', stop: 2 }, mocha: 'look', line: '拉拉看這裡' });
  });

  test('hint-wait: 「等等看。」, no target', () => {
    expect(shown('hint-wait')).toEqual({ show: null, mocha: 'wait', line: '等等看。', retry: false, ringWord: null });
  });
});
