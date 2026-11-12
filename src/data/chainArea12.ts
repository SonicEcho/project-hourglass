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
  // 段階169：自転車のぬし（思い出の再演「日が沈む前に」の決まりを、こちら向けに）
  twoRide: { id: 'a12_twoRide', name: '二人乗り', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 45, syncMult: 2 }, text: '敵1体に物理45。このラウンド、2人の行動の間に敵の行動がなかったら（息を合わせたら）威力2倍（クライマックス）' },
} satisfies Record<string, ChainMove>;

/** 敵の種類 → その敵のスナップ */
export const A12_ENEMY_SNAPS: Record<string, string> = {
  tinNoise: A12_ENEMY_SNAP.tinShield.id,
  ramuneNoise: A12_ENEMY_SNAP.marble.id,
  menkoNoise: A12_ENEMY_SNAP.menkoStorm.id,
  phoneNoise: A12_ENEMY_SNAP.alarmBell.id,
  bicycleLord: A12_ENEMY_SNAP.twoRide.id,
};

export const A12_CARD_ART: Record<string, string> = {
  a12_tinShield: 'snap.pinchHitter',
  a12_marble: 'snap.quickStep',
  a12_menkoStorm: 'snap.wideShot',
  a12_alarmBell: 'snap.thunderChip',
  a12_twoRide: 'snap.breakArm',
};
export const A12_SHORT_TEXT: Record<string, string> = {
  a12_tinShield: '添える\n仲間をかばう',
  a12_marble: '物理20\n次の仲間が早まる',
  a12_menkoStorm: '物理30\n欠片が散る',
  a12_alarmBell: '添える\n倒すと全体に',
  a12_twoRide: '物理45\n息を合わせて2倍',
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

// ---- 段階169（段階F1b）：ぬし「自転車のぬし」。思い出の再演「日が沈む前に」 ----

/**
 * ぬしと部位の HP の倍率と、ぬしの攻撃の倍率（今の区画の戦闘の値にかける。今のぬしは攻撃が強く、1ラウンドに2回動くので半分に）。
 * 自動対戦（考える方針・育成なしのハルトとあかり・40戦）で、40戦中32勝・中ほど5ラウンド・勝った戦闘の約半分が4ラウンドを超える
 * （息を合わせないと日が沈む）ように決めた（段階169）
 */
export const A12_LORD_HP_RATE = { body: 0.28, part: 0.3, atk: 0.5 };

/** 夕日：始めは4ラウンド分。ラウンドが終わるたびに傾き、息を合わせると持ちこたえる。沈むと負け（2026-11-10 開発者：6は長い） */
export const A12_SUNSET = { rounds: 4 };

function a12Lord(): ChainEnemyDef[] {
  const lord = AREA_BATTLES.a12_boss.enemies[0];
  const act = (id: string) => lord.actions.find((a) => a.id === id)!;
  const move = (id: string, at: number, extra: Partial<ChainEnemyMove> = {}): ChainEnemyMove => {
    const a = act(id);
    return { id: a.id, name: a.name, at, ...(a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? 'thunder' : a.type, power: a.power, ...extra };
  };
  const partId = (id: string) => `${lord.id}_${id}`;
  const body: ChainEnemyDef = {
    id: lord.id,
    name: lord.name,
    hp: Math.round(lord.stats.hp * A12_LORD_HP_RATE.body),
    atk: Math.round(Math.max(lord.stats.atk, lord.stats.mag) * A12_LORD_HP_RATE.atk),
    def: lord.stats.def,
    weak: [],
    resist: [],
    // 予定の癖：スポークの渦 → 突っ走り（前輪） → 夕焼けの坂（全体） → けたたましいベル（全体・ベル）。
    // 時刻を散らして、2人の間に敵の行動が挟まりやすくする（息を合わせるには、重さ・順番・押す・ダウンで隙間を作る）
    pattern: [move('spokeSpin', 2, { at2: 6 }), move('dash', 3, { at2: 7, requiresPart: partId('frontWheel') }), move('sunsetSlope', 5), move('loudBell', 4, { at2: 8, requiresPart: partId('bell') })],
  };
  const parts = (['frontWheel', 'bell'] as const).map((id): ChainEnemyDef => {
    const p = lord.parts!.find((x) => x.id === id)!;
    return {
      id: partId(id),
      name: p.name,
      hp: Math.round(p.hp * A12_LORD_HP_RATE.part),
      atk: 0,
      def: lord.stats.def,
      weak: [],
      resist: [],
      pattern: [],
      part: { of: lord.id, ...(p.revealsWeakness ? { reveals: [...p.revealsWeakness] } : {}) },
      ...(p.drop ? { drop: p.drop } : {}),
    };
  });
  // 場の並び：前輪・ぬし・ベル
  return [parts[0], body, parts[1]];
}

/** 1-2 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A12_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries([
  // ぬしの報酬：1-2 の答えになる札（雷のストロボ・全体のワイドショット）
  ['a12_boss', { enemies: a12Lord(), variants: [], deck: A11_DECK, cards: {}, links: A11_COMBOS, gradeAt: { high: 35, mid: 50 }, sunset: A12_SUNSET, snaps: ['c17_strobe', 'c17_wide'] }],
  ...A12_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a12_n1_') ? A12_CHAIN_HP_RATE.night1 : A12_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a12ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: {}, links: A11_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
]);
