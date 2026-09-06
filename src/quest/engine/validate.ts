import { CHAPTERS } from './chapters';
import { FOES } from './foes';
import { MAX_ENERGY, MAX_LEVEL, SKILLS, XP_TABLE } from './heroes';
import { HERO_ORDER, WORLD_WIDTH, type Chapter } from './types';

/** The battle box lays foes out in up to three columns */
export const MAX_FOES_PER_BATTLE = 3;
/** Baokaka starts here on every chapter map; the first stop must be further right */
export const WORLD_START_X = 0.2;
/** A pickup this close to a stop would be swallowed by the encounter that starts there */
const PICKUP_CLEARANCE = 0.15;

function validateChapter(chapter: Chapter): string[] {
  const errors: string[] = [];
  if (chapter.nodes.length === 0) errors.push('has no nodes');

  chapter.nodes.forEach((node, index) => {
    if (node.kind === 'camp') return;
    if (node.foes.length === 0 || node.foes.length > MAX_FOES_PER_BATTLE) {
      errors.push(`node ${index} has ${node.foes.length} foes; expected 1..${MAX_FOES_PER_BATTLE}`);
    }
    const hasBoss = node.foes.some((foe) => FOES[foe].boss);
    if (node.kind === 'boss' && !hasBoss) errors.push(`boss node ${index} has no boss foe`);
    if (node.kind === 'battle' && hasBoss) errors.push(`battle node ${index} contains a boss foe`);
  });

  if (chapter.nodes.at(-1)?.kind !== 'boss') errors.push('must end with a boss node');

  chapter.decor.forEach((placement, index) => {
    const inside = [placement.x, placement.y, placement.r].every(Number.isFinite) && placement.x >= 0 && placement.x <= 1 && placement.y >= 0 && placement.y <= 1 && placement.r > 0;
    if (!inside) errors.push(`decor ${index} (${placement.sprite}) is outside the box`);
  });

  const { stops, pickups, decor } = chapter.world;
  if (stops.length !== chapter.nodes.length) errors.push(`world has ${stops.length} stops for ${chapter.nodes.length} nodes`);
  stops.forEach((stop, index) => {
    if (!Number.isFinite(stop) || stop <= WORLD_START_X + 0.3 || stop > WORLD_WIDTH - 0.15) {
      errors.push(`stop ${index} at x=${stop} is off the walkable path`);
    }
    if (index > 0 && stop <= stops[index - 1] + 0.3) errors.push(`stop ${index} is not clearly right of stop ${index - 1}`);
  });
  pickups.forEach((pickup) => {
    if (!Number.isFinite(pickup.x) || pickup.x < 0 || pickup.x > WORLD_WIDTH) errors.push(`pickup ${pickup.id} is off the map`);
    if (stops.some((stop) => Math.abs(stop - pickup.x) < PICKUP_CLEARANCE)) errors.push(`pickup ${pickup.id} sits on a stop`);
  });
  decor.forEach((entry, index) => {
    const inside = [entry.x, entry.foot, entry.r].every(Number.isFinite) && entry.x >= -0.3 && entry.x <= WORLD_WIDTH + 0.3 && entry.foot > 0 && entry.foot <= 1 && entry.r > 0;
    if (!inside) errors.push(`world decor ${index} (${entry.sprite}) is off the map`);
    if (entry.depth !== undefined && (entry.depth <= 0 || entry.depth > 1)) errors.push(`world decor ${index} (${entry.sprite}) has depth outside (0, 1]`);
  });

  return errors;
}

/** Pure content checks; run at dev start-up and in quest.test.ts so mistakes fail in CI. */
export function validateQuestContent(): string[] {
  const errors: string[] = [];

  CHAPTERS.forEach((chapter, index) => {
    if (chapter.id !== index + 1) errors.push(`chapter ids must start at 1 and increase by 1: entry ${index + 1} has id ${chapter.id}`);
    errors.push(...validateChapter(chapter).map((error) => `chapter ${chapter.id}: ${error}`));
  });

  // Picked-up ids are remembered per run across chapters, so they must be unique globally
  const seenPickups = new Set<string>();
  for (const pickup of CHAPTERS.flatMap((chapter) => chapter.world.pickups)) {
    if (seenPickups.has(pickup.id)) errors.push(`pickup id ${pickup.id} is used in more than one place`);
    seenPickups.add(pickup.id);
  }

  for (const foe of Object.values(FOES)) {
    if (foe.maxHp <= 0 || foe.atk <= 0 || foe.xp <= 0) errors.push(`foe ${foe.id}: hp, atk and xp must be positive`);
    if (foe.moves.length === 0) errors.push(`foe ${foe.id}: has no moves`);
    foe.moves.forEach((move, index) => {
      const next = foe.moves[(index + 1) % foe.moves.length];
      if (move.kind === 'charge' && next.kind !== 'attack') {
        errors.push(`foe ${foe.id}: move ${index} charges but the next move is not an attack`);
      }
    });
    if (foe.boss && !foe.taunt) errors.push(`foe ${foe.id}: bosses need a taunt`);
  }

  for (const skill of Object.values(SKILLS)) {
    if (skill.unlockLevel < 1 || skill.unlockLevel > MAX_LEVEL) errors.push(`skill ${skill.id}: unlockLevel out of range`);
    if (skill.cost < 0 || skill.cost > MAX_ENERGY) errors.push(`skill ${skill.id}: cost out of range`);
  }
  for (const hero of HERO_ORDER) {
    // Never let a hero be unable to act: a free skill must exist from level 1
    const free = Object.values(SKILLS).some(
      (skill) => (skill.hero === hero || skill.hero === 'both') && skill.unlockLevel === 1 && skill.cost === 0,
    );
    if (!free) errors.push(`hero ${hero}: has no free level-1 skill`);
  }

  if (XP_TABLE.length !== MAX_LEVEL) errors.push('XP_TABLE must have one entry per level');
  if (XP_TABLE[0] !== 0) errors.push('XP_TABLE must start at 0');
  for (let level = 1; level < XP_TABLE.length; level += 1) {
    if (XP_TABLE[level] <= XP_TABLE[level - 1]) errors.push(`XP_TABLE must increase at index ${level}`);
  }

  return errors;
}
