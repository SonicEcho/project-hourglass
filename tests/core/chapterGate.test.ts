import { describe, expect, it } from 'vitest';
import type { GrowthState } from '../../src/core';
import { areaChapter, eventPassed, flowEvents, chapterLocked, createArmory, createGrowth, getOpenError, huntRewardRate, openableNodes, openNode, recordVictory } from '../../src/core';
import { AREAS, CHAPTER1_LINEUP, CHAPTER2_LINEUP, GROWTH_MAP, HERO, HUB_SCENES, HUNT_OLD_AREA_RATE, PARTY, SCENES, SLICE_FLOW, WEAPON_DATA } from '../../src/data';

// 章の区切り（段階49。docs/design/economy.md の 2.・7.）：星図の区域は章で広がる。狩りで前の章の区画は、星の砂と経験値が半分
describe('星図の章の鍵（段階49）', () => {
  it('はくちょう座（17の星）は2章、ヘルクレス座（11の星。段階91a）は3章、ケフェウス座（9の星。段階140a）は4章の区域。ほかはいつでも（段階56）', () => {
    const locked = GROWTH_MAP.nodes.filter((n) => n.chapter !== undefined);
    expect(locked.length).toBe(37);
    expect(locked.every((n) => (n.con === 'cyg' && n.chapter === 2) || (n.con === 'her' && n.chapter === 3) || (n.con === 'cep' && n.chapter === 4))).toBe(true);
  });

  it('1章では開けられず、2章と章のない時（試作の5戦）は開けられる', () => {
    // 1章のまま開けられるマスを開けていき、章の鍵のマスが隣に来るまで進める（星の砂はたっぷり）
    let g: GrowthState = createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), 999);
    const lockedNext = () => openableNodes(GROWTH_MAP, g, HERO.id).find((n) => chapterLocked(n, 1));
    for (let i = 0; i < 60 && !lockedNext(); i++) {
      const next = openableNodes(GROWTH_MAP, g, HERO.id).find((n) => getOpenError(GROWTH_MAP, g, HERO, n.id, 1) === null);
      if (!next) break;
      g = openNode(GROWTH_MAP, g, HERO, next.id, 1);
    }
    const target = lockedNext()!.id;
    expect(chapterLocked(GROWTH_MAP.nodes.find((n) => n.id === target)!, 1)).toBe(true);
    expect(getOpenError(GROWTH_MAP, g, HERO, target, 1)).toBe('chapter locked');
    expect(() => openNode(GROWTH_MAP, g, HERO, target, 1)).toThrow('chapter locked');
    expect(getOpenError(GROWTH_MAP, g, HERO, target, 2)).toBeNull();
    expect(getOpenError(GROWTH_MAP, g, HERO, target)).toBeNull();
  });
});

describe('狩りの報酬の割合（段階49）', () => {
  it('区画の章は物語の流れから決まる（1-1・1-2 は1章、2-1〜2-3 は2章）。章のパーティには章の番号がある', () => {
    expect(['a11', 'a12'].map((a) => areaChapter(SLICE_FLOW, a))).toEqual([1, 1]);
    expect(['a21', 'a22', 'a23'].map((a) => areaChapter(SLICE_FLOW, a))).toEqual([2, 2, 2]);
    expect(areaChapter(SLICE_FLOW, 'nowhere')).toBeUndefined();
    for (const id of Object.keys(AREAS)) expect(areaChapter(SLICE_FLOW, id), id).toBeDefined();
    expect([CHAPTER1_LINEUP.chapter, CHAPTER2_LINEUP.chapter]).toEqual([1, 2]);
  });

  it('今の章の区画は全部、前の章の区画は半分。章が分からなければ全部', () => {
    expect(HUNT_OLD_AREA_RATE).toBe(0.5);
    expect(huntRewardRate(2, 2, HUNT_OLD_AREA_RATE)).toBe(1);
    expect(huntRewardRate(1, 2, HUNT_OLD_AREA_RATE)).toBe(0.5);
    expect(huntRewardRate(undefined, 2, HUNT_OLD_AREA_RATE)).toBe(1);
    expect(huntRewardRate(1, undefined, HUNT_OLD_AREA_RATE)).toBe(1);
  });

  it('経験値の割合：行動の回数に割合をかけて切り捨て。素材は割合に関係なく入る（上限はない）', () => {
    const a = createArmory(WEAPON_DATA);
    const half = recordVictory(a, { actions: { hero: 7, akari: 1 }, colorCells: {}, items: ['maskShard'], expRate: 0.5 });
    expect(half.weapons.hero.exp).toBe(3);
    expect(half.weapons.akari.exp).toBe(0);
    expect(half.items.maskShard).toBe(1);
    expect(recordVictory(a, { actions: { hero: 7 }, colorCells: {}, items: [] }).weapons.hero.exp).toBe(7);
  });
});

describe('レストピアの拠点の会話（段階50）', () => {
  it('物語の流れで、ある出来事を過ぎたか（今の出来事はまだ過ぎていない。知らない id は過ぎていない）', () => {
    const ids = flowEvents(SLICE_FLOW).map((e) => e.id);
    expect(eventPassed(SLICE_FLOW, ids[3], ids[2])).toBe(true);
    expect(eventPassed(SLICE_FLOW, ids[3], ids[3])).toBe(false);
    expect(eventPassed(SLICE_FLOW, ids[2], ids[3])).toBe(false);
    expect(eventPassed(SLICE_FLOW, ids[2], 'nowhere')).toBe(false);
  });

  it('拠点の会話は台本にあり、条件の出来事は物語の流れにある', () => {
    for (const h of HUB_SCENES) {
      expect(SCENES.some((s) => s.id === h.scene), h.scene).toBe(true);
      if (h.after) expect(flowEvents(SLICE_FLOW).some((e) => e.id === h.after), h.after).toBe(true);
    }
  });
});
