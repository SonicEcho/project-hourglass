import { describe, expect, it } from 'vitest';
import type { Flow } from '../../src/core';
import { advanceFlow, chapterOfEvent, checkFlow, dayAt, dialogueRun, eventNumber, findEvent, firstEventId, isPlaceholder, moveToEvent, nextEvent, returnDays } from '../../src/core';

const flow: Flow = [
  { id: 'p', name: 'プロローグ', events: [{ id: 'a', kind: 'dialogue', title: 'A' }, { id: 'b', kind: 'dialogue', title: 'B' }] },
  {
    id: 'c1',
    name: '1章',
    events: [
      { id: 'd1', kind: 'day', title: '1日目', day: 1 },
      { id: 'c', kind: 'dialogue', title: 'C' },
      { id: 'x', kind: 'explore', title: '探索', note: '仮' },
      { id: 'e', kind: 'dialogue', title: 'E' },
      { id: 'd2', kind: 'day', title: '2日目', day: 2 },
      { id: 'f', kind: 'dialogue', title: 'F' },
      { id: 'end', kind: 'end', title: 'つづく' },
    ],
  },
];

describe('物語の流れ（段階23）', () => {
  it('最初の出来事から、章をまたいで順に進む', () => {
    expect(firstEventId(flow)).toBe('a');
    let pos = { event: firstEventId(flow), day: 1 };
    const seen = [pos.event];
    while (findEvent(flow, pos.event)!.kind !== 'end') {
      pos = advanceFlow(flow, pos);
      seen.push(pos.event);
    }
    expect(seen).toEqual(['a', 'b', 'd1', 'c', 'x', 'e', 'd2', 'f', 'end']);
  });

  it('「つづく」より先へは進まない', () => {
    expect(nextEvent(flow, 'end')).toBeNull();
    expect(advanceFlow(flow, { event: 'end', day: 2 })).toEqual({ event: 'end', day: 2 });
  });

  it('何日目は、最後に日が変わった出来事で決まる', () => {
    expect(dayAt(flow, 'a')).toBe(1);
    expect(dayAt(flow, 'e')).toBe(1);
    expect(dayAt(flow, 'd2')).toBe(2);
    expect(advanceFlow(flow, { event: 'e', day: 1 })).toEqual({ event: 'd2', day: 2 });
    expect(moveToEvent(flow, 'f')).toEqual({ event: 'f', day: 2 });
    expect(() => moveToEvent(flow, 'nope')).toThrow();
  });

  it('会話の出来事が続く所までを、まとめて読める', () => {
    expect(dialogueRun(flow, 'a')).toEqual(['a', 'b']);
    expect(dialogueRun(flow, 'c')).toEqual(['c']);
    expect(dialogueRun(flow, 'x')).toEqual([]);
  });

  it('仮の画面の出来事：会話・昼の日常は案内のあるもの、探索・時間を返すは区画のないもの。会話は仮の手前でまとめるのをやめる（段階34）', () => {
    expect(isPlaceholder({ id: 'a', kind: 'dialogue', title: 'A' })).toBe(false);
    expect(isPlaceholder({ id: 'a', kind: 'dialogue', title: 'A', note: '仮' })).toBe(true);
    expect(isPlaceholder({ id: 'a', kind: 'daily', title: 'A', note: '仮' })).toBe(true);
    expect(isPlaceholder({ id: 'a', kind: 'explore', title: 'A', area: 'a11' })).toBe(false);
    expect(isPlaceholder({ id: 'a', kind: 'return', title: 'A' })).toBe(true);
    // 段階36：区画の id を書いた探索・返すも、案内があれば仮の画面
    expect(isPlaceholder({ id: 'a', kind: 'explore', title: 'A', area: 'a12', note: '仮' })).toBe(true);
    expect(isPlaceholder({ id: 'a', kind: 'day', title: 'A', day: 1 })).toBe(false);
    const f: Flow = [
      {
        id: 'c',
        name: '章',
        events: [
          { id: 'a', kind: 'dialogue', title: 'A' },
          { id: 'b', kind: 'dialogue', title: 'B', note: '仮' },
          { id: 'c', kind: 'dialogue', title: 'C' },
          { id: 'end', kind: 'end', title: 'つづく' },
        ],
      },
    ];
    expect(dialogueRun(f, 'a')).toEqual(['a']);
    expect(dialogueRun(f, 'b')).toEqual([]);
    expect(dialogueRun(f, 'c')).toEqual(['c']);
    expect(checkFlow(f)).toEqual([]);
    const noNote: Flow = [{ id: 'c', name: '章', events: [{ id: 'x', kind: 'explore', title: 'X' }, { id: 'end', kind: 'end', title: 'つづく' }] }];
    expect(checkFlow(noNote)).toEqual(['仮の画面に案内がない：x']);
    // 物語の戦闘（段階40）は、戦闘の id が要る。会話の続きの1回の画面には入らない
    const battle: Flow = [{ id: 'c', name: '章', events: [{ id: 'k', kind: 'battle', title: 'K', battle: 'kai' }, { id: 'n', kind: 'battle', title: 'N' }, { id: 'end', kind: 'end', title: 'つづく' }] }];
    expect(checkFlow(battle)).toEqual(['戦闘の出来事に戦闘の id がない：n']);
    expect(isPlaceholder(battle[0].events[0])).toBe(false);
  });

  it('章と、何番目かを引ける', () => {
    expect(chapterOfEvent(flow, 'x')?.id).toBe('c1');
    expect(chapterOfEvent(flow, 'nope')).toBeNull();
    expect(eventNumber(flow, 'c')).toEqual({ n: 3, total: 9 });
  });

  it('書き間違いを見つける', () => {
    expect(checkFlow(flow)).toEqual([]);
    const bad: Flow = [
      {
        id: 'c',
        name: '章',
        events: [
          { id: 'a', kind: 'dialogue', title: 'A' },
          { id: 'a', kind: 'day', title: '日' },
        ],
      },
    ];
    expect(checkFlow(bad)).toEqual(['出来事の id が重なっている：a', '日が変わる出来事に日の番号がない：a', '最後の出来事が「つづく」ではない']);
  });
});

describe('返した日（段階36）', () => {
  const f: Flow = [
    {
      id: 'c',
      name: '章',
      events: [
        { id: 'day1', kind: 'day', title: '1日目', day: 1 },
        { id: 'r1', kind: 'return', title: '返す', area: 'a11' },
        { id: 'day2', kind: 'day', title: '2日目', day: 2 },
        { id: 'free2', kind: 'daily', title: '昼' },
        { id: 'day3', kind: 'day', title: '3日目', day: 3 },
        { id: 'r2', kind: 'return', title: '返す（仮）', area: 'a12', note: '仮' },
        { id: 'day4', kind: 'day', title: '4日目', day: 4 },
        { id: 'free4', kind: 'daily', title: '昼' },
        { id: 'end', kind: 'end', title: 'つづく' },
      ],
    },
  ];

  it('今の出来事より前の返す出来事ごとに、返した日。中身のある返す出来事は、返した記録にある区画だけ', () => {
    expect(returnDays(f, 'free2', ['a11'])).toEqual({ a11: 1 });
    // 負け戦などで返せなかった区画は入らない
    expect(returnDays(f, 'free2', [])).toEqual({});
    // 仮の画面の返す出来事は、通ったら返したことにする。まだ通っていない返す出来事は入らない
    expect(returnDays(f, 'free4', ['a11'])).toEqual({ a11: 1, a12: 3 });
    expect(returnDays(f, 'r2', ['a11'])).toEqual({ a11: 1 });
  });
});
