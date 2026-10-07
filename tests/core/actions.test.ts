import { describe, expect, it } from 'vitest';
import { getPlanError, setPlan } from '../../src/core';
import { CARDS, SKILLS } from '../../src/data';
import { ally, battle, enemy, eventsOf, execute, guard, planAll, withHand } from './helpers';

function heroBattle() {
  return battle({
    allies: [ally('hero', { spd: 50, mp: 20 }, [SKILLS.fire, SKILLS.shuffle, SKILLS.swap, SKILLS.careAll]), ally('akari', { hp: 100, spd: 1 })],
    enemies: [enemy('a'), enemy('b')],
  });
}

describe('魔法・スキル', () => {
  it('MPを払って使う', () => {
    const s = execute(planAll(heroBattle(), { hero: { type: 'skill', skillId: 'fire', target: { kind: 'enemy', id: 'enemy0' } }, akari: guard }));
    expect(s.allies[0].mp).toBe(14);
  });

  it('対象が必要な行動は、対象がないと選べない', () => {
    const s = heroBattle();
    expect(getPlanError(s, 'hero', { type: 'attack', target: { kind: 'ally', id: 'akari' } })).not.toBeNull();
    expect(getPlanError(s, 'hero', { type: 'skill', skillId: 'fire' })).not.toBeNull();
  });

  it('シャッフル：手札を捨てて5枚引き直す。後で行動する仲間が確保したスナップは残る', () => {
    let s = withHand(heroBattle(), [CARDS.sword, CARDS.fireChip, CARDS.iceChip]);
    const reserved = s.hand[0].uid;
    const others = s.hand.slice(1).map((c) => c.uid);
    s = planAll(s, { hero: { type: 'skill', skillId: 'shuffle' }, akari: { type: 'card', cardUid: reserved, target: { kind: 'enemy', id: 'enemy0' } } });
    s = execute(s);
    expect(eventsOf(s, 'discardHand')[0].cardUids.sort()).toEqual(others.sort());
    // あかりは確保していたソードを使えた
    expect(eventsOf(s, 'action').some((e) => e.actorIds[0] === 'akari' && e.actionId === 'sword')).toBe(true);
  });

  it('すりかえ：捨て札から選んだスナップを1枚手札に加える', () => {
    let s = heroBattle();
    s.discard.push(s.deck.shift()!);
    const picked = s.discard[0].uid;
    s = execute(planAll(s, { hero: { type: 'skill', skillId: 'swap', pickCardUid: picked }, akari: guard }));
    expect(s.hand.some((c) => c.uid === picked)).toBe(true);
  });

  it('すりかえは捨て札から選ばないと選べない', () => {
    expect(getPlanError(heroBattle(), 'hero', { type: 'skill', skillId: 'swap' })).not.toBeNull();
  });

  it('ケアオール：生きている味方全体を回復し、最大HPを超えない', () => {
    const s0 = heroBattle();
    s0.allies[0].hp = 50;
    s0.allies[1].hp = 95;
    const s = execute(planAll(s0, { hero: { type: 'skill', skillId: 'careAll' }, akari: guard }));
    // 30 × 10 ÷ 20 = 15
    expect(eventsOf(s, 'heal').map((h) => h.hpAfter)).toEqual([65, 100]);
  });
});

describe('スナップ', () => {
  it('ワイドショット：敵全体にダメージ', () => {
    let s = withHand(heroBattle(), [CARDS.wideShot]);
    s = execute(planAll(s, { hero: { type: 'card', cardUid: s.hand[0].uid }, akari: guard }));
    expect(eventsOf(s, 'damage').filter((d) => d.sourceId === 'hero').map((e) => e.targetId)).toEqual(['enemy0', 'enemy1']);
  });

  it('スナップは使用者の能力値で計算する', () => {
    let s = withHand(heroBattle(), [CARDS.recover]);
    s.allies[0].mag = 40;
    s.allies[1].hp = 10;
    s = execute(planAll(s, { hero: { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'ally', id: 'akari' } }, akari: guard }));
    // 40 × 40 ÷ 20 = 80
    expect(eventsOf(s, 'heal')[0].amount).toBe(80);
  });
});

describe('状態を書き換えない', () => {
  it('setPlan や実行は元の状態を変えずに新しい状態を返す', () => {
    const s = heroBattle();
    const snapshot = structuredClone(s);
    execute(planAll(s, { hero: guard, akari: guard }));
    setPlan(s, 'hero', guard);
    expect(s).toEqual(snapshot);
  });
});
