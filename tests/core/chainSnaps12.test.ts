import { describe, expect, it } from 'vitest';
import { createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep, type ChainState } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';

// 段階168：1-2 の敵のスナップの仕組み（ブリキの盾・ビー玉はじき・めんこ吹雪・非常ベル）
const BASE = CHAIN_TRIALS[0];
const dummy = (over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ id: 'dummy', name: '的', hp: 9999, atk: 0, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 0 }], ...over });
const CARDS: Record<string, ChainMove> = {
  shieldUp: { id: 'shieldUp', name: 'ブリキの盾', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', cover: 0.5 }, text: '' },
  marble: { id: 'marble', name: 'ビー玉はじき', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, haste: 1 }, text: '' },
  menko: { id: 'menko', name: 'めんこ吹雪', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, scatter: { power: 15, hits: 2 } }, text: '' },
  bell: { id: 'bell', name: '非常ベル', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', blast: 20 }, text: '' },
};

function make(enemies: ChainEnemyDef[], hand: string[]): ChainState {
  const def: ChainBattleDef = { ...BASE, enemies, variants: undefined, cards: { ...BASE.cards, ...CARDS } };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = [...hand];
  return s;
}
const mv = (ally: string, target?: string, addons: number[] = []): ChainPlanStep => ({ ally, source: { kind: 'move', moveId: 'basic' }, target, addons });
const card = (ally: string, index: number, target?: string, addons: number[] = []): ChainPlanStep => ({ ally, source: { kind: 'card', index }, target, addons });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('1-2 の敵のスナップの仕組み（段階168）', () => {
  it('ブリキの盾：構えた後は、ほかの仲間への単体攻撃を代わりに受け、ダメージは半分', () => {
    const hit: ChainEnemyDef = dummy({ atk: 10, pattern: [{ id: 'jab', name: 'つつく', at: 8, element: 'physical', power: 40 }] });
    const s = make([hit], ['shieldUp']);
    s.intents = s.intents.map((i) => ({ ...i, target: 'akari' }));
    const heroDef = s.allies.find((a) => a.uid === 'hero')!.def;
    const r = runChainRound(s, [mv('hero', s.enemies[0].uid, [0])]);
    const ev = events(r);
    expect(ev.some((e) => e.type === 'allyGuard' && e.uid === 'hero')).toBe(true);
    expect(ev.find((e) => e.type === 'allyCover')).toMatchObject({ uid: 'hero', for: 'akari' });
    const taken = ev.filter((e) => e.type === 'damage' && e.from === s.enemies[0].uid);
    expect(taken).toEqual([expect.objectContaining({ to: 'hero', amount: Math.max(1, Math.floor(((40 * 10) / heroDef) * 0.5)) })]);
    // ラウンドの終わりで構えは解ける
    expect(r.state.allies.every((a) => !a.covering)).toBe(true);
    // 構えていなければ、あかりが受ける
    const plain = make([hit], []);
    plain.intents = plain.intents.map((i) => ({ ...i, target: 'akari' }));
    expect(events(runChainRound(plain, [mv('hero', plain.enemies[0].uid)])).find((e) => e.type === 'damage' && e.from === plain.enemies[0].uid)).toMatchObject({ to: 'akari' });
  });

  it('ビー玉はじき：当てると、この後に動く仲間の時刻が1マス早まる', () => {
    const s = make([dummy()], ['marble']);
    const t = s.enemies[0].uid;
    const plain = runChainRound(s, [mv('hero', t), mv('akari', t)]);
    const fast = runChainRound(s, [card('hero', 0, t), mv('akari', t)]);
    const akariAt = (r: typeof plain) => r.frames.find((f) => f.uid === 'akari')!.at;
    // 通常攻撃（重さ2）の後のあかりは 4、ビー玉はじき（重さ1）の後は 1+2-1=2
    expect(akariAt(plain)).toBe(4);
    expect(akariAt(fast)).toBe(2);
    expect(events(fast).some((e) => e.type === 'haste')).toBe(true);
  });

  it('めんこ吹雪：当たると、欠片がほかの敵へ2回散る（ほかの敵がいなければ散らない）', () => {
    const s = make([dummy(), dummy({ id: 'd2' })], ['menko']);
    const [a, b] = s.enemies.map((e) => e.uid);
    const ev = events(runChainRound(s, [card('hero', 0, a)]));
    const onB = ev.filter((e) => e.type === 'damage' && e.to === b);
    expect(onB).toHaveLength(2);
    expect(ev.some((e) => e.type === 'scatter')).toBe(true);
    const one = make([dummy()], ['menko']);
    expect(events(runChainRound(one, [card('hero', 0, one.enemies[0].uid)])).some((e) => e.type === 'scatter')).toBe(false);
  });

  it('非常ベル：添えた攻撃で倒すと、ほかの敵全体に当たる。倒せなければ鳴らない', () => {
    const s = make([dummy({ hp: 5 }), dummy({ id: 'd2' }), dummy({ id: 'd3' })], ['bell']);
    const [a, b, c] = s.enemies.map((e) => e.uid);
    const ev = events(runChainRound(s, [mv('hero', a, [0])]));
    expect(ev.find((e) => e.type === 'blast')).toMatchObject({ to: [b, c] });
    expect(ev.filter((e) => e.type === 'damage' && (e.to === b || e.to === c))).toHaveLength(2);
    const t = make([dummy(), dummy({ id: 'd2' })], ['bell']);
    expect(events(runChainRound(t, [mv('hero', t.enemies[0].uid, [0])])).some((e) => e.type === 'blast')).toBe(false);
  });
});

describe('2-1 の敵のスナップの仕組み（段階170）', () => {
  const ARMOR: ChainMove = { id: 'armor', name: '歯車の鎧', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', armor: 0.4 }, text: '' };
  const WALL: ChainMove = { id: 'wall', name: '珠の壁', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', wall: 2 }, text: '' };
  const hitter = (at: number[]): ChainEnemyDef => dummy({ atk: 10, pattern: [{ id: 'jab', name: 'つつく', at: at[0], at2: at[1], element: 'physical', power: 40 }] });
  const build = (enemy: ChainEnemyDef, hand: string[]): ChainState => {
    const def: ChainBattleDef = { ...BASE, enemies: [enemy], variants: undefined, cards: { ...BASE.cards, ...CARDS, armor: ARMOR, wall: WALL } };
    const s = createChainBattle(def, CHAIN_RULES, 7);
    s.hand = [...hand];
    s.intents = s.intents.map((i) => ({ ...i, target: 'hero' }));
    return s;
  };
  it('歯車の鎧：構えた後は、受けるダメージが4割減る。ラウンドの終わりで解ける', () => {
    const s = build(hitter([8, 9]), ['armor']);
    const def = s.allies.find((a) => a.uid === 'hero')!.def;
    const r = runChainRound(s, [mv('hero', s.enemies[0].uid, [0])]);
    const taken = events(r).filter((e): e is Extract<ChainEvent, { type: 'damage' }> => e.type === 'damage' && e.to === 'hero');
    expect(taken.map((e) => e.amount)).toEqual([Math.floor(((40 * 10) / def) * 0.6), Math.floor(((40 * 10) / def) * 0.6)]);
    expect(r.state.allies.every((a) => !a.armor)).toBe(true);
  });
  it('珠の壁：構えた後の攻撃を2回まで消す', () => {
    const s = build(hitter([8, 9]), ['wall']);
    const ev = events(runChainRound(s, [mv('hero', s.enemies[0].uid, [0])]));
    expect(ev.filter((e) => e.type === 'allyWall')).toHaveLength(2);
    expect(ev.some((e) => e.type === 'damage' && e.to === 'hero')).toBe(false);
  });
});

describe('2-2 の敵のスナップの仕組み（段階172）', () => {
  const RIPOSTE: ChainMove = { id: 'riposte', name: '振り子返し', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', riposte: 25 }, text: '' };
  it('振り子返し：構えた後に攻撃を受けると、やり返す。ラウンドの終わりで解ける', () => {
    const enemy = dummy({ atk: 10, pattern: [{ id: 'jab', name: 'つつく', at: 8, element: 'physical', power: 20 }] });
    const def: ChainBattleDef = { ...BASE, enemies: [enemy], variants: undefined, cards: { ...BASE.cards, ...CARDS, riposte: RIPOSTE } };
    const s = createChainBattle(def, CHAIN_RULES, 7);
    s.hand = ['riposte'];
    s.intents = s.intents.map((i) => ({ ...i, target: 'hero' }));
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [mv('hero', t, [0])]);
    const ev = events(r);
    expect(ev.find((e) => e.type === 'allyRiposte')).toMatchObject({ uid: 'hero', to: t });
    expect(ev.filter((e) => e.type === 'damage' && e.from === 'hero' && e.to === t)).toHaveLength(2);
    expect(r.state.allies.every((a) => !a.riposte)).toBe(true);
  });
});
