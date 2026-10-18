import { describe, expect, it } from 'vitest';
import { blob, compactPath, crease, crs, footie, hand, limb, num, type Vec } from './geom';
import REF from './geom.reference.json';

/**
 * `geom.reference.json` holds the output of `docs/art/options/_gen/anime2.py` for the inputs below
 * (the same joints and radii as its `bk_stand` pose), printed by running the Python once. Paths
 * must match it command for command, with every number within rounding (the Python rounds half
 * to even, `toFixed` half up, so a last digit may differ by one).
 */

const tokens = (d: string) => d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];

function expectPath(actual: string, expected: string) {
  const [a, b] = [tokens(actual), tokens(expected)];
  expect(a.length, `token count\n${actual}\n${expected}`).toBe(b.length);
  a.forEach((token, i) => {
    if (/[A-Za-z]/.test(token)) expect(token, `command ${i}`).toBe(b[i]);
    else expect(Math.abs(Number(token) - Number(b[i])), `number ${i}: ${token} vs ${b[i]}`).toBeLessThanOrEqual(0.0101);
  });
}

describe('num', () => {
  it('prints like the generators: two decimals, no trailing zeros', () => {
    expect(num(12.5)).toBe('12.5');
    expect(num(3)).toBe('3');
    expect(num(1.006)).toBe('1.01');
    expect(num(-0.4)).toBe('-0.4');
    expect(num(120.1)).toBe('120.1');
  });
});

describe('geom matches the Python reference', () => {
  it('crs', () => {
    expectPath(`M0,0 ${crs([[0, 0], [10, 5], [20, -3], [31.5, 8.25]])}`, REF.crs);
  });

  it('limb: a three-joint arm, a four-joint leg and a two-joint neck', () => {
    expectPath(limb([[117, 87], [131, 98], [141, 106]], [6.8, 5.8, 4.8]), REF.limb3);
    expectPath(limb([[91, 130], [86, 152], [84, 162], [84, 172]], [12.4, 9, 8.4, 6]), REF.limb4);
    expectPath(limb([[100, 68], [100, 80]], [9.4, 10]), REF.limb2);
  });

  it('blob: the standing torso', () => {
    const torso: Vec[] = [[100, 77], [110, 78.6], [119, 83], [124, 92], [126, 106], [127, 118], [122, 130], [111, 138], [100, 140], [89, 138], [78, 130], [73, 118], [74, 106], [76, 92], [81, 83], [90, 78.6]];
    expectPath(blob(torso), REF.blob);
  });

  it('crease', () => {
    expectPath(crease([83, 131], [95, 135], 0.9), REF.crease);
  });

  it.each(['open', 'flat', 'grab', 'fist'] as const)('hand %s: one contour plus its creases', (pose) => {
    const shape = hand([65.4, 113.2], 116, 1.15, pose);
    const ref = REF[`hand_${pose}`];
    expectPath(shape.d, ref.d);
    expect(shape.creases).toHaveLength(ref.creases.length);
    shape.creases.forEach((d, i) => expectPath(d, ref.creases[i]));
  });

  it('footie, side view, both orientations', () => {
    const far = footie([116, 178], [132, 184], 6.8, { up: 1 });
    expectPath(far.d, REF.footie.d);
    expectPath(far.strip!, REF.footie.strip);
    expectPath(far.crease!, REF.footie.crease);
    const near = footie([86, 179], [70, 186], 7, { up: -1 });
    expectPath(near.d, REF.footie_up.d);
    expectPath(near.strip!, REF.footie_up.strip);
    expectPath(near.crease!, REF.footie_up.crease);
  });

  it('footie, sole view, with grip dots', () => {
    const sole = footie([48, 170], [40, 153], 7, { sole: true });
    expectPath(sole.d, REF.footie_sole.d);
    expect(sole.strip).toBeUndefined();
    expect(sole.dots).toHaveLength(REF.footie_sole.dots.length);
    sole.dots!.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(REF.footie_sole.dots[i][0], 1);
      expect(y).toBeCloseTo(REF.footie_sole.dots[i][1], 1);
    });
  });
});

describe('geom guards', () => {
  it('rejects a limb without one radius per joint, and a blob under three points', () => {
    expect(() => limb([[0, 0], [1, 1]], [1])).toThrow(/radius per joint/);
    expect(() => blob([[0, 0], [1, 1]])).toThrow(/≥ 3 points/);
  });
});

/** Absolute coordinates of every command's points, from absolute or relative path data. */
function absolutePoints(d: string): number[] {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const arity: Record<string, number> = { m: 2, l: 2, c: 6, q: 4, s: 4, t: 2, h: 1, v: 1, z: 0 };
  const out: number[] = [];
  let [x, y, sx, sy] = [0, 0, 0, 0];
  let command = '';
  let i = 0;
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) command = tokens[i++];
    const lower = command.toLowerCase();
    const relative = command === lower;
    if (lower === 'z') {
      [x, y] = [sx, sy];
      continue;
    }
    const args = tokens.slice(i, i + arity[lower]).map(Number);
    i += arity[lower];
    if (lower === 'h') x = relative ? x + args[0] : args[0];
    else if (lower === 'v') y = relative ? y + args[0] : args[0];
    else {
      const abs = args.map((v, k) => (relative ? v + (k % 2 === 0 ? x : y) : v));
      out.push(...abs);
      [x, y] = [abs[abs.length - 2], abs[abs.length - 1]];
    }
    if (lower === 'm') [sx, sy] = [x, y];
    if (lower === 'm') command = relative ? 'l' : 'L';
  }
  return out;
}

describe('compactPath', () => {
  it.each([
    ['limb', REF.limb4],
    ['blob', REF.blob],
    ['hand', REF.hand_open.d],
    ['two creases', `${REF.crease} ${REF.hand_fist.creases[0]}`],
    ['lines and implicit linetos', 'M10,10 L20,15 30,5 Z M50,50 H60 V70 Q65,72 70,70 Z'],
  ])('%s: relative, smaller, and the same points to 0.1u', (_name, d) => {
    const compact = compactPath(d);
    expect(compact.length).toBeLessThan(d.length);
    const [a, b] = [absolutePoints(compact), absolutePoints(d)];
    expect(a).toHaveLength(b.length);
    a.forEach((value, i) => expect(Math.abs(value - b[i])).toBeLessThanOrEqual(0.051));
  });

  it('writes the shortest numbers and leaves other commands alone', () => {
    expect(compactPath('M0.5,-0.25 L1,1')).toBe('m.5-.2l.5 1.2');
    expect(compactPath('M0,0 A5,5 0 0 1 10,10')).toBe('M0,0A5,5 0 0 1 10,10');
  });
});
