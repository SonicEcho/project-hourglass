import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle } from '../../src/core';
import { A23_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, HERO, MIO } from '../../src/data';
import { grownParty } from '../../src/sim/autoArea';
import { autoChainBattle } from '../../src/sim/chainAuto';
import { growthPreset } from '../../src/sim/presets';

// 段階174（段取りの段階F4a）：2-3 の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a23_n') || id === 'a23_runner') && !AREA_BATTLES[id].boss);
const PARTY = [HERO, AKARI, MIO];

describe('2-3 の雑魚を新しい戦闘に（段階174）', () => {
  it('2-3 の雑魚は全部新しい戦闘。ぬしとカイはまだ今の戦闘', () => {
    expect(ids.length).toBe(15);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).not.toContain('a23_boss');
    expect(CHAIN_AREA_BATTLES).not.toContain('a23_kai');
  });
  it('敵ごとの性質：水筒＝かたい・メガホン＝カウンター・ボール＝逃げ足・電子ペット＝なし。敵の id は今の敵のまま', () => {
    const trait: Record<string, string | undefined> = { jugNoise: 'hard', megaphoneNoise: 'counter', ballNoise: 'flee', petNoise: undefined };
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) {
        expect(e.trait).toBe(trait[e.id]);
        if (e.trait) expect(CHAIN_TRAIT_TEXT[e.trait]?.name).toBeTruthy();
      }
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
    }
  });
  it('1晩目は、水筒（かたい）とメガホン（カウンター）だけ', () => {
    for (const id of ids.filter((x) => x.startsWith('a23_n1_'))) {
      expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'jugNoise' || e.id === 'megaphoneNoise')).toBe(true);
    }
  });
  it('敵のスナップ・宝箱の札', () => {
    for (const [enemy, snap] of Object.entries(A23_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const got = AREAS.a23.chests.flatMap((c) => c.chainSnaps ?? []);
    expect(got.sort()).toEqual(['a23_hitoiki', 'a23_kitsuke', 'c17_imprint']);
    for (const id of got) expect(CHAIN_SNAPS[id]).toBeDefined();
  });
  it('かたい・カウンターの敵がいると、その説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a23_n1_bench;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: PARTY, enemies: AREA_BATTLES.a23_n1_bench.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toEqual(expect.arrayContaining(['chain_hard', 'chain_counter']));
  });
  it('2-3 に入る時点の控えめな育ち具合のハルト・あかり・みおで勝てる（考える方針）', () => {
    const pre = growthPreset('a23_enter', 'low');
    const party = grownParty(pre.carry.growth, pre.carry.armory, PARTY, pre.carry.navi);
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      const def = buildMainChainBattle({ id, name: id, party, enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, variants: st.variants, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
      expect(autoChainBattle(def, CHAIN_RULES, 5, 'smart').outcome).toBe('win');
    }
  }, 60000);
});

