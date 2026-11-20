import { describe, expect, it } from 'vitest';
import { areaGrid, checkArea, checkNights, isWalkable, nightArea, reachableCells, roomPositions, startRoom } from '../../src/core';
import { A11_REWORK, A11_REWORK_ROOM_NAMES, AREA_BATTLES, AREAS, ROOM_NAMES } from '../../src/data';

// 段階262（docs/milestones/M3_explore_feel.md の 5.・5-7）：新しい1-1の配置の試し
const area = A11_REWORK;

describe('新しい1-1（段階262）', () => {
  it('書き間違いがない（部屋・出入口・つなぎ・置いた物・晩）', () => {
    expect(checkArea(area)).toEqual([]);
    expect(checkNights(area)).toEqual([]);
  });

  it('6部屋で、入口 → 屋台の裏 → 裏通り → 広場 → 入口 の輪になる。全体の地図の位置が重ならない', () => {
    expect(area.rooms.map((r) => r.id)).toEqual(['fest2_gate', 'fest2_backyard', 'fest2_lane', 'fest2_plaza', 'fest2_east', 'fest2_woods']);
    const pos = roomPositions(area);
    expect(pos).toEqual({ fest2_gate: [0, 0], fest2_backyard: [-1, 0], fest2_plaza: [0, -1], fest2_lane: [-1, -1], fest2_east: [1, -1], fest2_woods: [0, -2] });
    expect(new Set(Object.values(pos).map((p) => p.join(','))).size).toBe(6);
    for (const r of area.rooms) expect(ROOM_NAMES[r.id]).toBe(A11_REWORK_ROOM_NAMES[r.id]);
  });

  it('敵の戦闘・コマ・写しの人の台詞・途中の会話・ぬしは、今の1-1 と同じ（置く所だけ変えた）', () => {
    const now = AREAS.a11;
    expect(area.id).toBe('a11');
    expect(area.enemies.map((e) => [e.id, e.battle, e.move, e.night, e.scene]).sort()).toEqual(now.enemies.map((e) => [e.id, e.battle, e.move, e.night, e.scene]).sort());
    expect(area.talkers.map((t) => [t.id, t.scene, t.night, t.until]).sort()).toEqual(now.talkers.map((t) => [t.id, t.scene, t.night, t.until]).sort());
    expect(area.boss.battle).toBe(now.boss.battle);
    expect(area.komaNeed).toBe(now.komaNeed);
    expect(area.enemies.reduce((a, e) => a + (AREA_BATTLES[e.battle]?.koma ?? 0), 0) + (AREA_BATTLES[area.boss.battle]?.koma ?? 0)).toBe(area.komaNeed);
    expect(area.chests.length).toBe(8);
  });

  it('1つの部屋の1つの晩に、写しの人は1人まで（広場の1晩目と社の森だけ2人）', () => {
    const count: Record<string, number> = {};
    for (const t of area.talkers) {
      const key = `${t.room} ${t.night ?? 1}`;
      count[key] = (count[key] ?? 0) + 1;
    }
    for (const [key, n] of Object.entries(count)) expect(n, key).toBeLessThanOrEqual(key === 'fest2_plaza 1' || key === 'fest2_woods 3' ? 2 : 1);
  });

  it('最後の晩より前は、ぬしの前まで歩いて行けない。裏通りは1晩目は入れず、2晩目から入れる', () => {
    for (let n = 1; n <= 2; n++) {
      const start = area.nights![n - 1].start;
      const reach = reachableCells(nightArea(area, n), start ? { room: start.room ?? startRoom(area), cell: start.cell } : undefined);
      expect(reach.fest2_woods?.has('11,3') ?? false).toBe(false);
      // 裏通りの中（左の縦の道）
      expect(reach.fest2_lane?.has('4,12') ?? false).toBe(n >= 2);
    }
  });

  it('敵の見回りの点・写しの人・宝箱は、どれも歩けるマス', () => {
    for (const e of area.enemies) for (const p of e.patrol) expect(isWalkable(areaGrid(area, e.room), p), `${e.id} ${p}`).toBe(true);
    for (const t of area.talkers) expect(isWalkable(areaGrid(area, t.room), t.cell), t.id).toBe(true);
  });
});
