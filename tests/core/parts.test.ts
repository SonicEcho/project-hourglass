import { describe, expect, it } from 'vitest';
import {
  attackStatOf,
  calcDamage,
  chooseEnemyAction,
  getBattleResult,
  getPlanError,
  nextRandom,
  previewAction,
  randomFactor,
  runUntilInput,
  startExecution,
  step,
  usableEnemyActions,
} from '../../src/core';
import type { BattleState, PlayerAction } from '../../src/core';
import { DISTORTED_BEAST, SKILLS } from '../../src/data';
import { ally, attackOn, battle, eventsOf, execute, planAll } from './helpers';

/** 主人公1人とボス（遅い）。主人公が先に動く */
function bossBattle(): BattleState {
  return battle({
    allies: [ally('hero', { spd: 50, atk: 18, mag: 16, hp: 9999 }, [SKILLS.breakSlash, SKILLS.thunder])],
    enemies: [{ ...DISTORTED_BEAST, stats: { ...DISTORTED_BEAST.stats, spd: 1 } }],
  });
}

/** 主人公の行動だけを実行する（ボスはまだ動かない） */
function heroActs(s0: BattleState, action: PlayerAction): BattleState {
  return step(startExecution(planAll(s0, { hero: action })));
}

/** 状態の乱数から、次の攻撃の（部位振り分け前の）ダメージを計算する */
function expectedRaw(s: BattleState, power: number): number {
  return calcDamage({
    power,
    attack: attackStatOf(s.allies[0], 'physical'),
    defense: s.enemies[0].def,
    random: randomFactor(nextRandom(s.rng)[0]),
    affinity: 'normal',
  });
}

describe('部位破壊', () => {
  it('部位を狙うと、ダメージは部位HPに全額、本体HPに半分入る', () => {
    const s0 = bossBattle();
    const raw = expectedRaw(s0, 20);
    const s = heroActs(s0, attackOn('enemy0', 'rightArm'));
    expect(s.enemies[0].parts[0].hp).toBe(220 - raw);
    expect(s.enemies[0].hp).toBe(s0.enemies[0].maxHp - Math.floor(raw / 2));
    expect(eventsOf(s, 'damage')[0]).toMatchObject({ partId: 'rightArm', partAmount: raw, amount: Math.floor(raw / 2) });
  });

  it('ブレイクスラッシュは部位へのダメージ2倍', () => {
    const s0 = bossBattle();
    const raw = expectedRaw(s0, 30);
    const s = heroActs(s0, { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    expect(s.enemies[0].parts[1].hp).toBe(180 - raw * 2);
  });

  it('部位を狙わなければ本体に全額', () => {
    const s0 = bossBattle();
    const raw = expectedRaw(s0, 20);
    const s = heroActs(s0, attackOn('enemy0'));
    expect(s.enemies[0].hp).toBe(s0.enemies[0].maxHp - raw);
    expect(s.enemies[0].parts.map((p) => p.hp)).toEqual([220, 180]);
  });

  it('右腕を壊すと「叩きつけ」が使えなくなる', () => {
    const s0 = bossBattle();
    s0.enemies[0].parts[0].hp = 1;
    const s = heroActs(s0, attackOn('enemy0', 'rightArm'));
    expect(s.enemies[0].parts[0].broken).toBe(true);
    expect(usableEnemyActions(s.enemies[0]).map((a) => a.id)).toEqual(['sweep', 'roar']);
    const sim = structuredClone(s);
    for (let i = 0; i < 100; i++) expect(chooseEnemyAction(sim, sim.enemies[0]).id).not.toBe('slam');
  });

  it('角を壊すと「歪みの咆哮」が使えなくなり、弱点「雷」が露出する', () => {
    const s0 = bossBattle();
    s0.enemies[0].parts[1].hp = 1;
    let s = heroActs(s0, attackOn('enemy0', 'horn'));
    expect(usableEnemyActions(s.enemies[0]).map((a) => a.id)).toEqual(['sweep', 'slam']);
    expect(s.enemies[0].knownWeaknesses).toEqual(['thunder']);
    // 次のラウンド、露出した弱点を突くとダウンしてワンモア
    s = runUntilInput(s);
    s = execute(planAll(s, { hero: { type: 'skill', skillId: 'thunder', target: { kind: 'enemy', id: 'enemy0' } } }));
    expect(s.phase).toBe('extra');
    expect(s.enemies[0].down).toBe(true);
  });

  it('壊れた部位は狙えない。実行までに壊れていたら本体に当たる', () => {
    const s0 = bossBattle();
    s0.enemies[0].parts[0].broken = true;
    s0.enemies[0].parts[0].hp = 0;
    expect(getPlanError(s0, 'hero', attackOn('enemy0', 'rightArm'))).not.toBeNull();
  });

  it('プレビューで部位と本体へのダメージの幅がわかる', () => {
    const p = previewAction(bossBattle(), 'hero', { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    expect(p.targets[0].partId).toBe('horn');
    expect(p.targets[0].partMin!).toBeGreaterThan(p.targets[0].min);
  });

  it('結果に、破壊した部位と手に入るはずの素材が出る', () => {
    const s0 = bossBattle();
    s0.enemies[0].parts[1].hp = 1;
    const s = heroActs(s0, attackOn('enemy0', 'horn'));
    expect(getBattleResult(s).brokenParts).toEqual([
      { enemyId: 'enemy0', enemyName: '歪みの獣', partId: 'horn', partName: '角', material: '黄の断片' },
    ]);
  });
});
