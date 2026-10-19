import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/core';
import { getBattleResult } from '../../src/core';
import { DROP_RATES, GOLDFISH_BOWL_LORD } from '../../src/data';
import { ally, attackOn, battle, enemy, eventsOf, execute, planAll } from './helpers';

// 敵の落とし物（段階27b）
const table = { common: 'goldfishScale', uncommon: 'goldfishFin', rare: 'natsuTail' };

/** HP1 の敵1体を、強いハルトが倒す（seed で落とし物の乱数が変わる） */
function killOne(seed: number, offBalance = false): BattleState {
  const s = battle({ allies: [ally('hero', { atk: 999, spd: 50 })], enemies: [enemy('a', { hp: 5 }, { dropTable: table })], seed });
  if (offBalance) s.enemies[0].standUpGuard = true;
  return execute(planAll(s, { hero: attackOn('enemy0') }));
}

describe('敵の落とし物（段階27b）', () => {
  it('倒すと、表から1つ落とす（落とさないこともある）。同じシードなら同じものになる', () => {
    // 段階74：何も落とさないこともあるので、落とすシードを選ぶ
    let seed = 1;
    while (eventsOf(killOne(seed), 'drop').length === 0) seed++;
    const s = killOne(seed);
    const drops = eventsOf(s, 'drop');
    expect(drops).toHaveLength(1);
    expect(Object.values(table)).toContain(drops[0].itemId);
    expect(getBattleResult(s).drops).toEqual([drops[0].itemId]);
    expect(eventsOf(killOne(seed), 'drop')).toEqual(drops);
  });

  it('確率はおよそ いつも25%・珍しい20%・レア5%・なし50%（段階74）。体勢が崩れた敵を倒すと、落としやすく、珍しい素材とレアが出やすい', () => {
    const count = (off: boolean) => {
      const n = { common: 0, uncommon: 0, rare: 0, none: 0 } as Record<string, number>;
      for (let seed = 1; seed <= 2000; seed++) n[eventsOf(killOne(seed, off), 'drop')[0]?.kind ?? 'none']++;
      return n;
    };
    const normal = count(false);
    const off = count(true);
    expect(normal.rare / 2000).toBeCloseTo(DROP_RATES.normal.rare, 1);
    expect(normal.uncommon / 2000).toBeCloseTo(DROP_RATES.normal.uncommon, 1);
    expect(normal.common / 2000).toBeCloseTo(DROP_RATES.normal.common, 1);
    expect(normal.none / 2000).toBeCloseTo(0.5, 1);
    expect(off.none).toBeLessThan(normal.none);
    expect(off.rare).toBeGreaterThan(normal.rare);
    expect(off.uncommon).toBeGreaterThan(normal.uncommon);
  });

  it('表がない敵は、必ず落とすものだけ。部位を壊すと、その部位の素材を必ず落とす', () => {
    const s0 = battle({
      allies: [ally('hero', { atk: 999, spd: 50 })],
      enemies: [{ ...GOLDFISH_BOWL_LORD, stats: { ...GOLDFISH_BOWL_LORD.stats, spd: 1 } }],
    });
    const s = execute(planAll(s0, { hero: attackOn('enemy0', 'bowl') }));
    expect(eventsOf(s, 'drop')).toEqual([{ type: 'drop', enemyId: 'enemy0', itemId: 'bowlShard', kind: 'part' }]);
  });

  it('ボスを倒すと「ぬしの金魚」を必ず落とす', () => {
    const s0 = battle({ allies: [ally('hero', { atk: 9999, spd: 50 })], enemies: [{ ...GOLDFISH_BOWL_LORD, stats: { ...GOLDFISH_BOWL_LORD.stats, hp: 1 } }] });
    const s = execute(planAll(s0, { hero: attackOn('enemy0') }));
    expect(getBattleResult(s).drops).toEqual(['lordGoldfish']);
  });
});
