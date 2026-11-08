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
  burnDamage: 16,
  stackRate: 0.5,
  weakenRate: 0.5,
  drainRate: 0.3,
  sealPower: 20,
  sealBig: 40,
  leaderRate: 1.3,
  shutterRate: 0.4,
  openingMult: 3,
  addonMax: 2,
  splitHits: 4,
  hardCut: 25,
  pinpointMult: 1.5,
  // 警戒（段階162 調整6）：ダウンから起きた敵は、ダウンの回数のラウンド（3まで）ダウンしない
  guardMax: 3,
};

const card = (m: ChainMove): ChainMove => m;

/**
 * 札。型：フォーカス（次の1回）・フィルター（数ラウンド続く）・ショット（攻撃）・フィニッシュ（締め）。専用の札は、その仲間しか使えない。
 * 調整7で、色の印と共鳴をやめ、フォーカス3つとフィルター7つにした（開発者と決めた）。調整8で、名前を写真とフィルムの言葉にそろえた（開発者の「文言がダサい」）
 */
export const CHAIN_CARDS = {
  // フォーカス：敵に合わせておき、次に当たった攻撃で使い切る
  target: card({ id: 'ch_target', name: 'パノラマ', type: 'trick', weight: 1, target: 'enemy', effect: { kind: 'trick', trick: 'spread' }, text: '対象の敵に「パノラマ」を付与する。次にこの敵が攻撃を受けた時、同じダメージを他の敵全体にも与える（広がった先はダウンしない）' }),
  expose: card({ id: 'ch_expose', name: 'ハイライト', type: 'trick', weight: 1, target: 'enemy', effect: { kind: 'trick', trick: 'expose' }, text: '対象の敵に「ハイライト」を付与する。次にこの敵が受ける攻撃は、属性に関係なく弱点扱いになる（ダウンする）' }),
  rattle: card({ id: 'ch_rattle', name: 'ピンポイント', type: 'trick', weight: 1, target: 'enemy', effect: { kind: 'trick', trick: 'opening', element: 'physical', power: 4 }, text: '敵1体に物理の小ダメージを与え、「ピンポイント」を付与する。次にこの敵が受けるフィニッシュの威力が3倍' }),
  // フィルター：数ラウンド続く（1体に1つ。新しく付けると上書き）
  chill: card({ id: 'ch_chill', name: 'スロー', type: 'status', weight: 1, target: 'enemy', effect: { kind: 'status', status: 'slow', rounds: 2 }, text: '敵1体を2ラウンドの間「スロー」にする。敵の行動が1マス遅れる' }),
  ember: card({ id: 'ch_ember', name: 'ヒート', type: 'status', weight: 1, target: 'enemy', effect: { kind: 'status', status: 'burn', rounds: 3, element: 'fire', power: 4 }, text: '敵1体に火の小ダメージを与え、3ラウンドの間「ヒート」にする。ラウンド終了時にダメージを与える' }),
  notch: card({ id: 'ch_notch', name: 'クラック', type: 'status', weight: 1, target: 'enemy', effect: { kind: 'status', status: 'stack', rounds: 1 }, text: '敵1体に、このラウンドの間「クラック」を付与する。攻撃を受けるたびに、被ダメージが50%ずつ増える（2回目1.5倍、3回目2倍…）' }),
  wilt: card({ id: 'ch_wilt', name: 'ピンぼけ', type: 'status', weight: 1, target: 'enemy', effect: { kind: 'status', status: 'weak', rounds: 2 }, text: '敵1体を2ラウンドの間「ピンぼけ」にする。敵の攻撃のダメージが半減する' }),
  seal: card({ id: 'ch_seal', name: 'ポーズ', type: 'status', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'seal', rounds: 2 }, text: '敵1体を2ラウンドの間「ポーズ」にする。敵の全体攻撃と大技を封じ、通常攻撃にする' }),
  dazzle: card({ id: 'ch_dazzle', name: 'ハレーション', type: 'status', weight: 2, target: 'enemy', effect: { kind: 'status', status: 'confuse', rounds: 1 }, text: '敵1体を1ラウンドの間「ハレーション」（混乱）にする。敵の単体攻撃が、他の敵に向かう' }),
  leech: card({ id: 'ch_leech', name: 'リワインド', type: 'status', weight: 1, target: 'enemy', effect: { kind: 'status', status: 'drain', rounds: 3 }, text: '敵1体に3ラウンドの間「リワインド」を付与する。この敵を攻撃した味方は、与えたダメージの30%のHPを回復する' }),
  imprint: card({ id: 'ch_imprint', name: '焼き付け', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 8, perMark: 40 }, text: '敵1体に物理ダメージ。敵に付与されている効果1つにつき、威力が上がる' }),
  wideShot: card({ id: 'ch_wideShot', name: 'ワイドショット', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 10 }, text: '敵全体に物理ダメージ' }),
  // 調整14：シンプルなアタック（序盤の主役。技を覚える前は、これで戦う）
  quickShot: card({ id: 'ch_quickShot', name: '速写', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 6, push: 2 }, text: '敵1体に物理の小ダメージ。当てた敵の行動を2マス遅らせる' }),
  closeUp: card({ id: 'ch_closeUp', name: 'クローズアップ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 13 }, text: '敵1体に物理ダメージ' }),
  longExpo: card({ id: 'ch_longExpo', name: '長時間露光', type: 'attack', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 28 }, text: '敵1体に物理の大ダメージ' }),
  flash: card({ id: 'ch_flash', name: 'フラッシュ', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'thunder', power: 8 }, text: '敵全体に雷ダメージ' }),
  // 調整13：汎用のアタックを増やした（属性3つ・並べる順で変わる2つ・直前の味方を受ける2つ・かばうを抜く1つ）
  backlight: card({ id: 'ch_backlight', name: '逆光', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 14 }, text: '敵1体に火ダメージ' }),
  blueHour: card({ id: 'ch_blueHour', name: 'ブルーアワー', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 14 }, text: '敵1体に氷ダメージ' }),
  strobe: card({ id: 'ch_strobe', name: 'ストロボ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 14 }, text: '敵1体に雷ダメージ' }),
  burst: card({ id: 'ch_burst', name: '連写', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 6, hitsPerActed: true }, text: '敵1体に物理ダメージを1回与える。このラウンドに先に行動した味方1人につき、攻撃回数+1' }),
  firstCut: card({ id: 'ch_firstCut', name: 'ファーストカット', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 18, perActed: -6 }, text: '敵1体に物理ダメージ。このラウンドに先に行動した味方1人につき、威力が下がる（最初に使うと最大）' }),
  multiExpo: card({ id: 'ch_multiExpo', name: '多重露光', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'layer', power: 10, mult: 1, weakMult: 2 }, text: '敵1体に、直前に行動した味方の攻撃と同じ属性でダメージ（攻撃でなければ物理）。直前の攻撃が弱点を突いていれば威力2倍' }),
  panning: card({ id: 'ch_panning', name: '流し撮り', type: 'attack', weight: 2, target: 'enemies', effect: { kind: 'wind', rate: 0.5, weakRate: 1 }, text: '直前に行動した味方の攻撃を、威力50%で敵全体にもう一度与える。直前の攻撃が弱点を突いていれば威力100%。直前が攻撃でなければ不発' }),
  zoomIn: card({ id: 'ch_zoomIn', name: 'ズームイン', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12, pierce: true }, text: '敵1体に物理ダメージ。「かばう」に防がれず、選んだ敵に当たる' }),
  decisive: card({ id: 'ch_decisive', name: '決めの一枚', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12, downMult: 4 }, text: '敵1体に物理ダメージ。ダウン中の敵には威力4倍' }),
  // 専用の札（その仲間しか使えない。組む2人の札がそろうと連携技）
  swing: card({ id: 'ch_swing', name: '全力スイング', type: 'attack', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 31 }, text: 'ハルト専用。敵1体に物理の大ダメージ', owner: 'hero' }),
  sparkler: card({ id: 'ch_sparkler', name: '線香花火', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 11 }, text: 'あかり専用。敵全体に火ダメージ', owner: 'akari' }),
  waterBalloon: card({ id: 'ch_waterBalloon', name: '水風船', type: 'status', weight: 2, target: 'enemies', effect: { kind: 'status', status: 'slow', rounds: 1, element: 'ice', power: 5 }, text: 'みお専用。敵全体に氷の小ダメージを与え、1ラウンドの間「スロー」にする', owner: 'mio' }),
} satisfies Record<string, ChainMove>;

/** 札の絵（近い情景の今のスナップの絵を、仮に使う） */
export const CHAIN_CARD_ART: Record<string, string> = {
  ch_target: 'snap.search',
  ch_expose: 'snap.joker',
  ch_rattle: 'snap.breakArm',
  ch_chill: 'snap.iceChip',
  ch_ember: 'snap.fireChip',
  ch_notch: 'snap.sword',
  ch_wilt: 'snap.recover',
  ch_seal: 'snap.encore',
  ch_dazzle: 'snap.thunderChip',
  ch_leech: 'snap.draw',
  ch_wideShot: 'snap.wideShot',
  ch_imprint: 'snap.heavyBlow',
  ch_decisive: 'snap.breakArm',
  ch_quickShot: 'snap.quickStep',
  ch_closeUp: 'snap.sword',
  ch_longExpo: 'snap.heavyBlow',
  ch_flash: 'snap.thunderChip',
  ch_backlight: 'snap.fireChip',
  ch_blueHour: 'snap.iceChip',
  ch_strobe: 'snap.thunderChip',
  ch_burst: 'snap.quickStep',
  ch_firstCut: 'snap.sword',
  ch_multiExpo: 'snap.joker',
  ch_panning: 'snap.wideShot',
  ch_zoomIn: 'snap.search',
  ch_swing: 'snap.pinchHitter',
  ch_sparkler: 'snap.fireChip',
  ch_waterBalloon: 'snap.recover',
};

/** 札・技の上に書く、短い効果（調整10。札の幅に2行まで。くわしくは長押し。調整11でカードゲームでよくある言い回しに） */
export const CHAIN_SHORT_TEXT: Record<string, string> = {
  ch_target: '次の攻撃を\n敵全体に拡散',
  ch_expose: '次の攻撃が\n弱点扱いに',
  ch_rattle: 'フィニッシュ\n威力3倍',
  ch_chill: '敵の行動が\n1マス遅れる',
  ch_ember: 'ラウンド終了\n時にダメージ',
  ch_notch: 'このラウンド\n被ダメ+50%ずつ',
  ch_wilt: '敵の攻撃\nダメージ半減',
  ch_seal: '大技・全体\n攻撃を封じる',
  ch_dazzle: '混乱させて\n同士討ちに',
  ch_leech: '与ダメージ\nの30%回復',
  ch_imprint: '付与効果1つ\nごとに威力↑',
  ch_wideShot: '敵全体に\n物理ダメージ',
  ch_decisive: 'ダウン中の敵\nに威力4倍',
  ch_quickShot: '物理小ダメージ\n行動2マス遅延',
  ch_closeUp: '敵1体に\n物理ダメージ',
  ch_longExpo: '敵1体に\n物理大ダメージ',
  ch_flash: '敵全体に\n雷ダメージ',
  basic: '敵1体に\n物理ダメージ',
  ch_backlight: '敵1体に\n火ダメージ',
  ch_blueHour: '敵1体に\n氷ダメージ',
  ch_strobe: '敵1体に\n雷ダメージ',
  ch_burst: '後に動くほど\n連続ヒット',
  ch_firstCut: '先に動くほど\n威力アップ',
  ch_multiExpo: '直前の攻撃と同属性\n弱点なら2倍',
  ch_panning: '直前の攻撃を\n敵全体に再び',
  ch_zoomIn: '「かばう」を\n無視して攻撃',
  ch_swing: '敵1体に\n物理大ダメージ',
  ch_sparkler: '敵全体に\n火ダメージ',
  ch_waterBalloon: '敵全体に氷\n＋スロー',
  quick: '物理小ダメージ\n行動2マス遅延',
  slash: '敵1体に\n物理ダメージ',
  finisher: '物理大ダメージ\nダウン中4倍',
  spark: '火の小ダメージ\n行動2マス遅延',
  fire: '敵1体に\n火ダメージ',
  ice: '敵1体に\n氷ダメージ',
  heal: '味方全体の\nHPを回復',
  kick: '物理小ダメージ\n行動2マス遅延',
  zap: '雷の小ダメージ\n行動2マス遅延',
  thunder: '敵1体に\n雷ダメージ',
};

/** 仲間の技と連携技の絵（フィルムの帯に並べる。調整9） */
export const CHAIN_MOVE_ART: Record<string, string> = {
  basic: 'snap.sword',
  quick: 'snap.quickStep',
  slash: 'snap.sword',
  finisher: 'snap.heavyBlow',
  spark: 'snap.fireChip',
  fire: 'snap.fireChip',
  ice: 'snap.iceChip',
  heal: 'snap.recover',
  kick: 'snap.quickStep',
  zap: 'snap.thunderChip',
  thunder: 'snap.thunderChip',
  afterglow: 'snap.fireChip',
  crossDrive: 'snap.sword',
  shower: 'snap.thunderChip',
};

/** 組み合わせごとの背景（調整9。今の戦闘と同じく、その時代の場所の絵を暗くして敷く） */
export const CHAIN_TRIAL_BG: Record<string, string> = {
  chain1: 'bg.goldfish_stall',
  chain2: 'bg.clock_shop',
  chain3: 'bg.village_dusk',
  chain4: 'bg.showa_street',
  chain5: 'bg.riverside_1998',
  chain6: 'bg.school_festival',
  chain7: 'bg.music_shop',
  chain8: 'bg.goldfish_stall',
};

const move = (m: ChainMove): ChainMove => m;

/** 通常攻撃（調整14。技を覚えていなくても、いつでも使える。手札に使える札がない時の受け皿） */
export const CHAIN_BASIC: ChainMove = { id: 'basic', name: '通常攻撃', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 10 }, text: '敵1体に物理ダメージ（いつでも使える）' };

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
      CHAIN_BASIC,
      move({ id: 'quick', name: 'すばやく', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 6, push: 2 }, text: '敵1体に物理の小ダメージ。当てた敵の行動を2マス遅らせる' }),
      move({ id: 'slash', name: '斬る', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 13 }, text: '敵1体に物理ダメージ' }),
      move({ id: 'finisher', name: 'とどめの一閃', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 24, downMult: 4 }, text: '敵1体に物理の大ダメージ。ダウン中の敵には威力4倍' }),
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
      CHAIN_BASIC,
      move({ id: 'spark', name: '火花', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 5, push: 2 }, text: '敵1体に火の小ダメージ。当てた敵の行動を2マス遅らせる' }),
      move({ id: 'fire', name: 'ファイア', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 18 }, text: '敵1体に火ダメージ' }),
      move({ id: 'ice', name: 'アイス', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 18 }, text: '敵1体に氷ダメージ' }),
      move({ id: 'heal', name: 'いやしの歌', type: 'support', weight: 3, target: 'allies', effect: { kind: 'heal', power: 30 }, text: '味方全体のHPを回復する' }),
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
      CHAIN_BASIC,
      move({ id: 'kick', name: 'けとばし', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 6, push: 2 }, text: '敵1体に物理の小ダメージ。当てた敵の行動を2マス遅らせる' }),
      move({ id: 'zap', name: '静電気', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 5, push: 2 }, text: '敵1体に雷の小ダメージ。当てた敵の行動を2マス遅らせる' }),
      move({ id: 'thunder', name: 'サンダー', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 18 }, text: '敵1体に雷ダメージ' }),
    ],
  },
];


/** 序盤の仲間（調整14。技をまだ覚えていない。通常攻撃だけ） */
export const CHAIN_ALLIES_EARLY: ChainAllyDef[] = CHAIN_ALLIES.map((a) => ({ ...a, moves: [CHAIN_BASIC] }));

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
  // 調整12：計画を揺さぶる特徴の敵
  phone: foe({ id: 'phoneNoise', name: '黒電話ノイズ', hp: 140, atk: 12, def: 9, weak: ['ice'], resist: ['thunder'], trait: 'interrupt', pattern: [
    { id: 'ring', name: 'じりりりん', at: 6, element: 'physical', power: 26 },
    { id: 'longCall', name: '長電話', at: 7, all: true, element: 'thunder', power: 16 },
  ] }),
  mask: foe({ id: 'maskNoise', name: 'お面ノイズ', hp: 130, atk: 12, def: 8, weak: ['fire'], resist: [], trait: 'veil', pattern: [
    { id: 'glare', name: 'にらみつけ', at: 3, element: 'physical', power: 26 },
    { id: 'faces', name: '百面相', at: 5, all: true, element: 'physical', power: 18 },
  ] }),
  phonograph: foe({ id: 'phonographNoise', name: '蓄音機ノイズ', hp: 170, atk: 12, def: 9, weak: ['thunder'], resist: ['ice'], trait: 'rewind', pattern: [
    { id: 'static', name: '雑音', at: 5, all: true, element: 'thunder', power: 16 },
    { id: 'record', name: 'レコード投げ', at: 7, element: 'physical', power: 30 },
  ] }),
  pinwheel: foe({ id: 'pinwheelNoise', name: '風車ノイズ', hp: 140, atk: 11, def: 8, weak: ['fire'], resist: [], trait: 'shift', weakCycle: ['fire', 'ice', 'thunder'], pattern: [
    { id: 'gust', name: '風起こし', at: 4, all: true, element: 'physical', power: 16 },
    { id: 'spinBlade', name: 'くるくる', at: 6, element: 'physical', power: 28 },
  ] }),
  megaphone: foe({ id: 'megaphoneNoise', name: 'メガホンノイズ', hp: 260, atk: 11, def: 11, weak: ['ice'], resist: ['physical'], trait: 'leader', pattern: [
    { id: 'order', name: '号令', at: 2, element: 'physical', power: 12 },
    { id: 'shout', name: 'がなり声', at: 7, all: true, element: 'thunder', power: 20 },
  ] }),
} satisfies Record<string, ChainEnemyDef>;

/** 特徴の名前と説明（画面に出す） */
export const CHAIN_TRAIT_TEXT: Record<string, { name: string; text: string }> = {
  // 調整12：よくあるゲームの言葉に付け直した（開発者と決めた）
  pop: { name: 'ダウン時爆発', text: '弱点を突かれてダウンすると爆発し、味方全体にダメージを与える' },
  swift: { name: '2回行動', text: '1ラウンドに2回行動する。1回目の前にダウンさせると、2回とも止まる' },
  shield: { name: 'かばう', text: 'ほかの敵への単体攻撃を、代わりに受ける。ダウン中はかばえない。全体攻撃はかばえない' },
  shell: { name: 'バリア', text: '最初に受けた攻撃を1回だけ無効にする。軽い攻撃で先に割ってから本命を' },
  sticky: { name: '足止め', text: '攻撃を受けると、まだ行動していない味方の行動を2マス遅らせる' },
  waker: { name: 'ダウン解除', text: '行動すると、ダウン中の仲間を起こす' },
  counter: { name: 'カウンター', text: 'ダウンしていない時に攻撃を受けると、反撃する' },
  split: { name: '分裂', text: '倒すと、小さな2体に分かれる' },
  timer: { name: '自爆', text: 'ラウンド終了ごとに数字が減り、0になると自爆して味方全体に大ダメージを与える' },
  flee: { name: '逃げ足', text: '「逃げる」の予定の時刻になると、戦闘からいなくなる' },
  interrupt: { name: '割り込み', text: '単体攻撃で狙われると、その攻撃の前に自分の行動を1つ割り込ませる' },
  veil: { name: '予定隠し', text: 'ラウンドの始めは行動の予定が見えない。攻撃を当てると見える' },
  rewind: { name: '巻き戻し', text: 'ラウンド終了時、そのラウンドに受けたダメージを回復する。ダウン中は回復しない' },
  shift: { name: '属性チェンジ', text: 'ラウンドごとに弱点が変わる（今の弱点は見えている）' },
  leader: { name: 'リーダー', text: '生きている間、ほかの敵の攻撃が強くなる。倒すと、ほかの敵が動揺してダウンする' },
};

/**
 * 山札の組み方（調整13。本番を想定した枚数比率。調整14で、序盤と中盤の2つに）。
 * 中盤：アルバム20枚＝アタック10（シンプル7・効果つき3）・サポート6（フォーカス3つと、その区画のフィルター3つ）・フィニッシュ4。
 *   スペシャル（専用の札）はアルバムの外で、連れていく仲間1人につき2枚ずつ、自動で山札に入る（仲間を替えると山札も変わる）
 * 序盤：技を覚える前。アルバム20枚＝アタック14（シンプルだけ）・サポート4・フィニッシュ2。スペシャルと連携技はまだない
 */
/** 時期（調整14）。multi は中盤と同じ山札で、1人1回をやめた試し（調整16） */
export type ChainStage = 'early' | 'mid' | 'multi';
export const CHAIN_DECK_PLAN = {
  mid: { album: 20, attack: 10, effectAttack: 3, support: 6, finish: 4, specialPerAlly: 2 },
  early: { album: 20, attack: 14, effectAttack: 0, support: 4, finish: 2, specialPerAlly: 0 },
} as const;
const C = CHAIN_CARDS;
const ids = (cs: ChainMove[]) => cs.map((c) => c.id);
const MID_SIMPLE = ids([C.closeUp, C.backlight, C.blueHour, C.strobe, C.wideShot, C.flash, C.longExpo]);
const MID_FINISH = ids([C.imprint, C.imprint, C.decisive, C.decisive]);
const FOCUS = ids([C.target, C.expose, C.rattle]);
const EARLY_ATTACK = ids([C.quickShot, C.quickShot, C.quickShot, C.closeUp, C.closeUp, C.closeUp, C.backlight, C.backlight, C.blueHour, C.blueHour, C.strobe, C.strobe, C.wideShot, C.longExpo]);
const EARLY_FINISH = ids([C.decisive, C.decisive]);
/** フィルター（状態）の札。1つの区画で使うのは3つまで（M3_battle_review.md の 12. 調整7） */
type FilterKey = 'chill' | 'ember' | 'notch' | 'wilt' | 'seal' | 'dazzle' | 'leech';
/** 効果つきのアタック。1つの区画で使うのは3つまで（調整14。本編では章ごとに増やす） */
type EffectKey = 'burst' | 'firstCut' | 'multiExpo' | 'panning' | 'zoomIn';
/** 仲間ごとの専用の札（2枚ずつ） */
export const CHAIN_SPECIALS: Record<string, string[]> = {
  hero: [C.swing.id, C.swing.id],
  akari: [C.sparkler.id, C.sparkler.id],
  mio: [C.waterBalloon.id, C.waterBalloon.id],
};

/** 中盤の山札（アルバム20枚 ＋ 連れていく仲間のスペシャル） */
export function chainDeck(filters: FilterKey[], effects: EffectKey[], allies: ChainAllyDef[] = CHAIN_ALLIES): string[] {
  const album = [...MID_SIMPLE, ...effects.map((k) => C[k].id), ...FOCUS, ...filters.map((k) => C[k].id), ...MID_FINISH];
  return [...album, ...allies.flatMap((a) => CHAIN_SPECIALS[a.id] ?? [])];
}

/** 序盤の山札（シンプルなアタック中心。フォーカスはパノラマ・ハイライト、フィルターは区画の始めの2つ） */
export function chainDeckEarly(filters: FilterKey[]): string[] {
  return [...EARLY_ATTACK, C.target.id, C.expose.id, ...filters.slice(0, 2).map((k) => C[k].id), ...EARLY_FINISH];
}

const CARDS: Record<string, ChainMove> = Object.fromEntries(Object.values(CHAIN_CARDS).map((c) => [c.id, c]));

/** 序盤の敵（調整16。札と技の単体の威力を約6割に下げたので、組み合わせの札がない序盤は、敵の HP も6割にする。本番でも序盤の敵は弱い前提） */
const EARLY_HP_RATE = 0.6;
function earlyFoe(e: ChainEnemyDef): ChainEnemyDef {
  return { ...e, hp: Math.round(e.hp * EARLY_HP_RATE), splitInto: e.splitInto ? earlyFoe(e.splitInto) : undefined };
}

/** 序盤の組み合わせ（同じ id。中盤を作る時に一緒に作る） */
const EARLY: ChainBattleDef[] = [];
/** 序盤は1戦が長くなるので、評価の目安の時刻を延ばす。調整15：シャッターが総攻撃になり決着が2ラウンド目にずれたので、中盤の目安を 8・16 → 13・18 に（★3 約3割・★2 約5割） */
const EARLY_GRADE_RATE = 1.7;

function battle(id: string, name: string, enemies: ChainEnemyDef[], variants: ChainVariant[], filters: FilterKey[], effects: EffectKey[], gradeAt = { high: 13, mid: 18 }): ChainBattleDef {
  EARLY.push({ id, name, allies: CHAIN_ALLIES_EARLY, enemies: enemies.map(earlyFoe), deck: chainDeckEarly(filters), cards: CARDS, links: [], variants, gradeAt: { high: Math.round(gradeAt.high * EARLY_GRADE_RATE), mid: Math.round(gradeAt.mid * EARLY_GRADE_RATE) } });
  return { id, name, allies: CHAIN_ALLIES, enemies, deck: chainDeck(filters, effects), cards: CARDS, links: CHAIN_LINKS, variants, gradeAt };
}

const E = CHAIN_ENEMIES;
/** 敵の癖の何番目かの行動 */
const mv = (e: ChainEnemyDef, i: number): ChainEnemyMove => e.pattern[i];

/** 早くて痛い大技（調整6。止めないと仲間が大きく削られる。型の中に混ぜる） */
export const CHAIN_BIG = {
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
  bigShout: { id: 'bigShout', name: '大号令', at: 3, all: true, element: 'thunder', power: 36 },
  gale: { id: 'gale', name: '大つむじ', at: 2, all: true, element: 'physical', power: 32 },
  earlyRing: { id: 'earlyRing', name: '非常ベル', at: 3, all: true, element: 'thunder', power: 34 },
  loudRecord: { id: 'loudRecord', name: '大音量', at: 3, all: true, element: 'thunder', power: 38 },
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
  chain6: { low: '素材「紙のお面」', mid: 'レア素材「祭りの法被」', high: '固有のスナップ「大号令」（メガホンノイズ）' },
  chain7: { low: '素材「古い電線」', mid: 'レア素材「SPレコード」', high: '固有のスナップ「Ａ面Ｂ面」（蓄音機ノイズ）' },
  chain8: { low: 'レア素材「金魚鉢のかけら」', mid: 'レア素材「ぬしの金魚」', high: '固有のスナップ「大波」（金魚鉢のぬし）' },
};

/**
 * 試しの組み合わせ（調整4。ロックマンエグゼのウイルスの編成のように、名前の付いた決まった組み合わせ）。
 * 調整6：組み合わせごとに3つの型があり、戦闘ごとに1つを選ぶ（同じ顔ぶれでも、予定の並びが違う）。型の中には、早くて痛い大技がある
 */
export const CHAIN_TRIALS_16: ChainBattleDef[] = [
  // 盾2体が、逃げる金魚を守る。単体の攻撃は盾に吸われる
  battle('chain1', '金魚すくいの屋台（かばう・かばう・逃げ足）', [E.table, E.goldfish, E.table], [
    variant('v1', '客寄せ', [undefined, undefined, [mv(E.table, 1), mv(E.table, 0)]]),
    variant('v2', '店じまい', [[CHAIN_BIG.bigFlip, mv(E.table, 1)], undefined, undefined]),
    variant('v3', '逃げ足', [undefined, [CHAIN_BIG.earlyEscape], [mv(E.table, 1), mv(E.table, 0)]]),
  ], ['chill', 'dazzle', 'seal'], ['zoomIn', 'burst', 'panning']),
  // 起こし役がダウンした仲間を起こす。殻のブリキは1回目が効かず、ヨーヨーは2回動く
  battle('chain2', 'からくり時計（ダウン解除・バリア・2回行動）', [E.tin, E.cuckoo, E.yoyo], [
    variant('v1', 'ねじ巻き', [undefined, undefined, undefined]),
    variant('v2', '早鐘', [undefined, [CHAIN_BIG.earlyChime, mv(E.cuckoo, 1)], undefined]),
    variant('v3', '全開', [[CHAIN_BIG.fullSpring, mv(E.tin, 0)], undefined, [CHAIN_BIG.whirl, mv(E.yoyo, 0)]]),
  ], ['chill', 'notch', 'wilt'], ['firstCut', 'multiExpo', 'burst']),
  // 盾のちゃぶ台が、時限の蚊取り線香を守る。叩くとやり返すめんこもいる
  battle('chain3', '夏の縁側（カウンター・自爆・かばう）', [E.menko, E.coil, E.table], [
    variant('v1', '夕涼み', [undefined, undefined, undefined]),
    variant('v2', '乱れ打ち', [[CHAIN_BIG.menkoStorm, mv(E.menko, 0)], undefined, undefined]),
    variant('v3', '煙幕', [undefined, [CHAIN_BIG.thickSmoke, mv(E.coil, 0)], [mv(E.table, 1), mv(E.table, 0)]]),
  ], ['ember', 'seal', 'leech'], ['zoomIn', 'firstCut', 'multiExpo']),
  // 飴細工を叩くと、後の仲間が遅れ、すばやいヨーヨー2体の2回目が先に来る
  battle('chain4', '駄菓子屋の店先（2回行動・足止め・2回行動）', [E.yoyo, E.candy, E.yoyo], [
    variant('v1', '店番', [undefined, undefined, [mv(E.yoyo, 1), mv(E.yoyo, 0)]]),
    variant('v2', '飴の雨', [undefined, [CHAIN_BIG.candyRain, mv(E.candy, 0)], undefined]),
    variant('v3', 'つむじ', [[CHAIN_BIG.whirl, mv(E.yoyo, 0)], undefined, [mv(E.yoyo, 1), CHAIN_BIG.whirl]]),
  ], ['chill', 'wilt', 'dazzle'], ['burst', 'panning', 'firstCut']),
  // 水風船2体は倒すと4体に増える。ラムネを弱点でダウンさせると破片が飛ぶ
  battle('chain5', '水遊び（分裂・ダウン時爆発・分裂）', [E.balloon, E.ramune, E.balloon], [
    variant('v1', '水まき', [undefined, undefined, undefined]),
    variant('v2', '大しぶき', [[CHAIN_BIG.bigSplash, mv(E.balloon, 0)], undefined, undefined]),
    variant('v3', '連射', [undefined, [CHAIN_BIG.rapid, mv(E.ramune, 0)], undefined]),
  ], ['ember', 'seal', 'leech'], ['panning', 'multiExpo', 'firstCut']),
  // 調整12：リーダーのメガホンが生きている間、ほかの敵が強い。お面は予定が隠れ、風車は弱点が変わる
  battle('chain6', '夏祭りの本部テント（リーダー・予定隠し・属性チェンジ）', [E.mask, E.megaphone, E.pinwheel], [
    variant('v1', '開会', [undefined, undefined, undefined]),
    variant('v2', '号令', [undefined, [CHAIN_BIG.bigShout, mv(E.megaphone, 0)], undefined]),
    variant('v3', '仮面行列', [[mv(E.mask, 1), mv(E.mask, 0)], undefined, [CHAIN_BIG.gale, mv(E.pinwheel, 0)]]),
  ], ['seal', 'notch', 'dazzle'], ['multiExpo', 'burst', 'panning']),
  // 調整12：黒電話は狙うと先に鳴る。蓄音機はダウンさせずに終わると傷が戻る。ブリキのバリアも
  battle('chain7', '古い電器屋の奥（割り込み・巻き戻し・バリア）', [E.phone, E.phonograph, E.tin], [
    variant('v1', '閉店前', [undefined, undefined, undefined]),
    variant('v2', '呼び出し', [[CHAIN_BIG.earlyRing, mv(E.phone, 1)], undefined, undefined]),
    variant('v3', 'Ａ面Ｂ面', [undefined, [CHAIN_BIG.loudRecord, mv(E.phonograph, 0)], [mv(E.tin, 1), mv(E.tin, 0)]]),
  ], ['ember', 'notch', 'wilt'], ['firstCut', 'burst', 'multiExpo']),
];

/** 序盤の試し（調整14。技を覚える前：仲間は通常攻撃だけ、山札はシンプルなアタック中心） */
export const CHAIN_TRIALS_EARLY: ChainBattleDef[] = EARLY;

/** 調整16までの、1人1回をやめた試し（調整16。中盤と同じ山札で、時間の予算が許す限り同じ仲間が何回でも動ける。同じ技は1ラウンドに1回まで） */
export const CHAIN_TRIALS_MULTI_16: ChainBattleDef[] = CHAIN_TRIALS_16.map((d) => ({ ...d, multiAct: true }));
