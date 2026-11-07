import type { LeapAllyDef, LeapBattleDef, LeapEnemyDef, LeapMove, LeapRules } from '../core/leap';

// 試し：組んで跳ねる戦闘（段階157。docs/milestones/M3_battle_rethink.md の 10.・12.）。デバッグメニューから入る試しだけで使う。
// 数値はたたき台。1発のダメージ ≒ 威力 ×（物理は攻撃・属性は魔力）÷ 10。敵の防御はない。
// 開発者が選んだ組み方：A 回数×添える・B 範囲×添える・F 露出補正・H 砂時計・K 見切り

export const LEAP_RULES: LeapRules = {
  handSize: 5,
  weakMult: 1.5,
  reactionMult: 2,
  movingHits: 2,
  addonMax: 2,
  maxRounds: 30,
};

const m = (x: LeapMove): LeapMove => x;

/** スナップ（アルバムの札） */
export const LEAP_CARDS = {
  // A・B：回数（連続攻撃。動いている敵には2発だけ）
  burst: m({ id: 'lp_burst', name: '連写', kind: 'attack', target: 'enemy', element: 'physical', power: 20, hits: 5, short: '物理20×5回', text: '敵1体に物理20を5回。動いている敵には2回しか当たらない。止まっている敵には全部当たる' }),
  sparkler: m({ id: 'lp_sparkler', name: '線香花火', kind: 'attack', target: 'enemies', element: 'fire', power: 8, hits: 6, short: '全体に火8×6回', text: '敵全体に火8を6回ずつ。動いている敵には2回しか当たらない。止まっている敵には全部当たる' }),
  strobe: m({ id: 'lp_strobe', name: 'ストロボ', kind: 'attack', target: 'enemy', element: 'thunder', power: 12, hits: 5, short: '雷12×5回', text: '敵1体に雷12を5回。濡れた敵なら1回目でしびれて、残りも全部当たる' }),
  // 止める
  static: m({ id: 'lp_static', name: '静電気', kind: 'attack', target: 'enemy', element: 'thunder', power: 10, short: '雷10\n濡れならしびれ', text: '敵1体に雷10。濡れている敵には2倍でしびれさせる（止まる）' }),
  // 単体で戦う柱
  bigShot: m({ id: 'lp_bigShot', name: '渾身の一枚', kind: 'attack', target: 'enemy', element: 'physical', power: 80, short: '物理80', text: '敵1体に物理80' }),
  wide: m({ id: 'lp_wide', name: 'ワイドショット', kind: 'attack', target: 'enemies', element: 'physical', power: 30, short: '全体に物理30', text: '敵全体に物理30' }),
  recover: m({ id: 'lp_recover', name: 'リカバー', kind: 'heal', target: 'allies', heal: 40, short: '味方全体を回復', text: '味方全体の HP を回復する' }),
  // A・B・F：添える札（手番を使わない）
  plus10: m({ id: 'lp_plus10', name: 'アタック+10', kind: 'addon', target: 'self', addPerHit: 10, short: '添える\n1発ごと+10', text: '行動に添える（手番は使わない）。その攻撃の1発ごとに+10' }),
  plus20: m({ id: 'lp_plus20', name: 'アタック+20', kind: 'addon', target: 'self', addPerHit: 20, short: '添える\n1発ごと+20', text: '行動に添える（手番は使わない）。その攻撃の1発ごとに+20' }),
  plus30: m({ id: 'lp_plus30', name: 'アタック+30', kind: 'addon', target: 'self', addPerHit: 30, short: '添える\n1発ごと+30', text: '行動に添える（手番は使わない）。その攻撃の1発ごとに+30' }),
  exposure: m({ id: 'lp_exposure', name: '露出補正', kind: 'addon', target: 'self', exposure: 10, short: '添える\n以後ずっと+10', text: '行動に添える（手番は使わない）。この行動から後、このラウンドの味方の攻撃すべてに、1発ごとに+10。先に動く人に添えるほど伸びる' }),
  // H：砂時計
  hourglass: m({ id: 'lp_hourglass', name: '砂時計を返す', kind: 'hourglass', target: 'enemy', perSand: 30, short: '砂1粒ごと30', text: '敵1体の砂を全部使い、砂1粒につき30のダメージ。砂は、味方の攻撃が1発当たるたびに1粒たまる（ラウンドをまたいで残る）' }),
  // K：見切り
  guard: m({ id: 'lp_guard', name: '見切り', kind: 'counter', target: 'self', counter: 20, short: '受けるたび\n反撃20', text: 'このラウンドの始めから、敵の単体攻撃を自分が引き受け、1発受けるたびに物理20で反撃する。添える札は反撃の1発ごとに乗る' }),
} satisfies Record<string, LeapMove>;

const C = LEAP_CARDS;
export const LEAP_DECK: string[] = [
  C.burst, C.burst, C.sparkler, C.sparkler, C.strobe, C.static, C.static,
  C.bigShot, C.wide, C.recover,
  C.plus10, C.plus10, C.plus20, C.plus30, C.plus30, C.exposure, C.exposure,
  C.hourglass, C.hourglass, C.guard, C.guard,
].map((c) => c.id);

/** 仲間。技はいつでも使える（その仲間の役目：ハルト＝回数、みお＝止める、あかり＝倍率と回復） */
export const LEAP_ALLIES: LeapAllyDef[] = [
  {
    id: 'hero',
    name: 'ハルト',
    hp: 320,
    atk: 10,
    mag: 6,
    moves: [
      m({ id: 'slash', name: '斬る', kind: 'attack', target: 'enemy', element: 'physical', power: 40, owner: 'hero', short: '物理40', text: '敵1体に物理40' }),
      m({ id: 'flurry', name: '乱れ打ち', kind: 'attack', target: 'enemy', element: 'physical', power: 15, hits: 4, owner: 'hero', short: '物理15×4回', text: '敵1体に物理15を4回。動いている敵には2回しか当たらない' }),
    ],
  },
  {
    id: 'akari',
    name: 'あかり',
    hp: 280,
    atk: 6,
    mag: 10,
    moves: [
      m({ id: 'fire', name: 'ファイア', kind: 'attack', target: 'enemy', element: 'fire', power: 40, owner: 'akari', short: '火40', text: '敵1体に火40' }),
      m({ id: 'ice', name: 'アイス', kind: 'attack', target: 'enemy', element: 'ice', power: 35, freeze: true, owner: 'akari', short: '氷35\n凍らせる', text: '敵1体に氷35。凍らせる（凍った敵に物理を当てると2倍。氷は割れる）' }),
      m({ id: 'thunder', name: 'サンダー', kind: 'attack', target: 'enemy', element: 'thunder', power: 40, owner: 'akari', short: '雷40\n濡れならしびれ', text: '敵1体に雷40。濡れている敵には2倍でしびれさせる（止まる）' }),
      m({ id: 'song', name: 'いやしの歌', kind: 'heal', target: 'allies', heal: 50, owner: 'akari', short: '味方全体を回復', text: '味方全体の HP を回復する' }),
    ],
  },
  {
    id: 'mio',
    name: 'みお',
    hp: 260,
    atk: 8,
    mag: 8,
    moves: [
      m({ id: 'trip', name: '足払い', kind: 'attack', target: 'enemy', element: 'physical', power: 12, stagger: true, owner: 'mio', short: '物理12\nよろけさせる', text: '敵1体に物理12。よろけさせる（止まる。重い敵には効かない）' }),
      m({ id: 'balloon', name: '水風船', kind: 'wet', target: 'enemies', owner: 'mio', short: '敵全体を\n濡らす', text: '敵全体を濡らす（濡れた敵に雷を当てると2倍でしびれる）' }),
    ],
  },
];

const foe = (e: LeapEnemyDef): LeapEnemyDef => e;

export const LEAP_ENEMIES = {
  goldfish: foe({ id: 'goldfishNoise', name: '金魚ノイズ', hp: 130, atk: 10, weak: ['thunder'], pattern: [{ id: 'tail', name: '尾びれ', power: 30 }, { id: 'splash', name: '水しぶき', power: 15, all: true }] }),
  mask: foe({ id: 'maskNoise', name: 'お面ノイズ', hp: 140, atk: 10, weak: ['fire'], pattern: [{ id: 'glare', name: 'にらみ', power: 22, first: true }, { id: 'faces', name: '百面相', power: 32 }] }),
  balloon: foe({ id: 'balloonNoise', name: '水風船ノイズ', hp: 120, atk: 10, weak: ['physical'], pattern: [{ id: 'bounce', name: 'ぼよん', power: 28 }] }),
  tin: foe({ id: 'tinNoise', name: 'ブリキノイズ', hp: 170, atk: 10, weak: ['ice'], heavy: true, pattern: [{ id: 'march', name: 'ブリキの行進', power: 18, all: true }, { id: 'punch', name: 'ぜんまいパンチ', power: 40 }] }),
  phone: foe({ id: 'phoneNoise', name: '黒電話ノイズ', hp: 140, atk: 10, weak: ['fire'], pattern: [{ id: 'ring', name: 'じりりりん', power: 8, hits: 4 }, { id: 'call', name: '長電話', power: 30 }] }),
  menko: foe({ id: 'menkoNoise', name: 'めんこノイズ', hp: 150, atk: 10, weak: ['physical'], pattern: [{ id: 'slap', name: 'めんこ打ち', power: 30, first: true }] }),
  lord: foe({ id: 'goldfishBowlLord', name: '金魚鉢のぬし', hp: 1800, atk: 14, weak: [], heavy: true, pattern: [
    { id: 'rapid', name: '乱れ水鉄砲', power: 12, hits: 6, first: true },
    { id: 'ram', name: '体当たり', power: 45 },
    { id: 'wave', name: '大波', power: 55, all: true },
  ] }),
} satisfies Record<string, LeapEnemyDef>;

const E = LEAP_ENEMIES;
const CARDS: Record<string, LeapMove> = Object.fromEntries(Object.values(LEAP_CARDS).map((c) => [c.id, c]));
const battle = (id: string, name: string, enemies: LeapEnemyDef[]): LeapBattleDef => ({ id, name, allies: LEAP_ALLIES, enemies, cards: CARDS, deck: LEAP_DECK });

/** 試しの戦闘：雑魚2つ（単体の札で1〜2ラウンド。そろえば一掃）と、ボス1体（重く、弱点なし。濡らして雷で止める） */
export const LEAP_TRIALS: LeapBattleDef[] = [
  battle('leap1', '縁日の砂嵐（雑魚）', [E.goldfish, E.mask, E.balloon]),
  battle('leap2', '商店街の砂嵐（雑魚）', [E.tin, E.phone, E.menko]),
  battle('leap3', '金魚鉢のぬし（ボス）', [E.lord]),
];
