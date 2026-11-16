import type { DigLayerDef, DigRarity, DigSkillId, DigToolId, DigWorldDef } from '../core/dig';
import { digLayerTop } from '../core/dig';
import { huntGearKey } from '../core/hunt';
import { wantsLostVoice } from '../core/lost';
import { AREA_BATTLES, AREAS } from './areas';
import { LOST_ITEMS } from './lost';
import { CHAIN_ENEMY_SNAPS } from './chainAreas';
import { DIG_LORE, digLoreVar } from './sandBottomLore';
import { WEAPON_DATA } from './weapons';

/** ふつうの掘る砂と、固い土を掘る回数（段階230。「誰が掘る？」の数の枠に使う） */
export const SAND_BOTTOM_DIG_COST = 3;
export const SAND_BOTTOM_CLAY_HITS = 2;

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
  // 段階213：狩りの採取の場所の素材（砂嵐が落とさない物も）。珍しさは素材の珍しさのまま
  for (const id of areaIds.flatMap((a) => AREAS[a]?.hunt?.gathers.flatMap((g) => g.items) ?? [])) {
    const r = WEAPON_DATA.items[id]?.rarity;
    out[r === 'rare' ? 'rare' : r === 'uncommon' ? 'uncommon' : 'common'].add(id);
  }
  return { common: [...out.common], uncommon: [...out.uncommon], rare: [...out.rare] };
}

function withDigItems(items: Record<DigRarity, string[]>, extra: string[]): Record<DigRarity, string[]> {
  return extra.length === 0 ? items : { ...items, uncommon: [...items.uncommon, ...extra] };
}

/** 帯のぬしの巣のぬし（段階213）：その区画のぬし（区画が2つなら後の方。大正の祭りの夜は2晩目のぬし） */
function bandLord(areaIds: string[]): string | undefined {
  return [...areaIds]
    .reverse()
    .map((a) => `${a}_boss`)
    .find((b) => AREA_BATTLES[b]);
}

/** 光る物の id（段階213）：記憶の宝箱 'gear:<採取の場所>'、落とし物 'lost:<落とし物>'。段階214：道具の包み 'tool:<道具>'（仕組みが置く） */
export const relicGear = (gatherId: string) => `gear:${gatherId}`;
export const relicLost = (lostId: string) => `lost:${lostId}`;

/** 光る物の id を読む（段階213） */
export function parseRelic(id: string): { kind: 'gear' | 'lost' | 'tool' | 'rare'; ref: string } | null {
  const m = /^(gear|lost|tool|rare):(.+)$/.exec(id);
  return m ? { kind: m[1] as 'gear' | 'lost' | 'tool' | 'rare', ref: m[2] } : null;
}

/** 記憶の宝箱に入るギア（段階213。狩りの採取の場所のギア） */
export function relicGears(gatherId: string): string[] {
  for (const a of Object.values(AREAS)) {
    const g = a.hunt?.gathers.find((x) => x.id === gatherId);
    if (g) return g.gears ?? [];
  }
  return [];
}

/**
 * 帯の光る物（段階213）：まだ手に入れていない採取の場所のギアから1つ（記憶の宝箱）と、引き受けた依頼の声のかけら（段階220）
 */
function bandRelics(areaIds: string[], vars: Readonly<Record<string, string>>): string[] {
  const gear = areaIds
    .flatMap((a) => AREAS[a]?.hunt?.gathers ?? [])
    .find((g) => (g.gears?.length ?? 0) > 0 && !vars[huntGearKey(g.id)]);
  // 段階220：声をたどる依頼の、次の声のかけら（1回の潜りで1つ）
  const lost = LOST_ITEMS.filter((d) => areaIds.includes(d.area) && wantsLostVoice(d, { ...vars }));
  return [...(gear ? [relicGear(gear.id)] : []), ...lost.map((d) => relicLost(d.id))];
}

/** 層の色（砂・固い土・岩・空洞・崩れる砂） */
export interface DigColors {
  sand: number;
  clay: number;
  rock: number;
  air: number;
  loose: number;
}

/** 砂の底の道具（段階214。S7a。数値は仮）。戦闘には持ち込まない。交換所で記憶の欠片で買える */
export interface DigToolDef {
  id: DigToolId;
  name: string;
  note: string;
  price: number;
}

export const DIG_TOOLS: Record<DigToolId, DigToolDef> = {
  blast: { id: 'blast', name: '爆ぜる石', note: 'まわり8マスをまとめて掘る（砂は1回分。岩は残る）', price: 3 },
  ladder: { id: 'ladder', name: '縄ばしご', note: 'この回は、帰り道に要る砂が半分', price: 3 },
  bell: { id: 'bell', name: '砂嵐よけの鈴', note: '10手のあいだ、砂嵐が動かず、湧かない', price: 2 },
  shard: { id: 'shard', name: '砂時計のかけら', note: '砂時計の砂 +25', price: 2 },
  // 段階215：暗がりのための道具
  lantern: { id: 'lantern', name: 'ランタン', note: 'この回は、暗がりで見える広さ +3', price: 2 },
  needle: { id: 'needle', name: '探し針', note: 'いちばん近い宝箱・光る物・ぬしの巣を2つ照らし、向きを知らせる', price: 2 },
};

/** 持っている道具の数を覚える、物語で覚えた値の名前（段階214。セーブの形は変えない） */
export const digToolVar = (id: string) => `dig:tool:${id}`;

/** 1種類の道具を持てる数（段階214） */
export const DIG_TOOL_OWN_MAX = 9;

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
  /** 層の特徴（段階215 の続き。開発者の案：層ごとに特徴。層に入った時に知らせる） */
  feature: string;
  /** 砂の底だけの素材（段階217）：common は宝箱・鉱脈からいつもの素材と一緒に、rare は珍品だけ */
  digItems: { common: string[]; rare: string[]; snaps?: string[]; gears?: string[] };
  bands: DigBand[];
  ground: Pick<DigLayerDef, 'rock' | 'clay' | 'ore' | 'grain' | 'loose' | 'caves' | 'chestRate' | 'nestRate' | 'weights' | 'deepWeights' | 'pit' | 'poison' | 'fossil' | 'moss' | 'springRate' | 'whirlRate' | 'dark'>;
}

/** 章の層の番人（段階212）：その章の区画の強い戦闘（`<区画>_n2_guard`）。なければ、いちばん報酬の多い砂嵐 */
function stratumGuards(st: DigStratum): string[] {
  const areas = st.bands.flatMap((b) => b.areas);
  const strong = areas.map((a) => `${a}_n2_guard`).filter((b) => AREA_BATTLES[b]);
  if (strong.length > 0) return strong;
  const all = areaBattles(areas);
  return [...all].sort((x, y) => (AREA_BATTLES[y].reward ?? 0) - (AREA_BATTLES[x].reward ?? 0)).slice(0, 1);
}

/** 稀に番人として出る、その章のぬし（段階212。`<区画>_boss`。2-3 のカイの負け戦は入れない） */
function stratumLords(st: DigStratum): string[] {
  return st.bands.flatMap((b) => b.areas.map((a) => `${a}_boss`)).filter((b) => AREA_BATTLES[b]);
}

/** 帯1つの深さ（マス）。段階214：開発者の声で 12 → 20 → 32（層をもっと長く） */
const BAND_ROWS = 32;

const band = (id: string, name: string, areas: string[], color: DigColors): DigBand => ({ id, name, areas, color });

/**
 * 心の層（段階212。docs/milestones/M3_sand_bottom.md の S4）。章ごとに返した順に積む（深いほど後の章）。数値はすべて仮。
 * 5章〜終章の層（手続き記憶・潜在記憶・前意識・無意識・集合的無意識）は、その章を作る時に足す
 */
const STRATA: DigStratum[] = [
  {
    chapter: 'ch1',
    name: '感覚記憶の層',
    digItems: { common: ['digScent', 'digBlink'], rare: ['digAfterglow', 'digEcho'], snaps: ['dig_zanzo'], gears: ['digFlash'] },
    feature: '一瞬だけ残る記憶。砂時計の砂粒が多い',
    bands: [
      band('kingyo', '金魚の名前', ['a11'], { sand: 0xd8a070, clay: 0xb06a4a, rock: 0x7d8088, air: 0x1d120d, loose: 0xeec09a }),
      band('futari', '夕暮れの二人乗り', ['a12'], { sand: 0xd2a868, clay: 0xa8794a, rock: 0x7d8088, air: 0x1d140d, loose: 0xe8c890 }),
    ],
    ground: { rock: 0.06, clay: 0.16, ore: 0.04, grain: 0.03, loose: 0.08, caves: 8, chestRate: 0.6, nestRate: 0.5, weights: { common: 70, uncommon: 25, rare: 5 }, deepWeights: { common: 30, uncommon: 45, rare: 25 }, pit: 0.02, poison: 0.02, fossil: 0.01, springRate: 0.2, whirlRate: 0.15, dark: 4 },
  },
  {
    chapter: 'ch2',
    name: '短期記憶の層',
    digItems: { common: ['digLint', 'digSugarChip'], rare: ['digSpool', 'digSugarStone'], snaps: ['dig_utakata'], gears: ['digFleeting', 'shellCrack'] },
    feature: 'すぐ崩れる記憶。崩れる砂が多い',
    bands: [
      band('oyakata', '親方の背中', ['a21'], { sand: 0xb08458, clay: 0x7a5236, rock: 0x6c6f78, air: 0x1a110b, loose: 0xcca27a }),
      band('bunkasai', '最後の文化祭', ['a22'], { sand: 0xbca070, clay: 0x8a7046, rock: 0x6c6f78, air: 0x17130c, loose: 0xd6bc8c }),
      band('daseki', '最後の打席', ['a23'], { sand: 0xc49a62, clay: 0x946a40, rock: 0x6c6f78, air: 0x1a120a, loose: 0xdcb482 }),
    ],
    ground: { rock: 0.1, clay: 0.18, ore: 0.05, grain: 0.015, loose: 0.2, caves: 8, chestRate: 0.6, nestRate: 0.65, weights: { common: 50, uncommon: 38, rare: 12 }, deepWeights: { common: 20, uncommon: 45, rare: 35 }, pit: 0.04, poison: 0.04, fossil: 0.015, moss: 0.012, springRate: 0.2, whirlRate: 0.22, dark: 3 },
  },
  {
    chapter: 'ch3',
    name: 'エピソード記憶の層',
    digItems: { common: ['digPhotoScrap', 'digSecondHand'], rare: ['digPostcard', 'digPocketWatch'], snaps: ['dig_kaiso'], gears: ['digSomato'] },
    feature: '思い出の場面が眠る。空洞と化石が多い',
    bands: [
      band('shiokuri', 'はじめての仕送り', ['a31'], { sand: 0x9a8a78, clay: 0x6a5a4c, rock: 0x5e6068, air: 0x14110f, loose: 0xb6a692 }),
      band('sotsugyo', '言えなかった卒業式', ['a32'], { sand: 0xb08a90, clay: 0x80606a, rock: 0x5e6068, air: 0x161012, loose: 0xcaa8ae }),
      band('taisho', '大正の祭りの夜', ['a3s1', 'a3s2'], { sand: 0x7a5a8a, clay: 0x5a3a6a, rock: 0x5a5c66, air: 0x120c18, loose: 0x9c7cac }),
    ],
    ground: { rock: 0.15, clay: 0.24, ore: 0.055, grain: 0.015, loose: 0.11, caves: 10, chestRate: 0.6, nestRate: 0.8, weights: { common: 30, uncommon: 45, rare: 25 }, deepWeights: { common: 10, uncommon: 40, rare: 50 }, pit: 0.06, poison: 0.06, fossil: 0.04, moss: 0.015, springRate: 0.2, whirlRate: 0.3, dark: 2 },
  },
  {
    chapter: 'ch4',
    name: '意味記憶の層',
    digItems: { common: [], rare: [] },
    feature: '固く結びついた記憶。岩と鉱脈が多い',
    bands: [
      band('shiro', 'シロのいた夏', ['a41'], { sand: 0x8a9a6a, clay: 0x5e6c46, rock: 0x585c62, air: 0x0f140c, loose: 0xa6b688 }),
      band('hayase', '早瀬の時間', ['a42'], { sand: 0x6a8a8a, clay: 0x46605e, rock: 0x585c62, air: 0x0b1314, loose: 0x88a8a6 }),
    ],
    ground: { rock: 0.27, clay: 0.24, ore: 0.09, grain: 0.015, loose: 0.12, caves: 8, chestRate: 0.6, nestRate: 0.85, weights: { common: 20, uncommon: 45, rare: 35 }, deepWeights: { common: 5, uncommon: 35, rare: 60 }, pit: 0.08, poison: 0.08, fossil: 0.02, moss: 0.015, springRate: 0.2, whirlRate: 0.35, dark: 2 },
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
export const SAND_BOTTOM_SAND_BY_CHAPTER: Record<string, number> = { ch1: 200, ch2: 320, ch3: 720, ch4: 1040 };

function buildWorld(open: DigStratum[], sand: number, vars: Readonly<Record<string, string>>): DigWorldDef {
  // 段階215 の続き（開発者の声：層の前半にぬしが固まる → もっと深い所へ）：ぬしの巣と光る物は、章の層のいちばん下の帯にまとめる
  const layers: DigLayerDef[] = open.flatMap((st) =>
    st.bands.map((b, bi) => ({
      id: b.id,
      name: st.name,
      group: st.chapter,
      rows: BAND_ROWS,
      // 段階217：砂の底だけのふつうの素材も、宝箱・鉱脈から（◆の段に混ぜる）
      items: withDigItems(areaItems(b.areas), st.digItems.common),
      battles: areaBattles(b.areas),
      guards: stratumGuards(st),
      lords: stratumLords(st),
      nests: bi === st.bands.length - 1 ? st.bands.flatMap((x) => bandLord(x.areas) ?? []) : [],
      relics: bi === st.bands.length - 1 ? st.bands.flatMap((x) => bandRelics(x.areas, vars)) : [],
      ...st.ground,
    })),
  );
  // ふつうの地面：1マス下りるのに砂が2以上かかる（いちばん安い掘り方）。砂粒で戻る分も見込んで、入った時の砂と同じ行数
  layers.push({ id: DEEP_GROUND_ID, name: DEEP_GROUND_NAME, group: DEEP_GROUND_ID, rows: sand, rock: 0.08, clay: 0.3, ore: 0, grain: 0, loose: 0.1, caves: 0, chestRate: 0, nestRate: 0, items: { common: [], uncommon: [], rare: [] }, weights: { common: 1, uncommon: 0, rare: 0 }, battles: [], dark: 2 });
  return {
    width: 15,
    layers,
    sand,
    // 段階209：空洞の移動は砂を使わない（掘る時だけ）。段階216（開発者の声：掘った道を戻れば帰り道が砂なしになる）：空洞の移動も砂 1
    cost: { walk: 1, dig: SAND_BOTTOM_DIG_COST, battle: 10, back: 1 },
    grainSand: 12,
    chase: 5,
    // 段階209：空洞に稀に砂嵐が湧く（帰り道でも出会う）
    spawn: { rate: 0.03, min: 5, max: 10, cap: 14 },
    bagMax: 10,
    // 段階212：層の境目の番人が、稀にその層の章のぬし
    lordRate: 0.15,
    // 段階214：道具袋と、空洞に落ちている道具の包み、掘る人の技の回数
    toolMax: 3,
    toolRate: 0.25,
    tools: Object.keys(DIG_TOOLS),
    skillUses: 2,
  };
}

/**
 * その章の砂の底（段階212）：終えた章の層まで開く（2章は感覚記憶の層、3章で短期記憶の層が加わる…）。
 * 1章（入口は出さない。デバッグの入口から入った時）は、感覚記憶の層だけ
 */
export function sandBottomFor(chapterId: string | undefined, vars: Readonly<Record<string, string>> = {}): DigWorldDef {
  const n = chapterNo(chapterId);
  const open = STRATA.filter((_, i) => i + 1 < n);
  const list = Object.values(SAND_BOTTOM_SAND_BY_CHAPTER);
  const sand = (chapterId && SAND_BOTTOM_SAND_BY_CHAPTER[chapterId]) || list[list.length - 1];
  return buildWorld(open.length > 0 ? open : STRATA.slice(0, 1), sand, vars);
}

/** 章の層の特徴（段階215 の続き）：層のまとまり（章）→ 名前と特徴 */
export const SAND_BOTTOM_FEATURES: Record<string, { name: string; feature: string }> = Object.fromEntries(STRATA.map((st) => [st.chapter, { name: st.name, feature: st.feature }]));

/**
 * その層（帯）の星の砂と経験値の割合（段階213）：開いている中でいちばん深い（いちばん最近の）章の層は満額、それより上は old（狩りの前の章と同じ割合）。
 * ふつうの地面の番人は、いちばん下の章の層の物なので満額
 */
export function digRewardRate(def: DigWorldDef, layerId: string, old: number): number {
  const groups = def.layers.map((l) => l.group).filter((g) => g !== DEEP_GROUND_ID);
  const latest = groups[groups.length - 1];
  const g = def.layers.find((l) => l.id === layerId)?.group;
  return g === latest || g === DEEP_GROUND_ID ? 1 : old;
}

/** 今ある章の層をみな開いた砂の底（テスト・絵の見本。4章の時と同じ） */
export const SAND_BOTTOM: DigWorldDef = sandBottomFor('ch4');

/** 帯の名前（区画の名前）。層の id から。段階212 の調整で、画面には出さない（開発者の声：帯はあっても名前は要らない） */
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

/** 掘る人の技（段階214。S7b。数値は仮。1回潜るごとに2回） */
export interface DigSkillDef {
  id: DigSkillId;
  name: string;
  note: string;
}

export const DIG_SKILLS: Record<DigSkillId, DigSkillDef> = {
  stop: { id: 'stop', name: '時を止める', note: '3手のあいだ、砂嵐が動かず、湧かない' },
  heal: { id: 'heal', name: '応急手当', note: 'みんなの HP が最大の3割戻る' },
  rush: { id: 'rush', name: '突進掘り', note: '向いている方へ3マスを一気に掘って進む（砂は1回分）' },
  slash: { id: 'slash', name: '一閃', note: '向いている方の4マスを、岩も含めて割る（砂は1回分）' },
  rewind: { id: 'rewind', name: '巻き戻し', note: '砂時計の砂 +30' },
};

/** 応急手当で戻る HP の割合 */
export const DIG_HEAL_SKILL_RATE = 0.3;

/** 掘る人の特徴（段階211。S3。数値は仮）。掘る人は潜る前に、今の章の仲間から選ぶ。戦闘の並びとは関係ない */
export interface DigDiggerDef {
  /** 画面に出す特徴の説明 */
  note: string;
  /** 「誰が掘る？」の札の、特徴のひとこと（段階230） */
  tag: string;
  /** 掘る時の砂（書かなければ、ふつうの量） */
  dig?: number;
  /** 岩を割れる時の砂（層の境目の岩の帯は割れない） */
  rockCost?: number;
  /** 固い土を1回で掘れる */
  clayOnce?: boolean;
  /** 砂嵐に勝つたびに、みんなの HP が最大のこの割合だけ戻る */
  heal?: number;
  /** 技（段階214） */
  skill: DigSkillId;
  /** 「誰が掘る？」の札の色（段階214） */
  color: number;
}

export const SAND_BOTTOM_DIGGERS: Record<string, DigDiggerDef> = {
  hero: { note: '平均。とくに得手も不得手もない', tag: 'バランス', skill: 'stop', color: 0x2a3a7a },
  akari: { note: '砂嵐に勝つたびに、みんなの HP が2割戻る', tag: '回復', heal: 0.2, skill: 'heal', color: 0x8a3a4a },
  mio: { note: '固い土を1回で掘れる', tag: '固い土に強い', clayOnce: true, skill: 'rush', color: 0x8a6a1a },
  sayoko: { note: '岩を割れる（砂 6。層の境目の岩は割れない）', tag: '岩を割る', rockCost: 6, skill: 'slash', color: 0x3a2a6a },
  hayase: { note: '掘る時の砂が少ない（3 → 2）', tag: '砂を節約', dig: 2, skill: 'rewind', color: 0x1f4a4a },
};

/** 「誰が掘る？」の4つの数の枠（段階230）。up はふつうより得意な所（黄で光らせる） */
export function diggerStats(id: string): { label: string; value: string; up: boolean }[] {
  const d = SAND_BOTTOM_DIGGERS[id];
  if (!d) return [];
  const dig = d.dig ?? SAND_BOTTOM_DIG_COST;
  return [
    { label: '掘る砂', value: String(dig), up: dig < SAND_BOTTOM_DIG_COST },
    { label: '固い土', value: d.clayOnce ? '1回' : `${SAND_BOTTOM_CLAY_HITS}回`, up: !!d.clayOnce },
    { label: '岩', value: d.rockCost ? `砂${d.rockCost}` : '✕', up: !!d.rockCost },
    { label: '勝った時', value: d.heal ? `HP+${Math.round(d.heal * 10)}割` : 'ー', up: !!d.heal },
  ];
}

/** その人が掘る時の砂の底（特徴を数値に入れる）。知らない人は、そのまま */
export function withDigger(def: DigWorldDef, digger: string): DigWorldDef {
  const d = SAND_BOTTOM_DIGGERS[digger];
  if (!d) return def;
  return { ...def, cost: { ...def.cost, dig: d.dig ?? def.cost.dig }, rockCost: d.rockCost, clayOnce: d.clayOnce };
}

/** 前に選んだ掘る人を覚える、物語で覚えた値の名前（段階211） */
export const SAND_BOTTOM_DIGGER_VAR = 'dig:digger';

// ---- 段階217（S8a）：潜るたびに変わる特別ルールと、珍品 ----

/** 特別ルール（潜るたびに1つ。なしもある） */
export type DigRuleId = 'none' | 'traps' | 'dark' | 'chests' | 'storms' | 'grains';

export const DIG_RULES: Record<DigRuleId, { name: string; note: string }> = {
  none: { name: 'いつもどおり', note: '特別なことはない' },
  traps: { name: '罠が多い', note: '落とし穴・毒の砂・流砂の渦が2倍' },
  dark: { name: '真っ暗', note: '見える広さが1マス狭い' },
  chests: { name: '宝箱が多い', note: '宝箱が1.5倍' },
  storms: { name: '砂嵐が多い', note: '砂嵐が1.5倍。そのかわり珍品が出やすい' },
  grains: { name: '砂粒が多い', note: '砂時計の砂粒が2倍' },
};

/** 特別ルールの並び（乱数で選ぶ順。なしを少し多めに） */
const RULE_TABLE: DigRuleId[] = ['none', 'none', 'traps', 'dark', 'chests', 'storms', 'grains'];

/** その回の特別ルール（潜った回数とシードで決まる。開き直しても同じ回は同じ） */
export function digRuleFor(seed: number, count: number): DigRuleId {
  const v = ((Math.imul((seed ^ Math.imul(count + 1, 2654435761)) >>> 0, 1103515245) + 12345) >>> 0) % 1000;
  return RULE_TABLE[Math.floor((v / 1000) * RULE_TABLE.length)];
}

/** 特別ルールを砂の底に入れる */
export function withRule(def: DigWorldDef, rule: DigRuleId | undefined): DigWorldDef {
  if (!rule || rule === 'none') return def;
  const map = (f: (l: DigLayerDef) => DigLayerDef): DigWorldDef => ({ ...def, layers: def.layers.map((l) => (l.group === DEEP_GROUND_ID ? l : f(l))) });
  if (rule === 'traps') return map((l) => ({ ...l, pit: (l.pit ?? 0) * 2, poison: (l.poison ?? 0) * 2, whirlRate: Math.min(1, (l.whirlRate ?? 0) * 2) }));
  if (rule === 'dark') return { ...def, layers: def.layers.map((l) => ({ ...l, dark: Math.max(1, (l.dark ?? 4) - 1) })) };
  if (rule === 'chests') return map((l) => ({ ...l, chestRate: Math.min(1, l.chestRate * 1.5) }));
  if (rule === 'storms') return { ...map((l) => ({ ...l, nestRate: Math.min(1, l.nestRate * 1.5) })), spawn: def.spawn ? { ...def.spawn, rate: def.spawn.rate * 1.5 } : def.spawn };
  return map((l) => ({ ...l, grain: l.grain * 2 }));
}

/** 珍品の確率（段階217）：まだ取ったことがなければ高め、取ると下がり、外れるたびに上がる */
export const DIG_RARE = { first: 0.4, low: 0.05, step: 0.05, max: 0.4, storms: 0.15 } as const;
export const DIG_RARE_GOT_VAR = 'dig:rare:got';
export const DIG_RARE_MISS_VAR = 'dig:rare:miss';

export function digRareChance(vars: Readonly<Record<string, string>>, rule?: DigRuleId): number {
  const base = vars[DIG_RARE_GOT_VAR] ? Math.min(DIG_RARE.max, DIG_RARE.low + DIG_RARE.step * Number(vars[DIG_RARE_MISS_VAR] ?? 0)) : DIG_RARE.first;
  return Math.min(1, base + (rule === 'storms' ? DIG_RARE.storms : 0));
}

/** 潜り終えた時の、珍品の確率の覚え（取った → 外れた回数を 0 に。取らなかった → 外れた回数 +1） */
export function digRareAfter(vars: Readonly<Record<string, string>>, got: boolean): Record<string, string> {
  if (got) return { ...vars, [DIG_RARE_GOT_VAR]: '1', [DIG_RARE_MISS_VAR]: '0' };
  return { ...vars, [DIG_RARE_MISS_VAR]: String(Number(vars[DIG_RARE_MISS_VAR] ?? 0) + 1) };
}

/** 持っているかを調べる（呼ぶ側の目録・持ち物から） */
export interface DigOwned {
  item: (id: string) => boolean;
  snap: (id: string) => boolean;
  gear: (id: string) => boolean;
}

/** 開いている章の層（その章の砂の底で） */
function openStrata(chapterId: string | undefined): DigStratum[] {
  const n = chapterNo(chapterId);
  const open = STRATA.filter((_, i) => i + 1 < n);
  return open.length > 0 ? open : STRATA.slice(0, 1);
}

/** 懐かしい物の候補（段階217）：区画の物語の宝箱の素材・スナップ・ギアと、区画のぬしのスナップのうち、まだ手に入れたことのない物 */
function oldCandidates(areaIds: string[], owned: DigOwned): string[] {
  const out: string[] = [];
  for (const a of areaIds) {
    for (const c of AREAS[a]?.chests ?? []) {
      for (const it of c.items) if (WEAPON_DATA.items[it] && !owned.item(it)) out.push(`old:item:${it}`);
      for (const sn of c.chainSnaps ?? []) if (!owned.snap(sn)) out.push(`old:snap:${sn}`);
      for (const g of c.gears ?? []) if (!owned.gear(g)) out.push(`old:gear:${g}`);
    }
    for (const e of AREA_BATTLES[`${a}_boss`]?.enemies ?? []) {
      const sn = CHAIN_ENEMY_SNAPS[e.id];
      if (sn && !owned.snap(sn)) out.push(`old:snap:${sn}`);
    }
  }
  return [...new Set(out)];
}

/**
 * その回の珍品を決める（段階217）。rand は 0〜1 の乱数。埋めない回は null。
 * 中身の重み：砂の底のレア素材 3・レアスナップ 1・レアギア 1（段階219。まだ持っていない物だけ）・懐かしい物 2・りくのメモ 2・誰かの日記 2（ない種類は外す）。読み物は番号の若い物から
 */
export function pickDigRare(chapterId: string | undefined, vars: Readonly<Record<string, string>>, owned: DigOwned, rule: DigRuleId | undefined, rand: () => number): string | null {
  if (rand() >= digRareChance(vars, rule)) return null;
  const strata = openStrata(chapterId);
  const chapters = new Set(strata.map((st) => st.chapter));
  const rares = strata.flatMap((st) => st.digItems.rare);
  const snaps = strata.flatMap((st) => st.digItems.snaps ?? []).filter((id) => !owned.snap(id));
  const gears = strata.flatMap((st) => st.digItems.gears ?? []).filter((id) => !owned.gear(id));
  const olds = oldCandidates(strata.flatMap((st) => st.bands.flatMap((b) => b.areas)), owned);
  const lore = (kind: 'riku' | 'diary') => DIG_LORE.filter((d) => d.kind === kind && chapters.has(d.stratum) && !vars[digLoreVar(d.id)]).sort((a, b) => a.no - b.no)[0];
  const riku = lore('riku');
  const diary = lore('diary');
  const kinds: [string, number][] = [
    ['rare', rares.length > 0 ? 3 : 0],
    ['snap', snaps.length > 0 ? 1 : 0],
    ['gear', gears.length > 0 ? 1 : 0],
    ['old', olds.length > 0 ? 2 : 0],
    ['riku', riku ? 2 : 0],
    ['diary', diary ? 2 : 0],
  ];
  const total = kinds.reduce((n, [, w]) => n + w, 0);
  if (total === 0) return null;
  let v = rand() * total;
  let kind = kinds[0][0];
  for (const [k, w] of kinds) {
    if (v < w) {
      kind = k;
      break;
    }
    v -= w;
  }
  if (kind === 'rare') return `rare:item:${rares[Math.floor(rand() * rares.length)]}`;
  if (kind === 'snap') return `rare:snap:${snaps[Math.floor(rand() * snaps.length)]}`;
  if (kind === 'gear') return `rare:gear:${gears[Math.floor(rand() * gears.length)]}`;
  if (kind === 'old') return `rare:${olds[Math.floor(rand() * olds.length)]}`;
  return `rare:lore:${(kind === 'riku' ? riku : diary)!.id}`;
}

/** 珍品を、開いている章の層のいちばん下の帯の光る物に足す（深い章の層ほど選ばれやすい） */
export function withRareRelic(def: DigWorldDef, relic: string, rand: () => number): DigWorldDef {
  const lastBands = def.layers.filter((l, i) => l.group !== DEEP_GROUND_ID && def.layers[i + 1]?.group !== l.group);
  if (lastBands.length === 0) return def;
  const weights = lastBands.map((_, i) => i + 1);
  let v = rand() * weights.reduce((a, b) => a + b, 0);
  let pick = lastBands[lastBands.length - 1];
  for (let i = 0; i < lastBands.length; i++) {
    if (v < weights[i]) {
      pick = lastBands[i];
      break;
    }
    v -= weights[i];
  }
  return { ...def, layers: def.layers.map((l) => (l.id === pick.id ? { ...l, relics: [...(l.relics ?? []), relic] } : l)) };
}

/** 珍品の id を読む：rare:item:<素材>・rare:old:item|snap|gear:<id>・rare:lore:<読み物> */
export function parseRare(ref: string): { kind: 'item' | 'snap' | 'gear' | 'oldItem' | 'oldSnap' | 'oldGear' | 'lore'; id: string } | null {
  const m = /^(item|snap|gear|lore):(.+)$/.exec(ref);
  if (m) return { kind: m[1] as 'item' | 'snap' | 'gear' | 'lore', id: m[2] };
  const o = /^old:(item|snap|gear):(.+)$/.exec(ref);
  if (o) return { kind: o[1] === 'item' ? 'oldItem' : o[1] === 'snap' ? 'oldSnap' : 'oldGear', id: o[2] };
  return null;
}

/** ちゃんと潜った回数を覚える、物語で覚えた値の名前（段階218） */
export const DIG_FULL_VAR = 'dig:full';

/**
 * ちゃんと潜ったとみなす深さ（段階218）：開いている中でいちばん浅い章の層の、いちばん下の帯（宝の帯）の上の端。
 * ここまで潜った回だけ、特別ルール・珍品・外れを進める（潜ってすぐ戻る選び直しを防ぐ）
 */
export function digFullDepth(def: DigWorldDef): number {
  const first = def.layers[0]?.group;
  const band = [...def.layers].reverse().find((l) => l.group === first);
  return band ? digLayerTop(def, band.id) : 1;
}

/** 潜り終えた時の覚え（段階218）：ちゃんと潜った回だけ回数と外れを進める。珍品を取った回は、深さに関係なく取った */
export function digAfterDive(vars: Readonly<Record<string, string>>, full: boolean, got: boolean): Record<string, string> {
  let v: Record<string, string> = { ...vars };
  if (full) v[DIG_FULL_VAR] = String(Number(vars[DIG_FULL_VAR] ?? 0) + 1);
  if (got || full) v = digRareAfter(v, got);
  return v;
}

/** 砂の底だけのレアギア（段階219。珍品で手に入る） */
export const SAND_BOTTOM_RARE_GEARS: string[] = STRATA.flatMap((st) => st.digItems.gears ?? []);
