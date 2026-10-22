/**
 * Step 1 of `npm run fonts` (#68, D-105): which characters the self-hosted fonts carry, cut into
 * the files the browser fetches. Writes `src/fonts/charset.json`, which `scripts/fonts/subset.py`
 * (step 2) turns into WOFF2 files and their `@font-face` rules.
 *
 *   - `slices[0]`: printable ASCII and what a first session shows (`src/fonts/first-session.txt`,
 *     recorded by `scripts/fonts/first-session.mjs`): the cover and page 0-1 need this file alone.
 *   - `slices[1…]`: the rest of the game's characters, in play order (the chapter that first prints
 *     them, then the most used first), `SLICE` to a file, so a chapter pulls a file or two.
 *   - `dev`: characters only the dev tools print (the art lab and its RPG drawings, PageLab):
 *     one more file, declared only by the dev tools' stylesheet, never in the build.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALWAYS, charStats, DEV_SOURCES, GAME_SOURCES } from '../../src/fonts/charset';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'src/fonts/charset.json');
/** Characters per file after the first: ≈ 25–30 KB of CJK glyphs per face */
const SLICE = 110;

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(resolve(dir, d.name)) : [resolve(dir, d.name)]));
const files = walk(resolve(ROOT, 'src')).map((f) => relative(ROOT, f).split('\\').join('/'));
const read = (re: RegExp) => Object.fromEntries(files.filter((f) => re.test(f)).map((f) => [f, readFileSync(resolve(ROOT, f), 'utf8')]));

const game = charStats(read(GAME_SOURCES));
const dev = charStats(read(DEV_SOURCES));
const firstSession = new Set([...ALWAYS, ...readFileSync(resolve(ROOT, 'src/fonts/first-session.txt'), 'utf8').replace(/\n$/, '')]);

const rest = [...game]
  .filter(([c]) => !firstSession.has(c))
  .sort(([a, x], [b, y]) => x.chapter - y.chapter || y.count - x.count || a.codePointAt(0)! - b.codePointAt(0)!)
  .map(([c]) => c);
const slices = [[...firstSession], ...Array.from({ length: Math.ceil(rest.length / SLICE) }, (_, i) => rest.slice(i * SLICE, (i + 1) * SLICE))];
const devOnly = [...dev.keys()].filter((c) => !game.has(c) && !firstSession.has(c));

const sorted = (chars: string[]) => [...chars].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!).join('');
writeFileSync(
  OUT,
  `${JSON.stringify({ generatedBy: 'npm run fonts (scripts/fonts/charset.ts)', slices: slices.map(sorted), dev: sorted(devOnly) }, null, 2)}\n`,
);
console.log(`${game.size} game characters in ${slices.length} slices (${slices.map((s) => s.length).join(', ')}), ${devOnly.length} dev-only → ${relative(ROOT, OUT)}`);
