import { spriteMeta, type SpriteComponent } from '../../art/sprite';
import { SPRITES } from '../../art/sprites';
import { BACKLIGHT } from '../../art/palette';
import { EVENTS, ROLE_BACKLIGHT, SPEAKERS } from './events';
import { FOES } from './foes';
import { ITEMS, ITEM_ORDER, MAX_LEVEL, SPELLS, XP_TABLE } from './heroes';
import { TERRAIN, covers, terrainAt } from './iso';
import { MAPS, MAP_ORDER } from './maps';
import { MRT_LINES, STATIONS, type Station } from './mrt';
import { findPath, isSolid } from './path';
import {
  BESTIARY_FLAG,
  BESTIARY_FOES,
  COLLECTIONS,
  COLLECTION_LINE_MAX,
  DERIVED,
  FOLLOWERS,
  QUESTS,
  QUEST_HINT_MAX,
  TRAY,
  type Derived,
  type Follower,
  type SideQuest,
} from './progress';
import { CLEARED_FLAG } from './scene';
import { STATION_PLACEHOLDERS, fillStation } from './text';
import { HERO_ORDER, RIDE_TO, type GameMap, type Item, type ItemId, type Step, type Tile } from './types';

/** At most three foes fit across the battle box. */
export const MAX_FOES_PER_BATTLE = 3;

/** A chapter card's or map's clock, 00:00–23:59 (decision D-16). */
export const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A choice shows 2–3 buttons whose labels fit one line on a phone. */
export const CHOICE_OPTIONS = { min: 2, max: 3 } as const;
export const CHOICE_LABEL_MAX = 12;

/** The longest 「下一站」 station name the chapter card's departure board fits. */
export const CHAPTER_NEXT_MAX = 8;

/** How deep `include` may nest (an include inside an included event is depth 2). */
export const MAX_INCLUDE_DEPTH = 4;

/** True when every 【 closes with a 】 before the next 【, and no pair is empty. */
export function markupBalanced(text: string): boolean {
  let open = false;
  let inside = 0;
  for (const char of text) {
    if (char === '【') {
      if (open) return false;
      open = true;
      inside = 0;
    } else if (char === '】') {
      if (!open || inside === 0) return false;
      open = false;
    } else if (open) inside += 1;
  }
  return !open;
}

/** Speakers: a known role, a real backlight colour and sprite (art direction § 7.5). */
export function validateSpeakers(speakers: typeof SPEAKERS, errors: string[]): void {
  for (const [id, entry] of Object.entries(speakers)) {
    if (!SPRITES[entry.sprite]) errors.push(`speaker ${id} has unknown sprite ${entry.sprite}`);
    if (!Object.prototype.hasOwnProperty.call(ROLE_BACKLIGHT, entry.role)) errors.push(`speaker ${id} has unknown role ${entry.role}`);
    if (entry.color !== undefined && !Object.prototype.hasOwnProperty.call(BACKLIGHT, entry.color)) errors.push(`speaker ${id} has unknown backlight ${entry.color}`);
  }
}

/** Checks one script's steps; exported so tests can feed it broken scripts. */
export function validateSteps(where: string, steps: Step[], errors: string[]): void {
  for (const [index, step] of steps.entries()) {
    const at = `${where}[${index}]`;
    if ('text' in step) {
      if (step.text.length === 0) errors.push(`${at}: empty line`);
      if (step.who !== null && !HERO_ORDER.includes(step.who as never) && !SPEAKERS[step.who]) {
        errors.push(`${at}: unknown speaker ${step.who}`);
      }
      // Key-term markup (【詞】, art direction § 7.5): brackets pair up, never nest, never empty
      if (!markupBalanced(step.text)) errors.push(`${at}: unbalanced or empty 【】 key-term markup`);
      if (step.expr !== undefined && !/^[a-z][a-zA-Z]*$/.test(step.expr)) errors.push(`${at}: expr must be a camelCase name, got ${JSON.stringify(step.expr)}`);
      if (step.expr !== undefined && step.who === null) errors.push(`${at}: narration has no face, so no expr`);
      continue;
    }
    switch (step.do) {
      case 'battle':
        if (step.foes.length === 0 || step.foes.length > MAX_FOES_PER_BATTLE) errors.push(`${at}: 1..${MAX_FOES_PER_BATTLE} foes, got ${step.foes.length}`);
        for (const foe of step.foes) if (!FOES[foe]) errors.push(`${at}: unknown foe ${foe}`);
        break;
      case 'give':
        if (!ITEMS[step.item]) errors.push(`${at}: unknown item ${step.item}`);
        break;
      case 'shop':
        if (step.stock.length === 0) errors.push(`${at}: empty shop`);
        for (const item of step.stock) {
          if (!ITEMS[item]) errors.push(`${at}: unknown item ${item}`);
          // price 0 marks a gift or quest reward (bible § 6 "—"): it must never be on sale
          else if (ITEMS[item].price <= 0) errors.push(`${at}: shop sells ${item}, which has no price (a gift item)`);
        }
        if (new Set(step.stock).size !== step.stock.length) errors.push(`${at}: shop lists an item twice`);
        break;
      case 'goto':
        if (!MAPS[step.map]) errors.push(`${at}: unknown map ${step.map}`);
        break;
      case 'coins':
        if (!Number.isInteger(step.amount)) errors.push(`${at}: coins amount must be an integer, got ${step.amount}`);
        break;
      case 'join':
        if (!HERO_ORDER.includes(step.hero)) errors.push(`${at}: unknown hero ${step.hero}`);
        break;
      case 'chapter':
        if (!Number.isInteger(step.n) || step.n < 0) errors.push(`${at}: chapter number must be a whole number, got ${step.n}`);
        if (step.title.length === 0) errors.push(`${at}: chapter without a title`);
        if (step.time !== undefined && !CLOCK.test(step.time)) errors.push(`${at}: chapter time must be HH:MM, got "${step.time}"`);
        if (step.label !== undefined && step.label.length === 0) errors.push(`${at}: empty chapter label`);
        // The departure board fits about eight characters after 「下一站：」
        if (step.next !== undefined && (step.next.length === 0 || step.next.length > CHAPTER_NEXT_MAX)) errors.push(`${at}: chapter next station must be 1–${CHAPTER_NEXT_MAX} characters, got "${step.next}"`);
        if (step.next !== undefined && step.time === undefined) errors.push(`${at}: a next station shows on the clock, so the card needs a time`);
        break;
      case 'heal':
        if (step.ratio !== undefined && !(step.ratio > 0 && step.ratio <= 1)) errors.push(`${at}: heal ratio must be in (0, 1], got ${step.ratio}`);
        break;
      case 'inn':
        if (!Number.isInteger(step.price) || step.price < 0) errors.push(`${at}: inn price must be a whole number ≥ 0, got ${step.price}`);
        break;
      case 'choice': {
        const count = step.options.length;
        if (count < CHOICE_OPTIONS.min || count > CHOICE_OPTIONS.max) {
          errors.push(`${at}: choice needs ${CHOICE_OPTIONS.min}..${CHOICE_OPTIONS.max} options, got ${count}`);
        }
        if (step.prompt !== undefined && step.prompt.length === 0) errors.push(`${at}: empty choice prompt`);
        for (const [index, option] of step.options.entries()) {
          if (option.label.length === 0) errors.push(`${at}: choice option ${index} has no label`);
          if (option.label.length > CHOICE_LABEL_MAX) errors.push(`${at}: choice label "${option.label}" is over ${CHOICE_LABEL_MAX} characters`);
          if (!EVENTS[option.event]) errors.push(`${at}: choice option ${index} points at missing event ${option.event}`);
        }
        break;
      }
      case 'goEvent':
        if (!EVENTS[step.event]) errors.push(`${at}: goEvent points at missing event ${step.event}`);
        break;
      case 'include':
        if (!EVENTS[step.event]) errors.push(`${at}: include points at missing event ${step.event}`);
        break;
    }
  }
}

/** Events a script hands over to: choice options, `goEvent` and `include` targets. */
export const referencedEvents = (steps: Step[]): string[] =>
  steps.flatMap((step) => {
    if ('text' in step) return [];
    if (step.do === 'choice') return step.options.map((option) => option.event);
    if (step.do === 'goEvent' || step.do === 'include') return [step.event];
    return [];
  });

/**
 * `include` splices another event inline, so it must terminate and stay linear: no cycles, at most
 * MAX_INCLUDE_DEPTH levels, and no `choice` / `goEvent` inside (those drop the rest of the scene,
 * which would silently cut off the event that did the including). Takes the event table so tests
 * can feed it broken ones.
 */
export function validateIncludes(events: Record<string, Step[]>, errors: string[]): void {
  const reported = new Set<string>();
  const report = (message: string) => {
    if (reported.has(message)) return;
    reported.add(message);
    errors.push(message);
  };

  const walk = (key: string, chain: string[]) => {
    for (const step of events[key] ?? []) {
      if ('text' in step || step.do !== 'include' || !events[step.event]) continue;
      const target = step.event;
      if (chain.includes(target)) {
        report(`event ${chain[0]}: include cycle ${[...chain, target].join(' → ')}`);
        continue;
      }
      const depth = chain.length;
      if (depth > MAX_INCLUDE_DEPTH) {
        report(`event ${chain[0]}: includes nest deeper than ${MAX_INCLUDE_DEPTH} (${[...chain, target].join(' → ')})`);
        continue;
      }
      for (const inner of events[target]) {
        if (!('text' in inner) && (inner.do === 'choice' || inner.do === 'goEvent')) {
          report(`event ${target}: is included (by ${key}) but has a ${inner.do}, which would drop the rest of ${key}`);
        }
      }
      walk(target, [...chain, target]);
    }
  };

  for (const key of Object.keys(events)) walk(key, [key]);
}

const inGrid = (map: GameMap, tile: Tile): boolean =>
  tile.r >= 0 && tile.r < map.grid.length && tile.c >= 0 && tile.c < map.grid[0].length;

/**
 * One map's layout and references. `maps` resolves exit targets; tests pass their own table.
 * The 月亮線 rules that need the station table (`@rideTo` only in cars, `mrtArrival` on every
 * station's map) live in `validateMrt`.
 */
export function validateMap(map: GameMap, errors: string[], maps: Readonly<Record<string, GameMap>> = MAPS): void {
  const width = map.grid[0]?.length ?? 0;
  const where = `map ${map.id}`;
  if (width === 0) errors.push(`${where}: empty grid`);
  for (const [index, row] of map.grid.entries()) {
    if (row.length !== width) errors.push(`${where}: row ${index} is ${row.length} wide, expected ${width}`);
    for (const glyph of row) if (!map.legend[glyph]) errors.push(`${where}: row ${index} has unknown glyph "${glyph}"`);
  }

  const spots = new Map<string, string>();
  const claim = (c: number, r: number, what: string) => {
    const key = `${c},${r}`;
    const taken = spots.get(key);
    if (taken) errors.push(`${where}: ${what} overlaps ${taken} at ${key}`);
    else spots.set(key, what);
  };

  for (const entry of map.decor) {
    if (!SPRITES[entry.sprite]) errors.push(`${where}: unknown sprite ${entry.sprite}`);
    for (let c = entry.c; c < entry.c + (entry.w ?? 1); c += 1) {
      for (let r = entry.r; r < entry.r + (entry.h ?? 1); r += 1) {
        if (!inGrid(map, { c, r })) errors.push(`${where}: decor ${entry.sprite} is outside the grid`);
        else if (!TERRAIN[terrainAt(map, c, r)].walk) errors.push(`${where}: decor ${entry.sprite} sits on unwalkable ground at ${c},${r}`);
        if (entry.solid !== false) claim(c, r, `decor ${entry.sprite}`);
      }
    }
  }

  for (const npc of map.npcs) {
    if (!SPRITES[npc.sprite]) errors.push(`${where}: npc ${npc.id} has unknown sprite ${npc.sprite}`);
    if (!inGrid(map, npc)) errors.push(`${where}: npc ${npc.id} is outside the grid`);
    else if (!TERRAIN[terrainAt(map, npc.c, npc.r)].walk) errors.push(`${where}: npc ${npc.id} stands on unwalkable ground`);
    claim(npc.c, npc.r, `npc ${npc.id}`);
    if (npc.talk.length === 0) errors.push(`${where}: npc ${npc.id} has nothing to say`);
    for (const rule of npc.talk) if (!EVENTS[rule.event]) errors.push(`${where}: npc ${npc.id} points at missing event ${rule.event}`);
    // A fallback rule with no condition must come last, or the conditional ones never fire
    const fallback = npc.talk.findIndex((rule) => rule.when === undefined && rule.not === undefined);
    if (fallback >= 0 && fallback !== npc.talk.length - 1) errors.push(`${where}: npc ${npc.id} has an unconditional rule before the end`);
  }

  for (const chest of map.chests) {
    if (!ITEMS[chest.item]) errors.push(`${where}: chest ${chest.id} holds unknown item ${chest.item}`);
    if (!inGrid(map, chest)) errors.push(`${where}: chest ${chest.id} is outside the grid`);
    else if (!TERRAIN[terrainAt(map, chest.c, chest.r)].walk) errors.push(`${where}: chest ${chest.id} sits on unwalkable ground`);
    claim(chest.c, chest.r, `chest ${chest.id}`);
  }

  for (const exit of map.exits) {
    if (!inGrid(map, exit)) errors.push(`${where}: exit to ${exit.to} is outside the grid`);
    if (exit.to === RIDE_TO) {
      if (exit.blocked && !EVENTS[exit.blocked]) errors.push(`${where}: exit to ${exit.to} points at missing event ${exit.blocked}`);
      continue;
    }
    const target = Object.prototype.hasOwnProperty.call(maps, exit.to) ? maps[exit.to] : undefined;
    if (!target) errors.push(`${where}: exit points at unknown map ${exit.to}`);
    else if (!inGrid(target, exit.at)) errors.push(`${where}: exit to ${exit.to} lands outside that grid`);
    else if (isSolid(target, exit.at.c, exit.at.r)) errors.push(`${where}: exit to ${exit.to} lands on a blocked tile`);
    if (exit.blocked && !EVENTS[exit.blocked]) errors.push(`${where}: exit to ${exit.to} points at missing event ${exit.blocked}`);
  }

  for (const trigger of map.triggers) {
    if (!inGrid(map, trigger)) errors.push(`${where}: trigger ${trigger.id} is outside the grid`);
    if (!EVENTS[trigger.event]) errors.push(`${where}: trigger ${trigger.id} points at missing event ${trigger.event}`);
    if (spots.has(`${trigger.c},${trigger.r}`)) errors.push(`${where}: trigger ${trigger.id} sits under ${spots.get(`${trigger.c},${trigger.r}`)}`);
  }

  if (map.encounters) {
    if (map.encounters.groups.length === 0) errors.push(`${where}: encounter table is empty`);
    for (const group of map.encounters.groups) {
      if (group.length === 0 || group.length > MAX_FOES_PER_BATTLE) errors.push(`${where}: encounter group of ${group.length}`);
      for (const foe of group) if (!FOES[foe]) errors.push(`${where}: unknown foe ${foe}`);
    }
  }

  if (map.time !== undefined && !CLOCK.test(map.time)) errors.push(`${where}: time "${map.time}" is not HH:MM`);

  if (map.mrtArrival) {
    const arrival = map.mrtArrival;
    if (!inGrid(map, arrival)) errors.push(`${where}: mrtArrival is outside the grid`);
    else if (isSolid(map, arrival.c, arrival.r)) errors.push(`${where}: mrtArrival is on a blocked tile`);
    else if (spots.has(`${arrival.c},${arrival.r}`)) errors.push(`${where}: mrtArrival sits under ${spots.get(`${arrival.c},${arrival.r}`)}`);
    if (map.exits.some((exit) => exit.c === arrival.c && exit.r === arrival.r)) errors.push(`${where}: mrtArrival is on an exit, so arriving would leave again`);
    // The party steps out beside the station's gate NPC (bible § 3.1, `mrtGate`)
    const gate = map.npcs.find((npc) => npc.id === MRT_GATE);
    if (gate && Math.abs(gate.c - arrival.c) + Math.abs(gate.r - arrival.r) !== 1) errors.push(`${where}: mrtArrival must be next to the ${MRT_GATE} NPC`);
  }

  // Layout reachability ignores NPCs and chests: an NPC standing in a doorway is a story gate
  if (isSolid(map, map.entry.c, map.entry.r)) {
    errors.push(`${where}: entry tile is blocked`);
    return;
  }
  const reach = (target: Tile, what: string) => {
    const spot = [
      { c: target.c + 1, r: target.r },
      { c: target.c - 1, r: target.r },
      { c: target.c, r: target.r + 1 },
      { c: target.c, r: target.r - 1 },
    ].find((tile) => findPath(map, [], map.entry, tile, true) !== null);
    if (!spot) errors.push(`${where}: ${what} cannot be walked up to`);
  };
  for (const npc of map.npcs) reach(npc, `npc ${npc.id}`);
  for (const chest of map.chests) reach(chest, `chest ${chest.id}`);
  for (const exit of map.exits) {
    if (isSolid(map, exit.c, exit.r)) errors.push(`${where}: exit to ${exit.to} sits on a blocked tile`);
    else if (findPath(map, [], map.entry, exit, true) === null) errors.push(`${where}: exit to ${exit.to} cannot be reached`);
  }
  if (map.mrtArrival && inGrid(map, map.mrtArrival) && !isSolid(map, map.mrtArrival.c, map.mrtArrival.r)) {
    if (findPath(map, [], map.entry, map.mrtArrival, true) === null) errors.push(`${where}: mrtArrival cannot be reached from the entry`);
  }
}

/** The NPC id of a landmark's MRT entrance (story bible § 3.1 item 1). */
export const MRT_GATE = 'mrtGate';

/** Dialogue lines are at most 40 characters (script.md, *How to read this file*). */
export const LINE_MAX = 40;

/**
 * How wide a line reads in the dialogue box, in full-width characters: CJK and full-width
 * punctuation count 1, half-width Latin letters, digits and spaces ½. Used for lines whose
 * station placeholders expand to English (「Next station, Taipei 101/World Trade Center.」).
 */
export function lineWidth(text: string): number {
  let width = 0;
  for (const char of text) width += (char.codePointAt(0) as number) < 0x2e80 ? 0.5 : 1;
  return width;
}

/** The longest value of each station name field: the worst case for a line's width. */
function longestNames(stations: readonly Station[]): Pick<Station, 'name' | 'nameTw' | 'nameEn'> {
  const longest = (field: 'name' | 'nameTw' | 'nameEn') =>
    stations.map((station) => station[field]).reduce((best, name) => (lineWidth(name) > lineWidth(best) ? name : best), '');
  return { name: longest('name'), nameTw: longest('nameTw'), nameEn: longest('nameEn') };
}

/**
 * 月亮線 content (bible § 3.1): the station rows; every station map that exists has an
 * `mrtArrival`; `@rideTo` exits only in ride cars; every ride car that exists has a door to
 * `@rideTo`, an entry trigger and no random encounters; and every line using `{station}`,
 * `{stationTw}` or `{stationEn}` stays within LINE_MAX once the longest names are filled in.
 * Takes its tables so tests can feed a fixture network.
 */
export function validateMrt(
  maps: Readonly<Record<string, GameMap>>,
  stations: readonly Station[],
  events: Readonly<Record<string, Step[]>>,
  errors: string[],
): void {
  const exists = (id: string) => Object.prototype.hasOwnProperty.call(maps, id);
  const keys = new Set<string>();
  const served = new Set<string>();
  const cars = new Set(stations.map((station) => station.car));

  for (const station of stations) {
    const where = `station ${station.key}`;
    if (station.key.length === 0) errors.push('station with an empty key');
    if (keys.has(station.key)) errors.push(`${where}: defined twice`);
    keys.add(station.key);
    if (served.has(station.map)) errors.push(`${where}: map ${station.map} already has a station`);
    served.add(station.map);
    if (!station.name || !station.nameTw || !station.nameEn) errors.push(`${where}: needs a name in all three languages`);
    if (!station.unlock) errors.push(`${where}: has no unlock flag`);
    if (!MRT_LINES[station.line]) errors.push(`${where}: unknown line ${station.line}`);
    const { x, y } = station.pos;
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) errors.push(`${where}: pos must be within 0..1, got ${x},${y}`);
    if (cars.has(station.map)) errors.push(`${where}: its map ${station.map} is a ride car`);
    if (exists(station.map) && !maps[station.map].mrtArrival) errors.push(`${where}: map ${station.map} needs an mrtArrival tile`);
  }

  for (const map of Object.values(maps)) {
    const where = `map ${map.id}`;
    const doors = map.exits.filter((exit) => exit.to === RIDE_TO);
    if (!cars.has(map.id)) {
      if (doors.length > 0) errors.push(`${where}: only a ride car (a station's car) may have a ${RIDE_TO} exit`);
      continue;
    }
    if (doors.length === 0) errors.push(`${where}: a ride car needs a door exit to ${RIDE_TO}`);
    for (const door of doors) {
      if (inGrid(map, door) && terrainAt(map, door.c, door.r) !== 'door') errors.push(`${where}: the ${RIDE_TO} exit must be on a door tile`);
      if (door.when !== undefined || door.not !== undefined) errors.push(`${where}: the ${RIDE_TO} door must always be open`);
    }
    const announcement = map.triggers.find((trigger) => trigger.c === map.entry.c && trigger.r === map.entry.r);
    if (!announcement) errors.push(`${where}: a ride car needs an entry trigger (the announcement) on its entry tile`);
    else if (announcement.once || !announcement.arrival) errors.push(`${where}: the entry trigger must be \`arrival: true\` and not \`once\`, so it plays on every ride and only then`);
    if (map.encounters) errors.push(`${where}: ride cars have no random encounters`);
  }

  const names = longestNames(stations);
  for (const [key, steps] of Object.entries(events)) {
    for (const [index, step] of steps.entries()) {
      const texts = 'text' in step ? [step.text] : step.do === 'choice' && step.prompt ? [step.prompt] : [];
      for (const text of texts) {
        if (!Object.keys(STATION_PLACEHOLDERS).some((token) => text.includes(token))) continue;
        const filled = fillStation(text, names);
        if (lineWidth(filled) > LINE_MAX) errors.push(`event ${key}[${index}]: "${filled}" is over ${LINE_MAX} characters with the longest station name`);
      }
    }
  }
}

/** Stations that cannot be ridden yet because their map or ride car has not been built (chapter content and #27). */
export function mrtWarnings(maps: Readonly<Record<string, GameMap>> = MAPS, stations: readonly Station[] = STATIONS): string[] {
  const exists = (id: string) => Object.prototype.hasOwnProperty.call(maps, id);
  return stations.flatMap((station) => {
    const missing = [station.map, station.car].filter((id) => !exists(id));
    return missing.length > 0 ? [`station ${station.key} cannot be ridden yet: no map ${missing.join(' or ')}`] : [];
  });
}

/** A 圖鑑 blurb is one dialogue line; a home is a short place name. */
export const FOE_CALMED_MAX = 40;
export const FOE_HOME_MAX = 12;

/** The 抓周盤 ring always has nine treasures (story bible § 6.3). */
export const TRAY_RING_SLOTS = 9;

/**
 * DERIVED: well-formed entries, one entry per flag, and no flag that (through other derived flags)
 * waits on itself, which could never be set. Takes the table so tests can feed broken ones.
 */
export function validateDerived(table: readonly Derived[], errors: string[]): void {
  const byFlag = new Map<string, Derived>();
  for (const entry of table) {
    const where = `derived ${entry.flag}`;
    if (entry.flag.length === 0) errors.push('derived flag with an empty name');
    if (entry.flag === BESTIARY_FLAG) errors.push(`${where}: is computed from seenFoes and cannot have a DERIVED entry`);
    if (byFlag.has(entry.flag)) errors.push(`${where}: defined twice`);
    byFlag.set(entry.flag, entry);
    if (entry.of.length === 0) errors.push(`${where}: depends on no flags`);
    if (new Set(entry.of).size !== entry.of.length) errors.push(`${where}: lists a flag twice`);
    const atLeast = entry.atLeast ?? entry.of.length;
    if (!Number.isInteger(atLeast) || atLeast < 1 || atLeast > entry.of.length) {
      errors.push(`${where}: atLeast must be a whole number in 1..${entry.of.length}, got ${entry.atLeast}`);
    }
  }

  // Depth-first search over "derived flag → the derived flags it waits on"
  const state = new Map<string, 'open' | 'done'>();
  const visit = (flag: string, chain: string[]) => {
    if (state.get(flag) === 'done') return;
    if (state.get(flag) === 'open') {
      errors.push(`derived ${flag}: cycle ${[...chain.slice(chain.indexOf(flag)), flag].join(' → ')}`);
      return;
    }
    state.set(flag, 'open');
    for (const source of byFlag.get(flag)?.of ?? []) if (byFlag.has(source)) visit(source, [...chain, flag]);
    state.set(flag, 'done');
  };
  for (const flag of byFlag.keys()) visit(flag, []);
}

/** QUESTS: unique ids, a title, at least one step, no repeated step flag, hints that fit one line. */
export function validateQuests(quests: readonly SideQuest[], errors: string[]): void {
  const ids = new Set<string>();
  for (const quest of quests) {
    const where = `quest ${quest.id}`;
    if (ids.has(quest.id)) errors.push(`${where}: defined twice`);
    ids.add(quest.id);
    if (quest.title.length === 0) errors.push(`${where}: has no title`);
    if (quest.steps.length === 0) errors.push(`${where}: has no steps`);
    const flags = quest.steps.map((step) => step.flag);
    if (new Set(flags).size !== flags.length) errors.push(`${where}: repeats a step flag`);
    for (const step of quest.steps) {
      if (step.hint.length === 0) errors.push(`${where}: step ${step.flag} has no hint`);
      if (step.hint.length > QUEST_HINT_MAX) errors.push(`${where}: hint "${step.hint}" is over ${QUEST_HINT_MAX} characters`);
    }
  }
}

/** FOLLOWERS: a real sprite, a name, and an `until` that differs from the flag that starts it. */
export function validateFollowers(followers: readonly Follower[], errors: string[]): void {
  for (const follower of followers) {
    const where = `follower ${follower.flag}`;
    if (!SPRITES[follower.sprite]) errors.push(`${where}: unknown sprite ${follower.sprite}`);
    if (follower.name.length === 0) errors.push(`${where}: has no name`);
    if (follower.flag === follower.until) errors.push(`${where}: ends on the flag that starts it`);
  }
}

/** The progress tables in progress.ts and the 圖鑑 fields on foes. */
function validateProgress(errors: string[]): void {
  validateDerived(DERIVED, errors);
  validateQuests(QUESTS, errors);
  validateFollowers(FOLLOWERS, errors);

  const trayFlags = TRAY.map((slot) => slot.flag);
  if (new Set(trayFlags).size !== trayFlags.length) errors.push('tray: a flag is used twice');
  const ring = TRAY.filter((slot) => slot.slot === 'ring').length;
  if (ring !== TRAY_RING_SLOTS) errors.push(`tray: the ring needs ${TRAY_RING_SLOTS} treasures, got ${ring}`);
  for (const slot of TRAY) if (slot.name.length === 0 || slot.meaning.length === 0) errors.push(`tray ${slot.flag}: needs a name and a meaning`);

  const collected = new Set<string>();
  for (const collection of COLLECTIONS) {
    if (collection.entries.length === 0) errors.push(`collection ${collection.id}: is empty`);
    for (const entry of collection.entries) {
      const where = `collection ${collection.id} ${entry.flag}`;
      if (collected.has(entry.flag)) errors.push(`${where}: flag is used twice`);
      collected.add(entry.flag);
      if (entry.title.length === 0) errors.push(`${where}: has no title`);
      if (entry.lines.length === 0) errors.push(`${where}: has no line`);
      for (const line of entry.lines) {
        if (line.length === 0 || line.length > COLLECTION_LINE_MAX) errors.push(`${where}: line "${line}" must be 1..${COLLECTION_LINE_MAX} characters`);
      }
    }
  }

  if (BESTIARY_FOES.length === 0) errors.push('bestiary: no foes to collect');
  for (const foe of Object.values(FOES)) {
    if (foe.calmed !== undefined && (foe.calmed.length === 0 || foe.calmed.length > FOE_CALMED_MAX)) {
      errors.push(`foe ${foe.id}: calmed blurb must be 1..${FOE_CALMED_MAX} characters`);
    }
    if (foe.home !== undefined && (foe.home.length === 0 || foe.home.length > FOE_HOME_MAX)) {
      errors.push(`foe ${foe.id}: home must be 1..${FOE_HOME_MAX} characters`);
    }
  }
}

/**
 * The item table on its own: art, a whole price (0 = a gift, never sold), sane effects, and
 * signature gear (`only`) that is equipment belonging to a real hero.
 */
export function validateItems(items: Record<string, Item>, errors: string[]): void {
  for (const [id, item] of Object.entries(items)) {
    const where = `item ${id}`;
    if (item.id !== id) errors.push(`${where}: id field says ${item.id}`);
    if (item.name.length === 0 || item.blurb.length === 0) errors.push(`${where}: needs a name and a blurb`);
    if (!SPRITES[item.sprite]) errors.push(`${where} has unknown sprite ${item.sprite}`);
    if (!Number.isInteger(item.price) || item.price < 0) errors.push(`${where}: price must be a whole number ≥ 0 (0 = gift), got ${item.price}`);
    const use = item.use;
    if ((use.kind === 'hp' || use.kind === 'hpAll' || use.kind === 'mp') && use.amount <= 0) errors.push(`${where}: restores nothing`);
    if (use.kind === 'revive' && !(use.ratio > 0 && use.ratio <= 1)) errors.push(`${where}: revive ratio must be in (0, 1]`);
    if (use.kind === 'equip' && Object.values(use.bonus).every((bonus) => !bonus)) errors.push(`${where}: equipment with no bonus`);
    if (item.only !== undefined) {
      if (!HERO_ORDER.includes(item.only)) errors.push(`${where}: only for unknown hero ${item.only}`);
      if (use.kind !== 'equip') errors.push(`${where}: only equipment can be hero-only`);
    }
  }
}

/** Every item some chest, shop, gift or drop hands out. */
export function obtainableItems(): Set<ItemId> {
  const available = new Set<ItemId>();
  for (const map of Object.values(MAPS)) for (const chest of map.chests) available.add(chest.item);
  for (const foe of Object.values(FOES)) if (foe.drop) available.add(foe.drop.item);
  for (const steps of Object.values(EVENTS)) {
    for (const step of steps) {
      if (!('do' in step)) continue;
      if (step.do === 'give') available.add(step.item);
      if (step.do === 'shop') for (const item of step.stock) available.add(item);
    }
  }
  return available;
}

/** Every flag some script, derived entry or the 圖鑑 can set. */
export function settableFlags(): Set<string> {
  const flags = new Set<string>([BESTIARY_FLAG]);
  for (const steps of Object.values(EVENTS)) {
    for (const step of steps) {
      if ('do' in step && step.do === 'flag') flags.add(step.flag);
      if ('do' in step && step.do === 'ending') flags.add(CLEARED_FLAG);
    }
  }
  for (const entry of DERIVED) flags.add(entry.flag);
  return flags;
}

/**
 * Flags the progress tables read that no content sets yet, and items nothing hands out yet.
 * Warnings, not errors, while chapters land one by one (each chapter issue places its own); the
 * final QA issue (#58) makes them errors.
 */
export function progressWarnings(): string[] {
  const settable = settableFlags();
  const read = new Set<string>();
  for (const entry of DERIVED) for (const flag of entry.of) read.add(flag);
  for (const quest of QUESTS) for (const step of quest.steps) read.add(step.flag);
  for (const slot of TRAY) read.add(slot.flag);
  for (const collection of COLLECTIONS) for (const entry of collection.entries) read.add(entry.flag);
  for (const follower of FOLLOWERS) {
    read.add(follower.flag);
    read.add(follower.until);
  }
  for (const station of STATIONS) read.add(station.unlock);
  const flags = [...read].filter((flag) => !settable.has(flag)).map((flag) => `progress flag ${flag} is never set by any event`);
  const available = obtainableItems();
  const items = ITEM_ORDER.filter((item) => !available.has(item)).map((item) => `item ${item} cannot be obtained yet`);
  return [...flags, ...items, ...mrtWarnings()];
}

/**
 * Placeholder sprites in the registry (decision D-14): warnings, printed in dev, until the art
 * issue for each lands. The final QA issue (#58) requires none.
 */
export function spriteWarnings(sprites: Readonly<Record<string, SpriteComponent>> = SPRITES): string[] {
  return Object.entries(sprites).flatMap(([name, sprite]) => {
    const placeholder = spriteMeta(sprite)?.placeholder;
    return placeholder ? [`sprite ${name} is a placeholder (${spriteMeta(sprite)?.kind} 「${placeholder.label}」)`] : [];
  });
}

/** Pure content checks; run at dev start-up and in content.test.ts so mistakes never ship. */
export function validateQuestContent(): string[] {
  const errors: string[] = [];

  for (const [key, steps] of Object.entries(EVENTS)) {
    if (steps.length === 0) errors.push(`event ${key} is empty`);
    validateSteps(`event ${key}`, steps, errors);
  }
  validateIncludes(EVENTS, errors);
  validateSpeakers(SPEAKERS, errors);

  for (const id of MAP_ORDER) validateMap(MAPS[id], errors);
  validateMrt(MAPS, STATIONS, EVENTS, errors);
  validateProgress(errors);
  for (const id of Object.keys(MAPS)) if (!MAP_ORDER.includes(id as never)) errors.push(`map ${id} is missing from MAP_ORDER`);

  for (const spell of Object.values(SPELLS)) {
    if (spell.level > MAX_LEVEL) errors.push(`spell ${spell.id} unlocks past the level cap`);
    if (spell.cost <= 0) errors.push(`spell ${spell.id} is free`);
    if (!HERO_ORDER.includes(spell.hero)) errors.push(`spell ${spell.id} belongs to unknown hero ${spell.hero}`);
  }

  for (const foe of Object.values(FOES)) {
    if (!SPRITES[foe.sprite]) errors.push(`foe ${foe.id} has unknown sprite ${foe.sprite}`);
    if (foe.stats.hp <= 0 || foe.stats.atk <= 0 || foe.xp <= 0) errors.push(`foe ${foe.id}: hp, atk and xp must be positive`);
    if (!Number.isInteger(foe.coins) || foe.coins < 0) errors.push(`foe ${foe.id}: coins must be a whole number, got ${foe.coins}`);
    if (foe.moves.length === 0) errors.push(`foe ${foe.id} has no moves`);
    if (foe.boss && !foe.taunt) errors.push(`boss ${foe.id} needs a taunt`);
    if (foe.drop && !ITEMS[foe.drop.item]) errors.push(`foe ${foe.id} drops unknown item ${foe.drop.item}`);
  }

  validateItems(ITEMS, errors);

  if (XP_TABLE.length !== MAX_LEVEL) errors.push(`XP_TABLE has ${XP_TABLE.length} entries, expected ${MAX_LEVEL}`);
  for (let level = 1; level < XP_TABLE.length; level += 1) {
    if (XP_TABLE[level] <= XP_TABLE[level - 1]) errors.push(`XP_TABLE must increase at index ${level}`);
  }

  // Every event must be reachable: some map has to point at it
  const used = new Set<string>();
  for (const map of Object.values(MAPS)) {
    for (const npc of map.npcs) for (const rule of npc.talk) used.add(rule.event);
    for (const trigger of map.triggers) used.add(trigger.event);
    for (const exit of map.exits) if (exit.blocked) used.add(exit.blocked);
  }
  // Events reached only through another script (a choice branch, `→ key`, an optional insert) count too
  for (const steps of Object.values(EVENTS)) for (const key of referencedEvents(steps)) used.add(key);
  for (const key of Object.keys(EVENTS)) if (!used.has(key)) errors.push(`event ${key} is never used`);

  // Sanity on the decor helper, so a refactor cannot silently break footprints
  if (!covers({ c: 2, r: 2, w: 2, h: 2 }, 3, 3) || covers({ c: 2, r: 2 }, 3, 2)) errors.push('decor footprint maths is wrong');

  return errors;
}
