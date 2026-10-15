// 物語の流れ（段階23）：章 → 出来事の並び。Phaser に依存しない。
// 出来事の中身（台本の場面、仮の画面の案内）は data 側が決めるので、ここでは並びと進め方だけを扱う
import type { Lineup } from './lineup';

/** 出来事の種類 */
export type FlowEventKind =
  /** 会話の場面（台本の場面1つ） */
  | 'dialogue'
  /** 日が変わる（「2日目」の扉） */
  | 'day'
  /** 昼の日常（段階24。場所と印は data の DAILY_HUBS。プロローグの屋台めぐりも） */
  | 'daily'
  /** 探索の区画（段階25。区画は data の AREAS） */
  | 'explore'
  /** 時間を返す（段階28） */
  | 'return'
  /** 物語の戦闘（段階40。2-3 の返す直前のカイの負け戦）。battle は区画の戦闘（data の AREA_BATTLES）の id。勝ち負けにかかわらず次の出来事へ */
  | 'battle'
  /** 「つづく」（スライスの終わり） */
  | 'end';

export interface FlowEvent {
  /** 変わらない名前。セーブはこの名前で覚える（会話は台本の場面の id と同じにする） */
  id: string;
  kind: FlowEventKind;
  /** タイトルの「つづきから」の下などに出す名前 */
  title: string;
  /** day の時：何日目になるか */
  day?: number;
  /** 仮の画面に出す案内（どの段階で何を作るか）。会話・昼の日常は、これがあると仮の画面にする（段階34） */
  note?: string;
  /** explore・return の時：探索する区画・時間を返す区画（data の AREAS の id）。仮の画面でも書いておく（段階36：返した翌日の場面に使う） */
  area?: string;
  /** battle の時：戦う区画の戦闘の id（段階40） */
  battle?: string;
}

export interface FlowChapter {
  id: string;
  name: string;
  /** この章で戦う仲間と、開けている育成（段階26）。なければ前の章と同じ */
  lineup?: Lineup;
  events: FlowEvent[];
}

export type Flow = FlowChapter[];

/** 流れのすべての出来事を、最初から順に並べたもの */
export function flowEvents(flow: Flow): FlowEvent[] {
  return flow.flatMap((c) => c.events);
}

/** 最初の出来事の id */
export function firstEventId(flow: Flow): string {
  const first = flowEvents(flow)[0];
  if (!first) throw new Error('empty flow');
  return first.id;
}

/** id の出来事（なければ null） */
export function findEvent(flow: Flow, id: string): FlowEvent | null {
  return flowEvents(flow).find((e) => e.id === id) ?? null;
}

/** その出来事がある章（なければ null） */
export function chapterOfEvent(flow: Flow, id: string): FlowChapter | null {
  return flow.find((c) => c.events.some((e) => e.id === id)) ?? null;
}

/** その出来事の時のパーティ（章の lineup。なければ前の章のもの。どこにもなければ fallback） */
export function lineupAt(flow: Flow, id: string, fallback: Lineup): Lineup {
  const i = flow.findIndex((c) => c.events.some((e) => e.id === id));
  for (let j = i; j >= 0; j--) {
    const l = flow[j].lineup;
    if (l) return l;
  }
  return fallback;
}

/**
 * まだ中身がなく、仮の画面でつなぐ出来事か（段階34）。
 * 案内（note）を書いたもの。探索・時間を返すは、区画（area）のないものも（段階36：区画がまだなくても、区画の id を書いておけるように）
 */
export function isPlaceholder(e: FlowEvent): boolean {
  if (e.kind === 'day' || e.kind === 'end') return false;
  if (e.note !== undefined) return true;
  return (e.kind === 'explore' || e.kind === 'return') && !e.area;
}

/** 次の出来事（最後なら null） */
export function nextEvent(flow: Flow, id: string): FlowEvent | null {
  const all = flowEvents(flow);
  const i = all.findIndex((e) => e.id === id);
  if (i < 0) throw new Error(`unknown event ${id}`);
  return all[i + 1] ?? null;
}

/** 今の出来事と何日目か */
export interface FlowPos {
  event: string;
  day: number;
}

/**
 * 出来事 id へ移った時の、何日目か。日が変わる出来事なら、その日にする。
 * それ以外は、その出来事より前で最後に日が変わった日（なければ1日目）
 */
export function dayAt(flow: Flow, id: string): number {
  let day = 1;
  for (const e of flowEvents(flow)) {
    if (e.kind === 'day' && e.day) day = e.day;
    if (e.id === id) return day;
  }
  throw new Error(`unknown event ${id}`);
}

/** 今の出来事を終えて、次へ進める。最後の出来事（つづく）ならそのまま */
export function advanceFlow(flow: Flow, pos: FlowPos): FlowPos {
  const next = nextEvent(flow, pos.event);
  if (!next) return pos;
  return { event: next.id, day: dayAt(flow, next.id) };
}

/** 出来事 id へ移す（デバッグで飛ぶ時や、会話の場面が進んだ時）。日はその出来事に合わせる */
export function moveToEvent(flow: Flow, id: string): FlowPos {
  if (!findEvent(flow, id)) throw new Error(`unknown event ${id}`);
  return { event: id, day: dayAt(flow, id) };
}

/** 最初から数えて何番目の出来事か（0から）と、全部の数。進み具合の表示に使う */
export function eventNumber(flow: Flow, id: string): { n: number; total: number } {
  const all = flowEvents(flow);
  return { n: all.findIndex((e) => e.id === id), total: all.length };
}

/**
 * id から続けて読む会話の場面（会話の出来事が続く所まで）。
 * 会話の画面を1回開くだけで、場面をまたいで続けて読めるようにする。仮の画面の会話の手前で止める
 */
export function dialogueRun(flow: Flow, id: string): string[] {
  const all = flowEvents(flow);
  const out: string[] = [];
  for (let i = all.findIndex((e) => e.id === id); i >= 0 && i < all.length && all[i].kind === 'dialogue' && !isPlaceholder(all[i]); i++) out.push(all[i].id);
  return out;
}

/**
 * 返した時間と、返した日（段階36）：今の出来事より前の「時間を返す」出来事ごとに、区画の id → 何日目に返したか。
 * 中身のある返す出来事は、返した記録（セーブの returned）にある区画だけ（負け戦で返せなかった区画は入らない）。
 * 仮の画面の返す出来事は、通ったら返したことにする（区画を作るまで、翌日の場面を見られるように）
 */
export function returnDays(flow: Flow, currentId: string, returned: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  let day = 1;
  for (const e of flowEvents(flow)) {
    if (e.id === currentId) break;
    if (e.kind === 'day' && e.day) day = e.day;
    if (e.kind === 'return' && e.area && (isPlaceholder(e) || returned.includes(e.area))) out[e.area] = day;
  }
  return out;
}

/** 出来事の並びの書き間違い（id の重なり、日の番号がない、など）を、全部まとめて返す（テストで使う） */
export function checkFlow(flow: Flow): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const all = flowEvents(flow);
  if (all.length === 0) errors.push('出来事がない');
  for (const e of all) {
    if (seen.has(e.id)) errors.push(`出来事の id が重なっている：${e.id}`);
    seen.add(e.id);
    if (e.kind === 'day' && !(Number.isInteger(e.day) && e.day! >= 1)) errors.push(`日が変わる出来事に日の番号がない：${e.id}`);
    if (isPlaceholder(e) && !e.note) errors.push(`仮の画面に案内がない：${e.id}`);
    if (e.kind === 'battle' && !e.battle) errors.push(`戦闘の出来事に戦闘の id がない：${e.id}`);
  }
  const last = all[all.length - 1];
  if (last && last.kind !== 'end') errors.push('最後の出来事が「つづく」ではない');
  return errors;
}
