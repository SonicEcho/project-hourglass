import { describe, expect, it } from 'vitest';
import type { LostItemDef } from '../../src/core';
import {
  acceptLost,
  activeLostCount,
  deliverLost,
  getAcceptError,
  getDeliverError,
  bondExtras,
  bondPoints,
  deliveredLostCount,
  hearLostVoice,
  lostAfterwords,
  lostKey,
  lostVoicesHeard,
  wantsLostVoice,
  lostStatus,
  shelfLost,
} from '../../src/core';
import { AREAS, BOND_PARTNER_NAMES, CAST, CHAIN_SNAPS, FRAGMENTS, LOST_ACTIVE_MAX, LOST_ITEMS, NAVI_PARTS, SCENES, WEAPON_DATA, sandBottomFor } from '../../src/data';

// 落とし物（段階53。docs/design/economy.md の 5-3）
const find: LostItemDef = { id: 'f', name: 'f', area: 'a11', owner: 'ゆうま', text: '', kind: 'find', spot: { cell: [1, 2] }, deliverScene: 'x', reward: { fragments: ['courage'] } };
const bring: LostItemDef = { id: 'b', name: 'b', area: 'a12', owner: '富美', text: '', kind: 'bring', bring: { item: 'tinSpring', count: 2 }, deliverScene: 'y', reward: { items: ['potion'] } };
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

  // 段階237：記憶をたどる時の光る所（lostSpots・findLost）は外した。見つけた（found）になれば届けられる
  it('探し物：見つけた、になると届けられる', () => {
    let vars = acceptLost(defs, {}, 'f', 3);
    expect(getDeliverError(find, vars, {})).toBe('not found yet');
    vars = { ...vars, [lostKey('f')]: 'found' };
    const r = deliverLost(find, vars, { items: {}, fragments: {} });
    expect(lostStatus(r.vars, 'f')).toBe('delivered');
    expect(r.fragments).toEqual({ courage: 1 });
    expect(getDeliverError(find, r.vars, {})).toBe('already delivered');
  });

  it('取り出す：素材を集めて届けると、素材を使い、ごほうびが入る', () => {
    const vars = acceptLost(defs, {}, 'b', 3);
    expect(getDeliverError(bring, vars, { tinSpring: 1 })).toBe('not enough items');
    const r = deliverLost(bring, vars, { items: { tinSpring: 3 }, fragments: {} });
    expect(r.items).toEqual({ tinSpring: 1, potion: 1 });
    expect(r.vars[lostKey('b')]).toBe('delivered');
    expect(getDeliverError(bring, {}, { tinSpring: 9 })).toBe('not accepted');
  });

  it('データ：返す区画に1つずつ（段階242：9つ。祭りの夜は終章で）。どれも声をたどる形で、会話・相手・ご褒美・ひとことは実在する（段階220）', () => {
    expect(LOST_ACTIVE_MAX).toBe(3);
    // 段階244：最後はペトラの頼み（1-2 の記憶。4-1 を返した後に棚へ）
    expect(LOST_ITEMS.map((d) => d.area)).toEqual(['a11', 'a12', 'a21', 'a22', 'a23', 'a31', 'a32', 'a41', 'a42', 'a12']);
    const ids = LOST_ITEMS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const scenes = new Set(SCENES.map((s) => s.id));
    for (const d of LOST_ITEMS) {
      expect(AREAS[d.area], d.id).toBeDefined();
      expect(d.owner in CAST, d.id).toBe(true);
      expect(d.kind, d.id).toBe('voices');
      expect(d.voices?.length, d.id).toBe(3);
      for (const v of [...d.voices!, d.deliverScene]) expect(scenes.has(v), v).toBe(true);
      for (const id of d.reward.items ?? []) expect(WEAPON_DATA.items[id], id).toBeDefined();
      for (const id of d.reward.fragments ?? []) expect(id in FRAGMENTS, id).toBe(true);
      for (const id of d.reward.gears ?? []) expect(id in NAVI_PARTS, id).toBe(true);
      for (const id of d.reward.snaps ?? []) expect(id in CHAIN_SNAPS, id).toBe(true);
      // ご褒美は物より関係と話（ギア・スナップは配り直した）
      expect(d.reward.gears ?? [], d.id).toEqual([]);
      expect(d.reward.snaps ?? [], d.id).toEqual([]);
      expect(d.reward.bond! in BOND_PARTNER_NAMES, d.id).toBe(true);
      expect(d.afterwords?.length, d.id).toBeGreaterThan(0);
      for (const a of d.afterwords ?? []) if (a.after) expect(AREAS[a.after], a.after).toBeDefined();
    }
  });

  it('受けた依頼の声のかけらは、砂の底の、その区画の帯に1つだけ埋まる（段階220）', () => {
    const d = LOST_ITEMS.find((x) => x.id === 'a21_words')!;
    const relics = (vars: Record<string, string>) => sandBottomFor('ch3', vars).layers.flatMap((l) => l.relics ?? []);
    expect(relics({}).filter((r) => r === 'lost:a21_words')).toEqual([]);
    const vars = { [lostKey(d.id)]: 'accepted' };
    expect(relics(vars).filter((r) => r === 'lost:a21_words')).toHaveLength(1);
    // 全部聞いたら、もう埋まらない
    expect(relics({ ...vars, [lostKey(d.id)]: 'found', [`落とし物の声:${d.id}`]: '3' }).filter((r) => r === 'lost:a21_words')).toEqual([]);
  });
});

describe('声をたどる依頼（段階220）', () => {
  const v: LostItemDef = { id: 'v', name: 'v', area: 'a11', owner: 'ゆうま', text: '', kind: 'voices', voices: ['s1', 's2', 's3'], deliverScene: 'z', reward: { fragments: ['wonder'], bond: 'akari' }, afterwords: [{ speaker: 'あかり', text: 'a' }, { speaker: '早瀬', text: 'b', after: 'a42' }] };

  it('受けていないと聞けない。順に聞き、3つ目で見つけた（届けられる）になる', () => {
    expect(hearLostVoice(v, {}).scene).toBeNull();
    let vars = acceptLost([v], {}, 'v', 3);
    expect(wantsLostVoice(v, vars)).toBe(true);
    expect(getDeliverError(v, vars, {})).toBe('not found yet');
    const heard: (string | null)[] = [];
    for (let i = 0; i < 3; i++) {
      const r = hearLostVoice(v, vars);
      heard.push(r.scene);
      expect(r.no).toBe(i + 1);
      expect(r.total).toBe(3);
      vars = r.vars;
    }
    expect(heard).toEqual(['s1', 's2', 's3']);
    expect(lostVoicesHeard(vars, 'v')).toBe(3);
    expect(lostStatus(vars, 'v')).toBe('found');
    expect(wantsLostVoice(v, vars)).toBe(false);
    expect(hearLostVoice(v, vars).scene).toBeNull();
    expect(getDeliverError(v, vars, {})).toBeNull();
  });

  it('届けると、欠片と絆の足しが付き、ひとことが読める（仲間が加わった後のひとことは、その区画を返してから）', () => {
    let vars = acceptLost([v], {}, 'v', 3);
    for (let i = 0; i < 3; i++) vars = hearLostVoice(v, vars).vars;
    expect(lostAfterwords(v, vars, ['a42'])).toEqual([]);
    const r = deliverLost(v, vars, { items: {}, fragments: {} });
    expect(r.fragments).toEqual({ wonder: 1 });
    expect(bondExtras(r.vars, 'akari')).toBe(1);
    expect(bondExtras(r.vars, 'mio')).toBe(0);
    expect(deliveredLostCount([v], r.vars)).toBe(1);
    expect(lostAfterwords(v, r.vars, []).map((a) => a.speaker)).toEqual(['あかり']);
    expect(lostAfterwords(v, r.vars, ['a42']).map((a) => a.speaker)).toEqual(['あかり', '早瀬']);
    // 絆の点：足し1つは extra 点（なければ talk 点）
    expect(bondPoints(r.vars, 'akari', {}, {}, { event: 4, talk: 1, level: 10, extra: 3 })).toBe(3);
    expect(bondPoints(r.vars, 'akari', {}, {}, { event: 4, talk: 1, level: 10 })).toBe(1);
  });
});

// 段階242：4章の依頼（4-1・4-2）の声のかけらは、4章の区画を全部返したら掘れる（5章を待たない）
describe('4章の層は、4章の区画を全部返したら開く（段階242）', () => {
  it('4-1 だけでは開かず、4-1・4-2 を返すと開いて、受けた依頼の声が埋まる', async () => {
    const { sandBottomFor } = await import('../../src/data');
    const groups = (returned: string[]) => [...new Set(sandBottomFor('ch4', {}, returned).layers.map((l) => l.group))];
    expect(groups(['a41'])).not.toContain('ch4');
    expect(groups(['a41', 'a42'])).toContain('ch4');
    const vars = acceptLost(LOST_ITEMS, {}, 'a42_wreath', 3);
    const relics = sandBottomFor('ch4', vars, ['a41', 'a42']).layers.flatMap((l) => l.relics ?? []);
    expect(relics).toContain('lost:a42_wreath');
  });
});

// 段階244：needs の区画も返し終えるまで、棚に出さない（ペトラの頼みは 4-1 の後）
describe('棚に出す時（段階244）', () => {
  it('ペトラの頼みは、1-2 を返していても、4-1 を返すまで出ない', () => {
    const ids = (returned: string[]) => shelfLost(LOST_ITEMS, returned).map((d) => d.id);
    expect(ids(['a11', 'a12'])).not.toContain('petra_flower');
    expect(ids(['a11', 'a12', 'a41'])).toContain('petra_flower');
  });
});
