import { describe, expect, test } from 'vitest';
import { EVENTS } from '../quest/engine/events';
import { MAPS } from '../quest/engine/maps';
import { questReducer } from '../quest/engine/quest';
import { validateSteps } from '../quest/engine/validate';
import { activeFollower } from '../quest/engine/progress';
import { ARTLAB_FIXTURES, ARTLAB_FOLLOWERS, SAMPLE_FLAGS, sampleRun } from './fixtures';

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
    if (state.line || state.card || state.choice) expect(state.scene).not.toBeNull();
    if (state.scene) {
      const errors: string[] = [];
      validateSteps(fixture.name, state.scene.steps, errors);
      expect(errors).toEqual([]);
    }
  });

  test('party-sheet-equip opens the bag with signature gear picked that the party carries', () => {
    const fixture = ARTLAB_FIXTURES.find((entry) => entry.name === 'party-sheet-equip')!;
    expect(fixture.menu).toEqual({ tab: 'bag', picking: 'bellCollar' });
    const state = fixture.state();
    expect(state.run.items.bellCollar).toBe(1);
    expect(state.run.party).toContain('mocha');
    expect(questReducer(state, { type: 'equip', item: 'bellCollar', hero: 'baokaka' })).toBe(state);
  });

  test('chapter-card shows the clock and dialogue-choice plays on when an option is picked', () => {
    const card = ARTLAB_FIXTURES.find((fixture) => fixture.name === 'chapter-card')!.state();
    expect(card.card).toEqual({ n: 1, title: '度晬前一晚', time: '00:00' });

    const asked = ARTLAB_FIXTURES.find((fixture) => fixture.name === 'dialogue-choice')!.state();
    expect(asked.choice?.options).toHaveLength(3);
    const picked = questReducer(asked, { type: 'choose', index: 0 });
    expect(picked.choice).toBeNull();
    expect(picked.line).toEqual(EVENTS['home.mom.hug'][0]);
  });

  test.each([
    ['battle', 3],
    ['battle-4-heroes', 4],
  ] as const)('%s opens on a hero turn against three foes, so the screenshot never races a foe timer', (name, heroes) => {
    const battle = ARTLAB_FIXTURES.find((fixture) => fixture.name === name)!.state();
    expect(battle.view.screen).toBe('battle');
    if (battle.view.screen === 'battle') {
      expect(battle.view.battle.phase.kind).toBe('hero');
      expect(battle.view.battle.foes).toHaveLength(3);
      expect(battle.view.battle.party).toHaveLength(heroes);
    }
  });

  test('the sample run only uses flags the story can set', () => {
    const settable = new Set<string>();
    for (const steps of Object.values(EVENTS)) for (const step of steps) if ('do' in step && step.do === 'flag') settable.add(step.flag);
    for (const map of Object.values(MAPS)) for (const trigger of map.triggers) settable.add(`trigger:${trigger.id}`);
    for (const flag of SAMPLE_FLAGS) expect(settable).toContain(flag);
  });

  test('world-follower brings its own escort table and turns it on', () => {
    const fixture = ARTLAB_FIXTURES.find((entry) => entry.name === 'world-follower')!;
    expect(fixture.followers).toBe(ARTLAB_FOLLOWERS);
    expect(activeFollower(fixture.state().run.flags, fixture.followers)?.name).toBe('小蝸牛');
    // The plain world fixture has no escort
    expect(activeFollower(ARTLAB_FIXTURES.find((entry) => entry.name === 'world')!.state().run.flags, ARTLAB_FOLLOWERS)).toBeNull();
  });

  test('the sample run starts at the entry of its map (the respawn tile)', () => {
    const run = sampleRun();
    expect(run.pos).toEqual(MAPS[run.map].entry);
  });
});
