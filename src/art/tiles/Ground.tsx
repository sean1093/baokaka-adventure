import { memo, useMemo } from 'react';
import type { GameMap } from '../../quest/engine/types';
import { gradeTiles } from '../palette';
import { useSvgIds } from '../useSvgIds';
import { buildGround } from './ground';
import { DIAMOND, LIT_EDGE, TILE_MATERIALS, tileMarks } from './terrain';

type Props = {
  map: GameMap;
  /** The map's clock (`mapClock(map)`): picks the graded colours */
  time: string;
};

/**
 * A map's whole ground as **one SVG** (art direction § 4.4 *Tile rules*, § 8.4, § 8.5): a
 * `<symbol>` per material variant used, one `<use>` per tile, kerbs, banks, merged wall runs,
 * fence railings and the diorama skirt. Colours are the map clock's pre-baked grade
 * (`gradeTiles`), never a filter.
 *
 * Memoised on the map and its time, so walking (which re-renders the world every frame) never
 * touches it. It sits at its world box (`buildGround().box`) inside the camera layer.
 */
const GroundSvg = ({ map, time }: Props) => {
  const id = useSvgIds('ground');
  const geometry = useMemo(() => buildGround(map), [map]);
  const { tiles: tones, structure } = gradeTiles(time);
  const { box } = geometry;
  const symbolId = (material: string, variant: number) => id(`${material}-${variant}`);

  return (
    <svg
      aria-hidden="true"
      data-ground={map.id}
      className="pointer-events-none absolute"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      width={box.w}
      height={box.h}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
    >
      <defs>
        {geometry.symbols.map(({ material, variant }) => {
          const spec = TILE_MATERIALS[material];
          const ramp = tones[spec.ramp];
          return (
            <symbol key={`${material}-${variant}`} id={symbolId(material, variant)} overflow="visible">
              <path d={DIAMOND} fill={variant >= 3 ? ramp.alt : ramp.base} />
              {tileMarks(spec.pattern, variant % 3, variant).map((mark, index) =>
                mark.stroke ? (
                  <path key={index} d={mark.d} fill="none" stroke={ramp[mark.tone]} strokeWidth={mark.stroke} strokeLinecap="round" opacity={mark.opacity} />
                ) : (
                  <path key={index} d={mark.d} fill={ramp[mark.tone]} opacity={mark.opacity} />
                ),
              )}
              {!spec.seamless && <path d={LIT_EDGE} fill="none" stroke={ramp.lit} strokeWidth={0.9} opacity={0.38} />}
            </symbol>
          );
        })}
      </defs>

      {/* The diorama skirt: two shaded faces, a darker lower band, each material's strata, the lit rim */}
      <path d={geometry.skirt.left} fill={structure.skirtLeftTop} />
      <path d={geometry.skirt.right} fill={structure.skirtRightTop} />
      <path d={geometry.skirt.leftLow} fill={structure.skirtLeftBottom} />
      <path d={geometry.skirt.rightLow} fill={structure.skirtRightBottom} />
      {geometry.skirt.strata.map(({ tone, d }) => (
        <path key={tone} d={d} fill={tone === 'structure' ? structure.wallBase : tones[TILE_MATERIALS[tone].ramp].deep} />
      ))}
      <path d={geometry.skirt.line} fill="none" stroke={structure.skirtLine} strokeWidth={1} opacity={0.6} />

      {geometry.tiles.map((tile) => (
        <use key={tile.key} href={`#${symbolId(tile.material, tile.variant)}`} x={tile.x} y={tile.y} />
      ))}

      {geometry.banks.map(({ material, d }) => (
        <path key={material} d={d} fill={tones[TILE_MATERIALS[material].ramp].line} opacity={0.55} />
      ))}
      {geometry.kerbs.map(({ material, lit, shade }) => (
        <g key={material} fill="none" strokeLinecap="round">
          <path d={shade} stroke={structure.shadow} strokeWidth={1.6} opacity={0.4} />
          <path d={lit} stroke={tones[TILE_MATERIALS[material].ramp].lit} strokeWidth={1.1} opacity={0.75} />
        </g>
      ))}
      <path d={geometry.skirt.rim} fill="none" stroke={structure.skirtRim} strokeWidth={1.2} opacity={0.5} />

      {geometry.walls.map((group) => (
        <g key={group.kind}>
          <path d={group.left} fill={structure.wallLeft} />
          <path d={group.right} fill={structure.wallRight} />
          {group.base && <path d={group.base} fill={structure.wallBase} />}
          {group.trim && <path d={group.trim} fill="none" stroke={structure.wallTrim} strokeWidth={1.2} opacity={0.8} />}
          <path d={group.top} fill={structure.wallTop} />
          <path d={group.lit} fill="none" stroke={structure.wallTopLit} strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        </g>
      ))}

      {geometry.fence.posts && (
        <g>
          <path d={geometry.fence.rails} fill="none" stroke={structure.fenceRail} strokeWidth={2.2} strokeLinecap="round" />
          <path d={geometry.fence.railsLit} fill="none" stroke={structure.fenceLit} strokeWidth={0.8} strokeLinecap="round" opacity={0.7} />
          <path d={geometry.fence.posts} fill={structure.fencePost} />
          <path d={geometry.fence.caps} fill={structure.fenceLit} opacity={0.85} />
        </g>
      )}
    </svg>
  );
};

export const Ground = memo(GroundSvg, (a, b) => a.map === b.map && a.time === b.time);
