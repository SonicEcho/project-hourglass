import { describe, expect, it } from 'vitest';
import type { DailyHub } from '../../src/core';
import { checkDailyHub, finishesAfter, isSeen, markSeen, requiredLeft, seenKey, spotState } from '../../src/core';

const stalls: DailyHub = {
  id: 'stalls',
  time: '夕方',
  finishWhenRequiredSeen: true,
  places: [
    {
      id: 'p',
      name: '参道',
      backdrop: 'x',
      mapX: 0,
      mapY: 0,
      spots: [
        { id: 'a', scene: 'a', label: 'A', mark: 'stall', x: 0, y: 0, required: true },
        { id: 'b', scene: 'b', label: 'B', mark: 'stall', x: 0, y: 0, required: true },
      ],
    },
  ],
};

const town: DailyHub = {
  id: 'town',
  time: '放課後',
  places: [
    { id: 's', name: '商店街', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'store', scene: 'store', label: 'コンビニ', mark: 'main', x: 0, y: 0, required: true }] },
    { id: 'h', name: '施設', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'talk', scene: 'talk', label: '小話', mark: 'talk', x: 0, y: 0 }] },
    { id: 'c', name: '時計屋', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'go', label: '夕暮れへ', mark: 'go', x: 0, y: 0, ends: true }] },
  ],
};

const spot = (hub: DailyHub, id: string) => hub.places.flatMap((p) => p.spots).find((s) => s.id === id)!;

describe('昼の日常（段階24）', () => {
  it('見た印は、物語で覚えた値に入る', () => {
    const vars = markSeen({ 金魚の名前: 'あかね' }, 'a');
    expect(vars).toEqual({ 金魚の名前: 'あかね', [seenKey('a')]: '1' });
    expect(isSeen(vars, 'a')).toBe(true);
    expect(isSeen(vars, 'b')).toBe(false);
  });

  it('屋台めぐり：全部の屋台を見た時に、次へ進む', () => {
    expect(finishesAfter(stalls, {}, spot(stalls, 'a'))).toBe(false);
    expect(finishesAfter(stalls, markSeen({}, 'a'), spot(stalls, 'b'))).toBe(true);
    expect(spotState(stalls, markSeen({}, 'a'), spot(stalls, 'a'))).toBe('seen');
  });

  it('町：必ず見る出来事が残っている間は、夕暮れへ進む印を選べない', () => {
    expect(requiredLeft(town, {}).map((s) => s.id)).toEqual(['store']);
    expect(spotState(town, {}, spot(town, 'go'))).toBe('locked');
    const vars = markSeen({}, 'store');
    expect(spotState(town, vars, spot(town, 'go'))).toBe('open');
    expect(finishesAfter(town, vars, spot(town, 'go'))).toBe(true);
    // 見なくてよい出来事は、見ても日は進まない
    expect(finishesAfter(town, vars, spot(town, 'talk'))).toBe(false);
  });

  it('書き間違いを見つける', () => {
    expect(checkDailyHub(stalls)).toEqual([]);
    expect(checkDailyHub(town)).toEqual([]);
    const bad: DailyHub = {
      id: 'bad',
      time: '',
      places: [{ id: 'p', name: 'p', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'a', scene: 'a', label: 'A', mark: 'talk', x: 0, y: 0 }, { id: 'a', label: 'A', mark: 'talk', x: 0, y: 0 }] }],
    };
    expect(checkDailyHub(bad)).toEqual(['bad：同じ名前の印が2つある：a', 'bad：場面も終わりもない印：a', 'bad：日常を終える印がない']);
  });
});
