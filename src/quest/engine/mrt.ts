import { MAPS } from './maps';
import type { GameMap, MapId, Run, Tile } from './types';

/**
 * 月亮線, the secret midnight metro (story bible § 3.1). Content tables plus the pure helpers the
 * reducer, the text substitution and the 路線圖 screen share.
 *
 * Stations are content: `STATIONS` holds all 14 rows of the bible from day one, but most of
 * their maps (and all five ride cars) arrive with later chapter issues. So `map` and `car` are
 * plain strings here, and a station only becomes rideable once both maps exist in `MAPS`
 * (`rideable`). validate.ts checks the stations whose maps exist and lists the rest as warnings.
 */

export type MrtLineId = 'blue' | 'red' | 'brown' | 'green' | 'orange';

/** A point on the stylised 路線圖, both axes 0..1 (x to the east, y to the south). */
export type MapPos = { x: number; y: number };

export type Station = {
  key: string;
  /** 站名, `{station}` */
  name: string;
  /** 台語, `{stationTw}` */
  nameTw: string;
  /** English, `{stationEn}` */
  nameEn: string;
  /** The landmark map the station serves (a `MapId` once that chapter lands) */
  map: string;
  /** The ride car taken to get there: the car of the line you would ride */
  car: string;
  /** The story flag that lights the station */
  unlock: string;
  /** Which line's colour the dot sits on */
  line: MrtLineId;
  /** Position on the stylised 路線圖 */
  pos: MapPos;
  /** Which side of the dot the label goes (default: right of the dot in the west half, left in the east) */
  label?: 'left' | 'right' | 'above' | 'below';
};

export type MrtLine = {
  name: string;
  /** Real line colour (art direction § 4.2, 月亮線 cars) */
  color: string;
  /** Polylines drawn for the line; a branch is its own polyline */
  paths: MapPos[][];
};

/** The five lines, drawn as a stylised (not official) network. Positions are content: #27/#56 tune them. */
export const MRT_LINES: Record<MrtLineId, MrtLine> = {
  red: {
    name: '淡水信義線',
    color: '#E3002C',
    paths: [
      [
        { x: 0.16, y: 0.05 },
        { x: 0.3, y: 0.16 },
        { x: 0.4, y: 0.3 },
        { x: 0.4, y: 0.52 },
        { x: 0.46, y: 0.6 },
        { x: 0.5, y: 0.66 },
        { x: 0.74, y: 0.66 },
        { x: 0.86, y: 0.72 },
      ],
      // The 新北投 spur
      [
        { x: 0.3, y: 0.16 },
        { x: 0.44, y: 0.1 },
      ],
    ],
  },
  blue: {
    name: '板南線',
    color: '#0070BD',
    paths: [
      [
        { x: 0.02, y: 0.62 },
        { x: 0.14, y: 0.6 },
        { x: 0.24, y: 0.56 },
        { x: 0.4, y: 0.52 },
        { x: 0.72, y: 0.52 },
        { x: 0.98, y: 0.5 },
      ],
    ],
  },
  brown: {
    name: '文湖線',
    color: '#C48C31',
    paths: [
      [
        { x: 0.98, y: 0.2 },
        { x: 0.8, y: 0.24 },
        { x: 0.68, y: 0.32 },
        { x: 0.64, y: 0.42 },
        { x: 0.64, y: 0.66 },
        { x: 0.68, y: 0.8 },
        { x: 0.84, y: 0.86 },
      ],
    ],
  },
  green: {
    name: '松山新店線',
    color: '#008659',
    paths: [
      [
        { x: 0.98, y: 0.4 },
        { x: 0.56, y: 0.42 },
        { x: 0.3, y: 0.46 },
        { x: 0.24, y: 0.56 },
        { x: 0.34, y: 0.66 },
        { x: 0.4, y: 0.79 },
        { x: 0.3, y: 0.94 },
      ],
    ],
  },
  orange: {
    name: '中和新蘆線',
    color: '#F8B61C',
    paths: [
      [
        { x: 0.02, y: 0.26 },
        { x: 0.22, y: 0.36 },
        { x: 0.36, y: 0.34 },
        { x: 0.52, y: 0.34 },
        { x: 0.52, y: 0.62 },
        { x: 0.37, y: 0.72 },
        { x: 0.2, y: 0.84 },
      ],
    ],
  },
};

/** Bible § 3.1 item 3, in table order. */
export const STATIONS: Station[] = [
  { key: 'daan', name: '大安森林公園', nameTw: '大安森林公園', nameEn: 'Daan Park', map: 'daan', car: 'carRed', unlock: 'moonPass', line: 'red', pos: { x: 0.5, y: 0.66 }, label: 'below' },
  { key: 'ntu', name: '公館', nameTw: '公館', nameEn: 'Gongguan', map: 'ntu', car: 'carGreen', unlock: 'moonPass', line: 'green', pos: { x: 0.4, y: 0.79 } },
  { key: 'station', name: '台北車站', nameTw: '台北車頭', nameEn: 'Taipei Main Station', map: 'station', car: 'carRed', unlock: 'moonPass', line: 'red', pos: { x: 0.4, y: 0.52 } },
  { key: 'ximen', name: '西門', nameTw: '西門', nameEn: 'Ximen', map: 'ximen', car: 'carBlue', unlock: 'moonPass', line: 'blue', pos: { x: 0.24, y: 0.56 }, label: 'below' },
  { key: 'longshan', name: '龍山寺', nameTw: '龍山寺', nameEn: 'Longshan Temple', map: 'longshan', car: 'carBlue', unlock: 'karaokeDone', line: 'blue', pos: { x: 0.14, y: 0.6 }, label: 'above' },
  { key: 'dadaocheng', name: '大橋頭', nameTw: '大橋頭', nameEn: 'Daqiaotou', map: 'dadaocheng', car: 'carOrange', unlock: 'pigeonDone', line: 'orange', pos: { x: 0.22, y: 0.36 }, label: 'below' },
  { key: 'shilin', name: '劍潭', nameTw: '劍潭', nameEn: 'Jiantan', map: 'shilin', car: 'carRed', unlock: 'dragonDone', line: 'red', pos: { x: 0.4, y: 0.3 } },
  { key: 'airport', name: '松山機場', nameTw: '松山機場', nameEn: 'Songshan Airport', map: 'airport', car: 'carBrown', unlock: 'cutletDone', line: 'brown', pos: { x: 0.68, y: 0.32 }, label: 'above' },
  { key: 'zoo', name: '動物園', nameTw: '動物園', nameEn: 'Taipei Zoo', map: 'zoo', car: 'carBrown', unlock: 'windsockDone', line: 'brown', pos: { x: 0.84, y: 0.86 }, label: 'below' },
  { key: 'bitan', name: '新店', nameTw: '新店', nameEn: 'Xindian', map: 'bitan', car: 'carGreen', unlock: 'teapotDone', line: 'green', pos: { x: 0.3, y: 0.94 }, label: 'left' },
  { key: 'beitou', name: '新北投', nameTw: '新北投', nameEn: 'Xinbeitou', map: 'beitou', car: 'carRed', unlock: 'swanDone', line: 'red', pos: { x: 0.44, y: 0.1 } },
  { key: 'tamsui', name: '淡水', nameTw: '淡水', nameEn: 'Tamsui', map: 'tamsui', car: 'carRed', unlock: 'cowDone', line: 'red', pos: { x: 0.16, y: 0.05 } },
  { key: 'tower', name: '台北101/世貿', nameTw: '台北101/世貿', nameEn: 'Taipei 101/World Trade Center', map: 'xinyi', car: 'carRed', unlock: 'metShushu', line: 'red', pos: { x: 0.74, y: 0.66 }, label: 'above' },
  { key: 'xiangshan', name: '象山', nameTw: '象山', nameEn: 'Xiangshan', map: 'xiangshan', car: 'carRed', unlock: 'cleared', line: 'red', pos: { x: 0.86, y: 0.72 }, label: 'below' },
];

const hasMap = (id: string): id is MapId => Object.prototype.hasOwnProperty.call(MAPS, id);

/** The map behind an id, if that map exists yet. */
export const mapById = (id: string): GameMap | undefined => (hasMap(id) ? MAPS[id] : undefined);

export const stationByKey = (key: string): Station | undefined => STATIONS.find((station) => station.key === key);

/** The station serving a landmark map (the first one, if content ever lists two). */
export const stationAt = (map: string): Station | undefined => STATIONS.find((station) => station.map === map);

/** Every map named as some station's ride car. */
export const carMaps = (): Set<string> => new Set(STATIONS.map((station) => station.car));

/** Lit on the 路線圖: the station's unlock flag is set. */
export const stationUnlocked = (run: Pick<Run, 'flags'>, station: Station): boolean => run.flags.includes(station.unlock);

/**
 * Can the party actually go there: the destination map has an `mrtArrival` tile and the ride car
 * exists with its entry tile. A lit station whose chapter has not landed yet is not rideable.
 */
export function rideMaps(station: Station): { destination: GameMap; arrival: Tile; car: GameMap } | null {
  const destination = mapById(station.map);
  const car = mapById(station.car);
  if (!destination?.mrtArrival || !car) return null;
  return { destination, arrival: destination.mrtArrival, car };
}

export const rideable = (station: Station): boolean => rideMaps(station) !== null;

/** Stations lit right now that the 路線圖 has never shown lit: they play their 「叮！」 this time. */
export const freshStations = (run: Pick<Run, 'flags' | 'seenStations'>): string[] =>
  STATIONS.filter((station) => stationUnlocked(run, station) && !run.seenStations.includes(station.key)).map((station) => station.key);

/**
 * The station `{station}` text refers to: the one the ride is heading to while in a car, else the
 * station of the map the party stands on.
 */
export function currentStation(run: Pick<Run, 'map' | 'rideTo'>): Station | undefined {
  if (run.rideTo !== null) return stationAt(run.rideTo);
  return stationAt(run.map);
}
