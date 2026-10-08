import { describe, expect, it } from 'vitest';
import type { Flow } from '../../src/core';
import { advanceFlow, chapterOfEvent, checkFlow, dayAt, dialogueRun, eventNumber, findEvent, firstEventId, moveToEvent, nextEvent } from '../../src/core';

const flow: Flow = [
  { id: 'p', name: 'プロローグ', events: [{ id: 'a', kind: 'dialogue', title: 'A' }, { id: 'b', kind: 'dialogue', title: 'B' }] },
  {
    id: 'c1',
    name: '1章',
    events: [
      { id: 'd1', kind: 'day', title: '1日目', day: 1 },
      { id: 'c', kind: 'dialogue', title: 'C' },
      { id: 'x', kind: 'explore', title: '探索' },
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
