import type { ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove, ChainVariant, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { CHAIN17_CARDS as C, CHAIN17_COMBOS } from './chainTrial17';

// 段階160（段取りの段階D1）：1-1（縁日）の雑魚の戦闘を、新しい戦闘（並べてつなぐ戦闘）にする。
// 1-1 はチュートリアルなので、敵の性質は付けない（開発者と決めた。まずは予定・時間の帯・弱点・添える・クライマックス・コンボに慣れてもらう）。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘（AREA_BATTLES）のまま使い、予定の癖と型だけをここで書く

/** 新しい戦闘の札で、試しにない物（1-1 の回復） */
const RECOVER: ChainMove = { id: 'a11_recover', name: 'リカバー', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 15 }, text: '味方全体の HP を少し回復' };

/** 1-1 で使う札（試しの調整17の札から） */
export const A11_CARDS: Record<string, ChainMove> = Object.fromEntries(
  [C.quick, C.closeUp, C.backlight, C.blueHour, C.strobe, C.wide, RECOVER, C.push, C.plus10, C.decisive, C.group, C.swing, C.snow].map((m) => [m.id, m]),
);

/** 1-1 の札の絵と短い説明（試しにない物だけ） */
export const A11_CARD_ART: Record<string, string> = { a11_recover: 'snap.recover' };
export const A11_SHORT_TEXT: Record<string, string> = { a11_recover: '味方全体の\nHPを少し回復' };

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
}

/** 1-1 の雑魚の戦闘（ぬしは段階D2） */
const A11_IDS = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a11_') && !AREA_BATTLES[id].boss);

export const CHAIN_AREA_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A11_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a11_n1_') ? A11_CHAIN_HP_RATE.night1 : A11_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a11ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: A11_CARDS, links: A11_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);

/**
 * 新しい戦闘で戦う区画の戦闘（AREA_BATTLES の id）。段階D1 で 1-1 の雑魚、段階D2 で 1-1 のぬし、段階F で章ごとに増やす。
 * ここにない戦闘は、今の本番の戦闘のまま（デバッグメニューの切り替えで、全部を新しい戦闘にして試せる）
 */
export const CHAIN_AREA_BATTLES: string[] = Object.keys(CHAIN_AREA_SETUPS);
