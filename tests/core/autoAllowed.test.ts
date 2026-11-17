import { describe, expect, it } from 'vitest';
import { formationKey } from '../../src/core';

// 一度勝った敵の組み合わせの印（段階105）。段階237：使われていなかった「オートを出してよいか」（autoAllowed）は外した
describe('敵の組み合わせの印（段階105）', () => {
  it('敵の組み合わせの印は、並び順によらず同じ顔ぶれなら同じ', () => {
    expect(formationKey(['goldfishNoise', 'balloonNoise'])).toBe(formationKey(['balloonNoise', 'goldfishNoise']));
    expect(formationKey(['goldfishNoise', 'goldfishNoise'])).not.toBe(formationKey(['goldfishNoise']));
  });
});
