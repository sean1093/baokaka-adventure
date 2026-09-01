import type { Level, Target } from './types';

/** 觸控下限：r ≥ 0.09，在 375px 寬的螢幕上邊長 ≈ 67px（spec §6 驗證規則 4） */
export const MIN_RADIUS = 0.09;

/** 場景容器固定 3:4，height = width × 4/3。垂直距離要換算成寬度比例才能和 r 比較。 */
const HEIGHT_TO_WIDTH = 4 / 3;
/** 反過來：r 是寬度比例，換算成高度比例是 r × 3/4。 */
const WIDTH_TO_HEIGHT = 3 / 4;

const isPlaced = (t: Target) => [t.x, t.y, t.r].every(Number.isFinite);

export function validateLevel(level: Level): string[] {
  const errors: string[] = [];
  const { targets } = level;

  if (targets.length !== 3) {
    errors.push(`目標必須剛好 3 個，實際 ${targets.length} 個`);
  }

  const seen = new Set<string>();
  for (const t of targets) {
    if (seen.has(t.id)) errors.push(`目標 id 重複：${t.id}`);
    seen.add(t.id);

    if (!isPlaced(t)) {
      errors.push(`目標 ${t.id} 的座標必須是有限數字`);
      continue;
    }
    if (t.r < MIN_RADIUS) {
      errors.push(`目標 ${t.id} 的熱區 r=${t.r} 小於觸控下限 ${MIN_RADIUS}`);
    }
    const halfHeight = t.r * WIDTH_TO_HEIGHT;
    if (t.x - t.r < 0 || t.x + t.r > 1 || t.y - halfHeight < 0 || t.y + halfHeight > 1) {
      errors.push(`目標 ${t.id} 超出畫面`);
    }
  }

  for (let i = 0; i < targets.length; i += 1) {
    for (let j = i + 1; j < targets.length; j += 1) {
      const a = targets[i];
      const b = targets[j];
      if (!isPlaced(a) || !isPlaced(b)) continue;
      const gapX = Math.abs(a.x - b.x);
      const gapY = Math.abs(a.y - b.y) * HEIGHT_TO_WIDTH;
      if (Math.max(gapX, gapY) < a.r + b.r) {
        errors.push(`目標 ${a.id} 與 ${b.id} 的熱區重疊`);
      }
    }
  }

  return errors;
}

export function validateLevels(levels: Level[]): string[] {
  const errors: string[] = [];
  levels.forEach((level, index) => {
    if (level.id !== index + 1) {
      errors.push(`關卡 id 必須從 1 開始連續遞增：第 ${index + 1} 個關卡的 id 是 ${level.id}`);
    }
    errors.push(...validateLevel(level).map((error) => `第 ${level.id} 關：${error}`));
  });
  return errors;
}
