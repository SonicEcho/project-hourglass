import { describe, expect, it } from 'vitest';
import { availableCombos, availableHand, comboProgress, effectiveHit, getPlanError, previewAction, setPlan } from '../../src/core';
import type { BattleState, CardDef, EnemyDef } from '../../src/core';
import { CARDS, COMBOS, CROSS_DRIVE, DISTORTED_BEAST } from '../../src/data';
import { ally, battle, enemy, eventsOf, execute, guard, planAll, withHand } from './helpers';

/** ハルト1人（速い）と、指定した手札で計画を始める */
function withCards(hand: CardDef[], enemies: EnemyDef[] = [enemy('a'), enemy('b')]): BattleState {
  return withHand(battle({ allies: [ally('hero', { spd: 50 }), ally('akari')], enemies }), hand);
}
const combo = (comboId: string, target?: { kind: 'enemy'; id: string; partId?: string }) => ({ type: 'combo' as const, comboId, target });

describe('コンボ', () => {
  it('必要なスナップが手札にそろうと使える', () => {
    const s = withCards([CARDS.sword, CARDS.sword, CARDS.sword]);
    expect(availableCombos(s, availableHand(s)).map((c) => c.id)).toEqual(['tripleSword']);
    expect(getPlanError(s, 'hero', combo('tripleSword', { kind: 'enemy', id: 'enemy0' }))).toBeNull();
  });

  it('そろっていなければ使えない。何枚そろっているかわかる', () => {
    const s = withCards([CARDS.sword, CARDS.sword, CARDS.fireChip]);
    const triple = COMBOS.find((c) => c.id === 'tripleSword')!;
    expect(comboProgress(triple, s.hand)).toEqual({ have: 2, need: 3 });
    expect(getPlanError(s, 'hero', combo('tripleSword', { kind: 'enemy', id: 'enemy0' }))).not.toBeNull();
  });

  it('計画で割り当てると、材料のスナップはすべてその仲間が確保する', () => {
    let s = withCards([CARDS.sword, CARDS.sword, CARDS.sword]);
    s = setPlan(s, 'hero', combo('tripleSword', { kind: 'enemy', id: 'enemy0' }));
    expect(availableHand(s)).toHaveLength(0);
    expect(getPlanError(s, 'akari', { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } })).not.toBeNull();
  });

  it('使うと材料のスナップをすべて捨て札へ送る（1人の1回の行動）', () => {
    let s = withCards([CARDS.sword, CARDS.sword, CARDS.sword]);
    s = execute(planAll(s, { hero: combo('tripleSword', { kind: 'enemy', id: 'enemy0' }), akari: guard }));
    expect(s.discard.filter((c) => c.card.id === 'sword')).toHaveLength(3);
    expect(eventsOf(s, 'action').find((e) => e.actorIds[0] === 'hero')).toMatchObject({ actionId: 'tripleSword', name: 'トリプルソード' });
  });

  it('トリプルソード：3回攻撃し、耐性を無視する', () => {
    let s = withCards([CARDS.sword, CARDS.sword, CARDS.sword], [enemy('slime', {}, { resistances: ['physical'] })]);
    s = execute(planAll(s, { hero: combo('tripleSword', { kind: 'enemy', id: 'enemy0' }), akari: guard }));
    const hits = eventsOf(s, 'damage').filter((d) => d.sourceId === 'hero');
    expect(hits).toHaveLength(3);
    expect(hits.every((h) => h.affinity === 'normal')).toBe(true);
  });

  it('連続攻撃の途中で敵が倒れたら、残りは当たらない', () => {
    let s = withCards([CARDS.sword, CARDS.sword, CARDS.sword], [enemy('a', { hp: 1 }), enemy('b')]);
    s = execute(planAll(s, { hero: combo('tripleSword', { kind: 'enemy', id: 'enemy0' }), akari: guard }));
    expect(eventsOf(s, 'damage').filter((d) => d.sourceId === 'hero')).toHaveLength(1);
  });

  it('エレメントバースト：敵ごとに弱点の属性を突き、まとめてダウンさせて延長（1回）', () => {
    let s = withCards(
      [CARDS.fireChip, CARDS.iceChip, CARDS.thunderChip],
      [enemy('a', {}, { weaknesses: ['ice'] }), enemy('b', {}, { weaknesses: ['thunder'], resistances: ['fire'] }), enemy('c')],
    );
    s = execute(planAll(s, { hero: combo('elementBurst'), akari: guard }));
    expect(eventsOf(s, 'damage').filter((d) => d.sourceId === 'hero').map((h) => h.affinity)).toEqual(['weak', 'weak', 'normal']);
    expect(s.enemies.map((e) => e.down)).toEqual([true, true, false]);
    expect(s.phase).toBe('extra');
    expect(eventsOf(s, 'oneMore')).toHaveLength(1);
  });

  it('属性を選ぶ時、弱点がなければ耐性でない属性を選ぶ', () => {
    const effect = COMBOS.find((c) => c.id === 'elementBurst')!.effects[0];
    if (effect.kind !== 'damage') throw new Error('unexpected');
    const s = withCards([], [enemy('a', {}, { resistances: ['fire'] })]);
    expect(effectiveHit(s.enemies[0], effect)).toEqual({ type: 'ice', affinity: 'normal' });
  });

  it('プレビューでは、まだ判明していない弱点を明かさない', () => {
    const s = withCards([CARDS.fireChip, CARDS.iceChip, CARDS.thunderChip], [enemy('a', {}, { weaknesses: ['ice'] })]);
    expect(previewAction(s, 'hero', combo('elementBurst')).targets[0].affinity).toBe('normal');
    s.enemies[0].knownWeaknesses = ['ice'];
    expect(previewAction(s, 'hero', combo('elementBurst')).targets[0].affinity).toBe('weak');
  });

  it('ブレイククラッシュ：部位へのダメージ3倍', () => {
    let s = withCards([CARDS.breakArm, CARDS.breakArm], [{ ...DISTORTED_BEAST, stats: { ...DISTORTED_BEAST.stats, spd: 1 } }]);
    s = execute(planAll(s, { hero: combo('breakCrush', { kind: 'enemy', id: 'enemy0', partId: 'rightArm' }), akari: guard }));
    const hit = eventsOf(s, 'damage').find((d) => d.sourceId === 'hero')!;
    expect(hit.partAmount).toBeGreaterThanOrEqual(hit.amount * 5);
  });

  it('ヒールサークル：味方全体を回復', () => {
    let s = withCards([CARDS.recover, CARDS.recover]);
    s.allies[0].hp = 10;
    s.allies[1].hp = 10;
    s = execute(planAll(s, { hero: combo('healCircle'), akari: guard }));
    expect(eventsOf(s, 'heal')).toHaveLength(2);
  });
});

describe('連携技の特別な効果', () => {
  it('クロスドライブは耐性を無視する', () => {
    const effect = CROSS_DRIVE.effects[0];
    if (effect.kind !== 'damage') throw new Error('unexpected');
    const s = withCards([], [enemy('slime', {}, { resistances: ['physical'] })]);
    expect(effectiveHit(s.enemies[0], effect).affinity).toBe('normal');
  });
});
