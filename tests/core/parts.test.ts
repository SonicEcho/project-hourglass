import { describe, expect, it } from 'vitest';
import {
  applyAction,
  attackStatOf,
  calcDamage,
  chooseEnemyAction,
  createBattle,
  getActionError,
  getBattleResult,
  nextRandom,
  previewAction,
  randomFactor,
  startNextTurn,
  usableEnemyActions,
} from '../../src/core';
import type { BattleState } from '../../src/core';
import { DISTORTED_BEAST, SKILLS } from '../../src/data';
import { ally, eventsOf, setup } from './helpers';

function battle() {
  return startNextTurn(
    createBattle(
      setup({
        allies: [ally('hero', { spd: 50, atk: 18, mag: 16 }, [SKILLS.breakSlash, SKILLS.thunder])],
        enemies: [{ ...DISTORTED_BEAST, stats: { ...DISTORTED_BEAST.stats, spd: 1 } }],
      }),
    ),
  );
}

/** 状態の乱数から、次の攻撃の（部位振り分け前の）ダメージを計算する */
function expectedRaw(s: BattleState, power: number): number {
  const boss = s.enemies[0];
  return calcDamage({
    power,
    attack: attackStatOf(s.allies[0], 'physical'),
    defense: boss.def,
    random: randomFactor(nextRandom(s.rng)[0]),
    affinity: 'normal',
  });
}

describe('部位破壊', () => {
  it('部位を狙うと、ダメージは部位HPに全額、本体HPに半分入る', () => {
    const s0 = battle();
    const raw = expectedRaw(s0, 20);
    const s = applyAction(s0, { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'rightArm' } });
    const boss = s.enemies[0];
    expect(boss.parts[0].hp).toBe(220 - raw);
    expect(boss.hp).toBe(900 - Math.floor(raw / 2));
    expect(eventsOf(s, 'damage')[0]).toMatchObject({ partId: 'rightArm', partAmount: raw, amount: Math.floor(raw / 2) });
  });

  it('ブレイクスラッシュは部位へのダメージ2倍', () => {
    const s0 = battle();
    const raw = expectedRaw(s0, 30);
    const s = applyAction(s0, { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    expect(s.enemies[0].parts[1].hp).toBe(180 - raw * 2);
    expect(s.enemies[0].hp).toBe(900 - Math.floor(raw / 2));
  });

  it('部位を狙わなければ本体に全額', () => {
    const s0 = battle();
    const raw = expectedRaw(s0, 20);
    const s = applyAction(s0, { type: 'attack', target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.enemies[0].hp).toBe(900 - raw);
    expect(s.enemies[0].parts.map((p) => p.hp)).toEqual([220, 180]);
  });

  it('右腕を壊すと「叩きつけ」が使えなくなる', () => {
    const s0 = battle();
    expect(usableEnemyActions(s0.enemies[0]).map((a) => a.id)).toEqual(['sweep', 'slam', 'roar']);
    s0.enemies[0].parts[0].hp = 1;
    const s = applyAction(s0, { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'rightArm' } });
    expect(s.enemies[0].parts[0].broken).toBe(true);
    expect(eventsOf(s, 'partBreak')).toEqual([{ type: 'partBreak', enemyId: 'enemy0', partId: 'rightArm' }]);
    expect(usableEnemyActions(s.enemies[0]).map((a) => a.id)).toEqual(['sweep', 'roar']);
    // 何度選ばせても叩きつけは出ない
    const sim = structuredClone(s);
    for (let i = 0; i < 100; i++) expect(chooseEnemyAction(sim, sim.enemies[0]).id).not.toBe('slam');
  });

  it('角を壊すと「歪みの咆哮」が使えなくなり、弱点「雷」が露出する', () => {
    const s0 = battle();
    expect(s0.enemies[0].weaknesses).toEqual([]);
    s0.enemies[0].parts[1].hp = 1;
    let s = applyAction(s0, { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    expect(usableEnemyActions(s.enemies[0]).map((a) => a.id)).toEqual(['sweep', 'slam']);
    expect(s.enemies[0].weaknesses).toEqual(['thunder']);
    expect(s.enemies[0].knownWeaknesses).toEqual(['thunder']);
    expect(eventsOf(s, 'weaknessFound')).toEqual([{ type: 'weaknessFound', enemyId: 'enemy0', element: 'thunder' }]);

    // 露出した弱点を突くとダウンしてワンモア
    s = startNextTurn(s);
    s = applyAction(s, { type: 'skill', skillId: 'thunder', target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.enemies[0].down).toBe(true);
    expect(s.turn?.oneMoreActive).toBe(true);
  });

  it('角を壊す前は雷も通常の相性', () => {
    const s = applyAction(battle(), { type: 'skill', skillId: 'thunder', target: { kind: 'enemy', id: 'enemy0' } });
    expect(eventsOf(s, 'damage')[0].affinity).toBe('normal');
    expect(s.enemies[0].down).toBe(false);
  });

  it('壊れた部位は狙えない', () => {
    const s0 = battle();
    s0.enemies[0].parts[0].broken = true;
    s0.enemies[0].parts[0].hp = 0;
    expect(getActionError(s0, { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'rightArm' } })).not.toBeNull();
  });

  it('プレビューで部位と本体へのダメージの幅がわかる', () => {
    const p = previewAction(battle(), { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    const t = p.targets[0];
    expect(t.partId).toBe('horn');
    expect(t.partMin!).toBeLessThanOrEqual(t.partMax!);
    expect(t.partMin!).toBeGreaterThan(t.min);
  });

  it('結果に、破壊した部位と手に入るはずの素材が出る', () => {
    const s0 = battle();
    s0.enemies[0].parts[1].hp = 1;
    const s = applyAction(s0, { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    expect(getBattleResult(s).brokenParts).toEqual([
      { enemyId: 'enemy0', enemyName: '歪みの獣', partId: 'horn', partName: '角', material: '歪みの角片' },
    ]);
  });
});
