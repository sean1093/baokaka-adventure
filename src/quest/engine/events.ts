import type { Backlight } from '../../art/palette';
import type { SpriteName } from '../../art/types';
import type { HeroId, Step } from './types';

/** Who a speaker is, for the default dialogue backlight (art direction § 7.5). */
export type SpeakerRole = 'family' | 'folk' | 'foe' | 'friend';

/** The backlight colour for each role, used when a speaker doesn't name its own. */
export const ROLE_BACKLIGHT: Readonly<Record<SpeakerRole, Backlight>> = { family: 'warm', folk: 'warm', foe: 'violet', friend: 'moon' };

/** Each hero's backlight: 寶咖咖's butter pajamas, 摩卡's tabby orange, 阿藍's sky, 黑糖's amber. */
export const HERO_BACKLIGHT: Readonly<Record<HeroId, Backlight>> = { baokaka: 'butter', mocha: 'tabby', magpie: 'sky', bear: 'amber' };

export type SpeakerEntry = { name: string; sprite: SpriteName; role: SpeakerRole; /** Overrides the role's backlight */ color?: Backlight };

/**
 * Every line of the story. Keys are referenced from maps.ts (NPC talk rules, triggers and
 * blocked exits); validate.ts fails the build when a key is missing.
 *
 * Speaker keys are hero ids, the ids below, or null for narration.
 */
export const SPEAKERS: Record<string, SpeakerEntry> = {
  mom: { name: '媽媽', sprite: 'mom', role: 'family' },
  dad: { name: '爸爸', sprite: 'dad', role: 'family' },
  grandma: { name: '阿嬤', sprite: 'grandma', role: 'family', color: 'gold' },
  kid: { name: '小花', sprite: 'kid', role: 'folk', color: 'rose' },
  dog: { name: '小狗', sprite: 'dog', role: 'friend', color: 'warm' },
  vendor: { name: '老闆娘', sprite: 'vendor', role: 'folk' },
  uncle: { name: '阿伯', sprite: 'uncle', role: 'folk' },
  dust: { name: '灰塵球', sprite: 'dustBunny', role: 'foe' },
  golem: { name: '積木巨人', sprite: 'blockGolem', role: 'foe' },
  crow: { name: '烏鴉老大', sprite: 'crowBoss', role: 'foe' },
  fish: { name: '大魚', sprite: 'bigFish', role: 'foe', color: 'sky' },
  magpieNpc: { name: '阿藍', sprite: 'pigeon', role: 'friend', color: 'sky' },
  octo: { name: '大章魚', sprite: 'octopus', role: 'foe' },
  snore: { name: '打呼嚕大王', sprite: 'snoreKing', role: 'foe' },
  mochaNpc: { name: '摩卡貓', sprite: 'mochaCat', role: 'friend', color: 'tabby' },
};

/** A speaker's backlight: its own colour, else its role's. */
export const speakerBacklight = (entry: SpeakerEntry): Backlight => entry.color ?? ROLE_BACKLIGHT[entry.role];

export const EVENTS: Record<string, Step[]> = {
  // ---------------------------------------------------------------- 第一章 客廳
  'home.intro': [
    { do: 'chapter', n: 1, title: '娃娃不見了' },
    { who: null, text: '天亮了。寶咖咖睜開眼睛，摸摸旁邊——' },
    { who: 'baokaka', text: '「……娃娃呢？」' },
    { who: null, text: '每天晚上抱著睡的安撫娃娃，不見了。' },
    { who: 'baokaka', text: '「要去找回來！」' },
    { who: null, text: '（點地板就會走過去。先去找摩卡貓問問看。）' },
  ],
  'home.mocha': [
    { who: 'mochaNpc', text: '「喵。你終於醒了。」' },
    { who: 'mochaNpc', text: '「半夜有東西打呼嚕，一路打到棉被山去了。娃娃就是那時候不見的。」' },
    { who: 'baokaka', text: '「一起去！」' },
    { who: 'mochaNpc', text: '「……好啦。我跟你去。」' },
    { do: 'join', hero: 'mocha' },
    { do: 'flag', flag: 'mochaJoined' },
    { who: null, text: '摩卡貓加入了隊伍！' },
    { who: 'mocha', text: '「戰鬥的時候點『才藝』，我會呼嚕嚕幫大家補血。」' },
  ],
  'home.mom.first': [
    { who: 'mom', text: '「早安。今天想吃什麼呀？」' },
    { who: 'mom', text: '「先去問問摩卡貓吧，牠整晚都醒著。」' },
  ],
  'home.mom.hug': [
    { who: 'mom', text: '「來，媽媽抱一下。」' },
    { do: 'heal' },
    { who: null, text: '被抱了一下，全隊體力和元氣都滿了。' },
    { who: 'mom', text: '「累了就回來抱抱，隨時都可以。」' },
  ],
  'home.mom.night': [
    { who: 'mom', text: '「棉被山那邊……媽媽也聽到打呼嚕的聲音了。」' },
    { do: 'heal' },
    { who: 'mom', text: '「來，抱一下再去。小心一點。」' },
  ],
  'home.dad': [
    { who: 'dad', text: '「呼……嗯？喔，早啊。」' },
    { who: 'dad', text: '「爸爸昨天太晚睡了。你們玩，我再瞇一下……」' },
  ],
  'home.grandma.first': [
    { who: 'grandma', text: '「阿嬤的乖孫，要出門喔？」' },
    { who: 'grandma', text: '「帶著這個，肚子餓就吃。」' },
    { do: 'give', item: 'teaEgg', count: 2 },
    { do: 'give', item: 'pineappleCake' },
    { do: 'coins', amount: 20 },
    { do: 'flag', flag: 'grandmaGave' },
    { who: null, text: '拿到 茶葉蛋 ×2、鳳梨酥 ×1，還有 20 個銅板。' },
    { who: 'grandma', text: '「銅板可以跟市場的老闆娘換東西。」' },
  ],
  'home.grandma.again': [
    { who: 'grandma', text: '「累了就回來，阿嬤在家。」' },
  ],
  'home.dust': [
    { who: null, text: '沙發底下滾出兩顆灰塵球，擋在門口。' },
    { who: 'mocha', text: '「哈啾！交給我。」' },
    { do: 'battle', foes: ['dustBunny', 'dustBunny'] },
    { do: 'flag', flag: 'dustDone' },
    { who: null, text: '灰塵球被打散了。通往院子的路開了。' },
    { who: 'mocha', text: '「往下面那扇門走，就是院子。」' },
  ],
  'home.bathDoor': [
    { who: null, text: '浴室的門把太高了，現在推不開。' },
  ],
  'home.bedDoor': [
    { who: null, text: '房間的門後面黑黑的，還不能進去。' },
    { who: 'mocha', text: '「先把外面的事情處理完吧。」' },
  ],

  // ---------------------------------------------------------------- 第二章 院子
  'yard.intro': [
    { do: 'chapter', n: 2, title: '院子大冒險' },
    { who: null, text: '院子裡的草長得比寶咖咖還高。' },
    { who: 'mocha', text: '「草叢裡有東西。走路的時候小心一點。」' },
    { who: null, text: '（草地上會遇到搗蛋鬼。打不過就選『逃跑』。）' },
  ],
  'yard.dog': [
    { who: 'dog', text: '「汪！」' },
    { who: 'mocha', text: '「牠說右下角那邊有個很大的傢伙，把出口堵住了。」' },
  ],
  'yard.dog.after': [
    { who: 'dog', text: '「汪汪！」' },
    { who: 'mocha', text: '「牠說你很勇敢。」' },
  ],
  'yard.golem': [
    { who: 'golem', text: '「誰敢亂動我的積木！」' },
    { who: 'baokaka', text: '「那是我的積木！」' },
    { who: 'mocha', text: '「牠會疊高高防禦，那回合打牠比較不痛。等牠疊完再全力打。」' },
    { do: 'battle', foes: ['blockGolem'], boss: true },
    { do: 'flag', flag: 'golemDone' },
    { who: 'golem', text: '「……積木、還你……」' },
    { who: null, text: '積木巨人散成一地積木，露出通往公園的小路。' },
    { do: 'give', item: 'bib' },
    { who: null, text: '積木堆裡撿到 口水巾（裝備：防禦 +3）。' },
    { who: 'mocha', text: '「打開選單就可以穿上。」' },
  ],

  // ---------------------------------------------------------------- 第三章 公園
  'park.intro': [
    { do: 'chapter', n: 3, title: '公園的午後' },
    { who: null, text: '公園好大，風把草吹得沙沙響。' },
    { who: 'mocha', text: '「右邊的樹林比較危險，但是也有寶箱。」' },
  ],
  'park.mom': [
    { who: 'mom', text: '「媽媽在這邊曬太陽，你們去玩。」' },
    { do: 'heal' },
    { who: null, text: '媽媽拍拍你們，體力和元氣都回來了。' },
  ],
  'park.uncle': [
    { who: 'uncle', text: '「冰的、涼的，要不要來一個？」' },
    { do: 'shop', stock: ['teaEgg', 'douhua', 'pineappleCake'] },
  ],
  'park.kid': [
    { who: 'kid', text: '「你有看到一隻很大的烏鴉嗎？」' },
    { who: 'kid', text: '「牠剛剛叼著一條紅紅的緞帶飛過去了，往右邊。」' },
    { who: 'baokaka', text: '「……那是娃娃的緞帶。」' },
  ],
  'park.kid.after': [
    { who: 'kid', text: '「哇，你把烏鴉老大打跑了！好厲害。」' },
    { who: 'kid', text: '「這個給你。」' },
    { do: 'give', item: 'braisedRice' },
    { who: null, text: '拿到 滷肉飯。' },
  ],
  'park.crow': [
    { who: 'crow', text: '「嘎！亮晶晶的東西都是我的！」' },
    { who: 'baokaka', text: '「緞帶還來！」' },
    { who: 'mocha', text: '「牠很快，先補血再打。」' },
    { do: 'battle', foes: ['crowBoss'], boss: true },
    { do: 'flag', flag: 'crowDone' },
    { who: 'crow', text: '「嘎……還你就是了……」' },
    { who: null, text: '烏鴉老大放下一條紅緞帶，飛走了。' },
    { do: 'give', item: 'amulet' },
    { do: 'coins', amount: 30 },
    { who: null, text: '撿到 平安符 和 30 個銅板。往右邊就是市場。' },
  ],

  // ---------------------------------------------------------------- 第四章 市場
  'market.intro': [
    { do: 'chapter', n: 4, title: '熱鬧的市場' },
    { who: null, text: '市場好吵，什麼味道都有。' },
    { who: 'mocha', text: '「魚攤那邊……有一股很大的魚味。」' },
  ],
  'market.vendor': [
    { who: 'vendor', text: '「來喔！用銅板換，什麼都有！」' },
    { do: 'shop', stock: ['teaEgg', 'pineappleCake', 'braisedRice', 'douhua', 'flowerVest', 'flipFlops'] },
  ],
  'market.uncle': [
    { who: 'uncle', text: '「豆花～吃一碗，睡一下，什麼都好了。」' },
    { do: 'inn', price: 10 },
  ],
  'market.kid': [
    { who: 'kid', text: '「魚攤上那條大魚，剛剛自己動了一下。」' },
    { who: 'kid', text: '「我沒有看錯喔，真的。」' },
  ],
  'market.fish': [
    { who: 'fish', text: '「噗嚕噗嚕，誰在偷看我的魚攤？」' },
    { who: 'mocha', text: '「牠會噴水打全隊，血少的人先補。」' },
    { do: 'battle', foes: ['bigFish'], boss: true },
    { do: 'flag', flag: 'fishDone' },
    { who: 'fish', text: '「噗嚕……我只是想回水裡……」' },
    { who: null, text: '大魚翻了個身，滑進水桶，不見了。' },
    { do: 'give', item: 'railBento' },
    { do: 'coins', amount: 40 },
    { who: 'mocha', text: '「牠說家裡的浴室通到水的世界。回家看看浴室吧。」' },
  ],

  // ---------------------------------------------------------------- 第五章 浴缸島
  'bath.intro': [
    { do: 'chapter', n: 5, title: '浴缸島' },
    { who: null, text: '浴室的地板亮亮的，浴缸大得像一座島。' },
  ],
  // Temporary (issue #5): 阿藍 stands in for the old third hero until this story is replaced (#21)
  'bath.magpie': [
    { who: 'magpieNpc', text: '「根據我的研究——你們需要一位教授。」' },
    { who: 'magpieNpc', text: '「我在浴缸邊觀察好久了。帶我一起走，我幫你們打壞人。」' },
    { do: 'join', hero: 'magpie' },
    { do: 'flag', flag: 'magpieJoined' },
    { who: null, text: '阿藍加入了隊伍！' },
    { who: 'magpie', text: '「我的元氣很多，羽毛雨可以打到全部的敵人。」' },
    { who: 'magpie', text: '「浴缸後面那條路，通到海邊。走吧！」' },
  ],
  'bath.notYet': [
    { who: null, text: '水太深了，一個人過不去。' },
  ],

  // ---------------------------------------------------------------- 第六章 海邊
  'beach.intro': [
    { do: 'chapter', n: 6, title: '海邊的大章魚' },
    { who: null, text: '風是鹹的，沙子燙燙的。' },
    { who: 'magpie', text: '「根據我的研究，海風對羽毛不太好。」' },
  ],
  'beach.vendor': [
    { who: 'vendor', text: '「海邊的貨比較好喔，貴一點點。」' },
    { do: 'shop', stock: ['pineappleCake', 'braisedRice', 'railBento', 'redTurtleCake', 'tigerShoes', 'helmet'] },
  ],
  'beach.octo': [
    { who: 'octo', text: '「八隻手一起來！」' },
    { who: 'magpie', text: '「牠很大隻！學會鵲橋護盾的話，先擋一下！」' },
    { do: 'battle', foes: ['octopus'], boss: true },
    { do: 'flag', flag: 'octopusDone' },
    { who: 'octo', text: '「……好吧，我認輸。」' },
    { who: 'octo', text: '「你們要找的東西，在棉被山的最上面。那個打呼嚕的傢伙抱著它睡。」' },
    { do: 'coins', amount: 60 },
    { who: 'mocha', text: '「回家吧。房間的門，應該可以開了。」' },
  ],

  // ---------------------------------------------------------------- 第七章 棉被山
  'night.intro': [
    { do: 'chapter', n: 7, title: '棉被山之巔' },
    { who: null, text: '房間裡黑黑的，棉被堆成一座山。山上傳來呼嚕聲。' },
    { who: 'magpie', text: '「好、好暗……」' },
    // Temporary (issue #5): 黑糖 joins here so the four-hero party can be played before #21
    { who: null, text: '棉被山腳下，有一團黑黑的東西在發抖。是一隻好大的黑熊。' },
    { who: 'baokaka', text: '「抱抱。」' },
    { do: 'join', hero: 'bear' },
    { do: 'flag', flag: 'bearJoined' },
    { who: null, text: '黑糖加入了隊伍！' },
    { who: 'bear', text: '「歹、歹勢……我很怕黑。可是我跟你們一起上去。」' },
    { who: 'baokaka', text: '「娃娃在上面。」' },
  ],
  'night.boss': [
    { who: 'snore', text: '「呼……嚕……誰吵我……」' },
    { who: null, text: '打呼嚕大王翻了個身。牠懷裡抱著一個小小的安撫娃娃。' },
    { who: 'baokaka', text: '「那是我的娃娃！」' },
    { who: 'mocha', text: '「牠很硬。血低的時候記得防禦，一起上！」' },
    { do: 'battle', foes: ['snoreKing'], boss: true },
    { do: 'flag', flag: 'snoreDone' },
    { who: 'snore', text: '「呼……我只是……一個人睡覺，太安靜了……」' },
    { who: 'baokaka', text: '「那……一起睡。」' },
    { who: null, text: '寶咖咖把娃娃抱回懷裡，然後把手伸給打呼嚕大王。' },
    { do: 'ending' },
  ],
};
