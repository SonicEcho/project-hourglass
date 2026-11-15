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

/** 層の色（砂・固い土・岩・空洞・崩れる砂） */
export interface DigColors {
  sand: number;
  clay: number;
  rock: number;
  air: number;
  loose: number;
}

/** 区画ごとの帯（段階212。章の層の中を区画ごとに分ける） */
interface DigBand {
  id: string;
  /** 帯の名前（区画の名前） */
  name: string;
  areas: string[];
  color: DigColors;
}

/** 章の層（段階212。心の層。深いほど後の章） */
interface DigStratum {
  chapter: string;
  name: string;
  bands: DigBand[];
  ground: Pick<DigLayerDef, 'rock' | 'clay' | 'ore' | 'grain' | 'loose' | 'caves' | 'chestRate' | 'nestRate' | 'weights'>;
}

/** 帯1つの深さ（マス） */
const BAND_ROWS = 12;

const band = (id: string, name: string, areas: string[], color: DigColors): DigBand => ({ id, name, areas, color });

/**
 * 心の層（段階212。docs/milestones/M3_sand_bottom.md の S4）。章ごとに返した順に積む（深いほど後の章）。数値はすべて仮。
 * 5章〜終章の層（手続き記憶・潜在記憶・前意識・無意識・集合的無意識）は、その章を作る時に足す
 */
const STRATA: DigStratum[] = [
  {
    chapter: 'ch1',
    name: '感覚記憶の層',
    bands: [
      band('kingyo', '金魚の名前', ['a11'], { sand: 0xd8a070, clay: 0xb06a4a, rock: 0x7d8088, air: 0x1d120d, loose: 0xeec09a }),
      band('futari', '夕暮れの二人乗り', ['a12'], { sand: 0xd2a868, clay: 0xa8794a, rock: 0x7d8088, air: 0x1d140d, loose: 0xe8c890 }),
    ],
    ground: { rock: 0.06, clay: 0.16, ore: 0.04, grain: 0.015, loose: 0.08, caves: 4, chestRate: 0.8, nestRate: 0.5, weights: { common: 70, uncommon: 25, rare: 5 } },
  },
  {
    chapter: 'ch2',
    name: '短期記憶の層',
    bands: [
      band('oyakata', '親方の背中', ['a21'], { sand: 0xb08458, clay: 0x7a5236, rock: 0x6c6f78, air: 0x1a110b, loose: 0xcca27a }),
      band('bunkasai', '最後の文化祭', ['a22'], { sand: 0xbca070, clay: 0x8a7046, rock: 0x6c6f78, air: 0x17130c, loose: 0xd6bc8c }),
      band('daseki', '最後の打席', ['a23'], { sand: 0xc49a62, clay: 0x946a40, rock: 0x6c6f78, air: 0x1a120a, loose: 0xdcb482 }),
    ],
    ground: { rock: 0.1, clay: 0.2, ore: 0.05, grain: 0.015, loose: 0.1, caves: 4, chestRate: 0.8, nestRate: 0.65, weights: { common: 50, uncommon: 38, rare: 12 } },
  },
  {
    chapter: 'ch3',
    name: 'エピソード記憶の層',
    bands: [
      band('shiokuri', 'はじめての仕送り', ['a31'], { sand: 0x9a8a78, clay: 0x6a5a4c, rock: 0x5e6068, air: 0x14110f, loose: 0xb6a692 }),
      band('sotsugyo', '言えなかった卒業式', ['a32'], { sand: 0xb08a90, clay: 0x80606a, rock: 0x5e6068, air: 0x161012, loose: 0xcaa8ae }),
      band('taisho', '大正の祭りの夜', ['a3s1', 'a3s2'], { sand: 0x7a5a8a, clay: 0x5a3a6a, rock: 0x5a5c66, air: 0x120c18, loose: 0x9c7cac }),
    ],
    ground: { rock: 0.15, clay: 0.24, ore: 0.055, grain: 0.015, loose: 0.11, caves: 4, chestRate: 0.85, nestRate: 0.8, weights: { common: 30, uncommon: 45, rare: 25 } },
  },
  {
    chapter: 'ch4',
    name: '意味記憶の層',
    bands: [
      band('shiro', 'シロのいた夏', ['a41'], { sand: 0x8a9a6a, clay: 0x5e6c46, rock: 0x585c62, air: 0x0f140c, loose: 0xa6b688 }),
      band('hayase', '早瀬の時間', ['a42'], { sand: 0x6a8a8a, clay: 0x46605e, rock: 0x585c62, air: 0x0b1314, loose: 0x88a8a6 }),
    ],
    ground: { rock: 0.18, clay: 0.26, ore: 0.06, grain: 0.015, loose: 0.12, caves: 4, chestRate: 0.85, nestRate: 0.85, weights: { common: 20, uncommon: 45, rare: 35 } },
  },
];

/** いちばん下の開いている層の下の、ふつうの地面（空洞・宝箱・砂嵐・鉱脈・砂粒なし）。砂がどうやっても足りない深さまで続ける */
const DEEP_GROUND_ID = 'deep';
const DEEP_GROUND_NAME = 'まだ思い出せない深さ';

/** 章の番号（ch2 → 2）。知らない章は 0 */
function chapterNo(chapterId: string | undefined): number {
  const m = /^ch(\d+)$/.exec(chapterId ?? '');
  return m ? Number(m[1]) : 0;
}

/** 砂の底に入れる最初の章（段階212：2章から） */
export const SAND_BOTTOM_FIRST_CHAPTER = 2;

/** その章で砂の底に入れるか（拠点の入口を出すか） */
export function canEnterSandBottom(chapterId: string | undefined): boolean {
  return chapterNo(chapterId) >= SAND_BOTTOM_FIRST_CHAPTER;
}

/** 砂時計の砂（段階209・212。章ごとに増え、開いている層の底まで行って探れるくらい。数値は仮） */
export const SAND_BOTTOM_SAND_BY_CHAPTER: Record<string, number> = { ch1: 100, ch2: 140, ch3: 260, ch4: 400 };

function buildWorld(open: DigStratum[], sand: number): DigWorldDef {
  const layers: DigLayerDef[] = open.flatMap((st) =>
    st.bands.map((b) => ({ id: b.id, name: st.name, group: st.chapter, rows: BAND_ROWS, items: areaItems(b.areas), battles: areaBattles(b.areas), ...st.ground })),
  );
  // ふつうの地面：1マス下りるのに砂が2以上かかる（いちばん安い掘り方）。砂粒で戻る分も見込んで、入った時の砂と同じ行数
  layers.push({ id: DEEP_GROUND_ID, name: DEEP_GROUND_NAME, group: DEEP_GROUND_ID, rows: sand, rock: 0.08, clay: 0.3, ore: 0, grain: 0, loose: 0.1, caves: 0, chestRate: 0, nestRate: 0, items: { common: [], uncommon: [], rare: [] }, weights: { common: 1, uncommon: 0, rare: 0 }, battles: [] });
  return {
    width: 15,
    layers,
    sand,
    // 段階209：空洞の移動は砂を使わない（掘る時だけ）
    cost: { walk: 0, dig: 3, battle: 10, back: 1 },
    grainSand: 12,
    chase: 5,
    // 段階209：空洞に稀に砂嵐が湧く（帰り道でも出会う）
    spawn: { rate: 0.03, min: 5, max: 10, cap: 14 },
    bagMax: 10,
  };
}

/**
 * その章の砂の底（段階212）：終えた章の層まで開く（2章は感覚記憶の層、3章で短期記憶の層が加わる…）。
 * 1章（入口は出さない。デバッグの入口から入った時）は、感覚記憶の層だけ
 */
export function sandBottomFor(chapterId: string | undefined): DigWorldDef {
  const n = chapterNo(chapterId);
  const open = STRATA.filter((_, i) => i + 1 < n);
  const list = Object.values(SAND_BOTTOM_SAND_BY_CHAPTER);
  const sand = (chapterId && SAND_BOTTOM_SAND_BY_CHAPTER[chapterId]) || list[list.length - 1];
  return buildWorld(open.length > 0 ? open : STRATA.slice(0, 1), sand);
}

/** 今ある章の層をみな開いた砂の底（テスト・絵の見本。4章の時と同じ） */
export const SAND_BOTTOM: DigWorldDef = sandBottomFor('ch4');

/** 帯の名前（区画の名前）。層の id から */
export const SAND_BOTTOM_BAND_NAMES: Record<string, string> = Object.fromEntries(STRATA.flatMap((st) => st.bands.map((b) => [b.id, b.name])));

/** 深さの見せ方（1マス = 2m） */
export const SAND_BOTTOM_METERS_PER_ROW = 2;

/** 層（帯）の色。章の層をまだ開いていなくても、すべての帯の分をはじめから持つ（絵を1度に作るため） */
export const SAND_BOTTOM_COLORS: Record<string, DigColors> = {
  ...Object.fromEntries(STRATA.flatMap((st) => st.bands.map((b) => [b.id, b.color]))),
  [DEEP_GROUND_ID]: { sand: 0x6a645c, clay: 0x4e4842, rock: 0x4a4c52, air: 0x0e0d0c, loose: 0x847c72 },
};

/** いちばん深く潜った深さ（マス）を覚える、物語で覚えた値の名前（段階209） */
export const SAND_BOTTOM_DEEPEST_VAR = 'dig:deepest';

/** 掘る人の特徴（段階211。S3。数値は仮）。掘る人は潜る前に、今の章の仲間から選ぶ。戦闘の並びとは関係ない */
export interface DigDiggerDef {
  /** 画面に出す特徴の説明 */
  note: string;
  /** 掘る時の砂（書かなければ、ふつうの量） */
  dig?: number;
  /** 岩を割れる時の砂（層の境目の岩の帯は割れない） */
  rockCost?: number;
  /** 固い土を1回で掘れる */
  clayOnce?: boolean;
  /** 砂嵐に勝つたびに、みんなの HP が最大のこの割合だけ戻る */
  heal?: number;
}

export const SAND_BOTTOM_DIGGERS: Record<string, DigDiggerDef> = {
  hero: { note: '平均。とくに得手も不得手もない' },
  akari: { note: '砂嵐に勝つたびに、みんなの HP が2割戻る', heal: 0.2 },
  mio: { note: '固い土を1回で掘れる', clayOnce: true },
  sayoko: { note: '岩を割れる（砂 6。層の境目の岩は割れない）', rockCost: 6 },
  hayase: { note: '掘る時の砂が少ない（3 → 2）', dig: 2 },
};

/** その人が掘る時の砂の底（特徴を数値に入れる）。知らない人は、そのまま */
export function withDigger(def: DigWorldDef, digger: string): DigWorldDef {
  const d = SAND_BOTTOM_DIGGERS[digger];
  if (!d) return def;
  return { ...def, cost: { ...def.cost, dig: d.dig ?? def.cost.dig }, rockCost: d.rockCost, clayOnce: d.clayOnce };
}

/** 前に選んだ掘る人を覚える、物語で覚えた値の名前（段階211） */
export const SAND_BOTTOM_DIGGER_VAR = 'dig:digger';
