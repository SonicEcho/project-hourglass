import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle } from '../../src/core';
import { A22_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, HERO, MIO } from '../../src/data';
import { grownParty } from '../../src/sim/autoArea';
import { autoChainBattle } from '../../src/sim/chainAuto';
import { growthPreset } from '../../src/sim/presets';

// 段階172（段取りの段階F3a）：2-2 の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a22_n') || id === 'a22_runner') && !AREA_BATTLES[id].boss);
const PARTY = [HERO, AKARI, MIO];

describe('2-2 の雑魚を新しい戦闘に（段階172）', () => {
  it('2-2 の雑魚は全部新しい戦闘。ぬしはまだ今の戦闘', () => {
    expect(ids.length).toBe(16);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).not.toContain('a22_boss');
  });
  it('敵ごとの性質：シール＝足止め・メトロノーム＝カウンター・ラジカセ＝かばう・ガラケー＝なし。敵の id は今の敵のまま', () => {
    const trait: Record<string, string | undefined> = { stickerNoise: 'sticky', metronomeNoise: 'counter', boomboxNoise: 'shield', flipPhoneNoise: undefined };
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
  it('1晩目は、シール（足止め）とメトロノーム（カウンター）だけ。1戦目は足止めだけ、2戦目はカウンターだけ', () => {
    for (const id of ids.filter((x) => x.startsWith('a22_n1_'))) {
      expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'stickerNoise' || e.id === 'metronomeNoise')).toBe(true);
    }
    expect(new Set(AREA_BATTLES.a22_n1_gate.enemies.map((e) => e.id))).toEqual(new Set(['stickerNoise']));
    expect(new Set(AREA_BATTLES.a22_n1_gate2.enemies.map((e) => e.id))).toEqual(new Set(['metronomeNoise']));
  });
  it('敵のスナップ・宝箱の札', () => {
    for (const [enemy, snap] of Object.entries(A22_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const got = AREAS.a22.chests.flatMap((c) => c.chainSnaps ?? []);
    expect(got.sort()).toEqual(['a22_snowscape', 'c17_flash', 'c17_highlight']);
    for (const id of got) expect(CHAIN_SNAPS[id]).toBeDefined();
  });
  it('足止め・カウンターの敵がいると、その説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a22_n1_stalls;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: PARTY, enemies: AREA_BATTLES.a22_n1_stalls.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toEqual(expect.arrayContaining(['chain_sticky', 'chain_counter']));
  });
  it('2-2 に入る時点の控えめな育ち具合のハルト・あかり・みおで勝てる（考える方針）', () => {
    const pre = growthPreset('a22_enter', 'low');
    const party = grownParty(pre.carry.growth, pre.carry.armory, PARTY, pre.carry.navi);
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      const def = buildMainChainBattle({ id, name: id, party, enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, variants: st.variants, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
      expect(autoChainBattle(def, CHAIN_RULES, 5, 'smart').outcome).toBe('win');
    }
  }, 60000);
});
