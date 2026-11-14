import { describe, expect, it } from 'vitest';
import { chainMoveMp, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPassive, type ChainPlanStep, type ChainState } from '../../src/core';
import { CHAIN_RULES, CHAIN_SKILLS, CHAIN_START_SKILLS, CHAIN_TRAIT_STARS, CHAIN_TRIALS } from '../../src/data';

// 段階193（段階G3a）：星図の技と特性の仕組み

const BASE = CHAIN_TRIALS[0];
const foe = (over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id: 'foe', name: '的', hp: 9999, atk: 20, def: 10, weak: [], resist: [], pattern: [{ id: 'hit', name: 'たたく', at: 9, element: 'physical', power: 30 }], ...over });

/** ハルト1人（技と特性を持たせる）と的1体 */
function solo(moves: ChainMove[], passives: ChainPassive[] = [], enemies: ChainEnemyDef[] = [foe()], over: Partial<ChainBattleDef> = {}): ChainState {
  const hero = BASE.allies.find((a) => a.id === 'hero')!;
  const def: ChainBattleDef = { ...BASE, allies: [{ ...hero, hp: 500, mp: 99, moves: [...hero.moves, ...moves], passives }], enemies, variants: undefined, ...over };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = [];
  return s;
}
const mv = (moveId: string, target?: string): ChainPlanStep => ({ ally: 'hero', source: { kind: 'move', moveId }, target, addons: [] });
const run = (s: ChainState, plan: ChainPlanStep[]) => runChainRound(s, plan);
const events = (r: { frames: { events: ChainEvent[] }[] }) => r.frames.flatMap((f) => f.events);
const taken = (r: ReturnType<typeof run>, before: ChainState) => before.allies[0].hp - r.state.allies[0].hp;
const dealt = (r: ReturnType<typeof run>) => events(r).filter((e): e is Extract<ChainEvent, { type: 'damage' }> => e.type === 'damage' && e.from === 'hero').reduce((a, e) => a + e.amount, 0);
const K = CHAIN_SKILLS;

describe('星図の技（段階193）', () => {
  it('4章までの技は、重さ1〜5・MP・説明がある。最初から持つ技は、どれも書いてある', () => {
    for (const m of Object.values(K)) {
      expect(m.weight, m.id).toBeGreaterThanOrEqual(1);
      expect(m.weight, m.id).toBeLessThanOrEqual(5);
      expect(m.mp, m.id).toBeGreaterThan(0);
      expect(m.text.length, m.id).toBeGreaterThan(0);
    }
    for (const list of Object.values(CHAIN_START_SKILLS)) for (const id of list) expect(K[id], id).toBeDefined();
  });

  it('守りの歌：このラウンドの終わりまで、味方全体の受けるダメージが減る', () => {
    const plain = solo([K.guardSong]);
    const a = run(plain, []);
    const b = run(solo([K.guardSong]), [mv('guardSong')]);
    expect(taken(b, plain)).toBeLessThan(taken(a, plain));
    expect(taken(b, plain)).toBeGreaterThan(0);
  });

  it('見切り：自分への攻撃を1回受け流し、物理でやり返す', () => {
    const s = solo([K.mikiri]);
    const r = run(s, [mv('mikiri')]);
    expect(taken(r, s)).toBe(0);
    expect(r.state.enemies[0].hp).toBeLessThan(s.enemies[0].hp);
  });

  it('時計合わせ・いたずら：ダメージなしで、敵の予定を後ろへずらす（ラウンドの外へ出れば起きない）', () => {
    const s = solo([K.clockSet]);
    const r = run(s, [mv('clockSet', s.enemies[0].uid)]);
    expect(dealt(r)).toBe(0);
    expect(events(r).some((e) => e.type === 'push' && e.out)).toBe(true);
    expect(taken(r, s)).toBe(0);
    // 早い予定は、3マス後ろへ
    const early = solo([K.prank], [], [foe({ pattern: [{ id: 'hit', name: 'たたく', at: 3, element: 'physical', power: 30 }] })]);
    const r2 = run(early, [mv('prank', early.enemies[0].uid)]);
    expect(events(r2).find((e) => e.type === 'push')).toMatchObject({ by: 3, moved: true, out: false });
    expect(taken(r2, early)).toBeGreaterThan(0);
  });

  it('振り子：敵全員の予定を後ろへずらす', () => {
    const s = solo([K.pendulum], [], [foe(), { ...foe(), id: 'foe2' }]);
    const r = run(s, [mv('pendulum')]);
    expect(events(r).filter((e) => e.type === 'push').length).toBe(2);
    expect(taken(r, s)).toBe(0);
  });

  it('二の太刀：このラウンドの自分の直前の攻撃を、威力半分でもう一度。攻撃していなければ不発', () => {
    const fizzle = solo([K.niNoTachi]);
    expect(events(run(fizzle, [mv('niNoTachi', fizzle.enemies[0].uid)])).some((e) => e.type === 'fizzle')).toBe(true);
    // 1人で2回動ける戦闘で、斬る → 二の太刀
    const s = solo([K.slash, K.niNoTachi], [], [foe()], { multiAct: true });
    const t = s.enemies[0].uid;
    const one = dealt(run(s, [mv('slash', t)]));
    const two = dealt(run(s, [mv('slash', t), mv('niNoTachi', t)]));
    expect(two - one).toBeGreaterThan(one * 0.3);
    expect(two - one).toBeLessThan(one * 0.7);
  });

  it('兜割り：部位には2倍。鎧通し：かたい敵にも減らされない', () => {
    const body = foe({ id: 'body' });
    const part = foe({ id: 'arm', part: { of: 'body' } });
    const s = solo([K.kabutoWari], [], [body, part]);
    const toBody = dealt(run(s, [mv('kabutoWari', s.enemies[0].uid)]));
    const toPart = dealt(run(s, [mv('kabutoWari', s.enemies[1].uid)]));
    expect(toPart).toBeGreaterThanOrEqual(toBody * 2 - 1);
    const hard = solo([K.yoroiDooshi, { ...K.yoroiDooshi, id: 'plain', effect: { kind: 'damage', element: 'physical', power: 44 } }], [], [foe({ trait: 'hard' })]);
    const t = hard.enemies[0].uid;
    expect(dealt(run(hard, [mv('yoroiDooshi', t)]))).toBeGreaterThan(dealt(run(hard, [mv('plain', t)])));
  });

  it('目覚めの歌：倒れた仲間を起こす', () => {
    const hero = BASE.allies.find((a) => a.id === 'hero')!;
    const akari = BASE.allies.find((a) => a.id !== 'hero')!;
    const def: ChainBattleDef = { ...BASE, allies: [{ ...hero, mp: 99, moves: [...hero.moves, K.wakeSong] }, akari], enemies: [foe({ atk: 0 })], variants: undefined };
    const s = createChainBattle(def, CHAIN_RULES, 7);
    s.hand = [];
    s.allies[1].hp = 0;
    const r = run(s, [mv('wakeSong')]);
    expect(r.state.allies[1].hp).toBe(Math.floor(r.state.allies[1].maxHp * 0.3));
  });
});

describe('星図の特性（段階193）', () => {
  it('スナップの威力：札の攻撃だけ強くなる（技は変わらない）', () => {
    const card = 'c_test';
    const make = (passives: ChainPassive[]) => {
      const s = solo([K.slash], passives, [foe()], { cards: { ...BASE.cards, [card]: { id: card, name: '札', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40 }, text: '' } } });
      s.hand = [card];
      return s;
    };
    const cardStep = (s: ChainState): ChainPlanStep => ({ ally: 'hero', source: { kind: 'card', index: 0 }, target: s.enemies[0].uid, addons: [] });
    const p = make([]);
    const b = make([CHAIN_TRAIT_STARS.snapBoost.passive]);
    expect(dealt(run(b, [cardStep(b)]))).toBeGreaterThan(dealt(run(p, [cardStep(p)])));
    expect(dealt(run(b, [mv('slash', b.enemies[0].uid)]))).toBe(dealt(run(p, [mv('slash', p.enemies[0].uid)])));
  });

  it('回復量：回復の技の回復量が増える', () => {
    const heal = (passives: ChainPassive[]) => {
      const s = solo([K.cure], passives, [foe({ atk: 0 })]);
      s.allies[0].hp = 100;
      return run(s, [mv('cure')]).state.allies[0].hp;
    };
    expect(heal([CHAIN_TRAIT_STARS.healBoost.passive])).toBeGreaterThan(heal([]));
  });

  it('押す距離：押す技と、予定をずらす技の距離が +1', () => {
    const s = solo([K.boltDash, K.prank], [CHAIN_TRAIT_STARS.pushPlus.passive]);
    const t = s.enemies[0].uid;
    expect(events(run(s, [mv('boltDash', t)])).find((e) => e.type === 'push')).toMatchObject({ by: 3 });
    expect(events(run(s, [mv('prank', t)])).find((e) => e.type === 'push')).toMatchObject({ by: 4 });
  });

  it('重い技の威力：重さ4以上の技だけ強くなる', () => {
    const plain = solo([K.kabutoWari, K.slash]);
    const boost = solo([K.kabutoWari, K.slash], [CHAIN_TRAIT_STARS.heavyBoost.passive]);
    const t = (s: ChainState) => s.enemies[0].uid;
    expect(dealt(run(boost, [mv('kabutoWari', t(boost))]))).toBeGreaterThan(dealt(run(plain, [mv('kabutoWari', t(plain))])));
    expect(dealt(run(boost, [mv('slash', t(boost))]))).toBe(dealt(run(plain, [mv('slash', t(plain))])));
  });

  it('時間の技の MP：時間の技だけ MP が減る（最低1）', () => {
    const s = solo([], [CHAIN_TRAIT_STARS.timeMpSave.passive]);
    expect(chainMoveMp(s.allies[0], K.clockSet)).toBe(Math.max(1, (K.clockSet.mp ?? 0) - 2));
    expect(chainMoveMp(s.allies[0], K.pendulum)).toBe((K.pendulum.mp ?? 0) - 2);
    expect(chainMoveMp(s.allies[0], K.yakiire)).toBe(K.yakiire.mp);
  });
});
