import { describe, expect, test } from 'vitest';

/**
 * The core boundary (GDD § 3.1, issue #79): `src/popup/core/` is pure, deterministic TypeScript.
 * Its files may import only each other and `src/shared/random.ts` — no React, no DOM, nothing
 * from the view or the rest of the app — and may not reach for DOM globals, timers, the wall
 * clock or `Math.random`. Tests are exempt (they import vitest).
 */

const CORE = 'src/popup/core';
const ALLOWED_OUTSIDE = new Set(['src/shared/random']);

/** Blanks out comments, then string and template literal contents, keeping quotes and line breaks. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}
const stripStrings = (source: string): string => source.replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, (m) => `${m[0]}${m.at(-1)}`);

/** Every module specifier: static imports and re-exports, side-effect imports, `import()`, `require()`. */
export function importSpecifiers(source: string): string[] {
  const code = stripComments(source);
  const patterns = [/\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g, /\bimport\s*['"]([^'"]+)['"]/g, /\b(?:import|require)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g];
  return patterns.flatMap((re) => [...code.matchAll(re)].map((m) => m[1]));
}

/** Joins a relative specifier onto a repo-relative directory, without node:path. */
function resolve(dir: string, spec: string): string {
  const parts = dir.split('/');
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  return parts.join('/').replace(/\.(ts|js)$/, '');
}

/**
 * Browser-only globals, timers, the wall clock and unseeded randomness. Deliberately short: names a
 * page model could use for its own types (`Node`, `Event`, `history`) are not on it.
 */
const FORBIDDEN_GLOBALS =
  /\b(?:window|document|navigator|globalThis|localStorage|sessionStorage|indexedDB|fetch|HTMLElement|requestAnimationFrame|cancelAnimationFrame|setTimeout|setInterval|clearTimeout|clearInterval|performance)\b(?!\s*\??:)|\bDate\s*\.\s*now\b|\bnew\s+Date\b|\bMath\s*\.\s*random\b/g;

/** Why a core file breaks the boundary; empty when it is clean. `file` is repo-relative. */
export function boundaryViolations(file: string, source: string): string[] {
  const out: string[] = [];
  if (!/\.ts$/.test(file)) out.push(`${file}: core holds .ts files only (no JSX)`);
  const dir = file.slice(0, file.lastIndexOf('/'));
  for (const spec of importSpecifiers(source)) {
    if (!spec.startsWith('.')) {
      out.push(`${file}: imports package '${spec}'`);
      continue;
    }
    const target = resolve(dir, spec);
    if (!target.startsWith(`${CORE}/`) && !ALLOWED_OUTSIDE.has(target)) out.push(`${file}: imports '${spec}' (outside core)`);
  }
  // Property keys such as `{ window: 1 }` and member access such as `part.location` are fine
  const code = stripStrings(stripComments(source)).replace(/\.\s*[A-Za-z_$][\w$]*/g, (m) => (/^\.\s*(now|random)$/.test(m) ? m : '.x'));
  for (const m of code.matchAll(FORBIDDEN_GLOBALS)) out.push(`${file}: uses '${m[0].replace(/\s+/g, ' ')}'`);
  return out;
}

const SOURCES = import.meta.glob(['./**/*.ts', './**/*.tsx', '!./**/*.test.ts', '!./**/*.test.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('src/popup/core import boundary', () => {
  const files = Object.entries(SOURCES).map(([key, source]) => [`${CORE}/${key.replace(/^\.\//, '')}`, source] as const);

  test('scans the core sources', () => {
    expect(files.map(([file]) => file)).toContain(`${CORE}/index.ts`);
  });

  test.each(files)('%s stays inside the boundary', (file, source) => {
    expect(boundaryViolations(file, source)).toEqual([]);
  });
});

describe('boundaryViolations', () => {
  const FILE = `${CORE}/step.ts`;
  const check = (source: string, file = FILE) => boundaryViolations(file, source);

  test('allows core siblings, subfolders and src/shared/random.ts', () => {
    expect(
      check(`import type { Page } from './types';
import { reach } from "./graph.ts";
export { solve } from './solver/bfs';
export * from './events';
import { roll } from '../../shared/random';
import { pick } from '../../shared/random.ts';`),
    ).toEqual([]);
    expect(check(`import { x } from '../types';`, `${CORE}/solver/bfs.ts`)).toEqual([]);
  });

  test.each([
    [`import { useState } from 'react';`, 'package'],
    [`import type { ReactNode } from 'react';`, 'package'],
    [`import 'react-dom';`, 'package'],
    [`const lab = await import('../dev/PageLab');`, 'outside core'],
    [`import { PageView } from '../view/PageView';`, 'outside core'],
    [`export { load } from '../game/progress';`, 'outside core'],
    [`import { browserStorage } from '../../shared/storage';`, 'outside core'],
    [`import { POPUP } from '../../art/palette';`, 'outside core'],
    [`import { x } from '../../../core/x';`, 'outside core'],
  ])('rejects %s', (source, reason) => {
    const found = check(source);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain(reason);
  });

  test.each([
    'const w = window.innerWidth;',
    'document.body.append(x);',
    'localStorage.setItem(k, v);',
    'requestAnimationFrame(tick);',
    'setTimeout(tick, 16);',
    'const t = Date.now();',
    'const d = new Date();',
    'const r = Math.random();',
    'const el: HTMLElement = x;',
  ])('rejects DOM, timers and nondeterminism: %s', (source) => {
    expect(check(source)).toHaveLength(1);
  });

  test('ignores comments, strings, property keys and member names', () => {
    expect(
      check(`// window, document and Math.random() are banned here
/* import x from 'react' */
const label = 'window seat';
const part = { window: 1, location: 'lobby', history: [] };
type Node = { id: string; performance?: number };
const at = part.location + part.window.length;
type Part = { document: string };`),
    ).toEqual([]);
  });

  test('rejects JSX files', () => {
    expect(check('export {};', `${CORE}/view.tsx`)[0]).toContain('.ts files only');
  });
});
