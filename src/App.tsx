import { useEffect, useMemo, useReducer } from 'react';
import { OrientationGuard } from './components/OrientationGuard';
import { unlockAudio } from './game/audio';
import { LEVELS } from './game/levels';
import { loadProgress, saveProgress } from './game/progress';
import { initialState, makeReducer } from './game/reducer';
import { validateLevels } from './game/validate';
import { EndingScreen } from './screens/EndingScreen';
import { MapScreen } from './screens/MapScreen';
import { SceneScreen } from './screens/SceneScreen';
import { StoryScreen } from './screens/StoryScreen';
import { TitleScreen } from './screens/TitleScreen';

// Blow up during development instead of silently shipping an unreachable target (spec §6)
if (import.meta.env.DEV) {
  const errors = validateLevels(LEVELS);
  if (errors.length > 0) throw new Error(`Invalid level data:\n${errors.join('\n')}`);
}

export const App = () => {
  const reduce = useMemo(() => makeReducer(LEVELS), []);
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState(loadProgress()));
  const { view, progress } = state;

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const level = 'levelId' in view ? LEVELS.find(({ id }) => id === view.levelId) : undefined;

  return (
    <>
      <OrientationGuard />

      {view.screen === 'title' && (
        <TitleScreen
          onStart={() => {
            unlockAudio(); // iOS only unlocks audio inside a user gesture
            dispatch({ type: 'start' });
          }}
        />
      )}

      {view.screen === 'map' && (
        <MapScreen
          levels={LEVELS}
          progress={progress}
          onOpenLevel={(levelId) => dispatch({ type: 'openLevel', levelId })}
        />
      )}

      {view.screen === 'scene' && level && (
        <SceneScreen
          level={level}
          found={view.found}
          soundOn={progress.sound}
          onFound={(targetId) => dispatch({ type: 'found', targetId })}
          onCleared={() => dispatch({ type: 'finishScene' })}
          onToggleSound={() => dispatch({ type: 'toggleSound' })}
        />
      )}

      {view.screen === 'story' && level && (
        <StoryScreen
          level={level}
          isLast={level.id >= LEVELS.length}
          onContinue={() => dispatch({ type: 'continueStory' })}
        />
      )}

      {view.screen === 'ending' && <EndingScreen onBackToMap={() => dispatch({ type: 'backToMap' })} />}
    </>
  );
};
