/**
 * Covers the screen in landscape and asks the player to turn the phone upright (spec §8).
 * Pure CSS: it needs landscape AND a short viewport, so a wide desktop window never triggers it.
 */
export const OrientationGuard = () => (
  <div className="fixed inset-0 z-50 hidden place-items-center bg-cream p-8 text-center [@media(orientation:landscape)_and_(max-height:520px)]:grid">
    <p className="text-title font-bold leading-relaxed">
      請把手機豎起來
      <br />
      再繼續玩喔
    </p>
  </div>
);
