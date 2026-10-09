import type { Flow } from './flow';
import { eventNumber, findEvent, flowEvents } from './flow';

// 遊んだ記録（段階32b）。試遊で、どの出来事に何分いたか・どこでやめたか・何回負けたかを、遊ぶ人の端末に残す。Phaser に依存しない。
// セーブとは別に保存する（はじめからやり直しても消えない）。時間の数え方（触っている間だけ）は画面の側（src/scenes/playRecord.ts）

/** 出来事1つ分の記録 */
export interface PlayLogEntry {
  /** そこにいた時間（ミリ秒） */
  ms: number;
  /** 探索の戦闘で勝った・負けた回数 */
  wins: number;
  losses: number;
}

export interface PlayLog {
  /** 記録を始めた日時（ISO） */
  startedAt: string;
  /** 「はじめから」を押した回数 */
  starts: number;
  /** 出来事の id ごとの記録 */
  events: Record<string, PlayLogEntry>;
  /** 一番先まで進んだ出来事の id */
  furthest: string | null;
  /** 最後にいた出来事の id と、最後に遊んだ日時（ISO） */
  last: string | null;
  lastAt: string | null;
  /** 「つづく」まで着いた回数 */
  finished: number;
}

/** 1回に足す時間の上限。端末が眠っていた間などに、大きな時間がまとめて入らないようにする */
export const PLAY_TICK_MAX_MS = 15_000;

export function createPlayLog(now: Date): PlayLog {
  return { startedAt: now.toISOString(), starts: 0, events: {}, furthest: null, last: null, lastAt: null, finished: 0 };
}

function entryOf(log: PlayLog, id: string): PlayLogEntry {
  return log.events[id] ?? { ms: 0, wins: 0, losses: 0 };
}

/** 出来事 id にいた時間を足す（上限は PLAY_TICK_MAX_MS）。最後にいた所と日時も、ここで覚える */
export function addPlayTime(log: PlayLog, id: string, ms: number, now: Date): PlayLog {
  const add = Math.min(Math.max(0, ms), PLAY_TICK_MAX_MS);
  const e = entryOf(log, id);
  return { ...log, events: { ...log.events, [id]: { ...e, ms: e.ms + add } }, last: id, lastAt: now.toISOString() };
}

/** 出来事 id に入った。一番先まで進んだ所を更新し、「つづく」に初めて入ったら着いた回数を数える */
export function enterPlayEvent(log: PlayLog, flow: Flow, id: string, now: Date): PlayLog {
  const event = findEvent(flow, id);
  if (!event) return log;
  const farther = log.furthest === null || !findEvent(flow, log.furthest) || eventNumber(flow, id).n > eventNumber(flow, log.furthest).n;
  const arrived = event.kind === 'end' && log.last !== id;
  return {
    ...log,
    furthest: farther ? id : log.furthest,
    finished: log.finished + (arrived ? 1 : 0),
    last: id,
    lastAt: now.toISOString(),
  };
}

/** 「はじめから」を押した */
export function recordPlayStart(log: PlayLog): PlayLog {
  return { ...log, starts: log.starts + 1 };
}

/** 出来事 id で戦闘に勝った・負けた */
export function recordPlayBattle(log: PlayLog, id: string, won: boolean): PlayLog {
  const e = entryOf(log, id);
  return { ...log, events: { ...log.events, [id]: won ? { ...e, wins: e.wins + 1 } : { ...e, losses: e.losses + 1 } } };
}

const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const isoOrNull = (v: unknown): string | null => (typeof v === 'string' && !Number.isNaN(new Date(v).getTime()) ? v : null);

/** 保存された文字から記録を読む。壊れていたら新しい記録。今の流れにない出来事は捨てる */
export function parsePlayLog(text: string | null, flow: Flow, now: Date): PlayLog {
  const fresh = createPlayLog(now);
  if (!text) return fresh;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fresh;
  }
  if (!raw || typeof raw !== 'object') return fresh;
  const o = raw as Record<string, unknown>;
  const known = (v: unknown): string | null => (typeof v === 'string' && findEvent(flow, v) ? v : null);
  const events: Record<string, PlayLogEntry> = {};
  const rawEvents = o.events && typeof o.events === 'object' ? (o.events as Record<string, unknown>) : {};
  for (const [id, v] of Object.entries(rawEvents)) {
    if (!known(id) || !v || typeof v !== 'object') continue;
    const e = v as Record<string, unknown>;
    events[id] = { ms: count(e.ms), wins: count(e.wins), losses: count(e.losses) };
  }
  const last = known(o.last);
  return {
    startedAt: isoOrNull(o.startedAt) ?? fresh.startedAt,
    starts: count(o.starts),
    events,
    furthest: known(o.furthest),
    last,
    lastAt: last ? isoOrNull(o.lastAt) : null,
    finished: count(o.finished),
  };
}

export function serializePlayLog(log: PlayLog): string {
  return JSON.stringify(log);
}

/** 記録の画面の1行 */
export interface PlayLogRow {
  id: string;
  title: string;
  ms: number;
  wins: number;
  losses: number;
  /** 一番先まで進んだ所より手前か、その所（まだ着いていない出来事は false） */
  reached: boolean;
}

/** 記録の画面に出す形：流れの順の行と、合わせた時間・負けた回数 */
export function summarizePlayLog(log: PlayLog, flow: Flow): { rows: PlayLogRow[]; totalMs: number; totalLosses: number } {
  const furthestN = log.furthest ? eventNumber(flow, log.furthest).n : -1;
  const rows = flowEvents(flow).map((e, i) => {
    const r = entryOf(log, e.id);
    return { id: e.id, title: e.title, ms: r.ms, wins: r.wins, losses: r.losses, reached: i <= furthestN };
  });
  return {
    rows,
    totalMs: rows.reduce((a, r) => a + r.ms, 0),
    totalLosses: rows.reduce((a, r) => a + r.losses, 0),
  };
}

/** 時間を「12:05」（分:秒）の形にする。1時間を超えたら「1:02:05」 */
export function formatPlayTime(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
