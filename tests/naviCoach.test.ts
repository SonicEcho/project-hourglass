import { describe, expect, it } from 'vitest';
import { NAVI_COACH, TIPS } from '../src/data';

// 段階203：ムーブメントの画面のチュートリアル（照らす説明）

describe('ムーブメントのチュートリアル（段階203）', () => {
  it('始めと終わりはあいさつ。間で、タブ・盤・ブリッジ・一覧・ボタン・能力値・セットを照らす', () => {
    expect(NAVI_COACH[0].target).toBe('intro');
    expect(NAVI_COACH[NAVI_COACH.length - 1].target).toBe('intro');
    expect(NAVI_COACH.map((s) => s.target).slice(1, -1).sort()).toEqual(['board', 'bridge', 'buttons', 'list', 'sets', 'status', 'tabs']);
    for (const s of NAVI_COACH) expect(s.text.length).toBeGreaterThan(0);
  });

  it('見たら「説明」から読み返せる（説明の窓 growth_navi に、セットのことも書いてある）', () => {
    const tip = TIPS.find((t) => t.id === 'growth_navi')!;
    expect(tip.body).toContain('セット');
  });
});
