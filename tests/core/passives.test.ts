import { describe, expect, it } from 'vitest';
import { bugHpLoss, cappedPassives, passiveRate } from '../../src/core';
import { PASSIVE_CAPS } from '../../src/data/constants';

// 特性の割合（段階54。段階192 で古い戦闘から src/core/passives.ts に移した）
describe('割合の特性の上限（段階54）', () => {
  it('種類ごとの上限で止まる。狂いは止めない', () => {
    const passives = Array.from({ length: 10 }, () => ({ kind: 'elementBoost' as const, element: 'fire' as const, rate: 0.25 }));
    expect(passiveRate({ passives }, 'elementBoost', 'fire')).toBe(PASSIVE_CAPS.elementBoost);
    expect(passiveRate({ passives }, 'elementBoost', 'ice')).toBe(0);
    const bugs = Array.from({ length: 30 }, () => ({ kind: 'bug' as const, rate: 0.05 }));
    expect(passiveRate({ passives: bugs }, 'bug')).toBeCloseTo(1.5);
  });
  it('上限に届いた特性を返す（武器の画面に「上限」と出す）', () => {
    const passives = Array.from({ length: 10 }, () => ({ kind: 'elementBoost' as const, element: 'ice' as const, rate: 0.25 }));
    expect(cappedPassives({ passives })).toEqual([{ kind: 'elementBoost', element: 'ice', value: PASSIVE_CAPS.elementBoost }]);
    expect(cappedPassives({ passives: [] })).toEqual([]);
  });
  it('狂いで減る HP は、最大 HP × 狂いの割合の切り捨て（ムーブメントの画面の予告）', () => {
    expect(bugHpLoss(150, [{ kind: 'bug', rate: 0.05 }])).toBe(7);
    expect(bugHpLoss(150, undefined)).toBe(0);
  });
});
