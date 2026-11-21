import { describe, expect, it } from 'vitest';
import { canStep, dirOfDrag, dragStep, findPath, findPathDiag, parseGrid } from '../../src/core';

// 段階269：斜めにも歩く道・押したまま引っ張って歩く
const map = parseGrid(['.....', '.#...', '.....', '.....']);

describe('斜めにも歩く道（段階269）', () => {
  it('ひらけた所は斜めにまっすぐ。上下左右だけより短い', () => {
    const open = parseGrid(['....', '....', '....', '....']);
    expect(findPathDiag(open, [0, 0], [3, 3])).toEqual([[1, 1], [2, 2], [3, 3]]);
    expect(findPath(open, [0, 0], [3, 3])!.length).toBe(6);
  });

  it('角は削らない（斜めのとなりの縦か横が壁なら、斜めに進まない）', () => {
    expect(canStep(map, [0, 0], [1, 1])).toBe(false);
    expect(canStep(map, [2, 0], [1, 1])).toBe(true);
    const p = findPathDiag(map, [0, 0], [2, 2])!;
    // 壁 (1,1) の角を斜めに抜けない
    let prev: [number, number] = [0, 0];
    for (const c of p) {
      const d: [number, number] = [c[0] - prev[0], c[1] - prev[1]];
      expect(canStep(map, prev, d)).toBe(true);
      prev = c;
    }
    expect(p[p.length - 1]).toEqual([2, 2]);
  });

  it('たどり着けない・通れないマスは null。同じマスは空', () => {
    expect(findPathDiag(map, [1, 1], [0, 0])).toBeNull();
    expect(findPathDiag(map, [0, 0], [0, 0])).toEqual([]);
    const cut = parseGrid(['.#.', '.#.', '.#.']);
    expect(findPathDiag(cut, [0, 0], [2, 2])).toBeNull();
  });

  it('引っ張った向きは8方向。進めない向きは、近い向きにすべる', () => {
    expect(dirOfDrag(10, 0)).toEqual([1, 0]);
    expect(dirOfDrag(10, 10)).toEqual([1, 1]);
    expect(dirOfDrag(-3, -40)).toEqual([0, -1]);
    // (0,0) から右下は角なので進めない → 右へ
    expect(dragStep(map, [0, 0], [1, 1])).toEqual([1, 0]);
    // (0,0) から上は壁の外。左上・右上を試す → 進めない
    expect(dragStep(map, [0, 0], [0, -1])).toBeNull();
  });
});
