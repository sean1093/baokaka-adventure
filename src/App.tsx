import { lazy, Suspense, useSyncExternalStore } from 'react';
import { ArtDefs } from './art/defs';
import PopupGame from './popup/PopupGame';
import { parseRoute } from './shared/route';

/**
 * The art lab is a dev tool (decisions.md D-13). In a production build `import.meta.env.DEV` is
 * the constant `false`, so this is `null` and the dynamic import is dropped from the bundle
 * entirely: `#/artlab` then shows the game like any unknown hash. It is the only place left that
 * reaches the retired RPG's code (`src/quest/`, deleted in #111), so the RPG is in no production
 * chunk (D-72).
 */
const ArtLab = import.meta.env.DEV ? lazy(() => import('./artlab/ArtLab')) : null;

/** 翻翻台北's dev-only PageLab (`#/pagelab`, GDD § 3.10), dropped from production the same way. */
const PageLab = import.meta.env.DEV ? lazy(() => import('./popup/dev/PageLab')) : null;

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

export interface AppProps {
  /** An old RPG save was found and deleted at this boot: the cover says so, once (#93, #109) */
  readonly farewell?: boolean;
}

/**
 * The whole site: 翻翻台北 Pop-Up Taipei at `#/` (and every hash that is not a dev tool, #109), in
 * the main bundle so the cover needs no second round trip; the dev tools lazily. Boot-time
 * housekeeping (old routes, old saves) lives in main.tsx.
 */
export const App = ({ farewell = false }: AppProps) => {
  const hash = useSyncExternalStore(subscribe, readHash);
  const route = parseRoute(hash);

  if (PageLab && route === 'pagelab') {
    return (
      <Suspense fallback={null}>
        <PageLab />
      </Suspense>
    );
  }
  if (ArtLab && route === 'artlab') {
    // <ArtDefs/> holds the RPG art's shared sprite gradients (art direction § 8.2), which the lab draws
    return (
      <>
        <ArtDefs />
        <Suspense fallback={null}>
          <ArtLab hash={hash} />
        </Suspense>
      </>
    );
  }
  return <PopupGame farewell={farewell} />;
};
