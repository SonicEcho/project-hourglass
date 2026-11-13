import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainCardCategory, chainMoveOf, chainTipTriggers, createChainBattle, planStarts, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep, type ChainState } from '../../src/core';
import { AKARI, CHAIN_RULES, CHAIN_TRIALS, HERO } from '../../src/data';

// 段階188：4-1 の川のぬし「夏の照り返し」
const BASE = CHAIN_TRIALS[0];
const SPLASH: ChainMove = { id: 'splash', name: '水をかける', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 0, cool: 1 }, text: '' };
const ICE: ChainMove = { id: 'ice', name: '氷', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 10 }, text: '' };
const lord = (moves: Partial<ChainEnemyDef['pattern'][number]>): ChainEnemyDef => ({ id: 'lord', name: 'ぬし', hp: 99999, atk: 1, def: 10, weak: [], resist: [], pattern: [{ id: 'glare', name: '照り返し', at: 3, all: true, element: 'thunder', power: 1, ...moves }] });
const make = (heats = 1, cools = 0): ChainState => {
  const def: ChainBattleDef = { ...BASE, allies: BASE.allies.map((a) => ({ ...a, moves: [...a.moves, SPLASH, ICE] })), enemies: [lord({ heats, cools })], variants: undefined, heat: { max: 3 } };
  return createChainBattle(def, CHAIN_RULES, 2);
};
const mv = (s: ChainState, i: number, moveId: string): ChainPlanStep => ({ ally: s.allies[i].uid, source: { kind: 'move', moveId }, target: s.enemies[0].uid, addons: [] });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('夏の照り返し（段階188）', () => {
  it('照り返しが当たると暑さ+1（上限 3）。暑い仲間の行動は暑さの分だけ重い', () => {
    let s = make();
    const base = chainMoveOf(s, mv(s, 0, 'basic'))!.weight;
    for (let k = 0; k < 4; k++) s = runChainRound(s, []).state;
    expect(s.allies.every((a) => a.heat === 3)).toBe(true);
    expect(chainMoveOf(s, mv(s, 0, 'basic'))!.weight).toBe(base + 3);
    expect(planStarts(s, [mv(s, 0, 'basic'), mv(s, 1, 'basic')])[1]).toBe(base + 3);
  });
  it('水しぶき（cools）は暑さを下げる', () => {
    let s = make(1);
    s = runChainRound(s, []).state;
    s = runChainRound(s, []).state;
    const cooled = createChainBattle({ ...s.def, enemies: [lord({ heats: 0, cools: 1 })] }, CHAIN_RULES, 2);
    cooled.allies.forEach((a) => (a.heat = 2));
    const r = runChainRound(cooled, []);
    expect(r.state.allies.every((a) => a.heat === 1)).toBe(true);
    expect(events(r).some((e) => e.type === 'allyHeat' && e.by === -1)).toBe(true);
  });
  it('氷の攻撃をした仲間は暑さが0。水をかけると仲間全員が1下がる。水をかけるはエフェクト', () => {
    const s = make(0);
    s.allies.forEach((a) => (a.heat = 2));
    const r = runChainRound(s, [mv(s, 0, 'ice'), mv(s, 1, 'splash')]);
    expect(r.state.allies[0].heat).toBe(0);
    expect(r.state.allies[1].heat).toBe(1);
    expect(chainCardCategory(SPLASH)).toBe('support');
  });
  it('本番の戦闘：照り返しの説明', () => {
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: [], chainEnemies: [lord({ heats: 1 })], deck: [], cards: {}, heat: { max: 3 } });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_heat');
  });
});
