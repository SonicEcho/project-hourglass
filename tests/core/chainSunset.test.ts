import { describe, expect, it } from 'vitest';
import { createChainBattle, runChainRound, type ChainBattleDef, type ChainEnemyDef, type ChainEvent, type ChainMove, type ChainPlanStep, type ChainState } from '../../src/core';
import { CHAIN_RULES, CHAIN_TRIALS } from '../../src/data';

// 段階169：1-2 のぬしの思い出の再演「日が沈む前に」（夕日・息を合わせる・二人乗り）
const BASE = CHAIN_TRIALS[0];
const foe = (at: number): ChainEnemyDef => ({ id: 'dummy', name: '的', hp: 9999, atk: 0, def: 10, weak: [], resist: [], pattern: [{ id: 'idle', name: 'ぼんやり', at, element: 'physical', power: 0 }] });
const TWO: ChainMove = { id: 'two', name: '二人乗り', type: 'finish', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, syncMult: 2 }, text: '' };

function make(at: number, over: Partial<ChainBattleDef> = {}): ChainState {
  const def: ChainBattleDef = { ...BASE, enemies: [foe(at)], variants: undefined, cards: { ...BASE.cards, two: TWO }, ...over };
  const s = createChainBattle(def, CHAIN_RULES, 7);
  s.hand = ['two'];
  return s;
}
const mv = (ally: string, target: string): ChainPlanStep => ({ ally, source: { kind: 'move', moveId: 'basic' }, target, addons: [] });
const events = (r: { frames: { events: ChainEvent[] }[] }): ChainEvent[] => r.frames.flatMap((f) => f.events);

describe('日が沈む前に（段階169）', () => {
  it('息を合わせる：2人の行動が続けて終わり、その間に敵が動かなかった時だけ', () => {
    const s = make(9);
    const t = s.enemies[0].uid;
    const r = runChainRound(s, [mv('hero', t), mv('akari', t)]);
    expect(events(r).find((e) => e.type === 'sync')).toMatchObject({ uids: ['hero', 'akari'] });
    // 敵が時刻3に動く：ハルト（時刻2）とあかり（時刻4）の間に挟まる
    const u = make(3);
    expect(events(runChainRound(u, [mv('hero', u.enemies[0].uid), mv('akari', u.enemies[0].uid)])).some((e) => e.type === 'sync')).toBe(false);
    // 1人だけでは合わせられない
    expect(events(runChainRound(s, [mv('hero', t)])).some((e) => e.type === 'sync')).toBe(false);
  });

  it('夕日：ラウンドの終わりに1傾き、息を合わせると持ちこたえる。0で負け', () => {
    let s = make(3, { sunset: { rounds: 2 } });
    expect(s.sunset).toBe(2);
    const t = s.enemies[0].uid;
    const synced = runChainRound(make(9, { sunset: { rounds: 2 } }), [mv('hero', t), mv('akari', t)]);
    expect(synced.state.sunset).toBe(2);
    s = runChainRound(s, [mv('hero', t)]).state;
    expect(s.sunset).toBe(1);
    expect(s.outcome).toBe('ongoing');
    const r = runChainRound(s, [mv('hero', t)]);
    expect(r.state.sunset).toBe(0);
    expect(r.state.outcome).toBe('lose');
    expect(r.state.finish).toBe('sunset');
    expect(events(r).find((e) => e.type === 'sunset')).toMatchObject({ left: 0, synced: false });
  });

  it('二人乗り（スナップ）：息を合わせていれば威力2倍', () => {
    const dmg = (at: number) => {
      const s = make(at);
      const t = s.enemies[0].uid;
      const r = runChainRound(s, [mv('hero', t), { ally: 'akari', source: { kind: 'card', index: 0 }, target: t, addons: [] }]);
      return events(r).find((e) => e.type === 'damage' && e.from === 'akari') as Extract<ChainEvent, { type: 'damage' }>;
    };
    expect(dmg(9).amount).toBe(dmg(3).amount * 2);
  });
});

describe('息が合う見込み（段階169）', () => {
  it('並べた予定を動かして見て、息が合うかを返す', async () => {
    const { chainPlanSyncs } = await import('../../src/core');
    const s = make(9);
    const t = s.enemies[0].uid;
    expect(chainPlanSyncs(s, [mv('hero', t), mv('akari', t)])).toBe(true);
    expect(chainPlanSyncs(s, [mv('hero', t)])).toBe(false);
    const u = make(3);
    expect(chainPlanSyncs(u, [mv('hero', u.enemies[0].uid), mv('akari', u.enemies[0].uid)])).toBe(false);
  });
});
