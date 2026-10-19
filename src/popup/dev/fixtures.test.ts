import { describe, expect, test } from 'vitest';
import { ARTLAB_FIXTURES } from '../../artlab/fixtures';
import { hashParams } from '../../shared/route';
import { initialState } from '../core';
import { POPUP_FIXTURES, fixtureFrame, fixtureParams, popupFixture } from './fixtures';

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

  test('an unknown page throws', () => {
    expect(() => fixtureFrame({ name: 'x', page: 'nope', steps: [], note: 'x' })).toThrow(/no page 'nope'/);
  });
});

test('fixtureParams', () => {
  expect(fixtureParams(hashParams('#/pagelab?fixture=c1p2-riding&still=1'))).toEqual({ fixture: 'c1p2-riding', still: true });
  expect(fixtureParams(hashParams('#/pagelab?fixture=&still=yes'))).toEqual({ fixture: null, still: false });
  expect(fixtureParams(hashParams('#/pagelab'))).toEqual({ fixture: null, still: false });
});
