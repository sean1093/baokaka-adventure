import type { CSSProperties, ReactNode } from 'react';
import { BACKDROPS } from './backdrops';
import { SPRITES } from './sprites';
import type { PaletteName, Placement } from './types';

/**
 * Inline style that centres a placement in its scene box (art/types.ts coordinate system).
 * x/y are the centre, so translate(-50%, -50%) is mandatory; width follows the box width and
 * aspect-ratio keeps the square square (a percentage height would resolve against box height).
 */
export const placementStyle = ({ x, y, r, flip }: Placement): CSSProperties => ({
  left: `${x * 100}%`,
  top: `${y * 100}%`,
  width: `${r * 200}%`,
  aspectRatio: '1',
  transform: `translate(-50%, -50%)${flip ? ' scaleX(-1)' : ''}`,
});

type Props = {
  palette: PaletteName;
  /** Background decor: never tappable, drawn below the children */
  decor: Placement[];
  /** Defaults to the 3:4 portrait box; the backdrop crops (never letterboxes) for other ratios */
  aspectRatio?: string;
  className?: string;
  children?: ReactNode;
};

/** A backdrop plus decor sprites. Interactive layers go in children so they paint on top. */
export const Scene = ({ palette, decor, aspectRatio = '3 / 4', className = '', children }: Props) => {
  const Backdrop = BACKDROPS[palette];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      <Backdrop />
      {decor.map((placement, index) => {
        const Art = SPRITES[placement.sprite];
        return (
          <span
            key={`${placement.sprite}-${index}`}
            aria-hidden="true"
            className="pointer-events-none absolute block"
            style={placementStyle(placement)}
          >
            <Art />
          </span>
        );
      })}
      {children}
    </div>
  );
};
