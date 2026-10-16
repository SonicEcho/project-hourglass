import { describe, expect, it } from 'vitest';
import type { HuntableArea, LostItemDef } from '../../src/core';
import {
  acceptLost,
  activeLostCount,
  checkArea,
  deliverLost,
  findLost,
  getAcceptError,
  getDeliverError,
  huntArea,
  lostKey,
  lostOfSpot,
  lostSpots,
  lostStatus,
  shelfLost,
} from '../../src/core';
import { areaCommonItems, AREAS, CARDS, CAST, FRAGMENTS, LOST_ACTIVE_MAX, LOST_ITEMS, NAVI_PARTS, SCENES, WEAPON_DATA } from '../../src/data';

// 落とし物（段階53。docs/design/economy.md の 5-3）
const find: LostItemDef = { id: 'f', name: 'f', area: 'a11', owner: 'ゆうま', text: '', kind: 'find', spot: { cell: [1, 2] }, deliverScene: 'x', reward: { fragments: ['courage'] } };
const bring: LostItemDef = { id: 'b', name: 'b', area: 'a12', owner: 'ふみ', text: '', kind: 'bring', bring: { item: 'tinSpring', count: 2 }, deliverScene: 'y', reward: { items: ['potion'] } };
const defs = [find, bring];

describe('落とし物（段階53）', () => {
  it('棚に届くのは、返し終えた区画の分だけ', () => {
    expect(shelfLost(defs, []).map((d) => d.id)).toEqual([]);
    expect(shelfLost(defs, ['a12']).map((d) => d.id)).toEqual(['b']);
  });

  it('受ける：同時に受けられる数まで。2回は受けられない', () => {
    let vars: Record<string, string> = {};
    vars = acceptLost(defs, vars, 'f', 1);
    expect(lostStatus(vars, 'f')).toBe('accepted');
    expect(getAcceptError(defs, vars, 'f', 2)).toBe('already accepted');
    expect(getAcceptError(defs, vars, 'b', 1)).toBe('too many accepted');
    expect(getAcceptError(defs, vars, 'nope', 3)).toBe('unknown lost item');
    expect(activeLostCount(defs, vars)).toBe(1);
  });

  it('探し物：受けている間だけ、記憶をたどる区画に光る所が出る。拾うと見つけた、になり、届けられる', () => {
    let vars = acceptLost(defs, {}, 'f', 3);
    expect(lostSpots(defs, {}, 'a11')).toEqual([]);
    expect(lostSpots(defs, vars, 'a12')).toEqual([]);
    const spots = lostSpots(defs, vars, 'a11');
    expect(spots).toEqual([{ id: 'lost:f', cell: [1, 2], items: [] }]);
    expect(lostOfSpot(spots[0].id)).toBe('f');
    expect(lostOfSpot('a11_gather_goldfish')).toBeNull();
    expect(getDeliverError(find, vars, {})).toBe('not found yet');
    vars = findLost(vars, 'f');
    expect(lostSpots(defs, vars, 'a11')).toEqual([]);
    const r = deliverLost(find, vars, { items: {}, fragments: {} });
    expect(lostStatus(r.vars, 'f')).toBe('delivered');
    expect(r.fragments).toEqual({ courage: 1 });
    expect(getDeliverError(find, r.vars, {})).toBe('already delivered');
    // 受けていない物を見つけても変わらない
    expect(findLost({}, 'f')).toEqual({});
  });

  it('取り出す：素材を集めて届けると、素材を使い、ごほうびが入る', () => {
    const vars = acceptLost(defs, {}, 'b', 3);
    expect(getDeliverError(bring, vars, { tinSpring: 1 })).toBe('not enough items');
    const r = deliverLost(bring, vars, { items: { tinSpring: 3 }, fragments: {} });
    expect(r.items).toEqual({ tinSpring: 1, potion: 1 });
    expect(r.vars[lostKey('b')]).toBe('delivered');
    expect(getDeliverError(bring, {}, { tinSpring: 9 })).toBe('not accepted');
  });

  it('データ：2章までの区画に4つ。会話・相手・ごほうびは実在し、探し物の光る所は記憶をたどる区画の拾えるマスにある', () => {
    expect(LOST_ACTIVE_MAX).toBe(3);
    expect(LOST_ITEMS.length).toBe(4);
    const ids = LOST_ITEMS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const scenes = new Set(SCENES.map((s) => s.id));
    for (const d of LOST_ITEMS) {
      const area = AREAS[d.area];
      expect(area?.hunt, d.id).toBeDefined();
      expect(d.owner in CAST, d.id).toBe(true);
      expect(scenes.has(d.deliverScene), d.deliverScene).toBe(true);
      if (d.findScene) expect(scenes.has(d.findScene), d.findScene).toBe(true);
      for (const id of d.reward.items ?? []) expect(WEAPON_DATA.items[id], id).toBeDefined();
      for (const id of d.reward.fragments ?? []) expect(id in FRAGMENTS, id).toBe(true);
      for (const id of d.reward.gears ?? []) expect(id in NAVI_PARTS, id).toBe(true);
      for (const id of d.reward.snaps ?? []) expect(id in CARDS, id).toBe(true);
      if (d.kind === 'bring') expect(areaCommonItems(d.area), d.id).toContain(d.bring!.item);
      else {
        // 光る所を足した記憶をたどる区画が、書き間違いなく作れる
        const vars = { [lostKey(d.id)]: 'accepted' };
        const base = area as HuntableArea;
        const withSpot: HuntableArea = { ...base, hunt: { ...base.hunt, gathers: [...base.hunt.gathers, ...lostSpots(LOST_ITEMS, vars, d.area)] } };
        expect(checkArea(huntArea(withSpot, 1)), d.id).toEqual([]);
      }
    }
  });
});
