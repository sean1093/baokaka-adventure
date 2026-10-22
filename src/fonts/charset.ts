import ts from 'typescript';

/**
 * The characters the game can print (#68, D-105): what the self-hosted font subsets must cover, and
 * when in the game each one is first needed.
 *
 * Read from the source, not the build, so the coverage test runs before `vite build`. Only text that
 * can reach the screen counts: string and template literals and JSX text in TypeScript, and string
 * tokens in CSS. Comments, identifiers and regular expressions are left out, so the long Chinese
 * comments in the code do not grow the fonts. The count is generous on purpose (a dev message in a
 * shipped module costs a few glyphs); a character it misses would fall back to the system font.
 *
 * Every string also gets a **chapter**: the earliest point of a playthrough it belongs to (0 = the
 * cover, the prologue and the shared UI; 1–10 the chapters; 11 the ending; 12 the bonus page). The
 * fonts are cut into one file per chapter band (`fonts/subset.py`), so the first session downloads
 * only the glyphs of the prologue band. A wrong guess only moves a glyph to another file: every
 * file is declared with its exact `unicode-range`, so coverage never depends on the bands.
 */

/** Source files whose text ships in the game, and the dev tools that show it (PageLab). */
export const GAME_SOURCES = /^src\/(?!quest\/|artlab\/|popup\/dev\/|fonts\/)(?!.*\.test\.tsx?$).*\.(tsx?|css)$/;

/** Dev-only sources (the art lab, which still draws the retired RPG): their own `dev` font file. */
export const DEV_SOURCES = /^src\/(quest|artlab|popup\/dev)\/(?!.*\.test\.tsx?$).*\.(tsx?|css)$/;

/** Printable ASCII: Latin text, digits and punctuation the browser may show from any source. */
export const ALWAYS = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)).join('');

export const ENDING = 11;
export const BONUS = 12;

/** A run of text and the chapter it belongs to. */
export interface Run {
  readonly text: string;
  readonly chapter: number;
}

/** The chapter a file belongs to as a whole (a page's folder, a chapter's art), else 0. */
function fileChapter(path: string): number {
  const m = /\/pages\/c(\d+)\/|\/env\/art\/c(\d+)\.ts$/.exec(path);
  if (m) return Number(m[1] ?? m[2]);
  if (/\/pages\/end\/|\/env\/art\/end\.ts$|\/content\/credits\.ts$/.test(path)) return ENDING;
  if (/\/pages\/bonus\/|\/env\/art\/bonus\.ts$/.test(path)) return BONUS;
  return 0;
}

/** A script key's chapter (`p.intro.1` → 0, `c3p2.goose.1` → 3, `e.dawn.1` → 11, `x.…` → 12). */
function keyChapter(key: string): number | null {
  const m = /^(p|e|x|c(\d+))(p\d+)?\./.exec(key);
  if (!m) return null;
  if (m[2] !== undefined) return Number(m[2]);
  return m[1] === 'p' ? 0 : m[1] === 'e' ? ENDING : BONUS;
}

/** `{ chapter: 3, … }` (the chapter table) → 3. */
function objectChapter(node: ts.ObjectLiteralExpression): number | null {
  for (const p of node.properties) {
    if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'chapter' && ts.isNumericLiteral(p.initializer)) return Number(p.initializer.text);
  }
  return null;
}

/** The printable text of one source file, in runs tagged with their chapter. */
export function sourceRuns(path: string, source: string): Run[] {
  const base = fileChapter(path);
  if (path.endsWith('.css')) {
    const text = [...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(["'])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]).join('');
    return [{ text, chapter: base }];
  }
  const content = path.includes('/popup/content/');
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, false, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: Run[] = [];
  const visit = (node: ts.Node, chapter: number): void => {
    if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node) || ts.isJsxText(node)) out.push({ text: node.text, chapter });
    let inner = chapter;
    if (ts.isPropertyAssignment(node)) {
      // A script line keyed by its beat, or a per-chapter table in content/ (`{ 3: … }`)
      if (ts.isStringLiteral(node.name)) inner = keyChapter(node.name.text) ?? chapter;
      else if (content && ts.isNumericLiteral(node.name)) inner = Number(node.name.text);
    } else if (ts.isObjectLiteralExpression(node)) inner = objectChapter(node) ?? chapter;
    node.forEachChild((child) => visit(child, inner));
  };
  visit(file, base);
  return out;
}

/** A character a font is asked to draw: no controls, no whitespace but the space. */
const printable = (c: string) => c === ' ' || !/[\p{C}\p{Z}]/u.test(c);

/** Where a character is first printed in a playthrough, and how often the sources print it. */
export interface CharStat {
  readonly chapter: number;
  readonly count: number;
}

/**
 * Every character the given files can print, with the earliest chapter that prints it and its
 * count, plus {@link ALWAYS} (chapter 0), in code point order.
 */
export function charStats(files: Readonly<Record<string, string>>): Map<string, CharStat> {
  const stats = new Map<string, CharStat>([...ALWAYS].map((c) => [c, { chapter: 0, count: 0 }]));
  for (const [path, source] of Object.entries(files)) {
    for (const run of sourceRuns(path, source)) {
      for (const c of run.text) {
        if (!printable(c)) continue;
        const was = stats.get(c);
        stats.set(c, { chapter: Math.min(was?.chapter ?? run.chapter, run.chapter), count: (was?.count ?? 0) + 1 });
      }
    }
  }
  return new Map([...stats].sort(([a], [b]) => a.codePointAt(0)! - b.codePointAt(0)!));
}
