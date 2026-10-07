import { describe, expect, it } from 'vitest';
import { LAYOUT, MIN_TAP } from '../src/ui/layout';
import { skillPanelLayout } from '../src/ui/skillLayout';

// 戦闘画面の「魔法・スキル」の一覧が、技が増えても手札の場所からはみ出さないこと
const WIDTH = 358;

describe('魔法・スキルの一覧の並べ方', () => {
  it('3つまでは1列で、今までと同じ並び', () => {
    const l = skillPanelLayout(3, WIDTH, 0);
    expect(l.cols).toBe(1);
    expect(l.pages).toBe(1);
    expect(l.slots.map((s) => s.index)).toEqual([0, 1, 2]);
    expect(l.slots[0].w).toBe(WIDTH);
  });

  it('4つ以上は2列で、6つまでは1ページに収まる', () => {
    for (const n of [4, 5, 6]) {
      const l = skillPanelLayout(n, WIDTH, 0);
      expect(l.cols).toBe(2);
      expect(l.pages).toBe(1);
      expect(l.slots.map((s) => s.index)).toEqual([...Array(n).keys()]);
    }
  });

  it('6つを超えると、1ページに5つと「次のページ」のボタン', () => {
    const l = skillPanelLayout(8, WIDTH, 0);
    expect(l.pages).toBe(2);
    expect(l.slots.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, -1]);
    expect(skillPanelLayout(8, WIDTH, 1).slots.map((s) => s.index)).toEqual([5, 6, 7, -1]);
    // 最後のページの次は最初のページに戻る
    expect(skillPanelLayout(8, WIDTH, 2).page).toBe(0);
  });

  it('技がいくつあっても、全部の技がどこかのページに1回ずつ出て、手札の場所からはみ出さない', () => {
    for (let n = 0; n <= 14; n++) {
      const seen: number[] = [];
      const pages = skillPanelLayout(n, WIDTH, 0).pages;
      for (let p = 0; p < pages; p++) {
        for (const s of skillPanelLayout(n, WIDTH, p).slots) {
          if (s.index >= 0) seen.push(s.index);
          expect(s.y + s.h).toBeLessThanOrEqual(LAYOUT.hand.h);
          expect(s.x + s.w).toBeLessThanOrEqual(WIDTH + 0.001);
          expect(s.h).toBeGreaterThanOrEqual(MIN_TAP);
        }
      }
      expect(seen.sort((a, b) => a - b)).toEqual([...Array(n).keys()]);
    }
  });
});
