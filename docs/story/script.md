# 寶咖咖抓周大冒險 — 遊戲劇本 (In-game Script)

*Baokaka & Mocha: Midnight Across Taipei*. This is the source of truth for every in-game line. Read `story-bible.md` first for structure, flags, maps and tables.

## How to read this file

Each `### key` is one entry in `EVENTS` (events.ts). Lines map 1:1 to `Step`s:

| Notation | Step |
|---|---|
| `旁白：text` | `{ who: null, text: 'text' }` |
| `mocha：「text」` | `{ who: 'mocha', text: '「text」' }` (keep the 「」 in the string, as today) |
| `[chapter 3｜月亮線，出發！｜02:00]` | `{ do: 'chapter', n: 3, title: '月亮線，出發！', time: '02:00' }` |
| `[join magpie]` | `{ do: 'join', hero: 'magpie' }` |
| `[flag x]` | `{ do: 'flag', flag: 'x' }` |
| `[give item]` / `[give item ×2]` | `{ do: 'give', item, count }` |
| `[coins 50]` | `{ do: 'stickers', amount: 50 }` (rename to `coins` when the currency is renamed) |
| `[heal]` | `{ do: 'heal' }` |
| `[battle a, b]` | `{ do: 'battle', foes: ['a','b'] }` |
| `[boss x]` | `{ do: 'battle', foes: ['x'], boss: true }` |
| `[shop a, b, …]` | `{ do: 'shop', stock: [...] }` |
| `[inn 20]` | `{ do: 'inn', price: 20 }` |
| `[goto map c,r]` | `{ do: 'goto', … }` (tile is a suggestion; set to the real entry tile) |
| `[ending]` | `{ do: 'ending' }` |

"Talk rules" lines (`talk:`) show the NPC's `Npc.talk` list, in priority order (first match wins). Every line is at most 40 characters, so it fits the phone dialogue box.

### Baokaka's vocabulary (do not add words)

要！／不要！／抱抱／ㄋㄟㄋㄟ／喵喵／咻——／哇！／這個！／我！／餓餓／好吃！／好看！／掰掰／一起／ㄅㄚ！（＝101）

He says his first real word only in the ending.

## Speakers

| id | Display name | Sprite notes |
|---|---|---|
| `baokaka` `mocha` `magpie` `bear` | 寶咖咖／摩卡貓／阿藍／黑糖 | heroes |
| `mochaNpc` `magpieNpc` `bearNpc` | 摩卡貓／藍教授／黑糖 | the same sprites, used before they join |
| `mom` `dad` `grandma` | 媽媽／爸爸／阿嬤 | family |
| `cloud` | 小小的雲 | 咻咻, before it says its own name |
| `shushu` | 咻咻 | final boss sprite (soft version) |
| `uncleSweep` | 掃地阿伯 | 土地公 #1 (straw hat, broom) |
| `uncleJanitor` | 校工阿伯 | #2 (blue cap) |
| `uncleStation` | 站務阿伯 | #3 (MRT staff cap) |
| `uncleFortune` | 算命阿伯 | #4 (round dark glasses on forehead) |
| `uncleTea` | 茶行阿伯 | #5 (black vest, teapot) |
| `unclePinball` | 彈珠台阿伯 | #6 (flat cap) |
| `uncleZoo` | 管理員阿伯 | #7 (safari hat) |
| `uncleBath` | 澡堂阿伯 | #8 (towel on head) |
| `uncleFerry` | 渡輪阿伯 | #9 (captain hat) |
| `uncleTower` | 清潔阿伯 | #10 (cleaner cap, mop) |
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
[chapter 2｜椰林大道的藍教授｜01:00]
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
magpieNpc：「湖邊被腳踏車堵住，從圖書館旁邊繞。」
magpieNpc：「我？不不不。教授不打架。」
magpieNpc：「我會在旁邊……觀察。」
[flag metMagpie]
```

**ch2.ntu.magpie.again**
```
magpieNpc：「從圖書館旁邊繞過去，就到湖邊。」
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

---

## 月亮線 — 車廂 (hub)

### moonline.intro
(Entry trigger, once.)
```
旁白：月亮線的車廂。窗外，有星星流過去。
旁白：每一扇門上面，都寫著站名。
announcer：「本列車，行駛月亮線。」
announcer：「請在車門上方，確認您的目的地。」
mocha：「還沒開的站，門打不開。」
```

### moonline.locked
(The `blocked` event for every locked door.)
```
旁白：門上的燈是暗的。這一站還沒開。
```

### moonline.announcer.*
talk: `announcer`, in this order:
`[{when:'cleared',event:'moonline.announcer.post'}, {when:'metShushu',event:'moonline.announcer.to101'}, {when:'eggDone',event:'moonline.announcer.toTamsui'}, {when:'teapotDone',event:'moonline.announcer.toBeitou'}, {when:'cutletDone',event:'moonline.announcer.toZoo'}, {when:'dragonDone',event:'moonline.announcer.toShilin'}, {when:'karaokeDone',event:'moonline.announcer.toDadaocheng'}, {event:'moonline.announcer.toXimen'}]`

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
[shop teaEgg, pineappleCake, douhua, bubbleTea, railBento, redTurtleCake]
```

---

## 第四章 紅樓的走音天王 — 西門町

### ch4.intro
```
[chapter 4｜紅樓的走音天王｜02:40]
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
karaoke：「那朵雲，捲著好多布，往大稻埕去了。」
karaoke：「它好像一直在說……」
karaoke：「『咻咻沒有生日……』」
magpie：「咻咻？」
mocha：「……是它的名字嗎？」
```

**Chests (ximen):** `ximen-helmet` scooter row → 安全帽 · `ximen-claw` claw-machine shop → 珍珠奶茶 ×2 (chest flavor line: 「夾娃娃機裡，掉出來了！」) · `ximen-cutlet` → 雞排

---

## 第五章 迪化街的布龍 — 大稻埕・迪化街

### ch5.intro
```
[chapter 5｜迪化街的布龍｜03:10]
旁白：大稻埕・迪化街。百年的老房子，一間接一間。
旁白：空氣裡有烏魚子、中藥、和茶葉的味道。
旁白：天上，一條一條的花布在飛。
magpie：「這裡是台北最老的街之一。」
magpie：「過年的時候，人山人海——」
magpie：「呃……人山人海，就是很多人的意思。」
mocha：「這次怎麼解釋得這麼小心。」
```

### ch5.dadaocheng.uncle.first / .again
talk: `uncleTea`: `[{ when: 'heardStory', event: 'ch5.dadaocheng.uncle.again' }, { event: 'ch5.dadaocheng.uncle.first' }]`

**ch5.dadaocheng.uncle.first**
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

**ch5.dadaocheng.uncle.again**
```
uncleTea：「布龍在碼頭那邊跳舞。」
uncleTea：「它不是壞，它只是轉暈了。」
```

### ch5.dadaocheng.cloth / .after / .again
talk: `clothAunt`: `[{ when: 'clothGave', event: 'ch5.dadaocheng.cloth.again' }, { when: 'dragonDone', event: 'ch5.dadaocheng.cloth.after' }, { event: 'ch5.dadaocheng.cloth' }]`

**ch5.dadaocheng.cloth**
```
clothAunt：「哎唷！我的布！全部飛走了！」
clothAunt：「那陣風啊，是比颱風還大的颱風！」
mocha：「颱風……比颱風還大？」
magpie：「這叫……呃……」
mocha：「不用了。」
clothAunt：「布飛到碼頭，變成一條龍了啦！」
```

**ch5.dadaocheng.cloth.after**
```
clothAunt：「我的布回來了！還捲得整整齊齊！」
clothAunt：「來，這件給寶寶穿，阿姨做的。」
[give flowerVest]
[flag clothGave]
旁白：得到 花布背心！（裝備：體力 +45）
```

**ch5.dadaocheng.cloth.again**
```
clothAunt：「花布背心，紅紅的，最好看。」
```

### ch5.dadaocheng.temple / .again
talk: `templeAunt`: `[{ when: 'amuletGave', event: 'ch5.dadaocheng.temple.again' }, { event: 'ch5.dadaocheng.temple' }]`

**ch5.dadaocheng.temple**
```
templeAunt：「乖囡仔，這麼晚還出來？」
templeAunt：「來，這個平安符給你，保平安。」
[give amulet]
[flag amuletGave]
旁白：得到 平安符！（裝備：幸運 +10）
```

**ch5.dadaocheng.temple.again**
```
templeAunt：「平安就好，平安就好。」
```

### ch5.dadaocheng.dried
talk: `driedAunt`
```
driedAunt：「香菇、干貝、烏魚子～要買什麼？」
driedAunt：「寶寶吃不了烏魚子啦。這些比較適合。」
[shop pineappleCake, douhua, bubbleTea, chickenCutlet, redTurtleCake, flowerVest]
```

### ch5.dadaocheng.herbal
talk: `herbal`
```
herbal：「來，喝一碗四神湯，補一補。」
[inn 20]
```

### ch5.dadaocheng.clerk
talk: `clerk`
```
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

### ch5.dadaocheng.snakes
talk: `clothSnakes` fixed fight across the street (not: snakesDone)
```
旁白：兩條長長的花布，像蛇一樣擋住了路。
旁白：嘶——嘶——（其實是布在摩擦。）
mocha：「後面就是河。……我討厭水。」
[battle clothSnake, clothSnake]
[flag snakesDone]
旁白：布匹蛇鬆開了，變回兩捲整齊的布。
```

### ch5.dadaocheng.boss
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

---

## 第六章 夜市大胃王 — 士林夜市

### ch6.intro
```
[chapter 6｜夜市大胃王｜03:40]
旁白：士林夜市。攤子早就收了，燈卻還亮著。
旁白：仔細一看——是食物們，自己在逛夜市！
mocha：「……雞排在排隊買雞排。」
magpie：「這叫……同類相聚？」
mocha：「是『物以類聚』吧。」
magpie：「我就是要說這個。」
```

### ch6.shilin.goldfish
talk: `goldfishGirl`
```
goldfishGirl：「寶寶！你要撈金魚嗎？」
goldfishGirl：「我跟你說喔，那陣風——」
goldfishGirl：「像101那麼大！大家都這樣說！」
mocha：「機車、公車、火車、一條街……」
mocha：「比颱風還大……現在是101了。」
magpie：「再傳下去，就比台灣還大了。」
```

### ch6.shilin.uncle.first / .again
talk: `unclePinball`: `[{ when: 'pinballGave', event: 'ch6.shilin.uncle.again' }, { event: 'ch6.shilin.uncle.first' }]`

**ch6.shilin.uncle.first**
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

**ch6.shilin.uncle.again**
```
unclePinball：「慢慢仔來。彈珠會跑，人也會累。」
```

### ch6.shilin.cutletAunt
talk: `cutletAunt`
```
cutletAunt：「雞排～要不要切？要不要辣？」
baokaka：「要！」
cutletAunt：「寶寶不能吃辣喔！不辣不辣。」
[shop chickenCutlet, braisedRice, bubbleTea, douhua, pineappleCake]
```

### ch6.shilin.clerk
talk: `clerk`
```
clerk：「叮咚～歡迎光臨！」
clerk：「夜市旁邊，一定要有一間。」
[shop teaEgg, pineappleCake, chickenCutlet, braisedRice, bubbleTea, helmet]
```

### ch6.shilin.backpacker
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

### ch6.shilin.massage
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

### ch6.shilin.sausage
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

### ch6.shilin.boss
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
cutlet：「那朵雲吃了好多棉花糖，往山那邊去了。」
```

### ch6.shilin.basin
(Runs immediately after `ch6.shilin.boss`.)
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
magpie：「它往動物園那邊去了。想爬過山。」
baokaka：「……咻咻。」
旁白：寶咖咖看著天空，好小聲地說。
```

**Chests (shilin):** `shilin-cutlet` → 雞排 ×2 · `shilin-bento` → 鐵路便當 · `shilin-ice` → 芒果冰

---

## 第七章 貓空上的月亮熊 — 動物園・貓空

### ch7.intro
```
[chapter 7｜貓空上的月亮熊｜04:10]
旁白：台北市立動物園。動物們都睡了。
旁白：只有一個籠子，是空的。
mocha：「……那個名牌寫什麼？」
```

### ch7.zoo.plaque
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

### ch7.zoo.uncle.first / .again
talk: `uncleZoo`: `[{ when: 'zooUncleMet', event: 'ch7.zoo.uncle.again' }, { event: 'ch7.zoo.uncle.first' }]`

**ch7.zoo.uncle.first**
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

**ch7.zoo.uncle.again**
```
uncleZoo：「纜車站就在那邊。伊很乖，只是怕。」
```

### ch7.zoo.meerkat
talk: `meerkat`
```
meerkat：「站崗中！站崗中！」
meerkat：「報告！剛剛有一朵雲飛過去！」
meerkat：「很大嗎？不大！小小的！」
meerkat：「而且……好像在哭。」
mocha：「…………」
magpie：「我們好像，一直把它想得太可怕了。」
```

### ch7.zoo.bear
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

### ch7.zoo.gondolaBlocked
```
旁白：纜車車廂的門關著。
旁白：裡面，好像有東西在發抖。
```

**Chests (zoo):** `zoo-milk` by the bear enclosure → 黑糖珍奶 (flavor: 「上面寫著：給黑糖的。」) · `zoo-cake` → 鳳梨酥 ×3

---

### ch7.maokong.intro
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

### ch7.maokong.view
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

### ch7.maokong.teahouse
talk: `teaLady`
```
teaLady：「歡迎。泡一壺茶，看夜景。」
teaLady：「累了，就在這邊靠一下。」
[inn 25]
```

### ch7.maokong.clerk
talk: `clerk` (with a pushcart)
```
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

### ch7.maokong.boss
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
teapot：「那朵雲啊，冷得發抖，往北投去了。」
teapot：「那裡熱。它想取暖吧。」
```

**Chests (maokong):** `maokong-ice` → 芒果冰 · `maokong-tea` → 珍珠奶茶 ×2 · `maokong-turtle` → 紅龜粿

---

## 第八章 北投的熱呼呼 — 北投溫泉

### ch8.intro
```
[chapter 8｜北投的熱呼呼｜04:35]
旁白：北投。到處都在冒煙，暖暖的。
旁白：空氣裡，有一股煮蛋的味道。
mocha：「水。到處都是熱水。」
mocha：「我要回家。」
bear：「這裡好暖。我喜歡。」
```

### ch8.beitou.bookworm
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

### ch8.beitou.uncle.first / .again
talk: `uncleBath`: `[{ when: 'bathGave', event: 'ch8.beitou.uncle.again' }, { event: 'ch8.beitou.uncle.first' }]`

**ch8.beitou.uncle.first**
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

**ch8.beitou.uncle.again**
```
uncleBath：「地熱谷的煙，臭臭的，可是不壞。」
```

### ch8.beitou.onsen / .again
talk: `onsenGran`: `[{ when: 'mochaTalk2', event: 'ch8.beitou.onsen.again' }, { event: 'ch8.beitou.onsen' }]`

**ch8.beitou.onsen**
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

**ch8.beitou.onsen.again**
```
onsenGran：「泡腳，三十個銅板，泡到好。」
[inn 30]
```

### ch8.beitou.clerk
talk: `clerk`
```
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

### ch8.beitou.sulfur
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

### ch8.beitou.boss
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
egg：「暖了一點，又哭著往淡水去了。」
egg：「它說，它想看海。」
magpie：「淡水……河的盡頭，就是海。」
```

(`咚咚` is the one exception to Baokaka's vocabulary: it's a sound effect, not a word.)

**Chests (beitou):** `beitou-milk` → 黑糖珍奶 · `beitou-ice` → 芒果冰 · `beitou-cutlet` → 雞排 ×2

---

## 第九章 河的盡頭是海 — 淡水

### ch9.intro
```
[chapter 9｜河的盡頭是海｜05:00]
旁白：淡水。河流到這裡，就變成了海。
旁白：天空的顏色，從黑色慢慢變成深藍色。
mocha：「五點了。只剩半個小時。」
bear：「阿、阿嬤會不會已經起床了……」
mocha：「阿嬤很準時。五點半，一分鐘都不差。」
```

### ch9.tamsui.painter / .after / .again
talk: `painter`: `[{ when: 'portrait', event: 'ch9.tamsui.painter.again' }, { when: 'crabDone', event: 'ch9.tamsui.painter.after' }, { event: 'ch9.tamsui.painter' }]`

**ch9.tamsui.painter**
```
painter：「我的畫筆……被風吹走了。」
painter：「我每天早上，都來這裡等夕陽。」
mocha：「現在是早上五點。」
painter：「藝術家，沒有時間觀念。」
painter：「對了，我看到那朵雲了。」
painter：「就在情人橋下面。小小的，一直在哭。」
painter：「還有一隻螃蟹，拿著小畫筆在亂畫。」
```

**ch9.tamsui.painter.after**
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

**ch9.tamsui.painter.again**
```
painter：「天要亮了。我要開始等夕陽了。」
```

### ch9.tamsui.uncle.first / .again
talk: `uncleFerry`: `[{ when: 'ferryTalk', event: 'ch9.tamsui.uncle.again' }, { event: 'ch9.tamsui.uncle.first' }]`

**ch9.tamsui.uncle.first**
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

**ch9.tamsui.uncle.again**
```
uncleFerry：「河一直流，就會流到海。」
```

### ch9.tamsui.agei
talk: `ageiGran`
```
ageiGran：「阿給～魚丸湯～鐵蛋～」
ageiGran：「風這麼大，雨衣也帶一件啦。」
[shop chickenCutlet, braisedRice, mangoIce, brownSugarMilk, redTurtleCake, raincoat]
```

### ch9.tamsui.clerk
talk: `clerk`
```
clerk：「叮咚～歡迎光臨！」
clerk：「淡水分店。可以看海。」
[shop pineappleCake, chickenCutlet, braisedRice, bubbleTea, brownSugarMilk, mangoIce, redTurtleCake]
```

### ch9.tamsui.backpacker
talk: `backpacker`
```
backpacker：「Beautiful river! But… where is 101?」
baokaka：「ㄅㄚ！」
mocha：「他說：『快了。下一站。』」
backpacker：「Really?!」
mocha：「真的。這次是真的。」
```

### ch9.tamsui.bench
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

### ch9.tamsui.soldiers
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

### ch9.tamsui.boss
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
mocha：「……橋下面。有聲音。」
```

### ch9.tamsui.shushu
(Trigger under the bridge, `when: crabDone`, once.)
```
旁白：橋下的陰影裡，有一團小小的雲。
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

---

## 第十章 離天空最近的地方 — 台北101

### ch10.intro
(Entry trigger on `tower`, once. Includes the bible's elevator scene.)
```
[chapter 10｜離天空最近的地方｜05:15]
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

### ch10.tower.uncle.first / .again
talk: `uncleTower`: `[{ when: 'towerUncleGave', event: 'ch10.tower.uncle.again' }, { event: 'ch10.tower.uncle.first' }]`

**ch10.tower.uncle.first**
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

**ch10.tower.uncle.again**
```
uncleTower：「阻尼器那顆大球，晃得頭暈了。」
uncleTower：「先讓它站穩，樓梯才會開。」
```

### ch10.tower.clerk
talk: `clerk`
```
clerk：「叮咚～歡迎光臨！」
mocha：「101。」
clerk：「我們在101也有分店。」
magpie：「你們到底有幾間？」
clerk：「很多。」
[shop chickenCutlet, braisedRice, mangoIce, brownSugarMilk, railBento, redTurtleCake]
```

### ch10.tower.souvenir
talk: `souvenir`
```
souvenir：「歡迎光臨，101紀念品店～」
souvenir：「風這麼大，買件雨衣吧！」
[shop raincoat, helmet, tigerShoes, flowerVest, mangoIce]
```

### ch10.tower.window
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

### ch10.tower.damper
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

### ch10.tower.stairsBlocked
```
旁白：通往樓上的樓梯在晃，現在上不去。
mocha：「先讓那顆大球停下來。」
```

### ch10.tower.bearBrave
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

### ch10.summit.intro
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

### ch10.summit.final
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

(The second `[heal]` can be swapped for a 50% heal if the engine gains a ratio. If the party loses phase 2, respawn at the summit entry; on the retry, talk rules should start at phase 2: give `shushu` the rule `{ when: 'shushuPhase1', event: 'ch10.summit.retry' }` and add `[flag shushuPhase1]` right after the first `[boss]`.)

### ch10.summit.retry
```
shushu：「嗚……嗚哇——！」
mocha：「它還在哭。再一次，大家！」
[boss shushuCry]
```
(Then continue with every line of `ch10.summit.final` after `[boss shushuCry]`, from 「雨，慢慢地停了。」 through `[flag shushuDone]`. Share them as a constant.)

### ch10.summit.party
(Runs immediately after `ch10.summit.final` / `.retry`.)
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
karaoke：「各位，請給我一個機會。」
karaoke：「這次，我不會走音。」
karaoke：「〈生日快樂〉，預備——起！」
旁白：「祝你生日快樂～祝你生日快樂～」
旁白：（第三句，有一點點走音。）
旁白：大家都笑了。咻咻也笑了。
旁白：這時候——
旁白：太陽，從山的後面升起來了。
旁白：金色的光，照在台北每一扇窗戶上。
shushu：「……好亮。」
shushu：「原來，生日是這個樣子。」
shushu：「這個，還給寶咖咖。」
旁白：咻咻把金鎖片，輕輕放在寶咖咖手上。
[flag got_lock]
旁白：拿回了「金鎖片」！（阿嬤的祝福）
shushu：「咻咻要回家了。回海裡。」
magpie：「跟著淡水河走，就會到海。」
shushu：「明年……咻咻還可以來嗎？」
baokaka：「要！」
mocha：「下次來，記得敲門。不要轉圈圈。」
shushu：「嘻嘻。好！」
旁白：咻——一陣涼涼的風，往淡水的方向去了。
```

### ch10.summit.home
(Runs immediately after `ch10.summit.party`.)
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

---

## 尾聲 度晬

### ending.grandma
(Runs immediately after `ch10.summit.home`.)
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
(A post-credits cutscene on the Ending screen. Use `.full` if all 10 `stamp_*` flags are set.)

**ending.tudigong.full**
```
旁白：家門口的巷子裡，有一間小小的土地公廟。
旁白：土地公的手指上，沾著一點點印泥。
tudigong：「呵呵，囡仔。」
tudigong：「台北走透透，十個章，全部蓋滿了。」
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
tudigong：「十個章，蓋滿了。這是禮物。」
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
