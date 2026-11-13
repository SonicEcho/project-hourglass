import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove } from '../../src/core';
import { A3S_LORD, CHAIN_BOSS_GRADE, A3S_COMBOS, A3S_ENEMY_SNAP, A3S_ENEMY_SNAPS, AKARI, AREA_BATTLES, AREAS, CHAIN_ALLY_SPECIALS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_MAIN_CARDS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, CHAIN_TRIALS, HERO, MIO, SAYOKO } from '../../src/data';

// 段階181（段取りの段階F6a）：祭りの夜の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a3s') && !AREA_BATTLES[id].boss);

describe('祭りの夜の雑魚を新しい戦闘に（段階181）', () => {
  it('祭りの夜の雑魚は全部新しい戦闘（段階182 でやぐらのぬしも）', () => {
    expect(ids.length).toBeGreaterThan(8);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).toContain('a3s2_boss');
  });
  it('敵ごとの性質：風車＝割り込み・飴細工＝足止め・提灯＝ダウン時爆発・蓄音機＝なし', () => {
    const trait: Record<string, string | undefined> = { pinwheelNoise: 'interrupt', candyNoise: 'sticky', lanternNoise: 'pop', phonographNoise: undefined };
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
  it('1晩目は風車（割り込み）から。最初の戦闘は風車だけ。飴細工と蓄音機は1晩目の後ろから', () => {
    expect(new Set(AREA_BATTLES.a3s1_torii.enemies.map((e) => e.id))).toEqual(new Set(['pinwheelNoise']));
    for (const id of ['a3s1_torii', 'a3s1_torii2', 'a3s1_stalls', 'a3s1_stalls2']) expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'pinwheelNoise' || e.id === 'lanternNoise')).toBe(true);
  });
  it('敵のスナップ・宝箱の札・小夜子の専用の札とコンボ「デジャヴ」', () => {
    for (const [enemy, snap] of Object.entries(A3S_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const got = [...AREAS.a3s1.chests, ...AREAS.a3s2.chests].flatMap((c) => c.chainSnaps ?? []);
    expect(got.sort()).toEqual(['c17_panorama', 'c17_rewind']);
    for (const id of got) expect(CHAIN_SNAPS[id]).toBeDefined();
    expect(CHAIN_ALLY_SPECIALS.sayoko).toEqual(['c17_twinCut', 'c17_twinCut']);
    expect(CHAIN_MAIN_CARDS.c17_twinCut.owner).toBe('sayoko');
    expect(CHAIN_SNAPS.c17_twinCut).toBeUndefined();
    const deja = A3S_COMBOS.find((l) => l.id === 'dejaVu')!;
    expect(deja.members).toEqual(['akari', 'sayoko']);
  });
  it('小夜子が並びにいると、専用の札とデジャヴが使える。いなければ外れる', () => {
    const st = CHAIN_AREA_SETUPS.a3s2_torii;
    const withS = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, SAYOKO, AKARI], enemies: AREA_BATTLES.a3s2_torii.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(withS.deck).toContain('c17_twinCut');
    expect(withS.links.map((l) => l.id)).toContain('dejaVu');
    const without = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI, MIO], enemies: AREA_BATTLES.a3s2_torii.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(without.deck).not.toContain('c17_twinCut');
    expect(without.links.map((l) => l.id)).not.toContain('dejaVu');
  });
  it('割り込みの敵がいると、その説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a3s1_torii;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI, MIO], enemies: AREA_BATTLES.a3s1_torii.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_interrupt');
  });
});

describe('先回り（段階181。風車ノイズのスナップ）', () => {
  const BASE = CHAIN_TRIALS[0];
  const foe = (at: number): ChainEnemyDef => ({ id: 'f', name: 'f', hp: 9999, atk: 5, def: 10, weak: [], resist: [], pattern: [{ id: 'hit', name: 'たたく', at, element: 'physical', power: 5 }] });
  const PRE: ChainMove = A3S_ENEMY_SNAP.preempt;
  const run = (at: number) => {
    const def: ChainBattleDef = { ...BASE, enemies: [foe(at)], variants: undefined, cards: { ...BASE.cards, [PRE.id]: PRE } };
    const s = createChainBattle(def, CHAIN_RULES, 2);
    s.hand = [PRE.id];
    const r = runChainRound(s, [{ ally: s.allies[0].uid, source: { kind: 'card', index: 0 }, target: s.enemies[0].uid, addons: [] }]);
    const ev = r.frames.flatMap((f) => f.events);
    return { pre: ev.some((e) => e.type === 'preempt'), dmg: (ev.find((e) => e.type === 'damage' && e.from === s.allies[0].uid) as Extract<ChainEvent, { type: 'damage' }>).amount };
  };
  it('ねらった敵が、まだ動いていなければ2倍。もう動いていればふつう', () => {
    const before = run(8);
    const after = run(1);
    expect(before.pre).toBe(true);
    expect(after.pre).toBe(false);
    expect(before.dmg).toBeGreaterThan(after.dmg * 1.7);
  });
});

describe('やぐらのぬし「くり返しを越える」（段階182）', () => {
  const st = CHAIN_AREA_SETUPS.a3s2_boss;
  it('ぬしと部位（大太鼓・提灯の綱＝氷の弱点）。くり返しの決まり。報酬は ★3 のアタック+30', () => {
    expect(st.enemies.filter((e) => e.part).map((e) => e.id).sort()).toEqual(['yaguraLord_drum', 'yaguraLord_lanternRope']);
    expect(st.enemies.find((e) => e.id === 'yaguraLord_lanternRope')!.part!.reveals).toEqual(['ice']);
    expect(st.repeat).toEqual({ target: 'yaguraLord', rate: A3S_LORD.rate, need: A3S_LORD.need });
    expect(st.snaps).toEqual(['c17_plus30']);
    expect(CHAIN_SNAPS.c17_plus30).toBeDefined();
    expect(st.gradeAt).toEqual(CHAIN_BOSS_GRADE.a3s2_boss);
  });
  it('最初のぬし戦で、くり返しの説明が出る', () => {
    const def = buildMainChainBattle({ id: 'a3s2_boss', name: 'x', party: [HERO, SAYOKO, AKARI], enemies: AREA_BATTLES.a3s2_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, repeat: st.repeat });
    const s = createChainBattle(def, CHAIN_RULES, 1);
    expect(s.fireworks).toBe(0);
    expect(chainTipTriggers(s)).toContain('chain_repeat');
  });
});

describe('祭りの夜（カイ）の砂嵐を新しい戦闘に（段階183）', () => {
  const kIds = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a3k_') && !AREA_BATTLES[id].boss);
  it('砂嵐は全部新しい戦闘。祭りの夜の敵が、祭りの夜の性質のまま。宝箱に黄フィルター', () => {
    expect(kIds.length).toBe(4);
    const trait: Record<string, string | undefined> = { pinwheelNoise: 'interrupt', candyNoise: 'sticky', lanternNoise: 'pop', phonographNoise: undefined };
    for (const id of kIds) {
      expect(CHAIN_AREA_BATTLES).toContain(id);
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) expect(e.trait).toBe(trait[e.id]);
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
    }
    expect(AREAS.a3k.chests.flatMap((c) => c.chainSnaps ?? [])).toEqual(['c17_filterYellow']);
    expect(CHAIN_SNAPS.c17_filterYellow).toBeDefined();
  });
});
