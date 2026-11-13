import { describe, expect, it } from 'vitest';
import { chainPlanPitch, createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';

// 段階175：2-3 のぬしの思い出の再演「打ち返す」
const BASE = CHAIN_TRIALS[0];
const PITCH = { id: 'pitch', name: '投球', at: 2, element: 'physical' as const, power: 10, pitch: true };
const lord: ChainEnemyDef = { id: 'lord', name: 'ぬし', hp: 9999, atk: 5, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at: 9, element: 'physical', power: 0, with: [PITCH] }] };
const MEET: ChainMove = { id: 'meet', name: 'ジャストミート', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, parry: 2 }, text: '' };
const make = (over: Partial<ChainBattleDef> = {}) => {
  const def: ChainBattleDef = { ...BASE, enemies: [lord], variants: undefined, cards: { ...BASE.cards, meet: MEET }, pitch: { out: 2, mult: 2 }, ...over };
  const s = createChainBattle(def, CHAIN_RULES, 3);
  s.hand = ['meet'];
  return s;
};
const mv = (ally: string, target: string): ChainPlanStep => ({ ally, source: { kind: 'move', moveId: 'basic' }, target, addons: [] });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);
const dmgOf = (r: { frames: { events: ChainEvent[] }[] }, from: string) => (events(r).find((e) => e.type === 'damage' && e.from === from) as Extract<ChainEvent, { type: 'damage' }>).amount;

describe('打ち返す（段階175）', () => {
  it('投球と同じ時刻に終わる攻撃は打ち返す：投球が消え、威力が2倍', () => {
    const s = make();
    const t = s.enemies[0].uid;
    // 通常攻撃（重さ2）は時刻2で終わる＝投球（時刻2）を打ち返す
    const r = runChainRound(s, [mv('hero', t)]);
    expect(events(r).find((e) => e.type === 'hitBack')).toMatchObject({ uid: t, name: '投球' });
    expect(events(r).some((e) => e.type === 'strike')).toBe(false);
    const plain = runChainRound(make({ pitch: undefined }), [mv('hero', t)]);
    expect(dmgOf(r, 'hero')).toBe(dmgOf(plain, 'hero') * 2);
    expect(chainPlanPitch(s, [mv('hero', t)])).toEqual({ hits: 1, strikes: 0 });
  });
  it('打ち返せなかった投球はストライク。決まった数で三振（負け）', () => {
    let s = make();
    const t = s.enemies[0].uid;
    void t;
    // 何も並べない → 投球（時刻2）は打ち返せない
    const r1 = runChainRound(s, []);
    expect(events(r1).find((e) => e.type === 'strike')).toMatchObject({ total: 1 });
    s = r1.state;
    const r2 = runChainRound(s, []);
    expect(r2.state.outcome).toBe('lose');
    expect(r2.state.finish).toBe('strikeout');
  });
  it('ジャストミート（スナップ）：決まりが無くても、同じ時刻の敵の行動を消して2倍', () => {
    const quiet: ChainEnemyDef = { ...lord, pattern: [{ id: 'hit', name: 'たたく', at: 2, element: 'physical', power: 30 }] };
    const s = make({ pitch: undefined, enemies: [quiet] });
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [{ ally: 'hero', source: { kind: 'card', index: 0 }, target: t, addons: [] }]);
    expect(events(r).find((e) => e.type === 'hitBack')).toMatchObject({ name: 'たたく' });
    expect(events(r).some((e) => e.type === 'damage' && e.from === t)).toBe(false);
  });
});

describe('カイの切り取り（段階176）', () => {
  const kai: ChainEnemyDef = { id: 'kai', name: 'カイ', hp: 9999, atk: 5, def: 10, weak: [], resist: [], pattern: [{ id: 'frameCut', name: '切り取り', at: 3, element: 'physical', power: 10, cutsFrame: true }] };
  const build = () => {
    const def: ChainBattleDef = { ...BASE, enemies: [kai], variants: undefined, cards: { ...BASE.cards, meet: MEET } };
    const s = createChainBattle(def, CHAIN_RULES, 3);
    s.intents = s.intents.map((i) => ({ ...i, target: 'akari' }));
    return s;
  };
  it('ねらった仲間の、まだ終わっていない行動を抜き取る（札は手札に戻る）。先に終わった行動は抜かれない', () => {
    const s = build();
    s.hand = ['meet'];
    const t = s.enemies[0].uid;
    // ハルト（時刻2）→ あかり（ジャストミートの札・時刻4）：あかりは時刻3の切り取りで抜かれる
    const r = runChainRound(s, [mv('hero', t), { ally: 'akari', source: { kind: 'card', index: 0 }, target: t, addons: [] }]);
    const ev = events(r);
    expect(ev.find((e) => e.type === 'frameCut')).toMatchObject({ to: 'akari', name: 'ジャストミート' });
    expect(ev.some((e) => e.type === 'damage' && e.from === 'akari')).toBe(false);
    expect(r.state.hand).toContain('meet');
    // あかりが先（時刻2）なら、抜かれない
    const s2 = build();
    const r2 = runChainRound(s2, [mv('akari', t), mv('hero', t)]);
    expect(events(r2).some((e) => e.type === 'frameCut')).toBe(false);
  });
});
