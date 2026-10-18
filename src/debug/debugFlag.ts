/** URL のクエリに `debug=1` がある時だけデバッグ機能を有効にする */
export function isDebugEnabled(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1';
}

const AUTO_STORY_KEY = 'restopia.debugAutoStory';

/** デバッグの時だけ：物語の1回目の探索でもオートを出す（段階64。デバッグメニューで切り替える） */
export function debugAutoStory(): boolean {
  try {
    return isDebugEnabled(window.location.search) && localStorage.getItem(AUTO_STORY_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDebugAutoStory(on: boolean): void {
  try {
    if (on) localStorage.setItem(AUTO_STORY_KEY, '1');
    else localStorage.removeItem(AUTO_STORY_KEY);
  } catch {
    // 保存できない時は何もしない
  }
}
