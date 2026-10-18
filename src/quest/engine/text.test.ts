import { describe, expect, test } from 'vitest';
import { freshRun } from './quest';
import { runScene } from './scene';
import { substitute } from './text';

describe('substitute', () => {
  test('is the identity until #9 adds station names', () => {
    expect(substitute('「下一站，{station}」', freshRun(1))).toBe('「下一站，{station}」');
    expect(substitute('', freshRun(1))).toBe('');
  });

  test('runScene shows the substituted line and keeps the step itself when nothing changed', () => {
    const line = { who: null, text: '旁白。' };
    const result = runScene(freshRun(1), { steps: [line], at: 0 });
    expect(result.stop).toEqual({ kind: 'line', line });
    if (result.stop.kind === 'line') expect(result.stop.line).toBe(line);
  });
});
