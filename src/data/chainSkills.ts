import type { ChainMove, ChainPassive } from '../core/chain';

// 段階193（段取りの段階G3a）：星図で覚える技と特性を、新しい戦闘の形で書いた（4章まで。docs/milestones/M3_catalog.md の 16-2・16-5 の3版）。
// まだ星図にもキャラにもつないでいない（段階G3b でつなぐ）。数字は仮（通常攻撃は 重さ2・物理20・MP なし）。
// 重さは1〜5。重さ4以上は「重い技」（小夜子の特性が効く）。time は時間の技（早瀬の特性で MP が減る）

const move = (m: ChainMove): ChainMove => m;

export const CHAIN_SKILLS = {
  // ---- ハルト（属性なし・スナップが得意） ----
  slash: move({ id: 'slash', name: '斬る', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 32 }, text: '敵1体に物理32', mp: 4 }),
  midareGiri: move({ id: 'midareGiri', name: '乱れ斬り', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 16, hits: 3 }, text: '敵1体に物理16を3回', mp: 8 }),
  hirameki: move({ id: 'hirameki', name: 'ひらめき', type: 'support', weight: 1, target: 'allies', effect: { kind: 'draw', count: 1 }, text: 'スナップを1枚引く（次のラウンドの手札に）', mp: 3 }),
  shuffle: move({ id: 'shuffle', name: 'シャッフル', type: 'support', weight: 1, target: 'allies', effect: { kind: 'cycle' }, text: '残った手札を山札に戻して、同じ枚数引き直す', mp: 4 }),
  // ---- あかり（氷・回復） ----
  ice: move({ id: 'ice', name: 'アイス', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 36 }, text: '敵1体に氷36', mp: 5 }),
  care: move({ id: 'care', name: 'ケア', type: 'support', weight: 1, target: 'allies', effect: { kind: 'heal', power: 22 }, text: '味方全体の HP を少し回復（軽くて早い）', mp: 4 }),
  cure: move({ id: 'cure', name: 'ケアル', type: 'support', weight: 3, target: 'allies', effect: { kind: 'heal', power: 45 }, text: '味方全体の HP を大きく回復', mp: 9 }),
  wakeSong: move({ id: 'wakeSong', name: '目覚めの歌', type: 'support', weight: 3, target: 'allies', effect: { kind: 'heal', power: 0, revive: 0.3 }, text: '倒れた仲間を、最大 HP の3割で起こす', mp: 10 }),
  guardSong: move({ id: 'guardSong', name: '守りの歌', type: 'support', weight: 2, target: 'allies', effect: { kind: 'guard', armor: 0.3 }, text: 'このラウンドの終わりまで、味方全体の受けるダメージ −30%', mp: 8 }),
  blizzara: move({ id: 'blizzara', name: 'ブリザラ', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'ice', power: 32 }, text: '敵全体に氷32', mp: 12 }),
  // ---- みお（雷・軽い行動と押す） ----
  static: move({ id: 'static', name: '静電気', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 14, hits: 2 }, text: '敵1体に雷14を2回', mp: 4 }),
  boltDash: move({ id: 'boltDash', name: '稲妻ダッシュ', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 18, push: 2 }, text: '敵1体に雷18。当たった敵の予定を2マス後ろへ', mp: 5 }),
  thunder: move({ id: 'thunder', name: 'サンダー', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 40 }, text: '敵1体に雷40', mp: 6 }),
  thundara: move({ id: 'thundara', name: 'サンダラ', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'thunder', power: 32 }, text: '敵全体に雷32', mp: 12 }),
  prank: move({ id: 'prank', name: 'いたずら', type: 'support', weight: 1, target: 'enemy', effect: { kind: 'shift', by: 3 }, text: '敵1体の、まだ動いていない予定を3マス後ろへ（ダメージなし）', mp: 6 }),
  // ---- 小夜子（物理・重い一撃と部位） ----
  kabutoWari: move({ id: 'kabutoWari', name: '兜割り', type: 'attack', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40, partMult: 2 }, text: '敵1体に物理40。部位には2倍', mp: 6 }),
  tsukiBarai: move({ id: 'tsukiBarai', name: '月払い', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 26 }, text: '敵全体に物理26', mp: 10 }),
  yoroiDooshi: move({ id: 'yoroiDooshi', name: '鎧通し', type: 'attack', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 44, pierceHard: true }, text: '敵1体に物理44。かたい敵にも減らされない', mp: 7 }),
  mikiri: move({ id: 'mikiri', name: '見切り', type: 'support', weight: 2, target: 'allies', effect: { kind: 'guard', wall: 1, riposte: 40, self: true }, text: 'このラウンドの終わりまで、自分への敵の攻撃を1回受け流し、物理40で返す', mp: 6 }),
  niNoTachi: move({ id: 'niNoTachi', name: '二の太刀', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'echo', rate: 0.5 }, text: 'このラウンドの自分の直前の攻撃を、威力半分でもう一度（まだ攻撃していなければ不発）', mp: 6 }),
  // ---- 早瀬（火・時間の扱い） ----
  yakiire: move({ id: 'yakiire', name: '焼き入れ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 42 }, text: '敵1体に火42', mp: 6 }),
  clockSet: move({ id: 'clockSet', name: '時計合わせ', type: 'support', weight: 1, target: 'enemy', effect: { kind: 'shift', by: 1 }, text: '敵1体の、まだ動いていない予定を1マス後ろへ（ダメージなし。時間の技）', mp: 4, time: true }),
  kaen: move({ id: 'kaen', name: '火炎', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 32 }, text: '敵全体に火32', mp: 12 }),
  pendulum: move({ id: 'pendulum', name: '振り子', type: 'support', weight: 2, target: 'enemies', effect: { kind: 'shift', by: 1 }, text: '敵全員の、まだ動いていない予定を1マス後ろへ（ダメージなし。時間の技）', mp: 8, time: true }),
} satisfies Record<string, ChainMove>;

export type ChainSkillId = keyof typeof CHAIN_SKILLS;

/** 仲間が最初から持っている技（加わった時。段階193） */
export const CHAIN_START_SKILLS: Record<string, ChainSkillId[]> = {
  hero: ['slash'],
  akari: ['ice', 'care'],
  mio: ['static', 'boltDash'],
  sayoko: ['kabutoWari', 'tsukiBarai'],
  hayase: ['yakiire', 'clockSet'],
};

/** 星図の特性の星（段階193。名前と効き目。数字は仮） */
export const CHAIN_TRAIT_STARS: Record<string, { name: string; text: string; passive: ChainPassive }> = {
  snapBoost: { name: 'スナップの威力+', text: 'スナップ（札）の攻撃の威力 +10%', passive: { kind: 'snapBoost', rate: 0.1 } },
  healBoost: { name: '回復量+', text: '回復の技と札の回復量 +20%', passive: { kind: 'healBoost', rate: 0.2 } },
  pushPlus: { name: '押す距離+1', text: '押す・予定をずらす距離 +1', passive: { kind: 'pushPlus', count: 1 } },
  heavyBoost: { name: '重い技の威力+', text: '重さ4以上の技と札の威力 +20%', passive: { kind: 'heavyBoost', rate: 0.2 } },
  partBoost: { name: '部位ダメージ+', text: '部位へのダメージ +30%', passive: { kind: 'partBoost', rate: 0.3 } },
  timeMpSave: { name: '時間の技の MP−', text: '時間の技（時計合わせ・振り子）の MP −2（最低1）', passive: { kind: 'timeMpSave', amount: 2 } },
  fireBoost: { name: '火の威力+', text: '火の攻撃の威力 +20%', passive: { kind: 'elementBoost', element: 'fire', rate: 0.2 } },
};
