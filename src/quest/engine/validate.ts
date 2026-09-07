import { SPRITES } from '../../art/sprites';
import { EVENTS, SPEAKERS } from './events';
import { FOES } from './foes';
import { ITEMS, MAX_LEVEL, SPELLS, XP_TABLE } from './heroes';
import { TERRAIN, covers, terrainAt } from './iso';
import { MAPS, MAP_ORDER } from './maps';
import { findPath, isSolid } from './path';
import { HERO_ORDER, type GameMap, type Step, type Tile } from './types';

/** At most three foes fit across the battle box. */
export const MAX_FOES_PER_BATTLE = 3;

function validateSteps(where: string, steps: Step[], errors: string[]): void {
  for (const [index, step] of steps.entries()) {
    const at = `${where}[${index}]`;
    if ('text' in step) {
      if (step.text.length === 0) errors.push(`${at}: empty line`);
      if (step.who !== null && !HERO_ORDER.includes(step.who as never) && !SPEAKERS[step.who]) {
        errors.push(`${at}: unknown speaker ${step.who}`);
      }
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
        for (const item of step.stock) if (!ITEMS[item]) errors.push(`${at}: unknown item ${item}`);
        break;
      case 'goto':
        if (!MAPS[step.map]) errors.push(`${at}: unknown map ${step.map}`);
        break;
      case 'join':
        if (!HERO_ORDER.includes(step.hero)) errors.push(`${at}: unknown hero ${step.hero}`);
        break;
    }
  }
}

const inGrid = (map: GameMap, tile: Tile): boolean =>
  tile.r >= 0 && tile.r < map.grid.length && tile.c >= 0 && tile.c < map.grid[0].length;

function validateMap(map: GameMap, errors: string[]): void {
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
    const target = MAPS[exit.to];
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
}

/** Pure content checks; run at dev start-up and in content.test.ts so mistakes never ship. */
export function validateQuestContent(): string[] {
  const errors: string[] = [];

  for (const [key, steps] of Object.entries(EVENTS)) {
    if (steps.length === 0) errors.push(`event ${key} is empty`);
    validateSteps(`event ${key}`, steps, errors);
  }

  for (const id of MAP_ORDER) validateMap(MAPS[id], errors);
  for (const id of Object.keys(MAPS)) if (!MAP_ORDER.includes(id as never)) errors.push(`map ${id} is missing from MAP_ORDER`);

  for (const spell of Object.values(SPELLS)) {
    if (spell.level > MAX_LEVEL) errors.push(`spell ${spell.id} unlocks past the level cap`);
    if (spell.cost <= 0) errors.push(`spell ${spell.id} is free`);
    if (!HERO_ORDER.includes(spell.hero)) errors.push(`spell ${spell.id} belongs to unknown hero ${spell.hero}`);
  }

  for (const foe of Object.values(FOES)) {
    if (!SPRITES[foe.sprite]) errors.push(`foe ${foe.id} has unknown sprite ${foe.sprite}`);
    if (foe.stats.hp <= 0 || foe.stats.atk <= 0 || foe.xp <= 0) errors.push(`foe ${foe.id}: hp, atk and xp must be positive`);
    if (foe.moves.length === 0) errors.push(`foe ${foe.id} has no moves`);
    if (foe.boss && !foe.taunt) errors.push(`boss ${foe.id} needs a taunt`);
    if (foe.drop && !ITEMS[foe.drop.item]) errors.push(`foe ${foe.id} drops unknown item ${foe.drop.item}`);
  }

  for (const item of Object.values(ITEMS)) {
    if (!SPRITES[item.sprite]) errors.push(`item ${item.id} has unknown sprite ${item.sprite}`);
    if (item.price <= 0) errors.push(`item ${item.id} is free`);
  }

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
  for (const key of Object.keys(EVENTS)) if (!used.has(key)) errors.push(`event ${key} is never used`);

  // Sanity on the decor helper, so a refactor cannot silently break footprints
  if (!covers({ c: 2, r: 2, w: 2, h: 2 }, 3, 3) || covers({ c: 2, r: 2 }, 3, 2)) errors.push('decor footprint maths is wrong');

  return errors;
}
