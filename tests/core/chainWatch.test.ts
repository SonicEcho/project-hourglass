import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainCardCategory, chainTipTriggers, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep } from '../../src/core';
import { AKARI, CHAIN_RULES, CHAIN_TRIALS, HERO } from '../../src/data';

// 段階179：3-1 のぬしの思い出の再演「腕時計を守る」
const BASE = CHAIN_TRIALS[0];
const WIND: ChainMove = { id: 'wind', name: 'ねじを巻く', type: 'support', weight: 2, target: 'allies', effect: { kind: 'heal', power: 0, watch: 30 }, text: '' };
const HURRY = (at: number) => ({ id: 'hurry', name: '急かす', at, element: 'physical' as const, power: 40, watch: true });
const lord = (hp = 9999): ChainEnemyDef => ({ id: 'lord', name: 'ぬし', hp, atk: 5, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 0, with: [HURRY(5), HURRY(7)] }] });
const make = (over: Partial<ChainBattleDef> = {}) => {
  const def: ChainBattleDef = { ...BASE, allies: BASE.allies.map((a) => ({ ...a, moves: [...a.moves, WIND] })), enemies: [lord()], variants: undefined, watch: { hp: 100, ease: 1 }, ...over };
  return createChainBattle(def, CHAIN_RULES, 3);
};
const mv = (ally: string, moveId: string, target?: string): ChainPlanStep => ({ ally, source: { kind: 'move', moveId }, ...(target ? { target } : {}), addons: [] });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('腕時計を守る（段階179）', () => {
  it('急かすは腕時計をねらい、動くと威力の分だけ腕時計の HP が減る。0 で負け', () => {
    const s = make();
    expect(s.watch).toBe(100);
    expect(s.intents.filter((i) => i.move.watch).every((i) => i.target === 'watch')).toBe(true);
    const r1 = runChainRound(s, []);
    expect(events(r1).filter((e) => e.type === 'watchHit').map((e) => (e as Extract<ChainEvent, { type: 'watchHit' }>).left)).toEqual([60, 20]);
    expect(events(r1).filter((e) => e.type === 'damage' && e.from === s.enemies[0].uid).length).toBe(1);
    const r2 = runChainRound(r1.state, []);
    expect(r2.state.outcome).toBe('lose');
    expect(r2.state.finish).toBe('watch');
  });
  it('ねじを巻くと HP が戻り（最大まで）、次のラウンドの最初の急かすが仲間へそれる', () => {
    const s = make();
    const hero = s.allies[0].uid;
    const r1 = runChainRound(s, [mv(hero, 'wind')]);
    // 巻いた時（時刻2）はまだ満タンなので戻らない。その後の急かす2つで 20
    expect(events(r1).find((e) => e.type === 'watchWind')).toMatchObject({ uid: hero, amount: 0, left: 100 });
    expect(r1.state.watch).toBe(20);
    const next = r1.state.intents.filter((i) => i.move.watch);
    expect(next[0].eased).toBe(true);
    expect(next[0].target).not.toBe('watch');
    expect(next[1].target).toBe('watch');
    const r2 = runChainRound(r1.state, [mv(hero, 'wind')]);
    expect(events(r2).find((e) => e.type === 'watchWind')).toMatchObject({ amount: 30, left: 50 });
    // それた急かすは仲間に当たり、2つ目だけが腕時計に
    expect(r2.state.watch).toBe(10);
    expect(r2.state.outcome).toBe('ongoing');
  });
  it('何人巻いても、そらすのは ease の数まで', () => {
    const s = make();
    const [a, b] = s.allies.map((x) => x.uid);
    const r = runChainRound(s, [mv(a, 'wind'), mv(b, 'wind')]);
    expect(r.state.intents.filter((i) => i.eased)).toHaveLength(1);
  });
  it('急かすより先にぬしを倒せば、腕時計は減らない', () => {
    const s = make({ enemies: [lord(1)] });
    const r = runChainRound(s, [mv(s.allies[0].uid, 'basic', s.enemies[0].uid)]);
    expect(r.state.outcome).toBe('win');
    expect(r.state.watch).toBe(100);
  });
  it('腕時計のない戦闘では、ねじを巻いても何も起きない。ねじを巻くはサポートの分類', () => {
    const s = make({ watch: undefined });
    const r = runChainRound(s, [mv(s.allies[0].uid, 'wind')]);
    expect(events(r).some((e) => e.type === 'fizzle')).toBe(true);
    expect(chainCardCategory(WIND)).toBe('support');
  });
  it('本番の戦闘：全員に足す技と、腕時計の説明', () => {
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: [], chainEnemies: [lord()], deck: [], cards: {}, watch: { hp: 100, ease: 1 }, allyMoves: [WIND] });
    expect(def.allies.every((a) => a.moves.some((m) => m.id === 'wind'))).toBe(true);
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_watch');
  });
});
