import { describe, expect, it } from 'vitest';
import { chainPlanClaps, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';

// 段階173：2-2 のぬしの思い出の再演「手拍子」
const BASE = CHAIN_TRIALS[0];
const lord: ChainEnemyDef = { id: 'lord', name: 'ぬし', hp: 9999, atk: 10, def: 10, weak: [], resist: [], pattern: [{ id: 'hit', name: 'たたく', at: 9, element: 'physical', power: 30 }] };
const ONE: ChainMove = { id: 'one', name: '速写', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20 }, text: '' };
const BEAT: ChainMove = { id: 'beat', name: 'ジャストビート', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, beatMult: 2 }, text: '' };
const make = (need: number) => {
  const def: ChainBattleDef = { ...BASE, enemies: [lord], variants: undefined, cards: { ...BASE.cards, one: ONE, beat: BEAT }, clap: { beats: [2, 4, 6, 8], need, target: 'lord', heal: 0.2 } };
  const s = createChainBattle(def, CHAIN_RULES, 3);
  s.hand = ['one', 'beat'];
  return s;
};
const mv = (ally: string, target: string): ChainPlanStep => ({ ally, source: { kind: 'move', moveId: 'basic' }, target, addons: [] });
const card = (ally: string, index: number, target: string): ChainPlanStep => ({ ally, source: { kind: 'card', index }, target, addons: [] });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('手拍子（段階173）', () => {
  it('拍でちょうど終わった行動だけ、手拍子が増える（ラウンドをまたいで貯まる）', () => {
    const s = make(9);
    const t = s.enemies[0].uid;
    // 通常攻撃（重さ2）→ 時刻2・4 で終わる：2つ。速写（重さ1）→ 時刻1：増えない
    const r = runChainRound(s, [mv('hero', t), mv('akari', t)]);
    expect(events(r).filter((e) => e.type === 'clap')).toHaveLength(2);
    expect(r.state.claps).toBe(2);
    expect(chainPlanClaps(s, [card('hero', 0, t), mv('akari', t)])).toBe(0);
  });
  it('貯まると客席が歌う：ぬしがダウンして予定が止まり、仲間が回復し、手拍子は0から', () => {
    const s = make(2);
    const t = s.enemies[0].uid;
    s.allies.forEach((a) => (a.hp = Math.floor(a.maxHp / 2)));
    const r = runChainRound(s, [mv('hero', t), mv('akari', t)]);
    const ev = events(r);
    expect(ev.find((e) => e.type === 'chorus')).toMatchObject({ uid: t });
    expect(ev.some((e) => e.type === 'down' && e.uid === t)).toBe(true);
    expect(ev.some((e) => e.type === 'damage' && e.from === t)).toBe(false);
    expect(ev.filter((e) => e.type === 'heal').length).toBeGreaterThan(0);
    expect(r.state.claps).toBe(0);
  });
  it('ジャストビート（スナップ）：拍で終わると威力2倍', () => {
    const s = make(99);
    const t = s.enemies[0].uid;
    const dmg = (plan: ChainPlanStep[]) => events(runChainRound(s, plan)).find((e) => e.type === 'damage' && e.from === 'hero') as Extract<ChainEvent, { type: 'damage' }>;
    // ジャストビート（重さ2）を最初に → 時刻2（拍）。速写の後 → 時刻3（拍でない）
    const onBeat = dmg([card('hero', 1, t)]).amount;
    const r = runChainRound(s, [card('akari', 0, t), card('hero', 1, t)]);
    const off = events(r).find((e) => e.type === 'damage' && e.from === 'hero') as Extract<ChainEvent, { type: 'damage' }>;
    expect(onBeat).toBe(off.amount * 2);
  });
});
