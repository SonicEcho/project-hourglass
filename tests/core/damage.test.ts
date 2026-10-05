import { describe, expect, it } from 'vitest';
import { calcDamage, calcHeal, createBattle, declineExtra, nextRandom, randomFactor, runUntilInput } from '../../src/core';
import { createEncounterSetup } from '../../src/data';
import { ally, attackOn, battle, enemy, eventsOf, execute, guard, planAll } from './helpers';

const base = { power: 40, attack: 16, defense: 8, random: 1 };

describe('ダメージ計算', () => {
  it('威力 × 攻撃 ÷ 防御 × 乱数', () => {
    expect(calcDamage({ ...base, affinity: 'normal' })).toBe(80);
    expect(calcDamage({ ...base, random: 0.9, affinity: 'normal' })).toBe(72);
  });

  it('弱点は1.5倍、耐性は0.5倍', () => {
    expect(calcDamage({ ...base, affinity: 'weak' })).toBe(120);
    expect(calcDamage({ ...base, affinity: 'resist' })).toBe(40);
  });

  it('小数点以下は切り捨て', () => {
    expect(calcDamage({ power: 30, attack: 18, defense: 8, random: 1, affinity: 'normal' })).toBe(67);
  });

  it('最低1ダメージ', () => {
    expect(calcDamage({ power: 1, attack: 1, defense: 100, random: 0.9, affinity: 'resist' })).toBe(1);
  });

  it('その他の倍率（バトン1.25倍など）を掛ける', () => {
    expect(calcDamage({ ...base, affinity: 'normal', multiplier: 1.25 })).toBe(100);
  });

  it('乱数倍率は 0.9〜1.1', () => {
    expect(randomFactor(0)).toBeCloseTo(0.9);
    expect(randomFactor(0.5)).toBeCloseTo(1.0);
    expect(randomFactor(0.999999)).toBeCloseTo(1.1);
  });

  it('回復量 = 威力 × 魔力 ÷ 20', () => {
    expect(calcHeal(50, 20)).toBe(50);
    expect(calcHeal(30, 16)).toBe(24);
    expect(calcHeal(50, 20, 1.25)).toBe(62);
  });
});

describe('乱数のシード', () => {
  it('同じシードなら同じ乱数列', () => {
    const seq = (seed: number) => {
      const out: number[] = [];
      let st = seed;
      for (let i = 0; i < 5; i++) {
        const [v, next] = nextRandom(st);
        out.push(v);
        st = next;
      }
      return out;
    };
    expect(seq(123)).toEqual(seq(123));
    expect(seq(123)).not.toEqual(seq(124));
  });

  it('同じシードと同じ操作なら、戦闘の結果がまったく同じになる', () => {
    const play = (seed: number) => {
      let s = createBattle(createEncounterSetup('battle1', seed));
      for (let i = 0; i < 3 && s.outcome === 'ongoing'; i++) {
        const target = s.enemies.find((e) => e.hp > 0)!.uid;
        for (const a of s.allies.filter((x) => x.hp > 0)) s = planAll(s, { [a.uid]: attackOn(target) });
        s = execute(s);
        while (s.phase === 'extra') s = runUntilInput(declineExtra(s));
      }
      return s;
    };
    expect(play(7)).toEqual(play(7));
    expect(play(7).log).not.toEqual(play(8).log);
  });
});

describe('防御', () => {
  // 敵：攻撃50・威力10、味方：防御10 → 50 × 乱数(0.9〜1.1) = 45〜55
  const cfg = { allies: [ally('hero', { hp: 999 })], enemies: [enemy('e', { atk: 50 })], seed: 5 };

  it('ラウンドの間、受けるダメージが半減する', () => {
    const s = execute(planAll(battle(cfg), { hero: guard }));
    const d = eventsOf(s, 'damage').find((e) => e.targetId === 'hero')!.amount;
    expect(d).toBeGreaterThanOrEqual(22);
    expect(d).toBeLessThanOrEqual(27);
  });

  it('防御しなければそのまま受ける', () => {
    const s = execute(planAll(battle(cfg), { hero: attackOn('enemy0') }));
    const d = eventsOf(s, 'damage').find((e) => e.targetId === 'hero')!.amount;
    expect(d).toBeGreaterThanOrEqual(45);
    expect(d).toBeLessThanOrEqual(55);
  });

  it('ラウンドの終わりに防御が解ける', () => {
    const s = execute(planAll(battle(cfg), { hero: guard }));
    expect(s.round).toBe(2);
    expect(s.phase).toBe('plan');
    expect(s.allies[0].guarding).toBe(false);
  });
});
