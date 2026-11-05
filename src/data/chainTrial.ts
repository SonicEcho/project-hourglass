import type { ChainAllyDef, ChainBattleDef, ChainEnemyDef, ChainLinkDef, ChainMove, ChainRules } from '../core/chain';

// 試し：並べてつなぐ戦闘（段階156。docs/milestones/M3_battle_review.md の 12.）。デバッグメニューから入る試しだけで使う。
// 数値はたたき台（開発者が遊んだ手応えと、自動対戦で直す）。敵は、今の砂嵐の絵を使い、特徴を1つずつ持たせた（調整3）

export const CHAIN_RULES: ChainRules = {
  roundLen: 10,
  handSize: 5,
  weakMult: 1.5,
  resistMult: 0.5,
  popDamage: 16,
  stickyDelay: 2,
  counterPower: 22,
  timerDamage: 60,
  healDiv: 10,
};

const card = (m: ChainMove): ChainMove => m;

/** 札。型：置く（属性の色の印）・攻撃・締める。専用の札は、その仲間しか使えない（調整5で、受ける・数える札を外した） */
export const CHAIN_CARDS = {
  ember: card({ id: 'ch_ember', name: '火種', type: 'place', weight: 1, target: 'enemy', effect: { kind: 'mark', element: 'fire' }, text: '敵1体に火の印。火が当たると、火の印の敵みんなに広がる' }),
  puddle: card({ id: 'ch_puddle', name: '水たまり', type: 'place', weight: 2, target: 'enemies', effect: { kind: 'mark', element: 'ice' }, text: '敵全体に氷の印。氷が当たると、氷の印の敵みんなに広がる' }),
  rod: card({ id: 'ch_rod', name: '避雷針', type: 'place', weight: 2, target: 'enemies', effect: { kind: 'mark', element: 'thunder' }, text: '敵全体に雷の印。雷が当たると、雷の印の敵みんなに広がる' }),
  target: card({ id: 'ch_target', name: '目印', type: 'place', weight: 1, target: 'enemy', effect: { kind: 'mark', element: 'physical' }, text: '敵1体に物理の印。物理が当たると、物理の印の敵みんなに広がる' }),
  imprint: card({ id: 'ch_imprint', name: '焼き付け', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 18, perMark: 30 }, text: '敵1体に物理。相手に付いた印1つごとに威力が大きく上がる（印は消える）' }),
  wideShot: card({ id: 'ch_wideShot', name: 'ワイドショット', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 14 }, text: '敵全体に物理' }),
  decisive: card({ id: 'ch_decisive', name: '決めの一枚', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 26, downMult: 2 }, text: '敵1体に物理。ダウン中の敵には2倍' }),
  // 専用の札（その仲間しか使えない。組む2人の札がそろうと連携技）
  swing: card({ id: 'ch_swing', name: '全力スイング', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 36 }, text: 'ハルト専用。敵1体に強い物理', owner: 'hero' }),
  sparkler: card({ id: 'ch_sparkler', name: '線香花火', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 14 }, text: 'あかり専用。敵全体に火', owner: 'akari' }),
  waterBalloon: card({ id: 'ch_waterBalloon', name: '水風船', type: 'place', weight: 2, target: 'enemies', effect: { kind: 'mark', element: 'ice', power: 6 }, text: 'みお専用。敵全体に氷で小さく当て、氷の印を付ける', owner: 'mio' }),
} satisfies Record<string, ChainMove>;

/** 札の絵（近い情景の今のスナップの絵を、仮に使う） */
export const CHAIN_CARD_ART: Record<string, string> = {
  ch_ember: 'snap.fireChip',
  ch_puddle: 'snap.iceChip',
  ch_rod: 'snap.thunderChip',
  ch_target: 'snap.search',
  ch_wideShot: 'snap.wideShot',
  ch_imprint: 'snap.heavyBlow',
  ch_decisive: 'snap.breakArm',
  ch_swing: 'snap.pinchHitter',
  ch_sparkler: 'snap.fireChip',
  ch_waterBalloon: 'snap.recover',
};

const move = (m: ChainMove): ChainMove => m;

/** 仲間。技は MP なしで、いつでも使える */
export const CHAIN_ALLIES: ChainAllyDef[] = [
  {
    id: 'hero',
    name: 'ハルト',
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
    hp: 170,
    atk: 16,
    mag: 18,
    def: 8,
    moves: [
      move({ id: 'thunder', name: 'サンダー', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 26 }, text: '敵1体に雷' }),
      move({ id: 'kick', name: 'けとばし', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 18 }, text: '敵1体に物理' }),
    ],
  },
];

/** 連携技（クロノ・トリガーの連携技のように、組む2人がそろっている時だけ）。2人の専用の札が手札にそろうと使える */
export const CHAIN_LINKS: ChainLinkDef[] = [
  {
    id: 'afterglow',
    members: ['hero', 'akari'],
    cards: ['ch_swing', 'ch_sparkler'],
    move: { id: 'afterglow', name: 'アフターグロウ', type: 'link', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 34, bestOf: ['fire', 'ice'] }, text: 'ハルトとあかり。敵全体に、敵ごとに火か氷の効く方で（弱点ならダウン）' },
  },
  {
    id: 'crossDrive',
    members: ['hero', 'mio'],
    cards: ['ch_swing', 'ch_waterBalloon'],
    move: { id: 'crossDrive', name: 'クロスドライブ', type: 'link', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 34, ignoreResist: true }, text: 'ハルトとみお。敵全体に物理（耐性を無視。物理が弱点ならダウン）' },
  },
  {
    id: 'shower',
    members: ['akari', 'mio'],
    cards: ['ch_sparkler', 'ch_waterBalloon'],
    move: { id: 'shower', name: '夕立', type: 'link', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'thunder', power: 30, bestOf: ['thunder', 'ice'] }, text: 'あかりとみお。敵全体に、敵ごとに雷か氷の効く方で（弱点ならダウン）' },
  },
];

const foe = (e: ChainEnemyDef): ChainEnemyDef => e;

/** 分裂で出てくる、小さい水風船 */
const MINI_BALLOON = foe({
  id: 'miniBalloon',
  name: '小さい水風船',
  hp: 45,
  atk: 10,
  def: 6,
  weak: ['thunder'],
  resist: [],
  pattern: [{ id: 'splash', name: 'ぱしゃっ', at: 6, element: 'ice', power: 18 }],
});

/** 敵（1つずつ特徴がある。絵は今の砂嵐の絵） */
export const CHAIN_ENEMIES = {
  ramune: foe({ id: 'ramuneNoise', name: 'ラムネノイズ', hp: 130, atk: 12, def: 7, weak: ['physical'], resist: ['ice'], trait: 'pop', pattern: [
    { id: 'marble', name: 'ビー玉はじき', at: 2, element: 'physical', power: 28 },
    { id: 'fizz', name: 'しゅわしゅわ', at: 3, element: 'ice', power: 30 },
  ] }),
  yoyo: foe({ id: 'yoyoNoise', name: 'ヨーヨーノイズ', hp: 120, atk: 11, def: 8, weak: ['ice'], resist: [], trait: 'swift', pattern: [
    { id: 'loop', name: '行って戻る', at: 2, at2: 6, element: 'physical', power: 22 },
    { id: 'spin', name: 'ループ・ザ・ループ', at: 3, at2: 7, element: 'physical', power: 20 },
  ] }),
  table: foe({ id: 'tableNoise', name: 'ちゃぶ台ノイズ', hp: 200, atk: 12, def: 12, weak: ['fire'], resist: ['physical'], trait: 'shield', pattern: [
    { id: 'flip', name: 'ちゃぶ台返し', at: 6, all: true, element: 'physical', power: 18 },
    { id: 'press', name: 'のしかかり', at: 5, element: 'physical', power: 30 },
  ] }),
  tin: foe({ id: 'tinNoise', name: 'ブリキノイズ', hp: 160, atk: 13, def: 10, weak: ['ice'], resist: [], trait: 'shell', pattern: [
    { id: 'windUp', name: 'ぜんまいパンチ', at: 7, element: 'physical', power: 32 },
    { id: 'march', name: 'ブリキの行進', at: 5, all: true, element: 'physical', power: 18 },
  ] }),
  candy: foe({ id: 'candyNoise', name: '飴細工ノイズ', hp: 150, atk: 12, def: 9, weak: ['fire'], resist: ['ice'], trait: 'sticky', pattern: [
    { id: 'whip', name: '飴のむち', at: 4, element: 'physical', power: 26 },
    { id: 'melt', name: 'とろける', at: 6, all: true, element: 'fire', power: 18 },
  ] }),
  cuckoo: foe({ id: 'cuckooNoise', name: '鳩時計ノイズ', hp: 140, atk: 12, def: 9, weak: ['physical'], resist: [], trait: 'waker', pattern: [
    { id: 'chime', name: '時報', at: 5, all: true, element: 'physical', power: 16 },
    { id: 'peck', name: 'つつく', at: 7, element: 'physical', power: 26 },
  ] }),
  menko: foe({ id: 'menkoNoise', name: 'めんこノイズ', hp: 150, atk: 12, def: 10, weak: ['fire'], resist: ['physical'], trait: 'counter', pattern: [
    { id: 'slap', name: 'めんこ打ち', at: 5, element: 'physical', power: 30 },
    { id: 'spin', name: 'ベーゴマの渦', at: 8, all: true, element: 'physical', power: 20 },
  ] }),
  balloon: foe({ id: 'balloonNoise', name: '水風船ノイズ', hp: 110, atk: 11, def: 7, weak: ['thunder'], resist: ['fire'], trait: 'split', splitInto: MINI_BALLOON, pattern: [
    { id: 'bounce', name: 'ぼよん', at: 4, element: 'physical', power: 26 },
  ] }),
  coil: foe({ id: 'coilNoise', name: '蚊取り線香ノイズ', hp: 140, atk: 11, def: 9, weak: ['ice'], resist: ['fire'], trait: 'timer', timer: 3, pattern: [
    { id: 'smoke', name: 'けむり', at: 6, element: 'fire', power: 22 },
  ] }),
  goldfish: foe({ id: 'goldfishNoise', name: '金魚ノイズ', hp: 120, atk: 11, def: 8, weak: ['thunder'], resist: [], trait: 'flee', pattern: [
    { id: 'splashTail', name: '尾びれではたく', at: 3, element: 'physical', power: 24 },
    { id: 'escape', name: '逃げる', at: 8, element: 'physical', power: 0, flee: true },
  ] }),
} satisfies Record<string, ChainEnemyDef>;

/** 特徴の名前と説明（画面に出す） */
export const CHAIN_TRAIT_TEXT: Record<string, { name: string; text: string }> = {
  pop: { name: 'はじける', text: '弱点でダウンさせると、破片が仲間全体に当たる' },
  swift: { name: 'すばやい', text: '1ラウンドに2回動く。1回目より前にダウンさせれば、2回とも止まる' },
  shield: { name: '盾', text: '立っている間、ほかの敵への単体攻撃を代わりに受ける。先にダウンさせるか、全体攻撃で' },
  shell: { name: '殻', text: '最初の1回は殻が割れるだけで、効かない。軽い技で先に割ってから本命を' },
  sticky: { name: 'ねばねば', text: '攻撃を当てると、まだ動いていない仲間の時刻が2遅れる。叩く人を最後に回す' },
  waker: { name: '起こし役', text: '動くと、ダウンしているほかの敵を起こす。起こし役より後にダウンさせるか、先に止める' },
  counter: { name: '反撃', text: 'ダウンしていない時に叩かれると、やり返す。先にダウンさせてから叩く' },
  split: { name: '分裂', text: '倒すと、小さい2体に分かれる。全体攻撃でまとめて' },
  timer: { name: '時限', text: 'ラウンドの終わりごとに数が減り、0で大爆発して仲間全体に大きなダメージ。期限までに倒す' },
  flee: { name: '逃げる', text: '「逃げる」の予定の時刻に、戦闘からいなくなる。逃げる前に倒すかダウンさせる' },
};

const DECK = [
  ...['ch_ember', 'ch_ember', 'ch_puddle', 'ch_puddle', 'ch_rod', 'ch_rod', 'ch_target'],
  ...['ch_wideShot', 'ch_wideShot', 'ch_target', 'ch_imprint', 'ch_imprint', 'ch_decisive', 'ch_decisive'],
  ...['ch_swing', 'ch_swing', 'ch_sparkler', 'ch_sparkler', 'ch_waterBalloon', 'ch_waterBalloon'],
];
const CARDS: Record<string, ChainMove> = Object.fromEntries(Object.values(CHAIN_CARDS).map((c) => [c.id, c]));

function battle(id: string, name: string, enemies: ChainEnemyDef[]): ChainBattleDef {
  return { id, name, allies: CHAIN_ALLIES, enemies, deck: DECK, cards: CARDS, links: CHAIN_LINKS };
}

/**
 * 試しの組み合わせ（調整4。ロックマンエグゼのウイルスの編成のように、名前の付いた決まった組み合わせ）。
 * 特徴どうしが噛み合うように組む（開発者の頼み「盾・盾・逃げる、のように、うまく連携を取っている組み合わせ」）
 */
export const CHAIN_TRIALS: ChainBattleDef[] = [
  // 盾2体が、逃げる金魚を守る。単体の攻撃は盾に吸われるので、全体攻撃か、盾を2体ともダウンさせてから。金魚は2ラウンド目の時刻8に逃げる
  battle('chain1', '金魚すくいの屋台（盾・盾・逃げる）', [CHAIN_ENEMIES.table, CHAIN_ENEMIES.goldfish, CHAIN_ENEMIES.table]),
  // 起こし役が時刻5に、ダウンした仲間を起こす。殻のブリキは1回目が効かず、ヨーヨーは2回動く。起こし役を先に止めるか、5より後にまとめて崩す
  battle('chain2', 'からくり時計（起こし役・殻・すばやい）', [CHAIN_ENEMIES.tin, CHAIN_ENEMIES.cuckoo, CHAIN_ENEMIES.yoyo]),
  // 盾のちゃぶ台が、時限の蚊取り線香を守る。叩くとやり返すめんこもいる。3ラウンドで大爆発するので、盾を崩して線香を倒す
  battle('chain3', '夏の縁側（時限・盾・反撃）', [CHAIN_ENEMIES.menko, CHAIN_ENEMIES.coil, CHAIN_ENEMIES.table]),
  // 飴細工を叩くと、後の仲間が遅れ、すばやいヨーヨー2体の2回目が先に来る。飴細工を叩く人は最後に
  battle('chain4', '駄菓子屋の店先（ねばねば・すばやい・すばやい）', [CHAIN_ENEMIES.yoyo, CHAIN_ENEMIES.candy, CHAIN_ENEMIES.yoyo]),
  // 水風船2体は倒すと4体に増える。ラムネを弱点でダウンさせると破片が飛ぶ。全体攻撃と共鳴でまとめて崩す
  battle('chain5', '水遊び（分裂・分裂・はじける）', [CHAIN_ENEMIES.balloon, CHAIN_ENEMIES.ramune, CHAIN_ENEMIES.balloon]),
];
