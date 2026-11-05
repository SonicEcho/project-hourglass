import { describe, expect, it } from 'vitest';
import {
  availableLinks,
  chainPlanError,
  createChainBattle,
  nextStart,
  planStarts,
  runChainRound,
  shutterGrade,
  takeShutter,
  type ChainBattleDef,
  type ChainEnemyDef,
  type ChainPlanStep,
  type ChainState,
} from '../../src/core';
import { CHAIN_CARDS, CHAIN_ENEMIES, CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';
import { autoChainBattle } from '../../src/sim/chainAuto';

// 試し：並べてつなぐ戦闘（段階156）
const BASE = CHAIN_TRIALS[0];

/** 敵と手札を決めた戦闘（敵の予定の狙いは乱数のまま） */
function make(enemies: ChainEnemyDef[], hand: string[] = []): ChainState {
  const def: ChainBattleDef = { ...BASE, enemies };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = [...hand];
  return s;
}

const card = (s: ChainState, id: string): number => s.hand.indexOf(id);
const uid = (s: ChainState, defId: string, nth = 0): string => s.enemies.filter((e) => e.defId === defId)[nth].uid;
/** 攻撃しない敵（予定はあるが、ダメージは1） */
const idle = (e: ChainEnemyDef): ChainEnemyDef => ({ ...e, atk: 0 });

describe('並べてつなぐ戦闘（段階156）', () => {
  it('並べた順に、前の行動の重さの分だけ後の時刻に動く。ラウンドの長さを過ぎる時刻には置けない', () => {
    const s = make([idle(CHAIN_ENEMIES.phone)]);
    const t = uid(s, 'phoneNoise');
    const plan: ChainPlanStep[] = [
      { ally: 'hero', source: { kind: 'move', moveId: 'finisher' }, target: t }, // 重さ4
      { ally: 'akari', source: { kind: 'move', moveId: 'fire' }, target: t }, // 重さ3
    ];
    expect(planStarts(s, plan)).toEqual([0, 4]);
    expect(nextStart(s, plan)).toBe(7);
    expect(chainPlanError(s, plan, { ally: 'mio', source: { kind: 'move', moveId: 'thunder' }, target: t })).toBeNull();
    const heavy: ChainPlanStep[] = [
      { ally: 'hero', source: { kind: 'move', moveId: 'finisher' }, target: t },
      { ally: 'akari', source: { kind: 'move', moveId: 'fire' }, target: t },
      { ally: 'mio', source: { kind: 'move', moveId: 'thunder' }, target: t },
    ];
    expect(nextStart(s, heavy)).toBe(10);
    // 同じ仲間は1ラウンドに1回
    expect(chainPlanError(s, plan.slice(0, 1), { ally: 'hero', source: { kind: 'move', moveId: 'slash' }, target: t })).not.toBeNull();
  });

  it('敵の予定の時刻より前に弱点でダウンさせると、その行動は起きない（同じ時刻なら仲間が先）', () => {
    // 全員がダウンするとシャッターで止まるので、もう1体（動かない）を入れる
    const s = make([CHAIN_ENEMIES.phone, idle(CHAIN_ENEMIES.tin)]);
    const phone = uid(s, 'phoneNoise');
    expect(s.intents[0].at).toBe(4);
    // ハルトのとどめの一閃（重さ4）の後、あかりは時刻4。黒電話のジリリリも時刻4だが、仲間が先
    const plan: ChainPlanStep[] = [
      { ally: 'hero', source: { kind: 'move', moveId: 'finisher' }, target: phone },
      { ally: 'akari', source: { kind: 'move', moveId: 'ice' }, target: phone },
    ];
    const { frames } = runChainRound(s, plan);
    const events = frames.flatMap((f) => f.events);
    expect(events.some((e) => e.type === 'down' && e.uid === phone)).toBe(true);
    expect(events.some((e) => e.type === 'cancel' && e.uid === phone)).toBe(true);
    expect(events.some((e) => e.type === 'act' && e.uid === phone)).toBe(false);
  });

  it('ダウンさせなければ、敵は予定どおりに動く', () => {
    const s = make([CHAIN_ENEMIES.phone]);
    const phone = uid(s, 'phoneNoise');
    const { state, frames } = runChainRound(s, [{ ally: 'hero', source: { kind: 'move', moveId: 'slash' }, target: phone }]);
    expect(frames.some((f) => f.uid === phone && f.events.some((e) => e.type === 'act'))).toBe(true);
    expect(state.allies.every((a) => a.hp < a.maxHp)).toBe(true);
  });

  it('濡れた敵に雷が当たると、濡れた敵みんなに伝わる（ブリキは弱点でもダウンしない）', () => {
    const s = make([idle(CHAIN_ENEMIES.tin), idle(CHAIN_ENEMIES.tin), idle(CHAIN_ENEMIES.phone)], [CHAIN_CARDS.puddle.id]);
    const a = uid(s, 'tinNoise', 0);
    const plan: ChainPlanStep[] = [
      { ally: 'akari', source: { kind: 'card', index: card(s, CHAIN_CARDS.puddle.id) } },
      { ally: 'mio', source: { kind: 'move', moveId: 'thunder' }, target: a },
    ];
    const { state, frames } = runChainRound(s, plan);
    const events = frames.flatMap((f) => f.events);
    expect(events.some((e) => e.type === 'spread')).toBe(true);
    const hit = new Set(events.flatMap((e) => (e.type === 'damage' && e.from === 'mio' ? [e.to] : [])));
    expect(hit.size).toBe(3);
    // ブリキは雷が弱点でも、かたいのでダウンしない
    expect(events.some((e) => e.type === 'down' && e.uid === a)).toBe(false);
    // 雷が伝わると、濡れは乾く
    expect(state.enemies.every((e) => !e.marks.includes('wet'))).toBe(true);
  });

  it('油の敵に火が当たると爆発し、敵全体に火が当たって、みんなよろける。全員ダウンでシャッターが光る', () => {
    const s = make([idle(CHAIN_ENEMIES.phone), idle(CHAIN_ENEMIES.ramune)], [CHAIN_CARDS.ember.id]);
    const phone = uid(s, 'phoneNoise');
    const plan: ChainPlanStep[] = [
      { ally: 'mio', source: { kind: 'card', index: card(s, CHAIN_CARDS.ember.id) }, target: phone },
      { ally: 'akari', source: { kind: 'move', moveId: 'fire' }, target: phone },
    ];
    const { state, frames } = runChainRound(s, plan);
    const events = frames.flatMap((f) => f.events);
    expect(events.some((e) => e.type === 'blast')).toBe(true);
    expect(state.enemies.every((e) => e.down)).toBe(true);
    expect(state.shutter).toBe(true);
    // ラムネは爆発でよろけたので、はじけない
    expect(events.some((e) => e.type === 'pop')).toBe(false);
    const won = takeShutter(state);
    expect(won.outcome).toBe('win');
    expect(won.finish).toBe('shutter');
    expect(shutterGrade(won)).toBe(3);
  });

  it('かたい敵は、1ラウンドに3回当てるとダウンする（連写は、もう動いた仲間の数 + 1 回）', () => {
    const s = make([idle(CHAIN_ENEMIES.tin)], [CHAIN_CARDS.burst.id]);
    const tin = uid(s, 'tinNoise');
    const plan: ChainPlanStep[] = [
      { ally: 'mio', source: { kind: 'move', moveId: 'squirt' }, target: tin },
      { ally: 'hero', source: { kind: 'card', index: card(s, CHAIN_CARDS.burst.id) }, target: tin },
    ];
    const { state, frames } = runChainRound(s, plan);
    const events = frames.flatMap((f) => f.events);
    expect(events.filter((e) => e.type === 'damage' && e.from === 'hero').length).toBe(2);
    expect(events.some((e) => e.type === 'down' && e.uid === tin && e.by === 'gear')).toBe(true);
    expect(state.shutter).toBe(true);
  });

  it('鏡は、濡れていない時に弱点の火をはね返す。濡らすと曇って、ふつうに当たりダウンする', () => {
    const s = make([idle(CHAIN_ENEMIES.menko)]);
    const m = uid(s, 'menkoNoise');
    const r1 = runChainRound(s, [{ ally: 'akari', source: { kind: 'move', moveId: 'fire' }, target: m }]);
    const e1 = r1.frames.flatMap((f) => f.events);
    expect(e1.some((e) => e.type === 'reflect')).toBe(true);
    expect(r1.frames[0].state.enemies[0].hp).toBe(r1.frames[0].state.enemies[0].maxHp);
    expect(r1.frames[0].state.allies.find((a) => a.uid === 'akari')!.hp).toBeLessThan(CHAIN_TRIALS[0].allies[1].hp);
    const r2 = runChainRound(s, [
      { ally: 'mio', source: { kind: 'move', moveId: 'squirt' }, target: m },
      { ally: 'akari', source: { kind: 'move', moveId: 'fire' }, target: m },
    ]);
    const e2 = r2.frames.flatMap((f) => f.events);
    expect(e2.some((e) => e.type === 'reflect')).toBe(false);
    expect(e2.some((e) => e.type === 'down' && e.uid === m)).toBe(true);
  });

  it('はじける敵を弱点でダウンさせると、破片が仲間全体に当たる', () => {
    const s = make([idle(CHAIN_ENEMIES.ramune), idle(CHAIN_ENEMIES.phone)]);
    const r = uid(s, 'ramuneNoise');
    const { frames } = runChainRound(s, [{ ally: 'hero', source: { kind: 'move', moveId: 'quick' }, target: r }]);
    const events = frames.flatMap((f) => f.events);
    expect(events.some((e) => e.type === 'pop')).toBe(true);
    expect(events.filter((e) => e.type === 'damage' && e.from === r).length).toBe(3);
  });

  it('連携技は、組む相手の攻撃（属性が合う時）のすぐ後にだけ置ける。間に敵が動くと切れる', () => {
    const s = make([CHAIN_ENEMIES.ramune, idle(CHAIN_ENEMIES.phone)]);
    const phone = uid(s, 'phoneNoise');
    const fire: ChainPlanStep = { ally: 'akari', source: { kind: 'move', moveId: 'fire' }, target: phone };
    expect(availableLinks(s, [fire], 'hero').map((l) => l.id)).toEqual(['afterglow']);
    expect(availableLinks(s, [{ ally: 'akari', source: { kind: 'move', moveId: 'heal' } }], 'hero')).toEqual([]);
    expect(availableLinks(s, [fire], 'mio')).toEqual([]);
    // 間に敵が入らない：あかり（時刻0）→ ハルト（時刻3）。ラムネは時刻2なので、間に入って切れる
    const broken = runChainRound(s, [fire, { ally: 'hero', source: { kind: 'link', linkId: 'afterglow' } }]);
    expect(broken.frames.flatMap((f) => f.events).some((e) => e.type === 'fizzle' && e.reason === 'linkBroken')).toBe(true);
    // ラムネを先にダウンさせておけば、ラムネは動かず、連携技がつながる（めんこは時刻5で、ハルトと同じ時刻なので、仲間が先）
    const s2 = make([CHAIN_ENEMIES.ramune, idle(CHAIN_ENEMIES.menko)]);
    const ramune = uid(s2, 'ramuneNoise');
    const ok = runChainRound(s2, [
      { ally: 'mio', source: { kind: 'move', moveId: 'kick' }, target: ramune },
      { ally: 'akari', source: { kind: 'move', moveId: 'fire' }, target: ramune },
      { ally: 'hero', source: { kind: 'link', linkId: 'afterglow' } },
    ]);
    const ev = ok.frames.flatMap((f) => f.events);
    expect(ev.some((e) => e.type === 'link')).toBe(true);
    expect(ev.some((e) => e.type === 'fizzle')).toBe(false);
  });

  it('ラウンドの終わりに、ダウンが解け、癖が1つ進み、手札が5枚まで戻り、次の予定が決まる', () => {
    const s = createChainBattle(BASE, CHAIN_RULES, 3);
    expect(s.hand.length).toBe(5);
    const t = s.enemies[1].uid;
    const plan: ChainPlanStep[] = [{ ally: 'hero', source: { kind: 'card', index: 0 }, target: t }];
    const move = s.def.cards[s.hand[0]];
    if (move.target !== 'enemy') plan[0] = { ally: 'hero', source: { kind: 'card', index: 0 } };
    const { state } = runChainRound(s, plan);
    if (state.outcome !== 'ongoing' || state.shutter) return;
    expect(state.round).toBe(2);
    expect(state.hand.length).toBe(5);
    expect(state.discard.length).toBe(1);
    expect(state.enemies.every((e) => !e.down && e.hits === 0)).toBe(true);
    const phone = state.enemies.find((e) => e.defId === 'phoneNoise')!;
    expect(state.intents.find((i) => i.enemy === phone.uid)!.move.id).toBe('cord');
  });

  it('同じシードなら同じ結果。考える方針は、でたらめな方針より早く勝つ', () => {
    const a = autoChainBattle(BASE, CHAIN_RULES, 5, 'smart');
    const b = autoChainBattle(BASE, CHAIN_RULES, 5, 'smart');
    expect(a).toEqual(b);
    let smart = 0;
    let random = 0;
    for (let k = 0; k < 6; k++) {
      const x = autoChainBattle(BASE, CHAIN_RULES, 50 + k, 'smart');
      const y = autoChainBattle(BASE, CHAIN_RULES, 50 + k, 'random');
      expect(x.outcome).toBe('win');
      smart += x.rounds;
      random += y.outcome === 'win' ? y.rounds : 20;
    }
    expect(smart).toBeLessThan(random);
  });
});
