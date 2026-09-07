import { describe, expect, test } from 'vitest';
import { POLICIES, playStory, storyFights, summarize } from './sim';

const SEEDS = 60;

/**
 * Balance regression. Content edits must keep the quest finishable for a player who heals and
 * rests, and must keep it losable for one who never does. Run `npm run sim` for the full report.
 */
describe('scripted playthroughs', () => {
  test('a careful player finishes almost every time', () => {
    const report = summarize(POLICIES.careful, SEEDS);
    expect(report.finished / SEEDS).toBeGreaterThan(0.9);
    for (const [fight, rate] of Object.entries(report.lossRates)) expect(rate, fight).toBeLessThan(0.15);
  });

  test('a casual player usually finishes', () => {
    const report = summarize(POLICIES.casual, SEEDS);
    expect(report.finished / SEEDS).toBeGreaterThan(0.7);
  });

  test('a player who never heals or guards is stopped by the middle of the story', () => {
    const report = summarize(POLICIES.reckless, SEEDS);
    expect(report.finished / SEEDS).toBeLessThan(0.7);
    // Losing has to be possible somewhere, or 防禦 and items are decoration
    expect(Math.max(...Object.values(report.lossRates))).toBeGreaterThan(0.15);
  });
  // The careful bot heals whenever anyone dips below 45%, so its tail runs longer than a
  // person's would. 30 still catches the regime where a boss out-heals the party.
  test('no boss is a slog: every scripted fight settles inside 30 rounds', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      for (const node of playStory(seed * 104729, POLICIES.careful).nodes) {
        expect(node.rounds, `${node.label} @ seed ${seed}`).toBeLessThanOrEqual(30);
      }
    }
  });
  test('the story has one scripted fight per chapter, in chapter order', () => {
    const fights = storyFights();
    expect(fights.map((fight) => fight.key)).toEqual([
      'home.dust',
      'yard.golem',
      'park.crow',
      'market.fish',
      'beach.octo',
      'night.boss',
    ]);
    // The tutorial fight is the only one that is not a boss
    expect(fights.filter((fight) => fight.boss)).toHaveLength(5);
  });

  test('a playthrough is a pure function of its seed', () => {
    expect(playStory(4242, POLICIES.careful)).toEqual(playStory(4242, POLICIES.careful));
  });
});
