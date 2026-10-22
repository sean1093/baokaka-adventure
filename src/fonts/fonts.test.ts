import { describe, expect, it } from 'vitest';
import { charStats, DEV_SOURCES, GAME_SOURCES, sourceRuns } from './charset';
import MANIFEST from './fonts.json';

/**
 * The self-hosted font subsets (#68, D-105) against the source: every character the game prints is
 * drawn by a file the stylesheet declares for it, in every weight, so no glyph falls back to the
 * system font. When this fails after a text change, run `npm run fonts` (needs Python and
 * fonttools; see scripts/fonts/subset.py) and commit what it writes.
 */

/** The bits of `node:fs` and `node:zlib` the test uses (the app's tsconfig carries no Node types). */
interface FsLike {
  readFileSync(path: URL): Uint8Array;
  readFileSync(path: URL, encoding: 'utf8'): string;
  readdirSync(path: URL, opts: { withFileTypes: true }): { name: string; isDirectory(): boolean }[];
}
interface ZlibLike {
  brotliDecompressSync(data: Uint8Array): Uint8Array;
}
const NODE_FS = 'node:fs';
const NODE_ZLIB = 'node:zlib';
const fs = (await import(/* @vite-ignore */ NODE_FS)) as FsLike;
const zlib = (await import(/* @vite-ignore */ NODE_ZLIB)) as ZlibLike;

const ROOT = new URL('../../', import.meta.url);
const list = (dir: string): string[] =>
  fs.readdirSync(new URL(dir, ROOT), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? list(`${dir}${d.name}/`) : [`${dir}${d.name}`]));
const SOURCES = list('src/');
const read = (re: RegExp) => Object.fromEntries(SOURCES.filter((f) => re.test(f)).map((f) => [f, fs.readFileSync(new URL(f, ROOT), 'utf8')]));

// ── WOFF2 → the code points its cmap maps (W3C WOFF2 § 5–6, OpenType `cmap` formats 4 and 12) ──

/** WOFF2's known table tags, by the index a directory entry's flags carry (§ 5.2) */
const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

/** The code points a WOFF2 file's `cmap` maps to a glyph. */
function woff2CodePoints(file: Uint8Array): Set<number> {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  expect(String.fromCharCode(...file.subarray(0, 4))).toBe('wOF2');
  const numTables = view.getUint16(12);
  let at = 48;
  const base128 = () => {
    let n = 0;
    for (let i = 0; i < 5; i += 1) {
      const b = file[at++];
      n = n * 128 + (b & 0x7f);
      if (!(b & 0x80)) return n;
    }
    throw new Error('bad UIntBase128');
  };
  let offset = 0;
  let cmap: [number, number] | null = null;
  for (let i = 0; i < numTables; i += 1) {
    const flags = file[at++];
    const tag = (flags & 0x3f) === 0x3f ? String.fromCharCode(...file.subarray(at, (at += 4))) : KNOWN_TAGS[flags & 0x3f];
    const length = base128();
    const version = flags >> 6;
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    const stored = transformed ? base128() : length;
    if (tag === 'cmap') cmap = [offset, stored];
    offset += stored;
  }
  const compressed = view.getUint32(20);
  const tables = zlib.brotliDecompressSync(file.subarray(at, at + compressed));
  if (!cmap) throw new Error('no cmap table');
  const c = new DataView(tables.buffer, tables.byteOffset + cmap[0], cmap[1]);
  // The richest Unicode subtable: format 12 (full repertoire) over format 4 (BMP)
  const subtables = Array.from({ length: c.getUint16(2) }, (_, i) => c.getUint32(4 + i * 8 + 4));
  const formats = subtables.map((o) => [c.getUint16(o), o] as const);
  const points = new Set<number>();
  const f12 = formats.find(([f]) => f === 12);
  if (f12) {
    const o = f12[1];
    for (let g = 0, n = c.getUint32(o + 12); g < n; g += 1) {
      const start = c.getUint32(o + 16 + g * 12);
      const end = c.getUint32(o + 20 + g * 12);
      for (let p = start; p <= end; p += 1) points.add(p);
    }
    return points;
  }
  const f4 = formats.find(([f]) => f === 4);
  if (!f4) throw new Error('no format 4 or 12 cmap subtable');
  const o = f4[1];
  const segs = c.getUint16(o + 6) / 2;
  const ends = o + 14;
  const starts = ends + segs * 2 + 2;
  const deltas = starts + segs * 2;
  const ranges = deltas + segs * 2;
  for (let s = 0; s < segs; s += 1) {
    const end = c.getUint16(ends + s * 2);
    const start = c.getUint16(starts + s * 2);
    const delta = c.getInt16(deltas + s * 2);
    const rangeOffset = c.getUint16(ranges + s * 2);
    for (let p = start; p <= end && p !== 0xffff; p += 1) {
      const glyph = rangeOffset === 0 ? (p + delta) & 0xffff : c.getUint16(ranges + s * 2 + rangeOffset + (p - start) * 2);
      if (glyph !== 0) points.add(p);
    }
  }
  return points;
}

// ── The stylesheets ──

interface Face {
  readonly family: string;
  readonly weight: number;
  readonly file: string;
  readonly range: Set<number>;
  readonly sheet: 'fonts.css' | 'dev.css';
}

function parseRange(range: string): Set<number> {
  const points = new Set<number>();
  for (const part of range.split(',')) {
    const m = /^\s*U\+([0-9A-F]+)(?:-([0-9A-F]+))?\s*$/i.exec(part);
    if (!m) throw new Error(`bad unicode-range part ${part}`);
    for (let p = parseInt(m[1], 16), end = parseInt(m[2] ?? m[1], 16); p <= end; p += 1) points.add(p);
  }
  return points;
}

function parseSheet(sheet: Face['sheet']): Face[] {
  const css = fs.readFileSync(new URL(`src/fonts/${sheet}`, ROOT), 'utf8');
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) => {
    const prop = (name: string) => {
      const m = new RegExp(`${name}:\\s*([^;]+);`).exec(body);
      if (!m) throw new Error(`@font-face without ${name} in ${sheet}`);
      return m[1].trim();
    };
    expect(prop('font-display')).toBe('swap');
    return {
      family: prop('font-family').replace(/^'|'$/g, ''),
      weight: Number(prop('font-weight')),
      file: /url\('\.\/files\/([^']+)'\)/.exec(prop('src'))![1],
      range: parseRange(prop('unicode-range')),
      sheet,
    };
  });
}

const GAME_FACES = parseSheet('fonts.css');
const DEV_FACES = parseSheet('dev.css');
const FACES = [...GAME_FACES, ...DEV_FACES];
const FILES = list('src/fonts/files/').map((f) => f.slice('src/fonts/files/'.length));
const CMAPS = new Map(FILES.map((f) => [f, woff2CodePoints(fs.readFileSync(new URL(`src/fonts/files/${f}`, ROOT)))]));

/** The CJK families must draw every character but the few symbols they never had (system font, as before). */
const CJK_FAMILIES = ['Chiron GoRound TC', 'Noto Serif TC'] as const;
const FAMILIES = MANIFEST.families as Record<string, { weights: number[]; missing: string | null }>;

const show = (points: Iterable<number>) => [...points].map((p) => String.fromCodePoint(p)).join('');

describe('self-hosted font subsets (#68)', () => {
  it('reads a WOFF2 cmap (the test reader agrees with the generator on a known file)', () => {
    const latin = CMAPS.get('fredoka-600-0.woff2')!;
    for (const c of 'Pop-Up Taipei 0123456789:') expect(latin.has(c.codePointAt(0)!)).toBe(true);
    expect(latin.has('台'.codePointAt(0)!)).toBe(false);
  });

  it('declares every file exactly once, and every declared file exists', () => {
    expect(FACES.map((f) => f.file).sort()).toEqual([...FILES].sort());
  });

  it("draws every character of a face's unicode-range (the range never promises a glyph the file lacks)", () => {
    for (const face of FACES) {
      const cmap = CMAPS.get(face.file)!;
      const lacking = [...face.range].filter((p) => !cmap.has(p));
      expect(show(lacking), face.file).toBe('');
    }
  });

  it('gives each character of a face one file (the slices do not overlap)', () => {
    const seen = new Map<string, string>();
    for (const face of FACES) {
      for (const p of face.range) {
        const key = `${face.family}/${face.weight}/${p}`;
        expect(seen.get(key), `${String.fromCodePoint(p)} in ${face.file}`).toBeUndefined();
        seen.set(key, face.file);
      }
    }
  });

  it('keeps the weights the type scale uses, nothing from Google Fonts', () => {
    for (const [family, { weights }] of Object.entries(FAMILIES)) {
      expect([...new Set(GAME_FACES.filter((f) => f.family === family).map((f) => f.weight))].sort(), family).toEqual(weights);
    }
    const html = fs.readFileSync(new URL('index.html', ROOT), 'utf8');
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });

  /** Characters in `chars` that some weight of a CJK family has no face for. */
  const uncovered = (chars: Iterable<string>, faces: readonly Face[]) => {
    const out: string[] = [];
    for (const family of CJK_FAMILIES) {
      const missing = new Set(FAMILIES[family].missing ?? '');
      for (const weight of FAMILIES[family].weights) {
        const covered = new Set(faces.filter((f) => f.family === family && f.weight === weight).flatMap((f) => [...f.range]));
        for (const c of chars) if (!missing.has(c) && !covered.has(c.codePointAt(0)!)) out.push(`${c} (${family} ${weight})`);
      }
    }
    return out;
  };

  it('covers every character the game prints, in every weight of both CJK families', () => {
    const game = charStats(read(GAME_SOURCES));
    expect(game.size).toBeGreaterThan(900);
    // Run `npm run fonts` when this lists characters
    expect(uncovered(game.keys(), GAME_FACES)).toEqual([]);
  });

  it('covers what the dev tools print with dev.css on top', () => {
    expect(uncovered(charStats(read(DEV_SOURCES)).keys(), FACES)).toEqual([]);
  });

  it('leaves only a few symbols to the system font, and never a Chinese character', () => {
    for (const family of CJK_FAMILIES) {
      const missing = FAMILIES[family].missing ?? '';
      expect([...missing].length, family).toBeLessThanOrEqual(8);
      expect(missing).not.toMatch(/[\p{Script=Han}\p{Script=Bopomofo}]/u);
    }
  });

  it('counts only text that reaches the screen (comments and identifiers stay out)', () => {
    const runs = sourceRuns('src/x.tsx', "// 註解\nconst 名 = '甲';\n/* 塊 */\nconst y = <b title=\"乙\">丙{`丁${1}戊`}</b>;");
    expect(runs.map((r) => r.text).join('')).toBe('甲乙丙丁戊');
    expect(sourceRuns('src/x.css', "/* 註 */ .a::after { content: '己'; }").map((r) => r.text).join('')).toBe('己');
  });

  it('orders the slices by play: a script line belongs to its chapter, a page to its folder', () => {
    const script = sourceRuns('src/popup/content/script.ts', "export const S = { 'p.intro.1': { text: '甲' }, 'c3p2.goose.1': { text: '乙' }, 'e.dawn.1': { text: '丙' } };");
    expect(script.filter((r) => r.text.length === 1).map((r) => [r.text, r.chapter])).toEqual([['甲', 0], ['乙', 3], ['丙', 11]]);
    expect(sourceRuns('src/popup/pages/c7/p2.ts', "const t = '丁';")[0].chapter).toBe(7);
  });
});
