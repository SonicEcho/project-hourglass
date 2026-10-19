import { describe, expect, it } from 'vitest';
import type { AreaDef } from '../../src/core';
import { areaGrid, checkArea, checkNights, closedWalls, inNight, isWalkable, nightArea, nightDone, nightExit, nightGoal, normalizeExplore, pendingTrigger, startExplore, startNight } from '../../src/core';

// 晩に分けた区画（段階63。docs/design/explore.md の 2-5）：1つの部屋を壁で3つに区切り、晩ごとに奥へ進む
const layout = [
  '##########',
  '#........#',
  '#...P....#',
  '#........#',
  '#........#',
  '#...P....#',
  '#........#',
  '#........#',
  '#...S....#',
  '##########',
];
const area: AreaDef = {
  id: 'n',
  name: '晩のテスト',
  rooms: [{ id: 'r', layout, exits: [] }],
  chests: [{ id: 'c2', cell: [7, 4], items: ['potion'], night: 2 }],
  enemies: [
    { id: 'e1', patrol: [[1, 7], [6, 7]], battle: 'b1' },
    { id: 'e2', patrol: [[1, 4], [6, 4]], battle: 'b2', night: 2 },
    { id: 'e3', patrol: [[1, 1], [6, 1]], battle: 'b3', night: 3, scene: 'before_e3' },
  ],
  boss: { id: 'boss', cell: [8, 1], battle: 'bb' },
  talkers: [
    { id: 't1', cell: [7, 8], scene: 'voice1', label: '人', until: 1 },
    { id: 't2', cell: [2, 5], scene: 'voice2', label: '人', night: 2 },
  ],
  triggers: [
    { on: 'koma', count: 1, scene: 'koma1' },
    { on: 'room', room: 'r', scene: 'room_r', night: 2 },
  ],
  komaNeed: 3,
  // 帰り口（段階67）：1晩目は壁の手前、2晩目は2晩目を始めた所（書かなければ次の晩を始める所だが、まだ壁の向こう）
  nights: [{ koma: 1, exit: { cell: [4, 7] } }, { koma: 2, start: { cell: [4, 5] }, exit: { cell: [4, 5] } }, { start: { cell: [4, 2] } }],
  walls: [
    { id: 'w1', cells: [1, 2, 3, 4, 5, 6, 7, 8].map((c): [number, number] => [c, 6]), opens: 2 },
    { id: 'w2', cells: [1, 2, 3, 4, 5, 6, 7, 8].map((c): [number, number] => [c, 3]), opens: 3 },
  ],
};

describe('晩に分けた区画（段階63）', () => {
  it('出る晩：night は何晩目から、until は何晩目まで', () => {
    expect(inNight({}, 1)).toBe(true);
    expect(inNight({ night: 2 }, 1)).toBe(false);
    expect(inNight({ night: 2 }, 3)).toBe(true);
    expect(inNight({ until: 1 }, 2)).toBe(false);
  });

  it('その晩の区画：まだ開いていない壁は通れず、その晩に出ないものは除く', () => {
    const n1 = nightArea(area, 1);
    expect(closedWalls(area, 1).map((w) => w.id)).toEqual(['w1', 'w2']);
    expect(isWalkable(areaGrid(n1, 'r'), [4, 6])).toBe(false);
    expect(n1.enemies.map((e) => e.id)).toEqual(['e1']);
    expect(n1.talkers.map((t) => t.id)).toEqual(['t1']);
    expect(n1.chests).toEqual([]);
    expect(n1.triggers.map((t) => t.scene)).toEqual(['koma1']);
    const n2 = nightArea(area, 2);
    expect(isWalkable(areaGrid(n2, 'r'), [4, 6])).toBe(true);
    expect(isWalkable(areaGrid(n2, 'r'), [4, 3])).toBe(false);
    expect(n2.enemies.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(n2.talkers.map((t) => t.id)).toEqual(['t2']);
    expect(closedWalls(area, 3)).toEqual([]);
    // 晩に分けていない区画は、そのまま
    const { nights: _, ...plain } = area;
    expect(nightArea(plain, 1)).toBe(plain);
  });

  it('晩を始める：前の晩のまま来たら、その晩を始める所へ移ってチェックポイントにする（HP・MP は全回復）。始めた晩はそのまま', () => {
    const s1 = { ...startExplore(area), koma: 1, vitals: { hero: { hp: 3, mp: 1 } } };
    expect(startNight(area, s1, 1)).toBe(s1);
    const s2 = startNight(area, s1, 2);
    expect(s2.night).toBe(2);
    expect(s2.cell).toEqual([4, 5]);
    expect(s2.checkpoint).toEqual([4, 5]);
    expect(s2.vitals).toBeUndefined();
    const moved = { ...s2, cell: [2, 4] as [number, number] };
    expect(startNight(area, moved, 2)).toBe(moved);
  });

  it('その晩のコマがそろうと、その晩は終わる。最後の晩は、コマでは終わらない', () => {
    const s = startExplore(area);
    expect(nightDone(area, s, 1)).toBe(false);
    expect(nightDone(area, { ...s, koma: 1 }, 1)).toBe(true);
    expect(nightDone(area, { ...s, koma: 1 }, 2)).toBe(false);
    expect(nightDone(area, { ...s, koma: 3 }, 3)).toBe(false);
  });

  it('今夜の目標（段階67）：今夜集めるコマの数と、今夜もう集めた数。最後の晩は、ぬしの分まで', () => {
    const s = startExplore(area);
    expect(nightGoal(area, s, 1)).toEqual({ have: 0, need: 1, last: false });
    expect(nightGoal(area, { ...s, koma: 1 }, 1)).toEqual({ have: 1, need: 1, last: false });
    expect(nightGoal(area, { ...s, koma: 1 }, 2)).toEqual({ have: 0, need: 1, last: false });
    expect(nightGoal(area, { ...s, koma: 2 }, 2)).toEqual({ have: 1, need: 1, last: false });
    expect(nightGoal(area, { ...s, koma: 2 }, 3)).toEqual({ have: 0, need: 1, last: true });
  });

  it('今夜の帰り口（段階67）：晩の exit、なければ次の晩を始める所。最後の晩にはない', () => {
    expect(nightExit(area, 1)).toEqual({ room: 'r', cell: [4, 7] });
    expect(nightExit(area, 2)).toEqual({ room: 'r', cell: [4, 5] });
    expect(nightExit(area, 3)).toBeNull();
    const plain: AreaDef = { ...area, nights: [{ koma: 1 }, { koma: 2, start: { cell: [4, 5] } }, { start: { cell: [4, 2] } }] };
    expect(nightExit(plain, 1)).toEqual({ room: 'r', cell: [4, 5] });
    // 次の晩を始める所が、まだ壁の向こう：その晩のうちに帰り口へ歩けない
    expect(checkNights(plain).filter((e) => e.includes('帰り口'))).toHaveLength(2);
  });

  it('途中の会話のきっかけ：コマが n 個になった時、部屋に初めて入った時', () => {
    const s = startExplore(area);
    expect(pendingTrigger(area, s, 'koma')).toBeNull();
    expect(pendingTrigger(area, { ...s, koma: 1 }, 'koma')?.scene).toBe('koma1');
    expect(pendingTrigger(area, { ...s, koma: 1, seen: ['koma1'] }, 'koma')).toBeNull();
    expect(pendingTrigger(area, s, 'room')?.scene).toBe('room_r');
  });

  it('書き間違いの確かめ：今のデータは通る。壁で、その晩の敵へ歩けなくなると見つける', () => {
    expect(checkArea(area)).toEqual([]);
    expect(checkNights(area)).toEqual([]);
    const bad: AreaDef = { ...area, enemies: [...area.enemies, { id: 'e4', patrol: [[2, 2]], battle: 'b4' }] };
    expect(checkNights(bad).some((e) => e.includes('e4'))).toBe(true);
    const noKoma: AreaDef = { ...area, nights: [{}, ...area.nights!.slice(1)] };
    expect(checkNights(noKoma).some((e) => e.includes('終わるコマ'))).toBe(true);
  });

  it('セーブから読む時、今いる晩を残す', () => {
    const s = { ...startNight(area, { ...startExplore(area), koma: 1 }, 2), seen: ['before_e3'] };
    const back = normalizeExplore(area, JSON.parse(JSON.stringify(s)));
    expect(back?.night).toBe(2);
    // 戦う前の会話を見たことも残す
    expect(back?.seen).toEqual(['before_e3']);
  });
});
