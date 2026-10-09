import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/core';
import { battleTipTriggers, createBattle, exploreTipTriggers, markTipSeen, nextTip, parseSeenTips, serializeSeenTips, startExplore } from '../../src/core';
import { AREA_BATTLES, AREAS, CHAPTER1_LINEUP, createCampaignSetup, PARTY, TIPS } from '../../src/data';
import { lineupMembers } from '../../src/core';

// 初めての人向けの説明（段階30）

const members = lineupMembers(PARTY, CHAPTER1_LINEUP);
const storm = (seed = 1): BattleState => createBattle(createCampaignSetup(AREA_BATTLES.a11_storm1, seed, members));
const boss = (seed = 1): BattleState => createBattle(createCampaignSetup(AREA_BATTLES.a11_boss, seed, members));

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

  it('戦闘：計画の始めは「行動を選んで実行」。オートは画面が許した時だけ', () => {
    const s = storm();
    expect(battleTipTriggers(s, { autoAvailable: false })).toContain('battle_plan');
    expect(battleTipTriggers(s, { autoAvailable: false })).not.toContain('battle_auto');
    expect(battleTipTriggers(s, { autoAvailable: true })).toContain('battle_auto');
    // 雑魚戦の始めは、弱点・延長・大技の説明は出さない
    const t = battleTipTriggers(s, { autoAvailable: false });
    for (const id of ['battle_weak', 'battle_extend', 'battle_baton', 'battle_boss']) expect(t).not.toContain(id);
  });

  it('戦闘：ダウンや弱点が見つかった後は「弱点とダウン」、追加行動では「延長」と「バトンタッチ」', () => {
    const s = storm();
    const downed: BattleState = { ...s, log: [...s.log, { type: 'down', enemyId: s.enemies[0].uid }] };
    expect(battleTipTriggers(downed, { autoAvailable: false })).toContain('battle_weak');
    const extra: BattleState = { ...s, phase: 'extra', extra: { actorId: s.allies[0].uid, chain: [], boost: false } };
    const t = battleTipTriggers(extra, { autoAvailable: false });
    expect(t).toContain('battle_extend');
    expect(t).toContain('battle_baton');
    expect(t).not.toContain('battle_plan');
  });

  it('戦闘：部位のあるボスでは「部位破壊と大技」、ゲージが満タンなら「連携技」', () => {
    expect(battleTipTriggers(boss(), { autoAvailable: false })).toContain('battle_boss');
    expect(battleTipTriggers(storm(), { autoAvailable: false })).not.toContain('battle_link');
    expect(battleTipTriggers({ ...storm(), linkGauge: 100 }, { autoAvailable: false })).toContain('battle_link');
  });

  it('戦闘：出したい説明は、どれも説明の文がある', () => {
    const ids = new Set(TIPS.map((t) => t.id));
    const s = { ...boss(), linkGauge: 100 };
    for (const id of battleTipTriggers(s, { autoAvailable: true })) expect(ids.has(id)).toBe(true);
    for (const id of exploreTipTriggers({ ...startExplore(AREAS.a11), koma: 1 }, { atCheckpoint: true })) expect(ids.has(id)).toBe(true);
  });

  it('探索：はじめは「探索」、チェックポイントで「チェックポイント」、コマを持つと「コマ集め」', () => {
    const s = startExplore(AREAS.a11);
    expect(exploreTipTriggers(s, { atCheckpoint: false })).toEqual(['explore_basic']);
    expect(exploreTipTriggers(s, { atCheckpoint: true })).toEqual(['explore_basic', 'explore_checkpoint']);
    expect(exploreTipTriggers({ ...s, koma: 2 }, { atCheckpoint: false })).toEqual(['explore_basic', 'explore_koma']);
  });
});
