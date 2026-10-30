import { describe, expect, it } from 'vitest';
import {
  addItems,
  addParts,
  arrangeBoards,
  countOf,
  createAlbum,
  createArmory,
  createGrowth,
  createNavi,
  evolutionKeys,
  findBugs,
  findNode,
  gainSnaps,
  getOpenError,
  isAlbumComplete,
  isPartActive,
  nearestEvolution,
  neighbors,
  nextRecommendedStar,
  openNode,
  recommendAlbum,
  recommendMaterials,
  recommendStar,
  upcomingKeys,
} from '../../src/core';
import {
  ALBUM_COPY_MAX,
  ALBUM_RECOMMEND,
  ALBUM_SIZE,
  CARDS,
  FOLDER,
  GROWTH_MAP,
  GROWTH_RECOMMEND,
  NAVI_DATA,
  NAVI_PARTS,
  PARTY,
  START_NAVI_PARTS,
  WEAPON_DATA,
} from '../../src/data';

// 段階100：育成の「おすすめ」（レビューの E1）

describe('アルバムのおまかせ', () => {
  it('最初の持ち物だけでも、ちょうど20枚で、上限を守って組める', () => {
    const a = recommendAlbum(createAlbum(FOLDER), ALBUM_RECOMMEND, ALBUM_SIZE, ALBUM_COPY_MAX);
    expect(isAlbumComplete(a)).toBe(true);
    for (const [id, n] of Object.entries(a.album)) {
      expect(n).toBeLessThanOrEqual(Math.min(ALBUM_COPY_MAX, a.owned[id]));
    }
  });

  it('全部のスナップを持っていれば、決めた順と枚数のとおり（ちょうど20枚）', () => {
    const many = gainSnaps(createAlbum(FOLDER), Object.keys(CARDS).flatMap((id) => [id, id, id, id]));
    const a = recommendAlbum(many, ALBUM_RECOMMEND, ALBUM_SIZE, ALBUM_COPY_MAX);
    expect(a.album).toEqual(Object.fromEntries(ALBUM_RECOMMEND));
    expect(ALBUM_RECOMMEND.reduce((s, [, n]) => s + n, 0)).toBe(ALBUM_SIZE);
  });

  it('持っている物は変えない。入れ直しても同じ形になる', () => {
    const many = gainSnaps(createAlbum(FOLDER), ['joker', 'joker', 'pinchHitter']);
    const a = recommendAlbum(many, ALBUM_RECOMMEND, ALBUM_SIZE, ALBUM_COPY_MAX);
    expect(a.owned).toEqual(many.owned);
    expect(a.album.joker).toBe(2);
    expect(recommendAlbum(a, ALBUM_RECOMMEND, ALBUM_SIZE, ALBUM_COPY_MAX)).toEqual(a);
  });

  it('おすすめの順に、知らないスナップを書いていない', () => {
    for (const [id] of ALBUM_RECOMMEND) expect(Object.keys(CARDS)).toContain(id);
    expect(countOf(Object.fromEntries(ALBUM_RECOMMEND))).toBe(ALBUM_SIZE);
  });
});

describe('星図のおすすめの道', () => {
  const ids = PARTY.map((c) => c.id);

  it('道は、開けた星の隣から目指す星までつながっていて、先頭は今開けられる星', () => {
    const g = createGrowth(GROWTH_MAP, ids, 100);
    for (const c of PARTY.slice(0, 3)) {
      const advice = recommendStar(GROWTH_MAP, g, c, GROWTH_RECOMMEND, 2)!;
      expect(advice, c.id).not.toBeNull();
      expect(advice.path.at(-1)).toBe(advice.target.id);
      expect(getOpenError(GROWTH_MAP, g, c, advice.path[0], 2)).toBeNull();
      for (let i = 1; i < advice.path.length; i++) {
        expect(neighbors(GROWTH_MAP, advice.path[i - 1]).map((n) => n.id)).toContain(advice.path[i]);
      }
      expect(nextRecommendedStar(GROWTH_MAP, advice)?.id).toBe(advice.path[0]);
    }
  });

  it('章が来ていない星は勧めない', () => {
    const g = createGrowth(GROWTH_MAP, ids, 100);
    for (const c of PARTY) {
      const advice = recommendStar(GROWTH_MAP, g, c, GROWTH_RECOMMEND, 1);
      for (const id of advice?.path ?? []) expect(findNode(GROWTH_MAP, id)?.chapter ?? 0).toBeLessThanOrEqual(1);
    }
  });

  it('勧められた星を開け続けると、星の砂がある限り、毎回ちがう星へ進む（同じ所で止まらない）', () => {
    const hero = PARTY[0];
    let g = createGrowth(GROWTH_MAP, ids, 300);
    const seen = new Set<string>();
    for (let k = 0; k < 15; k++) {
      const next = nextRecommendedStar(GROWTH_MAP, recommendStar(GROWTH_MAP, g, hero, GROWTH_RECOMMEND, 3));
      if (!next || getOpenError(GROWTH_MAP, g, hero, next.id, 3) !== null) break;
      expect(seen.has(next.id)).toBe(false);
      seen.add(next.id);
      g = openNode(GROWTH_MAP, g, hero, next.id, 3);
    }
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  it('自分の星座の、まだ覚えていない魔法・スキルが近ければ、それを目指す', () => {
    const g = createGrowth(GROWTH_MAP, ids, 0);
    const advice = recommendStar(GROWTH_MAP, g, PARTY[0], GROWTH_RECOMMEND, 1)!;
    expect(advice.target.kind).toBe('skill');
    expect(advice.target.con).toBe('aql');
  });
});

describe('ムーブメントのおまかせ', () => {
  const all = addParts(createNavi(START_NAVI_PARTS), Object.keys(NAVI_PARTS));

  it('並べた仲間の盤に狂いを作らず、効果ギアはブリッジに乗る所に置く', () => {
    const ids = ['hero', 'akari', 'mio'];
    const navi = arrangeBoards(NAVI_DATA, all, ids);
    for (const id of ids) expect(findBugs(NAVI_DATA, navi, id)).toEqual([]);
    const effects = navi.parts.filter((p) => p.placement && NAVI_DATA.parts[p.partId].kind === 'effect');
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.filter((p) => isPartActive(NAVI_DATA, p)).length).toBeGreaterThanOrEqual(Math.ceil(effects.length / 2));
  });

  it('並べない仲間の盤のギアは、そのまま', () => {
    const first = arrangeBoards(NAVI_DATA, all, ['sayoko']);
    const onSayoko = first.parts.filter((p) => p.placement?.charId === 'sayoko');
    expect(onSayoko.length).toBeGreaterThan(0);
    const next = arrangeBoards(NAVI_DATA, first, ['hero', 'akari']);
    expect(next.parts.filter((p) => p.placement?.charId === 'sayoko')).toEqual(onSayoko);
  });

  it('同じ持ち物なら、何度押しても同じ並べ方', () => {
    const once = arrangeBoards(NAVI_DATA, all, ['hero', 'akari', 'mio']);
    expect(arrangeBoards(NAVI_DATA, once, ['hero', 'akari', 'mio'])).toEqual(once);
  });
});

describe('武器に刻む素材のおすすめ', () => {
  const D = WEAPON_DATA;

  it('進化の鍵の素材は勧めない', () => {
    const keys = evolutionKeys(D);
    const mats = Object.keys(D.items).filter((id) => D.items[id].kind === 'material');
    const armory = addItems(createArmory(D), mats);
    for (const c of ['hero', 'akari', 'mio']) {
      const list = recommendMaterials(D, armory, c);
      expect(list.length).toBeGreaterThan(0);
      for (const id of list) expect(keys.has(id)).toBe(false);
    }
  });

  it('一番近い進化先の条件の能力値を上げる素材が先。その能力値を下げる素材は勧めない', () => {
    const armory = addItems(createArmory(D), ['goldfishScale', 'maskShard', 'goldfishFin', 'tornPoi']);
    const near = nearestEvolution(D, armory, 'hero')!;
    expect(near.params).toEqual(['fire']);
    const list = recommendMaterials(D, armory, 'hero');
    // 火を上げる仮面のかけらが先。火を下げる金魚のひれは入れない
    expect(list[0]).toBe('maskShard');
    expect(list).not.toContain('goldfishFin');
  });

  it('画面では、これから要る数の鍵は残し、それより多く持っている分だけ勧める', () => {
    const fresh = createArmory(D);
    const reserve = upcomingKeys(D, fresh);
    // 始めは、仮面のひも（フレイムブレードとフレイムロッドの鍵）を2つ残す
    expect(reserve.get('maskString')).toBe(2);
    const two = addItems(fresh, ['maskString', 'maskString']);
    expect(recommendMaterials(D, two, 'hero', undefined, reserve)).not.toContain('maskString');
    const three = addItems(two, ['maskString']);
    expect(recommendMaterials(D, three, 'hero', undefined, reserve)).toContain('maskString');
    // 残しておく数を渡さない時（自動対戦）は、鍵は勧めない
    expect(recommendMaterials(D, three, 'hero')).not.toContain('maskString');
  });

  it('進化を終えた武器の、通り過ぎた進化先の鍵は数えない', () => {
    const fresh = createArmory(D);
    const hero = fresh.weapons.hero;
    const passed = { ...fresh, weapons: { ...fresh.weapons, hero: { ...hero, path: [{ id: 'flameBlade', style: 0 }] } } };
    expect(upcomingKeys(D, passed).get('maskString')).toBe(1);
  });

  it('持っていない素材は勧めない', () => {
    expect(recommendMaterials(D, createArmory(D), 'hero')).toEqual([]);
  });
});
