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

describe('入れない所で引っかからない（2026-11-23）', () => {
  it('まっすぐ先が壁なら、壁に沿って横の空いた所へずれる（3マス先まで）', () => {
    // 上へ引っ張る。真上と左右の斜め上は壁、右へ2マス行けば上が空いている
    const m = parseGrid(['#####.', '......']);
    expect(dragStep(m, [2, 1], [0, -1])).toEqual([3, 1]);
    // 4マス以上離れていたら止まる
    const far = parseGrid(['#######.', '........']);
    expect(dragStep(far, [1, 1], [0, -1])).toBeNull();
  });

  it('歩けない物をタップしても、近くの行ける所まで歩く', async () => {
    const { reachableNear } = await import('../../src/core');
    const m = parseGrid(['......', '.###..', '.###..', '......']);
    // 物の真ん中 (2,1) をタップ → 近くの行ける所
    const c = reachableNear(m, [0, 3], [2, 1], 3)!;
    expect(Math.abs(c[0] - 2) + Math.abs(c[1] - 1)).toBe(1);
    // 遠すぎる所は null
    expect(reachableNear(parseGrid(['.####', '#####', '#####', '#####', '#####']), [0, 0], [4, 4], 3)).toBeNull();
  });
});
