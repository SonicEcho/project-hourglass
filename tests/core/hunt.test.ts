import { describe, expect, it } from 'vitest';
import type { AreaDef, DailyHub, HuntableArea } from '../../src/core';
import { allSpots, areaGrid, checkHunt, huntArea, huntableAreas, isWalkable, passDoor, picksLeft, resolveHub, spotState, startExplore, usesPick } from '../../src/core';

// 部屋2つの区画：入口（S・P）の上の出入口は、番人を倒すと奥（ぬし）へ開く
const room = (id: string, start: boolean, exits: ('top' | 'bottom')[]): AreaDef['rooms'][number] => ({
  id,
  exits,
  layout: [
    exits.includes('top') ? '##....##' : '########',
    '#......#',
    '#......#',
    start ? '#..P...#' : '#......#',
    start ? '#..S...#' : '#......#',
    '#......#',
    exits.includes('bottom') ? '##....##' : '########',
  ],
});
const base: HuntableArea = {
  id: 'h',
  name: '狩りのテスト',
  rooms: [room('gate', true, ['top']), room('inner', false, ['bottom'])],
  links: [{ a: { room: 'gate', side: 'top' }, b: { room: 'inner', side: 'bottom' }, opensWhen: 'guard' }],
  chests: [{ id: 'chest', cell: [6, 1], items: ['potion'], snaps: ['joker'] }],
  enemies: [
    { id: 'e1', patrol: [[1, 2], [6, 2]], battle: 'b1' },
    { id: 'guard', patrol: [[3, 1]], battle: 'bg', move: 'guard' },
    { id: 'e2', room: 'inner', patrol: [[1, 2], [6, 2]], battle: 'b2' },
  ],
  boss: { id: 'boss', room: 'inner', cell: [3, 1], battle: 'bb' },
  talkers: [{ id: 'v', cell: [1, 5], scene: 'voice', label: '人' }],
  triggers: [{ on: 'boss', scene: 'before' }],
  komaNeed: 3,
  hunt: {
    gathers: [{ id: 'g1', cell: [6, 5], items: ['ore'] }],
    tables: { inner: ['b2', 'b3', 'bg'] },
  },
};
const battles = { b1: 1, b2: 1, b3: 1, bg: 1, bb: 1 };

describe('周回・狩り（段階43）', () => {
  it('狩りの区画：番人・話せる人・会話・宝箱を除き、採取の場所を置き、閉じた出入口を開ける', () => {
    const area = huntArea(base, 1);
    expect(area.enemies.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(area.talkers).toEqual([]);
    expect(area.triggers).toEqual([]);
    expect(area.chests).toEqual([{ id: 'g1', cell: [6, 5], items: ['ore'] }]);
    expect(area.hunt).toBeUndefined();
    expect(area.boss).toEqual(base.boss);
    // 番人を倒していなくても、上の出入口から奥へ入れる
    const s = startExplore(area);
    const moved = passDoor(area, s, [3, 0]);
    expect(moved?.type).toBe('moved');
    // 1回目の区画は閉じたまま
    expect(passDoor(base, startExplore(base), [3, 0])?.type).toBe('locked');
    // 採取の場所のマスは、宝箱と同じく通れない
    expect(isWalkable(areaGrid(area, 'gate'), [6, 5])).toBe(false);
  });

  it('敵の表を書いた部屋の砂嵐は、入るたびに表から戦闘を選ぶ（同じ salt なら同じ。書いていない部屋はそのまま）', () => {
    const picks = new Set<string>();
    for (let salt = 0; salt < 40; salt++) {
      const area = huntArea(base, salt);
      expect(area.enemies[0].battle).toBe('b1');
      picks.add(area.enemies[1].battle);
      expect(huntArea(base, salt).enemies[1].battle).toBe(area.enemies[1].battle);
    }
    expect(picks).toEqual(new Set(['b2', 'b3', 'bg']));
  });

  it('入れる区画は、返した区画のうち狩りの中身を書いたものだけ（区画の並びの順）', () => {
    const { hunt: _, ...noHunt } = base;
    const areas: Record<string, AreaDef> = { a: { ...base, id: 'a' }, b: { ...noHunt, id: 'b' }, c: { ...base, id: 'c' } };
    expect(huntableAreas(areas, []).map((a) => a.id)).toEqual([]);
    expect(huntableAreas(areas, ['c', 'b', 'a']).map((a) => a.id)).toEqual(['a', 'c']);
  });

  it('書き間違いを見つける', () => {
    expect(checkHunt(base, battles)).toEqual([]);
    const bad: HuntableArea = {
      ...base,
      hunt: {
        gathers: [
          { id: 'g1', cell: [0, 0], items: ['ore'] },
          { id: 'g1', cell: [3, 3], items: [] },
          { id: 'g3', room: 'nowhere', cell: [1, 1], items: ['ore'] },
        ],
        tables: { inner: [], attic: ['b9'] },
      },
    };
    expect(checkHunt(bad, battles)).toEqual([
      'h：採取の場所の id が重なっている',
      'h：採取の場所 g1 が通れないマス（0,0）にある',
      'h：採取の場所 g1 がチェックポイントか出発点の上にある',
      'h：採取の場所 g1 に何もない',
      'h：採取の場所 g3 の部屋 nowhere がない',
      'h：部屋 inner の敵の表が空',
      'h：敵の表の部屋 attic がない',
      'h：部屋 attic の敵の表に、ない戦闘 b9',
      '記憶をたどる：h：宝箱 g1 が通れないマス（0,0）にある',
      '記憶をたどる：h：宝箱 g1 の隣に立てるマスがない',
      '記憶をたどる：h：宝箱 g3 の部屋 nowhere がない',
      '記憶をたどる：h：id が重なっている：g1',
    ]);
  });

  it('日常のレストピアの拠点の入口（段階43の狩りの入口から替えた）：時計屋に足す（場所がなければ町の地図から）。回数を使わず、いつも選べる', () => {
    const info = (id: string) => ({ id, name: id, backdrop: 'black', mapX: 0, mapY: 0 });
    const hub: DailyHub = {
      id: 'd3',
      time: '',
      day: 3,
      picks: 1,
      places: [
        { ...info('school'), spots: [{ id: 't', scene: 't', label: '小話', mark: 'talk', x: 0, y: 0 }] },
        { ...info('shop'), spots: [{ id: 'go', label: '→', mark: 'go', x: 0, y: 0, ends: true }] },
      ],
    };
    const town = { school: info('school'), shop: info('shop'), clockshop: info('clockshop') };
    const huntSpot = { place: 'clockshop', spot: { id: 'hunt', label: '拠点', mark: 'hub' as const, x: 0, y: 0 } };
    const built = resolveHub(hub, {}, {}, town, [], huntSpot);
    expect(built.places.map((p) => p.id)).toEqual(['school', 'clockshop', 'shop']);
    const spot = allSpots(built).find((s) => s.id === 'hunt')!;
    expect(usesPick(spot)).toBe(false);
    // 昼の回数を使い切っても、狩りは選べる
    const spent = { '見た:t': '1' };
    expect(picksLeft(built, spent)).toBe(0);
    expect(spotState(built, spent, spot)).toBe('open');
    // 渡さなければ出ない
    expect(allSpots(resolveHub(hub, {}, {}, town)).some((s) => s.id === 'hunt')).toBe(false);
  });
});
