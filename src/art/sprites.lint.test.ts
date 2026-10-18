import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ArtDefs } from './defs';
import { RigDemo } from './demo/RigDemo';
import { registerPlaceholder } from './placeholder';
import { LODS, SPRITE_BUDGETS, spriteMeta, type SpriteComponent } from './sprite';
import { SPRITES } from './sprites';
import { bannedElements, countElements, markupBytes, markupIds, markupRefs } from './spriteStats';

/**
 * Sprite lint (art direction § 8.6 "Lint tests", § 8.2 rules 6–8). Every sprite in the registry,
 * plus the rig test figure and a placeholder of each kind, at every LOD.
 */

const EXTRA: Record<string, SpriteComponent> = {
  rigDemo: RigDemo,
  placeholderNpc: registerPlaceholder('placeholderNpc', { kind: 'npc', label: '阿伯' }),
  placeholderFoe: registerPlaceholder('placeholderFoe', { kind: 'foe', label: '咕咕' }),
  placeholderBoss: registerPlaceholder('placeholderBoss', { kind: 'boss', label: '鵝霸' }),
  placeholderProp: registerPlaceholder('placeholderProp', { kind: 'prop', label: '郵筒' }),
};

const ALL: [string, SpriteComponent][] = [...Object.entries(SPRITES), ...Object.entries(EXTRA)];

const render = (Art: SpriteComponent, lod: (typeof LODS)[number]) => renderToStaticMarkup(createElement(Art, { lod }));

describe('sprite lint: ids', () => {
  it.each(LODS)('every sprite twice in one document has no duplicate ids and no dangling url(#…) (%s)', (lod) => {
    // One React tree, as on a screen: the shared defs once, then each sprite twice
    const markup = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        createElement(ArtDefs),
        ...ALL.flatMap(([name, Art]) => [createElement(Art, { key: `${name}-a`, lod }), createElement(Art, { key: `${name}-b`, lod })]),
      ),
    );
    const ids = markupIds(markup);
    const seen = new Set<string>();
    const duplicates = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
    expect(duplicates).toEqual([]);
    const dangling = [...new Set(markupRefs(markup))].filter((ref) => !seen.has(ref));
    expect(dangling).toEqual([]);
  });
});

describe('sprite lint: elements', () => {
  it.each(ALL)('%s has no <filter>, <text>, <image> or <foreignObject>', (_name, Art) => {
    for (const lod of LODS) expect(bannedElements(render(Art, lod)), lod).toEqual([]);
  });

  const typed = ALL.filter(([, Art]) => spriteMeta(Art));
  it.each(typed)('%s is within its § 8.2 budget at every LOD', (_name, Art) => {
    const budget = SPRITE_BUDGETS[spriteMeta(Art)!.kind];
    for (const lod of LODS) {
      const markup = render(Art, lod);
      expect(countElements(markup), `${lod} elements`).toBeLessThanOrEqual(budget.elements);
      expect(markupBytes(markup), `${lod} bytes`).toBeLessThanOrEqual(budget.bytes);
    }
  });

  it('the rig demo gets simpler from portrait to map (§ 8.3)', () => {
    const count = (lod: (typeof LODS)[number]) => countElements(render(RigDemo, lod));
    expect(count('portrait')).toBeGreaterThan(count('battle'));
    expect(count('battle')).toBeGreaterThan(count('map'));
    // Iris rays are portrait-only; the map draws 4u contours
    expect(render(RigDemo, 'portrait')).toContain('stroke-width="0.7"');
    expect(render(RigDemo, 'battle')).not.toContain('stroke-width="0.7"');
    expect(render(RigDemo, 'map')).toContain('stroke-width="4"');
    expect(render(RigDemo, 'battle')).toContain('stroke-width="3.2"');
  });

  it('rig groups are named {char}-{part} and the icon crops to the head', () => {
    const markup = render(RigDemo, 'battle');
    for (const part of ['arm-far', 'leg-far', 'leg-near', 'torso', 'arm-near', 'head', 'eyes', 'mouth', 'hair-front']) {
      expect(markup).toContain(`class="rigdemo-${part} part-${part}"`);
    }
    expect(render(RigDemo, 'icon')).toContain('viewBox="62 4 76 76"');
  });
});

describe('sprite lint: colours', () => {
  /**
   * Files that may still hold raw hex colours. Legacy art only; this list may only shrink, and an
   * entry that no longer needs to be here fails the test so it gets removed.
   */
  const RAW_HEX_ALLOWED: readonly string[] = [];

  // Every source file under src/art, as text (tests excluded)
  const SOURCES = import.meta.glob(['./**/*.ts', './**/*.tsx', '!./**/*.test.ts', '!./**/*.test.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  // A hex colour; `url(#id)` and `href="#id"` references are stripped first
  const HEX = /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;
  const hexIn = (source: string) => source.replace(/url\(#[^)]*\)/g, '').replace(/href=["'`{]+#[^"'`}]*/g, '').match(HEX) ?? [];
  const rawHex = (path: string) => hexIn(SOURCES[`./${path}`] ?? '');
  const art = Object.keys(SOURCES)
    .map((path) => path.slice(2))
    .filter((path) => path !== 'palette.ts');

  it('reads the art sources', () => {
    expect(art).toContain('Fig.tsx');
    expect(art).toContain('sprites/characters.tsx');
  });

  it('no raw hex outside palette.ts (§ 8.2 rule 7)', () => {
    const offenders = art.filter((path) => !RAW_HEX_ALLOWED.includes(path) && rawHex(path).length > 0);
    expect(offenders).toEqual([]);
  });

  it('the legacy allow-list only names files that still need it', () => {
    for (const path of RAW_HEX_ALLOWED) expect(rawHex(path).length, path).toBeGreaterThan(0);
  });

  it('the hex check catches a colour and ignores id references', () => {
    expect(hexIn(`fill="#5A2C34" stroke='#fff' fill="url(#dad-robe)" href="#abc" clipPath={\`url(#\${id('face')})\`}`)).toEqual(['#5A2C34', '#fff']);
  });
});
