import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { cleanupLegacyStorage } from './shared/legacy';
import { installRouteRedirect } from './shared/route';
import { browserStorage } from './shared/storage';
// The kit first, so Tailwind utilities (in index.css) can adjust a kit class where a screen needs to
import './components/kit.css';
import './index.css';

installRouteRedirect();
cleanupLegacyStorage(browserStorage());

const host = document.getElementById('root');
if (!host) throw new Error('Missing #root element');

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
