import type { ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { A11_DECK, type ChainAreaSetup } from './chainArea11';
import { A31_COMBOS } from './chainArea31';
import { CHAIN17_CARDS as C, CHAIN17_COMBOS } from './chainTrial17';

// 段階181（段取りの段階F6a）：大正の祭りの夜（3-s1・3-s2）の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 14-3）。
// 新しい性質「割り込み」と、2章までの性質（足止め・ダウン時爆発）。2晩目から小夜子が加わる（専用の札「二段斬り」と、あかりとのコンボ「デジャヴ」）。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、性質・予定の癖と型だけをここで書く。
// 敵の組み合わせは、割り込みを先に覚えるよう AREA_BATTLES の側で入れ替えた

/** 祭りの夜の敵のスナップ：割り込みは性質から。足止め・ダウン時爆発はもう札になっているので技から、性質のない蓄音機も技から */
export const A3S_ENEMY_SNAP = {
  // 風車ノイズ（割り込み）：先手を取る
  preempt: { id: 'a3s_preempt', name: '先回り', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, beforeMult: 2 }, text: '敵1体に物理20。その敵が、このラウンドにまだ動いていなければ2倍' },
  // 飴細工ノイズ（技「鶴の舞」）：全体を押す
  candyCrane: { id: 'a3s_candyCrane', name: '飴の鶴', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 12, push: 1 }, text: '敵全体に物理12。当たった敵の予定を1マス後ろへ' },
  // 提灯ノイズ（技「ゆらめく灯」）：ダウン中の敵に強い全体攻撃
  welcomeFire: { id: 'a3s_welcomeFire', name: '迎え火', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 15, downMult: 3 }, text: '敵全体に火15。ダウンしている敵には3倍' },
  // 蓄音機ノイズ（技「くり返しの歌」）：直前の攻撃を全体にもう一度
  refrain: { id: 'a3s_refrain', name: 'くり返しの歌', type: 'support', weight: 2, target: 'enemies', effect: { kind: 'wind', rate: 0.6 }, text: '直前に動いた仲間の攻撃を、威力の6割で敵全体にもう一度（直前が攻撃でなければ不発）' },
} satisfies Record<string, ChainMove>;

export const A3S_ENEMY_SNAPS: Record<string, string> = {
  pinwheelNoise: A3S_ENEMY_SNAP.preempt.id,
  candyNoise: A3S_ENEMY_SNAP.candyCrane.id,
  lanternNoise: A3S_ENEMY_SNAP.welcomeFire.id,
  phonographNoise: A3S_ENEMY_SNAP.refrain.id,
};

export const A3S_CARD_ART: Record<string, string> = {
  a3s_preempt: 'snap.quickStep',
  a3s_candyCrane: 'snap.wideShot',
  a3s_welcomeFire: 'snap.fireChip',
  a3s_refrain: 'snap.encore',
};
export const A3S_SHORT_TEXT: Record<string, string> = {
  a3s_preempt: '物理20\n動く前の敵に2倍',
  a3s_candyCrane: '全体に物理12\n押す',
  a3s_welcomeFire: '全体に火15\nダウン中に3倍',
  a3s_refrain: '直前の攻撃を\n全体にもう一度',
};

/** 祭りの夜で渡す札（宝箱：パノラマ・リワインド。小夜子の専用の札）。アルバムに入れられる札の一覧に足す（専用の札は除かれる） */
export const A3S_NEW_SNAPS: ChainMove[] = [C.panorama, C.rewind, C.twinCut];

/** 祭りの夜のコンボ：3-1 までに足して、あかりと小夜子の「デジャヴ」 */
export const A3S_COMBOS: ChainLinkDef[] = [...A31_COMBOS, ...CHAIN17_COMBOS.filter((l) => l.id === 'dejaVu')];

/** 山札（アルバムがない時と測る時）：1-1 の山札に小夜子の専用の札（並びにいなければ外れる） */
export const A3S_DECK: string[] = [...A11_DECK, C.twinCut.id, C.twinCut.id];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic はその敵の魔法の属性 */
const MATSURI: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; popPower?: number; hp?: number }> = {
  // 割り込み（新）：単体の行動にねらわれると、その前に、まだ動いていない自分の予定を1つ先に動かす
  pinwheelNoise: { trait: 'interrupt', pattern: [{ action: 'spin', at: 6 }, { action: 'whirl', at: 7, all: true }], magic: 'physical' },
  // 足止め（2-2）：攻撃を当てた行動の後、まだ動いていない仲間が遅れる
  candyNoise: { trait: 'sticky', pattern: [{ action: 'sticky', at: 4 }, { action: 'crane', at: 6, all: true }], magic: 'physical', hp: 0.8 },
  // ダウン時爆発（1-2）：弱点でダウンさせると、灯が爆ぜて味方全体に
  lanternNoise: { trait: 'pop', pattern: [{ action: 'burn', at: 5 }, { action: 'flicker', at: 3, all: true }], magic: 'fire', popPower: 24 },
  // 性質なし：全体攻撃の係
  phonographNoise: { pattern: [{ action: 'repeat', at: 5, all: true }, { action: 'scratch', at: 4 }], magic: 'thunder' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = MATSURI[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  const clamp = (n: number) => Math.max(1, Math.min(9, n + shift));
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: clamp(p.at), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 祭りの夜の敵の HP の倍率（今の区画の戦闘の HP にかける）。晩ごとに、入る時点の控えめな育ち具合で自動対戦して測った（段階181。
 * 1晩目はハルト・あかり・みお、2晩目はハルト・小夜子・あかり）：1晩目 1.2〜3.6 ラウンド、2晩目 1.4〜3.2 ラウンド（20戦中20勝）
 */
export const A3S_CHAIN_HP_RATE = { night1: 1.1, night2: 1 };

export function a3sChainEnemy(e: EnemyDef, rate: number = A3S_CHAIN_HP_RATE.night2): ChainEnemyDef {
  const f = MATSURI[e.id];
  return {
    id: e.id,
    name: e.name,
    hp: Math.round(e.stats.hp * rate * (f?.hp ?? 1)),
    atk: Math.max(e.stats.atk, e.stats.mag),
    def: e.stats.def,
    weak: [...e.weaknesses],
    resist: e.resistances.filter((r): r is ChainEnemyDef['weak'][number] => r !== 'magic'),
    pattern: patternOf(e, 0),
    ...(f?.trait ? { trait: f.trait } : {}),
    ...(f?.popPower ? { popPower: f.popPower } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 祭りの夜の雑魚の戦闘（1晩目の終わりの砂嵐も。やぐらのぬしは段階F6b） */
const A3S_IDS = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a3s') && !AREA_BATTLES[id].boss);

/** 祭りの夜の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A3S_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A3S_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a3s1_') ? A3S_CHAIN_HP_RATE.night1 : A3S_CHAIN_HP_RATE.night2;
    return [id, { enemies: b.enemies.map((e) => a3sChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);
