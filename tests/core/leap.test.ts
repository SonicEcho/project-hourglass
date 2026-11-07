import { describe, expect, it } from 'vitest';
import { createLeapBattle, leapOrder, leapPlanError, runLeapRound, type LeapBattleDef, type LeapEnemyDef, type LeapEvent, type LeapPlanStep, type LeapState } from '../../src/core';
import { LEAP_CARDS, LEAP_ENEMIES, LEAP_RULES, LEAP_TRIALS } from '../../src/data';
import { autoLeapBattle } from '../../src/sim/leapAuto';

// 試し：組んで跳ねる戦闘（段階157）
const BASE = LEAP_TRIALS[0];
/** 攻撃しない、弱点のない、HP の多い敵 */
const dummy = (over: Partial<LeapEnemyDef> = {}): LeapEnemyDef => ({ id: 'dummy', name: '的', hp: 9999, atk: 0, weak: [], pattern: [{ id: 'idle', name: 'ぼんやり', power: 0 }], ...over });

function make(enemies: LeapEnemyDef[], hand: string[] = []): LeapState {
  const def: LeapBattleDef = { ...BASE, enemies };
  const s = createLeapBattle(def, LEAP_RULES, 7);
  s.hand = [...hand];
  return s;
}
const mv = (ally: string, moveId: string, target?: string, addons: number[] = []): LeapPlanStep => ({ ally, source: { kind: 'move', moveId }, target, addons });
const card = (ally: string, index: number, target?: string, addons: number[] = []): LeapPlanStep => ({ ally, source: { kind: 'card', index }, target, addons });
const hits = (r: { frames: { events: LeapEvent[] }[] }, from: string) =>
  r.frames.flatMap((f) => f.events).filter((e): e is Extract<LeapEvent, { type: 'hit' }> => e.type === 'hit' && e.from === from);

describe('組んで跳ねる戦闘（段階157）', () => {
  it('連続攻撃は、動いている敵には2発だけ、止まっている敵には全段当たる', () => {
    const s = make([dummy()], [LEAP_CARDS.burst.id]);
    const t = s.enemies[0].uid;
    expect(hits(runLeapRound(s, [card('hero', 0, t)]), 'hero').length).toBe(2);
    // みおの足払いでよろけさせてから
    const s2 = make([dummy()], [LEAP_CARDS.burst.id]);
    expect(hits(runLeapRound(s2, [mv('mio', 'trip', t), card('hero', 0, t)]), 'hero').length).toBe(5);
  });

  it('添える札は手番を使わず、1発ごとに足す：(20+30)×5 ＝ 250', () => {
    const s = make([dummy()], [LEAP_CARDS.burst.id, LEAP_CARDS.plus30.id]);
    const t = s.enemies[0].uid;
    const r = runLeapRound(s, [mv('mio', 'trip', t), card('hero', 0, t, [1])]);
    const h = hits(r, 'hero');
    expect(h.map((x) => x.amount)).toEqual([50, 50, 50, 50, 50]);
    expect(r.frames.flatMap((f) => f.events).some((e) => e.type === 'total' && e.amount === 250)).toBe(true);
    // 添える札を行動として使うことはできない。添えるのは2枚まで
    expect(leapPlanError(s, [], card('hero', 1, t))).not.toBeNull();
  });

  it('濡れ × 雷 ＝ 2倍でしびれ。ストロボは1発目でしびれて、残りも全部当たる', () => {
    const s = make([dummy()], [LEAP_CARDS.strobe.id]);
    const t = s.enemies[0].uid;
    const r = runLeapRound(s, [mv('mio', 'balloon'), card('akari', 0, t)]);
    const h = hits(r, 'akari');
    expect(h.length).toBe(5);
    expect(h.every((x) => x.reaction === 'shock' && x.amount === 24)).toBe(true);
    expect(r.state.enemies[0].wet).toBeFalsy();
  });

  it('凍り × 物理 ＝ 2倍（氷は割れる）', () => {
    const s = make([dummy()]);
    const t = s.enemies[0].uid;
    const r = runLeapRound(s, [mv('akari', 'ice', t), mv('hero', 'slash', t)]);
    expect(hits(r, 'hero')[0]).toMatchObject({ amount: 80, reaction: 'shatter' });
    expect(r.state.enemies[0].frozen).toBeFalsy();
  });

  it('露出補正は、添えた行動から後の、このラウンドの味方の攻撃すべてに1発ごと+10（先に動く人に添えるほど伸びる）', () => {
    const s = make([dummy()], [LEAP_CARDS.exposure.id]);
    const t = s.enemies[0].uid;
    const r = runLeapRound(s, [mv('mio', 'trip', t, [0]), mv('hero', 'flurry', t), mv('akari', 'fire', t)]);
    expect(hits(r, 'mio')[0].amount).toBe(10 + 10);
    expect(hits(r, 'hero').map((x) => x.amount)).toEqual([25, 25, 25, 25]);
    expect(hits(r, 'akari')[0].amount).toBe(50);
    // 次のラウンドには残らない
    expect(r.state.exposure).toBe(0);
  });

  it('砂は味方の攻撃が1発当たるたびにたまり、砂時計を返すと1粒につき30', () => {
    const s = make([dummy()], [LEAP_CARDS.hourglass.id]);
    const t = s.enemies[0].uid;
    const r = runLeapRound(s, [mv('mio', 'trip', t), mv('hero', 'flurry', t)]);
    expect(r.state.enemies[0].sand).toBe(5);
    const r2 = runLeapRound({ ...r.state, hand: [LEAP_CARDS.hourglass.id] }, [card('akari', 0, t)]);
    expect(hits(r2, 'akari')[0].amount).toBe(150);
    expect(r2.state.enemies[0].sand).toBe(0);
  });

  it('見切り：ラウンドの始めから単体攻撃を引き受け、1発受けるたびに反撃（添える札は反撃ごとに乗る）', () => {
    const rapid = dummy({ atk: 10, pattern: [{ id: 'rapid', name: '乱れ撃ち', power: 5, hits: 6, first: true }] });
    const s = make([rapid], [LEAP_CARDS.guard.id, LEAP_CARDS.plus30.id]);
    // 狙いはだれでも、見切りの仲間が受ける
    const r = runLeapRound(s, [card('hero', 0, undefined, [1])]);
    const taken = r.frames.flatMap((f) => f.events).filter((e) => e.type === 'hit' && e.to === 'hero');
    expect(taken.length).toBe(6);
    expect(hits(r, 'hero').map((x) => x.amount)).toEqual([50, 50, 50, 50, 50, 50]);
  });

  it('動く順：先制の敵 → 仲間（並べた順）→ ほかの敵。止まった敵の行動は起きず、その時に止まりが解ける', () => {
    const s = make([dummy({ id: 'da', pattern: [{ id: 'a', name: 'ふつう', power: 10 }] }), dummy({ id: 'db', pattern: [{ id: 'b', name: '先制', power: 10, first: true }] })]);
    const [a] = s.enemies.map((e) => e.uid);
    const plan = [mv('mio', 'trip', a), mv('hero', 'slash', a)];
    const order = leapOrder(s, plan);
    expect(order.map((o) => (o.kind === 'ally' ? plan[o.i].ally : o.intent.move.id))).toEqual(['b', 'mio', 'hero', 'a']);
    const r = runLeapRound(s, plan);
    const ev = r.frames.flatMap((f) => f.events);
    expect(ev.some((e) => e.type === 'cancel' && e.uid === a)).toBe(true);
    expect(r.state.enemies[0].stopped).toBeUndefined();
    // 1人1回まで
    expect(leapPlanError(s, [plan[0]], mv('mio', 'balloon'))).not.toBeNull();
  });

  it('重い敵はよろけない。弱点はダウン（止まる）', () => {
    const s = make([dummy({ id: 'dh', heavy: true }), dummy({ id: 'dw', weak: ['fire'] })]);
    const [h, w] = s.enemies.map((e) => e.uid);
    const r = runLeapRound(s, [mv('mio', 'trip', h), mv('akari', 'fire', w)]);
    expect(r.state.enemies[0].stopped).toBeUndefined();
    expect(r.frames.flatMap((f) => f.events).some((e) => e.type === 'stop' && e.uid === w && e.why === 'down')).toBe(true);
  });

  it('同じシードなら同じ結果。ボスは、考える方針の方が、組まない方針より早く勝つ', () => {
    const boss = LEAP_TRIALS[2];
    expect(autoLeapBattle(boss, LEAP_RULES, 3, 'smart')).toEqual(autoLeapBattle(boss, LEAP_RULES, 3, 'smart'));
    let smart = 0;
    let simple = 0;
    for (let k = 0; k < 3; k++) {
      const x = autoLeapBattle(boss, LEAP_RULES, 40 + k, 'smart');
      const y = autoLeapBattle(boss, LEAP_RULES, 40 + k, 'simple');
      expect(x.outcome).toBe('win');
      smart += x.rounds;
      simple += y.outcome === 'win' ? y.rounds : 30;
    }
    expect(smart).toBeLessThan(simple);
    expect(LEAP_ENEMIES.lord.heavy).toBe(true);
  });
});
