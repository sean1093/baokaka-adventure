import { useSyncExternalStore } from 'react';
import { pageById } from '../popup/pages';
import { hashParams } from '../shared/route';
import { Popup3D } from './Popup3D';

/**
 * `popup3d.html#/popup3d?page=c1p2` (#225): the three.js spike's route, in dev and production
 * builds, on its own page (`main.tsx`), which imports this file lazily: three.js and the 3D view
 * are a chunk of their own and the game's bundle is untouched. Params: `page` (default c1p2), `fps=1`, `shadows=map|blob|off`, `dpr`,
 * `reduced=1`, `speed`.
 */
const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

export default function Popup3DRoute() {
  const hash = useSyncExternalStore(subscribe, readHash);
  const params = hashParams(hash);
  const def = pageById(params.get('page') ?? 'c1p2') ?? pageById('c1p2')!;
  return <Popup3D key={`${def.id}:${hash}`} def={def} params={params} />;
}
