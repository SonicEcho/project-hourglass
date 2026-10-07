import { describe, expect, it } from 'vitest';
import { findPath, isWalkable, nearestWalkable, parseGrid } from '../../src/core';

// 探索の地図と道探し（段階16）
const map = parseGrid([
  '#######',
  '#..#..#',
  '#..#..#',
  '#.....#',
  '#######',
]);

describe('マス目の地図', () => {
  it('文字の絵から作る。# と地図の外は通れない', () => {
    expect([map.cols, map.rows]).toEqual([7, 5]);
    expect(isWalkable(map, [1, 1])).toBe(true);
    expect(isWalkable(map, [3, 1])).toBe(false);
    expect(isWalkable(map, [-1, 1])).toBe(false);
    expect(isWalkable(map, [7, 1])).toBe(false);
  });

  it('行が短い所は通れない', () => {
    const m = parseGrid(['...', '.']);
    expect(isWalkable(m, [2, 1])).toBe(false);
  });
});

describe('道を探す', () => {
  it('壁をよけた最短の道を返す（出発のマスは含まず、着くマスを含む）', () => {
    const path = findPath(map, [1, 1], [5, 1])!;
    expect(path[path.length - 1]).toEqual([5, 1]);
    // 壁の列（3）を下の通路（行3）で回りこむ：右に4、下に2、上に2 で8歩
    expect(path).toHaveLength(8);
    expect(path.some(([c, r]) => c === 3 && r === 3)).toBe(true);
    // 1歩ずつ隣のマスに進む
    let prev = [1, 1];
    for (const cell of path) {
      expect(Math.abs(cell[0] - prev[0]) + Math.abs(cell[1] - prev[1])).toBe(1);
      prev = cell;
    }
  });

  it('同じマスなら空の道。壁やたどり着けない所なら null', () => {
    expect(findPath(map, [1, 1], [1, 1])).toEqual([]);
    expect(findPath(map, [1, 1], [3, 1])).toBeNull();
    const closed = parseGrid(['.#.', '.#.']);
    expect(findPath(closed, [0, 0], [2, 0])).toBeNull();
  });

  it('同じ地図・同じ2点なら、毎回同じ道', () => {
    expect(findPath(map, [1, 1], [5, 2])).toEqual(findPath(map, [1, 1], [5, 2]));
  });
});

describe('タップした所が通れない時', () => {
  it('通れるならそのまま、壁なら近くの通れるマス、遠すぎれば null', () => {
    expect(nearestWalkable(map, [1, 1])).toEqual([1, 1]);
    const near = nearestWalkable(map, [3, 1])!;
    expect(isWalkable(map, near)).toBe(true);
    expect(Math.abs(near[0] - 3) + Math.abs(near[1] - 1)).toBe(1);
    const walls = parseGrid(['#####', '#####', '#####', '#####', '....#']);
    expect(nearestWalkable(walls, [3, 0], 2)).toBeNull();
  });
});
