import { describe, expect, it } from 'vitest';
import { availableLinks, chainMoveOf, chainPlanError, createChainBattle, isChainFinish, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainPlanStep, type ChainState } from '../../src/core';
import { CHAIN17_CARDS as C, CHAIN17_COMBOS, CHAIN17_DECK_PLAN, CHAIN_RULES, CHAIN_TRIALS, CHAIN_TRIALS_MULTI } from '../../src/data';
import { autoChainBattle } from '../../src/sim/chainAuto';

// 試し：並べてつなぐ戦闘の調整17（docs/milestones/M3_battle_rethink.md の 14.）
const BASE = CHAIN_TRIALS[0];
/** 攻撃しない、弱点のない、HP の多い的（防御10なので、ハルトの物理は威力そのままのダメージ） */
const dummy = (over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id: 'dummy', name: '的', hp: 9999, atk: 0, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 0 }], ...over });

function make(enemies: ChainEnemyDef[], hand: string[] = [], over: Partial<ChainBattleDef> = {}): ChainState {
  const def: ChainBattleDef = { ...BASE, enemies, variants: undefined, ...over };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = [...hand];
  return s;
}
const mv = (ally: string, moveId: string, target?: string, addons: number[] = []): ChainPlanStep => ({ ally, source: { kind: 'move', moveId }, target, addons });
const card = (ally: string, index: number, target?: string, addons: number[] = []): ChainPlanStep => ({ ally, source: { kind: 'card', index }, target, addons });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);
const dmg = (r: { frames: { events: ChainEvent[] }[] }, from: string) => events(r).filter((e): e is Extract<ChainEvent, { type: 'damage' }> => e.type === 'damage' && e.from === from);

describe('並べてつなぐ戦闘・調整17（跳ねる要素）', () => {
  it('連続攻撃は全段当たり、添える札は1発ごとに足す：(12+30)×5', () => {
    const s = make([dummy()], [C.burst.id, C.plus30.id]);
    const t = s.enemies[0].uid;
    expect(dmg(runChainRound(s, [card('hero', 0, t, [1])]), 'hero').map((e) => e.amount)).toEqual([42, 42, 42, 42, 42]);
  });

  it('複数攻撃化は、単発を4回に分ける（総ダメージは同じ）。アタック+30 と重ねると跳ねる。分けられない札には添えられない', () => {
    const s = make([dummy()], [C.closeUp.id, C.split.id, C.plus30.id, C.burst.id]);
    const t = s.enemies[0].uid;
    expect(dmg(runChainRound(s, [card('hero', 0, t, [1])]), 'hero').map((e) => e.amount)).toEqual([10, 10, 10, 10]);
    expect(dmg(runChainRound(s, [card('hero', 0, t, [1, 2])]), 'hero').map((e) => e.amount)).toEqual([40, 40, 40, 40]);
    expect(chainPlanError(s, [], card('hero', 3, t, [1]))).not.toBeNull();
    // 添えられるのは2枚まで。添える札は行動としては置けない
    expect(chainPlanError(s, [], card('hero', 0, t, [1, 2, 3]))).not.toBeNull();
    expect(chainPlanError(s, [], card('hero', 1, t))).not.toBeNull();
  });

  it('露出補正（レア）は、添えた行動から後の味方の攻撃すべてに（フィニッシュにも）1発ごと+5', () => {
    const s = make([dummy()], [C.exposure.id, C.decisive.id]);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [mv('hero', 'basic', t, [0]), mv('mio', 'basic', t), card('akari', 1, t)]);
    expect(dmg(r, 'hero')[0].amount).toBe(25);
    expect(dmg(r, 'mio')[0].amount).toBe(Math.floor(((20 + 5) * 8) / 10));
    // 決めの一枚：60 + 当てた回数2 × 10 + 露出補正5（あかりの攻撃6）
    expect(dmg(r, 'akari')[0].amount).toBe(Math.floor(((60 + 20 + 5) * 6) / 10));
  });

  it('フィニッシュはラウンドの最後の行動だけ。添えられない', () => {
    const s = make([dummy()], [C.decisive.id, C.plus30.id]);
    const t = s.enemies[0].uid;
    expect(chainPlanError(s, [card('hero', 0, t)], mv('akari', 'basic', t))).not.toBeNull();
    expect(chainPlanError(s, [], card('hero', 0, t, [1]))).not.toBeNull();
    expect(isChainFinish(C.decisive)).toBe(true);
  });

  it('フィニッシュの伸び方：焼き付けはその敵に当てた回数、余白は残りのマス、現像は添えた札の数', () => {
    const s = make([dummy(), dummy({ id: 'd2' })], [C.imprint.id, C.margin.id, C.develop.id, C.plus10.id, C.push.id]);
    const [a, b] = s.enemies.map((e) => e.uid);
    // 乱れ斬り（3回）を a に、静電気（2回）を b に → 焼き付けは a へ 40 + 3×15
    const r1 = runChainRound(s, [mv('hero', 'flurry', a), mv('mio', 'zap', b), card('akari', 0, a)]);
    expect(dmg(r1, 'akari')[0].amount).toBe(Math.floor(((40 + 45) * 6) / 10));
    // 余白（重さ2）：通常攻撃（重さ2）の後なら時刻4に効き、残り6マス → 40 + 120
    const r2 = runChainRound(s, [mv('hero', 'basic', a), card('akari', 1, a)]);
    expect(dmg(r2, 'akari')[0].amount).toBe(Math.floor(((40 + 120) * 6) / 10));
    // 現像：添えた札2枚 → 40 + 50
    const r3 = runChainRound(s, [mv('hero', 'basic', a, [3, 4]), card('akari', 2, a)]);
    expect(dmg(r3, 'akari')[0].amount).toBe(Math.floor(((40 + 50) * 6) / 10));
  });

  it('パノラマ・ハイライト・フィルター・ピンポイント', () => {
    const s = make([dummy({ weak: ['fire'] }), dummy({ id: 'd2' })], [C.panorama.id, C.highlight.id, C.filterRed.id, C.pinpoint.id, C.decisive.id]);
    const [a, b] = s.enemies.map((e) => e.uid);
    expect(dmg(runChainRound(s, [mv('hero', 'basic', a, [0])]), 'hero').map((e) => e.to)).toEqual([a, b]);
    const hi = runChainRound(s, [mv('hero', 'basic', b, [1])]);
    expect(dmg(hi, 'hero')[0].weak).toBe(true);
    expect(events(hi).some((e) => e.type === 'down' && e.uid === b)).toBe(true);
    expect(dmg(runChainRound(s, [mv('hero', 'basic', a, [2])]), 'hero')[0].weak).toBe(true);
    // ピンポイントを当てた敵は、このラウンドのフィニッシュを1.5倍で受ける
    const plain = dmg(runChainRound(s, [mv('hero', 'basic', b), card('akari', 4, b)]), 'akari')[0].amount;
    const pin = dmg(runChainRound(s, [mv('hero', 'basic', b, [3]), card('akari', 4, b)]), 'akari')[0].amount;
    expect(pin).toBeGreaterThanOrEqual(Math.floor(plain * 1.5) - 1);
  });

  it('押す（添える）：当たった敵のまだ動いていない予定を2マス後ろへ。ポーズは大技を封じる。リワインドは回復', () => {
    const foe = dummy({ atk: 10, pattern: [{ id: 'big', name: '大波', at: 5, all: true, element: 'physical', power: 40 }] });
    const s = make([foe], [C.push.id, C.pause.id, C.rewind.id]);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [mv('hero', 'basic', t, [0])]);
    expect(events(r).some((e) => e.type === 'push' && e.moved)).toBe(true);
    const r2 = runChainRound(s, [mv('hero', 'basic', t, [1])]);
    expect(events(r2).filter((e) => e.type === 'damage' && e.from === t).length).toBe(1);
    const hurt = { ...s, allies: s.allies.map((a) => (a.uid === 'hero' ? { ...a, hp: 100 } : a)) };
    const r3 = runChainRound(hurt, [mv('hero', 'basic', t, [2])]);
    expect(events(r3).some((e) => e.type === 'drain' && e.to === 'hero' && e.amount === 6)).toBe(true);
  });

  it('長回し：動き始めてから効くまでの間に敵が動くと不発で、札は手札に戻る。終わりちょうどの敵の行動では中断しない', () => {
    const at = (t: number) => dummy({ pattern: [{ id: 'x', name: 'つつく', at: t, element: 'physical', power: 1 }] });
    const s = make([at(3)], [C.longTake.id]);
    const r = runChainRound(s, [card('hero', 0, s.enemies[0].uid)]);
    expect(events(r).some((e) => e.type === 'cancel' && e.reason === 'interrupted')).toBe(true);
    expect(r.state.hand).toContain(C.longTake.id);
    const s2 = make([at(5)], [C.longTake.id]);
    expect(dmg(runChainRound(s2, [card('hero', 0, s2.enemies[0].uid)]), 'hero')[0].amount).toBe(150);
  });

  it('かたい：1発ごとに減らす（重い一撃は1.5倍）。バリア：最初の2発を消す（重い一撃は1発で割って当たる）', () => {
    const s = make([dummy({ trait: 'hard' })], [C.burst.id, C.bigShot.id]);
    const t = s.enemies[0].uid;
    expect(dmg(runChainRound(s, [card('hero', 0, t)]), 'hero').every((e) => e.amount === 1)).toBe(true);
    expect(dmg(runChainRound(s, [card('hero', 1, t)]), 'hero')[0].amount).toBe(150);
    const b = make([dummy({ trait: 'shell', shellHits: 2 })], [C.burst.id, C.bigShot.id]);
    const u = b.enemies[0].uid;
    expect(dmg(runChainRound(b, [card('hero', 0, u)]), 'hero').length).toBe(3);
    expect(dmg(runChainRound(b, [card('hero', 1, u)]), 'hero')[0].amount).toBe(100);
  });

  it('コンボ：材料がそろうと使える。仲間の専用の札のレシピは、その仲間が動く（3人技は3人とも）', () => {
    const s = make([dummy()], [C.backlight.id, C.blueHour.id, C.strobe.id]);
    const found = availableLinks(s, []);
    // 3枚の三原色と、2枚のフラッシュバック（逆光＋ストロボ）の両方がそろう
    expect(found.map((x) => x.link.id).sort()).toEqual(['flashback', 'tricolor']);
    expect(found.find((x) => x.link.id === 'flashback')!.cards.length).toBe(2);
    const tri = found.find((x) => x.link.id === 'tricolor')!;
    const step: ChainPlanStep = { ally: 'mio', source: { kind: 'link', linkId: 'tricolor', cards: tri.cards } };
    expect(chainPlanError(s, [], step)).toBeNull();
    expect(chainMoveOf(s, step)?.name).toBe('三原色');
    const r = runChainRound(s, [step]);
    expect(r.state.discard).toEqual(expect.arrayContaining([C.backlight.id, C.blueHour.id, C.strobe.id]));
    const s3 = make([dummy()], [C.swing.id, C.snow.id, C.paperGun.id]);
    const three = availableLinks(s3, []).find((x) => x.link.id === 'threeTimes')!;
    const r3 = runChainRound(s3, [{ ally: 'hero', source: { kind: 'link', linkId: 'threeTimes', cards: three.cards } }]);
    expect(events(r3).find((e) => e.type === 'link')).toMatchObject({ uids: ['hero', 'akari', 'mio'] });
    // 仲間がいなければ、その仲間の専用の札のレシピは使えない
    const solo = make([dummy()], [C.swing.id, C.bigShot.id, C.plus30.id], { allies: BASE.allies.filter((a) => a.id !== 'hero') });
    expect(availableLinks(solo, []).some((x) => x.link.id === 'homerun')).toBe(false);
    expect(CHAIN17_COMBOS.every((c) => c.move.type === 'link')).toBe(true);
  });

  it('全員ダウンしても、シャッターにはならない', () => {
    const s = make([dummy({ weak: ['physical'] })]);
    const r = runChainRound(s, [mv('hero', 'basic', s.enemies[0].uid)]);
    expect(events(r).some((e) => e.type === 'down')).toBe(true);
    expect(r.state.shutter).toBe(false);
  });

  it('山札：アタック9・サポート8・フィニッシュ3（3枚まで）と専用の札6枚。同じサポートは2枚まで', () => {
    for (const t of [...CHAIN_TRIALS, ...CHAIN_TRIALS_MULTI]) {
      const cards = t.deck.map((id) => t.cards[id]);
      const own = cards.filter((c) => c.owner);
      const rest = cards.filter((c) => !c.owner);
      expect([rest.filter((c) => c.type === 'attack').length, rest.filter((c) => c.effect.kind === 'addon').length, rest.filter((c) => c.type === 'finish').length]).toEqual([CHAIN17_DECK_PLAN.attack, CHAIN17_DECK_PLAN.support, CHAIN17_DECK_PLAN.finish]);
      expect(own.length).toBe(t.allies.length * CHAIN17_DECK_PLAN.specialPerAlly);
      const count: Record<string, number> = {};
      for (const c of rest.filter((x) => x.effect.kind === 'addon')) count[c.id] = (count[c.id] ?? 0) + 1;
      expect(Math.max(...Object.values(count))).toBeLessThanOrEqual(2);
      expect(t.noShutter && t.finishLast).toBe(true);
    }
  });

  it('考える方針は、でたらめな方針より早く勝つ', () => {
    const def = CHAIN_TRIALS[3];
    let smart = 0;
    let random = 0;
    for (let k = 0; k < 3; k++) {
      const x = autoChainBattle(def, CHAIN_RULES, 90 + k, 'smart');
      const y = autoChainBattle(def, CHAIN_RULES, 90 + k, 'random');
      expect(x.outcome).toBe('win');
      smart += x.rounds;
      random += y.outcome === 'win' ? y.rounds : 20;
    }
    expect(smart).toBeLessThan(random);
  });
});
