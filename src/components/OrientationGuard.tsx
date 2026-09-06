/**
 * Covers the screen in landscape and asks the player to turn the phone upright.
 * Pure CSS: it needs landscape AND a short viewport, so a wide desktop window never triggers it.
 */
export const OrientationGuard = () => (
  <div className="fixed inset-0 z-[60] hidden place-items-center bg-bg p-8 text-center [@media(orientation:landscape)_and_(max-height:520px)]:grid">
    <div className="rounded-4xl bg-surface px-8 py-6 shadow-card">
      <p className="text-headline font-extrabold leading-relaxed">
        請把手機豎起來
        <br />
        再繼續玩喔
      </p>
    </div>
  </div>
);
