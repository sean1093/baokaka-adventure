import { useEffect, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { backdropFor } from '../art/backdrops/keys';
import { MRT } from '../art/palette';
import { REDUCE_MOTION_CLASS, ReducedMotionContext, usePrefersReducedMotion } from '../components/motion';
import { unlockAudio } from '../shared/audio';
import { DOOR_CHIME_MS, DOOR_CLOSE_MS, DOOR_OPEN_MS, MrtDoors } from './components/MrtDoors';
import type { StageFrame } from './engine/battle';
import { mapClock } from './engine/clock';
import { MAPS } from './engine/maps';
import { MRT_LINES, stationAt } from './engine/mrt';
import type { Follower } from './engine/progress';
import type { QuestAction, QuestState } from './engine/quest';
import { BattleScreen } from './screens/BattleScreen';
import { DefeatScreen } from './screens/DefeatScreen';
import { PartySheet, type SheetStart } from './screens/PartySheet';
import { QuestEndingScreen } from './screens/QuestEndingScreen';
import { QuestTitleScreen } from './screens/QuestTitleScreen';
import { ShopScreen } from './screens/ShopScreen';
import { TravelScreen } from './screens/TravelScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { WorldScreen } from './screens/WorldScreen';

type Props = {
  state: QuestState;
  dispatch: Dispatch<QuestAction>;
  /** An old-story save was just discarded: the title explains the fresh start */
  legacyNotice?: boolean;
  onDismissNotice?: () => void;
  /** Open the party sheet on mount (the art lab's menu fixtures), optionally on a tab with an item picked */
  menuOpen?: boolean | SheetStart;
  /** Escort table override (the art lab's follower fixture); defaults to the content's FOLLOWERS */
  followers?: readonly Follower[];
  /** The 路線圖's 「你在這裡」 station override (the art lab's travel fixture, until station maps exist) */
  travelHere?: string;
  /** The battle stage's frame override (the art lab's final-fight fixture, until 咻咻's forms exist) */
  battleFrame?: StageFrame;
};

/** The MRT doors between the map and a battle (§ 7.9): closing over the frozen map, then opening on the fight. */
type Doors = { phase: 'closing' | 'opening'; world: QuestState; stripe: string };

/**
 * The screen for the current view, wired to the reducer. No storage and no music: QuestGame adds
 * those, and the art lab renders this same component over fixture states, so its screenshots
 * always show the real wiring.
 */
export const QuestScreens = (props: Props) => {
  const reduced = props.state.settings.reducedMotion;

  // 減少動態 reaches CSS through a class on <html>, so portalled sheets follow it too
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(REDUCE_MOTION_CLASS, reduced);
    return () => root.classList.remove(REDUCE_MOTION_CLASS);
  }, [reduced]);

  return (
    <ReducedMotionContext.Provider value={reduced}>
      <CurrentScreen {...props} />
    </ReducedMotionContext.Provider>
  );
};

const CurrentScreen = ({ state, dispatch, legacyNotice = false, onDismissNotice = () => {}, menuOpen: openOnMount = false, followers, travelHere, battleFrame }: Props): ReactNode => {
  const [menuOpen, setMenuOpen] = useState(openOnMount !== false);
  const sheetStart = typeof openOnMount === 'object' ? openOnMount : undefined;
  const prefersReduced = usePrefersReducedMotion();
  const reduced = state.settings.reducedMotion || prefersReduced;

  // Map → battle: remember the last world state, and when a fight starts, keep drawing that world
  // (frozen) while the doors close, then the battle while they open. Decided during render, so the
  // world screen is never torn down and rebuilt for a frame.
  const lastWorld = useRef<QuestState | null>(null);
  const [seen, setSeen] = useState(state.view.screen);
  const [doors, setDoors] = useState<Doors | null>(null);
  if (seen !== state.view.screen) {
    setSeen(state.view.screen);
    if (seen === 'world' && state.view.screen === 'battle' && !reduced && lastWorld.current) {
      const line = stationAt(state.run.map)?.line;
      setDoors({ phase: 'closing', world: lastWorld.current, stripe: line ? MRT_LINES[line].color : MRT.red });
    } else setDoors(null);
  }
  if (state.view.screen === 'world') lastWorld.current = state;

  useEffect(() => {
    if (!doors) return undefined;
    const timer = window.setTimeout(
      () => setDoors((now) => (now?.phase === 'closing' ? { ...now, phase: 'opening' } : null)),
      doors.phase === 'closing' ? DOOR_CLOSE_MS + DOOR_CHIME_MS : DOOR_OPEN_MS,
    );
    return () => window.clearTimeout(timer);
  }, [doors]);

  const closing = doors?.phase === 'closing';
  const shown = closing ? doors.world : state;
  const { view, run, sound, settings } = shown;
  const ignore = () => {};

  switch (view.screen) {
    case 'title':
      return (
        <QuestTitleScreen
          run={run}
          legacyNotice={legacyNotice}
          onDismissNotice={onDismissNotice}
          onNew={() => {
            unlockAudio();
            dispatch({ type: 'newGame', seed: Date.now() | 0 });
          }}
          onContinue={() => {
            unlockAudio();
            dispatch({ type: 'continue' });
          }}
        />
      );

    case 'world':
      return (
        <>
          <WorldScreen
            state={shown}
            onStep={closing ? ignore : (tile, facing) => dispatch({ type: 'step', tile, facing })}
            onInteract={closing ? ignore : (id) => dispatch({ type: 'interact', id })}
            onAdvance={closing ? ignore : () => dispatch({ type: 'advance' })}
            onInn={closing ? ignore : (yes) => dispatch({ type: 'innAnswer', yes })}
            onChoose={closing ? ignore : (index) => dispatch({ type: 'choose', index })}
            onMenu={() => setMenuOpen(true)}
            onExit={() => dispatch({ type: 'backToTitle' })}
            followers={followers}
          />
          <PartySheet
            open={menuOpen}
            start={sheetStart}
            run={run}
            sound={sound}
            reducedMotion={settings.reducedMotion}
            onClose={() => setMenuOpen(false)}
            onUseItem={(item, hero) => dispatch({ type: 'useItem', item, hero })}
            onEquip={(item, hero) => dispatch({ type: 'equip', item, hero })}
            onToggleSound={() => dispatch({ type: 'toggleSound' })}
            onReducedMotion={(on) => dispatch({ type: 'setReducedMotion', on })}
          />
          {closing && <MrtDoors phase="closing" stripe={doors.stripe} />}
        </>
      );

    case 'battle': {
      const map = MAPS[run.map];
      return (
        <>
          <BattleScreen
            battle={view.battle}
            backdrop={backdropFor(map)}
            interior={map.interior}
            time={mapClock(map)}
            place={{ title: map.title, time: mapClock(map) }}
            frame={battleFrame}
            soundOn={sound}
            onAction={(action) => dispatch({ type: 'battle', action })}
            onEnd={() => dispatch({ type: 'battleEnd' })}
            onToggleSound={() => dispatch({ type: 'toggleSound' })}
          />
          {doors?.phase === 'opening' && <MrtDoors phase="opening" stripe={doors.stripe} />}
        </>
      );
    }

    case 'victory':
      return <VictoryScreen summary={view.summary} soundOn={sound} onContinue={() => dispatch({ type: 'victoryContinue' })} />;

    case 'defeat':
      return <DefeatScreen soundOn={sound} onRetry={() => dispatch({ type: 'retry' })} />;

    case 'shop':
      return (
        <ShopScreen
          stock={view.stock}
          run={run}
          onBuy={(item) => dispatch({ type: 'buy', item })}
          onClose={() => dispatch({ type: 'closeShop' })}
        />
      );

    case 'travel':
      return (
        <TravelScreen
          run={run}
          fresh={view.fresh}
          note={view.note}
          skipRides={settings.skipRides}
          here={travelHere}
          onRide={(station) => dispatch({ type: 'ride', station })}
          onClose={() => dispatch({ type: 'closeTravel' })}
          onAdvance={() => dispatch({ type: 'advance' })}
          onSkipRides={(on) => dispatch({ type: 'setSkipRides', on })}
        />
      );

    case 'ending':
      return <QuestEndingScreen run={run} soundOn={sound} onContinue={() => dispatch({ type: 'endingContinue' })} />;
  }
};
