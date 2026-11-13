import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainPlanFilm, chainTipTriggers, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEnemyMove, type ChainEvent, type ChainPlanStep, type ChainState } from '../../src/core';
import { AKARI, CHAIN_RULES, CHAIN_TRIALS, HERO } from '../../src/data';

// 段階184：本気のカイ「フィルムを使い切らせる」と、露出・型
const BASE = CHAIN_TRIALS[0];
const SHOT = (at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => ({ id: 'shot', name: '撮る', at, element: 'physical', power: 1, film: 1, ...extra });
const kai = (over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id: 'kai', name: 'カイ', hp: 1000, atk: 1, def: 10, weak: [], resist: [], pattern: [{ ...SHOT(5), with: [SHOT(8)] }], ...over });
const make = (over: Partial<ChainBattleDef> = {}, k: ChainEnemyDef = kai()): ChainState => createChainBattle({ ...BASE, enemies: [k], variants: undefined, film: { total: 3 }, ...over }, CHAIN_RULES, 3);
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);
const hit = (s: ChainState): ChainPlanStep[] => [{ ally: s.allies[0].uid, source: { kind: 'move', moveId: 'basic' }, target: s.enemies[0].uid, addons: [] }];

describe('フィルムを使い切らせる（段階184）', () => {
  it('撮る行動が実際に動くと、フィルムが減る。0 でカイが引いて勝ち', () => {
    const s = make();
    expect(s.film).toBe(3);
    const r1 = runChainRound(s, []);
    expect(events(r1).filter((e) => e.type === 'filmUse').map((e) => (e as Extract<ChainEvent, { type: 'filmUse' }>).left)).toEqual([2, 1]);
    const r2 = runChainRound(r1.state, []);
    expect(r2.state.outcome).toBe('win');
    expect(r2.state.finish).toBe('film');
  });
  it('止めた行動（先に倒した）はフィルムが減らない。並べた見込み', () => {
    const s = make({}, kai({ hp: 1 }));
    expect(chainPlanFilm(s, hit(s))).toEqual({ used: 0, left: 3, erased: 0 });
    expect(chainPlanFilm(s, [])).toEqual({ used: 2, left: 1, erased: 0 });
  });
  it('露出：動くと、まだ使っていない手札を1枚、この戦闘から消す', () => {
    const s = make({}, kai({ pattern: [SHOT(5, { erasesCard: true })] }));
    const before = s.hand.length + s.deck.length + s.discard.length;
    const r = runChainRound(s, []);
    expect(events(r).filter((e) => e.type === 'cardErase')).toHaveLength(1);
    const after = r.state.hand.length + r.state.deck.length + r.state.discard.length;
    expect(after).toBe(before - 1);
  });
  it('型：HP の割合が決まった所を切ると、次のラウンドから予定の癖と性質が変わる', () => {
    const phases = [{ below: 0.9, name: '型2', pattern: [SHOT(3, { id: 'p2', name: '二の型' })], trait: 'interrupt' as const }, { below: 0.5, name: '型3', pattern: [SHOT(2, { id: 'p3', name: '三の型', at2: 6 })], trait: 'swift' as const }];
    const s = make({ film: { total: 99 } }, kai({ hp: 1000, phases, phaseName: '型1' }));
    s.enemies[0].hp = 850;
    s.enemies[0].roundHp = 850;
    const r = runChainRound(s, []);
    expect(events(r).find((e) => e.type === 'phaseShift')).toMatchObject({ name: '型2' });
    expect(r.state.enemies[0].trait).toBe('interrupt');
    expect(r.state.intents.map((i) => i.move.id)).toEqual(['p2']);
    r.state.enemies[0].hp = 300;
    const r2 = runChainRound(r.state, []);
    expect(events(r2).find((e) => e.type === 'phaseShift')).toMatchObject({ name: '型3' });
    expect(r2.state.enemies[0].trait).toBe('swift');
    expect(r2.state.intents.map((i) => i.at)).toEqual([2, 6]);
  });
  it('本番の戦闘：フィルムの説明', () => {
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: [], chainEnemies: [kai()], deck: [], cards: {}, film: { total: 12 } });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_film');
  });
});
