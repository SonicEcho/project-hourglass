/**
 * 保存の窓口（段階11）。読む・書く・消すだけを受け持つ。
 * 今はブラウザの保存（localStorage）を使う。アプリにする時は、この中身だけを差し替える。
 * 保存できない時（容量がいっぱい、プライベートモードなど）も、遊びは止めずにコンソールにエラーを出す
 */
export interface SaveStorage {
  read(key: string): string | null;
  write(key: string, text: string): boolean;
  remove(key: string): void;
}

/** ブラウザの保存（localStorage） */
export function browserStorage(): SaveStorage {
  return {
    read(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error('[save] read failed', e);
        return null;
      }
    },
    write(key, text) {
      try {
        window.localStorage.setItem(key, text);
        return true;
      } catch (e) {
        console.error('[save] write failed', e);
        return false;
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('[save] remove failed', e);
      }
    },
  };
}

/** メモリの中だけの保存（テスト用、または保存が使えない時の代わり） */
export function memoryStorage(): SaveStorage {
  const m = new Map<string, string>();
  return {
    read: (key) => m.get(key) ?? null,
    write: (key, text) => {
      m.set(key, text);
      return true;
    },
    remove: (key) => {
      m.delete(key);
    },
  };
}
