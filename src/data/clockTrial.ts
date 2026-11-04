import type { ClockAllyDef, ClockBattleDef, ClockEnemyDef, ClockMove, ClockRules } from '../core/clock';
import { PARTY } from './characters';

// 試し：文字盤の戦闘（段階154。docs/milestones/M3_battle_review.md）の数値。時間は、文字盤の上で番の印がばらけるよう、1回の行動が2〜5時間になる大きさにした。たたき台（開発者が遊んだ手応えで直す）。
// 仲間の能力値は今の物語の仲間（characters.ts）と同じ。弱点は試しのために決めた（案3：敵もこちらの弱点を突いてくる）

export const CLOCK_RULES: ClockRules = {
  dial: 12,
  kokugenEvery: 24,
  push: 4,
  weakMult: 1.5,
  resistMult: 0.5,
  guardMult: 0.5,
  kokugenPower: 1.2,
  baseSpd: 12,
  handSize: 5,
  swapHours: 2,
  guardHours: 2,
  healDiv: 18,
};

/** 山札のスナップ（だれでも使える。使うと1枚引く） */
export const CLOCK_CARDS: Record<string, ClockMove> = {
  sword: { id: 'sword', name: 'ソード', hours: 2, effect: { kind: 'damage', element: 'physical', power: 24 } },
  heavyBlow: { id: 'heavyBlow', name: 'ヘビーブロウ', hours: 5, effect: { kind: 'damage', element: 'physical', power: 50 } },
  fireChip: { id: 'fireChip', name: 'ファイアボール', hours: 3, effect: { kind: 'damage', element: 'fire', power: 30 } },
  iceChip: { id: 'iceChip', name: 'アイスニードル', hours: 3, effect: { kind: 'damage', element: 'ice', power: 30 } },
  thunderChip: { id: 'thunderChip', name: 'サンダーボルト', hours: 3, effect: { kind: 'damage', element: 'thunder', power: 30 } },
  wideShot: { id: 'wideShot', name: 'ワイドショット', hours: 4, effect: { kind: 'damage', element: 'physical', power: 16, all: true } },
  recover: { id: 'recover', name: 'リカバー', hours: 3, effect: { kind: 'heal', power: 30 } },
  frameAdvance: { id: 'frameAdvance', name: 'コマ送り', hours: 1, effect: { kind: 'delay', hours: 3 } },
  quickStep: { id: 'quickStep', name: '早回し', hours: 1, effect: { kind: 'hasten', hours: 3 } },
};

/** スナップの絵（台帳の id。コマ送りはサーチの絵で代わり） */
export const CLOCK_CARD_ART: Record<string, string> = {
  sword: 'snap.sword',
  heavyBlow: 'snap.heavyBlow',
  fireChip: 'snap.fireChip',
  iceChip: 'snap.iceChip',
  thunderChip: 'snap.thunderChip',
  wideShot: 'snap.wideShot',
  recover: 'snap.recover',
  frameAdvance: 'snap.search',
  quickStep: 'snap.quickStep',
};

const DECK = [
  ...Array(3).fill('sword'),
  ...Array(2).fill('heavyBlow'),
  ...Array(2).fill('fireChip'),
  ...Array(2).fill('iceChip'),
  ...Array(2).fill('thunderChip'),
  'wideShot',
  ...Array(2).fill('recover'),
  ...Array(2).fill('frameAdvance'),
  'quickStep',
] as string[];

const ATTACK: ClockMove = { id: 'attack', name: '通常攻撃', hours: 2, effect: { kind: 'damage', element: 'physical', power: 18 } };

function ally(id: string, weak: ClockAllyDef['weak'], moves: ClockMove[]): ClockAllyDef {
  const c = PARTY.find((p) => p.id === id)!;
  return { id, name: c.name, hp: c.stats.hp, atk: c.stats.atk, mag: c.stats.mag, def: c.stats.def, spd: c.stats.spd, weak, moves: [ATTACK, ...moves] };
}

/** 出る3人と、控えの2人。弱点がばらけるようにした（交代で、弱点をかわせるように） */
const HERO = ally('hero', ['ice'], [{ id: 'slash', name: '斬り上げ', hours: 3, effect: { kind: 'damage', element: 'physical', power: 32 } }]);
const AKARI = ally('akari', ['thunder'], [
  { id: 'cure', name: 'ケアル', hours: 3, effect: { kind: 'heal', power: 28 } },
  { id: 'ice', name: 'アイス', hours: 3, effect: { kind: 'damage', element: 'ice', power: 26 } },
]);
const HAYASE = ally('hayase', ['physical'], [
  { id: 'fire', name: 'ファイア', hours: 3, effect: { kind: 'damage', element: 'fire', power: 28 } },
  { id: 'thunder', name: 'サンダー', hours: 3, effect: { kind: 'damage', element: 'thunder', power: 28 } },
]);
const MIO = ally('mio', ['fire'], [{ id: 'bolt', name: '雷撃', hours: 2, effect: { kind: 'damage', element: 'thunder', power: 24 } }]);
const SAYOKO = ally('sayoko', ['thunder'], [{ id: 'issen', name: '一閃', hours: 4, effect: { kind: 'damage', element: 'physical', power: 42 } }]);

/** 敵（4-2 の砂嵐の絵を使う）。どれも癖（pattern）の順に動くので、文字盤で次の行動が読める */
const CUCKOO: ClockEnemyDef = {
  id: 'cuckooNoise',
  name: '鳩時計ノイズ',
  hp: 330,
  atk: 16,
  def: 10,
  spd: 9,
  weak: ['thunder'],
  resist: [],
  // 2回つついて、3回目に大技の時報（全体）
  pattern: [
    { id: 'peck', name: 'つつく', kind: 'hit', element: 'physical', power: 26, hours: 3 },
    { id: 'peck', name: 'つつく', kind: 'hit', element: 'physical', power: 26, hours: 3 },
    { id: 'chime', name: '時報', kind: 'all', element: 'fire', power: 34, hours: 5 },
  ],
};
const YOYO: ClockEnemyDef = {
  id: 'yoyoNoise',
  name: 'ヨーヨーノイズ',
  hp: 250,
  atk: 14,
  def: 9,
  spd: 15,
  weak: ['ice'],
  resist: ['thunder'],
  // 速い。行って戻る（2回）と、巻きつけ（当てた仲間の番を遅らせる）
  pattern: [
    { id: 'return', name: '行って戻る', kind: 'twice', element: 'physical', power: 14, hours: 3 },
    { id: 'wrap', name: '巻きつけ', kind: 'bind', element: 'physical', power: 18, shift: 3, hours: 4 },
  ],
};
const PAGER: ClockEnemyDef = {
  id: 'pagerNoise',
  name: 'ポケベルノイズ',
  hp: 270,
  atk: 14,
  def: 9,
  spd: 11,
  weak: ['fire'],
  resist: ['physical'],
  // 呼び出し（ほかの敵の番を早める）と、雷の電波（雷が弱点の仲間をねらう）
  pattern: [
    { id: 'call', name: '呼び出し', kind: 'haste', shift: 4, hours: 3 },
    { id: 'wave', name: '電波', kind: 'hit', element: 'thunder', power: 30, hours: 4 },
  ],
};
const BALLOON: ClockEnemyDef = {
  id: 'paperballoonNoise',
  name: '紙風船ノイズ',
  hp: 240,
  atk: 15,
  def: 8,
  spd: 10,
  weak: ['fire'],
  resist: [],
  pattern: [{ id: 'bounce', name: 'ぽよん', kind: 'hit', element: 'physical', power: 20, hours: 3 }],
  // たたかれるたびにふくらみ、4回目の後の番に破裂（全体）。火でまとめて倒すか、割らせるかを選ぶ
  swellMax: 4,
  burst: { id: 'burst', name: '破裂', kind: 'all', element: 'physical', power: 32, hours: 2 },
};

export const CLOCK_TRIALS: ClockBattleDef[] = [
  { id: 'trial3', name: '砂嵐3体（鳩時計・ヨーヨー・ポケベル）', allies: [HERO, AKARI, HAYASE], reserve: [MIO, SAYOKO], enemies: [CUCKOO, YOYO, PAGER], deck: DECK, cards: CLOCK_CARDS },
  { id: 'trial4', name: '砂嵐4体（紙風船が入る）', allies: [HERO, AKARI, HAYASE], reserve: [MIO, SAYOKO], enemies: [BALLOON, CUCKOO, YOYO, PAGER], deck: DECK, cards: CLOCK_CARDS },
];
