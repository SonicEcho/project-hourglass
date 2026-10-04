import { describe, expect, it } from 'vitest';
import {
  advanceToPlayerTurn,
  applyAction,
  calcDamage,
  calcHeal,
  createBattle,
  nextRandom,
  randomFactor,
  runEnemyTurn,
  startNextTurn,
} from '../../src/core';
import { createEncounterSetup } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

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
    // 30 × 18 ÷ 8 = 67.5
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
    for (const v of seq(99)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('同じシードと同じ操作なら、戦闘の結果がまったく同じになる', () => {
    const play = (seed: number) => {
      let s = advanceToPlayerTurn(createBattle(createEncounterSetup('battle1', seed)));
      for (let i = 0; i < 5 && s.outcome === 'ongoing'; i++) {
        const target = s.enemies.find((e) => e.hp > 0)!;
        s = applyAction(s, { type: 'attack', target: { kind: 'enemy', id: target.uid } });
        s = advanceToPlayerTurn(s);
      }
      return s;
    };
    expect(play(7)).toEqual(play(7));
    expect(play(7).log).not.toEqual(play(8).log);
  });
});

describe('防御', () => {
  it('次の自分の手番まで受けるダメージが半減し、自分の手番が来たら解ける', () => {
    const cfg = setup({
      allies: [ally('hero', { hp: 999, spd: 20, def: 10 })],
      enemies: [enemy('e', { atk: 50, spd: 15 })],
      seed: 5,
    });
    // 主人公(ct5) → 防御で ct8 → 敵(ct7) → 主人公 の順
    let guarded = applyAction(startNextTurn(createBattle(cfg)), { type: 'guard' });
    expect(guarded.allies[0].guarding).toBe(true);
    let unguarded = structuredClone(guarded);
    unguarded.allies[0].guarding = false;

    guarded = runEnemyTurn(startNextTurn(guarded));
    unguarded = runEnemyTurn(startNextTurn(unguarded));
    const g = eventsOf(guarded, 'damage')[0].amount;
    const u = eventsOf(unguarded, 'damage')[0].amount;
    expect(g).toBeLessThanOrEqual(Math.ceil(u / 2));
    expect(g).toBeGreaterThanOrEqual(Math.floor(u / 2) - 1);

    // 次の自分の手番の開始で防御が解ける
    const next = startNextTurn(guarded);
    expect(next.turn?.actorId).toBe('hero');
    expect(next.allies[0].guarding).toBe(false);
  });
});
