import { describe, expect, it } from 'vitest';
import {
  availableLinks,
  chainOrder,
  chainPlanError,
  createChainBattle,
  nextStart,
  plannedMarks,
  planStarts,
  runChainRound,
  chainGrade,
  takeShutter,
  type ChainBattleDef,
  type ChainEnemyDef,
  type ChainEvent,
  type ChainPlanStep,
  type ChainState,
} from '../../src/core';
import { CHAIN_CARDS, CHAIN_ENEMIES, CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';
import { autoChainBattle } from '../../src/sim/chainAuto';

// 試し：並べてつなぐ戦闘（段階156。調整3：色の印・専用の札と連携技・10の特徴。調整6：終わった時刻に効く・押す・組み合わせの型・決着の時刻）
const BASE = CHAIN_TRIALS[0];

/** 敵と手札を決めた戦闘（敵の予定の狙いは乱数のまま） */
function make(enemies: ChainEnemyDef[], hand: string[] = []): ChainState {
  const def: ChainBattleDef = { ...BASE, enemies, variants: undefined };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = [...hand];
  return s;
}

const uid = (s: ChainState, defId: string, nth = 0): string => s.enemies.filter((e) => e.defId === defId)[nth].uid;
/** 攻撃しない敵（予定はあるが、ダメージは1） */
const idle = (e: ChainEnemyDef): ChainEnemyDef => ({ ...e, atk: 0 });
/** 特徴を外した敵 */
const plain = (e: ChainEnemyDef): ChainEnemyDef => ({ ...e, trait: undefined });
const move = (ally: string, moveId: string, target?: string): ChainPlanStep => ({ ally, source: { kind: 'move', moveId }, target });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('並べてつなぐ戦闘（段階156）', () => {
  it('並べた順に、前の行動の重さの分だけ後の時刻に動く。ラウンドの長さを過ぎる時刻には置けない', () => {
    const s = make([idle(plain(CHAIN_ENEMIES.cuckoo))]);
    const t = s.enemies[0].uid;
    const plan = [move('hero', 'finisher', t), move('akari', 'fire', t)];
    expect(planStarts(s, plan)).toEqual([0, 4]);
    expect(nextStart(s, plan)).toBe(7);
    expect(chainPlanError(s, plan, move('mio', 'thunder', t))).toBeNull();
    expect(nextStart(s, [...plan, move('mio', 'thunder', t)])).toBe(10);
    expect(chainPlanError(s, plan.slice(0, 1), move('hero', 'slash', t))).not.toBeNull();
  });

  it('行動は重さの分だけかかって、終わった時刻に効く。同じ時刻なら仲間が先。効く前にダウンさせた敵の予定は起きない', () => {
    const s = make([plain(CHAIN_ENEMIES.cuckoo), idle(plain(CHAIN_ENEMIES.tin))]);
    const c = s.enemies[0].uid;
    // ハルトのすばやく（重さ1）は時刻1に効く。あかり（時刻1から重さ3）は時刻4、みお（時刻4から重さ1）は時刻5。鳩時計の時報も時刻5だが、仲間が先
    const plan = [move('hero', 'quick', c), move('akari', 'heal'), move('mio', 'kick', c)];
    const order = chainOrder(s, plan);
    expect(order.slice(0, 3).map((o) => `${o.kind}@${o.at}`)).toEqual(['ally@1', 'ally@4', 'ally@5']);
    const r = runChainRound(s, plan);
    // 鳩時計は物理が弱点。すばやくで時刻1にダウンし、時報は起きない
    expect(events(r).some((e) => e.type === 'down' && e.uid === c)).toBe(true);
    expect(events(r).some((e) => e.type === 'cancel' && e.uid === c)).toBe(true);
    expect(r.frames.map((f) => f.order)).toEqual(r.frames.map((_, i) => i + 1));
    // 重い技は、ラウンドの終わり（時刻10）までに終わらないと置けない
    expect(chainPlanError(s, [move('hero', 'finisher', c), move('akari', 'fire', c)], move('mio', 'thunder', c))).toBeNull();
    expect(chainPlanError(s, [move('hero', 'finisher', c), move('akari', 'fire', c), move('mio', 'kick', c)], { ally: 'hero', source: { kind: 'move', moveId: 'quick' }, target: c })).not.toBeNull();
  });

  it('押す：軽い技を当てると、その敵のまだ動いていない予定が後ろへずれ、ラウンドの外へ出ると起きない', () => {
    const s = make([{ ...plain(CHAIN_ENEMIES.menko), pattern: [{ ...CHAIN_ENEMIES.menko.pattern[1], at: 8 }] }, idle(plain(CHAIN_ENEMIES.tin))]);
    const m = s.enemies[0].uid;
    // めんこの予定は時刻8。けとばし（押す2）で時刻10 へ → ラウンドの外
    const r = runChainRound(s, [move('mio', 'kick', m)]);
    const ev = events(r);
    expect(ev.some((e) => e.type === 'push' && e.uid === m && e.out)).toBe(true);
    expect(ev.some((e) => e.type === 'act' && e.uid === m)).toBe(false);
    // 押し出さない時は、2マス後ろで動く
    const s2 = make([{ ...plain(CHAIN_ENEMIES.menko), pattern: [{ ...CHAIN_ENEMIES.menko.pattern[0], at: 5 }] }, idle(plain(CHAIN_ENEMIES.tin))]);
    const r2 = runChainRound(s2, [move('mio', 'kick', s2.enemies[0].uid)]);
    expect(r2.frames.find((f) => f.uid === s2.enemies[0].uid)!.at).toBe(7);
  });

  it('組み合わせの型：戦闘ごとに1つを選び、型の癖で予定が決まる（同じシードなら同じ型）', () => {
    const names = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) names.add(createChainBattle(BASE, CHAIN_RULES, seed).variant!);
    expect(names.size).toBe(BASE.variants!.length);
    expect(createChainBattle(BASE, CHAIN_RULES, 5).variant).toBe(createChainBattle(BASE, CHAIN_RULES, 5).variant);
    const big = [...Array(30)].map((_, k) => createChainBattle(BASE, CHAIN_RULES, k + 1)).find((x) => x.variant === '店じまい')!;
    expect(big.intents.find((i) => i.enemy === big.enemies[0].uid)!.move.id).toBe('bigFlip');
  });

  it('印と同じ属性が当たると共鳴し、同じ印の敵みんなに広がる（印は消える）', () => {
    const s = make([idle(plain(CHAIN_ENEMIES.tin)), idle(plain(CHAIN_ENEMIES.cuckoo)), idle(plain(CHAIN_ENEMIES.candy))], [CHAIN_CARDS.rod.id]);
    const a = s.enemies[0].uid;
    const plan: ChainPlanStep[] = [{ ally: 'akari', source: { kind: 'card', index: 0 } }, move('mio', 'thunder', a)];
    // 並べている時に、付く予定の印が分かる
    expect(Object.values(plannedMarks(s, plan)).every((m) => m.includes('thunder'))).toBe(true);
    const r = runChainRound(s, plan);
    expect(events(r).some((e) => e.type === 'resonate' && e.element === 'thunder' && e.to.length === 2)).toBe(true);
    const hit = new Set(events(r).flatMap((e) => (e.type === 'damage' && e.from === 'mio' ? [e.to] : [])));
    expect(hit.size).toBe(3);
    expect(r.state.enemies.every((e) => e.marks.length === 0)).toBe(true);
  });

  it('はじける：弱点でダウンさせると、破片が仲間全体に当たる', () => {
    const s = make([idle(CHAIN_ENEMIES.ramune), idle(plain(CHAIN_ENEMIES.cuckoo))]);
    const r = runChainRound(s, [move('hero', 'quick', uid(s, 'ramuneNoise'))]);
    expect(events(r).some((e) => e.type === 'pop')).toBe(true);
    expect(events(r).filter((e) => e.type === 'damage' && e.from === uid(s, 'ramuneNoise')).length).toBe(3);
  });

  it('すばやい：1ラウンドに2回動く。1回目より前にダウンさせれば、2回とも止まる', () => {
    const s = make([{ ...CHAIN_ENEMIES.yoyo, hp: 400, pattern: [{ ...CHAIN_ENEMIES.yoyo.pattern[0], at: 4, at2: 8 }] }, idle(plain(CHAIN_ENEMIES.tin))]);
    const y = uid(s, 'yoyoNoise');
    expect(s.intents.filter((i) => i.enemy === y).map((i) => i.at)).toEqual([4, 8]);
    const r = runChainRound(s, [move('akari', 'ice', y)]);
    expect(events(r).filter((e) => e.type === 'cancel' && e.uid === y).length).toBe(2);
  });

  it('盾：立っている間、ほかの敵への単体攻撃を代わりに受ける。全体攻撃は防がない', () => {
    const s = make([idle(CHAIN_ENEMIES.table), idle(plain(CHAIN_ENEMIES.cuckoo))], [CHAIN_CARDS.wideShot.id]);
    const table = uid(s, 'tableNoise');
    const c = uid(s, 'cuckooNoise');
    const r = runChainRound(s, [move('hero', 'slash', c), { ally: 'akari', source: { kind: 'card', index: 0 } }]);
    const ev = events(r);
    expect(ev.some((e) => e.type === 'cover' && e.shield === table)).toBe(true);
    expect(ev.filter((e) => e.type === 'damage' && e.from === 'hero').map((e) => (e as { to: string }).to)).toEqual([table]);
    expect(ev.some((e) => e.type === 'damage' && e.from === 'akari' && e.to === c)).toBe(true);
  });

  it('殻：最初の1回は殻が割れるだけで、2回目から効く', () => {
    const s = make([idle(CHAIN_ENEMIES.tin), idle(plain(CHAIN_ENEMIES.cuckoo))]);
    const t = uid(s, 'tinNoise');
    const r = runChainRound(s, [move('hero', 'quick', t), move('akari', 'ice', t)]);
    const ev = events(r);
    expect(ev.some((e) => e.type === 'shellBreak' && e.uid === t)).toBe(true);
    expect(ev.filter((e) => e.type === 'damage' && e.to === t).length).toBe(1);
    expect(ev.some((e) => e.type === 'down' && e.uid === t)).toBe(true);
  });

  it('ねばねば：当てると、まだ動いていない仲間の時刻が2遅れる。ラウンドを過ぎると時間切れで動けない', () => {
    const s = make([idle(CHAIN_ENEMIES.candy), idle(plain(CHAIN_ENEMIES.cuckoo))]);
    const c = uid(s, 'candyNoise');
    const cu = uid(s, 'cuckooNoise');
    // ハルト（時刻0から重さ4 → 4）→ あかり（4から3 → 7）→ みお（7から1 → 8）。ハルトがねばねばを叩くと、あかりは9、みおは10
    const r = runChainRound(s, [move('hero', 'finisher', c), move('akari', 'heal'), move('mio', 'kick', cu)]);
    expect(events(r).some((e) => e.type === 'sticky')).toBe(true);
    expect(r.frames.find((f) => f.uid === 'akari')!.at).toBe(9);
    expect(r.frames.find((f) => f.uid === 'mio')!.at).toBe(10);
    // みおもねばねばを叩くと、さらに遅れ、あかりは時刻12で間に合わない
    const r2 = runChainRound(s, [move('hero', 'finisher', c), move('mio', 'kick', c), move('akari', 'fire', c)]);
    expect(events(r2).some((e) => e.type === 'cancel' && e.uid === 'akari' && e.reason === 'time')).toBe(true);
  });

  it('起こし役：動くと、ダウンしているほかの敵を起こす', () => {
    const s = make([{ ...plain(CHAIN_ENEMIES.yoyo), hp: 400 }, CHAIN_ENEMIES.cuckoo]);
    const y = uid(s, 'yoyoNoise');
    const r = runChainRound(s, [move('akari', 'ice', y)]);
    const ev = events(r);
    expect(ev.some((e) => e.type === 'down' && e.uid === y)).toBe(true);
    expect(ev.some((e) => e.type === 'wake' && e.woke.includes(y))).toBe(true);
  });

  it('反撃：ダウンしていない時に叩かれると、やり返す。弱点でダウンさせればやり返さない', () => {
    const s = make([idle(CHAIN_ENEMIES.menko), idle(plain(CHAIN_ENEMIES.cuckoo))]);
    const m = uid(s, 'menkoNoise');
    expect(events(runChainRound(s, [move('hero', 'slash', m)])).some((e) => e.type === 'counter' && e.to === 'hero')).toBe(true);
    expect(events(runChainRound(s, [move('akari', 'fire', m)])).some((e) => e.type === 'counter')).toBe(false);
  });

  it('分裂：倒すと小さい2体に分かれる', () => {
    const s = make([{ ...idle(CHAIN_ENEMIES.balloon), hp: 5 }]);
    const r = runChainRound(s, [move('hero', 'quick', s.enemies[0].uid)]);
    expect(events(r).some((e) => e.type === 'split')).toBe(true);
    expect(r.state.enemies.filter((e) => e.defId === 'miniBalloon' && e.hp > 0).length).toBe(2);
    expect(r.state.outcome).toBe('ongoing');
  });

  it('時限：ラウンドの終わりごとに1減り、0で大爆発して消える', () => {
    let s = make([idle(CHAIN_ENEMIES.coil), idle(plain(CHAIN_ENEMIES.cuckoo))]);
    const c = uid(s, 'coilNoise');
    for (let k = 0; k < 2; k++) s = runChainRound(s, []).state;
    expect(s.enemies.find((e) => e.uid === c)!.timer).toBe(1);
    const r = runChainRound(s, []);
    expect(events(r).some((e) => e.type === 'timerBlast' && e.uid === c)).toBe(true);
    expect(r.state.enemies.find((e) => e.uid === c)!.gone).toBe(true);
    expect(r.state.allies.every((a) => a.hp <= a.maxHp - CHAIN_RULES.timerDamage)).toBe(true);
  });

  it('逃げる：「逃げる」の予定が動くと、戦闘からいなくなる。残りを倒せば勝ち', () => {
    let s = make([CHAIN_ENEMIES.goldfish, { ...idle(plain(CHAIN_ENEMIES.cuckoo)), hp: 1 }]);
    s = runChainRound(s, []).state;
    const g = uid(s, 'goldfishNoise');
    expect(s.intents.find((i) => i.enemy === g)!.move.flee).toBe(true);
    const r = runChainRound(s, [move('hero', 'quick', uid(s, 'cuckooNoise'))]);
    // 鳩時計を倒しても、金魚がまだいる。時刻8に逃げると、勝ち
    expect(events(r).some((e) => e.type === 'flee' && e.uid === g)).toBe(true);
    expect(r.state.outcome).toBe('win');
  });

  it('専用の札はその仲間しか使えない。組む2人の専用の札が手札にそろうと連携技が使え、2人の手番と2枚を使う', () => {
    const s = make([idle(plain(CHAIN_ENEMIES.cuckoo)), idle(plain(CHAIN_ENEMIES.tin))], [CHAIN_CARDS.swing.id, CHAIN_CARDS.sparkler.id, CHAIN_CARDS.decisive.id]);
    expect(chainPlanError(s, [], { ally: 'mio', source: { kind: 'card', index: 0 }, target: s.enemies[0].uid })).toContain('ハルト');
    const links = availableLinks(s, []);
    expect(links.map((x) => x.link.id)).toEqual(['afterglow']);
    const step: ChainPlanStep = { ally: 'hero', source: { kind: 'link', linkId: 'afterglow', cards: links[0].cards } };
    expect(chainPlanError(s, [], step)).toBeNull();
    // 連携技を並べると、ハルトもあかりも並べたことになる
    expect(chainPlanError(s, [step], move('akari', 'fire', s.enemies[0].uid))).not.toBeNull();
    expect(availableLinks(s, [move('akari', 'heal')])).toEqual([]);
    const r = runChainRound(s, [step]);
    expect(events(r).some((e) => e.type === 'link')).toBe(true);
    expect(r.state.discard).toEqual(expect.arrayContaining([CHAIN_CARDS.swing.id, CHAIN_CARDS.sparkler.id]));
  });

  it('生きている敵が全員ダウンするとシャッターが光り、押すと決着。決着の時刻が早いほど評価が高い', () => {
    const s = make([idle(plain(CHAIN_ENEMIES.balloon)), idle(plain(CHAIN_ENEMIES.goldfish))], [CHAIN_CARDS.rod.id]);
    const r = runChainRound(s, [{ ally: 'akari', source: { kind: 'card', index: 0 } }, move('mio', 'thunder', s.enemies[0].uid)]);
    expect(r.state.shutter).toBe(true);
    const won = takeShutter(r.state);
    expect(won.outcome).toBe('win');
    // 避雷針（重さ2 → 時刻2）→ サンダー（2から3 → 時刻5）で全員ダウン。決着の時刻は5で、評価は高
    expect(won.finishTime).toBe(5);
    expect(chainGrade(won)).toBe('high');
    expect(chainGrade({ ...won, finishTime: 14 })).toBe('mid');
    expect(chainGrade({ ...won, finishTime: 30 })).toBe('low');
  });

  it('ラウンドの終わりに、ダウンが解け、癖が1つ進み、手札が5枚まで戻る', () => {
    const s = createChainBattle(BASE, CHAIN_RULES, 3);
    expect(s.hand.length).toBe(5);
    const { state } = runChainRound(s, [move('hero', 'quick', s.enemies[1].uid)]);
    if (state.outcome !== 'ongoing' || state.shutter) return;
    expect(state.round).toBe(2);
    expect(state.hand.length).toBe(5);
    expect(state.enemies.every((e) => !e.down)).toBe(true);
    const e0 = state.enemies[0];
    const pattern = e0.pattern ?? CHAIN_ENEMIES.table.pattern;
    expect(state.intents.find((i) => i.enemy === e0.uid)!.move.id).toBe(pattern[1 % pattern.length].id);
    expect(state.elapsed).toBe(CHAIN_RULES.roundLen);
  });

  it('同じシードなら同じ結果。考える方針は、でたらめな方針より早く勝つ', () => {
    expect(autoChainBattle(BASE, CHAIN_RULES, 5, 'smart')).toEqual(autoChainBattle(BASE, CHAIN_RULES, 5, 'smart'));
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
