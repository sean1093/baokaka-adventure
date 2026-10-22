import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { ENV_MANIFEST } from '../env/env.gen';
import { pageArt } from '../env/report';
import { WINDOW_STRIPS, frameKey, stripKey } from '../env/windowStrips';
import { PAGES } from '../pages';
import { WindowStrip } from './WindowStrip';

const draw = (backdrop: string, reduced: boolean) => renderToStaticMarkup(createElement('svg', null, createElement(WindowStrip, { def: { backdrop }, reduced })));

describe('the 月亮線 window strip (#193)', () => {
  const moving = PAGES.filter((p) => p.index === 1 && WINDOW_STRIPS[p.backdrop] !== undefined);

  test('every moving page-1 car has its strip and frame baked, counted in its page art', () => {
    expect(moving.map((p) => p.id).sort()).toEqual(['c10p1', 'c1p1', 'c5p1', 'c6p1', 'c8p1', 'c9p1']);
    for (const p of moving) {
      expect(ENV_MANIFEST.cutouts[stripKey(p.backdrop)], p.id).toBeDefined();
      expect(ENV_MANIFEST.cutouts[frameKey(p.backdrop)], p.id).toBeDefined();
      const files = pageArt(p, ENV_MANIFEST).cutouts.map((f) => f.file);
      expect(files).toContain(ENV_MANIFEST.cutouts[stripKey(p.backdrop)].file);
    }
  });

  test('it slides on one transformed group (a transform loop), and holds still under reduced motion', () => {
    const live = draw('c1/car', false);
    expect(live.match(/data-anim=""/g)).toHaveLength(1);
    expect(live).toContain('class="ws-run"');
    expect(live).toMatch(/--ws-period:-360px/);
    const still = draw('c1/car', true);
    expect(still).not.toContain('ws-run');
    expect(still).not.toContain('animation');
  });

  test('a car standing at a platform (2-1) draws none', () => {
    expect(draw('c2/xinyi-car', false)).toBe('<svg></svg>');
  });
});
