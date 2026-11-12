import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle } from '../../src/core';
import { A21_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, HERO, MIO } from '../../src/data';
import { grownParty } from '../../src/sim/autoArea';
import { autoChainBattle } from '../../src/sim/chainAuto';
import { growthPreset } from '../../src/sim/presets';

// 段階170（段取りの段階F2a）：2-1 の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a21_n') || id === 'a21_runner' || id === 'a21_alley') && !AREA_BATTLES[id].boss);
const PARTY = [HERO, AKARI, MIO];

describe('2-1 の雑魚を新しい戦闘に（段階170）', () => {
  it('2-1 の雑魚は全部新しい戦闘。ぬしはまだ今の戦闘（段階F2b）', () => {
    expect(ids.length).toBe(16);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).not.toContain('a21_boss');
  });
  it('敵ごとの性質：歯車＝かたい・そろばん＝バリア（2発）・ネジ＝分裂・真空管＝なし。敵の id は今の敵のまま', () => {
    const trait: Record<string, string | undefined> = { gearNoise: 'hard', abacusNoise: 'shell', screwNoise: 'split', tubeNoise: undefined };
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) expect(e.trait).toBe(trait[e.id]);
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
    }
    expect(CHAIN_AREA_SETUPS.a21_n1_lower.enemies[0].shellHits).toBe(2);
    expect(CHAIN_AREA_SETUPS.a21_n2_yard1.enemies[0].splitInto?.id).toBe('screwNoise_mini');
  });
  it('1晩目は、歯車（かたい）とそろばん（バリア）だけ。1戦目はかたいだけ', () => {
    for (const id of ids.filter((x) => x.startsWith('a21_n1_') || x === 'a21_alley')) {
      expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'gearNoise' || e.id === 'abacusNoise')).toBe(true);
    }
    expect(new Set(AREA_BATTLES.a21_n1_gate.enemies.map((e) => e.id))).toEqual(new Set(['gearNoise']));
  });
  it('敵のスナップ・宝箱の札・コンボ', () => {
    for (const [enemy, snap] of Object.entries(A21_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const chests = AREAS.a21.chests;
    expect(chests.flatMap((c) => c.chainSnaps ?? []).sort()).toEqual(['c17_bigShot', 'c17_burst', 'c17_split']);
    for (const id of chests.flatMap((c) => c.chainSnaps ?? [])) expect(CHAIN_SNAPS[id]).toBeDefined();
    expect(CHAIN_AREA_SETUPS.a21_n1_gate.links.map((l) => l.id)).toEqual(expect.arrayContaining(['crossDrive', 'biribiri', 'thunderRain']));
  });
  it('かたい・バリアの敵がいると、その説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a21_n1_road;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: PARTY, enemies: AREA_BATTLES.a21_n1_road.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toEqual(expect.arrayContaining(['chain_hard', 'chain_shell']));
  });
  it('2-1 に入る時点の控えめな育ち具合のハルト・あかり・みおで勝てる（考える方針）', () => {
    const pre = growthPreset('a21_enter', 'low');
    const party = grownParty(pre.carry.growth, pre.carry.armory, PARTY, pre.carry.navi);
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      const def = buildMainChainBattle({ id, name: id, party, enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, variants: st.variants, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
      expect(autoChainBattle(def, CHAIN_RULES, 5, 'smart').outcome).toBe('win');
    }
  }, 60000);
});

describe('性質の名前（段階170）', () => {
  it('新しい戦闘の区画に出る性質は、どれも名前と説明がある', async () => {
    const { CHAIN_TRAIT_TEXT } = await import('../../src/data');
    for (const st of Object.values(CHAIN_AREA_SETUPS)) for (const e of st.enemies) if (e.trait) expect(CHAIN_TRAIT_TEXT[e.trait]?.name).toBeTruthy();
  });
});
