import { useMemo, useSyncExternalStore } from 'react';
import { hashParams } from '../shared/route';
import { initialState, replay, step } from './core';
import type { Input, PageDef, SimState } from './core/types';
import { TICK_MS, type TickSpeed } from './game/session';
import { pageById } from './pages';
import { PlaytestLog } from './game/playtest';
import { PagePlayer } from './view/PagePlayer';
import { GameShell } from './view/screens/GameShell';

/**
 * 翻翻台北 Pop-Up Taipei, the site's game at `#/` since the routing switch (#109; `#/popup`, its
 * earlier address, still opens it).
 *
 * The game is `GameShell` (#97; GDD § 2.13): the cover on 阿嬤's quilt, the page in the book frame
 * with its HUD and bottom bar, the pause menu, the 目錄, the page fold and the chapter turn, on the
 * save (`ProgressStore`, #93).
 *
 * Dev: `#/?page=c1p2` (or `#/popup?page=c1p2`) plays one page on its own (#89), with `tick=N` (start N idle ticks in),
 * `paused=1` (hold the clock), `speed=slow|normal|fast`, `demo=1` (after three idle ticks, play
 * the page's authored solution through the session) and `tutorial=1` (the prologue's scripted
 * tutorial runs, as on a first play in the shell, #106). The page is playable by touch and mouse (#90).
 *
 * Playtest (#110, every build): `#/?debug=metrics` keeps the playtest log on this device
 * (`game/playtest.ts`) and shows its chip: time per page, hints per level, 重來, copyable as text.
 */

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

/** Three idle ticks (he sets off and reaches), then the page's authored solution, one input per tick. */
function demoScript(def: PageDef): Input[] {
  const lead: Input[] = [{ t: 'none' }, { t: 'none' }, { t: 'none' }];
  const idle = idleTicks(def, lead.length);
  return [...lead, ...replay(def, def.solution, idle).ticks.map((t) => t.input)];
}

/** The state after `ticks` idle ticks (no input). */
function idleTicks(def: PageDef, ticks: number): SimState {
  let s = initialState(def);
  for (let i = 0; i < ticks; i++) s = step(def, s, { t: 'none' }).state;
  return s;
}

export interface PopupGameProps {
  /** An old RPG save was deleted at this boot (`retireRpgSave`): the cover shows `RPG_FAREWELL` once */
  readonly farewell?: boolean;
}

export default function PopupGame({ farewell = false }: PopupGameProps) {
  const params = hashParams(useSyncExternalStore(subscribe, readHash));
  const def = pageById(params.get('page') ?? '');
  const ticks = Math.max(0, Math.min(500, Number(params.get('tick')) || 0));
  const from = useMemo(() => (def && ticks > 0 ? idleTicks(def, ticks) : undefined), [def, ticks]);
  const speedParam = params.get('speed');
  const speed: TickSpeed = speedParam !== null && speedParam in TICK_MS ? (speedParam as TickSpeed) : 'normal';
  const demo = params.get('demo') === '1';
  const script = useMemo(() => (def && demo && ticks === 0 ? demoScript(def) : undefined), [def, demo, ticks]);
  const metrics = params.get('debug') === 'metrics';
  const playtest = useMemo(() => (metrics ? new PlaytestLog() : null), [metrics]);
  if (def) return <PagePlayer key={`${def.id}-${ticks}-${demo}`} def={def} from={from} speed={speed} paused={params.get('paused') === '1'} script={script} tutorials={params.get('tutorial') === '1'} />;
  return <GameShell farewell={farewell} playtest={playtest} />;
}
