import { describe, expect, it } from 'vitest';
import type { Story } from '../../src/core';
import { advance, allBattles, battleNumber, findBattle, normalizeProgress, placeOf, progressAt, startProgress, V1_AREA_ID, V1_CHAPTER_ID, v1BattleId } from '../../src/core';
import { CAMPAIGN, PROTOTYPE_AREA_ID, PROTOTYPE_CHAPTER_ID, STORY } from '../../src/data';

/** 2章・3区画の物語（テスト用） */
const story: Story = [
  { id: 'c1', name: '第1章', areas: [{ id: 'a1', name: '区画1', battles: [{ id: 'b1' }, { id: 'b2' }] }, { id: 'a2', name: '区画2', battles: [{ id: 'b3' }] }] },
  { id: 'c2', name: '第2章', areas: [{ id: 'empty', name: '空', battles: [] }, { id: 'a3', name: '区画3', battles: [{ id: 'b4' }] }] },
];

describe('進み具合：章 → 区画 → 戦闘', () => {
  it('最初の章・区画の最初の戦闘から、1日目で始まる', () => {
    expect(startProgress(story)).toEqual({ chapterId: 'c1', areaId: 'a1', battle: 0, day: 1 });
  });

  it('勝つと、同じ区画の次の戦闘 → 次の区画 → 次の章 → 最後まで終わった、と進む', () => {
    let p = startProgress(story);
    const events: string[] = [];
    const ids: string[] = [placeOf(story, p)!.battle.id];
    for (;;) {
      const r = advance(story, p);
      events.push(r.event);
      if (r.event === 'storyClear') {
        expect(r.progress).toEqual(p);
        break;
      }
      p = r.progress;
      ids.push(placeOf(story, p)!.battle.id);
    }
    expect(events).toEqual(['nextBattle', 'nextArea', 'nextChapter', 'storyClear']);
    // 戦闘のない区画は飛ばす
    expect(ids).toEqual(['b1', 'b2', 'b3', 'b4']);
  });

  it('進んでも何日目かは変わらない', () => {
    const r = advance(story, { ...startProgress(story), day: 3 });
    expect(r.progress.day).toBe(3);
  });

  it('最初から数えて何戦目か、と、その逆', () => {
    expect(allBattles(story).map((b) => b.id)).toEqual(['b1', 'b2', 'b3', 'b4']);
    for (let n = 0; n < 4; n++) expect(battleNumber(story, progressAt(story, n))).toBe(n);
    expect(progressAt(story, 3)).toEqual({ chapterId: 'c2', areaId: 'a3', battle: 0, day: 1 });
    expect(() => progressAt(story, 4)).toThrow();
  });

  it('戦闘の名前から探せる', () => {
    expect(findBattle(story, 'b3')).toEqual({ id: 'b3' });
    expect(findBattle(story, 'none')).toBeNull();
  });

  it('物語にない場所は null', () => {
    expect(placeOf(story, { chapterId: 'c1', areaId: 'a1', battle: 5, day: 1 })).toBeNull();
    expect(placeOf(story, { chapterId: 'x', areaId: 'a1', battle: 0, day: 1 })).toBeNull();
  });

  it('セーブから読んだ進み具合を、物語の範囲に収める', () => {
    expect(normalizeProgress(story, { chapterId: 'c1', areaId: 'a1', battle: 9, day: 2 })).toEqual({ chapterId: 'c1', areaId: 'a1', battle: 1, day: 2 });
    expect(normalizeProgress(story, { chapterId: 'c2', areaId: 'gone', battle: 0, day: 0 })).toEqual({ chapterId: 'c2', areaId: 'a3', battle: 0, day: 1 });
    expect(normalizeProgress(story, { chapterId: 'gone' })).toEqual(startProgress(story));
  });
});

describe('進み具合：今の試作のデータ', () => {
  it('試作は1章・1区画で、今までの5戦がその順に並ぶ。最後の戦闘（ボス）に勝つと終わり', () => {
    expect(allBattles(STORY)).toEqual(CAMPAIGN);
    expect(new Set(CAMPAIGN.map((b) => b.id)).size).toBe(CAMPAIGN.length);
    const last = progressAt(STORY, CAMPAIGN.length - 1);
    expect(placeOf(STORY, last)!.battle.boss).toBe(true);
    expect(advance(STORY, last).event).toBe('storyClear');
  });

  it('版1のセーブの章・区画・戦闘の名前が、今の試作のデータと合っている（移行が正しく働くように）', () => {
    expect([PROTOTYPE_CHAPTER_ID, PROTOTYPE_AREA_ID]).toEqual([V1_CHAPTER_ID, V1_AREA_ID]);
    CAMPAIGN.forEach((b, i) => expect(b.id).toBe(v1BattleId(i)));
  });

  it('戦闘1〜4にはギアの報酬があり、ボスにはない', () => {
    expect(CAMPAIGN.map((b) => !!b.naviReward)).toEqual([true, true, true, true, false]);
  });
});
