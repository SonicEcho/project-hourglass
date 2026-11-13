import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle, runChainRound, type ChainEnemyDef, type ChainEvent } from '../../src/core';
import { A41_ETERNAL, A41_LORD, A41_SPLASH, CHAIN_BOSS_GRADE, A41_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, CHAIN_TRIALS, HERO, MIO } from '../../src/data';

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
  it('4-1 の雑魚は全部新しい戦闘（段階188 で川のぬしも）', () => {
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).toContain('a41_boss');
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

describe('川のぬし「夏の照り返し」（段階188）', () => {
  const st = CHAIN_AREA_SETUPS.a41_boss;
  const body = st.enemies.find((e) => e.id === 'riverLord')!;
  it('部位（つば＝火の弱点・流れ）。照り返し（暑さ+1）と水しぶき（暑さ−1）。水をかけるを全員に。★3 で永遠の夏、返した時は長回し', () => {
    expect(st.enemies.filter((e) => e.part).map((e) => e.id).sort()).toEqual(['riverLord_brim', 'riverLord_current']);
    expect(st.enemies.find((e) => e.id === 'riverLord_brim')!.part!.reveals).toEqual(['fire']);
    const all = body.pattern.flatMap((m) => [m, ...(m.with ?? [])]);
    expect(all.filter((m) => m.heats).every((m) => m.requiresPart === 'riverLord_brim')).toBe(true);
    expect(all.some((m) => m.cools)).toBe(true);
    expect(st.heat).toEqual({ max: A41_LORD.heatMax });
    expect(st.allyMoves).toEqual([A41_SPLASH]);
    expect(st.snaps).toEqual([A41_ETERNAL.id]);
    expect(CHAIN_SNAPS[A41_ETERNAL.id]).toBeDefined();
    expect(st.gradeAt).toEqual(CHAIN_BOSS_GRADE.a41_boss);
    expect(AREAS.a41.chainReturnSnaps).toEqual(['c17_longTake']);
  });
  it('永遠の夏：添えると、この戦闘の終わりまで重さ −1（1より下がらない）', () => {
    const def = buildMainChainBattle({ id: 'a41_boss', name: 'x', party: PARTY, enemies: AREA_BATTLES.a41_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: { ...st.cards }, links: st.links, heat: st.heat, allyMoves: st.allyMoves });
    const s = createChainBattle(def, CHAIN_RULES, 1);
    s.hand = ['c17_closeUp', A41_ETERNAL.id, 'c17_quick'];
    const r = runChainRound(s, [{ ally: s.allies[0].uid, source: { kind: 'card', index: 0 }, target: s.enemies.find((e) => e.defId === 'riverLord')!.uid, addons: [1] }]);
    expect(r.frames.flatMap((f) => f.events).some((e) => e.type === 'lighten')).toBe(true);
    expect(r.state.lighten).toBe(true);
  });
  it('最初のぬし戦で、照り返しの説明が出る', () => {
    const def = buildMainChainBattle({ id: 'a41_boss', name: 'x', party: PARTY, enemies: AREA_BATTLES.a41_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, heat: st.heat, allyMoves: st.allyMoves });
    const s = createChainBattle(def, CHAIN_RULES, 1);
    expect(def.allies.every((a) => a.moves.some((m) => m.id === A41_SPLASH.id))).toBe(true);
    expect(chainTipTriggers(s)).toContain('chain_heat');
  });
});
