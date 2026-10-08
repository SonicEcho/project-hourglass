// 物語の流れ（段階23）：章 → 出来事の並び。Phaser に依存しない。
// 出来事の中身（台本の場面、仮の画面の案内）は data 側が決めるので、ここでは並びと進め方だけを扱う

/** 出来事の種類 */
export type FlowEventKind =
  /** 会話の場面（台本の場面1つ） */
  | 'dialogue'
  /** 日が変わる（「2日目」の扉） */
  | 'day'
  /** 昼の日常（段階24で作る。今は仮の画面） */
  | 'daily'
  /** 探索の区画（段階25で作る。今は仮の画面） */
  | 'explore'
  /** 時間を返す（段階28で作る。今は仮の画面） */
  | 'return'
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
  /** 仮の画面に出す案内（どの段階で何を作るか） */
  note?: string;
  /** 仮の画面から寄り道で読める会話の場面（昼の日常の、見なくてもよい場面） */
  optional?: { label: string; scene: string }[];
}

export interface FlowChapter {
  id: string;
  name: string;
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
 * 会話の画面を1回開くだけで、場面をまたいで続けて読めるようにする
 */
export function dialogueRun(flow: Flow, id: string): string[] {
  const all = flowEvents(flow);
  const out: string[] = [];
  for (let i = all.findIndex((e) => e.id === id); i >= 0 && i < all.length && all[i].kind === 'dialogue'; i++) out.push(all[i].id);
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
  }
  const last = all[all.length - 1];
  if (last && last.kind !== 'end') errors.push('最後の出来事が「つづく」ではない');
  return errors;
}
