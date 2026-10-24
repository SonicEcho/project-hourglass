import { describe, expect, it } from 'vitest';
import { dayAt } from '../src/core';
import { DAILY_HUBS, SLICE_FLOW } from '../src/data';

// 段階103（レビューの A4）：2-3 を持ち去られてから取り返すまでを1日延ばした。
// 準決勝は木曜（祝日）のまま21日目に置き、3章は曜日をそのままに日の数字だけ1つずらした
describe('2章の終わりの日の並び（段階103）', () => {
  it('18日目に持ち去られ、19日目は手が出せない日、20日目に取り返し、21日目に準決勝と2章の終わり', () => {
    expect(dayAt(SLICE_FLOW, 'd7_taken')).toBe(18);
    expect(dayAt(SLICE_FLOW, 'd19_noway')).toBe(19);
    expect(dayAt(SLICE_FLOW, 'a23_day20_free')).toBe(20);
    expect(dayAt(SLICE_FLOW, 'a23_return')).toBe(20);
    expect(dayAt(SLICE_FLOW, 'd8_evening')).toBe(21);
    expect(dayAt(SLICE_FLOW, 'd21_classroom')).toBe(22);
  });

  it('昼の画面の日と曜日が、流れの日に合う（準決勝は木曜・祝日、3章の始めは金曜）', () => {
    for (const hub of Object.values(DAILY_HUBS)) {
      if (hub.day === undefined || !SLICE_FLOW.some((c) => c.events.some((e) => e.id === hub.id))) continue;
      expect(dayAt(SLICE_FLOW, hub.id), hub.id).toBe(hub.day);
      expect(hub.time.startsWith(`${hub.day}日目`), hub.id).toBe(true);
    }
    expect(DAILY_HUBS.d20_free.day).toBe(21);
    expect(DAILY_HUBS.d20_free.time).toContain('祝日');
    expect(DAILY_HUBS.d21_free.time).toContain('金曜');
  });
});
