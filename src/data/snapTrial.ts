import type { CardDef, ComboDef } from '../core/types';
import type { CampaignBattle } from './campaign';
import { CARDS } from './cards';
import { BICYCLE_LORD, MENKO_NOISE, PHONE_NOISE, RAMUNE_NOISE, TIN_NOISE } from './showaEnemies';

// 試し：コンボと現像（段階155。docs/milestones/M3_snap_catalog.md の 15・16）。デバッグメニューから入る試しの戦闘だけで使う。
// 物語のアルバムには入れない。数値はたたき台（開発者が遊んだ手応えで直す）。絵は、近い情景の今のスナップの絵を仮に使う

/** 現像する札（手札に残すと、ラウンドの始めに段が進む：撮りたて → 現像 → 焼き付け） */
export const TRIAL_CARDS = {
  // 育つ：残すほど強い。焼き付けで必ずダウンを取りやすい大技に
  bat: {
    id: 'tr_bat',
    name: '金属バット',
    weight: 1.0,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 28 }],
    develop: {
      kind: 'grow',
      stages: [
        { effects: [{ kind: 'damage', type: 'physical', power: 46 }] },
        { name: '金属バット（快音）', weight: 1.4, effects: [{ kind: 'damage', type: 'physical', power: 80, ignoreResist: true }] },
      ],
    },
  },
  // 育つ：単体から、焼き付けで全体に広がる
  pinwheel: {
    id: 'tr_pinwheel',
    name: '風車',
    weight: 1.0,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 22 }],
    develop: {
      kind: 'grow',
      stages: [
        { effects: [{ kind: 'damage', type: 'physical', power: 32 }] },
        { name: '風車（つむじ風）', target: 'enemies', effects: [{ kind: 'damage', type: 'physical', power: 30 }] },
      ],
    },
  },
  // 色あせる：撮りたてが一番強い（インスタント写真）。残すと弱くなる
  flash: {
    id: 'tr_flash',
    name: 'フラッシュ',
    weight: 1.0,
    target: 'enemies',
    effects: [{ kind: 'damage', type: 'thunder', power: 30 }],
    develop: {
      kind: 'fade',
      stages: [
        { name: 'フラッシュ（色あせ）', target: 'enemy', effects: [{ kind: 'damage', type: 'thunder', power: 34 }] },
        { name: 'フラッシュ（白とび）', target: 'enemy', effects: [{ kind: 'damage', type: 'thunder', power: 18 }] },
      ],
    },
  },
  // 色あせる：撮りたては強い火。すぐ消える線香花火
  sparkler: {
    id: 'tr_sparkler',
    name: '線香花火',
    weight: 0.8,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'fire', power: 52 }],
    develop: {
      kind: 'fade',
      stages: [
        { name: '線香花火（ちりちり）', effects: [{ kind: 'damage', type: 'fire', power: 34 }] },
        { name: '線香花火（落ちた玉）', effects: [{ kind: 'damage', type: 'fire', power: 16 }] },
      ],
    },
  },
  // 化ける：撮りたては氷の単体。焼き付けで、仲間全体の回復に変わる
  goldfish: {
    id: 'tr_goldfish',
    name: '金魚すくい',
    weight: 1.0,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'ice', power: 34 }],
    develop: {
      kind: 'change',
      stages: [
        { effects: [{ kind: 'damage', type: 'ice', power: 40 }] },
        { name: '金魚すくい（金魚鉢）', target: 'allies', effects: [{ kind: 'heal', power: 30 }] },
      ],
    },
  },
} satisfies Record<string, CardDef>;

/** 試しの札の絵（近い情景の今のスナップの絵を、仮に使う） */
export const TRIAL_CARD_ART: Record<string, { asset: string; x: number; y: number }> = {
  tr_bat: { asset: 'snap.heavyBlow', x: 0.5, y: 0.5 },
  tr_pinwheel: { asset: 'snap.wideShot', x: 0.5, y: 0.5 },
  tr_flash: { asset: 'snap.thunderChip', x: 0.5, y: 0.5 },
  tr_sparkler: { asset: 'snap.fireChip', x: 0.5, y: 0.5 },
  tr_goldfish: { asset: 'snap.iceChip', x: 0.5, y: 0.5 },
};

/** 2枚のコンボ（思い出のつながり）。今の4つのコンボ（3枚・2枚）と一緒に使える */
export const TRIAL_COMBOS: ComboDef[] = [
  {
    id: 'tr_summerNight',
    name: '夏祭りの夜',
    cards: ['tr_goldfish', 'tr_sparkler'],
    weight: 1.2,
    target: 'enemies',
    effects: [{ kind: 'damage', type: 'fire', power: 44, bestOf: ['fire', 'ice'] }],
  },
  {
    id: 'tr_walkoff',
    name: 'サヨナラ打',
    cards: ['tr_bat', 'sword'],
    weight: 1.4,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 95, ignoreResist: true }],
  },
  {
    id: 'tr_strobe',
    name: 'ストロボ',
    cards: ['tr_flash', 'thunderChip'],
    weight: 1.0,
    target: 'enemies',
    effects: [{ kind: 'damage', type: 'thunder', power: 42 }],
  },
  {
    id: 'tr_wayHome',
    name: '夕暮れの帰り道',
    cards: ['tr_pinwheel', 'recover'],
    weight: 1.0,
    target: 'allies',
    effects: [{ kind: 'heal', power: 40 }],
  },
  {
    id: 'tr_sprinkler',
    name: '夏の水まき',
    cards: ['iceChip', 'recover'],
    weight: 1.2,
    target: 'enemies',
    effects: [{ kind: 'damage', type: 'ice', power: 30 }],
  },
];

/** コンボの名前の2行の分け方 */
export const TRIAL_COMBO_NAME_LINES: Record<string, string> = {
  tr_summerNight: '夏祭り\nの夜',
  tr_walkoff: 'サヨナラ\n打',
  tr_strobe: 'ストロボ',
  tr_wayHome: '夕暮れの\n帰り道',
  tr_sprinkler: '夏の\n水まき',
};

/** 試しのアルバム（20枚）。現像する札が8枚、2枚のコンボの相方が入る */
export const TRIAL_DECK: CardDef[] = [
  ...[TRIAL_CARDS.bat, TRIAL_CARDS.bat, TRIAL_CARDS.pinwheel, TRIAL_CARDS.flash, TRIAL_CARDS.flash, TRIAL_CARDS.sparkler, TRIAL_CARDS.goldfish, TRIAL_CARDS.goldfish],
  CARDS.sword,
  CARDS.sword,
  CARDS.sword,
  CARDS.iceChip,
  CARDS.iceChip,
  CARDS.thunderChip,
  CARDS.thunderChip,
  CARDS.fireChip,
  CARDS.recover,
  CARDS.recover,
  CARDS.heavyBlow,
  CARDS.draw,
];

/** 試しの戦闘（1-2 の商店街の敵。育っていない3人で戦う） */
export const SNAP_TRIAL_BATTLES: Record<string, CampaignBattle> = {
  zako: { id: 'trial_zako', name: '試し：砂嵐3体', enemies: [TIN_NOISE, PHONE_NOISE, RAMUNE_NOISE], reward: 0 },
  zako2: { id: 'trial_zako2', name: '試し：砂嵐4体', enemies: [TIN_NOISE, MENKO_NOISE, RAMUNE_NOISE, PHONE_NOISE], reward: 0 },
  boss: { id: 'trial_boss', name: '試し：自転車のぬし', enemies: [BICYCLE_LORD], reward: 0, boss: true },
};
