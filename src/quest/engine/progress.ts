import type { SpriteName } from '../../art/types';
import { FOES } from './foes';
import type { FoeId, Run } from './types';

/**
 * Progress content: everything the menu's 抓周盤, 任務, 收藏 and 圖鑑 pages show, plus the escort
 * followers on the map (story bible § 3 row 5, § 3.2 rows 10–13, § 6.3, § 7b). It is all data over
 * `run.flags` and `run.seenFoes`, so any page can be drawn from a saved run alone, and the only
 * engine hook is `addFlags` / `refreshDerived`, which keep the derived flags up to date.
 */

// ---------------------------------------------------------------------------------------------
// Derived flags (bible § 3.2 #10)

/** A flag that is set by itself once at least `atLeast` (default: all) of the `of` flags are set. */
export type Derived = { flag: string; of: string[]; atLeast?: number };

/** The 14 maps with a stamp stand and a 店員小哥 (decision D-16: 14, not 11). */
export const STAMP_MAPS = [
  'daan',
  'ntu',
  'station',
  'ximen',
  'longshan',
  'dadaocheng',
  'shilin',
  'airport',
  'maokong',
  'bitan',
  'beitou',
  'yangming',
  'tamsui',
  'tower',
] as const;

const range = (count: number, name: (n: number) => string): string[] => Array.from({ length: count }, (_, index) => name(index + 1));

const STAMP_FLAGS = STAMP_MAPS.map((map) => `stamp_${map}`);
const CLERK_FLAGS = STAMP_MAPS.map((map) => `clerk_${map}`);
const ELDER_FLAGS = range(8, (n) => `elder_${n}`);
const ECHO_FLAGS = range(14, (n) => `echo_${n}`);
/** Script § sq.riders: the eight 月亮線 passengers. */
const RIDER_FLAGS = ['rider_salaryman', 'rider_owl', 'rider_squished', 'rider_fisher', 'rider_nurse', 'rider_busker', 'rider_dog', 'rider_clerk'];
/** Script § sq.lostFound: picking up each of the five lost things, and handing each one back. */
const LOST_FOUND = ['notes', 'hat', 'earphones', 'wand', 'painterHat'];

/**
 * The derived flags. `…Any` flags (at least one) exist so a collect-in-any-order quest has a
 * first step to start on. Chapter issues add their puzzle gates here (`libraryReady`, `mazeSolved`,
 * `poeReady`, `boltsFound`, `meerkatsDone`).
 */
export const DERIVED: Derived[] = [
  { flag: 'allStamps', of: STAMP_FLAGS },
  { flag: 'clerkAny', of: CLERK_FLAGS, atLeast: 1 },
  { flag: 'clerk5', of: CLERK_FLAGS, atLeast: 5 },
  { flag: 'clerk10', of: CLERK_FLAGS, atLeast: 10 },
  { flag: 'clerkAll', of: CLERK_FLAGS },
  { flag: 'elderAny', of: ELDER_FLAGS, atLeast: 1 },
  { flag: 'elderAll', of: ELDER_FLAGS },
  { flag: 'echoAny', of: ECHO_FLAGS, atLeast: 1 },
  { flag: 'echoAll', of: ECHO_FLAGS },
  { flag: 'riderAny', of: RIDER_FLAGS, atLeast: 1 },
  { flag: 'riderAll', of: RIDER_FLAGS },
  { flag: 'notesAll', of: ['note1', 'note2', 'note3'] },
  { flag: 'lfAny', of: LOST_FOUND.map((item) => `lf_${item}`), atLeast: 1 },
  { flag: 'lfAll', of: LOST_FOUND.map((item) => `lf_${item}Back`) },
];

/**
 * The one derived flag that is not computed from flags: set once every foe in BESTIARY_FOES is in
 * `run.seenFoes`. `applyDerived` checks it first, so ordinary DERIVED entries may build on it.
 */
export const BESTIARY_FLAG = 'bestiaryAll';

/** Every foe the 圖鑑 lists and `bestiaryAll` needs: the whole roster, bosses included, minus post-game-only foes. */
export const BESTIARY_FOES: readonly FoeId[] = Object.values(FOES)
  .filter((foe) => !foe.postGame)
  .map((foe) => foe.id);

const needed = (entry: Derived): number => entry.atLeast ?? entry.of.length;

/**
 * Returns `flags` plus every derived flag whose condition now holds, iterating to a fixed point so
 * a derived flag may depend on another. Flags are only ever added, so this always terminates; the
 * same array comes back when nothing changed. Pass `seenFoes` to also settle `bestiaryAll`.
 */
export function applyDerived(flags: string[], seenFoes: readonly FoeId[] = [], table: readonly Derived[] = DERIVED): string[] {
  const set = new Set(flags);
  const added: string[] = [];
  const add = (flag: string) => {
    set.add(flag);
    added.push(flag);
  };

  if (!set.has(BESTIARY_FLAG) && BESTIARY_FOES.length > 0 && BESTIARY_FOES.every((foe) => seenFoes.includes(foe))) add(BESTIARY_FLAG);

  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of table) {
      if (set.has(entry.flag)) continue;
      const count = entry.of.reduce((sum, flag) => sum + (set.has(flag) ? 1 : 0), 0);
      if (count >= needed(entry)) {
        add(entry.flag);
        changed = true;
      }
    }
  }
  return added.length === 0 ? flags : [...flags, ...added];
}

/** Settles the derived flags of a run; the same run comes back when nothing changed. */
export function refreshDerived(run: Run): Run {
  const flags = applyDerived(run.flags, run.seenFoes);
  return flags === run.flags ? run : { ...run, flags };
}

/** The one way the engine sets story flags: adds the new ones, then settles the derived flags. */
export function addFlags(run: Run, ...flags: string[]): Run {
  const fresh = flags.filter((flag, index) => !run.flags.includes(flag) && flags.indexOf(flag) === index);
  if (fresh.length === 0) return run;
  return refreshDerived({ ...run, flags: [...run.flags, ...fresh] });
}

/** Adds the foes of a won battle to the 圖鑑 (first time only, in order) and settles `bestiaryAll`. */
export function recordFoes(run: Run, foes: readonly FoeId[]): Run {
  const fresh = foes.filter((foe, index) => !run.seenFoes.includes(foe) && foes.indexOf(foe) === index);
  if (fresh.length === 0) return run;
  return refreshDerived({ ...run, seenFoes: [...run.seenFoes, ...fresh] });
}

// ---------------------------------------------------------------------------------------------
// 任務 log (bible § 3.2 #11, § 7b)

/** One step of a side quest: the flag that completes it, and the hint shown while it is the next one. */
export type QuestStep = { flag: string; hint: string };
export type SideQuest = { id: string; title: string; steps: QuestStep[] };

/** zh-Hant, at most this many characters, so a hint fits one line of the 任務 tab. */
export const QUEST_HINT_MAX = 24;

/**
 * The 14 side quests, titled from the bible's 「任務 log title」 column. A quest is started once its
 * first step's flag is set, so the first hint is never shown: it documents how the quest begins.
 * Collect-in-any-order quests start on an `…Any` derived flag. Chapter issues refine the hints.
 */
export const QUESTS: SideQuest[] = [
  {
    id: 'sq.backpacker',
    title: '背包客的101之旅',
    steps: [
      { flag: 'bp_map', hint: '地下街有一張英文地圖。' },
      { flag: 'bp_airport', hint: '背包客說，他要去松山機場。' },
      { flag: 'bp_tamsui', hint: '背包客說，他要去淡水看海。' },
    ],
  },
  {
    id: 'sq.clerk',
    title: '店員小哥的集點卡',
    steps: [
      { flag: 'clerkAny', hint: '便利商店的店員小哥，有集點卡。' },
      { flag: 'clerk5', hint: '每一站的便利商店，都去逛逛。' },
      { flag: 'clerkFiveGot', hint: '集滿五點了！找店員小哥領獎。' },
      { flag: 'clerk10', hint: '集滿十點，好像還有東西。' },
      { flag: 'clerkAll', hint: '十四間分店，全部集滿。' },
      { flag: 'clerkVest', hint: '集滿了！去象山找店員小哥。' },
    ],
  },
  {
    id: 'sq.elder',
    title: '阿嬤的長輩圖',
    steps: [
      { flag: 'elderAny', hint: '阿嬤印的長輩圖，被風吹散了。' },
      { flag: 'elderAll', hint: '還有長輩圖，散落在台北各地。' },
      { flag: 'tigerHatGot', hint: '八張都找到了！去象山找阿嬤。' },
    ],
  },
  {
    id: 'sq.lostFound',
    title: '失物招領',
    steps: [
      { flag: 'lfAny', hint: '風吹走了好多人的東西。' },
      { flag: 'lfAll', hint: '把撿到的東西，送回主人身邊。' },
      { flag: 'lfReward', hint: '全部送回去了！去失物招領處。' },
    ],
  },
  {
    id: 'sq.delivery',
    title: '月亮外送',
    steps: [
      { flag: 'dlStarted', hint: '台北車站有一個外送小哥。' },
      { flag: 'dl1', hint: '便當送去西門，給街舞少年。' },
      { flag: 'dl2', hint: '麵線送去龍山寺，給青草巷阿婆。' },
      { flag: 'dl3Got', hint: '大稻埕的茶行阿伯，也有東西要送。' },
      { flag: 'dl3', hint: '鐵觀音送去貓空，給茶壺爺。' },
      { flag: 'dl4Got', hint: '貓空茶館的老闆娘，有東西要送。' },
      { flag: 'dl4', hint: '茶葉送去北投，給溫泉阿嬤。' },
      { flag: 'dl5', hint: '溫泉蛋送去淡水，給畫畫的少年。' },
    ],
  },
  {
    id: 'sq.mocha',
    title: '摩卡的老朋友',
    steps: [
      { flag: 'mochaMetAhua', hint: '青草巷的屋頂上，有一隻老貓。' },
      { flag: 'mochaEaves', hint: '去巷子底的屋簷下看看。' },
      { flag: 'mochaBell', hint: '回屋頂，找阿花姐。' },
    ],
  },
  {
    id: 'sq.magpie',
    title: '藍教授的畢業證書',
    steps: [
      { flag: 'note1', hint: '圖書館的桌上，有一張筆記。' },
      { flag: 'notesAll', hint: '還有旁聽筆記，被風吹走了。' },
      { flag: 'magpieGrad', hint: '集滿三頁了！去北投找書蟲。' },
    ],
  },
  {
    id: 'sq.clawPlush',
    title: '夾娃娃機的小黑熊',
    steps: [
      { flag: 'claw1', hint: '西門的夾娃娃機裡，有一隻小黑熊。' },
      { flag: 'gotPlush', hint: '再試一次！小黑熊快夾到了。' },
      { flag: 'plushGiven', hint: '小黑熊玩偶，好像某個人喔。' },
    ],
  },
  {
    id: 'sq.bear',
    title: '黑糖爬山',
    steps: [{ flag: 'bearPeak', hint: '擎天崗旁邊，有一個小山頂。' }],
  },
  {
    id: 'sq.echo',
    title: '咻咻的回音',
    steps: [
      { flag: 'echoAny', hint: '地上有一小團風，在轉圈圈。' },
      { flag: 'echoAll', hint: '每一站，都有小小的風在說話。' },
      { flag: 'echoScene', hint: '十四句都聽到了。去象山找咻咻。' },
    ],
  },
  {
    id: 'sq.riders',
    title: '月亮線乘客',
    steps: [
      { flag: 'riderAny', hint: '月亮線的車廂裡，有別的乘客。' },
      { flag: 'riderAll', hint: '還有乘客，可以聊聊天。' },
      { flag: 'riderTicket', hint: '八位乘客都認識了！看看路線圖。' },
    ],
  },
  {
    id: 'sq.queue',
    title: '排隊美食',
    steps: [
      { flag: 'cutletDone', hint: '士林夜市，有一條好長的隊伍。' },
      { flag: 'queueDone', hint: '那一排隊伍，排到最前面了嗎？' },
    ],
  },
  {
    id: 'sq.swanRace',
    title: '天鵝船比賽',
    steps: [
      { flag: 'swanDone', hint: '碧潭的天鵝船大姊，在生氣。' },
      { flag: 'swanRaceWon', hint: '碼頭的小天鵝船，想比一場。' },
    ],
  },
  {
    id: 'sq.callaLily',
    title: '給阿嬤的海芋',
    steps: [{ flag: 'gotLily', hint: '竹子湖的海芋田，一束五十。' }],
  },
];

export type QuestStatus =
  | { state: 'notStarted' }
  | { state: 'started'; hint: string; done: number; total: number }
  | { state: 'done'; total: number };

/** Where a side quest stands: not started (first step unset), done (last step set), or the next hint. */
export function questStatus(quest: SideQuest, flags: readonly string[]): QuestStatus {
  const { steps } = quest;
  const total = steps.length;
  if (flags.includes(steps[total - 1].flag)) return { state: 'done', total };
  if (!flags.includes(steps[0].flag)) return { state: 'notStarted' };
  const next = steps.findIndex((step) => !flags.includes(step.flag));
  return { state: 'started', hint: steps[next].hint, done: next, total };
}

/** The 任務 tab: every started or finished quest, in table order, with its status. */
export const questLog = (flags: readonly string[]): { quest: SideQuest; status: Exclude<QuestStatus, { state: 'notStarted' }> }[] =>
  QUESTS.flatMap((quest) => {
    const status = questStatus(quest, flags);
    return status.state === 'notStarted' ? [] : [{ quest, status }];
  });

// ---------------------------------------------------------------------------------------------
// 抓周盤 key-item tray (bible § 3 row 5, § 6.3)

/** A treasure on the tray: the flag that fills its slot, its name, and what grabbing it means. */
export type TraySlot = { flag: string; name: string; meaning: string; slot: 'ring' | 'center' };

/** The nine 抓周 treasures in the ring, then the center: the gold lock, its red string, and the two birthday things. */
export const TRAY: TraySlot[] = [
  { flag: 'got_scallion', name: '蔥', meaning: '聰明', slot: 'ring' },
  { flag: 'got_book', name: '書', meaning: '會讀冊', slot: 'ring' },
  { flag: 'got_seal', name: '印章', meaning: '做頭家', slot: 'ring' },
  { flag: 'got_mic', name: '麥克風', meaning: '會表演', slot: 'ring' },
  { flag: 'got_abacus', name: '算盤', meaning: '會算', slot: 'ring' },
  { flag: 'got_drumstick', name: '雞腿', meaning: '有口福', slot: 'ring' },
  { flag: 'got_celery', name: '芹菜', meaning: '勤勞', slot: 'ring' },
  { flag: 'got_stethoscope', name: '聽診器', meaning: '照顧人', slot: 'ring' },
  { flag: 'got_brush', name: '畫筆', meaning: '會畫圖', slot: 'ring' },
  { flag: 'got_lock', name: '金鎖片', meaning: '阿嬤的祝福', slot: 'center' },
  { flag: 'got_redString', name: '紅繩', meaning: '金鎖片的繩子', slot: 'center' },
  { flag: 'got_candle', name: '一歲的蠟燭', meaning: '生日的東西', slot: 'center' },
  { flag: 'got_invite', name: '空白的邀請卡', meaning: '生日的東西', slot: 'center' },
];

export type TrayState = { slots: (TraySlot & { have: boolean })[]; ring: number; ringTotal: number; center: number; centerTotal: number };

/** The tray as the menu draws it: every slot with whether it is filled, and the counts per part. */
export function trayState(flags: readonly string[]): TrayState {
  const slots = TRAY.map((slot) => ({ ...slot, have: flags.includes(slot.flag) }));
  const count = (part: TraySlot['slot'], have: boolean) => slots.filter((slot) => slot.slot === part && (!have || slot.have)).length;
  return { slots, ring: count('ring', true), ringTotal: count('ring', false), center: count('center', true), centerTotal: count('center', false) };
}

// ---------------------------------------------------------------------------------------------
// Collections (bible § 3.2 #12), copied from script § 支線任務

/** One collectible: its flag, a title, and the line(s) the page shows or replays. */
export type CollectionEntry = { flag: string; title: string; lines: string[] };
export type Collection = { id: 'stamps' | 'elder' | 'echo' | 'riders'; title: string; entries: CollectionEntry[] };

/** Every collection line is at most this long (the dialogue limit). */
export const COLLECTION_LINE_MAX = 40;

/** The 14 stamps: the name printed on the stamp and its picture (script § stamp.*). */
const STAMPS: [string, string][] = [
  ['大安森林公園', '一棵大樹的章'],
  ['台灣大學・傅鐘', '傅鐘的章'],
  ['台北車站', '一列小火車的章'],
  ['西門紅樓', '八角形的章'],
  ['龍山寺', '彎彎屋頂的章'],
  ['大稻埕', '一間老房子的章'],
  ['士林夜市', '一杯珍奶的章'],
  ['松山機場', '一架小飛機的章'],
  ['貓空纜車', '一個小車廂的章'],
  ['碧潭', '一艘天鵝船的章'],
  ['新北投', '一個冒煙的溫泉章'],
  ['擎天崗', '一頭水牛的章'],
  ['淡水', '一座白色的橋的章'],
  ['台北101', '一節一節竹子的章'],
];

/** 阿嬤's eight 長輩圖 (script § sq.elder): the picture, and the words on it. */
const ELDER: [string, string][] = [
  ['一朵向日葵', '早安！認真過好每一天！'],
  ['一杯閃亮的水', '午安！記得多喝水！'],
  ['一朵發光的荷花', '晚安！平安喜樂！'],
  ['一隻招財的金魚', '好心情，好運到！'],
  ['一束康乃馨', '感恩的心，天天開心！'],
  ['一碗發光的飯', '吃飽飽，身體好！'],
  ['一隻天鵝', '心平氣和，萬事如意！'],
  ['一束海芋', '祝福你，身體健康！'],
];

/** 咻咻's fourteen echoes (script § sq.echo): where each one swirls, and what it says. */
const ECHOES: [string, string, string][] = [
  ['家・窗邊', '窗戶裡，好溫暖。有人在笑。', '咻咻……也想進去。'],
  ['台大・醉月湖', '書，好多字。咻咻看不懂。', '書是寶寶的。可是咻咻不敢還。'],
  ['台北車站・大廳', '好多門。嗶嗶嗶。', '咻咻沒有票。咻咻不能進去。'],
  ['西門・紅樓', '有人在唱歌。好難聽。', '可是，大家都停下來聽。'],
  ['龍山寺・燈籠', '好多人在說『平安』。', '咻咻也想要平安。'],
  ['大稻埕・碼頭', '布好漂亮。咻咻包起來。', '假裝是生日的衣服。'],
  ['士林夜市・牌樓', '好香。好香。', '可是咻咻是風。咻咻不能吃。'],
  ['松山機場・飛機巷', '飛機，帶咻咻走好不好？', '……飛機在睡覺。'],
  ['貓空・觀景台', '從這裡看，台北好小。', '咻咻，也好小。'],
  ['碧潭・吊橋', '天鵝在水上，飄呀飄。', '咻咻也想停下來。不要一直轉。'],
  ['北投・泡腳池', '好暖……', '咻咻一直在發抖。不知道為什麼。'],
  ['擎天崗・山頂', '山好高。咻咻爬不上去。', '爬了好多次。好累。'],
  ['漁人碼頭・海堤', '海就在那裡。', '可是……咻咻想先看一次生日。'],
  ['台北101・89樓', '這裡最高。離天空最近。', '可是……只有咻咻一個人。'],
];

/** The eight 月亮線 passengers (script § sq.riders and the speaker table): who, and which car. */
const RIDERS: [string, string][] = [
  ['暗光鳥上班族', '藍色車廂'],
  ['貓頭鷹奶奶', '紅色車廂'],
  ['扁扁的上班族', '橘色車廂'],
  ['釣魚阿公', '綠色車廂'],
  ['夜班護理師', '紅色車廂'],
  ['街頭歌手', '藍色車廂'],
  ['遛狗阿姨', '棕色車廂'],
  ['店員小哥', '橘色車廂'],
];

export const COLLECTIONS: Collection[] = [
  { id: 'stamps', title: '集章本', entries: STAMPS.map(([title, line], index) => ({ flag: STAMP_FLAGS[index], title, lines: [line] })) },
  { id: 'elder', title: '阿嬤的長輩圖', entries: ELDER.map(([title, line], index) => ({ flag: ELDER_FLAGS[index], title, lines: [line] })) },
  { id: 'echo', title: '咻咻的回音', entries: ECHOES.map(([title, ...lines], index) => ({ flag: ECHO_FLAGS[index], title, lines })) },
  { id: 'riders', title: '月亮線乘客', entries: RIDERS.map(([title, line], index) => ({ flag: RIDER_FLAGS[index], title, lines: [line] })) },
];

/** A collection page as the menu draws it: every entry with whether it is found, and the count. */
export function collectionState(collection: Collection, flags: readonly string[]): { entries: (CollectionEntry & { have: boolean })[]; have: number; total: number } {
  const entries = collection.entries.map((entry) => ({ ...entry, have: flags.includes(entry.flag) }));
  return { entries, have: entries.filter((entry) => entry.have).length, total: entries.length };
}

// ---------------------------------------------------------------------------------------------
// 圖鑑 (bible § 3.2 #13)

/** The 圖鑑 page: every listed foe in roster order, with whether the party has calmed it yet. */
export const bestiaryState = (seenFoes: readonly FoeId[]): { foe: FoeId; seen: boolean }[] =>
  BESTIARY_FOES.map((foe) => ({ foe, seen: seenFoes.includes(foe) }));

// ---------------------------------------------------------------------------------------------
// Escort followers

/**
 * Someone walking behind the party between `flag` and `until` (the pigeon chick in Ch5, 小籠包 in
 * Ch7, the calf in Ch12). Purely visual: the world screen draws them one tile behind the last hero.
 */
export type Follower = { flag: string; until: string; sprite: SpriteName; name: string };

/** Chapter issues add `chickFollowing`, `dumplingFollowing` and `calfFollowing` here. */
export const FOLLOWERS: Follower[] = [];

/** The follower to draw right now: the first entry whose `flag` is set and `until` is not. */
export const activeFollower = (flags: readonly string[], table: readonly Follower[] = FOLLOWERS): Follower | null =>
  table.find((entry) => flags.includes(entry.flag) && !flags.includes(entry.until)) ?? null;
