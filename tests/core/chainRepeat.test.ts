import { describe, expect, it } from 'vitest';
import { buildMainChainBattle, chainPlanRepeat, chainTipTriggers, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainPlanStep, type ChainState } from '../../src/core';
import { AKARI, CHAIN_RULES, CHAIN_TRIALS, HERO } from '../../src/data';

// 段階182：祭りの夜のやぐらのぬし「くり返しを越える」
const BASE = CHAIN_TRIALS[0];
const lord = (hp = 1000): ChainEnemyDef => ({ id: 'lord', name: 'ぬし', hp, atk: 1, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 1 }] });
const make = (rate: number, need = 2, hp = 1000): ChainState => {
  const def: ChainBattleDef = { ...BASE, enemies: [lord(hp)], variants: undefined, repeat: { target: 'lord', rate, need } };
  return createChainBattle(def, CHAIN_RULES, 3);
};
const basic = (s: ChainState): ChainPlanStep[] => s.allies.filter((a) => a.hp > 0).map((a) => ({ ally: a.uid, source: { kind: 'move', moveId: 'basic' }, target: s.enemies[0].uid, addons: [] }));
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('くり返しを越える（段階182）', () => {
  it('受けたダメージが足りないラウンドは、終わりにラウンドの始めの HP に戻る', () => {
    const s = make(0.9);
    const r = runChainRound(s, basic(s));
    const e = events(r).find((x) => x.type === 'repeatNight') as Extract<ChainEvent, { type: 'repeatNight' }>;
    expect(e.dealt).toBeGreaterThan(0);
    expect(e.need).toBe(900);
    expect(r.state.enemies[0].hp).toBe(1000);
    expect(r.state.fireworks).toBe(0);
  });
  it('越えると戻らず、花火が1つ上がる。need 上がると、もう戻さない', () => {
    let s = make(0.01, 2);
    const r1 = runChainRound(s, basic(s));
    expect(events(r1).find((x) => x.type === 'firework')).toMatchObject({ total: 1 });
    expect(r1.state.enemies[0].hp).toBeLessThan(1000);
    s = runChainRound(r1.state, basic(r1.state)).state;
    expect(s.fireworks).toBe(2);
    // 3ラウンド目：もう「くり返し」も「花火」も起きない（少しでも削れたまま）
    const before = s.enemies[0].hp;
    const r3 = runChainRound(s, [basic(s)[0]]);
    expect(events(r3).some((x) => x.type === 'repeatNight' || x.type === 'firework')).toBe(false);
    expect(r3.state.enemies[0].hp).toBeLessThan(before);
  });
  it('並べた見込み：当てる量・要る量・越えるか', () => {
    const s = make(0.9);
    const look = chainPlanRepeat(s, basic(s));
    expect(look.need).toBe(900);
    expect(look.dealt).toBeGreaterThan(0);
    expect(look.over).toBe(false);
    expect(chainPlanRepeat(make(0.01), basic(make(0.01))).over).toBe(true);
  });
  it('ラウンドの中で倒せば勝ち（戻さない）', () => {
    const s = make(0.9, 3, 1);
    expect(runChainRound(s, basic(s)).state.outcome).toBe('win');
  });
  it('本番の戦闘：くり返しの説明', () => {
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: [], chainEnemies: [lord()], deck: [], cards: {}, repeat: { target: 'lord', rate: 0.3, need: 3 } });
    expect(chainTipTriggers(createChainBattle(def, CHAIN_RULES, 1))).toContain('chain_repeat');
  });
});
