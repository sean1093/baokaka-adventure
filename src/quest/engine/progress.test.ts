import { describe, expect, test } from 'vitest';
import { SPRITES } from '../../art/sprites';
import { FOES } from './foes';
import {
  BESTIARY_FOES,
  COLLECTIONS,
  COLLECTION_LINE_MAX,
  DERIVED,
  FOLLOWERS,
  QUESTS,
  QUEST_HINT_MAX,
  STAMP_MAPS,
  TRAY,
  activeFollower,
  addFlags,
  applyDerived,
  bestiaryState,
  collectionState,
  questLog,
  questStatus,
  recordFoes,
  trayState,
  type Derived,
  type Follower,
  type SideQuest,
} from './progress';
import { freshRun } from './quest';
import { progressWarnings, settableFlags, validateDerived, validateFollowers, validateQuests } from './validate';
import type { FoeId } from './types';

const stamps = STAMP_MAPS.map((map) => `stamp_${map}`);
const clerks = STAMP_MAPS.map((map) => `clerk_${map}`);

describe('applyDerived', () => {
  test('all-of: set only once every source flag is', () => {
    expect(applyDerived(stamps.slice(0, 13))).not.toContain('allStamps');
    expect(applyDerived(stamps)).toContain('allStamps');
  });

  test('atLeast: 5, 10 and 14 clerk points', () => {
    expect(applyDerived(clerks.slice(0, 4))).toEqual([...clerks.slice(0, 4), 'clerkAny']);
    const five = applyDerived(clerks.slice(0, 5));
    expect(five).toContain('clerk5');
    expect(five).not.toContain('clerk10');
    // Any five count, not the first five
    expect(applyDerived(clerks.slice(9))).toContain('clerk5');
    const ten = applyDerived(clerks.slice(0, 10));
    expect(ten).toEqual(expect.arrayContaining(['clerk5', 'clerk10']));
    expect(ten).not.toContain('clerkAll');
    expect(applyDerived(clerks)).toEqual(expect.arrayContaining(['clerk5', 'clerk10', 'clerkAll']));
  });

  test('chained: a derived flag can wait on another, in any table order', () => {
    const table: Derived[] = [
      { flag: 'top', of: ['middle', 'c'] },
      { flag: 'middle', of: ['a', 'b'], atLeast: 1 },
    ];
    expect(applyDerived(['a'], [], table)).toEqual(['a', 'middle']);
    expect(applyDerived(['a', 'c'], [], table)).toEqual(['a', 'c', 'middle', 'top']);
  });

  test('idempotent: a second pass changes nothing and returns the same array', () => {
    const once = applyDerived([...stamps, ...clerks]);
    expect(applyDerived(once)).toBe(once);
    expect(new Set(once).size).toBe(once.length);
    const plain = ['mochaJoined'];
    expect(applyDerived(plain)).toBe(plain);
  });

  test('bestiaryAll comes from seenFoes, not flags', () => {
    const all = [...BESTIARY_FOES];
    expect(applyDerived([], all.slice(1))).not.toContain('bestiaryAll');
    expect(applyDerived([], all)).toEqual(['bestiaryAll']);
    expect(applyDerived(['bestiaryAll'], all)).toEqual(['bestiaryAll']);
  });
});

describe('addFlags and recordFoes', () => {
  test('addFlags adds new flags once and settles derived ones', () => {
    const run = { ...freshRun(1), flags: stamps.slice(0, 13) };
    const next = addFlags(run, 'stamp_tower', 'stamp_tower');
    expect(next.flags).toEqual([...stamps, 'allStamps']);
    expect(addFlags(next, 'stamp_daan')).toBe(next);
  });

  test('recordFoes appends unseen foes once, in order', () => {
    const run = { ...freshRun(1), seenFoes: ['pigeon'] as FoeId[] };
    expect(recordFoes(run, ['crab', 'pigeon', 'crab', 'snail']).seenFoes).toEqual(['pigeon', 'crab', 'snail']);
    expect(recordFoes(run, ['pigeon'])).toBe(run);
  });

  test('BESTIARY_FOES is the roster without post-game foes', () => {
    expect(BESTIARY_FOES).toEqual((Object.keys(FOES) as FoeId[]).filter((foe) => !FOES[foe].postGame));
    expect(bestiaryState(['crab'])).toContainEqual({ foe: 'crab', seen: true });
    expect(bestiaryState([]).every((entry) => !entry.seen)).toBe(true);
  });
});

describe('questStatus', () => {
  const quest: SideQuest = {
    id: 'sq.test',
    title: '測試',
    steps: [
      { flag: 'one', hint: '開始' },
      { flag: 'two', hint: '第二步' },
      { flag: 'three', hint: '第三步' },
    ],
  };

  test('not started until the first step is set', () => {
    expect(questStatus(quest, [])).toEqual({ state: 'notStarted' });
    expect(questStatus(quest, ['two'])).toEqual({ state: 'notStarted' });
  });

  test('in progress shows the hint of the first unset step', () => {
    expect(questStatus(quest, ['one'])).toEqual({ state: 'started', hint: '第二步', done: 1, total: 3 });
    expect(questStatus(quest, ['one', 'two'])).toEqual({ state: 'started', hint: '第三步', done: 2, total: 3 });
  });

  test('done once the last step is set', () => {
    expect(questStatus(quest, ['one', 'two', 'three'])).toEqual({ state: 'done', total: 3 });
  });

  test('the shipped log: the clerk card starts on any point and moves on at five', () => {
    expect(questLog([])).toEqual([]);
    const four = applyDerived(clerks.slice(3, 7));
    const entry = questLog(four).find((item) => item.quest.id === 'sq.clerk');
    expect(entry?.status).toMatchObject({ state: 'started', hint: '每一站的便利商店，都去逛逛。' });
    const five = applyDerived(clerks.slice(0, 5));
    expect(questLog(five).find((item) => item.quest.id === 'sq.clerk')?.status).toMatchObject({ hint: '集滿五點了！找店員小哥領獎。' });
  });
});

describe('the progress tables', () => {
  test('pass validation', () => {
    const errors: string[] = [];
    validateDerived(DERIVED, errors);
    validateQuests(QUESTS, errors);
    validateFollowers(FOLLOWERS, errors);
    expect(errors).toEqual([]);
  });

  test('seed the derived flags the bible lists', () => {
    const flags = DERIVED.map((entry) => entry.flag);
    for (const flag of ['allStamps', 'clerk5', 'clerk10', 'clerkAll', 'elderAll', 'echoAll', 'riderAll', 'notesAll']) expect(flags).toContain(flag);
    expect(DERIVED.find((entry) => entry.flag === 'allStamps')?.of).toHaveLength(14);
    expect(DERIVED.find((entry) => entry.flag === 'echoAll')?.of).toHaveLength(14);
    expect(DERIVED.find((entry) => entry.flag === 'riderAll')?.of).toHaveLength(8);
  });

  test('fourteen side quests with unique ids and hints that fit', () => {
    expect(QUESTS).toHaveLength(14);
    expect(new Set(QUESTS.map((quest) => quest.id)).size).toBe(14);
    for (const quest of QUESTS) for (const step of quest.steps) expect(step.hint.length).toBeLessThanOrEqual(QUEST_HINT_MAX);
  });

  test('the tray: nine treasures in the ring, four in the center, unique flags', () => {
    expect(TRAY.filter((slot) => slot.slot === 'ring')).toHaveLength(9);
    expect(TRAY.filter((slot) => slot.slot === 'center').map((slot) => slot.flag)).toEqual(['got_lock', 'got_redString', 'got_candle', 'got_invite']);
    expect(new Set(TRAY.map((slot) => slot.flag)).size).toBe(TRAY.length);
    const state = trayState(['got_scallion', 'got_book', 'got_lock']);
    expect(state).toMatchObject({ ring: 2, ringTotal: 9, center: 1, centerTotal: 4 });
    expect(state.slots.find((slot) => slot.flag === 'got_book')?.have).toBe(true);
    expect(state.slots.find((slot) => slot.flag === 'got_brush')?.have).toBe(false);
  });

  test('four collections of 14, 8, 14 and 8, unique flags, lines that fit', () => {
    expect(COLLECTIONS.map((collection) => [collection.title, collection.entries.length])).toEqual([
      ['集章本', 14],
      ['阿嬤的長輩圖', 8],
      ['咻咻的回音', 14],
      ['月亮線乘客', 8],
    ]);
    const flags = COLLECTIONS.flatMap((collection) => collection.entries.map((entry) => entry.flag));
    expect(new Set(flags).size).toBe(flags.length);
    for (const collection of COLLECTIONS) {
      for (const entry of collection.entries) {
        expect(entry.lines.length).toBeGreaterThan(0);
        for (const line of entry.lines) expect(line.length).toBeLessThanOrEqual(COLLECTION_LINE_MAX);
      }
    }
    expect(collectionState(COLLECTIONS[0], ['stamp_daan', 'stamp_tower'])).toMatchObject({ have: 2, total: 14 });
  });

  test('every collection page is completable through its derived flag', () => {
    const page = (id: string) => COLLECTIONS.find((collection) => collection.id === id)!.entries.map((entry) => entry.flag);
    expect(applyDerived(page('stamps'))).toContain('allStamps');
    expect(applyDerived(page('elder'))).toContain('elderAll');
    expect(applyDerived(page('echo'))).toContain('echoAll');
    expect(applyDerived(page('riders'))).toContain('riderAll');
  });
});

describe('progress validation', () => {
  test('rejects cycles, duplicates and impossible counts', () => {
    const errors: string[] = [];
    validateDerived(
      [
        { flag: 'a', of: ['b'] },
        { flag: 'b', of: ['c', 'a'], atLeast: 2 },
        { flag: 'c', of: ['x'], atLeast: 2 },
        { flag: 'c', of: [] },
        { flag: 'bestiaryAll', of: ['x'] },
      ],
      errors,
    );
    expect(errors.some((error) => error.includes('cycle'))).toBe(true);
    expect(errors).toContain('derived c: defined twice');
    expect(errors).toContain('derived c: depends on no flags');
    expect(errors.some((error) => error.startsWith('derived c: atLeast'))).toBe(true);
    expect(errors.some((error) => error.startsWith('derived bestiaryAll'))).toBe(true);
  });

  test('a self-dependency is a cycle', () => {
    const errors: string[] = [];
    validateDerived([{ flag: 'me', of: ['me', 'you'], atLeast: 1 }], errors);
    expect(errors).toEqual(['derived me: cycle me → me']);
  });

  test('rejects long hints, repeated quest ids and step flags', () => {
    const errors: string[] = [];
    const quest: SideQuest = { id: 'q', title: 't', steps: [{ flag: 'f', hint: '一'.repeat(QUEST_HINT_MAX + 1) }, { flag: 'f', hint: 'ok' }] };
    validateQuests([quest, quest], errors);
    expect(errors).toEqual(expect.arrayContaining(['quest q: defined twice', 'quest q: repeats a step flag']));
    expect(errors.some((error) => error.includes(`over ${QUEST_HINT_MAX}`))).toBe(true);
  });

  test('rejects a follower with an unknown sprite or no end', () => {
    const errors: string[] = [];
    validateFollowers([{ flag: 'x', until: 'x', sprite: 'nope' as never, name: '' }], errors);
    expect(errors).toHaveLength(3);
  });

  test('flags no content sets yet are warnings, not errors, and derived flags count as set', () => {
    const warnings = progressWarnings();
    expect(warnings).toContain('progress flag stamp_daan is never set by any event');
    expect(warnings.some((warning) => warning.includes(' allStamps '))).toBe(false);
    expect(settableFlags()).toContain('bestiaryAll');
  });
});

describe('activeFollower', () => {
  const table: Follower[] = [
    { flag: 'chickFollowing', until: 'chickHome', sprite: 'bird', name: '小鴿子' },
    { flag: 'calfFollowing', until: 'calfHome', sprite: 'bird', name: '小牛' },
  ];

  test('the first entry that has started and not ended', () => {
    expect(activeFollower([], table)).toBeNull();
    expect(activeFollower(['chickFollowing'], table)?.name).toBe('小鴿子');
    expect(activeFollower(['chickFollowing', 'chickHome'], table)).toBeNull();
    expect(activeFollower(['chickFollowing', 'calfFollowing'], table)?.name).toBe('小鴿子');
    expect(activeFollower(['chickFollowing', 'chickHome', 'calfFollowing'], table)?.name).toBe('小牛');
  });

  test('the shipped table starts empty (chapters add their escorts)', () => {
    expect(FOLLOWERS).toEqual([]);
    expect(activeFollower(['chickFollowing'])).toBeNull();
    expect(SPRITES.bird).toBeDefined();
  });
});
