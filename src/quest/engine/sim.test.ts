import { describe, expect, test } from 'vitest';
import { CHAPTERS } from './chapters';
import { POLICIES, summarize } from './sim';

const SEEDS = 40;

/** Balance regression: content edits must keep the quest finishable, and keep healing meaningful. */
describe('scripted playthroughs', () => {
  test('a player who heals and uses items finishes the quest with almost no defeats', () => {
    const report = summarize(POLICIES.casual, SEEDS);
    expect(report.finished).toBe(SEEDS);
    expect(report.averageDefeats).toBeLessThanOrEqual(0.5);
  });

  test('a player who also guards against telegraphed hits never loses', () => {
    const report = summarize(POLICIES.smart, SEEDS);
    expect(report.finished).toBe(SEEDS);
    expect(report.averageDefeats).toBeLessThanOrEqual(0.1);
  });

  test('a player who never heals is stopped by a boss before the end', () => {
    const report = summarize(POLICIES.naive, SEEDS);
    expect(report.finished).toBe(0);
    const bosses = CHAPTERS.map((chapter) => `${chapter.id}-${chapter.nodes.length - 1}`);
    expect(bosses.some((node) => (report.lossRates[node] ?? 0) > 0.2)).toBe(true);
  });

  test('the first two fights are a safe tutorial for everyone', () => {
    for (const policy of Object.values(POLICIES)) {
      const report = summarize(policy, SEEDS);
      expect(report.lossRates['1-0']).toBe(0);
      expect(report.lossRates['1-1']).toBe(0);
    }
  });
});
