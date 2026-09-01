/**
 * 手機橫向時蓋住畫面，請使用者把手機豎起來（spec §8）。
 * 純 CSS 條件：橫向且高度不足才出現，桌機寬視窗不會誤觸發。
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
