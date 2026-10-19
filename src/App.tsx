import { lazy, Suspense, useSyncExternalStore } from 'react';
import { ArtDefs } from './art/defs';
import { OrientationGuard } from './components/OrientationGuard';
import { QuestGame } from './quest/QuestGame';
import { parseRoute } from './shared/route';

/**
 * The art lab is a dev tool (decisions.md D-13). In a production build `import.meta.env.DEV` is
 * the constant `false`, so this is `null` and the dynamic import is dropped from the bundle
 * entirely: `#/artlab` then shows the game like any unknown hash.
 */
const ArtLab = import.meta.env.DEV ? lazy(() => import('./artlab/ArtLab')) : null;

/** 翻翻台北's dev-only PageLab (`#/pagelab`, GDD § 3.10), dropped from production the same way. */
const PageLab = import.meta.env.DEV ? lazy(() => import('./popup/dev/PageLab')) : null;

/**
 * 翻翻台北 Pop-Up Taipei at `#/popup` (GDD § 3.5), in every build. Its own chunk, so the RPG's
 * bundle does not grow with it until the routing switch (#109) makes it the default.
 */
const PopupGame = lazy(() => import('./popup/PopupGame'));

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

/**
 * The whole site: the RPG at `#/` until #109, 翻翻台北 at `#/popup`, and the dev tools. Boot-time
 * housekeeping (old routes, old saves) lives in main.tsx.
 */
export const App = () => {
  const hash = useSyncExternalStore(subscribe, readHash);
  const route = parseRoute(hash);

  if (route === 'popup') {
    return (
      <Suspense fallback={null}>
        <PopupGame />
      </Suspense>
    );
  }
  if (PageLab && route === 'pagelab') {
    return (
      <Suspense fallback={null}>
        <PageLab />
      </Suspense>
    );
  }

  // <ArtDefs/> holds the shared sprite gradients (art direction § 8.2): mounted once, above every RPG screen
  return (
    <>
      <ArtDefs />
      {ArtLab && route === 'artlab' ? (
        <Suspense fallback={null}>
          <ArtLab hash={hash} />
        </Suspense>
      ) : (
        <>
          <OrientationGuard />
          <QuestGame />
        </>
      )}
    </>
  );
};
