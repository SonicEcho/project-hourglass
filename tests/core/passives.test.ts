import { describe, expect, it } from 'vitest';
import type { BattleState, CharacterDef, PassiveEffect, PlayerAction } from '../../src/core';
import { batonMultiplier, cappedPassives, getRoundOrder, oneMoreDrawCount, passBaton, passiveRate, passiveTotal, previewAction, skillMpCost } from '../../src/core';
import { CARDS, PASSIVE_CAPS, SKILLS } from '../../src/data';
import { ally, battle, enemy, eventsOf, execute, guard, planAll, withHand } from './helpers';

// 特性（ムーブメントの効果ギアと狂い）が戦闘で効くこと

const withPassives = (c: CharacterDef, passives: PassiveEffect[]): CharacterDef => ({ ...c, passives });

function heroBattle(passives: PassiveEffect[], enemies = [enemy('a')]): BattleState {
  return battle({
    allies: [withPassives(ally('hero', { spd: 50 }, [SKILLS.fire, SKILLS.ice]), passives), ally('akari', {}, [SKILLS.fire])],
    enemies,
  });
}

const fireOn = (id: string, partId?: string): PlayerAction => ({ type: 'skill', skillId: 'fire', target: { kind: 'enemy', id, partId } });
const iceOn = (id: string): PlayerAction => ({ type: 'skill', skillId: 'ice', target: { kind: 'enemy', id } });
const fireBoost: PassiveEffect = { kind: 'elementBoost', element: 'fire', rate: 0.25 };

describe('特性：ダメージの割増し', () => {
  it('属性ブーストは、その属性のダメージを上げる', () => {
    const plain = previewAction(heroBattle([]), 'hero', fireOn('enemy0')).targets[0];
    const boosted = previewAction(heroBattle([fireBoost]), 'hero', fireOn('enemy0')).targets[0];
    expect(boosted.min).toBe(Math.floor(plain.min * 1.25));
  });

  it('属性ブーストは、他の属性には効かない', () => {
    const plain = previewAction(heroBattle([]), 'hero', iceOn('enemy0')).targets[0];
    const boosted = previewAction(heroBattle([fireBoost]), 'hero', iceOn('enemy0')).targets[0];
    expect(boosted.min).toBe(plain.min);
  });

  it('実際のダメージにも乗る（同じシードなら 1.25 倍前後）', () => {
    const dmg = (p: PassiveEffect[]) => eventsOf(execute(planAll(heroBattle(p), { hero: fireOn('enemy0'), akari: guard })), 'damage').find((e) => e.sourceId === 'hero')!.amount;
    const plain = dmg([]);
    expect(dmg([fireBoost])).toBeGreaterThanOrEqual(Math.floor(plain * 1.25) - 1);
  });

  it('同じ特性が2つあれば重なる', () => {
    const plain = previewAction(heroBattle([]), 'hero', fireOn('enemy0')).targets[0];
    const twice = previewAction(heroBattle([fireBoost, fireBoost]), 'hero', fireOn('enemy0')).targets[0];
    expect(twice.min).toBe(Math.floor(plain.min * 1.5));
  });

  it('ブレイカーは、部位へのダメージだけを上げる', () => {
    const boss = () => [enemy('boss', {}, { parts: [{ id: 'arm', name: '腕', hp: 999, material: 'x' }] })];
    const plain = previewAction(heroBattle([], boss()), 'hero', fireOn('enemy0', 'arm')).targets[0];
    const boosted = previewAction(heroBattle([{ kind: 'partBoost', rate: 0.5 }], boss()), 'hero', fireOn('enemy0', 'arm')).targets[0];
    // ファイアの部位ダメージ倍率は1なので、部位へのダメージは本体に当てた時の値そのもの
    expect(boosted.partMin).toBe(Math.floor(plain.partMin! * 1.5));
    expect(boosted.min).toBe(plain.min);
  });

  it('コンボブーストは、コンボにだけ効く', () => {
    const cards = [CARDS.fireChip, CARDS.iceChip, CARDS.thunderChip];
    const combo: PlayerAction = { type: 'combo', comboId: 'elementBurst' };
    const card = (s: BattleState): PlayerAction => ({ type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } });
    const plainS = withHand(heroBattle([]), cards);
    const boostS = withHand(heroBattle([{ kind: 'comboBoost', rate: 0.25 }]), cards);
    expect(previewAction(boostS, 'hero', combo).targets[0].min).toBe(Math.floor(previewAction(plainS, 'hero', combo).targets[0].min * 1.25));
    expect(previewAction(boostS, 'hero', card(boostS)).targets[0].min).toBe(previewAction(plainS, 'hero', card(plainS)).targets[0].min);
  });
});

describe('特性：延長とバトン', () => {
  const weakEnemies = () => [enemy('a', {}, { weaknesses: ['fire'] }), enemy('b', {}, { weaknesses: ['fire'] })];

  it('延長ドローがあると、延長の時に引く枚数が増える', () => {
    const s0 = heroBattle([{ kind: 'oneMoreDraw', count: 1 }], weakEnemies());
    const s = execute(planAll(s0, { hero: fireOn('enemy0'), akari: guard }));
    expect(s.phase).toBe('extra');
    expect(s.hand).toHaveLength(s0.hand.length + 2);
  });

  it('バトンレシーバーがあると、バトンを受けた時の倍率が上がる（1.25 → 1.5）', () => {
    const make = (p: PassiveEffect[]) =>
      battle({
        allies: [ally('hero', { spd: 50 }, [SKILLS.fire]), withPassives(ally('akari', {}, [SKILLS.fire]), p)],
        enemies: weakEnemies(),
      });
    const toBaton = (s: BattleState) => passBaton(execute(planAll(s, { hero: fireOn('enemy0'), akari: guard })), 'akari');
    const plain = previewAction(toBaton(make([])), 'akari', fireOn('enemy1')).targets[0];
    const boosted = previewAction(toBaton(make([{ kind: 'batonBoost', rate: 0.25 }])), 'akari', fireOn('enemy1')).targets[0];
    // 1.25倍と1.5倍の差（弱点1.5倍も乗る）
    expect(boosted.min).toBeGreaterThan(plain.min);
    expect(boosted.min / plain.min).toBeCloseTo(1.5 / 1.25, 1);
  });
});

describe('特性：MP・先制', () => {
  it('MPセーブで魔法・スキルのMP消費が減る（最低1）', () => {
    const hero = { passives: [{ kind: 'mpSave', amount: 1 } as PassiveEffect] };
    expect(skillMpCost(hero, SKILLS.fire)).toBe(SKILLS.fire.mp - 1);
    // 段階54：MP の消費を減らすのは −2 まで（上限）
    expect(skillMpCost({ passives: [{ kind: 'mpSave', amount: 99 }] }, SKILLS.fire)).toBe(Math.max(1, SKILLS.fire.mp - 2));
    expect(skillMpCost({ passives: [{ kind: 'mpSave', amount: 99 }] }, { ...SKILLS.fire, mp: 2 })).toBe(1);
    const s = execute(planAll(heroBattle([{ kind: 'mpSave', amount: 1 }]), { hero: fireOn('enemy0'), akari: guard }));
    expect(s.allies[0].mp).toBe(50 - (SKILLS.fire.mp - 1));
  });

  it('スタートダッシュがあると、最初のラウンドだけ先制する', () => {
    const s0 = battle({
      allies: [ally('hero', { spd: 50 }), withPassives(ally('akari', { spd: 1 }), [{ kind: 'startDash' }])],
      enemies: [enemy('a', { spd: 30 })],
    });
    expect(s0.precedeIds).toEqual(['akari']);
    const order = getRoundOrder(planAll(s0, { hero: { type: 'attack', target: { kind: 'enemy', id: 'enemy0' } }, akari: { type: 'attack', target: { kind: 'enemy', id: 'enemy0' } } }));
    expect(order[0].ids).toEqual(['akari']);
    const s1 = execute(planAll(s0, { hero: guard, akari: guard }));
    expect(s1.round).toBe(2);
    expect(s1.precedeIds).toEqual([]);
  });
});

describe('特性：ラウンドの始めのHP', () => {
  it('狂い1つにつき、ラウンドの始めに最大HPの5%を失う', () => {
    const bug: PassiveEffect = { kind: 'bug', rate: 0.05 };
    const s = battle({ allies: [withPassives(ally('hero', { hp: 200 }), [bug, bug])], enemies: [enemy('a')] });
    expect(s.allies[0].hp).toBe(200 - 20);
    expect(eventsOf(s, 'passiveHp')).toEqual([{ type: 'passiveHp', allyId: 'hero', source: 'bug', amount: -20, hpAfter: 180 }]);
  });

  it('狂いではHPが1未満にならない', () => {
    let s = battle({ allies: [withPassives(ally('hero', { hp: 200 }), [{ kind: 'bug', rate: 0.5 }])], enemies: [enemy('a', { atk: 0 })] });
    s.allies[0].hp = 3;
    s = execute(planAll(s, { hero: guard }));
    expect(s.allies[0].hp).toBe(1);
  });

  it('ファーストエイドは、ラウンドの始めに最大HPの5%を回復する（最大HPまで）', () => {
    let s = battle({ allies: [withPassives(ally('hero', { hp: 200 }), [{ kind: 'regen', rate: 0.05 }])], enemies: [enemy('a', { atk: 0 })] });
    expect(eventsOf(s, 'passiveHp')).toEqual([]);
    s.allies[0].hp = 100;
    s = execute(planAll(s, { hero: guard }));
    expect(s.allies[0].hp).toBe(100 - eventsOf(s, 'damage').reduce((sum, e) => sum + e.amount, 0) + 10);
  });
});

describe('割合の特性の上限（段階54）', () => {
  const many = (p: PassiveEffect, n: number) => ({ passives: Array.from({ length: n }, () => p) });
  it('種類ごとの上限で止まる：属性 +80%（属性ごと）、部位 +100%、コンボ +60%、回復 6%、バトン +0.5（1.75倍）、延長 +2枚', () => {
    expect(PASSIVE_CAPS).toEqual({ elementBoost: 0.8, partBoost: 1.0, comboBoost: 0.6, regen: 0.06, batonBoost: 0.5, mpSave: 2, oneMoreDraw: 2 });
    const fire = many({ kind: 'elementBoost', element: 'fire', rate: 0.25 }, 5);
    expect(passiveTotal(fire, 'elementBoost', 'fire')).toBeCloseTo(1.25);
    expect(passiveRate(fire, 'elementBoost', 'fire')).toBe(0.8);
    expect(passiveRate(fire, 'elementBoost', 'ice')).toBe(0);
    expect(passiveRate(many({ kind: 'partBoost', rate: 0.5 }, 3), 'partBoost')).toBe(1);
    expect(passiveRate(many({ kind: 'comboBoost', rate: 0.3 }, 3), 'comboBoost')).toBe(0.6);
    expect(passiveRate(many({ kind: 'regen', rate: 0.03 }, 6), 'regen')).toBe(0.06);
    expect(batonMultiplier(many({ kind: 'batonBoost', rate: 0.25 }, 4))).toBe(1.75);
    expect(oneMoreDrawCount(many({ kind: 'oneMoreDraw', count: 1 }, 5))).toBe(1 + 2);
    // 狂い（減る方）は止めない
    expect(passiveRate(many({ kind: 'bug', rate: 0.05 }, 3), 'bug')).toBeCloseTo(0.15);
  });

  it('上限に届いた特性を返す（武器の画面に「上限」と出す）', () => {
    const ally = { passives: [...many({ kind: 'elementBoost', element: 'fire', rate: 0.4 }, 2).passives, ...many({ kind: 'regen', rate: 0.03 }, 3).passives, { kind: 'regen', rate: 0 } as PassiveEffect] };
    expect(cappedPassives(ally)).toEqual([
      { kind: 'elementBoost', element: 'fire', value: 0.8 },
      { kind: 'regen', value: 0.06 },
    ]);
    expect(cappedPassives({ passives: [] })).toEqual([]);
  });

  it('ラウンドの始めの回復は、最大 HP の 6% で止まる', () => {
    const s = battle({ allies: [withPassives(ally('hero', { hp: 1000 }), many({ kind: 'regen', rate: 0.05 }, 4).passives)] });
    const t = structuredClone(s);
    t.allies[0].hp = 100;
    const next = execute(planAll(t, { hero: guard }));
    expect(eventsOf(next, 'passiveHp')[0]).toMatchObject({ source: 'regen', amount: 60 });
  });
});
