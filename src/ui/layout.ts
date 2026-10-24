import { GAME_WIDTH } from '../config';

/** 戦闘画面の領域（基準 390×844、上から順に） */
export const LAYOUT = {
  /** ① 行動順 */
  turnOrder: { y: 0, h: 56 },
  /** ② 敵と部位 */
  enemies: { y: 56, h: 272 },
  /** 状況とプレビューの文字 */
  message: { y: 328, h: 44 },
  /** ③ 味方3人 */
  allies: { y: 372, h: 84 },
  /** ④ 手札（魔法・スキルなどの一覧もここに出す） */
  hand: { y: 462, h: 176 },
  /** ⑤ コマンド */
  commands: { y: 644, h: 110 },
  /** 決定・取り消し */
  footer: { y: 760, h: 64 },
} as const;

/**
 * 新しい戦闘の画面（段階102a。フィルム）の領域（基準 390×844、上から順に）。敵は LAYOUT.enemies と同じ場所。
 * 行動順の顔の列の代わりにフィルム、仲間の枠の代わりに仲間のタブ、コマンドと下のボタンは1段にまとめる
 */
export const FILM_LAYOUT = {
  /** 上の帯（REC・ラウンド・オート・早送り）。敵の絵の上に重ねる */
  header: { y: 0, h: 44 },
  /** 状況とプレビューの文字（斜めの黒い帯） */
  message: { y: 330, h: 30 },
  /** フィルム（行動順） */
  film: { y: 364, h: 106 },
  /** 仲間のタブ */
  tabs: { y: 476, h: 58 },
  /** 手札（魔法・スキルなどの一覧もここに出す） */
  hand: { y: 540, h: 220 },
  /** 下の1段のボタン（前の画面の下のボタンと同じ高さ。下の端は設定の歯車とビルドの表示） */
  bottom: { y: 762, h: 62 },
} as const;

export const SIDE_PADDING = 8;
/** タップできる部分の最小の大きさ */
export const MIN_TAP = 44;

/** n 等分した列の中心 x */
export function columnX(i: number, n: number): number {
  const w = GAME_WIDTH / n;
  return w * i + w / 2;
}
