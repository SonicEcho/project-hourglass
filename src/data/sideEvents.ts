import type { SideEvent } from '../core/daily';

// 寄り道（段階239。docs/milestones/M3_side_events.md）：昼の町に出る、短いサブイベントの連作。昼に選べる回数は使わない。
// 連作ごとに順番に並べる。前の話を見た次の日から、続きが出る（from より前には出ない）。台本は src/data/scriptSide.ts

/** 連作の名前（拠点の帳面・ライブラリで使う） */
export const SIDE_CHAINS: Record<string, { name: string; with?: string }> = {
  lottery: { name: '商店街の福引' },
  mio_trick: { name: 'みおの手品の種', with: 'mio' },
  regular: { name: '時計屋の常連' },
  // 段階241
  cat: { name: '駄菓子屋の看板猫' },
  bento: { name: 'あかりのお弁当', with: 'akari' },
  photo: { name: 'ハルトの写真', with: 'akari' },
  holiday: { name: '早瀬の休みの日' },
  words: { name: '小夜子の知らない言葉', with: 'sayoko' },
};

export const SIDE_EVENTS: Record<string, SideEvent[]> = {
  // 町の頼まれごと：八百屋の五郎さんの福引。特賞がいつまでも出ない
  lottery: [
    { id: 'side_lottery_1', chain: 'lottery', title: '特賞が出ない', label: '商店街の福引', from: 9, place: 'street', x: 300, y: 520 },
    { id: 'side_lottery_2', chain: 'lottery', title: 'みおの名推理', label: '商店街の福引', from: 17, place: 'street', x: 300, y: 520 },
    { id: 'side_lottery_3', chain: 'lottery', title: '特賞の行方', label: '商店街の福引', from: 25, place: 'street', x: 300, y: 520 },
  ],
  // 仲間の寄り道：みおのジョーカーの手品の種を、ハルトとあかりが本気で暴こうとする
  mio_trick: [
    { id: 'side_mio_trick_1', chain: 'mio_trick', title: '種はどこ？', label: 'みおの手品', from: 10, place: 'riverside', x: 100, y: 520 },
    { id: 'side_mio_trick_2', chain: 'mio_trick', title: '本気の観察', label: 'みおの手品', from: 18, place: 'convenience', x: 100, y: 520 },
    { id: 'side_mio_trick_3', chain: 'mio_trick', title: '種明かし……？', label: 'みおの手品', from: 29, place: 'riverside', x: 100, y: 520 },
  ],
  // 町の頼まれごと：壊れていない時計を、毎週持ってくる善次さん
  regular: [
    { id: 'side_regular_1', chain: 'regular', title: '壊れていない時計', label: '時計屋の常連', from: 11, place: 'clockshop', x: 300, y: 380 },
    { id: 'side_regular_2', chain: 'regular', title: '毎週火曜日', label: '時計屋の常連', from: 19, place: 'clockshop', x: 300, y: 380 },
    { id: 'side_regular_3', chain: 'regular', title: 'ねじを巻く人', label: '時計屋の常連', from: 31, place: 'clockshop', x: 300, y: 380 },
  ],
  // 段階241：町の頼まれごと。駄菓子屋の初江さんの白い猫「だいふく」がいない
  cat: [
    { id: 'side_cat_1', chain: 'cat', title: '看板猫がいない', label: '駄菓子屋の看板猫', from: 12, place: 'street', x: 100, y: 520 },
    { id: 'side_cat_2', chain: 'cat', title: '施設の秘密', label: '駄菓子屋の看板猫', from: 20, place: 'home', x: 300, y: 520 },
  ],
  // 仲間の寄り道：あかりのお弁当の練習。味見役のハルト
  bento: [
    { id: 'side_bento_1', chain: 'bento', title: '味見役', label: 'あかりのお弁当', from: 13, place: 'school', x: 300, y: 520 },
    { id: 'side_bento_2', chain: 'bento', title: '三度目の正直', label: 'あかりのお弁当', from: 21, place: 'school', x: 300, y: 520 },
  ],
  // 仲間の寄り道：ハルトの撮る写真は、いつも少し右に寄っている
  photo: [
    { id: 'side_photo_1', chain: 'photo', title: '傾く写真', label: 'ハルトの写真', from: 14, place: 'school', x: 100, y: 600 },
    { id: 'side_photo_2', chain: 'photo', title: '空けてある左', label: 'ハルトの写真', from: 22, place: 'river_path', x: 300, y: 520 },
  ],
  // 仲間の寄り道：月に一度の休みの日、早瀬はどこへ行く？（4章の山場を避けて3章に置く）
  holiday: [
    { id: 'side_holiday_1', chain: 'holiday', title: '本日休業', label: '早瀬の休みの日', from: 26, place: 'street', x: 100, y: 600 },
    { id: 'side_holiday_2', chain: 'holiday', title: '釣り堀の早瀬', label: '早瀬の休みの日', from: 32, place: 'river_path', x: 100, y: 520 },
  ],
  // 仲間の寄り道：大正から来た小夜子が、今の言葉を一つずつ覚える
  words: [
    { id: 'side_words_1', chain: 'words', title: '「スマホ」', label: '小夜子の知らない言葉', from: 28, place: 'convenience', x: 300, y: 520 },
    { id: 'side_words_2', chain: 'words', title: '「エモい」', label: '小夜子の知らない言葉', from: 30, place: 'street', x: 300, y: 600 },
    { id: 'side_words_3', chain: 'words', title: '「やばい」', label: '小夜子の知らない言葉', from: 33, place: 'river_path', x: 300, y: 520 },
  ],
};
