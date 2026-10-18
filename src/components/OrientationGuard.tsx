import { Panel } from './Panel';

/**
 * Covers the screen in landscape and asks the player to turn the phone upright.
 * Pure CSS: it needs landscape AND a short viewport, so a wide desktop window never triggers it.
 */
export const OrientationGuard = () => (
  <div className="fixed inset-0 z-[60] hidden place-items-center bg-panel-deep p-8 text-center [@media(orientation:landscape)_and_(max-height:520px)]:grid">
    <Panel diamonds className="px-8 py-6">
      <p className="relative font-serif text-heading leading-relaxed tracking-[0.1em]">
        請把手機豎起來
        <br />
        再繼續玩喔
      </p>
    </Panel>
  </div>
);
