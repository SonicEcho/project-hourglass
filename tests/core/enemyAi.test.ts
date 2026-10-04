import { describe, expect, it } from 'vitest';
import { chooseEnemyAction, createBattle } from '../../src/core';
import { DISTORTED_BEAST } from '../../src/data';
import { setup } from './helpers';

describe('ボスの行動の選び方', () => {
  it('HPが半分以上なら、使える行動からランダム', () => {
    const s = structuredClone(createBattle(setup({ enemies: [DISTORTED_BEAST] })));
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(chooseEnemyAction(s, s.enemies[0]).id);
    expect([...seen].sort()).toEqual(['roar', 'slam', 'sweep']);
  });

  it('HPが半分を切ったら、2回に1回は全体攻撃を選ぶ', () => {
    const s = structuredClone(createBattle(setup({ enemies: [DISTORTED_BEAST] })));
    s.enemies[0].hp = 449;
    for (let i = 0; i < 50; i++) {
      const a = chooseEnemyAction(s, s.enemies[0]);
      if (i % 2 === 0) expect(a.target).toBe('allies');
    }
  });

  it('部位が壊れていたら、残った全体攻撃から選ぶ', () => {
    const s = structuredClone(createBattle(setup({ enemies: [DISTORTED_BEAST] })));
    s.enemies[0].hp = 100;
    s.enemies[0].parts[1].broken = true; // 角（歪みの咆哮）
    for (let i = 0; i < 20; i += 2) {
      expect(chooseEnemyAction(s, s.enemies[0]).id).toBe('sweep');
      chooseEnemyAction(s, s.enemies[0]);
    }
  });
});
