import { describe, expect, it } from 'vitest';
import type { AreaDef, AreaHunt, DailyHub } from '../../src/core';
import { allSpots, checkHunt, picksLeft, resolveHub, spotState, usesPick } from '../../src/core';

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
const base: AreaDef & { hunt: AreaHunt } = {
  id: 'h',
  name: '狩りのテスト',
  rooms: [room('gate', true, ['top']), room('inner', false, ['bottom'])],
  links: [{ a: { room: 'gate', side: 'top' }, b: { room: 'inner', side: 'bottom' }, opensWhen: 'guard' }],
  chests: [{ id: 'chest', cell: [6, 1], items: ['potion'], chainSnaps: ['c17_quick'] }],
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
  },
};

// 段階237：探索の画面の狩り（記憶をたどる）は外した。採取の場所（砂の底の帯で使う）の書き間違いと、拠点の入口を確かめる
describe('採取の場所と拠点の入口（段階43）', () => {
  it('書き間違いを見つける', () => {
    expect(checkHunt(base)).toEqual([]);
    const bad: AreaDef & { hunt: AreaHunt } = {
      ...base,
      hunt: {
        gathers: [
          { id: 'g1', cell: [0, 0], items: ['ore'] },
          { id: 'g1', cell: [3, 3], items: [] },
          { id: 'g3', room: 'nowhere', cell: [1, 1], items: ['ore'] },
        ],
      },
    };
    expect(checkHunt(bad)).toEqual([
      'h：採取の場所の id が重なっている',
      'h：採取の場所 g1 が通れないマス（0,0）にある',
      'h：採取の場所 g1 がチェックポイントか出発点の上にある',
      'h：採取の場所 g1 に何もない',
      'h：採取の場所 g3 の部屋 nowhere がない',
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
