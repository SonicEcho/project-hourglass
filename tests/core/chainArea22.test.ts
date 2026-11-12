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
  it('2-2 の雑魚は全部新しい戦闘（段階173 でぬしも）', () => {
    expect(ids.length).toBe(16);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).toContain('a22_boss');
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

describe('2-2 のぬし「手拍子」（段階173）', () => {
  it('拍は2・4・6・8、6つで客席が歌う。部位はスピーカーとコード（コードを壊すと火の弱点）。スナップはジャストビート', () => {
    const st = CHAIN_AREA_SETUPS.a22_boss;
    expect(st.clap).toMatchObject({ beats: [2, 4, 6, 8], need: 6, target: 'ampLord' });
    const parts = st.enemies.filter((e) => e.part);
    expect(parts.map((p) => p.id).sort()).toEqual(['ampLord_cord', 'ampLord_speaker']);
    expect(parts.find((p) => p.id === 'ampLord_cord')?.part?.reveals).toEqual(['fire']);
    expect(CHAIN_SNAPS[CHAIN_ENEMY_SNAPS.ampLord]?.name).toBe('ジャストビート');
    for (const id of st.snaps ?? []) expect(CHAIN_SNAPS[id]).toBeDefined();
  });
  it('最初のぬし戦で、手拍子の説明が出る', () => {
    const st = CHAIN_AREA_SETUPS.a22_boss;
    const def = buildMainChainBattle({ id: 'a22_boss', name: 'x', party: PARTY, enemies: AREA_BATTLES.a22_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, clap: st.clap });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_clap');
  });
});
