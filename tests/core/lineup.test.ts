import { describe, expect, it } from 'vitest';
import type { Flow, Lineup } from '../../src/core';
import { checkLineup, gaugeInChapter, lineupAt, lineupMembers, usableLinks } from '../../src/core';
import { AFTERGLOW, createCampaignSetup, CROSS_DRIVE, PARTY } from '../../src/data';

const two: Lineup = { members: ['akari', 'hero'], unlocks: { growth: true, navi: false, weapon: true } };
const all: Lineup = { members: ['hero', 'akari', 'mio'], unlocks: { growth: true, navi: true, weapon: true } };

describe('パーティと育成の開放（段階26）', () => {
  it('パーティにいる仲間だけを、パーティの並びの順に取り出す', () => {
    expect(lineupMembers(PARTY, two).map((c) => c.id)).toEqual(['akari', 'hero']);
    expect(lineupMembers(PARTY, all).map((c) => c.id)).toEqual(['hero', 'akari', 'mio']);
  });

  it('組む仲間がそろっていない連携技は使えない（1章はアフターグロウだけ）', () => {
    expect(usableLinks([AFTERGLOW, CROSS_DRIVE], ['hero', 'akari'])).toEqual([AFTERGLOW]);
    expect(usableLinks([AFTERGLOW, CROSS_DRIVE], ['hero', 'akari', 'mio'])).toEqual([AFTERGLOW, CROSS_DRIVE]);
  });

  it('戦闘の設定にも、使える連携技だけが入る', () => {
    const battle = { id: 'b', name: 'b', enemies: [], reward: 0 };
    expect(createCampaignSetup(battle, 1, lineupMembers(PARTY, two)).links).toEqual([AFTERGLOW]);
    expect(createCampaignSetup(battle, 1, PARTY).links).toEqual([AFTERGLOW, CROSS_DRIVE]);
  });

  it('章のパーティ：なければ前の章のもの、どこにもなければ予備', () => {
    const flow: Flow = [
      { id: 'p', name: 'p', events: [{ id: 'p1', kind: 'dialogue', title: '' }] },
      { id: 'c1', name: 'c1', lineup: two, events: [{ id: 'a', kind: 'dialogue', title: '' }] },
      { id: 'c2', name: 'c2', events: [{ id: 'b', kind: 'end', title: '' }] },
    ];
    expect(lineupAt(flow, 'p1', all)).toBe(all);
    expect(lineupAt(flow, 'a', all)).toBe(two);
    expect(lineupAt(flow, 'b', all)).toBe(two);
  });

  it('パーティの書き間違いを見つける', () => {
    const ids = PARTY.map((c) => c.id);
    expect(checkLineup(two, ids)).toEqual([]);
    expect(checkLineup({ ...two, members: [] }, ids)).toEqual(['パーティが空']);
    expect(checkLineup({ ...two, members: ['hero', 'hero', 'riku'] }, ids)).toEqual(['知らない仲間 riku', '仲間が重なっている：hero']);
  });

  it('引き継ぐつながりゲージは、同じ章の中だけ使える（章が変わると0。段階26の調整3）', () => {
    expect(gaugeInChapter({ chapter: 'ch1', value: 70 }, 'ch1')).toBe(70);
    expect(gaugeInChapter({ chapter: 'ch1', value: 70 }, 'ch2')).toBe(0);
    expect(gaugeInChapter(null, 'ch1')).toBe(0);
    expect(gaugeInChapter({ chapter: 'ch1', value: 70 }, undefined)).toBe(0);
  });
});
