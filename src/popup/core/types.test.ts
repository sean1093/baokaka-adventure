import { describe, expect, expectTypeOf, test } from 'vitest';
import { definePage as pagesDefinePage } from '../pages';
import { PART_PRESETS as ART_PRESETS } from '../art';
import c1p2 from './fixtures/c1p2';
import { BABY_MODES, PART_PRESETS, type BabyMode, type PageDef, type PartDef, type PartPreset, type SolutionStep } from './types';

/**
 * GDD § 3.2 against GDD § 3.4: the fixture is the § 3.4 page verbatim (plus the `board` prop), so
 * `tsc -b` compiling it is the main assertion; these tests pin the few facts the types encode.
 */
describe('GDD § 3.2 types', () => {
  test('the § 3.4 example page type-checks as a PageDef', () => {
    expectTypeOf(c1p2).toEqualTypeOf<PageDef>();
    expect(c1p2.id).toBe('c1p2');
    expect(c1p2.parts.map((p) => p.id)).toEqual(['train', 'board']);
  });

  test('the fixture keeps the § 3.4 solution', () => {
    expect(c1p2.solution).toEqual<SolutionStep[]>([
      { set: 'train', to: 'half' },
      { wait: 'settle' },
      { mocha: 'pillar' },
      { set: 'train', to: 'full' },
      { wait: 'goal' },
    ]);
  });

  test('fourteen presets, as GDD § 2.1 lists them; art re-exports core’s list', () => {
    expect(PART_PRESETS).toEqual(['tab', 'slider', 'wheel', 'flap', 'section', 'gate', 'button', 'lift', 'loop', 'pushable', 'light', 'blowable', 'carrier', 'prop']);
    expect(ART_PRESETS).toBe(PART_PRESETS);
    expectTypeOf<PartDef['preset']>().toEqualTypeOf<PartPreset>();
  });

  test('BabyMode is the GDD § 2.2.7 list', () => {
    expect(BABY_MODES).toEqual(['idle', 'moving', 'reaching', 'looking', 'crying', 'watching', 'cuddling', 'eating', 'grabbing', 'saying', 'carried', 'linked', 'done']);
    expectTypeOf<'idle'>().toMatchTypeOf<BabyMode>();
  });

  test('pages/ re-exports the core definePage', async () => {
    const core = await import('./define');
    expect(pagesDefinePage).toBe(core.definePage);
  });
});
