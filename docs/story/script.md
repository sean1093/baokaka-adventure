# 寶咖咖抓周大冒險 — 遊戲劇本 (In-game Script)

*Baokaka & Mocha: Midnight Across Taipei*. This is the source of truth for every in-game line. Read `story-bible.md` first for structure, flags, maps and tables.

## How to read this file

Each `### key` is one entry in `EVENTS` (events.ts). Lines map 1:1 to `Step`s:

| Notation | Step |
|---|---|
| `旁白：text` | `{ who: null, text: 'text' }` |
| `mocha：「text」` | `{ who: 'mocha', text: '「text」' }` (keep the 「」 in the string, as today) |
| `[chapter 3｜月亮線，出發！｜01:10]` | `{ do: 'chapter', n: 3, title: '月亮線，出發！', time: '02:00' }` |
| `[join magpie]` | `{ do: 'join', hero: 'magpie' }` |
| `[flag x]` | `{ do: 'flag', flag: 'x' }` |
| `[give item]` / `[give item ×2]` | `{ do: 'give', item, count }` |
| `[coins 50]` | `{ do: 'coins', amount: 50 }` |
| `[heal]` | `{ do: 'heal' }` |
| `[battle a, b]` | `{ do: 'battle', foes: ['a','b'] }` |
| `[boss x]` | `{ do: 'battle', foes: ['x'], boss: true }` |
| `[shop a, b, …]` | `{ do: 'shop', stock: [...] }` |
| `[inn 20]` | `{ do: 'inn', price: 20 }` |
| `[goto map c,r]` | `{ do: 'goto', … }` (tile is a suggestion; set to the real entry tile) |
| `[ending]` | `{ do: 'ending' }` |
| `[travel]` | `{ do: 'travel' }` (opens the 路線圖, § 3.1) |
| `→ key` / choice tables | `{ do: 'choice', options: [{ label, event }] }` (§ 3.2) |
| `[coins -20]` | spend coins; floors at 0 |

"Talk rules" lines (`talk:`) show the NPC's `Npc.talk` list, in priority order (first match wins). Every line is at most 40 characters, so it fits the phone dialogue box.

### Baokaka's vocabulary (do not add words)

要！／不要！／抱抱／ㄋㄟㄋㄟ／喵喵／咻——／哇！／這個！／我！／餓餓／好吃！／好看！／掰掰／一起／ㄅㄚ！（＝101）／嗶！（學自交通卡）／飛機！（Ch8 起）

He says his first real word only in the ending. (飛機 is a toddler's favorite noise-word, not his "first word". The family never hears it.)

## Speakers

| id | Display name | Sprite notes |
|---|---|---|
| `baokaka` `mocha` `magpie` `bear` | 寶咖咖／摩卡貓／阿藍／黑糖 | heroes |
| `mochaNpc` `magpieNpc` `bearNpc` | 摩卡貓／藍教授／黑糖 | the same sprites, used before they join |
| `mom` `dad` `grandma` | 媽媽／爸爸／阿嬤 | family |
| `cloud` | 小小的雲 | 咻咻, before it says its own name |
| `shushu` | 咻咻 | final boss sprite (soft version) |
| `uncleSweep` | 掃地阿伯 | 土地公 #1 (straw hat, broom), ch1 |
| `uncleJanitor` | 校工阿伯 | #2 (blue cap), ch2 |
| `uncleStation` | 站務阿伯 | #3 (MRT staff cap), ch3 |
| `uncleFortune` | 算命阿伯 | #4 (round dark glasses on forehead), ch4 |
| `unclePoe` | 擲筊阿伯 | #5 (cloth bag of 筊杯), ch5 |
| `uncleTea` | 茶行阿伯 | #6 (black vest, teapot), ch6 |
| `unclePinball` | 彈珠台阿伯 | #7 (flat cap), ch7 |
| `uncleAirport` | 推車阿伯 | #8 (airport vest), ch8 |
| `uncleZoo` | 管理員阿伯 | #9 (safari hat), ch9 |
| `uncleBoat` | 租船阿伯 | #10 (sun visor, ticket box), ch10 |
| `uncleBath` | 澡堂阿伯 | #11 (towel on head), ch11 |
| `uncleFarm` | 海芋田阿伯 | #12 (straw hat, calla lilies), ch12 |
| `uncleFerry` | 渡輪阿伯 | #13 (captain hat), ch13 |
| `uncleTower` | 清潔阿伯 | #14 (cleaner cap, mop), ch14 |
| `tudigong` | 土地公 | the same face, red robe, gold hat |
| `clerk` | 店員小哥 | the same everywhere |
| `announcer` | 廣播姊姊 | glowing conductor |
| `backpacker` | 背包客 | — |
| `runner` | 夜跑大哥 | ch1 |
| `turtle` | 池塘烏龜 | ch1 |
| `student` | 爆肝大學生 | ch2 |
| `cleaner` | 清潔阿姨 | ch3 |
| `bento` | 便當阿姨 | ch3 |
| `owl` | 貓頭鷹奶奶 | moonline |
| `salaryman` | 暗光鳥上班族 | moonline |
| `dancer` | 街舞少年 | ch4 |
| `noodle` | 麵線阿姨 | ch4 |
| `neon` | 霓虹招牌精 | ch4 |
| `clothAunt` | 布行阿姨 | ch5 |
| `templeAunt` | 廟口阿姨 | ch5 |
| `driedAunt` | 南北貨老闆娘 | ch5 |
| `herbal` | 中藥行阿公 | ch5 |
| `goldfishGirl` | 撈金魚小妹 | ch6 |
| `cutletAunt` | 雞排阿姨 | ch6 |
| `sausage` | 大腸包小腸 | ch6 |
| `meerkat` | 狐獴哨兵 | ch7 |
| `teaLady` | 茶館老闆娘 | ch7 |
| `bookworm` | 書蟲 | ch8 |
| `onsenGran` | 溫泉阿嬤 | ch8 |
| `sulfur` | 硫磺煙 | ch8 |
| `painter` | 街頭畫家 | ch9 |
| `ageiGran` | 阿給阿婆 | ch9 |
| `crabSoldier` | 招潮蟹小兵 | ch9 |
| `souvenir` | 紀念品店姊姊 | ch10 |
| `ctrlTower` | 塔台 | the control tower (lit window with a headset); speaks radio-style |
| `jet` | 小白機 | sleepy small white plane, blue stripe, unbranded |
| `marshal` | 地勤姊姊 | ch7, with glowing wands |
| `windsock` | 風向袋小姐 | ch7 boss |
| `squishedWorker` | 扁扁的上班族 | orange ride car |
| `gugu` | 鴿子老大 咕咕 | ch5 boss |
| `herbGran` | 青草巷阿婆 | ch5 |
| `flowerAunt` | 玉蘭花阿姨 | ch5 |
| `chick` | 小鴿子 | ch5 |
| `ahua` | 阿花姐 | old calico cat, ch5 (Mocha's story) |
| `quietSprite` | 安靜精 | ch2 library |
| `signKing` | 指標大王 | ch3 optional mini-boss |
| `dumpling` | 小籠包 | ch7 |
| `steamerMom` | 蒸籠媽媽 | ch7 |
| `meerkat2` `meerkat3` | 狐獴哨兵 | ch9 |
| `swanQueen` | 天鵝船大姊 | ch10 boss |
| `raceSwan` | 小天鵝船 | ch10 |
| `riverJogger` | 騎車的大哥 | ch10 |
| `busDriver` | 月亮公車司機 | ch12 |
| `calf` | 小牛 | ch12 |
| `cowMom` | 牛媽媽 | ch12 |
| `buffalo` | 大水牛 阿哞 | ch12 boss |
| `fisherGrandpa` | 釣魚阿公 | green car |
| `nurse` | 夜班護理師 | red car |
| `busker` | 街頭歌手 | blue car |
| `dogAunt` | 遛狗阿姨 | brown car |
| `trashAuntie` | 追垃圾車的阿姨 | gag ch1 |
| `sleepyTA` | 睡著的助教 | gag ch2 |
| `commuter` | 趕車的上班族 | gag ch3 |
| `scooterUncle` | 機車阿伯 | gag ch4 |
| `queueLine` | 排隊的食物們 | gag ch6 |
| `bathGrandpa` | 泡腳阿公 | gag ch8 |
| `deliveryRider` | 外送小哥 | gag ch9 |
| bosses: `squirrel` `goose` `gate` `karaoke` `dragon` `cutlet` `teapot` `egg` `crab` `damper` | 松鼠大王／鵝霸／嗶嗶／卡拉OK大王／舞布龍／超級大雞排／茶壺爺／溫泉蛋爺爺／招潮蟹將軍／阿穩 | the boss sprites |

---

## Shared events

### stamp.noBook
```
旁白：一個紀念章台。可是，沒有本子可以蓋。
```

### stamp.done
```
旁白：這裡的章，已經蓋過了。
旁白：集章本上，印得清清楚楚。
```

Every stamp stand NPC uses `talk: [{ when: 'stamp_X', event: 'stamp.done' }, { when: 'stampBook', event: 'stamp.X' }, { event: 'stamp.noBook' }]`.

### system.defeat
(Shown on the Defeat screen.)
```
旁白：大家累倒了……
旁白：在入口醒了過來。
```

---

## 第一章 度晬前一晚 — 家・大安森林公園

### ch1.intro
(Trigger at the crib, once.)
```
[chapter 1｜度晬前一晚｜00:00]
旁白：明天，是寶咖咖一歲的生日。
旁白：台灣話，叫做「度晬」。
旁白：阿嬤在窗邊，擺好了抓周盤。
旁白：九樣寶物，圍著一片金鎖片。
旁白：旁邊，還有一疊邀請卡，和一根「1」的蠟燭。
grandma：「九樣，長長久久。」
grandma：「摩卡，今暗顧好喔。」
mochaNpc：「喵。」
旁白：……然後，摩卡貓就睡著了。
旁白：半夜十二點。窗戶喀啦喀啦響。
cloud：「嘻……生日？什麼是生日？」
旁白：一團小小的雲，從窗縫擠了進來。
cloud：「哇，亮晶晶的！看看——」
旁白：小雲高興得轉起圈圈。轉啊轉——
旁白：呼——！
旁白：抓周盤上的寶物，全部飛出窗外！
cloud：「啊……！對、對不起——！」
旁白：小雲纏著金鎖片，一溜煙飛走了。
旁白：金鎖片的紅繩，啪一聲斷了，飄出窗外。
旁白：邀請卡和蠟燭，也一起飛走了。
旁白：嬰兒床裡，有一雙眼睛，全部都看到了。
baokaka：「……哇。」
旁白：（點地板就會爬過去。先去找摩卡貓。）
```

### ch1.home.mocha
talk: `mochaNpc` (not: mochaJoined)
```
mochaNpc：「……喵？」
mochaNpc：「盤子……空的？」
mochaNpc：「完了完了完了。」
mochaNpc：「阿嬤叫我顧好，我竟然睡著了。」
baokaka：「咻——！」
mochaNpc：「你看到了？是一陣風？」
mochaNpc：「……阿嬤五點半就起床了。」
mochaNpc：「我自己去找回來。你乖乖睡覺。」
baokaka：「不要！」
mochaNpc：「你連走路都還不會。」
旁白：寶咖咖爬爬爬爬，一下就爬到門口。
mochaNpc：「……爬得還真快。」
baokaka：「要！」
mochaNpc：「他說：『我也要去。這是我的生日。』」
mochaNpc：「……我在跟誰翻譯？」
mochaNpc：「……好啦。跟緊我。」
[join mocha]
[flag mochaJoined]
旁白：摩卡貓加入了隊伍！
mocha：「打架的時候點『才藝』。」
mocha：「我會呼嚕嚕，幫你補體力。」
mocha：「門口那邊，有東西在滾來滾去。」
```

### ch1.home.mom / ch1.home.mom.alone
talk: `mom`: `[{ when: 'mochaJoined', event: 'ch1.home.mom' }, { event: 'ch1.home.mom.alone' }]`

**ch1.home.mom.alone**
```
旁白：媽媽睡得好熟。
mom：「呼……寶寶……你出生那天……」
mom：「……颳好大的颱風喔……」
旁白：媽媽的手，迷迷糊糊地摸摸寶咖咖的頭。
[heal]
```

**ch1.home.mom**
```
旁白：媽媽睡得好熟。
mom：「呼……寶寶……你出生那天……」
mom：「……颳好大的颱風喔……」
旁白：媽媽的手，迷迷糊糊地摸摸寶咖咖的頭。
[heal]
旁白：全隊的體力和元氣，都恢復了。
mocha：「……她每次講這個，都會笑。」
mocha：「累了就回來，讓她摸摸頭。」
```

### ch1.home.dad / ch1.home.dad.alone
talk: `dad`: `[{ when: 'mochaJoined', event: 'ch1.home.dad' }, { event: 'ch1.home.dad.alone' }]`

**ch1.home.dad.alone**
```
旁白：爸爸在沙發上睡著了，遙控器在肚子上。
dad：「呼……寶寶……叫……爸爸……」
baokaka：「……ㄋㄟㄋㄟ。」
dad：「……嘿嘿……」
```

**ch1.home.dad**
```
旁白：爸爸在沙發上睡著了，遙控器在肚子上。
dad：「呼……寶寶……叫……爸爸……」
dad：「……爸……爸……嘿嘿……」
mocha：「他每天晚上，都在夢裡練習。」
mocha：「你一次都沒叫過。」
baokaka：「ㄋㄟㄋㄟ。」
mocha：「……這個不算。」
```

### ch1.home.grandma
talk: `grandma` (door NPC; she's asleep)
```
旁白：阿嬤的房間，傳來打呼的聲音。
grandma：「呼……乖孫……金鎖片……」
grandma：「……戴起來……金價水……」
mocha：「一定要在她醒來之前回來。」
```

### ch1.home.redEnvelope
talk: `redEnvelope` (side-table NPC, not: gotRedEnvelope; requires mochaJoined. Before that, use `ch1.home.redEnvelope.early`)

**ch1.home.redEnvelope.early**
```
旁白：桌上有一個紅包，上面寫著「乖孫 度晬」。
旁白：寶咖咖搆不到。
```

**ch1.home.redEnvelope**
```
旁白：桌上有一個紅包，上面寫著「乖孫 度晬」。
mocha：「阿嬤明天要給你的。」
mocha：「……先借用一下。」
[coins 50]
[flag gotRedEnvelope]
旁白：得到 50 個銅板！
mocha：「回來再跟阿嬤說謝謝。」
mocha：「銅板可以跟便利商店換東西。」
```

### ch1.home.dust
talk: `dust` fixed fight at the front door (not: dustDone). Before mochaJoined, use `ch1.home.doorLocked`.
```
旁白：大門口，兩顆灰塵球滾來滾去。
mocha：「哈啾！被風吹醒的灰塵球。」
mocha：「點『攻擊』打牠們，打完就會乖了。」
[battle dustBunny, dustBunny]
[flag dustDone]
旁白：灰塵球頭暈暈，滾回沙發底下去了。
mocha：「門，交給我。」
旁白：摩卡貓一跳，掛在門把上——喀。
mocha：「我一直都會開門。只是平常懶得開。」
```

### ch1.home.doorLocked
(Blocked exit and early dust talk.)
```
旁白：門把好高，寶咖咖搆不到。
```

**Chests (home):** `home-bib` crib → 口水巾 · `home-flipflops` shoe rack → 藍白拖

---

### ch1.daan.intro
(Entry trigger, once.)
```
旁白：大安森林公園。半夜的樹，好高好高。
旁白：落葉自己在地上，轉圈圈。
mocha：「風是往這邊吹的。寶物應該掉在附近。」
mocha：「草地上會有搗蛋鬼。打不過就『逃跑』。」
```

### ch1.daan.uncle.first / .again
talk: `uncleSweep`: `[{ when: 'stampBook', event: 'ch1.daan.uncle.again' }, { event: 'ch1.daan.uncle.first' }]`

**ch1.daan.uncle.first**
```
uncleSweep：「呵呵，囡仔，這麼晚還沒睏？」
mocha：「……一個掃地的阿伯？半夜？」
uncleSweep：「風一吹，葉子就亂，阿伯就要掃。」
uncleSweep：「你們在找東西齁？」
baokaka：「這個！」
mocha：「他說：『我們在找九樣寶物，』」
mocha：「『和一片金鎖片。時間不多了。』」
uncleSweep：「呵呵，講得真清楚。」
uncleSweep：「來，這本給你們。」
[flag stampBook]
旁白：得到「集章本」！
uncleSweep：「台北每個好所在，都有一個紀念章。」
uncleSweep：「看到章台，就蓋一下，做紀念。」
uncleSweep：「蓋滿了，阿伯有禮物。」
uncleSweep：「啊，音樂台那邊的葉子，阿伯掃掉了。」
uncleSweep：「松鼠啊，最愛把東西藏在那後面。」
uncleSweep：「慢慢仔來，呵呵。」
```

**ch1.daan.uncle.again**
```
uncleSweep：「呵呵，慢慢仔來。」
uncleSweep：「走累了，溜滑梯那邊可以躺一下。」
```

### ch1.daan.leaves
talk: `leafPile` (not: stampBook)
```
旁白：落葉堆得好高，過不去。
mocha：「去問問附近的人吧。」
```

### ch1.daan.runner.first / .after
talk: `runner`: `[{ when: 'squirrelDone', event: 'ch1.daan.runner.after' }, { event: 'ch1.daan.runner.first' }]`

**ch1.daan.runner.first**
```
runner：「呼、呼……弟弟，這麼晚還在散步？」
runner：「我跟你說，剛剛有一陣好怪的風！」
runner：「從我旁邊颳過去，像一台機車那麼大！」
runner：「呼……我要繼續跑了。第八圈。」
mocha：「……機車那麼大。」
```

**ch1.daan.runner.after**
```
runner：「第十二圈！今天跑得特別順。」
runner：「風停了耶。你們做了什麼嗎？」
```

### ch1.daan.turtle
talk: `turtle`
```
turtle：「…………」
turtle：「…………年輕人…………」
turtle：「…………風…………在…………哭…………」
mocha：「哭？」
turtle：「…………晚安…………」
旁白：烏龜縮回殼裡了。
```

### ch1.daan.clerk
talk: `clerk`
```
[flag clerk_daan]
clerk：「叮咚～歡迎光臨！」
clerk：「半夜也有開，因為我們是便利商店。」
[shop teaEgg, pineappleCake, douhua, flipFlops]
```

### ch1.daan.slide
talk: `slide` (decor-NPC)
```
旁白：溜滑梯下面，有一塊軟軟的沙地。
[inn 0]
```

### stamp.daan
```
旁白：公園入口，有一個紀念章台。
旁白：蓋——！「大安森林公園」，一棵大樹的章。
[flag stamp_daan]
```

### ch1.daan.boss
talk: `squirrel` (not: squirrelDone)
```
旁白：音樂台上，有一隻胖胖的松鼠。
旁白：戴著瓶蓋皇冠，抱著一根綠綠的東西。
squirrel：「這根綠綠長長的堅果是我的！」
mocha：「那是蔥。」
squirrel：「是堅果！很長的堅果！」
baokaka：「這個！」
mocha：「他說：『那是我抓周要用的蔥，』」
mocha：「『代表聰明。請你還給我。』」
squirrel：「聽不懂！看招！」
mocha：「牠『藏起來』的時候在防禦。」
mocha：「那回合先補體力，再打。」
[boss squirrelKing]
[flag squirrelDone]
squirrel：「頭……頭暈暈……」
squirrel：「好啦……這個堅果咬不動，還你。」
[flag got_scallion]
旁白：拿回了「蔥」！（聰明）
[coins 30]
squirrel：「剛剛有一朵雲，把它丟在這裡。」
squirrel：「它一邊飛一邊哭，往台大那邊去了。」
mocha：「一朵……會哭的雲？」
mocha：「走吧。西邊，新生南路的出口。」
```

### ch1.daan.exitBlocked
```
mocha：「蔥還沒拿回來。不能走。」
```

**Chests (daan):** `daan-cake` playground → 鳳梨酥 ×2 · `daan-douhua` behind the pond → 豆花 · `daan-eggs` jogging loop → 茶葉蛋 ×3

---

## 第二章 椰林大道的藍教授 — 台灣大學

### ch2.intro
```
[chapter 2｜椰林大道的藍教授｜00:40]
旁白：台灣大學。椰子樹排成長長一條。
旁白：到處都是腳踏車，有的還自己在動。
mocha：「大學生半夜都不睡覺的嗎？」
```

### ch2.ntu.student.first / .after
talk: `student`: `[{ when: 'gooseDone', event: 'ch2.ntu.student.after' }, { event: 'ch2.ntu.student.first' }]`

**ch2.ntu.student.first**
```
student：「啊！嚇我一跳。是貓……和寶寶？」
student：「我明天期末考，今天要讀通宵。」
student：「剛剛一陣大風，把我的筆記吹走了！」
student：「那陣風，像一台公車那麼大！」
mocha：「……剛剛不是說機車嗎？」
student：「什麼機車？我說公車。」
```

**ch2.ntu.student.after**
```
student：「書找回來了？好羨慕……」
student：「我也想抓周。我要抓枕頭。」
旁白：大學生，趴在電腦上睡著了。
```

### ch2.ntu.uncle.first / .again
talk: `uncleJanitor`: `[{ when: 'janitorGave', event: 'ch2.ntu.uncle.again' }, { event: 'ch2.ntu.uncle.first' }]`

**ch2.ntu.uncle.first**
```
uncleJanitor：「呵呵，囡仔，這麼晚還來上課？」
mocha：「……你長得好像公園那個阿伯。」
uncleJanitor：「阿伯都長這樣啦，呵呵。」
uncleJanitor：「要找東西，去問文學院那隻藍色的鳥。」
uncleJanitor：「伊什麼都知道。至少，伊說伊知道。」
uncleJanitor：「來，喝這個，有元氣。」
[give bubbleTea]
[flag janitorGave]
旁白：得到 珍珠奶茶！
```

**ch2.ntu.uncle.again**
```
uncleJanitor：「慢慢仔來。湖邊比較冷，穿暖一點。」
```

### ch2.ntu.magpie.first / .again
talk: `magpieNpc` on the 文學院 ledge (not: gooseDone): `[{ when: 'metMagpie', event: 'ch2.ntu.magpie.again' }, { event: 'ch2.ntu.magpie.first' }]`

**ch2.ntu.magpie.first**
```
旁白：文學院的窗台上，站著一隻藍色的鳥。
旁白：戴著小小的圓眼鏡，尾巴好長好長。
magpieNpc：「咳咳。站住，閒雜人等。」
magpieNpc：「我是本校的，藍教授。」
mocha：「台大有鳥當教授？」
magpieNpc：「呃……我在這個窗戶旁聽三年了。」
magpieNpc：「我學富五車。五台腳踏車。」
mocha：「……那個成語不是這樣用的。」
magpieNpc：「根據我的研究，你們在找一本書。」
baokaka：「要！」
mocha：「他說：『是的教授，那是我抓周的書，』」
mocha：「『代表會讀冊。麻煩告訴我們在哪。』」
magpieNpc：「……他只說了一個字吧？」
mocha：「我很懂他。」
magpieNpc：「書，被醉月湖的鵝霸搶走了。」
magpieNpc：「湖邊被腳踏車堵住。從圖書館穿過去。」
magpieNpc：「我？不不不。教授不打架。」
magpieNpc：「我會在旁邊……觀察。」
[flag metMagpie]
```

**ch2.ntu.magpie.again**
```
magpieNpc：「從圖書館穿過去，後門就是湖邊。」
magpieNpc：「鵝霸很兇。我只是……提醒一下。」
```

### ch2.ntu.bikes
talk: `bikePile` (not: metMagpie)
```
旁白：腳踏車堆成一座小山，過不去。
mocha：「也許有人知道別條路。」
```

### ch2.ntu.lounge
talk: `lounge` (doorway)
```
旁白：宿舍交誼廳的沙發，軟軟的。
旁白：門口貼著：「借睡一下，十個銅板」。
[inn 10]
```

### ch2.ntu.clerk
talk: `clerk`
```
[flag clerk_ntu]
clerk：「叮咚～歡迎光臨！」
clerk：「……咦？你們剛剛是不是來過？」
mocha：「你剛剛是不是在公園？」
clerk：「我們是連鎖的。」
[shop teaEgg, pineappleCake, douhua, flipFlops]
```

### stamp.ntu
```
旁白：傅鐘下面，有一個紀念章台。
旁白：蓋——！「台灣大學・傅鐘」。
[flag stamp_ntu]
```

### ch2.ntu.boss
talk: `goose` at the 湖心亭 (not: gooseDone)
```
旁白：湖心亭裡，一隻大白鵝正在看書。
旁白：書，拿反了。
goose：「鵝鵝鵝！這本書我正在研究！」
mocha：「你書拿反了。」
goose：「這叫……逆向思考！」
旁白：咻——一道藍色的影子飛了過來。
magpieNpc：「我、我只是來觀察的。」
goose：「喲，這不是旁聽生嗎？」
goose：「一隻旁聽的鳥，也敢來湖邊？」
magpieNpc：「…………」
magpieNpc：「誰說旁聽生不能下場！」
[join magpie]
[flag magpieJoined]
旁白：阿藍加入了隊伍！
magpie：「我的『羽毛雨』，可以打到所有敵人。」
magpie：「這叫……一石二鳥！」
mocha：「拜託不要在打鳥的時候講這個。」
mocha：「……還有，離水遠一點。我討厭水。」
goose：「鵝鵝鵝！放馬過來！」
[boss gooseBully]
[flag gooseDone]
goose：「鵝……鵝……我認輸……」
goose：「其實我看不懂字。我只是想當教授。」
magpie：「……我懂。」
magpie：「明天開始，來窗戶旁邊，一起旁聽吧。」
[flag got_book]
旁白：拿回了「書」！（會讀冊）
[coins 45]
goose：「書是從天上掉下來的。」
goose：「那朵雲，一邊哭一邊說『台北車站』。」
goose：「說它掉了一個亮亮的東西在那裡。」
```

### ch2.ntu.moonline
(Runs immediately after `ch2.ntu.boss`. Append it to the same Step list, or chain it with a once-trigger on the 湖心亭 bridge `when: gooseDone`.)
```
mocha：「台北車站？用走的，會走到天亮。」
magpie：「根據我的研究——」
magpie：「末班車開走之後，捷運還有一班車。」
magpie：「叫做『月亮線』。」
magpie：「只載不睡覺的東西。」
magpie：「貓頭鷹、暗光鳥、風……還有我們。」
baokaka：「要！」
magpie：「從台大正門出去，就是公館站。」
magpie：「出發吧，同學們！」
mocha：「……誰是你同學。」
```

### ch2.ntu.exitBlocked
```
mocha：「書還沒拿回來。」
```

**Chests (ntu):** `ntu-cap` library steps → 學士帽 · `ntu-cake` bike rack → 鳳梨酥 ×2 · `ntu-douhua` azaleas → 豆花 ×2


### ch2.ntuLibrary.intro
(Entry trigger on `ntuLibrary`, the 總圖 reading room, once. This is the new route to the lake. The bike pile stays put.)
```
旁白：總圖書館。裡面只亮著一盞一盞小燈。
旁白：書架，高得像山一樣。
旁白：地上，散著好幾堆被風吹倒的書。
magpie：「圖書館裡，要安靜。」
quietSprite：「噓——」
quietSprite：「書倒了，後門就不開。噓。」
quietSprite：「把三堆書排好，門就會開。噓。」
```

### ch2.ntuLibrary.book1 / book2 / book3
talk: `bookPile1`, `bookPile2`, `bookPile3` (each `not: bookN`)

**ch2.ntuLibrary.book1**
```
旁白：一堆歷史書。好重。
旁白：寶咖咖，一本一本推回書架。
magpie：「歷史，要照年代排。」
mocha：「他是用推的，不是用排的。」
[flag book1]
```

**ch2.ntuLibrary.book2**
```
旁白：一堆食譜。封面都是好吃的東西。
baokaka：「餓餓。」
mocha：「先排，再餓。」
[flag book2]
```

**ch2.ntuLibrary.book3**
```
旁白：一堆繪本。寶咖咖坐下來，開始看。
mocha：「……寶咖咖。」
baokaka：「好看！」
mocha：「排完再看。」
旁白：寶咖咖把繪本抱在懷裡，排好了。
[flag book3]
```

### ch2.ntuLibrary.quiet / .door
talk: `quietSprite`: `[{ when: 'libraryDone', event: 'ch2.ntuLibrary.quiet' }, { when: 'libraryReady', event: 'ch2.ntuLibrary.door' }, { event: 'ch2.ntuLibrary.quiet' }]`
(`libraryReady` = derived from `book1`, `book2`, `book3`.)

**ch2.ntuLibrary.quiet**
```
quietSprite：「噓。」
```

**ch2.ntuLibrary.door**
```
quietSprite：「排好了。謝謝。噓。」
旁白：喀——圖書館的後門，打開了。
旁白：門外，就是醉月湖。
[flag libraryDone]
```

### sq.magpie.note1
talk: `lectureNote1` on a library desk (not `note1`)
```
旁白：桌上，有一張被吹亂的筆記。
旁白：「什麼是盆地？——地理學概論」
magpie：「這、這是我旁聽的課！」
magpie：「那天下雨，我沒抄到這一頁。」
mocha：「拿去啊。」
magpie：「……可以嗎？」
[flag note1]
旁白：得到「旁聽筆記（一）」！
magpie：「如果……集滿三頁的話……」
magpie：「呃，沒事。」
```


---

## 第三章 月亮線，出發！ — 台北車站

### ch3.intro
(Entry trigger, once. Includes the first Moon Line ride, so the bible's `ch3.ride` is folded in here.)
```
[chapter 3｜月亮線，出發！｜02:00]
旁白：公館站。最後一班車，早就開走了。
旁白：月台上，亮起一道銀白色的光。
旁白：一列有月亮形窗戶的列車，靜靜進站。
announcer：「月亮線，列車進站。」
announcer：「請勿超越黃色警戒線。」
announcer：「下一站，台北車站。」
announcer：「下一站，台北車頭。」
announcer：「Next station, Taipei Main Station.」
mocha：「……還有台語跟英文。」
magpie：「這是捷運的傳統。」
旁白：叮咚叮咚——門關上了。
旁白：……
旁白：台北車站。黑白格子的大廳，空蕩蕩的。
旁白：遠遠的，傳來一陣聲音——
旁白：「嗶——！嗶——！嗶——！」
magpie：「台北車站是有名的迷宮。跟緊我。」
mocha：「你上次迷路是什麼時候？」
magpie：「……上個禮拜。」
```

### ch3.station.announcer.first / .stamp / .again
talk: `announcer`: `[{ when: 'moonPass', event: 'ch3.station.announcer.again' }, { when: 'gateDone', event: 'ch3.station.announcer.stamp' }, { event: 'ch3.station.announcer.first' }]`

**ch3.station.announcer.first**
```
旁白：服務台後面，站著一位發光的姊姊。
announcer：「旅客您好，這裡是月亮線服務台。」
announcer：「搭乘月亮線，需要『月亮票』。」
[flag moonTicket]
旁白：得到「月亮票」！（還沒蓋章）
announcer：「月亮票要蓋上站長印章，才能使用。」
announcer：「可是，印章被閘門吃掉了。」
announcer：「所有閘門都壞了，一直嗶嗶叫。」
announcer：「請旅客協助處理。謝謝您的合作。」
mocha：「……她講話都這樣嗎？」
magpie：「這叫專業。」
```

**ch3.station.announcer.stamp**
```
announcer：「旅客您好。印章，找回來了呢。」
announcer：「借我用一下。」
旁白：蓋——！月亮票上，出現一個彎彎的月亮。
[flag moonPass]
announcer：「月亮線，全線為您服務。」
announcer：「從月台上車，可以到台北很多地方。」
announcer：「印章，請收好。」
mocha：「然後，下一站去哪？」
announcer：「剛剛有一陣風，往西門的方向。」
announcer：「還一邊唱歌。走音的那種。」
```

**ch3.station.announcer.again**
```
announcer：「月亮線，往月台請走樓梯。」
announcer：「搭車時，請緊握扶手。」
announcer：「並請讓座給需要的旅客。」
baokaka：「我！」
announcer：「是的。寶寶可以坐博愛座。」
```

### ch3.station.uncle.first / .again
talk: `uncleStation`: `[{ when: 'stationUncleGave', event: 'ch3.station.uncle.again' }, { event: 'ch3.station.uncle.first' }]`

**ch3.station.uncle.first**
```
uncleStation：「呵呵，囡仔，坐車喔？」
mocha：「……又是你？」
uncleStation：「阿伯都長這樣，呵呵。」
uncleStation：「地下街像迷宮。看招牌，別看指標。」
uncleStation：「指標會自己亂跑，呵呵。」
uncleStation：「肚子餓了吧？阿伯請你們吃便當。」
[give railBento]
[flag stationUncleGave]
旁白：得到 鐵路便當！
```

**ch3.station.uncle.again**
```
uncleStation：「慢慢仔來。車站人多，跟好喔。」
```

### ch3.station.cleaner / .after
talk: `cleaner`: `[{ when: 'gateDone', event: 'ch3.station.cleaner.after' }, { event: 'ch3.station.cleaner' }]`

**ch3.station.cleaner**
```
cleaner：「哎唷，嚇死人，半夜有寶寶。」
cleaner：「剛剛有一陣風，從大廳咻一下過去。」
cleaner：「像一整列火車那麼大！」
mocha：「機車、公車、火車……」
magpie：「這叫……以訛傳訛。」
mocha：「這次用對了。」
magpie：「我一直都用對。」
```

**ch3.station.cleaner.after**
```
cleaner：「閘門終於安靜了。阿姨可以拖地了。」
```

### ch3.station.backpacker
talk: `backpacker`
```
backpacker：「Excuse me… where is 101?」
baokaka：「ㄅㄚ！」
mocha：「他說：『我們也要去那裡，』」
mocha：「『但是現在還不行，請你先等等。』」
backpacker：「Wow… a very smart baby.」
magpie：「他說：『好聰明的寶寶。』」
mocha：「這句我也聽得懂。」
```

### ch3.station.bento
talk: `bento`
```
bento：「便當～便當～熱騰騰的鐵路便當～」
[shop railBento, teaEgg, pineappleCake, bubbleTea]
```

### ch3.station.clerk
talk: `clerk`
```
[flag clerk_station]
clerk：「叮咚～歡迎光臨！」
mocha：「你到底有幾個？」
clerk：「我們是連鎖的。」
[shop teaEgg, pineappleCake, douhua, bubbleTea, flipFlops]
```

### ch3.station.floor
talk: `floorSpot` (a few glowing travellers sitting on the checkered floor)
```
旁白：大廳的地板上，坐著好幾個發光的旅客。
旁白：大家都坐在黑白格子上休息。
旁白：你們也坐一下吧。
[inn 0]
```

### stamp.station
```
旁白：服務台旁邊，有一個紀念章台。
旁白：蓋——！「台北車站」，一列小火車的章。
[flag stamp_station]
```

### ch3.station.boss
talk: `gate` in the middle of the turnstile row (not: gateDone)
```
旁白：一整排閘門，擠成了一個大巨人。
旁白：臉是一台刷卡機，眼睛是紅色的叉叉。
gate：「嗶——！餘額不足！」
mocha：「我們根本還沒刷。」
gate：「嗶——！請重新感應！」
baokaka：「不要！」
gate：「嗶嗶嗶嗶嗶！」
magpie：「它『請重新感應』的時候在防禦。」
magpie：「那時候補體力，等它打開再打！」
[boss gateGolem]
[flag gateDone]
旁白：巨人的眼睛，從紅叉叉變成綠圈圈。
gate：「嗶。……謝謝搭乘。」
gate：「肚子裡卡了一個東西，好不舒服。」
旁白：喀啦——一顆印章掉了出來。
[flag got_seal]
旁白：拿回了「印章」！（做頭家）
[coins 60]
gate：「祝您旅途愉快。嗶。」
mocha：「拿去服務台，給姊姊蓋章吧。」
```

### ch3.station.platformBlocked
```
旁白：月台的入口，有閘門擋著。
mocha：「月亮票沒蓋章，進不去。」
```

**Chests (station, 地下街):** `station-tea` → 珍珠奶茶 ×2 · `station-turtle` → 紅龜粿 · `station-cake` → 鳳梨酥 ×3


### ch3.underground.intro
(Entry trigger on `underground`, the 地下街, once. **The mid-chapter gate:** the turnstile hall is only reachable through the 地下街; the hall's front is blocked by a 「施工中」 barrier.)
```
旁白：地下街。商店都關了，招牌還亮著。
旁白：每一個轉角，都有好多好多指標。
旁白：有的往左，有的往右，有的……在轉圈。
magpie：「阿伯說：看招牌，別看指標。」
```

### ch3.underground.sign1 / sign2 / sign3
talk: `shopSign1..3` (lit shop signs at three corners, each `not: signN`)

**ch3.underground.sign1**
```
旁白：一塊亮亮的便當店招牌。
旁白：上面的小字寫著：「閘門？往書店走。」
[flag sign1]
```

**ch3.underground.sign2**
```
旁白：一塊書店的招牌，燈一閃一閃。
旁白：「閘門？往有鞋子的那家走。」
mocha：「招牌比指標可靠多了。」
[flag sign2]
```

**ch3.underground.sign3**
```
旁白：一塊鞋店的招牌。
旁白：「閘門？直走，上樓梯。辛苦了。」
magpie：「招牌還會說辛苦了。」
[flag sign3]
```
(`mazeSolved` is derived from `sign1`–`sign3`. It opens the stairs exit to the turnstile hall; the blocked event is `ch3.underground.lost`.)

### ch3.underground.lost
```
旁白：走著走著……又回到原來的地方了。
mocha：「看招牌。別看指標。」
```

### ch3.underground.signKing (optional mini-boss)
talk: `signKing` in a dead end (not: signKingDone)
```
旁白：死巷子裡，有一個好大好大的指標。
旁白：上面，有一百個箭頭。
signKing：「往這！往那！往上！往下！」
magpie：「往上？這裡是地下耶。」
signKing：「那就往更下面！」
[boss signKing]
[flag signKingDone]
signKing：「……其實，我也不知道出口在哪。」
signKing：「我只是想，被大家看一眼。」
[give railBento ×2]
[coins 50]
旁白：得到 鐵路便當 ×2 和 50 個銅板！
```

### sq.lostFound.notes (find)
talk: `lfNotes` on the 地下街 floor (not `lf_notes`)
```
旁白：地上，有一本被踩扁的筆記本。
旁白：封面寫著：「期末考　必考！！」
mocha：「是台大那個爆肝大學生的。」
[flag lf_notes]
旁白：撿到「大學生的筆記」。（失物招領）
```

### sq.backpacker.map (find)
talk: `bpMapItem` in the 地下街 (not `bp_map`)
```
旁白：一張好大的地圖，卡在鐵捲門下面。
旁白：上面用英文寫著：「My Taipei Map」。
mocha：「背包客的。」
[flag bp_map]
```


---

## 月亮線 — 搭捷運 (MRT system)

See `story-bible.md` § 3.1 for how this works. In short:
1. **Entrances.** Every landmark map has an MRT entrance NPC (`mrtGate`).
2. **Travel screen.** Its `[travel]` step opens the 路線圖 (line-map) screen.
3. **Ride.** Picking a lit station puts the party in a **ride car** themed after that station's line. The ambient trigger plays; the party can walk around the car, talk to passengers, and sit on the 博愛座.
4. **Arrive.** Walking out the door arrives at `{station}`.

`{station}` / `{stationTw}` / `{stationEn}` are substituted from the `STATIONS` table. Every expanded line must stay ≤ 40 chars; English names get their own line.

### mrt.closed
talk: `mrtGate` when not `moonPass` (daan, ntu, station)
```
旁白：捷運站的鐵門拉下來了。
旁白：末班車，早就開走了。
```

### mrt.enter
talk: `mrtGate` when `moonPass`
```
旁白：嗶——！
旁白：月亮票一嗶，閘門就開了。
[travel]
```

### mrt.newStation
(Shown by the travel screen once, the first time it opens after a new station unlocks. One line plus the dot animation.)
```
旁白：叮！路線圖上，又有一站亮起來了。
```

### mrt.locked
(Tapping a grey station on the travel screen.)
```
旁白：這一站的燈，還沒亮。
```

### Ambient ride announcements
(The car's entry trigger, every ride. Door chime SFX first: 叮咚叮咚.)

**ride.red** (淡水信義線 car)
```
旁白：叮咚叮咚——門關上了。
announcer：「下一站，{station}。」
announcer：「下一站，{stationTw}。」
announcer：「Next station, {stationEn}.」
announcer：「請緊握扶手，站穩。」
```

**ride.blue** (板南線 car)
```
旁白：叮咚叮咚——門關上了。
announcer：「下一站，{station}。」
announcer：「Next station, {stationEn}.」
announcer：「車門即將關閉，請勿強行上下車。」
```

**ride.brown** (文湖線 car, driverless, with the front window)
```
旁白：叮咚叮咚——小小的車廂，輕輕動了。
announcer：「下一站，{station}。」
announcer：「Next station, {stationEn}.」
旁白：前面的大窗戶外，軌道像一條銀色的路。
```

**ride.green** (松山新店線 car)
```
旁白：叮咚叮咚——門關上了。
announcer：「下一站，{station}。」
announcer：「Next station, {stationEn}.」
announcer：「請讓座給需要的旅客，謝謝。」
```

**ride.orange** (中和新蘆線 car)
```
旁白：叮咚叮咚——門關上了。
announcer：「下一站，{station}。」
announcer：「Next station, {stationEn}.」
announcer：「車廂內很擁擠，請往車廂中間移動。」
mocha：「……車廂裡只有我們。」
```

### First ride on each line (once-trigger one tile into the car)

**ride.blue.first** (first trip to 西門, Ch4)
```
旁白：藍色的車廂。板南線。
magpie：「根據我的研究，這是台北最忙的一條線。」
magpie：「白天，人多到腳不用碰地板。」
mocha：「那很適合寶咖咖。他本來就不會走。」
旁白：寶咖咖抓住了吊環。……抓不到。
旁白：他改抓摩卡貓的尾巴。
mocha：「……請緊握扶手，不是緊握我。」
```

**ride.orange.first** (first trip to 大橋頭, Ch6)
```
旁白：橘色的車廂。中和新蘆線。
magpie：「這條線，以擠出名。」
magpie：「上班的時候，大家都貼在一起。」
mocha：「擠？貓最會擠了。」
mocha：「貓是液體。哪裡都塞得進去。」
旁白：摩卡貓，把自己塞進了座位底下。
magpie：「……這叫……無孔不入？」
mocha：「這次我不確定。」
```

**ride.red.first** (first trip to 劍潭, Ch7)
```
旁白：紅色的車廂。淡水信義線。
旁白：列車開著開著——咻，開出了地面！
旁白：窗外，整個台北的燈，一閃一閃。
baokaka：「哇！」
magpie：「紅線從地下鑽出來，變成高架。」
magpie：「從這裡，可以一路開到淡水。」
mocha：「……還有，一路開到101。」
旁白：遠遠的，101的頂端，有一團雲在轉。
```

**ride.brown.first** (first trip to 松山機場, Ch8)
```
旁白：棕色的小車廂。文湖線。
旁白：車廂最前面，是一整片大窗戶。
旁白：寶咖咖爬到窗戶前面，貼好。
mocha：「他說：『我是駕駛。』」
magpie：「文湖線，沒有駕駛。是自動的。」
旁白：……
mocha：「那，是誰在開？」
announcer：「是我。」
mocha：「…………」
announcer：「忠孝復興站，轉乘板南線。」
announcer：「請下一站下車：松山機場。」
旁白：窗外，經過了一排睡著的飛機。
baokaka：「……飛、飛……」
baokaka：「飛機！」
mocha：「……！他會說飛機了。」
magpie：「第一個學會的交通工具。」
mocha：「不會說爸爸，先會說飛機。」
```
(**飛機！** joins Baokaka's vocabulary from here on.)

**ride.green.first** (first trip back to 公館, optional)
```
旁白：綠色的車廂。松山新店線。
旁白：座位上，一個阿公抱著釣竿在睡覺。
mocha：「這麼晚還要去釣魚？」
旁白：阿公說夢話：「碧潭……天鵝船……」
magpie：「綠線的終點，可以划天鵝船。」
mocha：「……我討厭水。」
```

### Ride-car passengers (optional, flag variants)

**ride.brown.window** (talk: `frontWindow` in the brown car, after `ride.brown.first`)
```
旁白：寶咖咖又貼在大窗戶前面了。
baokaka：「飛機！」
mocha：「這裡看不到飛機。」
baokaka：「飛機！」
mocha：「……好啦，假裝有。」
```

**ride.orange.squished** (talk: `squishedWorker` in the orange car)
```
旁白：一個上班族，貼在門上，扁扁的。
squishedWorker：「車廂……空空的……」
squishedWorker：「可是我習慣了……貼著比較安心……」
[flag rider_squished]
```

Moved here from the old hub: `moonline.salaryman` (blue car), `moonline.owl` (red car, shop), `moonline.priority` / `.bear` (one 博愛座 NPC in every car), and `gag.moonline.noEating` (orange car).

### Optional car fights
(One NPC per car, once each. A stray creature that hopped on the train.)

**ride.blue.fight** (talk: `strayImps`, not `carFightBlue`)
```
旁白：兩個指標小鬼，在車廂裡亂指。
旁白：「下一站往這邊！不對，往那邊！」
[battle signImp, signImp]
[flag carFightBlue]
旁白：指標小鬼，在下一站下車了。
```

**ride.orange.fight** (talk: `strayCard`, not `carFightOrange`)
```
旁白：一張迷路的交通卡，在車廂裡飛來飛去。
旁白：「嗶！嗶！我的主人呢？嗶！」
[battle strayCard]
[flag carFightOrange]
旁白：交通卡乖乖飄進了失物招領箱。
```

**ride.red.fight** (talk: `strayCards`, not `carFightRed`)
```
旁白：兩張交通卡，在玩你追我跑。
[battle strayCard, strayCard]
[flag carFightRed]
旁白：「嗶……餘額……充足……」它們睡著了。
```

**ride.brown.fight** (talk: `lostLight`, not `carFightBrown`; appears `when: windsockDone`)
```
旁白：一顆跑道燈，跟著上車了。
旁白：一閃一閃，好像在說：「降落在這裡！」
[battle runwayLight, strayCard]
[flag carFightBrown]
旁白：跑道燈，自己滾回機場去了。
```

### moonline.announcer.* (路線圖 hints)
Now the talk rules of the `lineMap` decor-NPC in every car, in this order:
`[{when:'cleared',event:'moonline.announcer.post'}, {when:'metShushu',event:'moonline.announcer.to101'}, {when:'eggDone',event:'moonline.announcer.toTamsui'}, {when:'teapotDone',event:'moonline.announcer.toBeitou'}, {when:'windsockDone',event:'moonline.announcer.toZoo'}, {when:'cutletDone',event:'moonline.announcer.toAirport'}, {when:'dragonDone',event:'moonline.announcer.toShilin'}, {when:'karaokeDone',event:'moonline.announcer.toDadaocheng'}, {event:'moonline.announcer.toXimen'}]`

**moonline.announcer.toAirport**
```
announcer：「推薦下車站：松山機場。文湖線。」
announcer：「飛機們，都睡著了。」
```

**moonline.announcer.toXimen**
```
announcer：「推薦下車站：西門。」
announcer：「聽說那裡，有人唱歌很……特別。」
```

**moonline.announcer.toDadaocheng**
```
announcer：「推薦下車站：大橋頭，大稻埕。」
announcer：「那裡的布，在天上飛。」
```

**moonline.announcer.toShilin**
```
announcer：「推薦下車站：劍潭，士林夜市。」
announcer：「有很香、很香的味道。」
```

**moonline.announcer.toZoo**
```
announcer：「推薦下車站：動物園。」
announcer：「有一位大個子，躲起來了。」
```

**moonline.announcer.toBeitou**
```
announcer：「推薦下車站：新北投。」
announcer：「熱呼呼的地方。」
```

**moonline.announcer.toTamsui**
```
announcer：「推薦下車站：淡水。」
announcer：「河的盡頭。」
```

**moonline.announcer.to101**
```
announcer：「推薦下車站：台北101。」
announcer：「……請注意，強風特報。」
announcer：「請緊握扶手。」
```

**moonline.announcer.post**
```
announcer：「本列車，下一站：象山。」
announcer：「看日出，最好的地方。」
```

### moonline.salaryman / .late
talk: `salaryman`: `[{ when: 'bearJoined', event: 'moonline.salaryman.late' }, { event: 'moonline.salaryman' }]`

**moonline.salaryman**
```
旁白：一隻打著領帶的暗光鳥，在打瞌睡。
salaryman：「呼……加班到現在……」
salaryman：「月亮線，是我唯一的朋友。」
[flag rider_salaryman]
```

**moonline.salaryman.late**
```
salaryman：「……那隻熊好大。」
salaryman：「可是他很有禮貌。我喜歡。」
```

### moonline.priority / .bear
talk: `prioritySeat` (博愛座 sign): `[{ when: 'bearJoined', event: 'moonline.priority.bear' }, { event: 'moonline.priority' }]`

**moonline.priority**
```
旁白：寶咖咖爬上了博愛座。
旁白：很合理。
```

**moonline.priority.bear**
```
bear：「這、這個位子……我可以坐嗎？」
announcer：「博愛座，請讓座給需要的旅客。」
bear：「我、我是保育類……」
announcer：「……保育類動物，可以。」
bear：「謝、謝謝。」
旁白：黑糖小心地坐下。座位發出好大的聲音。
bear：「歹、歹勢！」
```

### moonline.owl
talk: `owl` (shop)
```
owl：「咕咕，乖孩子，這麼晚還在外面。」
owl：「奶奶織毛線，也賣一點吃的。」
[flag rider_owl]
[shop teaEgg, pineappleCake, douhua, bubbleTea, railBento, redTurtleCake]
```

---

## 第四章 紅樓的走音天王 — 西門町

### ch4.intro
```
[chapter 4｜紅樓的走音天王｜01:35]
旁白：西門町。半夜兩點多，霓虹燈還是好亮。
旁白：紅樓那邊，傳來一陣……歌聲？
旁白：「我的～麥克風～閃閃～亮～～」
mocha：「……我的耳朵。」
magpie：「這叫……餘音繞樑，三日不絕。」
mocha：「用對了。可是好可怕。」
```

### ch4.ximen.dancers / .after
talk: `dancer`: `[{ when: 'karaokeDone', event: 'ch4.ximen.dancers.after' }, { event: 'ch4.ximen.dancers' }]`

**ch4.ximen.dancers**
```
dancer：「Yo！小寶寶，你也來練舞喔？」
dancer：「剛剛那陣風，超大！」
dancer：「像一整條街那麼大！帽子都吹走了！」
mocha：「已經變成一條街了。」
baokaka：「咻——！」
旁白：寶咖咖趴在地上，轉了一圈。
dancer：「哇！這個寶寶會地板動作！」
```

**ch4.ximen.dancers.after**
```
dancer：「歌聲停了！終於可以放自己的音樂了！」
dancer：「寶寶，下次一起來跳！」
```

### ch4.ximen.uncle.first / .again
talk: `uncleFortune`: `[{ when: 'fortuneDone', event: 'ch4.ximen.uncle.again' }, { event: 'ch4.ximen.uncle.first' }]`

**ch4.ximen.uncle.first**
```
uncleFortune：「呵呵，囡仔，來，算一個。」
mocha：「…………」
mocha：「我是不是在哪裡看過你？」
uncleFortune：「阿伯是大眾臉，呵呵。」
uncleFortune：「我看看……嗯……」
uncleFortune：「今晚，你們會遇到很多貴人。」
uncleFortune：「還有，一朵雲。」
uncleFortune：「那朵雲啊，不是壞孩子。」
uncleFortune：「不用錢啦，呵呵。慢慢仔來。」
[flag fortuneDone]
```

**ch4.ximen.uncle.again**
```
uncleFortune：「紅樓前面的招牌，閃得人眼花。」
uncleFortune：「眼睛瞇一點，就不怕。」
```

### ch4.ximen.noodle
talk: `noodle`
```
noodle：「麵線～麵線～」
noodle：「麵線賣完了啦。這些，你們帶著吃。」
[shop douhua, pineappleCake, bubbleTea, chickenCutlet]
```

### ch4.ximen.clerk
talk: `clerk`
```
[flag clerk_ximen]
clerk：「叮咚～歡迎光臨！」
mocha：「…………」
clerk：「…………」
clerk：「我們是連鎖的。」
[shop teaEgg, pineappleCake, douhua, bubbleTea, helmet]
```

### ch4.ximen.backpacker
talk: `backpacker`
```
backpacker：「Hello again! Where is 101?」
baokaka：「ㄅㄚ！」
mocha：「他說：『還沒。還要再等一下，』」
mocha：「『先去吃個麵線，我們會在那裡見。』」
backpacker：「Okay! Mian-xian!」
```

### ch4.ximen.cinema
talk: `cinema` (doorway)
```
旁白：電影院的午夜場，最後一排沒有人。
[inn 15]
```

### stamp.ximen
```
旁白：紅樓前面，有一個紀念章台。
旁白：蓋——！「西門紅樓」，八角形的章。
[flag stamp_ximen]
```

### ch4.ximen.neon
talk: `neon` fixed fight in front of the 紅樓 plaza (not: neonDone)
```
旁白：紅樓前面，三個霓虹招牌擋住了路。
neon：「閃閃！看我們！我們最亮！」
mocha：「……好刺眼。」
[battle neonSign, neonSign, neonSign]
[flag neonDone]
旁白：招牌們的燈，一個一個暗了下來。
neon：「……其實，我們只是想被看到。」
magpie：「大家都一樣啦。」
```

### ch4.ximen.mochaTalk
(Trigger on the 6號出口 bench, `when: neonDone`, once.)
```
旁白：6號出口的長椅。摩卡貓跳上去，坐好。
mocha：「……我跟你說一件事。」
mocha：「你來之前，我是家裡的寶寶。」
mocha：「大家手機裡，都是我的照片。」
mocha：「你來了以後，都是你的照片。」
baokaka：「……喵喵？」
mocha：「我不是生氣。只是……有一點點。」
mocha：「一點點而已。」
magpie：「這叫……爭風吃醋。」
mocha：「你可以不要每次都講成語嗎？」
旁白：寶咖咖把半個鳳梨酥，放在摩卡貓前面。
mocha：「……我不吃鳳梨酥。」
mocha：「……好啦，吃一口。」
[flag mochaTalk1]
```

### ch4.ximen.boss
talk: `karaoke` at the 紅樓 door (not: karaokeDone). The NPC appears only `when: neonDone`.
```
旁白：紅樓門口，有一台好大的卡拉OK機。
旁白：頭是一顆迪斯可球，脖子上繫著紅領結。
karaoke：「來喔！點歌點歌！」
karaoke：「下一首，〈我的麥克風〉！」
karaoke：「我的～麥克風～閃閃～亮～～」
mocha：「從第一個音就走了。」
karaoke：「什麼？你們不鼓掌？」
karaoke：「那就再唱一首！唱到你們拍手！」
magpie：「他喊『安可』的時候，會打全部人！」
magpie：「看到要安可，記得先防禦！」
[boss karaokeKing]
[flag karaokeDone]
karaoke：「……原來，我一直走音喔？」
mocha：「從第一個音。」
karaoke：「從來沒有人跟我說過……」
旁白：寶咖咖用力地拍拍手。
baokaka：「哇！哇！」
karaoke：「……你在幫我拍手？」
karaoke：「嗚……這是我第一次聽到掌聲。」
karaoke：「麥克風還你。我要去練習了。」
[flag got_mic]
旁白：拿回了「麥克風」！（會表演）
[coins 75]
karaoke：「那朵雲，往龍山寺那邊飄過去了。」
karaoke：「它好像一直在說……」
karaoke：「『咻咻沒有生日……』」
magpie：「咻咻？」
mocha：「……是它的名字嗎？」
```

**Chests (ximen):** `ximen-helmet` scooter row → 安全帽 · `ximen-claw` claw-machine shop → 珍珠奶茶 ×2 (chest flavor line: 「夾娃娃機裡，掉出來了！」) · `ximen-cutlet` → 雞排


### sq.clawPlush.try1 / try2 / try3
talk: `clawMachine` in the claw-machine shop: `[{ when: 'gotPlush', event: 'sq.clawPlush.done' }, { when: 'claw2', event: 'sq.clawPlush.try3' }, { when: 'claw1', event: 'sq.clawPlush.try2' }, { event: 'sq.clawPlush.try1' }]`

**sq.clawPlush.try1**
```
旁白：一台夾娃娃機。裡面有一隻黑色的小熊。
旁白：胸口，有一個白白的V。
magpie：「好像某個人喔。」
旁白：投十塊。夾子下去……夾到了……
旁白：……掉了。
[coins -10]
[flag claw1]
```

**sq.clawPlush.try2**
```
旁白：再投十塊。夾子下去……
旁白：夾到了！往上……往上……
旁白：……又掉了。
mocha：「這台機器，在騙錢。」
[coins -10]
[flag claw2]
```

**sq.clawPlush.try3**
```
旁白：第三次。
旁白：寶咖咖，用小手拍了一下按鈕。
baokaka：「要！」
旁白：夾子下去——穩穩地，夾起來了。
旁白：咚。小熊，掉進了出口。
mocha：「……保夾了。」
[coins -10]
[flag gotPlush]
旁白：得到「小黑熊玩偶」！
magpie：「留著吧。說不定會遇到它的主人。」
```

**sq.clawPlush.done**
```
旁白：夾娃娃機的燈，開心地閃了一下。
```

### sq.lostFound.hat (return)
A variant on `dancer` (insert at the top): `{ when: 'lf_hat', not: 'lf_hatBack', event: 'sq.lostFound.hat' }`
```
dancer：「欸！我的帽子！」
dancer：「被風吹走，我找了一整晚！」
dancer：「謝啦，寶寶！這個給你們。」
[coins 40]
[flag lf_hatBack]
旁白：得到 40 個銅板！
dancer：「下次一起跳舞！」
```


---

## 第五章 月亮票不見了 — 龍山寺・剝皮寮

### ch5.intro
(Entry trigger on `longshan`, once. The party arrives from 龍山寺站 into 艋舺公園.)
```
[chapter 5｜月亮票不見了｜02:00]
旁白：龍山寺站。出口一上來，就是公園。
旁白：廟的屋頂上，有好多彎彎的龍。
旁白：紅色的燈籠，一排一排，亮亮的。
magpie：「龍山寺。台北最老的廟之一。」
magpie：「屋頂上的龍，是用碎碗片拼的。」
mocha：「…………」
mocha：「我好像……來過這裡。」
旁白：咕咕咕——一隻鴿子，咻地飛下來。
旁白：叼走了月亮票！
mocha：「喂！！」
旁白：鴿子，飛進了剝皮寮的巷子裡。
magpie：「沒有月亮票……我們回不去了。」
mocha：「追！」
```

### ch5.longshan.noTicket
talk: `mrtGate` in `longshan` when not `ticketBack` (it replaces `mrt.enter` here)
```
旁白：嗶——……沒有反應。
旁白：沒有月亮票，閘門不開。
mocha：「先把票搶回來。」
```

### ch5.longshan.uncle.first / .poe / .again
talk: `unclePoe` (a 阿伯 with a small cloth bag of 筊杯, by the temple-front step): `[{ when: 'poeDone', event: 'ch5.longshan.uncle.again' }, { when: 'poeReady', event: 'ch5.longshan.uncle.poe' }, { event: 'ch5.longshan.uncle.first' }]`
(`poeReady` is a derived flag: `gotTea` + `gotFlower` + `chickHome`.)

**ch5.longshan.uncle.first**
```
unclePoe：「呵呵，囡仔，這麼晚還來？」
mocha：「…………你。」
unclePoe：「阿伯又來了，呵呵。」
unclePoe：「鴿子飛進巷子，巷子彎彎曲曲。」
unclePoe：「不知道往哪走，就擲筊問一下。」
magpie：「擲筊？兩片紅紅的、像月亮的木頭。」
magpie：「一正一反，叫『聖筊』，就是好。」
unclePoe：「可是啊，問事情要有誠意。」
unclePoe：「喝一杯青草茶，冷靜。」
unclePoe：「買一朵玉蘭花，香香。」
unclePoe：「再做一件好事。」
unclePoe：「三樣都有了，再來找阿伯。」
[flag poeAsked]
```

**ch5.longshan.uncle.poe**
```
unclePoe：「呵呵，誠意都到了。來。」
unclePoe：「請問：鴿子老大，在剝皮寮嗎？」
旁白：喀啦——兩片都是平的。
unclePoe：「笑筊。呵呵，它在笑我們問太快。」
旁白：喀啦——兩片都是鼓的。
unclePoe：「陰筊。再問一次。」
baokaka：「要！」
旁白：寶咖咖用小手，把筊杯丟出去。
旁白：喀啦——一正，一反。
unclePoe：「聖筊！」
unclePoe：「剝皮寮最裡面。紅磚牆的屋頂上。」
mocha：「……寶咖咖丟的就中了。」
unclePoe：「囡仔的手，最乾淨。呵呵。」
[flag poeDone]
```

**ch5.longshan.uncle.again**
```
unclePoe：「剝皮寮最裡面。慢慢仔來。」
```

### ch5.longshan.herbGran
talk: `herbGran` (青草巷 stall; also the inn): `[{ when: 'gotTea', event: 'ch5.longshan.herbGran.inn' }, { event: 'ch5.longshan.herbGran' }]`

**ch5.longshan.herbGran**
```
herbGran：「青草茶，退火，一杯十元。」
herbGran：「囡仔不用錢。阿婆請你。」
[flag gotTea]
旁白：喝了一口青草茶。涼涼的，苦苦的，甜甜的。
mocha：「……冷靜了。」
```

**ch5.longshan.herbGran.inn**
```
herbGran：「累了喔？躺在阿婆的板凳上。」
[inn 15]
```

### ch5.longshan.flowerAunt
talk: `flowerAunt` (玉蘭花 seller by the gate): `[{ when: 'gotFlower', event: 'ch5.longshan.flowerAunt.again' }, { event: 'ch5.longshan.flowerAunt' }]`

**ch5.longshan.flowerAunt**
```
flowerAunt：「玉蘭花，香香的，一串二十。」
[coins -20]
[flag gotFlower]
旁白：買了一串玉蘭花。（銅板 -20）
flowerAunt：「我跟你說，那陣風——」
flowerAunt：「像一整座廟那麼大！」
mocha：「……又長大了。」
```
(If the player has fewer than 20 coins, the engine should still allow it. Spec: `stickers` with a negative amount floors at 0.)

**ch5.longshan.flowerAunt.again**
```
flowerAunt：「花香香，人平安。」
```

### ch5.longshan.chick / .home
talk: `lostChick` (a fluffy pigeon chick under a bench), not `chickHome`: `[{ when: 'chickFollowing', event: 'ch5.longshan.chick.wait' }, { event: 'ch5.longshan.chick' }]`
Then `chickNest` (a nest on a low wall), `when: chickFollowing`, talk `ch5.longshan.chick.home`.

**ch5.longshan.chick**
```
旁白：長椅下面，有一隻小小的鴿子寶寶。
chick：「咕……咕……媽媽……」
baokaka：「抱抱。」
旁白：寶咖咖把小鴿子，抱在懷裡。
mocha：「巢在那邊的矮牆上。送牠回去吧。」
[flag chickFollowing]
```

**ch5.longshan.chick.wait**
```
旁白：小鴿子在寶咖咖懷裡，睡著了。
```

**ch5.longshan.chick.home**
```
旁白：寶咖咖，把小鴿子放回巢裡。
chick：「咕！」
旁白：鴿子媽媽，輕輕點了點頭。
[flag chickHome]
mocha：「做了一件好事。」
magpie：「這叫……日行一善。」
mocha：「對的。」
```

### 摩卡的老朋友 (sq.mocha, Mocha's side story)

talk: `ahua` (an old calico cat on a 青草巷 roof): `[{ when: 'mochaBell', event: 'sq.mocha.after' }, { when: 'mochaEaves', event: 'sq.mocha.bell' }, { when: 'mochaMetAhua', event: 'sq.mocha.wait' }, { event: 'sq.mocha.meet' }]`
The `oldEaves` trigger (the eaves at the alley's end), `when: mochaMetAhua`, not `mochaEaves`: `sq.mocha.eaves`.

**sq.mocha.meet**
```
旁白：屋頂上，有一隻老老的三花貓。
ahua：「……喵？」
ahua：「你是……小摩卡？」
mocha：「……阿花姐。」
magpie：「你們認識？」
mocha：「…………」
mocha：「我以前，住在這裡。」
mocha：「我小時候，沒有家。」
ahua：「下雨天，都躲在巷子底的屋簷下。」
ahua：「去那邊看看吧。你以前的位子。」
[flag mochaMetAhua]
```

**sq.mocha.wait**
```
ahua：「巷子底的屋簷。去吧。」
```

**sq.mocha.eaves**
```
旁白：巷子底，有一個小小的屋簷。
旁白：地上，鋪著一張舊舊的紙箱。
mocha：「……還在。」
mocha：「我在這裡，等了好多個下雨天。」
mocha：「每個人經過，都說：『好可憐。』」
mocha：「然後，就走了。」
旁白：寶咖咖爬進紙箱，坐好。
baokaka：「喵喵。一起。」
mocha：「…………」
mocha：「後來，有一個女生，蹲了下來。」
mocha：「她沒有說好可憐。她說：『回家吧。』」
magpie：「……是媽媽？」
mocha：「是媽媽。」
mocha：「……那朵雲，也是一直被說『快走』吧。」
[flag mochaEaves]
```

**sq.mocha.bell**
```
ahua：「看完了？」
mocha：「看完了。」
ahua：「這個，你小時候掉的。我一直收著。」
旁白：一個小小的銀色鈴鐺。
[give bellCollar]
[flag mochaBell]
旁白：得到 摩卡的鈴鐺項圈！（摩卡專用）
ahua：「你現在有家了。還多了一個寶寶。」
ahua：「那你，就是哥哥了。」
mocha：「…………」
mocha：「……好啦。」
```

**sq.mocha.after**
```
ahua：「當哥哥，很累吧？」
mocha：「很累。」
ahua：「可是，很好吧？」
mocha：「……很好。」
```

### ch5.longshan.clerk
talk: `clerk`
```
[flag clerk_longshan]
clerk：「叮咚～歡迎光臨！」
clerk：「廟口分店。拜拜完，買點心。」
[shop pineappleCake, douhua, bubbleTea, chickenCutlet, meatBall, grassJellyTea]
```

### stamp.longshan
```
旁白：廟前的廣場，有一個紀念章台。
旁白：蓋——！「龍山寺」，彎彎屋頂的章。
[flag stamp_longshan]
```

### ch5.longshan.alleyBlocked
(The exit to `bopiliao`, blocked before `poeDone`.)
```
旁白：剝皮寮的巷子，彎來彎去。
mocha：「不知道往哪裡走。去問問阿伯吧。」
```

---

### ch5.bopiliao.intro
(Entry trigger on `bopiliao`, once.)
```
旁白：剝皮寮。紅磚的老房子，一間接一間。
旁白：好像走進了很久很久以前。
magpie：「這裡，以前是很熱鬧的街。」
旁白：屋頂上，咕咕咕的聲音，越來越多。
```

### ch5.bopiliao.pigeons
talk: `pigeonGuards` fixed fight halfway down the alley (not: pigeonsDone)
```
旁白：三隻鴿子，排成一排，擋住了路。
旁白：「咕！老大說，不准過！」
[battle pigeon, pigeon, pigeon]
[flag pigeonsDone]
旁白：鴿子們，咕咕咕地飛回屋頂了。
```

### ch5.bopiliao.boss
talk: `pigeonBoss` on the red-brick rooftop (not: pigeonDone)
```
旁白：紅磚屋頂上，有一隻胖胖的鴿子。
旁白：牠的窩裡，堆滿了亮晶晶的東西。
旁白：最上面，是月亮票。
gugu：「咕咕！亮亮的，都是咕咕的！」
mocha：「那張票，是我們的。」
gugu：「上面有月亮！月亮是亮的！所以是咕咕的！」
magpie：「這是什麼邏輯……」
baokaka：「不要！」
[boss pigeonBoss]
[flag pigeonDone]
[flag ticketBack]
gugu：「咕……好啦好啦……」
旁白：月亮票，飄回寶咖咖的手上。
旁白：拿回了「月亮票」！
[coins 85]
gugu：「窩裡還有一頂帽子，你們要不要？」
[flag lf_hat]
旁白：撿到「街舞少年的帽子」。（失物招領）
gugu：「那朵雲，捲著好多布，往大稻埕去了。」
gugu：「它經過的時候，跟咕咕說了一句話。」
gugu：「『咻咻也想要亮亮的東西。』」
mocha：「……金鎖片。」
```

### ch5.bopiliao.echo, sq.elder.5, etc.
See the 支線 section.

**Chests:** `longshan-meatball` 青草巷 → 肉圓 ×2 · `longshan-jelly` park bench → 仙草茶 ×2 · `bopiliao-turtle` → 紅龜粿 · `bopiliao-cake` → 鳳梨酥 ×2

---

## 第六章 迪化街的布龍 — 大稻埕・迪化街

### ch6.intro
```
[chapter 6｜迪化街的布龍｜02:25]
旁白：大稻埕・迪化街。百年的老房子，一間接一間。
旁白：空氣裡有烏魚子、中藥、和茶葉的味道。
旁白：天上，一條一條的花布在飛。
magpie：「這裡是台北最老的街之一。」
magpie：「過年的時候，人山人海——」
magpie：「呃……人山人海，就是很多人的意思。」
mocha：「這次怎麼解釋得這麼小心。」
```

### ch6.dadaocheng.uncle.first / .again
talk: `uncleTea`: `[{ when: 'heardStory', event: 'ch6.dadaocheng.uncle.again' }, { event: 'ch6.dadaocheng.uncle.first' }]`

**ch6.dadaocheng.uncle.first**
```
uncleTea：「呵呵，囡仔，來，喝茶。」
mocha：「…………」
uncleTea：「免看啦，阿伯都長這樣。」
uncleTea：「阿伯跟你們講一個故事。」
uncleTea：「一年前，有一個小小的颱風。」
uncleTea：「它在台北上空，繞來繞去。」
uncleTea：「大家都把窗戶關起來，說：『快走、快走。』」
uncleTea：「同一個晚上，醫院裡生了一個囡仔。」
uncleTea：「哭聲好大，大到颱風都聽到了。」
baokaka：「……我！」
uncleTea：「呵呵。是誰呢？」
mocha：「…………」
uncleTea：「茶涼了。慢慢仔來。」
[flag heardStory]
```

**ch6.dadaocheng.uncle.again**
```
uncleTea：「布龍在碼頭那邊跳舞。」
uncleTea：「它不是壞，它只是轉暈了。」
```

### ch6.dadaocheng.cloth / .after / .again
talk: `clothAunt`: `[{ when: 'clothGave', event: 'ch6.dadaocheng.cloth.again' }, { when: 'dragonDone', event: 'ch6.dadaocheng.cloth.after' }, { event: 'ch6.dadaocheng.cloth' }]`

**ch6.dadaocheng.cloth**
```
clothAunt：「哎唷！我的布！全部飛走了！」
clothAunt：「那陣風啊，是比颱風還大的颱風！」
mocha：「颱風……比颱風還大？」
magpie：「這叫……呃……」
mocha：「不用了。」
clothAunt：「布飛到碼頭，變成一條龍了啦！」
```

**ch6.dadaocheng.cloth.after**
```
clothAunt：「我的布回來了！還捲得整整齊齊！」
clothAunt：「來，這件給寶寶穿，阿姨做的。」
[give flowerVest]
[flag clothGave]
旁白：得到 花布背心！（裝備：體力 +45）
```

**ch6.dadaocheng.cloth.again**
```
clothAunt：「花布背心，紅紅的，最好看。」
```

### ch6.dadaocheng.temple / .again
talk: `templeAunt`: `[{ when: 'amuletGave', event: 'ch6.dadaocheng.temple.again' }, { event: 'ch6.dadaocheng.temple' }]`

**ch6.dadaocheng.temple**
```
templeAunt：「乖囡仔，這麼晚還出來？」
templeAunt：「來，這個平安符給你，保平安。」
[give amulet]
[flag amuletGave]
旁白：得到 平安符！（裝備：幸運 +10）
```

**ch6.dadaocheng.temple.again**
```
templeAunt：「平安就好，平安就好。」
```

### ch6.dadaocheng.dried
talk: `driedAunt`
```
driedAunt：「香菇、干貝、烏魚子～要買什麼？」
driedAunt：「寶寶吃不了烏魚子啦。這些比較適合。」
[shop pineappleCake, douhua, bubbleTea, chickenCutlet, redTurtleCake, flowerVest]
```

### ch6.dadaocheng.herbal
talk: `herbal`
```
herbal：「來，喝一碗四神湯，補一補。」
[inn 20]
```

### ch6.dadaocheng.clerk
talk: `clerk`
```
[flag clerk_dadaocheng]
clerk：「叮咚～歡迎光臨！」
clerk：「老街也有分店。我們是連鎖的。」
mocha：「我已經不想問了。」
[shop teaEgg, pineappleCake, douhua, bubbleTea, helmet]
```

### stamp.dadaocheng
```
旁白：老房子的牌樓下面，有一個紀念章台。
旁白：蓋——！「大稻埕」，一間老房子的章。
[flag stamp_dadaocheng]
```

### ch6.dadaocheng.snakes
talk: `clothSnakes` fixed fight across the street (not: snakesDone)
```
旁白：兩條長長的花布，像蛇一樣擋住了路。
旁白：嘶——嘶——（其實是布在摩擦。）
mocha：「這裡沒有水。……很好。」
[battle clothSnake, clothSnake]
[flag snakesDone]
旁白：布匹蛇鬆開了，變回兩捲整齊的布。
```

### ch6.dadaocheng.boss
talk: `dragon` at the wharf (not: dragonDone)
```
旁白：碼頭邊，一條花布做的龍在跳舞。
旁白：嘴裡咬著一個算盤，劈哩啪啦響。
dragon：「劈哩啪啦！算一算，你們打不贏！」
magpie：「龍嘴裡是算盤！它在算我們！」
dragon：「一隻貓、一隻鳥、一個寶寶——」
dragon：「加起來，打不贏一條龍！」
baokaka：「不要！」
mocha：「他說：『數學不是這樣算的。』」
[boss clothDragon]
[flag dragonDone]
dragon：「劈……哩……轉得好暈……」
旁白：布龍慢慢鬆開，變回一捲一捲的花布。
旁白：算盤，喀啦一聲掉在地上。
[flag got_abacus]
旁白：拿回了「算盤」！（會算）
[coins 90]
dragon：「那朵雲……往北邊飛了。」
dragon：「它說……它肚子好空。」
magpie：「雲也會肚子餓？」
baokaka：「餓餓！」
mocha：「……他說：『士林夜市。』」
```

**Chests (dadaocheng):** `dadao-shoes` shoe-shop doorway → 虎頭鞋 · `dadao-turtle` → 紅龜粿 · `dadao-douhua` → 豆花 ×2


### ch6.yongle.intro
(Entry trigger on `yongle`, the 永樂市場 cloth floor, once. **The mid-chapter gate:** the wharf exit in `dadaocheng` opens `when: boltsFound` (derived from `bolt1`–`bolt3`), blocked by `ch6.dadaocheng.wharfBlocked`.)
```
旁白：永樂市場的二樓。一攤一攤，全是布。
旁白：布捲，被風吹得到處都是。
旁白：走道，被布塞成了迷宮。
mocha：「阿姨說，三捲最重要的布不見了。」
```

### ch6.dadaocheng.wharfBlocked
```
旁白：往碼頭的路，被一大片花布擋住了。
clothAunt：「先幫阿姨找三捲布！在永樂市場！」
```

### ch6.yongle.bolt1 / bolt2 / bolt3
talk: `bolt1..3` (each `not: boltN`; `bolt3` appears `when: snakesDone`)

**ch6.yongle.bolt1**
```
旁白：一捲紅色的牡丹花布，捲在柱子上。
旁白：寶咖咖抱住布，滾了一圈，捲好了。
[flag bolt1]
```

**ch6.yongle.bolt2**
```
旁白：一捲藍色的格子布，掉在攤子底下。
mocha：「我鑽進去拿。」
mocha：「……貓是液體，記得嗎？」
[flag bolt2]
```

**ch6.yongle.bolt3**
```
旁白：一捲金色的布，在布匹蛇的後面。
旁白：布匹蛇冷靜下來以後，自己把布推了過來。
[flag bolt3]
```
(Move the fixed fight `ch6.dadaocheng.snakes` into `yongle` in front of `bolt3`. Its lines stay the same, except swap 「後面就是河。……我討厭水。」 for 「這裡沒有水。……很好。」)

### ch6.dadaocheng.cloth.bolts
A variant on `clothAunt`: `{ when: 'boltsFound', not: 'boltsReturned', event: 'ch6.dadaocheng.cloth.bolts' }` (above `.after`).
```
clothAunt：「三捲都找到了！你們好厲害！」
clothAunt：「碼頭的路，阿姨幫你們打開！」
[flag boltsReturned]
```

### sq.magpie.note2
A variant on `uncleTea` (insert above `.again`): `{ when: 'heardStory', not: 'note2', event: 'sq.magpie.note2' }`
```
uncleTea：「對了，這張紙，被風吹到阿伯店裡。」
旁白：「台灣茶的故事——歷史系演講」
magpie：「第二頁！」
uncleTea：「呵呵，讀書的鳥。好。」
[flag note2]
旁白：得到「旁聽筆記（二）」！
```

### sq.delivery.leg3 (pickup)
A variant on `uncleTea`: `{ when: 'dl2', not: 'dl3Got', event: 'sq.delivery.leg3' }`
```
uncleTea：「外送的小哥說，你們在幫忙送東西？」
uncleTea：「這包鐵觀音，送給貓空的茶壺爺。」
uncleTea：「他的茶，被芹菜弄壞了吧？呵呵。」
[flag dl3Got]
旁白：拿到「外送：一包鐵觀音」。
```


---

## 第七章 夜市大胃王 — 士林夜市

### ch7.intro
```
[chapter 7｜夜市大胃王｜02:50]
旁白：士林夜市。攤子早就收了，燈卻還亮著。
旁白：仔細一看——是食物們，自己在逛夜市！
mocha：「……雞排在排隊買雞排。」
magpie：「這叫……同類相聚？」
mocha：「是『物以類聚』吧。」
magpie：「我就是要說這個。」
```

### ch7.shilin.goldfish
talk: `goldfishGirl`
```
goldfishGirl：「寶寶！你要撈金魚嗎？」
goldfishGirl：「我跟你說喔，那陣風——」
goldfishGirl：「像101那麼大！大家都這樣說！」
mocha：「機車、公車、火車、一條街……」
mocha：「比颱風還大……現在是101了。」
magpie：「再傳下去，就比台灣還大了。」
```

### ch7.shilin.uncle.first / .again
talk: `unclePinball`: `[{ when: 'pinballGave', event: 'ch7.shilin.uncle.again' }, { event: 'ch7.shilin.uncle.first' }]`

**ch7.shilin.uncle.first**
```
unclePinball：「呵呵，囡仔，來打一場彈珠台。」
unclePinball：「人生啊，就像彈珠台。」
unclePinball：「叮叮咚咚，彈來彈去，最後……」
unclePinball：「……最後就掉下去了，呵呵。」
mocha：「這個比喻好嗎？」
unclePinball：「呵呵，來，這個請你們吃。」
[give douhua]
[flag pinballGave]
旁白：得到 豆花！
```

**ch7.shilin.uncle.again**
```
unclePinball：「慢慢仔來。彈珠會跑，人也會累。」
```

### ch7.shilin.cutletAunt
talk: `cutletAunt`
```
cutletAunt：「雞排～要不要切？要不要辣？」
baokaka：「要！」
cutletAunt：「寶寶不能吃辣喔！不辣不辣。」
[shop chickenCutlet, braisedRice, bubbleTea, douhua, pineappleCake]
```

### ch7.shilin.clerk
talk: `clerk`
```
[flag clerk_shilin]
clerk：「叮咚～歡迎光臨！」
clerk：「夜市旁邊，一定要有一間。」
[shop teaEgg, pineappleCake, chickenCutlet, braisedRice, bubbleTea, helmet]
```

### ch7.shilin.backpacker
talk: `backpacker`
```
backpacker：「Hi! I ate stinky tofu!」
backpacker：「Very… very stinky. But delicious.」
backpacker：「Now… where is 101?」
baokaka：「ㄅㄚ！」
mocha：「他說：『快了。臭豆腐味散了就到。』」
backpacker：「…The cat talks?」
mocha：「現在才發現？」
```

### ch7.shilin.massage
talk: `massageChair`
```
旁白：一排投幣按摩椅。
旁白：上面寫著：「投十塊，按好按滿」。
[inn 10]
```

### stamp.shilin
```
旁白：劍潭站的招牌下，有一個紀念章台。
旁白：蓋——！「士林夜市」，一杯珍奶的章。
[flag stamp_shilin]
```

### ch7.shilin.sausage
talk: `sausage` fixed fight at the 地下美食區 stairs (not: sausageDone)
```
旁白：樓梯口，有兩條香腸抱在一起。
sausage：「我是大腸，他是小腸！」
sausage：「（小聲）其實都是我在講話。」
sausage：「要下樓？先過我們這關！」
[battle sausagePair, sausagePair]
[flag sausageDone]
sausage：「好啦好啦，讓你們過……」
```

### ch7.shilin.boss
talk: `cutlet` (not: cutletDone; appears `when: sausageDone`)
```
旁白：樓梯下面，站著一塊好大好大的雞排。
旁白：比門還大。手裡拿著一根雞腿，像拿劍。
cutlet：「我比你的臉還大！」
mocha：「……你是雞排，為什麼拿雞腿？」
cutlet：「因為很合理！」
mocha：「哪裡合理？」
cutlet：「不要問！要不要切？要不要辣？」
baokaka：「不要！」
magpie：「『要切嗎』那招很痛，先護好！」
[boss megaCutlet]
[flag cutletDone]
cutlet：「嗚……」
cutlet：「大家都說我太大了，吃不完……」
cutlet：「我只是想被一口一口，好好吃完。」
baokaka：「好吃！」
mocha：「他說：『你很好吃。』……這樣講對嗎？」
cutlet：「……謝謝你。」
cutlet：「雞腿還你。」
[flag got_drumstick]
旁白：拿回了「雞腿」！（有口福）
[coins 110]
cutlet：「那朵雲吃了好多棉花糖，往機場去了。」
```

### ch7.shilin.basin
(Runs immediately after `ch7.shilin.boss`.)
```
magpie：「等一下。根據我的研究——」
magpie：「公園、台大、車站、西門、大稻埕……」
magpie：「那朵雲，一直在繞圈圈。」
mocha：「它為什麼不飛走？」
magpie：「因為，台北是盆地。」
magpie：「四面都是山，像一個大碗。」
magpie：「小小的風，飛不出去。」
mocha：「……所以它一直在碗裡打轉。」
mocha：「越急，轉得越大。」
magpie：「它往機場去了。……它想搭飛機，飛出去。」
baokaka：「……咻咻。」
旁白：寶咖咖看著天空，好小聲地說。
```

**Chests (shilin):** `shilin-cutlet` → 雞排 ×2 · `shilin-bento` → 鐵路便當 · `shilin-ice` → 芒果冰


### ch7.foodcourt.intro
(Entry trigger on `foodcourt`, the 地下美食區, once. **The mid-chapter gate:** the kitchen at the back, where the boss is, opens `when: dumplingHome`.)
```
旁白：地下美食區。好多攤位，好多蒸氣。
旁白：角落裡，有一個小小的東西在哭。
dumpling：「嗚……媽媽……蒸籠媽媽……」
```

### ch7.foodcourt.dumpling / .follow / .home
talk: `lostDumpling` (a tiny soup dumpling), not `dumplingHome`: `[{ when: 'dumplingFollowing', event: 'ch7.foodcourt.dumpling.follow' }, { event: 'ch7.foodcourt.dumpling' }]`
`steamerMom` (a big bamboo steamer at a stall on the far side), `when: dumplingFollowing`, talk `ch7.foodcourt.dumpling.home`.

**ch7.foodcourt.dumpling**
```
dumpling：「我是小籠包。我迷路了。」
dumpling：「媽媽在一個……圓圓的、有蓋子的地方。」
mocha：「蒸籠。」
baokaka：「抱抱。」
旁白：寶咖咖，小心地捧起小籠包。
mocha：「小心，裡面有湯。很燙。」
[flag dumplingFollowing]
```

**ch7.foodcourt.dumpling.follow**
```
dumpling：「熱熱的……是你的手，還是我？」
```

**ch7.foodcourt.dumpling.home**
```
旁白：一個大大的竹蒸籠，蓋子一開一合。
steamerMom：「孩子！你跑去哪了！」
dumpling：「媽媽！」
旁白：小籠包，跳回了蒸籠裡。
steamerMom：「謝謝你們。廚房的門，我幫你們開。」
steamerMom：「那塊大雞排，在裡面生悶氣。」
[flag dumplingHome]
```

### sq.queue.front
A variant on `queueLine`: `{ when: 'cutletDone', not: 'queueDone', event: 'sq.queue.front' }`
```
旁白：剛剛那一排，終於排到最前面了。
旁白：攤子打開了。裡面……
旁白：……是一個超級大的便當盒。
queueLine：「排兩個小時，值得！」
旁白：大家都分到了一份。
[give mysteryFood]
[flag queueDone]
旁白：得到「神秘排隊美食」！
mocha：「到底是什麼？」
queueLine：「不知道。可是很好吃。」
```


---

## 第八章 飛機睡著的時候 — 松山機場

### ch8.intro
```
[chapter 8｜飛機睡著的時候｜03:15]
旁白：松山機場。跑道的燈，一顆一顆，藍藍綠綠。
旁白：飛機們，都停在登機門旁邊，睡著了。
magpie：「根據我的研究——」
magpie：「晚上十一點到早上五點，這裡的飛機不飛。」
mocha：「飛機也要睡覺。」
baokaka：「飛機！」
mocha：「……噓。在睡覺。」
```

### ch8.airport.ctrlTower / .after
talk: `ctrlTower` (the lit tower cab, talked to from its base): `[{ when: 'windsockDone', event: 'ch8.airport.ctrlTower.after' }, { event: 'ch8.airport.ctrlTower' }]`

**ch8.airport.ctrlTower**
```
ctrlTower：「塔台呼叫，地面上的小朋友。」
ctrlTower：「收到請回答。Over。」
baokaka：「哇！」
ctrlTower：「收到。Over。」
mocha：「……你都這樣講話？」
ctrlTower：「塔台都這樣講話。Over。」
ctrlTower：「剛剛，有一朵雲呼叫塔台。」
ctrlTower：「它問：『咻咻可以起飛嗎？』」
ctrlTower：「塔台回答：『晚上不能起飛。』」
ctrlTower：「它在跑道上，轉了好久好久。Over。」
mocha：「…………」
ctrlTower：「跑道盡頭的風向袋，被它轉暈了。」
ctrlTower：「請協助處理。Over。」
```

**ch8.airport.ctrlTower.after**
```
ctrlTower：「風向袋恢復正常。感謝協助。」
ctrlTower：「天亮以後，跑道就會開。Over。」
```

### ch8.airport.jet / .awake
talk: `jet` (a small white plane with a blue stripe, asleep at gate 1): `[{ when: 'windsockDone', event: 'ch8.airport.jet.awake' }, { event: 'ch8.airport.jet' }]`

**ch8.airport.jet**
```
旁白：一架白色的小飛機，在登機門旁邊睡覺。
旁白：引擎，發出很小很小的呼嚕聲。
baokaka：「飛機！」
mocha：「噓。它在睡。」
```

**ch8.airport.jet.awake**
```
jet：「……嗯？好吵。啊，是小朋友。」
baokaka：「飛機！」
jet：「嗯，我是飛機。你好。」
jet：「那朵雲……剛剛來找過我。」
jet：「它問我，可不可以帶它飛出去。」
jet：「飛出這個大碗，飛過山。」
jet：「可是我們晚上不能飛。」
jet：「我說，天亮再來。它好像等不及了。」
magpie：「……原來它想離開。」
jet：「天亮以後，我是第一班。」
jet：「我飛上去的時候，會幫忙找找看。」
[flag jetPromise]
```

### ch8.airport.uncle.first / .again
talk: `uncleAirport` (pushing a long line of luggage carts): `[{ when: 'airportUncleGave', event: 'ch8.airport.uncle.again' }, { event: 'ch8.airport.uncle.first' }]`

**ch8.airport.uncle.first**
```
uncleAirport：「呵呵，囡仔，要出國喔？」
mocha：「……你連機場都有。」
uncleAirport：「推車子的阿伯，哪裡都有，呵呵。」
uncleAirport：「風往哪裡吹，風向袋最知道。」
uncleAirport：「可是今天，風向袋自己都暈了。」
uncleAirport：「來，坐飛機要帶這個。」
[give neckPillow]
[flag airportUncleGave]
旁白：得到 旅行頸枕！（裝備：體力 +30、防禦 +5）
```

**ch8.airport.uncle.again**
```
uncleAirport：「慢慢仔來。飛機會等，阿伯也會等。」
```

### ch8.airport.marshal
talk: `marshal` (night ground crew with two glowing wands)
```
marshal：「往前、往前、往前——」
旁白：寶咖咖跟著光棒，爬爬爬。
marshal：「停！」
旁白：寶咖咖停住了。停得剛剛好。
marshal：「完美停機！你以後可以來機場上班！」
mocha：「……他連走路都還不會。」
```

### ch8.airport.clerk
talk: `clerk`
```
[flag clerk_airport]
clerk：「叮咚～歡迎光臨！」
clerk：「機場分店。出國前，買點吃的。」
mocha：「我們沒有要出國。」
clerk：「那就，買點吃的。」
[shop pineappleCake, chickenCutlet, braisedRice, bubbleTea, railBento, redTurtleCake, helmet]
```

### ch8.airport.chairs
talk: `waitingChairs`
```
旁白：候機室的椅子，一排連在一起。
旁白：躺三格，剛剛好。
[inn 15]
```

### stamp.airport
```
旁白：出境大廳旁邊，有一個紀念章台。
旁白：蓋——！「松山機場」，一架小飛機的章。
[flag stamp_airport]
```

### ch8.airport.carts
talk: `luggageCarts` fixed fight on the path to the runway end (not: cartsDone)
```
旁白：一串行李拖車，自己在跑道邊開來開去。
旁白：「叭叭！行李呢？行李都被吹走了！」
mocha：「它們在找行李。」
magpie：「我們不是行李。」
[battle luggageTrain, luggageTrain]
[flag cartsDone]
旁白：拖車們停好了，排得整整齊齊。
```

### ch8.airport.boss
talk: `windsock` at the runway-end pole (not: windsockDone; appears `when: cartsDone`)
```
旁白：跑道的盡頭，有一根高高的桿子。
旁白：上面掛著一個橘白條紋的風向袋。
旁白：它一直轉、一直轉，像一個陀螺。
windsock：「轉轉轉！風往哪裡吹？」
windsock：「我不知道啦！我暈了！」
magpie：「風向袋的工作，是告訴飛機風往哪吹。」
mocha：「它身上纏著一條紅紅的東西。」
windsock：「不要過來！我會甩到你們！」
magpie：「它『側風警報』打全部，先防禦！」
[boss windsock]
[flag windsockDone]
windsock：「呼……停、停下來了……」
windsock：「一朵雲，繞著我轉了一整晚。」
windsock：「它一直問：『風可以帶我出去嗎？』」
windsock：「我說，風都是繞著山轉的。」
windsock：「它就哭了。」
旁白：風向袋輕輕一抖，一條紅繩掉了下來。
[flag got_redString]
旁白：拿回了「紅繩」！（金鎖片的繩子）
[coins 120]
mocha：「是金鎖片的紅繩。」
mocha：「……那朵雲，一定很想回家。」
windsock：「它往南邊去了。山的方向。」
windsock：「動物園那邊。我現在很確定。」
magpie：「文湖線，坐到底就是動物園。」
```

### ch8.airport.planeWatch
(Trigger on the grass at 飛機巷 by the runway-end fence, `when: windsockDone`, once. **The airport's emotional beat.**)
```
旁白：跑道盡頭的小巷子，有一片草地。
旁白：大家躺下來，看著跑道。
旁白：藍色的燈，一直排到好遠好遠。
旁白：像一條，用星星鋪的路。
magpie：「白天，飛機會從這裡，咻——飛上去。」
magpie：「飛過山。飛出台北。」
baokaka：「飛機……」
mocha：「你想坐飛機？」
baokaka：「一起。」
mocha：「…………」
mocha：「……長大以後。一起坐。」
magpie：「我會飛。我不用坐。」
mocha：「你可以坐窗邊，看自己飛。」
magpie：「……那好像很好玩。」
旁白：風輕輕吹過草地。
mocha：「那朵雲，也是躺在這裡吧。」
mocha：「看著飛機，想跟它們一起飛出去。」
旁白：沒有人說話。
旁白：寶咖咖，把手伸向天空，抓了一下。
baokaka：「咻咻。」
```

### ch8.airport.blocked
(The runway-end path, blocked before `cartsDone`.)
```
旁白：一串行李拖車，把路堵住了。
```

**Chests (airport):** `airport-pillow2` departures hall → 珍珠奶茶 ×2 · `airport-bento` → 鐵路便當 (flavor: 「機上餐？不，是便當。」) · `airport-turtle` → 紅龜粿
**Exit:** MRT entrance `mrtGate` → `mrt.enter`.


### ch8.terminalDeck.intro
(Entry trigger on `terminalDeck`, the terminal's rooftop observation deck, a small optional sub-map. Its stairs are in the departures hall.)
```
旁白：機場頂樓的觀景台。
旁白：白天，這裡擠滿了看飛機的人。
旁白：晚上，只有風，和跑道的燈。
magpie：「從這裡，可以看到整條跑道。」
```

### sq.magpie.note3
talk: `lectureNote3` on the deck railing (not `note3`)
```
旁白：欄杆上，夾著一張紙。
旁白：「飛機為什麼會飛？——物理學通識」
magpie：「第三頁！」
magpie：「我、我集滿了……」
mocha：「然後呢？要申請什麼？」
magpie：「……北投有一間圖書館。」
magpie：「書蟲說過，可以發『旁聽證書』。」
[flag note3]
旁白：得到「旁聽筆記（三）」！
```

### sq.lostFound.earphones (find)
talk: `lfEarphones` on the 飛機巷 grass (not `lf_earphones`)
```
旁白：草地上，有一副藍色的運動耳機。
mocha：「大安森林公園，那個夜跑大哥的。」
mocha：「被風吹到這麼遠。」
[flag lf_earphones]
旁白：撿到「夜跑大哥的耳機」。（失物招領）
```

### sq.backpacker.airport
talk: `backpacker` in `airport`
```
backpacker：「Hello! I want a plane to 101!」
mocha：「…………」
mocha：「101，就在台北。」
backpacker：「…Oh.」
backpacker：「Then… MRT?」
baokaka：「嗶！」
mocha：「他說：『坐捷運。』」
[flag bp_airport]
```


---

## 第九章 貓空上的月亮熊 — 動物園・貓空

### ch9.intro
```
[chapter 9｜貓空上的月亮熊｜03:40]
旁白：台北市立動物園。動物們都睡了。
旁白：只有一個籠子，是空的。
mocha：「……那個名牌寫什麼？」
```

### ch9.zoo.plaque
talk: `plaque`
```
旁白：「台灣黑熊・黑糖」
旁白：「喜歡：黑糖珍奶。」
旁白：「怕：風、高、打雷、黑黑的、鴿子……」
旁白：（後面還寫了很多。）
magpie：「這隻熊怕的東西，比我會的成語還多。」
mocha：「那不就很少。」
magpie：「喂！」
```

### ch9.zoo.uncle.first / .again
talk: `uncleZoo`: `[{ when: 'zooUncleMet', event: 'ch9.zoo.uncle.again' }, { event: 'ch9.zoo.uncle.first' }]`

**ch9.zoo.uncle.first**
```
uncleZoo：「呵呵，囡仔，動物園還沒開喔。」
mocha：「…………」
mocha：「你每一章都在耶。」
uncleZoo：「每一章？什麼章？集章喔？呵呵。」
uncleZoo：「黑糖那個大孩子，很怕風。」
uncleZoo：「風一吹，就跑去躲起來了。」
uncleZoo：「伊最喜歡躲在小小、關得起來的地方。」
mocha：「……像纜車？」
uncleZoo：「呵呵，慢慢仔來。」
[flag zooUncleMet]
```

**ch9.zoo.uncle.again**
```
uncleZoo：「纜車站就在那邊。伊很乖，只是怕。」
```

### ch9.zoo.meerkat
talk: `meerkat`
```
meerkat：「站崗中！站崗中！」
meerkat：「報告！剛剛有一朵雲飛過去！」
meerkat：「很大嗎？不大！小小的！」
meerkat：「而且……好像在哭。」
mocha：「…………」
magpie：「我們好像，一直把它想得太可怕了。」
[flag meerkat1]
```

### ch9.zoo.bear
talk: `bearNpc` in the gondola (not: bearJoined)
```
旁白：纜車站裡，停著一個車廂。
旁白：車廂在發抖。不對——是裡面的東西在發抖。
bearNpc：「不、不要開門……外面有風……」
mocha：「你是黑糖？」
bearNpc：「歹、歹勢……我是。」
bearNpc：「風好大，我好怕，就躲進來了。」
bearNpc：「我這麼大一隻，卻什麼都怕……」
bearNpc：「很丟臉吧……」
旁白：寶咖咖爬進車廂，張開手。
baokaka：「抱抱。」
bearNpc：「……欸？」
旁白：寶咖咖抱住了黑糖的腳。只抱得到腳。
旁白：然後，把半個鳳梨酥遞過去。
bearNpc：「……你好小。可是你不怕。」
bearNpc：「那……那我也試試看。」
bearNpc：「我陪你們。我、我會保護你們。」
[join bear]
[flag bearJoined]
旁白：黑糖加入了隊伍！
bear：「我很、很耐打。站在我後面就好。」
bear：「我先說歹勢。等一下會很大力。」
旁白：喀噹——纜車門關上了。車廂，往山上動了。
bear：「哇啊啊！上、上去了！好高！」
mocha：「……這只是開始。」
[goto maokong 2,12]
```

### ch9.zoo.gondolaBlocked
```
旁白：纜車車廂的門關著。
旁白：裡面，好像有東西在發抖。
```

**Chests (zoo):** `zoo-milk` by the bear enclosure → 黑糖珍奶 (flavor: 「上面寫著：給黑糖的。」) · `zoo-cake` → 鳳梨酥 ×3

---

### ch9.maokong.intro
(Entry trigger, once.)
```
旁白：貓空。山上的茶園，一層一層往下。
旁白：空氣涼涼的，有茶香。
bear：「呼……呼……到、到了嗎？」
mocha：「貓空。名字裡有貓。我喜歡。」
magpie：「其實貓空，跟貓沒有關係——」
mocha：「我喜歡。」
magpie：「……好。」
```

### ch9.maokong.view
(Trigger at the view platform, once.)
```
旁白：從這裡，可以看到整個台北。
旁白：好多好多燈。像撒了一地的星星。
旁白：最遠、最高的那一棟——台北101。
旁白：101的頂端，被一團灰藍色的雲包住了。
旁白：雲，一圈一圈地轉。
magpie：「……它在那裡。」
mocha：「離天空最近的地方。」
bear：「好、好高……我們要去那裡嗎……？」
baokaka：「要！」
bear：「…………好。」
bear：「（小聲）我好怕高……」
[flag sawTower]
```

### ch9.maokong.teahouse
talk: `teaLady`
```
teaLady：「歡迎。泡一壺茶，看夜景。」
teaLady：「累了，就在這邊靠一下。」
[inn 25]
```

### ch9.maokong.clerk
talk: `clerk` (with a pushcart)
```
[flag clerk_maokong]
旁白：山路邊，有一台小小的推車。
clerk：「叮咚～歡迎光臨！」
mocha：「……山上？推車？」
clerk：「行動分店。」
bear：「黑、黑糖珍奶！」
[shop pineappleCake, chickenCutlet, braisedRice, bubbleTea, brownSugarMilk, redTurtleCake]
```

### stamp.maokong
```
旁白：纜車站旁邊，有一個紀念章台。
旁白：蓋——！「貓空纜車」，一個小車廂的章。
[flag stamp_maokong]
```

### ch9.maokong.boss
talk: `teapot` on the teahouse terrace (not: teapotDone)
```
旁白：茶館的露台上，有一個好大的茶壺。
旁白：茶壺嘴裡，插著一根芹菜。
teapot：「呸呸呸！誰把芹菜丟進我的茶！」
teapot：「上好的鐵觀音，現在一股芹菜味！」
mocha：「那根芹菜，是我們的。」
teapot：「是你們丟的？！」
mocha：「不是丟的，是被吹的……」
teapot：「不管！喝我一壺熱茶！」
bear：「歹、歹勢！我要上了！」
[boss teapotElder]
[flag teapotDone]
teapot：「呼……呼……水都滾乾了……」
旁白：芹菜，從茶壺嘴裡滑了出來。
[flag got_celery]
旁白：拿回了「芹菜」！（勤勞）
[coins 130]
teapot：「……嗯，等一下。」
teapot：「芹菜茶……其實……還不錯？」
magpie：「這叫……塞翁失馬？」
mocha：「……我覺得這次對了。」
teapot：「那朵雲啊，往碧潭去了。」
teapot：「它說，想找一片安靜的水。」
```

**Chests (maokong):** `maokong-ice` → 芒果冰 · `maokong-tea` → 珍珠奶茶 ×2 · `maokong-turtle` → 紅龜粿


### ch9.zoo.meerkat2 / meerkat3
(**The mid-chapter gate:** the gondola station, where 黑糖 is, only shows `when: meerkatsDone`, derived from `meerkat1`–`meerkat3`. The existing `ch9.zoo.meerkat` event gets `[flag meerkat1]` at its end. Before that, the gondola exit's blocked event is `ch9.zoo.whereBear`.)

**ch9.zoo.meerkat2** (talk `meerkat2` at the macaque rock, not `meerkat2`)
```
meerkat2：「站崗中！報告！」
meerkat2：「一個大大黑黑的影子，往東邊跑了！」
meerkat2：「跑得很快！而且一直說歹勢！」
[flag meerkat2]
```

**ch9.zoo.meerkat3** (talk `meerkat3` by the bamboo, not `meerkat3`)
```
meerkat3：「站崗中！報告！」
meerkat3：「他躲進一個小小、會動的房子裡了！」
mocha：「纜車。」
meerkat3：「報告完畢！」
[flag meerkat3]
```

### ch9.zoo.whereBear
```
旁白：動物園好大。黑糖會在哪裡？
mocha：「問問站崗的狐獴們吧。」
```

### sq.clawPlush.give
(A trigger on `maokong` entry, once, `when: gotPlush` + `bearJoined`.)
```
mocha：「寶咖咖，你西門夾到的那個。」
旁白：寶咖咖，把小黑熊玩偶遞給黑糖。
bear：「……這、這是我？」
bear：「胸口，也有一個V。」
bear：「我……第一次收到禮物。」
bear：「歹、歹勢……我好像要哭了。」
mocha：「哭吧。這裡是山上，沒人看到。」
[give plushCharm]
[flag plushGiven]
旁白：黑糖把玩偶掛在圍巾上。
旁白：得到「小熊吊飾」！（裝備：幸運 +8、防禦 +4）
```

### sq.delivery.leg3 (deliver) / leg4 (pickup)
A variant on `teapot` (after the boss), `{ when: 'dl3Got', not: 'dl3', event: 'sq.delivery.leg3done' }`:

**sq.delivery.leg3done**
```
teapot：「這是……大稻埕的鐵觀音？」
teapot：「呼——真香。沒有芹菜味。」
teapot：「謝謝，謝謝。這個給你們。」
[coins 80]
[flag dl3]
```

A variant on `teaLady`, `{ when: 'dl3', not: 'dl4Got', event: 'sq.delivery.leg4' }`:

**sq.delivery.leg4**
```
teaLady：「聽說你們在送東西？」
teaLady：「這罐茶，送給北投的溫泉阿嬤。」
teaLady：「泡完湯喝，最舒服。」
[flag dl4Got]
旁白：拿到「外送：一罐茶葉」。
```


---

## 第十章 天鵝船的燈塔 — 碧潭

### ch10.intro
(Entry trigger on `bitan`, once. Arrives from 新店站.)
```
[chapter 10｜天鵝船的燈塔｜04:05]
旁白：碧潭。山下，有一片安安靜靜的水。
旁白：水上，停著一排天鵝形狀的小船。
旁白：一座長長的吊橋，掛在水的上面。
magpie：「碧潭吊橋。走上去，會輕輕晃。」
bear：「晃、晃？」
mocha：「水。又是水。」
旁白：水的正中間，有一點小小的光。
旁白：一閃，一閃。像一根蠟燭。
mocha：「……那是阿嬤的蠟燭。」
mocha：「寶咖咖的『1』。」
```

### ch10.bitan.uncle.first / .again
talk: `uncleBoat` (土地公 #10, the swan-boat rental 阿伯 with a ticket box): `[{ when: 'boatUncleMet', event: 'ch10.bitan.uncle.again' }, { event: 'ch10.bitan.uncle.first' }]`

**ch10.bitan.uncle.first**
```
uncleBoat：「呵呵，囡仔，要划天鵝船喔？」
mocha：「……你現在租船？」
uncleBoat：「阿伯什麼都租，呵呵。」
uncleBoat：「水中間那個大天鵝，是船隊的大姊。」
uncleBoat：「伊撿到一根蠟燭，當成燈塔了。」
uncleBoat：「要去，就要划船。船在碼頭。」
uncleBoat：「可是今天的船，都不聽話。」
[flag boatUncleMet]
```

**ch10.bitan.uncle.again**
```
uncleBoat：「慢慢划，水不會跑。呵呵。」
```

### ch10.bitan.bridge
(A trigger at the middle of the suspension bridge, once. **The mid-chapter beat:** 黑糖 freezes, and Mocha talks him across.)
```
旁白：吊橋，輕輕地晃了一下。
bear：「…………」
旁白：黑糖，停在橋的正中間，不動了。
bear：「下、下面是水……橋在晃……」
bear：「我、我走不動……」
mocha：「…………」
mocha：「黑糖。我跟你說。」
mocha：「我也怕。我超怕水。」
bear：「……你也怕？」
mocha：「怕得要死。」
mocha：「所以，我們一起怕。」
mocha：「一起怕，就比較不怕。」
旁白：摩卡貓，走在黑糖的腳旁邊。一步，一步。
旁白：寶咖咖，抓著黑糖的毛。一步，一步。
bear：「……到、到了。」
magpie：「（小聲）摩卡今天好帥。」
mocha：「我聽到了。」
[flag bridgeCrossed]
```

### ch10.bitan.swans
talk: `swanlings` fixed fight at the boat dock (not: swanlingsDone)
```
旁白：碼頭上，三艘小天鵝船擠成一團。
旁白：「呱！呱！燈塔！我們要去燈塔！」
mocha：「它們只是想回到大姊身邊。」
[battle swanling, swanling, swanling]
[flag swanlingsDone]
旁白：小天鵝船們，安靜地排好了。
旁白：其中一艘，往前推了推，好像在說：上來。
```

### ch10.bitan.boarding
talk: `boardBoat` (the calmed swan boat at the dock), `when: swanlingsDone`, not `swanDone`
```
旁白：大家坐上了天鵝船。
mocha：「…………」
旁白：摩卡貓，坐在最中間。尾巴縮得好緊。
baokaka：「喵喵。」
旁白：寶咖咖，把摩卡貓抱在懷裡。
mocha：「……好啦。抱著。」
bear：「我、我來踩！」
旁白：嘎吱嘎吱——天鵝船，往水中間前進。
[goto bitan 11,6]
```
(The boat ride is a cutscene `goto` to the floating platform tiles in the middle of the lake: a small island of `floor` tiles on the `bitan` grid, reachable only by this event. Its return is `ch10.bitan.backToDock`, a talk on the boat once `swanDone`.)

### ch10.bitan.boss
talk: `swanQueen` on the floating platform (not: swanDone)
```
旁白：水的中間，有一艘好大的天鵝船。
旁白：頭上，頂著一根「1」的生日蠟燭。
swanQueen：「呱！誰來了？不要靠近我的燈塔！」
mocha：「那是生日蠟燭。不是燈塔。」
swanQueen：「晚上的水，好黑。」
swanQueen：「沒有燈，小天鵝們會迷路的！」
swanQueen：「這個燈，我不還！」
magpie：「她『大翅膀拍水』打全部，先護盾！」
[boss swanQueen]
[flag swanDone]
swanQueen：「呱……好吧……」
swanQueen：「可是，沒有燈，孩子們怎麼辦……」
旁白：大家看著水。
旁白：水面上，有一個圓圓的、亮亮的月亮。
bear：「……那個。」
bear：「天上有一個月亮，水裡也有一個。」
bear：「它們，可以當燈塔。」
swanQueen：「……！」
swanQueen：「真的耶。一直都在。」
swanQueen：「我怎麼都沒有發現。」
旁白：天鵝船大姊，把蠟燭還給了寶咖咖。
[flag got_candle]
旁白：拿回了「一歲的蠟燭」！
[coins 160]
swanQueen：「那朵雲，剛剛也在這裡。」
swanQueen：「它想像我們一樣，在水上飄。」
swanQueen：「可是它是風。它一直轉，停不下來。」
swanQueen：「最後，它冷得發抖，往北投去了。」
magpie：「北投。溫泉。它想取暖。」
```

### ch10.bitan.backToDock
talk: `boardBoat` on the platform, `when: swanDone`
```
旁白：嘎吱嘎吱——天鵝船，回到碼頭。
mocha：「…………我坐完了。」
mocha：「我坐完一整趟船了。」
magpie：「這叫……突破自我。」
mocha：「不要記下來。」
[goto bitan 4,12]
```

### ch10.bitan.clerk
```
[flag clerk_bitan]
clerk：「叮咚～歡迎光臨！」
clerk：「碧潭分店。可以看天鵝船。」
mocha：「你們連水邊都有。」
clerk：「水邊比較涼。」
[shop chickenCutlet, braisedRice, meatBall, grassJellyTea, brownSugarMilk, redTurtleCake, mangoIce]
```

### ch10.bitan.pavilion
talk: `pavilion` (a pavilion under the bridge)
```
旁白：吊橋下面的涼亭。風，輕輕的。
[inn 20]
```

### ch10.bitan.jogger
talk: `riverJogger` (a riverside cyclist on a public bike)
```
riverJogger：「河濱自行車道，騎到這裡剛剛好。」
riverJogger：「我聽說那朵雲啊——」
riverJogger：「大到碧潭都裝不下！」
mocha：「……我們剛剛看到它的燈了。」
mocha：「不對，那是蠟燭。」
```

### stamp.bitan
```
旁白：吊橋的橋頭，有一個紀念章台。
旁白：蓋——！「碧潭」，一艘天鵝船的章。
[flag stamp_bitan]
```

### sq.swanRace (optional)
talk: `raceSwan` (a cheeky swan boat at the dock, `when: swanDone`, not `swanRaceWon`)
```
raceSwan：「呱！大姊說，你們很厲害。」
raceSwan：「跟我們比一場！三艘一起上！」
mocha：「我不要再坐船了。」
raceSwan：「不用坐！在碼頭上比！」
[battle swanling, swanling, swanling]
[flag swanRaceWon]
raceSwan：「呱……你們贏了。這個給你們。」
[give mangoIce ×2]
[coins 60]
旁白：得到 芒果冰 ×2 和 60 個銅板！
```

**Chests (bitan):** `bitan-ice` → 芒果冰 · `bitan-cutlet` → 雞排 ×2 · `bitan-jelly` → 仙草茶 ×2

---

## 第十一章 北投的熱呼呼 — 北投溫泉

### ch11.intro
```
[chapter 11｜北投的熱呼呼｜04:25]
旁白：北投。到處都在冒煙，暖暖的。
旁白：空氣裡，有一股煮蛋的味道。
mocha：「水。到處都是熱水。」
mocha：「我要回家。」
bear：「這裡好暖。我喜歡。」
```

### ch11.beitou.bookworm
talk: `bookworm` (at the library)
```
bookworm：「噓——圖書館裡請保持安靜。」
magpie：「一隻書蟲？你讀過幾本書？」
bookworm：「讀過？我吃過三千本。」
magpie：「…………吃的不算！」
bookworm：「那朵雲，剛剛從窗外飛過去。」
bookworm：「我看得很清楚。它其實——」
bookworm：「只有枕頭那麼大。」
mocha：「……枕頭？」
bookworm：「一個小小的枕頭。濕濕的。在哭。」
bear：「…………」
bear：「跟我一樣。躲起來哭。」
```

### ch11.beitou.uncle.first / .again
talk: `uncleBath`: `[{ when: 'bathGave', event: 'ch11.beitou.uncle.again' }, { event: 'ch11.beitou.uncle.first' }]`

**ch11.beitou.uncle.first**
```
uncleBath：「呵呵，囡仔，來泡湯喔？」
mocha：「你這次戴毛巾。」
uncleBath：「呵呵，泡湯要戴毛巾嘛。」
uncleBath：「泡泡腳，心就軟了。」
uncleBath：「有些話，腳暖了才講得出來。」
uncleBath：「來，這個帶著。」
[give redTurtleCake]
[flag bathGave]
旁白：得到 紅龜粿！
```

**ch11.beitou.uncle.again**
```
uncleBath：「地熱谷的煙，臭臭的，可是不壞。」
```

### ch11.beitou.onsen / .again
talk: `onsenGran`: `[{ when: 'mochaTalk2', event: 'ch11.beitou.onsen.again' }, { event: 'ch11.beitou.onsen' }]`

**ch11.beitou.onsen**
(The first visit is free and plays Mocha's heart-to-heart.)
```
onsenGran：「乖孫，來，阿嬤這邊有泡腳池。」
onsenGran：「第一次，免錢。泡一下。」
[heal]
旁白：寶咖咖的腳丫子，啪啦啪啦踢著熱水。
baokaka：「哇！哇！」
mocha：「……我不泡。我是貓。」
旁白：寶咖咖拍拍旁邊的水。
baokaka：「喵喵。一起。」
mocha：「…………」
旁白：摩卡貓，很慢很慢地，把一隻腳放進水裡。
mocha：「……燙。」
mocha：「……其實，還好。」
mocha：「寶咖咖。你出生那天，我躲在床底下。」
mocha：「躲了一整天。」
mocha：「我以為家裡有了新寶寶，就不要我了。」
mocha：「後來，你哭了一整晚。」
mocha：「只有我在旁邊的時候，你才不哭。」
baokaka：「摩……」
mocha：「嗯？你說什麼？」
baokaka：「……ㄋㄟㄋㄟ。」
mocha：「……我就知道。」
magpie：「（小聲）差一點點。」
bear：「（小聲）差一點點。」
[flag mochaTalk2]
```

**ch11.beitou.onsen.again**
```
onsenGran：「泡腳，三十個銅板，泡到好。」
[inn 30]
```

### ch11.beitou.clerk
talk: `clerk`
```
[flag clerk_beitou]
clerk：「叮咚～歡迎光臨！」
clerk：「溫泉區分店。有賣溫泉蛋。」
mocha：「那個不是道具吧。」
clerk：「沒有。賣完了。」
[shop pineappleCake, chickenCutlet, braisedRice, bubbleTea, brownSugarMilk, redTurtleCake, mangoIce]
```

### stamp.beitou
```
旁白：新北投站前面，有一個紀念章台。
旁白：蓋——！「新北投」，一個冒煙的溫泉章。
[flag stamp_beitou]
```

### ch11.beitou.sulfur
talk: `sulfur` fixed fight at the 地熱谷 gate (not: sulfurDone)
```
旁白：地熱谷的門口，三團黃黃的煙飄過來。
sulfur：「歹勢……我們有點臭……」
bear：「沒、沒關係！我也常常說歹勢！」
sulfur：「可是我們停不下來！轉轉轉！」
[battle sulfurPuff, sulfurPuff, sulfurPuff]
[flag sulfurDone]
sulfur：「呼……好多了，謝謝……」
```

### ch11.beitou.boss
talk: `egg` at the 地熱谷 (not: eggDone)
```
旁白：地熱谷的綠色池子旁，坐著一顆大蛋。
旁白：頭上頂著毛巾，脖子上掛著聽診器。
egg：「咳咳！老夫正在看病，別吵！」
mocha：「你在看誰的病？」
egg：「看老夫自己的！」
egg：「老夫在這裡煮了一百年，一定生病了！」
egg：「這個亮亮的東西，會告訴老夫答案。」
egg：「可是老夫不會用！氣死了！」
magpie：「『溏心爆發』很痛，要先準備！」
[boss onsenEgg]
[flag eggDone]
egg：「咳……咳……老夫……輸了……」
旁白：寶咖咖拿起聽診器，貼在蛋爺爺身上。
baokaka：「咚咚。」
egg：「……怎、怎麼樣？老夫還有救嗎？」
mocha：「醫生說：你很健康。」
mocha：「只是煮太久，有點硬。」
egg：「……嗚。」
egg：「一百年了，第一次有人幫老夫看病。」
[flag got_stethoscope]
旁白：拿回了「聽診器」！（照顧人）
[coins 150]
egg：「那朵雲，剛剛來這裡取暖。」
egg：「暖了一點，又往山上飛了。」
egg：「它說，要爬過山，飛出去。」
magpie：「陽明山。台北最高的山。」
magpie：「新北投站外面，有上山的公車。」
```

(`咚咚` is an exception to Baokaka's vocabulary: it's a sound effect, not a word. So is 「汪！」 in `sq.riders.dogAunt`.)

**Chests (beitou):** `beitou-milk` → 黑糖珍奶 · `beitou-ice` → 芒果冰 · `beitou-cutlet` → 雞排 ×2


### sq.magpie.graduate
A variant on `bookworm`, `{ when: 'notesAll', not: 'magpieGrad', event: 'sq.magpie.graduate' }` (`notesAll` derived from `note1`–`note3`).
```
magpie：「書、書蟲先生。」
magpie：「我集滿了三頁筆記。」
bookworm：「讓我看看。」
bookworm：「盆地。茶的歷史。飛機為什麼會飛。」
bookworm：「……字很醜。」
magpie：「…………」
bookworm：「可是，每一頁都很認真。」
bookworm：「旁聽三年。沒有學分，沒有證書。」
bookworm：「還是每天來聽。」
bookworm：「這比什麼都厲害。」
旁白：書蟲，在一張小卡片上，咬出了幾個字。
旁白：「榮譽旁聽證書　藍教授」
magpie：「…………」
magpie：「我、我可以叫自己教授了嗎？」
bookworm：「你本來就可以。」
[give profGlasses]
[flag magpieGrad]
旁白：得到 藍教授的眼鏡！（阿藍專用）
mocha：「……恭喜，教授。」
magpie：「這叫……苦盡甘來。」
mocha：「對的。」
```

### sq.delivery.leg4done / leg5
A variant on `onsenGran` (above `.again`), `{ when: 'dl4Got', not: 'dl4', event: 'sq.delivery.leg4done' }`:

**sq.delivery.leg4done**
```
onsenGran：「貓空的茶！乖孫，你們真貼心。」
onsenGran：「阿嬤請你們，泡腳免費。」
[heal]
[flag dl4]
onsenGran：「對了，這顆溫泉蛋，幫阿嬤送去淡水。」
onsenGran：「給那個畫畫的少年。他都不吃早餐。」
[flag dl5Got]
旁白：拿到「外送：一顆溫泉蛋」。
```


---

## 第十二章 霧裡的大水牛 — 陽明山

### ch12.bus
(Talk on the `busStop` NPC in `beitou`, `when: eggDone`. The exit to `yangming`.)
```
旁白：新北投的路邊，有一個公車站牌。
旁白：一台亮著月亮燈的小公車，停了下來。
旁白：上面寫著：「月亮公車・往陽明山」。
busDriver：「上山的喔？上車上車。」
旁白：嗶——！月亮票，也可以坐公車。
busDriver：「山路彎彎，抓好喔。」
[goto yangming 2,13]
```

### ch12.intro
(Entry trigger on `yangming`, once.)
```
[chapter 12｜霧裡的大水牛｜04:45]
旁白：陽明山。好冷，好多霧。
旁白：竹子湖的田裡，開滿了白色的花。
magpie：「海芋。竹子湖最有名的花。」
bear：「…………」
bear：「山的味道。」
bear：「我……好像，很久以前，聞過。」
mocha：「黑糖？」
bear：「沒事。我、我很好。」
```

### ch12.yangming.uncle / .again
talk: `uncleFarm` (土地公 #12, a calla-lily farmer in a straw hat): `[{ when: 'farmUncleMet', event: 'ch12.yangming.uncle.again' }, { event: 'ch12.yangming.uncle' }]`

**ch12.yangming.uncle**
```
uncleFarm：「呵呵，囡仔，來看海芋喔？」
mocha：「…………」
mocha：「你到底有幾個？」
uncleFarm：「一個啦，呵呵。」
mocha：「……蛤？」
uncleFarm：「山上霧大，擎天崗那邊更大。」
uncleFarm：「那裡的大水牛，被風吹得看不到路。」
uncleFarm：「還有一隻小牛，迷路了。在小油坑那邊。」
[flag farmUncleMet]
```

**ch12.yangming.uncle.again**
```
uncleFarm：「海芋要送人，要整束的才好看。」
uncleFarm：「呵呵，慢慢仔來。」
```
(「一個啦」 is the most direct 土地公 hint in the game.)

### ch12.yangming.calf / .follow / .home
talk: `lostCalf` at 小油坑 (not: calfHome): `[{ when: 'calfFollowing', event: 'ch12.yangming.calf.follow' }, { event: 'ch12.yangming.calf' }]`
**The mid-chapter gate:** the 擎天崗 exit opens `when: calfFollowing` (the herd lets you in because you bring the calf).

**ch12.yangming.calf**
```
旁白：冒煙的石頭旁邊，有一隻小小的牛。
calf：「哞……哞……媽媽……」
calf：「霧好大，我找不到大家……」
bear：「我、我也常常找不到大家。」
bear：「跟著我。我很大，你看得到我。」
[flag calfFollowing]
旁白：小牛跟在黑糖後面了。
```

**ch12.yangming.calf.follow**
```
calf：「哞。（我在這裡。）」
```

### ch12.yangming.gateBlocked
(The exit to `qingtiangang`, blocked before `calfFollowing`.)
```
旁白：霧好濃。前面什麼都看不到。
旁白：遠遠的，有牛在叫：「孩子呢——」
mocha：「好像有誰在找誰。」
```

### ch12.yangming.callaLily (sq.callaLily, optional)
talk: `callaField` (a calla patch with a little sign 「自己採，一束五十」), not `gotLily`
```
旁白：海芋田的牌子：「自己採，一束五十」。
mocha：「給阿嬤？」
baokaka：「要！」
[coins -50]
[flag gotLily]
旁白：採了一束白白的海芋。（銅板 -50）
mocha：「明天，放在抓周盤旁邊。」
```
(Ending variant: if `gotLily`, `ending.party` adds `ending.party.lily` right after 「紅龜粿、油飯、紅蛋」.)

### ch12.yangming.clerk
```
[flag clerk_yangming]
clerk：「叮咚～歡迎光臨！」
clerk：「國家公園分店。」
mocha：「……山上？」
clerk：「山上。」
[shop chickenCutlet, braisedRice, meatBall, grassJellyTea, brownSugarMilk, redTurtleCake, mangoIce]
```

### ch12.yangming.farmhouse
talk: `farmhouse`
```
旁白：竹子湖的農家，亮著一盞小燈。
旁白：「進來烤火喔。」
[inn 25]
```

### stamp.yangming
(The stamp stand is in `qingtiangang`.)
```
旁白：草原的入口，有一個紀念章台。
旁白：蓋——！「擎天崗」，一頭水牛的章。
[flag stamp_yangming]
```

---

### ch12.qingtiangang.intro
(Entry trigger on `qingtiangang`, once.)
```
旁白：擎天崗。一大片草原，被霧包起來了。
旁白：霧裡，有好多牛的影子。
calf：「哞！是大家！」
旁白：小牛跑進了霧裡。
旁白：一頭大大的母牛，走過來，聞了聞小牛。
cowMom：「孩子……謝謝你們。」
cowMom：「可是牛大王，被風吹暈了。」
cowMom：「他在草原的最上面，一直撞霧。」
[flag calfHome]
```

### ch12.qingtiangang.pampas
talk: `pampasGuards` fixed fight on the grass path (not: pampasDone)
```
旁白：三叢芒草，被風吹得東倒西歪。
旁白：「沙沙沙！停不下來！沙沙沙！」
[battle pampas, pampas, pampas]
[flag pampasDone]
旁白：芒草們，慢慢站直了。
```

### 黑糖爬山 (sq.bear, 黑糖's side story)
talk: `smallPeak` (a small grassy knoll with a wooden marker 「小山頂」), not `bearPeak`
```
旁白：草原旁邊，有一個小小的山頂。
mocha：「上面，說不定看得到那朵雲。」
bear：「…………」
bear：「我、我上去看。」
magpie：「你不是怕高？」
bear：「怕。」
bear：「可是，這裡的山，好像在叫我。」
旁白：黑糖，一步一步往上爬。
旁白：腳在發抖。
baokaka：「黑糖！要！」
mocha：「他說：『加油。』」
magpie：「加油！」
旁白：黑糖，爬到了最上面。
bear：「……哇。」
bear：「好高。好可怕。」
bear：「可是……好漂亮。」
bear：「我小時候，一定是在這樣的山上。」
bear：「我忘記了。可是，腳記得。」
旁白：遠遠的，海那邊，有一團小小的雲。
bear：「……在那裡。它往海的方向去了。」
[give courageScarf]
[flag bearPeak]
旁白：黑糖的紅圍巾，被山風吹得飄起來。
旁白：得到 勇氣圍巾！（黑糖專用）
```

### ch12.qingtiangang.boss
talk: `buffalo` at the top of the grassland (not: cowDone; appears `when: pampasDone`)
```
旁白：草原的最上面，有一頭好大的水牛。
旁白：牛角上，掛著一張紅色的卡片。
buffalo：「哞——！看不見！什麼都看不見！」
buffalo：「霧！霧！走開！」
mocha：「他把霧當成敵人了。」
buffalo：「誰！誰在那裡！哞——！」
magpie：「他『牛角衝撞』很痛，黑糖擋前面！」
bear：「好！」
[boss buffalo]
[flag cowDone]
buffalo：「哞……我……冷靜了……」
buffalo：「霧還在。可是，我看得到你們了。」
旁白：牛角上的卡片，掉了下來。
旁白：是阿嬤寫的生日邀請卡。
旁白：最下面那一張，名字的地方，空空的。
[flag got_invite]
旁白：拿回了「空白的邀請卡」！
[coins 190]
buffalo：「那朵雲，想從這裡爬過山。」
buffalo：「可是山太高了。它爬了好幾次。」
buffalo：「最後，它哭著往淡水去了。」
buffalo：「它說，它想看海。」
magpie：「淡水……河的盡頭，就是海。」
旁白：月亮公車的燈，在山下亮了起來。
```

### ch12.qingtiangang.cowMom.after
talk: `cowMom`, `when: cowDone`
```
cowMom：「謝謝你們，讓大家都冷靜下來。」
cowMom：「那朵雲……其實很小，對吧？」
cowMom：「小小的。在哭。跟我的孩子一樣。」
```

**Chests (yangming):** `yang-jelly` → 仙草茶 ×2 · `yang-milk` → 黑糖珍奶 · `yang-turtle` → 紅龜粿 ×2
**Chests (qingtiangang):** `qtg-ice` → 芒果冰 ×2 · `qtg-meatball` → 肉圓 ×3
**Exits:** `yangming` bus stop → `ch12.busBack` (goto `beitou` bus stop); from `beitou`, the MRT opens 淡水.

### ch12.busBack
```
busDriver：「下山囉。抓好。」
[goto beitou 3,14]
```

---

## 第十三章 河的盡頭是海 — 淡水

### ch13.intro
```
[chapter 13｜河的盡頭是海｜05:00]
旁白：淡水。河流到這裡，就變成了海。
旁白：天空，從黑色慢慢變成深藍色。
旁白：河口上，有一座好高好高的新大橋。
旁白：只有一根柱子，拉著好多好多條線。
magpie：「淡江大橋。根據我的研究——」
magpie：「單塔斜張橋裡，跨距全世界最長。」
bear：「一、一根柱子撐那麼長？好勇敢……」
mocha：「五點了。只剩半個小時。」
bear：「阿、阿嬤會不會已經起床了……」
mocha：「阿嬤很準時。五點半，一分鐘都不差。」
```

### ch13.tamsui.painter / .after / .again
talk: `painter`: `[{ when: 'portrait', event: 'ch13.tamsui.painter.again' }, { when: 'crabDone', event: 'ch13.tamsui.painter.after' }, { event: 'ch13.tamsui.painter' }]`

**ch13.tamsui.painter**
```
painter：「我的畫筆……被風吹走了。」
painter：「我每天早上，都來這裡等夕陽。」
mocha：「現在是早上五點。」
painter：「藝術家，沒有時間觀念。」
painter：「對了，我看到那朵雲了。」
painter：「在漁人碼頭，繞著大橋的柱子轉。」
painter：「小小的，一直在哭。」
painter：「還有一隻螃蟹，拿著小畫筆在亂畫。」
```

**ch13.tamsui.painter.after**
```
painter：「你們把螃蟹勸走了？」
painter：「那枝小畫筆……可以借我一下嗎？」
baokaka：「要！」
painter：「謝謝！我幫你們畫一張。不要動喔。」
旁白：唰、唰、唰——
painter：「好了！一隻貓、一隻鳥、一隻熊……」
painter：「還有一個，很勇敢的寶寶。」
painter：「畫筆還你。這張畫，送你們。」
[flag portrait]
旁白：得到了一張畫。（結局的時候會看到。）
```

**ch13.tamsui.painter.again**
```
painter：「天要亮了。我要開始等夕陽了。」
```

### ch13.tamsui.uncle.first / .again
talk: `uncleFerry`: `[{ when: 'ferryTalk', event: 'ch13.tamsui.uncle.again' }, { event: 'ch13.tamsui.uncle.first' }]`

**ch13.tamsui.uncle.first**
```
uncleFerry：「呵呵，囡仔，坐船喔？」
mocha：「…………」
mocha：「好啦，我不問了。」
uncleFerry：「呵呵。你們看這條河。」
uncleFerry：「從山裡流出來，繞過整個台北。」
uncleFerry：「流啊流，最後就流到海。」
uncleFerry：「迷路的東西，跟著河走，就會到家。」
magpie：「……台北盆地，唯一的出口。」
uncleFerry：「呵呵，慢慢仔來。」
[flag ferryTalk]
```

**ch13.tamsui.uncle.again**
```
uncleFerry：「河一直流，就會流到海。」
```

### ch13.tamsui.agei
talk: `ageiGran`
```
ageiGran：「阿給～魚丸湯～鐵蛋～」
ageiGran：「風這麼大，雨衣也帶一件啦。」
[shop chickenCutlet, braisedRice, mangoIce, brownSugarMilk, redTurtleCake, raincoat]
```

### ch13.tamsui.clerk
talk: `clerk`
```
[flag clerk_tamsui]
clerk：「叮咚～歡迎光臨！」
clerk：「淡水分店。可以看海。」
[shop pineappleCake, chickenCutlet, braisedRice, bubbleTea, brownSugarMilk, mangoIce, redTurtleCake]
```

### ch13.tamsui.backpacker
talk: `backpacker`
```
backpacker：「Beautiful river! But… where is 101?」
baokaka：「ㄅㄚ！」
mocha：「他說：『快了。下一站。』」
backpacker：「Really?!」
mocha：「真的。這次是真的。」
```

### ch13.tamsui.bench
talk: `bench`
```
旁白：河邊的長椅。看著河，什麼都不想。
[inn 0]
```

### stamp.tamsui
```
旁白：情人橋的入口，有一個紀念章台。
旁白：蓋——！「淡水」，一座白色的橋的章。
[flag stamp_tamsui]
```

### ch13.tamsui.soldiers
talk: `crabSoldier` fixed fight on the bridge approach (not: soldiersDone)
```
旁白：情人橋前面，三隻小螃蟹舉著大螯。
crabSoldier：「敬禮！將軍正在作畫！」
crabSoldier：「閒雜人等，橫著走開！」
mocha：「我們不會橫著走。」
[battle fiddlerCrab, fiddlerCrab, fiddlerCrab]
[flag soldiersDone]
crabSoldier：「報、報告將軍……我們輸了……」
```

### ch13.tamsui.boss
talk: `crab` at the foot of the bridge (not: crabDone; appears `when: soldiersDone`)
```
旁白：情人橋邊，一隻大螃蟹拿著小畫筆在亂畫。
旁白：橋上，塗滿了紅紅橘橘的顏色。
crab：「本將軍在畫夕陽！你們擋到光了！」
mocha：「現在是早上五點。」
crab：「本將軍說是夕陽，就是夕陽！」
magpie：「這叫……指鹿為馬！」
mocha：「……對了。你今天狀況很好。」
magpie：「我一直狀況很好。」
crab：「看本將軍的『夕陽大剪』！」
[boss crabGeneral]
[flag crabDone]
crab：「本、本將軍……畫得不好嗎……」
baokaka：「好看！」
mocha：「他說：『顏色很漂亮。只是時間不對。』」
crab：「……謝謝。畫筆，還你們。」
[flag got_brush]
旁白：拿回了「畫筆」！（會畫圖）
[coins 170]
旁白：九樣寶物，全部找回來了。
mocha：「還差一個。金鎖片。」
mocha：「……漁人碼頭那邊。大橋上面。」
```

### ch13.tamsui.shushu
(Trigger under the bridge, `when: crabDone`, once.)
```
旁白：漁人碼頭的堤防。對面，是新大橋。
旁白：大橋的柱子頂端，有一團小小的雲。
旁白：它一圈一圈，繞著柱子轉。
旁白：看到大家，它慢慢飄了下來。
旁白：灰灰藍藍的，只有枕頭那麼大。
旁白：雲的中間，掛著一片亮晶晶的金鎖片。
cloud：「……不要過來。」
mocha：「我們不是來罵你的。」
shushu：「騙人！大家看到咻咻，都說『快走』！」
shushu：「一年前也是！咻咻一來，大家就關窗戶！」
shushu：「只有一個地方，大家在笑……」
shushu：「有一個寶寶出生了，大家都在笑。」
旁白：寶咖咖，慢慢爬了過去。
shushu：「咻咻也想要有人笑……」
shushu：「咻咻也一歲了……」
shushu：「可是咻咻，沒有生日！」
shushu：「飛機在睡覺。柱子不夠高。」
shushu：「咻咻……出不去……」
旁白：雲打了一個好大的噴嚏——
旁白：哈——啾——！
旁白：一陣狂風！大家都被吹倒了。
shushu：「咻咻要去最高的地方！」
shushu：「離天空最近的地方！」
shushu：「那裡，沒有人會叫咻咻走！」
旁白：咻——雲飛走了。往城市那一邊。往101。
mocha：「……同一天。」
magpie：「一年前的颱風，和寶咖咖出生的晚上。」
bear：「它跟寶咖咖……一樣大。」
mocha：「…………」
mocha：「寶咖咖。我要跟你說實話。」
mocha：「寶物會飛走……是我的錯。」
mocha：「阿嬤叫我顧好，我睡著了。」
mocha：「我一直不敢說。」
旁白：寶咖咖爬過去，把臉貼在摩卡貓身上。
baokaka：「抱抱。」
mocha：「……你不怪我？」
baokaka：「抱抱。」
magpie：「這叫……既往不咎。」
magpie：「……咦？我用對了？」
mocha：「你用對了。」
bear：「（擤鼻涕）好、好感人……」
mocha：「……走吧。去101。」
mocha：「這次，換我們去找它。」
[flag metShushu]
```

**Chests (tamsui):** `tamsui-raincoat` 紅毛城 → 機車雨衣 · `tamsui-ice` → 芒果冰 ×2 · `tamsui-turtle` → 紅龜粿 ×2


### ch13.tamsui.ferry
A talk on `uncleFerry` (always available after `ferryTalk`; it's the route to `fisherman`; place it as the NPC's second rule): `{ when: 'ferryTalk', event: 'ch13.tamsui.ferry' }`
```
uncleFerry：「要去漁人碼頭喔？坐阿伯的船。」
mocha：「…………好。」
magpie：「摩卡？你要坐船？」
mocha：「我坐過天鵝船了。」
mocha：「我泡過溫泉了。」
mocha：「我……不怕了。一點點而已。」
bear：「（小聲）一起怕，就比較不怕。」
旁白：嘟——渡輪，離開了碼頭。
旁白：河的兩邊，燈慢慢變少。
旁白：前面，就是海，和那座新大橋。
[goto fisherman 2,8]
```
(`fisherman` is the 漁人碼頭 sub-map: the 情人橋, the seawall, the boardwalk and the 淡江大橋 backdrop all move here. `tamsui` keeps the 老街, 紅毛城 and promenade. Return via `uncleFerryBack` on the `fisherman` pier: 「回老街喔？」 then `[goto tamsui …]`.)

### sq.delivery.leg5done
A variant on `painter` (top), `{ when: 'dl5Got', not: 'dl5', event: 'sq.delivery.leg5done' }`
```
painter：「溫泉蛋？北投的阿嬤給我的？」
painter：「……她還記得我不吃早餐。」
painter：「謝謝。這給你們，路上用。」
[coins 100]
[flag dl5]
旁白：外送小哥，咻地騎過來。
deliveryRider：「全部送完了？厲害！」
deliveryRider：「這個保溫袋送你們。」
deliveryRider：「以後，你們就是外送界的傳說。」
[give deliveryBag]
旁白：得到 外送保溫袋！
```

### sq.lostFound.painterHat (return)
A variant on `painter`, `{ when: 'lf_painterHat', not: 'lf_painterHatBack', event: 'sq.lostFound.painterHat' }`
```
painter：「我的貝雷帽！在陽明山找到的？」
painter：「藝術家沒有帽子，就沒有靈感。」
painter：「謝謝！」
[coins 60]
[flag lf_painterHatBack]
```

### sq.backpacker.tamsui
A variant on `backpacker` in `tamsui`, `{ when: 'bp_airport', event: 'sq.backpacker.tamsui' }` (above `gag.ch13.backpackerTea`)
```
backpacker：「I took the MRT! 嗶!」
backpacker：「Now… one more station?」
mocha：「一站。紅線。台北101。」
backpacker：「I will see you there!」
[flag bp_tamsui]
```


---

## 第十四章 離天空最近的地方 — 台北101

### ch14.intro
(Entry trigger on `tower`, once. Includes the bible's elevator scene.)
```
announcer：「月亮線，終點站，台北101。」
announcer：「外面風很大，請緊握扶手。」
旁白：台北101。全台北最高的地方。
旁白：叮——電梯門打開了。
magpie：「根據我的研究，這台電梯超快。」
magpie：「從五樓到八十九樓，只要三十七秒！」
bear：「三、三十七秒？那不是很快嗎？」
旁白：咻——————
bear：「哇啊啊啊啊——！」
旁白：叮。八十九樓。
bear：「……我、我的耳朵……」
mocha：「吞口水。」
旁白：窗外，天空變成了紫色。
mocha：「五點十五分。快沒時間了。」
```

### ch14.tower.uncle.first / .again
talk: `uncleTower`: `[{ when: 'towerUncleGave', event: 'ch14.tower.uncle.again' }, { event: 'ch14.tower.uncle.first' }]`

**ch14.tower.uncle.first**
```
uncleTower：「呵呵，囡仔，這麼早來看風景？」
mocha：「…………」
uncleTower：「呵呵……咱是不是見過？」
mocha：「那是我的台詞！」
uncleTower：「呵呵呵。」
uncleTower：「上面那個孩子啊，等一個人很久了。」
uncleTower：「不是等人打它。是等人抱它。」
uncleTower：「來，這帶上去。上面風大。」
[give mangoIce ×2]
[flag towerUncleGave]
旁白：得到 芒果冰 ×2！
```

**ch14.tower.uncle.again**
```
uncleTower：「阻尼器那顆大球，晃得頭暈了。」
uncleTower：「先讓它站穩，樓梯才會開。」
```

### ch14.tower.clerk
talk: `clerk`
```
[flag clerk_tower]
clerk：「叮咚～歡迎光臨！」
mocha：「101。」
clerk：「我們在101也有分店。」
magpie：「你們到底有幾間？」
clerk：「很多。」
[shop chickenCutlet, braisedRice, mangoIce, brownSugarMilk, railBento, redTurtleCake]
```

### ch14.tower.souvenir
talk: `souvenir`
```
souvenir：「歡迎光臨，101紀念品店～」
souvenir：「風這麼大，買件雨衣吧！」
[shop raincoat, helmet, tigerShoes, flowerVest, mangoIce]
```

### ch14.tower.window
talk: `bigWindow`
```
旁白：從大窗戶看出去，台北還在睡覺。
旁白：每一扇亮著的窗戶裡，都有一個家。
[inn 0]
```

### stamp.tower
```
旁白：觀景台的角落，有一個紀念章台。
旁白：蓋——！「台北101」，一節一節竹子的章。
[flag stamp_tower]
```

### ch14.tower.damper
talk: `damper` at the damper railing (not: damperDone)
```
旁白：觀景台中間，掛著一顆好大的金色球。
旁白：大球晃來晃去。一直晃。停不下來。
damper：「晃……晃……我停不下來……」
magpie：「這是阻尼器！」
magpie：「風吹的時候，它負責讓大樓站穩。」
damper：「可是今天的風……太奇怪了……」
damper：「我晃得……好暈……」
bear：「我、我來扶你！」
damper：「不要過來……我會撞到你……」
mocha：「那就讓它晃到累。大家，準備！」
[boss damperBall]
[flag damperDone]
旁白：大球慢慢地、慢慢地，停下來了。
damper：「……謝謝。我叫阿穩。」
damper：「我的工作，是讓大樓站穩。」
damper：「上面那個孩子……」
damper：「你們的工作，是讓它站穩。」
[coins 200]
damper：「樓梯開了。九十一樓，戶外觀景台。」
```

### ch14.tower.stairsBlocked
```
旁白：通往樓上的樓梯在晃，現在上不去。
mocha：「先讓那顆大球停下來。」
```

### ch14.tower.bearBrave
(Trigger in front of the stairs, `when: damperDone`, once.)
```
旁白：樓梯上面，風在呼呼叫。
bear：「…………」
mocha：「黑糖，你可以在這裡等。」
bear：「…………」
bear：「我很怕高。」
bear：「我很怕風。」
bear：「我很怕打雷、黑黑的、還有鴿子。」
bear：「可是……」
bear：「我更怕你們自己上去。」
bear：「走吧。我走前面。」
magpie：「（小聲）他這次，沒有說歹勢。」
[flag bearBrave]
```

**Chests (tower):** `tower-raincoat` → 機車雨衣 · `tower-turtle` → 紅龜粿 ×2 · `tower-milk` → 黑糖珍奶 ×2

---

### ch14.summit.intro
(Entry trigger on `summit`, once.)
```
旁白：九十一樓，戶外觀景台。
旁白：風好大。天空，是紫色的。
旁白：觀景台的盡頭，有一個……生日派對。
旁白：一張歪歪的「生日快樂」，是用招牌做的。
旁白：三把翻花的雨傘，當作裝飾。
旁白：一根蠟燭，一直被吹熄。
旁白：風停了一下下。大家喘了一口氣。
[heal]
旁白：全隊都恢復了！
```

### ch14.summit.final
talk: `shushu` (not: shushuDone)
```
shushu：「……你們來了。」
shushu：「這是咻咻的生日派對。」
shushu：「只有咻咻一個人。」
shushu：「蠟燭……一直熄掉……」
shushu：「因為咻咻是風。咻咻一吹，就熄了。」
mocha：「……阿藍，你知道該怎麼做嗎？」
magpie：「我……」
magpie：「…………」
magpie：「我不知道。」
magpie：「書上沒有寫，怎麼讓颱風不難過。」
mocha：「沒關係。」
mocha：「我知道誰知道。」
旁白：大家，都看著寶咖咖。
旁白：寶咖咖往前爬——
shushu：「不要過來！」
shushu：「這是咻咻的生日！你們會叫咻咻走！」
旁白：風，一下子變得好大好大！
bear：「站在我後面！」
[boss shushuStorm]
旁白：風，慢慢變小了。
shushu：「嗚……嗚嗚……」
旁白：雲的眼睛，掉下了一滴、兩滴……
旁白：然後，下起了好大的雨。
shushu：「嗚哇——大家都叫咻咻快走——！」
mocha：「它在哭。整個天空都在哭。」
magpie：「我的鵲橋護盾，可以擋雨！」
旁白：雨水打在臉上，涼涼的。大家又站起來了。
[heal]
[boss shushuCry]
旁白：雨，慢慢地停了。
旁白：咻咻縮成好小一團，躲在欄杆旁邊。
shushu：「……你們，會叫咻咻走嗎？」
旁白：寶咖咖，看著咻咻。
旁白：然後——
旁白：寶咖咖，用小手撐著地板。
旁白：一隻腳。
旁白：兩隻腳。
旁白：寶咖咖，站起來了。
mocha：「……！」
bear：「站、站起來了……」
magpie：「他……他要走路了……！」
旁白：一步。搖搖晃晃。
旁白：兩步。差一點跌倒。
旁白：三步。
旁白：寶咖咖，走到了咻咻的面前。
baokaka：「抱抱。」
旁白：寶咖咖，抱住了咻咻。
shushu：「……！」
shushu：「軟、軟軟的……暖暖的……」
baokaka：「一起。」
shushu：「……一起？」
mocha：「他說——」
mocha：「『一起過生日。』」
shushu：「…………」
shushu：「咻咻……可以嗎？」
baokaka：「要！」
[flag shushuDone]
旁白：咻咻的雲，慢慢變白了。軟軟的，像棉花糖。
```

(The second `[heal]` can be swapped for a 50% heal if the engine gains a ratio. If the party loses phase 2, respawn at the summit entry; on the retry, talk rules should start at phase 2: give `shushu` the rule `{ when: 'shushuPhase1', event: 'ch14.summit.retry' }` and add `[flag shushuPhase1]` right after the first `[boss]`.)

### ch14.summit.retry
```
shushu：「嗚……嗚哇——！」
mocha：「它還在哭。再一次，大家！」
[boss shushuCry]
```
(Then continue with every line of `ch14.summit.final` after `[boss shushuCry]`, from 「雨，慢慢地停了。」 through `[flag shushuDone]`. Share them as a constant.)

### ch14.summit.party
(Runs immediately after `ch14.summit.final` / `.retry`.)
```
旁白：叮咚叮咚——
announcer：「月亮線，特別列車，進站。」
announcer：「本列車，載滿了今天的朋友。」
旁白：月亮列車，停在觀景台旁邊的空中。
旁白：門打開了——
squirrel：「生日？有堅果嗎？」
goose：「鵝鵝鵝！我來朗讀生日詩！」
gate：「嗶。歡迎光臨。」
dragon：「劈哩啪啦！來跳舞！」
cutlet：「我帶了雞排！很大塊！」
teapot：「芹菜茶，大家喝。」
egg：「老夫很健康，所以來了。」
crab：「本將軍畫了一張生日卡！」
damper：「我會讓大家站穩的。」
backpacker：「I found it! 101!」
mocha：「……他終於找到了。」
mocha：「等一下。寶咖咖，拿出來。」
旁白：寶咖咖拿出陽明山找回來的邀請卡。
旁白：阿嬤寫的。名字的地方，空空的。
magpie：「我來寫。我的字……很醜。」
magpie：「可是，很認真。」
旁白：阿藍用嘴叼著筆，寫下兩個字：「咻咻」。
mocha：「你被邀請了。正式的。」
shushu：「邀……請……？咻咻？」
baokaka：「要！」
旁白：寶咖咖，又拿出碧潭找回來的「1」蠟燭。
clerk：「叮咚～需要點火嗎？」
mocha：「……你也搭這班車來？」
clerk：「我們在101也有分店。」
旁白：小小的火，點亮了。
shushu：「咻咻……不能靠近。」
shushu：「咻咻一吹，蠟燭就熄了。」
baokaka：「一起。」
旁白：咻咻，慢慢地，停止轉圈。
旁白：屏住呼吸。一動，也不動。
旁白：蠟燭的火，好好地亮著。
shushu：「……沒、沒有熄。」
mocha：「你做到了。」
karaoke：「各位，請給我一個機會。」
karaoke：「這次，我不會走音。」
karaoke：「〈生日快樂〉，預備——起！」
旁白：「祝你生日快樂～祝你生日快樂～」
旁白：（第三句，有一點點走音。）
旁白：大家都笑了。咻咻也笑了。
mocha：「好了。現在，可以吹了。」
shushu：「……可以吹？」
mocha：「生日的時候，吹蠟燭是對的。」
mocha：「先許願。」
旁白：咻咻閉上眼睛。
旁白：然後，輕輕地——呼。
旁白：蠟燭熄了。大家一起拍手。
shushu：「咻咻第一次……吹熄東西，大家在拍手。」
旁白：這時候——
旁白：太陽，從山的後面升起來了。
旁白：金色的光，照在台北每一扇窗戶上。
旁白：遠遠的，一架白色的小飛機起飛了。
旁白：它飛過101旁邊，搖了搖翅膀。
baokaka：「飛機！」
ctrlTower：「塔台呼叫101。早班機，祝生日快樂。」
ctrlTower：「Over。」
shushu：「……好亮。」
shushu：「原來，生日是這個樣子。」
shushu：「這個，還給寶咖咖。」
旁白：咻咻把金鎖片，輕輕放在寶咖咖手上。
[flag got_lock]
旁白：拿回了「金鎖片」！（阿嬤的祝福）
mocha：「紅繩呢？」
旁白：寶咖咖拿出在機場找到的紅繩。
magpie：「我來綁。我會打蝴蝶結。」
magpie：「根據我的研究——」
mocha：「綁就對了。」
旁白：紅繩穿過金鎖片，綁好了。歪歪的蝴蝶結。
shushu：「咻咻要回家了。回海裡。」
magpie：「跟著淡水河走，就會到海。」
shushu：「明年……咻咻還可以來嗎？」
baokaka：「要！」
mocha：「下次來，記得敲門。不要轉圈圈。」
shushu：「嘻嘻。好！」
旁白：咻——一陣涼涼的風，往淡水的方向去了。
```

### ch14.summit.home
(Runs immediately after `ch14.summit.party`.)
```
magpie：「今天，我學到一個新成語。」
magpie：「『抱抱解千愁』。」
mocha：「那不是成語。」
magpie：「現在是了。」
mocha：「……現在幾點？」
magpie：「五點……二十九分。」
mocha：「阿嬤！！」
announcer：「月亮線，最後一班車。」
announcer：「本列車，直達：寶咖咖的家。」
mocha：「……還有這種站？」
announcer：「今天特別。」
announcer：「請緊握扶手。」
旁白：咻——————
```


### ch14.xinyi.intro
(Entry trigger on `xinyi`, the plaza at the foot of 101, once. The MRT arrives here, and the tower's elevator lobby is the exit to `tower`; `ch14.intro`'s elevator scene plays on entering `tower`.)
```
[chapter 14｜離天空最近的地方｜05:15]
旁白：信義區。高樓一棟一棟，燈都還亮著。
旁白：抬頭一看——101，好高好高。
旁白：頂端，一團雲在轉。
bear：「好、好高……」
magpie：「五百零八公尺。根據我的研究。」
mocha：「快沒時間了。走！」
```

### ch14.xinyi.windGate
talk: `windKids` fixed fight at the entrance (not: windGateDone). **The mid-chapter gate:** the elevator lobby opens after it.
```
旁白：101的大門口，有三團小旋風在玩。
旁白：「咻咻咻！不准進去！咻咻在等人！」
mocha：「……在等人？」
旁白：「咻咻說，不想見任何人！」
旁白：「可是咻咻一直看著下面！」
[battle windKid, windKid, windKid]
[flag windGateDone]
旁白：小旋風們，咻地飛上了樓。
mocha：「它在等人。它自己也不知道。」
```

### sq.backpacker.finale
(Inserted into `ch14.summit.party`, replacing the single `backpacker` line, `when: bp_map` + `bp_airport` + `bp_tamsui`. Otherwise keep the original line.)
```
backpacker：「I found it! 101!」
backpacker：「You helped me all night.」
backpacker：「This is my lucky hat. For you.」
[give travelerHat]
旁白：得到 旅行者的帽子！
mocha：「……他終於找到了。」
```


---

## 尾聲 度晬

### ending.grandma
(Runs immediately after `ch14.summit.home`.)
```
[chapter 尾聲｜度晬｜05:30]
旁白：早上五點三十分。
旁白：阿嬤，準時起床了。
grandma：「唉唷，腰……」
grandma：「來看抓周盤……」
旁白：九樣寶物，整整齊齊。
旁白：中間，金鎖片亮晶晶。
旁白：抓周盤旁邊，摩卡貓縮成一團，睡得好熟。
grandma：「摩卡真乖，顧規暝。」
旁白：摩卡貓，偷偷睜開一隻眼睛。
旁白：然後，又閉上了。
旁白：嬰兒床裡，寶咖咖也在睡。
旁白：臉上，帶著一個大大的笑容。
旁白：遠遠的動物園裡——
旁白：一隻黑熊，抱著空杯子睡著了。
```
(For the chapter card, use `n: 0` or a dedicated flag; the title renders as 「尾聲・度晬」.)

### ending.party
(Runs immediately after `ending.grandma`.)
```
旁白：上午十點。寶咖咖的度晬派對。
旁白：紅龜粿、油飯、紅蛋，擺滿了桌子。
旁白：窗外的電線上，停著一隻藍色的鳥。
旁白：她的小眼鏡，閃了一下。
grandma：「來來來，要抓周囉！」
dad：「書！抓書！以後讀台大！」
grandma：「算盤啦！會做生意！」
mom：「抓什麼都好，抓什麼都好。」
旁白：寶咖咖，爬過了書。
dad：「啊……」
旁白：爬過了算盤。
grandma：「唉唷……」
旁白：爬過了雞腿。
mom：「……沒有抓雞腿，好意外。」
旁白：爬過了麥克風、聽診器、畫筆……
旁白：然後，抓住了——
旁白：躺在旁邊曬太陽的，摩卡貓的尾巴。
mocha：「喵！？」
dad：「……抓到貓？」
grandma：「抓到貓，就是……有愛心啦！」
grandma：「以後會照顧人。金價好！」
旁白：寶咖咖抱著摩卡貓，看著大家。
旁白：然後，清清楚楚地說——
baokaka：「摩卡。」
旁白：…………
mom：「他……他說話了！」
grandma：「會講話了！第一句！」
dad：「…………第一個字，不是爸爸。」
mocha：「…………」
mom：「摩卡，你怎麼了？」
mocha：「眼睛……進沙子了。」
旁白：這時候，一陣涼風從窗戶吹進來。
旁白：蠟燭的煙，轉成了一個小小的圈圈。
旁白：像一朵，在揮手的雲。
baokaka：「咻咻！」
dad：「第二個字，也不是爸爸！」
mom：「沒關係。第三個字一定是。」
旁白：叮咚——門鈴響了。
clerk：「叮咚～外送！生日蛋糕！」
mocha：「……你們真的到處都有。」
mom：「謝謝……咦？貓剛剛是不是講話了？」
mocha：「喵。」
[ending]
```

`摩卡` and `咻咻` are Baokaka's first and second real words. This is the only place his vocabulary grows.

### ending.card
(Text for the Ending screen title.)
```
生日快樂，寶咖咖。
生日快樂，咻咻。
```

Credits art suggestion: the 淡水 portrait (if `portrait`), then the 集章本 and the full 抓周盤.

### ending.tudigong.full / .partial
(A post-credits cutscene on the Ending screen. Use `.full` if all 14 `stamp_*` flags are set.)

**ending.tudigong.full**
```
旁白：家門口的巷子裡，有一間小小的土地公廟。
旁白：土地公的手指上，沾著一點點印泥。
tudigong：「呵呵，囡仔。」
tudigong：「台北走透透，十四個章，全部蓋滿了。」
tudigong：「阿伯說過，蓋滿了有禮物。」
tudigong：「來象山。阿伯在山上等你們。」
旁白：土地公，眨了一下眼睛。
```

**ending.tudigong.partial**
```
旁白：家門口的巷子裡，有一間小小的土地公廟。
旁白：土地公的手指上，沾著一點點印泥。
tudigong：「呵呵，囡仔，慢慢仔大。」
tudigong：「集章本，還有幾頁空空的喔。」
旁白：土地公，眨了一下眼睛。
```

### ending.hook
```
旁白：每年夏天的下午，台北都會下一場西北雨。
旁白：嘩啦嘩啦，下一下就停。
旁白：那是咻咻，回來玩了。
旁白：月亮線的看板上，寫著——
旁白：「下一站：兩歲。」
```

---

## 番外 象山看日出 (post-game)

### post.intro
(Entry trigger on `xiangshan`, once.)
```
[chapter 番外｜象山看日出｜05:30]
旁白：象山。爬了好多好多階梯。
旁白：從這裡看101，剛剛好。
bear：「這、這個高度，我可以。」
magpie：「根據我的研究，這裡是拍101最好的地方。」
mocha：「……又是根據你的研究。」
```

### post.tudigong / .partial / .again
talk: `tudigong`: `[{ when: 'caneGiven', event: 'post.tudigong.again' }, { when: 'allStamps', event: 'post.tudigong' }, { event: 'post.tudigong.partial' }]`
(`allStamps` is a derived flag, set when the 10th stamp is stamped. Add `[flag allStamps]` to whichever stamp completes the set, or compute it in the reducer.)

**post.tudigong**
```
tudigong：「呵呵，囡仔，來了喔。」
mocha：「……我就知道是你。」
tudigong：「呵呵呵。阿伯一直都在。」
tudigong：「十四個章，蓋滿了。這是禮物。」
[give earthCane]
[flag caneGiven]
旁白：得到 土地公的拐杖！
tudigong：「慢慢仔大，呵呵。」
```

**post.tudigong.partial**
```
tudigong：「呵呵，囡仔，來了喔。」
mocha：「……我就知道是你。」
tudigong：「集章本，還沒蓋滿喔。」
tudigong：「月亮線還在開，慢慢仔去蓋。」
```

**post.tudigong.again**
```
tudigong：「呵呵，慢慢仔大。」
```

### post.clerk
talk: `clerk`
```
clerk：「叮咚～歡迎光臨！」
mocha：「……山上？」
clerk：「我們在山上也有分店。」
mocha：「陽明山那間？」
clerk：「另一座山。」
[shop chickenCutlet, braisedRice, mangoIce, brownSugarMilk, railBento, redTurtleCake, raincoat]
```

### post.friends.*
(Former bosses lounging on the trail, one talk each.)

**post.friends.squirrel**
```
squirrel：「這裡的松果，比公園的大！」
```

**post.friends.goose**
```
goose：「鵝鵝鵝！我學會一個字了！」
goose：「是『鵝』。」
```

**post.friends.karaoke**
```
karaoke：「我每天練習。現在只走音一半了！」
```

**post.friends.cutlet**
```
cutlet：「我減肥了。現在只比門小一點點。」
```

**post.friends.egg**
```
egg：「老夫來爬山。醫生說要多運動。」
mocha：「醫生是指寶咖咖嗎？」
egg：「是的。」
```

**post.friends.damper**
```
damper：「從這裡看101，我在裡面，好好笑。」
```

### post.shushu / .won / .again
talk: `shushu`: `[{ when: 'bonusWon', event: 'post.shushu.again' }, { event: 'post.shushu' }]`

**post.shushu**
```
shushu：「寶咖咖！大家！」
shushu：「再玩一次！這次咻咻不會哭！」
mocha：「它說的『玩』，是會颳颱風的那種嗎？」
shushu：「嘻嘻！」
[boss shushuBonus]
[flag bonusWon]
shushu：「好好玩！好好玩！」
[give brownSugarMilk ×3]
旁白：得到 黑糖珍奶 ×3！
bear：「黑、黑糖珍奶！」
shushu：「明年還要再玩！」
```

**post.shushu.again**
```
shushu：「再玩一次？」
[boss shushuBonus]
shushu：「嘻嘻！明年見！」
```

---

---

## 支線任務 Side quests (cross-chapter)

These are all optional. Each quest's steps are flags. The 任務 log (§ 3.2 in the bible) shows the next hint per quest. Placement notes say which NPC and rule to add.

### sq.lostFound: 失物招領 (lost & found, 5 pairs)

| Item | Found (event) | Owner (return event) | Reward |
|---|---|---|---|
| 大學生的筆記 | ch3 地下街 `sq.lostFound.notes` | ch2 `student` → `sq.lostFound.notesBack` | 珍珠奶茶 ×2 |
| 街舞少年的帽子 | ch5 鴿子窩 (in `ch5.bopiliao.boss`) | ch4 `dancer` → `sq.lostFound.hat` | 40 銅板 |
| 夜跑大哥的耳機 | ch8 飛機巷 `sq.lostFound.earphones` | ch1 `runner` → `sq.lostFound.earphonesBack` | 茶葉蛋 ×5 |
| 地勤姊姊的光棒 | ch10 碧潭 `sq.lostFound.wand` | ch8 `marshal` → `sq.lostFound.wandBack` | 安全帽 |
| 畫家的貝雷帽 | ch12 擎天崗 `sq.lostFound.painterHatFind` | ch13 `painter` → `sq.lostFound.painterHat` | 60 銅板 |

All 5 returned (derived `lfAll`) → talk to the 失物招領處 window in `station` → `sq.lostFound.reward` → **招財貓**.

**sq.lostFound.notesBack** (variant on `student`, top rule: `{ when: 'lf_notes', not: 'lf_notesBack' }`)
```
student：「我的筆記！！在台北車站？」
student：「被風吹到那麼遠……」
student：「你們救了我的期末考！」
student：「這個請你們喝。我已經喝第五杯了。」
[give bubbleTea ×2]
[flag lf_notesBack]
```

**sq.lostFound.earphonesBack** (variant on `runner`, top rule: `{ when: 'lf_earphones', not: 'lf_earphonesBack' }`)
```
runner：「我的耳機！在松山機場？」
runner：「我跑步都沒跑那麼遠！」
runner：「謝謝！這些給你們，補充體力！」
[give teaEgg ×5]
[flag lf_earphonesBack]
runner：「第十五圈！出發！」
```

**sq.lostFound.wand** (find; talk `lfWand` on the 碧潭 dock, not `lf_wand`)
```
旁白：碼頭邊，有一根發光的棒子，在水上漂。
mocha：「是機場那個地勤姊姊的光棒。」
旁白：寶咖咖趴在碼頭邊，伸手一撈——撈到了。
mocha：「你不要掉下去喔！」
[flag lf_wand]
旁白：撿到「地勤姊姊的光棒」。（失物招領）
```

**sq.lostFound.wandBack** (variant on `marshal`, top rule: `{ when: 'lf_wand', not: 'lf_wandBack' }`)
```
marshal：「我的光棒！飄到碧潭去了？」
marshal：「沒有它，我只剩一根，只能指一邊。」
marshal：「謝謝！這頂安全帽給你們。」
[give helmet]
[flag lf_wandBack]
marshal：「往前、往前——停！完美。」
```

**sq.lostFound.painterHatFind** (find; talk `lfBeret` caught on the 擎天崗 芒草, not `lf_painterHat`)
```
旁白：芒草上，掛著一頂紅色的貝雷帽。
magpie：「這種帽子……是畫家戴的。」
mocha：「淡水那個等夕陽的。」
[flag lf_painterHat]
旁白：撿到「畫家的貝雷帽」。（失物招領）
```

**sq.lostFound.reward** (talk `lostFoundWindow` in `station`: `[{ when: 'lfReward', event: 'sq.lostFound.done' }, { when: 'lfAll', event: 'sq.lostFound.reward' }, { event: 'sq.lostFound.desk' }]`)

**sq.lostFound.desk**
```
旁白：「失物招領處」。窗口裡，有一個發光的姊姊。
announcer：「旅客您好，這裡是失物招領處。」
announcer：「今晚的風，吹走了好多東西。」
announcer：「如果撿到，請幫忙送回主人身邊。」
```

**sq.lostFound.reward**
```
announcer：「旅客您好。」
announcer：「今晚的失物，全部回到主人身邊了。」
announcer：「這是月亮線的感謝。」
[give luckyCat]
[flag lfReward]
旁白：得到 招財貓！（裝備：幸運 +20）
announcer：「招財貓，請小心輕放。」
```

**sq.lostFound.done**
```
announcer：「謝謝您。祝您旅途愉快。」
```

### sq.delivery: 月亮外送 (5 legs, ch3→ch13)

**sq.delivery.start** (talk `deliveryRider` in `station`: `[{ when: 'dl5', event: 'sq.delivery.idle' }, { when: 'dlStarted', event: 'sq.delivery.idle' }, { event: 'sq.delivery.start' }]`)
```
deliveryRider：「欸欸，你們也是夜貓子？」
deliveryRider：「我是月亮外送。半夜，什麼都送。」
deliveryRider：「今晚單子太多了，送不完。」
deliveryRider：「你們坐月亮線，順路幫我送幾個？」
baokaka：「要！」
deliveryRider：「第一單：便當阿姨的便當。」
deliveryRider：「送去西門，給跳舞的少年。」
[flag dlStarted]
[flag dl1Got]
旁白：拿到「外送：熱騰騰的便當」。
```

**sq.delivery.idle**
```
deliveryRider：「送東西，最重要的是什麼？」
deliveryRider：「是送到的時候，對方的笑臉。」
```

**sq.delivery.leg1done / leg2** (variant on `dancer`, `{ when: 'dl1Got', not: 'dl1' }`)
```
dancer：「便當？給我們的？」
dancer：「跳了一整晚，餓死了！」
dancer：「謝啦！這給你們！」
[coins 30]
[flag dl1]
旁白：麵線阿姨，從攤子後面探出頭。
noodle：「欸，聽說你們在送東西？」
noodle：「這碗麵線，送去龍山寺的青草巷阿婆。」
noodle：「她最愛吃我的麵線。」
[flag dl2Got]
旁白：拿到「外送：一碗麵線」。
```

**sq.delivery.leg2done** (variant on `herbGran`, `{ when: 'dl2Got', not: 'dl2' }`)
```
herbGran：「麵線！西門那個阿姨的？」
herbGran：「三十年的朋友了，還記得我愛吃。」
herbGran：「來，青草茶，帶著喝。」
[give grassJellyTea ×2]
[flag dl2]
herbGran：「大稻埕的茶行阿伯，好像也有東西要送。」
```
(Legs 3–5 live in their chapters, see the inserted sections: `sq.delivery.leg3` and `.leg3done` (ch6/ch9), `.leg4` and `.leg4done` (ch9/ch11), `.leg5done` (ch13).)

### sq.clerk: 店員小哥的集點卡

- **Points:** every clerk event begins with `[flag clerk_<map>]`. There are 14 clerks: daan, ntu, station, ximen, longshan, dadaocheng, shilin, airport, maokong, bitan, beitou, yangming, tamsui, tower.
- **Derived flags:** `clerk5` (≥5), `clerk10` (≥10), `clerkAll` (14).
- **5 points:** at the next clerk talk, `sq.clerk.five` plays first (a variant rule at the top of every clerk NPC: `{ when: 'clerk5', not: 'clerkFiveGot' }`).
- **10 points:** `gag.ch14.clerkPoints2` now requires `clerk10`.
- **14 points:** post-game `post.clerk.vest`.

**sq.clerk.five**
```
clerk：「叮咚～恭喜！集滿五點了！」
mocha：「我們根本沒有在集。」
clerk：「每一間分店都有記錄。」
[give brownSugarMilk ×2]
[flag clerkFiveGot]
旁白：得到 黑糖珍奶 ×2！
```

**post.clerk.vest** (variant on `clerk` at `xiangshan`, `{ when: 'clerkAll', not: 'clerkVest' }`)
```
clerk：「十四間分店，全部集滿了。」
clerk：「這是……我的備用背心。」
[give clerkVest]
[flag clerkVest]
旁白：得到 店員背心！（裝備：幸運 +15、身手 +8）
mocha：「……你到底是誰？」
clerk：「我是店員。」
clerk：「現在，我要下班了。」
旁白：店員小哥，第一次脫下了背心。
旁白：在長椅上，睡著了。
mocha：「……辛苦了。」
```

### sq.elder: 阿嬤的長輩圖 (8 collectibles)

阿嬤 printed 8 長輩圖 to hang at the party, and the wind scattered them. Each one is a pickup NPC `elderN` (not `elder_N`); the derived flag `elderAll` is set from all 8. **Reward:** 阿嬤 at 象山 (post-game) gives the **虎頭帽**. With `elderAll`, the ending also adds `ending.party.elder`.

Each pickup has the same frame:
```
旁白：地上，有一張亮晶晶的彩色圖片。
（the line below）
[flag elder_N]
```

| Key | Where | Picture line | Reaction |
|---|---|---|---|
| sq.elder.1 | ch2 台大, by the 傅鐘 | 旁白：「早安！認真過好每一天！」（一朵向日葵） | magpie：「這字型……好有精神。」 |
| sq.elder.2 | ch3 地下街 | 旁白：「午安！記得多喝水！」（一杯閃亮的水） | mocha：「阿嬤叫我們喝水。」 |
| sq.elder.3 | ch4 紅樓 back alley | 旁白：「晚安！平安喜樂！」（一朵發光的荷花） | mocha：「就是她五點傳的那張。」 |
| sq.elder.4 | ch5 剝皮寮 | 旁白：「好心情，好運到！」（一隻招財的金魚） | baokaka：「好看！」 |
| sq.elder.5 | ch6 永樂市場 | 旁白：「感恩的心，天天開心！」（一束康乃馨） | magpie：「這叫……知足常樂。」 |
| sq.elder.6 | ch7 地下美食區 | 旁白：「吃飽飽，身體好！」（一碗發光的飯） | mocha：「這張最實用。」 |
| sq.elder.7 | ch10 碧潭 pavilion | 旁白：「心平氣和，萬事如意！」（一隻天鵝） | bear：「天鵝……好平靜。」 |
| sq.elder.8 | ch12 竹子湖 | 旁白：「祝福你，身體健康！」（一束海芋） | mocha：「八張了。阿嬤一定很高興。」 |

**post.grandma** (at `xiangshan`, 阿嬤 doing morning exercises: `[{ when: 'tigerHatGot', event: 'post.grandma.again' }, { when: 'elderAll', event: 'post.grandma.hat' }, { event: 'post.grandma' }]`)

**post.grandma**
```
旁白：象山的步道上，阿嬤正在做早操。
grandma：「一、二、三、四……」
grandma：「乖孫？你怎麼也在這？」
grandma：「啊……阿嬤印的長輩圖，掉了好幾張。」
grandma：「看到的話，撿回來給阿嬤喔。」
```

**post.grandma.hat**
```
grandma：「八張長輩圖！全部找回來了！」
grandma：「乖孫，金價乖。」
grandma：「這頂虎頭帽，是阿嬤自己織的。」
grandma：「本來要明年給你。今天就給你。」
[give tigerHat]
[flag tigerHatGot]
旁白：得到 阿嬤的虎頭帽！（寶咖咖專用）
grandma：「來，阿嬤傳一張早安圖給你。」
mocha：「……他沒有手機。」
```

**post.grandma.again**
```
grandma：「一、二、三、四……乖孫，一起做！」
```

**ending.party.elder** (in `ending.party`, after 「紅龜粿、油飯、紅蛋」, if `elderAll`)
```
旁白：牆上，掛滿了阿嬤的長輩圖。
旁白：「早安」「平安」「多喝水」……
旁白：每一張，都亮晶晶的。
```

**ending.party.lily** (in `ending.party`, if `gotLily`)
```
旁白：抓周盤旁邊，放著一束白白的海芋。
grandma：「這花……誰放的？」
旁白：摩卡貓，假裝在睡覺。
```

### sq.echo: 咻咻的回音 (14 collectibles, one per chapter)

Each chapter has one `echoN` swirl NPC (not `echo_N`), placed somewhere slightly off the path. The frame is the same each time:
```
旁白：地上，有一小團風，在轉圈圈。
旁白：靠近一聽——是一個小小的聲音。
（cloud lines）
[flag echo_N]
```
Use the speaker `cloud` before `metShushu` and `shushu` after. Derived flag `echoAll` (14) → post-game `post.echoes` and the **小風車**.

| Key | Map | Lines |
|---|---|---|
| sq.echo.1 | home (by the window) | cloud：「窗戶裡，好溫暖。有人在笑。」 / cloud：「咻咻……也想進去。」 |
| sq.echo.2 | ntu (醉月湖) | cloud：「書，好多字。咻咻看不懂。」 / cloud：「書是寶寶的。可是咻咻不敢還。」 |
| sq.echo.3 | station (大廳) | cloud：「好多門。嗶嗶嗶。」 / cloud：「咻咻沒有票。咻咻不能進去。」 |
| sq.echo.4 | ximen (紅樓) | cloud：「有人在唱歌。好難聽。」 / cloud：「可是，大家都停下來聽。」 |
| sq.echo.5 | longshan (lanterns) | cloud：「好多人在說『平安』。」 / cloud：「咻咻也想要平安。」 |
| sq.echo.6 | dadaocheng (碼頭) | cloud：「布好漂亮。咻咻包起來。」 / cloud：「假裝是生日的衣服。」 |
| sq.echo.7 | shilin (gate arch) | cloud：「好香。好香。」 / cloud：「可是咻咻是風。咻咻不能吃。」 |
| sq.echo.8 | airport (飛機巷) | cloud：「飛機，帶咻咻走好不好？」 / cloud：「……飛機在睡覺。」 |
| sq.echo.9 | maokong (viewpoint) | cloud：「從這裡看，台北好小。」 / cloud：「咻咻，也好小。」 |
| sq.echo.10 | bitan (吊橋) | cloud：「天鵝在水上，飄呀飄。」 / cloud：「咻咻也想停下來。不要一直轉。」 |
| sq.echo.11 | beitou (footbath) | cloud：「好暖……」 / cloud：「咻咻一直在發抖。不知道為什麼。」 |
| sq.echo.12 | qingtiangang (summit knoll) | cloud：「山好高。咻咻爬不上去。」 / cloud：「爬了好多次。好累。」 |
| sq.echo.13 | fisherman (seawall) | shushu：「海就在那裡。」 / shushu：「可是……咻咻想先看一次生日。」 |
| sq.echo.14 | tower (89F window) | shushu：「這裡最高。離天空最近。」 / shushu：「可是……只有咻咻一個人。」 |

**post.echoes** (at `xiangshan`, talking to 咻咻 when `echoAll`, above other rules; once: `echoScene`)
```
shushu：「寶咖咖……你聽到了？」
shushu：「咻咻那天晚上，說的每一句話？」
mocha：「全部。十四句。」
shushu：「…………」
shushu：「咻咻那時候，好怕。」
shushu：「可是你們，一直跟在後面。」
shushu：「一站，一站，一直來。」
baokaka：「一起。」
shushu：「嗯。一起。」
shushu：「這個給寶咖咖。咻咻做的。」
[give pinwheel]
[flag echoScene]
旁白：得到 小風車！（裝備：身手 +10、幸運 +6）
shushu：「風來的時候，它會轉。」
shushu：「那就是咻咻，在說嗨。」
```

### sq.riders: 月亮線乘客 (8 collectibles)

Passenger NPCs in ride cars, each talk setting `rider_X`. Derived `riderAll` → the 路線圖 display gives the **月亮線紀念票** (`sq.riders.reward`, a `lineMap` variant above the hints, `{ when: 'riderAll', not: 'riderTicket' }`). Existing riders: `salaryman` (blue, add `[flag rider_salaryman]`), `owl` (red, add `[flag rider_owl]`), `squishedWorker` (orange, add `[flag rider_squished]`), fishing 阿公 (green; becomes an NPC `fisherGrandpa`, below). New riders:

**sq.riders.fisher** (green car, `fisherGrandpa`)
```
fisherGrandpa：「呼……碧潭……天鵝船……」
fisherGrandpa：「……嗯？小朋友，你也去釣魚？」
fisherGrandpa：「釣魚啊，最重要的是等。」
[flag rider_fisher]
```

**sq.riders.nurse** (red car, `nurse`; a night-shift nurse heading home)
```
nurse：「這麼晚，寶寶怎麼還沒睡？」
nurse：「我剛下班。今天醫院，生了三個寶寶。」
nurse：「每一個，都哭得好大聲。」
mocha：「……他出生的時候，也是。」
nurse：「那很好。哭得大聲，很健康。」
[flag rider_nurse]
```

**sq.riders.busker** (blue car, `busker` with a guitar)
```
busker：「我在西門唱歌。今天沒人聽。」
旁白：寶咖咖，拍拍手。
busker：「……謝謝。你是我今天第一個觀眾。」
[flag rider_busker]
```

**sq.riders.dogAunt** (brown car, `dogAunt` with a small dog in a pet bag)
```
dogAunt：「我的狗狗，不敢坐捷運。」
dogAunt：「所以我們坐最前面，看窗戶。」
旁白：狗狗，從袋子裡探出頭。汪。
baokaka：「汪！」
mocha：「……你什麼時候學的？」
[flag rider_dog]
```

**sq.riders.clerkRide** (orange car, `clerk`, appears `when: clerk5`)
```
旁白：車廂的角落，坐著一個穿條紋背心的人。
mocha：「……你為什麼在這裡？」
clerk：「調分店。」
mocha：「現在？」
clerk：「我們是連鎖的。」
[flag rider_clerk]
```

**sq.riders.reward**
```
旁白：路線圖上，八個小小的星星亮了起來。
announcer：「感謝您，認識了月亮線的每一位乘客。」
announcer：「這是月亮線紀念票。」
[give moonPassCharm]
[flag riderTicket]
旁白：得到 月亮線紀念票！（裝備：身手 +6、元氣 +20）
```

---

## 番外 post-game challenges (additions)

### 老朋友擂台 (boss rush, at `summit`, night-time version)
After `cleared`, the 台北101 door on the travel screen can take the party to `summit` (night). The NPC `karaoke`, as MC: `[{ when: 'rushWon', event: 'post.rush.again' }, { event: 'post.rush' }]`

**post.rush**
```
karaoke：「各位觀眾！歡迎來到——」
karaoke：「老朋友擂台！」
karaoke：「今天晚上的大家，都想再跟你們玩一次！」
karaoke：「五回合！每回合之間，休息一下！」
mocha：「……我們可以說不要嗎？」
karaoke：「不行！預備——起！」
[boss squirrelKing]
[boss gooseBully]
[boss gateGolem]
旁白：第一回合結束！休息一下！
[heal]
[boss pigeonBoss]
[boss clothDragon]
[boss megaCutlet]
旁白：第二回合結束！
[heal]
[boss windsock]
[boss teapotElder]
[boss swanQueen]
旁白：第三回合結束！
[heal]
[boss onsenEgg]
[boss buffalo]
旁白：第四回合結束！最後一回合！
[heal]
[boss crabGeneral]
[boss damperBall]
karaoke：「冠軍！冠軍出爐了！」
[give championBelt]
[flag rushWon]
旁白：得到 冠軍腰帶！（裝備：武力 +12、體力 +60）
karaoke：「下一首，〈冠軍之歌〉！」
mocha：「不要。」
```
(Losing mid-rush returns the party to the summit entry; the rush restarts from round 1. A rematch uses Lv20-tuned boss variants if the sim says the originals are too easy. Optional: add `bossRush: true` to scale stats ×1.5.)

**post.rush.again**
```
karaoke：「冠軍回來了！還要再唱一首嗎？」
mocha：「不要。」
```

### 土地公的台北小百科 (quiz, at `longshan`, post-game)
`tudigong` appears at the temple-front step `when: cleared`. talk: `[{ when: 'quizWon', event: 'post.quiz.again' }, { event: 'post.quiz' }]`. Uses the new **`choice`** step (§ 3.2). Each question is a `choice` whose wrong options go to `post.quiz.wrong` and whose right option continues. Simplest wiring: chain events `post.quiz.q1` → `q2` → … → `post.quiz.win`.

**post.quiz**
```
tudigong：「呵呵，囡仔，你們走遍了台北。」
tudigong：「阿伯來考考你們。五題。」
tudigong：「答錯，就重來。慢慢仔來。」
→ post.quiz.q1
```

| Key | Question | Options (✓ = correct) |
|---|---|---|
| post.quiz.q1 | 「台北車站的大廳，地板是什麼顏色？」 | 黑白格子 ✓ / 紅色地毯 / 藍色水晶 |
| post.quiz.q2 | 「龍山寺問事情，丟的兩片叫什麼？」 | 筊杯 ✓ / 銅板 / 鳳梨酥 |
| post.quiz.q3 | 「松山機場的飛機，晚上會怎樣？」 | 睡覺 ✓ / 去夜市 / 唱卡拉OK |
| post.quiz.q4 | 「台北為什麼那麼熱，風又出不去？」 | 因為是盆地 ✓ / 因為雞排太多 / 因為阿伯在掃地 |
| post.quiz.q5 | 「寶咖咖說的第一個字是什麼？」 | 摩卡 ✓ / 爸爸 / 飛機 |

**post.quiz.wrong**
```
tudigong：「呵呵，再想想。不急。」
```

**post.quiz.win**
```
tudigong：「五題全對！囡仔，你們真的走過了。」
tudigong：「這個金色的平安符，給你們。」
[give goldAmulet]
[flag quizWon]
旁白：得到 金平安符！（裝備：幸運 +25、防禦 +6）
dad：「……第五題，可以重考嗎？」
mocha：「爸爸，你什麼時候來的？」
```
(The `dad` cameo: he followed the family to the temple for a post-birthday 拜拜. Add `dad` as a `when: cleared` NPC by the temple steps.)

**post.quiz.again**
```
tudigong：「呵呵。台北，很大吧？慢慢仔大。」
```

### 圖鑑 completion
talk: `bookworm` at `beitou` (variant `{ when: 'bestiaryAll', not: 'bestiaryReward' }`; `bestiaryAll` is derived from `seenFoes` covering every regular foe)
```
bookworm：「你們的圖鑑……全部都填滿了？」
bookworm：「每一隻，都被你們冷靜下來。」
bookworm：「這是我吃過……不對，讀過最好的書。」
[give mangoIce ×5]
[flag bestiaryReward]
旁白：得到 芒果冰 ×5！
```

---

## Items: in-game names & blurbs

| id | 名稱 | 說明（blurb） |
|---|---|---|
| teaEgg | 茶葉蛋 | 便利商店的電鍋裡，永遠有一顆在等你。體力 +30。 |
| pineappleCake | 鳳梨酥 | 外皮酥酥，內餡酸甜。體力 +70。 |
| chickenCutlet | 雞排 | 比臉還大。體力 +160。 |
| douhua | 豆花 | 滑滑嫩嫩。元氣 +20。 |
| bubbleTea | 珍珠奶茶 | 台灣之光。元氣 +45。 |
| brownSugarMilk | 黑糖珍奶 | 黑糖最喜歡的。元氣全滿。 |
| braisedRice | 滷肉飯 | 一人一碗。全隊體力 +50。 |
| mangoIce | 芒果冰 | 夏天的味道。全隊體力 +130。 |
| railBento | 鐵路便當 | 排骨、滷蛋、醃黃瓜。一人體力和元氣全滿。 |
| redTurtleCake | 紅龜粿 | 生日要吃紅龜粿，呷百二。倒下的人醒過來。 |
| bib | 口水巾 | 阿嬤縫的。裝備：防禦 +3。 |
| flipFlops | 藍白拖 | 爸爸的。台灣人的戰鬥鞋。裝備：武力 +5。 |
| gradCap | 學士帽 | 圖書館台階上撿到的。裝備：元氣 +15。 |
| helmet | 安全帽 | 騎車要戴，走路也可以戴。裝備：防禦 +8。 |
| tigerShoes | 虎頭鞋 | 鞋頭有老虎，走路有力氣。裝備：身手 +6。 |
| flowerVest | 花布背心 | 紅紅的花布，阿姨親手做。裝備：體力 +45。 |
| amulet | 平安符 | 保平安。裝備：幸運 +10。 |
| raincoat | 機車雨衣 | 颱風天的好朋友。裝備：防禦 +12、體力 +25。 |
| earthCane | 土地公的拐杖 | 一直在旁邊守護你的那個人的拐杖。全能力提升。 |

### Key items (抓周盤 screen)

| flag | 名稱 | 盤上的小字 |
|---|---|---|
| got_scallion | 蔥 | 聰明 |
| got_book | 書 | 會讀冊 |
| got_seal | 印章 | 做頭家 |
| got_mic | 麥克風 | 會表演 |
| got_abacus | 算盤 | 會算 |
| got_drumstick | 雞腿 | 有口福 |
| got_celery | 芹菜 | 勤勞 |
| got_stethoscope | 聽診器 | 照顧人 |
| got_brush | 畫筆 | 會畫圖 |
| got_lock | 金鎖片 | 阿嬤的祝福 |
| stampBook | 集章本 | 台北走透透 |
| moonTicket / moonPass | 月亮票 | 還沒蓋章／月亮線全線 |

### Battle UI strings

| Old | New |
|---|---|
| 仙術 | 才藝 |
| 真氣 | 元氣 |
| 貼紙 | 銅板 |
| 武術 | 武力 |
| 身法 | 身手 |
| Victory | 「大家都冷靜下來了！」 |
| Boss victory | 「〈boss名〉不暈了！」 |
| Flee success | 「溜走了！」 |
| Flee fail | 「被擋住了！」 |
| KO (hero) | 「〈名字〉累倒了……」 |
| KO (foe) | 「〈名字〉頭暈暈，跑走了！」 |
| Level up | 「大家長大了一點！（Lv〈n〉）」 |
| New skill | 「〈名字〉學會了才藝：〈招式〉！」 |

### 阿藍's idiom tracker (for QA: keep the joke consistent)

| Ch | Line | Correct? |
|---|---|---|
| 2 | 學富五車（五台腳踏車） | ✗ |
| 2 | 一石二鳥 | ✓ but awkward |
| 3 | 以訛傳訛 | ✓ (Mocha concedes) |
| 4 | 餘音繞樑，三日不絕 | ✓ (horrifyingly) |
| 4 | 爭風吃醋 | ✓-ish |
| 5 | 人山人海 (over-explains it) | ✓ |
| 6 | 同類相聚 → 物以類聚 | ✗ (corrected) |
| 7 | 塞翁失馬 | ✓ |
| 9 | 指鹿為馬 | ✓ |
| 9 | 既往不咎 | ✓, and she is shocked |
| 10 | 「我不知道。」 | The point |
| 10 | 抱抱解千愁 (invents her own) | ✓ by decree |

---

## 時事梗 Topical jokes

Every joke is its own event, keyed `gag.*`, so it can be swapped or deleted without touching the critical path. The registry in `story-bible.md` § 9 records where each one lives, whether it's evergreen, and when to review it. **Placement** says how to wire it:
- **new NPC**: add an optional NPC whose only talk rule is this event.
- **replaces X**: the NPC's talk rule points here instead of X. Keep X in the file as the fallback if the joke is pulled.
- **variant of X**: insert `{ when: <flag>, event: <gag key> }` *above* X in that NPC's talk list.

### gag.ch1.elderImage
Placement: new NPC `grandmaPhone` (a phone glowing on 阿嬤's nightstand, home). Requires mochaJoined.
```
旁白：阿嬤的手機，亮了一下。
旁白：「早安！平安喜樂！」（一朵發光的荷花）
mocha：「她設定好了，每天五點傳給全家。」
mocha：「……天還沒亮，就已經早安了。」
```

### gag.ch1.garbageTruck
Placement: new NPC `trashAuntie` (holding a trash bag, daan park edge).
```
trashAuntie：「〈給愛麗絲〉呢？垃圾車呢？」
trashAuntie：「我拿著垃圾，追了三條街！」
mocha：「現在半夜。垃圾車也在睡覺。」
trashAuntie：「……那我明天再追。」
trashAuntie：「台北人的晚上，就是在追垃圾車。」
```

### gag.ch1.publicBike
Placement: new NPC `bikeDock` (a row of public rental bikes, daan).
```
旁白：一排公共腳踏車，乖乖地停好。
baokaka：「嗶！」
mocha：「你沒有卡。」
mocha：「而且你的腳，碰不到踏板。」
```

### gag.ch2.drinkOrder
Placement: variant of `ch2.ntu.student.first` (when `metMagpie`, not `gooseDone`).
```
student：「讀書一定要配手搖飲。」
student：「我平常點半糖少冰。」
student：「考試前一晚，全糖正常冰。」
magpie：「根據我的研究——」
magpie：「半糖少冰，是台灣人的中庸之道。」
mocha：「這次……好像也沒說錯。」
```

### gag.ch2.makeupDay
Placement: new NPC `sleepyTA` (a teaching assistant asleep on the library steps, ntu).
```
sleepyTA：「呼……明天……要補班……」
sleepyTA：「放了一天假，要還一天……」
magpie：「這叫……有借有還。」
mocha：「好像是對的，可是聽起來好累。」
```

### gag.ch3.beep
Placement: new NPC `commuter` (a commuter spirit running for a train, station).
```
commuter：「借過借過！嗶——！」
commuter：「台北人出門，就是一路嗶過去。」
commuter：「進站嗶，出站嗶，買早餐也嗶。」
baokaka：「嗶！」
commuter：「哇，寶寶也會嗶！」
mocha：「這個字，他今天剛學會。」
```

### gag.ch3.exitMaze
Placement: variant of `ch3.station.uncle.again` (when `gateDone`).
```
uncleStation：「找出口喔？看英文字母。」
uncleStation：「M、K、Y、Z……字母比字典還多。」
uncleStation：「阿伯在這裡三十年，也是看心情走。」
mocha：「……那我們怎麼辦？」
uncleStation：「跟著阿伯。呵呵。」
```

### gag.moonline.noEating
Placement: new NPC `noEatingSign` (a sign on the moonline car). The variant applies when `bearJoined`; before that, use `gag.moonline.noEating.early`.

**gag.moonline.noEating.early**
```
旁白：車廂上貼著：「車廂內禁止飲食」。
旁白：寶咖咖把奶嘴，從嘴巴裡拿出來看了看。
announcer：「奶嘴，不算飲食。請安心使用。」
```

**gag.moonline.noEating**
```
旁白：黑糖抱著一杯黑糖珍奶。
announcer：「旅客您好，車廂內禁止飲食。」
bear：「我、我沒有喝！我只是抱著！」
announcer：「……抱著，可以。」
bear：「（小聲）下車再喝。」
```

### gag.ch4.scooterTurn
Placement: new NPC `scooterUncle` (at the ximen scooter row).
```
scooterUncle：「少年仔，左轉要兩段式啦！」
scooterUncle：「先到前面的待轉格，等綠燈！」
mocha：「我們是用爬的。」
scooterUncle：「用爬的，也要待轉！」
旁白：寶咖咖乖乖爬進待轉格，坐好。
scooterUncle：「好！這個囡仔會考到駕照！」
```

### gag.ch4.basinHeat
Placement: variant of `ch4.ximen.dancers` (when `neonDone`, not `karaokeDone`).
```
dancer：「半夜兩點，還是三十度！」
dancer：「台北是一個大電鍋啦！」
magpie：「因為是盆地，熱氣跑不出去。」
mocha：「……跟那朵雲一樣。」
```

### gag.ch6.invoice
Placement: variant of `ch6.dadaocheng.dried` (when `dragonDone`). Includes the shop.
```
driedAunt：「來，發票收好！」
driedAunt：「單月二十五號對獎，不要忘記！」
driedAunt：「阿姨上次中兩百塊，高興一整個月。」
mocha：「兩百塊。」
driedAunt：「中了就是中了！」
[shop pineappleCake, douhua, bubbleTea, chickenCutlet, redTurtleCake, flowerVest]
```

### gag.ch6.typhoonNews
Placement: variant of `ch6.dadaocheng.uncle.again` (when `snakesDone`).
```
uncleTea：「一年前那晚啊，大家都在等十點新聞。」
uncleTea：「等著看，明天放不放颱風假。」
uncleTea：「新聞一說放假，整個台北都在歡呼。」
mocha：「……所以，其實有人喜歡颱風？」
uncleTea：「呵呵，喜歡放假啦。不一樣。」
```

### gag.ch7.queue
Placement: new NPC `queueLine` (a line of food spirits queuing in front of a closed stall, shilin).
```
旁白：一排食物，在一個沒開的攤子前面排隊。
mocha：「你們在排什麼？」
queueLine：「不知道。」
queueLine：「有人在排，就一定好吃。」
queueLine：「已經排兩個小時了。」
旁白：寶咖咖也爬過去，排在最後面。
mocha：「……不要排。」
```

### gag.ch7.clerkPoints
Placement: replaces `ch7.shilin.clerk`.
```
[flag clerk_shilin]
clerk：「叮咚～歡迎光臨！」
clerk：「有集點嗎？」
mocha：「沒有。」
clerk：「要不要現在開始集？」
mocha：「……我們只待一個晚上。」
clerk：「集滿可以換杯子喔。」
[shop teaEgg, pineappleCake, chickenCutlet, braisedRice, bubbleTea, helmet]
```

### gag.ch9.earthquake
Placement: variant of `ch9.maokong.teahouse` (when `sawTower`). Includes the inn.
```
旁白：地板輕輕地，晃了一下。
bear：「哇啊！在、在搖！」
teaLady：「又在搖。」
旁白：老闆娘繼續倒茶，一滴都沒灑出來。
teaLady：「小小的啦。茶杯沒倒，就是小的。」
mocha：「台灣人好冷靜。」
teaLady：「習慣了。來，靠一下。」
[inn 25]
```

### gag.ch9.zooCrowd
Placement: variant of `ch9.zoo.uncle.again` (when `bearJoined`).
```
uncleZoo：「下次白天來，排隊看動物喔。」
uncleZoo：「人比動物多，呵呵。」
uncleZoo：「動物也在看人。互相看。」
```

### gag.ch11.chiaPaBe
Placement: new NPC `bathGrandpa` (a grandpa with a towel at the footbath, beitou).
```
bathGrandpa：「呷飽未？」
bear：「還、還沒……」
bathGrandpa：「那你呢？呷飽未？」
mocha：「吃了一點小魚乾。」
bathGrandpa：「呷飽未？」（問一隻硫磺煙）
mocha：「……阿公，那個是煙。」
bathGrandpa：「煙也要呷飽啊！」
```

### gag.ch11.clerkSecond
Placement: replaces `ch11.beitou.clerk`.
```
[flag clerk_beitou]
clerk：「叮咚～歡迎光臨！」
clerk：「紅龜粿，第二件六折喔。」
mocha：「我們只要一個。」
clerk：「第二件六折喔。」
mocha：「……好啦，兩個。」
[shop pineappleCake, chickenCutlet, braisedRice, bubbleTea, brownSugarMilk, redTurtleCake, mangoIce]
```

### gag.ch13.delivery
Placement: new NPC `deliveryRider` (a delivery rider with a big square backpack, tamsui riverbank).
```
deliveryRider：「您好，外送到了！」
deliveryRider：「請問哪一位，訂了五點的鐵蛋？」
painter：「我。藝術家需要鐵蛋。」
deliveryRider：「送到河邊，送到山上，送到101。」
deliveryRider：「台北沒有我送不到的地方。」
mocha：「……你跟便利商店是一夥的嗎？」
```

### gag.ch13.backpackerTea
Placement: replaces `ch13.tamsui.backpacker`.
```
backpacker：「I learned Chinese today!」
backpacker：「『半糖、少冰』!」
mocha：「……這是最重要的一句。」
backpacker：「Now… where is 101?」
baokaka：「ㄅㄚ！」
mocha：「他說：『快了。下一站。』」
backpacker：「Really?!」
mocha：「真的。這次是真的。」
```

### gag.ch14.fireworks
Placement: variant of `ch14.tower.uncle.again` (when `damperDone`).
```
uncleTower：「每年跨年，101都會放煙火。」
uncleTower：「全台灣一起倒數，五、四、三……」
uncleTower：「煙火一下子就放完了。」
uncleTower：「阿伯，掃到天亮。呵呵。」
mocha：「……你到底有幾份工作？」
```

### gag.ch14.clerkPoints2
Placement: replaces `ch14.tower.clerk` (callback to `gag.ch7.clerkPoints`), only `when: clerk10`.
```
[flag clerk_tower]
clerk：「叮咚～歡迎光臨！」
clerk：「你們的點數……集滿了。」
mocha：「我們根本沒集。」
clerk：「每一間分店都有記。」
clerk：「可以換一個杯子。」
mocha：「我們要杯子做什麼……」
[give brownSugarMilk]
旁白：杯子裡，裝著一杯黑糖珍奶。
bear：「……我、我需要這個杯子。」
[shop chickenCutlet, braisedRice, mangoIce, brownSugarMilk, railBento, redTurtleCake]
```
(Once-only: set `[flag clerkCup]` after the give, and fall back to `ch14.tower.clerk` when `clerkCup` is set.)

### gag.post.typhoonDay
Placement: new NPC on `xiangshan`: `shushu` gets this as a talk rule above `post.shushu.again` (when `bonusWon`), or use a separate cloud NPC.
```
shushu：「咻咻聽說了。」
shushu：「颱風來的時候，有人在歡呼。」
mocha：「那是因為放颱風假。」
shushu：「那……明年咻咻只在假日來？」
magpie：「假日來，就不會放假了。」
shushu：「……好難喔。」
```

### gag.ending.elderImage
Placement: optional insert in `ending.party`, right before `[ending]` (a callback to `gag.ch1.elderImage`). Safe to drop.
```
grandma：「來，阿嬤做一張圖，傳給大家。」
旁白：「度晬快樂！平安喜樂！」（一朵發光的荷花）
旁白：照片裡，有一隻貓，抱著一個寶寶。
```

### gag.ch13.newBridge
Placement: variant of `ch13.tamsui.uncle.again` (when `ferryTalk`). **Recent (verified):** 淡江大橋 opened to traffic on 2026-05-12 and links 淡水 and 八里.
```
uncleFerry：「以前要去八里，都坐阿伯的船。」
uncleFerry：「現在有新的大橋了。」
uncleFerry：「開車一下子就過去，阿伯生意變少了。」
mocha：「……你還好嗎？」
uncleFerry：「呵呵，沒關係。」
uncleFerry：「坐在船上看新橋，也很好看。」
```
