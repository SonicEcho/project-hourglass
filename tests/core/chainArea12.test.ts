import { describe, expect, it } from 'vitest';
import { buildMainChainBattle } from '../../src/core';
import { A12_ENEMY_SNAPS, AKARI, AREA_BATTLES, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, HERO } from '../../src/data';
import { autoChainBattle } from '../../src/sim/chainAuto';

// 段階168（段取りの段階F1a）：1-2 の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a12_n') || id === 'a12_runner') && !AREA_BATTLES[id].boss);

describe('1-2 の雑魚を新しい戦闘に（段階168）', () => {
  it('1-2 の雑魚は全部新しい戦闘（段階169 でぬしも）', () => {
    expect(ids.length).toBe(16);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).toContain('a12_boss');
  });
  it('敵ごとの性質：ブリキ＝かばう・ラムネ＝逃げ足・めんこ＝分裂・黒電話＝ダウン時爆発。落とし物のため、敵の id は今の敵のまま', () => {
    const trait: Record<string, string> = { tinNoise: 'shield', ramuneNoise: 'flee', menkoNoise: 'split', phoneNoise: 'pop' };
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) expect(e.trait).toBe(trait[e.id]);
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
      expect(st.variants.length).toBe(3);
    }
    const ramune = CHAIN_AREA_SETUPS.a12_runner.enemies[0];
    expect(ramune.pattern.some((m) => m.flee)).toBe(true);
    expect(CHAIN_AREA_SETUPS.a12_n2_upper.enemies[0].splitInto?.id).toBe('menkoNoise_mini');
  });
  it('1晩目は、ラムネ（逃げ足）とブリキ（かばう）だけ。1戦目は逃げ足だけ', () => {
    for (const id of ids.filter((x) => x.startsWith('a12_n1_'))) {
      expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'tinNoise' || e.id === 'ramuneNoise')).toBe(true);
    }
    expect(new Set(AREA_BATTLES.a12_n1_gate.enemies.map((e) => e.id))).toEqual(new Set(['ramuneNoise']));
    // 1つの戦闘の性質は、3晩目以外は2つまで
    for (const id of ids.filter((x) => !x.startsWith('a12_n3_'))) expect(new Set(AREA_BATTLES[id].enemies.map((e) => e.id)).size).toBeLessThanOrEqual(2);
  });
  it('敵のスナップ：4種類とも、アルバムに入れられる札', () => {
    for (const [enemy, snap] of Object.entries(A12_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
  });
  // 段階194：星図の技を入れ替えた（ハルトは斬るだけ）ので、1つのシードではなく、5つのシードの多くで勝てるかを見る（10戦で 7〜10勝）
  it('育成なしのハルトとあかりでも、たいてい勝てる（考える方針。逃げられても勝ち。5戦中3勝以上）', () => {
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      const def = buildMainChainBattle({ id, name: id, party: [HERO, AKARI], enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, variants: st.variants, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
      const wins = [1, 2, 3, 4, 5].filter((seed) => autoChainBattle(def, CHAIN_RULES, seed, 'smart').outcome === 'win').length;
      expect(wins, id).toBeGreaterThanOrEqual(3);
    }
  }, 120000);
});

describe('1-2 の性質の説明と宝箱（段階168）', () => {
  it('性質の敵が場にいると、その性質の説明が出る', async () => {
    const { chainTipTriggers, createChainBattle } = await import('../../src/core');
    const st = CHAIN_AREA_SETUPS.a12_n2_lane1;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: AREA_BATTLES.a12_n2_lane1.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    const tips = chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1));
    expect(tips).toEqual(expect.arrayContaining(['chain_pop', 'chain_split']));
    expect(tips).not.toContain('chain_shield');
  });
  it('1-2 の宝箱は、新しい戦闘のスナップも持つ', async () => {
    const { AREAS } = await import('../../src/data');
    const chests = AREAS.a12.chests.filter((c) => c.snaps?.length);
    expect(chests.length).toBeGreaterThan(0);
    for (const c of chests) for (const id of c.chainSnaps ?? []) expect(CHAIN_SNAPS[id]).toBeDefined();
    expect(chests.every((c) => c.chainSnaps?.length)).toBe(true);
  });
});

describe('1-2 のぬし「日が沈む前に」（段階169）', () => {
  it('夕日は4ラウンド。部位は前輪とベル（ベルを壊すと雷の弱点）。報酬はワイドショット（段階177）', () => {
    const st = CHAIN_AREA_SETUPS.a12_boss;
    expect(st.sunset).toEqual({ rounds: 4 });
    const parts = st.enemies.filter((e) => e.part);
    expect(parts.map((p) => p.id)).toEqual(['bicycleLord_frontWheel', 'bicycleLord_bell']);
    expect(parts[1].part?.reveals).toEqual(['thunder']);
    const body = st.enemies.find((e) => !e.part)!;
    expect(body.pattern.filter((m) => m.requiresPart).map((m) => m.requiresPart)).toEqual(['bicycleLord_frontWheel', 'bicycleLord_bell']);
    expect(st.snaps).toEqual(['c17_wide']);
    expect(CHAIN_SNAPS[CHAIN_ENEMY_SNAPS.bicycleLord]?.name).toBe('二人乗り');
  });
  it('最初のぬし戦で、日が沈む前にの説明が出る', async () => {
    const { chainTipTriggers, createChainBattle } = await import('../../src/core');
    const st = CHAIN_AREA_SETUPS.a12_boss;
    const def = buildMainChainBattle({ id: 'a12_boss', name: 'x', party: [HERO, AKARI], enemies: AREA_BATTLES.a12_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, sunset: st.sunset });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_sunset');
  });
});
