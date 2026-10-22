import { POPUP as C } from '../../../art/palette';
import { UI } from '../../content';
import { CREAM_CARD } from './paper';

/**
 * The orientation guard (#136; GDD R4 "reachable in portrait"; bible § 7): the book is laid out for
 * a phone held upright, so a phone turned sideways (landscape and short: never a desktop window)
 * gets a cream card on the cover asking to turn it back, over the whole game until it is. The game
 * underneath keeps its place (a page's clock is not touched: a held finger is what pauses it, and
 * waiting is always safe, R3). Pure CSS, so it costs nothing while upright. The phone icon says it
 * without reading (R5).
 */
export function UprightGuard() {
  return (
    <div
      className="fixed inset-0 z-[80] hidden place-items-center p-6 font-body [@media(orientation:landscape)_and_(max-height:520px)]:grid"
      style={{ backgroundColor: C.cover }}
      role="alert"
      data-upright-guard=""
      lang="zh-Hant"
    >
      <div className="flex items-center gap-4 rounded-[10px] px-6 py-4" style={CREAM_CARD}>
        <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          {/* The phone on its side, an arrow turning it upright, the phone upright */}
          <rect x={4} y={30} width={30} height={18} rx={3} fill="none" stroke={C.inkSoft} strokeWidth={3} strokeDasharray="4 3" />
          <rect x={36} y={10} width={20} height={34} rx={3.5} fill={C.marigold} stroke={C.ink} strokeWidth={3} />
          <circle cx={46} cy={39} r={2} fill={C.ink} />
          <path d="M12 24 C 14 12, 24 6, 32 8" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
          <path d="M28 3 L33 8 L27 12" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="font-serif text-[24px] font-black leading-snug" style={{ color: C.ink }}>
          {UI.upright}
        </p>
      </div>
    </div>
  );
}
