import type { ChainEnemyDef, ChainEnemyMove, ChainMove, ChainTrait, ChainVariant, Element, EnemyDef } from '../core';
import { AREA_BATTLES } from './areas';
import { A11_DECK, type ChainAreaSetup } from './chainArea11';
import { A21_COMBOS } from './chainArea21';
import { CHAIN17_CARDS as C } from './chainTrial17';

// 段階174（段取りの段階F4a）：2-3「最後の打席」の雑魚の戦闘を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 13-10）。
// 2章の性質（かたい・カウンター）と1章の性質（逃げ足）を組み合わせる。
// 敵の数値（HP・攻撃・防御・弱点・耐性・落とし物）は今の区画の戦闘のまま使い、性質・予定の癖と型だけをここで書く。
// 敵の組み合わせは、性質を晩ごとに覚えるよう AREA_BATTLES の側で入れ替えた

/**
 * 2-3 の敵のスナップ：性質はどれも前の区画で札にしたので、4種類とも技から作る（段階172 の決まり）
 */
export const A23_ENEMY_SNAP = {
  iceWater: { id: 'a23_iceWater', name: '氷水かけ', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'status', status: 'stack', rounds: 2, element: 'ice', power: 10 }, text: '敵全体に氷10。2ラウンドの間「刻み」：当たるたびに受けるダメージが上がる' },
  jeer: { id: 'a23_jeer', name: 'やじ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'weak', rounds: 1, element: 'thunder', power: 20 }, text: '敵1体に雷20。このラウンドの終わりまで、その敵の攻撃が半分' },
  irregular: { id: 'a23_irregular', name: 'イレギュラー', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 25, scatter: { power: 25, hits: 1 } }, text: '敵1体に物理25。もう1発が、ほかの敵へ跳ねる' },
  beep: { id: 'a23_beep', name: 'ピコピコ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'confuse', rounds: 1, element: 'thunder', power: 15 }, text: '敵1体に雷15。このラウンドの終わりまで、その敵の単体攻撃が、ほかの敵に向く' },
} satisfies Record<string, ChainMove>;

export const A23_ENEMY_SNAPS: Record<string, string> = {
  jugNoise: A23_ENEMY_SNAP.iceWater.id,
  megaphoneNoise: A23_ENEMY_SNAP.jeer.id,
  ballNoise: A23_ENEMY_SNAP.irregular.id,
  petNoise: A23_ENEMY_SNAP.beep.id,
};

export const A23_CARD_ART: Record<string, string> = {
  a23_iceWater: 'snap.iceChip',
  a23_jeer: 'snap.thunderChip',
  a23_irregular: 'snap.quickStep',
  a23_beep: 'snap.thunderChip',
  a23_kitsuke: 'snap.recover',
  a23_hitoiki: 'snap.recover',
};
export const A23_SHORT_TEXT: Record<string, string> = {
  a23_iceWater: '全体に氷10\n刻み2ラウンド',
  a23_jeer: '雷20\n攻撃を半分に',
  a23_irregular: '物理25\nほかへ跳ねる',
  a23_beep: '雷15\n同士討ち',
  a23_kitsuke: '倒れた仲間を\n起こす',
  a23_hitoiki: '味方全体の\nMP +6',
};

/** 2-3 の宝箱の札（一覧の 2.）：気付け（倒れた仲間を起こす）・一息（MP を戻す） */
const KITSUKE: ChainMove = { id: 'a23_kitsuke', name: '気付け', type: 'support', weight: 2, target: 'allies', effect: { kind: 'heal', power: 0, revive: 0.3 }, text: '倒れた仲間を、HP 3割で起こす' };
const HITOIKI: ChainMove = { id: 'a23_hitoiki', name: '一息', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 0, mp: 6 }, text: '味方全体の MP を6戻す' };

/** 2-3 の宝箱で渡す札（アルバムに入れられる札の一覧に足す） */
export const A23_NEW_SNAPS: ChainMove[] = [C.imprint, KITSUKE, HITOIKI];

/** 敵ごとの性質と予定の癖（1ラウンドに1つ。順にくり返す）。magic は、その敵の魔法の属性 */
const RIVERSIDE: Record<string, { trait?: ChainTrait; pattern: { action: string; at: number; all?: boolean }[]; magic: Element; hp?: number; shellHits?: number }> = {
  // かたい（2-1）：1発ごとにダメージを減らす
  jugNoise: { trait: 'hard', pattern: [{ action: 'jugSwing', at: 5 }, { action: 'iceWater', at: 7, all: true }], magic: 'ice', hp: 0.8 },
  // カウンター（2-2）：ダウンしていない時に受けると反撃
  megaphoneNoise: { trait: 'counter', pattern: [{ action: 'jeer', at: 4 }, { action: 'roar', at: 6, all: true }], magic: 'thunder' },
  // 逃げ足（1章）：2ラウンド目の時刻8に逃げる
  ballNoise: { trait: 'flee', pattern: [{ action: 'fastball', at: 2 }, { action: 'escape', at: 8 }], magic: 'physical' },
  // 性質なし
  petNoise: { pattern: [{ action: 'beep', at: 6, all: true }, { action: 'tantrum', at: 3 }], magic: 'thunder' },
};

function patternOf(e: EnemyDef, shift: number): ChainEnemyMove[] {
  const f = RIVERSIDE[e.id];
  const list = f?.pattern ?? [{ action: e.actions[0].id, at: 5 }];
  return list.map((p) => {
    if (p.action === 'escape') return { id: 'escape', name: '逃げる', at: Math.max(1, Math.min(9, p.at + shift)), element: 'physical', power: 0, flee: true };
    const a = e.actions.find((x) => x.id === p.action) ?? e.actions[0];
    return { id: a.id, name: a.name, at: Math.max(1, Math.min(9, p.at + shift)), ...(p.all || a.target === 'allies' ? { all: true } : {}), element: a.type === 'magic' ? (f?.magic ?? 'physical') : a.type, power: a.power };
  });
}

/**
 * 2-3 の敵の HP の倍率（今の区画の戦闘の HP にかける）。2-3 に入る時点の控えめな育ち具合（growthPreset('a23_enter', 'low')）で自動対戦して測った。
 * 1晩目は「かたい＋カウンター」でどちらも1回で大きく当てる組なので長引きやすく、低め。ほとんどが 2.0〜2.8 ラウンド（30戦中30勝）（段階174）
 */
export const A23_CHAIN_HP_RATE = { night1: 0.45, later: 0.5 };

export function a23ChainEnemy(e: EnemyDef, rate: number = A23_CHAIN_HP_RATE.later): ChainEnemyDef {
  const f = RIVERSIDE[e.id];
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
    ...(f?.shellHits ? { shellHits: f.shellHits } : {}),
  };
}

function variantsOf(enemies: EnemyDef[]): ChainVariant[] {
  return [
    { id: 'normal', name: 'ふつう', patterns: enemies.map((e) => patternOf(e, 0)) },
    { id: 'hasty', name: 'せっかち', patterns: enemies.map((e) => patternOf(e, -1)) },
    { id: 'slow', name: 'のんびり', patterns: enemies.map((e) => patternOf(e, 2)) },
  ];
}

/** 2-3 の雑魚の戦闘（ぬしとカイは段階F4b） */
const A23_IDS = Object.keys(AREA_BATTLES).filter((id) => (id.startsWith('a23_n') || id === 'a23_runner') && !AREA_BATTLES[id].boss);

/** 2-3 の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A23_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A23_IDS.map((id) => {
    const b = AREA_BATTLES[id];
    const rate = id.startsWith('a23_n1_') ? A23_CHAIN_HP_RATE.night1 : A23_CHAIN_HP_RATE.later;
    return [id, { enemies: b.enemies.map((e) => a23ChainEnemy(e, rate)), variants: variantsOf(b.enemies), deck: A11_DECK, cards: {}, links: A21_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);
