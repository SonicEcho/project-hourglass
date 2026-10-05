import { describe, expect, it } from 'vitest';
import {
  applyAction,
  availableCombos,
  comboProgress,
  createBattle,
  effectiveHit,
  getActionError,
  previewAction,
  startNextTurn,
} from '../../src/core';
import type { BattleState, CardDef } from '../../src/core';
import { CARDS, COMBOS, CROSS_DRIVE, DISTORTED_BEAST } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

/** 山札の先頭（最初に引く5枚）を指定して戦闘を始める */
function battleWithHand(hand: CardDef[], enemies = [enemy('a'), enemy('b')]): BattleState {
  const filler = Array(20 - hand.length).fill(CARDS.quickStep);
  const s = createBattle(setup({ deck: [...hand, ...filler], combos: COMBOS, allies: [ally('hero', { spd: 50 })], enemies }));
  // シャッフル後の山札を、指定した手札が先に来るよう並べ直す
  s.deck.sort((x, y) => x.uid - y.uid);
  return startNextTurn(s);
}

describe('コンボ', () => {
  it('必要なカードが手札にそろうと使える', () => {
    const s = battleWithHand([CARDS.sword, CARDS.sword, CARDS.sword]);
    expect(availableCombos(s).map((c) => c.id)).toEqual(['tripleSword']);
    expect(getActionError(s, { type: 'combo', comboId: 'tripleSword', target: { kind: 'enemy', id: 'enemy0' } })).toBeNull();
  });

  it('そろっていなければ使えない。何枚そろっているかわかる', () => {
    const s = battleWithHand([CARDS.sword, CARDS.sword, CARDS.fireChip]);
    expect(availableCombos(s)).toEqual([]);
    const triple = COMBOS.find((c) => c.id === 'tripleSword')!;
    expect(comboProgress(s, triple)).toEqual({ have: 2, need: 3 });
    expect(getActionError(s, { type: 'combo', comboId: 'tripleSword', target: { kind: 'enemy', id: 'enemy0' } })).not.toBeNull();
  });

  it('使うと材料のカードをすべて捨て札へ送り、1回の行動として待ち時間を加算する', () => {
    const s0 = battleWithHand([CARDS.sword, CARDS.sword, CARDS.sword]);
    const s = applyAction(s0, { type: 'combo', comboId: 'tripleSword', target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.hand.filter((c) => c.card.id === 'sword')).toHaveLength(0);
    expect(s.discard.filter((c) => c.card.id === 'sword')).toHaveLength(3);
    expect(s.hand).toHaveLength(2);
    expect(eventsOf(s, 'action')[0]).toMatchObject({ actionId: 'tripleSword', name: 'トリプルソード' });
    expect(s.allies[0].ct).toBe(s0.allies[0].ct + 3); // ceil(100 ÷ 50 × 1.5)
  });

  it('トリプルソード：3回攻撃し、耐性を無視する', () => {
    const s0 = battleWithHand([CARDS.sword, CARDS.sword, CARDS.sword], [enemy('slime', {}, { resistances: ['physical'] })]);
    const s = applyAction(s0, { type: 'combo', comboId: 'tripleSword', target: { kind: 'enemy', id: 'enemy0' } });
    const hits = eventsOf(s, 'damage');
    expect(hits).toHaveLength(3);
    expect(hits.every((h) => h.affinity === 'normal')).toBe(true);
  });

  it('連続攻撃の途中で敵が倒れたら、残りは当たらない', () => {
    const s0 = battleWithHand([CARDS.sword, CARDS.sword, CARDS.sword], [enemy('a', { hp: 1 }), enemy('b')]);
    const s = applyAction(s0, { type: 'combo', comboId: 'tripleSword', target: { kind: 'enemy', id: 'enemy0' } });
    expect(eventsOf(s, 'damage')).toHaveLength(1);
    expect(eventsOf(s, 'defeated')).toHaveLength(1);
  });

  it('エレメントバースト：敵ごとに弱点の属性を突き、まとめてダウンさせてワンモア', () => {
    const s0 = battleWithHand(
      [CARDS.fireChip, CARDS.iceChip, CARDS.thunderChip],
      [enemy('a', {}, { weaknesses: ['ice'] }), enemy('b', {}, { weaknesses: ['thunder'], resistances: ['fire'] }), enemy('c')],
    );
    const s = applyAction(s0, { type: 'combo', comboId: 'elementBurst' });
    const hits = eventsOf(s, 'damage');
    expect(hits.map((h) => h.affinity)).toEqual(['weak', 'weak', 'normal']);
    expect(s.enemies.map((e) => e.down)).toEqual([true, true, false]);
    expect(s.enemies[0].knownWeaknesses).toEqual(['ice']);
    expect(s.turn?.oneMoreActive).toBe(true);
  });

  it('属性を選ぶ時、弱点がなければ耐性でない属性を選ぶ', () => {
    const effect = COMBOS.find((c) => c.id === 'elementBurst')!.effects[0];
    if (effect.kind !== 'damage') throw new Error('unexpected');
    const s = battleWithHand([], [enemy('a', {}, { resistances: ['fire'] })]);
    expect(effectiveHit(s.enemies[0], effect)).toEqual({ type: 'ice', affinity: 'normal' });
  });

  it('プレビューでは、まだ判明していない弱点を明かさない', () => {
    const s = battleWithHand([CARDS.fireChip, CARDS.iceChip, CARDS.thunderChip], [enemy('a', {}, { weaknesses: ['ice'] })]);
    const p = previewAction(s, { type: 'combo', comboId: 'elementBurst' });
    expect(p.targets[0].affinity).toBe('normal');
    s.enemies[0].knownWeaknesses = ['ice'];
    expect(previewAction(s, { type: 'combo', comboId: 'elementBurst' }).targets[0].affinity).toBe('weak');
  });

  it('ブレイククラッシュ：部位へのダメージ3倍', () => {
    const s0 = battleWithHand([CARDS.breakArm, CARDS.breakArm], [{ ...DISTORTED_BEAST, stats: { ...DISTORTED_BEAST.stats, spd: 1 } }]);
    const s = applyAction(s0, { type: 'combo', comboId: 'breakCrush', target: { kind: 'enemy', id: 'enemy0', partId: 'rightArm' } });
    const hit = eventsOf(s, 'damage')[0];
    expect(hit.partAmount).toBeGreaterThanOrEqual(hit.amount * 5);
  });

  it('ヒールサークル：味方全体を回復', () => {
    const s0 = battleWithHand([CARDS.recover, CARDS.recover]);
    s0.allies[0].hp = 10;
    const s = applyAction(s0, { type: 'combo', comboId: 'healCircle' });
    expect(eventsOf(s, 'heal')).toHaveLength(1);
    expect(s.allies[0].hp).toBeGreaterThan(10);
  });
});

describe('連携技の特別な効果', () => {
  it('クロスドライブは耐性を無視する', () => {
    const effect = CROSS_DRIVE.effects[0];
    if (effect.kind !== 'damage') throw new Error('unexpected');
    const s = battleWithHand([], [enemy('slime', {}, { resistances: ['physical'] })]);
    expect(effectiveHit(s.enemies[0], effect).affinity).toBe('normal');
  });
});
