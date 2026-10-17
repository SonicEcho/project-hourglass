import { describe, expect, it } from 'vitest';
import { addPlaytime, breakPlaytime, emptyPlaytime, formatDuration, formatPlaytime, normalizePlaytime } from '../../src/core';

// プレイ時間の記録（段階63。デバッグの時だけ）
const talk = { event: 'd1_morning', scene: 'Dialogue', detail: 'd1_morning' };
const fight = { event: 'a11_explore', scene: 'Battle', detail: 'a11_n1_gate' };
const walk = { event: 'a11_explore', scene: 'Explore', detail: 'a11 1晩目 fest_gate' };

describe('プレイ時間の記録（段階63）', () => {
  it('場所ごとに時間を足す。続けて同じ場所なら来た回数は増えず、途切れたり離れて戻ったりすると増える', () => {
    let log = emptyPlaytime();
    log = addPlaytime(log, talk, 1000);
    log = addPlaytime(log, talk, 1000);
    log = addPlaytime(log, walk, 1000);
    log = addPlaytime(log, fight, 1000);
    log = addPlaytime(log, walk, 1000);
    log = breakPlaytime(log);
    log = addPlaytime(log, walk, 500);
    const at = (l: typeof talk) => Object.values(log.entries).find((e) => e.detail === l.detail)!;
    expect(at(talk)).toMatchObject({ ms: 2000, visits: 1 });
    expect(at(walk)).toMatchObject({ ms: 2500, visits: 3 });
    expect(log.order.length).toBe(3);
    expect(addPlaytime(log, talk, 0)).toBe(log);
  });

  it('時間の書き方', () => {
    expect(formatDuration(65_000)).toBe('1分05秒');
    expect(formatDuration(3_725_000)).toBe('1時間02分05秒');
  });

  it('読める文：合計、出来事ごと（流れの順）、画面の種類ごと、長かった所', () => {
    let log = emptyPlaytime();
    log = addPlaytime(log, fight, 90_000);
    log = addPlaytime(log, talk, 30_000);
    log = addPlaytime(log, walk, 60_000);
    const text = formatPlaytime(log, [
      { id: 'd1_morning', title: '1日目：朝' },
      { id: 'a11_explore', title: '1-1：縁日の1晩目' },
    ]);
    expect(text).toContain('合計 3分00秒');
    expect(text.indexOf('1日目：朝')).toBeLessThan(text.indexOf('1-1：縁日の1晩目'));
    expect(text).toContain('2分30秒　1-1：縁日の1晩目');
    expect(text).toContain('戦闘：a11_n1_gate');
    expect(text).toContain('1分30秒　戦闘（50%）');
  });

  it('保存した記録を読み戻す（形の違うものは捨てる）', () => {
    const log = addPlaytime(emptyPlaytime(), talk, 1000);
    const back = normalizePlaytime(JSON.parse(JSON.stringify(log)));
    expect(back.entries).toEqual(log.entries);
    expect(back.order).toEqual(log.order);
    expect(normalizePlaytime(null)).toEqual(emptyPlaytime());
    expect(normalizePlaytime({ entries: { x: { event: 1 } }, order: ['x'] })).toEqual(emptyPlaytime());
  });
});
