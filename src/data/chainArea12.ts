import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainTrait, ChainVariant, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { A11_COMBOS, A11_DECK, type ChainAreaSetup } from './chainArea11';

// 段階168（段取りの段階F1a）：1-2「夕暮れの二人乗り」の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 12.）。
// 1章の4つの性質（かばう・逃げ足・分裂・ダウン時爆発）が初めて出る。敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、
// 性質・予定の癖と型だけをここで書く。敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/**
 * 1-2 の敵のスナップ（★3 で早く勝つと、ときどき）：その敵の性質を、こちら向けにした札（2026-11-10 開発者と決めた。一覧の 11.・12.）
 */
export const A12_ENEMY_SNAP = {
  tinShield: { id: 'a12_tinShield', name: 'ブリキの盾', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', cover: 0.5 }, text: '添えた行動の後、ラウンドの終わりまで、ほかの仲間への単体攻撃を代わりに受ける（ダメージは半分）' },
  marble: { id: 'a12_marble', name: 'ビー玉はじき', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, haste: 1 }, text: '敵1体に物理20。当てると、この後に動く仲間の時刻が1マス早まる' },
  menkoStorm: { id: 'a12_menkoStorm', name: 'めんこ吹雪', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, scatter: { power: 15, hits: 2 } }, text: '敵1体に物理30。当たると、威力15の欠片がほかの敵へ2回散る' },
  alarmBell: { id: 'a12_alarmBell', name: '非常ベル', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', blast: 30 }, text: '添えた攻撃で敵を倒すと、ほかの敵全体に威力30で鳴り響く' },
} satisfies Record<string, ChainMove>;

/** 敵の種類 → その敵のスナップ */
export const A12_ENEMY_SNAPS: Record<string, string> = {
  tinNoise: A12_ENEMY_SNAP.tinShield.id,
  ramuneNoise: A12_ENEMY_SNAP.marble.id,
  menkoNoise: A12_ENEMY_SNAP.menkoStorm.id,
  phoneNoise: A12_ENEMY_SNAP.alarmBell.id,
};

export const A12_CARD_ART: Record<string, string> = {
  a12_tinShield: 'snap.pinchHitter',
  a12_marble: 'snap.quickStep',
  a12_menkoStorm: 'snap.wideShot',
  a12_alarmBell: 'snap.thunderChip',
};
export const A12_SHORT_TEXT: Record<string, string> = {
  a12_tinShield: '添える\n仲間をかばう',
  a12_marble: '物理20\n次の仲間が早まる',
  a12_menkoStorm: '物理30\n欠片が散る',
  a12_alarmBell: '添える\n倒すと全体に',
};

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。行動の名前と威力は今の敵のまま。逃げ足の「逃げる」は、ここで足す */
/** hp は、この敵だけの HP の倍率（かばう敵は並ぶとかばい合って長引くので低め） */
const SHOWA: Record<string, { trait: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; popPower?: number; hp?: number }> = {
  // かばう：立っている間、ほかの敵への単体攻撃を代わりに受ける（全体攻撃・先にダウンで崩す）
  tinNoise: { trait: 'shield', pattern: [{ action: 'windUpPunch', at: 6 }, { action: 'tinMarch', at: 4 }], hp: 0.6 },
  // 逃げ足：2ラウンド目の時刻8に逃げる（押す・先に倒す・ダウンで止める）
  ramuneNoise: { trait: 'flee', pattern: [{ action: 'marbleShot', at: 2 }, { action: 'escape', at: 8 }] },
  // 分裂：倒すと小さな2枚に散る（全体攻撃で片付ける）
  menkoNoise: { trait: 'split', pattern: [{ action: 'menkoSlap', at: 5 }, { action: 'beigomaSpin', at: 7 }] },
  // ダウン時爆発：弱点（氷）でダウンさせると、ベルが鳴り響いて味方全体にダメージ
  phoneNoise: { trait: 'pop', pattern: [{ action: 'cordWhip', at: 4 }, { action: 'ringRing', at: 6, all: true }], popPower: 22 },
};

/** 分裂した小さなめんこ（id は「本体_mini」。絵は本体の絵を小さく使う） */
function miniMenko(e: EnemyDef, rate: number): ChainEnemyDef {
  return {
    id: `${e.id}_mini`,
    name: '小さなめんこ',
    hp: Math.round(e.stats.hp * rate * 0.3),
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: Math.round(e.stats.def * 0.7),
    weak: [...e.weaknesses],
    resist: [],
    pattern: [{ id: 'flutter', name: 'ひらひら', at: 6, element: 'physical', power: 18 }],
  };
}

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const list = SHOWA[e.id]?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  return list.map((p) => {
    const at = Math.max(1, Math.min(9, p.at + shift));
    if (p.action === 'escape') return { id: 'escape', name: '逃げる', at, element: 'physical', power: 0, flee: true };
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at, ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'physical' : a.type, power: a.power };
  });
}

/**
 * 1-2 の敵の HP の倍率（今の区画の戦闘の HP にかける）。自動対戦（考える方針・育成なしのハルトとあかり・30戦ずつ）で、
 * ほとんどの戦闘が 1.0〜2.7 ラウンド、2晩目の山場と3晩目の強い組み合わせが 2.3〜3.2 ラウンド（30戦中28〜30勝）になるように測って決めた（段階168）。
 * ブリキノイズは、並ぶとかばい合って長引くので、さらに 0.6 倍（SHOWA の hp）
 */
export const A12_CHAIN_HP_RATE = { night1: 0.5, later: 0.38 };

export function a12ChainEnemy(e: EnemyDef, rate: number = A12_CHAIN_HP_RATE.later): ChainEnemyDef {
  const t = SHOWA[e.id];
  return {
    id: e.id,
    name: e.name,
    hp: Math.round(e.stats.hp * rate * (t?.hp ?? 1)),
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: e.stats.def,
    weak: [...e.weaknesses],
    resist: e.resistances.filter((r): r is ChainEnemyDef['weak'][number] => r !== 'magic'),
    pattern: patternOf(e, 0),
    ...(t ? { trait: t.trait } : {}),
    ...(t?.trait === 'split' ? { splitInto: miniMenko(e, rate) } : {}),
    ...(t?.popPower ? { popPower: t.popPower } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 1-2 の雑魚の戦闘（ぬしは段階F1b） */
const A12_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a12_n') || id === 'a12_runner') && !AREA_BATTLES[id].boss);

/** 1-2 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A12_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A12_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a12_n1_') ? A12_CHAIN_HP_RATE.night1 : A12_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a12ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: {}, links: A11_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);
