import type { BondEvent, DailyHub, DailyPlace, DailyPlaceInfo, DailySpot, ReturnVisit } from '../core/daily';

// 昼の日常（段階24）。物語の流れ（story.ts の SLICE_FLOW）の daily の出来事ごとに、場所と印を書く。
// 印の id は、会話の場面がある時は場面の id と同じにする（見たかどうかを、この id でセーブに覚える）。
// 位置は 390×844 の座標（場所の絵の上の印、地図の上の場所）
// 段階35：町の地図の場所は TOWN に1つずつ書き、どの日も同じ位置に出す。絆の出来事は BOND_EVENTS（相手ごとの続きもの）
// 段階36：返した翌日に持ち主に会う出来事は RETURN_VISITS（区画ごと。返した次の日の昼に、必ず見る出来事として出る）

/** 町の地図の場所（段階35）。地図は格子の道で、場所は列（x）と行（y）の交わる所に置く */
export const TOWN: Record<string, DailyPlaceInfo> = {
  school: { id: 'school', name: '学校', backdrop: 'classroom', mapX: 85, mapY: 200 },
  river_path: { id: 'river_path', name: '川沿いの道', backdrop: 'river_path', mapX: 195, mapY: 200 },
  riverside: { id: 'riverside', name: '河川敷', backdrop: 'riverside_ground', mapX: 305, mapY: 200 },
  music_shop: { id: 'music_shop', name: '楽器店', backdrop: 'music_shop', mapX: 85, mapY: 330 },
  home: { id: 'home', name: '施設', backdrop: 'home_kitchen', mapX: 305, mapY: 330 },
  factory: { id: 'factory', name: '工場', backdrop: 'factory_now', mapX: 85, mapY: 460 },
  street: { id: 'street', name: '商店街', backdrop: 'shopping_street', mapX: 195, mapY: 460 },
  bakery: { id: 'bakery', name: 'パン屋', backdrop: 'bakery', mapX: 305, mapY: 460 },
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
/** 必ず見る出来事（after：先に見ておく印。段階36の「工場の後に楽器店」） */
const main = (id: string, label: string, y = ROW1, after?: string): DailySpot => ({ id, scene: id, label, mark: 'main', x: 195, y, required: true, after });
/** 小話 */
const talk = (id: string, label: string, y = ROW1): DailySpot => ({ id, scene: id, label, mark: 'talk', x: 195, y });

/**
 * レストピアの拠点の入口（段階50。段階43の狩りの入口から替えた）：時計屋の「時計屋の奥へ（レストピア）」。
 * 返した区画が1つでもあれば、どの日の昼にも出る。昼に選べる回数は使わず、時間も進まない。押すと拠点の画面（狩り・育成など）
 */
export const HUB_SPOT: { place: string; spot: DailySpot } = {
  place: 'clockshop',
  spot: { id: 'restopia', label: '時計屋の奥へ（レストピア）', mark: 'hub', x: 195, y: 660 },
};

/**
 * 拠点に入った時に、まだ見ていなければ先に見せる会話（段階50）。after は、その出来事より後の時だけ。
 * 見たかどうかは、日常の印と同じく物語で覚えた値（見た:場面の id）に入れる
 */
/** 拠点の入口を出す章（段階60。1章の終わりの会話で入口の脇の砂時計に気づき、2章の昼から入れる） */
export const HUB_FROM_CHAPTER = 2;

export const HUB_SCENES: { scene: string; after?: string }[] = [
  // 初めて拠点に入った時：自分たちの記憶の棚
  { scene: 'hub_intro' },
  // 2-3「最後の打席」を持ち去られた後：取り返してから入ると決める
  { scene: 'hub_taken', after: 'd7_taken' },
];

/** 昼に選べる回数（段階35。docs/milestones/M2.md の「決まったこと」） */
export const DAILY_PICKS = 2;

/**
 * 絆の出来事（段階35）。相手ごとに順番に並べる。まだ見ていない一番前のものが、会える日に、その場所に出る。
 * 見なかった出来事は、次の日も同じ所から続く。from は「何日目から」（先の出来事が早く出ないように）
 */
export const BOND_EVENTS: Record<string, BondEvent[]> = {
  akari: [
    { id: 'd1_rooftop', title: 'シャッター、ハルトが言って', label: '屋上へ（あかり）', from: 1, place: 'school', x: 195, y: 330 },
    { id: 'bond_akari2', title: '消せない写真', label: '屋上へ（あかり）', from: 5, place: 'school', x: 195, y: ROW1 },
    { id: 'bond_akari3', title: 'りくのいない帰り道', label: '帰り道（あかり）', from: 7, place: 'river_path', x: 195, y: ROW1 },
    { id: 'bond_akari4', title: '最初の五分', label: '施設の居間（あかり）', from: 8, place: 'home', x: 195, y: ROW1 },
    // 段階82（docs/script/2-2_rework.md の 4.）
    { id: 'bond_akari5', title: '出し物、決まらない', label: '教室（あかり）', from: 12, place: 'school', x: 195, y: ROW1 },
  ],
  // 段階82：みお1は9日目から、みお2は11日目から（段階78で後ろへずらしたのを、昼の選び方の案Aに合わせて戻した）
  mio: [
    { id: 'bond_mio1', title: '助っ人のみお', label: 'グラウンド（みお）', from: 9, place: 'riverside', x: 195, y: ROW1 },
    { id: 'bond_mio2', title: 'あとで一緒に食べよう', label: 'コンビニ（みお）', from: 11, place: 'convenience', x: 195, y: ROW1 },
    { id: 'bond_mio3', title: '弟子入り一日目', label: '工場（みお）', from: 12, place: 'factory', x: 195, y: ROW1 },
  ],
};

/**
 * 返した翌日に持ち主に会う出来事（段階36）。区画の時間を返した次の日の昼に、その場所に必ず見る出来事として出る。
 * 返したかどうかは、返した記録（セーブの returned）と物語の流れから決める（flow.ts の returnDays）。脚本は docs/script/M2.md
 */
export const RETURN_VISITS: ReturnVisit[] = [
  // 1-1 の翌日のゆうまの電話は、段階63から物語の流れの会話（4日目の朝の d4_yuma。docs/script/1-1_rework.md の 4-A）
  // 1-2 の翌日のふみさんは、段階66から物語の流れの会話（7日目の朝の d4_fumi。docs/script/1-2_rework.md の 7-A）
  // 2-1 の翌日（11日目。段階78）：いさむの工場（docs/script/2-1_rework.md の 11-A。段階39）。いさむが最後に削った歯車をくれる（「一個じゃ、回らんからな」なので、バトンレシーバー）
  { area: 'a21', id: 'd6_isamu', label: 'いさむの工場', place: 'factory', x: 195, y: ROW1, gears: ['batonReceiver'] },
  // 2-2 の翌日（15日目。段階82）：閉店後の楽器店で、けんたたち3人（docs/script/2-2_rework.md の 15-A。段階39b）
  { area: 'a22', id: 'd7_kenta', label: '閉店後の楽器店', place: 'music_shop', x: 195, y: ROW1 },
];

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
  // 2日目の昼（段階63。docs/script/1-1_rework.md の 2-C）。コンビニのゆうま（少し思い出す）と、店の前の少女は必ず見る。見たら、時計屋へ行ける
  d2_free: {
    id: 'd2_free',
    time: '2日目　放課後',
    day: 2,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('convenience', main('d2_store', 'コンビニのゆうま')), at('clockshop', toDusk('d2_to_dusk'))],
  },
  // 3日目の昼（段階63。3-B）。商店街で、ひなのに会うのは必ず見る。見たら、帰り道へ（帰り道とコンビニの前の会話の後、夕暮れの縁日へ）
  a11_day3_free: {
    id: 'a11_day3_free',
    time: '3日目　放課後',
    day: 3,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [
      at('street', main('d3_hinano', 'コンビニの前の少女')),
      at('river_path', { id: 'a11_d3_home', label: '帰り道へ（夕方になる）', mark: 'go', x: 195, y: ROW_GO, ends: true, confirm: '帰り道へ行くと、夕方になります。\n行きますか？' }),
    ],
  },
  // ---- 3日目〜8日目の昼（段階35。脚本 docs/script/M2.md の 3-B・4-A・5-B・6-A・7-A・8-B） ----
  // 返す前の持ち主に会う場面は、まだ仮の場面（台本の @note。区画の段階で入れる。3日目のふみさんは段階37で入れた）。返した翌日の場面は RETURN_VISITS から出る（段階36）。
  // 6日目・7日目は、返した翌日の持ち主の後に、次の持ち主（after）
  d3_free: {
    id: 'd3_free',
    time: '4日目　放課後',
    day: 4,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('clockshop', main('d3_fumi', '店番（ふみさん）'), toDusk('d3_to_dusk'))],
  },
  // 5日目の昼（段階66。5-B・5-C）。電器屋のしげるさんは必ず見る。見たら、帰り道へ（ふみさんの家の前の会話の後、夕暮れの商店街へ）
  a12_day5_free: {
    id: 'a12_day5_free',
    time: '5日目　放課後',
    day: 5,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [
      at('school', talk('d3_talk', '教室（小話）', ROW2)),
      at('street', main('d5_shigeru', '電器屋のしげるさん')),
      at('river_path', { id: 'a12_d5_home', label: '帰り道へ（夕方になる）', mark: 'go', x: 195, y: ROW_GO, ends: true, confirm: '帰り道へ行くと、夕方になります。\n行きますか？' }),
    ],
  },
  d4_free: {
    id: 'd4_free',
    time: '7日目　放課後',
    day: 7,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('convenience', talk('d4_talk', 'コンビニ（小話）', ROW2)), at('clockshop', toDusk('d4_to_dusk'))],
  },
  d5_free: {
    id: 'd5_free',
    time: '8日目　放課後',
    day: 8,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('school', talk('d5_talk', '教室（小話）', ROW2)), at('clockshop', main('d5_isamu', '最後の納品'), toDusk('d5_to_dusk'))],
  },
  // 9日目の昼（段階78。docs/script/2-1_rework.md の 9-A・9-B）。工場の片付けと、その後の松の湯のすみさんは必ず見る
  a21_day9_free: {
    id: 'a21_day9_free',
    time: '9日目　放課後',
    day: 9,
    picks: DAILY_PICKS,
    // 段階82：みお1と小話を足した（docs/script/2-2_rework.md の「2-1 の日に足す選べる話」）。小話はその日だけ
    partners: ['akari', 'mio'],
    places: [
      at('factory', main('d9_factory', '工場の片付け')),
      at('street', main('d9_sumi', '松の湯のすみさん', ROW1, 'd9_factory')),
      at('home', talk('d9_talk_snow', '台所（小話）', ROW2)),
      at('clockshop', talk('d9_talk_memo', '店の中（小話）'), toDusk('a21_d9_to_dusk')),
    ],
  },
  // 10日目の昼（段階78。10-B）。工場のいさむさんは必ず見る（みおは町内会の手伝いで遅れる）
  a21_day10_free: {
    id: 'a21_day10_free',
    time: '10日目　放課後',
    day: 10,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('factory', main('d10_isamu', 'いさむさん')),
      at('street', talk('d10_talk_radio', '電器屋の前（小話）', ROW2)),
      at('home', talk('d10_talk_erai', '台所（小話）', ROW2)),
      at('convenience', talk('d10_talk_yuma', 'レジ（小話）', ROW2)),
      at('clockshop', toDusk('a21_d10_to_dusk')),
    ],
  },
  // 11日目（段階78。話の間の日）：2-1 を返した翌日のいさむの工場（RETURN_VISITS）。夕暮れは蔵書の棚で、夜は記憶に入らない
  d6_free: {
    id: 'd6_free',
    time: '11日目　放課後',
    day: 11,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [at('clockshop', talk('d6_talk', '店の中（小話）'), talk('d11_talk_nebosuke', '店の奥（小話）', ROW2), toDusk('d6_to_dusk'))],
  },
  // 12日目（段階82。docs/script/2-2_rework.md の 12-A）：楽器店のけんたは必ず見る。夕暮れの後、2-2 の1晩目
  d12_free: {
    id: 'd12_free',
    time: '12日目　放課後',
    day: 12,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('music_shop', main('d6_kenta', '楽器店のけんた')),
      at('school', talk('d12_talk_rumor', '廊下（小話）', ROW2)),
      at('clockshop', toDusk('d12_to_dusk')),
    ],
  },
  // 13日目（13-A）：病院の帰り道のさきは必ず見る。夕暮れの後、2晩目
  a22_day13_free: {
    id: 'a22_day13_free',
    time: '13日目　放課後',
    day: 13,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('river_path', main('d13_saki', '病院の帰り道')),
      at('school', talk('d13_talk_seat', '教室（小話）', ROW2)),
      at('street', talk('d13_talk_poster', '掲示板（小話）', ROW2)),
      at('clockshop', toDusk('a22_d13_to_dusk')),
    ],
  },
  // 14日目（14-A）：楽器店のけんたの本音は必ず見る。夕暮れの後、3晩目
  a22_day14_free: {
    id: 'a22_day14_free',
    time: '14日目　放課後',
    day: 14,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('music_shop', main('d14_kenta', '売約済み')),
      at('home', talk('d14_talk_tickets', '居間（小話）', ROW2)),
      at('clockshop', talk('d14_talk_letter', '店の中（小話）'), toDusk('a22_d14_to_dusk')),
    ],
  },
  // 15日目（段階82。話の間の日）：2-2 を返した翌日のけんたたち（RETURN_VISITS）。夕暮れは交換所のペトラで、夜は記憶に入らない
  d15_free: {
    id: 'd15_free',
    time: '15日目　土曜の昼',
    day: 15,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('street', talk('d15_talk_takoyaki', '屋台（小話）', ROW2)),
      at('clockshop', talk('d7_talk', '店の中（小話）'), toDusk('d15_to_dusk')),
    ],
  },
  // 16日目（段階82で13日目から移した）：パン屋の親子は必ず見る。夕暮れの後、2-3
  d7_free: {
    id: 'd7_free',
    time: '16日目　放課後',
    day: 16,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [at('bakery', main('d7_bakery', 'パン屋の親子')), at('clockshop', toDusk('d7_to_dusk'))],
  },
  d8_free: {
    id: 'd8_free',
    time: '17日目　放課後',
    day: 17,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('bakery', main('d8_bakery', '知っているのに')),
      at('home', talk('d8_talk', '台所（小話）', ROW2)),
      at('clockshop', toDusk('d8_to_dusk')),
    ],
  },
};
