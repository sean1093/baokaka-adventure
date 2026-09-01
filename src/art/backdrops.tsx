import type { ReactElement } from 'react';
import type { PaletteName } from '../game/types';
import { C } from './palette';

/** The scene box is always 3:4, so a 300x400 viewBox maps straight onto the layout. */
const Bands = ({ sky, ground, split }: { sky: string; ground: string; split: number }) => (
  <>
    <rect x={0} y={0} width={300} height={split} fill={sky} />
    <rect x={0} y={split} width={300} height={400 - split} fill={ground} />
    <rect x={0} y={split - 3} width={300} height={3} fill={C.ink} opacity={0.15} />
  </>
);

const Frame = ({ children }: { children: ReactElement }) => (
  <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
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
