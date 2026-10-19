import type { NodeDef, PageDef, PartDef } from '../core/types';

/**
 * PageLab's 「Copy TS」 (GDD § 3.10, #91): the `nodes` block and every part's `track` line of an
 * edited page, as TypeScript to paste over the same lines in the page file (`pages/cN/pK.ts`).
 * Structural edits stay in code; the lab only moves things, so only positions change.
 *
 * The output follows the page files' style: single quotes, `{ a: 1 }` with spaces inside braces,
 * `[x, y]` pairs, one node per line, two-space indents. Pure.
 */

const IDENT = /^[A-Za-z_$][\w$]*$/;

/** A JS string literal in single quotes. */
function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

/** A plain data value (strings, numbers, booleans, arrays, plain objects) as a one-line TS literal. */
export function tsLiteral(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(tsLiteral).join(', ')}]`;
  switch (typeof value) {
    case 'string':
      return quote(value);
    case 'number':
      return Number.isFinite(value) ? String(value) : 'NaN';
    case 'boolean':
      return String(value);
    case 'object': {
      const members = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${IDENT.test(k) ? k : quote(k)}: ${tsLiteral(v)}`);
      return members.length === 0 ? '{}' : `{ ${members.join(', ')} }`;
    }
    default:
      return 'undefined';
  }
}

/** Rounds to whole page units (drags land on fractions; the page files use integers). */
const round = (n: number): number => Math.round(n);

/** A node with its coordinates rounded, keys in the page files' order. */
function tidyNode(n: NodeDef): NodeDef {
  const out: NodeDef = { id: n.id, x: round(n.x), y: round(n.y), height: n.height };
  if (n.attach) {
    const pos: Record<string, [number, number]> = {};
    for (const [state, [x, y]] of Object.entries(n.attach.pos)) pos[state] = [round(x), round(y)];
    out.attach = { part: n.attach.part, pos };
  }
  if (n.tags) out.tags = n.tags;
  return out;
}

/** The `nodes: [ … ],` block, one node per line, at `indent`. */
export function formatNodes(nodes: readonly NodeDef[], indent = '  '): string {
  const lines = nodes.map((n) => `${indent}  ${tsLiteral(tidyNode(n))},`);
  return `${indent}nodes: [\n${lines.join('\n')}\n${indent}],`;
}

/** One `track: { … },` line per part that has a track, each under a comment naming its part. */
export function formatTracks(parts: readonly PartDef[], indent = '  '): string {
  return parts
    .filter((p) => p.track !== undefined)
    .map((p) => {
      const { from, to } = p.track!;
      const track = { from: [round(from[0]), round(from[1])], to: [round(to[0]), round(to[1])] };
      return `${indent}// part '${p.id}'\n${indent}track: ${tsLiteral(track)},`;
    })
    .join('\n');
}

/** Everything 「Copy TS」 puts on the clipboard for a page. */
export function copyTs(def: PageDef): string {
  const tracks = formatTracks(def.parts);
  const head = `// ${def.id} 「${def.title}」 — positions from PageLab; paste over the page file's nodes block and track lines`;
  return [head, formatNodes(def.nodes), ...(tracks ? [tracks] : [])].join('\n');
}
