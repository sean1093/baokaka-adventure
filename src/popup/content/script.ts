import type { LineKey } from '../core/types';

/**
 * The script (GDD § 5), zh-Hant: `LineKey → { who, text }`, every line ≤ 30 characters (§ 5.1).
 * Lint rule 10 checks every page's line keys against `SCRIPT` (`pages.test.ts`, `npm run solve`,
 * PageLab); the subtitle queue (`game/talk.ts`) loads a page's `lines` through `loadLine`.
 *
 * Keys follow the § 5 headings: `p.intro.3` (the prologue, § 5.2 P), `c1.intro.2` (chapter 1's
 * card lines), `c0p3.join.4` / `c1p5.clerk.1` (a page's beat), `rec.pa.ride.1` (§ 5.3 recurring
 * lines), `learn.beep.mocha` (§ 5.4). Speech is stored without its outer 「」 (the bubble is the
 * quote); narration as written. #98 brought the speaker table, the loader and the lines its
 * fixtures play; #102 copied every line of the prologue and chapter 1 (§ 5.2) and the § 5.3 lines
 * they use. Chapters 2–10 come with their content issues. Which lines a chapter card plays is
 * `chapters.ts` (`cardLines`).
 */

/** § 5.1 speakers: who a line belongs to (its subtitle label, colour and anchor). */
export type Speaker = 'nar' | 'baby' | 'mocha' | 'grandma' | 'mom' | 'dad' | 'pa' | 'uncle' | 'clerk' | 'pack' | 'shushu' | 'npc';

/**
 * Where a speaker's subtitle bubble hangs (§ 5.1 *Bubble anchored to*): narration goes on the paper
 * strip at the top; Baokaka, Mocha and the 土地公 get a bubble on a spring from their heads; 廣播姊姊
 * speaks from a paper loudspeaker in the page's top corner; everyone else (off-page voices) gets a
 * bubble with no spring, under the strip.
 */
export type SpeakerAnchor = 'strip' | 'baby' | 'mocha' | 'speaker' | 'tudigong' | 'none';

export interface SpeakerInfo {
  /** The bubble's label (null for narration and for 寶咖咖 and 摩卡, whose bubbles hang from them) */
  readonly label: string | null;
  readonly anchor: SpeakerAnchor;
}

export const SPEAKERS: Readonly<Record<Speaker, SpeakerInfo>> = {
  nar: { label: null, anchor: 'strip' },
  baby: { label: null, anchor: 'baby' },
  mocha: { label: null, anchor: 'mocha' },
  grandma: { label: '阿嬤', anchor: 'none' },
  mom: { label: '媽媽', anchor: 'none' },
  dad: { label: '爸爸', anchor: 'none' },
  pa: { label: '廣播姊姊', anchor: 'speaker' },
  uncle: { label: '阿伯', anchor: 'tudigong' },
  clerk: { label: '店員小哥', anchor: 'none' },
  pack: { label: '背包客', anchor: 'none' },
  // 咻咻 is shown as 「小小的雲」 until 9-5 (§ 5.1): a line carries that label itself
  shushu: { label: '咻咻', anchor: 'none' },
  // Named per page (跑步阿姨, 鵝, 溫泉阿嬤 …): the line carries its label
  npc: { label: null, anchor: 'none' },
};

export interface ScriptLine {
  readonly who: Speaker;
  readonly text: string;
  /** The label for this line, over the speaker's (an `npc`'s name, 咻咻 as 「小小的雲」) */
  readonly label?: string;
}

export const SCRIPT: Readonly<Record<LineKey, ScriptLine>> = {
  // § 5.2 P 序章「度晬前一晚」 00:00: the card plays 1–5 (`CARD_LINES`), page 0-1 opens on 6–12
  'p.intro.1': { who: 'nar', text: '明天，是寶咖咖一歲的生日。' },
  'p.intro.2': { who: 'nar', text: '台灣話，叫做「度晬」。' },
  'p.intro.3': { who: 'grandma', text: '九樣寶物，長長久久。' },
  'p.intro.4': { who: 'grandma', text: '摩卡，今暗顧好喔。' },
  'p.intro.5': { who: 'nar', text: '……然後，摩卡就睡著了。' },
  'p.intro.6': { who: 'nar', text: '半夜十二點，窗戶喀啦喀啦響。' },
  'p.intro.7': { who: 'shushu', label: '小小的雲', text: '嘻……生日？什麼是生日？' },
  'p.intro.8': { who: 'nar', text: '小小的雲轉了一圈——呼！' },
  'p.intro.9': { who: 'nar', text: '寶物全部飛出了窗外。' },
  'p.intro.10': { who: 'shushu', label: '小小的雲', text: '對、對不起——！' },
  'p.intro.11': { who: 'nar', text: '阿嬤送的立體書，也被吹開了。' },
  'p.intro.12': { who: 'baby', text: '……哇。' },
  // § 4.3 0-2: Dad sleep-talks under his newspaper (the 淘氣, 0-2's `lines.onEvent`)
  'c0p2.dad.1': { who: 'dad', text: '叫……爸爸……' },
  // § 5.2 0-3 Mocha joins (on page open: 0-3's `lines.intro`, #106)
  'c0p3.join.1': { who: 'mocha', text: '……喵？盤子……空的？' },
  'c0p3.join.2': { who: 'mocha', text: '完了完了完了。' },
  'c0p3.join.3': { who: 'mocha', text: '阿嬤五點半就起床了。' },
  'c0p3.join.4': { who: 'mocha', text: '我自己去找。你乖乖睡覺。' },
  'c0p3.join.5': { who: 'baby', text: '不要！' },
  'c0p3.join.6': { who: 'mocha', text: '你連走路都還不會。' },
  'c0p3.join.7': { who: 'baby', text: '要！' },
  'c0p3.join.8': { who: 'mocha', text: '他說：『我也要去。這是我的生日。』' },
  'c0p3.join.9': { who: 'mocha', text: '……我在跟誰翻譯？' },
  'c0p3.join.10': { who: 'mocha', text: '……好啦。跟緊我。' },
  // § 4.3 0-3: the 紅包 lands beside him and he pats it (the 淘氣's flavour, 0-3's `lines.onEvent`)
  'c0p3.envelope.1': { who: 'baby', text: '這個！' },
  // § 5.2 0-4 The train wakes (on the cry → `train: on`: 0-4's `lines.onEvent`, #106)
  'c0p4.train.1': { who: 'pa', text: '月亮線列車，即將進站。' },
  'c0p4.train.2': { who: 'pa', text: '本列車，只載還沒睡的人。' },
  'c0p4.train.3': { who: 'mocha', text: '……還有沒睡的貓。' },
  // § 5.2 Ch1 「便當的味道」 00:20 (the chapter card)
  'c1.intro.1': { who: 'pa', text: '下一站，台北車站。Next station…' },
  'c1.intro.2': { who: 'mocha', text: '台北最大的車站。也最好迷路。' },
  'c1.intro.3': { who: 'nar', text: '大廳的地板，黑白黑白，像棋盤。' },
  'c1.intro.4': { who: 'mocha', text: '聞到了嗎？……是便當。' },
  // § 5.2 1-1 背包客 (#107 wires them to the backpacker waking: § 5.3's lines for 1-1)
  'c1p1.pack.1': { who: 'pack', text: 'Excuse me… where is 101?' },
  'c1p1.pack.2': { who: 'mocha', text: '往前走，看到最高的就是。' },
  // § 5.2 1-5 店員小哥 (his chapter cameo, § 5.3)
  'c1p5.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c1p5.clerk.2': { who: 'mocha', text: '……你怎麼在這裡？' },
  'c1p5.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // § 5.2 1-6 end (the treasure found; 阿嬤's line is also the album's, #103)
  'c1p6.end.1': { who: 'nar', text: '找到了！抓周寶物——雞腿。' },
  'c1p6.end.2': { who: 'grandma', text: '雞腿，一世人呷好料。' },
  'c1p6.end.3': { who: 'baby', text: '好吃！' },
  'c1p6.end.4': { who: 'mocha', text: '那是阿嬤的，不能吃。' },
  // § 5.2 Ch2 「會揮手的公園」 00:50 (the chapter card)
  'c2.intro.1': { who: 'pa', text: '大安森林公園站，到了。' },
  'c2.intro.2': { who: 'nar', text: '半夜的公園，還有人在跑步。' },
  'c2.intro.3': { who: 'mocha', text: '松鼠晚上不是該睡覺嗎？' },
  // § 5.3 店員小哥's chapter 2 cameo (2-2: Mocha climbs into his drinks stall's crate)
  'c2p2.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c2p2.clerk.2': { who: 'mocha', text: '……又是你？' },
  'c2p2.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // § 5.2 2-6 end
  'c2p6.end.1': { who: 'nar', text: '找到了！抓周寶物——畫筆。' },
  'c2p6.end.2': { who: 'mocha', text: '他說：『我要畫摩卡。』……好吧。' },
  // § 5.2 Ch3 「醉月湖的鵝」 01:20 (the chapter card)
  'c3.intro.1': { who: 'pa', text: '公館站，到了。' },
  'c3.intro.2': { who: 'nar', text: '椰林大道上，椰子樹排排站。' },
  'c3.intro.3': { who: 'mocha', text: '這裡的鵝，比警衛還兇。' },
  // § 5.3 背包客 #2 (3-1: waved out of the aisle, he waves back and asks) and Mocha's translation
  'c3p1.pack.1': { who: 'pack', text: 'Excuse me… where is 101?' },
  'c3p1.pack.2': { who: 'mocha', text: '一直走，抬頭就看到了。' },
  // § 5.3 店員小哥's chapter 3 cameo (3-2: Mocha sits on his delivery bike)
  'c3p2.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c3p2.clerk.2': { who: 'mocha', text: '……連腳踏車也是你的？' },
  'c3p2.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // § 5.2 3-6 藍教授: 掰掰 doesn't budge her; Mocha landing beside her does
  'c3p6.prof.1': { who: 'npc', label: '藍教授', text: '根據我的研究——' },
  'c3p6.prof.2': { who: 'npc', label: '藍教授', text: '我學富五車……腳踏車。' },
  'c3p6.prof.3': { who: 'mocha', text: '成語不是這樣用的。' },
  // § 5.2 3-6 end
  'c3p6.end.1': { who: 'nar', text: '找到了！抓周寶物——書。' },
  // § 5.2 Ch4 「霓虹燈睡著了」 01:50 (the chapter card)
  'c4.intro.1': { who: 'pa', text: '西門站，到了。' },
  'c4.intro.2': { who: 'nar', text: '紅樓旁的招牌，一個一個暗了。' },
  'c4.intro.3': { who: 'mocha', text: '連霓虹燈都想睡覺。' },
  // § 5.3 店員小哥's chapter 4 cameo (4-4: Mocha sits on the claw machine's coin slot)
  'c4p4.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c4p4.clerk.2': { who: 'mocha', text: '……夾娃娃機也是你們的？' },
  'c4p4.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // 4-4's running joke: the claw only ever works for 寶咖咖; and the 淘氣, the claw on Mocha
  'c4p4.claw.1': { who: 'mocha', text: '這台機器，只夾得起寶咖咖。' },
  'c4p4.claw.2': { who: 'mocha', text: '……' },
  // § 5.2 4-6 走音天王: the lights come up and he sings
  'c4p6.king.1': { who: 'npc', label: '走音天王', text: '這首歌，獻給一歲的你！' },
  'c4p6.king.2': { who: 'mocha', text: '……耳朵。我的耳朵。' },
  // § 5.2 4-6 end
  'c4p6.end.1': { who: 'nar', text: '找到了！抓周寶物——麥克風。' },
  // § 5.2 Ch5 「夜市抱抱」 02:20 (the chapter card)
  'c5.intro.1': { who: 'pa', text: '劍潭站，到了。' },
  'c5.intro.2': { who: 'nar', text: '士林夜市，半夜還是好香。' },
  'c5.intro.3': { who: 'mocha', text: '不准吃。我們是來工作的。' },
  // § 5.3 店員小哥's chapter 5 cameo (5-2: Mocha lands in his balloon stall's basket)
  'c5p2.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c5p2.clerk.2': { who: 'mocha', text: '……射氣球也是你們的？' },
  'c5p2.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // 5-3: Mocha rings the 雞排 stall's bell, and the 老闆 comes to the counter
  'c5p3.boss.1': { who: 'npc', label: '雞排老闆', text: '來了！要切嗎？要辣嗎？' },
  'c5p3.boss.2': { who: 'mocha', text: '……他只要抱抱。' },
  // 5-4's 淘氣: the jackpot wakes the 彈珠台阿伯
  'c5p4.uncle.1': { who: 'npc', label: '彈珠台阿伯', text: '哈哈哈！大獎！……沒有獎品啦。' },
  // 5-6: the 蔥抓餅 vendor lifts him over her counter
  'c5p6.vendor.1': { who: 'npc', label: '蔥抓餅阿姨', text: '小帥哥，要不要加蛋？' },
  'c5p6.vendor.2': { who: 'mocha', text: '……不要問我。' },
  // § 5.2 5-6 end
  'c5p6.end.1': { who: 'nar', text: '找到了！抓周寶物——蔥。' },
  'c5p6.end.2': { who: 'mocha', text: '蔥抓餅……加蛋。……我什麼都沒說。' },
  // § 5.2 Ch6 「飛機睡著的時候」 02:50 (the chapter card)
  'c6.intro.1': { who: 'pa', text: '松山機場站，到了。' },
  'c6.intro.2': { who: 'nar', text: '晚上十一點以後，飛機都在睡覺。' },
  'c6.intro.3': { who: 'npc', label: '塔台', text: '這裡是塔台，請保持安靜。Over。' },
  // 6-1: the dozing cabin crew wakes to 抱抱 and carries him off the train
  'c6p1.crew.1': { who: 'npc', label: '空服員姊姊', text: '嗯……到機場了？姊姊抱你下車。' },
  // § 5.3 店員小哥's chapter 6 cameo (6-2: Mocha squeezes through the carousel's rubber curtain)
  'c6p2.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c6p2.clerk.2': { who: 'mocha', text: '……行李轉盤也是你們的？' },
  'c6p2.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // § 5.2 6-5 塔台: the radio, and the 咻咻 beat in the tower's log
  'c6p5.tower.1': { who: 'npc', label: '塔台', text: '剛剛有朵雲問：可以起飛嗎？' },
  'c6p5.tower.2': { who: 'npc', label: '塔台', text: '我說不行。Over。' },
  // 6-6: he rides the X-ray belt; the screen shows his silhouette and his bottle
  'c6p6.xray.1': { who: 'mocha', text: 'X光說：寶寶一個，奶瓶一支。' },
  // § 5.2 6-6 end
  'c6p6.end.1': { who: 'nar', text: '找到了！抓周寶物——印章。' },
  // § 5.2 Ch7 「纜車上的月亮」 03:30 (the chapter card)
  'c7.intro.1': { who: 'pa', text: '動物園站，到了。請轉乘纜車。' },
  'c7.intro.2': { who: 'nar', text: '纜車一格一格，往山上爬。' },
  'c7.intro.3': { who: 'mocha', text: '貓喜歡高的地方。不是這種高。' },
  // 7-1: the night-shift zookeeper wakes to 抱抱 and carries him down the station's stairs
  'c7p1.keeper.1': { who: 'npc', label: '保育員', text: '嗯……小朋友迷路了？叔叔抱你下樓。' },
  // § 5.3 店員小哥's chapter 7 cameo (7-2: Mocha jumps into his gondola shop)
  'c7p2.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c7p2.clerk.2': { who: 'mocha', text: '……纜車也是你們的？' },
  'c7p2.clerk.3': { who: 'clerk', text: '行動分店。' },
  'c7p2.clerk.4': { who: 'clerk', text: '貓空站到了，謝謝光臨！' },
  // 7-3: the tea farmer waves back to 掰掰 and climbs up a terrace (he watches, and learns 爬樓梯)
  'c7p3.farmer.1': { who: 'npc', label: '採茶阿伯', text: '掰掰～阿伯上去採茶囉！' },
  // 7-4: every cloud blown aside, Mocha on the bench looks down through the glass (the 淘氣)
  'c7p4.mocha.1': { who: 'mocha', text: '……我不要往下看。' },
  // 7-5: the pool filled with Mocha watching from the tea tray (the 淘氣)
  'c7p5.mocha.1': { who: 'mocha', text: '……' },
  // § 5.2 7-6 黑糖: the cry wakes him; hugged twice, he hums
  'c7p6.bear.1': { who: 'npc', label: '黑糖', text: '歹、歹勢，我睡在芹菜上了。' },
  'c7p6.bear.2': { who: 'mocha', text: '……熊也會說歹勢。' },
  'c7p6.bear.3': { who: 'npc', label: '黑糖', text: '嗯～嗯嗯～♪' },
  // § 5.2 7-6 end
  'c7p6.end.1': { who: 'nar', text: '找到了！抓周寶物——芹菜。' },
  // § 5.2 10-6 first steps (#128): the world holds for each (`lines.onEvent` with `pause`). As the
  // rail ends and Mocha waits across, he lets go; a line per wobbly step; the hug; the end
  'c10p6.steps.1': { who: 'shushu', text: '沒有人說歡迎咻咻……' },
  'c10p6.steps.2': { who: 'nar', text: '寶咖咖放開了欄杆。' },
  'c10p6.steps.3': { who: 'nar', text: '一步。' },
  'c10p6.steps.4': { who: 'nar', text: '兩步。' },
  'c10p6.steps.5': { who: 'nar', text: '三步。' },
  'c10p6.steps.6': { who: 'mocha', text: '走、走路了……他在走路！' },
  'c10p6.hug.1': { who: 'baby', text: '抱抱。' },
  'c10p6.hug.2': { who: 'shushu', text: '……抱抱？' },
  'c10p6.hug.3': { who: 'nar', text: '小雲，慢慢變白、變軟了。' },
  'c10p6.hug.4': { who: 'nar', text: '金鎖片，回到了寶咖咖手上。' },
  'c10p6.end.1': { who: 'baby', text: '一起。' },
  'c10p6.end.2': { who: 'mocha', text: '他說：『一起過生日。』' },
  'c10p6.end.3': { who: 'nar', text: '太陽，從山的後面出來了。' },
  'c10p6.end.4': { who: 'pa', text: '本列車直達：寶咖咖的家。' },
  // § 5.2 Ch8 「熱呼呼的煙」 04:00 (the chapter card)
  'c8.intro.1': { who: 'pa', text: '新北投站，到了。' },
  'c8.intro.2': { who: 'nar', text: '地熱谷，冒著白白的煙。' },
  'c8.intro.3': { who: 'mocha', text: '有水。熱水。兩個我都不要。' },
  // 8-1: the 泡湯阿伯 wakes to 抱抱 and lifts him over his bath bucket
  'c8p1.uncle.1': { who: 'npc', label: '泡湯阿伯', text: '嗯……要去泡湯喔？阿伯抱你過去。' },
  // 8-2: the steam comes up under Mocha a third time (the 淘氣)
  'c8p2.mocha.1': { who: 'mocha', text: '……毛都炸開了。不要看。' },
  // 8-3: 咻—— blows the 溫泉阿嬤's sun hat off (the 淘氣)
  'c8p3.granny.1': { who: 'npc', label: '溫泉阿嬤', text: '哎唷！我的帽子！' },
  // § 5.3 店員小哥's chapter 8 cameo (8-5: Mocha hops onto his bathhouse shop's counter)
  'c8p5.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c8p5.clerk.2': { who: 'mocha', text: '……澡堂也是你們的？' },
  'c8p5.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // 8-5: his tub floats out to him empty (the 淘氣)
  'c8p5.mocha.1': { who: 'mocha', text: '……我不坐。' },
  // 8-6: the bell rung, the 番台's cashier opens her window
  'c8p6.cashier.1': { who: 'npc', label: '番台阿嬤', text: '歡迎光臨！大人五十，囡仔免錢。' },
  'c8p6.cashier.2': { who: 'mocha', text: '……貓呢？' },
  // 8-6: 「1」 on the abacus (the 淘氣)
  'c8p6.mocha.1': { who: 'mocha', text: '一。……一歲，生日快樂。' },
  // § 5.2 8-6 end
  'c8p6.end.1': { who: 'nar', text: '找到了！抓周寶物——算盤。' },
  // § 5.2 Ch9 「河的盡頭是海」 04:40 (the chapter card)
  'c9.intro.1': { who: 'pa', text: '終點站，淡水。' },
  'c9.intro.2': { who: 'nar', text: '天空，開始有一點點亮了。' },
  'c9.intro.3': { who: 'mocha', text: '快點。阿嬤五點半起床。' },
  // § 5.3 背包客 #3 (9-2: waved up off the lane, he asks again) and Mocha's translation
  'c9p2.pack.1': { who: 'pack', text: 'Excuse me… where is 101?' },
  'c9p2.pack.2': { who: 'mocha', text: '你從淡水走過去？……加油。' },
  // 9-2: the 鐵蛋 阿婆 wakes to 抱抱 and lifts him onto her counter
  'c9p2.granny.1': { who: 'npc', label: '鐵蛋阿婆', text: '來，阿婆抱你看鐵蛋。' },
  // 9-3: Mocha sits on the ferry's horn (the 淘氣)
  'c9p3.horn.1': { who: 'mocha', text: '……不是我按的。' },
  // § 5.3 店員小哥's chapter 9 cameo (9-4: Mocha hops onto his ice-cream kiosk)
  'c9p4.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c9p4.clerk.2': { who: 'mocha', text: '……碼頭也是你們的？' },
  'c9p4.clerk.3': { who: 'clerk', text: '我們是連鎖的。' },
  // § 5.2 9-5 meeting 咻咻 (on reaching the tower's base; each line holds the world)
  'c9p5.shushu.1': { who: 'nar', text: '橋塔旁邊，一朵小雲在繞圈圈。' },
  'c9p5.shushu.2': { who: 'shushu', text: '咻咻想飛出去……飛不出去。' },
  'c9p5.shushu.3': { who: 'mocha', text: '台北是盆地。四邊都是山。' },
  'c9p5.shushu.4': { who: 'shushu', text: '大家都說：颱風，快走！' },
  'c9p5.shushu.5': { who: 'shushu', text: '咻咻……也一歲了。' },
  'c9p5.shushu.6': { who: 'baby', text: '一起！' },
  'c9p5.shushu.7': { who: 'shushu', text: '……不要！' },
  'c9p5.shushu.8': { who: 'nar', text: '小雲哭著，往101飛走了。' },
  'c9p5.shushu.9': { who: 'mocha', text: '……追。' },
  // 9-5: 生日快樂's opening on the cables (the 淘氣)
  'c9p5.mocha.1': { who: 'mocha', text: '生日快樂……明天才是啦。' },
  // § 5.2 9-6 end
  'c9p6.end.1': { who: 'nar', text: '找到了！抓周寶物——聽診器。' },
  // § 5.2 Ch10 「離天空最近的地方」 05:10: the card plays 1–2; 10-1 plays 3–4 as the balloons lift off
  // the car's front window and 101 is in it (「He says ㄅㄚ！ at the 101 view」, § 4.4)
  'c10.intro.1': { who: 'pa', text: '下一站，台北101。' },
  'c10.intro.2': { who: 'nar', text: '101，是台北最高的地方。' },
  'c10.intro.3': { who: 'baby', text: 'ㄅㄚ！' },
  'c10.intro.4': { who: 'mocha', text: '對，101。咻咻在最上面。' },
  // 10-1: 哇！ at the 101 in the window (the 淘氣)
  'c10p1.mocha.1': { who: 'mocha', text: '……他在跟101打招呼。' },
  // 10-2: the first ride up with him (the 37 seconds), then § 5.3's 店員小哥 chapter 10 cameo at 89F
  'c10p2.ride.1': { who: 'nar', text: '三十七秒，從五樓到八十九樓。' },
  'c10p2.clerk.1': { who: 'clerk', text: '叮咚～歡迎光臨！' },
  'c10p2.clerk.2': { who: 'mocha', text: '……101也是你們的？' },
  'c10p2.clerk.3': { who: 'clerk', text: '我們在101也有分店。' },
  // 10-2: the 清潔阿伯 lifts him across the open floor to the window (抱抱)
  'c10p2.uncle.1': { who: 'npc', label: '清潔阿伯', text: '來，阿伯抱你去窗邊看。' },
  // 10-3: every section in line, the 101 smiles (the 淘氣)
  'c10p3.mocha.1': { who: 'mocha', text: '……整棟歪一邊。101在笑。' },
  // 10-4: five swings of the damper (the 淘氣)
  'c10p4.mocha.1': { who: 'mocha', text: '……我暈了。' },
  // 10-5 咻咻的派對: the page opens on the sad party (§ 5.2 10-5)
  'c10p5.party.1': { who: 'nar', text: '頂樓上，有一個小小的派對。' },
  'c10p5.party.2': { who: 'shushu', text: '這些……都是咻咻吹來的。' },
  'c10p5.party.3': { who: 'shushu', text: '可是，沒有人來。' },
  // 10-5: hugged, 咻咻 lets go of the bead and floats up toward the deck
  'c10p5.hug.1': { who: 'shushu', text: '……你們，來了？' },
  'c10p5.hug.2': { who: 'nar', text: '小雲放下珠珠，飄到更高的地方。' },
  // 10-5: all four of the cake's candles lit, led round 咻咻 (the 淘氣)
  'c10p5.mocha.1': { who: 'mocha', text: '繞一圈。……蠟燭都亮了。' },
  // § 5.5 尾聲 (#135). 05:30, home: the tray complete, Mocha asleep on it (the scene before page E)
  'e.dawn.1': { who: 'nar', text: '清晨五點半。阿嬤起床了。' },
  'e.dawn.2': { who: 'grandma', text: '哎唷，摩卡真乖，顧規暝。' },
  'e.dawn.3': { who: 'nar', text: '摩卡睜開一隻眼睛。' },
  'e.dawn.4': { who: 'mocha', text: '……喵。' },
  // 10:00, page E 「抓周」: the card's line, then the family cheers for their pick (page E's intro)
  'e.intro.1': { who: 'nar', text: '早上十點，抓周開始了！' },
  'e.cheer.1': { who: 'dad', text: '書！拿書！' },
  'e.cheer.2': { who: 'grandma', text: '算盤啦，會賺錢！' },
  'e.cheer.3': { who: 'mom', text: '拿什麼都好，慢慢來。' },
  // He crawls past every treasure (page E's `onEvent`, each held)
  'e.pass.1': { who: 'dad', text: '……經過了書。' },
  'e.pass.2': { who: 'grandma', text: '……經過了算盤。' },
  'e.pass.3': { who: 'mom', text: '……經過了雞腿？' },
  // The tail grabbed: his first word, and his second (the end lines, `END_LINES[11]`)
  'e.end.1': { who: 'nar', text: '寶咖咖抓住了——摩卡的尾巴。' },
  'e.end.2': { who: 'baby', text: '……摩卡。' },
  'e.end.3': { who: 'nar', text: '全家人，都叫了起來！' },
  'e.end.4': { who: 'dad', text: '第一個字……不是爸爸。' },
  'e.end.5': { who: 'mocha', text: '眼睛……進沙子了。' },
  'e.end.6': { who: 'nar', text: '窗外，一陣小小的風吹過。' },
  'e.end.7': { who: 'baby', text: '咻咻！' },
  'e.end.8': { who: 'dad', text: '第二個字，也不是爸爸！' },
  'e.end.9': { who: 'nar', text: '生日快樂，寶咖咖。' },
  'e.end.10': { who: 'nar', text: '生日快樂，咻咻。' },
  // § 4.1 / § 5.3: the 背包客 in the credits, at 101 at last
  'e.credits.pack': { who: 'pack', text: 'I found it!' },
  // Post-credits (after the credits roll over the album photos)
  'e.post.1': { who: 'nar', text: '巷口的小廟裡，土地公的手指上，' },
  'e.post.2': { who: 'nar', text: '沾著一點點，蓋章的印泥。' },
  'e.post.3': { who: 'uncle', text: '呵呵，囡仔，慢慢仔大。' },
  'e.post.4': { who: 'nar', text: '每年夏天的午後，台北會下一場西北雨。' },
  'e.post.5': { who: 'nar', text: '那是咻咻，回來玩了。' },
  'e.post.6': { who: 'pa', text: '下一站：兩歲。' },
  // 番外 「象山的日出」 (§ 4.4 bonus page, #135): the card's lines, and the 土地公's stamp
  'x.intro.1': { who: 'nar', text: '象山。爬了好多好多階梯。' },
  'x.intro.2': { who: 'nar', text: '從這裡看101，剛剛好。' },
  'x.stamp.1': { who: 'uncle', text: '呵呵，囡仔，慢慢仔大。' },
  // § 5.3 recurring lines (those chapters 0–1 use; the hint lines are `hints.ts`, the barks
  // `barks.ts`, the sticker pops and 「下一頁！」 `ui.ts`)
  'rec.pa.ride.1': { who: 'pa', text: '請緊握扶手。' },
  'rec.pa.ride.2': { who: 'pa', text: '請讓座給需要的人。' },
  'rec.pa.ride.3': { who: 'pa', text: '車門即將關閉。' },
  // § 5.3: when Mocha sits on a 博愛座 (2-1's 淘氣)
  'rec.pa.priority': { who: 'pa', text: '請讓座。……貓也算嗎？' },
  'rec.uncle.tap': { who: 'uncle', text: '呵呵，囡仔，慢慢仔來。' },
  'rec.mocha.squint': { who: 'mocha', text: '……我是不是在哪裡看過你？' },
  // Under the next chapter's card while that chapter is still being made (#107, D-70)
  'rec.soon.1': { who: 'nar', text: '下一站還在畫……未完待續。' },
  // § 5.4 word learning: the source line, Baokaka's word, Mocha's translation (and its follow-up);
  // `content/words.ts` strings them into learn beats (#99). Sources that make no sound have no line.
  'learn.beep.src': { who: 'npc', label: '讀卡機', text: '嗶！' },
  'learn.beep.baby': { who: 'baby', text: '嗶！' },
  'learn.beep.mocha': { who: 'mocha', text: '他說：『芝麻開門。』' },
  'learn.beep.then': { who: 'mocha', text: '……閘門真的開了。' },
  'learn.bye.src': { who: 'npc', label: '跑步阿姨', text: '掰掰～小寶貝！' },
  'learn.bye.baby': { who: 'baby', text: '掰掰！' },
  'learn.bye.mocha': { who: 'mocha', text: '他說：『請讓一讓，謝謝。』' },
  'learn.no.src': { who: 'npc', label: '鵝', text: '嘎！不要過來！' },
  'learn.no.baby': { who: 'baby', text: '不要！' },
  'learn.no.mocha': { who: 'mocha', text: '他學會了人生最重要的詞。' },
  'learn.wow.baby': { who: 'baby', text: '哇！' },
  'learn.wow.mocha': { who: 'mocha', text: '他說：『開燈。』……電費誰付？' },
  'learn.hug.src': { who: 'npc', label: '夜市阿姨', text: '來，阿姨抱！' },
  'learn.hug.baby': { who: 'baby', text: '抱抱！' },
  'learn.hug.mocha': { who: 'mocha', text: '他說：『載我一程。』' },
  'learn.plane.baby': { who: 'baby', text: '飛……飛機！' },
  'learn.plane.mocha': { who: 'mocha', text: '不會說爸爸，先會說飛機。' },
  'learn.climb.mocha': { who: 'mocha', text: '……你什麼時候學會的？' },
  'learn.whoosh.src': { who: 'npc', label: '溫泉阿嬤', text: '蛋很燙，呼呼再吃。' },
  'learn.whoosh.baby': { who: 'baby', text: '咻——！' },
  'learn.whoosh.mocha': { who: 'mocha', text: '他說：『我是颱風。』……別鬧。' },
  'learn.cruise.mocha': { who: 'mocha', text: '站、站起來了！……我沒有哭。' },
  'learn.together.baby': { who: 'baby', text: '……一起。' },
  'learn.together.mocha': { who: 'mocha', text: '他說：『我們一起去。』' },
};

/** A line ready to show: its key, speaker, label and text. */
export interface TalkLine {
  readonly key: LineKey;
  readonly who: Speaker;
  /** The bubble's label, or null (narration, 寶咖咖, 摩卡) */
  readonly label: string | null;
  readonly text: string;
}

/**
 * The loader pages' `lines` go through: a key → the line to show, or null when the key isn't in the
 * table (lint rule 10 makes that an error, so a shipped page never hits it).
 */
export function loadLine(key: LineKey, table: Readonly<Record<LineKey, ScriptLine>> = SCRIPT): TalkLine | null {
  const line = table[key];
  if (line === undefined) return null;
  return { key, who: line.who, label: line.label ?? SPEAKERS[line.who].label, text: line.text };
}

/** Loads a list of keys, dropping unknown ones. */
export function loadLines(keys: readonly LineKey[], table?: Readonly<Record<LineKey, ScriptLine>>): TalkLine[] {
  return keys.map((k) => loadLine(k, table)).filter((l): l is TalkLine => l !== null);
}
