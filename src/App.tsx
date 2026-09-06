import { OrientationGuard } from './components/OrientationGuard';
import { FindGame } from './find/FindGame';
import { HubScreen } from './hub/HubScreen';
import { QuestGame } from './quest/QuestGame';
import { navigate, useRoute } from './shared/route';
import { SudokuGame } from './sudoku/SudokuGame';

/** The collection: a hub plus one component per game, picked by the URL hash. */
export const App = () => {
  const route = useRoute();

  return (
    <>
      <OrientationGuard />
      {route === 'hub' && <HubScreen onOpen={navigate} />}
      {route === 'find' && <FindGame onExit={() => navigate('hub')} />}
      {route === 'quest' && <QuestGame onExit={() => navigate('hub')} />}
      {route === 'sudoku' && <SudokuGame onExit={() => navigate('hub')} />}
    </>
  );
};
