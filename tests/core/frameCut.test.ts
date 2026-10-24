import { describe, expect, it } from 'vitest';
import type { BattleState, EnemyActionDef, PlayerAction } from '../../src/core';
import { declineExtra, getRoundOrder, runUntilInput } from '../../src/core';
import { ally, attackOn, battle, enemy, eventsOf, execute, guard, planAll } from './helpers';

// 切り取り（段階107。カイ）：ためてねらいを予告し、次のラウンドは一番前（防御より前）に動いて、その仲間のそのラウンドの行動を抜く
const cut: EnemyActionDef = { id: 'frameCut', name: '切り取り', target: 'ally', type: 'physical', power: 10, weight: 1.0, charge: true, cutsFrame: true, requiresPart: 'blade' };
const blade = { id: 'blade', name: '枠の刃', hp: 1, material: '枠のかけら', revealsWeakness: [] };

function kaiBattle(kaiSpd: number, extra: { weaknesses?: ('fire' | 'ice' | 'thunder')[] } = {}): BattleState {
  return battle({
    allies: [ally('hero', { spd: 20, hp: 999 }), ally('akari', { spd: 10, hp: 999 })],
    enemies: [enemy('kai', { spd: kaiSpd }, { actions: [cut], parts: [blade], weaknesses: extra.weaknesses ?? [] })],
  });
}

/** 延長で止まったら見送って、入力が要るまで進める */
function settle(s: BattleState): BattleState {
  let out = s;
  for (let i = 0; i < 10 && out.phase === 'extra'; i++) out = runUntilInput(declineExtra(out));
  return out;
}

/** 1ラウンド目：全員が防御し、カイ（一番速い）が切り取りをためる */
function charged(): BattleState {
  const s = settle(execute(planAll(kaiBattle(50), { hero: guard, akari: guard })));
  expect(s.round).toBe(2);
  return s;
}

const hitKai: PlayerAction = attackOn('enemy0');

describe('切り取り（段階107）', () => {
  it('ためた時に、ねらう仲間を決めて予告する', () => {
    const s = charged();
    const kai = s.enemies[0];
    expect(kai.charging).toBe('frameCut');
    expect(['hero', 'akari']).toContain(kai.chargeTarget);
    expect(eventsOf(s, 'charge')[0].targetId).toBe(kai.chargeTarget);
  });

  it('次のラウンドは、防御する仲間より前の一番前に来る', () => {
    const s = planAll(charged(), { hero: guard, akari: guard });
    const order = getRoundOrder(s);
    expect(order[0]).toMatchObject({ kind: 'enemy', ids: ['enemy0'], cut: true });
    expect(order.slice(1).every((o) => o.kind === 'ally' && o.guard)).toBe(true);
  });

  it('ねらった仲間のそのラウンドの行動を抜く（ほかの仲間は動く）', () => {
    const s0 = charged();
    s0.enemies[0].chargeTarget = 'hero';
    const from = s0.log.length;
    const s = settle(execute(planAll(s0, { hero: hitKai, akari: hitKai })));
    expect(eventsOf(s, 'frameCut', from)).toEqual([{ type: 'frameCut', enemyId: 'enemy0', allyIds: ['hero'] }]);
    const acted = eventsOf(s, 'action', from).flatMap((e) => e.actorIds);
    expect(acted).not.toContain('hero');
    expect(acted).toContain('akari');
    // 切られた行動は、ラウンドの終わりに失われる
    expect(s.enemies[0].cutPlan).toBeNull();
  });

  it('防御を選んでいても、防御より前に切られて防御もできない', () => {
    const s0 = charged();
    s0.enemies[0].chargeTarget = 'hero';
    const from = s0.log.length;
    const s = settle(execute(planAll(s0, { hero: guard, akari: guard })));
    expect(eventsOf(s, 'frameCut', from)[0].allyIds).toEqual(['hero']);
    const kaiHit = eventsOf(s, 'damage', from).find((e) => e.targetId === 'hero');
    expect(kaiHit).toBeDefined();
    expect(eventsOf(s, 'guard', from).some((e) => e.actorId === 'hero')).toBe(false);
    expect(eventsOf(s, 'guard', from).some((e) => e.actorId === 'akari')).toBe(true);
  });

  it('ためたラウンドの残りでダウンさせると、切り取りは来ない', () => {
    // カイが先にためて、遅い仲間が弱点でダウンさせる
    const s0 = kaiBattle(50, { weaknesses: ['fire'] });
    s0.allies[0].skills = [{ id: 'fire', name: 'ファイア', mp: 0, weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'fire', power: 10 }] }];
    s0.allies.forEach((a) => (a.spd = 1));
    const s = settle(execute(planAll(s0, { hero: { type: 'skill', skillId: 'fire', target: { kind: 'enemy', id: 'enemy0' } }, akari: guard })));
    expect(eventsOf(s, 'chargeBroken')[0]?.reason).toBe('down');
    expect(s.enemies[0].chargeTarget).toBeNull();
  });

  it('ためたラウンドの残りで枠の刃を壊すと、切り取りは封じられる', () => {
    const s0 = kaiBattle(50);
    s0.allies.forEach((a) => (a.spd = 1));
    const s = settle(execute(planAll(s0, { hero: attackOn('enemy0', 'blade'), akari: guard })));
    expect(eventsOf(s, 'chargeBroken')[0]?.reason).toBe('sealed');
    expect(s.enemies[0].charging).toBeNull();
    expect(s.enemies[0].chargeTarget).toBeNull();
  });

  it('切られたラウンドの中で枠の刃を壊すと、切られた行動が戻って動ける', () => {
    const s0 = charged();
    s0.enemies[0].chargeTarget = 'hero';
    const from = s0.log.length;
    const s = settle(execute(planAll(s0, { hero: hitKai, akari: attackOn('enemy0', 'blade') })));
    const types = s.log.slice(from).map((e) => e.type);
    expect(types).toContain('frameCut');
    expect(eventsOf(s, 'frameRestored', from)).toEqual([{ type: 'frameRestored', enemyId: 'enemy0', allyIds: ['hero'] }]);
    const restoredAt = types.indexOf('frameRestored');
    const heroActs = s.log.slice(from).findIndex((e, i) => i > restoredAt && e.type === 'action' && e.actorIds.includes('hero'));
    expect(heroActs).toBeGreaterThan(restoredAt);
  });

  it('ねらった仲間が倒れていたら、ほかの生きている仲間をねらう', () => {
    const s0 = charged();
    s0.enemies[0].chargeTarget = 'hero';
    s0.allies[0].hp = 0;
    const from = s0.log.length;
    const s = settle(execute(planAll(s0, { akari: guard })));
    expect(eventsOf(s, 'frameCut', from)[0]?.allyIds).toEqual(['akari']);
  });
});

describe('負け戦で切り取りを見せる（段階107b）', () => {
  const hit: EnemyActionDef = { id: 'hit', name: 'hit', target: 'ally', type: 'physical', power: 10, weight: 1.0 };
  const noBlade: EnemyActionDef = { ...cut, requiresPart: undefined };

  it('最初の行動を決めている敵は、乱数を使わずにそれを選ぶ（2回目からはふだんどおり）', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const s0 = battle({ seed, allies: [ally('hero', { hp: 999 })], enemies: [enemy('kai', { spd: 50 }, { actions: [hit, noBlade], opening: 'frameCut' })] });
      const s = execute(planAll(s0, { hero: guard }));
      expect(eventsOf(s, 'charge')[0]?.actionId, `seed ${seed}`).toBe('frameCut');
      expect(s.enemies[0].opening).toBeNull();
    }
  });

  it('HP による打ち切りは afterRound のラウンドから（1ラウンド目に HP を削っても、2ラウンド目の切り取りまで続く）', () => {
    const s0 = battle({
      allies: [ally('hero', { spd: 1, hp: 999 })],
      enemies: [enemy('kai', { spd: 50, hp: 100 }, { actions: [noBlade], opening: 'frameCut' })],
      cutoff: { rounds: 4, enemyHpRatio: 0.99, afterRound: 2 },
    });
    const r1 = execute(planAll(s0, { hero: attackOn('enemy0') }));
    // 1ラウンド目で打ち切りの線（99%）を下回っているが、倒れてはいない
    expect(r1.enemies[0].hp).toBeLessThan(99);
    expect(r1.enemies[0].hp).toBeGreaterThan(0);
    expect(r1.outcome).toBe('ongoing');
    expect(r1.round).toBe(2);
    const r2 = execute(planAll(r1, { hero: attackOn('enemy0') }));
    expect(eventsOf(r2, 'frameCut').length + eventsOf(r2, 'action').filter((e) => e.actionId === 'frameCut').length).toBeGreaterThan(0);
    expect(r2.outcome).toBe('cutoff');
  });
});
