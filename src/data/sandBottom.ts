import type { DigLayerDef, DigRarity, DigWorldDef } from '../core/dig';
import { AREA_BATTLES, AREAS } from './areas';

// 砂の底を掘る（段階207。試作1。docs/milestones/M3_sand_bottom.md）。数値はすべて仮。
// 上の層ほど今に近い時代。宝箱の中身と砂嵐は、その時代の区画の砂嵐から集める（区画の雑魚の戦闘と、落とす素材）。
// 段階208：層の境目の番人は、その層の砂嵐の先頭の戦闘。鉱脈・砂時計の砂粒・崩れる砂の割合を足した

/** その区画の砂嵐（雑魚）の戦闘の id */
function areaBattles(areaIds: string[]): string[] {
  return [...new Set(areaIds.flatMap((id) => AREAS[id]?.enemies.map((e) => e.battle) ?? []))].filter((b) => AREA_BATTLES[b]);
}

/** その区画の砂嵐が落とす素材（珍しさごと） */
function areaItems(areaIds: string[]): Record<DigRarity, string[]> {
  const out: Record<DigRarity, Set<string>> = { common: new Set(), uncommon: new Set(), rare: new Set() };
  for (const b of areaBattles(areaIds)) {
    for (const e of AREA_BATTLES[b].enemies) {
      const t = e.dropTable;
      if (!t) continue;
      out.common.add(t.common);
      if (t.uncommon) out.uncommon.add(t.uncommon);
      if (t.rare) out.rare.add(t.rare);
    }
  }
  return { common: [...out.common], uncommon: [...out.uncommon], rare: [...out.rare] };
}

function layer(id: string, name: string, areaIds: string[], rest: Omit<DigLayerDef, 'id' | 'name' | 'items' | 'battles'>): DigLayerDef {
  return { id, name, items: areaItems(areaIds), battles: areaBattles(areaIds), ...rest };
}

export const SAND_BOTTOM: DigWorldDef = {
  width: 15,
  layers: [
    layer('heisei', '平成の層', ['a22', 'a23', 'a42'], { rows: 24, rock: 0.06, clay: 0.16, ore: 0.04, grain: 0.015, loose: 0.08, caves: 7, chestRate: 0.8, nestRate: 0.5, weights: { common: 70, uncommon: 25, rare: 5 } }),
    layer('showa', '昭和の層', ['a12', 'a21'], { rows: 26, rock: 0.12, clay: 0.22, ore: 0.05, grain: 0.015, loose: 0.1, caves: 8, chestRate: 0.8, nestRate: 0.7, weights: { common: 45, uncommon: 40, rare: 15 } }),
    layer('taisho', '大正の層', ['a3s1', 'a3s2'], { rows: 28, rock: 0.18, clay: 0.26, ore: 0.06, grain: 0.015, loose: 0.12, caves: 8, chestRate: 0.85, nestRate: 0.85, weights: { common: 20, uncommon: 45, rare: 35 } }),
  ],
  sand: 160,
  // 段階209：空洞の移動は砂を使わない（掘る時だけ）
  cost: { walk: 0, dig: 3, battle: 10, back: 1 },
  grainSand: 12,
  chase: 5,
  // 段階209：空洞に稀に砂嵐が湧く（帰り道でも出会う）
  spawn: { rate: 0.03, min: 5, max: 10, cap: 14 },
  bagMax: 10,
};

/** 深さの見せ方（1マス = 2m） */
export const SAND_BOTTOM_METERS_PER_ROW = 2;

/** 層の色（試作の四角のタイル。砂・固い土・岩） */
export const SAND_BOTTOM_COLORS: Record<string, { sand: number; clay: number; rock: number; air: number; loose: number }> = {
  heisei: { sand: 0xd2a868, clay: 0xa8794a, rock: 0x7d8088, air: 0x1d140d, loose: 0xe8c890 },
  showa: { sand: 0xb8844a, clay: 0x8a5a36, rock: 0x6c6f78, air: 0x1a110b, loose: 0xd4a46c },
  taisho: { sand: 0x7a5a8a, clay: 0x5a3a6a, rock: 0x5a5c66, air: 0x120c18, loose: 0x9c7cac },
};

/** 砂時計の砂（段階209。章ごとに増えて、深く掘れるようになる。数値は仮） */
export const SAND_BOTTOM_SAND_BY_CHAPTER: Record<string, number> = { ch1: 100, ch2: 140, ch3: 180, ch4: 220 };

/** その章の砂の底（砂時計の砂だけ章で変わる）。知らない章は、いちばん後の章の量 */
export function sandBottomFor(chapterId: string | undefined): DigWorldDef {
  const list = Object.values(SAND_BOTTOM_SAND_BY_CHAPTER);
  const sand = (chapterId && SAND_BOTTOM_SAND_BY_CHAPTER[chapterId]) || list[list.length - 1];
  return { ...SAND_BOTTOM, sand };
}

/** いちばん深く潜った深さ（マス）を覚える、物語で覚えた値の名前（段階209） */
export const SAND_BOTTOM_DEEPEST_VAR = 'dig:deepest';
