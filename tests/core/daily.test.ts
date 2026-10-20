import { describe, expect, it } from 'vitest';
import type { BondEvent, DailyHub, ReturnVisit } from '../../src/core';
import {
  allSpots,
  blockers,
  bondLevel,
  bondPoints,
  checkBonds,
  checkDailyHub,
  checkVisits,
  finishesAfter,
  heartText,
  isSeen,
  markArchived,
  markSeen,
  markVisited,
  metKey,
  picksLeft,
  requiredLeft,
  resolveHub,
  seenKey,
  spotGears,
  spotState,
  talkArchive,
  topBondPartner,
  usesPick,
  visitsFor,
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

// ---- 返した翌日に持ち主に会う（段階36） ----
describe('返した翌日に持ち主に会う（段階36）', () => {
  const placeInfo = (id: string) => ({ id, name: id, backdrop: 'x', mapX: 0, mapY: 0 });
  const TOWN_T = { street: placeInfo('street'), factory: placeInfo('factory'), shop: placeInfo('shop'), clock: placeInfo('clock') };
  const VISITS: ReturnVisit[] = [
    { area: 'a11', id: 'v11', label: 'ゆうま', place: 'street', x: 0, y: 0 },
    { area: 'a21', id: 'v21', label: 'いさむ', place: 'factory', x: 0, y: 0, gears: ['batonReceiver'] },
    { area: 'a22', id: 'v22', label: 'けんた', place: 'shop', x: 0, y: 0 },
  ];
  const hub = (day: number): DailyHub => ({
    id: `d${day}`,
    time: '',
    day,
    places: [
      { ...TOWN_T.shop, spots: [{ id: 'next', scene: 'next', label: '次の持ち主', mark: 'main', x: 0, y: 0, required: true, after: 'v21' }] },
      { ...TOWN_T.clock, spots: [{ id: 'go', label: '→', mark: 'go', x: 0, y: 0, ends: true }] },
    ],
  });
  const ids = (h: DailyHub) => allSpots(h).map((s) => s.id);

  it('返した次の日だけ、その区画の出来事が出る', () => {
    const days = { a11: 1, a21: 5 };
    expect(visitsFor(hub(2), VISITS, days).map((v) => v.id)).toEqual(['v11']);
    expect(visitsFor(hub(3), VISITS, days)).toEqual([]);
    expect(visitsFor(hub(6), VISITS, days).map((v) => v.id)).toEqual(['v21']);
    // 返していない区画（a22）は出ない。日のない日常（屋台めぐり）にも出ない
    expect(visitsFor(hub(7), VISITS, days)).toEqual([]);
    expect(visitsFor({ ...hub(2), day: undefined }, VISITS, days)).toEqual([]);
  });

  it('必ず見る出来事として、その場所の先頭に出る（場所がなければ、日を進める場所の前に足す）', () => {
    const h = resolveHub(hub(6), {}, {}, TOWN_T, visitsFor(hub(6), VISITS, { a21: 5 }));
    expect(h.places.map((p) => p.id)).toEqual(['shop', 'factory', 'clock']);
    const v = allSpots(h).find((s) => s.id === 'v21')!;
    expect(v).toMatchObject({ scene: 'v21', mark: 'main', required: true });
    expect(requiredLeft(h, {}).map((s) => s.id)).toEqual(['next', 'v21']);
    // 同じ場所なら、先頭に入る
    const same = resolveHub(hub(7), {}, {}, TOWN_T, visitsFor(hub(7), VISITS, { a22: 6 }));
    expect(ids(same)).toEqual(['v22', 'next', 'go']);
  });

  it('ごほうびのギア（段階39）：見る前の印だけが返し、見た後とごほうびのない印は空', () => {
    const h = resolveHub(hub(6), {}, {}, TOWN_T, visitsFor(hub(6), VISITS, { a21: 5 }));
    const v = allSpots(h).find((s) => s.id === 'v21')!;
    expect(v.gears).toEqual(['batonReceiver']);
    expect(spotGears(h, {}, v)).toEqual(['batonReceiver']);
    expect(spotGears(h, markVisited(h, {}, v), v)).toEqual([]);
    expect(spotGears(h, {}, allSpots(h).find((s) => s.id === 'next')!)).toEqual([]);
  });

  it('「工場の後に楽器店」：先に見る印を見るまで、後の印は選べない。先の印が出ていない日は、すぐ選べる', () => {
    const h = resolveHub(hub(6), {}, {}, TOWN_T, visitsFor(hub(6), VISITS, { a21: 5 }));
    const next = allSpots(h).find((s) => s.id === 'next')!;
    expect(spotState(h, {}, next)).toBe('locked');
    expect(blockers(h, {}, next).map((s) => s.id)).toEqual(['v21']);
    expect(spotState(h, markSeen({}, 'v21'), next)).toBe('open');
    // 日を進める印は、今までどおり必ず見る出来事の残り
    const go = allSpots(h).find((s) => s.id === 'go')!;
    expect(blockers(h, markSeen({}, 'v21'), go).map((s) => s.id)).toEqual(['next']);
    // 返していない日は、先の印がないので、すぐ選べる
    const alone = resolveHub(hub(6), {}, {}, TOWN_T, []);
    expect(spotState(alone, {}, allSpots(alone).find((s) => s.id === 'next')!)).toBe('open');
  });

  it('書き間違いを見つける', () => {
    expect(checkVisits(VISITS, TOWN_T)).toEqual([]);
    const bad: ReturnVisit[] = [
      { area: 'a', id: 'x', label: '', place: 'nowhere', x: 0, y: 0 },
      { area: 'a', id: 'x', label: '', place: 'street', x: 0, y: 0 },
    ];
    expect(checkVisits(bad, TOWN_T)).toEqual(['町の地図にない場所：x nowhere', '同じ id の返した翌日の出来事が2つある：x', '同じ区画の返した翌日の出来事が2つある：a']);
  });
});

describe('♥が一番多い相手と、町の小話の棚（段階82）', () => {
  const bonds: Record<string, BondEvent[]> = {
    akari: [
      { id: 'a1', title: '', label: '', from: 1, place: 'p', x: 0, y: 0 },
      { id: 'a2', title: '', label: '', from: 1, place: 'p', x: 0, y: 0 },
    ],
    mio: [
      { id: 'm1', title: '', label: '', from: 1, place: 'p', x: 0, y: 0 },
      { id: 'm2', title: '', label: '', from: 1, place: 'p', x: 0, y: 0 },
    ],
  };

  const points = { event: 2, talk: 1 };
  const talkHubs: Record<string, DailyHub> = {
    d1: {
      id: 'd1',
      time: '',
      day: 1,
      partners: ['akari', 'mio'],
      places: [
        {
          id: 'p',
          name: '',
          backdrop: 'b',
          mapX: 0,
          mapY: 0,
          spots: [
            { id: 'tm1', scene: 'tm1', label: '', mark: 'talk', x: 0, y: 0, with: 'mio' },
            { id: 'tm2', scene: 'tm2', label: '', mark: 'talk', x: 0, y: 0, with: 'mio' },
            { id: 'tn', scene: 'tn', label: '', mark: 'talk', x: 0, y: 0 },
          ],
        },
      ],
    },
  };

  it('♥が一番多い相手。同じ数なら、並びの先の相手', () => {
    expect(topBondPartner({}, bonds, {}, points)).toBe('akari');
    expect(topBondPartner(markSeen({}, 'm1'), bonds, {}, points)).toBe('mio');
    expect(topBondPartner(markSeen(markSeen({}, 'm1'), 'a1'), bonds, {}, points)).toBe('akari');
    expect(topBondPartner({}, {}, {}, points)).toBeNull();
  });

  it('段階83：その日に見た小話は、相手の♥を半分足す。後から「町の小話」で見た小話は数えない', () => {
    const vars = markSeen(markSeen(markSeen({}, 'a1'), 'tm1'), 'tn');
    expect(bondPoints(vars, 'akari', bonds, talkHubs, points)).toBe(2);
    expect(bondPoints(vars, 'mio', bonds, talkHubs, points)).toBe(1);
    expect(topBondPartner(vars, bonds, talkHubs, points)).toBe('akari');
    // 小話2つで、絆の出来事1つと同じ。同じ数なら並びの先
    expect(topBondPartner(markSeen(vars, 'tm2'), bonds, talkHubs, points)).toBe('akari');
    expect(topBondPartner(markSeen(markSeen(vars, 'tm2'), 'm1'), bonds, talkHubs, points)).toBe('mio');
    // 後から見た記録は数えないが、棚では見たことになる
    const later = markArchived(vars, 'tm2');
    expect(bondPoints(later, 'mio', bonds, talkHubs, points)).toBe(1);
    expect(talkArchive(talkHubs, later, () => true).map((t) => t.seen)).toEqual([true, true, true]);
    expect(talkArchive(talkHubs, {}, () => true).map((t) => t.seen)).toEqual([false, false, false]);
  });

  it('♥の書き方：♥1つは絆の出来事1つ。半分は♡。0 は ―', () => {
    expect(heartText(0, points)).toBe('―');
    expect(heartText(1, points)).toBe('♡');
    expect(heartText(4, points)).toBe('♥♥');
    expect(heartText(5, points)).toBe('♥♥♡');
  });

  it('小話の相手は、その日に会える仲間の小話にだけ書ける', () => {
    const mine = (e: string) => e.includes('小話の相手');
    expect(checkDailyHub(talkHubs.d1).filter(mine)).toEqual([]);
    const bad: DailyHub = { ...talkHubs.d1, partners: ['akari'] };
    expect(checkDailyHub(bad).filter(mine)).toEqual(['d1：小話の相手がその日の仲間でない：tm1 mio', 'd1：小話の相手がその日の仲間でない：tm2 mio']);
  });

  it('過ぎた日の小話だけを、日の順に並べる。見たかどうかも付ける。絆と必ず見る出来事は並べない', () => {
    const spot = (id: string, mark: 'talk' | 'main' | 'bond' | 'go') => ({ id, scene: id, label: id, mark, x: 0, y: 0 });
    const hubs: Record<string, DailyHub> = {
      d2: { id: 'd2', time: '', day: 2, places: [{ id: 'p', name: '', backdrop: 'b', mapX: 0, mapY: 0, spots: [spot('t2', 'talk'), spot('m2', 'main')] }] },
      d1: { id: 'd1', time: '', day: 1, places: [{ id: 'p', name: '', backdrop: 'b', mapX: 0, mapY: 0, spots: [spot('t1', 'talk'), spot('t1b', 'talk')] }] },
      d3: { id: 'd3', time: '', day: 3, places: [{ id: 'p', name: '', backdrop: 'b', mapX: 0, mapY: 0, spots: [spot('t3', 'talk')] }] },
      stalls: { id: 'stalls', time: '', places: [{ id: 'p', name: '', backdrop: 'b', mapX: 0, mapY: 0, spots: [spot('s', 'talk')] }] },
    };
    const passed = (id: string) => id !== 'd3';
    const list = talkArchive(hubs, markSeen({}, 't1b'), passed);
    expect(list.map((t) => [t.id, t.day, t.seen])).toEqual([
      ['t1', 1, false],
      ['t1b', 1, true],
      ['t2', 2, false],
    ]);
  });
});
