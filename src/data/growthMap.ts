import type { GrowthMap, GrowthNodeDef, GrowthNodeEffect, StatKey } from '../core/growth';
import type { StarValues } from '../core/recommend';

// 星図（段階7。段階56で、本物の星座の形にした。docs/milestones/M2.md の段階56の詳細、見本は docs/sketches/starmap_*）。数値はすべて仮。
//
// 夏の大三角のまわりの星座：わし座（ハルト。アルタイルが出発点）、こと座（あかり。ベガ）、いるか座（みお。スアロキン）、
// や座・こぎつね座（3つをつなぐ橋）、はくちょう座（2章の区域。大きな能力値と強い魔法）。
// 位置は実際の赤経（時）・赤緯（度）から、空を見上げた向き（東が左）で決める。小さな星座は、その星座の中心から広げる（タップできるように）。
// 星同士が近すぎた所は、近くの実在の星に替えるか、少しずらした（や座β、はくちょう座θ）。道は星座の線に沿う。
// 行き止まりの星は、大きな能力値か魔法・スキル。ただし将来の星座へつなぐ場所（FRONTIER）はそのまま
// 星の効果：start:誰 / skill:技の id（CHAIN_SKILLS）/ trait:特性の id（CHAIN_TRAIT_STARS）/ 能力値は1文字（a 攻撃、h HP、m 魔力、p MP、d 防御。大文字は大）
// 段階194（段取りの段階G3b）：全体図の3版（docs/milestones/M3_catalog.md の 16.）の4章までに入れ替えた。速さの星はなくした（新しい戦闘に速さはない）
// 最後の列は、段階55までの格子の星図のマスの id（セーブを読む時に、この星へ付け替える）

/**
 * 能力値マスの上がり幅（小）。大はこの2倍。段階62で2倍にした（値段は3倍。星図をゆっくり広げる）。
 * 段階194：開発者と決めた「能力値は今の大きさのまま」に合わせ、上がり幅も今のまま（全体図の3版の +2・+5 は基準100前後の時の数字）。
 * 速さはもう上がらない（新しい戦闘に速さはない）
 */
export const STAT_STEP: Record<StatKey, number> = { hp: 24, mp: 12, atk: 4, mag: 4, def: 2, spd: 0 };

const STAT_CHARS: Record<string, StatKey> = { h: 'hp', p: 'mp', a: 'atk', m: 'mag', d: 'def' };

/** マスを開けるのに必要な星の砂（段階62で、1マスを重くした：小 1→3、大 2→6、スキル 3→8、通るだけ 1→3） */
export const GROWTH_COST = {
  stat: 3,
  statBig: 6,
  skill: 8,
  /** もう覚えている魔法・スキルのマスと、他のキャラの出発点は、通るだけ */
  passThrough: 3,
};

/** [id, 星の名前, 星座, 赤経（時）, 赤緯（度）, 何章の区域か, 効果, 前のマスの id] */
type StarRow = [string, string, string, number, number, number, string, string];

const STARS: StarRow[] = [
  // わし座（ハルト）
  ['altair', 'アルタイル', 'aql', 19.846, 8.87, 1, 'start:hero', 'n8_3'],
  ['tarazed', 'タラゼド', 'aql', 19.771, 10.61, 1, 'skill:midareGiri', 'n8_2'],
  ['alshain', 'アルシャイン', 'aql', 19.922, 6.41, 1, 'skill:hirameki', 'n8_4'],
  ['muAql', 'わし座μ', 'aql', 19.567, 7.38, 1, 'h', 'n3_2'],
  ['deltaAql', 'わし座δ', 'aql', 19.425, 3.11, 1, 'm', 'n3_4'],
  ['zetaAql', 'わし座ζ', 'aql', 19.090, 13.86, 1, 'h', 'n4_2'],
  ['epsAql', 'わし座ε', 'aql', 18.994, 15.07, 1, 'a', 'n4_3'],
  ['lambdaAql', 'わし座λ', 'aql', 19.104, -4.88, 1, 'h', 'n5_4'],
  ['iotaAql', 'わし座ι', 'aql', 19.613, -1.29, 1, 'trait:snapBoost', 'n4_4'],
  ['etaAql', 'わし座η', 'aql', 19.874, 1.01, 1, 'a', 'n6_2'],
  ['thetaAql', 'わし座θ', 'aql', 20.188, -0.82, 2, 'h', 'n6_3'],
  // こと座（あかり）
  ['vega', 'ベガ', 'lyr', 18.615, 38.78, 1, 'start:akari', 'n5_0'],
  ['epsLyr', 'こと座ε', 'lyr', 18.739, 39.67, 1, 'skill:cure', 'n7_0'],
  ['zetaLyr', 'こと座ζ', 'lyr', 18.746, 37.61, 1, 'h', 'n4_0'],
  ['deltaLyr', 'こと座δ', 'lyr', 18.908, 36.90, 1, 'a', 'n4_1'],
  ['sulafat', 'スラファト', 'lyr', 18.982, 32.69, 1, 'p', 'n5_2'],
  ['sheliak', 'シェリアク', 'lyr', 18.835, 33.36, 1, 'skill:wakeSong', 'n6_0'],
  ['thetaLyr', 'こと座θ', 'lyr', 19.272, 38.13, 1, 'skill:guardSong', 'n3_0'],
  ['kappaLyr', 'こと座κ', 'lyr', 18.331, 36.06, 1, 'm', 'n7_4'],
  // こぎつね座（こと座とや座の橋）
  ['anser', 'アンサー', 'vul', 19.478, 24.67, 1, 'h', 'n6_1'],
  // や座（橋）
  ['alphaSge', 'や座α', 'sge', 19.668, 18.01, 1, 'd', 'n7_2'],
  ['betaSge', 'や座β', 'sge', 19.684, 16.48, 1, 'p', 'n8_0'],
  ['deltaSge', 'や座δ', 'sge', 19.790, 18.53, 2, 'a', 'n4_5'],
  ['gammaSge', 'や座γ', 'sge', 19.979, 19.49, 3, 'h', 'n4_6'],
  // いるか座（みお）
  ['sualocin', 'スアロキン', 'del', 20.661, 15.91, 1, 'start:mio', 'n5_6'],
  ['rotanev', 'ロタネフ', 'del', 20.626, 14.60, 1, 'skill:thunder', 'n3_6'],
  ['gammaDel', 'いるか座γ', 'del', 20.777, 16.12, 1, 'm', 'n6_5'],
  ['deltaDel', 'いるか座δ', 'del', 20.724, 15.07, 1, 'h', 'n7_6'],
  ['epsDel', 'いるか座ε', 'del', 20.554, 11.30, 3, 'skill:prank', 'n6_6'],
  ['etaDel', 'いるか座η', 'del', 20.564, 13.03, 1, 'm', 'n8_6'],
  ['kappaDel', 'いるか座κ', 'del', 20.656, 10.09, 3, 'trait:pushPlus', 'n6_4'],
  // はくちょう座（2章の区域）
  ['deneb', 'デネブ', 'cyg', 20.690, 45.28, 2, 'H', 'n0_3'],
  ['sadr', 'サドル', 'cyg', 20.370, 40.26, 2, 'A', 'n0_4'],
  ['etaCyg', 'はくちょう座η', 'cyg', 19.938, 35.08, 2, 'd', 'n1_2'],
  ['phiCyg', 'はくちょう座φ', 'cyg', 19.657, 30.15, 2, 'a', 'n1_4'],
  ['albireo', 'アルビレオ', 'cyg', 19.512, 27.96, 2, 'm', 'n1_6'],
  ['deltaCyg', 'はくちょう座δ', 'cyg', 19.750, 45.13, 2, 'a', 'n1_0'],
  ['thetaCyg', 'はくちょう座θ', 'cyg', 19.640, 49.40, 2, 'd', 'n2_1'],
  ['iotaCyg', 'はくちょう座ι', 'cyg', 19.495, 51.73, 2, 'A', 'n0_0'],
  ['kappaCyg', 'はくちょう座κ', 'cyg', 19.285, 53.37, 2, 'skill:blizzara', 'n0_1'],
  ['gienah', 'ギェナー', 'cyg', 20.770, 33.97, 2, 'skill:shuffle', 'n2_4'],
  ['c41', 'はくちょう座41', 'cyg', 20.488, 30.37, 2, 'H', 'n0_2'],
  ['zetaCyg', 'はくちょう座ζ', 'cyg', 21.216, 30.23, 2, 'skill:thundara', 'n0_5'],
  ['tauCyg', 'はくちょう座τ', 'cyg', 21.248, 38.05, 2, 'm', 'n2_5'],
  ['nuCyg', 'はくちょう座ν', 'cyg', 20.953, 41.17, 2, 'h', 'n2_6'],
  ['xiCyg', 'はくちょう座ξ', 'cyg', 21.082, 43.93, 2, 'M', 'n2_2'],
  ['rhoCyg', 'はくちょう座ρ', 'cyg', 21.566, 45.59, 2, 'trait:healBoost', 'n0_6'],
  ['omiCyg', 'はくちょう座ο', 'cyg', 20.227, 46.74, 2, 'p', 'n2_0'],
  // ---- ヘルクレス座（段階91a。3章の区域。小夜子の出発点はπ。こと座κから、θを通ってつながる）。最後の列は、前のマスがないので空 ----
  ['piHer', 'ヘルクレス座π', 'her', 17.251, 36.81, 3, 'start:sayoko', ''],
  ['etaHer', 'ヘルクレス座η', 'her', 16.715, 38.92, 3, 'a', ''],
  ['zetaHer', 'ヘルクレス座ζ', 'her', 16.688, 31.6, 3, 'skill:yoroiDooshi', ''],
  ['epsHer', 'ヘルクレス座ε', 'her', 17.005, 30.93, 3, 'A', ''],
  // ρ はπに近すぎるので、少しずらした（タップできるように）
  ['rhoHer', 'ヘルクレス座ρ', 'her', 17.62, 39.6, 3, 'h', ''],
  ['thetaHer', 'ヘルクレス座θ', 'her', 17.937, 37.25, 3, 'h', ''],
  ['iotaHer', 'ヘルクレス座ι', 'her', 17.657, 46.01, 3, 'trait:heavyBoost', ''],
  ['deltaHer', 'ヘルクレス座δ', 'her', 17.251, 24.84, 3, 'P', ''],
  ['muHer', 'ヘルクレス座μ', 'her', 17.774, 27.72, 4, 'skill:mikiri', ''],
  ['betaHer', 'ヘルクレス座β', 'her', 16.503, 21.49, 4, 'skill:niNoTachi', ''],
  ['alphaHer', 'ラス・アルゲティ', 'her', 17.244, 14.39, 4, 'trait:partBoost', ''],
  // ---- ケフェウス座（段階140a。4章の区域。早瀬の出発点はアルデラミン。はくちょう座ρから、μを通ってつながる）。魔力の星を多めに ----
  ['alderamin', 'アルデラミン', 'cep', 21.31, 62.59, 4, 'start:hayase', ''],
  ['muCep', 'ケフェウス座μ', 'cep', 21.725, 58.78, 4, 'h', ''],
  ['etaCep', 'ケフェウス座η', 'cep', 20.755, 61.84, 4, 'a', ''],
  ['thetaCep', 'ケフェウス座θ', 'cep', 20.495, 62.99, 4, 'skill:pendulum', ''],
  ['alfirk', 'アルフィルク', 'cep', 21.478, 70.56, 4, 'skill:kaen', ''],
  ['iotaCep', 'ケフェウス座ι', 'cep', 22.828, 66.2, 4, 'P', ''],
  ['zetaCep', 'ケフェウス座ζ', 'cep', 22.181, 58.2, 4, 'm', ''],
  // ε はζに近すぎるので、少しずらした（タップできるように）
  ['epsCep', 'ケフェウス座ε', 'cep', 22.3, 55.6, 4, 'trait:timeMpSave', ''],
  ['deltaCep', 'ケフェウス座δ', 'cep', 22.486, 58.42, 4, 'trait:fireBoost', ''],
];

/**
 * 暗い星（段階194。段階G3b）：技・特性どうしの間に能力値の星を2つ以上、出発点と最初の技の間に1つ以上はさむため、同じ星座の暗い星を足した
 * （docs/milestones/M3_catalog.md の 16-4。全体図の3版）。位置は星図の上の x・y（明るい星と同じ目盛り。全体図の位置から、タップできるよう星どうしを 34 以上離した）。[id, 星座, 何章の区域か, x, y, 効果]
 */
const DIM_STARS: [string, string, number, number, number, string][] = [
  ['mid0', 'aql', 1, 579, 828, 'd'],
  ['mid1', 'aql', 1, 562, 875, 'a'],
  ['mid2', 'lyr', 1, 859, 438, 'h'],
  ['mid3', 'lyr', 1, 772, 467, 'm'],
  ['mid4', 'lyr', 2, 719, 479, 'd'],
  ['mid5', 'del', 2, 493, 873, 'a'],
  ['mid6', 'del', 1, 481, 829, 'd'],
  ['mid7', 'del', 1, 509, 760, 'a'],
  ['mid8', 'del', 3, 511, 948, 'p'],
  ['mid9', 'del', 3, 544, 929, 'h'],
  ['mid10', 'cyg', 2, 420, 546, 'h'],
  ['mid11', 'cyg', 2, 429, 583, 'm'],
  ['mid12', 'cep', 4, 351, 127, 'm'],
  ['br4', 'her', 3, 1171, 608, 'p'],
  ['br5', 'cep', 4, 168, 223, 'd'],
  ['br6', 'her', 3, 1216, 641, 'd'],
  ['br7', 'her', 3, 1230, 693, 'h'],
  ['br8', 'her', 3, 1046, 679, 'a'],
  ['br9', 'her', 4, 1008, 664, 'h'],
  ['br10', 'her', 3, 1083, 776, 'a'],
  ['br50', 'aql', 3, 496, 1013, 'p'],
  ['br51', 'del', 3, 485, 976, 'd'],
  ['br52', 'cyg', 4, 305, 350, 'm'],
  ['br53', 'cep', 4, 295, 294, 'a'],
  ['br55', 'cyg', 2, 393, 572, 'a'],
  ['br56', 'cyg', 2, 365, 547, 'p'],
  ['br57', 'sge', 2, 547, 763, 'm'],
  ['br58', 'del', 1, 531, 803, 'p'],
];

/** 道（星-星）。段階194：全体図の3版の道（4章までの星どうし） */
const LINKS: string[] = [
  'tarazed-mid0', 'mid0-altair', 'altair-mid1', 'mid1-alshain', 'altair-muAql', 'muAql-deltaAql', 'deltaAql-zetaAql', 'zetaAql-epsAql',
  'deltaAql-lambdaAql', 'deltaAql-iotaAql', 'alshain-etaAql', 'etaAql-thetaAql', 'vega-mid2', 'mid2-epsLyr', 'vega-zetaLyr', 'zetaLyr-sheliak',
  'zetaLyr-deltaLyr', 'deltaLyr-sulafat', 'sheliak-sulafat', 'vega-kappaLyr', 'epsLyr-mid3', 'mid3-mid4', 'mid4-thetaLyr', 'thetaLyr-deltaLyr',
  'sulafat-anser', 'anser-alphaSge', 'alphaSge-deltaSge', 'betaSge-deltaSge', 'deltaSge-gammaSge', 'betaSge-tarazed', 'epsAql-alphaSge', 'epsDel-mid5',
  'mid5-mid6', 'mid6-rotanev', 'rotanev-mid7', 'mid7-sualocin', 'sualocin-gammaDel', 'gammaDel-deltaDel', 'deltaDel-rotanev', 'etaDel-rotanev',
  'kappaDel-mid8', 'mid8-mid9', 'mid9-epsDel', 'albireo-phiCyg', 'phiCyg-etaCyg', 'etaCyg-sadr', 'sadr-deneb', 'sadr-deltaCyg',
  'deltaCyg-thetaCyg', 'thetaCyg-iotaCyg', 'iotaCyg-kappaCyg', 'sadr-gienah', 'gienah-mid10', 'mid10-mid11', 'gienah-c41', 'deneb-nuCyg',
  'nuCyg-xiCyg', 'xiCyg-rhoCyg', 'tauCyg-nuCyg', 'deltaCyg-omiCyg', 'omiCyg-deneb', 'albireo-anser', 'deltaCyg-thetaLyr', 'kappaLyr-thetaHer',
  'thetaHer-rhoHer', 'rhoHer-piHer', 'thetaHer-iotaHer', 'piHer-etaHer', 'etaHer-zetaHer', 'epsHer-piHer', 'epsHer-deltaHer', 'muCep-alderamin',
  'alderamin-etaCep', 'etaCep-thetaCep', 'alderamin-mid12', 'mid12-alfirk', 'alfirk-iotaCep', 'iotaCep-zetaCep', 'zetaCep-muCep', 'zetaCep-epsCep',
  'epsHer-br4', 'br4-zetaHer', 'zetaCep-br5', 'br5-deltaCep', 'zetaHer-br6', 'br6-br7', 'br7-betaHer', 'deltaHer-br8',
  'br8-br9', 'br9-muHer', 'deltaHer-br10', 'br10-alphaHer', 'thetaAql-br50', 'br50-br51', 'br51-kappaDel', 'rhoCyg-br52',
  'br52-br53', 'br53-muCep', 'mid11-br55', 'br55-zetaCyg', 'tauCyg-br56', 'br56-zetaCyg', 'gammaSge-br57', 'br57-br58',
  'br58-etaDel',
];

/** 星座の名前と、名前を出す場所（その星からのずれ） */
const CONSTELLATIONS: Record<string, { name: string; label: [string, number, number] }> = {
  aql: { name: 'わし座', label: ['lambdaAql', 0, 34] },
  lyr: { name: 'こと座', label: ['vega', 0, -40] },
  vul: { name: 'こぎつね座', label: ['anser', -58, 4] },
  sge: { name: 'や座', label: ['gammaSge', 30, -26] },
  del: { name: 'いるか座', label: ['sualocin', -10, -44] },
  cyg: { name: 'はくちょう座', label: ['kappaCyg', 0, -34] },
  her: { name: 'ヘルクレス座', label: ['etaHer', 0, -40] },
  cep: { name: 'ケフェウス座', label: ['alfirk', 0, -34] },
};

/** 星座ごとの広げ方（小さな星座ほど大きく） */
const SPREAD: Record<string, number> = { aql: 1.5, lyr: 1.7, vul: 1, sge: 2.3, del: 2.5, cyg: 1, her: 1.2, cep: 1.1 };
/** 1度あたりの大きさ（星図は画面より大きく、指でずらして見る） */
const PX_PER_DEG = 13;
/** 星図のまわりの余白（将来の星座への「？」の分） */
const MARGIN = 70;
/** 空の中心（赤経・赤緯）。ここからの角度で並べる */
const SKY_CENTER = { ra: 20.0, dec: 24 };

/** 将来の星座へつなぐ場所（行き止まりのまま）。外へ向かう向きと、その先の星座 */
export const GROWTH_FRONTIER: { node: string; dx: number; dy: number; name: string }[] = [
  { node: 'kappaCyg', dx: 0.06, dy: -1.0, name: 'りゅう座' },
  { node: 'alphaHer', dx: -0.94, dy: -0.33, name: 'へびつかい座' },
  { node: 'kappaDel', dx: -0.94, dy: -0.35, name: 'ペガスス座' },
  { node: 'iotaHer', dx: 0.92, dy: -0.39, name: 'りゅう座' },
  { node: 'lambdaAql', dx: 0.91, dy: 0.42, name: 'たて座' },
  { node: 'thetaAql', dx: 0.88, dy: 0.47, name: 'いて座' },
  { node: 'iotaCep', dx: 0.27, dy: 0.96, name: 'ペガスス座' },
  { node: 'mid2', dx: 0.79, dy: -0.62, name: 'りゅう座' },
];

/** 名前を小さく出す星（1等星など）と、名前の置き場所（星からのずれ。寄せ方：left は文字の左端を合わせる、right は右端、center は真ん中） */
export const GROWTH_STAR_NAMES: Record<string, [number, number, 'left' | 'right' | 'center']> = {
  altair: [-20, 2, 'right'],
  tarazed: [-14, -12, 'right'],
  vega: [0, -30, 'center'],
  deneb: [14, -12, 'left'],
  albireo: [12, -10, 'left'],
  sualocin: [0, -30, 'center'],
  sadr: [12, -10, 'left'],
};

function effectOf(code: string): GrowthNodeEffect {
  const [kind, value] = code.split(':');
  if (kind === 'start') return { kind: 'start', owner: value };
  if (kind === 'skill') return { kind: 'skill', skillId: value };
  if (kind === 'trait') return { kind: 'trait', traitId: value };
  const stat = STAT_CHARS[code.toLowerCase()];
  if (!stat) throw new Error(`unknown star effect: ${code}`);
  const big = code !== code.toLowerCase();
  return { kind: big ? 'statBig' : 'stat', stat, amount: STAT_STEP[stat] * (big ? 2 : 1) };
}

function buildMap(): GrowthMap {
  const cos = Math.cos((SKY_CENTER.dec * Math.PI) / 180);
  // 空を見上げた向き：赤経が増える方（東）が左、赤緯が増える方（北）が上
  const raw = STARS.map(([id, name, con, ra, dec, chapter, code]) => ({ id, name, con, chapter, code, x: -(ra - SKY_CENTER.ra) * 15 * cos, y: -(dec - SKY_CENTER.dec) }));
  for (const con of Object.keys(SPREAD)) {
    const g = raw.filter((s) => s.con === con);
    const cx = g.reduce((a, s) => a + s.x, 0) / g.length;
    const cy = g.reduce((a, s) => a + s.y, 0) / g.length;
    for (const s of g) {
      s.x = cx + (s.x - cx) * SPREAD[con];
      s.y = cy + (s.y - cy) * SPREAD[con];
    }
  }
  const minX = Math.min(...raw.map((s) => s.x));
  const minY = Math.min(...raw.map((s) => s.y));
  const maxX = Math.max(...raw.map((s) => s.x));
  const maxY = Math.max(...raw.map((s) => s.y));
  const nodes = raw.map((s): GrowthNodeDef => {
    const base = { id: s.id, name: s.name, con: s.con, x: Math.round(MARGIN + (s.x - minX) * PX_PER_DEG), y: Math.round(MARGIN + (s.y - minY) * PX_PER_DEG) };
    return { ...base, ...(s.chapter > 1 ? { chapter: s.chapter } : {}), ...effectOf(s.code) };
  });
  // 暗い星（段階194）：位置は明るい星と同じ目盛りの x・y
  for (const [id, con, chapter, x, y, code] of DIM_STARS) {
    nodes.push({ id, name: `${CONSTELLATIONS[con]?.name ?? ''}の暗い星`, con, x, y, ...(chapter > 1 ? { chapter } : {}), ...effectOf(code) });
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const constellations = Object.fromEntries(
    Object.entries(CONSTELLATIONS).map(([con, c]) => {
      const at = byId.get(c.label[0]);
      return [con, { name: c.name, x: (at?.x ?? 0) + c.label[1], y: (at?.y ?? 0) + c.label[2] }];
    }),
  );
  return {
    width: Math.round((maxX - minX) * PX_PER_DEG + MARGIN * 2),
    height: Math.round((maxY - minY) * PX_PER_DEG + MARGIN * 2),
    nodes,
    edges: LINKS.map((l) => l.split('-') as [string, string]),
    costs: GROWTH_COST,
    renamed: Object.fromEntries(STARS.filter((s) => s[7] !== '').map((s) => [s[7], s[0]])),
    constellations,
  };
}

export const GROWTH_MAP: GrowthMap = buildMap();

/**
 * 星図の「おすすめの道」（段階100）：星の価値。価値 ÷ そこまで開けるのに要る星の砂 が一番大きい星を目指す。
 * まだ覚えていない魔法・スキル ＞ 大きな能力値 ＞ 能力値。その仲間の星座（出発点のある星座）の星は home 倍
 */
// 段階194：技・特性の手前に能力値の星をはさんだので、技までの値段が上がった。技を目指すよう、技と特性の価値を上げた（10 → 14、特性 12）
// 段階195：ほかの仲間の星座の技と特性は、価値を半分に（自分の技を取り終えるまで、ほかの仲間の技を目指さない）
export const GROWTH_RECOMMEND: StarValues = { stat: 3, statBig: 7, skill: 14, trait: 12, home: 1.5, away: 0.5 };

/** 周回の始めに持っている星の砂（段階62で 3→8。最初の魔法・スキルを1つ開けられる） */
export const START_MEMORY_POINTS = 8;
/** 部位を1つ壊すごとにもらえる星の砂 */
export const PART_BREAK_POINTS = 2;
