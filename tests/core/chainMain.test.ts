import { describe, expect, it } from 'vitest';
import {
  addToAlbum,
  albumFromIds,
  buildMainChainBattle,
  chainBossSnaps,
  chainAlbumAddError,
  chainAlbumDeck,
  chainAlbumCounts,
  chainComboMaterials,
  chainSnapElement,
  chainSnapMatches,
  gainSnaps,
  removeFromAlbum,
  chainEncounterResult,
  chainTipTriggers,
  chainAllyFromCharacter,
  chainEnemyFromMain,
  chainMoveFromSkill,
  chainMoveMp,
  chainPlanError,
  chainVitals,
  createChainBattle,
  runChainRound,
  type ChainBattleDef,
  type ChainEnemyDef,
  type ChainEvent,
  type ChainPlanStep,
  type ChainState,
  type CharacterDef,
} from '../../src/core';
import { A11_COMBOS, CHAIN_ENEMY_SNAPS, CHAIN_ALBUM, CHAIN_ALLY_SPECIALS, CHAIN_SNAPS, CHAIN_START_ALBUM, CHAIN_COACH, AKARI, AREA_BATTLES, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_RULES, CHAIN_TRIALS, GOLDFISH_NOISE, HERO, SKILLS, TIPS } from '../../src/data';
import { autoChainBattle, smartChainPlan } from '../../src/sim/chainAuto';

let seedPick = 1;
const planOf = (s: ChainState) => smartChainPlan(s, (n) => (seedPick = (seedPick * 1103515245 + 12345) >>> 0) % n);

// 段階158：新しい戦闘を本番用にする（MP・持ち越し・特性・打ち切り・セーブ・本番の仲間と敵の変換）
const BASE = CHAIN_TRIALS[0];
const dummy = (over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id: 'dummy', name: '的', hp: 9999, atk: 0, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 0 }], ...over });
const mv = (ally: string, moveId: string, target?: string): ChainPlanStep => ({ ally, source: { kind: 'move', moveId }, target, addons: [] });
const dmg = (r: { frames: { events: ChainEvent[] }[] }, from: string) =>
  r.frames.flatMap((f) => f.events).filter((e): e is Extract<ChainEvent, { type: 'damage' }> => e.type === 'damage' && e.from === from);

/** ハルトに MP と技（MP 6、物理30）を持たせた試しの戦闘 */
function make(over: Partial<ChainBattleDef> = {}, vitals = {}): ChainState {
  const hero = BASE.allies.find((a) => a.id === 'hero')!;
  const allies = BASE.allies.map((a) =>
    a.id === 'hero' ? { ...hero, mp: 10, moves: [...hero.moves, { id: 'cost', name: '技', type: 'attack' as const, weight: 2, target: 'enemy' as const, effect: { kind: 'damage' as const, element: 'physical' as const, power: 30 }, text: '', mp: 6 }] } : a,
  );
  const def: ChainBattleDef = { ...BASE, allies, enemies: [dummy()], variants: undefined, ...over };
  const s = createChainBattle(def, CHAIN_RULES, 7, {}, vitals);
  s.hand = [];
  return s;
}

describe('新しい戦闘を本番用に（段階158）', () => {
  it('技は MP を使う。足りない技は並べられず、動いた時に払う。通常攻撃と札は MP を使わない', () => {
    const s = make();
    const t = s.enemies[0].uid;
    expect(s.allies.find((a) => a.uid === 'hero')!.mp).toBe(10);
    const r = runChainRound(s, [mv('hero', 'cost', t)]);
    expect(r.state.allies.find((a) => a.uid === 'hero')!.mp).toBe(4);
    expect(chainPlanError(r.state, [], mv('hero', 'cost', t))).toContain('MP が足りない');
    expect(chainPlanError(r.state, [], mv('hero', 'basic', t))).toBeNull();
  });

  it('区画の中の HP・MP を持ち越す（始めに受け取り、終わりに返す。最大を超えない）', () => {
    const s = make({}, { hero: { hp: 50, mp: 3 }, akari: { hp: 99999, mp: 0 } });
    const hero = s.allies.find((a) => a.uid === 'hero')!;
    const akari = s.allies.find((a) => a.uid === 'akari')!;
    expect([hero.hp, hero.mp]).toEqual([50, 3]);
    expect(akari.hp).toBe(akari.maxHp);
    expect(chainVitals(s).hero).toEqual({ hp: 50, mp: 3 });
  });

  it('特性：属性の割増し（上限80%）・MP の節約（上限2・最低1）・ラウンドの始めの回復と狂い', () => {
    const boost = make({ allies: make().def.allies.map((a) => (a.id === 'hero' ? { ...a, passives: [{ kind: 'elementBoost' as const, element: 'physical' as const, rate: 0.5 }, { kind: 'elementBoost' as const, element: 'physical' as const, rate: 0.5 }, { kind: 'mpSave' as const, amount: 9 }] } : a)) });
    const t = boost.enemies[0].uid;
    const plain = dmg(runChainRound(make(), [mv('hero', 'basic', t)]), 'hero')[0].amount;
    expect(dmg(runChainRound(boost, [mv('hero', 'basic', t)]), 'hero')[0].amount).toBe(Math.floor(plain * 1.8));
    const hero = boost.allies.find((a) => a.uid === 'hero');
    expect(chainMoveMp(hero, hero && boost.def.allies[0].moves.find((m) => m.id === 'cost'))).toBe(4);
    expect(chainMoveMp(hero, { ...boost.def.allies[0].moves[0], mp: 2 })).toBe(1);

    const regen = make({ allies: make().def.allies.map((a) => (a.id === 'hero' ? { ...a, passives: [{ kind: 'regen' as const, rate: 0.05 }] } : a.id === 'akari' ? { ...a, passives: [{ kind: 'bug' as const, rate: 0.1 }] } : a)) }, { hero: { hp: 10, mp: 0 } });
    // ラウンドの始めのコマ（的の攻撃より前）で見る
    const start = runChainRound(regen, []).frames.filter((f) => f.key.startsWith('start:'));
    const h = start[start.length - 1].state.allies.find((a) => a.uid === 'hero')!;
    const k = start[start.length - 1].state.allies.find((a) => a.uid === 'akari')!;
    expect(h.hp).toBe(10 + Math.floor(h.maxHp * 0.05));
    expect(k.hp).toBe(k.maxHp - Math.floor(k.maxHp * 0.1));
  });

  it('負け戦は、決まったラウンドが終わったら打ち切る', () => {
    let s = make({ cutoff: { rounds: 2 } });
    s = runChainRound(s, []).state;
    expect(s.outcome).toBe('ongoing');
    s = runChainRound(s, []).state;
    expect(s.outcome).toBe('cutoff');
  });

  it('負け戦は、仲間が全員倒れても打ち切り（全滅にしない。ふつうの戦闘は負け）', () => {
    const wipe = (over: Partial<ChainBattleDef>) => {
      const s = make(over);
      for (const a of s.allies) a.hp = 0;
      return runChainRound(s, []).state.outcome;
    };
    expect(wipe({ cutoff: { rounds: 4 } })).toBe('cutoff');
    expect(wipe({})).toBe('lose');
  });

  it('戦闘の状態は文字にして戻せる（セーブできる）', () => {
    const s = runChainRound(make(), [mv('hero', 'cost', 'dummy#0')]).state;
    const back = JSON.parse(JSON.stringify(s)) as ChainState;
    expect(back).toEqual(s);
    // 戻した状態から続けても、同じ結果になる
    const a = runChainRound(s, [mv('hero', 'basic', 'dummy#0')]).state;
    const b = runChainRound(back, [mv('hero', 'basic', 'dummy#0')]).state;
    expect(b.enemies[0].hp).toBe(a.enemies[0].hp);
  });

  it('本番の技を変える：重さは時刻に、同じ属性が並ぶ技は連続攻撃に、1人向けの回復は全体に（半分）、手札に触れる技は今は使わない', () => {
    expect(chainMoveFromSkill(SKILLS.fire)).toMatchObject({ weight: 3, mp: 6, effect: { kind: 'damage', element: 'fire', power: 40 } });
    expect(chainMoveFromSkill(SKILLS.doubleSlash)?.effect).toMatchObject({ hits: 2, power: 30 });
    expect(chainMoveFromSkill(SKILLS.care)).toMatchObject({ weight: 1, target: 'allies', effect: { kind: 'heal', power: 23 } });
    expect(chainMoveFromSkill(SKILLS.tsukiBarai)?.target).toBe('enemies');
    // 段階164：手札に触れる技も使える
    expect(chainMoveFromSkill(SKILLS.shuffle)).toMatchObject({ effect: { kind: 'cycle' }, mp: SKILLS.shuffle.mp, target: 'allies' });
    expect(chainMoveFromSkill(SKILLS.inspiration)).toMatchObject({ effect: { kind: 'draw', count: 2 } });
    expect(chainMoveFromSkill(SKILLS.swap)).toMatchObject({ effect: { kind: 'retrieve' } });
  });

  it('本番の仲間と敵を変える：通常攻撃に武器の属性、MP と特性を持つ。敵は行動から予定の癖を作る', () => {
    const hero: CharacterDef = { ...HERO, attackElement: 'fire', passives: [{ kind: 'oneMoreDraw', count: 1 }, { kind: 'regen', rate: 0.03 }] };
    const a = chainAllyFromCharacter(hero);
    expect(a.moves[0]).toMatchObject({ id: 'basic', effect: { element: 'fire' } });
    expect(a.mp).toBe(hero.stats.mp);
    // 段階164：延長で引く枚数は、手札の上限 +1 に置き換える
    expect(a.passives).toEqual([{ kind: 'handPlus', count: 1 }, { kind: 'regen', rate: 0.03 }]);
    const e = chainEnemyFromMain(GOLDFISH_NOISE);
    expect(e).toMatchObject({ hp: GOLDFISH_NOISE.stats.hp, weak: ['ice'], resist: ['fire'] });
    expect(e.pattern[0]).toMatchObject({ id: 'finSlap', power: 28, element: 'physical' });
    expect(e.pattern[0].at).toBeGreaterThanOrEqual(2);
    expect(e.pattern[0].at).toBeLessThanOrEqual(9);
  });

  it('本番の仲間と 1-1 の敵で、最後まで戦える（考える方針）', () => {
    const party = [HERO, AKARI].map((c) => ({ ...c, skills: [SKILLS.fire, SKILLS.care] }));
    const def = buildMainChainBattle({ id: 'm', name: '砂嵐', party, enemies: [GOLDFISH_NOISE, GOLDFISH_NOISE], deck: BASE.deck, cards: BASE.cards, links: BASE.links });
    // みおのいないコンボは外れる
    expect(def.links.every((l) => l.members.every((m) => m === 'hero' || m === 'akari'))).toBe(true);
    // みおの専用の札（スペシャル）も山札から外れる
    expect(def.deck.every((id) => !def.cards[id].owner || def.cards[id].owner !== 'mio')).toBe(true);
    const r = autoChainBattle(def, CHAIN_RULES, 3, 'smart');
    expect(r.outcome).toBe('win');
  });

  it('探索の戦闘の結果（段階159）：倒した敵の落とし物・動いた回数・持ち越す HP と MP。負けは落とし物なし', () => {
    const party = [HERO, AKARI].map((c) => ({ ...c, skills: [SKILLS.fire, SKILLS.care] }));
    const enemies = [GOLDFISH_NOISE, GOLDFISH_NOISE];
    const def = buildMainChainBattle({ id: 'm', name: '砂嵐', party, enemies, deck: BASE.deck, cards: BASE.cards, links: BASE.links });
    // 自動対戦の最後の状態を作る（考える方針）
    let s = createChainBattle(def, CHAIN_RULES, 3);
    for (let i = 0; i < 20 && s.outcome === 'ongoing'; i++) s = runChainRound(s, planOf(s)).state;
    expect(s.outcome).toBe('win');
    const r = chainEncounterResult(s, enemies, 11);
    expect(r.outcome).toBe('victory');
    // 落とし物は金魚ノイズの表の中から。同じ seed なら同じ
    for (const d of r.drops) expect(['goldfishScale', 'goldfishFin', 'natsuTail']).toContain(d.itemId);
    expect(chainEncounterResult(s, enemies, 11).drops).toEqual(r.drops);
    expect(r.actionCounts.hero + r.actionCounts.akari).toBeGreaterThan(0);
    expect(r.vitals.hero.hp).toBe(s.allies.find((a) => a.defId === 'hero')!.hp);
    expect(chainEncounterResult({ ...s, outcome: 'lose' }, enemies, 11)).toMatchObject({ outcome: 'defeat', drops: [] });
  });
});

describe('1-1 を新しい戦闘に（段階160）', () => {
  it('1-1 の戦闘は全部新しい戦闘にする（段階162 でぬしも）。雑魚は敵の性質はなく、山札は最初のアルバム20枚＋スペシャル4枚', () => {
    const ids = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a11_'));
    for (const id of ids) expect(CHAIN_AREA_BATTLES.includes(id)).toBe(true);
    for (const id of CHAIN_AREA_BATTLES.filter((x) => x.startsWith('a11_') && !AREA_BATTLES[x].boss)) {
      const st = CHAIN_AREA_SETUPS[id];
      expect(st.enemies.every((e) => !e.trait)).toBe(true);
      expect(st.deck.length).toBe(24);
      expect(st.deck.every((c) => !!st.cards[c])).toBe(true);
      expect(st.variants.length).toBe(3);
      // 落とし物のため、敵の id は今の敵のまま
      expect(st.enemies.map((e) => e.id)).toEqual(AREA_BATTLES[id].enemies.map((e) => e.id));
    }
    expect(A11_COMBOS.map((l) => l.id).sort()).toEqual(['flashback', 'iceFlower', 'inSync']);
  });

  it('1-1 の雑魚は、育成なしのハルトとあかりでも勝てる（考える方針）', () => {
    for (const id of CHAIN_AREA_BATTLES.filter((x) => x.startsWith('a11_') && !AREA_BATTLES[x].boss)) {
      const st = CHAIN_AREA_SETUPS[id];
      const def = buildMainChainBattle({ id, name: id, party: [HERO, AKARI], enemies: AREA_BATTLES[id].enemies, chainEnemies: st.enemies, variants: st.variants, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
      expect(autoChainBattle(def, CHAIN_RULES, 5, 'smart').outcome).toBe('win');
    }
    // 自動対戦は重いので、ほかの区画の同じテストと同じく時間を長めに（段階180：CI で5秒を超えた）
  }, 60000);

  it('説明の窓：予定と帯はいつも、エフェクト・クライマックス・コンボは手札にある時', () => {
    const st = CHAIN_AREA_SETUPS.a11_n1_gate;
    const def = buildMainChainBattle({ id: 'g', name: 'g', party: [HERO, AKARI], enemies: AREA_BATTLES.a11_n1_gate.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    const s = createChainBattle(def, CHAIN_RULES, 1);
    s.hand = ['c17_quick'];
    expect(chainTipTriggers(s)).toEqual(['chain_plan']);
    s.hand = ['c17_push', 'c17_decisive', 'c17_swing', 'c17_snow'];
    expect(chainTipTriggers(s)).toEqual(['chain_plan', 'chain_addon', 'chain_climax', 'chain_combo']);
    s.round = 2;
    expect(chainTipTriggers(s)).toContain('chain_weak');
    // 説明の文がある
    for (const id of ['chain_plan', 'chain_weak', 'chain_addon', 'chain_climax', 'chain_combo']) {
      expect(TIPS.some((t) => t.id === id)).toBe(true);
      expect(CHAIN_COACH[id].length).toBeGreaterThan(0);
    }
  });
});

describe('1-1 のぬし：部位とポイ（段階162）', () => {
  const st = CHAIN_AREA_SETUPS.a11_boss;
  const make = () => {
    const def = buildMainChainBattle({ id: 'b', name: 'b', party: [HERO, AKARI], enemies: AREA_BATTLES.a11_boss.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt, poi: st.poi });
    const s = createChainBattle(def, CHAIN_RULES, 9);
    s.hand = [];
    return s;
  };
  const uidOf = (s: ChainState, defId: string) => s.enemies.find((e) => e.defId === defId)!.uid;

  it('場にポイの腕・ぬし・金魚鉢が並ぶ。部位は動かず、ぬしだけが予定を持つ。ポイは30マス', () => {
    const s = make();
    expect(s.enemies.map((e) => e.defId)).toEqual(['goldfishBowlLord_poiArm', 'goldfishBowlLord', 'goldfishBowlLord_bowl']);
    expect(s.intents.map((i) => s.enemies.find((e) => e.uid === i.enemy)!.defId)).toEqual(['goldfishBowlLord']);
    expect(s.poi).toBe(30);
    // 最初のぬし戦では、思い出の再演の説明を出す
    expect(chainTipTriggers(s)).toContain('chain_boss');
    expect(CHAIN_COACH.chain_boss.length).toBeGreaterThan(0);
    expect(TIPS.some((t) => t.id === 'chain_boss')).toBe(true);
  });

  it('仲間が行動すると重さの分だけポイが減り、水鉄砲が当たると2減る', () => {
    const s = make();
    // 1ラウンド目は水鉄砲（時刻3）。ハルトの通常攻撃（重さ2）
    const r = runChainRound(s, [mv('hero', 'basic', uidOf(s, 'goldfishBowlLord'))]).state;
    expect(r.poi).toBe(30 - 2 - 2);
  });

  it('部位を壊すと、その部位を使う行動は予定から消え（次の行動になる）、素材を落とす。金魚鉢を壊すと、ぬしの弱点「氷」が出る', () => {
    let s = make();
    for (const e of s.enemies) if (e.defId.includes('_')) e.hp = 1;
    s = runChainRound(s, [mv('hero', 'basic', uidOf(s, 'goldfishBowlLord_poiArm')), mv('akari', 'basic', uidOf(s, 'goldfishBowlLord_bowl'))]).state;
    const lord = s.enemies.find((e) => e.defId === 'goldfishBowlLord')!;
    expect(lord.weak).toContain('ice');
    // 2ラウンド目の予定（ポイすくい）は、ポイの腕が壊れたので次の大波に
    expect(s.intents[0].move.id).toBe('bigWave');
    // ぬしを倒すと勝ち（部位の素材とぬしの素材を落とす）
    lord.hp = 1;
    const w = runChainRound(s, [mv('hero', 'basic', lord.uid)]).state;
    expect(w.outcome).toBe('win');
    const items = chainEncounterResult(w, AREA_BATTLES.a11_boss.enemies, 1).drops.map((d) => d.itemId);
    expect(items).toEqual(expect.arrayContaining(['tornPoi', 'bowlShard', 'lordGoldfish']));
  });

  it('ポイが0になると負け（ぬしを倒した一撃なら勝ち）', () => {
    const s = make();
    s.poi = 2;
    const lose = runChainRound(s, [mv('hero', 'basic', uidOf(s, 'goldfishBowlLord'))]).state;
    expect(lose.outcome).toBe('lose');
    expect(lose.finish).toBe('poi');
    const s2 = make();
    s2.poi = 2;
    s2.enemies.find((e) => e.defId === 'goldfishBowlLord')!.hp = 1;
    expect(runChainRound(s2, [mv('hero', 'basic', uidOf(s2, 'goldfishBowlLord'))]).state.outcome).toBe('win');
  });
});

describe('警戒（段階162 調整6）', () => {
  it('ダウンから起きた敵は、ダウンの回数のラウンド（3まで）ダウンしない。弱点のダメージはそのまま', () => {
    const st = CHAIN_AREA_SETUPS.a11_n1_gate;
    const def = buildMainChainBattle({ id: 'g', name: 'g', party: [HERO, AKARI], enemies: AREA_BATTLES.a11_n1_gate.enemies, chainEnemies: st.enemies.map((e) => ({ ...e, hp: 99999 })), deck: st.deck, cards: st.cards, links: st.links });
    let s = createChainBattle(def, CHAIN_RULES, 1);
    s.hand = [];
    const t = s.enemies[0].uid;
    // 金魚は氷が弱点。あかりのアイス（技）で毎ラウンド当てる
    const hit = (st0: ChainState) => runChainRound(st0, [mv('akari', 'ice', t)]);
    const downs: boolean[] = [];
    for (let k = 0; k < 8; k++) {
      const r = hit(s);
      downs.push(r.frames.some((f) => f.events.some((e) => e.type === 'down' && e.uid === t)));
      s = r.state;
      s.allies.forEach((a) => (a.hp = a.maxHp));
      s.allies.forEach((a) => (a.mp = a.maxMp));
    }
    // 1回目ダウン → 警戒1 → 2回目ダウン → 警戒2 → 3回目ダウン → 警戒3
    expect(downs).toEqual([true, false, true, false, false, true, false, false]);
    // 警戒が付いている時は、警戒の説明を出す
    s.enemies[0].guard = 1;
    expect(chainTipTriggers(s)).toContain('chain_guard');
    expect(CHAIN_COACH.chain_guard.length).toBe(1);
    expect(TIPS.some((t) => t.id === 'chain_guard')).toBe(true);
  });
});


describe('新しい戦闘のアルバム（段階163）', () => {
  it('最初のアルバムは20枚（スペシャルを除く）で、山札はアルバム＋並びの仲間ごとのスペシャル2枚', () => {
    const a = albumFromIds(CHAIN_START_ALBUM);
    expect(CHAIN_START_ALBUM.length).toBe(CHAIN_ALBUM.size);
    expect(CHAIN_START_ALBUM.every((id) => !!CHAIN_SNAPS[id] && !CHAIN_SNAPS[id].owner)).toBe(true);
    const deck = chainAlbumDeck(a, CHAIN_SNAPS, CHAIN_ALLY_SPECIALS, ['hero', 'akari']);
    expect(deck.length).toBe(24);
    expect(deck.filter((id) => id === 'c17_swing').length).toBe(2);
    expect(deck.filter((id) => id === 'c17_paperGun').length).toBe(0);
  });

  it('クライマックスは3枚まで。同じスナップは4枚まで。20枚でいっぱい', () => {
    let a = albumFromIds(CHAIN_START_ALBUM);
    a = gainSnaps(a, ['c17_group', 'c17_group', 'c17_group', 'c17_decisive']);
    // いっぱいなので、1枚外してから
    a = removeFromAlbum(a, 'c17_quick');
    expect(chainAlbumAddError(a, 'c17_group', CHAIN_SNAPS, CHAIN_ALBUM)).toBeNull();
    a = addToAlbum(a, 'c17_group', CHAIN_ALBUM.size, CHAIN_ALBUM.copyMax);
    a = removeFromAlbum(a, 'c17_quick');
    a = addToAlbum(a, 'c17_group', CHAIN_ALBUM.size, CHAIN_ALBUM.copyMax);
    a = removeFromAlbum(a, 'c17_quick');
    // 決めの一枚1＋集合写真2＝3枚。もう入らない
    expect(chainAlbumAddError(a, 'c17_group', CHAIN_SNAPS, CHAIN_ALBUM)).toBe('too many climaxes');
    expect(chainAlbumAddError(albumFromIds(CHAIN_START_ALBUM), 'c17_quick', CHAIN_SNAPS, CHAIN_ALBUM)).toBe('no spare copy');
  });

  it('1-1 のぬしの報酬は、新しい戦闘のスナップ（段階180：★3 で倒した時だけ集合写真1枚。リカバリーは返した時）', () => {
    expect(CHAIN_AREA_SETUPS.a11_boss.snaps).toEqual(['c17_group']);
    for (const id of CHAIN_AREA_SETUPS.a11_boss.snaps!) expect(CHAIN_SNAPS[id]).toBeTruthy();
  });
  it('ぬしのスナップは ★3 で勝った時だけ（段階180。部位を壊したかによらない）', () => {
    expect(chainBossSnaps({ outcome: 'victory', grade: 'high' }, ['c17_group'])).toEqual(['c17_group']);
    expect(chainBossSnaps({ outcome: 'victory', grade: 'mid' }, ['c17_group'])).toEqual([]);
    expect(chainBossSnaps({ outcome: 'victory', grade: 'low' }, ['c17_group'])).toEqual([]);
    expect(chainBossSnaps({ outcome: 'defeat', grade: null }, ['c17_group'])).toEqual([]);
    expect(chainBossSnaps({ outcome: 'victory', grade: 'high' }, undefined)).toEqual([]);
  });
});

describe('新しい戦闘にない育成の効果を、近い効果で効かせる（段階164。仮の置き換え）', () => {
  const party = [HERO, AKARI].map((c) => ({ ...c, skills: [SKILLS.inspiration, SKILLS.shuffle, SKILLS.swap] }));
  const make = (passives: CharacterDef['passives'] = []) => {
    const ps = party.map((c, i) => (i === 0 ? { ...c, passives } : c));
    const def = buildMainChainBattle({ id: 'm', name: 'm', party: ps, enemies: [GOLDFISH_NOISE], chainEnemies: [dummy()], deck: BASE.deck, cards: BASE.cards, links: [] });
    return createChainBattle(def, CHAIN_RULES, 4);
  };

  it('ひらめき：2枚引く（手札の上限を超えてよい）。すりかえ：捨て札の一番新しい1枚を戻す。シャッフル：残りを引き直す', () => {
    const s = make();
    const n = s.hand.length;
    const r = runChainRound(s, [mv('hero', 'inspiration')]);
    expect(r.state.hand.length).toBe(n + 2);
    const s2 = make();
    s2.discard = ['c17_quick'];
    expect(runChainRound(s2, [mv('hero', 'swap')]).state.hand).toContain('c17_quick');
    const s3 = make();
    const r3 = runChainRound(s3, [mv('hero', 'shuffle')]).state;
    expect(r3.hand.length).toBe(s3.hand.length);
  });

  it('延長で引く枚数 → 手札の上限+1。先制 → 最初のラウンドの威力+30%。部位への割増しは部位に効く', () => {
    expect(make([{ kind: 'oneMoreDraw', count: 1 }]).hand.length).toBe(CHAIN_RULES.handSize + 1);
    const plain = make();
    const quick = make([{ kind: 'startDash' }]);
    const t = plain.enemies[0].uid;
    const a = dmg(runChainRound(plain, [mv('hero', 'basic', t)]), 'hero')[0].amount;
    const b = dmg(runChainRound(quick, [mv('hero', 'basic', t)]), 'hero')[0].amount;
    expect(b).toBe(Math.floor(a * 1.3));
  });
});


describe('敵のスナップ（段階165）', () => {
  const win = () => {
    const st = CHAIN_AREA_SETUPS.a11_n1_road;
    const def = buildMainChainBattle({ id: 'r', name: 'r', party: [HERO, AKARI], enemies: AREA_BATTLES.a11_n1_road.enemies, chainEnemies: st.enemies.map((e) => ({ ...e, hp: 1 })), deck: st.deck, cards: st.cards, links: st.links, gradeAt: st.gradeAt });
    const s = createChainBattle(def, CHAIN_RULES, 2);
    return runChainRound(s, [mv('hero', 'basic', s.enemies[0].uid), mv('akari', 'basic', s.enemies[1].uid)]).state;
  };
  const rule = (over: Partial<{ normal: number; boss: number }> = {}, owned: Record<string, number> = {}) => ({ snaps: CHAIN_ENEMY_SNAPS, rate: { normal: 1, boss: 1, ...over }, owned, copyMax: 4, boss: false });

  it('★3 で勝つと、その戦闘にいた敵の種類のスナップを確率で1枚（4枚持っている物は選ばない）', () => {
    let s = win();
    // 3体目も倒す
    s = runChainRound(s, [mv('hero', 'basic', s.enemies[2].uid)]).state;
    expect(s.outcome).toBe('win');
    expect(chainEncounterResult(s, AREA_BATTLES.a11_n1_road.enemies, 1).snap).toBeUndefined();
    const got = chainEncounterResult(s, AREA_BATTLES.a11_n1_road.enemies, 1, rule()).snap;
    expect(['a11_hireuchi', 'a11_mizushibuki']).toContain(got);
    expect(chainEncounterResult(s, AREA_BATTLES.a11_n1_road.enemies, 1, rule({ normal: 0 })).snap).toBeUndefined();
    expect(chainEncounterResult(s, AREA_BATTLES.a11_n1_road.enemies, 1, rule({}, { a11_hireuchi: 4 })).snap).toBe('a11_mizushibuki');
    expect(chainEncounterResult({ ...s, finishTime: 999 }, AREA_BATTLES.a11_n1_road.enemies, 1, rule()).snap).toBeUndefined();
    // 敵のスナップは、新しい戦闘のスナップの一覧にある
    for (const id of Object.values(CHAIN_ENEMY_SNAPS)) expect(CHAIN_SNAPS[id]).toBeTruthy();
  });
});

describe('アルバムの画面の分類と印（段階166）', () => {
  const enemy = Object.values(CHAIN_ENEMY_SNAPS);
  it('属性：攻撃は攻撃の属性、回復は属性なし', () => {
    expect(chainSnapElement(CHAIN_SNAPS.a11_kingyoUzu)).toBe('ice');
    expect(chainSnapElement(CHAIN_SNAPS.a11_recovery)).toBeNull();
  });
  it('タブ：敵のスナップは敵のタブとその分類のタブに出る', () => {
    const uzu = CHAIN_SNAPS.a11_kingyoUzu;
    expect(chainSnapMatches(uzu, 'enemy', null, enemy)).toBe(true);
    expect(chainSnapMatches(uzu, 'finish', null, enemy)).toBe(true);
    expect(chainSnapMatches(uzu, 'attack', null, enemy)).toBe(false);
    expect(chainSnapMatches(CHAIN_SNAPS.a11_recovery, 'attack', null, enemy)).toBe(true);
    expect(chainSnapMatches(CHAIN_SNAPS.a11_recovery, 'enemy', null, enemy)).toBe(false);
    expect(chainSnapMatches(CHAIN_SNAPS.a11_amaikiri, 'support', null, enemy)).toBe(true);
    expect(chainSnapMatches(uzu, 'all', 'fire', enemy)).toBe(false);
    expect(chainSnapMatches(uzu, 'all', 'ice', enemy)).toBe(true);
  });
  it('中身の数：分類ごとと、敵のスナップ', () => {
    const c = chainAlbumCounts({ a11_kingyoUzu: 1, a11_recovery: 2, a11_amaikiri: 1, nope: 3 }, CHAIN_SNAPS, enemy);
    expect(c).toEqual({ attack: 2, support: 1, finish: 1, enemy: 2 });
    const start = chainAlbumCounts(albumFromIds(CHAIN_START_ALBUM).album, CHAIN_SNAPS, enemy);
    expect(start.attack + start.support + start.finish).toBe(20);
  });
  it('コンボの材料：見つけたコンボだけ', () => {
    const ice = A11_COMBOS.find((l) => l.id === 'iceFlower')!;
    expect(chainComboMaterials(A11_COMBOS, [])).toEqual({});
    const m = chainComboMaterials(A11_COMBOS, ['iceFlower']);
    for (const id of ice.cards) expect(m[id]?.map((l) => l.id)).toEqual(['iceFlower']);
  });
});
