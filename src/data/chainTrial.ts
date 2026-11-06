import type { ChainAllyDef, ChainBattleDef, ChainEnemyDef, ChainEnemyMove, ChainGrade, ChainLinkDef, ChainMove, ChainRules, ChainVariant } from '../core/chain';

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
  imprint: card({ id: 'ch_imprint', name: '焼き付け', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 24, perMark: 30 }, text: '敵1体に物理。相手に付いた印1つごとに威力が大きく上がる（印は消える）' }),
  wideShot: card({ id: 'ch_wideShot', name: 'ワイドショット', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 16 }, text: '敵全体に物理' }),
  decisive: card({ id: 'ch_decisive', name: '決めの一枚', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, downMult: 2 }, text: '敵1体に物理。ダウン中の敵には2倍' }),
  // 専用の札（その仲間しか使えない。組む2人の札がそろうと連携技）
  swing: card({ id: 'ch_swing', name: '全力スイング', type: 'attack', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 52 }, text: 'ハルト専用。敵1体にとても強い物理（重い）', owner: 'hero' }),
  sparkler: card({ id: 'ch_sparkler', name: '線香花火', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 18 }, text: 'あかり専用。敵全体に火', owner: 'akari' }),
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

/**
 * 仲間。技は MP なしで、いつでも使える。
 * 調整6：重さと強さを釣り合わせた（重さ1は約10で「押す2」付き、2は約20、3は約30、4は約45）。行動は終わった時刻に効くので、重い技ほど遅れて効く
 */
export const CHAIN_ALLIES: ChainAllyDef[] = [
  {
    id: 'hero',
    name: 'ハルト',
    hp: 210,
    atk: 22,
    mag: 14,
    def: 11,
    moves: [
      move({ id: 'quick', name: 'すばやく', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 10, push: 2 }, text: '敵1体に軽い物理。当てた敵のまだ動いていない予定を、2マス後ろへ押す' }),
      move({ id: 'slash', name: '斬る', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 22 }, text: '敵1体に物理' }),
      move({ id: 'finisher', name: 'とどめの一閃', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40, downMult: 2 }, text: '敵1体に強い物理（重い）。ダウン中の敵には2倍' }),
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
      move({ id: 'spark', name: '火花', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 8, push: 2 }, text: '敵1体に軽い火。当てた敵のまだ動いていない予定を、2マス後ろへ押す' }),
      move({ id: 'fire', name: 'ファイア', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 30 }, text: '敵1体に火' }),
      move({ id: 'ice', name: 'アイス', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 30 }, text: '敵1体に氷' }),
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
      move({ id: 'kick', name: 'けとばし', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 10, push: 2 }, text: '敵1体に軽い物理。当てた敵のまだ動いていない予定を、2マス後ろへ押す' }),
      move({ id: 'zap', name: '静電気', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 8, push: 2 }, text: '敵1体に軽い雷。当てた敵のまだ動いていない予定を、2マス後ろへ押す' }),
      move({ id: 'thunder', name: 'サンダー', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 30 }, text: '敵1体に雷' }),
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

function battle(id: string, name: string, enemies: ChainEnemyDef[], variants: ChainVariant[], gradeAt = { high: 8, mid: 16 }): ChainBattleDef {
  return { id, name, allies: CHAIN_ALLIES, enemies, deck: DECK, cards: CARDS, links: CHAIN_LINKS, variants, gradeAt };
}

const E = CHAIN_ENEMIES;
/** 敵の癖の何番目かの行動 */
const mv = (e: ChainEnemyDef, i: number): ChainEnemyMove => e.pattern[i];

/** 早くて痛い大技（調整6。止めないと仲間が大きく削られる。型の中に混ぜる） */
const BIG = {
  bigFlip: { id: 'bigFlip', name: '大ちゃぶ台返し', at: 3, all: true, element: 'physical', power: 44 },
  earlyEscape: { id: 'earlyEscape', name: '逃げる', at: 6, element: 'physical', power: 0, flee: true },
  fullSpring: { id: 'fullSpring', name: 'ぜんまい全開', at: 2, element: 'physical', power: 90 },
  earlyChime: { id: 'earlyChime', name: '早鐘', at: 2, all: true, element: 'physical', power: 14 },
  whirl: { id: 'whirl', name: 'つむじ風', at: 1, at2: 5, element: 'physical', power: 26 },
  menkoStorm: { id: 'menkoStorm', name: 'めんこ乱れ打ち', at: 3, all: true, element: 'physical', power: 40 },
  thickSmoke: { id: 'thickSmoke', name: 'もうもう煙', at: 2, all: true, element: 'fire', power: 34 },
  candyRain: { id: 'candyRain', name: '飴の雨', at: 2, all: true, element: 'fire', power: 36 },
  bigSplash: { id: 'bigSplash', name: '大しぶき', at: 2, all: true, element: 'ice', power: 34 },
  rapid: { id: 'rapid', name: 'ビー玉連射', at: 1, element: 'physical', power: 80 },
} satisfies Record<string, ChainEnemyMove>;

/** 型（patterns は敵の並びと同じ。undefined はその敵の定義の癖のまま） */
const variant = (id: string, name: string, patterns: (ChainEnemyMove[] | undefined)[]): ChainVariant => ({ id, name, patterns });

/** 早く終えた時の報酬（低：汎用アイテム・素材、中：レアアイテム・レア素材、高：その敵の固有のスナップ）。試しでは表示だけ */
export const CHAIN_REWARDS: Record<string, Record<ChainGrade, string>> = {
  chain1: { low: '素材「ちゃぶ台の木くず」', mid: 'レア素材「金魚のうろこ」', high: '固有のスナップ「金魚すくい」（金魚ノイズ）' },
  chain2: { low: '素材「ぜんまいのばね」', mid: 'レア素材「鳩時計の歯車」', high: '固有のスナップ「早鐘」（鳩時計ノイズ）' },
  chain3: { low: '素材「蚊取り線香の灰」', mid: 'レアアイテム「ハイポーション」', high: '固有のスナップ「めんこ乱れ打ち」（めんこノイズ）' },
  chain4: { low: '素材「ヨーヨーのひも」', mid: 'レア素材「べっこう飴」', high: '固有のスナップ「つむじ風」（ヨーヨーノイズ）' },
  chain5: { low: '素材「ビー玉」', mid: 'レア素材「夕焼けのビー玉」', high: '固有のスナップ「大しぶき」（水風船ノイズ）' },
};

/**
 * 試しの組み合わせ（調整4。ロックマンエグゼのウイルスの編成のように、名前の付いた決まった組み合わせ）。
 * 調整6：組み合わせごとに3つの型があり、戦闘ごとに1つを選ぶ（同じ顔ぶれでも、予定の並びが違う）。型の中には、早くて痛い大技がある
 */
export const CHAIN_TRIALS: ChainBattleDef[] = [
  // 盾2体が、逃げる金魚を守る。単体の攻撃は盾に吸われる
  battle('chain1', '金魚すくいの屋台（盾・盾・逃げる）', [E.table, E.goldfish, E.table], [
    variant('v1', '客寄せ', [undefined, undefined, [mv(E.table, 1), mv(E.table, 0)]]),
    variant('v2', '店じまい', [[BIG.bigFlip, mv(E.table, 1)], undefined, undefined]),
    variant('v3', '逃げ足', [undefined, [BIG.earlyEscape], [mv(E.table, 1), mv(E.table, 0)]]),
  ]),
  // 起こし役がダウンした仲間を起こす。殻のブリキは1回目が効かず、ヨーヨーは2回動く
  battle('chain2', 'からくり時計（起こし役・殻・すばやい）', [E.tin, E.cuckoo, E.yoyo], [
    variant('v1', 'ねじ巻き', [undefined, undefined, undefined]),
    variant('v2', '早鐘', [undefined, [BIG.earlyChime, mv(E.cuckoo, 1)], undefined]),
    variant('v3', '全開', [[BIG.fullSpring, mv(E.tin, 0)], undefined, [BIG.whirl, mv(E.yoyo, 0)]]),
  ]),
  // 盾のちゃぶ台が、時限の蚊取り線香を守る。叩くとやり返すめんこもいる
  battle('chain3', '夏の縁側（時限・盾・反撃）', [E.menko, E.coil, E.table], [
    variant('v1', '夕涼み', [undefined, undefined, undefined]),
    variant('v2', '乱れ打ち', [[BIG.menkoStorm, mv(E.menko, 0)], undefined, undefined]),
    variant('v3', '煙幕', [undefined, [BIG.thickSmoke, mv(E.coil, 0)], [mv(E.table, 1), mv(E.table, 0)]]),
  ]),
  // 飴細工を叩くと、後の仲間が遅れ、すばやいヨーヨー2体の2回目が先に来る
  battle('chain4', '駄菓子屋の店先（ねばねば・すばやい・すばやい）', [E.yoyo, E.candy, E.yoyo], [
    variant('v1', '店番', [undefined, undefined, [mv(E.yoyo, 1), mv(E.yoyo, 0)]]),
    variant('v2', '飴の雨', [undefined, [BIG.candyRain, mv(E.candy, 0)], undefined]),
    variant('v3', 'つむじ', [[BIG.whirl, mv(E.yoyo, 0)], undefined, [mv(E.yoyo, 1), BIG.whirl]]),
  ]),
  // 水風船2体は倒すと4体に増える。ラムネを弱点でダウンさせると破片が飛ぶ
  battle('chain5', '水遊び（分裂・分裂・はじける）', [E.balloon, E.ramune, E.balloon], [
    variant('v1', '水まき', [undefined, undefined, undefined]),
    variant('v2', '大しぶき', [[BIG.bigSplash, mv(E.balloon, 0)], undefined, undefined]),
    variant('v3', '連射', [undefined, [BIG.rapid, mv(E.ramune, 0)], undefined]),
  ]),
];
