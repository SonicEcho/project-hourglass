import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainTipTriggers, createChainBattle } from '../../src/core';
import { A31_COMBOS, A31_ENEMY_SNAPS, A31_LORD, A31_SHORT_TEXT, A31_WIND, AKARI, AREA_BATTLES, AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_RULES, CHAIN_SNAPS, CHAIN_TRAIT_TEXT, HERO, MIO } from '../../src/data';
import { grownParty } from '../../src/sim/autoArea';
import { autoChainBattle } from '../../src/sim/chainAuto';
import { growthPreset } from '../../src/sim/presets';

// 段階178（段取りの段階F5a）：3-1 の雑魚の戦闘を新しい戦闘に
const ids = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a31_n') || id === 'a31_runner') && !AREA_BATTLES[id].boss);
const PARTY = [HERO, AKARI, MIO];

describe('3-1 の雑魚を新しい戦闘に（段階178）', () => {
  it('3-1 の雑魚は全部新しい戦闘（段階179 でぬしも）', () => {
    expect(ids.length).toBeGreaterThan(8);
    for (const id of ids) expect(CHAIN_AREA_BATTLES).toContain(id);
    expect(CHAIN_AREA_BATTLES).toContain('a31_boss');
  });
  it('敵ごとの性質：扇風機＝2回行動・蚊取り線香＝自爆・ラジオ＝ダウン解除・ちゃぶ台とポスト＝なし', () => {
    const trait: Record<string, string | undefined> = { fanNoise: 'swift', coilNoise: 'timer', radioNoise: 'waker', tableNoise: undefined, postboxNoise: undefined };
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
      for (const e of st.enemies) {
        expect(e.id in trait).toBe(true);
        expect(e.trait).toBe(trait[e.id]);
        if (e.trait) expect(CHAIN_TRAIT_TEXT[e.trait]?.name).toBeTruthy();
        if (e.trait === 'swift') expect(e.pattern.every((p) => p.at2 !== undefined && p.at2 > p.at)).toBe(true);
        if (e.trait === 'timer') expect(e.timer).toBe(2);
      }
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
    }
  });
  it('1晩目は扇風機と蚊取り線香だけ。ラジオとちゃぶ台は2晩目から', () => {
    for (const id of ids.filter((x) => x.startsWith('a31_n1_'))) {
      expect(AREA_BATTLES[id].enemies.every((e) => e.id === 'fanNoise' || e.id === 'coilNoise')).toBe(true);
    }
    const n2 = ids.filter((x) => x.startsWith('a31_n2_')).flatMap((id) => AREA_BATTLES[id].enemies.map((e) => e.id));
    expect(n2).toEqual(expect.arrayContaining(['radioNoise', 'tableNoise']));
  });
  it('敵のスナップ・宝箱の札・三人のコンボ', () => {
    for (const [enemy, snap] of Object.entries(A31_ENEMY_SNAPS)) {
      expect(CHAIN_ENEMY_SNAPS[enemy]).toBe(snap);
      expect(CHAIN_SNAPS[snap]).toBeDefined();
    }
    const got = AREAS.a31.chests.flatMap((c) => c.chainSnaps ?? []);
    expect(got.sort()).toEqual(['c17_exposure', 'c17_firstCut', 'c17_longTake']);
    for (const id of got) expect(CHAIN_SNAPS[id]).toBeDefined();
    expect(A31_COMBOS.map((l) => l.id)).toContain('threeTimes');
  });
  it('2回行動・自爆・ダウン解除の敵がいると、その説明が出る', () => {
    const id = ids.find((x) => { const s = new Set(AREA_BATTLES[x].enemies.map((e) => e.id)); return s.has('fanNoise') && s.has('radioNoise'); })!;
    const st = CHAIN_AREA_SETUPS[id];
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: PARTY, enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toEqual(expect.arrayContaining(['chain_swift', 'chain_waker']));
    const st2 = CHAIN_AREA_SETUPS.a31_n1_square;
    const def2 = buildMainChainBattle({ id: 'y', name: 'y', party: PARTY, enemies: AREA_BATTLES.a31_n1_square.enemies, chainEnemies: st2.enemies, deck: st2.deck, cards: st2.cards, links: st2.links });
    expect(chainTipTriggers(createChainBattle(def2, CHAIN_RULES, 1))).toContain('chain_timer');
  });
  it('3-1 に入る時点の控えめな育ち具合のハルト・あかり・みおで勝てる（考える方針）', () => {
    const pre = growthPreset('a31_enter', 'low');
    const party = grownParty(pre.carry.growth, pre.carry.armory, PARTY, pre.carry.navi);
    for (const id of ids) {
      const st = CHAIN_AREA_SETUPS[id];
      const def = buildMainChainBattle({ id, name: id, party, enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, variants: st.variants, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
      expect(autoChainBattle(def, CHAIN_RULES, 5, 'smart').outcome, id).toBe('win');
    }
  }, 60000);
});

describe('3-1 のぬし「腕時計を守る」（段階179）', () => {
  const st = CHAIN_AREA_SETUPS.a31_boss;
  it('ぬしと部位（煙突＝雷の弱点・車輪）。毎ラウンド、急かすが1〜2つ。報酬は部位を壊した時のポーズ1枚、返した時は余白', () => {
    const body = st.enemies.find((e) => e.id === 'trainLord')!;
    const parts = st.enemies.filter((e) => e.part);
    expect(parts.map((p) => p.id).sort()).toEqual(['trainLord_chimney', 'trainLord_wheel']);
    expect(parts.find((p) => p.id === 'trainLord_chimney')!.part!.reveals).toEqual(['thunder']);
    for (const m of body.pattern) {
      const hurry = (m.with ?? []).filter((w) => w.watch);
      expect(hurry.length).toBeGreaterThanOrEqual(1);
      expect(hurry.length).toBeLessThanOrEqual(2);
      // with は時刻の順（ねじを巻いた次のラウンドは、先の物からそれる）
      expect(hurry.map((w) => w.at)).toEqual([...hurry.map((w) => w.at)].sort((a, b) => a - b));
    }
    expect(st.watch).toEqual({ hp: A31_LORD.watchHp, ease: A31_LORD.ease });
    expect(st.allyMoves).toEqual([A31_WIND]);
    expect(A31_SHORT_TEXT[A31_WIND.id]).toContain(`+${A31_LORD.wind}`);
    expect(st.snaps).toEqual(['c17_pause']);
    expect(CHAIN_SNAPS.c17_pause).toBeDefined();
    expect(AREAS.a31.chainReturnSnaps).toEqual(['c17_margin']);
    expect(CHAIN_SNAPS.c17_margin).toBeDefined();
  });
  it('本番の戦闘：全員が「ねじを巻く」を使え、最初のぬし戦で腕時計の説明が出る', () => {
    const def = buildMainChainBattle({ id: 'a31_boss', name: 'x', party: PARTY, enemies: AREA_BATTLES.a31_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, watch: st.watch, allyMoves: st.allyMoves });
    expect(def.allies.every((a) => a.moves.some((m) => m.id === A31_WIND.id))).toBe(true);
    const s = createChainBattle(def, CHAIN_RULES, 1);
    expect(s.watch).toBe(A31_LORD.watchHp);
    expect(chainTipTriggers(s)).toContain('chain_watch');
  });
});
