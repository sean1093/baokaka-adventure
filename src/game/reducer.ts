import type { Level, Progress } from './types';
import { completeLevel } from './progress';

export type View =
  | { screen: 'title' }
  | { screen: 'map' }
  | { screen: 'scene'; levelId: number; found: string[] }
  | { screen: 'story'; levelId: number }
  | { screen: 'ending' };

export type State = { view: View; progress: Progress };

export type Action =
  | { type: 'start' }
  | { type: 'openLevel'; levelId: number }
  | { type: 'found'; targetId: string }
  | { type: 'finishScene' }
  | { type: 'continueStory' }
  | { type: 'backToMap' }
  | { type: 'toggleSound' };

export const initialState = (progress: Progress): State => ({
  view: { screen: 'title' },
  progress,
});

/**
 * spec §4 的狀態機。純函式：不碰 localStorage、不排計時器。
 * 存檔由 App 在 progress 變動時的 effect 負責。
 */
export function makeReducer(levels: Level[]): (state: State, action: Action) => State {
  const lastLevelId = levels.at(-1)?.id ?? 1;

  return (state, action) => {
    const { view } = state;

    switch (action.type) {
      case 'start':
        return { ...state, view: { screen: 'map' } };

      case 'openLevel':
        if (action.levelId > state.progress.unlockedLevel) return state;
        return { ...state, view: { screen: 'scene', levelId: action.levelId, found: [] } };

      case 'found': {
        if (view.screen !== 'scene' || view.found.includes(action.targetId)) return state;
        const found = [...view.found, action.targetId];
        const level = levels.find((candidate) => candidate.id === view.levelId);
        const cleared = level !== undefined && found.length === level.targets.length;
        return {
          view: { ...view, found },
          progress: cleared
            ? completeLevel(state.progress, view.levelId, lastLevelId)
            : state.progress,
        };
      }

      case 'finishScene':
        if (view.screen !== 'scene') return state;
        return { ...state, view: { screen: 'story', levelId: view.levelId } };

      case 'continueStory':
        if (view.screen !== 'story') return state;
        return {
          ...state,
          view: view.levelId >= lastLevelId ? { screen: 'ending' } : { screen: 'map' },
        };

      case 'backToMap':
        return { ...state, view: { screen: 'map' } };

      case 'toggleSound':
        return { ...state, progress: { ...state.progress, sound: !state.progress.sound } };
    }
  };
}
