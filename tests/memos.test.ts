import { describe, expect, it } from 'vitest';
import { addMemo, clearMemos, formatMemos, formatPlace, MEMO_KEY, readMemos, removeMemo } from '../src/debug/memos';
import type { SaveStorage } from '../src/save/storage';

function memoryStorage(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, read: (k) => data.get(k) ?? null, write: (k, t) => (data.set(k, t), true), remove: (k) => void data.delete(k) };
}

// その場のメモ（段階92）
describe('その場のメモ（段階92）', () => {
  it('書いた順にためて、1件ずつ消せる。壊れた中身は空として読む', () => {
    const st = memoryStorage();
    addMemo(st, '手応え', ' ぬしが長い ', { event: 'a3s_explore2' }, new Date('2026-10-22T00:00:00Z'));
    const list = addMemo(st, '不具合', '文字がはみ出す', {}, new Date('2026-10-22T00:01:00Z'));
    expect(list.map((m) => [m.id, m.kind, m.body])).toEqual([
      [1, '手応え', 'ぬしが長い'],
      [2, '不具合', '文字がはみ出す'],
    ]);
    expect(removeMemo(st, 1).map((m) => m.id)).toEqual([2]);
    clearMemos(st);
    expect(readMemos(st)).toEqual([]);
    st.write(MEMO_KEY, '{壊れた');
    expect(readMemos(st)).toEqual([]);
  });

  it('場所を1行に、一覧を貼れる文にする', () => {
    expect(
      formatPlace({ day: 25, event: 'a3s_explore2', eventTitle: '祭りの夜：2晩目', scene: 'a3s_edge', line: 1520, text: 'あれは、百年分の、すり切れです。何度も見られた夜の、ほつれ。毎晩' }),
    ).toBe('25日目 祭りの夜：2晩目（a3s_explore2）／会話 a3s_edge 1520行目「あれは、百年分の、すり切れです。何度も見られた夜の、ほつれ。…」');
    expect(formatPlace({ battle: 'やぐらのぬし', round: 3, area: 'a3s2', room: 'matsuri_edge' })).toBe('戦闘 R3（やぐらのぬし）／探索 a3s2 の matsuri_edge');
    expect(formatPlace({ screen: 'Title' })).toBe('画面 Title');
    const st = memoryStorage();
    addMemo(st, 'その他', 'a', { build: 'v1' }, new Date());
    const list = addMemo(st, '見た目', 'b', { build: 'v2', screen: 'Party' }, new Date());
    expect(formatMemos(list)).toBe('遊びながらのメモ 2件（版 v2）\n1. 【その他】a\n   場所：不明（前の版 v1）\n2. 【見た目】b\n   場所：画面 Party');
    expect(formatMemos([])).toBe('（メモはありません）');
  });
});
