import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { STAGE, gradeStage } from '../palette';
import { BossFrame } from './BossFrame';
import { GENERIC, GENERIC_ROOM } from './generic';
import { CHAPTER_CHUNKS, backdropNow, preloadBackdrop } from './index';
import { BACKDROP_CHAPTER, GENERIC_BACKDROPS, backdropFor, isBackdrop } from './keys';
import { STAGE_BLUR_BUDGET, Stage, stageScale } from './Stage';
import type { StageConfig } from './types';

const markup = (config: StageConfig, time = '00:00') => renderToStaticMarkup(createElement(Stage, { config, time }));
const filters = (html: string) => (html.match(/filter="url\(/g) ?? []).length;

const chapterConfigs = async (): Promise<StageConfig[]> => {
  const configs: StageConfig[] = [];
  for (const load of Object.values(CHAPTER_CHUNKS)) configs.push(...Object.values((await load()).BACKDROPS));
  return configs;
};

describe('battle backdrop keys (§ 8.4)', () => {
  it('every chapter key has a chunk that draws it, and every drawn key is listed', async () => {
    const chapters = new Set(Object.values(BACKDROP_CHAPTER));
    for (const chapter of chapters) expect(CHAPTER_CHUNKS[chapter], `chapter ${chapter}`).toBeDefined();
    for (const [chapter, load] of Object.entries(CHAPTER_CHUNKS)) {
      const module = await load();
      for (const [key, config] of Object.entries(module.BACKDROPS)) {
        expect(BACKDROP_CHAPTER[key], key).toBe(Number(chapter));
        expect(config.key).toBe(key);
      }
    }
    for (const [key, chapter] of Object.entries(BACKDROP_CHAPTER)) expect(Object.keys((await CHAPTER_CHUNKS[chapter]()).BACKDROPS)).toContain(key);
  });

  it('falls back to the generic stage, the room one indoors', () => {
    expect(backdropFor({ backdrop: 'daan' })).toBe('daan');
    expect(backdropFor({})).toBe('generic');
    expect(backdropFor({ interior: true })).toBe('genericRoom');
    expect(backdropFor({ backdrop: 'nowhere', interior: true })).toBe('genericRoom');
    expect(isBackdrop('daan')).toBe(true);
    expect(isBackdrop('toString')).toBe(false);
    for (const key of GENERIC_BACKDROPS) expect(backdropNow(key)).not.toBeNull();
  });

  it('loads a chapter backdrop on demand and then has it at once', async () => {
    expect(await preloadBackdrop('nowhere')).toBeNull();
    const daan = await preloadBackdrop('daan');
    expect(daan?.key).toBe('daan');
    expect(backdropNow('daan')).toBe(daan);
  });
});

describe('the stage art', () => {
  it('stays within the blur budget, holds no text or bitmaps, and is the same on every render', async () => {
    for (const config of [GENERIC, GENERIC_ROOM, ...(await chapterConfigs())]) {
      for (const time of ['00:00', '03:00', '05:15']) {
        const html = markup(config, time);
        expect(filters(html), `${config.key} ${time}`).toBeLessThanOrEqual(STAGE_BLUR_BUDGET);
        expect(html).not.toMatch(/<(text|image|foreignObject)\b/);
        expect(markup(config, time)).toBe(html);
      }
    }
  });

  it('a backdrop with its own clock ignores the map clock', async () => {
    const [daan] = await chapterConfigs();
    expect(daan.time).toBe('00:20');
    expect(markup(daan, '00:00')).toBe(markup(daan, '04:00'));
    expect(markup(GENERIC, '00:00')).not.toBe(markup(GENERIC, '04:00'));
  });

  it('the 布袋戲 frames hold no filter (they slide in) and the final one adds the pillars', () => {
    const boss = renderToStaticMarkup(createElement(BossFrame, { variant: 'boss', left: 0, right: 390 }));
    const final = renderToStaticMarkup(createElement(BossFrame, { variant: 'final', left: 0, right: 390 }));
    expect(boss).not.toMatch(/filter/);
    expect(final).not.toMatch(/filter/);
    expect(final.length).toBeGreaterThan(boss.length);
    expect(boss).toContain('data-boss-frame="boss"');
  });

  it('scales to the stage height on a phone and grades scenery with the clock', () => {
    expect(stageScale(390, 500)).toBe(1);
    expect(stageScale(375, 340)).toBeCloseTo(0.68);
    expect(gradeStage('00:00').shellRim).toBe(STAGE.shellRim);
    expect(gradeStage('05:15')).toBe(gradeStage('05:15'));
    expect(gradeStage('05:15').paveTop).not.toBe(STAGE.paveTop);
  });
});
