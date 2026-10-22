import type { SaveStorage } from '../save/storage';

// その場のメモ（段階92。docs/design/tech.md の 9.）：確かめながら気になったことを一言書き、書いた時の場所を自動で添える。
// 一覧の「全部写す」で、開発の会話に貼れる文にする。セーブとは別に端末に残す（「はじめから」や、育ち具合で飛んでも消えない）

export const MEMO_KEY = 'restopia.memos';

export const MEMO_KINDS = ['不具合', '手応え', '話・台詞', '見た目', 'その他'] as const;
export type MemoKind = (typeof MEMO_KINDS)[number];

/** 書いた時の場所（分かるものだけ） */
export interface MemoPlace {
  /** 何日目と、物語の流れの出来事（id と名前） */
  day?: number;
  event?: string;
  eventTitle?: string;
  /** 開いていた画面 */
  screen?: string;
  /** 会話：場面の id と、台本の行（scriptM*.ts の台本の何行目か）と、出ていた台詞 */
  scene?: string;
  line?: number;
  text?: string;
  /** 戦闘：敵の名前とラウンド */
  battle?: string;
  round?: number;
  /** 探索：区画と部屋 */
  area?: string;
  room?: string;
  /** 版（ビルド日時とコミット） */
  build?: string;
}

export interface Memo {
  id: number;
  /** 書いた日時（ISO） */
  at: string;
  kind: MemoKind;
  body: string;
  place: MemoPlace;
}

export function readMemos(storage: SaveStorage): Memo[] {
  const text = storage.read(MEMO_KEY);
  if (!text) return [];
  try {
    const list: unknown = JSON.parse(text);
    return Array.isArray(list) ? list.filter((m): m is Memo => typeof m?.id === 'number' && typeof m?.body === 'string') : [];
  } catch {
    return [];
  }
}

export function addMemo(storage: SaveStorage, kind: MemoKind, body: string, place: MemoPlace, now: Date): Memo[] {
  const list = readMemos(storage);
  const id = list.reduce((a, m) => Math.max(a, m.id), 0) + 1;
  const next = [...list, { id, at: now.toISOString(), kind, body: body.trim(), place }];
  storage.write(MEMO_KEY, JSON.stringify(next));
  return next;
}

export function removeMemo(storage: SaveStorage, id: number): Memo[] {
  const next = readMemos(storage).filter((m) => m.id !== id);
  storage.write(MEMO_KEY, JSON.stringify(next));
  return next;
}

export function clearMemos(storage: SaveStorage): void {
  storage.remove(MEMO_KEY);
}

/** 場所を1行にする（「12日目 2-2：…（a22_explore）／会話 a22_enter 340行目「…」／戦闘 R3（…）」） */
export function formatPlace(p: MemoPlace): string {
  const parts: string[] = [];
  if (p.event) parts.push(`${p.day !== undefined ? `${p.day}日目 ` : ''}${p.eventTitle ?? ''}（${p.event}）`);
  if (p.scene) parts.push(`会話 ${p.scene}${p.line !== undefined ? ` ${p.line}行目` : ''}${p.text ? `「${p.text.length > 30 ? `${p.text.slice(0, 30)}…` : p.text}」` : ''}`);
  if (p.battle) parts.push(`戦闘${p.round !== undefined ? ` R${p.round}` : ''}（${p.battle}）`);
  if (p.area) parts.push(`探索 ${p.area}${p.room ? ` の ${p.room}` : ''}`);
  if (parts.length === 0 && p.screen) parts.push(`画面 ${p.screen}`);
  return parts.join('／');
}

/** 一覧を、会話に貼る文にする（書いた順。版は最後のメモのものを頭に1回だけ） */
export function formatMemos(list: Memo[]): string {
  if (list.length === 0) return '（メモはありません）';
  const build = list.at(-1)!.place.build;
  const head = `遊びながらのメモ ${list.length}件${build ? `（版 ${build}）` : ''}`;
  const rows = list.map((m, i) => {
    const old = m.place.build && build && m.place.build !== build ? `（前の版 ${m.place.build}）` : '';
    return `${i + 1}. 【${m.kind}】${m.body}\n   場所：${formatPlace(m.place) || '不明'}${old}`;
  });
  return [head, ...rows].join('\n');
}
