import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { PAGELAB } from '../../art/palette';
import { nodePos, type Point } from '../core/graph';
import { mochaNode } from '../core/mocha';
import type { Id, PageDef, SimState } from '../core/types';
import type { Hit } from '../view/geometry';
import { minHit, targetsOf } from '../view/gestures';
import { babySprite } from '../view/actors';
import { VIEW_BOX } from '../view/PageView';
import { SpriteMarks } from './SpriteSheet';
import type { Overlay } from './labParams';
import { EDGE_COLORS, HEIGHT_COLORS, overlayModel, type EdgeMark } from './labModel';

/**
 * PageLab's overlay layer (GDD § 3.10, #91): one SVG in the page view's own view box, laid exactly
 * over `PageView`, drawing the walk graph and the rules the art hides. Each overlay is a checkbox:
 *
 * - `nodes` — dots coloured by height (0 green, 1 blue, 2 magenta), ringed when they ride a part;
 * - `edges` — Baokaka's edges coloured by kind, dashed while their `when` is false, arrowed if one-way;
 * - `perches` — perches (a square, filled while Mocha sits there) with a dotted line to their
 *   `reachNode`, and the cat edges (`jump`, `squeeze`);
 * - `attractors` — each with its § 2.2.2 rank and priority (`#1 p1`), a star on the goal, faded
 *   when he can't want it now;
 * - `hits` — every touchable's hit shape as data has it (solid) and grown to 48 screen px (dashed,
 *   what `hitTest` uses);
 * - `target` — Baokaka's line to his target and his path preview, and Mocha's remaining trip.
 * - `anchors` — the character sprites' frame box, foot anchor, head (bubble anchor) and footprint
 *   at their nodes (#94, `SpriteMarks`).
 *
 * In edit mode the nodes and the ends of every part's track get handles: drag them and the page
 * re-lints at once (`onMoveNode`, `onMoveTrack`). Only the handles take the pointer.
 */

export interface OverlaysProps {
  readonly def: PageDef;
  readonly state: SimState;
  readonly overlays: ReadonlySet<Overlay>;
  /** Rendered width of 390 page units in CSS px (the same as the page view's) */
  readonly scale: number;
  readonly edit: boolean;
  readonly onMoveNode?: (id: Id, to: Point) => void;
  readonly onMoveTrack?: (part: Id, end: 'from' | 'to', to: Point) => void;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Text with a white halo, for labels on any art. */
function Label({ x, y, children, anchor = 'start', color = PAGELAB.label }: { x: number; y: number; children: string; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <text x={r1(x)} y={r1(y)} textAnchor={anchor} fontSize={9} fontWeight={700} fill={color} stroke={PAGELAB.halo} strokeWidth={2.5} paintOrder="stroke" style={{ fontFamily: 'ui-monospace, monospace' }}>
      {children}
    </text>
  );
}

function HitOutline({ hit, dashed }: { hit: Hit; dashed: boolean }) {
  const common = { fill: 'none', stroke: PAGELAB.hit, strokeWidth: dashed ? 1.2 : 2, strokeDasharray: dashed ? '4 3' : undefined };
  return 'r' in hit ? <circle cx={r1(hit.cx)} cy={r1(hit.cy)} r={r1(hit.r)} {...common} /> : <rect x={r1(hit.x)} y={r1(hit.y)} width={r1(hit.w)} height={r1(hit.h)} {...common} />;
}

function EdgeLine({ e }: { e: EdgeMark }) {
  const color = EDGE_COLORS[e.kind];
  const [x1, y1] = e.from;
  const [x2, y2] = e.to;
  const mid: Point = [(x1 + x2) / 2, (y1 + y2) / 2];
  return (
    <g data-edge={`${e.a}-${e.b}`} data-open={e.open ? '' : undefined}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAGELAB.halo} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={e.open ? undefined : '5 4'} markerEnd={e.oneWay ? 'url(#pagelab-arrow)' : undefined} />
      {e.kind !== 'crawl' && (
        <Label x={mid[0]} y={mid[1] - 4} anchor="middle" color={color}>
          {e.kind}
        </Label>
      )}
    </g>
  );
}

export function Overlays({ def, state, overlays, scale, edit, onMoveNode, onMoveTrack }: OverlaysProps) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<((p: Point) => void) | null>(null);
  const m = overlayModel(def, state);
  const on = (o: Overlay) => overlays.has(o);

  /** Client px → page units, through the SVG's own transform. */
  const toPage = (e: ReactPointerEvent): Point | null => {
    const el = svg.current;
    const ctm = el?.getScreenCTM();
    if (!el || !ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return [p.x, p.y];
  };
  const grab = (move: (p: Point) => void) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = move;
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    const p = toPage(e);
    if (p) drag.current(p);
  };
  const end = () => {
    drag.current = null;
  };

  const babyEdges = m.edges.filter((e) => !e.cat);
  const catEdges = m.edges.filter((e) => e.cat);
  const targets = on('hits') ? targetsOf(def, state) : [];
  const tracks = def.parts.filter((p) => p.track !== undefined);
  const babyAt = on('anchors') ? nodePos(def, state, state.baby.node) : undefined;
  const mochaNodeId = on('anchors') ? mochaNode(def, state) : null;
  const mochaAt = mochaNodeId === null ? undefined : nodePos(def, state, mochaNodeId);

  return (
    <svg
      ref={svg}
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.w} ${VIEW_BOX.h}`}
      width={r1(VIEW_BOX.w * scale)}
      height={r1(VIEW_BOX.h * scale)}
      overflow="visible"
      className="absolute left-0 top-0"
      style={{ pointerEvents: 'none', touchAction: edit ? 'none' : undefined }}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
      data-pagelab-overlays={[...overlays].join(',')}
      aria-hidden="true"
    >
      <defs>
        <marker id="pagelab-arrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 z" fill={PAGELAB.label} />
        </marker>
      </defs>

      {on('hits') && (
        <g data-overlay="hits">
          {targets.map((t) => (
            <g key={t.key} data-hit-of={t.key}>
              <HitOutline hit={t.hit} dashed={false} />
              <HitOutline hit={minHit(t.hit, scale)} dashed />
            </g>
          ))}
        </g>
      )}

      {on('perches') && (
        <g data-overlay="perches">
          {catEdges.map((e) => (
            <EdgeLine key={`${e.a}-${e.b}`} e={e} />
          ))}
          {m.perches.map((p) => (
            <g key={p.id} data-perch={p.id}>
              {p.reach && <line x1={p.at[0]} y1={p.at[1]} x2={p.reach[0]} y2={p.reach[1]} stroke={PAGELAB.mochaPath} strokeWidth={1.5} strokeDasharray="1 4" strokeLinecap="round" />}
              <rect x={p.at[0] - 7} y={p.at[1] - 7} width={14} height={14} rx={3} fill={p.occupied ? PAGELAB.mochaPath : PAGELAB.halo} stroke={PAGELAB.mochaPath} strokeWidth={2} />
              <Label x={p.at[0] + 10} y={p.at[1] - 8} color={PAGELAB.mochaPath}>{`perch ${p.id}`}</Label>
            </g>
          ))}
        </g>
      )}

      {on('edges') && (
        <g data-overlay="edges">
          {babyEdges.map((e) => (
            <EdgeLine key={`${e.a}-${e.b}`} e={e} />
          ))}
        </g>
      )}

      {on('target') && (
        <g data-overlay="target">
          {m.mochaPath.length > 1 && <polyline points={m.mochaPath.map((p) => p.join(',')).join(' ')} fill="none" stroke={PAGELAB.mochaPath} strokeWidth={3} strokeDasharray="2 5" strokeLinecap="round" />}
          {m.target && (
            <g data-target={m.target.id}>
              <line x1={m.target.from[0]} y1={m.target.from[1] - 20} x2={m.target.to[0]} y2={m.target.to[1] - 20} stroke={PAGELAB.target} strokeWidth={1.5} strokeDasharray="6 4" />
              {m.target.path.length > 1 && (
                <polyline points={m.target.path.map((p) => `${p[0]},${p[1] + 8}`).join(' ')} fill="none" stroke={PAGELAB.target} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
              )}
              <circle cx={m.target.to[0]} cy={m.target.to[1] - 20} r={9} fill="none" stroke={PAGELAB.target} strokeWidth={2} />
              <Label x={(m.target.from[0] + m.target.to[0]) / 2} y={(m.target.from[1] + m.target.to[1]) / 2 - 26} anchor="middle" color={PAGELAB.target}>{`target → ${m.target.id}`}</Label>
            </g>
          )}
        </g>
      )}

      {on('anchors') && (
        <g data-overlay="anchors">
          {mochaAt && <SpriteMarks sprite="mocha.sit" facing={babyAt && babyAt[0] < mochaAt[0] - 4 ? 'l' : 'r'} x={mochaAt[0]} y={mochaAt[1]} />}
          {babyAt && <SpriteMarks sprite={babySprite(state.baby.mode)} facing={state.baby.facing} x={babyAt[0]} y={babyAt[1]} />}
        </g>
      )}

      {on('attractors') && (
        <g data-overlay="attractors">
          {m.attractors.map((a, i) => {
            // Attractors on one node (Mocha's reach node is often the goal's) stack their labels
            const below = m.attractors.slice(0, i).filter((b) => b.at[0] === a.at[0] && b.at[1] === a.at[1]).length;
            return (
              <g key={a.id} data-attractor-mark={a.id} opacity={a.rank === null ? 0.5 : 1}>
                <circle cx={a.at[0]} cy={a.at[1] - 14} r={11} fill="none" stroke={PAGELAB.attractor} strokeWidth={2.5} strokeDasharray={a.reachable ? undefined : '3 3'} />
                <Label x={a.at[0]} y={a.at[1] - 30 - below * 11} anchor="middle" color={PAGELAB.label}>
                  {`${a.rank === null ? '–' : `#${a.rank}`} p${a.priority} ${a.goal ? '★' : ''}${a.id}`}
                </Label>
              </g>
            );
          })}
        </g>
      )}

      {(on('nodes') || edit) && (
        <g data-overlay="nodes">
          {m.nodes.map((n) => (
            <g key={n.id} data-node={n.id}>
              <circle
                cx={n.at[0]}
                cy={n.at[1]}
                r={edit ? 7 : 5}
                fill={HEIGHT_COLORS[n.height]}
                stroke={n.attachedTo ? PAGELAB.handle : PAGELAB.halo}
                strokeWidth={n.attachedTo ? 2.5 : 1.5}
                style={edit ? { pointerEvents: 'all', cursor: 'move' } : undefined}
                onPointerDown={edit && onMoveNode ? grab((p) => onMoveNode(n.id, p)) : undefined}
                data-handle={edit ? 'node' : undefined}
              />
              <Label x={n.at[0] + 8} y={n.at[1] + 14}>{n.id}</Label>
            </g>
          ))}
        </g>
      )}

      {edit && (
        <g data-overlay="tracks">
          {tracks.map((p) => {
            const { from, to } = p.track!;
            return (
              <g key={p.id} data-track={p.id}>
                <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={PAGELAB.handle} strokeWidth={2} strokeDasharray="8 4" />
                {(['from', 'to'] as const).map((end) => {
                  const [x, y] = p.track![end];
                  return (
                    <rect
                      key={end}
                      x={x - 7}
                      y={y - 7}
                      width={14}
                      height={14}
                      fill={PAGELAB.handle}
                      stroke={PAGELAB.halo}
                      strokeWidth={1.5}
                      style={{ pointerEvents: 'all', cursor: 'move' }}
                      onPointerDown={onMoveTrack ? grab((pt) => onMoveTrack(p.id, end, pt)) : undefined}
                      data-handle={`track-${end}`}
                    />
                  );
                })}
                <Label x={to[0] + 10} y={to[1] + 4} color={PAGELAB.handle}>{`${p.id} track`}</Label>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
