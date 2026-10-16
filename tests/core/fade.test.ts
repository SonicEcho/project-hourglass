import { describe, expect, it } from 'vitest';
import { enterFade, fadeKey, fadeLevel, fadeRate, thinItems } from '../../src/core';
import { MEMORY_FADE_LABELS, MEMORY_FADE_RATES } from '../../src/data';

// 記憶の「薄れ」（段階57）
describe('記憶の薄れ（段階57）', () => {
  it('データ：濃い 100%・少し薄い 60%・薄い 30%・かすか 10% の4回', () => {
    expect(MEMORY_FADE_RATES).toEqual([1, 0.6, 0.3, 0.1]);
    expect(MEMORY_FADE_LABELS.length).toBe(MEMORY_FADE_RATES.length);
  });

  it('同じ記憶に入るたびに薄れ、4回で今日はもう入れない。ほかの記憶は濃いまま', () => {
    let vars: Record<string, string> = {};
    const rates: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = enterFade(vars, 'a11', 6, MEMORY_FADE_RATES)!;
      rates.push(r.rate);
      vars = r.vars;
    }
    expect(rates).toEqual([1, 0.6, 0.3, 0.1]);
    expect(vars[fadeKey('a11')]).toBe('4@6');
    expect(enterFade(vars, 'a11', 6, MEMORY_FADE_RATES)).toBeNull();
    expect(fadeRate(MEMORY_FADE_RATES, fadeLevel(vars, 'a21', 6))).toBe(1);
  });

  it('1日たつごとに1段階戻る（日が戻っても増えない。読めない値は濃い）', () => {
    const vars = { [fadeKey('a11')]: '4@6' };
    expect(fadeLevel(vars, 'a11', 7)).toBe(3);
    expect(fadeLevel(vars, 'a11', 9)).toBe(1);
    expect(fadeLevel(vars, 'a11', 12)).toBe(0);
    expect(fadeLevel(vars, 'a11', 5)).toBe(4);
    expect(fadeLevel({ [fadeKey('a11')]: 'xx' }, 'a11', 6)).toBe(0);
    // 戻った後に入ると、その日の回数として数え直す
    expect(enterFade(vars, 'a11', 7, MEMORY_FADE_RATES)).toEqual({ rate: 0.1, vars: { [fadeKey('a11')]: '4@7' } });
  });

  it('素材は割合の確率で1つずつ残る（同じ seed なら同じ。割合1なら全部、0なら何も残らない）', () => {
    const items = Array.from({ length: 1000 }, (_, i) => `m${i}`);
    expect(thinItems(items, 1, 3)).toEqual(items);
    expect(thinItems(items, 0, 3)).toEqual([]);
    const kept = thinItems(items, 0.3, 7);
    expect(kept.length).toBeGreaterThan(240);
    expect(kept.length).toBeLessThan(360);
    expect(thinItems(items, 0.3, 7)).toEqual(kept);
  });
});
