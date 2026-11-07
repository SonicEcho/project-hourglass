import type { ChainAllyDef, ChainBattleDef, ChainEnemyDef, ChainEnemyMove, ChainLinkDef, ChainMove } from '../core/chain';
import { CHAIN_ENEMIES, CHAIN_TRIALS_16, CHAIN_TRIALS_EARLY, type ChainStage } from './chainTrial';

// 試し：並べてつなぐ戦闘の調整17（docs/milestones/M3_battle_rethink.md の 14.）。
// 組んで跳ねる戦闘（段階157）の「跳ねる」要素を入れた：サポートは重さ0で行動に添える（2枚まで）・連続攻撃はいつでも全段・
// 邪魔されなければ強いアタック・フィニッシュはラウンドの最後の行動だけ（当てた回数などで伸びる。添えられない）・コンボ（P.A.）・シャッターなし。
// ダメージ ≒ 威力 ×（物理は攻撃・属性は魔力）÷ 敵の防御。仲間の攻撃・魔力と敵の防御を10前後にそろえ、威力 ≒ ダメージにした

const m = (x: ChainMove): ChainMove => x;

/** 札（スナップ）。名前は仮 */
export const CHAIN17_CARDS = {
  // アタック
  quick: m({ id: 'c17_quick', name: '速写', type: 'attack', weight: 1, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20 }, text: '敵1体に物理20' }),
  closeUp: m({ id: 'c17_closeUp', name: 'クローズアップ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40 }, text: '敵1体に物理40' }),
  backlight: m({ id: 'c17_backlight', name: '逆光', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'fire', power: 35 }, text: '敵1体に火35（弱点ならダウン）' }),
  blueHour: m({ id: 'c17_blueHour', name: 'ブルーアワー', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 35 }, text: '敵1体に氷35（弱点ならダウン）' }),
  strobe: m({ id: 'c17_strobe', name: 'ストロボ', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 35 }, text: '敵1体に雷35（弱点ならダウン）' }),
  flash: m({ id: 'c17_flash', name: 'フラッシュ', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'thunder', power: 20 }, text: '敵全体に雷20（弱点ならダウン）' }),
  burst: m({ id: 'c17_burst', name: '連写', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12, hits: 5, unsplittable: true }, text: '敵1体に物理12を5回（分けられない）' }),
  sparkler: m({ id: 'c17_sparkler', name: '線香花火', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 6, hits: 5, unsplittable: true }, text: '敵全体に火6を5回ずつ（分けられない）' }),
  wide: m({ id: 'c17_wide', name: 'ワイドショット', type: 'attack', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 25 }, text: '敵全体に物理25' }),
  bigShot: m({ id: 'c17_bigShot', name: '渾身の一枚', type: 'attack', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 100, unsplittable: true, heavy: true }, text: '敵1体に物理100（分けられない）。かたい敵に1.5倍で、バリアも1発で割る' }),
  longTake: m({ id: 'c17_longTake', name: '長回し', type: 'attack', weight: 5, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 150, fragile: true }, text: '敵1体に物理150。動き始めてから効くまでの間（帯の幅の中）に敵が動くと不発（札は手札に戻る）' }),
  zoom: m({ id: 'c17_zoom', name: 'ズームイン', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, pierce: true }, text: '敵1体に物理30。「かばう」に防がれない' }),
  firstCut: m({ id: 'c17_firstCut', name: 'ファーストカット', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 30, firstMult: 2 }, text: '敵1体に物理30。ラウンドで最初に動くと2倍' }),
  // サポート（重さ0。行動に添える）
  plus10: m({ id: 'c17_plus10', name: 'アタック+10', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', add: 10 }, text: '攻撃に添える。1発ごとに威力+10' }),
  plus20: m({ id: 'c17_plus20', name: 'アタック+20', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', add: 20 }, text: '攻撃に添える。1発ごとに威力+20' }),
  plus30: m({ id: 'c17_plus30', name: 'アタック+30', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', add: 30 }, text: '攻撃に添える。1発ごとに威力+30' }),
  split: m({ id: 'c17_split', name: '複数攻撃化', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', split: true }, text: '単発の攻撃に添える。威力を4つに分けて4回当てる（総ダメージは同じ。1発ごとに効く物と重ねると伸びる）' }),
  exposure: m({ id: 'c17_exposure', name: '露出補正', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', exposure: 10 }, text: '行動に添える。この行動から後、このラウンドの味方の攻撃すべてに（フィニッシュにも）1発ごとに威力+10' }),
  panorama: m({ id: 'c17_panorama', name: 'パノラマ', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', spread: true }, text: '単体の攻撃に添える。ほかの敵全体にも同じだけ当たる（広がった先はダウンしない）' }),
  highlight: m({ id: 'c17_highlight', name: 'ハイライト', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', expose: true }, text: '攻撃に添える。属性に関係なく弱点扱い（ダウンする）' }),
  filterRed: m({ id: 'c17_filterRed', name: '赤フィルター', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', element: 'fire' }, text: '攻撃に添える。その攻撃を火にする' }),
  filterBlue: m({ id: 'c17_filterBlue', name: '青フィルター', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', element: 'ice' }, text: '攻撃に添える。その攻撃を氷にする' }),
  filterYellow: m({ id: 'c17_filterYellow', name: '黄フィルター', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', element: 'thunder' }, text: '攻撃に添える。その攻撃を雷にする' }),
  pinpoint: m({ id: 'c17_pinpoint', name: 'ピンポイント', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', pinpoint: true }, text: '攻撃に添える。当たった敵は、このラウンドのフィニッシュを1.5倍で受ける' }),
  push: m({ id: 'c17_push', name: '押す', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', push: 2 }, text: '攻撃に添える。当たった敵の、まだ動いていない予定を2マス後ろへ（ラウンドの外へ出たら起きない）' }),
  pause: m({ id: 'c17_pause', name: 'ポーズ', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', seal: true }, text: '攻撃に添える。当たった敵の、このラウンドの大技・全体攻撃を、ふつうの単体攻撃にする' }),
  rewind: m({ id: 'c17_rewind', name: 'リワインド', type: 'support', weight: 0, target: 'enemy', effect: { kind: 'addon', drain: 0.3 }, text: '攻撃に添える。その攻撃のダメージの30%を、使った仲間が回復する' }),
  // フィニッシュ（ラウンドの最後の行動だけ。添えられない。アルバムに3枚まで）
  decisive: m({ id: 'c17_decisive', name: '決めの一枚', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 60, scale: { by: 'hits', per: 10 } }, text: '敵1体に物理60。このラウンドに味方が当てた回数1回につき+10' }),
  group: m({ id: 'c17_group', name: '集合写真', type: 'finish', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 30, scale: { by: 'hits', per: 4 } }, text: '敵全体に物理30。このラウンドに味方が当てた回数1回につき、敵ごとに+4' }),
  imprint: m({ id: 'c17_imprint', name: '焼き付け', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40, scale: { by: 'targetHits', per: 15 } }, text: '敵1体に物理40。このラウンドに、その敵に当てた回数1回につき+15' }),
  margin: m({ id: 'c17_margin', name: '余白', type: 'finish', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40, scale: { by: 'slotsLeft', per: 20 } }, text: '敵1体に物理40。効いた時のラウンドの残りのマス1つにつき+20' }),
  develop: m({ id: 'c17_develop', name: '現像', type: 'finish', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40, scale: { by: 'supports', per: 25 } }, text: '敵1体に物理40。このラウンドに味方が添えたサポート1枚につき+25' }),
  reel: m({ id: 'c17_reel', name: '巻き上げ', type: 'finish', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 15, hits: 5, scale: { by: 'hits', per: 2 } }, text: '敵1体に物理15を5回。このラウンドに当てた回数1回につき、1発ごとに+2（露出補正も乗る）' }),
  rainbow: m({ id: 'c17_rainbow', name: '虹', type: 'finish', weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 20, bestOf: ['physical', 'fire', 'ice', 'thunder'], scale: { by: 'hits', per: 3 } }, text: '敵全体に、敵ごとに一番効く属性で20。当てた回数1回につき、敵ごとに+3' }),
  // 仲間の専用の札（スペシャル。連れていく仲間の分だけ山札に入る）
  swing: m({ id: 'c17_swing', name: '全力スイング', type: 'attack', weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 70 }, text: 'ハルト専用。敵1体に物理70', owner: 'hero' }),
  snow: m({ id: 'c17_snow', name: '雪の結晶', type: 'attack', weight: 2, target: 'enemies', effect: { kind: 'damage', element: 'ice', power: 15 }, text: 'あかり専用。敵全体に氷15', owner: 'akari' }),
  paperGun: m({ id: 'c17_paperGun', name: '紙鉄砲', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 10, hits: 3 }, text: 'みお専用。敵1体に雷10を3回', owner: 'mio' }),
} satisfies Record<string, ChainMove>;

const C = CHAIN17_CARDS;

/** 札の絵（今のスナップの絵を仮に使う） */
export const CHAIN17_CARD_ART: Record<string, string> = {
  c17_quick: 'snap.quickStep', c17_closeUp: 'snap.sword', c17_backlight: 'snap.fireChip', c17_blueHour: 'snap.iceChip', c17_strobe: 'snap.thunderChip',
  c17_flash: 'snap.thunderChip', c17_burst: 'snap.quickStep', c17_sparkler: 'snap.fireChip', c17_wide: 'snap.wideShot', c17_bigShot: 'snap.heavyBlow',
  c17_longTake: 'snap.heavyBlow', c17_zoom: 'snap.search', c17_firstCut: 'snap.sword',
  c17_plus10: 'snap.sword', c17_plus20: 'snap.sword', c17_plus30: 'snap.sword', c17_split: 'snap.draw', c17_exposure: 'snap.joker', c17_panorama: 'snap.search',
  c17_highlight: 'snap.joker', c17_filterRed: 'snap.fireChip', c17_filterBlue: 'snap.iceChip', c17_filterYellow: 'snap.thunderChip', c17_pinpoint: 'snap.breakArm',
  c17_push: 'snap.quickStep', c17_pause: 'snap.encore', c17_rewind: 'snap.recover',
  c17_decisive: 'snap.breakArm', c17_group: 'snap.wideShot', c17_imprint: 'snap.heavyBlow', c17_margin: 'snap.search', c17_develop: 'snap.draw', c17_reel: 'snap.quickStep', c17_rainbow: 'snap.joker',
  c17_swing: 'snap.pinchHitter', c17_snow: 'snap.iceChip', c17_paperGun: 'snap.thunderChip',
};

/** 技とコンボの絵 */
export const CHAIN17_MOVE_ART: Record<string, string> = {
  flurry: 'snap.sword', iceShard: 'snap.iceChip', tricolor: 'snap.joker', burstStorm: 'snap.quickStep', timeStop: 'snap.encore', homerun: 'snap.pinchHitter',
  diamondDust: 'snap.iceChip', thunderDrum: 'snap.thunderChip', twoSwords: 'snap.sword', threeTimes: 'snap.joker',
};

/** 札の上の短い効果 */
export const CHAIN17_SHORT_TEXT: Record<string, string> = {
  c17_quick: '敵1体に\n物理20', c17_closeUp: '敵1体に\n物理40', c17_backlight: '敵1体に\n火35', c17_blueHour: '敵1体に\n氷35', c17_strobe: '敵1体に\n雷35',
  c17_flash: '敵全体に\n雷20', c17_burst: '物理12×5回\n分けられない', c17_sparkler: '全体に火6×5\n分けられない', c17_wide: '敵全体に\n物理25', c17_bigShot: '物理100\nかたい・バリアに強い',
  c17_longTake: '物理150\n邪魔されると不発', c17_zoom: '物理30\nかばうを無視', c17_firstCut: '物理30\n最初なら2倍',
  c17_plus10: '添える\n1発ごと+10', c17_plus20: '添える\n1発ごと+20', c17_plus30: '添える\n1発ごと+30', c17_split: '添える\n4回に分ける', c17_exposure: '添える\n以後ずっと+10',
  c17_panorama: '添える\n全体に広げる', c17_highlight: '添える\n弱点扱い', c17_filterRed: '添える\n火にする', c17_filterBlue: '添える\n氷にする', c17_filterYellow: '添える\n雷にする',
  c17_pinpoint: '添える\nフィニッシュ1.5倍', c17_push: '添える\n予定を2マス後へ', c17_pause: '添える\n大技を封じる', c17_rewind: '添える\n30%回復',
  c17_decisive: '物理60\n当てた回数×10', c17_group: '全体に物理30\n当てた回数×4', c17_imprint: '物理40\nその敵へ×15', c17_margin: '物理40\n残りマス×20',
  c17_develop: '物理40\nサポート×25', c17_reel: '物理15×5\n当てた回数×2', c17_rainbow: '全体に一番効く\n属性で20',
  c17_swing: '敵1体に\n物理70', c17_snow: '敵全体に\n氷15', c17_paperGun: '雷10×3回',
  basic: '敵1体に\n物理20', slash: '敵1体に\n物理35', flurry: '物理12×3回', ice: '敵1体に\n氷35', iceShard: '氷10×2回', heal: '味方全体の\nHPを回復', zap: '雷12×2回', thunder: '敵1体に\n雷35',
};

const move = (x: ChainMove): ChainMove => x;
const basic = (): ChainMove => move({ id: 'basic', name: '通常攻撃', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 20 }, text: '敵1体に物理20（いつでも使える）' });

/** 仲間（調整17）：ハルトは属性なし（スナップが得意）、あかりは氷と回復、みおは雷。火はスナップで補う */
export const CHAIN17_ALLIES: ChainAllyDef[] = [
  {
    id: 'hero',
    name: 'ハルト',
    hp: 230,
    atk: 10,
    mag: 6,
    def: 10,
    moves: [
      basic(),
      move({ id: 'slash', name: '斬る', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 35 }, text: '敵1体に物理35' }),
      move({ id: 'flurry', name: '乱れ斬り', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 12, hits: 3 }, text: '敵1体に物理12を3回' }),
    ],
  },
  {
    id: 'akari',
    name: 'あかり',
    hp: 200,
    atk: 6,
    mag: 10,
    def: 9,
    moves: [
      basic(),
      move({ id: 'ice', name: 'アイス', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 35 }, text: '敵1体に氷35' }),
      move({ id: 'iceShard', name: '氷の粒', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'ice', power: 10, hits: 2 }, text: '敵1体に氷10を2回' }),
      move({ id: 'heal', name: 'いやしの歌', type: 'support', weight: 3, target: 'allies', effect: { kind: 'heal', power: 40 }, text: '味方全体の HP を回復する' }),
    ],
  },
  {
    id: 'mio',
    name: 'みお',
    hp: 190,
    atk: 8,
    mag: 9,
    def: 8,
    moves: [
      basic(),
      move({ id: 'zap', name: '静電気', type: 'attack', weight: 2, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 12, hits: 2 }, text: '敵1体に雷12を2回' }),
      move({ id: 'thunder', name: 'サンダー', type: 'attack', weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 35 }, text: '敵1体に雷35' }),
    ],
  },
];

const combo = (id: string, name: string, cards: ChainMove[], members: string[], body: Omit<ChainMove, 'id' | 'name' | 'type'>): ChainLinkDef => ({
  id,
  members,
  cards: cards.map((c) => c.id),
  move: { id, name, type: 'link', ...body },
});

/** コンボ（P.A.）。フィニッシュ扱い（ラウンドの最後の行動だけ・添えられない）。材料は手札に残しておく。レシピは最初は見えず、初めてそろうと分かる */
export const CHAIN17_COMBOS: ChainLinkDef[] = [
  // 通常3枚
  combo('tricolor', '三原色', [C.backlight, C.blueHour, C.strobe], [], { weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 50, bestOf: ['fire', 'ice', 'thunder'], scale: { by: 'hits', per: 5 } }, text: '敵全体に、敵ごとに一番効く属性で50（弱点ならダウン）。当てた回数で伸びる' }),
  combo('burstStorm', '連写の嵐', [C.burst, C.burst, C.wide], [], { weight: 4, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 12, hits: 10 }, text: '敵全体に物理12を10回ずつ' }),
  combo('timeStop', '時間よ止まれ', [C.push, C.push, C.longTake], [], { weight: 5, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 150, stopAll: true }, text: '敵1体に物理150。敵全員の、このラウンドの残りの予定を消す' }),
  // 専用1＋通常2
  combo('homerun', 'ホームラン', [C.swing, C.bigShot, C.plus30], ['hero'], { weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 200, heavy: true }, text: 'ハルト。敵1体に物理200（かたい敵に1.5倍・バリアを割る）' }),
  combo('diamondDust', 'ダイヤモンドダスト', [C.snow, C.blueHour, C.panorama], ['akari'], { weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'ice', power: 20, hits: 6 }, text: 'あかり。敵全体に氷20を6回ずつ' }),
  combo('thunderDrum', '雷鼓', [C.paperGun, C.strobe, C.push], ['mio'], { weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'thunder', power: 15, hits: 8, push: 99 }, text: 'みお。敵1体に雷15を8回。当たった敵の、このラウンドの残りの予定を消す' }),
  // 専用2＋通常1（連携技）
  combo('afterglow', 'アフターグロウ', [C.swing, C.snow, C.backlight], ['hero', 'akari'], { weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'fire', power: 60, bestOf: ['fire', 'ice'], healAll: 30 }, text: 'ハルトとあかり。敵全体に、敵ごとに火か氷の効く方で60。味方全体を回復' }),
  combo('crossDrive', 'クロスドライブ', [C.swing, C.paperGun, C.quick], ['hero', 'mio'], { weight: 3, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 40, hits: 3, extra: [{ element: 'thunder', power: 40, hits: 3 }] }, text: 'ハルトとみお。敵1体に物理40を3回と、雷40を3回' }),
  combo('shower', '夕立', [C.snow, C.paperGun, C.wide], ['akari', 'mio'], { weight: 3, target: 'enemies', effect: { kind: 'damage', element: 'thunder', power: 15, hits: 4, extra: [{ element: 'ice', power: 15, hits: 2 }] }, text: 'あかりとみお。敵全体に雷15を4回と、氷15を2回' }),
  // 専用2（同じ仲間）＋通常1
  combo('twoSwords', '二刀流', [C.swing, C.swing, C.exposure], ['hero'], { weight: 4, target: 'enemy', effect: { kind: 'damage', element: 'physical', power: 100, hits: 2, exposure: 20 }, text: 'ハルト。敵1体に物理100を2回。使う時に、このラウンドの露出補正に+20' }),
  // 専用3（3人技）
  combo('threeTimes', '三人の時間', [C.swing, C.snow, C.paperGun], ['hero', 'akari', 'mio'], { weight: 4, target: 'enemies', effect: { kind: 'damage', element: 'physical', power: 80, extra: [{ element: 'ice', power: 80 }, { element: 'thunder', power: 80 }] }, text: '3人で。敵全体に物理80・氷80・雷80' }),
];

/** コンボの材料の手がかり（まだ見つけていないコンボに出す） */
export const CHAIN17_COMBO_HINT: Record<string, string> = {
  tricolor: '火・氷・雷のアタック',
  burstStorm: '連続攻撃の札2枚＋全体の札',
  timeStop: '予定を動かすサポート2枚＋邪魔されると不発の札',
  homerun: 'ハルトの専用の札＋重い一撃＋添える札',
  diamondDust: 'あかりの専用の札＋氷のアタック＋広げる札',
  thunderDrum: 'みおの専用の札＋雷のアタック＋予定を動かす札',
  afterglow: 'ハルトとあかりの専用の札＋火のアタック',
  crossDrive: 'ハルトとみおの専用の札＋軽いアタック',
  shower: 'あかりとみおの専用の札＋全体の札',
  twoSwords: 'ハルトの専用の札2枚＋添える札',
  threeTimes: '3人の専用の札',
};

/** 敵（調整17）：防御を10にそろえ、ブリキはバリア（最初の2発を消す）、歯車はかたい（1発ごとに減らす） */
/** 雑魚の HP は調整16の約2/3（威力 ≒ ダメージにそろえたため） */
const HP_RATE = 0.65;
const e17 = (e: ChainEnemyDef, over: Partial<ChainEnemyDef> = {}): ChainEnemyDef => ({ ...e, def: 10, hp: Math.round(e.hp * HP_RATE), splitInto: e.splitInto ? e17(e.splitInto) : undefined, ...over });
const E = CHAIN_ENEMIES;
const TIN = e17(E.tin, { shellHits: 2 });
const GEAR: ChainEnemyDef = { id: 'gearNoise', name: '歯車ノイズ', hp: 120, atk: 12, def: 10, weak: ['fire'], resist: [], trait: 'hard', pattern: [
  { id: 'mesh', name: '噛み合わせ', at: 4, element: 'physical', power: 28 },
  { id: 'idle', name: '空回り', at: 7, all: true, element: 'physical', power: 16 },
] };
const LORD: ChainEnemyDef = { id: 'goldfishBowlLord', name: '金魚鉢のぬし', hp: 750, atk: 13, def: 10, weak: [], resist: [], pattern: [
  { id: 'ram', name: '体当たり', at: 3, element: 'physical', power: 36 },
  { id: 'wave', name: '大波', at: 6, all: true, element: 'ice', power: 26 },
  { id: 'rapid', name: '乱れ水鉄砲', at: 2, at2: 7, element: 'ice', power: 22 },
] };
const BY_ID: Record<string, ChainEnemyDef> = Object.fromEntries(Object.values(E).map((e) => [e.id, e17(e)]));
BY_ID.tinNoise = TIN;

/** 山札：アタック9（共通）＋サポート8（共通6＋組み合わせごとに2）＋フィニッシュ3（組み合わせごと）＋専用の札（仲間1人につき2枚） */
const ATTACKS = [C.quick, C.backlight, C.blueHour, C.strobe, C.burst, C.burst, C.wide, C.bigShot, C.longTake];
const SUPPORTS = [C.push, C.push, C.plus30, C.split, C.exposure, C.panorama];
const SPECIALS = [C.swing, C.swing, C.snow, C.snow, C.paperGun, C.paperGun];
export const CHAIN17_DECK_PLAN = { attack: 9, support: 8, finish: 3, specialPerAlly: 2 } as const;
const deckOf = (supports: ChainMove[], finishes: ChainMove[]): string[] => [...ATTACKS, ...SUPPORTS, ...supports, ...finishes, ...SPECIALS].map((c) => c.id);
const CARDS: Record<string, ChainMove> = Object.fromEntries(Object.values(CHAIN17_CARDS).map((c) => [c.id, c]));

/** 組み合わせごとのサポート2枚とフィニッシュ3枚 */
const PICKS: Record<string, [ChainMove[], ChainMove[]]> = {
  chain1: [[C.highlight, C.pause], [C.decisive, C.group, C.margin]],
  chain2: [[C.pinpoint, C.filterRed], [C.imprint, C.decisive, C.reel]],
  chain3: [[C.rewind, C.pause], [C.group, C.develop, C.decisive]],
  chain4: [[C.plus10, C.highlight], [C.margin, C.reel, C.rainbow]],
  chain5: [[C.filterYellow, C.plus20], [C.group, C.rainbow, C.decisive]],
  chain6: [[C.highlight, C.pinpoint], [C.imprint, C.rainbow, C.develop]],
  chain7: [[C.filterBlue, C.pause], [C.decisive, C.imprint, C.margin]],
  chain8: [[C.pinpoint, C.rewind], [C.imprint, C.reel, C.develop]],
};

function make17(base: ChainBattleDef, enemies?: ChainEnemyDef[], variants = base.variants, name = base.name): ChainBattleDef {
  const [sup, fin] = PICKS[base.id];
  return {
    ...base,
    name,
    allies: CHAIN17_ALLIES,
    enemies: enemies ?? base.enemies.map((e) => BY_ID[e.id] ?? e17(e)),
    variants,
    cards: CARDS,
    deck: deckOf(sup, fin),
    links: CHAIN17_COMBOS,
    noShutter: true,
    finishLast: true,
    // 決着が2〜3ラウンドになるので、評価の目安を延ばす（ボスはさらに）
    gradeAt: base.id === 'chain8' ? { high: 35, mid: 50 } : { high: 15, mid: 22 },
  };
}

const gearBig: ChainEnemyMove = { id: 'grind', name: '歯車の大回転', at: 3, all: true, element: 'physical', power: 36 };
const old = (id: string) => CHAIN_TRIALS_16.find((t) => t.id === id)!;
const c2 = old('chain2');

/** 調整17の試し（中盤）。7つの組み合わせは調整16までと同じ顔ぶれ（からくり時計はヨーヨーの代わりに、かたい歯車）。8つ目はボス */
export const CHAIN_TRIALS: ChainBattleDef[] = [
  make17(old('chain1')),
  make17(c2, [TIN, BY_ID.cuckooNoise, GEAR], [
    c2.variants![0],
    c2.variants![1],
    { id: 'v3', name: '全開', patterns: [c2.variants![2].patterns[0], undefined, [gearBig, GEAR.pattern[0]]] },
  ], 'からくり時計（バリア・ダウン解除・かたい）'),
  make17(old('chain3')),
  make17(old('chain4')),
  make17(old('chain5')),
  make17(old('chain6')),
  make17(old('chain7'), undefined, undefined, '古い電器屋の奥（割り込み・巻き戻し・バリア）'),
  make17({ ...old('chain1'), id: 'chain8', variants: undefined }, [LORD], undefined, '金魚鉢のぬし（ボス）'),
];

/** 調整17の、1人1回をやめた試し（連続） */
export const CHAIN_TRIALS_MULTI: ChainBattleDef[] = CHAIN_TRIALS.map((d) => ({ ...d, multiAct: true }));

/** 試しの組み合わせを、時期を指定して選ぶ（序盤は調整14のまま） */
export function chainTrialDef(id: string, stage: ChainStage = 'mid'): ChainBattleDef {
  const list = stage === 'early' ? CHAIN_TRIALS_EARLY : stage === 'multi' ? CHAIN_TRIALS_MULTI : CHAIN_TRIALS;
  return list.find((t) => t.id === id) ?? list[0];
}

