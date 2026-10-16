import { describe, expect, it } from 'vitest';
import type { GrowthState } from '../../src/core';
import { capWeaponData, chapterLocked, createArmory, createGrowth, getOpenError, maxWeaponLevel, openableNodes, openNode, weaponLevel, weaponSlots } from '../../src/core';
import { CHAPTER1_LINEUP, CHAPTER2_LINEUP, GROWTH_CHAPTER_ROWS, GROWTH_MAP, HERO, PARTY, SLICE_FLOW, WEAPON_DATA, WEAPON_LEVEL_CAPS } from '../../src/data';

// 章の区切り（段階49。docs/design/economy.md の 2.・7.）：星図の章の鍵と、武器のレベルの上限
describe('星図の章の鍵（段階49）', () => {
  it('上の3行（17マス）は2章から。ほかはいつでも', () => {
    const locked = GROWTH_MAP.nodes.filter((n) => n.chapter !== undefined);
    expect(locked.length).toBe(17);
    expect(locked.every((n) => n.row < 3 && n.chapter === 2)).toBe(true);
    expect(GROWTH_CHAPTER_ROWS).toEqual([{ rows: 3, chapter: 2 }]);
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

describe('武器のレベルの上限（段階49）', () => {
  it('上限で切ったデータでは、経験値が貯まってもレベル・吸わせ枠が上限で止まり、上限が上がると貯めた分で上がる', () => {
    const ch1 = capWeaponData(WEAPON_DATA, 5);
    const w = { ...createArmory(WEAPON_DATA).weapons.hero, exp: 60 };
    expect(w.exp).toBe(60);
    expect(weaponLevel(ch1, w.exp)).toBe(5);
    expect(maxWeaponLevel(ch1)).toBe(5);
    expect(weaponSlots(ch1, w)).toBe(weaponSlots(WEAPON_DATA, { ...w, exp: WEAPON_DATA.levelExp[3] }));
    expect(weaponLevel(capWeaponData(WEAPON_DATA, 7), w.exp)).toBe(7);
    // 上限がない・表より大きい時はそのまま
    expect(capWeaponData(WEAPON_DATA)).toBe(WEAPON_DATA);
    expect(capWeaponData(WEAPON_DATA, 99)).toBe(WEAPON_DATA);
  });

  it('物語の章のパーティには章の番号があり、どの章にも武器の上限がある（1章 Lv5、2章 Lv7）', () => {
    expect(CHAPTER1_LINEUP.chapter).toBe(1);
    expect(CHAPTER2_LINEUP.chapter).toBe(2);
    for (const c of SLICE_FLOW) if (c.lineup?.chapter !== undefined) expect(WEAPON_LEVEL_CAPS[c.lineup.chapter], c.id).toBeDefined();
    expect(WEAPON_LEVEL_CAPS).toEqual({ 1: 5, 2: 7 });
    // 2章の上限は、今の武器のレベルの表の終わり（3回目の進化 Lv7）に届く
    expect(WEAPON_LEVEL_CAPS[2]).toBe(maxWeaponLevel(WEAPON_DATA));
  });
});
