import { describe, expect, test } from 'vitest';
import { BACKLIGHT } from '../../art/palette';
import type { Step } from '../engine/types';
import { linePage, speakerOf } from './Dialogue';

describe('the talk box adapter', () => {
  test('linePage counts the run of consecutive lines around the current one', () => {
    const steps: Step[] = [
      { do: 'chapter', n: 1, title: 'x' },
      { who: null, text: 'a' },
      { who: null, text: 'b' },
      { who: 'mocha', text: 'c' },
      { do: 'heal' },
      { who: null, text: 'd' },
    ];
    expect(linePage(steps, 1)).toEqual({ index: 0, count: 3 });
    expect(linePage(steps, 3)).toEqual({ index: 2, count: 3 });
    expect(linePage(steps, 5)).toEqual({ index: 0, count: 1 });
  });

  test('speakerOf resolves heroes, NPCs and narration with their backlights', () => {
    expect(speakerOf(null)).toBeNull();
    expect(speakerOf('nobody')).toBeNull();
    expect(speakerOf('mocha')).toMatchObject({ name: '摩卡貓', color: BACKLIGHT.tabby, sprite: 'mochaCat' });
    expect(speakerOf('mom')).toMatchObject({ name: '媽媽', color: BACKLIGHT.warm });
    expect(speakerOf('octo')?.color).toBe(BACKLIGHT.violet);
  });
});
