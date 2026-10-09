import type { LinkDef } from '../core/types';

// 連携技（2人の行動をまとめて使う大技）。つながりゲージが満タンの時だけ使える（段階26の調整2）。
// ゲージは仲間が弱点を突く・ダウンさせる・バトンタッチすると貯まり、使うと0に戻る（数値は constants.ts の LINK_GAUGE_*）。
// 連携技は必ずラウンドの最初に動き（防御の次）、体勢が崩れた敵（ダウン中・立ち上がったばかり）には2倍（段階26の調整4・5。数値は遊んで調整する）

/** ハルトとみおの2人技 */
export const CROSS_DRIVE: LinkDef = {
  id: 'crossDrive',
  name: 'クロスドライブ',
  members: ['hero', 'mio'],
  weight: 1.5,
  target: 'enemies',
  effects: [
    // 連携技は耐性を無視する。ダウン中の敵には2倍（威力 50 → 110（調整2）→ 80（調整4））
    { kind: 'damage', type: 'physical', power: 80, ignoreResist: true, downBonus: 2 },
    { kind: 'draw', count: 2 },
  ],
};

/** ハルトとあかりの2人技（段階26の調整2。1章で使える連携技） */
export const AFTERGLOW: LinkDef = {
  id: 'afterglow',
  name: 'アフターグロウ',
  members: ['hero', 'akari'],
  weight: 1.5,
  target: 'enemies',
  effects: [
    // 夕焼けの光：敵ごとに火か氷の効く方で（弱点があれば弱点を突く）。ダウン中の敵には2倍（威力 100 → 70（調整4））。その後、味方全体を回復
    { kind: 'damage', type: 'fire', power: 70, bestOf: ['fire', 'ice'], ignoreResist: true, downBonus: 2 },
    { kind: 'heal', power: 25, allies: true },
  ],
};

export const LINKS: LinkDef[] = [AFTERGLOW, CROSS_DRIVE];
