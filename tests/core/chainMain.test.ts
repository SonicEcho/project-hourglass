import { describe, expect, it } from 'vitest';
import {
  buildMainChainBattle,
  chainEncounterResult,
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
import { AKARI, CHAIN_RULES, CHAIN_TRIALS, GOLDFISH_NOISE, HERO, SKILLS } from '../../src/data';
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
    expect(chainMoveFromSkill(SKILLS.shuffle)).toBeNull();
  });

  it('本番の仲間と敵を変える：通常攻撃に武器の属性、MP と特性を持つ。敵は行動から予定の癖を作る', () => {
    const hero: CharacterDef = { ...HERO, attackElement: 'fire', passives: [{ kind: 'oneMoreDraw', count: 1 }, { kind: 'regen', rate: 0.03 }] };
    const a = chainAllyFromCharacter(hero);
    expect(a.moves[0]).toMatchObject({ id: 'basic', effect: { element: 'fire' } });
    expect(a.mp).toBe(hero.stats.mp);
    expect(a.passives).toEqual([{ kind: 'regen', rate: 0.03 }]);
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
