import { describe, expect, test } from 'vitest';
import type { Level } from './types';
import { DEFAULT_PROGRESS } from './progress';
import { initialState, makeReducer } from './reducer';

/** Deliberately 2 targets per level: this proves the reducer reads targets.length instead of hard-coding 3. */
const levels: Level[] = [1, 2].map((id) => ({
  id,
  title: `Level ${id}`,
  palette: 'living',
  decor: [],
  targets: [
    { id: `l${id}-a`, name: '奶瓶', sprite: 'bottle', x: 0.25, y: 0.25, r: 0.11 },
    { id: `l${id}-b`, name: '小襪子', sprite: 'sock', x: 0.7, y: 0.7, r: 0.11 },
  ],
  story: `Story for level ${id}`,
}));

const reduce = makeReducer(levels);
const start = initialState(DEFAULT_PROGRESS);

/** Walk from the title screen to "playing level levelId". */
const enterScene = (levelId: number, state = start) =>
  reduce(reduce(state, { type: 'start' }), { type: 'openLevel', levelId });

describe('screen flow', () => {
  test('starts on the title screen', () => {
    expect(start.view).toEqual({ screen: 'title' });
  });

  test('starting the adventure opens the map', () => {
    expect(reduce(start, { type: 'start' }).view).toEqual({ screen: 'map' });
  });

  test('opening a level enters the scene with nothing found yet', () => {
    expect(enterScene(1).view).toEqual({ screen: 'scene', levelId: 1, found: [] });
  });

  test('a locked level cannot be opened', () => {
    expect(enterScene(2).view).toEqual({ screen: 'map' });
  });

  test('the story page opens only after everything is found', () => {
    let state = enterScene(1);
    state = reduce(state, { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-b' });
    expect(reduce(state, { type: 'finishScene' }).view).toEqual({ screen: 'story', levelId: 1 });
  });

  test('finishing a story page returns to the map', () => {
    const story = reduce({ ...start, view: { screen: 'story', levelId: 1 } }, { type: 'continueStory' });
    expect(story.view).toEqual({ screen: 'map' });
  });

  test('finishing the last story page goes to the ending', () => {
    const story = reduce({ ...start, view: { screen: 'story', levelId: 2 } }, { type: 'continueStory' });
    expect(story.view).toEqual({ screen: 'ending' });
  });

  test('play again on the ending returns to the map without clearing progress', () => {
    const done = { view: { screen: 'ending' } as const, progress: { unlockedLevel: 2, completed: [1, 2], sound: true } };
    const next = reduce(done, { type: 'backToMap' });
    expect(next.view).toEqual({ screen: 'map' });
    expect(next.progress).toEqual(done.progress);
  });
});

describe('hidden-object progress', () => {
  test('found targets accumulate', () => {
    const state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    expect(state.view).toEqual({ screen: 'scene', levelId: 1, found: ['l1-a'] });
  });

  test('tapping the same target twice does not double count', () => {
    let state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-a' });
    expect(state.view).toEqual({ screen: 'scene', levelId: 1, found: ['l1-a'] });
  });

  test('progress is not written before the level is cleared', () => {
    const state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    expect(state.progress).toEqual(DEFAULT_PROGRESS);
  });

  test('progress is written the moment the last target is found', () => {
    let state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-b' });
    expect(state.progress).toEqual({ unlockedLevel: 2, completed: [1], sound: true });
  });

  test('replaying a finished level never rewinds progress', () => {
    const ahead = { unlockedLevel: 2, completed: [1, 2], sound: true };
    let state = enterScene(1, { ...start, progress: ahead });
    state = reduce(state, { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-b' });
    expect(state.progress).toEqual(ahead);
  });
});

describe('sound toggle', () => {
  test('toggling sound flips the setting', () => {
    expect(reduce(start, { type: 'toggleSound' }).progress.sound).toBe(false);
  });

  test('toggling sound does not change the current screen', () => {
    const scene = enterScene(1);
    expect(reduce(scene, { type: 'toggleSound' }).view).toEqual(scene.view);
  });
});
