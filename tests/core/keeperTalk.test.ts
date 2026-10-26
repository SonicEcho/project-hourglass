import { describe, expect, it } from 'vitest';
import { eventPassed, nextKeeperTalk } from '../../src/core';
import { KEEPER_TALKS, SCENES, SLICE_FLOW } from '../../src/data';

// ペトラとの会話（段階116。テストプレイのメモ 31）
describe('交換所の窓口の係との会話', () => {
  const talks = [
    { scene: 'a', after: 'e1', teaser: '' },
    { scene: 'b', after: 'e2', teaser: '' },
  ];
  it('出来事を過ぎた、まだ見ていない会話のうち、最初の1つ', () => {
    expect(nextKeeperTalk(talks, () => false, () => false)).toBeUndefined();
    expect(nextKeeperTalk(talks, (e) => e === 'e1', () => false)?.scene).toBe('a');
    expect(nextKeeperTalk(talks, () => true, (s) => s === 'a')?.scene).toBe('b');
    expect(nextKeeperTalk(talks, () => true, () => true)).toBeUndefined();
  });

  it('会話の台本があり、出来事は物語の流れの順に並んでいる', () => {
    let last = '';
    for (const t of KEEPER_TALKS) {
      expect(SCENES.some((sc) => sc.id === t.scene), t.scene).toBe(true);
      if (last) expect(eventPassed(SLICE_FLOW, t.after, last), `${last} → ${t.after}`).toBe(true);
      last = t.after;
    }
  });
});
