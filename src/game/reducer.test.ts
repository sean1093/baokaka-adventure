import { describe, expect, test } from 'vitest';
import type { Level } from './types';
import { DEFAULT_PROGRESS } from './progress';
import { initialState, makeReducer } from './reducer';

/** 刻意用「每關 2 個目標」，證明 reducer 讀的是 targets.length 而不是寫死 3。 */
const levels: Level[] = [1, 2].map((id) => ({
  id,
  title: `第 ${id} 關`,
  palette: 'living',
  decor: [],
  targets: [
    { id: `l${id}-a`, name: '奶瓶', sprite: 'bottle', x: 0.25, y: 0.25, r: 0.11 },
    { id: `l${id}-b`, name: '小襪子', sprite: 'sock', x: 0.7, y: 0.7, r: 0.11 },
  ],
  story: `第 ${id} 關的故事`,
}));

const reduce = makeReducer(levels);
const start = initialState(DEFAULT_PROGRESS);

/** 從 title 一路走到「正在玩第 levelId 關」。 */
const enterScene = (levelId: number, state = start) =>
  reduce(reduce(state, { type: 'start' }), { type: 'openLevel', levelId });

describe('畫面流', () => {
  test('一開始在標題畫面', () => {
    expect(start.view).toEqual({ screen: 'title' });
  });

  test('開始冒險進入地圖', () => {
    expect(reduce(start, { type: 'start' }).view).toEqual({ screen: 'map' });
  });

  test('選關進入場景，還沒找到任何東西', () => {
    expect(enterScene(1).view).toEqual({ screen: 'scene', levelId: 1, found: [] });
  });

  test('沒解鎖的關卡點不進去', () => {
    expect(enterScene(2).view).toEqual({ screen: 'map' });
  });

  test('找齊之後才會進入劇情頁', () => {
    let state = enterScene(1);
    state = reduce(state, { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-b' });
    expect(reduce(state, { type: 'finishScene' }).view).toEqual({ screen: 'story', levelId: 1 });
  });

  test('劇情頁看完回到地圖', () => {
    const story = reduce({ ...start, view: { screen: 'story', levelId: 1 } }, { type: 'continueStory' });
    expect(story.view).toEqual({ screen: 'map' });
  });

  test('最後一關的劇情頁看完進入結局', () => {
    const story = reduce({ ...start, view: { screen: 'story', levelId: 2 } }, { type: 'continueStory' });
    expect(story.view).toEqual({ screen: 'ending' });
  });

  test('結局頁的再玩一次回到地圖，且不清掉進度', () => {
    const done = { view: { screen: 'ending' } as const, progress: { unlockedLevel: 2, completed: [1, 2], sound: true } };
    const next = reduce(done, { type: 'backToMap' });
    expect(next.view).toEqual({ screen: 'map' });
    expect(next.progress).toEqual(done.progress);
  });
});

describe('尋物進度', () => {
  test('找到的目標會累積', () => {
    const state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    expect(state.view).toEqual({ screen: 'scene', levelId: 1, found: ['l1-a'] });
  });

  test('同一個目標點兩次不會重複累加', () => {
    let state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-a' });
    expect(state.view).toEqual({ screen: 'scene', levelId: 1, found: ['l1-a'] });
  });

  test('還沒找齊就不會更新進度', () => {
    const state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    expect(state.progress).toEqual(DEFAULT_PROGRESS);
  });

  test('找齊最後一個目標的同時就寫進度', () => {
    let state = reduce(enterScene(1), { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-b' });
    expect(state.progress).toEqual({ unlockedLevel: 2, completed: [1], sound: true });
  });

  test('重玩已完成的關卡，進度不會倒退', () => {
    const ahead = { unlockedLevel: 2, completed: [1, 2], sound: true };
    let state = enterScene(1, { ...start, progress: ahead });
    state = reduce(state, { type: 'found', targetId: 'l1-a' });
    state = reduce(state, { type: 'found', targetId: 'l1-b' });
    expect(state.progress).toEqual(ahead);
  });
});

describe('音效開關', () => {
  test('切換音效會翻轉設定', () => {
    expect(reduce(start, { type: 'toggleSound' }).progress.sound).toBe(false);
  });

  test('切換音效不會改變目前畫面', () => {
    const scene = enterScene(1);
    expect(reduce(scene, { type: 'toggleSound' }).view).toEqual(scene.view);
  });
});
