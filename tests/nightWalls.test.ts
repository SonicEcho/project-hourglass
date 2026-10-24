import { describe, expect, it } from 'vitest';
import { nightArea, reachableCells, startRoom } from '../src/core';
import { AREAS, ROOM_NAMES } from '../src/data';

// 晩に分けた区画（段階112。テストプレイのメモ 7）：最後の晩より前は、ぬしの前まで歩いて行けない。
// 1-1 の2晩目に、石段の壁の横の抜け道から、ぬしの前まで行けてしまっていた
describe('晩の壁', () => {
  it('最後の晩より前は、その晩の始まりから、ぬしのマスへ歩いて行けない', () => {
    const leaks: string[] = [];
    for (const area of Object.values(AREAS)) {
      const nights = area.nights ?? [];
      if (nights.length < 2 || !area.walls?.length) continue;
      for (let n = 1; n < nights.length; n++) {
        const night = nightArea(area, n);
        const start = nights[n - 1].start;
        const from = start ? { room: start.room ?? startRoom(area), cell: start.cell } : undefined;
        const reach = reachableCells(night, from);
        const bossRoom = area.boss.room ?? startRoom(area);
        if (reach[bossRoom]?.has(`${area.boss.cell[0]},${area.boss.cell[1]}`)) leaks.push(`${area.id} ${n}晩目`);
      }
    }
    expect(leaks).toEqual([]);
  });
});

describe('部屋の名前（段階112）', () => {
  it('区画に出てくる部屋には、どれも短い名前がある（まだ入っていない部屋への矢印に出す）', () => {
    const missing = Object.values(AREAS).flatMap((a) => a.rooms.filter((r) => !ROOM_NAMES[r.id]).map((r) => `${a.id} ${r.id}`));
    expect(missing).toEqual([]);
  });
});

describe('まだ入っていない部屋への出入口（段階112）', () => {
  it('入った部屋への出入口と、その晩の壁でふさがった出入口は出さない', async () => {
    const { startExplore, unvisitedDoors } = await import('../src/core');
    const area = AREAS.a11;
    const s0 = startExplore(area);
    // 1晩目の縁日の広場：上（社の森）は3晩目まで壁でふさがっている
    const night1 = nightArea(area, 1);
    const fresh = { ...s0, visited: ['fest_gate', 'festival_night'] };
    const doors = unvisitedDoors(night1, fresh, 'festival_night').map((d) => d.toRoom).sort();
    expect(doors).not.toContain('fest_gate');
    expect(doors).not.toContain('fest_woods');
    // 3晩目は壁が開くので、社の森への出入口も出す
    const night3 = nightArea(area, 3);
    expect(unvisitedDoors(night3, fresh, 'festival_night').map((d) => d.toRoom)).toContain('fest_woods');
    // 入った後は出さない
    expect(unvisitedDoors(night3, { ...fresh, visited: [...fresh.visited, 'fest_woods'] }, 'festival_night').map((d) => d.toRoom)).not.toContain('fest_woods');
  });
});
