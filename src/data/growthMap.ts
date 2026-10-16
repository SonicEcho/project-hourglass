import type { GrowthMap, GrowthNodeDef, GrowthNodeEffect, StatKey } from '../core/growth';

// 星図（段階7。段階56で、本物の星座の形にした。docs/milestones/M2.md の段階56の詳細、見本は docs/sketches/starmap_*）。数値はすべて仮。
//
// 夏の大三角のまわりの星座：わし座（ハルト。アルタイルが出発点）、こと座（あかり。ベガ）、いるか座（みお。スアロキン）、
// や座・こぎつね座（3つをつなぐ橋）、はくちょう座（2章の区域。大きな能力値と強い魔法）。
// 位置は実際の赤経（時）・赤緯（度）から、空を見上げた向き（東が左）で決める。小さな星座は、その星座の中心から広げる（タップできるように）。
// 星同士が近すぎた所は、近くの実在の星に替えるか、少しずらした（や座β、はくちょう座θ）。道は星座の線に沿う。
// 行き止まりの星は、大きな能力値か魔法・スキル。ただし将来の星座へつなぐ場所（FRONTIER）はそのまま
// 星の効果：start:誰 / skill:魔法・スキルの id / 能力値は1文字（a 攻撃、h HP、m 魔力、p MP、d 防御、s 速さ。大文字は大）
// 最後の列は、段階55までの格子の星図のマスの id（セーブを読む時に、この星へ付け替える）

/** 能力値マスの上がり幅（小）。大はこの2倍 */
export const STAT_STEP: Record<StatKey, number> = { hp: 12, mp: 6, atk: 2, mag: 2, def: 1, spd: 1 };

const STAT_CHARS: Record<string, StatKey> = { h: 'hp', p: 'mp', a: 'atk', m: 'mag', d: 'def', s: 'spd' };

/** マスを開けるのに必要な星の砂 */
export const GROWTH_COST = {
  stat: 1,
  statBig: 2,
  skill: 3,
  /** もう覚えている魔法・スキルのマスと、他のキャラの出発点は、通るだけ */
  passThrough: 1,
};

/** [id, 星の名前, 星座, 赤経（時）, 赤緯（度）, 何章の区域か, 効果, 前のマスの id] */
type StarRow = [string, string, string, number, number, number, string, string];

const STARS: StarRow[] = [
  // わし座（ハルト）
  ['altair', 'アルタイル', 'aql', 19.846, 8.87, 1, 'start:hero', 'n8_3'],
  ['tarazed', 'タラゼド', 'aql', 19.771, 10.61, 1, 'skill:doubleSlash', 'n8_2'],
  ['alshain', 'アルシャイン', 'aql', 19.922, 6.41, 1, 'skill:fire', 'n8_4'],
  ['muAql', 'わし座μ', 'aql', 19.567, 7.38, 1, 'a', 'n3_2'],
  ['deltaAql', 'わし座δ', 'aql', 19.425, 3.11, 1, 'h', 'n3_4'],
  ['zetaAql', 'わし座ζ', 'aql', 19.090, 13.86, 1, 'a', 'n4_2'],
  ['epsAql', 'わし座ε', 'aql', 18.994, 15.07, 1, 'h', 'n4_3'],
  ['lambdaAql', 'わし座λ', 'aql', 19.104, -4.88, 1, 'a', 'n5_4'],
  ['iotaAql', 'わし座ι', 'aql', 19.613, -1.29, 1, 'D', 'n4_4'],
  ['etaAql', 'わし座η', 'aql', 19.874, 1.01, 1, 'a', 'n6_2'],
  ['thetaAql', 'わし座θ', 'aql', 20.188, -0.82, 1, 'h', 'n6_3'],
  // こと座（あかり）
  ['vega', 'ベガ', 'lyr', 18.615, 38.78, 1, 'start:akari', 'n5_0'],
  ['epsLyr', 'こと座ε', 'lyr', 18.739, 39.67, 1, 'skill:cure', 'n7_0'],
  ['zetaLyr', 'こと座ζ', 'lyr', 18.746, 37.61, 1, 'm', 'n4_0'],
  ['deltaLyr', 'こと座δ', 'lyr', 18.908, 36.90, 1, 'p', 'n4_1'],
  ['sulafat', 'スラファト', 'lyr', 18.982, 32.69, 1, 'm', 'n5_2'],
  ['sheliak', 'シェリアク', 'lyr', 18.835, 33.36, 1, 'skill:care', 'n6_0'],
  ['thetaLyr', 'こと座θ', 'lyr', 19.272, 38.13, 1, 'skill:ice', 'n3_0'],
  ['kappaLyr', 'こと座κ', 'lyr', 18.331, 36.06, 1, 'h', 'n7_4'],
  // こぎつね座（こと座とや座の橋）
  ['anser', 'アンサー', 'vul', 19.478, 24.67, 1, 'p', 'n6_1'],
  // や座（橋）
  ['alphaSge', 'や座α', 'sge', 19.668, 18.01, 1, 'a', 'n7_2'],
  ['betaSge', 'や座β', 'sge', 19.684, 16.48, 1, 'p', 'n8_0'],
  ['deltaSge', 'や座δ', 'sge', 19.790, 18.53, 1, 's', 'n4_5'],
  ['gammaSge', 'や座γ', 'sge', 19.979, 19.49, 1, 's', 'n4_6'],
  // いるか座（みお）
  ['sualocin', 'スアロキン', 'del', 20.661, 15.91, 1, 'start:mio', 'n5_6'],
  ['rotanev', 'ロタネフ', 'del', 20.626, 14.60, 1, 'skill:thunder', 'n3_6'],
  ['gammaDel', 'いるか座γ', 'del', 20.777, 16.12, 1, 's', 'n6_5'],
  ['deltaDel', 'いるか座δ', 'del', 20.724, 15.07, 1, 's', 'n7_6'],
  ['epsDel', 'いるか座ε', 'del', 20.554, 11.30, 1, 'skill:inspiration', 'n6_6'],
  ['etaDel', 'いるか座η', 'del', 20.564, 13.03, 1, 's', 'n8_6'],
  ['kappaDel', 'いるか座κ', 'del', 20.656, 10.09, 1, 'd', 'n6_4'],
  // はくちょう座（2章の区域）
  ['deneb', 'デネブ', 'cyg', 20.690, 45.28, 2, 'skill:fira', 'n0_3'],
  ['sadr', 'サドル', 'cyg', 20.370, 40.26, 2, 'A', 'n0_4'],
  ['etaCyg', 'はくちょう座η', 'cyg', 19.938, 35.08, 2, 'h', 'n1_2'],
  ['phiCyg', 'はくちょう座φ', 'cyg', 19.657, 30.15, 2, 'd', 'n1_4'],
  ['albireo', 'アルビレオ', 'cyg', 19.512, 27.96, 2, 's', 'n1_6'],
  ['deltaCyg', 'はくちょう座δ', 'cyg', 19.750, 45.13, 2, 'm', 'n1_0'],
  ['thetaCyg', 'はくちょう座θ', 'cyg', 19.640, 49.40, 2, 'm', 'n2_1'],
  ['iotaCyg', 'はくちょう座ι', 'cyg', 19.495, 51.73, 2, 'P', 'n0_0'],
  ['kappaCyg', 'はくちょう座κ', 'cyg', 19.285, 53.37, 2, 'skill:blizzara', 'n0_1'],
  ['gienah', 'ギェナー', 'cyg', 20.770, 33.97, 2, 'H', 'n2_4'],
  ['c41', 'はくちょう座41', 'cyg', 20.488, 30.37, 2, 'M', 'n0_2'],
  ['zetaCyg', 'はくちょう座ζ', 'cyg', 21.216, 30.23, 2, 'skill:thundara', 'n0_5'],
  ['tauCyg', 'はくちょう座τ', 'cyg', 21.248, 38.05, 2, 's', 'n2_5'],
  ['nuCyg', 'はくちょう座ν', 'cyg', 20.953, 41.17, 2, 's', 'n2_6'],
  ['xiCyg', 'はくちょう座ξ', 'cyg', 21.082, 43.93, 2, 'D', 'n2_2'],
  ['rhoCyg', 'はくちょう座ρ', 'cyg', 21.566, 45.59, 2, 'S', 'n0_6'],
  ['omiCyg', 'はくちょう座ο', 'cyg', 20.227, 46.74, 2, 'p', 'n2_0'],
];

/** 道（星-星） */
const LINKS: string[] = [
  'tarazed-altair', 'altair-alshain', 'altair-muAql', 'muAql-deltaAql', 'deltaAql-zetaAql', 'zetaAql-epsAql', 'deltaAql-lambdaAql', 'deltaAql-iotaAql',
  'alshain-etaAql', 'etaAql-thetaAql', 'vega-epsLyr', 'vega-zetaLyr', 'zetaLyr-sheliak', 'zetaLyr-deltaLyr', 'deltaLyr-sulafat', 'sheliak-sulafat',
  'vega-kappaLyr', 'epsLyr-thetaLyr', 'thetaLyr-deltaLyr', 'sulafat-anser', 'anser-alphaSge', 'alphaSge-deltaSge', 'betaSge-deltaSge', 'deltaSge-gammaSge',
  'betaSge-tarazed', 'gammaSge-etaDel', 'epsAql-alphaSge', 'epsDel-rotanev', 'rotanev-sualocin', 'sualocin-gammaDel', 'gammaDel-deltaDel', 'deltaDel-rotanev',
  'etaDel-rotanev', 'kappaDel-epsDel', 'thetaAql-kappaDel', 'albireo-phiCyg', 'phiCyg-etaCyg', 'etaCyg-sadr', 'sadr-deneb', 'sadr-deltaCyg',
  'deltaCyg-thetaCyg', 'thetaCyg-iotaCyg', 'iotaCyg-kappaCyg', 'sadr-gienah', 'gienah-zetaCyg', 'gienah-c41', 'deneb-nuCyg', 'nuCyg-xiCyg',
  'xiCyg-rhoCyg', 'zetaCyg-tauCyg', 'tauCyg-nuCyg', 'deltaCyg-omiCyg', 'omiCyg-deneb', 'albireo-anser', 'deltaCyg-thetaLyr',
];

/** 星座の名前と、名前を出す場所（その星からのずれ） */
const CONSTELLATIONS: Record<string, { name: string; label: [string, number, number] }> = {
  aql: { name: 'わし座', label: ['lambdaAql', 0, 34] },
  lyr: { name: 'こと座', label: ['vega', 0, -40] },
  vul: { name: 'こぎつね座', label: ['anser', -58, 4] },
  sge: { name: 'や座', label: ['gammaSge', 30, -26] },
  del: { name: 'いるか座', label: ['sualocin', -10, -44] },
  cyg: { name: 'はくちょう座', label: ['kappaCyg', 0, -34] },
};

/** 星座ごとの広げ方（小さな星座ほど大きく） */
const SPREAD: Record<string, number> = { aql: 1.5, lyr: 1.7, vul: 1, sge: 2.3, del: 2.5, cyg: 1 };
/** 1度あたりの大きさ（星図は画面より大きく、指でずらして見る） */
const PX_PER_DEG = 13;
/** 星図のまわりの余白（将来の星座への「？」の分） */
const MARGIN = 70;
/** 空の中心（赤経・赤緯）。ここからの角度で並べる */
const SKY_CENTER = { ra: 20.0, dec: 24 };

/** 将来の星座へつなぐ場所（行き止まりのまま）。外へ向かう向きと、その先の星座 */
export const GROWTH_FRONTIER: { node: string; dx: number; dy: number; name: string }[] = [
  { node: 'lambdaAql', dx: 0.2, dy: 1, name: 'たて座・いて座' },
  { node: 'kappaLyr', dx: 1, dy: -0.15, name: 'ヘルクレス座' },
  { node: 'rhoCyg', dx: -1, dy: -0.3, name: 'ケフェウス座' },
  { node: 'kappaCyg', dx: 0.25, dy: -1, name: 'りゅう座' },
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
    renamed: Object.fromEntries(STARS.map((s) => [s[7], s[0]])),
    constellations,
  };
}

export const GROWTH_MAP: GrowthMap = buildMap();

/** 周回の始めに持っている星の砂 */
export const START_MEMORY_POINTS = 3;
/** 部位を1つ壊すごとにもらえる星の砂 */
export const PART_BREAK_POINTS = 2;
