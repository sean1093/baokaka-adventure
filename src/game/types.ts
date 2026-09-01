/**
 * 關卡資料契約。
 *
 * 座標系統（spec §6）：場景容器固定 3:4 直向。
 *   x, y  熱區「中心」，x 相對容器寬、y 相對容器高，皆 0..1
 *   r     熱區半邊長，相對容器寬（正方形，寬高相等，用 aspect-ratio 維持）
 * 因為容器 height = width × 4/3，垂直方向佔容器高的比例是 r × 3/4。
 */

export type SpriteName =
  // 目標物件（18 個尋物點）
  | 'bottle'
  | 'sock'
  | 'clothBook'
  | 'bucket'
  | 'spade'
  | 'dandelion'
  | 'ball'
  | 'sunHat'
  | 'cookie'
  | 'banana'
  | 'driedFish'
  | 'coinPurse'
  | 'shell'
  | 'flask'
  | 'toyBoat'
  | 'comfortDoll'
  | 'nightLight'
  // 角色
  | 'mochaCat'
  | 'baokaka'
  // 客廳
  | 'sofa'
  | 'coffeeTable'
  | 'floorLamp'
  | 'pottedPlant'
  | 'wallClock'
  | 'rug'
  // 睡前
  | 'bed'
  | 'moonWindow'
  | 'star'
  | 'blanket'
  | 'pillow'
  | 'slipper'
  // 院子
  | 'tree'
  | 'fence'
  | 'flowerPot'
  | 'wateringCan'
  | 'butterfly'
  | 'stone'
  // 公園
  | 'bench'
  | 'slide'
  | 'cloud'
  | 'kite'
  | 'bird'
  // 市場
  | 'crate'
  | 'fishStall'
  | 'lantern'
  | 'awning'
  | 'scale'
  | 'apple'
  // 海邊
  | 'sunDisc'
  | 'wave'
  | 'sandcastle'
  | 'beachUmbrella'
  | 'starfish'
  | 'seagull';

export type Placement = {
  sprite: SpriteName;
  x: number;
  y: number;
  r: number;
  /** 水平翻轉，讓同一個 sprite 重複出現時不會太呆板 */
  flip?: boolean;
};

/** 可點擊的尋物目標。 */
export type Target = Placement & {
  /** 關卡內唯一 */
  id: string;
  /** 顯示名稱，例如「奶瓶」 */
  name: string;
};

export type PaletteName = 'living' | 'yard' | 'park' | 'market' | 'beach' | 'night';

export type Level = {
  /** 1 起算，連續 */
  id: number;
  /** 「摩卡貓躲在客廳」 */
  title: string;
  palette: PaletteName;
  /** 背景裝飾，不可點擊，畫在目標下層 */
  decor: Placement[];
  /** 固定 3 個 */
  targets: Target[];
  /** 過關後的繪本頁文字 */
  story: string;
};

export type Progress = {
  /** 目前最高可進入的關卡 id，預設 1 */
  unlockedLevel: number;
  /** 已完成的關卡 id，升冪、不重複 */
  completed: number[];
  sound: boolean;
};
