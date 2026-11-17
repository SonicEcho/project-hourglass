import { describe, expect, it } from 'vitest';
import type { RunSnapshot, SaveContext } from '../../src/core';
import {
  createLibrary,
  recordLibraryBattle,
  recordLibraryFinds,
  absorbMaterial,
  addItems,
  createArmory,
  createGrowth,
  createNavi,
  feedFragment,
  gainSnaps,
  fragmentItem,
  MIGRATIONS,
  openableNodes,
  openNode,
  parseSave,
  albumFromIds,
  placePart,
  progressAt,
  SAVE_VERSION,
  serializeSave,
  startProgress,
} from '../../src/core';
import { AREA_BATTLES, AREAS, CHAIN_ALBUM, CHAIN_SNAPS, CHAIN_START_ALBUM, GROWTH_MAP, LIBRARY_CONTEXT, NAVI_DATA, PARTY, RENAMED_EVENTS, SLICE_FLOW, START_MEMORY_POINTS, START_NAVI_PARTS, STORY, WEAPON_DATA } from '../../src/data';

const ctx: SaveContext = {
  growthMap: GROWTH_MAP,
  characterIds: PARTY.map((c) => c.id),
  startPoints: START_MEMORY_POINTS,
  naviData: NAVI_DATA,
  weaponData: WEAPON_DATA,
  story: STORY,
  flow: SLICE_FLOW,
  renamedEvents: RENAMED_EVENTS,
  areas: AREAS,
  chainCards: CHAIN_SNAPS,
  initialChainAlbum: albumFromIds(CHAIN_START_ALBUM),
  chainAlbumRules: CHAIN_ALBUM,
  library: LIBRARY_CONTEXT,
  battleIds: Object.keys(AREA_BATTLES),
};

const AT = new Date('2026-10-07T12:34:56Z');

function freshRun(): RunSnapshot {
  return {
    seed: 7,
    fixed: false,
    progress: startProgress(STORY),
    growth: createGrowth(GROWTH_MAP, ctx.characterIds, 20),
    navi: createNavi(START_NAVI_PARTS),
    armory: createArmory(WEAPON_DATA),
    event: 'prologue_open',
    vars: {},
    explore: null,
    returned: [],
    battle: null,
    chainAlbum: albumFromIds(CHAIN_START_ALBUM),
    library: createLibrary(),
    party: [],
  };
}

/** 星図を開け、ギアをはめ、素材を時分解して刻んだ周回 */
function playedRun(): RunSnapshot {
  const r = freshRun();
  const hero = PARTY[0];
  const node = openableNodes(GROWTH_MAP, r.growth, hero.id)[0];
  r.growth = openNode(GROWTH_MAP, r.growth, hero, node.id);
  r.navi = placePart(NAVI_DATA, r.navi, 0, { charId: 'hero', col: 0, row: 0, rotation: 0 });
  r.navi = placePart(NAVI_DATA, r.navi, 1, { charId: 'akari', col: 1, row: 1, rotation: 1 });
  r.armory = addItems(r.armory, ['slimeJelly', 'slimeJelly', 'steelClaw', 'goldfishScale', 'goldfishScale']);
  r.armory = fragmentItem(WEAPON_DATA, r.armory, 'slimeJelly');
  r.armory = feedFragment(WEAPON_DATA, r.armory, 'hero', 'elation');
  // 段階27b：素材を直接刻む（刻印を使う）
  r.armory = absorbMaterial(WEAPON_DATA, r.armory, 'akari', 'goldfishScale');
  r.progress = progressAt(STORY, 2);
  r.event = 'd1_clockshop';
  r.vars = { goldfish: 'あかね', prize: 'robot' };
  // 新しいスナップを手に入れた（アルバムの中身は最初のまま）
  r.chainAlbum = gainSnaps(r.chainAlbum, ['c17_group']);
  return r;
}

/** セーブの JSON を直接いじってから読む */
function parseEdited(edit: (raw: any) => void) {
  const raw = JSON.parse(serializeSave(playedRun(), AT));
  edit(raw);
  return parseSave(JSON.stringify(raw), ctx);
}

describe('セーブ：保存して読む', () => {
  it('戦闘中の印（段階44）を保存して読む。今のデータにない戦闘・形の違う物は捨てる', () => {
    const mark = { battle: 'a11_storm1', win: { key: 'Explore', data: { area: 'a11', won: 'e1' } }, lose: { key: 'Explore', data: { area: 'a11', lost: true } } };
    const r = { ...playedRun(), battle: mark };
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok && res.save.run.battle).toEqual(mark);
    const gone = parseEdited((raw) => (raw.run.battle = { ...mark, battle: 'nowhere' }));
    expect(gone.ok && gone.save.run.battle).toBeNull();
    const broken = parseEdited((raw) => (raw.run.battle = { battle: 'a11_storm1', win: 'Explore', lose: mark.lose }));
    expect(broken.ok && broken.save.run.battle).toBeNull();
  });

  it('選んだ戦闘の並び（段階91a）を保存して読む。知らない仲間と重なりは捨てる', () => {
    const r = { ...playedRun(), party: ['hero', 'mio'] };
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok && res.save.run.party).toEqual(['hero', 'mio']);
    const odd = parseEdited((raw) => (raw.run.party = ['mio', 'nobody', 'mio', 3]));
    expect(odd.ok && odd.save.run.party).toEqual(['mio']);
    const none = parseEdited((raw) => delete raw.run.party);
    expect(none.ok && none.save.run.party).toEqual([]);
  });

  it('保存した周回を、そのまま読み戻せる', () => {
    const r = playedRun();
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.version).toBe(SAVE_VERSION);
    expect(res.save.savedAt).toBe('2026-10-07T12:34:56.000Z');
    // 0個になった素材・欠片は捨てる
    expect(res.save.run).toEqual({ ...r, armory: { ...r.armory, items: { steelClaw: 1, goldfishScale: 1 }, fragments: {} } });
    expect(res.save.run.armory.weapons.akari.absorbed).toBe(1);
  });

  it('始めたばかりの周回も読み戻せる', () => {
    const r = freshRun();
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok && res.save.run).toEqual(r);
  });

  it('時分解して0個になった素材は、読む時に捨てる', () => {
    const r = playedRun();
    expect(r.armory.items.slimeJelly).toBe(0);
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok && res.save.run.armory.items).toEqual({ steelClaw: 1, goldfishScale: 1 });
  });

  it('刻印の数がない武器は、枠を0として読む（段階27b）', () => {
    const res = parseEdited((raw) => {
      for (const w of Object.values(raw.run.armory.weapons) as any[]) delete w.absorbed;
    });
    expect(res.ok && res.save.run.armory.weapons.akari.absorbed).toBe(0);
  });
});

describe('セーブ：読めないもの', () => {
  it('JSON でないものは読まない', () => {
    expect(parseSave('{broken', ctx)).toEqual({ ok: false, error: expect.any(String) });
  });

  it('版の番号がないものは読まない', () => {
    expect(parseSave(JSON.stringify({ run: freshRun() }), ctx).ok).toBe(false);
  });

  it('今より新しい版は読まない', () => {
    expect(parseEdited((raw) => (raw.version = SAVE_VERSION + 1)).ok).toBe(false);
  });

  it('形がまったく違う（シードが文字、星図がない）ものは読まない', () => {
    expect(parseEdited((raw) => (raw.run.seed = 'abc')).ok).toBe(false);
    expect(parseEdited((raw) => delete raw.run.growth).ok).toBe(false);
    expect(parseEdited((raw) => (raw.run.navi.parts = 'x')).ok).toBe(false);
  });
});

describe('セーブ：前の版（段階205）', () => {
  it('版17 より前のセーブは、直す手順がない古いセーブとして読まない（はじめから。開発者と決めた）', () => {
    expect(SAVE_VERSION).toBe(17);
    expect(MIGRATIONS).toEqual({});
    for (const version of [0, 1, 3, 13, 16]) {
      const res = parseEdited((raw) => (raw.version = version));
      expect(res).toEqual({ ok: false, error: `版${version}から直す手順がない`, old: true });
    }
  });

  it('直す手順を渡せば、順に通して今の版に直してから読む（次に形を変える時の仕組み）', () => {
    // 版16では、星の砂を memoryPoints という名前で持っていた、という想定
    const v16 = JSON.parse(serializeSave(playedRun(), AT));
    v16.version = 16;
    v16.run.memoryPoints = v16.run.growth.points + 5;
    const res = parseSave(JSON.stringify(v16), ctx, { 16: (raw: any) => ({ ...raw, run: { ...raw.run, growth: { ...raw.run.growth, points: raw.run.memoryPoints } } }) });
    expect(res.ok && res.save.version).toBe(SAVE_VERSION);
    expect(res.ok && res.save.run.growth.points).toBe(playedRun().growth.points + 5);
  });

  it('返した時間：ない時は何も返していない。知らない区画と重なりは捨てる（段階28）', () => {
    const res = parseEdited((raw) => delete raw.run.returned);
    expect(res.ok && res.save.run.returned).toEqual([]);
    const kept = parseEdited((raw) => (raw.run.returned = ['a11', 'removed', 'a11']));
    expect(kept.ok && kept.save.run.returned).toEqual(['a11']);
  });

  it('通った進化先は、親から順につながっている所まで残す（知らない型・飛ばした段・まだ作っていない先で切る。段階42）', () => {
    const pathOf = (path: unknown) => {
      const res = parseEdited((raw) => (raw.run.armory.weapons.hero.path = path));
      return res.ok ? res.save.run.armory.weapons.hero.path : null;
    };
    expect(pathOf([{ id: 'breakEdge', style: 1 }, { id: 'crushEdge', style: 0 }])).toEqual([{ id: 'breakEdge', style: 1 }, { id: 'crushEdge', style: 0 }]);
    expect(pathOf([{ id: 'breakEdge', style: 5 }])).toEqual([]);
    expect(pathOf([{ id: 'crushEdge', style: 0 }])).toEqual([]);
    expect(pathOf([{ id: 'breakEdge', style: 0 }, { id: 'mirrorSword', style: 0 }])).toEqual([{ id: 'breakEdge', style: 0 }]);
    expect(
      pathOf([
        { id: 'breakEdge', style: 0 },
        { id: 'crushEdge', style: 0 },
        { id: 'grandEdge', style: 0 },
        { id: 'grandEdge_1a', style: 0 },
      ]),
    ).toHaveLength(3);
    expect(pathOf('broken')).toEqual([]);
  });

});

describe('セーブ：今のデータに合わせて整える', () => {
  it('今の星図にないマスは捨て、出発点は残す', () => {
    const res = parseEdited((raw) => raw.run.growth.opened.hero.push('removedNode'));
    expect(res.ok && res.save.run.growth.opened.hero).toEqual(playedRun().growth.opened.hero);
  });

  it('足りないキャラは、出発点だけ開いた状態で補う', () => {
    const res = parseEdited((raw) => delete raw.run.growth.opened.mio);
    expect(res.ok && res.save.run.growth.opened.mio).toEqual(createGrowth(GROWTH_MAP, ctx.characterIds, 0).opened.mio);
  });

  it('今のデータにないギア・素材・欠片は捨てる', () => {
    const res = parseEdited((raw) => {
      raw.run.navi.parts.push({ uid: 99, partId: 'removedGear', placement: null });
      raw.run.armory.items.removedItem = 3;
      raw.run.armory.fragments.nostalgia = 2;
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.run.navi.parts.map((p) => p.partId)).toEqual(START_NAVI_PARTS);
    expect(res.save.run.armory.items.removedItem).toBeUndefined();
    expect(res.save.run.armory.fragments.nostalgia).toBeUndefined();
  });

  it('ギアは今の盤に置き直し、はみ出す・重なるものは外す', () => {
    const res = parseEdited((raw) => {
      // uid 5（3マスのワイドショット）を盤の外にはみ出させ、uid 3 を uid 0 と同じマスに
      raw.run.navi.parts[5].placement = { charId: 'hero', col: 2, row: 3, rotation: 0 };
      raw.run.navi.parts[3].placement = { charId: 'hero', col: 0, row: 0, rotation: 0 };
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const parts = res.save.run.navi.parts;
    expect(parts[0].placement).toEqual({ charId: 'hero', col: 0, row: 0, rotation: 0 });
    expect(parts[1].placement).toEqual({ charId: 'akari', col: 1, row: 1, rotation: 1 });
    expect(parts[5].placement).toBeNull();
    expect(parts[3].placement).toBeNull();
  });

  it('保存した並べ方（段階201）は、セーブを読み直しても残る（形の合わない物は捨てる）', () => {
    const res = parseEdited((raw) => {
      raw.run.navi.loadouts = { hero: [{ name: 'ボス用', parts: [{ uid: 0, col: 0, row: 0, rotation: 0 }, { uid: 'x', col: 1 }] }, null, 'broken'] };
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.run.navi.loadouts?.hero?.[0]).toEqual({ name: 'ボス用', parts: [{ uid: 0, col: 0, row: 0, rotation: 0 }] });
    expect(res.save.run.navi.loadouts?.hero?.[1]).toBeNull();
    expect(res.save.run.navi.loadouts?.hero?.[2]).toBeNull();
  });

  it('武器の進化で広がったマスに置いたギアは、そのまま残る', () => {
    const r = freshRun();
    r.armory = { ...r.armory, weapons: { ...r.armory.weapons, hero: { ...r.armory.weapons.hero, path: [{ id: 'breakEdge', style: 0 }] } } };
    const raw = JSON.parse(serializeSave(r, AT));
    // 広がったブリッジの下の端（5行目）に1マスのギア
    raw.run.navi.parts[0].placement = { charId: 'hero', col: 1, row: 4, rotation: 0 };
    const res = parseSave(JSON.stringify(raw), ctx);
    expect(res.ok && res.save.run.navi.parts[0].placement).toEqual({ charId: 'hero', col: 1, row: 4, rotation: 0 });
    // 進化先が今のデータにない時は進化前に戻り、そのギアは外れる
    raw.run.armory.weapons.hero.path = [{ id: 'removedEvolution', style: 0 }];
    const res2 = parseSave(JSON.stringify(raw), ctx);
    expect(res2.ok && res2.save.run.armory.weapons.hero.path).toEqual([]);
    expect(res2.ok && res2.save.run.navi.parts[0].placement).toBeNull();
  });

  it('武器がない・別の武器の時は、初めの状態で補う', () => {
    const fresh = createArmory(WEAPON_DATA);
    const res = parseEdited((raw) => {
      delete raw.run.armory.weapons.akari;
      raw.run.armory.weapons.hero.defId = 'otherWeapon';
    });
    expect(res.ok && res.save.run.armory.weapons.akari).toEqual(fresh.weapons.akari);
    expect(res.ok && res.save.run.armory.weapons.hero).toEqual(fresh.weapons.hero);
  });

  it('次に戦う場所は、今の物語に収める', () => {
    const res = parseEdited((raw) => {
      raw.run.progress.battle = 99;
      raw.run.progress.day = 0;
    });
    expect(res.ok && res.save.run.progress).toEqual({ chapterId: 'prototype', areaId: 'trial', battle: 4, day: 1 });
    const res2 = parseEdited((raw) => (raw.run.progress = { chapterId: 'removedChapter', areaId: 'x', battle: 2, day: 3 }));
    expect(res2.ok && res2.save.run.progress).toEqual({ chapterId: 'prototype', areaId: 'trial', battle: 2, day: 1 });
  });

  it('物語の出来事と覚えた値を読み戻す。今の流れにない出来事は最初から、何日目は出来事に合わせる', () => {
    const res = parseEdited((raw) => {
      raw.run.progress.day = 5;
      raw.run.vars.broken = 3;
    });
    expect(res.ok && res.save.run.event).toBe('d1_clockshop');
    expect(res.ok && res.save.run.progress.day).toBe(1);
    expect(res.ok && res.save.run.vars).toEqual({ goldfish: 'あかね', prize: 'robot' });
    const res2 = parseEdited((raw) => (raw.run.event = 'd2_classroom'));
    expect(res2.ok && res2.save.run.progress.day).toBe(2);
    // 段階63：1-1 を3晩に分けた時になくなった出来事は、近い出来事から
    const res5 = parseEdited((raw) => (raw.run.event = 'd2_noa'));
    expect(res5.ok && res5.save.run.event).toBe('a11_night2_end');
    const res3 = parseEdited((raw) => (raw.run.event = 'removedEvent'));
    expect(res3.ok && res3.save.run.event).toBe('prologue_open');
    // なくなった出来事は、代わりの出来事から（段階63：1-1 の「1日目の返す会話」→ 返した後の会話）
    const res4 = parseEdited((raw) => (raw.run.event = 'd1_return'));
    expect(res4.ok && res4.save.run.event).toBe('a11_returned');
    // 何日目は出来事に合わせる（段階85：2-3 のカイは18日目。段階103：返すのは20日目）
    const res6 = parseEdited((raw) => (raw.run.event = 'd7_kai'));
    expect(res6.ok && res6.save.run.progress.day).toBe(18);
    const res7 = parseEdited((raw) => (raw.run.event = 'a23_return'));
    expect(res7.ok && res7.save.run.event).toBe('a23_return');
    expect(res7.ok && res7.save.run.progress.day).toBe(20);
    expect(parseEdited((raw) => delete raw.run.event).ok).toBe(false);
    expect(parseEdited((raw) => (raw.run.vars = 'x')).ok).toBe(false);
  });

  it('探索の状態を読み戻す。知らない区画なら、探索の途中ではないことにする', () => {
    // 1-2 の最初の部屋で確かめる（段階66から 1-2 は部屋が4つ）
    const explore = { area: 'a12', room: 'showa_night', cell: [8, 29], checkpoint: [8, 29], checkpointRoom: 'showa_night', visited: ['showa_night'], openedChests: ['a12_chest_clock'], defeated: ['a12_e_gate'], seen: ['a12_first_koma'], cleared: false, koma: 3 };
    const res = parseEdited((raw) => (raw.run.explore = explore));
    expect(res.ok && res.save.run.explore).toEqual(explore);
    const res2 = parseEdited((raw) => (raw.run.explore = { ...explore, area: 'gone' }));
    expect(res2.ok && res2.save.run.explore).toBeNull();
  });

  it('進み具合がないものは読まない', () => {
    expect(parseEdited((raw) => delete raw.run.progress).ok).toBe(false);
  });

  it('同じ番号のギアが2つあれば、後のものを捨てる。次の番号は持っているギアより大きくする', () => {
    const res = parseEdited((raw) => {
      raw.run.navi.parts.push({ uid: 0, partId: 'mpMemory', placement: null });
      raw.run.navi.nextUid = 1;
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.run.navi.parts.filter((p) => p.uid === 0).map((p) => p.partId)).toEqual(['hpMemory']);
    expect(res.save.run.navi.nextUid).toBe(START_NAVI_PARTS.length);
  });
});

describe('セーブ：アルバム（段階163。版17 から新しい戦闘のアルバムだけ）', () => {
  it('保存して読む。ない時は最初のアルバム、知らないスナップは捨てる。決まった枚数でなければ持ち物を残して最初の中身に戻す', () => {
    const res = parseSave(serializeSave(playedRun(), AT), ctx);
    expect(res.ok && res.save.run.chainAlbum.owned.c17_group).toBe(1);
    const odd = parseEdited((raw) => (raw.run.chainAlbum.owned.nothing = 2));
    expect(odd.ok && odd.save.run.chainAlbum.owned.nothing).toBeUndefined();
    const none = parseEdited((raw) => delete raw.run.chainAlbum);
    expect(none.ok && none.save.run.chainAlbum).toEqual(albumFromIds(CHAIN_START_ALBUM));
    const short = parseEdited((raw) => (raw.run.chainAlbum.album = {}));
    expect(short.ok && short.save.run.chainAlbum.album).toEqual(albumFromIds(CHAIN_START_ALBUM).album);
    expect(short.ok && short.save.run.chainAlbum.owned.c17_group).toBe(1);
  });

  it('古いアルバム・つながりゲージ・ギアの報酬の受け取り待ちは、セーブに書かない（段階205）', () => {
    const raw = JSON.parse(serializeSave(playedRun(), AT));
    for (const key of ['album', 'linkGauge', 'pendingReward']) expect(key in raw.run, key).toBe(false);
  });
});

describe('セーブ：ライブラリの記録（段階167）', () => {
  it('保存して読む。今のデータにない物は捨てる。ない時は空の記録', () => {
    const lib = recordLibraryBattle(recordLibraryFinds(createLibrary(), { combos: ['iceFlower', 'nothing'], snaps: ['a11_amaikiri', 'a11_hireuchi'] }), { met: ['goldfishNoise', 'ghost'], defeated: ['goldfishNoise'], weak: { goldfishNoise: ['thunder'] } });
    const res = parseSave(serializeSave({ ...playedRun(), library: lib }, AT), ctx);
    expect(res.ok && res.save.run.library).toEqual({ met: { goldfishNoise: 1 }, defeated: { goldfishNoise: 1 }, weak: { goldfishNoise: ['thunder'] }, snaps: ['a11_amaikiri'], combos: ['iceFlower'], items: [] });
    const none = parseEdited((raw) => delete raw.run.library);
    expect(none.ok && none.save.run.library).toEqual(createLibrary());
  });
});

describe('セーブ：2本目の武器（段階223）', () => {
  it('しまってある武器と写しの印を保存して読む。前の版のセーブ（spare なし）は1本のまま', async () => {
    const { forgeSecondWeapon, swapWeapon } = await import('../../src/core');
    const r = playedRun();
    const armory = swapWeapon(forgeSecondWeapon(WEAPON_DATA, { ...r.armory, fragments: { courage: 20 } }, 'hero'), 'hero');
    const res = parseSave(serializeSave({ ...r, armory }, AT), ctx);
    expect(res.ok && res.save.run.armory.weapons.hero.copy).toBe(true);
    expect(res.ok && res.save.run.armory.spare?.hero.path).toEqual(r.armory.weapons.hero.path);
    expect(res.ok && res.save.run.armory.spare?.hero.copy).toBeUndefined();
    const old = parseEdited((raw) => delete raw.run.armory.spare);
    expect(old.ok && old.save.run.armory.spare).toBeUndefined();
  });
});

// 段階238：敵のスナップを区画に2枚へ絞った。外した札を持っていたセーブ
describe('セーブ：外したスナップ（段階238）', () => {
  const retiredCtx: SaveContext = { ...ctx, retiredSnaps: { ids: new Set(['a11_hireuchi', 'a11_mizushibuki']), refund: 'courage' } };
  const withRetired = () => {
    const raw = JSON.parse(serializeSave(playedRun(), AT));
    const album = raw.run.chainAlbum;
    // アルバムの2枚を外した札に入れ替え、持っている物にも足す
    const [first] = Object.keys(album.album);
    album.album[first] -= 2;
    if (album.album[first] === 0) delete album.album[first];
    album.album.a11_hireuchi = 2;
    album.owned.a11_hireuchi = 3;
    album.owned.a11_mizushibuki = 1;
    return raw;
  };

  it('持っていた枚数だけ、記憶の欠片（refund の種類）に替える', () => {
    const raw = withRetired();
    const before = raw.run.armory.fragments.courage ?? 0;
    const res = parseSave(JSON.stringify(raw), retiredCtx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.run.armory.fragments.courage).toBe(before + 4);
    expect(res.save.run.chainAlbum.owned.a11_hireuchi).toBeUndefined();
    // 読み直しても、もう替えない（持っていないので）
    const again = parseSave(serializeSave(res.save.run, AT), retiredCtx);
    expect(again.ok && again.save.run.armory.fragments.courage).toBe(before + 4);
  });

  it('アルバムが足りなくなった分は、最初のアルバムの札で埋める（組み直したアルバムは残す）', () => {
    const raw = withRetired();
    const kept = { ...raw.run.chainAlbum.album };
    delete kept.a11_hireuchi;
    const res = parseSave(JSON.stringify(raw), retiredCtx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const album = res.save.run.chainAlbum.album;
    expect(Object.values(album).reduce((a, n) => a + n, 0)).toBe(CHAIN_ALBUM.size);
    for (const [id, n] of Object.entries(kept)) expect(album[id] ?? 0, id).toBeGreaterThanOrEqual(n as number);
    expect(album.a11_hireuchi).toBeUndefined();
  });
});
