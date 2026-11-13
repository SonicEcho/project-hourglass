import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import type { ChainAreaSetup } from './chainArea11';
import { A3S_COMBOS, A3S_DECK } from './chainArea3s';
import { CHAIN17_CARDS as C } from './chainTrial17';

// 段階187（段取りの段階F9a）：4-1「シロのいた夏」の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 16-1）。
// 4章の新しい性質のうち3つ（予定隠し・回復役・速い）が初めて出る。敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、
// 性質・予定の癖と型だけをここで書く。敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/** 4-1 の敵のスナップ：性質をこちら向けにした札（性質のない花火の燃えかすは技から） */
export const A41_ENEMY_SNAP = {
  // 虫かごノイズ（予定隠し）：ふたを開けて、中を見る
  peek: { id: 'a41_peek', name: 'のぞき見', type: 'support', weight: 1, target: 'enemies', effect: { kind: 'trick', trick: 'expose' }, text: '敵全体に「ハイライト」（次に当たった攻撃が、弱点を突いた扱いになる）' },
  // すいかノイズ（回復役）：分け合う
  share: { id: 'a41_share', name: '分け合い', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20, healAll: 20 }, text: '敵1体に物理20。味方全体を少し回復' },
  // 水鉄砲ノイズ（速い）：すぐ効く軽い一撃
  squirt: { id: 'a41_squirt', name: 'ぴゅっ', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 22 }, text: '敵1体に氷22（重さ1。すぐ効く）' },
  // 花火の燃えかすノイズ（技「火の粉」）：全体に2回
  sparks: { id: 'a41_sparks', name: '火の粉', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 12, hits: 2 }, text: '敵全体に火12を2回' },
} satisfies Record<string, ChainMove>;

export const A41_ENEMY_SNAPS: Record<string, string> = {
  bugcageNoise: A41_ENEMY_SNAP.peek.id,
  watermelonNoise: A41_ENEMY_SNAP.share.id,
  watergunNoise: A41_ENEMY_SNAP.squirt.id,
  fireworkNoise: A41_ENEMY_SNAP.sparks.id,
};

export const A41_CARD_ART: Record<string, string> = {
  a41_peek: 'snap.search',
  a41_share: 'snap.recover',
  a41_squirt: 'snap.iceChip',
  a41_sparks: 'snap.fireChip',
};
export const A41_SHORT_TEXT: Record<string, string> = {
  a41_peek: '敵全体に\nハイライト',
  a41_share: '物理20\n味方を回復',
  a41_squirt: '氷22\n重さ1',
  a41_sparks: '全体に\n火12×2回',
};

/** 4-1 の宝箱で渡す札（赤フィルター。ほかの2つは、3章の札をもう1枚ずつ） */
export const A41_NEW_SNAPS: ChainMove[] = [C.filterRed];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic はその敵の魔法の属性 */
const SUMMER: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; hp?: number; healRate?: number }> = {
  // 予定隠し：ふたの中が見えない
  bugcageNoise: { trait: 'veil', pattern: [{ action: 'lidSnap', at: 5 }, { action: 'buzz', at: 7, all: true }], magic: 'physical' },
  // 回復役：ほかの敵を回復する
  watermelonNoise: { trait: 'healer', healRate: 0.15, pattern: [{ action: 'roll', at: 5 }, { action: 'seedShot', at: 7, all: true }], magic: 'physical' },
  // 速い：予定がいつも時刻1〜2
  watergunNoise: { trait: 'fast', pattern: [{ action: 'squirt', at: 1 }, { action: 'pump', at: 2, all: true }], magic: 'ice' },
  // 性質なし
  fireworkNoise: { pattern: [{ action: 'smoke', at: 4 }, { action: 'sparks', at: 6, all: true }], magic: 'fire' },
  // 2晩目の番人：性質なし
  jizoNoise: { pattern: [{ action: 'windmills', at: 5, all: true }, { action: 'bibSlap', at: 3 }], magic: 'thunder' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = SUMMER[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  // 速い敵は、型が変わっても時刻1〜2のまま
  const clamp = (n: number) => (f?.trait === 'fast' ? n : Math.max(1, Math.min(9, n + shift)));
  return list.map((p) => {
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: clamp(p.at), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 4-1 の敵の HP の倍率（今の区画の戦闘の HP にかける）。4-1 に入る時点の控えめな育ち具合（ハルト・あかり・みお）で自動対戦して測った（段階187）：
 * 1.2 で1晩目 1.7〜2.8 ラウンド、0.8 で2晩目から 1.4〜2.4 ラウンド・1.2 で 2.0〜3.5（どれも20戦中20勝。番人は 3.4〜5.0）
 */
export const A41_CHAIN_HP_RATE = { night1: 1.2, later: 1 };

export function a41ChainEnemy(e: EnemyDef, rate: number = A41_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = SUMMER[e.id];
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
    ...(f?.healRate ? { healRate: f.healRate } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 4-1 の雑魚の戦闘（川のぬしは段階F9b） */
const A41_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a41_n') || id === 'a41_runner') && !AREA_BATTLES[id].boss);

/** 4-1 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A41_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A41_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a41_n1_') ? A41_CHAIN_HP_RATE.night1 : A41_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a41ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);
