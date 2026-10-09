import { describe, expect, it } from 'vitest';
import type { AreaDef } from '../../src/core';
import {
  addKoma,
  areaGrid,
  findPath,
  isWalkable,
  komaExtra,
  komaLeft,
  komaVars,
  arrive,
  chestAt,
  checkArea,
  defeatEnemy,
  enemyActive,
  loseBattle,
  markTrigger,
  normalizeExplore,
  openChest,
  patrolRoute,
  pendingTrigger,
  startExplore,
} from '../../src/core';

// 小さな区画：S 出発点、P チェックポイント、# は通れない
const area: AreaDef = {
  id: 't',
  name: 'テスト',
  layout: [
    '#######', //
    '#.....#',
    '#.###.#',
    '#..P..#',
    '#.....#',
    '#..S..#',
    '#######',
  ],
  chests: [{ id: 'c1', cell: [1, 1], items: ['potion', 'potion'] }],
  enemies: [
    { id: 'e1', patrol: [[1, 3], [1, 4]], battle: 'b1' },
    { id: 'e2', patrol: [[5, 3], [5, 4]], battle: 'b2' },
  ],
  boss: { id: 'boss', cell: [3, 1], battle: 'bb' },
  talkers: [{ id: 'v1', cell: [4, 4], scene: 'voice', label: '人' }],
  triggers: [
    { on: 'wins', count: 1, scene: 'first' },
    { on: 'checkpoint', scene: 'cp' },
    { on: 'wins', count: 2, scene: 'two' },
    { on: 'boss', scene: 'before' },
    { on: 'cleared', scene: 'after' },
  ],
  komaNeed: 5,
};

describe('探索（段階25）', () => {
  it('出発点から始まり、チェックポイントも最初は出発点', () => {
    const s = startExplore(area);
    expect(s.cell).toEqual([3, 5]);
    expect(s.checkpoint).toEqual([3, 5]);
    expect(checkArea(area)).toEqual([]);
  });

  it('宝箱のマスは通れない（上を歩けない）。道は宝箱をよける', () => {
    const map = areaGrid(area);
    expect(isWalkable(map, [1, 1])).toBe(false);
    expect(isWalkable(map, [2, 1])).toBe(true);
    // 宝箱の隣のマスへは歩ける
    expect(findPath(map, [3, 5], [2, 1])).not.toBeNull();
    expect(checkArea({ ...area, chests: [{ id: 'c9', cell: [0, 0], items: [] }] })).toContain('t：宝箱 c9 が通れないマス（0,0）にある');
  });

  it('宝箱は通っただけでは開かない（段階26）', () => {
    const r = arrive(area, startExplore(area), [1, 1]);
    expect(r.event).toEqual({ type: 'none' });
    expect(r.state.openedChests).toEqual([]);
    expect(chestAt(area, r.state, [1, 1])).toEqual(area.chests[0]);
    expect(chestAt(area, r.state, [2, 1])).toBeNull();
  });

  it('宝箱は開けると1回だけ中身が出る', () => {
    const r = openChest(area, startExplore(area), 'c1');
    expect(r?.chest).toEqual(area.chests[0]);
    expect(r?.state.openedChests).toEqual(['c1']);
    expect(openChest(area, r!.state, 'c1')).toBeNull();
    expect(chestAt(area, r!.state, [1, 1])).toBeNull();
    expect(openChest(area, startExplore(area), 'nothing')).toBeNull();
  });

  it('チェックポイントで記録し、負けるとそこへ戻る', () => {
    const r = arrive(area, startExplore(area), [3, 3]);
    expect(r.event).toEqual({ type: 'checkpoint', first: true });
    expect(arrive(area, r.state, [3, 3]).event).toEqual({ type: 'checkpoint', first: false });
    const away = { ...r.state, cell: [1, 1] as [number, number] };
    expect(loseBattle(away).cell).toEqual([3, 3]);
    // 記録する前に負けたら出発点へ
    expect(loseBattle({ ...startExplore(area), cell: [1, 1] }).cell).toEqual([3, 5]);
  });

  it('倒した敵の印は消え、勝った回数で途中の会話が出る（1回ずつ）', () => {
    let s = startExplore(area);
    expect(pendingTrigger(area, s, 'wins')).toBeNull();
    s = defeatEnemy(s, 'e1');
    expect(enemyActive(s, 'e1')).toBe(false);
    expect(enemyActive(s, 'e2')).toBe(true);
    expect(pendingTrigger(area, s, 'wins')?.scene).toBe('first');
    s = markTrigger(s, 'first');
    expect(pendingTrigger(area, s, 'wins')).toBeNull();
    s = defeatEnemy(defeatEnemy(s, 'e2'), 'e2');
    expect(s.defeated).toEqual(['e1', 'e2']);
    expect(pendingTrigger(area, s, 'wins')?.scene).toBe('two');
    // ボスは勝った回数に数えない
    expect(pendingTrigger(area, defeatEnemy(startExplore(area), 'boss'), 'wins')).toBeNull();
    expect(pendingTrigger(area, s, 'boss')?.scene).toBe('before');
  });

  it('敵の印の道は、折り返しの点を最短でつなぐ', () => {
    expect(patrolRoute(areaGrid(area), [[1, 3], [1, 4]])).toEqual([[1, 3], [1, 4]]);
  });

  it('コマ：勝つと増え、返すのに要る残りと、余りがわかる。残りが少なくなると会話が出る（段階28）', () => {
    let s = startExplore(area);
    expect(komaLeft(area, s)).toBe(5);
    s = addKoma(s, 2);
    expect(komaVars(area, s)).toEqual({ komaHave: '2', komaNeed: '5', komaLeft: '3' });
    const withLeft = { ...area, triggers: [{ on: 'komaLeft' as const, left: 3, scene: 'left3' }] };
    expect(pendingTrigger(withLeft, startExplore(area), 'komaLeft')).toBeNull();
    expect(pendingTrigger(withLeft, s, 'komaLeft')?.scene).toBe('left3');
    s = addKoma(s, 4);
    expect(komaLeft(area, s)).toBe(0);
    expect(komaExtra(area, s)).toBe(1);
    // そろった後は「あと◯つ」の会話は出ない
    expect(pendingTrigger(withLeft, s, 'komaLeft')).toBeNull();
    expect(normalizeExplore(area, { ...s, koma: -1 })?.koma).toBe(0);
  });

  it('セーブから読んだ状態を、今の区画に合わせて整える', () => {
    const raw = { area: 't', cell: [0, 0], checkpoint: [3, 3], openedChests: ['c1', 'gone'], defeated: ['e1', 'x'], seen: ['first', 'y'], cleared: true, koma: 3 };
    expect(normalizeExplore(area, raw)).toEqual({
      area: 't',
      cell: [3, 5],
      checkpoint: [3, 3],
      openedChests: ['c1'],
      defeated: ['e1'],
      seen: ['first'],
      cleared: true,
      koma: 3,
    });
    expect(normalizeExplore(area, 'x')).toBeNull();
  });

  it('区画の書き間違いを見つける', () => {
    const bad: AreaDef = { ...area, chests: [{ id: 'c1', cell: [0, 0], items: [] }], boss: { id: 'c1', cell: [3, 1], battle: 'bb' } };
    expect(checkArea(bad)).toEqual(['t：宝箱 c1 が通れないマス（0,0）にある', 't：宝箱 c1 の隣に立てるマスがない', 't：id が重なっている：c1']);
  });
});
