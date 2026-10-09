import { describe, expect, it } from 'vitest';
import type { Flow } from '../../src/core';
import {
  addPlayTime,
  createPlayLog,
  enterPlayEvent,
  formatPlayTime,
  parsePlayLog,
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

  it('M1 の流れの出来事は、記録の画面の1画面に入る数', () => {
    expect(summarizePlayLog(createPlayLog(t0), SLICE_FLOW).rows.length).toBeLessThanOrEqual(24);
  });
});
