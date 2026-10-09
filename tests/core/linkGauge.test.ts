import { describe, expect, it } from 'vitest';
import { declineExtra, getPlanError, isOffBalance, linkReady, passBaton, previewAction, runUntilInput } from '../../src/core';
import type { BattleState } from '../../src/core';
import { LINK_GAUGE_GAIN, LINK_GAUGE_MAX, SKILLS } from '../../src/data';
import { ally, battle, enemy, eventsOf, execute, fullGauge, guard, planAll } from './helpers';

// 連携技のつながりゲージ（段階26の調整2）
const fire = (id: string) => ({ type: 'skill' as const, skillId: 'fire', target: { kind: 'enemy' as const, id } });
const afterglow = { type: 'link' as const, linkId: 'afterglow' };

/** ハルト（速い・火）とあかり。敵2体は火が弱点で遅い */
function duo(weak = true): BattleState {
  const weaknesses = weak ? (['fire'] as const) : [];
  return battle({
    allies: [ally('hero', { spd: 50 }, [SKILLS.fire]), ally('akari', { spd: 40, mag: 20 })],
    enemies: [enemy('a', {}, { weaknesses: [...weaknesses] }), enemy('b', {}, { weaknesses: [...weaknesses] })],
  });
}

describe('連携技のつながりゲージ', () => {
  it('最初は空で、満タンでないと連携技を選べない', () => {
    const s = duo();
    expect(s.linkGauge).toBe(0);
    expect(linkReady(s)).toBe(false);
    expect(getPlanError(s, 'hero', afterglow)).toBe('link gauge is not full');
    expect(getPlanError(fullGauge(s), 'hero', afterglow)).toBeNull();
  });

  it('弱点を突く・ダウンさせると貯まる。バトンタッチでも貯まる', () => {
    let s = execute(planAll(duo(), { hero: fire('enemy0'), akari: guard }));
    expect(s.phase).toBe('extra');
    expect(s.linkGauge).toBe(LINK_GAUGE_GAIN.weak + LINK_GAUGE_GAIN.down);
    s = passBaton(s, 'akari');
    expect(s.linkGauge).toBe(LINK_GAUGE_GAIN.weak + LINK_GAUGE_GAIN.down + LINK_GAUGE_GAIN.baton);
  });

  it('弱点でなければ貯まらない（敵の攻撃を受けた分だけ貯まる）', () => {
    const s = execute(planAll(duo(false), { hero: fire('enemy0'), akari: guard }));
    const hurt = eventsOf(s, 'damage').filter((d) => d.targetId === 'hero' || d.targetId === 'akari').length;
    expect(hurt).toBeGreaterThan(0);
    expect(s.linkGauge).toBe(hurt * LINK_GAUGE_GAIN.hurt);
  });

  it('部位を壊すと貯まる', () => {
    const s0 = battle({
      allies: [ally('hero', { spd: 50, atk: 999 }), ally('akari')],
      enemies: [enemy('boss', {}, { parts: [{ id: 'arm', name: '腕', hp: 1, material: 'x' }] })],
    });
    const s = execute(planAll(s0, { hero: { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'arm' } }, akari: guard }));
    expect(eventsOf(s, 'partBreak')).toHaveLength(1);
    const hurt = eventsOf(s, 'damage').filter((d) => d.targetId === 'hero' || d.targetId === 'akari').length;
    expect(s.linkGauge).toBe(LINK_GAUGE_GAIN.partBreak + hurt * LINK_GAUGE_GAIN.hurt);
  });

  it('満タンになると知らせる。満タンより先には貯まらない', () => {
    const s0 = duo();
    s0.linkGauge = LINK_GAUGE_MAX - 5;
    const s = execute(planAll(s0, { hero: fire('enemy0'), akari: guard }));
    expect(s.linkGauge).toBe(LINK_GAUGE_MAX);
    expect(eventsOf(s, 'linkReady')).toHaveLength(1);
  });

  it('使うと0に戻り、連携技そのものでは貯まらない。弱点を突けば敵全体がダウンし、味方全体を回復する', () => {
    const s0 = fullGauge(duo());
    s0.allies.forEach((a) => (a.hp = 50));
    const s = execute(planAll(s0, { hero: afterglow }));
    expect(eventsOf(s, 'action').some((e) => e.actionId === 'afterglow')).toBe(true);
    expect(s.linkGauge).toBe(0);
    expect(eventsOf(s, 'down')).toHaveLength(2);
    expect(eventsOf(s, 'heal').map((h) => h.targetId).sort()).toEqual(['akari', 'hero']);
  });

  it('ダウン中の敵には、連携技のダメージが2倍（段階26の調整4）', () => {
    const s = fullGauge(duo(false));
    const normal = previewAction(s, 'hero', afterglow).targets.find((t) => t.unitId === 'enemy0')!;
    s.enemies[0].down = true;
    const downed = previewAction(s, 'hero', afterglow).targets.find((t) => t.unitId === 'enemy0')!;
    expect(downed.min).toBeGreaterThanOrEqual(normal.min * 2 - 1);
    expect(downed.min).toBeLessThanOrEqual(normal.min * 2 + 1);
  });

  it('連携技は、ダウンしている敵が立ち上がる前に当たる（必ず最初に動く）', () => {
    // 敵はとても速いが、連携技はその前に動く。ラウンドの始めにダウン中の敵には2倍で当たり、敵は立ち上がりに番を使う
    const s0 = fullGauge(
      battle({
        allies: [ally('hero', { spd: 5 }), ally('akari', { spd: 5 })],
        enemies: [enemy('a', { spd: 99 })],
      }),
    );
    s0.enemies[0].down = true;
    const s = execute(planAll(s0, { hero: afterglow }));
    const order = s.log.filter((e) => e.type === 'action' || e.type === 'standUp').map((e) => e.type);
    expect(order[0]).toBe('action');
    expect(order).toContain('standUp');
  });

  it('先にダウンさせた敵は、立ち上がっても次のラウンドの始めは体勢が崩れたまま。連携技は動く前に2倍で当たる（段階26の調整5）', () => {
    // ハルトが速く、敵より先に弱点でダウンさせる → 敵はそのラウンドの番で立ち上がる
    let s = execute(planAll(duo(), { hero: fire('enemy0'), akari: guard }));
    s = runUntilInput(declineExtra(s));
    expect(s.phase).toBe('plan');
    expect(s.enemies[0].down).toBe(false);
    expect(isOffBalance(s.enemies[0])).toBe(true);
    expect(isOffBalance(s.enemies[1])).toBe(false);
    // 次のラウンド：連携技のプレビューは、崩れた敵だけ2倍
    s = fullGauge(s);
    const p = previewAction(s, 'hero', afterglow).targets;
    const a = p.find((t) => t.unitId === 'enemy0')!;
    const b = p.find((t) => t.unitId === 'enemy1')!;
    expect(a.min).toBeGreaterThanOrEqual(b.min * 2 - 1);
    // 敵が動けば、体勢は戻る
    s = execute(planAll(s, { hero: guard, akari: guard }));
    expect(isOffBalance(s.enemies[0])).toBe(false);
  });

  it('連携技がない（組む仲間がいない）パーティでは貯まらない', () => {
    const s = execute(
      planAll(battle({ allies: [ally('hero', { spd: 50 }, [SKILLS.fire])], enemies: [enemy('a', {}, { weaknesses: ['fire'] })], links: [] }), { hero: fire('enemy0') }),
    );
    expect(s.linkGauge).toBe(0);
  });
});
