import type { Level, Target } from './types';

/** Touch floor: r >= 0.09, roughly a 67px edge on a 375px-wide screen (spec §6, rule 4) */
export const MIN_RADIUS = 0.09;

/** The scene box is always 3:4, height = width * 4/3. Vertical gaps convert to width units before comparing with r. */
const HEIGHT_TO_WIDTH = 4 / 3;
/** The inverse: r is in width units, which is r * 3/4 of the height. */
const WIDTH_TO_HEIGHT = 3 / 4;

const isPlaced = (t: Target) => [t.x, t.y, t.r].every(Number.isFinite);

export function validateLevel(level: Level): string[] {
  const errors: string[] = [];
  const { targets } = level;

  if (targets.length !== 3) {
    errors.push(`expected exactly 3 targets, found ${targets.length}`);
  }

  const seen = new Set<string>();
  for (const t of targets) {
    if (seen.has(t.id)) errors.push(`duplicate target id: ${t.id}`);
    seen.add(t.id);

    if (!isPlaced(t)) {
      errors.push(`target ${t.id} has non-finite coordinates`);
      continue;
    }
    if (t.r < MIN_RADIUS) {
      errors.push(`target ${t.id} hotspot r=${t.r} is below the touch minimum ${MIN_RADIUS}`);
    }
    const halfHeight = t.r * WIDTH_TO_HEIGHT;
    if (t.x - t.r < 0 || t.x + t.r > 1 || t.y - halfHeight < 0 || t.y + halfHeight > 1) {
      errors.push(`target ${t.id} falls outside the scene`);
    }
  }

  for (let i = 0; i < targets.length; i += 1) {
    for (let j = i + 1; j < targets.length; j += 1) {
      const a = targets[i];
      const b = targets[j];
      if (!isPlaced(a) || !isPlaced(b)) continue;
      const gapX = Math.abs(a.x - b.x);
      const gapY = Math.abs(a.y - b.y) * HEIGHT_TO_WIDTH;
      if (Math.max(gapX, gapY) < a.r + b.r) {
        errors.push(`targets ${a.id} and ${b.id} have overlapping hotspots`);
      }
    }
  }

  return errors;
}

export function validateLevels(levels: Level[]): string[] {
  const errors: string[] = [];
  levels.forEach((level, index) => {
    if (level.id !== index + 1) {
      errors.push(`level ids must start at 1 and increase by 1: entry ${index + 1} has id ${level.id}`);
    }
    errors.push(...validateLevel(level).map((error) => `level ${level.id}: ${error}`));
  });
  return errors;
}
