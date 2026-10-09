import type { PlayLog } from '../core';
import { addPlayTime, createPlayLog, enterPlayEvent, parsePlayLog, recordPlayBattle, recordPlayStart, serializePlayLog } from '../core';
import { SLICE_FLOW } from '../data';
import { browserStorage } from '../save/storage';

// 遊んだ記録（段階32b）の窓口。記録はセーブとは別に保存する（はじめからやり直しても消えない）。
// 時間は、画面が表に出ていて、遊ぶ人が最近触った間だけ数える（main.ts が数秒ごとに tickPlayRecord を呼ぶ）

const PLAYLOG_KEY = 'restopia.playlog';
/** これより長く触らなかったら、時間を数えない */
export const PLAY_IDLE_MS = 3 * 60_000;

let log: PlayLog | null = null;
/** 前に時間を数えた時刻（数えていない間は null） */
let lastTick: number | null = null;
/** 最後に触った時刻 */
let lastInput = Date.now();
/** 物語を遊んでいる間だけ true（タイトル・クレジット・記録の画面にいる間は数えない） */
let tracking = false;

export function playRecord(): PlayLog {
  if (!log) log = parsePlayLog(browserStorage().read(PLAYLOG_KEY), SLICE_FLOW, new Date());
  return log;
}

function store(next: PlayLog): void {
  log = next;
  browserStorage().write(PLAYLOG_KEY, serializePlayLog(next));
}

/** 遊ぶ人が画面に触った */
export function notePlayInput(): void {
  lastInput = Date.now();
}

/**
 * 時間を数える。event：今いる出来事（物語を遊んでいない時は null）。
 * 画面が裏に回った時・触らずにしばらくたった時は数えず、次に数え始める所を今にする
 */
export function tickPlayRecord(event: string | null, visible: boolean): void {
  const now = Date.now();
  if (!tracking || !event || !visible || now - lastInput > PLAY_IDLE_MS) {
    lastTick = null;
    return;
  }
  if (lastTick !== null) store(addPlayTime(playRecord(), event, now - lastTick, new Date(now)));
  lastTick = now;
}

/** 物語を遊び始めた（流れの画面に入った）・やめた（タイトルへ戻った） */
export function setPlayTracking(on: boolean): void {
  tracking = on;
  if (!on) lastTick = null;
}

/** 物語の出来事に入った */
export function notePlayEvent(id: string): void {
  store(enterPlayEvent(playRecord(), SLICE_FLOW, id, new Date()));
}

/** 「はじめから」を押した */
export function notePlayStart(): void {
  store(recordPlayStart(playRecord()));
}

/** 物語の出来事 id で、戦闘に勝った・負けた */
export function notePlayBattle(id: string, won: boolean): void {
  store(recordPlayBattle(playRecord(), id, won));
}

/** 記録を消して、新しく始める */
export function resetPlayRecord(): void {
  lastTick = null;
  store(createPlayLog(new Date()));
}
