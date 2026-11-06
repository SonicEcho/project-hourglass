import { describe, expect, it } from 'vitest';
import {
  availableLinks,
  chainOrder,
  chainPlanError,
  createChainBattle,
  nextStart,
  plannedEffects,
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

// 試し：並べてつなぐ戦闘（段階156。調整3：専用の札と連携技・10の特徴。調整6：終わった時刻に効く・押す・組み合わせの型・決着の時刻。調整7：仕掛けと状態）
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

  const cardStep = (ally: string, index: number, target?: string): ChainPlanStep => ({ ally, source: { kind: 'card', index }, target });

  it('仕掛け「目印」：次に当たった攻撃が、ほかの敵みんなに同じ威力で広がる（広がった先ではダウンしない。1回で消える）', () => {
    const s = make([idle(plain(CHAIN_ENEMIES.cuckoo)), idle(plain(CHAIN_ENEMIES.cuckoo)), idle(plain(CHAIN_ENEMIES.candy))], [CHAIN_CARDS.target.id]);
    const [a, b, c] = s.enemies.map((e) => e.uid);
    const plan = [cardStep('akari', 0, a), move('hero', 'slash', a)];
    expect(plannedEffects(s, plan)[a].trick).toBe('spread');
    const r = runChainRound(s, plan);
    const ev = events(r);
    expect(ev.some((e) => e.type === 'trickUse' && e.trick === 'spread' && e.to!.length === 2)).toBe(true);
    const hit = new Set(ev.flatMap((e) => (e.type === 'damage' && e.from === 'hero' ? [e.to] : [])));
    expect([...hit].sort()).toEqual([a, b, c].sort());
    // 鳩時計は物理が弱点。印の敵はダウンし、広がった先の鳩時計はダウンしない
    expect(ev.some((e) => e.type === 'down' && e.uid === a)).toBe(true);
    expect(ev.some((e) => e.type === 'down' && e.uid === b)).toBe(false);
    expect(r.frames.at(-1)!.state.enemies[0].trick).toBeUndefined();
  });

  it('仕掛け・状態の予告：単体の札は、盾が立っていれば盾に付く見込みを出す', () => {
    const s = make([idle(plain(CHAIN_ENEMIES.menko)), idle(CHAIN_ENEMIES.table)], [CHAIN_CARDS.target.id]);
    const [m, tb] = s.enemies.map((e) => e.uid);
    const fx = plannedEffects(s, [cardStep('hero', 0, m)]);
    expect(fx[tb].trick).toBe('spread');
    expect(fx[m]).toBeUndefined();
  });

  it('仕掛け「むき出し」：次に当たった攻撃が、属性に関係なく弱点になってダウンする', () => {
    const s = make([idle(plain(CHAIN_ENEMIES.tin)), idle(plain(CHAIN_ENEMIES.candy))], [CHAIN_CARDS.expose.id]);
    const t = s.enemies[0].uid;
    const ev = events(runChainRound(s, [cardStep('akari', 0, t), move('hero', 'slash', t)]));
    expect(ev.some((e) => e.type === 'damage' && e.from === 'hero' && e.to === t && e.weak)).toBe(true);
    expect(ev.some((e) => e.type === 'down' && e.uid === t)).toBe(true);
  });

  it('弱点は最初は分からず、その属性で当てた時に分かる。分かった弱点は次の戦闘へ引き継げる。ハイライトの弱点扱いでは分からない（調整9）', () => {
    const big = { ...idle(plain(CHAIN_ENEMIES.cuckoo)), hp: 999 };
    const s = make([big]);
    const t = s.enemies[0].uid;
    expect(s.known).toEqual({});
    const r = runChainRound(s, [move('hero', 'slash', t)]);
    expect(events(r).filter((e) => e.type === 'reveal')).toEqual([{ type: 'reveal', uid: t, defId: big.id, element: 'physical' }]);
    expect(r.state.known[big.id]).toEqual(['physical']);
    // 元の状態は変わらない
    expect(s.known).toEqual({});
    // 次の戦闘へ引き継ぐと、もう一度当てても「分かった」は出ない
    const next = createChainBattle({ ...BASE, enemies: [big], variants: undefined }, CHAIN_RULES, 8, r.state.known);
    expect(next.known[big.id]).toEqual(['physical']);
    const r2 = runChainRound(next, [move('hero', 'slash', next.enemies[0].uid)]);
    expect(events(r2).some((e) => e.type === 'reveal')).toBe(false);
    // ハイライトで弱点扱いになっても、本当の弱点（ブリキは氷）は分からない
    const s3 = make([{ ...idle(plain(CHAIN_ENEMIES.tin)), hp: 999 }], [CHAIN_CARDS.expose.id]);
    const t3 = s3.enemies[0].uid;
    const r3 = runChainRound(s3, [cardStep('akari', 0, t3), move('hero', 'slash', t3)]);
    expect(events(r3).some((e) => e.type === 'reveal')).toBe(false);
    expect(r3.state.known).toEqual({});
  });

  it('割り込み：単体の行動に狙われると、その行動の前に、まだ動いていない自分の予定を先に動かす（調整12）', () => {
    const phone = { ...CHAIN_ENEMIES.phone, hp: 999 };
    const s = make([phone]);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [move('hero', 'slash', t)]);
    // 斬る（時刻2）の前に、黒電話の時刻6の予定が割り込む。時刻6にはもう動かない
    const iFrame = r.frames.findIndex((f) => f.events.some((e) => e.type === 'interrupt'));
    const hFrame = r.frames.findIndex((f) => f.uid === 'hero' && f.events.some((e) => e.type === 'act'));
    expect(iFrame).toBeGreaterThanOrEqual(0);
    expect(iFrame).toBeLessThan(hFrame);
    expect(r.frames[iFrame].at).toBe(2);
    expect(r.frames.filter((f) => f.uid === t && f.events.some((e) => e.type === 'act'))).toHaveLength(1);
    // 全体攻撃では割り込まない
    const r2 = runChainRound(make([phone], [CHAIN_CARDS.wideShot.id]), [cardStep('hero', 0)]);
    expect(events(r2).some((e) => e.type === 'interrupt')).toBe(false);
  });

  it('予定隠し：ラウンドの始めは予定が隠れ、攻撃を当てると見える。次のラウンドはまた隠れる（調整12）', () => {
    const s = make([{ ...idle(CHAIN_ENEMIES.mask), hp: 999 }]);
    const t = s.enemies[0].uid;
    expect(s.enemies[0].veiled).toBe(true);
    const r = runChainRound(s, [move('hero', 'quick', t)]);
    const unveil = r.frames.find((f) => f.events.some((e) => e.type === 'unveil'));
    expect(unveil?.state.enemies[0].veiled).toBe(false);
    expect(r.state.enemies[0].veiled).toBe(true);
  });

  it('巻き戻し：ラウンドの終わりに、そのラウンドに受けたダメージを回復する。ダウン中なら回復しない（調整12）', () => {
    const big = { ...idle(CHAIN_ENEMIES.phonograph), hp: 999 };
    const s = make([big]);
    const t = s.enemies[0].uid;
    // 斬る（物理。弱点でない）だけ：ダメージは戻る
    const r = runChainRound(s, [move('hero', 'slash', t)]);
    expect(events(r).some((e) => e.type === 'rewind')).toBe(true);
    expect(r.state.enemies[0].hp).toBe(999);
    // 弱点の雷でダウンさせると、戻らない
    const r2 = runChainRound(make([big, idle(plain(CHAIN_ENEMIES.cuckoo))]), [move('mio', 'zap', t)]);
    expect(events(r2).some((e) => e.type === 'rewind')).toBe(false);
    expect(r2.state.enemies[0].hp).toBeLessThan(999);
  });

  it('属性チェンジ：ラウンドごとに弱点が順に変わる（調整12）', () => {
    let s = make([{ ...idle(CHAIN_ENEMIES.pinwheel), hp: 999 }]);
    expect(s.enemies[0].weak).toEqual(['fire']);
    s = runChainRound(s, []).state;
    expect(s.enemies[0].weak).toEqual(['ice']);
    s = runChainRound(s, []).state;
    expect(s.enemies[0].weak).toEqual(['thunder']);
  });

  it('リーダー：生きている間、ほかの敵の攻撃が強くなる。倒すと、ほかの敵が動揺してダウンする（調整12）', () => {
    const mask = { ...plain(CHAIN_ENEMIES.mask), hp: 999 };
    const leader = idle(CHAIN_ENEMIES.megaphone);
    const dealt = (enemies: ChainEnemyDef[]) => {
      const s = make(enemies);
      const m = s.enemies[0].uid;
      return events(runChainRound(s, [])).filter((e) => e.type === 'damage' && e.from === m).reduce((a, e) => a + (e.type === 'damage' ? e.amount : 0), 0);
    };
    expect(dealt([mask, { ...leader, hp: 999 }])).toBeGreaterThan(dealt([mask, plain({ ...leader, hp: 999 })]));
    // 倒すと、ほかの敵がダウン（全員ダウンでシャッター）
    const s = make([{ ...idle(mask) }, { ...leader, hp: 1 }]);
    const r = runChainRound(s, [move('hero', 'quick', s.enemies[1].uid)]);
    expect(events(r).some((e) => e.type === 'panic')).toBe(true);
    expect(r.state.shutter).toBe(true);
  });

  it('仕掛け「すき」：次に当たった締めの札が2倍になる', () => {
    const base = make([{ ...idle(plain(CHAIN_ENEMIES.table)), hp: 999 }, idle(plain(CHAIN_ENEMIES.candy))], [CHAIN_CARDS.rattle.id]);
    const t = base.enemies[0].uid;
    const dmg = (r: ReturnType<typeof runChainRound>) => (r.frames.flatMap((f) => f.events).find((e) => e.type === 'damage' && e.from === 'hero') as { amount: number }).amount;
    const plain1 = dmg(runChainRound(base, [move('mio', 'kick', base.enemies[1].uid), move('hero', 'finisher', t)]));
    const boosted = dmg(runChainRound(base, [cardStep('mio', 0, t), move('hero', 'finisher', t)]));
    expect(boosted).toBeGreaterThanOrEqual(plain1 * 2 - 1);
  });

  it('状態「鈍足」：その敵の予定が1マス遅れる（付けたラウンドにもすぐ効き、次のラウンドも続く）', () => {
    const s = make([{ ...plain(CHAIN_ENEMIES.cuckoo), pattern: [{ ...CHAIN_ENEMIES.cuckoo.pattern[1], at: 5 }] }, idle(plain(CHAIN_ENEMIES.tin))], [CHAIN_CARDS.chill.id]);
    const c = s.enemies[0].uid;
    const r = runChainRound(s, [cardStep('akari', 0, c)]);
    expect(r.frames.find((f) => f.uid === c && f.events.some((e) => e.type === 'act'))!.at).toBe(6);
    expect(r.state.intents.find((i) => i.enemy === c)!.at).toBe(6);
  });

  it('状態「やけど」：ラウンドの終わりごとにダメージ。数ラウンドで消える', () => {
    let s = make([{ ...idle(plain(CHAIN_ENEMIES.tin)), hp: 999 }, idle(plain(CHAIN_ENEMIES.candy))], [CHAIN_CARDS.ember.id]);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [cardStep('akari', 0, t)]);
    expect(events(r).some((e) => e.type === 'burn' && e.uid === t && e.amount === CHAIN_RULES.burnDamage)).toBe(true);
    // ラウンドの終わりのコマは、時刻の境目のラウンドの終わり（時刻10）に出る
    expect(r.frames.find((f) => f.key.startsWith('burn:'))!.at).toBe(CHAIN_RULES.roundLen);
    s = r.state;
    for (let k = 0; k < 3; k++) s = runChainRound(s, []).state;
    expect(s.enemies[0].status).toBeUndefined();
  });

  it('状態「刻み」：当たるたびに、受けるダメージが上がっていく', () => {
    const s = make([{ ...idle(plain(CHAIN_ENEMIES.table)), resist: [], hp: 999 }, idle(plain(CHAIN_ENEMIES.candy))], [CHAIN_CARDS.notch.id]);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [cardStep('akari', 0, t), move('hero', 'quick', t), move('mio', 'kick', t)]);
    const st = r.frames.at(-1)!.state.enemies[0].status!;
    expect(st.kind).toBe('stack');
    expect(st.stacks).toBe(2);
  });

  it('状態「弱り」：その敵の攻撃が半分になる', () => {
    const foe = { ...plain(CHAIN_ENEMIES.cuckoo), pattern: [{ ...CHAIN_ENEMIES.cuckoo.pattern[0], at: 5 }] };
    const s = make([foe, idle(plain(CHAIN_ENEMIES.tin))], [CHAIN_CARDS.wilt.id]);
    const hurt = (r: ReturnType<typeof runChainRound>) => events(r).filter((e) => e.type === 'damage' && e.from === s.enemies[0].uid).reduce((a, e) => a + (e as { amount: number }).amount, 0);
    const normal = hurt(runChainRound(s, [move('akari', 'heal')]));
    const weak = hurt(runChainRound(s, [cardStep('akari', 0, s.enemies[0].uid)]));
    expect(weak).toBeLessThanOrEqual(Math.ceil(normal / 2) + 3);
    expect(weak).toBeLessThan(normal);
  });

  it('状態「封印」：全体攻撃と大技が、ふつうの攻撃に変わる', () => {
    const s = make([plain(CHAIN_ENEMIES.cuckoo), idle(plain(CHAIN_ENEMIES.tin))], [CHAIN_CARDS.seal.id]);
    const c = s.enemies[0].uid;
    expect(s.intents.find((i) => i.enemy === c)!.move.all).toBe(true);
    const r = runChainRound(s, [cardStep('akari', 0, c)]);
    const f = r.frames.find((x) => x.uid === c && x.events.some((e) => e.type === 'act'))!;
    expect(f.name).toContain('封印');
    expect(f.events.filter((e) => e.type === 'damage').length).toBe(1);
  });

  it('状態「混乱」：その敵の単体攻撃が、ほかの敵に向く', () => {
    const s = make([{ ...plain(CHAIN_ENEMIES.cuckoo), pattern: [{ ...CHAIN_ENEMIES.cuckoo.pattern[1], at: 7 }] }, { ...idle(plain(CHAIN_ENEMIES.tin)), hp: 999 }], [CHAIN_CARDS.dazzle.id]);
    const c = s.enemies[0].uid;
    const r = runChainRound(s, [cardStep('akari', 0, c)]);
    const ev = events(r).filter((e) => e.type === 'damage' && e.from === c);
    expect(ev.length).toBe(1);
    expect((ev[0] as { to: string }).to).toBe(s.enemies[1].uid);
  });

  it('状態「吸い取り」：その敵を攻撃した仲間が、与えたダメージの一部だけ回復する', () => {
    const s = make([{ ...idle(plain(CHAIN_ENEMIES.tin)), hp: 999 }, idle(plain(CHAIN_ENEMIES.candy))], [CHAIN_CARDS.leech.id]);
    s.allies[0].hp = 100;
    const r = runChainRound(s, [cardStep('akari', 0, s.enemies[0].uid), move('hero', 'slash', s.enemies[0].uid)]);
    expect(events(r).some((e) => e.type === 'drain' && e.to === 'hero')).toBe(true);
    expect(r.state.allies[0].hp).toBeGreaterThan(100);
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
    const s = make([idle(plain(CHAIN_ENEMIES.balloon)), idle(plain(CHAIN_ENEMIES.goldfish))], [CHAIN_CARDS.expose.id]);
    const [ba, go] = s.enemies.map((e) => e.uid);
    // 静電気（時刻1）で水風船が雷の弱点でダウン → あばく（時刻2）→ すばやく（時刻3）で金魚がむき出しの弱点でダウン
    const r = runChainRound(s, [move('mio', 'zap', ba), cardStep('akari', 0, go), move('hero', 'quick', go)]);
    expect(r.state.shutter).toBe(true);
    const won = takeShutter(r.state);
    expect(won.outcome).toBe('win');
    expect(won.finishTime).toBe(3);
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
