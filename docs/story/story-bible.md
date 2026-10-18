# 寶咖咖抓周大冒險 — Story Bible

**English title:** *Baokaka & Mocha: Midnight Across Taipei*
**Status:** Narrative design, v1 (replaces the 寶咖咖奇俠傳 / 仙劍 setting entirely)
**Companion file:** `docs/story/script.md` is the source of truth for every in-game line. This bible explains the structure, the systems the story needs, and the content tables (heroes, foes, items).

---

## 0. At a glance

| | |
|---|---|
| Title | **寶咖咖抓周大冒險** — *Baokaka & Mocha: Midnight Across Taipei* |
| Logline | 寶咖咖一歲生日的前一晚，一陣小小的怪風把阿嬤準備好的抓周寶物吹散到整個台北。一個還不會走路的寶寶和一隻心虛的虎斑貓，搭上只在半夜開的「月亮線」捷運，要在阿嬤五點半起床前，把九樣寶物和金鎖片全部找回來。 |
| English logline | The night before Baokaka's first birthday, a little runaway wind blows Grandma's birthday-ceremony treasures all over Taipei. A baby who can't walk yet and a guilty tabby cat ride the secret midnight metro to get everything back before Grandma wakes up at 5:30. |
| Length | 11 chapters, about 19 maps (14 landmark maps + 5 small MRT ride cars), roughly 3.5–4.5 hours for a family playing together |
| Level cap | 15 |
| Party | 寶咖咖, 摩卡貓, 阿藍 (台灣藍鵲, the "professor"), 黑糖 (台灣黑熊) |
| Currency | **銅板** (coins; 阿嬤's 紅包 is your first purse) |
| Clock | Every chapter card shows a time, from 00:00 to 05:29. The night is the timer. |

### Why this title

- **抓周** (zhuā zhōu) is the Taiwanese first-birthday ceremony: the baby crawls to a tray of objects, and whatever they grab "predicts" their future. Every grandparent knows it, and every parent has a photo of it. It explains the quest in two characters: we're collecting the 抓周 treasures.
- The quest literally goes around the city (周 also means "around"). Baokaka *grabs his way around* Taipei.
- The English subtitle gives non-Chinese readers the setting and the hook (midnight, Taipei, Baokaka & Mocha) without explaining the ceremony.
- The payoff gives the title a second meaning: at the real 抓周, Baokaka doesn't pick any of the treasures. He grabs **Mocha**, and says his first word.

### Themes

1. **Everyone wants to be welcomed.** The antagonist is a baby typhoon who has only ever heard "快走" (go away). It was born the same stormy night as Baokaka.
2. **Big siblings come in all shapes.** Mocha was the family's baby before Baokaka arrived. The game is secretly Mocha's story about making room in his heart.
3. **You don't have to know everything; you have to show up.** 阿藍 knows facts, 黑糖 is scared of everything, and Baokaka knows only about twelve words. He still has the answer: 抱抱.
4. **Taipei is home.** Landmarks are shown with love, and with the small real details locals will recognize: people sitting on the floor of the Main Station hall, the massage chairs at the night market, the price of cabbage after a typhoon, and 37 seconds in the 101 elevator.

### Tone guide

- **Warm, funny, heartfelt, never scary.** Night-time is *cozy-magic*, never spooky. No ghosts, nothing dark in the shadows, no peril to the family. The city's lights stay on.
- **Battles are tantrums, not violence.** Foes are dizzy from the wind ("起風了，大家都起瘋了"). Defeating them = calming them down. Defeated foes say sorry, give things back, or wander off sleepy. Use words like 拍拍, 咚, 頭暈暈, 冷靜下來. Avoid words like 殺, 死, 血 (HP is 體力, and fainting is 累倒了).
- **Grandparent-readable.** Short lines (≤ 40 characters), simple characters, with jokes that land for three generations: 成語 gags for grandpa, KTV for grandma, snack names for kids.
- **Taiwanese seasoning, lightly.** 阿嬤 and the 阿伯s drop a little Hokkien: 乖孫、囡仔、呷飽未、金價、顧規暝、慢慢仔來、歹勢. Never a full sentence a Mandarin-only grandchild can't follow.
- **Baokaka speaks toddler.** His whole vocabulary: 要！／不要！／抱抱／ㄋㄟㄋㄟ／喵喵／咻——／哇！／這個！／我！／餓餓／好吃！／好看！／掰掰／一起／ㄅㄚ (=101)／嗶！ and, from the brown-line ride in Ch7, **飛機！** He never says a full sentence until the very end (and even then, only one word). The others react to him; Mocha "translates" (see running jokes).

---

## 1. World premise & central conflict

### The setup

Tomorrow is Baokaka's **度晬** (Taiwanese for the first birthday). 阿嬤 has set out the **抓周盤** on the low table by the living-room window. It holds **九樣東西**: nine is 久, "long-lasting". Each treasure is a traditional pun or a wish:

| 寶物 | Meaning (as 阿嬤 explains it) |
|---|---|
| 蔥 | 聰明（蔥＝聰） |
| 書 | 會讀冊 |
| 印章 | 做頭家、做大官 |
| 麥克風 | 會唱歌、會表演 |
| 算盤 | 會做生意、會算 |
| 雞腿 | 有口福，一世人呷好料 |
| 芹菜 | 勤勞（芹＝勤） |
| 聽診器 | 當醫生，照顧別人 |
| 畫筆 | 會畫圖，有藝術天分 |

In the center sits 阿嬤's gift: a **金鎖片** (gold longevity lock on a red string), to be put around his neck at the party. In the incident the string snaps: the lock stays tangled in 咻咻, and the **紅繩** blows away separately (found at 松山機場, Ch7). It gets re-tied at the summit by 阿藍 ("我會打蝴蝶結").

阿嬤 asks Mocha to guard the tray overnight ("摩卡，顧好喔"). Mocha falls asleep.

### The incident (prologue cutscene)

At midnight a tiny gust taps on the window. It is a little grey-blue swirl of cloud with big wet eyes: **咻咻**. It heard the family laughing about "明天寶咖咖一歲", got curious, and slipped through the window crack to look. It got excited and spun. Every treasure flew out the window into the night, and the 金鎖片 tangled in its swirl. 咻咻 panics ("對不起——！"), and flees across the city.

Its gusts whip up every creature and object they touch: "起風了，大家都起瘋了." A squirrel in 大安森林公園, a goose on 醉月湖, the turnstiles of Taipei Main Station, a karaoke machine in 西門町, and so on. Each catches one of the treasures and won't let go.

Baokaka saw everything from his crib. Mocha wakes up to an empty tray and a ticking clock: **阿嬤每天五點半起床.**

### The goal

Recover the nine treasures and the gold lock **before 05:30**, then get home before anyone notices.

### How the city opens up

- Ch1–2 are on foot (home → 大安森林公園 → 台大).
- In Ch2, 阿藍 reveals the **月亮線** (Moon Line): after the last train, Taipei's metro runs one secret train for everyone who isn't asleep: owls, cats, night herons, wind, and lost things. The Moon Line is the connective thread of the game.
- From Ch3 on, the party rides the Moon Line between landmarks. Every landmark has an MRT entrance. The 路線圖 screen lights up new stations as the story unlocks them, and every trip is a short, walkable ride in a car themed after the real line (blue 板南, red 淡水信義, brown 文湖 driverless with the front window, green 松山新店, orange 中和新蘆). See § 3.1.

### The mystery: "颱風大魔王"

Everyone the party meets has heard about the thing that's causing the chaos, and the rumor grows every chapter (a running joke):

> 像機車那麼大 → 像公車那麼大 → 像火車那麼大 → 像一整條街 → 比颱風還大的颱風 → 像101那麼大 → …… → 「其實只有枕頭那麼大。」

At the real meeting at 淡水漁人碼頭 (Ch10), 咻咻 turns out to be pillow-sized, a baby, and crying.

### The twist / emotional core

- In the prologue, 媽媽 (sleep-talking) mentions the story every Taiwanese family tells: "你出生那天晚上，颳好大的颱風." It's planted as a cute aside.
- In Ch5, 茶行阿伯 tells the other side: one year ago, a little typhoon circled over Taipei. Everyone shut their windows and said "快走". That night, at a hospital, one very loud baby was born.
- In Ch10 the pieces click. **咻咻 is the spirit of that typhoon**, born the same night as Baokaka. Nobody ever said "welcome" to it. Tonight it overheard a family planning a birthday and realized "咻咻也一歲了". It only wanted to see what a birthday looks like. It took the 金鎖片 because it shone like a tiny sun: something of its own.
- At 松山機場 (Ch7) we learn it tried to *hitch a ride on a plane* out of the basin, but the airport sleeps at night (no flights 23:00–05:00), so the planes couldn't take it. In 淡水 (Ch10) it is found circling the single tower of the new 淡江大橋, trying to climb high enough to jump out.
- And it can't leave: **台北是盆地.** Mountains on every side. A baby wind keeps going in circles, stirring up the city, and the more scared it gets, the bigger it blows. (阿藍 explains 盆地 in Ch6; grandparents will appreciate the geography lesson.)
- 咻咻 retreats to the top of **台北101**, "離天空最近的地方", and builds itself a sad little birthday party out of everything it blew away.

### The resolution

At the summit, after two battles (the storm's tantrum, then its crying rain), **Baokaka stands up and takes his first steps** across the observation deck to hug the cloud: 「抱抱。」「一起。」

The Moon Line brings every former boss to the roof. At sunrise, the whole city sings 生日快樂 to 咻咻. The karaoke king leads, and he's almost in tune. 咻咻 gives back the lock and settles into a gentle breeze. The Moon Line's last run goes "直達：寶咖咖的家."

### The ending

- **05:30.** 阿嬤 wakes. The tray is complete. Mocha is asleep on it, "guarding". 阿嬤: 「摩卡真乖，顧規暝。」 Mocha opens one eye.
- **10:00, the party.** 紅龜粿, 油飯, 紅蛋. The 抓周: Baokaka crawls past the book (Dad cheers), past the abacus (阿嬤 cheers), past the drumstick (everybody laughs)… and grabs **Mocha's tail**.
- Then he says his **first word**: 「摩卡。」 The family erupts. Dad: 「……第一個字不是爸爸。」 Mocha: 「眼睛……進沙子了。」
- A soft breeze blows the candle smoke into a little swirl at the window. Baokaka: 「咻咻！」 Dad: 「第二個字也不是爸爸！」
- Final card: **生日快樂，寶咖咖。生日快樂，咻咻。**

### Post-credits & post-game hook

- **土地公 reveal.** The kindly 阿伯 the party met in *every* chapter (a sweeper, a janitor, station staff, a fortune teller…) was the neighborhood **土地公** all along. A small shrine on the family's street; the statue has stamp ink on one finger; it winks. 「呵呵，囡仔，慢慢仔大。」
- **集章本 complete (11/11)?** He presents the last page, 「台北走透透 認證」, and gives you **土地公的拐杖** (the best equipment in the game).
- **Post-game map: 象山 at sunrise.** Loading the cleared save opens 象山 on the Moon Line. 咻咻 waits there for an optional, friendly **「生日加碼賽」** superboss rematch (level-15 challenge). Closing line: 「每年夏天的下午，台北都會下一場西北雨。那是咻咻回來玩了。」 The Moon Line display reads: 「下一站：兩歲」.

---

## 2. Characters

### 2.1 Heroes

Battle commands are renamed for the new tone: **攻擊／才藝／道具／防禦／逃跑**. 真氣 becomes **元氣**. 貼紙 becomes **銅板**.

Skill learn levels are *party* levels (as in the current engine). A hero who joins late already knows every skill at or below the current level. The effect types map 1:1 to the existing `SpellEffect` kinds (`damage one/all`, `heal ally/party (+revive)`, `shield`).

---

#### 寶咖咖 (Baokaka). The hero. id `baokaka`

- **Who:** One year old (tomorrow). Round cheeks, a tuft of hair that won't lie down, a red string bracelet, footie pajamas with a little bear on the chest. Crawls *fast*. Can't walk yet, until the final chapter.
- **Personality:** Fearless in the way only babies are. Curious, generous with snacks, and hugs everything. He solves problems by refusing to accept them ("不要！") and then hugging them.
- **How he joins:** You start as him.
- **Battle role:** **Sturdy all-rounder / front line.** Highest HP of the early party, decent attack, plus one party heal. The one who's always standing.
- **Catchphrase:** 「要！」 (In battle, a victory cheer: 「哇！」)

| Lv | Skill | Effect | Cost | Flavor |
|---|---|---|---|---|
| 1 | **丟積木** | damage one (×1.6) | 3 | 用力丟一塊積木。 |
| 3 | **哇哇大哭** | damage all (×1.0) | 5 | 哭聲大到整條街都醒了，打到所有敵人。 |
| 6 | **拍拍手** | heal party (25%) | 6 | 拍手幫大家加油，全隊恢復體力。 |
| 12 | **勇敢的第一步** | damage one (×3.0) | 10 | 站起來，往前走一步——然後撞過去。 *(Learned at Lv12, which lines up with the story beat where he walks for the first time.)* |

Suggested stats: base `hp 60 mp 12 atk 9 def 5 spd 6 luck 6`, growth `hp 11 mp 3 atk 2 def 1 spd 1 luck 1`.

---

#### 摩卡貓 (Mocha Cat). The reluctant big brother. id `mocha`

- **Who:** A brown tabby with an "M" on his forehead, white socks, and a tail that says what he won't. Seven years old. He was the family's baby before Baokaka came.
- **Personality:** Dry, sarcastic, secretly soft. Hates water, loves 小魚乾, and pretends not to care. He's sulking about Baokaka ("你來了以後，大家手機裡都是你的照片") and is crushed by guilt: he fell asleep guarding the tray. His arc: "babysitting the kid" → "my kid brother".
- **How he joins:** Prologue (`ch1.home.mocha`). He tries to go alone; Baokaka refuses to stay behind.
- **Battle role:** **Fast striker + single-target healer.** Acts first most turns, crits often (high luck). The party's medic.
- **Catchphrase:** 「……好啦。」 (the sound of giving in)

| Lv | Skill | Effect | Cost | Flavor |
|---|---|---|---|---|
| 1 | **呼嚕嚕** | heal ally (40%) | 4 | 靠在一個人身上呼嚕，恢復體力。 |
| 2 | **喵喵連環爪** | damage one (×1.8) | 4 | 左一爪、右一爪、再一爪。 |
| 5 | **貓草狂歡** | damage all (×1.2) | 7 | 聞了一口貓草，在敵人中間打滾亂抓。 |
| 10 | **九命回春** | heal party (50%) + revive | 12 | 貓有九條命，分你們一條。 |

Suggested stats: base `hp 46 mp 16 atk 11 def 3 spd 10 luck 9`, growth `hp 8 mp 4 atk 3 def 1 spd 2 luck 1`.

---

#### 阿藍 (A-Lan, "藍教授"). The know-it-all. id `magpie`

- **Who:** A **台灣藍鵲** (Formosan blue magpie): cobalt body, black hood, coral-red beak and feet, and an absurdly long tail tipped in white. She wears a tiny pair of round reading glasses (found on a library desk) and keeps a pencil stub tucked behind her wing.
- **Personality:** Has been sitting in on lectures through the window of NTU's College of Liberal Arts for three years and introduces herself as 「藍教授」. Encyclopedic about Taipei trivia (and mostly correct). **Misuses 成語** constantly, with total confidence. Proud, chatty, loyal. Her arc: she's afraid of looking ignorant, and at the summit she finally says 「我不知道」. She learns that's okay.
- **How she joins:** Ch2 (台大). Met on the 文學院 ledge (`ch2.ntu.magpie.first`), she refuses to fight ("教授不打架"), follows the party to the lake to "observe", and jumps in when 鵝霸 calls her "只是一隻旁聽的鳥": 「誰說旁聽生不能下場！」 She joins inside the boss event.
- **Battle role:** **Mage / crowd control.** Deep 元氣, fragile, fast. All-target damage plus the party shield. Expected join level: ~Lv3–4.
- **Catchphrase:** 「根據我的研究——」

| Lv | Skill | Effect | Cost | Flavor |
|---|---|---|---|---|
| 1 | **羽毛雨** | damage all (×1.1) | 5 | 抖一抖翅膀，藍色羽毛像雨一樣落下。 |
| 4 | **俯衝啄啄** | damage one (×1.9) | 4 | 從高處俯衝，啄一下就飛走。 |
| 7 | **鵲橋護盾** | shield (party takes half damage) | 6 | 七夕的時候，喜鵲搭橋讓人相見；今天，藍鵲搭橋保護大家。 |
| 11 | **長尾流星** | damage all (×2.0) | 12 | 長長的尾巴在空中劃出一道藍色流星。 |

Suggested stats: base `hp 40 mp 24 atk 7 def 4 spd 11 luck 6`, growth `hp 7 mp 5 atk 2 def 1 spd 2 luck 1`.

---

#### 黑糖 (Hēitáng, "Brown Sugar"). The gentle giant. id `bear`

- **Who:** A young **台灣黑熊** (Formosan black bear) from the Taipei Zoo. Glossy black, with a cream **V-shaped moon** on his chest. He's three times Baokaka's height and wears a little red scarf a keeper knitted him. Named after his favorite thing in the world, 黑糖珍奶.
- **Personality:** Shy, polite, enormous, and afraid of *everything*: wind, heights, loud noises, the dark, and pigeons. He apologizes to doors. He's protective of anyone smaller, which is everyone. Arc: from hiding to standing in front of his friends. His fear of heights pays off at 101: 「我很怕高……可是我更怕你們自己上去。」
- **How he joins:** Ch8. Found shaking in a 貓空纜車 gondola at the zoo station, where he hid from the wind. Baokaka offers a hug and half a 鳳梨酥. He joins (`ch8.zoo.bear`), and the gondola carries the party up to 貓空.
- **Battle role:** **Tank / bruiser.** Huge HP and defense, hard hits, slowest in the party, plus a big single-target heal. Expected join level: ~Lv9 (knows his first three skills on joining).
- **Catchphrase:** 「歹、歹勢……」 (sorry-sorry), said before smashing something.

| Lv | Skill | Effect | Cost | Flavor |
|---|---|---|---|---|
| 1 | **熊掌拍拍** | damage one (×2.0) | 4 | 很小心、很小心地拍一下。（還是很痛。） |
| 8 | **大地咚咚** | damage all (×1.3) | 7 | 原地跳一下，整片地板都在晃。 |
| 9 | **黑糖暖暖** | heal ally (65%) | 6 | 給一個大大的熊抱，又暖又甜。 |
| 14 | **月牙衝擊** | damage one (×3.2) | 12 | 胸口的月牙發光，全力衝撞。 |

Suggested stats: base `hp 80 mp 10 atk 12 def 8 spd 3 luck 3`, growth `hp 14 mp 2 atk 3 def 2 spd 1 luck 1`.

> **Engine note:** a fourth hero means `HeroId` gains `'magpie' | 'bear'` (remove `'duck'`), `HERO_ORDER = ['baokaka','mocha','magpie','bear']`, and the battle screen must lay out four heroes in portrait (a 2×2 grid or one row of four small cards). All other battle logic is already generic over `party`.

### 2.2 The family

| id | Name | Who | Role in game |
|---|---|---|---|
| `mom` | 媽媽 | Gentle, tired, funny. Asleep the whole night except in the ending. | Prologue: sleep-talks the "typhoon the night you were born" line (the setup). Her sleepy hand pats Baokaka's head: a free heal at home. |
| `dad` | 爸爸 | Asleep on the sofa with the TV remote. Desperately wants Baokaka's first word to be 爸爸. | Running gag: sleep-talks 「叫……爸爸……」 at home. Ending: loses twice (摩卡, then 咻咻). |
| `grandma` | 阿嬤 | Sets up the 抓周盤; wakes at 05:30 sharp; speaks with Hokkien flavor. | The deadline. Her 紅包 (on the side table) is your starting money; her 口水巾 is your first equipment. Ending lines. |

### 2.3 Recurring Taipei cast

| id | Name | Who | Running role |
|---|---|---|---|
| `uncle*` → `tudigong` | **阿伯** (×11) → **土地公** | A small, round old man with white eyebrows that hide his eyes, a white beard, and a walking stick. He wears a different hat and job in every chapter: 掃地阿伯 (park), 校工阿伯 (NTU), 站務阿伯 (station), 算命阿伯 (西門), 茶行阿伯 (大稻埕), 彈珠台阿伯 (士林), 推車阿伯 (airport), 管理員阿伯 (zoo), 澡堂阿伯 (北投), 渡輪阿伯 (淡水), 清潔阿伯 (101). | Gives the 集章本 in Ch1, hints in every chapter, always says 「呵呵，囡仔，慢慢仔來。」 Mocha keeps squinting at him: 「……我是不是在哪裡看過你？」 Revealed in the post-credits as the neighborhood 土地公. **Art note:** the same face and stick every time, with only the hat and outfit swapped. |
| `clerk` | **店員小哥** | Night-shift convenience-store clerk in a green-and-orange striped vest (unbranded), with tired eyes and a perfect smile. | He runs the shop in almost every chapter. 「叮咚～歡迎光臨！」 Each time: 「……又是你們？」「我們是連鎖的。」 The escalation: 101 (「我們在101也有分店」), a portable cart on 貓空 (「行動分店。」). Ending: delivers the birthday cake, 「叮咚～外送！」 |
| `announcer` | **廣播姊姊** | The voice of the MRT. On the Moon Line she appears as a soft glowing figure in a conductor's cap made of light. | Speaks only in announcement-style lines (國語, then 台語, then English): 「下一站，台北車站。Next station, Taipei Main Station.」 Always reminds people 「請緊握扶手」「請讓座」. Ends the game with 「本列車直達：寶咖咖的家。」 |
| `backpacker` | **迷路的背包客** | A tall foreign backpacker with a huge map, upside down. | Appears in Ch3, 4, 6, 10, asking 「Excuse me… where is 101?」 Mocha's translations get progressively more elaborate. At the final scene he arrives on the roof: 「I found it!」 |
| `shushu` | **咻咻** | The antagonist (see 2.4). | — |

Chapter-local NPCs (runner, student, street dancers, painter, 溫泉阿嬤, etc.) are listed in each chapter.

### 2.4 Antagonist: 咻咻

- **What:** The spirit of a baby typhoon. A pillow-sized swirl of grey-blue cloud, with a darker eye in the middle where its two huge, shiny, teary eyes live. Little wisps work like arms. When happy it's fluffy and white; when upset it darkens and spins; when crying it rains.
- **The 金鎖片** is tangled in its swirl, glinting like a tiny sun.
- **Voice:** Speaks like a toddler who learned words from overheard TV weather reports: 「咻咻沒有生日！」「大家都說颱風快走！」「豪大雨特報！」 It refers to itself in the third person.
- **Want:** To be welcomed somewhere. To have a birthday.
- **Fear:** Being told to go away, again.
- **How it's foreshadowed:** Glimpsed in the prologue, then as a "嘻嘻" voice in the park leaves (Ch1), radio interference on the Moon Line (Ch3), the control tower's log ("咻咻可以起飛嗎？", Ch7), a shape crossing the moon from the 貓空 viewpoint (Ch8), and in person, circling the 淡江大橋 tower at 漁人碼頭 (Ch10).
- **Boss forms:** 「暴風咻咻」 (Phase 1, tantrum) → 「哭哭咻咻」 (Phase 2, crying rain).
- **After:** Becomes a friend. Its post-game rematch is optional.

---

## 3. Systems the story needs (small, specific extensions)

| # | Mechanic | Spec | Why |
|---|---|---|---|
| 1 | **Fourth hero** | See the engine note in 2.1. | 黑糖's late join gives the late game a fresh spike. |
| 2 | **Chapter card shows a clock** | `{ do: 'chapter', n, title, time: '02:00' }`; render the time under the title, in the style of a train-departure board. | The night is the timer. Grandparents get "how far along are we" at a glance. |
| 3 | **月亮線: riding the MRT** | A `[travel]` step opening a 路線圖 screen; 5 small ride-car maps; one dynamic exit (`to: '@rideTo'`); `{station}` text substitution. Full spec in § 3.1. | Riding the MRT is a real, enjoyable part of the game, not a menu. |
| 4 | **集章本 (stamp book)** | Each chapter map has one **紀念章台** (stamp stand), placed as an NPC with event `stampX` that does `{do:'flag', flag:'stamp_X'}` and says one line. The menu gets a 集章本 tab showing 11 circles that fill in by flag. Some stands sit off the main path. 11/11 changes the post-credits (see Ch11). | A collectible that rewards exploring every landmark, with zero combat changes. |
| 5 | **抓周盤 key-item screen** | Key items are flags (`got_scallion`, …). The menu shows a red round tray with 9 slots around a center slot (金鎖片). Slots fill in as flags are set. | The quest tracker *is* the tray. Very readable for kids. |
| 6 | **Two-phase final** | One event runs `battle shushuStorm` → dialogue → `heal` (50%; optional) → `battle shushuCry`. Engine already supports consecutive steps. Defeat in phase 2 respawns at the summit entry with phase-1 flag kept. | A dramatic, but readable, finale. |
| 7 | **Fixed "crowd" fights** | Already supported (an NPC whose talk event is a `battle`, hidden by `not:` flag). Used as gates in Ch1, 4, 5, 6, 9, 10. | Gates that feel like story. |
| 8 | **Inn price 0** | `inn` with `price: 0` should skip the payment line. | Free rests (park slide, station floor) without silly prices. |

Nothing else is new. Shops, inns, chests, triggers, flags, joins, and bosses all use the existing engine.


### 3.1 月亮線: the MRT system (spec for engineers)

**Goal:** every trip is a 20–60 second playable moment, with the real feel of the Taipei MRT (the door chime, 「請緊握扶手」, 博愛座, 嗶 at the gate, the line map lighting up), and it never becomes a chore. The player can always skip straight to the door.

**1. Station entrances.** Each landmark map has one `mrtGate` NPC/decor (the station sign and gates):
- `talk: [{ when: 'moonPass', event: 'mrt.enter' }, { event: 'mrt.closed' }]`.
- `mrt.enter` plays 「嗶——！」 and then a new step **`{ do: 'travel' }`**.

**2. The 路線圖 (travel) screen.** This is a new screen opened by `travel`. It's a simplified, stylized network map (not the official map artwork):
- Five colored lines, with station dots only for game stations.
- **Lit dot** = unlocked; **blinking ring** = you are here; **grey dot with "?"** = locked (tap → `mrt.locked`).
- The first time the screen opens after a new unlock, the new dot plays a little 「叮！」 light-up animation (`mrt.newStation`). Track this with a `seenStations` list in `Run`.
- Tap a lit dot → confirm 「搭乘月亮線前往〈站名〉？」 → set `run.rideTo = <mapId>` → `goto` that station's ride car (table below) at the car's entry tile.
- Optional "skip ride" toggle in settings: go straight to the destination (for replays).

**3. `STATIONS` table** (content, `mrt.ts`):

| key | 站名 `{station}` | 台語 `{stationTw}` | English `{stationEn}` | map | ride car | unlock `when` |
|---|---|---|---|---|---|---|
| daan | 大安森林公園 | 大安森林公園 | Daan Park | `daan` | `carRed` | `moonPass` |
| ntu | 公館 | 公館 | Gongguan | `ntu` | `carGreen` | `moonPass` |
| station | 台北車站 | 台北車頭 | Taipei Main Station | `station` | `carRed` | `moonPass` |
| ximen | 西門 | 西門 | Ximen | `ximen` | `carBlue` | `moonPass` |
| dadaocheng | 大橋頭 | 大橋頭 | Daqiaotou | `dadaocheng` | `carOrange` | `karaokeDone` |
| shilin | 劍潭 | 劍潭 | Jiantan | `shilin` | `carRed` | `dragonDone` |
| airport | 松山機場 | 松山機場 | Songshan Airport | `airport` | `carBrown` | `cutletDone` |
| zoo | 動物園 | 動物園 | Taipei Zoo | `zoo` | `carBrown` | `windsockDone` |
| beitou | 新北投 | 新北投 | Xinbeitou | `beitou` | `carRed` | `teapotDone` |
| tamsui | 淡水 | 淡水 | Tamsui | `tamsui` | `carRed` | `eggDone` |
| tower | 台北101/世貿 | 台北101/世貿 | Taipei 101/World Trade Center | `tower` | `carRed` | `metShushu` |
| xiangshan | 象山 | 象山 | Xiangshan | `xiangshan` | `carRed` | `cleared` |

Line colors are real; the car is "the line you'd ride to get there". The Moon Line is magic and never needs a transfer (廣播姊姊: 「月亮線，每一站都直達。」). Real transfer announcements still play as flavor (e.g. 「忠孝復興站，轉乘板南線」 on the brown line). 台語 names that match the Mandarin are written the same; the voice actor/TTS handles the reading. Fill in more 台語 names only with a native speaker.

**4. Ride-car maps** (5 maps, ~14×5 each; one palette per line color):

| map | Line | Look | Fixtures |
|---|---|---|---|
| `carBlue` | 板南線 | blue stripe, long bench seats, hand-straps | `moonline.salaryman`, optional fight `ride.blue.fight` |
| `carRed` | 淡水信義線 | red stripe; windows show city lights (elevated stretch) | `moonline.owl` (shop), optional fight `ride.red.fight` |
| `carBrown` | 文湖線 | short, rubber-tyred, **driverless**: a full **front window** at one end the party can stand at | `frontWindow` (`ride.brown.window`), optional fight `ride.brown.fight` |
| `carGreen` | 松山新店線 | green stripe | sleeping fishing 阿公 (in `ride.green.first`) |
| `carOrange` | 中和新蘆線 | orange stripe; "crowded" posters | `squishedWorker` (`ride.orange.squished`), `gag.moonline.noEating` sign, optional fight `ride.orange.fight` |

Every car has:
- a **博愛座** NPC (`moonline.priority` / `.bear`);
- a **路線圖 display** decor-NPC `lineMap` (the hint talk list in `script.md`; its lit dots match the travel screen);
- a **door** exit with `to: '@rideTo'` (new: resolved from `run.rideTo` at walk time; arrive at that map's MRT-gate tile);
- an **entry trigger** (not once) playing the ambient `ride.<line>` announcement;
- a **once-trigger** one tile in, playing `ride.<line>.first` (scene).

There are no random encounters in cars. The optional fight NPC in a car stays until it's beaten once (`carFight<Line>` flag).

**5. Audio:**
- The real-feeling **door chime** (叮咚叮咚) on entering a car, and a short **door-closing beep** before the doors shut.
- A per-line **4-note arrival jingle** (a game invention, not a recording; pentatonic, matching `shared/audio.ts`).
- Rail hum as the car's ambient loop.
- Everything is synthesized, as today; no sound files.

**6. Hub replacement:** the old single `moonline` hub map is removed. Its NPCs moved into cars (see the table). Backtracking for shops and stamps works from any landmark's `mrtGate`.

**Engine work, total:** the `travel` step and screen; `STATIONS`; `run.rideTo` and `seenStations`; the `'@rideTo'` exit target; text substitution for `{station}`/`{stationTw}`/`{stationEn}`. Everything else is content.

**Ambience by chapter (for palette/backdrop):** the sky shifts from deep navy (00:00) to indigo (03:00), then violet (05:00) and gold (05:29 sunrise). City lights stay warm. Every map has visible light sources: street lamps, neon, lanterns, lit windows.

---

## 4. Chapter-by-chapter outline

Conventions: **flags** are camelCase. "Gate" = an `Exit` with `when` and a `blocked` event. "Fixed fight" = an NPC whose talk is a battle. All event keys refer to `script.md`. Map sizes are columns × rows.

---

### Chapter 1 — 度晬前一晚 (00:00) · 家 → 大安森林公園

**Synopsis.** A midnight gust scatters the 抓周 treasures. Mocha, guilty, decides to fix it alone; Baokaka crawls after him. In 大安森林公園 they meet the mysterious 阿伯, get the stamp book, and calm a squirrel king who's hoarding a scallion.

**Map A: `home` (apartment living room, 大安區), 14×11**
- Key features: the low table by the big window with the **抓周盤** (empty, glowing faintly). Sofa with **爸爸** asleep and the remote on his belly. Parents' bedroom doorway with **媽媽**. **阿嬤**'s room door (snoring sounds). Crib in the corner (start). Front door at the bottom. Shoe rack (藍白拖). Wall calendar with a big red circle.
- Beats:
  1. `ch1.intro` (trigger at crib, once): chapter card, then the midnight cutscene (咻咻 at the window, the treasures fly away). Player now controls Baokaka.
  2. Talk to **摩卡貓** by the tray → `ch1.home.mocha` → **Mocha joins**, `mochaJoined`.
  3. Optional: **媽媽** (`ch1.home.mom`: sleep-talk about the typhoon night, heal), **爸爸** (`ch1.home.dad`: 「叫……爸爸……」), **阿嬤's door** (`ch1.home.grandma`: snores 「乖孫……金鎖片……」).
  4. Chests: **阿嬤的紅包** (side table → 銅板 +50, via event `ch1.home.redEnvelope`), **口水巾** (crib), **藍白拖** (shoe rack). (Chests give items; the 紅包 is a one-shot trigger that gives coins.)
  5. Fixed fight at the front door: **灰塵球 ×2** (`ch1.home.dust`): the battle tutorial. Sets `dustDone`.
  6. Front door exit → `daan`. Gate: `when: dustDone`; blocked `ch1.home.doorLocked` (「門把好高」). The 紅包 NPC uses `ch1.home.redEnvelope.early` until Mocha joins.

**Map B: `daan` (大安森林公園), 20×16**
- Key features: **露天音樂台** (white band-shell stage; the boss stands on it), **生態池** with reeds and a night heron on a post, winding tree-lined paths, a **溜滑梯** playground, jogging loop, the sunken **捷運大安森林公園站** plaza (entrance decor, not usable yet), and the park-edge convenience store. Leaves spin in little whirls (decor).
- Beats:
  1. `ch1.daan.intro` (entry trigger).
  2. **掃地阿伯** (土地公 #1) → `ch1.daan.uncle.first`: gives the **集章本** (`stampBook` flag), explains the stamps, and hints that squirrels hide things behind the music stage. Repeat: `.again`.
  3. **夜跑大哥** circling near the loop → rumor #1 (像機車那麼大). After the boss: `.after`.
  4. **池塘烏龜** (a slow old turtle, friendly) → lore line: 「風在哭」.
  5. **店員小哥** (`ch1.daan.clerk`): shop, first appearance.
  6. **溜滑梯** (rest spot, NPC-like decor) → `ch1.daan.slide`: inn, price 0, "滑下來、躺一下".
  7. **紀念章台** at the park entrance sign → `stamp.daan`.
  8. Gate: the path to the stage is blocked by a **落葉堆** (an NPC "leaf pile" with `not: stampBook`, talk `ch1.daan.leaves`). 阿伯's first talk sweeps it away: the leaf pile disappears when `stampBook` is set. (Teaches "talk to everyone".)
  9. **Boss 松鼠大王** on the stage → `ch1.daan.boss` → `squirrelDone`, `got_scallion`.
  10. Exit west (新生南路 gate) → `ntu`. Gate `when: squirrelDone`, blocked `ch1.daan.exitBlocked`.
- Chests: 鳳梨酥 ×2 (playground), 豆花 (behind the pond), 茶葉蛋 ×3 (by the jogging loop).
- Regular foes: **落葉精**, **暗光鳥** (danger zone: grass and trees; plaza and stage are safe).
- **Boss: 松鼠大王**. Taunt: 「這根綠綠長長的堅果是我的！」 Reward: 蔥, 銅板 30, 松果 decor.
- Levels: 1 → 3.

---

### Chapter 2 — 椰林大道的藍教授 (01:00) · 台灣大學

**Synopsis.** NTU at 1 a.m.: a student pulling an all-nighter, bikes everywhere, and a blue magpie who calls herself a professor. The goose that rules 醉月湖 has stolen the 書 and is "reading" it upside down. 阿藍 joins the fight, then reveals the secret Moon Line.

**Map: `ntu`, 22×16**
- Key features: **椰林大道**, a long central avenue of palm trees running bottom→top. **傅鐘**, the small bell on a stone pillar by the avenue. **總圖書館** (the main library: a big building at the top end with steps). **文學院**, an old arched building with a window ledge where 阿藍 perches. **醉月湖**, a lake on the right with the **湖心亭** pavilion reached by a little bridge. Bike racks (lots, including one toppled pile), azalea (杜鵑) hedges, and the 台大正門 gate (bottom left) leading to the 公館 MRT entrance.
- Beats:
  1. `ch2.intro`.
  2. **爆肝大學生** on a bench with a laptop → rumor #2 (像公車那麼大) + exam joke. `.after` once the boss is done.
  3. **校工阿伯** (土地公 #2) → `ch2.ntu.uncle`: 「找知道很多事情的鳥問問」; gives 珍珠奶茶 the first time.
  4. **阿藍** on the 文學院 ledge → `ch2.ntu.magpie.first`: introduces herself, says 鵝霸 took the book, tells you the shortcut around the bike pile. Sets `metMagpie`. Repeat: `.again`.
  5. Gate: the bridge path to the lake is blocked by the **腳踏車山** (an NPC with `not: metMagpie`, talk `ch2.ntu.bikes`). After `metMagpie`, the pile is gone.
  6. **宿舍交誼廳** sofa (a student lounge doorway) → `ch2.ntu.lounge`: inn, price 10.
  7. **店員小哥** → `ch2.ntu.clerk`: shop, plus the "又是你們？" gag.
  8. **紀念章台** at 傅鐘 → `stamp.ntu`.
  9. **Boss 鵝霸** at the 湖心亭 → `ch2.ntu.boss`: **阿藍 joins mid-event** (`magpieJoined`), then the battle. Sets `gooseDone`, `got_book`.
  10. After the boss, 阿藍 explains the Moon Line (`ch2.ntu.moonline`, auto-run after the boss).
  11. Exit at 台大正門 → **公館站** → `station` (the first ride plays at the top of `ch3.intro`). Gate `when: gooseDone`, blocked `ch2.ntu.exitBlocked`.
- Chests: **學士帽** (on the library steps), 鳳梨酥 ×2 (bike rack), 豆花 ×2 (by the azaleas).
- Regular foes: **暴衝腳踏車**, **杜鵑花精**, **暗光鳥**.
- **Boss: 鵝霸** (醉月湖的大白鵝). Taunt: 「鵝鵝鵝！這本書我正在研究！」 Reward: 書, 銅板 45.
- Levels: 3 → 4.

---

### Chapter 3 — 月亮線，出發！ (01:45) · 台北車站

**Synopsis.** The first ride on the Moon Line brings the party to Taipei Main Station, Taipei's famous maze. A turnstile golem has swallowed the 印章 and won't let anyone onto the platforms. Beat it, and 廣播姊姊 stamps your 月亮票: the whole city opens up.

**Map: `station`, 22×16**
- Key features: the **大廳**, a huge hall with the famous **black-and-white checkered floor**, a big departure board, and ceiling lights. The **服務台** information desk (廣播姊姊 + stamp). A row of **閘門** turnstiles (the boss stands in the middle gap; the platform stairs are behind it). A maze-like **地下街** underground mall (left side: small corridors with shuttered shop signs and dead-end chests). Ticket machines, a 便當 stand, and the 背包客 under a big sign.
- Beats:
  1. `ch3.intro` (entry trigger, once): chapter card, then the first Moon Line ride (廣播姊姊's trilingual announcement), then arrival in the hall.
  2. **廣播姊姊** at the info desk → `ch3.station.announcer.first`: explains the 月亮票 (Moon Line ticket, `moonTicket` flag + key item) and that the gates are broken. After the boss → `ch3.station.announcer.stamp` (stamps the ticket, `moonPass`). Later: `.again`.
  3. **站務阿伯** (土地公 #3) → `ch3.station.uncle`: maze tip, plus 鐵路便當 ×1 the first time.
  4. **清潔阿姨** → rumor #3 (像火車那麼大).
  5. **迷路的背包客** → `ch3.station.backpacker` (first "where is 101" gag).
  6. **便當阿姨** → shop (鐵路便當 debut).
  7. **大廳地板** (a "sitting spot" NPC with a few spirit-folk sitting on the checkered floor) → `ch3.station.floor`: inn, price 0. 「大家都坐在地上，你們也坐一下。」
  8. **紀念章台** at the info desk → `stamp.station`.
  9. **Boss 閘門巨人「嗶嗶」** → `ch3.station.boss`. Sets `gateDone`, `got_seal`.
  10. Exit: platform stairs → `mrtGate` (`mrt.enter`). Gate `when: moonPass`, blocked `ch3.station.platformBlocked`.
- Chests: 珍珠奶茶 ×2, 紅龜粿 ×1, 鳳梨酥 ×3 (all in the 地下街 dead ends).
- Regular foes: **指標小鬼**, **滾滾行李箱** (danger zone: the 地下街 and the edges of the hall; the hall center is safe).
- **Boss: 閘門巨人「嗶嗶」**. Taunt: 「嗶——！餘額不足！」 Reward: 印章, 銅板 60.
- Levels: 4 → 5.

**The Moon Line.** After `moonPass`, the platform stairs lead to the first `mrt.enter` (the travel screen). The old hub map is replaced by the ride-car system in § 3.1.

---

### Chapter 4 — 紅樓的走音天王 (02:15) · 西門町

**Synopsis.** Neon still blazes at 2:40 a.m. Street dancers practice at Exit 6. From inside the 紅樓 comes the most off-key singing in Taipei: a karaoke machine has grabbed the 麥克風 and won't stop. Mocha admits he's jealous.

**Map: `ximen`, 20×16**
- Key features: the **西門紅樓**, an octagonal red-brick hall with a cross-shaped wing (top center; the boss stage is in front of its door). The **pedestrian zone** with painted ground and the famous **6號出口** MRT exit (the party's arrival point). **Movie Street**, with giant hand-painted-style movie billboards and neon signs. A **夾娃娃機店** (claw-machine shop: a glowing booth). A scooter parking row. The 麵線 stall. An alley sign pointing "往龍山寺 →" (decor only).
- Beats:
  1. `ch4.intro`.
  2. **街舞少年** (two dancers) → rumor #4 (像一整條街).
  3. **算命阿伯** (土地公 #4) at a little folding table → `ch4.ximen.uncle`: comic fortune. 「今晚有貴人，還有一朵雲。」
  4. **麵線阿姨** → shop (food).
  5. **店員小哥** → `ch4.ximen.clerk` (shop).
  6. **背包客** → `ch4.ximen.backpacker`.
  7. **Mocha's bench scene** (a trigger on the bench at 6號出口, once, after `neonDone`) → `ch4.ximen.mochaTalk`: the jealousy confession, part 1.
  8. **電影院** doorway → `ch4.ximen.cinema`: inn, price 15 (「午夜場，睡最後一排」).
  9. **紀念章台** at the 紅樓 → `stamp.ximen`.
  10. **Fixed fight:** a crowd of **霓虹招牌精 ×3** blocking the 紅樓 plaza → `ch4.ximen.neon`, `neonDone`.
  11. **Boss 卡拉OK大王** → `ch4.ximen.boss`. Sets `karaokeDone`, `got_mic`.
  12. Exit: 6號出口 → `mrtGate` (`mrt.enter`).
- Chests: **安全帽** (scooter row), 珍珠奶茶 ×2 (claw-machine shop, "掉出來了！"), 雞排 ×1.
- Regular foes: **霓虹招牌精**, **夾娃娃爪**, **指標小鬼**.
- **Boss: 卡拉OK大王**. Taunt: 「來喔！點歌點歌！下一首，〈我的麥克風〉！」 Reward: 麥克風, 銅板 75.
- Levels: 5 → 6.

---

### Chapter 5 — 迪化街的布龍 (02:45) · 大稻埕・迪化街

**Synopsis.** Old Taipei: baroque shophouse facades, dried mushrooms, Chinese-medicine drawers, and bolts of flowered cloth. The wind has whipped the 永樂布市's fabric into a dancing dragon that clacks an 算盤 in its jaws. 茶行阿伯 tells the story of last year's typhoon: the first big clue.

**Map: `dadaocheng`, 22×16**
- Key features: **迪化街** runs left→right. Both sides are lined with **牌樓** facades (ornate pediments), a **南北貨** stall (baskets of dried goods), a **中藥行** with a wall of 百子櫃 drawers, a **茶行** with tea tins, and a **布行** with fabric bolts. **霞海城隍廟** is a small red temple front with lanterns (decor and an NPC outside; no deity shown). **永樂市場** is the fabric-market building (top). The **大稻埕碼頭** wharf on the right edge has the river, container stalls, and the boss.
- Beats:
  1. `ch5.intro`.
  2. **茶行阿伯** (土地公 #5) → `ch5.dadaocheng.uncle`: **the typhoon story** (lore #1). Sets `heardStory`.
  3. **布行阿姨** → rumor #5 (比颱風還大的颱風). After the boss → `.after`: gives the **花布背心**.
  4. **廟口阿姨** → `ch5.dadaocheng.temple`: gives the **平安符** (once).
  5. **南北貨老闆娘** → shop.
  6. **中藥行阿公** → `ch5.dadaocheng.herbal`: inn, price 20 (四神湯).
  7. **店員小哥** → `ch5.dadaocheng.clerk`.
  8. **紀念章台** at a 牌樓 → `stamp.dadaocheng`.
  9. **Fixed fight:** **布匹蛇 ×2** coiled across the street to the wharf → `ch5.dadaocheng.snakes`, `snakesDone`.
  10. **Boss 舞布龍** at the wharf → `ch5.dadaocheng.boss`. Sets `dragonDone`, `got_abacus`.
  11. Exit: 大橋頭站 sign (left) → `mrtGate` (`mrt.enter`).
- Chests: **虎頭鞋** (in the shoe shop's doorway), 紅龜粿 ×1, 豆花 ×2.
- Regular foes: **中藥抽屜怪**, **布匹蛇**.
- **Boss: 舞布龍**. Taunt: 「劈哩啪啦！算一算，你們打不贏！」 Reward: 算盤, 銅板 90.
- Levels: 6 → 7.

---

### Chapter 6 — 夜市大胃王 (03:10) · 士林夜市

**Synopsis.** The night market closed hours ago, but the lights are still on: the *food* is holding its own after-hours market. Bubble-tea pearls bounce, stinky tofu stinks, and a fried-chicken cutlet the size of a door is brandishing a drumstick like a sword. 阿藍 figures out why the wind can't leave: Taipei is a basin.

**Map: `shilin`, 22×16**
- Key features: the **night-market gate arch** (bottom) with a lit sign. Food-stall rows in a grid (steam rising; signs reading 雞排／珍奶／臭豆腐／大腸包小腸／蚵仔煎). The **遊戲區**: balloon shooting, goldfish scooping, pinball (彈珠台). The **地下美食區** stairs (top; the boss arena is in front). **劍潭站** with its boat-shaped roof (left edge, the exit). A coin-op **massage chair** row.
- Beats:
  1. `ch6.intro`.
  2. **撈金魚小妹** → rumor #6 (像101那麼大).
  3. **彈珠台阿伯** (土地公 #6) → `ch6.shilin.uncle`: 「人生就像彈珠台」; gives a 豆花.
  4. **雞排阿姨** → shop (雞排, 滷肉飯, 珍珠奶茶).
  5. **店員小哥** → `ch6.shilin.clerk`.
  6. **背包客** → `ch6.shilin.backpacker`.
  7. **按摩椅** → `ch6.shilin.massage`: inn, price 10 (「投十塊，按好按滿」).
  8. **紀念章台** at the 劍潭站 sign → `stamp.shilin`.
  9. **Fixed fight:** **大腸包小腸 ×2** guarding the stairs → `ch6.shilin.sausage`, `sausageDone`.
  10. **Boss 超級大雞排** → `ch6.shilin.boss`. Sets `cutletDone`, `got_drumstick`.
  11. After the boss: **the basin explanation** (auto, `ch6.shilin.basin`). The clue now points to 松山機場: 「它想搭飛機，飛出去。」
  12. Exit: 劍潭站 → `mrtGate` (`mrt.enter`).
- Chests: 雞排 ×2, 鐵路便當 ×1, 芒果冰 ×1.
- Regular foes: **珍珠粉圓**, **臭豆腐精**, **大腸包小腸**.
- **Boss: 超級大雞排**. Taunt: 「我比你的臉還大！」 Reward: 雞腿, 銅板 110.
- Levels: 7 → 8.

---

### Chapter 7 — 飛機睡著的時候 (03:35) · 松山機場

**Synopsis.** The brown-line ride ends with Baokaka glued to the driverless train's front window, saying a brand-new word: 「飛機！」 At Songshan Airport the planes are asleep at their gates; no flights between 23:00 and 05:00. The control tower logged a strange radio call: 「咻咻可以起飛嗎？」 The runway-end windsock, spun dizzy all night by the cloud, is tangled in the 金鎖片's lost **紅繩**. Afterwards the party lies on the grass at the runway end, watching the runway lights: a quiet, wistful moment that turns the "monster" into someone who just wants to go home.

**Map: `airport` (松山機場), 22×16**
- Key features:
  - The **terminal front** (bottom left), with the MRT entrance and a lit departures hall (the clerk, the waiting chairs, the stamp).
  - The **apron**, with three planes asleep at jet bridges. The planes are small, white, generic, unbranded, with a blue stripe; one is the `jet` NPC.
  - The **control tower** (a tall decor with a lit cab; the NPC talks from its base).
  - The **runway** (a long dark strip across the top) with **blue edge lights** and green threshold lights (decor, non-solid), stretching off-map.
  - The **windsock** on a pole at the runway end (the boss).
  - The **飛機巷** (plane-watching lane): a little lane with a grass verge by the runway-end fence (the `ch7.airport.planeWatch` trigger).
- **Art note:** keep the airport civilian and generic. No military aircraft, hangars or fencing signage, and no real airline liveries.
- Beats:
  1. `ch7.intro` (after `ride.brown.first` in the car, where 「飛機！」 is learned).
  2. **塔台** (`ctrlTower`) → `ch7.airport.ctrlTower`: radio-speak 「Over。」 gag. Reports 咻咻's request to take off; asks for help with the windsock. `.after` once the boss is done.
  3. **小白機** (`jet`), asleep → `ch7.airport.jet`; after the boss, awake → `.awake`: 咻咻 asked to be flown out of the basin. Its promise sets `jetPromise`, paid off at the 101 sunrise (it takes off first thing and waggles its wings).
  4. **推車阿伯** (土地公 #7) → `ch7.airport.uncle`: gives the **旅行頸枕**.
  5. **地勤姊姊** (`marshal`) → `ch7.airport.marshal`: guides Baokaka in with light wands: 「完美停機！」
  6. **店員小哥** → `ch7.airport.clerk` (「機場分店」).
  7. **候機室的椅子** → `ch7.airport.chairs`: inn, price 15.
  8. **紀念章台** in the departures hall → `stamp.airport`.
  9. **Fixed fight:** **行李拖車 ×2** blocking the path to the runway end → `ch7.airport.carts`, `cartsDone`.
  10. **Boss 風向袋小姐** → `ch7.airport.boss`. Sets `windsockDone`, `got_redString`.
  11. **Plane-watching** (a trigger on the 飛機巷 grass, `when: windsockDone`, once) → `ch7.airport.planeWatch`. Baokaka and Mocha's quiet promise: 「長大以後。一起坐。」
  12. Exit: `mrtGate` → `mrt.enter` (動物園 now lit; brown line).
- Chests: 珍珠奶茶 ×2, 鐵路便當, 紅龜粿.
- Regular foes: **跑道燈精**, **行李拖車**, **滾滾行李箱** (danger zone: the apron and runway edge; the terminal and 飛機巷 are safe).
- **Boss: 風向袋小姐**. Taunt: 「轉轉轉！風往哪裡吹？我不知道啦！」 Reward: 紅繩, 銅板 120.
- Levels: 8 → 9.

---

### Chapter 8 — 貓空上的月亮熊 (04:00) · 動物園 → 貓空

**Synopsis.** At the zoo, the black-bear enclosure is empty. The party finds 黑糖, terrified of the wind, hiding in a gondola. With a hug and half a pineapple cake he joins, and the gondola carries everyone up to 貓空's tea hills. There, for the first time, they see 101 wrapped in a spinning storm.

**Map A: `zoo` (台北市立動物園), 20×14**
- Key features: the **entrance plaza** with the zoo sign. The **台灣動物區**: a rock-and-tree habitat with the **黑熊** enclosure (empty, with a "黑糖" name plaque), a macaque rock, and a pangolin burrow. A sign pointing to 企鵝館 / 無尾熊館 (decor). The **纜車動物園站**: a modern station with a gondola cabin docked (the bear is inside). Bamboo groves.
- Beats:
  1. `ch8.intro`.
  2. **管理員阿伯** (土地公 #8) → `ch8.zoo.uncle`: 「那個大孩子很怕風」, hints at the gondola.
  3. **狐獴哨兵** (a meerkat lookout, NPC) → rumor #7, and the first non-scary detail: 「那朵雲，好像在哭」.
  4. **空的黑熊籠** (plaque) → `ch8.zoo.plaque`: 「台灣黑熊・黑糖。喜歡：黑糖珍奶。怕：很多東西。」
  5. **黑糖** in the gondola → `ch8.zoo.bear` → **黑糖 joins** (`bearJoined`); the cabin becomes an exit to `maokong`.
  6. Exit: gondola → `maokong` (`when: bearJoined`, blocked `ch8.zoo.gondolaBlocked`). Exit: zoo entrance → `mrtGate` (`mrt.enter`).
- Chests: 黑糖珍奶 ×1 (by the bear enclosure, "給黑糖的"), 鳳梨酥 ×3.
- Regular foes: **台灣獼猴**, **穿山甲**.

**Map B: `maokong` (貓空), 20×14**
- Key features: terraced **tea rows** stepping down the hill. A **茶館** with a lantern-lit veranda (the boss is the giant teapot on its terrace). The **纜車貓空站**. A **view platform** at the edge showing the city lights and **101 wrapped in a swirling cloud** (a big backdrop decor). A stone path, an old wooden signboard.
- Beats:
  1. `ch8.maokong.intro`.
  2. **The viewpoint trigger** (once) → `ch8.maokong.view`: first sight of the storm around 101. 黑糖's fear of heights is set up here.
  3. **茶館老闆娘** → `ch8.maokong.teahouse`: inn, price 25.
  4. **店員小哥** with a portable cart → `ch8.maokong.clerk`: 「行動分店。」
  5. **紀念章台** at the station → `stamp.maokong`.
  6. **Boss 茶壺爺** on the terrace → `ch8.maokong.boss`. Sets `teapotDone`, `got_celery`.
  7. Exit: 纜車貓空站 → `zoo` (where the zoo's `mrtGate` opens the travel screen).
- Chests: **芒果冰** ×1, 珍珠奶茶 ×2, 紅龜粿 ×1.
- Regular foes: **山嵐**, **穿山甲**, **台灣獼猴**.
- **Boss: 茶壺爺** (鐵觀音茶壺). Taunt: 「呸呸呸！誰把芹菜丟進我的茶！」 Reward: 芹菜, 銅板 130.
- Levels: 8 → 10 (黑糖 joins at about Lv9).

---

### Chapter 9 — 北投的熱呼呼 (04:30) · 北投溫泉

**Synopsis.** Steam, sulfur, and the smell of boiled eggs. A grumpy hot-spring egg who has "been cooking for a hundred years" has the 聽診器 and is convinced he's sick. Mocha dips his paws in a footbath for Baokaka and tells him the truth about the day he was born. The rumor finally breaks: "it's only the size of a pillow."

**Map: `beitou`, 22×16**
- Key features: **新北投站**, the old wooden Japanese-era station building (arrival, bottom left). A creek with steam rising (water tiles plus steam decor). The **北投溫泉博物館** (a red-brick and wooden bathhouse). The **北投圖書館** (a green wooden library with plants on the roof). A **public footbath** (a wooden tub area). The **地熱谷** (top right): a jade-green steaming pond behind a railing, and the boss arena.
- Beats:
  1. `ch9.intro`.
  2. **書蟲** (a bookworm in round glasses, at the library) → rumor-breaker: 「其實只有枕頭那麼大」, plus a rivalry gag with 阿藍.
  3. **澡堂阿伯** (土地公 #9) → `ch9.beitou.uncle`: gives a 紅龜粿 and the line 「泡泡腳，心就軟了」.
  4. **溫泉阿嬤** → `ch9.beitou.onsen`: inn, price 30, plus the footbath. **The first visit is free and plays Mocha's heart-to-heart** (inside `ch9.beitou.onsen`, sets `mochaTalk2`); later visits use `ch9.beitou.onsen.again`.
  5. **店員小哥** → `ch9.beitou.clerk`.
  6. **紀念章台** at 新北投站 → `stamp.beitou`.
  7. **Fixed fight:** **硫磺煙 ×3** at the 地熱谷 gate → `ch9.beitou.sulfur`, `sulfurDone`.
  8. **Boss 溫泉蛋爺爺** → `ch9.beitou.boss`. Sets `eggDone`, `got_stethoscope`.
  9. Exit: 新北投站 → `mrtGate` (`mrt.enter`).
- Chests: 黑糖珍奶 ×1, 芒果冰 ×1, 雞排 ×2.
- Regular foes: **硫磺煙**, **啪噠木屐**.
- **Boss: 溫泉蛋爺爺**. Taunt: 「咳咳！老夫正在看病，別吵！」 Reward: 聽診器, 銅板 150.
- Levels: 10 → 11.

---

### Chapter 10 — 河的盡頭是海 (04:55) · 淡水

**Synopsis.** Where the 淡水河 meets the sea. Across the river mouth stands the new **淡江大橋**, a single tall tower fanning out cables. A fiddler-crab general paints a "sunset" at 5 a.m. on the 情人橋 at **漁人碼頭**, with the stolen 畫筆. From the 漁人碼頭 seawall, the party finally sees 咻咻 circling the top of the bridge's tower, trying to climb high enough to jump out of the basin. It comes down: tiny, scared, crying. It flees to 101. Mocha confesses he fell asleep on guard duty. The truth clicks: 咻咻 and Baokaka were born on the same night.

**Map: `tamsui`, 28×16** (wide; three zones, left to right)
- Key features:
  - **Zone 1, 老街:** **淡水站** (left), **淡水老街** with 阿給, 魚丸 and 鐵蛋 shops, the **紅毛城** (red fort) on a hill (top; decor and a chest).
  - **Zone 2, river:** the **河岸步道** promenade with benches and banyan trees, and a **渡船頭** ferry pier.
  - **Zone 3, 漁人碼頭** (right): a wooden boardwalk, fishing boats in the harbour, the white sail-shaped **情人橋** (the boss stands at its foot), and the **seawall** at the far right (the 咻咻 meeting trigger).
  - **Backdrop, 淡江大橋:** across the river mouth, a big non-walkable decor in the sky layer. The bridge opened to traffic on 2026-05-12 and links 淡水 and 八里. Draw it as **one tall single pylon (about 211 m) on the 八里 side**, with fans of stay cables holding a long, gently curving deck that reaches back to the 淡水 bank. It's the world's longest-span single-pylon asymmetric cable-stayed bridge (450 m main span, about 920 m long). 觀音山's silhouette sits behind it. Before the meeting, a small grey swirl circles the top of the pylon (animated decor; hide it once `metShushu` is set).
  - The sea horizon on the right edge, turning violet.
- **Accuracy notes:** keep the bridge non-walkable; we don't claim pedestrian access. Don't draw a light-rail train on it. Track space is reserved for a future extension, but no service exists. In-game text calls it 「淡江大橋」 and 「新大橋」, and doesn't name its designer.
- Beats:
  1. `ch10.intro`.
  2. **街頭畫家** (an artist with an empty easel) → rumor #8 (「繞著大橋的柱子轉……小小的，一直在哭」). After the boss → `.after`: paints the party a portrait (an item-less reward; sets `portrait`, which is shown in the ending credits).
  3. **渡輪阿伯** (土地公 #10) → `ch10.tamsui.uncle`: 「河一直流，就會流到海」, the theme line. Repeat variant `gag.ch10.newBridge`: the new bridge means fewer ferry passengers, 「坐在船上看新橋，也很好看。」
  4. **阿給阿婆** → shop (adds 機車雨衣).
  5. **店員小哥** → `ch10.tamsui.clerk`.
  6. **背包客** → `ch10.tamsui.backpacker`.
  7. **河邊長椅** → `ch10.tamsui.bench`: inn, price 0 (「看河，發呆，休息」).
  8. **紀念章台** at the 情人橋 sign → `stamp.tamsui`.
  9. **Fixed fight:** **招潮蟹小兵 ×3** on the bridge approach → `ch10.tamsui.soldiers`, `soldiersDone`.
  10. **Boss 招潮蟹將軍** → `ch10.tamsui.boss`. Sets `crabDone`, `got_brush`.
  11. **Meeting 咻咻** (a trigger at the 漁人碼頭 seawall facing 淡江大橋, `when: crabDone`, once) → `ch10.tamsui.shushu` → `metShushu`. This is the big reveal plus Mocha's confession.
  12. Exit: 淡水站 → `mrtGate` (台北101 is now lit on the 路線圖).
- Chests: **機車雨衣** (紅毛城), 芒果冰 ×2, 紅龜粿 ×2.
- Regular foes: **鐵蛋**, **招潮蟹小兵**.
- **Boss: 招潮蟹將軍**. Taunt: 「本將軍在畫夕陽！你們擋到光了！」 Reward: 畫筆, 銅板 170.
- Levels: 11 → 12.

---

### Chapter 11 — 離天空最近的地方 (05:15) · 台北101

**Synopsis.** The tallest tower in Taipei, wrapped in wind. A 37-second elevator ride. The great golden damper ball, dizzy from the storm, has to be steadied before the tower will let anyone up. 黑糖 climbs despite his fear. On the outdoor deck, 咻咻's sad one-person birthday party, a two-phase storm, and Baokaka's first steps.

**Map A: `tower` (101 · 89F observatory), 18×16**
- Key features: floor-to-ceiling windows on every side (the city below at dawn-blue). In the center, the giant golden **阻尼器** sphere hanging in its pit, visible through a railing (the mini-boss). A souvenir shop. A convenience-store counter. The **elevator** doors (arrival, bottom). The **stairs to 91F** (top; gated). Coin-op telescopes. Flipped umbrellas and runaway balloons stuck against the glass (decor).
- Beats:
  1. `ch11.intro` (arrival, once): chapter card, then the elevator scene (「37秒，從5樓到89樓！」; 阿藍 trivia; 黑糖 panics).
  2. **清潔阿伯** (土地公 #11) → `ch11.tower.uncle`: 「呵呵……咱是不是見過？」 (the most direct hint), gives 芒果冰 ×2.
  3. **店員小哥** → `ch11.tower.clerk`: 「我們在101也有分店。」
  4. **紀念品店** → `ch11.tower.souvenir` (shop with the best gear: 機車雨衣, items).
  5. **觀景窗** → `ch11.tower.window`: inn, price 0 (「看日出前的台北，休息一下」).
  6. **紀念章台** → `stamp.tower`.
  7. **Mini-boss 定心球「阿穩」** at the damper railing → `ch11.tower.damper`. Sets `damperDone`.
  8. **黑糖's courage** (a trigger at the stairs, `when: damperDone`, once) → `ch11.tower.bearBrave`.
  9. Exit: stairs → `summit`. Gate `when: damperDone`, blocked `ch11.tower.stairsBlocked`.
- Chests: **機車雨衣** ×1 (if you skipped the 淡水 chest, the 2nd copy is here), 紅龜粿 ×2, 黑糖珍奶 ×2.
- Regular foes: **翻花雨傘**, **天價高麗菜**, **旋風小子**.
- **Mini-boss: 定心球「阿穩」**. Taunt: 「晃……晃……我停不下來……」 Reward: 銅板 200, and the stairs open.

**Map B: `summit` (101 · 91F outdoor deck), 14×12**
- Key features: the open-air deck with high railings, wind streaks blowing across (decor), and the tower spire rising behind. At the far end, **咻咻's party**: a crooked handmade 「生日快樂」 banner (a stolen shop sign), three flipped umbrellas as "decorations", a 雞排 paper bag as a hat, popped balloons, and a single sad candle that keeps blowing out. The sky turns violet, then gold at the end.
- Beats:
  1. `ch11.summit.intro` (entry trigger).
  2. **咻咻** → `ch11.summit.final` (pre-dialogue; 阿藍 admits 「我不知道」) → `battle shushuStorm` (boss) → interlude → `heal` → `battle shushuCry` (boss) → **Baokaka's first steps**, the hug. Sets `shushuDone`.
  3. Auto-continues to `ch11.summit.party`: the sunrise, all friends arrive, 生日快樂, 阿藍 re-ties the **紅繩** onto the 金鎖片, and the 小白機 from Ch7 takes off at first light and waggles its wings past 101 (the airport opens at 05:00, so this is consistent). 塔台: 「早班機，祝生日快樂。Over。」 Then → `ch11.summit.home` (Moon Line express home) → `ending.grandma` → `ending.party` → `{do:'ending'}`.
- No random encounters on the summit. One chest: **紅龜粿 ×2** (by the railing). A free heal is the first line of `ch11.summit.intro` (the wind gives way for a moment).
- **Final boss phase 1: 暴風咻咻**. Taunt: 「不要過來！這是咻咻的生日！」
- **Final boss phase 2: 哭哭咻咻**. Taunt: 「嗚哇——大家都叫咻咻快走——！」
- Levels: 12 → 15.

---

### Ending & post-credits (`ending.*`)

1. `ending.grandma` — 05:30, 阿嬤 wakes up; the tray is complete; Mocha is asleep on it.
2. `ending.party` — 10:00, the 抓周 (Baokaka grabs Mocha), the first word (摩卡), the breeze, the second word (咻咻), and Dad's despair.
3. `{ do: 'ending' }` — the credits screen. Suggested credits art: the 淡水 painter's portrait (if `portrait`), then the stamp book.
4. `ending.tudigong.full` / `ending.tudigong.partial` (post-credits; `.full` if all 11 `stamp_*` flags are set; the reducer also sets the derived flag `allStamps`).
5. `ending.hook` — 「每年夏天的下午……」

### Post-game: `xiangshan` (象山 at sunrise), 16×14

- A hiking-trail map with stone stairs, the famous **六巨石** boulders, and the photo platform with **101 framed in the sunrise**.
- NPCs: 土地公 (no disguise now; `post.tudigong` gives 土地公的拐杖 if `allStamps` and not `caneGiven`; otherwise `post.tudigong.partial`), 店員小哥 (`post.clerk`: 「……我們在山上也有分店。」), the whole party's former bosses lounging around (one line each: `post.friends.*`).
- Superboss: **生日加碼・咻咻** (`post.shushu`): rematch, optional, repeatable. The victory line differs: 「明年還要再玩！」
- Encounters: none, or rare level-15 mixes.

---

## 5. Foe roster

All regular foes appear in groups of 1–3 (the engine max is 3 per battle). "Pow" is the move power multiplier; one = single target, all = whole party. Stats are **starting points** for `sim.test.ts` tuning, scaled from the current curve. Bosses never heal (per the existing balance rule).

### 5.1 Regular foes (27)

| # | id | Name | Where | Personality | Visual (art direction) | Moves (in order, looping) | HP / ATK / DEF / SPD | XP / 銅板 / drop |
|---|---|---|---|---|---|---|---|---|
| 1 | `dustBunny` | 灰塵球 | home | Shy fluff that rolls when nervous. | Grey fuzzball, two dot eyes, one stray hair. | 滾過來 (one 1.0) · 滾過來 (one 1.0) · 縮成一團 (guard) | 24/7/1/4 | 5/3/— |
| 2 | `leafSprite` | 落葉精 | daan | Giggly, spins in circles, can't stop. | A swirl of three green-and-gold leaves with a smiling acorn face. | 葉子轉轉 (one 1.0) · 落葉飛舞 (all 0.7) | 30/8/1/7 | 7/4/茶葉蛋 30% |
| 3 | `nightHeron` | 暗光鳥 | daan, ntu | Grumpy stay-up-late bird ("暗光鳥" is Taiwanese for night owl, both bird and person). Stares. | Night heron: hunched grey body, black cap, two white head plumes, piercing red eyes (big and cartoony, not scary), and a coffee cup decor in one wing. | 瞪你 (guard) · 啄啄 (one 1.2) · 熬夜叫聲 (all 0.8) | 40/10/2/5 | 9/5/豆花 25% |
| 4 | `crazyBike` | 暴衝腳踏車 | ntu | A runaway campus bike, bell ringing nonstop. | A rusty campus bike with a basket full of textbooks, handlebar "eyes", and a ringing-bell mouth. | 鈴鈴鈴 (all 0.8) · 衝過來 (one 1.3) | 52/12/3/9 | 11/6/— |
| 5 | `azaleaSprite` | 杜鵑花精 | ntu | Sweet but sneezy; pollen everywhere. | A pink azalea blossom with leaf arms, rosy cheeks, and a pollen cloud. | 花粉哈啾 (all 0.7) · 花瓣拍 (one 1.1) · 合起花瓣 (guard) | 48/11/4/6 | 10/6/鳳梨酥 25% |
| 6 | `signImp` | 指標小鬼 | station, ximen | Prankster that points every direction at once. | A green-and-white direction sign on two stick legs, with arrows for arms pointing opposite ways and a grinning face on the panel. | 這邊走 (one 1.0) · 那邊走 (one 1.0) · 轉圈圈 (all 0.9) | 60/14/3/10 | 13/7/— |
| 7 | `suitcase` | 滾滾行李箱 | station | Lost luggage, clingy, wants an owner. | A hard-shell suitcase covered in travel stickers, with its handle up like an antenna and wheels for feet. | 滾輪衝撞 (one 1.2) · 打開蓋子 (guard) · 行李雪崩 (all 0.9) | 78/14/6/5 | 14/8/鐵路便當 15% |
| 8 | `neonSign` | 霓虹招牌精 | ximen | Show-off, flashes constantly. | A pink-and-blue neon sign shaped like a cat face that buzzes, with one letter flickering. | 閃閃發光 (all 0.8) · 電電 (one 1.3) | 70/16/4/8 | 15/8/珍珠奶茶 20% |
| 9 | `clawGrabber` | 夾娃娃爪 | ximen | Always *almost* grabs, never does. | A three-pronged silver claw dangling from a short cable, with a plush stuck in it and a hopeful face on the hub. | 夾——空 (one 0.6) · 夾到了 (one 1.6) · 晃來晃去 (guard) | 66/17/4/9 | 15/9/— |
| 10 | `herbDrawer` | 中藥抽屜怪 | dadaocheng | Old and fussy; spits herbs. | A wooden cabinet of small drawers labeled 當歸, 枸杞, 紅棗, with drawers popping open like mouths and a pair of spectacles. | 當歸噴噴 (one 1.2) · 抽屜開開關關 (all 0.9) · 關好抽屜 (guard) | 95/18/7/5 | 18/10/豆花 25% |
| 11 | `clothSnake` | 布匹蛇 | dadaocheng | Long and wiggly, ticklish. | A long bolt of red peony-print 花布 unrolled into a snake, with button eyes and a pinking-shear tongue. | 布條纏繞 (one 1.3) · 捲捲捲 (all 0.8) | 88/19/5/8 | 18/10/— |
| 12 | `boba` | 珍珠粉圓 | shilin | Bouncy trio energy; very sticky. | A glossy black tapioca pearl with a tiny straw "hat" and bounce lines. Often in groups of 3. | 彈彈彈 (one 1.0) · QQ黏黏 (one 1.3) | 58/18/4/11 | 14/7/珍珠奶茶 15% |
| 13 | `stinkyTofu` | 臭豆腐精 | shilin | Proud of his smell: "聞起來臭，吃起來香". | A golden fried tofu cube with pickled-cabbage "hair" and wavy green stink lines. | 臭臭氣 (all 1.0) · 酥脆撞 (one 1.3) | 100/20/6/6 | 20/11/— |
| 14 | `sausagePair` | 大腸包小腸 | shilin | A double-act; the small sausage does all the talking. | A grilled rice-sausage bun hugging a little pork sausage; two faces, matching grins. | 大的撞 (one 1.4) · 小的戳 (one 0.9) · 一起滾 (all 0.9) | 115/21/7/6 | 22/12/雞排 20% |
| 15 | `macaque` | 台灣獼猴 | zoo, maokong | Cheeky snack thief. | A Formosan macaque with a brown-grey coat and pink face, cheeks stuffed, holding a stolen 鳳梨酥. | 搶零食 (one 1.2) · 做鬼臉 (guard) · 跳來跳去 (all 0.9) | 120/23/6/12 | 24/12/鳳梨酥 30% |
| 16 | `pangolin` | 穿山甲 | zoo, maokong | Polite, rolls into a ball when startled. | A Formosan pangolin with bronze scales like pinecone plates and a small nose; rolled half-up. | 滾成球 (guard) · 滾滾衝撞 (one 1.6) · 鱗片甩甩 (all 0.8) | 145/22/10/4 | 26/13/— |
| 17 | `mountainMist` | 山嵐 | maokong | Dreamy, forgetful mist with a tea scent. | A wisp of pale-green fog with a sleepy face and a tea leaf for a cowlick. | 霧茫茫 (all 1.0) · 涼涼吹 (one 1.2) | 110/24/5/10 | 25/13/豆花 30% |
| 18 | `sulfurPuff` | 硫磺煙 | beitou | Smelly and apologetic about it. | A yellow-white steam puff with a little egg-shaped face and wavy smell lines. | 蛋蛋臭氣 (all 1.0) · 熱氣噴噴 (one 1.3) | 140/26/6/9 | 28/14/黑糖珍奶 10% |
| 19 | `geta` | 啪噠木屐 | beitou | A pair of wooden clogs that march everywhere, out of step. | Two Japanese-era wooden geta with red straps, hopping; their faces are on the toes. | 啪噠啪噠 (one 1.2) · 啪噠啪噠 (one 1.2) · 左右開弓 (all 0.9) | 150/27/8/8 | 29/15/— |
| 20 | `ironEgg` | 鐵蛋 | tamsui | Extremely tough, extremely chewy, proud of both. | A small dark-brown, glossy shrunken egg with a stern face and a tiny headband. | 硬梆梆 (guard) · 頭槌 (one 1.6) · 滾滾滷汁 (all 0.9) | 190/28/12/5 | 32/16/鐵路便當 15% |
| 21 | `fiddlerCrab` | 招潮蟹小兵 | tamsui | Soldier crab, salutes with its big claw. | A small blue-and-orange crab with one oversized claw held up and a paper helmet. | 大螯敬禮 (one 1.4) · 橫著衝 (all 0.9) | 160/30/9/9 | 31/16/— |
| 22 | `flippedUmbrella` | 翻花雨傘 | tower, summit | Sulky after being blown inside-out. | A cheap transparent umbrella flipped inside-out (the classic Taiwan typhoon image), with pouty eyes on the canopy. | 傘骨戳戳 (one 1.3) · 甩雨水 (all 1.0) · 收起來 (guard) | 200/32/9/10 | 36/18/紅龜粿 15% |
| 23 | `pricyCabbage` | 天價高麗菜 | tower | Smug about its post-typhoon price. Grandparents' favorite joke. | A plump green cabbage with a price tag reading **$150** and a little crown of outer leaves. | 漲價了 (all 1.0) · 菜葉拍 (one 1.4) · 捲起菜葉 (guard) | 230/31/11/6 | 38/25/芒果冰 15% |
| 24 | `windKid` | 旋風小子 | tower, summit | 咻咻's gusts; giggly, just want to play tag. | A small white whirlwind with a cartoon face, a candy wrapper caught in it, and speed lines. | 咻咻咻 (one 1.2) · 小旋風 (all 1.1) | 180/34/7/14 | 37/18/— |
| 25 | `runwayLight` | 跑道燈精 | airport, brown car | Earnest and blinky; wants to guide everyone in to land. | A small runway edge light, a blue glass dome on a metal stub, with a round face in the glass and little light rays. | 一閃一閃 (all 0.9) · 請降落 (one 1.3) · 熄燈 (guard) | 115/22/7/9 | 23/12/豆花 25% |
| 26 | `luggageTrain` | 行李拖車 | airport | Fussy and honking; lost all its luggage to the wind. | A tiny baggage tractor pulling two empty carts, with headlight eyes and a honking horn. | 叭叭！ (all 0.8) · 拖車撞 (one 1.4) · 煞車 (guard) | 135/23/8/6 | 24/13/鐵路便當 15% |
| 27 | `strayCard` | 迷路的交通卡 | ride cars (optional fights) | A lost transit card looking for its owner; beeps when nervous. Generic card, no real design. | A flat plastic card with a cute face and a moon sticker, floating, with "嗶" sound marks. | 嗶！ (one 1.1) · 餘額不足 (guard) · 嗶嗶嗶 (all 0.9) | 90/20/5/12 | 15/20/— |

### 5.2 Bosses (10 chapter bosses + mini-boss + final in two phases)

| id | Name | Where (Ch) | Personality | Visual | Taunt | Moves (looping) | HP / ATK / DEF / SPD | XP / 銅板 | Holds |
|---|---|---|---|---|---|---|---|---|---|
| `squirrelKing` | 松鼠大王 | 大安森林公園 (1) | Hoarder; thinks everything long is a nut. | A red-bellied squirrel (赤腹松鼠), chubby, with a bottle-cap crown, a fluffy tail bigger than himself, and the scallion held like a scepter. | 這根綠綠長長的堅果是我的！ | 松果丟丟 (one 1.0) · 尾巴掃 (all 0.7) · 藏起來 (guard) · 大王撲 (one 1.7) | 240/14/5/7 | 40/30 | 蔥 |
| `gooseBully` | 鵝霸 | 台大 醉月湖 (2) | Fake intellectual; honks insults; rival to 阿藍. | A big white goose with an orange beak, a tiny graduation cap, and the book held upside down under one wing. | 鵝鵝鵝！這本書我正在研究！ | 鵝鵝叫 (all 0.8) · 長脖子啄 (one 1.2) · 張開翅膀 (guard) · 曲項向天歌 (one 1.8) | 400/18/6/8 | 60/45 | 書 |
| `gateGolem` | 閘門巨人「嗶嗶」 | 台北車站 (3) | A rule-follower stuck in an error loop. | Three MRT turnstiles fused into a robot body, with flap-gate arms, a card-reader face with a red X for eyes (it turns green when calmed), and a tiny LED display mouth. | 嗶——！餘額不足！ | 閘門夾 (one 1.2) · 請重新感應 (guard) · 退票光線 (all 0.9) · 嗶嗶嗶嗶 (one 1.8) | 560/22/8/5 | 85/60 | 印章 |
| `karaokeKing` | 卡拉OK大王 | 西門町 紅樓 (4) | Lovable show-off uncle. Sings 台語老歌, always off-key; desperate for applause. | An old-school karaoke cabinet with speaker cheeks, a disco-ball head, a red bow tie, and a lyrics screen that scrolls 「愛拚才會贏」-style lines (use original lyrics). He holds the gold mic. | 來喔！點歌點歌！下一首，〈我的麥克風〉！ | 走音高八度 (all 0.9) · 迴音 (one 1.2) · 插播廣告 (guard) · 安可！安可！ (all 1.2) | 700/25/8/7 | 110/75 | 麥克風 |
| `clothDragon` | 舞布龍 | 大稻埕碼頭 (5) | Festival dragon, joyful and chaotic; the abacus beads click like teeth. | A long dragon made of different 花布 bolts (peony red, indigo, gingham), with a lion-dance-style head, pom-pom whiskers, and the abacus in its jaws. | 劈哩啪啦！算一算，你們打不贏！ | 布條纏繞 (one 1.2) · 花布大旋風 (all 1.0) · 捲起來 (guard) · 龍擺尾 (one 1.9) | 860/28/9/8 | 135/90 | 算盤 |
| `megaCutlet` | 超級大雞排 | 士林夜市 (6) | Insecure giant; tired of being called "too big". | A golden fried chicken cutlet bigger than a door, with a paper bag as a cape, a pepper-shaker on its head, and the drumstick held like a sword. | 我比你的臉還大！ | 灑胡椒 (all 1.0) · 酥脆重擊 (one 1.3) · 回鍋再炸 (guard) · 要切嗎？要辣嗎？ (one 2.0) | 1000/31/9/6 | 160/110 | 雞腿 |
| `windsock` | 風向袋小姐 | 松山機場 runway end (7) | Her whole job is knowing where the wind goes; spun dizzy, she has no idea. Apologetic and earnest. | An orange-and-white striped windsock on a tall pole, spinning like a top, with a sweet face at the mouth of the sock, a red string wound around her, and dizzy swirl eyes. | 轉轉轉！風往哪裡吹？我不知道啦！ | 轉圈圈 (all 0.9) · 甩尾巴 (one 1.3) · 洩氣 (guard) · 側風警報 (all 1.4) | 1150/33/9/9 | 180/120 | 紅繩 |
| `teapotElder` | 茶壺爺 | 貓空 茶館 (7) | Crotchety tea master; his tea now tastes of celery. | A huge 鐵觀音 clay teapot with a lid like a scholar's hat, a steam beard and eyebrows, little tea-cup "hands", and celery poking out of the spout. | 呸呸呸！誰把芹菜丟進我的茶！ | 熱茶潑 (one 1.2) · 茶香迷霧 (all 1.0) · 蓋上蓋子 (guard) · 滾燙沖泡 (all 1.4) | 1300/34/10/6 | 200/130 | 芹菜 |
| `onsenEgg` | 溫泉蛋爺爺 | 北投 地熱谷 (8) | Hypochondriac; "been cooking for a hundred years". | A giant cracked hot-spring egg with crack "wrinkles", a folded towel on his head, a bushy white mustache, and the stethoscope around his neck. | 咳咳！老夫正在看病，別吵！ | 蛋殼碎片 (all 1.0) · 硫磺噴氣 (one 1.3) · 縮回蛋殼 (guard) · 溏心爆發 (all 1.5) | 1550/37/11/5 | 240/150 | 聽診器 |
| `crabGeneral` | 招潮蟹將軍 | 淡水 情人橋 (9) | Pompous "artist"; insists 5 a.m. is sunset. | A large fiddler crab with one huge orange claw holding the paintbrush, a beret, a paint-splattered cape, and an easel strapped to its back. | 本將軍在畫夕陽！你們擋到光了！ | 大螯一夾 (one 1.3) · 亂畫一通 (all 1.1) · 舉螯 (guard) · 夕陽大剪 (one 2.1) | 1800/40/12/8 | 280/170 | 畫筆 |
| `damperBall` | 定心球「阿穩」 | 101 89F (10, mini) | Normally wise and calm; now seasick. | A giant golden sphere with a gentle face, rocking, with swirl-eyes when dizzy. Steel cables hold it from above. | 晃……晃……我停不下來…… | 左晃 (one 1.3) · 右晃 (one 1.3) · 大搖擺 (all 1.2) · 穩住 (guard) | 2000/42/13/4 | 320/200 | — |
| `shushuStorm` | 暴風咻咻 | 101 91F (10, final 1) | A frightened toddler-storm throwing a tantrum. | 咻咻 at full size, filling the sky behind the railing: dark grey-blue spiral, glaring watery eyes, the gold lock glinting in its eye, and lightning sparkles (cute zigzags). | 不要過來！這是咻咻的生日！ | 狂風咻咻 (all 1.1) · 颱風眼 (guard) · 豪大雨特報 (all 1.0) · 雷公生氣 (one 2.0) | 2200/44/12/9 | 0 (combined below) | 金鎖片 |
| `shushuCry` | 哭哭咻咻 | 101 91F (10, final 2) | The tantrum gives way to crying. | Smaller, lighter blue, raining from its eyes, with a little rainbow fragment flickering. | 嗚哇——大家都叫咻咻快走——！ | 淚汪汪大雨 (all 1.1) · 吸鼻子 (guard) · 放颱風假！ (all 1.4) · 打雷雷 (one 1.8) | 1800/46/12/9 | 600/300 | 金鎖片 |
| `shushuBonus` | 生日加碼・咻咻 | 象山 (post-game) | Playful, wants a rematch "for fun". | White, fluffy, wearing a party hat made from a 雞排 bag. | 再玩一次！這次咻咻不會哭！ | 生日旋風 (all 1.3) · 彩帶雨 (all 1.1) · 抱抱咻 (guard) · 蛋糕砸 (one 2.4) | 3200/52/14/12 | 400/500 | 土地公 drops nothing; first win gives 黑糖珍奶 ×3 |

**Fixed fights (non-boss gates):** home 灰塵球×2 · ximen 霓虹招牌精×3 · dadaocheng 布匹蛇×2 · shilin 大腸包小腸×2 · airport 行李拖車×2 · beitou 硫磺煙×3 · tamsui 招潮蟹小兵×3.

**Random-encounter groups per map (suggested):**
- daan: [leafSprite], [leafSprite, leafSprite], [nightHeron], [leafSprite, nightHeron]
- ntu: [crazyBike], [azaleaSprite, azaleaSprite], [nightHeron, azaleaSprite], [crazyBike, nightHeron]
- station: [signImp], [suitcase], [signImp, signImp], [suitcase, signImp]
- ximen: [neonSign], [clawGrabber, signImp], [neonSign, clawGrabber], [signImp, signImp, neonSign]
- dadaocheng: [herbDrawer], [clothSnake, clothSnake], [herbDrawer, clothSnake]
- shilin: [boba, boba, boba], [stinkyTofu], [sausagePair], [boba, stinkyTofu]
- airport: [runwayLight], [luggageTrain], [runwayLight, runwayLight], [suitcase, luggageTrain]
- zoo: [macaque], [pangolin], [macaque, macaque]
- maokong: [mountainMist], [mountainMist, pangolin], [macaque, mountainMist]
- beitou: [sulfurPuff, sulfurPuff], [geta], [geta, sulfurPuff]
- tamsui: [ironEgg], [fiddlerCrab, fiddlerCrab], [ironEgg, fiddlerCrab]
- ride cars: none random; optional once-only fights: blue [signImp ×2], orange [strayCard], red [strayCard ×2], brown [runwayLight, strayCard]
- tower: [flippedUmbrella, windKid], [pricyCabbage], [windKid, windKid], [pricyCabbage, flippedUmbrella]

---

## 6. Items

Prices in **銅板**. HP = 體力, MP = 元氣. Strengths follow the current engine's scale.

### 6.1 Consumables (10)

| id | Name | Effect (engine kind) | Price | Where | Blurb |
|---|---|---|---|---|---|
| `teaEgg` | 茶葉蛋 | hp 30 | 8 | 便利商店 (all), daan chest | 便利商店的電鍋裡，永遠有一顆在等你。 |
| `pineappleCake` | 鳳梨酥 | hp 70 | 20 | 便利商店, chests | 外皮酥酥、內餡酸甜。體力恢復 70。 |
| `chickenCutlet` | 雞排 | hp 160 | 45 | 雞排阿姨 (shilin+), 便利商店 from Ch6 | 比臉還大。體力恢復 160。 |
| `douhua` | 豆花 | mp 20 | 15 | 便利商店, 麵線阿姨, 南北貨 | 滑滑嫩嫩，元氣恢復 20。 |
| `bubbleTea` | 珍珠奶茶 | mp 45 | 35 | 便利商店 from Ch3, 雞排阿姨 | 台灣之光。元氣恢復 45。 |
| `brownSugarMilk` | 黑糖珍奶 | mp 999 (full MP, one) | 80 | 茶館, 溫泉阿嬤, 101 shops | 黑糖最喜歡的。元氣全滿。 |
| `braisedRice` | 滷肉飯 | hpAll 50 | 40 | 雞排阿姨, 便利商店 from Ch6 | 一人一碗，全隊體力恢復 50。 |
| `mangoIce` | 芒果冰 | hpAll 130 | 90 | 阿給阿婆, 101 shops, chests | 夏天的味道。全隊體力恢復 130。 |
| `railBento` | 鐵路便當 | full (one hero HP+MP) | 60 | 便當阿姨 (station), 貓頭鷹奶奶 (red ride car) | 排骨、滷蛋、醃黃瓜。一個人體力和元氣全滿。 |
| `redTurtleCake` | 紅龜粿 | revive 50% | 40 | 中藥行/南北貨 (Ch5+), chests | 生日要吃紅龜粿，呷百二。倒下的人醒過來。 |

### 6.2 Equipment (one slot per hero) (10)

| id | Name | Bonus | Price | Where |
|---|---|---|---|---|
| `bib` | 口水巾 | def +3 | 25 | home (crib chest) |
| `flipFlops` | 藍白拖 | atk +5 | 40 | home (shoe rack chest), 便利商店 (Ch1–3) |
| `gradCap` | 學士帽 | mp +15 | 60 | ntu chest |
| `helmet` | 安全帽 | def +8 | 80 | ximen chest, 便利商店 (Ch4+) |
| `tigerShoes` | 虎頭鞋 | spd +6 | 90 | dadaocheng chest |
| `flowerVest` | 花布背心 | hp +45 | 100 | dadaocheng (布行阿姨 gift), 南北貨 shop |
| `amulet` | 平安符 | luck +10 | — | dadaocheng (廟口阿姨 gift) |
| `neckPillow` | 旅行頸枕 | hp +30, def +5 | 85 | airport (推車阿伯 gift) |
| `raincoat` | 機車雨衣 | def +12, hp +25 | 180 | tamsui chest, 阿給阿婆 & 101 shops |
| `earthCane` | 土地公的拐杖 | atk +8, def +8, spd +5, luck +10 | — | Post-game (象山) with 11/11 stamps (土地公) |

Blurbs are in `script.md` § Items.

### 6.3 Key items (flags, shown on the 抓周盤 screen)

| flag | Item | From | Shown as |
|---|---|---|---|
| `got_scallion` | 蔥 | 松鼠大王 | 聰明 |
| `got_book` | 書 | 鵝霸 | 會讀冊 |
| `got_seal` | 印章 | 嗶嗶 | 做頭家 |
| `got_mic` | 麥克風 | 卡拉OK大王 | 會表演 |
| `got_abacus` | 算盤 | 舞布龍 | 會算 |
| `got_drumstick` | 雞腿 | 超級大雞排 | 有口福 |
| `got_celery` | 芹菜 | 茶壺爺 | 勤勞 |
| `got_stethoscope` | 聽診器 | 溫泉蛋爺爺 | 照顧人 |
| `got_brush` | 畫筆 | 招潮蟹將軍 | 會畫圖 |
| `got_redString` | 紅繩 (center slot, under the lock) | 風向袋小姐 | 金鎖片的繩子 |
| `got_lock` | 金鎖片 (center slot) | 咻咻 | 阿嬤的祝福 |
| `stampBook` | 集章本 | 掃地阿伯 (Ch1) | menu tab |
| `moonTicket` / `moonPass` | 月亮票 (unstamped / stamped) | 廣播姊姊 (Ch3) | menu |

---

## 7. Progression & difficulty

### Level curve (cap 15)

Proposed `XP_TABLE` (cumulative, extending the current one; tune with sim):
`[0, 22, 58, 108, 175, 265, 380, 520, 690, 900, 1150, 1450, 1800, 2200, 2700]`

| Ch | Location | Arrive Lv | Boss at Lv | Party |
|---|---|---|---|---|
| 1 | 家 / 大安森林公園 | 1 | 3 | 寶咖咖, 摩卡 |
| 2 | 台大 | 3 | 4 | + 阿藍 (at the boss) |
| 3 | 台北車站 | 4 | 5 | 3 |
| 4 | 西門町 | 5 | 6 | 3 |
| 5 | 大稻埕 | 6 | 7 | 3 |
| 6 | 士林夜市 | 7 | 8 | 3 |
| 7 | 松山機場 | 8 | 9 | 3 |
| 8 | 動物園 / 貓空 | 9 | 10 | + 黑糖 (~Lv9) |
| 9 | 北投 | 10 | 11 | 4 |
| 10 | 淡水 | 11 | 12 | 4 |
| 11 | 101 | 12 | 14–15 | 4 |
| post | 象山 | 15 | 15 | 4 |

### Notes for the sim

- **Ch2 boss is fought immediately after 阿藍 joins.** Keep 鵝霸 beatable by two heroes, too (in case the player levels oddly). 阿藍's 羽毛雨 should feel like a power spike.
- **The Ch3 Moon Line unlock** lets players grind and shop in earlier maps. Keep early-map XP low so backtracking doesn't trivialize the game.
- **Ch8's 黑糖** is the late-game spike; 茶壺爺 is tuned for 4 heroes. The 貓空 view cutscene comes *before* the boss, so players see the stakes.
- **Ch11 is a gauntlet**: 89F mini-boss → the stairs (a free heal at the summit intro) → two-phase final. The 50% heal between phases keeps casual players alive. Phase 2's 「放颱風假！」 is the scariest move. Its telegraph (the engine shows the next move) gives players a turn to cast 鵲橋護盾.
- **Free rests** (price 0) exist in Ch1, 3, 10, and 11. Paid rests elsewhere keep coins meaningful.
- **Defeat:** unchanged (respawn at map entry at 40% HP, keep everything). In tone: 「大家累倒了……在入口醒來。」

### Rough coin economy

Bosses give 30 → 300; regulars give 3 → 25. A full run with light grinding should afford one equipment purchase per chapter plus consumables. The 機車雨衣 (180) is the late splurge.

---

## 8. Running jokes & callbacks (checklist for writers and QA)

| Joke | Setup | Beats | Payoff |
|---|---|---|---|
| **Mocha "translates"** | Ch1: Baokaka says 「要！」; Mocha: 「他說：『我要跟。』」 | Each chapter: a one-syllable baby word becomes a long speech. Others: 「……他只說了一個字。」 Mocha: 「我很懂他。」 | Ch11: Baokaka says 「一起。」 and Mocha translates it simply and exactly: 「他說：『一起過生日。』」 |
| **The rumor grows** | Ch1 runner: 機車 | 公車 → 火車 → 一整條街 → 比颱風還大的颱風 → 101 | Ch9: 「其實只有枕頭那麼大」; Ch10: true. |
| **店員小哥 everywhere** | Ch1 「叮咚～歡迎光臨！」 | 「又是你們？」「我們是連鎖的。」 → 行動分店 (貓空) → 101分店 | Ending: 「叮咚～外送！」 delivers the cake. Post-game: 「我們在山上也有分店。」 |
| **阿伯 is always there** | Ch1 sweeper | Mocha squints in Ch4, 8, 11: 「我是不是看過你？」 | Post-credits: 土地公. |
| **阿藍's 成語** | Ch2 「我學富五車……腳踏車。」 | Wrong idioms every chapter (list in script). | Ch10: she uses one *correctly* (既往不咎) and is shocked. Ch11: 「我不知道。」 Ending: she invents a new one, 「抱抱解千愁」. |
| **Dad's first word** | Ch1 sleep-talk: 「叫……爸爸……」 | — | Ending: 摩卡, then 咻咻. 「第三個字一定是爸爸！」 |
| **Mocha hates water** | Ch2 lake: 「離水遠一點。」 | Ch5 river, Ch9 hot spring | Ch9: he dips his paws for Baokaka. |
| **黑糖 apologizes to everything** | Ch8: 「歹、歹勢」 to a door | Before every big hit | Ch11: he doesn't apologize, he just climbs. |
| **博愛座** | Ch3 廣播: 「請讓座給需要的人」 | 黑糖: 「我是保育類，可以坐嗎？」 (Ch8+, any ride car) | 廣播姊姊: 「保育類動物，可以。」 |
| **背包客** | Ch3: Where is 101? | Ch4, 6, 10 | Ch11 roof: 「I found it!」 |
| **Baokaka can't walk** | Ch1 Mocha: 「你連走路都不會。」 | Narration always says 爬爬爬 | Ch11: the first steps. The Lv12 skill 勇敢的第一步. |
| **飛機！** | Ch7 brown-line front window: his new word | Ch7 airport: everyone shushes him (「在睡覺」); the plane-watching promise | Ch11 sunrise: the 小白機 waggles its wings, 「飛機！」 Mocha: 「不會說爸爸，先會說飛機。」 |
| **塔台 Over** | Ch7: every line ends 「Over。」 | — | Ch11 sunrise radio call. |
| **The almost-word** | Ch9 footbath: 「摩……」「……ㄋㄟㄋㄟ。」 | — | Ending: 「摩卡。」 |

---

## 9. Topical jokes (時事梗) registry

**Rules, as decided by the director:**
- Mostly evergreen Taiwanese life memes.
- Recent (2025–2026) memes only if verified by web search and light-hearted.
- No politics, no politicians, no real celebrities or brands, nothing mean or scary.
- Every joke must be understandable by a grandparent and harmless to a 6-year-old.

All jokes sit on optional NPCs or flavor variants. None of them gates progress. Lines live in `script.md` § 時事梗, one event per key. To pull a joke, delete its NPC or talk rule; the original event it replaced stays in the script as the fallback.

**Recent (2025–2026):** one, verified by web search on 2026-10-18. `gag.ch10.newBridge` covers the **淡江大橋**, which opened to traffic on 2026-05-12, linking 淡水 and 八里 and shortening the trip. It's neutral civic news, with no politicians named. Other recent pop-culture memes were not added because none were verified. Any future `recent` entry gets a 12-month review date.

Sources used for verification: [twreporter: 淡江大橋通車](https://www.twreporter.org/a/photo-danjiang-bridge-opening), [NOWnews](https://www.nownews.com/news/6758564), [PTS](https://news.pts.org.tw/article/770705), [CTEE](https://www.ctee.com.tw/news/20260116700343-430104), [NOWnews: 主塔/合龍](https://www.nownews.com/news/6731434), [新北市工務局 0916 新聞稿](https://www.contcg.ntpc.gov.tw/upload/news/0916%E6%96%B0%E8%81%9E%E7%A8%BF.pdf), [TVBS](https://news.tvbs.com.tw/life/2989728). For the airport's 05:00–23:00 hours and the 飛機巷/observation-deck context: [uptogo](https://uptogo.com.tw/旅遊/松山機場是24小時的嗎？/), [LTN](https://news.ltn.com.tw/amp/news/life/breakingnews/5155096), [Business Today](https://www.businesstoday.com.tw/article/category/183030/post/202510020032/).

| Key | Ch | Where it appears | The joke | Type | Review / expiry |
|---|---|---|---|---|---|
| `gag.ch1.elderImage` | 1 | home: 阿嬤's phone on the nightstand (new NPC) | 阿嬤's 長輩圖 「早安！平安喜樂！」 is scheduled for 5 a.m., so it's "good morning" before sunrise. | evergreen | Stable. The paired callback is `gag.ending.elderImage`. |
| `gag.ch1.garbageTruck` | 1 | daan: 追垃圾車的阿姨 (new NPC) | She hears 〈給愛麗絲〉 and has chased the garbage truck for three streets; at midnight it's asleep too. | evergreen | Stable while trucks play music. |
| `gag.ch1.publicBike` | 1 | daan: public bike dock (new NPC) | Baokaka tries to 「嗶」 a rental bike; no card, and his feet can't reach. | evergreen | Keep unbranded ("公共腳踏車"). |
| `gag.ch2.drinkOrder` | 2 | ntu: 爆肝大學生 variant | 半糖少冰 normally, 全糖 the night before exams; 阿藍 calls 半糖 the Taiwanese middle way. | evergreen | Stable. |
| `gag.ch2.makeupDay` | 2 | ntu: 睡著的助教 (new NPC) | 補班日: "one day off means paying back one day"; 阿藍's 成語 有借有還. | evergreen | Review if the 補班 policy is ever abolished. |
| `gag.ch3.beep` | 3 | station: 趕車的上班族 (new NPC) | Taipei life is "嗶 in, 嗶 out, 嗶 for breakfast"; Baokaka learns 嗶. | evergreen | Stable. Adds 嗶 to Baokaka's vocabulary (already used in `gag.ch1.publicBike`). |
| `gag.ch3.exitMaze` | 3 | station: 站務阿伯 variant | The exits are lettered M, K, Y, Z…; even the 阿伯 picks one by mood. | evergreen | Check that the letters still match the station's signage. |
| `gag.moonline.noEating` (+`.early`) | MRT | orange ride car: 禁止飲食 sign (new NPC) | MRT no-eating rule: a pacifier "doesn't count"; 黑糖 is "only holding" his bubble tea, and 「抱著，可以。」 | evergreen | Stable. |
| `gag.ch4.scooterTurn` | 4 | ximen: 機車阿伯 (new NPC) | 兩段式左轉: even crawling babies must use the 待轉格; Baokaka sits in it and "will pass the license test". | evergreen | Stable. |
| `gag.ch4.basinHeat` | 4 | ximen: 街舞少年 variant | Still 30°C at 2 a.m.; "台北是一個大電鍋". It ties into the basin plot point. | evergreen | Stable. |
| `gag.ch5.invoice` | 5 | dadaocheng: 南北貨老闆娘 variant (with shop) | 統一發票: draw on the 25th of odd months; she won NT$200 and was happy for a month. | evergreen | Re-check the draw-date wording if the schedule changes. |
| `gag.ch5.typhoonNews` | 5 | dadaocheng: 茶行阿伯 variant | Everyone waits for the 10 p.m. news about 颱風假; the city cheers. "喜歡放假，不是喜歡颱風." It sets up 咻咻's feelings. | evergreen | Stable. Thematic, so keep it if possible. |
| `gag.ch6.queue` | 6 | shilin: 排隊的食物們 (new NPC) | 排隊美食: queuing two hours at a closed stall, "because someone else is queuing"; Baokaka joins the line. | evergreen | Stable. |
| `gag.ch6.clerkPoints` | 6 | shilin: replaces 店員小哥 shop | 「有集點嗎？要不要現在開始集？集滿換杯子。」 | evergreen | Stable. Pays off in `gag.ch11.clerkPoints2`. |
| `gag.ch8.earthquake` | 8 | maokong: 茶館老闆娘 variant (with inn) | A tiny tremor: 「又在搖。」 She keeps pouring tea, and 黑糖 panics. | evergreen | **Sensitivity:** pull it temporarily after any damaging quake. Deliberately no alert sound and no magnitude talk beyond 「小小的」. |
| `gag.ch8.zooCrowd` | 8 | zoo: 管理員阿伯 variant | Daytime zoo: "more people than animals; the animals are watching the people". | evergreen | Stable. Real animal names are avoided on purpose. |
| `gag.ch9.chiaPaBe` | 9 | beitou: 泡腳阿公 (new NPC) | He asks everyone 「呷飽未？」, including a puff of sulfur smoke. | evergreen | Stable. |
| `gag.ch9.clerkSecond` | 9 | beitou: replaces 店員小哥 shop | 「第二件六折」, repeated until Mocha gives in. | evergreen | Stable. |
| `gag.ch10.delivery` | 10 | tamsui: 外送小哥 (new NPC) | A 5 a.m. delivery of 鐵蛋 to the riverbank: "no place in Taipei I can't deliver to"; Mocha suspects he's in league with the clerk. | evergreen | Keep unbranded (no app names or colors that match a real platform). |
| `gag.ch10.backpackerTea` | 10 | tamsui: replaces 背包客 talk | The backpacker's first Chinese phrase is 「半糖、少冰」. | evergreen | Stable. A callback to `gag.ch2.drinkOrder`. |
| `gag.ch11.fireworks` | 11 | tower: 清潔阿伯 variant | 101 跨年煙火: the whole country counts down, it's over in a flash, and the 阿伯 sweeps till dawn. | evergreen | Stable. Avoid stating a duration in seconds. |
| `gag.ch11.clerkPoints2` | 11 | tower: replaces 店員小哥 shop (once, `clerkCup`) | "Your points are full", collected across every branch; the prize cup holds a 黑糖珍奶. | evergreen | Stable. |
| `gag.post.typhoonDay` | post | xiangshan: 咻咻 variant | 咻咻 learns people cheer for 颱風假, then wonders if it should only come on holidays (「假日來，就不會放假了。」). | evergreen | Stable. |
| `gag.ch10.newBridge` | 10 | tamsui: 渡輪阿伯 variant | The new 淡江大橋 means fewer ferry riders for the 阿伯: 「坐在船上看新橋，也很好看。」 | **recent (verified)** | Review 2027-10. Once the bridge is simply "the bridge", reword the line from 「新的大橋」 to 「大橋」. |
| `ride.orange.first` | MRT | orange ride car, first ride | The orange line is famously packed, and 「貓是液體」: Mocha squeezes under a seat. | evergreen | Stable. A line-crowding joke, not a complaint about the operator. |
| `ride.brown.first` | MRT | brown ride car, first ride | The driverless line: 「那，是誰在開？」「是我。」 (廣播姊姊). | evergreen | Stable. |
| `ch7.airport.ctrlTower` | 7 | airport: the tower | Radio-speak, every line ending in 「Over。」 | evergreen | Stable. |
| `ch7.airport.chairs` | 7 | airport inn | Sleeping across three linked waiting-room chairs: 「躺三格，剛剛好。」 | evergreen | Stable. |
| `gag.ending.elderImage` | end | ending.party: optional insert | 阿嬤 makes a 長輩圖 of the birthday: 「度晬快樂！平安喜樂！」 with a cat hugging a baby. | evergreen | Optional; safe to drop. |

**Already-topical content in the main roster (tagged for review, not new):** 天價高麗菜 (post-typhoon cabbage prices), 翻花雨傘 (inside-out umbrellas), 哭哭咻咻's 「放颱風假！」 move, 按摩椅 「投十塊，按好按滿」, the 背包客 "where is 101" gag, and 大廳地板 sitting at the Main Station. All are evergreen.

**Proposals for the roster.** These are suggestions only; the roster is unchanged.

| Target | Proposal | Why |
|---|---|---|
| `boba` 珍珠粉圓 | Rename its guard move to 「半糖少冰」 (it "goes light" and hardens). | Echoes `gag.ch2.drinkOrder`, at no cost. |
| `signImp` 指標小鬼 | Move names 「往M8出口」／「往Z10出口」／「轉圈圈」. | Echoes `gag.ch3.exitMaze`; every Taipei commuter has been lost this way. |
| `crazyBike` 暴衝腳踏車 | Add a guard move 「還車失敗」 (it can't dock and just spins). | Evergreen bike-share frustration, unbranded. |
| `clawGrabber` 夾娃娃爪 | Add the line 「保夾！保夾！」 as the name of its big hit (保夾 = the guaranteed grab). | Universally understood claw-machine slang. |
| `pricyCabbage` 天價高麗菜 | Its drop could be 「颱風泡麵」 (a new consumable, 泡麵, hp 40), a typhoon stock-up joke. | Requires one new item; optional. |
| New item: `invoice` 統一發票 | A consumable that, when used outside battle, gives a random 0 / 10 / 200 銅板 ("對獎"). | Needs a small `random coins` ItemUse; pairs with `gag.ch5.invoice`. Optional. |
| Speaker note | 嗶！ is now formally in Baokaka's vocabulary. | Used by `gag.ch1.publicBike` and `gag.ch3.beep`. |
