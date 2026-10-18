import { OrientationGuard } from './components/OrientationGuard';
import { QuestGame } from './quest/QuestGame';

/** The whole site: one game. Boot-time housekeeping (old routes, old saves) lives in main.tsx. */
export const App = () => (
  <>
    <OrientationGuard />
    <QuestGame />
  </>
);
