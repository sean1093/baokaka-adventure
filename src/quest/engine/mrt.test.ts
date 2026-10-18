import { describe, expect, test } from 'vitest';
import { EVENTS } from './events';
import { MAPS } from './maps';
import { FIXTURE_EVENTS, FIXTURE_FLAG, FIXTURE_MAPS, FIXTURE_STATIONS, installMrtFixture } from './mrt.fixture';
import { MRT_LINES, STATIONS, currentStation, freshStations, rideable, stationAt, stationUnlocked, type Station } from './mrt';
import { freshRun } from './quest';
import { runScene } from './scene';
import { RIDE_TO, type GameMap, type MapId, type Step } from './types';
import { LINE_MAX, lineWidth, mrtWarnings, validateMap, validateMrt } from './validate';

const check = (maps: Record<string, GameMap> = FIXTURE_MAPS, stations: Station[] = FIXTURE_STATIONS, events: Record<string, Step[]> = FIXTURE_EVENTS): string[] => {
  const errors: string[] = [];
  validateMrt(maps, stations, events, errors);
  return errors;
};

const withMap = (id: string, change: Partial<GameMap>): Record<string, GameMap> => ({ ...FIXTURE_MAPS, [id]: { ...FIXTURE_MAPS[id], ...change } });

describe('STATIONS', () => {
  test('is the 14 rows of bible § 3.1, in order', () => {
    expect(STATIONS.map((station) => station.key)).toEqual([
      'daan', 'ntu', 'station', 'ximen', 'longshan', 'dadaocheng', 'shilin', 'airport', 'zoo', 'bitan', 'beitou', 'tamsui', 'tower', 'xiangshan',
    ]);
    expect(STATIONS.find((station) => station.key === 'tower')).toMatchObject({ name: '台北101/世貿', nameEn: 'Taipei 101/World Trade Center', map: 'xinyi', car: 'carRed', unlock: 'metShushu' });
    expect(STATIONS.find((station) => station.key === 'station')).toMatchObject({ nameTw: '台北車頭', car: 'carRed', unlock: 'moonPass' });
    expect(new Set(STATIONS.map((station) => station.car))).toEqual(new Set(['carRed', 'carBlue', 'carGreen', 'carOrange', 'carBrown']));
  });

  test('every station dot sits on a path of its own line', () => {
    const onSegment = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
      const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      const within = Math.min(a.x, b.x) - 1e-9 <= p.x && p.x <= Math.max(a.x, b.x) + 1e-9 && Math.min(a.y, b.y) - 1e-9 <= p.y && p.y <= Math.max(a.y, b.y) + 1e-9;
      return Math.abs(cross) < 1e-9 && within;
    };
    for (const station of STATIONS) {
      const paths = MRT_LINES[station.line].paths;
      const on = paths.some((path) => path.some((point, index) => index > 0 && onSegment(station.pos, path[index - 1], point)));
      expect(on, station.key).toBe(true);
    }
  });

  test('the shipped content passes the 月亮線 rules, and every unbuilt station is a warning', () => {
    expect(check(MAPS, STATIONS, EVENTS)).toEqual([]);
    expect(mrtWarnings()).toHaveLength(STATIONS.filter((station) => !rideable(station)).length);
    expect(mrtWarnings()).toContain('station daan cannot be ridden yet: no map daan or carRed');
  });

  test('lookups: unlocked by flag, fresh until seen, current station in and out of a car', () => {
    const daan = stationAt('daan') as Station;
    expect(stationUnlocked({ flags: [] }, daan)).toBe(false);
    expect(stationUnlocked({ flags: ['moonPass'] }, daan)).toBe(true);
    expect(freshStations({ flags: ['moonPass'], seenStations: ['ntu'] })).toEqual(['daan', 'station', 'ximen']);
    expect(currentStation({ map: 'carRed' as MapId, rideTo: 'ximen' as MapId })?.key).toBe('ximen');
    expect(currentStation({ map: 'ntu' as MapId, rideTo: null })?.key).toBe('ntu');
    expect(currentStation(freshRun(1))).toBeUndefined();
  });

  test('the ending sets the `cleared` flag, which lights 象山', () => {
    const { run } = runScene(freshRun(1), { steps: [{ do: 'ending' }], at: 0 });
    expect(run.cleared).toBe(true);
    expect(stationUnlocked(run, stationAt('xiangshan') as Station)).toBe(true);
  });
});

describe('validateMrt', () => {
  test('the fixture network is valid, maps included', () => {
    expect(check()).toEqual([]);
    const errors: string[] = [];
    const uninstall = installMrtFixture();
    try {
      for (const map of Object.values(FIXTURE_MAPS)) validateMap(map, errors, FIXTURE_MAPS);
    } finally {
      uninstall();
    }
    expect(errors).toEqual([]);
  });

  test('a station whose map exists must have an mrtArrival', () => {
    expect(check(withMap('mrtA', { mrtArrival: undefined }))).toContain('station alpha: map mrtA needs an mrtArrival tile');
  });

  test('station rows: unique keys and maps, three names, a real line, a position on the map', () => {
    const bad: Station[] = [
      ...FIXTURE_STATIONS,
      { ...FIXTURE_STATIONS[0], nameEn: '' },
      { ...FIXTURE_STATIONS[1], key: 'delta', map: 'mrtD', line: 'pink' as never, pos: { x: 1.2, y: 0 } },
      { ...FIXTURE_STATIONS[1], key: 'epsilon', map: 'mrtCar' },
    ];
    const errors = check(FIXTURE_MAPS, bad);
    expect(errors).toContain('station alpha: defined twice');
    expect(errors).toContain('station alpha: map mrtA already has a station');
    expect(errors).toContain('station alpha: needs a name in all three languages');
    expect(errors).toContain('station delta: unknown line pink');
    expect(errors).toContain('station delta: pos must be within 0..1, got 1.2,0');
    expect(errors).toContain('station epsilon: its map mrtCar is a ride car');
  });

  test('@rideTo exits only in ride cars', () => {
    const errors = check(withMap('mrtA', { exits: [{ c: 1, r: 1, to: RIDE_TO }] }));
    expect(errors).toContain(`map mrtA: only a ride car (a station's car) may have a ${RIDE_TO} exit`);
  });

  test('a ride car needs a door to @rideTo and an arrival-only entry trigger, and no encounters', () => {
    expect(check(withMap('mrtCar', { exits: [] }))).toContain(`map mrtCar: a ride car needs a door exit to ${RIDE_TO}`);
    expect(check(withMap('mrtCar', { exits: [{ c: 1, r: 1, to: RIDE_TO }] }))).toContain(`map mrtCar: the ${RIDE_TO} exit must be on a door tile`);
    expect(check(withMap('mrtCar', { exits: [{ c: 1, r: 0, to: RIDE_TO, when: 'x' }] }))).toContain(`map mrtCar: the ${RIDE_TO} door must always be open`);
    expect(check(withMap('mrtCar', { triggers: [] }))).toContain('map mrtCar: a ride car needs an entry trigger (the announcement) on its entry tile');
    const once = withMap('mrtCar', { triggers: [{ id: 'a', c: 1, r: 1, event: 'fx.ride', once: true, arrival: true }] });
    expect(check(once).some((error) => error.startsWith('map mrtCar: the entry trigger must be `arrival: true`'))).toBe(true);
    const walked = withMap('mrtCar', { triggers: [{ id: 'a', c: 1, r: 1, event: 'fx.ride' }] });
    expect(check(walked).some((error) => error.startsWith('map mrtCar: the entry trigger must be `arrival: true`'))).toBe(true);
    const fights = withMap('mrtCar', { encounters: { groups: [['dustBunny']], rate: 0.1, min: 3 } });
    expect(check(fights)).toContain('map mrtCar: ride cars have no random encounters');
  });

  test('a line with a station placeholder must fit LINE_MAX with the longest station name', () => {
    // 32 characters around the placeholder: fine with a 3-character name, 42 with the 10-character one
    const long = '這真的是一句很長很長很長很長很長很長很長很長很長很長很長的話：{station}。';
    const errors = check(FIXTURE_MAPS, [...FIXTURE_STATIONS, { ...FIXTURE_STATIONS[0], key: 'long', map: 'mrtL', name: '非常非常非常長的站名' }], {
      ...FIXTURE_EVENTS,
      'fx.long': [{ who: null, text: long }],
      'fx.prompt': [{ do: 'choice', prompt: long, options: [{ label: '好', event: 'fx.first' }, { label: '不要', event: 'fx.first' }] }],
    });
    expect(errors.filter((error) => error.includes(`over ${LINE_MAX} characters`)).map((error) => error.split(':')[0])).toEqual(['event fx.long[0]', 'event fx.prompt[0]']);
  });

  test('lineWidth counts half-width Latin as half', () => {
    expect(lineWidth('台北車站')).toBe(4);
    expect(lineWidth('ab 1')).toBe(2);
    expect(lineWidth('「Next station, Taipei 101/World Trade Center.」')).toBe(24);
  });
});

describe('validateMap: mrtArrival', () => {
  const errorsFor = (change: Partial<GameMap>): string[] => {
    const errors: string[] = [];
    validateMap({ ...FIXTURE_MAPS.mrtA, ...change }, errors, FIXTURE_MAPS);
    return errors;
  };

  test('must be a free walkable tile next to the gate, off any exit, reachable from the entry', () => {
    expect(errorsFor({ mrtArrival: { c: 9, r: 9 } })).toContain('map mrtA: mrtArrival is outside the grid');
    expect(errorsFor({ mrtArrival: { c: 0, r: 1 } })).toContain('map mrtA: mrtArrival is on a blocked tile');
    expect(errorsFor({ mrtArrival: { c: 4, r: 2 } })).toContain('map mrtA: mrtArrival sits under npc mrtGate');
    expect(errorsFor({ mrtArrival: { c: 1, r: 2 } })).toContain('map mrtA: mrtArrival must be next to the mrtGate NPC');
    const exits = [{ c: 3, r: 2, to: 'mrtB' as MapId, at: { c: 1, r: 1 } }];
    expect(errorsFor({ exits })).toContain('map mrtA: mrtArrival is on an exit, so arriving would leave again');
    const walled = { grid: ['######', '#.#..#', '#.#..#', '######'], npcs: [], entry: { c: 1, r: 1 } };
    expect(errorsFor(walled)).toContain('map mrtA: mrtArrival cannot be reached from the entry');
  });

  test('the fixture is unlocked by its own flag', () => {
    expect(FIXTURE_STATIONS.filter((station) => station.unlock === FIXTURE_FLAG)).toHaveLength(2);
  });
});
