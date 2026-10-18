import { Fragment, type CSSProperties, type ReactNode, type SVGProps } from 'react';
import { compactPath, type Vec } from './geom';
import { LodContext, shows, silWidth, type Tier } from './lod';
import { DEV, LINE, MATERIALS, RIM, type Material, type MaterialName } from './palette';
import { CANVAS, type Bones, type Lod, type Skeleton, type SpriteState } from './sprite';
import { useSvgIds } from './useSvgIds';
import './rig.css';

/**
 * The two-pass figure renderer (art direction § 2.3, § 2.4, § 8.1), ported from `Fig` in
 * `docs/art/options/_gen/anime2.py`. A figure is one data array of depth groups; each group is a
 * rig part (`{char}-{part}`), drawn as:
 *
 *   pass 1: every part's shape filled and stroked in `LINE.sil` at 3.2u (4u at the map LOD).
 *           Only the outer half of the stroke shows past the fills, so silhouettes read thick
 *           and overlaps thin.
 *   pass 2: per part, the cel recipe (clip to the shape, fill with the cel tone, redraw the base
 *           tone shifted up-left by (dx, dy), then the part's `deep` / `extra` / rim layers), then
 *           a thin line in the material's line tint. Raw items (creases, prints, the head) go in
 *           order between parts.
 *
 * Groups are flushed in order, so near-limb contours sit on top of the body (far limbs → body →
 * near limbs → head). Each part's path is written once, unpainted, in the contour pass (which
 * paints it through its group) and reused with `<use>` by the clip, the shifted fill and the line:
 * seven elements per shaded part, and every path's data only once, which keeps a hero within the
 * § 8.2 budget (220 elements, 20 KB).
 */

/** Detail gating shared by groups and items (§ 8.3, see `lod.ts`). */
type Gate = {
  /** Lowest detail tier this layer needs (default `map`: always drawn) */
  readonly tier?: Tier;
  /** Draw only at these LODs (for map-only simplifications) */
  readonly only?: readonly Lod[];
};

/** A volume: a closed shape in one material, with contour, cel and line. */
export type FigPart = Gate & {
  readonly d: string;
  readonly mat: MaterialName;
  /** Cel offset (dx, dy) up-left, ≈ 25–35% of the part's radius; `false` for a flat fill. Default (2.6, 2.2). */
  readonly cel?: readonly [number, number] | false;
  /** Interior line width (default 1.2) */
  readonly lw?: number;
  /** Contributes to the contour pass (default true) */
  readonly sil?: boolean;
  /** Occlusion shapes, drawn inside the part's clip after the cel */
  readonly deep?: ReactNode;
  /** Prints, stripes and other marks clipped to the part */
  readonly extra?: ReactNode;
  /** A rim-light stroke (path data) clipped to the part, coloured by the CSS variable `--rim` */
  readonly rim?: string;
};

/** Anything else, drawn in order in pass 2 (creases, prints, a whole head). */
export type FigRaw = Gate & { readonly raw: ReactNode };

/** A shape that only adds to the contour pass (e.g. a bandana drawn by hand in pass 2). */
export type FigSil = Gate & { readonly sil: string };

export type FigItem = FigPart | FigRaw | FigSil;

export type FigGroup = Gate & {
  /** The rig part: the group is classed `{char}-{part}` and `part-{part}` */
  readonly part: string;
  /** The joint it turns around, in canvas units (the CSS transform origin) */
  readonly origin?: Vec;
  /** A static transform for the group's content (e.g. a head authored at its own origin, then scaled) */
  readonly transform?: string;
  /** The scale in `transform` (children inherit it), so contours stay 3.2u on the canvas */
  readonly scale?: number;
  readonly items: readonly FigItem[];
  /**
   * Sub-groups drawn after this group's items, inside its transform: rig parts that move with it
   * (eyes and mouth inside the head). Their origins and items are in the parent's units.
   */
  readonly children?: readonly FigGroup[];
};

const DEFAULT_CEL: readonly [number, number] = [2.6, 2.2];

/** The smallest cel offset still drawn at the map LOD (3u ≈ 1px at 60px): torsos keep theirs, limbs go flat. */
const MAP_CEL_MIN = 3;

/** A square big enough to cover any part, in its own group's units (the clip trims it). */
const COVER = `M-${CANVAS} -${CANVAS}h${CANVAS * 3}v${CANVAS * 3}h-${CANVAS * 3}z`;

/** The interior line width most parts use; set once on the sprite root and inherited. */
const LINE_WIDTH = 1.2;

/** The rim stroke colour: the location's `--rim`, or the moon by default (§ 2.4). */
export const RIM_STROKE: CSSProperties = { stroke: `var(--rim, ${RIM.moon})` };

const visible = (gate: Gate, lod: Lod) => shows(lod, gate.tier) && (!gate.only || gate.only.includes(lod));

const isPart = (item: FigItem): item is FigPart => 'd' in item;
// A part may carry `sil: false` (no contour), so a contour-only item is one with a `sil` path and no `d`
const isSil = (item: FigItem): item is FigSil => !('d' in item) && 'sil' in item;

/** A rig group: classed for `rig.css`, turning around its joint. */
export const RigGroup = ({ char, part, origin, children }: { char: string; part: string; origin?: Vec; children: ReactNode }) => (
  <g className={`${char}-${part} part-${part}`} style={origin ? { transformOrigin: `${origin[0]}px ${origin[1]}px` } : undefined}>
    {children}
  </g>
);

/** The figure's depth groups, both passes each. Put it inside `SpriteSvg`. */
export const Fig = ({ char, lod, groups }: { char: string; lod: Lod; groups: readonly FigGroup[] }) => {
  const id = useSvgIds('f');
  const sil = silWidth(lod);
  const inline = lod === 'map';

  const renderGroup = (group: FigGroup, key: string, inherited = 1): ReactNode => {
    if (!visible(group, lod)) return null;
    const items = group.items.filter((item) => visible(item, lod));
    const scale = group.scale ?? inherited;
    const parts = items.filter(isPart);
    const pid = (p: FigPart) => id(`${key}p${parts.indexOf(p)}`);
    const ref = (p: FigPart) => `#${pid(p)}`;
    // At the map LOD a part's path is written out wherever it's used instead of <use>d: each <use>
    // is a shadow tree the browser keeps in sync, and map sprites move every frame (#16 perf)
    const use = (part: FigPart, paint: SVGProps<SVGPathElement> & SVGProps<SVGUseElement> = {}, key?: number) =>
      inline ? <path key={key} d={compactPath(part.d)} {...paint} /> : <use key={key} href={ref(part)} {...paint} />;

    // Pass 1. The part paths carry no paint of their own: here they inherit the contour paint
    // from the group, and every <use> below (clip, shifted fill, line) paints them its own way.
    const contour = items.map((item, i) => {
      if (isSil(item)) return <path key={i} d={compactPath(item.sil)} />;
      if (isPart(item) && item.sil !== false) return <path key={i} id={pid(item)} d={compactPath(item.d)} />;
      return null;
    });
    const unoutlined = parts.filter((part) => part.sil === false);

    const fills = items.map((item, i) => {
      if (isSil(item)) return null;
      if (!isPart(item)) return <Fragment key={i}>{item.raw}</Fragment>;
      const ramp: Material = MATERIALS[item.mat];
      const line = ramp.line ?? ramp.cel;
      // At the map LOD (60px, a unit is 0.3px) the thin material line and a limb's cel band (< 3u)
      // can't be seen: those parts become one flat fill, which keeps moving map sprites cheap (#16)
      const celSet = item.cel ?? DEFAULT_CEL;
      const cel = inline && celSet && celSet[0] < MAP_CEL_MIN ? false : celSet;
      const lw = item.lw === LINE_WIDTH ? undefined : item.lw;
      const layered = cel || item.deep || item.extra || item.rim;
      if (!layered) return use(item, inline ? { fill: ramp.base } : { fill: ramp.base, stroke: line, strokeWidth: lw }, i);
      // The cel recipe (§ 2.4): cel tone everywhere, base tone shifted up-left, clipped to the part
      const clip = id(`${key}c${parts.indexOf(item)}`);
      return (
        <Fragment key={i}>
          <clipPath id={clip}>
            {use(item)}
          </clipPath>
          <g clipPath={`url(#${clip})`}>
            {cel ? (
              <>
                <path d={COVER} fill={ramp.cel} />
                {use(item, { fill: ramp.base, stroke: 'none', transform: `translate(${-cel[0]} ${-cel[1]})` })}
              </>
            ) : (
              <path d={COVER} fill={ramp.base} />
            )}
            {item.deep}
            {item.extra}
            {item.rim && <path d={item.rim} fill="none" style={RIM_STROKE} strokeWidth={1.8} strokeLinecap="round" opacity={0.9} />}
          </g>
          {!inline && use(item, { fill: 'none', stroke: line, strokeWidth: lw })}
        </Fragment>
      );
    });

    const body = (
      <>
        {unoutlined.length > 0 && !inline && (
          <defs>
            {unoutlined.map((part) => (
              <path key={pid(part)} id={pid(part)} d={compactPath(part.d)} />
            ))}
          </defs>
        )}
        {contour.some(Boolean) && (
          <g fill={LINE.sil} stroke={LINE.sil} strokeWidth={sil / scale}>
            {contour}
          </g>
        )}
        {fills}
        {group.children?.map((child, c) => renderGroup(child, `${key}-${c}`, scale))}
      </>
    );

    return (
      <RigGroup key={key} char={char} part={group.part} origin={group.origin}>
        {group.transform ? <g transform={group.transform}>{body}</g> : body}
      </RigGroup>
    );
  };

  return <>{groups.map((group, g) => renderGroup(group, `g${g}`))}</>;
};

export type SpriteSvgProps = {
  char: string;
  lod: Lod;
  state?: SpriteState;
  /** The way the figure is drawn, and the way it should look; a mismatch mirrors it */
  faces?: 'left' | 'right';
  facing?: 'left' | 'right';
  /** The visible box on the 200u canvas (the icon LOD crops to the head); x is mirrored with the figure */
  box?: readonly [number, number, number, number];
  /** Where the figure stands: the origin for whole-body motion (hop, lunge, squash) */
  ground?: Vec;
  /** Who walks (`rig--gait-*`): a toddler's crawl or the cat's diagonal gait; both use the two-frame flipbook */
  gait?: 'crawl' | 'cat';
  /** The pose or action being drawn, as `rig--pose-{pose}`: `rig.css` keys action animations on it */
  pose?: string;
  /** The KO is drawn as its own pose (lying down), so the generic KO slump must not tip it over */
  restPose?: boolean;
  /** Extra root classes (e.g. a tail mood) */
  className?: string;
  children: ReactNode;
};

/**
 * The root of an option D sprite: the 200u `<svg>` filling its box, the LOD for nested parts,
 * mirroring for `facing`, and the classes `rig.css` animates (`rig rig--{state}` on the root,
 * `rig-body` around the whole figure). Round line joins and the 1.2u line width are set once here
 * and inherited.
 */
export const SpriteSvg = ({ char, lod, state = 'idle', faces = 'right', facing = faces, box = [0, 0, CANVAS, CANVAS], ground = [100, 186], gait = 'crawl', pose, restPose = false, className, children }: SpriteSvgProps) => {
  const mirror = facing !== faces;
  const [x, y, w, h] = box;
  const viewX = mirror ? CANVAS - x - w : x;
  const classes = `h-full w-full rig rig--${state} rig--gait-${gait}${pose ? ` rig--pose-${pose}` : ''}${restPose ? ' rig--rest' : ''}${className ? ` ${className}` : ''}`;
  const frame = (k: number | null) => (
    <svg key={k ?? 0} viewBox={`${viewX} ${y} ${w} ${h}`} strokeLinejoin="round" strokeWidth={LINE_WIDTH} className={k === null ? classes : `${classes} rig--frame-${k}`} data-char={char} data-lod={lod} aria-hidden="true">
      <g transform={mirror ? `translate(${CANVAS} 0) scale(-1 1)` : undefined}>
        <g className="rig-body" style={{ transformOrigin: `${ground[0]}px ${ground[1]}px` }}>
          {children}
        </g>
      </g>
    </svg>
  );
  // The map LOD is a flipbook of two static key frames (rig.css "walk"): starting or stopping a
  // walk never re-renders the sprite. Other LODs walk only in the art lab, the same way.
  const frames = lod === 'map' || state === 'walk' ? 2 : 0;
  return (
    <LodContext.Provider value={lod}>
      {frames ? (
        <span className={`rig-flip${state === 'walk' ? ' rig-flip--on' : ''}`} data-char={char}>
          {Array.from({ length: frames }, (_, k) => frame(k))}
        </span>
      ) : (
        frame(null)
      )}
    </LodContext.Provider>
  );
};

/** The skeleton overlay of § 2.1 step 5 (art lab only): bones as lines, joints as rings. */
export const SkeletonOverlay = <J extends string>({ joints, bones }: { joints: Skeleton<J>; bones: Bones<J> }) => (
  <g data-skeleton="" opacity={0.9}>
    {bones.map(([a, b]) => (
      <line key={`${a}-${b}`} x1={joints[a][0]} y1={joints[a][1]} x2={joints[b][0]} y2={joints[b][1]} stroke={DEV.bone} strokeWidth={1.4} strokeLinecap="round" />
    ))}
    {(Object.keys(joints) as J[]).map((name) => (
      <circle key={name} cx={joints[name][0]} cy={joints[name][1]} r={2.2} fill={DEV.joint} stroke={DEV.bone} strokeWidth={1.2} />
    ))}
  </g>
);
