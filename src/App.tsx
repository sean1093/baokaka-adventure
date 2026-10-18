import { lazy, Suspense, useSyncExternalStore } from 'react';
import { OrientationGuard } from './components/OrientationGuard';
import { QuestGame } from './quest/QuestGame';
import { parseRoute } from './shared/route';

/**
 * The art lab is a dev tool (decisions.md D-13). In a production build `import.meta.env.DEV` is
 * the constant `false`, so this is `null` and the dynamic import is dropped from the bundle
 * entirely: `#/artlab` then shows the game like any unknown hash.
 */
const ArtLab = import.meta.env.DEV ? lazy(() => import('./artlab/ArtLab')) : null;

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

/** The whole site: one game. Boot-time housekeeping (old routes, old saves) lives in main.tsx. */
export const App = () => {
  const hash = useSyncExternalStore(subscribe, readHash);

  if (ArtLab && parseRoute(hash) === 'artlab') {
    return (
      <Suspense fallback={null}>
        <ArtLab hash={hash} />
      </Suspense>
    );
  }

  return (
    <>
      <OrientationGuard />
      <QuestGame />
    </>
  );
};
