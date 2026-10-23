import type { CardDef } from '../core/types';

export const CARDS = {
  sword: { id: 'sword', name: 'ソード', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'physical', power: 35 }] },
  heavyBlow: { id: 'heavyBlow', name: 'ヘビーブロウ', weight: 1.6, target: 'enemy', effects: [{ kind: 'damage', type: 'physical', power: 60 }] },
  fireChip: { id: 'fireChip', name: 'ファイアボール', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'fire', power: 40 }] },
  iceChip: { id: 'iceChip', name: 'アイスニードル', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'ice', power: 40 }] },
  thunderChip: { id: 'thunderChip', name: 'サンダーボルト', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'thunder', power: 40 }] },
  wideShot: { id: 'wideShot', name: 'ワイドショット', weight: 1.2, target: 'enemies', effects: [{ kind: 'damage', type: 'physical', power: 20 }] },
  recover: { id: 'recover', name: 'リカバー', weight: 0.8, target: 'ally', effects: [{ kind: 'heal', power: 40 }] },
  // サポートスナップ：計画中にその場で使い、行動枠を使わない（1ラウンドにチーム全体で1枚まで）
  quickStep: { id: 'quickStep', name: 'クイックステップ', weight: 0, target: 'ally', support: true, effects: [{ kind: 'precede' }] },
  search: { id: 'search', name: 'サーチ', weight: 0, target: 'self', support: true, effects: [{ kind: 'search', count: 3 }] },
  breakArm: {
    id: 'breakArm',
    name: 'ブレイクアーム',
    weight: 1.0,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 30, partMultiplier: 2 }],
  },
  draw: { id: 'draw', name: 'ドロー', weight: 0, target: 'self', support: true, effects: [{ kind: 'draw', count: 2 }] },
  // 段階41：2章で手に入る新しいスナップ（docs/NAMING.md の「M2 の固有の名前」）。最初のアルバムには入っていない
  // ジョーカー：どの属性にもなる。相手ごとに一番効く属性を自動で選ぶ（脚本の「手札の1枚を好きな属性に変える」を、仕組みに合う形にした）
  joker: {
    id: 'joker',
    name: 'ジョーカー',
    weight: 1.0,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 36, bestOf: ['physical', 'fire', 'ice', 'thunder'] }],
  },
  // アンコール：このラウンドに最後に使われたスナップを、同じ相手にもう一度。重いので、たいてい仲間の後に動く
  encore: { id: 'encore', name: 'アンコール', weight: 1.6, target: 'self', effects: [{ kind: 'encore' }] },
  // ピンチヒッター：使う仲間が、このラウンドの最初に動く（クイックステップと同じ先制）
  pinchHitter: { id: 'pinchHitter', name: 'ピンチヒッター', weight: 1.0, target: 'enemy', precede: true, effects: [{ kind: 'damage', type: 'physical', power: 30 }] },
} satisfies Record<string, CardDef>;

/**
 * 手札のカードに名前を2行で出す時の、行の分け方（段階32b）。長い名前が「ファイアボー／ル」のように切れないよう、言葉の切れ目で分ける。
 * 書かなければ1行で出す。改行を除くと名前と同じにする（テストが確かめる）
 */
export const CARD_NAME_LINES: Partial<Record<string, string>> = {
  heavyBlow: 'ヘビー\nブロウ',
  fireChip: 'ファイア\nボール',
  iceChip: 'アイス\nニードル',
  thunderChip: 'サンダー\nボルト',
  wideShot: 'ワイド\nショット',
  quickStep: 'クイック\nステップ',
  breakArm: 'ブレイク\nアーム',
  pinchHitter: 'ピンチ\nヒッター',
};

/** アルバム（パーティ共通の山札）20枚の構成 */
export const FOLDER: { card: CardDef; count: number }[] = [
  { card: CARDS.sword, count: 3 },
  { card: CARDS.heavyBlow, count: 2 },
  { card: CARDS.fireChip, count: 2 },
  { card: CARDS.iceChip, count: 2 },
  { card: CARDS.thunderChip, count: 2 },
  { card: CARDS.wideShot, count: 2 },
  { card: CARDS.recover, count: 2 },
  { card: CARDS.quickStep, count: 1 },
  { card: CARDS.search, count: 1 },
  { card: CARDS.breakArm, count: 2 },
  { card: CARDS.draw, count: 1 },
];

/** アルバムを枚数分に展開する */
export function buildFolder(folder = FOLDER): CardDef[] {
  return folder.flatMap(({ card, count }) => Array.from({ length: count }, () => card));
}

/** スナップの名前を「ジョーカー、ソード×2」のようにまとめる（手に入れた時の知らせ。段階41） */
export function snapNames(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${(CARDS as Record<string, CardDef>)[id]?.name ?? id}${n > 1 ? `×${n}` : ''}`).join('、');
}

/**
 * アルバムの「おまかせ」（段階100）：この順に、書いた枚数まで入れる（全部持っていれば、ちょうど20枚）。
 * コンボ（3属性・ソード3枚・ブレイクアーム2枚・リカバー2枚）を組める形を先に、強いスナップを厚く。
 * 足りなければ、この順に上限まで足し、それでも足りなければ持っている順に足す
 */
export const ALBUM_RECOMMEND: [string, number][] = [
  ['heavyBlow', 2],
  ['fireChip', 2],
  ['iceChip', 2],
  ['thunderChip', 2],
  ['breakArm', 2],
  ['recover', 2],
  ['joker', 2],
  ['sword', 3],
  ['wideShot', 1],
  ['pinchHitter', 1],
  ['quickStep', 1],
];
