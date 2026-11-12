import { describe, expect, it } from 'vitest';
import { createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';

// 段階171：2-1 のぬしの思い出の再演「歯をそろえる」
const BASE = CHAIN_TRIALS[0];
const lord: ChainEnemyDef = { id: 'lord', name: 'ぬし', hp: 9999, atk: 10, def: 10, weak: [], resist: [], pattern: [{ id: 'hit', name: 'たたく', at: 9, element: 'physical', power: 30 }] };
const BURST: ChainMove = { id: 'burst', name: '連写', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 5, hits: 5 }, text: '' };
const FINISH: ChainMove = { id: 'finish', name: '歯車の仕上げ', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 10, hitsByRoundHits: true }, text: '' };
const make = (need: number) => {
  const def: ChainBattleDef = { ...BASE, enemies: [lord], variants: undefined, cards: { ...BASE.cards, burst: BURST, finish: FINISH }, teeth: { target: 'lord', need } };
  const s = createChainBattle(def, CHAIN_RULES, 3);
  s.hand = ['burst', 'finish'];
  return s;
};
const card = (ally: string, index: number, target: string): ChainPlanStep => ({ ally, source: { kind: 'card', index }, target, addons: [] });
const mv = (ally: string, target: string): ChainPlanStep => ({ ally, source: { kind: 'move', moveId: 'basic' }, target, addons: [] });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('歯をそろえる（段階171）', () => {
  it('1ラウンドに決まった回数当てると、ぬしがダウンして残りの予定が消える', () => {
    const s = make(6);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [card('hero', 0, t), mv('akari', t)]);
    const ev = events(r);
    expect(ev.filter((e) => e.type === 'teeth')).toHaveLength(1);
    expect(ev.some((e) => e.type === 'down' && e.uid === t)).toBe(true);
    // ダウンしたので、ぬしの「たたく」は動かない
    expect(ev.some((e) => e.type === 'damage' && e.from === t)).toBe(false);
  });
  it('足りなければそろわない。次のラウンドは数え直し', () => {
    const s = make(7);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [card('hero', 0, t), mv('akari', t)]);
    expect(events(r).some((e) => e.type === 'teeth')).toBe(false);
    expect(r.state.enemies[0].roundTaken).toBe(0);
  });
  it('歯車の仕上げ（スナップ）：このラウンドに当てた回数だけ当たる', () => {
    const s = make(99);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [card('hero', 0, t), card('akari', 1, t)]);
    expect(events(r).filter((e) => e.type === 'damage' && e.from === 'akari')).toHaveLength(5);
  });
});
