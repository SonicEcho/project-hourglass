import type { Element } from '../core/types';
import type { EvolutionCondition, EvolutionDef, EvolutionStyleDef, FragmentDef, ItemDef, WeaponData, WeaponDef, WeaponParamKey } from '../core/weapon';
import type { PartColor } from '../core/navi';
import { POUCH_MAX } from './constants';

// 武器ビルドアップ（段階9）。数値・名前はすべて仮

/**
 * 記憶の欠片（段階10）。記憶に宿る感情ごとの種類。盗まれるのは楽しい時間だけなので、前向きな感情だけ。
 * 1つで、その感情に対応するパラメータが1上がる
 */
export const FRAGMENTS = {
  courage: { id: 'courage', name: '勇気', gains: { atk: 1 } },
  elation: { id: 'elation', name: '高揚', gains: { fire: 1 } },
  relief: { id: 'relief', name: '安堵', gains: { ice: 1 } },
  wonder: { id: 'wonder', name: '驚嘆', gains: { thunder: 1 } },
} satisfies Record<string, FragmentDef>;

/**
 * 素材（敵が落とす）と通常アイテム（勝利の報酬）。
 * 段階27b：素材は武器に直接刻む（gains の分だけ上下する。刻印を1つ使う）。種類（rarity）は落とし物の確率と色分けに使う。
 * 通常アイテムは、今は戦闘で使えないので、時分解して記憶の欠片にするだけ（gains は欠片の種類を決めるだけ）。
 * 数値は docs/design/growth.md の 6-4（たたき台）
 */
export const ITEMS = {
  // ---- 1-1 の縁日（段階27b） ----
  goldfishScale: { id: 'goldfishScale', name: '金魚のうろこ', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  goldfishFin: { id: 'goldfishFin', name: '金魚のひれ', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  balloonShard: { id: 'balloonShard', name: '水風船のかけら', kind: 'material', rarity: 'common', gains: { thunder: 1, ice: 1 } },
  balloonRubber: { id: 'balloonRubber', name: '水風船のゴム', kind: 'material', rarity: 'uncommon', gains: { atk: 2, thunder: 1 } },
  maskShard: { id: 'maskShard', name: 'お面のかけら', kind: 'material', rarity: 'common', gains: { fire: 2, ice: -1 } },
  maskString: { id: 'maskString', name: 'お面のひも', kind: 'material', rarity: 'uncommon', gains: { fire: 2, atk: 2 } },
  cottonThread: { id: 'cottonThread', name: 'わたあめの糸', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: -1 } },
  cottonStick: { id: 'cottonStick', name: 'わたあめの棒', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, fire: 1 } },
  natsuTail: { id: 'natsuTail', name: 'なつの尾びれ', kind: 'material', rarity: 'rare', gains: { ice: 3, fire: 3, atk: 2 } },
  tornPoi: { id: 'tornPoi', name: '破れたポイ', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  bowlShard: { id: 'bowlShard', name: '金魚鉢のかけら', kind: 'material', rarity: 'part', gains: { ice: 3, thunder: 1 } },
  lordGoldfish: { id: 'lordGoldfish', name: 'ぬしの金魚', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 1-2 の商店街（段階37）。2回目の進化（段階42）の前なので、今は武器の能力値を上げるだけ ----
  tinSpring: { id: 'tinSpring', name: 'ブリキのぜんまい', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  tinKey: { id: 'tinKey', name: 'ぜんまいの鍵', kind: 'material', rarity: 'uncommon', gains: { atk: 3, thunder: 1 } },
  phoneCord: { id: 'phoneCord', name: '黒電話のコード', kind: 'material', rarity: 'common', gains: { ice: 2, thunder: 1 } },
  phoneBell: { id: 'phoneBell', name: '黒電話のベル', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  ramuneGlass: { id: 'ramuneGlass', name: 'ラムネの瓶のかけら', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  ramuneMarble: { id: 'ramuneMarble', name: 'ラムネのビー玉', kind: 'material', rarity: 'uncommon', gains: { atk: 2, ice: 2 } },
  sunsetMarble: { id: 'sunsetMarble', name: '夕焼けのビー玉', kind: 'material', rarity: 'rare', gains: { fire: 3, thunder: 3, atk: 2 } },
  menkoCard: { id: 'menkoCard', name: 'めんこ', kind: 'material', rarity: 'common', gains: { fire: 2, ice: -1 } },
  beigoma: { id: 'beigoma', name: 'ベーゴマ', kind: 'material', rarity: 'uncommon', gains: { fire: 2, atk: 2 } },
  bentSpoke: { id: 'bentSpoke', name: '曲がったスポーク', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  rustyBell: { id: 'rustyBell', name: 'さびたベル', kind: 'material', rarity: 'part', gains: { thunder: 3, ice: 1 } },
  lordCarrier: { id: 'lordCarrier', name: 'ぬしの荷台', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 2-1 の町工場（段階39）。みおの進化の鍵（フィラメント・真空管のボルト）もここ ----
  wornGear: { id: 'wornGear', name: 'すり減った歯車', kind: 'material', rarity: 'common', gains: { atk: 2, thunder: 1 } },
  masterGear: { id: 'masterGear', name: '親歯車', kind: 'material', rarity: 'uncommon', gains: { atk: 3, ice: -1 } },
  rustyScrew: { id: 'rustyScrew', name: 'さびたネジ', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  brassBolt: { id: 'brassBolt', name: '真鍮のボルト', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  tubeGlass: { id: 'tubeGlass', name: '真空管のかけら', kind: 'material', rarity: 'common', gains: { thunder: 2, ice: 1 } },
  filament: { id: 'filament', name: 'フィラメント', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, fire: 1 } },
  expoTicket: { id: 'expoTicket', name: '万博のきっぷ', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 3, thunder: 2 } },
  abacusBead: { id: 'abacusBead', name: 'そろばんの珠', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  abacusFrame: { id: 'abacusFrame', name: 'そろばんの枠', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  chippedTool: { id: 'chippedTool', name: '欠けたバイト', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  brokenBelt: { id: 'brokenBelt', name: '切れたベルト', kind: 'material', rarity: 'part', gains: { thunder: 2, fire: 2 } },
  lordGear: { id: 'lordGear', name: 'ぬしの歯車', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 2-2 の文化祭の高校（段階39b） ----
  phoneStrap: { id: 'phoneStrap', name: 'ケータイのストラップ', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  ringtoneChip: { id: 'ringtoneChip', name: '着メロのチップ', kind: 'material', rarity: 'uncommon', gains: { ice: 3, thunder: -1 } },
  cassetteTape: { id: 'cassetteTape', name: 'のびたカセットテープ', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  boomboxDial: { id: 'boomboxDial', name: 'ラジカセのつまみ', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, fire: -1 } },
  demoTape: { id: 'demoTape', name: 'ラストチャイムのデモテープ', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 2, thunder: 3 } },
  pendulumWeight: { id: 'pendulumWeight', name: '振り子のおもり', kind: 'material', rarity: 'common', gains: { atk: 2, ice: 1 } },
  tempoSpring: { id: 'tempoSpring', name: 'テンポのぜんまい', kind: 'material', rarity: 'uncommon', gains: { atk: 3, fire: -1 } },
  photoSticker: { id: 'photoSticker', name: '写真シール', kind: 'material', rarity: 'common', gains: { fire: 2, thunder: 1 } },
  glitterPen: { id: 'glitterPen', name: 'ラメのペン', kind: 'material', rarity: 'uncommon', gains: { fire: 3, ice: -1 } },
  tornSpeaker: { id: 'tornSpeaker', name: '破れたスピーカー', kind: 'material', rarity: 'part', gains: { thunder: 2, fire: 2 } },
  tangledCord: { id: 'tangledCord', name: '絡まったコード', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lordPick: { id: 'lordPick', name: 'ぬしのピック', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 2-3 の河川敷のグラウンド（段階40） ----
  ballSeam: { id: 'ballSeam', name: 'ボールの縫い目', kind: 'material', rarity: 'common', gains: { atk: 2, fire: 1 } },
  autographBall: { id: 'autographBall', name: 'サインボール', kind: 'material', rarity: 'uncommon', gains: { atk: 3, thunder: -1 } },
  megaphoneMouth: { id: 'megaphoneMouth', name: 'メガホンの口', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  cheerBand: { id: 'cheerBand', name: '応援のはちまき', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, ice: -1 } },
  scorebook: { id: 'scorebook', name: '最後のスコアブック', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 3, thunder: 2 } },
  jugIce: { id: 'jugIce', name: '水筒の氷', kind: 'material', rarity: 'common', gains: { ice: 2, fire: 1 } },
  jugCap: { id: 'jugCap', name: '水筒のふた', kind: 'material', rarity: 'uncommon', gains: { ice: 3, atk: -1 } },
  petEgg: { id: 'petEgg', name: '電子ペットのたまご', kind: 'material', rarity: 'common', gains: { fire: 2, ice: 1 } },
  buttonCell: { id: 'buttonCell', name: 'ボタン電池', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  scorePlate: { id: 'scorePlate', name: '得点板の札', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  tornNet: { id: 'tornNet', name: '破れたネット', kind: 'material', rarity: 'part', gains: { ice: 2, thunder: 2 } },
  lordBat: { id: 'lordBat', name: 'ぬしのバット', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 3-1 の昭和41年の夏の村（段階88） ----
  fanBlade: { id: 'fanBlade', name: '扇風機の羽', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  fanTimer: { id: 'fanTimer', name: '首振りのつまみ', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, ice: -1 } },
  coilAsh: { id: 'coilAsh', name: '蚊取り線香の灰', kind: 'material', rarity: 'common', gains: { ice: 2, fire: 1 } },
  coilStand: { id: 'coilStand', name: '線香立ての豚', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  radioDial: { id: 'radioDial', name: 'ラジオのダイヤル', kind: 'material', rarity: 'common', gains: { atk: 2, thunder: 1 } },
  radioEarphone: { id: 'radioEarphone', name: '片耳のイヤホン', kind: 'material', rarity: 'uncommon', gains: { atk: 3, ice: -1 } },
  payEnvelope: { id: 'payEnvelope', name: 'はじめての給料袋', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 2, thunder: 3 } },
  tableLeg: { id: 'tableLeg', name: 'ちゃぶ台の脚', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  teacup: { id: 'teacup', name: '欠けた湯のみ', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  postLetter: { id: 'postLetter', name: '仕送りの封筒', kind: 'material', rarity: 'uncommon', gains: { ice: 2, fire: 2 } },
  oldTicket: { id: 'oldTicket', name: '硬い切符', kind: 'material', rarity: 'rare', gains: { atk: 3, fire: 2, thunder: 2 } },
  chimneySoot: { id: 'chimneySoot', name: '煙突のすす', kind: 'material', rarity: 'part', gains: { thunder: 2, fire: 2 } },
  trainWheel: { id: 'trainWheel', name: '汽車の車輪', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lordWhistle: { id: 'lordWhistle', name: 'ぬしの汽笛', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 3-2 の平成31年3月、卒業式の帰り道（段階94） ----
  earphoneCord: { id: 'earphoneCord', name: 'イヤホンのコード', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  earbudTip: { id: 'earbudTip', name: 'イヤーピース', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, ice: -1 } },
  selfieGrip: { id: 'selfieGrip', name: '自撮り棒の握り', kind: 'material', rarity: 'common', gains: { atk: 2, ice: 1 } },
  crackedLens: { id: 'crackedLens', name: '割れたレンズ', kind: 'material', rarity: 'uncommon', gains: { atk: 3, thunder: -1 } },
  tapiocaPearl: { id: 'tapiocaPearl', name: '黒い粒', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  thickStraw: { id: 'thickStraw', name: '太いストロー', kind: 'material', rarity: 'uncommon', gains: { fire: 3, ice: -1 } },
  diplomaCap: { id: 'diplomaCap', name: '筒のふた', kind: 'material', rarity: 'common', gains: { ice: 2, fire: 1 } },
  flowerRibbon: { id: 'flowerRibbon', name: '卒業式の花のリボン', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  secondButton: { id: 'secondButton', name: '第二ボタン', kind: 'material', rarity: 'rare', gains: { atk: 3, fire: 2, ice: 3 } },
  blankCard: { id: 'blankCard', name: '余白の色紙', kind: 'material', rarity: 'uncommon', gains: { fire: 2, thunder: 2 } },
  lostTicket: { id: 'lostTicket', name: '使わなかった定期券', kind: 'material', rarity: 'rare', gains: { atk: 2, thunder: 3, ice: 2 } },
  alarmLamp: { id: 'alarmLamp', name: '警報機の赤い灯', kind: 'material', rarity: 'part', gains: { ice: 2, thunder: 2 } },
  barrierArm: { id: 'barrierArm', name: '遮断機の竿', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lordSignal: { id: 'lordSignal', name: 'ぬしの警報灯', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 4-1 の平成30年の夏、田舎（段階137a） ----
  cageMesh: { id: 'cageMesh', name: '虫かごの網', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  cageStrap: { id: 'cageStrap', name: '虫かごのひも', kind: 'material', rarity: 'uncommon', gains: { fire: 3, ice: -1 } },
  melonRind: { id: 'melonRind', name: 'すいかの皮', kind: 'material', rarity: 'common', gains: { atk: 2, ice: 1 } },
  melonSeed: { id: 'melonSeed', name: 'すいかの種', kind: 'material', rarity: 'uncommon', gains: { atk: 3, thunder: -1 } },
  fireworkStick: { id: 'fireworkStick', name: '花火の燃えさし', kind: 'material', rarity: 'common', gains: { ice: 2, fire: 1 } },
  fireworkPaper: { id: 'fireworkPaper', name: '花火の色紙', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  sparklerBead: { id: 'sparklerBead', name: '線香花火の玉', kind: 'material', rarity: 'rare', gains: { atk: 3, fire: 2, ice: 3 } },
  pumpHandle: { id: 'pumpHandle', name: 'ポンプの取っ手', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  waterTank: { id: 'waterTank', name: '水鉄砲のタンク', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, ice: -1 } },
  jizoBib: { id: 'jizoBib', name: '赤い前掛け', kind: 'material', rarity: 'uncommon', gains: { fire: 2, thunder: 2 } },
  radioCard: { id: 'radioCard', name: 'ラジオ体操のカード', kind: 'material', rarity: 'rare', gains: { atk: 2, thunder: 3, ice: 2 } },
  hatBrim: { id: 'hatBrim', name: '麦わらのつば', kind: 'material', rarity: 'part', gains: { ice: 2, thunder: 2 } },
  riverStone: { id: 'riverStone', name: '川底の石', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lordStrawHat: { id: 'lordStrawHat', name: 'ぬしの麦わら帽子', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 4-2 の平成9年の春、開店の日の商店街（段階140a。段階149 で昭和55年から動かし、2つの敵を替えた。id はセーブに入っているので前のまま） ----
  cubeTile: { id: 'cubeTile', name: 'ヨーヨーの糸', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  cubeCore: { id: 'cubeCore', name: 'ヨーヨーの軸', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  gameButton: { id: 'gameButton', name: 'ポケベルのボタン', kind: 'material', rarity: 'common', gains: { atk: 2, thunder: 1 } },
  gameGlass: { id: 'gameGlass', name: 'ポケベルの画面', kind: 'material', rarity: 'uncommon', gains: { atk: 3, ice: -1 } },
  balloonPaper: { id: 'balloonPaper', name: '紙風船の紙', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  balloonMouth: { id: 'balloonMouth', name: '紙風船の口', kind: 'material', rarity: 'uncommon', gains: { fire: 3, ice: -1 } },
  redBalloon: { id: 'redBalloon', name: '赤い紙風船', kind: 'material', rarity: 'rare', gains: { atk: 3, fire: 3, ice: 2 } },
  cuckooBird: { id: 'cuckooBird', name: '鳩時計の鳩', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  cuckooWeight: { id: 'cuckooWeight', name: '鳩時計のおもり', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, fire: -1 } },
  wreathRibbon: { id: 'wreathRibbon', name: '花輪のリボン', kind: 'material', rarity: 'uncommon', gains: { fire: 2, thunder: 2 } },
  brushSign: { id: 'brushSign', name: '手書きの看板', kind: 'material', rarity: 'rare', gains: { atk: 2, thunder: 3, ice: 2 } },
  shutterSlat: { id: 'shutterSlat', name: 'シャッターの板', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  winchGear: { id: 'winchGear', name: '巻き上げの歯車', kind: 'material', rarity: 'part', gains: { ice: 2, thunder: 2 } },
  lordShutterKey: { id: 'lordShutterKey', name: 'ぬしの合鍵', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 3章のカイのリベンジ（段階96） ----
  frameShard: { id: 'frameShard', name: '枠のかけら', kind: 'material', rarity: 'part', gains: { thunder: 2, atk: 2 } },
  burntFilm: { id: 'burntFilm', name: '焼けたフィルム', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 大正の祭りの夜（段階91b） ----
  lanternPaper: { id: 'lanternPaper', name: '提灯の和紙', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  lanternFrame: { id: 'lanternFrame', name: '提灯の骨', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  pinwheelBlade: { id: 'pinwheelBlade', name: '風車の羽根', kind: 'material', rarity: 'common', gains: { atk: 2, thunder: 1 } },
  pinwheelStick: { id: 'pinwheelStick', name: '風車の竹ひご', kind: 'material', rarity: 'uncommon', gains: { atk: 3, ice: -1 } },
  candyStick: { id: 'candyStick', name: '飴の棒', kind: 'material', rarity: 'common', gains: { fire: 2, ice: 1 } },
  candyCrane: { id: 'candyCrane', name: '飴細工の鶴', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  recordNeedle: { id: 'recordNeedle', name: '蓄音機の針', kind: 'material', rarity: 'common', gains: { thunder: 2, fire: 1 } },
  phonographHorn: { id: 'phonographHorn', name: '蓄音機のラッパ', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, atk: -1 } },
  oldRecord: { id: 'oldRecord', name: '百年前のレコード', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 2, thunder: 3 } },
  drumSkin: { id: 'drumSkin', name: '太鼓の皮', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lanternRope: { id: 'lanternRope', name: '提灯の綱', kind: 'material', rarity: 'part', gains: { ice: 2, fire: 2 } },
  lordFan: { id: 'lordFan', name: 'ぬしの団扇', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 試作の5戦の敵の素材（デバッグメニューの「試作の5戦」） ----
  slimeJelly: { id: 'slimeJelly', name: 'スライムゼリー', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  frostFeather: { id: 'frostFeather', name: '霜の羽', kind: 'material', rarity: 'common', gains: { thunder: 2, ice: 1 } },
  hardFur: { id: 'hardFur', name: '硬い毛皮', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  steelClaw: { id: 'steelClaw', name: '鋼の爪', kind: 'material', rarity: 'uncommon', gains: { atk: 3 } },
  // ---- ポーチの消費アイテム（勝利の報酬・宝箱。段階51。戦闘での効き目は pouch.ts。刻めず、時分解もできない） ----
  potion: { id: 'potion', name: 'ポーション', kind: 'item', gains: {}, max: POUCH_MAX },
  ether: { id: 'ether', name: 'エーテル', kind: 'item', gains: {}, max: POUCH_MAX },
  hiPotion: { id: 'hiPotion', name: 'ハイポーション', kind: 'item', gains: {}, max: POUCH_MAX },
} satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

export type FragmentId = keyof typeof FRAGMENTS;

// ---- 進化ツリー（段階42。docs/design/growth.md の 8.）。名前・数値・条件はすべて仮 ----
// 1回目〜3回目の進化先と寄り道1本は作った。4回目より先は、まだ作っていない先（sealed。影と、一番先の言い伝えだけ見せる）。
// 段の形は 3 → 3 → 4 → 5 → 5 → 6（本道）＋寄り道1。2回目の鍵は次の区画の珍しい素材、3回目の鍵はさらに先の区画の素材

/** 型（8-1c）。row はブリッジ（縦の列）が下へ伸び、column は盤が右へ横に広がる。どの進化先も、2つの型を1つずつ */
const STYLES = {
  /** 烈：その属性のダメージ +10%（横。段階54で +15% から下げた） */
  fierce: (element: Element): EvolutionStyleDef => ({ name: '烈', passives: [{ kind: 'elementBoost', element, rate: 0.1 }], board: 'row' }),
  /** 剛：攻撃 +3（横） */
  might: { name: '剛', stats: { atk: 3 }, board: 'row' },
  /** 叡：魔力 +3（横） */
  sage: { name: '叡', stats: { mag: 3 }, board: 'row' },
  /** 結：コンボ +10%（横。段階54で +15% から下げた） */
  bond: { name: '結', passives: [{ kind: 'comboBoost', rate: 0.1 }], board: 'row' },
  /** 灯：ラウンドの始めに HP 3% 回復（縦） */
  ember: { name: '灯', passives: [{ kind: 'regen', rate: 0.03 }], board: 'column' },
  /** 砕：部位へのダメージ +20%（縦） */
  shatter: { name: '砕', passives: [{ kind: 'partBoost', rate: 0.2 }], board: 'column' },
  /** 静：MP の消費 −1（縦） */
  calm: { name: '静', passives: [{ kind: 'mpSave', amount: 1 }], board: 'column' },
  /** 堅：防御 +2（縦） */
  guard: { name: '堅', stats: { def: 2 }, board: 'column' },
  // ---- 段階196（一覧の 17-4）：新しい戦闘の型。段階197 で、新しい戦闘にない 疾・先・継 を外した ----
  /** 伸：クライマックスの威力 +10%（横） */
  stretch: { name: '伸', traits: [{ kind: 'climaxBoost', rate: 0.1 }], board: 'row' },
  /** 早：最初のラウンドだけ、通常攻撃の重さ −1（横） */
  quick: { name: '早', traits: [{ kind: 'quickStart', count: 1 }], board: 'row' },
  /** 添：エフェクト（添える札）の効き +15%（縦） */
  attach: { name: '添', traits: [{ kind: 'effectBoost', rate: 0.15 }], board: 'column' },
} satisfies Record<string, EvolutionStyleDef | ((element: Element) => EvolutionStyleDef)>;

const param = (p: WeaponParamKey, min: number): EvolutionCondition => ({ kind: 'param', param: p, min });
const key = (item: ItemId): EvolutionCondition => ({ kind: 'key', item });

/**
 * まだ作っていない先（4回目〜一番先）。from から枝ごとに2段の影を重ね、一番先に言い伝えの節を付ける。
 * branches は枝ごとの、一番先の言い伝えの一覧（2つあれば、一番先で2つに分かれる）
 */
function beyond(from: string, branches: string[][]): EvolutionDef[] {
  return branches.flatMap((legends, b) => {
    const t4 = `${from}_${b + 1}a`;
    const t5 = `${from}_${b + 1}b`;
    return [
      { id: t4, name: '', from, sealed: true, conditions: [] },
      { id: t5, name: '', from: t4, sealed: true, conditions: [] },
      ...legends.map((legend, k) => ({ id: `${from}_${b + 1}c${k + 1}`, name: '', from: t5, sealed: true, legend, conditions: [] })),
    ];
  });
}

/** 言い伝えだけの寄り道（段階197。③日常の遊び ④戦い方。条件を数える仕組みができるまで、影と一文だけ見せる） */
const legendDetour = (id: string, from: string, legend: string): EvolutionDef => ({ id, name: '', from, detour: true, sealed: true, legend, conditions: [] });
const low = (p: WeaponParamKey, max: number): EvolutionCondition => ({ kind: 'paramMax', param: p, max });
const anyElement = (min: number): EvolutionCondition => ({ kind: 'elementAny', min });
const tendency = (color: PartColor): EvolutionCondition => ({ kind: 'tendency', color });

// ---- 段階197（段取りの段階G4b）：5人の武器の木を、一覧の 17-6 の系統で3回目まで作り直した（docs/milestones/M3_catalog.md）----
// どの武器も3つの系統（1回目3・2回目3・3回目4。3回目で1つの系統が2つに分かれる）。条件は主の能力値が 12・24・36。
// 通常攻撃の形（basic）は1回目と3回目で変わる。寄り道は ①ほかの属性の遠い道 ②能力値を低いままの道。③④と4回目より先は言い伝えだけ。数値は仮

// ハルト「記録の剣」（属性なし）：刃（通常攻撃の回数・部位）・写（スナップ・エフェクト。火・氷・雷をそろえる）・記（コンボ・クライマックス）
const sword: WeaponDef = {
  id: 'recordSword',
  name: '記録の剣',
  owner: 'hero',
  evolutions: [
    // 1回目（鍵は 1-1 の珍しい素材）
    { id: 'breakEdge', name: 'ブレイクエッジ', conditions: [param('atk', 12), key('balloonRubber')], stats: { atk: 4 }, basic: { hits: 2 }, styles: [STYLES.might, STYLES.shatter] },
    { id: 'copySword', name: '写しの剣', conditions: [param('fire', 4), param('ice', 4), param('thunder', 4), key('cottonStick')], stats: { atk: 3 }, basic: { bestOf: ['fire', 'ice', 'thunder'] }, styles: [STYLES.bond, STYLES.attach] },
    { id: 'bookmarkSword', name: 'しおりの剣', conditions: [param('atk', 8), anyElement(6), key('maskString')], stats: { atk: 3 }, basic: { exposure: 1 }, styles: [STYLES.bond, STYLES.calm] },
    // 2回目（鍵は 1-2 の珍しい素材・部位）
    { id: 'crushEdge', name: 'クラッシュエッジ', from: 'breakEdge', conditions: [param('atk', 24), key('tinKey')], stats: { atk: 5 }, traits: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.quick, STYLES.shatter] },
    { id: 'mirrorSword', name: '映しの剣', from: 'copySword', conditions: [param('fire', 8), param('ice', 8), param('thunder', 8), key('phoneBell')], stats: { atk: 3 }, traits: [{ kind: 'snapBoost', rate: 0.1 }], styles: [STYLES.might, STYLES.attach] },
    { id: 'pageSword', name: '頁の剣', from: 'bookmarkSword', conditions: [param('atk', 16), anyElement(16), key('ramuneMarble')], stats: { atk: 4 }, traits: [{ kind: 'comboBoost', rate: 0.1 }], styles: [STYLES.stretch, STYLES.guard] },
    // 寄り道①：写しの剣から。火を高く、氷と雷を低いまま（属性なしのハルトが、通常攻撃に火を乗せられる唯一の道）
    { id: 'crimsonBlade', name: '紅蓮の刃', from: 'copySword', detour: true, conditions: [param('fire', 20), low('ice', 6), low('thunder', 6), key('beigoma')], attackElement: 'fire', stats: { atk: 4 }, traits: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.ember] },
    // 寄り道②：ブレイクエッジから。雷を低いままにして、刃こぼれを抱えたまま先手を取る剣
    { id: 'strayEdge', name: '迷い刃', from: 'breakEdge', detour: true, conditions: [low('thunder', 2), key('bentSpoke')], stats: { atk: 3 }, traits: [{ kind: 'quickStart', count: 1 }], styles: [STYLES.quick, STYLES.guard] },
    legendDetour('shootingSword', 'copySword', '射的の屋台で、的を全部落とした子の剣だったという'),
    // 3回目（鍵は 2-1・2-2 の素材）
    { id: 'grandEdge', name: 'グランドエッジ', from: 'crushEdge', conditions: [param('atk', 36), key('tempoSpring')], stats: { atk: 6 }, basic: { hits: 3, partMult: 1.5 }, styles: [STYLES.might, STYLES.shatter] },
    { id: 'lanternSword', name: '走馬灯の剣', from: 'mirrorSword', conditions: [param('fire', 12), param('ice', 12), param('thunder', 12), key('glitterPen')], stats: { atk: 4 }, traits: [{ kind: 'snapBoost', rate: 0.15 }], styles: [STYLES.attach, STYLES.stretch] },
    { id: 'kaleidoSword', name: '万華鏡の剣', from: 'mirrorSword', conditions: [param('fire', 12), param('ice', 12), param('thunder', 12), param('atk', 20), key('ringtoneChip')], stats: { atk: 5 }, traits: [{ kind: 'effectBoost', rate: 0.2 }], styles: [STYLES.attach, STYLES.might] },
    { id: 'diarySword', name: '日記の剣', from: 'pageSword', conditions: [param('atk', 28), anyElement(24), key('brokenBelt')], stats: { atk: 5 }, traits: [{ kind: 'comboBoost', rate: 0.15 }, { kind: 'climaxBoost', rate: 0.1 }], styles: [STYLES.bond, STYLES.attach] },
    legendDetour('chippedSword', 'grandEdge', 'ぬしの部位を全部壊して勝つたびに、刃こぼれがひとつ増えたという'),
    // 4回目より先（まだ作っていない）
    ...beyond('grandEdge', [['天を割って、砂嵐の向こうに道を開いたという'], ['砂の山を一振りで割り、砂の道標を立てたという']]),
    ...beyond('lanternSword', [['ひと夏の思い出を、一つ残らず回して見せたという']]),
    ...beyond('kaleidoSword', [['色ガラスの向こうに、百の景色を閉じこめたという']]),
    ...beyond('diarySword', [['最後の頁は、白紙のまま残したという', '年表の最後に、まだ来ない日を書いたという']]),
  ],
};

// あかり「祈りの杖」（氷・回復）：氷（通常攻撃の回数・氷の威力）・癒し（通常攻撃で味方を回復。攻撃を低いまま）・歌（守り・エフェクト。傾向）
const rod: WeaponDef = {
  id: 'prayerRod',
  name: '祈りの杖',
  owner: 'akari',
  evolutions: [
    { id: 'iceRod', name: 'アイスロッド', conditions: [param('ice', 12), key('goldfishFin')], attackElement: 'ice', stats: { mag: 3 }, basic: { hits: 2 }, styles: [STYLES.fierce('ice'), STYLES.calm] },
    { id: 'healingRod', name: '癒しの杖', conditions: [param('ice', 6), low('atk', 4), key('cottonStick')], attackElement: 'ice', stats: { mp: 10 }, basic: { healAll: 6 }, styles: [STYLES.sage, STYLES.ember] },
    { id: 'bellRod', name: '鈴の杖', conditions: [param('ice', 6), tendency('blue')], attackElement: 'ice', stats: { def: 2 }, basic: { guardAll: 0.15 }, styles: [STYLES.bond, STYLES.guard] },
    // 2回目
    { id: 'sleetRod', name: '氷雨の杖', from: 'iceRod', conditions: [param('ice', 24), key('ramuneMarble')], attackElement: 'ice', stats: { mag: 4 }, traits: [{ kind: 'elementBoost', element: 'ice', rate: 0.1 }], styles: [STYLES.sage, STYLES.calm] },
    { id: 'mercyRod', name: '慈雨の杖', from: 'healingRod', conditions: [param('ice', 16), low('atk', 6), key('rustyBell')], attackElement: 'ice', stats: { mp: 10, mag: 2 }, traits: [{ kind: 'healBoost', rate: 0.1 }], styles: [STYLES.sage, STYLES.guard] },
    { id: 'chimeRod', name: '風鈴の杖', from: 'bellRod', conditions: [param('ice', 16), tendency('blue'), key('tornSpeaker')], attackElement: 'ice', stats: { def: 2, mag: 2 }, traits: [{ kind: 'effectBoost', rate: 0.1 }], styles: [STYLES.quick, STYLES.attach] },
    // 寄り道①：アイスロッドから。火を高く、氷を低いまま
    { id: 'ringRod', name: '炎環の杖', from: 'iceRod', detour: true, conditions: [param('fire', 20), low('ice', 14), key('menkoCard')], attackElement: 'fire', stats: { mag: 4 }, traits: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.ember] },
    // 寄り道②：アイスロッドから。火を低いままにして、少ない力で長く祈り続ける杖
    { id: 'dewRod', name: 'しずくの杖', from: 'iceRod', detour: true, conditions: [low('fire', 2), key('phoneCord')], attackElement: 'ice', stats: { mp: 12 }, traits: [{ kind: 'mpSave', amount: 1 }], styles: [STYLES.sage, STYLES.calm] },
    legendDetour('goldfishRod', 'healingRod', '金魚すくいで、ポイを破らずに十匹すくった子の杖だったという'),
    // 3回目
    { id: 'moonRod', name: '雪月の杖', from: 'sleetRod', conditions: [param('ice', 36), key('abacusFrame')], attackElement: 'ice', stats: { mag: 5 }, traits: [{ kind: 'elementBoost', element: 'ice', rate: 0.15 }], basic: { hits: 2 }, styles: [STYLES.fierce('ice'), STYLES.ember] },
    { id: 'blessRod', name: '祝福の杖', from: 'mercyRod', conditions: [param('ice', 24), low('atk', 8), key('lordGear')], attackElement: 'ice', stats: { mp: 12, mag: 3 }, basic: { healAll: 12 }, traits: [{ kind: 'healBoost', rate: 0.1 }], styles: [STYLES.bond, STYLES.ember] },
    { id: 'sunnyRod', name: '陽だまりの杖', from: 'mercyRod', conditions: [param('ice', 24), param('fire', 12), key('boomboxDial')], attackElement: 'ice', stats: { mag: 4 }, basic: { healAll: 10 }, traits: [{ kind: 'regen', rate: 0.02 }], styles: [STYLES.sage, STYLES.ember] },
    { id: 'templeBellRod', name: '鐘の杖', from: 'chimeRod', conditions: [param('ice', 28), tendency('blue'), key('cheerBand')], attackElement: 'ice', stats: { def: 3, mag: 3 }, basic: { guardAll: 0.25 }, traits: [{ kind: 'effectBoost', rate: 0.15 }], styles: [STYLES.stretch, STYLES.attach] },
    legendDetour('snowmanRod', 'blessRod', '誰も倒れずに勝つたびに、雪だるまがひとつ増えたという'),
    ...beyond('moonRod', [['月の光で、なくした名前を照らしたという'], ['初雪の朝だけ、杖が少し温かかったという']]),
    ...beyond('blessRod', [['倒れた仲間が、一度だけ花の中で目を覚ましたという']]),
    ...beyond('sunnyRod', [['冬の日なたを、そのまま持ち歩いたという']]),
    ...beyond('templeBellRod', [['祈りの鐘が鳴る間は、誰も泣かなかったという', '静かな夜に、子守唄だけが聞こえたという']]),
  ],
};

// みお「切り札のトランプ」（雷・軽い・押す）：雷（通常攻撃の回数・雷の威力）・手品（押す。傾向 黄）・早撃ち（軽い行動。雷と攻撃）
const cards: WeaponDef = {
  id: 'throwCards',
  name: '切り札のトランプ',
  owner: 'mio',
  evolutions: [
    // 1回目（鍵は 2-1 の珍しい素材。手品は、ムーブメントの開いた2章から加わるので、ギアの傾向のまま）
    { id: 'thunderCards', name: 'サンダーカード', conditions: [param('thunder', 12), key('filament')], attackElement: 'thunder', stats: { atk: 2 }, basic: { hits: 2 }, styles: [STYLES.fierce('thunder'), STYLES.calm] },
    { id: 'trickCards', name: 'トリックカード', conditions: [param('thunder', 6), tendency('yellow')], attackElement: 'thunder', stats: { atk: 1 }, basic: { push: 1 }, styles: [STYLES.bond, STYLES.attach] },
    { id: 'quickCards', name: '早撃ちのカード', conditions: [param('thunder', 6), param('atk', 6), key('masterGear')], attackElement: 'thunder', stats: { atk: 2 }, basic: { lighter: 1 }, styles: [STYLES.quick, STYLES.guard] },
    // 2回目（鍵は 2-2 の素材）
    { id: 'boltCards', name: '稲妻のカード', from: 'thunderCards', conditions: [param('thunder', 24), key('boomboxDial')], attackElement: 'thunder', stats: { atk: 3 }, traits: [{ kind: 'elementBoost', element: 'thunder', rate: 0.1 }], styles: [STYLES.might, STYLES.ember] },
    { id: 'mirageCards', name: '幻のカード', from: 'trickCards', conditions: [param('thunder', 16), tendency('yellow'), key('tornSpeaker')], attackElement: 'thunder', stats: { atk: 2 }, traits: [{ kind: 'comboBoost', rate: 0.1 }], styles: [STYLES.bond, STYLES.attach] },
    { id: 'rapidCards', name: '連射のカード', from: 'quickCards', conditions: [param('thunder', 16), param('atk', 16), key('tempoSpring')], attackElement: 'thunder', stats: { atk: 3 }, traits: [{ kind: 'lightBoost', rate: 0.1 }], styles: [STYLES.quick, STYLES.calm] },
    // 寄り道①：サンダーカードから。火を高く、雷を低いまま
    { id: 'fireworkCards', name: '花火のカード', from: 'thunderCards', detour: true, conditions: [param('fire', 20), low('thunder', 14), key('brassBolt')], attackElement: 'fire', stats: { atk: 3 }, traits: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.shatter] },
    // 寄り道②：サンダーカードから。火を低いままにして、仲間につなぐことだけを考えるカード
    { id: 'oldMaidCards', name: 'ばば抜きのカード', from: 'thunderCards', detour: true, conditions: [low('fire', 2), key('photoSticker')], attackElement: 'thunder', stats: { atk: 2 }, traits: [{ kind: 'comboBoost', rate: 0.2 }], styles: [STYLES.bond, STYLES.guard] },
    legendDetour('towerCards', 'trickCards', 'トランプで、天井まで届く塔を建てた子のカードだったという'),
    legendDetour('doodleCards', 'mirageCards', '一つの戦いで、敵の予定を十マスも後ろへ押しやったという'),
    // 3回目（鍵は 2-3 の素材）
    { id: 'raijinCards', name: '雷神のカード', from: 'boltCards', conditions: [param('thunder', 36), key('cheerBand')], attackElement: 'thunder', stats: { atk: 3 }, traits: [{ kind: 'elementBoost', element: 'thunder', rate: 0.15 }], styles: [STYLES.fierce('thunder'), STYLES.attach] },
    { id: 'magicianCards', name: '奇術師のカード', from: 'mirageCards', conditions: [param('thunder', 24), tendency('yellow'), key('scorePlate')], attackElement: 'thunder', stats: { atk: 3 }, basic: { push: 2 }, traits: [{ kind: 'pushPlus', count: 1 }], styles: [STYLES.attach, STYLES.quick] },
    { id: 'jesterCards', name: '道化のカード', from: 'mirageCards', conditions: [param('thunder', 20), param('atk', 20), key('autographBall')], attackElement: 'thunder', stats: { atk: 4 }, basic: { push: 2 }, traits: [{ kind: 'comboBoost', rate: 0.15 }], styles: [STYLES.bond, STYLES.shatter] },
    { id: 'meteorCards', name: '流れ星のカード', from: 'rapidCards', conditions: [param('thunder', 28), param('atk', 24), key('jugCap')], attackElement: 'thunder', stats: { atk: 4 }, traits: [{ kind: 'lightBoost', rate: 0.2 }], styles: [STYLES.quick, STYLES.attach] },
    ...beyond('raijinCards', [['雷を一枚のカードにして、空へ返したという'], ['鳴りやんだ拍手を、もう一度呼んだという']]),
    ...beyond('magicianCards', [['引いたカードが、いつも見たい景色だったという']]),
    ...beyond('jesterCards', [['ばらまいたカードが、町じゅうの灯になったという']]),
    ...beyond('meteorCards', [['七並べのように、流れ星を順に並べたという', '一番星より先に、夜空へ届いたという']]),
  ],
};

// 小夜子「月影」（物理・重い一撃・部位。3章の途中から加わるので Lv5 から。1回目までを加わった時に選ぶ）：月（重い一撃）・影（邪魔されなければ強い。属性を全部低いまま）・砕（部位・かたい）
const naginata: WeaponDef = {
  id: 'moonNaginata',
  name: '月影',
  owner: 'sayoko',
  startExp: 26,
  joinTier: 1,
  evolutions: [
    { id: 'crescentNaginata', name: '三日月', conditions: [param('atk', 12), key('radioEarphone')], stats: { atk: 4 }, basic: { heavy: true }, styles: [STYLES.might, STYLES.shatter] },
    { id: 'duskNaginata', name: '宵の薙刀', conditions: [param('atk', 12), low('fire', 4), low('ice', 4), low('thunder', 4), key('teacup')], stats: { atk: 3 }, basic: { fragile: 2 }, styles: [STYLES.might, STYLES.calm] },
    { id: 'breakMoonNaginata', name: '砕月', conditions: [param('atk', 12), key('trainWheel')], stats: { atk: 3 }, basic: { partMult: 1.5 }, styles: [STYLES.shatter, STYLES.might] },
    // 2回目
    { id: 'fullMoonNaginata', name: '満月', from: 'crescentNaginata', conditions: [param('atk', 24), key('postLetter')], stats: { atk: 5 }, traits: [{ kind: 'heavyBoost', rate: 0.1 }], styles: [STYLES.might, STYLES.guard] },
    { id: 'midnightNaginata', name: '夜半の薙刀', from: 'duskNaginata', conditions: [param('atk', 24), low('fire', 6), low('ice', 6), low('thunder', 6), key('coilStand')], stats: { atk: 4 }, traits: [{ kind: 'fragileBoost', rate: 0.1 }], styles: [STYLES.might, STYLES.calm] },
    { id: 'splitMoonNaginata', name: '破月', from: 'breakMoonNaginata', conditions: [param('atk', 24), key('chimneySoot')], stats: { atk: 4 }, traits: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.quick, STYLES.shatter] },
    // 寄り道①：三日月から。火を高く
    { id: 'eveNaginata', name: '宵宮の薙刀', from: 'crescentNaginata', detour: true, conditions: [param('fire', 20), key('lanternFrame')], attackElement: 'fire', stats: { atk: 4 }, traits: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.guard] },
    // 寄り道②：三日月から。雷を低いままにして、誰より先に踏みこむ薙刀
    { id: 'hazyMoonNaginata', name: '朧月', from: 'crescentNaginata', detour: true, conditions: [low('thunder', 2), key('tableLeg')], stats: { atk: 3 }, traits: [{ kind: 'quickStart', count: 1 }], styles: [STYLES.quick, STYLES.guard] },
    legendDetour('lanternNaginata', 'crescentNaginata', '祭りの射的と輪投げで、提灯を全部ともした人の薙刀だったという'),
    // 3回目
    { id: 'harvestMoonNaginata', name: '名月', from: 'fullMoonNaginata', conditions: [param('atk', 36), key('lordWhistle')], stats: { atk: 7 }, traits: [{ kind: 'heavyBoost', rate: 0.15 }], styles: [STYLES.stretch, STYLES.shatter] },
    { id: 'moonlitNaginata', name: '月下の薙刀', from: 'midnightNaginata', conditions: [param('atk', 36), low('fire', 8), low('ice', 8), low('thunder', 8), key('fanTimer')], stats: { atk: 5 }, traits: [{ kind: 'fragileBoost', rate: 0.2 }], styles: [STYLES.might, STYLES.calm] },
    { id: 'shadowStepNaginata', name: '月影踏み', from: 'midnightNaginata', conditions: [param('atk', 30), low('fire', 8), low('ice', 8), low('thunder', 8), key('payEnvelope')], stats: { atk: 4, def: 3 }, traits: [{ kind: 'fragileBoost', rate: 0.15 }], styles: [STYLES.quick, STYLES.guard] },
    { id: 'crackedMoonNaginata', name: '割れ月', from: 'splitMoonNaginata', conditions: [param('atk', 36), key('oldTicket')], stats: { atk: 5 }, basic: { pierceHard: true }, traits: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.shatter, STYLES.might] },
    legendDetour('summerNaginata', 'harvestMoonNaginata', 'ぬしの部位を全部壊して勝つたびに、夏が一つ終わったという'),
    ...beyond('harvestMoonNaginata', [['欠けない月の下で、百の夜を一度に終わらせたという'], ['月を斬って、ふたつの夜に分けたという']]),
    ...beyond('moonlitNaginata', [['月の影だけを踏んで、誰にも気づかれずに歩いたという']]),
    ...beyond('shadowStepNaginata', [['足音のない刃で、夜道を一人で帰ったという']]),
    ...beyond('crackedMoonNaginata', [['鬼灯の色の刃で、堰を切って水を流したという']]),
  ],
};

// 早瀬「精密ドライバー」（火・時間。4章から加わるので Lv7 から。2回目までを加わった時に選ぶ）：火（通常攻撃の回数・バリア）・時間（時間の技・予定を後ろへ。傾向）・職人（技の MP・魔力。攻撃を低いまま）
const driver: WeaponDef = {
  id: 'precisionDriver',
  name: '精密ドライバー',
  owner: 'hayase',
  startExp: 38,
  joinTier: 2,
  evolutions: [
    { id: 'temperDriver', name: '焼き戻しのドライバー', conditions: [param('fire', 12), key('thickStraw')], attackElement: 'fire', stats: { mag: 3 }, basic: { hits: 2 }, styles: [STYLES.fierce('fire'), STYLES.calm] },
    { id: 'secondDriver', name: '秒針のドライバー', conditions: [param('fire', 6), tendency('red')], attackElement: 'fire', stats: { mag: 3 }, traits: [{ kind: 'timeMpSave', amount: 1 }], styles: [STYLES.quick, STYLES.calm] },
    { id: 'tuningDriver', name: '調律のドライバー', conditions: [param('fire', 6), low('atk', 4), key('flowerRibbon')], attackElement: 'fire', stats: { mag: 3 }, traits: [{ kind: 'mpSave', amount: 1 }], styles: [STYLES.sage, STYLES.calm] },
    // 2回目（鍵は 4-1 の素材）
    { id: 'forgeDriver', name: '鍛冶のドライバー', from: 'temperDriver', conditions: [param('fire', 24), key('cageStrap')], attackElement: 'fire', stats: { mag: 4 }, traits: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.guard] },
    { id: 'pendulumDriver', name: '振り子のドライバー', from: 'secondDriver', conditions: [param('fire', 16), tendency('red'), key('waterTank')], attackElement: 'fire', stats: { mag: 3, mp: 6 }, traits: [{ kind: 'timeMpSave', amount: 1 }], styles: [STYLES.quick, STYLES.attach] },
    { id: 'masterDriver', name: '名工のドライバー', from: 'tuningDriver', conditions: [param('fire', 16), low('atk', 6), key('fireworkPaper')], attackElement: 'fire', stats: { mag: 4, mp: 6 }, styles: [STYLES.sage, STYLES.calm] },
    // 寄り道①②：焼き戻しのドライバーから。氷を高く／雷を高く（火を低いまま）
    { id: 'coolDriver', name: '冷やしのドライバー', from: 'temperDriver', detour: true, conditions: [param('ice', 20), low('fire', 14), key('crackedLens')], attackElement: 'ice', stats: { mag: 4 }, traits: [{ kind: 'elementBoost', element: 'ice', rate: 0.1 }], styles: [STYLES.fierce('ice'), STYLES.guard] },
    { id: 'currentDriver', name: '電流のドライバー', from: 'temperDriver', detour: true, conditions: [param('thunder', 20), low('fire', 14), key('earbudTip')], attackElement: 'thunder', stats: { mag: 4 }, traits: [{ kind: 'elementBoost', element: 'thunder', rate: 0.1 }], styles: [STYLES.fierce('thunder'), STYLES.calm] },
    legendDetour('karakuriDriver', 'tuningDriver', '止まった時計を百個直した人の、からくりのドライバーだったという'),
    legendDetour('oilDriver', 'secondDriver', '一つの戦いで、敵の行動を三度も空振りさせたという'),
    // 3回目（鍵は 4-1 のレア・部位・ぬしの素材）
    { id: 'kilnDriver', name: '窯のドライバー', from: 'forgeDriver', conditions: [param('fire', 36), key('sparklerBead')], attackElement: 'fire', stats: { mag: 5 }, basic: { heavy: true }, traits: [{ kind: 'elementBoost', element: 'fire', rate: 0.15 }], styles: [STYLES.fierce('fire'), STYLES.attach] },
    { id: 'furnaceDriver', name: '炉のドライバー', from: 'forgeDriver', conditions: [param('fire', 30), param('atk', 16), key('hatBrim')], attackElement: 'fire', stats: { mag: 6 }, basic: { heavy: true }, styles: [STYLES.might, STYLES.calm] },
    { id: 'springDriver', name: 'ぜんまいのドライバー', from: 'pendulumDriver', conditions: [param('fire', 28), tendency('red'), key('lordStrawHat')], attackElement: 'fire', stats: { mag: 4 }, basic: { push: 1 }, styles: [STYLES.quick, STYLES.attach] },
    { id: 'artisanDriver', name: '匠のドライバー', from: 'masterDriver', conditions: [param('fire', 28), low('atk', 8), key('radioCard')], attackElement: 'fire', stats: { mag: 6 }, traits: [{ kind: 'mpSave', amount: 1 }], styles: [STYLES.sage, STYLES.calm] },
    ...beyond('kilnDriver', [['冷えきった町の時計を、ひと晩で全部あたため直したという']]),
    ...beyond('furnaceDriver', [['炉の火で、止まった秒針をもう一度打ち直したという']]),
    ...beyond('springDriver', [['一本の火花で、百の時計を同時に動かしたという', '雷を、ぜんまいの中にしまったという']]),
    ...beyond('artisanDriver', [['直せない時計は、ひとつもなかったという', '最後の一本は、弟子に渡したという']]),
  ],
};

export const WEAPON_DATA: WeaponData = {
  weapons: { [sword.id]: sword, [rod.id]: rod, [cards.id]: cards, [naginata.id]: naginata, [driver.id]: driver },
  fragments: FRAGMENTS,
  items: ITEMS,
  // 経験値 4 で Lv2、8 で Lv3（1人が戦闘1回で行動するのは3回前後なので、だいたい戦闘3つで Lv3）。
  // 段階42：2回目・3回目の進化のために Lv7 まで伸ばした（だいたい1つの区画で2レベル）
  levelExp: [4, 8, 16, 26, 38, 52],
  // 1回目は Lv3、2回目は Lv5、3回目より先は Lv7
  evolveLevels: [3, 5, 7],
  elementRate: 0.02,
  // 進化1回で盤に足すマス（段階111。テストプレイのメモ 24：2マスでは増えすぎたので1マス）
  boardExtension: 1,
  // 段階27b：刻印（累計）。Lv1 で6、Lv2 で12、Lv3 で18。段階42：Lv4 から1レベルで4つずつ
  slotsPerLevel: [6, 12, 18, 22, 26, 30, 34],
  // 時分解は、素材・アイテム2つで記憶の欠片1つ（要らない素材の整理。素材のまま刻む方が強い）
  decomposeCost: 2,
  fragmentFor: { atk: FRAGMENTS.courage.id, fire: FRAGMENTS.elation.id, ice: FRAGMENTS.relief.id, thunder: FRAGMENTS.wonder.id },
};

/**
 * 時分解を出したことを覚える物語の変数（段階100c）。武器の画面の時分解は、どれかの武器の刻印が初めていっぱいになった時か、
 * 交換所を初めて開いた時（ペトラが時分解を教える）の、早い方から出す
 */
export const DECOMPOSE_VAR = '武器:時分解';
export const WEAPON_STYLES = STYLES;
