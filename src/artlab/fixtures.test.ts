import { describe, expect, test } from 'vitest';
import { EVENTS } from '../quest/engine/events';
import { MAPS } from '../quest/engine/maps';
import { ARTLAB_FIXTURES, SAMPLE_FLAGS, sampleRun } from './fixtures';

describe('art lab fixtures', () => {
  test('names are unique and file-safe', () => {
    const names = ARTLAB_FIXTURES.map((fixture) => fixture.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[a-z0-9-]+$/);
  });

  test.each(ARTLAB_FIXTURES.map((fixture) => [fixture.name, fixture] as const))('%s builds a consistent state', (_, fixture) => {
    const state = fixture.state();
    expect(state.sound).toBe(false);
    expect(MAPS[state.run.map]).toBeDefined();
    if (state.line || state.card) expect(state.scene).not.toBeNull();
  });

  test('the battle opens on a hero turn, so the screenshot never races a foe timer', () => {
    const battle = ARTLAB_FIXTURES.find((fixture) => fixture.name === 'battle')!.state();
    expect(battle.view.screen).toBe('battle');
    if (battle.view.screen === 'battle') {
      expect(battle.view.battle.phase.kind).toBe('hero');
      expect(battle.view.battle.foes).toHaveLength(3);
    }
  });

  test('the sample run only uses flags the story can set', () => {
    const settable = new Set<string>();
    for (const steps of Object.values(EVENTS)) for (const step of steps) if ('do' in step && step.do === 'flag') settable.add(step.flag);
    for (const map of Object.values(MAPS)) for (const trigger of map.triggers) settable.add(`trigger:${trigger.id}`);
    for (const flag of SAMPLE_FLAGS) expect(settable).toContain(flag);
  });

  test('the sample run starts at the entry of its map (the respawn tile)', () => {
    const run = sampleRun();
    expect(run.pos).toEqual(MAPS[run.map].entry);
  });
});
