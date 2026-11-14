import { describe, expect, it } from 'vitest';
import { applyWeapons, chainAllyFromCharacter, chainBasicAttack, chainMoveOf, createArmory, createChainBattle, mergeBasic, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPassive, type ChainPlanStep, type ChainState } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS, HERO, WEAPON_DATA, WEAPON_STYLES } from '../../src/data';

// 段階196（段階G4a）：武器の仕組み（通常攻撃の形・新しい特性・型）

const BASE = CHAIN_TRIALS[0];
const foe = (over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id: 'foe', name: '的', hp: 9999, atk: 20, def: 10, weak: [], resist: [], pattern: [{ id: 'hit', name: 'たたく', at: 9, element: 'physical', power: 30 }], ...over });
function solo(moves: ChainMove[], passives: ChainPassive[] = [], over: Partial<ChainBattleDef> = {}, enemies: ChainEnemyDef[] = [foe()]): ChainState {
  const hero = BASE.allies.find((a) => a.id === 'hero')!;
  const def: ChainBattleDef = { ...BASE, allies: [{ ...hero, hp: 500, mp: 99, moves: [...hero.moves, ...moves], passives }], enemies, variants: undefined, ...over };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = [];
  return s;
}
const mv = (moveId: string, target?: string, addons: number[] = []): ChainPlanStep => ({ ally: 'hero', source: { kind: 'move', moveId }, target, addons });
const events = (r: { frames: { events: ChainEvent[] }[] }) => r.frames.flatMap((f) => f.events);
const dealt = (r: { frames: { events: ChainEvent[] }[] }) => events(r).filter((e): e is Extract<ChainEvent, { type: 'damage' }> => e.type === 'damage' && e.from === 'hero').reduce((a, e) => a + e.amount, 0);
const atk = (id: string, over: Partial<ChainMove> = {}): ChainMove => ({ id, name: id, type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40 }, text: '', ...over });

describe('通常攻撃の形（段階196）', () => {
  it('何もなければ今までどおり（重さ2・威力20・1回）', () => {
    expect(chainBasicAttack()).toMatchObject({ id: 'basic', weight: 2, effect: { kind: 'damage', element: 'physical', power: 20 } });
    expect(chainBasicAttack().effect).not.toHaveProperty('hits');
  });
  it('回数（3回まで）・押す・重さ・邪魔されなければ強い・一番効く属性・当てると守り', () => {
    expect(chainBasicAttack('ice', { hits: 5 }).effect).toMatchObject({ element: 'ice', hits: 3 });
    expect(chainBasicAttack('thunder', { push: 1, lighter: 1 })).toMatchObject({ weight: 1, effect: { push: 1 } });
    expect(chainBasicAttack('physical', { fragile: 2 }).effect).toMatchObject({ power: 40, fragile: true });
    expect(chainBasicAttack('physical', { bestOf: ['fire', 'ice', 'thunder'] }).effect).toMatchObject({ bestOf: ['physical', 'fire', 'ice', 'thunder'] });
    expect(chainBasicAttack('ice', { guardAll: 0.2 }).text).toContain('−20%');
  });
  it('進化先の形は重ねる（大きい方・どちらかの印）', () => {
    expect(mergeBasic({ hits: 2, push: 1 }, { hits: 3, heavy: true })).toEqual({ hits: 3, push: 1, heavy: true });
    expect(mergeBasic(undefined, { partMult: 2 })).toEqual({ partMult: 2 });
  });
  it('武器の進化先と型の、通常攻撃の形と特性が、仲間に渡る', () => {
    const w = WEAPON_DATA.weapons.recordSword;
    const evo = { ...w.evolutions[0], basic: { hits: 2 }, traits: [{ kind: 'snapBoost' as const, rate: 0.1 }], styles: [WEAPON_STYLES.attach, WEAPON_STYLES.quick] };
    const data = { ...WEAPON_DATA, weapons: { ...WEAPON_DATA.weapons, recordSword: { ...w, evolutions: [evo, ...w.evolutions.slice(1)] } } };
    const armory = createArmory(data);
    armory.weapons.hero = { ...armory.weapons.hero, path: [{ id: evo.id, style: 0 }] };
    const [hero] = applyWeapons(data, armory, [HERO]);
    expect(hero.basic).toEqual({ hits: 2 });
    expect(hero.traits).toEqual([{ kind: 'snapBoost', rate: 0.1 }, { kind: 'effectBoost', rate: 0.15 }]);
    const ally = chainAllyFromCharacter(hero);
    expect(ally.moves[0].effect).toMatchObject({ hits: 2 });
    expect(ally.passives).toContainEqual({ kind: 'effectBoost', rate: 0.15 });
  });
});

describe('武器の特性（段階196）', () => {
  it('当てると味方の守り：当てた後、敵の攻撃が減る', () => {
    const plain = solo([atk('a')]);
    const guard = solo([atk('a', { effect: { kind: 'damage', element: 'physical', power: 40, guardAll: 0.5 } })]);
    const taken = (s: ChainState) => s.allies[0].hp - runChainRound(s, [mv('a', s.enemies[0].uid)]).state.allies[0].hp;
    expect(taken(guard)).toBeLessThan(taken(plain));
  });
  it('エフェクトの効き：添えた札の アタック+ が増える', () => {
    const card = 'c_plus';
    const make = (passives: ChainPassive[]) => {
      const s = solo([atk('a')], passives, { cards: { ...BASE.cards, [card]: { id: card, name: '+', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', add: 20 }, text: '' } } });
      s.hand = [card];
      return s;
    };
    const p = make([]);
    const b = make([{ kind: 'effectBoost', rate: 0.5 }]);
    expect(dealt(runChainRound(b, [mv('a', b.enemies[0].uid, [0])]))).toBeGreaterThan(dealt(runChainRound(p, [mv('a', p.enemies[0].uid, [0])])));
  });
  it('クライマックスの伸び・重さ1の行動・邪魔されなければ強い行動：その行動だけ強くなる', () => {
    const fin = atk('fin', { type: 'finish' });
    const light = atk('light', { weight: 1 });
    const frag = atk('frag', { effect: { kind: 'damage', element: 'physical', power: 40, fragile: true } });
    const plain = atk('plain');
    for (const [kind, m] of [['climaxBoost', fin], ['lightBoost', light], ['fragileBoost', frag]] as const) {
      const p = solo([m, plain]);
      const b = solo([m, plain], [{ kind, rate: 0.5 }]);
      expect(dealt(runChainRound(b, [mv(m.id, b.enemies[0].uid)])), kind).toBeGreaterThan(dealt(runChainRound(p, [mv(m.id, p.enemies[0].uid)])));
      expect(dealt(runChainRound(b, [mv('plain', b.enemies[0].uid)])), kind).toBe(dealt(runChainRound(p, [mv('plain', p.enemies[0].uid)])));
    }
  });
  it('型「早」：最初のラウンドだけ、通常攻撃の重さ −1', () => {
    const s = solo([], [{ kind: 'quickStart', count: 1 }]);
    expect(chainMoveOf(s, mv('basic'))?.weight).toBe(1);
    const next = runChainRound(s, []).state;
    expect(chainMoveOf(next, mv('basic'))?.weight).toBe(2);
    expect(chainMoveOf(solo([]), mv('basic'))?.weight).toBe(2);
  });
});
