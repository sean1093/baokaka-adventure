import { describe, expect, test } from 'vitest';
import { CHAPTERS } from './chapters';
import { FOES } from './foes';
import { SKILLS, skillsFor } from './heroes';
import { validateQuestContent } from './validate';

describe('the shipped quest content', () => {
  test('passes every validation rule', () => {
    expect(validateQuestContent()).toEqual([]);
  });

  test('has six chapters, each with two fights, a camp and a boss', () => {
    expect(CHAPTERS).toHaveLength(6);
    for (const chapter of CHAPTERS) {
      expect(chapter.nodes.map((node) => node.kind)).toEqual(['battle', 'battle', 'camp', 'boss']);
      expect(chapter.title.length).toBeGreaterThan(0);
      expect(chapter.story.length).toBeGreaterThan(0);
    }
  });

  test('every foe appears in at least one node', () => {
    const used = new Set(CHAPTERS.flatMap((chapter) => chapter.nodes.flatMap((node) => (node.kind === 'camp' ? [] : node.foes))));
    for (const foe of Object.keys(FOES)) expect(used.has(foe as keyof typeof FOES)).toBe(true);
  });

  test('foes get tougher chapter by chapter', () => {
    const bossHp = CHAPTERS.map((chapter) => {
      const boss = chapter.nodes.at(-1);
      return boss && boss.kind === 'boss' ? Math.max(...boss.foes.map((foe) => FOES[foe].maxHp)) : 0;
    });
    for (let index = 1; index < bossHp.length; index += 1) expect(bossHp[index]).toBeGreaterThan(bossHp[index - 1]);
  });

  test('each hero starts with an attack, an energy builder and guard, and learns more later', () => {
    for (const hero of ['baokaka', 'mocha'] as const) {
      const atStart = skillsFor(hero, 1).map((skill) => skill.id);
      expect(atStart).toContain('guard');
      expect(atStart.length).toBeGreaterThanOrEqual(3);
      expect(skillsFor(hero, 6).length).toBeGreaterThan(atStart.length);
    }
    expect(Object.values(SKILLS).every((skill) => skill.name.length > 0 && skill.blurb.length > 0)).toBe(true);
  });
});
