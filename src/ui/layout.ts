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

export const SIDE_PADDING = 8;
/** タップできる部分の最小の大きさ */
export const MIN_TAP = 44;

/** n 等分した列の中心 x */
export function columnX(i: number, n: number): number {
  const w = GAME_WIDTH / n;
  return w * i + w / 2;
}
