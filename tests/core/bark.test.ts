import { describe, expect, it } from 'vitest';
import type { ChainEvent, ChainState } from '../../src/core';
import { NEW_BARK_MEMORY, pickChainBarks, victoryBark } from '../../src/core';
import { BARK_CAST, BARK_RULES, BARKS, CAST, LINKS, PARTY } from '../../src/data';

// 戦闘中のひとこと（段階46a。段階206 で新しい戦闘に移した。docs/design/battle.md の 0-9）

describe('ひとことのデータ', () => {
  it('どの台詞の表情も、その人の会話の表情にある', () => {
    for (const [id, triggers] of Object.entries(BARKS)) {
      const cast = CAST[BARK_CAST[id]];
      expect(cast, id).toBeDefined();
      for (const lines of Object.values(triggers)) for (const l of lines ?? []) expect(Object.keys(cast.faces), `${id} ${l.text}`).toContain(l.face);
    }
  });

  it('連携技の2人には、呼ぶ台詞と答える台詞がある', () => {
    for (const link of LINKS) for (const id of link.members) {
      expect(BARKS[id]?.linkCall?.length, id).toBeGreaterThan(0);
      expect(BARKS[id]?.linkAnswer?.length, id).toBeGreaterThan(0);
    }
  });
});

describe('ひとことのデータ（段階206）', () => {
  it('5人の仲間みんなに、どの場面の台詞もある', () => {
    for (const c of PARTY) {
      expect(BARK_CAST[c.id], c.id).toBeDefined();
      for (const t of ['weak', 'hurt', 'allyDown', 'linkCall', 'linkAnswer', 'victory'] as const) expect(BARKS[c.id]?.[t]?.length, `${c.id} ${t}`).toBeGreaterThan(0);
    }
  });
});

/** ひとことを確かめるための小さな戦闘の状態（仲間2人・敵1体） */
function state(hp: [number, number], over: Partial<ChainState> = {}): ChainState {
  const unit = (uid: string, defId: string, name: string, h: number) => ({ uid, defId, name, side: 'ally', hp: h, maxHp: 100 });
  return { round: 1, outcome: 'ongoing', allies: [unit('a1', 'hero', 'ハルト', hp[0]), unit('a2', 'akari', 'あかり', hp[1])], enemies: [], ...over } as unknown as ChainState;
}
const dmg = (from: string, to: string, amount: number, weak = false): ChainEvent => ({ type: 'damage', from, to, amount, weak, resist: false });
const act = (uid: string): ChainEvent => ({ type: 'act', uid, name: 'x', at: 1 });

describe('新しい戦闘のひとこと（段階206）', () => {
  it('弱点を突いた仲間がひとこと。出した後の2回の行動では、弱点・削られたは出さない', () => {
    const r = pickChainBarks(state([100, 100]), state([100, 100]), [act('a1'), dmg('a1', 'e1', 30, true)], BARKS, BARK_RULES, NEW_BARK_MEMORY);
    expect(r.after?.trigger).toBe('weak');
    expect(r.after?.allyId).toBe('hero');
    expect(r.memory.cooldown).toBe(BARK_RULES.cooldown);
    const r2 = pickChainBarks(state([100, 100]), state([100, 100]), [act('a1'), dmg('a1', 'e1', 30, true)], BARKS, BARK_RULES, r.memory);
    expect(r2.after).toBeNull();
    expect(r2.memory.cooldown).toBe(BARK_RULES.cooldown - 1);
  });

  it('1回で最大 HP の4割以上、または残りが3割を切ると、削られた仲間がひとこと。弱点より先', () => {
    const big = pickChainBarks(state([100, 100]), state([100, 55]), [act('e1'), dmg('e1', 'a2', 45), dmg('a1', 'e1', 10, true)], BARKS, BARK_RULES, NEW_BARK_MEMORY);
    expect(big.after).toMatchObject({ trigger: 'hurt', allyId: 'akari' });
    const pinch = pickChainBarks(state([35, 100]), state([25, 100]), [act('e1'), dmg('e1', 'a1', 10)], BARKS, BARK_RULES, NEW_BARK_MEMORY);
    expect(pinch.after).toMatchObject({ trigger: 'hurt', allyId: 'hero' });
    const small = pickChainBarks(state([100, 100]), state([80, 100]), [act('e1'), dmg('e1', 'a1', 20)], BARKS, BARK_RULES, NEW_BARK_MEMORY);
    expect(small.after).toBeNull();
  });

  it('仲間が倒れたら、ほかの生きている仲間が名前を呼ぶ（間をおく間でも出す）', () => {
    const r = pickChainBarks(state([10, 100]), state([0, 100]), [act('e1'), dmg('e1', 'a1', 10), { type: 'defeat', uid: 'a1' }], BARKS, BARK_RULES, { cooldown: 2 });
    expect(r.after).toMatchObject({ trigger: 'allyDown', allyId: 'akari' });
    expect(r.after?.text).toContain('ハルト');
  });

  it('コンボは1人目が呼び、2人目が答える。弱点のひとことは重ねない', () => {
    const r = pickChainBarks(state([100, 100]), state([100, 100]), [{ type: 'link', name: 'コンボ', uids: ['a1', 'a2'] }, act('a1'), dmg('a1', 'e1', 50, true)], BARKS, BARK_RULES, NEW_BARK_MEMORY);
    expect(r.link.map((b) => [b.trigger, b.allyId])).toEqual([['linkCall', 'hero'], ['linkAnswer', 'akari']]);
    expect(r.link[0].text).toContain('あかり');
    expect(r.after).toBeNull();
  });

  it('勝った時は、生きている仲間の1人がひとこと。乱数を使わず、同じ状態なら同じ台詞', () => {
    const won = state([0, 80], { outcome: 'win' });
    const r = pickChainBarks(state([0, 80]), won, [act('a2')], BARKS, BARK_RULES, NEW_BARK_MEMORY);
    expect(r.victory).toMatchObject({ trigger: 'victory', allyId: 'akari' });
    expect(victoryBark(won, BARKS)).toEqual(r.victory);
    expect(victoryBark(state([0, 0]), BARKS)).toBeNull();
  });
});
