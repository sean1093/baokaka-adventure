import type { ReactElement } from 'react';
import type { PaletteName } from './types';
import { C } from './palette';

/** The scene box is always 3:4, so a 300x400 viewBox maps straight onto the layout. */
const Bands = ({ sky, ground, split }: { sky: string; ground: string; split: number }) => (
  <>
    <rect x={0} y={0} width={300} height={split} fill={sky} />
    <rect x={0} y={split} width={300} height={400 - split} fill={ground} />
    <rect x={0} y={split - 3} width={300} height={3} fill={C.ink} opacity={0.15} />
  </>
);

/** Crops rather than letterboxes when a screen uses a box that is not 3:4 (the quest battle box is square). */
const Frame = ({ children }: { children: ReactElement }) => (
  <svg
    viewBox="0 0 300 400"
    preserveAspectRatio="xMidYMid slice"
    className="absolute inset-0 h-full w-full"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const BACKDROPS: Record<PaletteName, () => ReactElement> = {
  living: () => (
    <Frame>
      <>
        <Bands sky={C.paper} ground={C.sandDeep} split={270} />
        <rect x={0} y={270} width={300} height={14} fill={C.sand} />
      </>
    </Frame>
  ),
  yard: () => (
    <Frame>
      <>
        <Bands sky={C.sky} ground={C.leaf} split={190} />
        <ellipse cx={150} cy={210} rx={190} ry={28} fill={C.leafDeep} opacity={0.35} />
      </>
    </Frame>
  ),
  park: () => (
    <Frame>
      <>
        <Bands sky={C.sky} ground={C.leaf} split={230} />
        <ellipse cx={150} cy={370} rx={210} ry={70} fill={C.sand} opacity={0.75} />
      </>
    </Frame>
  ),
  market: () => (
    <Frame>
      <>
        <Bands sky={C.paper} ground={C.sandDeep} split={250} />
        <ellipse cx={150} cy={330} rx={200} ry={60} fill={C.sand} opacity={0.5} />
      </>
    </Frame>
  ),
  beach: () => (
    <Frame>
      <>
        <Bands sky={C.sky} ground={C.sand} split={160} />
        <rect x={0} y={160} width={300} height={90} fill={C.skyDeep} />
        <ellipse cx={150} cy={250} rx={200} ry={16} fill={C.white} opacity={0.65} />
      </>
    </Frame>
  ),
  night: () => (
    <Frame>
      <>
        <Bands sky={C.skyDeep} ground={C.mochaDeep} split={300} />
        <rect x={0} y={0} width={300} height={300} fill={C.ink} opacity={0.25} />
      </>
    </Frame>
  ),
};

const WORLD_BANDS: Record<PaletteName, { sky: string; ground: string; sea?: string; dusk?: boolean }> = {
  living: { sky: C.paper, ground: C.sandDeep },
  yard: { sky: C.sky, ground: C.leaf },
  park: { sky: C.sky, ground: C.leaf },
  market: { sky: C.paper, ground: C.sandDeep },
  beach: { sky: C.sky, ground: C.sand, sea: C.skyDeep },
  night: { sky: C.skyDeep, ground: C.mochaDeep, dusk: true },
};

/** Where the ground band starts on the chapter map, as a fraction of the scene height */
export const WORLD_HORIZON = 0.62;

/**
 * The chapter map is a side-scroller: sky and ground are plain horizontal bands that never
 * scroll (only decor and characters do), so any aspect ratio keeps a straight horizon.
 */
export const WorldBackdrop = ({ palette }: { palette: PaletteName }) => {
  const bands = WORLD_BANDS[palette];
  const horizon = `${WORLD_HORIZON * 100}%`;
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-x-0 top-0" style={{ height: horizon, background: bands.sky }} />
      {bands.sea && (
        <div className="absolute inset-x-0" style={{ top: '44%', height: '18%', background: bands.sea }} />
      )}
      <div className="absolute inset-x-0 bottom-0" style={{ top: horizon, background: bands.ground }} />
      <div className="absolute inset-x-0" style={{ top: horizon, height: 3, background: C.ink, opacity: 0.15 }} />
      {bands.dusk && <div className="absolute inset-x-0 top-0" style={{ height: horizon, background: C.ink, opacity: 0.25 }} />}
    </div>
  );
};
