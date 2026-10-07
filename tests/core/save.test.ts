import { describe, expect, it } from 'vitest';
import type { RunSnapshot, SaveContext } from '../../src/core';
import {
  addItems,
  createArmory,
  createGrowth,
  createNavi,
  feedFragment,
  fragmentItem,
  MIGRATIONS,
  openableNodes,
  openNode,
  parseSave,
  placePart,
  progressAt,
  SAVE_VERSION,
  serializeSave,
  startProgress,
} from '../../src/core';
import { GROWTH_MAP, NAVI_DATA, PARTY, START_MEMORY_POINTS, START_NAVI_PARTS, STORY, WEAPON_DATA } from '../../src/data';

const ctx: SaveContext = {
  growthMap: GROWTH_MAP,
  characterIds: PARTY.map((c) => c.id),
  startPoints: START_MEMORY_POINTS,
  naviData: NAVI_DATA,
  weaponData: WEAPON_DATA,
  story: STORY,
};

const AT = new Date('2026-10-07T12:34:56Z');

function freshRun(): RunSnapshot {
  return {
    seed: 7,
    fixed: false,
    progress: startProgress(STORY),
    growth: createGrowth(GROWTH_MAP, ctx.characterIds, 20),
    navi: createNavi(START_NAVI_PARTS),
    pendingReward: null,
    armory: createArmory(WEAPON_DATA),
  };
}

/** 星図を開け、ギアをはめ、素材を時分解して吸わせた周回 */
function playedRun(): RunSnapshot {
  const r = freshRun();
  const hero = PARTY[0];
  const node = openableNodes(GROWTH_MAP, r.growth, hero.id)[0];
  r.growth = openNode(GROWTH_MAP, r.growth, hero, node.id);
  r.navi = placePart(NAVI_DATA, r.navi, 0, { charId: 'hero', col: 0, row: 0, rotation: 0 });
  r.navi = placePart(NAVI_DATA, r.navi, 1, { charId: 'akari', col: 1, row: 1, rotation: 1 });
  r.armory = addItems(r.armory, ['slimeJelly', 'slimeJelly', 'steelClaw']);
  r.armory = fragmentItem(WEAPON_DATA, r.armory, 'slimeJelly');
  r.armory = feedFragment(WEAPON_DATA, r.armory, 'hero', 'elation');
  r.progress = progressAt(STORY, 2);
  r.pendingReward = 'battle2';
  return r;
}

/** セーブの JSON を直接いじってから読む */
function parseEdited(edit: (raw: any) => void) {
  const raw = JSON.parse(serializeSave(playedRun(), AT));
  edit(raw);
  return parseSave(JSON.stringify(raw), ctx);
}

describe('セーブ：保存して読む', () => {
  it('保存した周回を、そのまま読み戻せる', () => {
    const r = playedRun();
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.version).toBe(SAVE_VERSION);
    expect(res.save.savedAt).toBe('2026-10-07T12:34:56.000Z');
    expect(res.save.run).toEqual({ ...r, armory: { ...r.armory, fragments: { courage: 1, elation: 2 } } });
  });

  it('始めたばかりの周回も読み戻せる', () => {
    const r = freshRun();
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok && res.save.run).toEqual(r);
  });

  it('時分解して0個になった素材は、読む時に捨てる', () => {
    const r = playedRun();
    r.armory = fragmentItem(WEAPON_DATA, r.armory, 'slimeJelly');
    expect(r.armory.items.slimeJelly).toBe(0);
    const res = parseSave(serializeSave(r, AT), ctx);
    expect(res.ok && res.save.run.armory.items).toEqual({ steelClaw: 1 });
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

describe('セーブ：古い版から直す', () => {
  it('移行の手順を順に通して、今の版に直してから読む', () => {
    // 版0では、星の砂を memoryPoints という名前で持っていた、という想定
    const v0 = JSON.parse(serializeSave(playedRun(), AT));
    v0.version = 0;
    v0.run.memoryPoints = v0.run.growth.points + 5;
    const res = parseSave(JSON.stringify(v0), ctx, {
      ...MIGRATIONS,
      0: (raw: any) => ({ ...raw, run: { ...raw.run, growth: { ...raw.run.growth, points: raw.run.memoryPoints } } }),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.version).toBe(SAVE_VERSION);
    expect(res.save.run.growth.points).toBe(playedRun().growth.points + 5);
  });

  it('版1のセーブ（何戦目かと報酬の番号）を、版2の章・区画・何戦目に直して読む', () => {
    const v2 = JSON.parse(serializeSave(playedRun(), AT));
    const { progress: _p, ...rest } = v2.run;
    const v1 = { version: 1, savedAt: v2.savedAt, run: { ...rest, stage: 2, pendingReward: 1 } };
    const res = parseSave(JSON.stringify(v1), ctx);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.version).toBe(2);
    expect(res.save.run.progress).toEqual({ chapterId: 'prototype', areaId: 'trial', battle: 2, day: 1 });
    expect(res.save.run.pendingReward).toBe('battle2');
    expect(res.save.run.growth).toEqual(playedRun().growth);
    // 報酬がない版1のセーブ
    const res2 = parseSave(JSON.stringify({ ...v1, run: { ...v1.run, pendingReward: null } }), ctx);
    expect(res2.ok && res2.save.run.pendingReward).toBeNull();
  });

  it('直す手順がない古い版は読まない', () => {
    const res = parseEdited((raw) => (raw.version = 0));
    expect(res).toEqual({ ok: false, error: '版0から直す手順がない' });
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
      // uid 2（2マスのギア）を盤の外に、uid 3 を uid 0 と同じマスに
      raw.run.navi.parts[2].placement = { charId: 'hero', col: 3, row: 3, rotation: 0 };
      raw.run.navi.parts[3].placement = { charId: 'hero', col: 0, row: 0, rotation: 0 };
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const parts = res.save.run.navi.parts;
    expect(parts[0].placement).toEqual({ charId: 'hero', col: 0, row: 0, rotation: 0 });
    expect(parts[1].placement).toEqual({ charId: 'akari', col: 1, row: 1, rotation: 1 });
    expect(parts[2].placement).toBeNull();
    expect(parts[3].placement).toBeNull();
  });

  it('武器の進化で広がったマスに置いたギアは、そのまま残る', () => {
    const r = freshRun();
    r.armory = { ...r.armory, weapons: { ...r.armory.weapons, hero: { ...r.armory.weapons.hero, evolvedTo: 'flameBlade' } } };
    const raw = JSON.parse(serializeSave(r, AT));
    // 広がったブリッジの右端（4列目）に1マスのギア
    raw.run.navi.parts[0].placement = { charId: 'hero', col: 4, row: 1, rotation: 0 };
    const res = parseSave(JSON.stringify(raw), ctx);
    expect(res.ok && res.save.run.navi.parts[0].placement).toEqual({ charId: 'hero', col: 4, row: 1, rotation: 0 });
    // 進化先が今のデータにない時は進化前に戻り、そのギアは外れる
    raw.run.armory.weapons.hero.evolvedTo = 'removedEvolution';
    const res2 = parseSave(JSON.stringify(raw), ctx);
    expect(res2.ok && res2.save.run.armory.weapons.hero.evolvedTo).toBeNull();
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

  it('次に戦う場所は、今の物語に収める。知らない戦闘の報酬は捨てる', () => {
    const res = parseEdited((raw) => {
      raw.run.progress.battle = 99;
      raw.run.progress.day = 0;
      raw.run.pendingReward = 'removedBattle';
    });
    expect(res.ok && res.save.run.progress).toEqual({ chapterId: 'prototype', areaId: 'trial', battle: 4, day: 1 });
    expect(res.ok && res.save.run.pendingReward).toBeNull();
    const res2 = parseEdited((raw) => (raw.run.progress = { chapterId: 'removedChapter', areaId: 'x', battle: 2, day: 3 }));
    expect(res2.ok && res2.save.run.progress).toEqual({ chapterId: 'prototype', areaId: 'trial', battle: 2, day: 3 });
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
