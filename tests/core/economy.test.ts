import { describe, expect, it } from 'vitest';
import { AREA_BATTLES, AREAS, GROWTH_COST, GROWTH_MAP, PART_BREAK_POINTS, WEAPON_DATA } from '../../src/data';

// 入手量の目安（段階55。docs/design/economy.md の 8.）：1つの区画で入る量
const AREA_IDS = ['a11', 'a12', 'a21', 'a22', 'a23'];
const battlesOf = (id: string) => [...AREAS[id].enemies.map((e) => AREA_BATTLES[e.battle]), AREA_BATTLES[AREAS[id].boss.battle]];

describe('1つの区画で入る量（段階55）', () => {
  it('星の砂：部位破壊と合わせて、その章の区域の約3分の1（12〜18）', () => {
    const region: Record<number, number> = {};
    for (const n of GROWTH_MAP.nodes) region[n.chapter ?? 1] = (region[n.chapter ?? 1] ?? 0) + (GROWTH_COST[n.kind as keyof typeof GROWTH_COST] ?? 0);
    for (const id of AREA_IDS) {
      const battles = battlesOf(id);
      const parts = battles.flatMap((b) => b.enemies).reduce((n, e) => n + (e.parts?.length ?? 0), 0);
      const sand = battles.reduce((n, b) => n + b.reward, 0) + parts * PART_BREAK_POINTS;
      expect(sand, id).toBeGreaterThanOrEqual(12);
      expect(sand, id).toBeLessThanOrEqual(18);
    }
    expect(region[1] + region[2]).toBe(72);
  });

  it('消費アイテム：宝箱と勝利のアイテムを合わせて2〜3つ', () => {
    for (const id of AREA_IDS) {
      const items = [...AREAS[id].chests.flatMap((c) => c.items), ...battlesOf(id).flatMap((b) => (b.item ? [b.item] : []))];
      const n = items.filter((i) => WEAPON_DATA.items[i]?.kind === 'item').length;
      expect(n, id).toBeGreaterThanOrEqual(2);
      expect(n, id).toBeLessThanOrEqual(3);
    }
  });

  it('スナップ：宝箱とぬしで1〜3枚（返した報酬は別）', () => {
    for (const id of AREA_IDS) {
      const n = [...AREAS[id].chests.flatMap((c) => c.snaps ?? []), ...battlesOf(id).flatMap((b) => b.snaps ?? [])].length;
      expect(n, id).toBeGreaterThanOrEqual(1);
      expect(n, id).toBeLessThanOrEqual(3);
    }
  });
});
