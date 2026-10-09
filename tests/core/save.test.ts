import { describe, expect, it } from 'vitest';
import type { RunSnapshot, SaveContext } from '../../src/core';
import {
  absorbMaterial,
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
import { AREAS, GROWTH_MAP, NAVI_DATA, PARTY, SLICE_FLOW, START_MEMORY_POINTS, START_NAVI_PARTS, STORY, WEAPON_DATA } from '../../src/data';

const ctx: SaveContext = {
  growthMap: GROWTH_MAP,
  characterIds: PARTY.map((c) => c.id),
  startPoints: START_MEMORY_POINTS,
  naviData: NAVI_DATA,
  weaponData: WEAPON_DATA,
  story: STORY,
  flow: SLICE_FLOW,
  areas: AREAS,
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
    event: 'prologue_open',
    vars: {},
    explore: null,
    linkGauge: null,
    returned: [],
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
  r.armory = addItems(r.armory, ['slimeJelly', 'slimeJelly', 'steelClaw', 'goldfishScale', 'goldfishScale']);
  r.armory = fragmentItem(WEAPON_DATA, r.armory, 'slimeJelly');
  r.armory = feedFragment(WEAPON_DATA, r.armory, 'hero', 'elation');
  // 段階27b：素材を直接吸わせる（吸わせ枠を使う）
  r.armory = absorbMaterial(WEAPON_DATA, r.armory, 'akari', 'goldfishScale');
  r.progress = progressAt(STORY, 2);
  r.pendingReward = 'battle2';
  r.event = 'd1_clockshop';
  r.vars = { goldfish: 'あかね', prize: 'robot' };
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

  it('版5のセーブ（吸わせ枠がなかった）は、枠を0として読む（段階27b）', () => {
    const res = parseEdited((raw) => {
      raw.version = 5;
      for (const w of Object.values(raw.run.armory.weapons) as any[]) delete w.absorbed;
    });
    expect(res.ok && res.save.version).toBe(SAVE_VERSION);
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

describe('セーブ：古い版から直す', () => {
  it('移行の手順を順に通して、今の版に直してから読む', () => {
    // 版0では、星の砂を memoryPoints という名前で持っていた、という想定
    const v0 = JSON.parse(serializeSave(playedRun(), AT));
    v0.version = 0;
    v0.run.memoryPoints = v0.run.growth.points + 5;
    const res = parseSave(JSON.stringify(v0), ctx, {
      ...MIGRATIONS,
      0: (raw: any) => ({ ...raw, run: { ...raw.run, growth: { ...raw.run.growth, points: raw.run.memoryPoints } } }),
      // 版1・2 → 次の版は、形が同じだった、という想定
      1: (raw: any) => raw,
      2: (raw: any) => raw,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.save.version).toBe(SAVE_VERSION);
    expect(res.save.run.growth.points).toBe(playedRun().growth.points + 5);
  });

  it('版1・2のセーブ（試作の5戦だけ）は、古い版として読まない（段階23で引き継がないと決めた）', () => {
    for (const version of [1, 2]) {
      const res = parseEdited((raw) => (raw.version = version));
      expect(res).toEqual({ ok: false, error: `版${version}から直す手順がない`, old: true });
    }
  });

  it('版3のセーブ（探索がなかった）は、探索の途中ではないものとして読む', () => {
    const res = parseEdited((raw) => {
      raw.version = 3;
      delete raw.run.explore;
    });
    expect(res.ok && res.save.version).toBe(SAVE_VERSION);
    expect(res.ok && res.save.run.explore).toBeNull();
  });

  it('版4のセーブ（つながりゲージを引き継がなかった）は、ゲージなしとして読む', () => {
    const res = parseEdited((raw) => {
      raw.version = 4;
      delete raw.run.linkGauge;
    });
    expect(res.ok && res.save.version).toBe(SAVE_VERSION);
    expect(res.ok && res.save.run.linkGauge).toBeNull();
  });

  it('引き継ぐつながりゲージ：今の流れにない章は捨て、量は0〜満タンにおさめる', () => {
    const ok = parseEdited((raw) => (raw.run.linkGauge = { chapter: 'ch1', value: 60 }));
    expect(ok.ok && ok.save.run.linkGauge).toEqual({ chapter: 'ch1', value: 60 });
    const over = parseEdited((raw) => (raw.run.linkGauge = { chapter: 'ch1', value: 999 }));
    expect(over.ok && over.save.run.linkGauge).toEqual({ chapter: 'ch1', value: 100 });
    const gone = parseEdited((raw) => (raw.run.linkGauge = { chapter: 'removed', value: 50 }));
    expect(gone.ok && gone.save.run.linkGauge).toBeNull();
    const bad = parseEdited((raw) => (raw.run.linkGauge = { chapter: 'ch1', value: 'a' }));
    expect(bad.ok && bad.save.run.linkGauge).toBeNull();
  });

  it('版6のセーブ（返した時間がなかった）は、まだ何も返していないものとして読む。知らない区画は捨てる（段階28）', () => {
    const res = parseEdited((raw) => {
      raw.version = 6;
      delete raw.run.returned;
    });
    expect(res.ok && res.save.run.returned).toEqual([]);
    const kept = parseEdited((raw) => (raw.run.returned = ['a11', 'removed', 'a11']));
    expect(kept.ok && kept.save.run.returned).toEqual(['a11']);
  });

  it('直す手順がない古い版は読まない', () => {
    const res = parseEdited((raw) => (raw.version = 0));
    expect(res).toEqual({ ok: false, error: '版0から直す手順がない', old: true });
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
    const res2 = parseEdited((raw) => (raw.run.event = 'd2_noa'));
    expect(res2.ok && res2.save.run.progress.day).toBe(2);
    const res3 = parseEdited((raw) => (raw.run.event = 'removedEvent'));
    expect(res3.ok && res3.save.run.event).toBe('prologue_open');
    expect(parseEdited((raw) => delete raw.run.event).ok).toBe(false);
    expect(parseEdited((raw) => (raw.run.vars = 'x')).ok).toBe(false);
  });

  it('探索の状態を読み戻す。知らない区画なら、探索の途中ではないことにする', () => {
    const explore = { area: 'a11', cell: [11, 17], checkpoint: [11, 17], openedChests: ['a11_chest_goldfish'], defeated: ['a11_e_plaza'], seen: ['a11_first_koma'], cleared: false, koma: 3 };
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
