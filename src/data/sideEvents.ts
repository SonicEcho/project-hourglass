import type { SideEvent } from '../core/daily';

// 寄り道（段階239。docs/milestones/M3_side_events.md）：昼の町に出る、短いサブイベントの連作。昼に選べる回数は使わない。
// 連作ごとに順番に並べる。前の話を見た次の日から、続きが出る（from より前には出ない）。台本は src/data/scriptSide.ts

/** 連作の名前（拠点の帳面・ライブラリで使う） */
export const SIDE_CHAINS: Record<string, { name: string; with?: string }> = {
  lottery: { name: '商店街の福引' },
  mio_trick: { name: 'みおの手品の種', with: 'mio' },
  regular: { name: '時計屋の常連' },
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
};
