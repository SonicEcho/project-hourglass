import type { BondEvent, DailyHub, DailyPlace, DailyPlaceInfo, DailySpot } from '../core/daily';

// 昼の日常（段階24）。物語の流れ（story.ts の SLICE_FLOW）の daily の出来事ごとに、場所と印を書く。
// 印の id は、会話の場面がある時は場面の id と同じにする（見たかどうかを、この id でセーブに覚える）。
// 位置は 390×844 の座標（場所の絵の上の印、地図の上の場所）
// 段階35：町の地図の場所は TOWN に1つずつ書き、どの日も同じ位置に出す。絆の出来事は BOND_EVENTS（相手ごとの続きもの）

/** 町の地図の場所（段階35）。地図は格子の道で、場所は列（x）と行（y）の交わる所に置く */
export const TOWN: Record<string, DailyPlaceInfo> = {
  school: { id: 'school', name: '学校', backdrop: 'classroom', mapX: 85, mapY: 200 },
  river_path: { id: 'river_path', name: '川沿いの道', backdrop: 'river_path', mapX: 195, mapY: 200 },
  riverside: { id: 'riverside', name: '河川敷', backdrop: 'riverside_ground', mapX: 305, mapY: 200 },
  music_shop: { id: 'music_shop', name: '楽器店', backdrop: 'shopping_street', mapX: 85, mapY: 330 },
  home: { id: 'home', name: '施設', backdrop: 'home_kitchen', mapX: 305, mapY: 330 },
  factory: { id: 'factory', name: '工場', backdrop: 'shopping_street', mapX: 85, mapY: 460 },
  street: { id: 'street', name: '商店街', backdrop: 'shopping_street', mapX: 195, mapY: 460 },
  bakery: { id: 'bakery', name: 'パン屋', backdrop: 'shopping_street', mapX: 305, mapY: 460 },
  convenience: { id: 'convenience', name: 'コンビニ', backdrop: 'convenience_store', mapX: 85, mapY: 590 },
  clockshop: { id: 'clockshop', name: '時計屋', backdrop: 'clock_shop', mapX: 305, mapY: 590 },
};

/** 町の地図の場所に、印を置く */
const at = (id: keyof typeof TOWN, ...spots: DailySpot[]): DailyPlace => ({ ...TOWN[id], spots });

/** 場所の絵の上の印の位置（上から1つめ・2つめ。日を進める「→」は下） */
const ROW1 = 300;
const ROW2 = 470;
const ROW_GO = 560;

/** 時計屋の「→」（夕暮れになる） */
const toDusk = (id: string, label = '時計屋の奥へ（夕暮れになる）'): DailySpot => ({
  id,
  label,
  mark: 'go',
  x: 195,
  y: ROW_GO,
  ends: true,
  confirm: '時計屋へ行くと、夕暮れになります。\n行きますか？',
});
/** 必ず見る出来事 */
const main = (id: string, label: string, y = ROW1): DailySpot => ({ id, scene: id, label, mark: 'main', x: 195, y, required: true });
/** 小話 */
const talk = (id: string, label: string, y = ROW1): DailySpot => ({ id, scene: id, label, mark: 'talk', x: 195, y });

/** 昼に選べる回数（段階35。docs/milestones/M2.md の「決まったこと」） */
export const DAILY_PICKS = 2;

/**
 * 絆の出来事（段階35）。相手ごとに順番に並べる。まだ見ていない一番前のものが、会える日に、その場所に出る。
 * 見なかった出来事は、次の日も同じ所から続く。from は「何日目から」（先の出来事が早く出ないように）
 */
export const BOND_EVENTS: Record<string, BondEvent[]> = {
  akari: [
    { id: 'd1_rooftop', title: 'シャッター、ハルトが言って', label: '屋上へ（あかり）', from: 1, place: 'school', x: 195, y: 330 },
    { id: 'bond_akari2', title: '消せない写真', label: '屋上へ（あかり）', from: 3, place: 'school', x: 195, y: ROW1 },
    { id: 'bond_akari3', title: 'りくのいない帰り道', label: '帰り道（あかり）', from: 4, place: 'river_path', x: 195, y: ROW1 },
    { id: 'bond_akari4', title: '最初の五分', label: '施設の居間（あかり）', from: 5, place: 'home', x: 195, y: ROW1 },
  ],
  mio: [
    { id: 'bond_mio1', title: '助っ人のみお', label: 'グラウンド（みお）', from: 6, place: 'riverside', x: 195, y: ROW1 },
    { id: 'bond_mio2', title: 'あとで一緒に食べよう', label: 'コンビニ（みお）', from: 7, place: 'convenience', x: 195, y: ROW1 },
  ],
};

/** 絆の相手の名前（地図の下の「絆」に出す） */
export const BOND_PARTNER_NAMES: Record<string, string> = { akari: 'あかり', mio: 'みお' };

export const DAILY_HUBS: Record<string, DailyHub> = {
  // プロローグの屋台めぐり（docs/script/M1.md の P-3）。4つ全部回ると、石段の上へ
  prologue_stalls: {
    id: 'prologue_stalls',
    time: 'あの夏　夕方の参道',
    plan: 'けいかくひょう',
    finishWhenRequiredSeen: true,
    places: [
      {
        id: 'sando',
        name: '参道（屋台の並び）',
        backdrop: 'shrine_stalls',
        mapX: 195,
        mapY: 300,
        spots: [
          { id: 'prologue_apple', scene: 'prologue_apple', label: 'りんご飴', planLabel: 'りんごあめ', mark: 'stall', x: 92, y: 250, required: true },
          { id: 'prologue_shooting', scene: 'prologue_shooting', label: '射的', planLabel: 'しゃてき', mark: 'stall', x: 300, y: 300, required: true },
          { id: 'prologue_mask', scene: 'prologue_mask', label: 'お面', planLabel: 'おめん', mark: 'stall', x: 84, y: 420, required: true },
          { id: 'prologue_goldfish', scene: 'prologue_goldfish', label: '金魚すくい', planLabel: 'きんぎょすくい', mark: 'stall', x: 304, y: 470, required: true },
        ],
      },
    ],
  },
  // 1日目の自由な時間（1-D）。屋上（絆の出来事・あかり1）と施設（小話）はどちらも見なくてよい。時計屋へ行くと夕暮れになる。
  // 段階35：屋上は絆の出来事（BOND_EVENTS）から出す。昼に選べるのは2回（両方見ると夕暮れへ）
  d1_free: {
    id: 'd1_free',
    time: '1日目　放課後',
    day: 1,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [
      at('home', { id: 'd1_home', scene: 'd1_home', label: '台所（小話）', mark: 'talk', x: 195, y: 360 }),
      at('clockshop', {
        id: 'd1_to_dusk',
        label: 'アルバイトへ（夕暮れになる）',
        mark: 'go',
        x: 195,
        y: 400,
        ends: true,
        confirm: '時計屋のアルバイトへ行くと、夕暮れになります。\n行きますか？',
      }),
    ],
  },
  // 2日目の昼（2-B）。商店街のコンビニは必ず見る。見たら、時計屋へ行ける
  d2_free: {
    id: 'd2_free',
    time: '2日目　放課後',
    places: [
      at('street', { id: 'd2_store', scene: 'd2_store', label: 'コンビニの前', mark: 'main', x: 195, y: 360, required: true }),
      at('clockshop', { ...toDusk('d2_to_dusk'), y: 400 }),
    ],
  },
  // ---- 3日目〜8日目の昼（段階35。脚本 docs/script/M2.md の 3-B・4-A・5-B・6-A・7-A・8-B） ----
  // 必ず見る出来事（持ち主に会う場面）は、まだ仮の場面（台本の @note）。返した翌日は段階36、返す前の持ち主は区画の段階で入れる
  d3_free: {
    id: 'd3_free',
    time: '3日目　放課後',
    day: 3,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('school', talk('d3_talk', '教室（小話）', ROW2)), at('clockshop', main('d3_fumi', '常連のふみさん'), toDusk('d3_to_dusk'))],
  },
  d4_free: {
    id: 'd4_free',
    time: '4日目　放課後',
    day: 4,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('convenience', talk('d4_talk', 'コンビニ（小話）', ROW2)), at('clockshop', main('d4_fumi', '来る日じゃないのに'), toDusk('d4_to_dusk'))],
  },
  d5_free: {
    id: 'd5_free',
    time: '5日目　放課後',
    day: 5,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('school', talk('d5_talk', '教室（小話）', ROW2)), at('clockshop', main('d5_isamu', '最後の納品'), toDusk('d5_to_dusk'))],
  },
  d6_free: {
    id: 'd6_free',
    time: '6日目　放課後',
    day: 6,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('factory', main('d6_isamu', 'いさむの工場')),
      at('music_shop', main('d6_kenta', '楽器店のけんた')),
      at('clockshop', talk('d6_talk', '店の中（小話）'), toDusk('d6_to_dusk')),
    ],
  },
  d7_free: {
    id: 'd7_free',
    time: '7日目　放課後',
    day: 7,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('music_shop', main('d7_kenta', '閉店後の楽器店')),
      at('bakery', main('d7_bakery', 'パン屋の親子')),
      at('clockshop', talk('d7_talk', '店の中（小話）'), toDusk('d7_to_dusk')),
    ],
  },
  d8_free: {
    id: 'd8_free',
    time: '8日目　土曜の昼',
    day: 8,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('bakery', main('d8_bakery', '知っているのに')),
      at('home', talk('d8_talk', '台所（小話）', ROW2)),
      at('clockshop', toDusk('d8_to_dusk')),
    ],
  },
};
