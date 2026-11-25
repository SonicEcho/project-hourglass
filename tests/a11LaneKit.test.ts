import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkArea, checkNights, isWalkable, nightArea, reachableCells, roomOf, areaGrid } from '../src/core';
import { A11_REWORK, ASSETS, LANE_KIT_GROUNDS, LANE_KIT_IMAGES, LANE_KIT_ROOMS, withLaneKit } from '../src/data';

// 段階292（docs/milestones/M3_explore_feel.md の 14.）：裏通りを部品だけで組んだ版
describe('裏通りを部品だけで組む試し（段階292）', () => {
  const kits = ['a', 'b', 'c'] as const;

  it('どの版でも、区画の書き間違いがなく、晩ごとに歩いて行ける', () => {
    for (const k of kits) {
      const area = withLaneKit(A11_REWORK, k);
      expect(checkArea(area), k).toEqual([]);
      expect(checkNights(area), k).toEqual([]);
    }
  });

  it('A は、今の裏通りと歩けるマスが同じ（地面と縁を部品にしただけ）。C は屋台が片付き、荷車が帰った分だけ広い', () => {
    const now = roomOf(A11_REWORK, 'fest2_lane').layout;
    expect(LANE_KIT_ROOMS.a.layout).toEqual(now);
    const opened = LANE_KIT_ROOMS.c.layout.flatMap((row, r) => [...row].flatMap((ch, c) => (ch !== now[r][c] ? [[c, r, ch]] : [])));
    expect(opened.length).toBeGreaterThan(0);
    for (const [, , ch] of opened) expect(ch).toBe('.');
  });

  it('B（形を変えた版）でも、2晩目に裏通りの砂嵐・お面・浴衣の人・3晩目の奥の宝箱へ歩いて行ける', () => {
    const area = withLaneKit(A11_REWORK, 'b');
    const map = areaGrid(area, 'fest2_lane');
    for (const e of area.enemies.filter((x) => x.room === 'fest2_lane')) for (const c of e.patrol) expect(isWalkable(map, c), e.id).toBe(true);
    for (const n of [2, 3]) {
      const start = area.nights![n - 1].start!;
      const reach = reachableCells(nightArea(area, n), { room: start.room!, cell: start.cell });
      const near = (c: [number, number]) => [[0, 0], [0, 1], [1, 0], [0, -1], [-1, 0]].some(([dc, dr]) => reach.fest2_lane?.has(`${c[0] + dc},${c[1] + dr}`));
      if (n === 2) {
        for (const g of area.gadgets!.filter((x) => x.room === 'fest2_lane')) expect(near(g.cell), g.id).toBe(true);
        for (const t of area.talkers.filter((x) => x.room === 'fest2_lane' && (x.night ?? 1) <= 2 && 2 <= (x.until ?? 9))) expect(near(t.cell), t.id).toBe(true);
      }
      if (n === 3) for (const c of area.chests.filter((x) => x.room === 'fest2_lane')) expect(near(c.cell), c.id).toBe(true);
    }
  });

  it('部品と合成した地面の絵は、どれも台帳にあり、ファイルもある。合成の元の絵もある', () => {
    for (const id of LANE_KIT_IMAGES) {
      const a = ASSETS.find((x) => x.id === id);
      expect(a, id).toBeTruthy();
      expect(existsSync(`public/${a!.file}`), id).toBe(true);
    }
    for (const g of Object.values(LANE_KIT_GROUNDS)) {
      expect(existsSync(`public/${g.file}`)).toBe(true);
      for (const n of [g.base, ...g.fills.map((f) => f.tex), ...g.decals.map((d) => d.image)]) expect(existsSync(`art/kit_lane/${n}.webp`), n).toBe(true);
    }
  });
});
