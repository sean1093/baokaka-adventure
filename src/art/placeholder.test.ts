import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { spriteWarnings } from '../quest/engine/validate';
import { placeholderGlyph, registerPlaceholder } from './placeholder';
import { spriteMeta } from './sprite';
import { SPRITES } from './sprites';

describe('placeholder sprites (D-14)', () => {
  it('shows the label’s first CJK character', () => {
    expect(placeholderGlyph('咕咕')).toBe('咕');
    expect(placeholderGlyph('MRT 嗶嗶')).toBe('嗶');
    expect(placeholderGlyph('Bob')).toBe('B');
    expect(placeholderGlyph('')).toBe('?');
  });

  it('is tagged with its kind and label and renders the plate at every kind', () => {
    for (const kind of ['npc', 'foe', 'boss', 'prop'] as const) {
      const sprite = registerPlaceholder(`test-${kind}`, { kind, label: '鵝霸' });
      expect(spriteMeta(sprite)).toEqual({ kind, placeholder: { name: `test-${kind}`, label: '鵝霸' } });
      const markup = renderToStaticMarkup(createElement(sprite, { lod: 'map' }));
      expect(markup).toContain(`data-placeholder="test-${kind}"`);
      expect(markup).toContain('>鵝</span>');
      expect(markup).not.toContain('<text');
    }
  });

  it('validate lists placeholders in the registry as warnings', () => {
    const registry = { ...SPRITES, gugu: registerPlaceholder('gugu', { kind: 'foe', label: '咕咕' }) };
    expect(spriteWarnings(registry)).toEqual(['sprite gugu is a placeholder (foe 「咕咕」)']);
    // The live registry: logged, not asserted (content may use placeholders until #58)
    const live = spriteWarnings();
    console.info(`placeholders in SPRITES: ${live.length}${live.length ? `\n${live.join('\n')}` : ''}`);
  });
});
