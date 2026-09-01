# 寶咖咖與摩卡貓的冒險 — 設計文件

**日期**：2026-09-01
**狀態**：已核准，待撰寫實作計畫

## 1. 目標

一個給長輩在手機瀏覽器上輕鬆玩的小型網頁遊戲。主題是一歲小孩「寶咖咖」與夥伴「摩卡貓」的冒險。

**成功標準**：一位沒有玩過手機遊戲的長輩，收到 LINE 連結後點開，**不需要任何人在旁邊教**，就能自己完成第一關。

### 使用情境

先做給自家長輩玩（對象具體、人數少），但關卡資料與程式分離，日後要公開給任何人玩不需改程式。

### 非目標

- 沒有帳號、沒有登入、沒有後端
- 沒有排行榜、沒有分享機制、沒有多人
- 沒有計時、沒有分數、沒有失敗狀態
- 只支援直向；不做橫向版面
- 只有繁體中文
- 不做 Service Worker／離線快取（會帶來版本失效問題，價值不成比例）

## 2. 玩法類型與選擇理由

**採用：尋物點點看（hidden object），外層用「地圖前進 + 繪本頁」包裝進度。**

一關 = 一張場景圖，玩家找出摩卡貓藏起來的 3 樣東西 → 翻一頁劇情 → 地圖前進一格。

長輩 + 手機的硬約束決定了類型：不能有計時、不能要求拖曳或滑動精度、不能有失敗懲罰、規則要一眼看懂。據此評估：

| 類型 | 判定 | 理由 |
|---|---|---|
| 尋物點點看 | **採用** | 只需單擊、節奏完全由玩家控制、難度可用熱區大小調整；實作只需靜態圖 + 熱區座標，沒有遊戲迴圈 |
| 擲骰前進式冒險 | 部分採用 | 「地圖前進一格」的進度感借用此模式 |
| 互動繪本 | 部分採用 | 過關後的劇情頁採用此形式；單獨使用則幾乎沒有遊戲性 |
| 記憶翻牌配對 | 未採用 | 記憶負荷正是此受眾的弱項，容易變成認知測驗 |
| 三消 | 未採用 | 需要滑動精度、連鎖概念、通常帶計時；實作成本最高而主題契合度最低 |
| 反應類、養成拖拉類 | 未採用 | 反應時間與精細動作正是弱項 |

## 3. 技術路線

**Vite + React + TypeScript + Tailwind CSS，零額外執行期依賴。**

與既有個人專案技術棧一致（`LittleSteps`、`StillOpen`、`AlgoVisuals`）。刻意不加：router（畫面切換用狀態機）、狀態管理套件（`useReducer` 足夠）、遊戲引擎（點擊熱區不需要 Phaser）、動畫套件（CSS transition 足夠）。

否決加入 Firebase 後端：跨裝置進度需要匿名 ID 或登入，損害「LINE 點連結就能玩」這個最重要的前提。日後真的需要，資料層不必重寫。

## 4. 畫面流與狀態機

五個畫面狀態，單頁應用：

```
title  --開始冒險-->        map
map    --選關(n)-->         scene(n)
scene(n) --3 個都找到-->     story(n)        （找齊後 1.2 秒自動進入，不要求再點一次）
story(n) --繼續-->          map             （n 不是最後一關）
story(last) --繼續-->       ending
ending --再玩一次-->        map
```

狀態轉移集中在 `App.tsx` 的 `useReducer`。畫面元件不自行改變遊戲狀態，只發 action。

各畫面的職責：

- `title` — 遊戲名稱、寶咖咖與摩卡貓的角色介紹、一顆「開始冒險」大按鈕。角色介紹頁不是獨立狀態，就放在這裡
- `map` — 六個關卡的大按鈕縱向排列。已解鎖的可點；未解鎖的顯示為灰階且 `disabled`（不彈任何錯誤訊息）；已完成的角落有打勾標記。捲動用瀏覽器原生捲動，不自製
- `ending` — 全家頁 + 「再玩一次」按鈕（回 `map`，不清除進度）

## 5. 檔案結構

```
baokaka-adventure/
  index.html
  vite.config.ts
  tailwind.config.js               # 長輩 UI 規則（字級、觸控尺寸、色票）集中在這裡
  assets/og.svg                    # OG 圖原始檔，用 qlmanage 轉 PNG
  public/
    manifest.webmanifest
    icons/icon.svg, icon-512.png, apple-touch-icon.png, og.png
  src/
    main.tsx
    App.tsx                        # 狀態機與畫面切換
    index.css                      # 全域長輩規則 + 三組動畫 keyframes
    game/
      types.ts                     # SpriteName / Placement / Target / Level / Progress
      levels.ts                    # 六關的關卡資料（TS 常數，不是 JSON）
      validate.ts                  # 純函式驗證規則
      progress.ts                  # localStorage 存取、容錯、completeLevel
      reducer.ts                   # 遊戲狀態機
      audio.ts                     # WebAudio 合成音效與 iOS 解鎖
    art/
      palette.ts                   # 唯一色票來源
      sprite.ts                    # Sprite 型別與六條作圖規約
      backdrops.tsx                # 六種場景的背景色帶
      sprites/                     # 54 個扁平向量 sprite，依場景分檔
        index.ts                   # Record<SpriteName, Sprite> 註冊表
        targets.tsx  characters.tsx  living.tsx  night.tsx
        yard.tsx     park.tsx        market.tsx  beach.tsx
    screens/
      TitleScreen.tsx  MapScreen.tsx  SceneScreen.tsx
      StoryScreen.tsx  EndingScreen.tsx
    components/
      BigButton.tsx                # 統一 ≥64px 觸控目標
      FoundTray.tsx                # 底部「找到 3 樣」格子
      OrientationGuard.tsx         # 橫向時的提示
  .github/workflows/deploy.yml
  docs/superpowers/specs/
```

## 6. 關卡資料契約

```ts
type Placement = {
  sprite: SpriteName;  // 對應 art/sprites 註冊表的一個圖案
  x: number;           // 0..1，相對場景容器寬度
  y: number;           // 0..1，相對場景容器高度
  r: number;           // 方形熱區半邊長，相對場景容器寬度
  flip?: boolean;      // 水平翻轉，同一個 sprite 重複出現時不會太呆板
};

type Target = Placement & {
  id: string;          // 關卡內唯一
  name: string;        // 顯示名稱，例如「奶瓶」
};

type Level = {
  id: number;              // 1 起算，連續
  title: string;           // 「摩卡貓躲在客廳」
  palette: PaletteName;    // 決定背景色帶
  decor: Placement[];      // 背景裝飾，不可點擊，畫在目標下層
  targets: Target[];       // 固定 3 個
  story: string;           // 過關後的繪本頁文字
};
```

`SpriteName` 是一個字串聯集，註冊表型別是 `Record<SpriteName, Sprite>`，所以關卡資料引用了不存在的圖案、或畫了沒人用的圖案，都會在編譯期爆掉。

### 座標系統

**場景固定 3:4 直向。** 容器用 `aspect-ratio: 3 / 4; position: relative`，sprite 以百分比絕對定位，**不需要任何 JavaScript 量測**。

`x`／`y` 是**中心**不是左上角，所以必須配 `translate(-50%, -50%)`。`r` 以容器寬度為基準；方框要保持正方就必須用 `aspect-ratio: 1` 讓高度跟隨寬度，不能寫 `height: %`（CSS 的 `height: %` 會解析成容器高度，方框會被壓扁）：

```css
left: calc(x * 100%);
top: calc(y * 100%);
width: calc(2r * 100%);   /* 相對容器寬度 */
aspect-ratio: 1;          /* 高度跟隨寬度 */
transform: translate(-50%, -50%);
```

對應地，熱區在垂直方向佔容器高度的比例是 `r × 3/4`（因為容器 height = width × 4/3）。反過來，一段垂直距離 `dy`（高度比例）換算成寬度比例是 `dy × 4/3`。這兩個換算是驗證規則 5 與 6 的來源。

### 驗證規則

`validate.ts` 是純函式，回傳錯誤清單。開發模式下 `App.tsx` 在模組載入時直接 throw；`levels.test.ts` 對實際關卡資料跑同一份規則，內容錯誤在 CI 就爆掉。

1. `targets.length === 3`
2. 每個 target 的 `id` 在關卡內唯一
3. `x`、`y`、`r` 必須是有限數字（`NaN` 會讓後面所有幾何比較無聲通過）
4. `r ≥ 0.09` — 在 375px 寬的螢幕上邊長 ≈ 67px，滿足觸控下限
5. 熱區不重疊：`max(|dx|, |dy| × 4/3) ≥ r_i + r_j`（方形熱區用 Chebyshev 距離，避免一次點擊同時命中兩個目標）
6. 熱區完整落在畫面內：`x - r ≥ 0`、`x + r ≤ 1`、`y - r×3/4 ≥ 0`、`y + r×3/4 ≤ 1`。這條同時涵蓋了「座標必須在 0..1」
7. `level.id` 從 1 開始連續遞增

原本規劃的 `?edit=1` 標點工具**沒有實作，也不需要**：場景由 sprite 組成，熱區座標就是 sprite 的擺放座標，同一份資料，不存在「圖畫好了再去標座標」這個步驟，也就沒有座標漂移的問題。

## 7. 尋物互動細節

- 熱區用透明的 `<button>`（不是 `<div>`），取得原生點擊回饋、鍵盤可及性與 `aria-label`
- **點中目標**：原地出現打勾動畫，該物件圖示飛入底部「找到 3 樣」格子，播放 `found` 音效
- **點到空白**：全畫面極輕微的漣漪回饋。不出現任何「錯誤」字眼，不扣分，不計次數
- **提示**：連續 15 秒沒有成功找到東西，未找到的目標中（依陣列順序取第一個）浮現柔和的呼吸光圈；再過 15 秒光圈變明顯。任何一次成功找到都重置計時器。`document.hidden` 時暫停計時
- **不需要提示按鈕**——不能假設長輩知道要去按提示
- **找齊 3 個**：立即寫入進度，1.2 秒後自動進入劇情頁

## 8. 長輩 UI 規則

這些是全域規則，寫在 Tailwind 設定與共用元件裡，不由各元件自行決定：

- 最小字級 20px；主要文字 24px；行高 1.6
- 所有可點元素 ≥ 64×64px，彼此間距 ≥ 16px（防誤觸）
- 文字對比 ≥ 4.5:1；禁止淺灰字配淺色底
- **只有單擊**：不使用滑動、拖曳、長按、雙擊、pinch
- 直向鎖定：`OrientationGuard` 在橫向時蓋一層「請把手機豎起來」的提示
- 音效預設開啟，但遊戲**不依賴聲音**（全靜音也能完整通關）。開關放右上角，用文字「聲音 開／關」而不是喇叭圖示，尺寸同樣 ≥64px
- 不設計 hover 狀態
- 按鈕文字用動詞短句（「開始冒險」、「繼續」），不用圖示代替文字

### 音效

三個音效（點空白、找到、全找齊）用 **WebAudio 直接合成**，不載入任何 mp3：都是簡單音階，合成只要幾行程式，省掉二進位素材與載入等待，行動網路不穩也還有聲音。「找到」是往上兩個音，「全找齊」是往上四個音，「點空白」是一下低而輕的觸感回饋——絕對不能聽起來像錯誤音。

iOS Safari 要求使用者手勢後才能播放音訊，所以在標題畫面「開始冒險」按鈕的點擊裡建立並 resume `AudioContext`。

## 9. 進度儲存

```ts
type Progress = {
  unlockedLevel: number;   // 目前最高可進入的關卡 id；預設 1
  completed: number[];     // 已完成的關卡 id，升冪、不重複
  sound: boolean;          // 預設 true
};
// localStorage key: 'baokaka.progress'
```

完成第 n 關時：`completed` 加入 n（已存在則不重複加），`unlockedLevel = max(unlockedLevel, min(n + 1, 最後一關 id))`。重玩已完成的關卡不會讓進度倒退。

- 每次過關立即寫入
- 讀取時若 JSON 損壞或欄位型別不符，回傳預設進度，不噴錯、不清空使用者其他資料
- 寫入失敗（隱私瀏覽、配額不足）退回記憶體狀態，遊戲繼續可玩
- **主畫面不放「重新開始」按鈕**，避免長輩誤觸清掉進度。重玩單關的方式是從地圖點選已完成的關卡

## 10. 第一版內容

6 關，每關 3 個目標，共 18 個尋物點。加開頭角色介紹與結尾全家頁。

| # | 場景 | 標題 | 3 個目標 | 劇情頁大意 |
|---|---|---|---|---|
| 1 | 客廳 | 摩卡貓躲在客廳 | 奶瓶、小襪子、布繪本 | 寶咖咖睡醒發現東西不見了，摩卡貓在沙發後面偷笑 |
| 2 | 院子 | 院子裡的秘密 | 小水桶、紅色小鏟子、蒲公英 | 兩個人在院子挖土，摩卡貓把蒲公英吹得滿天飛 |
| 3 | 公園 | 公園的下午 | 皮球、遮陽帽、小餅乾 | 皮球滾進草叢，摩卡貓第一個衝過去撲住 |
| 4 | 市場 | 熱鬧的市場 | 香蕉、小魚乾、零錢包 | 摩卡貓盯著小魚乾不肯走，寶咖咖幫牠買了一包 |
| 5 | 海邊 | 第一次看海 | 貝殼、小水壺、玩具船 | 浪打到腳，寶咖咖嚇一跳，摩卡貓躲到帽子後面 |
| 6 | 睡前 | 晚安，摩卡貓 | 安撫娃娃、小夜燈、摩卡貓 | 找到最後一樣東西是摩卡貓自己，兩個人一起睡著 |

## 11. 美術素材

**場景不是點陣圖，是由 54 個手寫的扁平向量 sprite 組成的。**

原本規劃 AI 生成插畫，實作時改掉了，理由有三個，而且改完比原案更好：

1. **座標與圖案同一份資料**。sprite 用擺放座標定位，熱區座標就是擺放座標，不可能對不上；點陣圖方案得先出圖、再標熱區，兩份資料會漂移。
2. **風格強制一致**。所有 sprite 共用 `palette.ts` 的色票與 `sprite.ts` 的六條規約（固定 `viewBox="0 0 100 100"`、平塗色塊、`C.ink` 4px 描邊、只用色票顏色），不會出現「第 3 關的貓跟第 5 關的貓長得不一樣」。
3. **對長輩更好讀**。大色塊 + 粗描邊 + 高對比，比寫實插畫更容易辨認，而且整包 gzip 後只有 58KB，行動網路秒開。

作圖規約（`src/art/sprite.ts` 是唯一權威，這裡是摘要）：

- 根節點固定 `<svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">`
- 主體撐到 viewBox 的 80% 以上且不可超出 0..100
- 平塗色塊 + `stroke={C.ink} strokeWidth={4} strokeLinejoin="round"`
- 只用 `palette.ts` 的顏色；不用漸層、濾鏡、外部字型、`<text>`
- sprite 內不放互動屬性，點擊一律由外層 `<button>` 負責

目標物件要比背景裝飾搶眼：裝飾用低彩度的 `sand`／`paper`／`grey`／`leaf`，目標用鮮明主色。目標一律畫在裝飾上層，所以裝飾永遠不會蓋住目標。

日後若要換成 AI 插畫或真實照片：關卡資料的 `x`／`y`／`r` 完全不用動，只要在 `SceneScreen` 的 `Backdrop` 之上多疊一張 `<img>`，並把對應的 sprite 從 `decor` 拿掉。

## 12. 測試策略

只測真的會壞的契約。**不寫畫面快照測試。**

自動化測試（Vitest）：

1. `validate.ts` — 七條驗證規則各自的通過與失敗案例，特別是 `r` 下限、Chebyshev 重疊判斷、垂直方向的 3/4 換算
2. `progress.ts` — 損壞 JSON、欄位型別錯誤、讀取拋錯（隱私模式）、寫入拋錯（配額滿）都不能讓遊戲掛掉
3. `reducer.ts` — 第 4 節列出的每一條狀態轉移，包含最後一關通往 `ending`、重玩舊關卡不讓進度倒退
4. `levels.ts` 實際資料跑一次驗證（內容錯誤要在 CI 就爆掉）

實測結果：4 個測試檔、49 個測試全綠。

實機驗收（主要證據，用 `browser` 以 iPhone 尺寸實跑）：

- 點中目標 → 打勾、飛入格子、音效
- 點空白 → 只有漣漪，沒有任何負面回饋
- 靜置 15 秒 → 提示光圈出現；再 15 秒 → 光圈變明顯
- 找齊 3 個 → 自動存檔並進入劇情頁
- 關掉分頁重開 → 進度續接，回到地圖且已完成的關卡有標記
- 轉成橫向 → 出現「請把手機豎起來」
- 全靜音 → 仍可完整通關
- 每個可點元素實測 ≥64px

## 13. 部署

- `vite build`（`base: '/baokaka-adventure/'`），GitHub Actions 在 push 到 `main` 時跑 `npm test` + `npm run build` 並發佈到 GitHub Pages
- `manifest.webmanifest` + icons，讓長輩可以「加到主畫面」，不必每次回去翻 LINE 訊息找連結。**不加 Service Worker**
- icons 與 OG 圖從 `assets/og.svg` 與 `public/icons/icon.svg` 用 macOS 內建的 `qlmanage` + `sips` 轉出 PNG，不引入任何圖形處理依賴
- `index.html` 附 OG title / description / image，LINE 貼連結時有預覽圖

## 14. 日後可加（現在不做）

- 劇情頁放寶咖咖的真實照片（`Level.story` 加一個選填圖片欄位即可）
- 更多關卡（加一筆 `Level` 資料；需要新圖案時才動 sprite）
- 語音朗讀劇情文字（若發現長輩讀字吃力）
- 跨裝置進度同步（需要後端，代價是登入流程）
