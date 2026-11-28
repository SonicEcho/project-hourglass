import { describe, expect, it } from 'vitest';
import { areaGrid, checkArea, isWalkable, reachableCells } from '../../src/core';
import { A12_DECOR, A12_GATE_PARTS, A12_REWORK, A12_REWORK_IMAGES, ASSETS, ROOM_NAMES } from '../../src/data';

// 段階312（docs/milestones/M3_explore_feel.md の 16-9）：新しい1-2 の入口（横に走る商店街）
const area = A12_REWORK;
const grid = areaGrid(area, 'a12h_gate');

describe('新しい1-2 の入口（段階312）', () => {
  it('書き間違いがない。入口の部屋だけで、名前がある', () => {
    expect(checkArea(area)).toEqual([]);
    expect(area.id).toBe('a12');
    expect(area.rooms.map((r) => r.id)).toEqual(['a12h_gate']);
    expect(ROOM_NAMES.a12h_gate).toBe('商店街の入口');
  });

  it('通り（6〜17行）は左右の端まで、下の脇道（9〜13列）は下の端まで、出発点から歩ける', () => {
    const reach = reachableCells(area).a12h_gate;
    for (let r = 6; r <= 17; r++) for (let c = 1; c <= 22; c++) expect(reach.has(`${c},${r}`)).toBe(true);
    for (const r of [8, 11, 14]) for (const c of [0, 23]) expect(reach.has(`${c},${r}`)).toBe(true);
    for (let r = 18; r <= 23; r++) for (let c = 9; c <= 13; c++) expect(reach.has(`${c},${r}`)).toBe(true);
  });

  it('上の店の帯と、手前の建物の帯（脇道の外）は通れない', () => {
    for (let c = 0; c < 24; c++) for (let r = 0; r <= 4; r++) expect(isWalkable(grid, [c, r])).toBe(false);
    for (let r = 18; r <= 23; r++) for (const c of [0, 4, 8, 14, 18, 23]) expect(isWalkable(grid, [c, r])).toBe(false);
  });

  it('手前の建物は、足もとが通りより下（20〜22行）で、絵が通りの下の方にかかる（通りの下を歩くと屋根の後ろに隠れる）', () => {
    const backs = A12_GATE_PARTS.filter((p) => p.part.startsWith('a12b_'));
    expect(backs).toHaveLength(6);
    for (const p of backs) {
      expect(p.cell[1]).toBe(22);
      expect(p.d).toBe(3);
      // 脇道（9〜13列）に足もとがかからない
      expect(p.cell[0] + p.w <= 9 || p.cell[0] >= 14).toBe(true);
    }
  });

  it('読む絵がすべて台帳にある', () => {
    const ids = new Set(ASSETS.map((a) => a.id));
    for (const id of A12_REWORK_IMAGES) expect(ids.has(id)).toBe(true);
    expect(A12_DECOR.every((d) => d.room === 'a12h_gate')).toBe(true);
  });
});
