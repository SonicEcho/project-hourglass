import { describe, expect, it } from 'vitest';
import type { DailyHub, SideEvent } from '../../src/core';
import { markVisited, picksLeft, resolveHub, sideDayKey, sideEventFor, spotState, usesPick } from '../../src/core';
import { SCENES, SIDE_CHAINS, SIDE_EVENTS, TOWN } from '../../src/data';

// 寄り道（段階239。docs/milestones/M3_side_events.md）
const chain: SideEvent[] = [
  { id: 's1', chain: 'c', title: '一', label: '寄り道', from: 3, place: 'street', x: 300, y: 500 },
  { id: 's2', chain: 'c', title: '二', label: '寄り道', from: 5, place: 'street', x: 300, y: 500 },
];
const day = (n: number): DailyHub => ({ id: `d${n}`, time: '', day: n, picks: 2, places: [{ id: 'clockshop', name: '時計屋', backdrop: 'clock_shop', mapX: 0, mapY: 0, spots: [{ id: 'go', label: '夕暮れへ', mark: 'go', x: 0, y: 0, ends: true }] }] });

describe('寄り道（段階239）', () => {
  it('「何日目から」より前は出ない。前の話を見た次の日から、続きが出る', () => {
    expect(sideEventFor(day(2), {}, chain)).toBeUndefined();
    expect(sideEventFor(day(3), {}, chain)?.id).toBe('s1');
    const hub3 = resolveHub(day(3), {}, {}, TOWN, [], undefined, { c: chain });
    const spot = hub3.places.flatMap((p) => p.spots).find((s) => s.id === 's1')!;
    expect(spot.mark).toBe('side');
    const vars = markVisited(hub3, {}, spot);
    expect(vars[sideDayKey('c')]).toBe('3');
    // 見た日は、見た話が「見た」で残る
    expect(sideEventFor(day(3), vars, chain)?.id).toBe('s1');
    expect(spotState(hub3, vars, spot)).toBe('seen');
    // 次の話は from（5日目）から
    expect(sideEventFor(day(4), vars, chain)).toBeUndefined();
    expect(sideEventFor(day(5), vars, chain)?.id).toBe('s2');
  });

  it('昼に選べる回数を使わない', () => {
    const hub = resolveHub(day(3), {}, {}, TOWN, [], undefined, { c: chain });
    const spot = hub.places.flatMap((p) => p.spots).find((s) => s.id === 's1')!;
    expect(usesPick(spot)).toBe(false);
    expect(picksLeft(hub, markVisited(hub, {}, spot))).toBe(2);
    // 日のない日常（プロローグ）には出さない
    expect(sideEventFor({ ...day(3), day: undefined }, {}, chain)).toBeUndefined();
  });

  it('データ：台本がある・町の場所がある・日の順・連作の名前がある', () => {
    const ids = new Set(SCENES.map((s) => s.id));
    for (const [id, events] of Object.entries(SIDE_EVENTS)) {
      expect(SIDE_CHAINS[id], id).toBeDefined();
      events.forEach((e, i) => {
        expect(e.chain).toBe(id);
        expect(ids.has(e.id), e.id).toBe(true);
        expect(TOWN[e.place], e.place).toBeDefined();
        if (i > 0) expect(e.from).toBeGreaterThan(events[i - 1].from);
      });
    }
  });
});

describe('寄り道の帳面（段階240）', () => {
  const name = (p: string) => (p === 'street' ? '商店街' : p);
  it('今日出ている・見た・この先・全部見た、を言葉で返す', async () => {
    const { sideChainStatus } = await import('../../src/core');
    expect(sideChainStatus(chain, {}, 2, name)).toEqual({ label: '3日目から、商店街', tone: 'later' });
    expect(sideChainStatus(chain, {}, 3, name)).toEqual({ label: '今日、商店街に出ています', tone: 'today' });
    const seen1 = { '見た:s1': '1', [sideDayKey('c')]: '3' };
    expect(sideChainStatus(chain, seen1, 3, name).tone).toBe('seen');
    expect(sideChainStatus(chain, seen1, 4, name)).toEqual({ label: '5日目から、商店街', tone: 'later' });
    expect(sideChainStatus(chain, { ...seen1, '見た:s2': '1', [sideDayKey('c')]: '5' }, 6, name)).toEqual({ label: '全部見ました', tone: 'done' });
  });
});
