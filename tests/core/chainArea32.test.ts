import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle } from '../../src/core';
import { A32_QUIET, A32_WORD, CHAIN_BOSS_GRADE, CHAIN_MAIN_CARDS, A32_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, HERO, MIO } from '../../src/data';

// 段階185（段取りの段階F8a）：3-2 の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a32_n') || id === 'a32_runner') && !AREA_BATTLES[id].boss);
const PARTY = [HERO, AKARI, MIO];

describe('3-2 の雑魚を新しい戦闘に（段階185）', () => {
  it('3-2 の雑魚は全部新しい戦闘（段階186 で踏切のぬしも）', () => {
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).toContain('a32_boss');
  });
  it('敵ごとの性質：自撮り棒＝割り込み・イヤホン＝ダウン解除・タピオカ＝自爆・筒＝2回行動・寄せ書き＝なし', () => {
    const trait: Record<string, string | undefined> = { selfieNoise: 'interrupt', earphoneNoise: 'waker', tapiocaNoise: 'timer', diplomaNoise: 'swift', yosegakiNoise: undefined };
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) {
        expect(e.id in trait).toBe(true);
        expect(e.trait).toBe(trait[e.id]);
        if (e.trait) expect(CHAIN_TRAIT_TEXT[e.trait]?.name).toBeTruthy();
        if (e.trait === 'swift') expect(e.pattern.every((p) => p.at2 !== undefined && p.at2 > p.at)).toBe(true);
      }
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
    }
  });
  it('1晩目は自撮り棒と筒だけ。イヤホンとタピオカは2晩目から', () => {
    for (const id of ids.filter((x) => x.startsWith('a32_n1_'))) expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'selfieNoise' || e.id === 'diplomaNoise')).toBe(true);
    const n2 = ids.filter((x) => x.startsWith('a32_n2_')).flatMap((id) => AREA_BATTLES[id].enemies.map((e) => e.id));
    expect(n2).toEqual(expect.arrayContaining(['earphoneNoise', 'tapiocaNoise']));
  });
  it('敵のスナップ（技から）・宝箱の札', () => {
    for (const [enemy, snap] of Object.entries(A32_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const got = AREAS.a32.chests.flatMap((c) => c.chainSnaps ?? []);
    expect(got.sort()).toEqual(['c17_filterBlue', 'c17_pinpoint', 'c17_rainbow']);
    for (const id of got) expect(CHAIN_SNAPS[id]).toBeDefined();
  });
  it('3章の性質の説明は、まだ見ていなければ出る（3-1・祭りの夜で見ていれば出ない）', () => {
    const st = CHAIN_AREA_SETUPS.a32_n1_gate;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: PARTY, enemies: AREA_BATTLES.a32_n1_gate.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toEqual(expect.arrayContaining(['chain_interrupt', 'chain_swift']));
  });
});

describe('踏切のぬし「言えなかった言葉」（段階186）', () => {
  const st = CHAIN_AREA_SETUPS.a32_boss;
  it('部位（警報機＝氷の弱点・遮断機）。言えなかった言葉は警報機に結び付く。報酬（★3 のズームイン・言わずに勝ったなんでもない・返した時の巻き上げ）', () => {
    expect(st.enemies.filter((e) => e.part).map((e) => e.id).sort()).toEqual(['crossingLord_alarm', 'crossingLord_barrier']);
    expect(st.enemies.find((e) => e.id === 'crossingLord_alarm')!.part!.reveals).toEqual(['ice']);
    expect(st.word).toEqual({ card: A32_WORD.id, part: 'crossingLord_alarm' });
    expect(st.snaps).toEqual(['c17_zoom']);
    expect(st.quietSnaps).toEqual([A32_QUIET.id]);
    expect(st.gradeAt).toEqual(CHAIN_BOSS_GRADE.a32_boss);
    expect(AREAS.a32.chainReturnSnaps).toEqual(['c17_reel']);
    for (const id of ['c17_zoom', A32_QUIET.id, 'c17_reel']) expect(CHAIN_SNAPS[id]).toBeDefined();
  });
  it('「あのね」は戦闘の札にあるが、アルバムには入らない', () => {
    expect(CHAIN_MAIN_CARDS[A32_WORD.id]).toBeDefined();
    expect(CHAIN_SNAPS[A32_WORD.id]).toBeUndefined();
  });
  it('最初のぬし戦で、言えなかった言葉の説明が出る。手札に「あのね」', () => {
    const def = buildMainChainBattle({ id: 'a32_boss', name: 'x', party: PARTY, enemies: AREA_BATTLES.a32_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, word: st.word });
    const s = createChainBattle(def, CHAIN_RULES, 1);
    expect(s.hand).toContain(A32_WORD.id);
    expect(chainTipTriggers(s)).toContain('chain_word');
  });
});
