import type { BondEvent, BondPoints, DailyHub, DailyPlace, DailyPlaceInfo, DailySpot, ReturnVisit } from '../core/daily';

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
  // 段階88（3-1）：ひだまり荘と、町の駅
  care_home: { id: 'care_home', name: 'ひだまり荘', backdrop: 'care_home', mapX: 195, mapY: 330 },
  station: { id: 'station', name: '駅', backdrop: 'station_now', mapX: 195, mapY: 590 },
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
/** 絆の相手の名前（地図の下の「絆」と、小話の印の名前に出す） */
export const BOND_PARTNER_NAMES: Record<string, string> = { akari: 'あかり', mio: 'みお', sayoko: '小夜子' };

/**
 * 小話（where は場所の中の所。with は話の中心の仲間。段階83：その日に見た時だけ、その仲間の♥を半分足す。印の名前に相手を出す）。
 * どちらとも言えない話（二人とも少しずつ、仲間が出ない）には with を書かない
 */
const talk = (id: string, where: string, y = ROW1, partner?: string): DailySpot => ({
  id,
  scene: id,
  label: partner ? `${where}（小話・${BOND_PARTNER_NAMES[partner]}）` : `${where}（小話）`,
  mark: 'talk',
  x: 195,
  y,
  ...(partner ? { with: partner } : {}),
});

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

// 段階85：before は、その出来事より前の時だけ（取り返して返した後は、持ち去られた後の会話を出さない）
export const HUB_SCENES: { scene: string; after?: string; before?: string }[] = [
  // 初めて拠点に入った時：自分たちの記憶の棚
  { scene: 'hub_intro' },
  // 2-3「最後の打席」を持ち去られた後：取り返してから入ると決める
  { scene: 'hub_taken', after: 'd7_taken', before: 'a23_return' },
];

/** 絆の点の重み（段階83。docs/design/daily.md の 4-2）：絆の出来事1つで2点（♥1つ）、その日に見た小話1つで1点（♥半分） */
export const BOND_POINTS: BondPoints = { event: 2, talk: 1 };

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
    // 段階85（docs/script/2-3_rework.md の 4.）
    { id: 'bond_akari6', title: '時計の博物館', label: '教室（あかり）', from: 17, place: 'school', x: 195, y: ROW1 },
    // 段階88（docs/script/3-1.md の 4.）。22日目の学校は文化祭の印が並ぶので、下の段
    { id: 'bond_akari7', title: 'お弁当対決', label: '屋上へ（あかり）', from: 21, place: 'school', x: 195, y: ROW2 },
    // 段階94（docs/script/3-2.md の 4.）
    { id: 'bond_akari8', title: 'いつもの場所', label: '商店街の角（あかり）', from: 27, place: 'street', x: 195, y: ROW2 },
    // 段階96（docs/script/3-kai.md の 4.）
    { id: 'bond_akari9', title: '目覚まし三つ', label: '屋上へ（あかり）', from: 31, place: 'school', x: 195, y: ROW2 },
  ],
  // 段階82：みお1は9日目から、みお2は11日目から（段階78で後ろへずらしたのを、昼の選び方の案Aに合わせて戻した）
  mio: [
    { id: 'bond_mio1', title: '助っ人のみお', label: 'グラウンド（みお）', from: 9, place: 'riverside', x: 195, y: ROW1 },
    { id: 'bond_mio2', title: 'あとで一緒に食べよう', label: 'コンビニ（みお）', from: 11, place: 'convenience', x: 195, y: ROW1 },
    { id: 'bond_mio3', title: '弟子入り一日目', label: '工場（みお）', from: 12, place: 'factory', x: 195, y: ROW1 },
    { id: 'bond_mio4', title: '素振りの相手', label: 'グラウンド（みお）', from: 16, place: 'riverside', x: 195, y: ROW1 },
    // 段階88（docs/script/3-1.md の 4.）
    { id: 'bond_mio5', title: '宿題、三分', label: '作業台（みお）', from: 21, place: 'clockshop', x: 195, y: ROW2 },
    // 段階94（docs/script/3-2.md の 4.）。商店街の下の段はあかり8なので、もう一つ下
    { id: 'bond_mio6', title: '大食い大会', label: '福引のテントの横（みお）', from: 27, place: 'street', x: 195, y: 640 },
    // 段階96（docs/script/3-kai.md の 4.）
    { id: 'bond_mio7', title: 'ハヤテ号', label: '駐輪場（みお）', from: 31, place: 'street', x: 195, y: 640 },
  ],
  // 段階94：小夜子（26日目に今の町へ出た後。27日目から）。時計屋の奥の入口の部屋と、商店街
  sayoko: [
    { id: 'bond_sayoko1', title: 'はじめての昨日', label: '入口の部屋（小夜子）', from: 27, place: 'clockshop', x: 195, y: 385 },
    { id: 'bond_sayoko2', title: '試着室', label: '洋服屋の前（小夜子）', from: 29, place: 'street', x: 195, y: 560 },
    // 段階96（docs/script/3-kai.md の 4.）。32日目の雨の店先
    { id: 'bond_sayoko3', title: '雨の日', label: '店先（小夜子）', from: 32, place: 'clockshop', x: 195, y: 385 },
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
  // 2-3 の翌日（21日目。段階85・103）：祝日の河川敷で、そうたの準決勝（docs/script/2-3_rework.md の 20-A）。河川敷の上の段は、みおの絆の出来事
  { area: 'a23', id: 'd20_koji', label: 'そうたの準決勝', place: 'riverside', x: 195, y: ROW2 },
  // 3-1 の翌日（25日目。段階88。段階103 で日の数字が1つずれた）：町の駅で、ちよさんがのぼるさんを見送る（docs/script/3-1.md の 24-A）
  { area: 'a31', id: 'd24_chiyo', label: '駅の見送り', place: 'station', x: 195, y: ROW1 },
  // 3-2 の翌日（31日目。段階94。段階103 で日の数字が1つずれた）：店長が彫った時計を持って、駅の近くの踏切で、しおりさんがとうやさんを見送る（docs/script/3-2.md の 30-A・30-B）
  { area: 'a32', id: 'd30_shiori', label: '駅の近くの踏切', place: 'station', x: 195, y: ROW1 },
];


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
      at('home', talk('d1_home', '台所', 360, 'akari')),
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
      at('school', talk('d3_talk', '教室', ROW2, 'akari')),
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
    places: [at('convenience', talk('d4_talk', 'コンビニ', ROW2, 'akari')), at('clockshop', toDusk('d4_to_dusk'))],
  },
  d5_free: {
    id: 'd5_free',
    time: '8日目　放課後',
    day: 8,
    picks: DAILY_PICKS,
    partners: ['akari'],
    places: [at('school', talk('d5_talk', '教室', ROW2, 'akari')), at('clockshop', main('d5_isamu', '最後の納品'), toDusk('d5_to_dusk'))],
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
      at('home', talk('d9_talk_snow', '台所', ROW2, 'akari')),
      at('clockshop', talk('d9_talk_memo', '店の中'), toDusk('a21_d9_to_dusk')),
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
      at('street', talk('d10_talk_radio', '電器屋の前', ROW2, 'akari')),
      at('home', talk('d10_talk_erai', '台所', ROW2, 'akari')),
      at('convenience', talk('d10_talk_yuma', 'レジ', ROW2)),
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
    places: [at('clockshop', talk('d6_talk', '店の中', ROW1, 'mio'), talk('d11_talk_nebosuke', '店の奥', ROW2, 'mio'), toDusk('d6_to_dusk'))],
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
      at('school', talk('d12_talk_rumor', '廊下', ROW2, 'akari')),
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
      at('school', talk('d13_talk_seat', '教室', ROW2, 'akari')),
      at('street', talk('d13_talk_poster', '掲示板', ROW2, 'mio')),
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
      at('home', talk('d14_talk_tickets', '居間', ROW2, 'akari')),
      at('clockshop', talk('d14_talk_letter', '店の中'), toDusk('a22_d14_to_dusk')),
    ],
  },
  // 15日目（段階82。話の間の日）：2-2 を返した翌日のけんたたち（RETURN_VISITS）。夕暮れは交換所のペトラで、夜は記憶に入らない
  d15_free: {
    id: 'd15_free',
    time: '15日目　金曜の放課後',
    day: 15,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('street', talk('d15_talk_takoyaki', '屋台', ROW2, 'mio')),
      at('clockshop', talk('d7_talk', '店の中', ROW1, 'mio'), toDusk('d15_to_dusk')),
    ],
  },
  // 16日目（土曜。段階85。段階103 で日曜から土曜に。docs/script/2-3_rework.md の 16-A）：パン屋のこうじさんとそうたは必ず見る。夕暮れの後、2-3 の1晩目
  d7_free: {
    id: 'd7_free',
    time: '16日目　土曜の昼',
    day: 16,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('bakery', main('d7_bakery', 'パン屋の親子')),
      at('home', talk('d16_talk_laundry', '物干し', ROW2, 'akari')),
      at('clockshop', toDusk('d7_to_dusk')),
    ],
  },
  // 17日目（日曜。17-A・17-B）：河川敷のまさるさんと、その後のパン屋の前は必ず見る。河川敷の上の段は、みおの絆の出来事。段階103 で日曜になったので、日曜の時計屋の小話をここへ、教室の小話は18日目へ移した
  a23_day17_free: {
    id: 'a23_day17_free',
    time: '17日目　日曜の昼',
    day: 17,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('riverside', main('d17_masaru', 'スタンドの声', ROW2)),
      at('street', main('d17_koji_front', 'パン屋の前', ROW1, 'd17_masaru'), talk('d17_talk_melon', '紙袋', ROW2, 'mio')),
      at('clockshop', talk('d16_talk_sunday', '店の中'), toDusk('a23_d17_to_dusk')),
    ],
  },
  // 18日目（18-A）：閉店後のパン屋のこうじさんの本音は必ず見る。夕暮れの後、3晩目
  a23_day18_free: {
    id: 'a23_day18_free',
    time: '18日目　月曜の放課後',
    day: 18,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('bakery', main('d18_koji', '言えない言葉')),
      at('convenience', talk('d18_talk_ramune', 'レジ', ROW2)),
      at('street', talk('d18_talk_bet', '信号の前', ROW2, 'mio')),
      at('school', talk('d17_talk_three', '教室', ROW2, 'akari')),
      at('clockshop', toDusk('a23_d18_to_dusk')),
    ],
  },
  // 19日目（火曜。段階85・103。19-B）：持ち去られた翌日の「手が出せない日」。パン屋のこうじさんは必ず見る。夕暮れに棚へ行っても、書庫への道が分からない
  d8_free: {
    id: 'd8_free',
    time: '19日目　火曜の放課後',
    day: 19,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('bakery', main('d8_bakery', '知っているのに')),
      at('home', talk('d8_talk', '台所', ROW2, 'mio')),
      at('clockshop', toDusk('d8_to_dusk')),
    ],
  },
  // 20日目（水曜。段階103。19-C）：河川敷のまさるさんは必ず見る。夕暮れにペトラの通用口から4晩目
  a23_day20_free: {
    id: 'a23_day20_free',
    time: '20日目　水曜の放課後',
    day: 20,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('riverside', main('d19_masaru', 'ビー玉', ROW2)),
      at('clockshop', talk('d19_talk_plan', '店の奥'), toDusk('a23_d20_to_dusk')),
    ],
  },
  // 21日目（木曜・祝日。段階85。段階103 で20日目から21日目へ）：2-3 を返した翌日のそうたの準決勝（RETURN_VISITS）。夕暮れに2章の終わり
  d20_free: {
    id: 'd20_free',
    time: '21日目　祝日の昼',
    day: 21,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('convenience', talk('d20_talk_holiday', 'レジ', ROW2)),
      at('school', talk('d20_talk_prep', '教室', ROW2, 'akari')),
      at('clockshop', toDusk('d20_to_dusk')),
    ],
  },
  // ---- 3章（段階88。docs/script/3-1.md の 4.） ----
  // 22日目（金曜）：時計屋のちよさんとのぼるさんは必ず見る。夕暮れの後、3-1 の1晩目
  d21_free: {
    id: 'd21_free',
    time: '22日目　金曜の放課後',
    day: 22,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('clockshop', main('d21_chiyo', '止まった腕時計'), toDusk('d21_to_dusk')),
      at('home', talk('d21_talk_care', '台所', ROW2, 'akari')),
    ],
  },
  // 23日目（土曜）：文化祭。時計の博物館と、その後の中庭ののぼるさんは必ず見る。学校の印は文化祭の分だけ並ぶので、位置をずらす
  a31_day22_free: {
    id: 'a31_day22_free',
    time: '23日目　文化祭',
    day: 23,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('school', main('d22_museum', '時計の博物館', 230), main('d22_noboru', '中庭のベンチ', 350, 'd22_museum'), talk('d22_talk_callout', '廊下', 590, 'akari'), talk('d22_talk_yakisoba', '模擬店', 670, 'mio')),
      at('home', talk('d22_talk_riku', '台所', ROW2, 'akari')),
      at('clockshop', talk('d22_talk_memo', '店の奥'), toDusk('a31_d22_to_dusk')),
    ],
  },
  // 24日目（日曜）：ひだまり荘のちよさんの本音は必ず見る。夕暮れの後、3晩目
  a31_day23_free: {
    id: 'a31_day23_free',
    time: '24日目　日曜の昼',
    day: 24,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('care_home', main('d23_chiyo', '八時の窓')),
      at('street', talk('d23_talk_sunday', '花屋の前', ROW2)),
      at('convenience', talk('d23_talk_yuma', 'レジ', ROW2)),
      at('clockshop', talk('d23_talk_names', '店の中', ROW1, 'mio'), toDusk('a31_d23_to_dusk')),
    ],
  },
  // 25日目（月曜）：3-1 を返した翌日の駅のちよさん（RETURN_VISITS）。夕暮れに祭囃子の棚
  d24_free: {
    id: 'd24_free',
    time: '25日目　月曜の放課後',
    day: 25,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('riverside', talk('d24_talk_eight', 'グラウンド', ROW2, 'mio')),
      at('street', talk('d24_talk_fumi', '店先', ROW2, 'akari')),
      at('clockshop', toDusk('d24_to_dusk')),
    ],
  },
  // ---- 祭りの夜（段階91。docs/script/3-matsuri.md の 4.） ----
  // 26日目（火曜）：町の神社の宮司さんは必ず見る（神社は町の地図に場所を足す空きがないので、商店街の中に置く）。夕暮れに祭りの夜の2晩目
  d25_free: {
    id: 'd25_free',
    time: '26日目　火曜の放課後',
    day: 26,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('street', main('d25_shrine', '町の神社'), talk('d25_talk_geta', '下駄の音', ROW2, 'mio')),
      at('school', talk('d25_talk_eight', '教室', ROW2, 'akari')),
      at('care_home', talk('d25_talk_window', '窓辺', ROW2)),
      at('clockshop', toDusk('d25_to_dusk')),
    ],
  },
  // 27日目（水曜）：小夜子と今の町を歩くのと、その後ののぼるさんの電話は必ず見る。夕暮れに、また明日
  d26_free: {
    id: 'd26_free',
    time: '27日目　水曜の放課後',
    day: 27,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio'],
    places: [
      at('clockshop', main('d26_sayoko', 'はじめての今'), main('d26_noboru', '店の電話', ROW2, 'd26_sayoko'), toDusk('d26_to_dusk')),
      at('school', talk('d26_talk_name', '教室', ROW2, 'akari')),
      at('street', talk('d26_talk_kuji', '福引のテント', ROW2, 'mio')),
    ],
  },
  // ---- 3-2（段階94。docs/script/3-2.md の 4.）。28日目から、昼の「誰と過ごすか」に小夜子が加わる ----
  // 28日目（木曜）：商店街の緩める話と、その後の時計屋のしおりさんは必ず見る。夕暮れの後、3-2 の1晩目
  d27_free: {
    id: 'd27_free',
    time: '28日目　木曜の放課後',
    day: 28,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio', 'sayoko'],
    places: [
      at('street', main('d27_relax', 'カタカナ語しりとり')),
      at('clockshop', main('d27_shiori', '刻めない字', ROW1, 'd27_relax'), toDusk('d27_to_dusk')),
    ],
  },
  // 29日目（金曜）：楽器店のとうやさんと、その後の時計屋の前のしおりさんは必ず見る。夕暮れの後、2晩目
  a32_day28_free: {
    id: 'a32_day28_free',
    time: '29日目　金曜の放課後',
    day: 29,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio', 'sayoko'],
    places: [
      at('music_shop', main('d28_toya', '預けるギター')),
      at('street', main('d28_shiori', '時計屋の前', ROW1, 'd28_toya'), talk('d28_talk_earphone', 'アーケード', 560, 'sayoko')),
      at('riverside', talk('d28_talk_button', 'グラウンド', ROW2, 'mio')),
      at('clockshop', toDusk('a32_d28_to_dusk')),
    ],
  },
  // 30日目（土曜）：川沿いの道のしおりさんの本音は必ず見る。夕暮れの後、3晩目
  a32_day29_free: {
    id: 'a32_day29_free',
    time: '30日目　土曜の昼',
    day: 30,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio', 'sayoko'],
    places: [
      at('river_path', main('d29_shiori', 'ベンチのしおりさん')),
      at('clockshop', talk('d29_talk_engrave', '作業台', ROW1, 'akari'), toDusk('a32_d29_to_dusk')),
    ],
  },
  // 31日目（日曜）：3-2 を返した翌日の踏切のしおりさん（RETURN_VISITS）。夕暮れに、言えなかったこと
  d30_free: {
    id: 'd30_free',
    time: '31日目　日曜の昼',
    day: 31,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio', 'sayoko'],
    places: [
      at('music_shop', talk('d30_talk_song', '店の奥', ROW2, 'mio')),
      at('convenience', talk('d30_talk_hinano', 'レジ', ROW2)),
      at('clockshop', toDusk('d30_to_dusk')),
    ],
  },
  // ---- カイへのリベンジとノアの口論、3章の終わり（段階96。docs/script/3-kai.md の 4.） ----
  // 32日目（月曜）：昼は選べる話だけ。夕暮れの後、祭りの夜（カイ）
  d31_free: {
    id: 'd31_free',
    time: '32日目　月曜の放課後',
    day: 32,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio', 'sayoko'],
    places: [
      at('bakery', talk('d31_talk_bread', '店先', ROW1, 'mio')),
      at('street', talk('d31_talk_fumi', '店先', ROW1, 'akari')),
      at('clockshop', toDusk('d31_to_dusk')),
    ],
  },
  // 33日目（火曜。雨）：昼は選べる話だけ。夕暮れに3章の終わり
  d32_free: {
    id: 'd32_free',
    time: '33日目　火曜の放課後（雨）',
    day: 33,
    picks: DAILY_PICKS,
    partners: ['akari', 'mio', 'sayoko'],
    places: [
      at('factory', talk('d32_talk_isamu', '作業場', ROW1, 'mio')),
      at('care_home', talk('d32_talk_care', '窓辺', ROW2)),
      at('clockshop', toDusk('d32_to_dusk')),
    ],
  },
};
