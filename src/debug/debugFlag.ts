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

const TRIAL_OFF_KEY = 'restopia.trialOff';

/**
 * 試しの切り替え（段階255。docs/milestones/M3_battle_tension.md）：デバッグの時だけ、試しを前の形に戻して比べられる。
 * デバッグでない時は、いつも試しの形
 */
export function trialOff(id: string): boolean {
  try {
    if (!isDebugEnabled(window.location.search)) return false;
    const list = JSON.parse(localStorage.getItem(TRIAL_OFF_KEY) ?? '[]') as unknown;
    return Array.isArray(list) && list.includes(id);
  } catch {
    return false;
  }
}

export function setTrialOff(id: string, off: boolean): void {
  try {
    const raw = JSON.parse(localStorage.getItem(TRIAL_OFF_KEY) ?? '[]') as unknown;
    const list = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string' && x !== id) : [];
    if (off) list.push(id);
    localStorage.setItem(TRIAL_OFF_KEY, JSON.stringify(list));
  } catch {
    // 保存できない時は何もしない
  }
}
