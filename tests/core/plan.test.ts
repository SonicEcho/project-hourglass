import { describe, expect, it } from 'vitest';
import {
  availableHand,
  clearPlan,
  getPlanError,
  getRoundOrder,
  getSupportError,
  isPlanComplete,
  planOf,
  resolveSearch,
  setPlan,
  startExecution,
  step,
  useSupport,
} from '../../src/core';
import { CARDS, SKILLS } from '../../src/data';
import { ally, attackOn, battle, enemy, eventsOf, execute, fullGauge, guard, planAll, withHand } from './helpers';

const three = () =>
  battle({
    allies: [ally('hero', {}, [SKILLS.fire]), ally('akari'), ally('mio')],
    enemies: [enemy('a'), enemy('b')],
  });
const sword = (uid: number) => ({ type: 'card' as const, cardUid: uid, target: { kind: 'enemy' as const, id: 'enemy0' } });

describe('計画', () => {
  it('1ラウンド目の計画から始まる', () => {
    const s = three();
    expect(s.phase).toBe('plan');
    expect(s.round).toBe(1);
  });

  it('1人1つの行動。選び直すと置き換わる', () => {
    let s = setPlan(three(), 'hero', guard);
    s = setPlan(s, 'hero', attackOn('enemy1'));
    expect(s.plans).toHaveLength(1);
    expect(planOf(s, 'hero')?.action).toEqual(attackOn('enemy1'));
  });

  it('同じスナップを2人に割り当てられない。選び直せばスナップが空く', () => {
    let s = withHand(three(), [CARDS.sword]);
    const uid = s.hand[0].uid;
    s = setPlan(s, 'hero', sword(uid));
    expect(availableHand(s)).toHaveLength(0);
    expect(getPlanError(s, 'akari', sword(uid))).not.toBeNull();
    // 本人は選び直せる
    expect(getPlanError(s, 'hero', sword(uid))).toBeNull();
    s = setPlan(s, 'hero', guard);
    expect(getPlanError(s, 'akari', sword(uid))).toBeNull();
  });

  it('計画を取り消せる', () => {
    let s = setPlan(three(), 'hero', guard);
    s = clearPlan(s, 'hero');
    expect(planOf(s, 'hero')).toBeUndefined();
  });

  it('全員の行動が決まるまで実行できない', () => {
    let s = planAll(three(), { hero: guard, akari: guard });
    expect(isPlanComplete(s)).toBe(false);
    expect(() => startExecution(s)).toThrow();
    s = setPlan(s, 'mio', guard);
    expect(isPlanComplete(s)).toBe(true);
    expect(startExecution(s).phase).toBe('execute');
  });

  it('HPが0の仲間は行動を選べず、計画しなくても実行できる', () => {
    const s0 = three();
    s0.allies[2].hp = 0;
    expect(getPlanError(s0, 'mio', guard)).not.toBeNull();
    const s = planAll(s0, { hero: guard, akari: guard });
    expect(isPlanComplete(s)).toBe(true);
    expect(getRoundOrder(s).some((e) => e.ids.includes('mio'))).toBe(false);
  });

  it('魔法・スキルはMPが足りないと選べない', () => {
    const s0 = three();
    s0.allies[0].mp = 1;
    expect(getPlanError(s0, 'hero', { type: 'skill', skillId: 'fire', target: { kind: 'enemy', id: 'enemy0' } })).toBe('not enough MP');
  });
});

describe('連携技の計画', () => {
  const link = { type: 'link' as const, linkId: 'crossDrive' };

  it('ハルトとみおの2人分の行動を使う', () => {
    const s = setPlan(fullGauge(three()), 'hero', link);
    expect(planOf(s, 'hero')).toBe(planOf(s, 'mio'));
    expect(planOf(s, 'hero')?.actorIds).toEqual(['hero', 'mio']);
    expect(planAll(s, { akari: guard }).plans).toHaveLength(2);
  });

  it('参加者でない仲間は選べない。相方が倒れていると選べない', () => {
    expect(getPlanError(fullGauge(three()), 'akari', link)).not.toBeNull();
    const s = fullGauge(three());
    s.allies[2].hp = 0;
    expect(getPlanError(s, 'hero', link)).not.toBeNull();
  });

  it('相方が別の行動を選び直すと、連携技は取り消される', () => {
    let s = setPlan(fullGauge(three()), 'hero', link);
    s = setPlan(s, 'mio', guard);
    expect(planOf(s, 'hero')).toBeUndefined();
    expect(planOf(s, 'mio')?.action).toEqual(guard);
  });

  it('実行すると敵全体にダメージ、手札を2枚引く', () => {
    let s = planAll(fullGauge(three()), { hero: link, akari: guard });
    const hand = s.hand.length;
    s = startExecution(s);
    while (s.phase === 'execute' && !eventsOf(s, 'action').some((e) => e.actionId === 'crossDrive')) {
      s = step(s);
    }
    expect(eventsOf(s, 'damage').filter((d) => d.sourceId === 'hero').map((d) => d.targetId)).toEqual(['enemy0', 'enemy1']);
    expect(s.hand.length).toBe(hand + 2);
  });
});

describe('サポートスナップ', () => {
  it('計画の途中でその場で使い、行動枠を使わない', () => {
    let s = withHand(three(), [CARDS.draw, CARDS.sword]);
    s = useSupport(s, s.hand[0].uid);
    expect(s.hand.map((c) => c.card.id)).toContain('sword');
    expect(s.hand).toHaveLength(1 + 2);
    expect(s.plans).toHaveLength(0);
    expect(s.discard.some((c) => c.card.id === 'draw')).toBe(true);
  });

  it('行動としては選べない', () => {
    const s = withHand(three(), [CARDS.draw]);
    expect(getPlanError(s, 'hero', { type: 'card', cardUid: s.hand[0].uid })).not.toBeNull();
  });

  it('1ラウンドにチーム全体で1枚まで', () => {
    let s = withHand(three(), [CARDS.draw, CARDS.search]);
    s = useSupport(s, s.hand[0].uid);
    expect(getSupportError(s, s.hand.find((c) => c.card.id === 'search')!.uid)).not.toBeNull();
  });

  it('次のラウンドにはまた使える', () => {
    let s = withHand(three(), [CARDS.draw, CARDS.search]);
    s = useSupport(s, s.hand[0].uid);
    s = planAll(s, { hero: guard, akari: guard, mio: guard });
    s = execute(s);
    expect(s.round).toBe(2);
    expect(getSupportError(s, s.hand.find((c) => c.card.id === 'search')!.uid)).toBeNull();
  });

  it('サーチ：山札の上から3枚を見て1枚を手札へ。残りは山札の一番下へ', () => {
    let s = withHand(three(), [CARDS.search]);
    const top3 = s.deck.slice(0, 3).map((c) => c.uid);
    s = useSupport(s, s.hand[0].uid);
    expect(s.searchChoice?.map((c) => c.uid)).toEqual(top3);
    // 選ぶまでは計画を進められない
    expect(getPlanError(s, 'hero', guard)).not.toBeNull();
    s = resolveSearch(s, top3[1]);
    expect(s.searchChoice).toBeNull();
    expect(s.hand.map((c) => c.uid)).toContain(top3[1]);
    expect(s.deck.slice(-2).map((c) => c.uid)).toEqual([top3[0], top3[2]]);
  });

  it('クイックステップは仲間を選ぶ必要がある', () => {
    const s = withHand(three(), [CARDS.quickStep]);
    expect(getSupportError(s, s.hand[0].uid)).not.toBeNull();
    expect(getSupportError(s, s.hand[0].uid, 'akari')).toBeNull();
  });

  it('計画中でなければ使えない', () => {
    let s = withHand(three(), [CARDS.draw]);
    s = startExecution(planAll(s, { hero: guard, akari: guard, mio: guard }));
    expect(getSupportError(s, s.hand[0].uid)).not.toBeNull();
  });
});

