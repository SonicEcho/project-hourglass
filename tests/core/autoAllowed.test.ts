import { describe, expect, it } from 'vitest';
import { autoAllowed, formationKey } from '../../src/core';

// オートを出してよいか（段階64）：物語の1回目の探索では出さず、記憶をたどる時だけ出す
describe('オートを出してよいか（段階64）', () => {
  it('物語の探索では出さない。記憶をたどる時と試作の戦闘では出す。ボス戦は出さない', () => {
    expect(autoAllowed({ boss: false, kind: 'story' })).toBe(false);
    expect(autoAllowed({ boss: false, kind: 'hunt' })).toBe(true);
    expect(autoAllowed({ boss: false, kind: 'trial' })).toBe(true);
    expect(autoAllowed({ boss: true, kind: 'hunt' })).toBe(false);
  });

  it('デバッグの切り替えを入にすると、物語の探索でも出す（ボス戦は出さない）', () => {
    expect(autoAllowed({ boss: false, kind: 'story', debugStory: true })).toBe(true);
    expect(autoAllowed({ boss: true, kind: 'story', debugStory: true })).toBe(false);
  });

  // 段階105：物語の探索でも、一度勝った敵の組み合わせからオートを出す。設定が「いつでも」なら初めての敵でも
  it('物語の探索では、一度勝った組み合わせなら出す（ボス戦は出さない）', () => {
    expect(autoAllowed({ boss: false, kind: 'story', storyAuto: 'won', wonBefore: false })).toBe(false);
    expect(autoAllowed({ boss: false, kind: 'story', storyAuto: 'won', wonBefore: true })).toBe(true);
    expect(autoAllowed({ boss: true, kind: 'story', storyAuto: 'won', wonBefore: true })).toBe(false);
  });

  it('設定が「いつでも」なら、物語の探索の初めての敵でも出す（ボス戦は出さない）', () => {
    expect(autoAllowed({ boss: false, kind: 'story', storyAuto: 'always', wonBefore: false })).toBe(true);
    expect(autoAllowed({ boss: true, kind: 'story', storyAuto: 'always' })).toBe(false);
  });

  it('敵の組み合わせの印は、並び順によらず同じ顔ぶれなら同じ', () => {
    expect(formationKey(['goldfishNoise', 'balloonNoise'])).toBe(formationKey(['balloonNoise', 'goldfishNoise']));
    expect(formationKey(['goldfishNoise', 'goldfishNoise'])).not.toBe(formationKey(['goldfishNoise']));
  });
});
