import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle, runChainRound, type ChainEnemyDef, type ChainEvent } from '../../src/core';
import { A41_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, CHAIN_TRIALS, HERO, MIO } from '../../src/data';

// 段階187（段取りの段階F9a）：4-1 の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a41_n') || id === 'a41_runner') && !AREA_BATTLES[id].boss);
const PARTY = [HERO, AKARI, MIO];

describe('回復役（段階187）', () => {
  const foe = (id: string, extra: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id, name: id, hp: 1000, atk: 1, def: 10, weak: [], resist: [], pattern: [{ id: 'hit', name: 'たたく', at: 5, element: 'physical', power: 1 }], ...extra });
  it('動くと、ほかの敵の HP を回復する（最大まで）', () => {
    const s = createChainBattle({ ...CHAIN_TRIALS[0], enemies: [foe('healer', { trait: 'healer', healRate: 0.1 }), foe('other')], variants: undefined }, CHAIN_RULES, 1);
    s.enemies[1].hp = 500;
    s.enemies[0].hp = 500;
    const r = runChainRound(s, []);
    const heals = r.frames.flatMap((f) => f.events).filter((e) => e.type === 'enemyHeal') as Extract<ChainEvent, { type: 'enemyHeal' }>[];
    expect(heals.map((h) => [h.to, h.amount])).toEqual([[s.enemies[1].uid, 100]]);
    expect(r.state.enemies[1].hp).toBe(600);
    expect(r.state.enemies[0].hp).toBe(500);
  });
});

describe('4-1 の雑魚を新しい戦闘に（段階187）', () => {
  it('4-1 の雑魚は全部新しい戦闘（川のぬしはまだ）', () => {
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).not.toContain('a41_boss');
  });
  it('敵ごとの性質：虫かご＝予定隠し・すいか＝回復役・水鉄砲＝速い（時刻1〜2）・花火の燃えかすとお地蔵さま＝なし', () => {
    const trait: Record<string, string | undefined> = { bugcageNoise: 'veil', watermelonNoise: 'healer', watergunNoise: 'fast', fireworkNoise: undefined, jizoNoise: undefined };
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) {
        expect(e.id in trait).toBe(true);
        expect(e.trait).toBe(trait[e.id]);
        if (e.trait) expect(CHAIN_TRAIT_TEXT[e.trait]?.name).toBeTruthy();
        if (e.trait === 'fast') for (const v of st.variants) for (const p of v.patterns.flat().filter((m) => m?.id === 'squirt' || m?.id === 'pump')) expect(p?.at).toBeLessThanOrEqual(2);
      }
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
    }
  });
  it('1晩目は虫かごと水鉄砲だけ。すいかは2晩目から', () => {
    for (const id of ids.filter((x) => x.startsWith('a41_n1_'))) expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'bugcageNoise' || e.id === 'watergunNoise')).toBe(true);
    expect(ids.filter((x) => x.startsWith('a41_n2_')).flatMap((id) => AREA_BATTLES[id].enemies.map((e) => e.id))).toContain('watermelonNoise');
  });
  it('敵のスナップ・宝箱の札', () => {
    for (const [enemy, snap] of Object.entries(A41_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const got = AREAS.a41.chests.flatMap((c) => c.chainSnaps ?? []);
    expect(got.sort()).toEqual(['c17_exposure', 'c17_filterRed', 'c17_firstCut']);
    for (const id of got) expect(CHAIN_SNAPS[id]).toBeDefined();
  });
  it('予定隠し・速い・回復役の敵がいると、その説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a41_n1_gate;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: PARTY, enemies: AREA_BATTLES.a41_n1_gate.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toEqual(expect.arrayContaining(['chain_veil', 'chain_fast']));
    const st2 = CHAIN_AREA_SETUPS.a41_n2_ridge;
    const def2 = buildMainChainBattle({ id: 'y', name: 'y', party: PARTY, enemies: AREA_BATTLES.a41_n2_ridge.enemies, chainEnemies: st2.enemies, deck: st2.deck, cards: st2.cards, links: st2.links });
    expect(chainTipTriggers(createChainBattle(def2, CHAIN_RULES, 1))).toContain('chain_healer');
  });
});
