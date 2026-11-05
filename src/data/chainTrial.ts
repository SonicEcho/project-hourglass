import type { ChainAllyDef, ChainBattleDef, ChainEnemyDef, ChainLinkDef, ChainMove, ChainRules } from '../core/chain';

// 試し：並べてつなぐ戦闘（段階156。docs/milestones/M3_battle_review.md の 12.）。デバッグメニューから入る試しだけで使う。
// 数値はたたき台（開発者が遊んだ手応えと、自動対戦で直す）。敵は 1-2 の商店街の砂嵐の絵を使い、特徴を1つずつ持たせた

export const CHAIN_RULES: ChainRules = {
  roundLen: 10,
  handSize: 5,
  weakMult: 1.5,
  resistMult: 0.5,
  gearHits: 3,
  popDamage: 16,
  blastPower: 16,
  healDiv: 10,
};

/** 札（山札に2枚ずつ）。型：置く・受ける・数える・締める */
export const CHAIN_CARDS = {
  puddle: { id: 'ch_puddle', name: '水たまり', type: 'place', weight: 2, target: 'enemies', effect: { kind: 'mark', mark: 'wet' }, text: '敵全体を濡らす。濡れた敵に雷が当たると、濡れた敵みんなに伝わる（鏡も曇る）' },
  ember: { id: 'ch_ember', name: '火種', type: 'place', weight: 2, target: 'enemy', effect: { kind: 'mark', mark: 'oil' }, text: '敵1体に油を付ける。油の敵に火が当たると爆発し、敵全体に火が当たって、みんなよろける（ダウン）' },
  tailwind: { id: 'ch_tailwind', name: '追い風', type: 'receive', weight: 2, target: 'enemies', effect: { kind: 'wind', rate: 0.5 }, text: '直前に動いた仲間の攻撃を、威力半分で敵全体にもう一度（属性も同じ）。直前が攻撃でなければ不発' },
  overlay: { id: 'ch_overlay', name: '重ね撮り', type: 'receive', weight: 3, target: 'enemy', effect: { kind: 'layer', power: 22, mult: 2 }, text: '直前に動いた仲間の攻撃と同じ属性で、敵1体に。直前が攻撃なら威力2倍（でなければ物理）' },
  burst: { id: 'ch_burst', name: '連写', type: 'count', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12, hitsPerActed: true }, text: '敵1体に物理を、このラウンドにもう動いた仲間の数 + 1 回。かたい敵に効く' },
  panorama: { id: 'ch_panorama', name: 'パノラマ', type: 'count', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 8, perActed: 8 }, text: '敵全体に物理。このラウンドにもう動いた仲間1人ごとに、威力が上がる' },
  imprint: { id: 'ch_imprint', name: '焼き付け', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 18, perMark: 30 }, text: '敵1体に物理。相手に付いた印1つごとに威力が大きく上がる（印は消える）' },
  decisive: { id: 'ch_decisive', name: '決めの一枚', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 26, downMult: 2 }, text: '敵1体に物理。ダウン中の敵には2倍' },
} satisfies Record<string, ChainMove>;

/** 札の絵（近い情景の今のスナップの絵を、仮に使う） */
export const CHAIN_CARD_ART: Record<string, string> = {
  ch_puddle: 'snap.iceChip',
  ch_ember: 'snap.fireChip',
  ch_tailwind: 'snap.wideShot',
  ch_overlay: 'snap.search',
  ch_burst: 'snap.sword',
  ch_panorama: 'snap.wideShot',
  ch_imprint: 'snap.heavyBlow',
  ch_decisive: 'snap.breakArm',
};

const move = (m: ChainMove): ChainMove => m;

/** 仲間（型が違う3人）。技は MP なしで、いつでも使える */
export const CHAIN_ALLIES: ChainAllyDef[] = [
  {
    id: 'hero',
    name: 'ハルト',
    role: '締める・物理',
    hp: 210,
    atk: 22,
    mag: 14,
    def: 11,
    moves: [
      move({ id: 'slash', name: '斬る', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 26 }, text: '敵1体に物理' }),
      move({ id: 'quick', name: 'すばやく', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12 }, text: '敵1体に軽い物理。時間をほとんど使わない' }),
      move({ id: 'finisher', name: 'とどめの一閃', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 24, downMult: 2 }, text: '敵1体に物理。ダウン中の敵には2倍' }),
    ],
  },
  {
    id: 'akari',
    name: 'あかり',
    role: '属性・回復',
    hp: 180,
    atk: 12,
    mag: 22,
    def: 9,
    moves: [
      move({ id: 'fire', name: 'ファイア', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 26 }, text: '敵1体に火' }),
      move({ id: 'ice', name: 'アイス', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 26 }, text: '敵1体に氷' }),
      move({ id: 'heal', name: 'いやしの歌', type: 'support', weight: 3, target: 'allies', effect: { kind: 'heal', power: 30 }, text: '仲間全体を回復' }),
    ],
  },
  {
    id: 'mio',
    name: 'みお',
    role: '置く・雷',
    hp: 170,
    atk: 16,
    mag: 18,
    def: 8,
    moves: [
      move({ id: 'thunder', name: 'サンダー', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 26 }, text: '敵1体に雷。濡れた敵に当たると、濡れた敵みんなに伝わる' }),
      move({ id: 'squirt', name: '水でっぽう', type: 'place', weight: 1, target: 'enemy', effect: { kind: 'mark', mark: 'wet', element: 'ice', power: 8 }, text: '敵1体を濡らし、氷で小さく当てる。時間をほとんど使わない' }),
      move({ id: 'kick', name: 'けとばし', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 18 }, text: '敵1体に物理' }),
    ],
  },
];

/** 連携技（クロノ・トリガーの連携技のように、組む2人がそろっている時だけ）。前の人の攻撃の属性が合い、間に敵が動かなければ使える */
export const CHAIN_LINKS: ChainLinkDef[] = [
  {
    id: 'afterglow',
    from: 'akari',
    to: 'hero',
    needs: ['fire', 'ice'],
    move: { id: 'afterglow', name: 'アフターグロウ', type: 'link', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 30, bestOf: ['fire', 'ice'] }, text: 'あかりの火か氷のすぐ後に。敵全体に、敵ごとに火か氷の効く方で（弱点ならダウン）' },
  },
  {
    id: 'crossDrive',
    from: 'hero',
    to: 'mio',
    needs: ['physical'],
    move: { id: 'crossDrive', name: 'クロスドライブ', type: 'link', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 30, ignoreResist: true }, text: 'ハルトの物理のすぐ後に。敵全体に物理（耐性を無視。物理が弱点ならダウン）' },
  },
];

/** 敵（1つずつ特徴がある） */
export const CHAIN_ENEMIES = {
  tin: {
    id: 'tinNoise',
    name: 'ブリキノイズ',
    hp: 190,
    atk: 14,
    def: 12,
    weak: ['thunder'],
    resist: [],
    trait: 'gear',
    pattern: [
      { id: 'windUp', name: 'ぜんまいパンチ', at: 7, element: 'physical', power: 34 },
      { id: 'march', name: 'ブリキの行進', at: 5, all: true, element: 'physical', power: 18 },
    ],
  },
  phone: {
    id: 'phoneNoise',
    name: '黒電話ノイズ',
    hp: 160,
    atk: 13,
    def: 9,
    weak: ['ice'],
    resist: ['fire'],
    trait: 'herald',
    pattern: [
      { id: 'ring', name: 'ジリリリ', at: 4, all: true, element: 'thunder', power: 30 },
      { id: 'cord', name: 'コードのむち', at: 6, element: 'physical', power: 28 },
    ],
  },
  ramune: {
    id: 'ramuneNoise',
    name: 'ラムネノイズ',
    hp: 130,
    atk: 12,
    def: 7,
    weak: ['physical'],
    resist: ['ice'],
    trait: 'pop',
    pattern: [
      { id: 'marble', name: 'ビー玉はじき', at: 2, element: 'physical', power: 28 },
      { id: 'fizz', name: 'しゅわしゅわ', at: 3, element: 'ice', power: 30 },
    ],
  },
  menko: {
    id: 'menkoNoise',
    name: 'めんこノイズ',
    hp: 150,
    atk: 12,
    def: 10,
    weak: ['fire'],
    resist: ['physical'],
    trait: 'mirror',
    pattern: [
      { id: 'slap', name: 'めんこ打ち', at: 5, element: 'physical', power: 30 },
      { id: 'spin', name: 'ベーゴマの渦', at: 8, all: true, element: 'physical', power: 20 },
    ],
  },
} satisfies Record<string, ChainEnemyDef>;

/** 特徴の名前と説明（画面に出す） */
export const CHAIN_TRAIT_TEXT: Record<string, { name: string; text: string }> = {
  gear: { name: 'かたい', text: '弱点でも爆発でもダウンしない。1ラウンドに3回当てるとダウン（連写・全体攻撃・追い風の数で押す）' },
  herald: { name: '予告', text: '早い時刻に、強い全体攻撃を予告する。動く前にダウンさせれば止められる' },
  pop: { name: 'はじける', text: '弱点でダウンさせると、破片が仲間全体に当たる（爆発やほかの手で崩せば当たらない）' },
  mirror: { name: '鏡', text: '弱点の火を受けると、はね返して使った仲間に当てる。濡らすと曇って、はね返せない' },
};

const DECK = Object.values(CHAIN_CARDS).flatMap((c) => [c.id, c.id]);
const CARDS: Record<string, ChainMove> = Object.fromEntries(Object.values(CHAIN_CARDS).map((c) => [c.id, c]));

function battle(id: string, name: string, enemies: ChainEnemyDef[]): ChainBattleDef {
  return { id, name, allies: CHAIN_ALLIES, enemies, deck: DECK, cards: CARDS, links: CHAIN_LINKS };
}

/** 攻撃を下げた敵 */
function weaker(e: ChainEnemyDef, rate: number): ChainEnemyDef {
  return { ...e, atk: Math.round(e.atk * rate) };
}

/** 試しの組み合わせ */
export const CHAIN_TRIALS: ChainBattleDef[] = [
  battle('chain1', '黒電話・ブリキ・ラムネ', [CHAIN_ENEMIES.phone, CHAIN_ENEMIES.tin, CHAIN_ENEMIES.ramune]),
  battle('chain2', 'めんこ・黒電話・ラムネ', [CHAIN_ENEMIES.menko, CHAIN_ENEMIES.phone, CHAIN_ENEMIES.ramune]),
  // 4体の時は、攻撃を下げる（1ラウンドに受ける数が増えるため）
  battle('chain3', 'めんこ・ブリキ・黒電話・ラムネ', [CHAIN_ENEMIES.menko, CHAIN_ENEMIES.tin, CHAIN_ENEMIES.phone, CHAIN_ENEMIES.ramune].map((e) => weaker(e, 0.6))),
];
