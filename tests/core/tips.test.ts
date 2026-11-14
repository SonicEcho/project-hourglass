import { describe, expect, it } from 'vitest';
import { exploreTipTriggers, markTipSeen, nextTip, parseSeenTips, serializeSeenTips, startExplore } from '../../src/core';
import { AREAS, TIPS } from '../../src/data';

// 初めての人向けの説明（段階30）


describe('説明（段階30）', () => {
  it('説明の id は重ならず、文がある', () => {
    const ids = TIPS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TIPS) {
      expect(t.title).not.toBe('');
      expect(t.body).not.toBe('');
    }
  });

  it('出したい説明のうち、まだ見ていないものを、説明の並び順で1つ選ぶ', () => {
    expect(nextTip(TIPS, [], ['battle_extend', 'battle_plan'])?.id).toBe('battle_plan');
    expect(nextTip(TIPS, ['battle_plan'], ['battle_extend', 'battle_plan'])?.id).toBe('battle_extend');
    expect(nextTip(TIPS, ['battle_plan', 'battle_extend'], ['battle_extend', 'battle_plan'])).toBeNull();
    expect(nextTip(TIPS, [], [])).toBeNull();
  });

  it('見た説明を覚える。保存した文字が壊れていても空として読む', () => {
    const seen = markTipSeen(markTipSeen([], 'a'), 'a');
    expect(seen).toEqual(['a']);
    expect(parseSeenTips(serializeSeenTips(['a', 'b']))).toEqual(['a', 'b']);
    expect(parseSeenTips('["a",1,"a"]')).toEqual(['a']);
    expect(parseSeenTips('{')).toEqual([]);
    expect(parseSeenTips(null)).toEqual([]);
  });






  it('探索：はじめは「探索」、チェックポイントで「チェックポイント」、コマを持つと「コマ集め」', () => {
    const s = startExplore(AREAS.a11);
    expect(exploreTipTriggers(s, { atCheckpoint: false })).toEqual(['explore_basic']);
    expect(exploreTipTriggers(s, { atCheckpoint: true })).toEqual(['explore_basic', 'explore_checkpoint']);
    expect(exploreTipTriggers({ ...s, koma: 2 }, { atCheckpoint: false })).toEqual(['explore_basic', 'explore_koma']);
    // 段階45：記憶をたどる時は「記憶をたどる」
    expect(exploreTipTriggers(s, { atCheckpoint: false, hunting: true })).toEqual(['explore_basic', 'explore_hunt']);
  });

});
