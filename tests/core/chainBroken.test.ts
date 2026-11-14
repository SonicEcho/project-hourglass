import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainPlanError, chainTipTriggers, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep, type ChainState } from '../../src/core';
import { AKARI, CHAIN_RULES, CHAIN_TRIALS, HERO } from '../../src/data';

// 段階190：4-2 のシャッターのぬし「時計を直す」
const BASE = CHAIN_TRIALS[0];
const BROKEN: ChainMove = { id: 'broken', name: '壊れた札', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 0 }, text: '' };
const FIRE: ChainMove = { id: 'fire', name: '火', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 10 }, text: '' };
const lord = (breaks = true): ChainEnemyDef => ({ id: 'lord', name: 'ぬし', hp: 99999, atk: 1, def: 10, weak: [], resist: [], pattern: [{ id: 'windIn', name: '巻きこみ', at: 1, element: 'physical', power: 1, breaksCard: breaks, with: [{ id: 'windIn2', name: '巻きこみ', at: 2, element: 'physical', power: 1, breaksCard: breaks }] }] });
const make = (): ChainState => {
  const def: ChainBattleDef = { ...BASE, enemies: [lord()], variants: undefined, cards: { ...BASE.cards, broken: BROKEN, fire: FIRE }, broken: { card: 'broken', fixer: BASE.allies[1].id } };
  return createChainBattle(def, CHAIN_RULES, 4);
};
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('時計を直す（段階190）', () => {
  it('巻きこみが当たると、まだ使っていない手札が1枚「壊れた札」に（1ラウンドに1枚まで）。壊れた札は並べられない', () => {
    const s = make();
    const n = s.hand.length;
    const r = runChainRound(s, []);
    expect(events(r).filter((e) => e.type === 'cardBreak')).toHaveLength(1);
    expect(r.state.hand.filter((c) => c === 'broken')).toHaveLength(1);
    expect(r.state.brokenQueue).toHaveLength(1);
    expect(r.state.hand.length).toBe(n);
    const k = r.state.hand.indexOf('broken');
    const step: ChainPlanStep = { ally: r.state.allies[0].uid, source: { kind: 'card', index: k }, addons: [] };
    expect(chainPlanError(r.state, [], step)).toContain('壊れた札');
  });
  it('火の攻撃をすると、壊れた札を1枚、元の札に直して、さらに1枚引く', () => {
    let s = runChainRound(make(), []).state;
    const orig = s.brokenQueue![0];
    s.hand.push('fire');
    const n = s.hand.length;
    const r = runChainRound(s, [{ ally: s.allies[0].uid, source: { kind: 'card', index: s.hand.indexOf('fire') }, target: s.enemies[0].uid, addons: [] }]);
    const rep = events(r).find((e) => e.type === 'cardRepair') as Extract<ChainEvent, { type: 'cardRepair' }>;
    expect(rep.card).toBe(orig);
    expect(r.state.brokenQueue!.length).toBeLessThanOrEqual(1);
    s = r.state;
    expect(s.hand.length).toBeGreaterThanOrEqual(n - 1);
  });
  it('早瀬（fixer）が技を使っても直る', () => {
    const s = runChainRound(make(), []).state;
    const r = runChainRound(s, [{ ally: s.allies[1].uid, source: { kind: 'move', moveId: 'basic' }, target: s.enemies[0].uid, addons: [] }]);
    expect(events(r).some((e) => e.type === 'cardRepair')).toBe(true);
  });
  it('本番の戦闘：壊れた札の説明', () => {
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: [], chainEnemies: [lord()], deck: [], cards: {}, broken: { card: 'broken', fixer: 'hayase' } });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_broken');
  });
});
