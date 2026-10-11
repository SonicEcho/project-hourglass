import { describe, expect, it } from 'vitest';
import type { BondEvent, DailyHub } from '../../src/core';
import {
  allSpots,
  bondLevel,
  checkBonds,
  checkDailyHub,
  finishesAfter,
  isSeen,
  markSeen,
  markVisited,
  metKey,
  picksLeft,
  requiredLeft,
  resolveHub,
  seenKey,
  spotState,
  usesPick,
} from '../../src/core';

const stalls: DailyHub = {
  id: 'stalls',
  time: '夕方',
  finishWhenRequiredSeen: true,
  places: [
    {
      id: 'p',
      name: '参道',
      backdrop: 'x',
      mapX: 0,
      mapY: 0,
      spots: [
        { id: 'a', scene: 'a', label: 'A', mark: 'stall', x: 0, y: 0, required: true },
        { id: 'b', scene: 'b', label: 'B', mark: 'stall', x: 0, y: 0, required: true },
      ],
    },
  ],
};

const town: DailyHub = {
  id: 'town',
  time: '放課後',
  places: [
    { id: 's', name: '商店街', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'store', scene: 'store', label: 'コンビニ', mark: 'main', x: 0, y: 0, required: true }] },
    { id: 'h', name: '施設', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'talk', scene: 'talk', label: '小話', mark: 'talk', x: 0, y: 0 }] },
    { id: 'c', name: '時計屋', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'go', label: '夕暮れへ', mark: 'go', x: 0, y: 0, ends: true }] },
  ],
};

const spot = (hub: DailyHub, id: string) => hub.places.flatMap((p) => p.spots).find((s) => s.id === id)!;

describe('昼の日常（段階24）', () => {
  it('見た印は、物語で覚えた値に入る', () => {
    const vars = markSeen({ 金魚の名前: 'あかね' }, 'a');
    expect(vars).toEqual({ 金魚の名前: 'あかね', [seenKey('a')]: '1' });
    expect(isSeen(vars, 'a')).toBe(true);
    expect(isSeen(vars, 'b')).toBe(false);
  });

  it('屋台めぐり：全部の屋台を見た時に、次へ進む', () => {
    expect(finishesAfter(stalls, {}, spot(stalls, 'a'))).toBe(false);
    expect(finishesAfter(stalls, markSeen({}, 'a'), spot(stalls, 'b'))).toBe(true);
    expect(spotState(stalls, markSeen({}, 'a'), spot(stalls, 'a'))).toBe('seen');
  });

  it('町：必ず見る出来事が残っている間は、夕暮れへ進む印を選べない', () => {
    expect(requiredLeft(town, {}).map((s) => s.id)).toEqual(['store']);
    expect(spotState(town, {}, spot(town, 'go'))).toBe('locked');
    const vars = markSeen({}, 'store');
    expect(spotState(town, vars, spot(town, 'go'))).toBe('open');
    expect(finishesAfter(town, vars, spot(town, 'go'))).toBe(true);
    // 見なくてよい出来事は、見ても日は進まない
    expect(finishesAfter(town, vars, spot(town, 'talk'))).toBe(false);
  });

  it('書き間違いを見つける', () => {
    expect(checkDailyHub(stalls)).toEqual([]);
    expect(checkDailyHub(town)).toEqual([]);
    const bad: DailyHub = {
      id: 'bad',
      time: '',
      places: [{ id: 'p', name: 'p', backdrop: 'x', mapX: 0, mapY: 0, spots: [{ id: 'a', scene: 'a', label: 'A', mark: 'talk', x: 0, y: 0 }, { id: 'a', label: 'A', mark: 'talk', x: 0, y: 0 }] }],
    };
    expect(checkDailyHub(bad)).toEqual(['bad：同じ名前の印が2つある：a', 'bad：場面も終わりもない印：a', 'bad：日常を終える印がない']);
  });
});

// ---- 誰と過ごすか（段階35） ----
describe('誰と過ごすか（段階35）', () => {
  const placeInfo = (id: string) => ({ id, name: id, backdrop: 'x', mapX: 0, mapY: 0 });
  const TOWN_T = { school: placeInfo('school'), home: placeInfo('home'), shop: placeInfo('shop') };
  const BONDS: Record<string, BondEvent[]> = {
    akari: [
      { id: 'a1', title: '1', label: 'A1', from: 1, place: 'school', x: 0, y: 0 },
      { id: 'a2', title: '2', label: 'A2', from: 3, place: 'home', x: 0, y: 0 },
      { id: 'a3', title: '3', label: 'A3', from: 4, place: 'school', x: 0, y: 0 },
    ],
    mio: [{ id: 'm1', title: '1', label: 'M1', from: 6, place: 'shop', x: 0, y: 0 }],
  };
  const day = (n: number, partners = ['akari', 'mio']): DailyHub => ({
    id: `d${n}`,
    time: '',
    day: n,
    picks: 2,
    partners,
    places: [
      { ...TOWN_T.school, spots: [{ id: `t${n}`, scene: `t${n}`, label: '小話', mark: 'talk', x: 0, y: 0 }] },
      {
        ...TOWN_T.shop,
        spots: [
          { id: `r${n}`, scene: `r${n}`, label: '必ず', mark: 'main', x: 0, y: 0, required: true },
          { id: `go${n}`, label: '→', mark: 'go', x: 0, y: 0, ends: true },
        ],
      },
    ],
  });
  const ids = (hub: DailyHub) => allSpots(hub).map((s) => s.id);
  /** 印を見たことにする（画面と同じ：組み立てた日常で、見た値を覚える） */
  const visit = (raw: DailyHub, vars: Record<string, string>, id: string) => {
    const hub = resolveHub(raw, vars, BONDS, TOWN_T);
    const s = allSpots(hub).find((x) => x.id === id);
    if (!s) throw new Error(`no spot ${id}`);
    return { end: finishesAfter(hub, vars, s), vars: markVisited(hub, vars, s) };
  };

  it('会える相手ごとに、まだ見ていない一番前の絆の出来事が、その場所に出る（場所がなければ、日を進める場所の前に足す）', () => {
    const hub = resolveHub(day(3), {}, BONDS, TOWN_T);
    expect(ids(hub)).toEqual(['t3', 'a1', 'r3', 'go3']);
    // a1 を見たら、次は a2（3日目から）。場所は施設で、時計屋より前に入る
    const after = resolveHub(day(3), markSeen({}, 'a1'), BONDS, TOWN_T);
    expect(after.places.map((p) => p.id)).toEqual(['school', 'home', 'shop']);
    expect(ids(after)).toContain('a2');
    // みおは6日目から
    expect(ids(resolveHub(day(6), {}, BONDS, TOWN_T))).toContain('m1');
  });

  it('先の出来事は、何日目からより前には出ない。見なかった出来事は、次の日も同じ所から', () => {
    const vars = markSeen({}, 'a1');
    expect(ids(resolveHub(day(2), vars, BONDS, TOWN_T))).not.toContain('a2');
    expect(ids(resolveHub(day(5), vars, BONDS, TOWN_T))).toContain('a2');
    expect(ids(resolveHub(day(5), vars, BONDS, TOWN_T))).not.toContain('a3');
  });

  it('同じ相手は1日に1回：見た後も、その日は見た出来事の印のまま（続きは次の日）', () => {
    const { vars } = visit(day(4), markSeen({}, 'a1'), 'a2');
    const hub = resolveHub(day(4), vars, BONDS, TOWN_T);
    const a2 = allSpots(hub).find((s) => s.id === 'a2');
    expect(a2 && spotState(hub, vars, a2)).toBe('seen');
    expect(ids(hub)).not.toContain('a3');
    expect(ids(resolveHub(day(5), vars, BONDS, TOWN_T))).toContain('a3');
    expect(bondLevel(vars, BONDS.akari)).toBe(2);
    expect(vars[metKey('d4', 'akari')]).toBe('a2');
  });

  it('昼に選べるのは2回。必ず見る出来事は回数を使わない。使い切ったら、残りの絆と小話は選べない', () => {
    let vars: Record<string, string> = {};
    const raw = day(6);
    expect(picksLeft(resolveHub(raw, vars, BONDS, TOWN_T), vars)).toBe(2);
    let r = visit(raw, vars, 'r6');
    expect(r.end).toBe(false);
    vars = r.vars;
    expect(picksLeft(resolveHub(raw, vars, BONDS, TOWN_T), vars)).toBe(2);
    r = visit(raw, vars, 'a1');
    expect(r.end).toBe(false);
    vars = r.vars;
    const hub = resolveHub(raw, vars, BONDS, TOWN_T);
    expect(picksLeft(hub, vars)).toBe(1);
    // 2回目で使い切り、必ず見る出来事も見たので、夕暮れへ
    r = visit(raw, vars, 'm1');
    expect(r.end).toBe(true);
    const spent = resolveHub(raw, r.vars, BONDS, TOWN_T);
    const talkSpot = allSpots(spent).find((s) => s.id === 't6');
    expect(talkSpot && spotState(spent, r.vars, talkSpot)).toBe('spent');
    expect(usesPick(allSpots(spent).find((s) => s.id === 'r6')!)).toBe(false);
  });

  it('使い切っても、必ず見る出来事が残っていれば夕暮れにならない（見たら夕暮れ）', () => {
    let vars: Record<string, string> = {};
    vars = visit(day(6), vars, 'a1').vars;
    const r = visit(day(6), vars, 't6');
    expect(r.end).toBe(false);
    expect(visit(day(6), r.vars, 'r6').end).toBe(true);
  });

  it('回数を決めていない日常は、今までどおり何回でも', () => {
    const hub: DailyHub = { ...day(3), picks: undefined };
    expect(picksLeft(hub, {})).toBe(Infinity);
  });

  it('絆の出来事の書き間違いを見つける', () => {
    expect(checkBonds(BONDS, TOWN_T)).toEqual([]);
    const bad: Record<string, BondEvent[]> = {
      x: [
        { id: 'b', title: '', label: '', from: 3, place: 'nowhere', x: 0, y: 0 },
        { id: 'b', title: '', label: '', from: 2, place: 'home', x: 0, y: 0 },
      ],
    };
    expect(checkBonds(bad, TOWN_T)).toEqual(['x：町の地図にない場所：b nowhere', 'x：同じ id の絆の出来事が2つある：b', 'x：前の出来事より早く出る：b']);
  });
});
