import type { ChainBattleDef, ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove, ChainVariant, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { CHAIN17_CARDS as C, CHAIN17_COMBOS } from './chainTrial17';

// 段階160（段取りの段階D1）：1-1（縁日）の雑魚の戦闘を、新しい戦闘（並べてつなぐ戦闘）にする。
// 1-1 はチュートリアルなので、敵の性質は付けない（開発者と決めた。まずは予定・時間の帯・弱点・添える・クライマックス・コンボに慣れてもらう）。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘（AREA_BATTLES）のまま使い、予定の癖と型だけをここで書く

/** 新しい戦闘の札で、試しにない物（1-1 の回復） */
const RECOVER: ChainMove = { id: 'a11_recover', name: 'リカバー', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 15 }, text: '味方全体の HP を少し回復' };

/** リカバリー（段階163。1-1 のぬしの報酬）：味方全体を回復（中） */
const RECOVERY: ChainMove = { id: 'a11_recovery', name: 'リカバリー', type: 'support', weight: 2, target: 'allies', effect: { kind: 'heal', power: 30 }, text: '味方全体の HP を回復（中）' };

/**
 * 1-1 の敵のスナップ（段階165）：★3 で勝つと、確率で手に入る。アクションにエフェクトを1つ組み込む形（一覧の 11.）
 */
const ENEMY_SNAP = {
  hireuchi: { id: 'a11_hireuchi', name: 'ひれ打ち', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, push: 1 }, text: '敵1体に物理20。当たった敵の予定を1マス後ろへ' },
  mizushibuki: { id: 'a11_mizushibuki', name: '水しぶき', type: 'attack', weight: 2, target: 'enemies', effect: { kind: 'damage', element: 'ice', power: 15 }, text: '敵全体に氷15' },
  zutsuki: { id: 'a11_zutsuki', name: '頭突き', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 50, heavy: true, unsplittable: true }, text: '敵1体に物理50の重い一撃（かたい敵に強く、バリアを1発で割る）' },
  amaikiri: { id: 'a11_amaikiri', name: 'あまい霧', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', spread: true }, text: '添えた単体攻撃が、ほかの敵みんなにも広がる' },
  kingyoUzu: { id: 'a11_kingyoUzu', name: '金魚の渦', type: 'finish', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'ice', power: 25, scale: { by: 'hits', per: 5 } }, text: '敵全体に氷25。このラウンドに味方が当てた回数1回につき+5（クライマックス）' },
} satisfies Record<string, ChainMove>;

/** 敵の種類 → その敵のスナップ（段階165。全部の区画の分は chainAreas.ts の CHAIN_ENEMY_SNAPS） */
export const A11_ENEMY_SNAPS: Record<string, string> = {
  goldfishNoise: ENEMY_SNAP.hireuchi.id,
  balloonNoise: ENEMY_SNAP.mizushibuki.id,
  maskNoise: ENEMY_SNAP.zutsuki.id,
  cottonNoise: ENEMY_SNAP.amaikiri.id,
  goldfishBowlLord: ENEMY_SNAP.kingyoUzu.id,
};

/** 敵のスナップが手に入る確率（★3 で勝った時。雑魚とぬし）。スナップはたくさん要る物ではないので低め（開発者と決めた。狩りで集める） */
export const CHAIN_ENEMY_SNAP_RATE = { normal: 0.25, boss: 0.5 };

/** 1-1 で使う札（試しの調整17の札から） */
export const A11_CARDS: Record<string, ChainMove> = Object.fromEntries(
  [C.quick, C.closeUp, C.backlight, C.blueHour, C.strobe, C.wide, RECOVER, RECOVERY, ...Object.values(ENEMY_SNAP), C.push, C.plus10, C.decisive, C.group, C.swing, C.snow, C.paperGun].map((m) => [m.id, m]),
);

/** 1-1 の札の絵と短い説明（試しにない物だけ） */
export const A11_CARD_ART: Record<string, string> = {
  a11_recover: 'snap.recover',
  a11_recovery: 'snap.recover',
  a11_hireuchi: 'snap.quickStep',
  a11_mizushibuki: 'snap.iceChip',
  a11_zutsuki: 'snap.heavyBlow',
  a11_amaikiri: 'snap.wideShot',
  a11_kingyoUzu: 'snap.iceChip',
};
export const A11_SHORT_TEXT: Record<string, string> = {
  a11_recover: '味方全体の\nHPを少し回復',
  a11_recovery: '味方全体の\nHPを回復（中）',
  a11_hireuchi: '物理20\n予定を1マス後へ',
  a11_mizushibuki: '敵全体に\n氷15',
  a11_zutsuki: '物理50\n重い一撃',
  a11_amaikiri: '添える\n全体に広げる',
  a11_kingyoUzu: '全体に氷25\n当てた回数×5',
};

const times = (n: number, id: string): string[] => Array.from({ length: n }, () => id);

/**
 * 最初のアルバム（20枚）とスペシャル（ハルト「全力スイング」・あかり「雪の結晶」2枚ずつ）。
 * アルバムの編集（段階E）までは、この決まった山札で戦う
 */
export const A11_DECK: string[] = [
  ...times(3, C.quick.id),
  ...times(3, C.closeUp.id),
  ...times(2, C.backlight.id),
  ...times(2, C.blueHour.id),
  ...times(2, C.strobe.id),
  ...times(2, C.wide.id),
  ...times(2, RECOVER.id),
  ...times(2, C.push.id),
  C.plus10.id,
  C.decisive.id,
  ...times(2, C.swing.id),
  ...times(2, C.snow.id),
];


/** スペシャル（段階163）：アルバムに入れず、並びの仲間ごとに2枚ずつ山札に加わる */
export const CHAIN_ALLY_SPECIALS: Record<string, string[]> = { hero: [C.swing.id, C.swing.id], akari: [C.snow.id, C.snow.id], mio: [C.paperGun.id, C.paperGun.id], sayoko: [C.twinCut.id, C.twinCut.id], hayase: [C.repairFire.id, C.repairFire.id] };

/** 最初のアルバム（段階163。A11_DECK からスペシャルを除いた20枚） */
export const CHAIN_START_ALBUM: string[] = A11_DECK.filter((id) => !A11_CARDS[id]?.owner);

/** 1-1 のコンボ（2枚のものを3つ） */
export const A11_COMBOS: ChainLinkDef[] = CHAIN17_COMBOS.filter((l) => ['flashback', 'iceFlower', 'inSync'].includes(l.id));

/** 敵ごとの予定の癖（1ラウンドに1回。ラウンドごとに順にくり返す）。行動の名前と威力は今の敵のまま */
const PATTERNS: Record<string, { action: string; at: number; all?: boolean }[]> = {
  goldfishNoise: [
    { action: 'finSlap', at: 5 },
    { action: 'finSlap', at: 3 },
  ],
  balloonNoise: [
    { action: 'bounce', at: 4 },
    { action: 'splash', at: 7 },
  ],
  maskNoise: [
    { action: 'headbutt', at: 6 },
    { action: 'glare', at: 3 },
  ],
  cottonNoise: [
    { action: 'tangle', at: 4 },
    { action: 'sweetFog', at: 8, all: true },
  ],
};

/**
 * 1-1 の敵の HP の倍率（今の区画の戦闘の HP にかける）。自動対戦（考える方針・育成なしのハルトとあかり）で、
 * 1晩目は 1.0〜2.5 ラウンド、2・3晩目は 1.6〜2.6 ラウンドになるように測って決めた（今の区画の戦闘は、晩が進むと HP が増える）
 */
export const A11_CHAIN_HP_RATE = { night1: 0.7, later: 0.5 };

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const list = PATTERNS[e.id] ?? [{ action: e.actions[0].id, at: 5 }];
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return {
      id: a.id,
      name: a.name,
      at: Math.max(1, Math.min(9, p.at + shift)),
      ...(p.all || a.target === 'allies' ? { all: true } : {}),
      element: a.type === 'magic' ? 'physical' : a.type,
      power: a.power,
    };
  });
}

/** 今の敵を、1-1 の新しい戦闘の敵にする（性質なし） */
export function a11ChainEnemy(e: EnemyDef, rate: number = A11_CHAIN_HP_RATE.later): ChainEnemyDef {
  return {
    id: e.id,
    name: e.name,
    hp: Math.round(e.stats.hp * rate),
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: e.stats.def,
    weak: [...e.weaknesses],
    resist: e.resistances.filter((r): r is ChainEnemyDef['weak'][number] => r !== 'magic'),
    pattern: patternOf(e, 0),
  };
}

/** 型：同じ顔ぶれでも、予定の並びが違う（ふつう・せっかち＝1マス早い・のんびり＝2マス遅い） */
function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 区画の戦闘を新しい戦闘で戦う時の中身（敵・型・山札・コンボ・評価の目安） */
export interface ChainAreaSetup {
  enemies: ChainEnemyDef[];
  variants: ChainVariant[];
  deck: string[];
  cards: Record<string, ChainMove>;
  links: ChainLinkDef[];
  gradeAt: { high: number; mid: number };
  /** ポイ（段階162。1-1 のぬしの思い出の再演） */
  poi?: ChainBattleDef['poi'];
  /** 夕日（段階169。1-2 のぬしの思い出の再演） */
  sunset?: ChainBattleDef['sunset'];
  /** 歯をそろえる（段階171。2-1 のぬしの思い出の再演） */
  teeth?: ChainBattleDef['teeth'];
  /** 手拍子（段階173。2-2 のぬしの思い出の再演） */
  clap?: ChainBattleDef['clap'];
  /** 打ち返す（段階175。2-3 のぬしの思い出の再演） */
  pitch?: ChainBattleDef['pitch'];
  /** 腕時計を守る（段階179。3-1 のぬしの思い出の再演）と、全員に足す技（ねじを巻く） */
  watch?: ChainBattleDef['watch'];
  allyMoves?: ChainMove[];
  /** くり返しを越える（段階182。祭りの夜のやぐらのぬし） */
  repeat?: ChainBattleDef['repeat'];
  /** フィルム（段階184。本気のカイ） */
  film?: ChainBattleDef['film'];
  /** 言えなかった言葉（段階186。踏切のぬし）と、言わずに勝った時のスナップ */
  word?: ChainBattleDef['word'];
  quietSnaps?: string[];
  /** 夏の照り返し（段階188。川のぬし） */
  heat?: ChainBattleDef['heat'];
  /** 時計を直す（段階190。シャッターのぬし） */
  broken?: ChainBattleDef['broken'];
  /** 勝った時に手に入る新しい戦闘のスナップ（段階163。区画のぬし。狩りではもらえない） */
  snaps?: string[];
}

/** 1-1 の雑魚の戦闘 */
const A11_IDS = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a11_') && !AREA_BATTLES[id].boss);

// ---- 段階162（段階D2）：ぬし「金魚鉢のぬし」。思い出の再演「ポイが破れる前に」 ----

/** ぬしと部位の HP の倍率（今の区画の戦闘の HP にかける）。自動対戦（考える方針・育成なしのハルトとあかり）で、20戦中17勝・3〜5ラウンド・残りのポイ1〜17マスになるように決めた */
export const A11_LORD_HP_RATE = { body: 0.25, part: 0.3 };

/** ポイ：始めは30マス分。仲間の行動の重さの分と、水鉄砲が当たるたびに2減る。0で負け */
export const A11_POI = { total: 30, hitCost: 2, hitMoves: ['waterShot'] };

function a11Lord(): ChainEnemyDef[] {
  const lord = AREA_BATTLES.a11_boss.enemies[0];
  const act = (id: string) => lord.actions.find((a) => a.id === id)!;
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'ice' : a.type, power: a.power, ...extra };
  };
  const part = (id: string) => lord.parts!.find((p) => p.id === id)!;
  const partId = (id: string) => `${lord.id}_${id}`;
  const body: ChainEnemyDef = {
    id: lord.id,
    name: lord.name,
    hp: Math.round(lord.stats.hp * A11_LORD_HP_RATE.body),
    atk: Math.max(lord.stats.atk, lord.stats.mag),
    def: lord.stats.def,
    weak: [],
    resist: [],
    // 予定の癖：水鉄砲 → ポイすくい（ポイの腕） → 大波（全体） → 金魚の渦（全体。金魚鉢）
    pattern: [move('waterShot', 3), move('poiScoop', 5, { requiresPart: partId('poiArm') }), move('bigWave', 7), move('goldfishSwirl', 6, { requiresPart: partId('bowl') })],
  };
  const parts = (['poiArm', 'bowl'] as const).map((id): ChainEnemyDef => {
    const p = part(id);
    return {
      id: partId(id),
      name: p.name,
      hp: Math.round(p.hp * A11_LORD_HP_RATE.part),
      atk: 0,
      def: lord.stats.def,
      weak: [],
      resist: [],
      pattern: [],
      part: { of: lord.id, ...(p.revealsWeakness ? { reveals: [...p.revealsWeakness] } : {}) },
      ...(p.drop ? { drop: p.drop } : {}),
    };
  });
  // 場の並び：ポイの腕・ぬし・金魚鉢
  return [parts[0], body, parts[1]];
}

/** 1-1 の区画の戦闘の中身（全部の区画の分は chainAreas.ts の CHAIN_AREA_SETUPS） */
export const A11_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  ['a11_boss', { enemies: a11Lord(), variants: [], deck: A11_DECK, cards: A11_CARDS, links: A11_COMBOS, gradeAt: { high: 35, mid: 50 }, poi: A11_POI, snaps: [C.group.id] }],
  ...A11_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a11_n1_') ? A11_CHAIN_HP_RATE.night1 : A11_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a11ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: A11_CARDS, links: A11_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
