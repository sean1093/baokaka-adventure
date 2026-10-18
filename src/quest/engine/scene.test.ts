import { describe, expect, test } from 'vitest';
import { freshRun } from './quest';
import { innLines, runScene } from './scene';
import { UI } from './strings';
import type { Run, Step } from './types';
import { validateSteps } from './validate';

const play = (run: Run, steps: Step[]): Run => runScene(run, { steps, at: 0 }).run;

describe('the coins step', () => {
  test('adds coins', () => {
    expect(play({ ...freshRun(1), coins: 5 }, [{ do: 'coins', amount: 50 }]).coins).toBe(55);
  });

  test('spends coins and floors at 0', () => {
    expect(play({ ...freshRun(1), coins: 5 }, [{ do: 'coins', amount: -20 }]).coins).toBe(0);
    expect(play({ ...freshRun(1), coins: 30 }, [{ do: 'coins', amount: -20 }]).coins).toBe(10);
  });

  test('the validator wants a whole number', () => {
    const errors: string[] = [];
    validateSteps('test', [{ do: 'coins', amount: 2.5 }, { do: 'coins', amount: -10 }], errors);
    expect(errors).toEqual(['test[0]: coins amount must be an integer, got 2.5']);
  });
});

describe('innLines', () => {
  test('too few coins says how many are missing and changes nothing', () => {
    const run = { ...freshRun(1), coins: 4 };
    const answered = innLines(run, 10, true);
    expect(answered.run).toBe(run);
    expect(answered.lines).toEqual([{ who: null, text: '銅板不夠，還差 6 個。' }]);
  });

  test('enough coins pays and rests', () => {
    const run = { ...freshRun(1), coins: 12, hp: { ...freshRun(1).hp, baokaka: 1 } };
    const answered = innLines(run, 10, true);
    expect(answered.run.coins).toBe(2);
    expect(answered.run.hp.baokaka).toBe(freshRun(1).hp.baokaka);
    expect(answered.lines[0].text).toBe('呼……睡了一覺，體力和元氣都滿了。');
  });

  test('declining is free', () => {
    expect(innLines({ ...freshRun(1), coins: 12 }, 10, false).lines[0].text).toBe(UI.innDeclined);
  });
});

describe('UI strings', () => {
  test('follow script § Battle UI strings', () => {
    expect(UI.victory).toBe('大家都冷靜下來了！');
    expect(UI.bossVictory('打呼嚕大王')).toBe('打呼嚕大王不暈了！');
    expect(UI.fleeOk).toBe('溜走了！');
    expect(UI.fleeFail).toBe('被擋住了！');
    expect(UI.heroKo('寶咖咖')).toBe('寶咖咖累倒了……');
    expect(UI.foeKo('灰塵兔')).toBe('灰塵兔頭暈暈，跑走了！');
    expect(UI.levelUp(3)).toBe('大家長大了一點！（Lv3）');
    expect(UI.newSkill('摩卡', '呼嚕嚕')).toBe('摩卡學會了才藝：呼嚕嚕！');
    expect(Object.values(UI.commands)).toEqual(['攻擊', '才藝', '道具', '防禦', '逃跑']);
    expect(UI.defeat).toEqual(['大家累倒了……', '在入口醒了過來。']);
  });

  test('every fixed line fits the 40-character limit', () => {
    const lines = [UI.innRested, UI.innDeclined, ...UI.defeat, ...UI.legacyReset, UI.innShort(999), UI.innAsk(999, 9999)];
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(40);
  });
});
