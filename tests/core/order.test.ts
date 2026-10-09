import { describe, expect, it } from 'vitest';
import { actionSpeed, compareOrder, getRoundOrder, previewAction, setPlan, useSupport } from '../../src/core';
import { CARDS, SKILLS } from '../../src/data';
import { ally, attackOn, battle, enemy, guard, planAll, withHand } from './helpers';

const ids = (s: Parameters<typeof getRoundOrder>[0], preview?: Parameters<typeof getRoundOrder>[1]) =>
  getRoundOrder(s, preview).map((e) => e.ids.join('+'));

describe('行動の速さ', () => {
  it('速さ ÷ 重さ。重いほど遅い', () => {
    expect(actionSpeed(12, 1.0)).toBe(12);
    expect(actionSpeed(12, 1.5)).toBe(8);
    expect(actionSpeed(10, 0.5)).toBe(20);
  });

  it('同じ速さなら味方が先、その次は速さ（能力値）の高い順', () => {
    expect(compareOrder({ tier: 2, speed: 10, side: 'ally', spd: 5, index: 1 }, { tier: 2, speed: 10, side: 'enemy', spd: 20, index: 0 })).toBeLessThan(0);
    expect(compareOrder({ tier: 2, speed: 10, side: 'ally', spd: 20, index: 1 }, { tier: 2, speed: 10, side: 'ally', spd: 5, index: 0 })).toBeLessThan(0);
  });
});

describe('ラウンドの行動順', () => {
  const two = () =>
    battle({
      allies: [ally('hero', { spd: 12 }, [SKILLS.breakSlash]), ally('mio', { spd: 16 })],
      enemies: [enemy('e', { spd: 11 })],
    });

  it('行動の速さが高い順に並ぶ（まだ決まっていない仲間は重さ1.0）', () => {
    expect(ids(two())).toEqual(['mio', 'hero', 'enemy0']);
  });

  it('重い行動を選ぶと後回しになる', () => {
    // ブレイクスラッシュ（重さ1.2）：12 ÷ 1.2 = 10 → 敵（11）より後
    const s = setPlan(two(), 'hero', { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0' } });
    expect(ids(s)).toEqual(['mio', 'enemy0', 'hero']);
  });

  it('防御はラウンドの最初', () => {
    const s = setPlan(two(), 'hero', guard);
    expect(ids(s)).toEqual(['hero', 'mio', 'enemy0']);
  });

  it('クイックステップを使った仲間の行動は最初（防御の次）', () => {
    let s = withHand(two(), [CARDS.quickStep]);
    s = planAll(s, { hero: { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0' } }, mio: guard });
    s = useSupport(s, s.hand[0].uid, 'hero');
    expect(ids(s)).toEqual(['mio', 'hero', 'enemy0']);
  });

  it('連携技は2人で1つ。重くても必ず最初に動く（防御の次。段階26の調整4）', () => {
    const s = battle({ allies: [ally('hero', { spd: 12 }), ally('mio', { spd: 16 }), ally('akari', { spd: 1 })], enemies: [enemy('e', { spd: 99 })] });
    const linked = planAll({ ...s, linkGauge: 100 }, { hero: { type: 'link', linkId: 'crossDrive' }, akari: guard });
    // 12 ÷ 1.5 = 8 で、敵（99）よりずっと遅いが、防御の次に来る
    expect(ids(linked)).toEqual(['akari', 'hero+mio', 'enemy0']);
  });

  it('プレビューで、その行動をした場合の自分の位置がわかる', () => {
    const s = two();
    expect(previewAction(s, 'hero', attackOn('enemy0')).orderIndex).toBe(1);
    expect(previewAction(s, 'hero', { type: 'skill', skillId: 'breakSlash', target: { kind: 'enemy', id: 'enemy0' } }).orderIndex).toBe(2);
    expect(previewAction(s, 'hero', guard).orderIndex).toBe(0);
  });
});
