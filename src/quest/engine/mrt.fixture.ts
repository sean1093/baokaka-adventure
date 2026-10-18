import { EVENTS } from './events';
import { MAPS } from './maps';
import { STATIONS, type Station } from './mrt';
import { RIDE_TO, type GameMap, type MapId, type Step, type Terrain } from './types';

/**
 * A test-only 月亮線 network, independent of chapter content: two tiny landmark maps (`mrtA`,
 * `mrtB`), one ride car (`mrtCar`) and two stations. `installMrtFixture()` swaps it into the
 * engine's tables (MAPS, EVENTS, STATIONS) and returns the undo; vitest isolates each test file's
 * modules, so this never leaks into other files. Never imported by the game.
 */

export const FIXTURE_FLAG = 'fixturePass';

const LEGEND: Record<string, Terrain> = { '#': 'wall', '.': 'floor', D: 'door' };

/** A landmark: entry on the left, the gate NPC on the right, arrival tile beside the gate. */
const landmark = (id: string, title: string): GameMap => ({
  id: id as MapId,
  chapter: 1,
  title,
  palette: 'living',
  legend: LEGEND,
  grid: ['######', '#....#', '#....#', '######'],
  entry: { c: 1, r: 1 },
  mrtArrival: { c: 3, r: 2 },
  decor: [],
  npcs: [
    {
      id: 'mrtGate',
      name: '閘門',
      sprite: 'vendor',
      c: 4,
      r: 2,
      talk: [
        { when: FIXTURE_FLAG, event: 'fx.enter' },
        { event: 'fx.closed' },
      ],
    },
  ],
  chests: [],
  exits: [],
  triggers: [],
});

export const FIXTURE_MAPS: Record<string, GameMap> = {
  mrtA: landmark('mrtA', '甲站'),
  mrtB: {
    ...landmark('mrtB', '乙站'),
    // Arriving at B for the first time plays a once-trigger on the arrival tile
    triggers: [{ id: 'mrtB-welcome', c: 3, r: 2, event: 'fx.welcome', once: true }],
  },
  mrtCar: {
    id: 'mrtCar' as MapId,
    chapter: 1,
    title: '月亮線車廂',
    palette: 'living',
    legend: LEGEND,
    grid: ['#D####', '#....#', '######'],
    entry: { c: 1, r: 1 },
    decor: [],
    npcs: [],
    chests: [],
    exits: [{ c: 1, r: 0, to: RIDE_TO }],
    triggers: [
      // The announcement plays on every ride; the first-ride scene only once, one tile in
      { id: 'mrtCar-ride', c: 1, r: 1, event: 'fx.ride', arrival: true },
      { id: 'mrtCar-first', c: 2, r: 1, event: 'fx.first', once: true },
    ],
  },
};

export const FIXTURE_EVENTS: Record<string, Step[]> = {
  'fx.closed': [{ who: null, text: '捷運站的鐵門拉下來了。' }],
  'fx.enter': [{ who: null, text: '嗶——！' }, { do: 'travel' }],
  'fx.ride': [
    { who: null, text: '下一站，{station}。' },
    { who: null, text: '下一站，{stationTw}。' },
    { who: null, text: 'Next station, {stationEn}.' },
  ],
  'fx.first': [{ who: null, text: '第一次搭月亮線！' }],
  'fx.welcome': [{ who: null, text: '歡迎來到乙站。' }],
};

export const FIXTURE_STATIONS: Station[] = [
  { key: 'alpha', name: '甲站', nameTw: '甲站台', nameEn: 'Alpha', map: 'mrtA', car: 'mrtCar', unlock: FIXTURE_FLAG, line: 'red', pos: { x: 0.2, y: 0.2 } },
  { key: 'beta', name: '乙站', nameTw: '乙站台', nameEn: 'Beta', map: 'mrtB', car: 'mrtCar', unlock: FIXTURE_FLAG, line: 'red', pos: { x: 0.8, y: 0.8 } },
  { key: 'gamma', name: '丙站', nameTw: '丙站', nameEn: 'Gamma', map: 'mrtC', car: 'mrtCar', unlock: 'gammaOpen', line: 'blue', pos: { x: 0.5, y: 0.5 } },
];

/** Swaps the fixture network into the engine's tables; call the result to put everything back. */
export function installMrtFixture(): () => void {
  const maps = MAPS as Record<string, GameMap>;
  Object.assign(maps, FIXTURE_MAPS);
  Object.assign(EVENTS, FIXTURE_EVENTS);
  const real = STATIONS.splice(0, STATIONS.length, ...FIXTURE_STATIONS);
  return () => {
    for (const id of Object.keys(FIXTURE_MAPS)) delete maps[id];
    for (const key of Object.keys(FIXTURE_EVENTS)) delete EVENTS[key];
    STATIONS.splice(0, STATIONS.length, ...real);
  };
}
