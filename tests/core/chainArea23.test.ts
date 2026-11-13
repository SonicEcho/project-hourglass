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
  it('2-3 の雑魚は全部新しい戦闘（段階175 でぬしとカイも）', () => {
    expect(ids.length).toBe(15);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).toContain('a23_boss');
    expect(CHAIN_AREA_BATTLES).toContain('a23_kai');
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


describe('2-3 のぬし「打ち返す」とカイの負け戦（段階175）', () => {
  it('毎ラウンド投球が1〜2球。3つで三振。部位は得点板とバックネット（バックネットを壊すと氷の弱点）。スナップはジャストミート', () => {
    const st = CHAIN_AREA_SETUPS.a23_boss;
    expect(st.pitch).toEqual({ out: 3, mult: 2 });
    const body = st.enemies.find((e) => !e.part)!;
    for (const m of body.pattern) expect((m.with ?? []).filter((w) => w.pitch).length).toBeGreaterThanOrEqual(1);
    const parts = st.enemies.filter((e) => e.part);
    expect(parts.map((p) => p.id).sort()).toEqual(['scoreboardLord_backstop', 'scoreboardLord_scoreboard']);
    expect(parts.find((p) => p.id === 'scoreboardLord_backstop')?.part?.reveals).toEqual(['ice']);
    expect(CHAIN_SNAPS[CHAIN_ENEMY_SNAPS.scoreboardLord]?.name).toBe('ジャストミート');
    for (const id of st.snaps ?? []) expect(CHAIN_SNAPS[id]).toBeDefined();
  });
  it('最初のぬし戦で、打ち返すの説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a23_boss;
    const def = buildMainChainBattle({ id: 'a23_boss', name: 'x', party: PARTY, enemies: AREA_BATTLES.a23_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, pitch: st.pitch });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_pitch');
  });
  it('カイの負け戦：決まったラウンドで打ち切られる（2-3 に入る時点の育ち具合では倒しきれない）', () => {
    const st = CHAIN_AREA_SETUPS.a23_kai;
    const pre = growthPreset('a23_enter', 'normal');
    const party = grownParty(pre.carry.growth, pre.carry.armory, PARTY, pre.carry.navi);
    const def = buildMainChainBattle({ id: 'a23_kai', name: 'x', party, enemies: AREA_BATTLES.a23_kai.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, cutoffRounds: AREA_BATTLES.a23_kai.cutoff?.rounds });
    for (let k = 0; k < 5; k++) expect(autoChainBattle(def, CHAIN_RULES, k, 'smart').outcome).not.toBe('win');
  }, 60000);
});

describe('2-3x の書庫とカイの切り取り（段階176）', () => {
  it('砂嵐は過去の区画の性質のまま。カイの戦闘は2つとも新しい戦闘で、切り取りを持つ', () => {
    const xs = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a23x_'));
    for (const id of xs) expect(CHAIN_AREA_BATTLES).toContain(id);
    const alcove = CHAIN_AREA_SETUPS.a23x_alcove.enemies;
    expect(alcove.find((e) => e.id === 'tinNoise')?.trait).toBe('shield');
    expect(CHAIN_AREA_SETUPS.a23x_reading1.enemies.find((e) => e.id === 'gearNoise')?.trait).toBe('hard');
    for (const id of ['a23x_kai', 'a23x_kai_patrol', 'a23_kai']) expect(CHAIN_AREA_SETUPS[id].enemies[0].pattern.some((m) => m.cutsFrame)).toBe(true);
  });
  it('2-3x に入る時点の控えめな育ち具合で、砂嵐に勝てる（考える方針）', () => {
    const pre = growthPreset('a23x_enter', 'low');
    const party = grownParty(pre.carry.growth, pre.carry.armory, PARTY, pre.carry.navi);
    for (const id of Object.keys(AREA_BATTLES).filter((x) => x.startsWith('a23x_') && !AREA_BATTLES[x].boss)) {
      const st = CHAIN_AREA_SETUPS[id];
      const def = buildMainChainBattle({ id, name: id, party, enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
      expect(autoChainBattle(def, CHAIN_RULES, 5, 'smart').outcome).toBe('win');
    }
  }, 60000);
});
