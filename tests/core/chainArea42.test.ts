import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle } from '../../src/core';
import { A42_COMBOS, A42_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_ALLY_SPECIALS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_MAIN_CARDS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, HAYASE, HERO, MIO } from '../../src/data';

// 段階189（段取りの段階F10a）：4-2 の雑魚の戦闘を新しい戦闘に・早瀬
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a42_n') || id === 'a42_runner') && !AREA_BATTLES[id].boss);

describe('4-2 の雑魚を新しい戦闘に（段階189）', () => {
  it('4-2 の雑魚は全部新しい戦闘（シャッターのぬしはまだ）', () => {
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).not.toContain('a42_boss');
  });
  it('敵ごとの性質：ヨーヨー＝巻き戻し・ポケベル＝予定隠し・鳩時計＝速い・紙風船と花輪＝なし', () => {
    const trait: Record<string, string | undefined> = { yoyoNoise: 'rewind', pagerNoise: 'veil', cuckooNoise: 'fast', paperballoonNoise: undefined, wreathNoise: undefined };
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) {
        expect(e.id in trait).toBe(true);
        expect(e.trait).toBe(trait[e.id]);
        if (e.trait) expect(CHAIN_TRAIT_TEXT[e.trait]?.name).toBeTruthy();
      }
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
    }
  });
  it('1晩目はヨーヨーと紙風船だけ。ポケベルと鳩時計は2晩目から', () => {
    for (const id of ids.filter((x) => x.startsWith('a42_n1_'))) expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'yoyoNoise' || e.id === 'paperballoonNoise')).toBe(true);
    expect(ids.filter((x) => x.startsWith('a42_n2_')).flatMap((id) => AREA_BATTLES[id].enemies.map((e) => e.id))).toEqual(expect.arrayContaining(['pagerNoise', 'cuckooNoise']));
  });
  it('敵のスナップ・宝箱の札・早瀬の専用の札とコンボ「時計屋の二人」', () => {
    for (const [enemy, snap] of Object.entries(A42_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const got = AREAS.a42.chests.flatMap((c) => c.chainSnaps ?? []);
    expect(got.sort()).toEqual(['c17_filterRed', 'c17_pinpoint', 'c17_zoom']);
    expect(CHAIN_ALLY_SPECIALS.hayase).toEqual(['c17_repairFire', 'c17_repairFire']);
    expect(CHAIN_MAIN_CARDS.c17_repairFire.owner).toBe('hayase');
    expect(A42_COMBOS.find((l) => l.id === 'clockShop')!.members).toEqual(['hero', 'hayase']);
  });
  it('早瀬が並びにいると、専用の札と時計屋の二人が使える。巻き戻しの説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a42_n1_gate;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, HAYASE, AKARI], enemies: AREA_BATTLES.a42_n1_gate.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(def.deck).toContain('c17_repairFire');
    expect(def.links.map((l) => l.id)).toContain('clockShop');
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_rewind');
    const without = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI, MIO], enemies: AREA_BATTLES.a42_n1_gate.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(without.deck).not.toContain('c17_repairFire');
  });
});
