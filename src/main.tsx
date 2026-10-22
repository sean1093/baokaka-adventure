import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { retireRpgSave } from './popup/game/progress';
import { cleanupLegacyStorage } from './shared/legacy';
import { installRouteRedirect } from './shared/route';
import { browserStorage } from './shared/storage';
// The self-hosted web fonts (#68, D-105): subsets of the game's own text, fetched per slice
import './fonts/fonts.css';
// The kit first, so Tailwind utilities (in index.css) can adjust a kit class where a screen needs to
import './components/kit.css';
import './index.css';

installRouteRedirect();
const storage = browserStorage();
cleanupLegacyStorage(storage);
// The routing switch (#109): the RPG is gone, so its saves go too; the cover says one warm line, once (§ 2.10, D-55)
const farewell = retireRpgSave(storage);

const host = document.getElementById('root');
if (!host) throw new Error('Missing #root element');

createRoot(host).render(
  <StrictMode>
    <App farewell={farewell} />
  </StrictMode>,
);
