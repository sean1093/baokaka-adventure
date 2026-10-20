import { POPUP as C } from '../../../art/palette';
import './tapMark.css';

/**
 * The "tap to go on" mark (#183, the AI playtest: the chapter card and the word card waited for a
 * tap with nothing saying so): a small ink disc with a chalk ▼, bobbing slowly once the card's
 * entrance has played (still under reduced motion and in a screenshot still). Decoration, not a
 * touchable: no marigold, and it takes no pointer events (the whole card is the tap).
 */
export function TapMark({ size = 30, delay = 0, x, y }: { size?: number; delay?: number; x?: number; y?: number }) {
  const r = size / 2;
  const inner = (
    <g className="tm-bob" style={{ animationDelay: `${delay}ms` }} data-tap-mark="">
      <circle r={r} fill={C.ink} opacity={0.82} />
      <path d={`M${-r * 0.42} ${-r * 0.2}H${r * 0.42}L0 ${r * 0.38}Z`} fill={C.chalk} stroke={C.chalk} strokeWidth={size * 0.06} strokeLinejoin="round" />
    </g>
  );
  // Inside an SVG at (x, y), or as its own little SVG in HTML
  if (x !== undefined && y !== undefined) return <g transform={`translate(${x} ${y})`} pointerEvents="none">{inner}</g>;
  return (
    <svg width={size + 4} height={size + 8} viewBox={`${-r - 2} ${-r - 4} ${size + 4} ${size + 8}`} className="block overflow-visible" style={{ pointerEvents: 'none' }} aria-hidden="true">
      {inner}
    </svg>
  );
}
