import { describe, expect, it } from 'vitest';
import { autoAllowed } from '../../src/core';

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
});
