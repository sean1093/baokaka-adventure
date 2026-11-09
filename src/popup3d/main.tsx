import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
// The game's self-hosted fonts and base styles, so the HUD and the fallback 2D page look as in the game
import '../fonts/fonts.css';
import '../components/kit.css';
import '../index.css';

/**
 * The three.js spike's page (#225): `popup3d.html#/popup3d?page=c1p2`. A separate HTML entry built
 * by its own config (`vite.popup3d.config.ts`), so the game's bundle and first load stay byte for
 * byte what they were. Inside it the 3D route is lazy too: three.js and the stage are a chunk of
 * their own, fetched after this small shell has painted.
 */
const Popup3DRoute = lazy(() => import('./Popup3DRoute'));

const host = document.getElementById('root');
if (!host) throw new Error('Missing #root element');
createRoot(host).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Popup3DRoute />
    </Suspense>
  </StrictMode>,
);
