import { describe, expect, it } from 'vitest';
import type { Flow } from '../../src/core';
import {
  addPlayTime,
  createPlayLog,
  recordPlayCount,
  enterPlayEvent,
  formatPlayTime,
  parsePlayLog,
  playLogPages,
  playLogSections,
  PLAY_TICK_MAX_MS,
  recordPlayBattle,
  recordPlayStart,
  serializePlayLog,
  summarizePlayLog,
} from '../../src/core';
import { SLICE_FLOW } from '../../src/data';

// 遊んだ記録（段階32b）

const flow: Flow = [
  { id: 'p', name: 'プロローグ', events: [{ id: 'a', kind: 'dialogue', title: 'A' }] },
  {
    id: 'c1',
    name: '1章',
    events: [
      { id: 'x', kind: 'explore', title: '探索' },
      { id: 'b', kind: 'dialogue', title: 'B' },
      { id: 'end', kind: 'end', title: 'つづく' },
    ],
  },
];
const t0 = new Date('2026-10-09T10:00:00Z');
const t1 = new Date('2026-10-09T10:05:00Z');

describe('遊んだ記録（段階32b）', () => {
  it('出来事ごとにいた時間を足す。1回に足す時間には上限がある', () => {
    let log = createPlayLog(t0);
    log = addPlayTime(log, 'a', 5000, t0);
    log = addPlayTime(log, 'a', 3000, t1);
    log = addPlayTime(log, 'x', 10 * 60_000, t1);
    log = addPlayTime(log, 'x', -100, t1);
    expect(log.events.a.ms).toBe(8000);
    expect(log.events.x.ms).toBe(PLAY_TICK_MAX_MS);
    expect(log.last).toBe('x');
    expect(log.lastAt).toBe(t1.toISOString());
  });

  it('一番先まで進んだ所は、戻っても下がらない。「つづく」に入ると着いた回数を数える（同じ所に入り直しても数えない）', () => {
    let log = enterPlayEvent(createPlayLog(t0), flow, 'x', t0);
    expect(log.furthest).toBe('x');
    log = enterPlayEvent(log, flow, 'a', t0);
    expect(log.furthest).toBe('x');
    expect(log.last).toBe('a');
    log = enterPlayEvent(log, flow, 'end', t1);
    log = enterPlayEvent(log, flow, 'end', t1);
    expect(log.furthest).toBe('end');
    expect(log.finished).toBe(1);
    // 知らない出来事は無視する
    expect(enterPlayEvent(log, flow, 'nope', t1)).toEqual(log);
  });

  it('「はじめから」の回数と、戦闘の勝ち負けを数える', () => {
    let log = recordPlayStart(recordPlayStart(createPlayLog(t0)));
    log = recordPlayBattle(log, 'x', true);
    log = recordPlayBattle(log, 'x', false);
    log = recordPlayBattle(log, 'x', false);
    expect(log.starts).toBe(2);
    expect(log.events.x).toEqual({ ms: 0, wins: 1, losses: 2 });
  });

  it('保存した文字から読み戻せる。壊れていたら新しい記録、今の流れにない出来事は捨てる', () => {
    let log = enterPlayEvent(createPlayLog(t0), flow, 'x', t0);
    log = recordPlayBattle(addPlayTime(log, 'x', 9000, t1), 'x', false);
    expect(parsePlayLog(serializePlayLog(log), flow, t1)).toEqual(log);
    expect(parsePlayLog('{', flow, t1)).toEqual(createPlayLog(t1));
    expect(parsePlayLog(null, flow, t1)).toEqual(createPlayLog(t1));
    const odd = parsePlayLog(
      JSON.stringify({ startedAt: 'x', starts: -3, events: { gone: { ms: 5 }, a: { ms: 'q', wins: 2.7 } }, furthest: 'gone', last: 'a', lastAt: t1.toISOString(), finished: 1 }),
      flow,
      t1,
    );
    expect(odd.startedAt).toBe(t1.toISOString());
    expect(odd.starts).toBe(0);
    expect(odd.events).toEqual({ a: { ms: 0, wins: 2, losses: 0 } });
    expect(odd.furthest).toBeNull();
    expect(odd.last).toBe('a');
  });

  it('記録の画面の形：流れの順の行と、合わせた時間・負けた回数', () => {
    let log = enterPlayEvent(createPlayLog(t0), flow, 'x', t0);
    log = addPlayTime(addPlayTime(log, 'a', 4000, t0), 'x', 6000, t0);
    log = recordPlayBattle(log, 'x', false);
    const s = summarizePlayLog(log, flow);
    expect(s.rows.map((r) => r.id)).toEqual(['a', 'x', 'b', 'end']);
    expect(s.rows.map((r) => r.reached)).toEqual([true, true, false, false]);
    expect(s.totalMs).toBe(10000);
    expect(s.totalLosses).toBe(1);
  });

  it('時間の書き方', () => {
    expect(formatPlayTime(0)).toBe('0:00');
    expect(formatPlayTime(65_400)).toBe('1:05');
    expect(formatPlayTime(3_725_000)).toBe('1:02:05');
  });

  it('記録の画面では、日ごと・区画ごとの行にまとめる。日の行は探索以外を合わせる（段階34）', () => {
    const f: Flow = [
      { id: 'p', name: 'プロローグ', events: [{ id: 'a', kind: 'dialogue', title: 'A' }] },
      {
        id: 'c1',
        name: '1章',
        events: [
          { id: 'd1', kind: 'day', title: '1日目', day: 1 },
          { id: 'b', kind: 'dialogue', title: 'B' },
          { id: 'x', kind: 'explore', title: '探索', area: 'a11' },
          { id: 'c', kind: 'dialogue', title: 'C' },
          { id: 'd2', kind: 'day', title: '2日目', day: 2 },
          { id: 'end', kind: 'end', title: 'つづく' },
        ],
      },
    ];
    let log = enterPlayEvent(createPlayLog(t0), f, 'c', t0);
    log = addPlayTime(addPlayTime(addPlayTime(log, 'b', 1000, t0), 'x', 5000, t0), 'c', 2000, t0);
    log = recordPlayBattle(recordPlayBattle(log, 'x', true), 'x', false);
    const secs = playLogSections(summarizePlayLog(log, f).rows, f);
    expect(secs.map((s) => [s.title, s.explore, s.ms, s.wins, s.losses, s.reached])).toEqual([
      ['プロローグ', false, 0, 0, 0, true],
      ['1日目', false, 3000, 0, 0, true],
      ['探索', true, 5000, 1, 1, true],
      ['2日目', false, 0, 0, 0, false],
    ]);
    expect(secs[1].ids).toEqual(['d1', 'b', 'c']);
  });

  it('晩に分けた区画は、晩ごとの探索を1行にまとめる（段階78）', () => {
    const f: Flow = [
      { id: 'p', name: 'プロローグ', events: [{ id: 'a', kind: 'dialogue', title: 'A' }] },
      {
        id: 'c1',
        name: '1章',
        events: [
          { id: 'd1', kind: 'day', title: '1日目', day: 1 },
          { id: 'x1', kind: 'explore', title: '区画：1晩目', area: 'z', night: 1 },
          { id: 'd2', kind: 'day', title: '2日目', day: 2 },
          { id: 'x2', kind: 'explore', title: '区画：2晩目', area: 'z', night: 2 },
          { id: 'y', kind: 'explore', title: 'ほかの区画', area: 'w' },
        ],
      },
    ];
    let log = createPlayLog(t0);
    log = addPlayTime(addPlayTime(log, 'x1', 4000, t0), 'x2', 6000, t0);
    log = recordPlayBattle(recordPlayBattle(log, 'x1', true), 'x2', true);
    const secs = playLogSections(summarizePlayLog(log, f).rows, f);
    expect(secs.map((s) => [s.title, s.explore, s.ms, s.wins])).toEqual([
      ['プロローグ', false, 0, 0],
      ['1日目', false, 0, 0],
      ['区画：1晩目', true, 10000, 2],
      ['2日目', false, 0, 0],
      ['ほかの区画', true, 0, 0],
    ]);
    expect(secs[2].ids).toEqual(['x1', 'x2']);
  });

  it('今の流れは、まとめた行なら記録の画面の1画面に入る数（段階34）', () => {
    const rows = summarizePlayLog(createPlayLog(t0), SLICE_FLOW).rows;
    // 段階85：2章が20日になったので、行の高さを詰めて26行まで入るようにした（PlayLogScene の ROW_H）。
    // 段階88：3章で入らなくなったので、24行ずつの頁に分けた（PlayLogScene の PAGE_ROWS）。頁は多すぎない
    const secs = playLogSections(rows, SLICE_FLOW);
    const { pages } = playLogPages(secs, 24, null);
    expect(pages.flat()).toEqual(secs);
    expect(pages.every((p) => p.length <= 24)).toBe(true);
    expect(pages.length).toBeLessThanOrEqual(3);
  });

  it('記録の頁：最初に見せるのは、今いる出来事の行がある頁（段階88）', () => {
    const secs = [{ ids: ['a'] }, { ids: ['b'] }, { ids: ['c', 'd'] }].map((x) => ({ title: '', explore: false, ms: 0, wins: 0, losses: 0, reached: true, ...x }));
    expect(playLogPages(secs, 2, 'd').start).toBe(1);
    expect(playLogPages(secs, 2, 'a').start).toBe(0);
    expect(playLogPages(secs, 2, null).start).toBe(0);
    expect(playLogPages([], 2, null).pages).toEqual([[]]);
  });
});

describe('遊んだ記録：M2 で足した遊びの回数（段階45）', () => {
  it('記憶をたどる・交換・落とし物・ポーチの回数を足し、保存して読み戻せる（前の記録は0から）', () => {
    let log = createPlayLog(new Date('2026-10-16T00:00:00Z'));
    expect(log.counts).toEqual({ hunt: 0, exchange: 0, lost: 0, pouch: 0 });
    log = recordPlayCount(recordPlayCount(log, 'hunt'), 'pouch', 2);
    expect(log.counts).toEqual({ hunt: 1, exchange: 0, lost: 0, pouch: 2 });
    expect(parsePlayLog(serializePlayLog(log), SLICE_FLOW, new Date()).counts).toEqual(log.counts);
    const old = JSON.parse(serializePlayLog(log));
    delete old.counts;
    expect(parsePlayLog(JSON.stringify(old), SLICE_FLOW, new Date()).counts).toEqual({ hunt: 0, exchange: 0, lost: 0, pouch: 0 });
  });
});
