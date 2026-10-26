import type { MapEdits } from '../core';
import { exportMapEdits, isEmptyMapEdits, parseMapEdits } from '../core';
import { browserStorage } from '../save/storage';

// 地図の調整（段階117）の、覚えておく所と書き出しの窓。直した中身はこの端末の中にだけ置き、?debug=1 の時だけ探索が使う

const KEY = 'restopia.mapEdits';
const Z = 9200;

export function loadMapEdits(): MapEdits {
  return parseMapEdits(browserStorage().read(KEY));
}

export function saveMapEdits(edits: MapEdits): void {
  const storage = browserStorage();
  if (isEmptyMapEdits(edits)) storage.remove(KEY);
  else storage.write(KEY, JSON.stringify(edits));
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.style.cssText = css;
  e.textContent = text;
  return e;
}

const BUTTON_CSS = 'display:block;width:100%;min-height:44px;margin:6px 0;padding:8px;font:14px sans-serif;color:#fff;background:#2a3b4e;border:1px solid #3e5670;border-radius:6px;';

/** 書き出しの窓：直した中身を文にして見せ、写す。「全部消す」は2回押すと消す（onClear を呼ぶ） */
export function showMapEditPanel(edits: MapEdits, onClear: () => void): void {
  const panel = el(
    'div',
    `position:fixed;inset:0;z-index:${Z};background:rgba(0,0,0,0.9);overflow-y:auto;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;color:#fff;font:14px sans-serif;`,
  );
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'keyup']) panel.addEventListener(type, (e) => e.stopPropagation());
  const close = () => panel.remove();
  const button = (label: string, onClick: (b: HTMLButtonElement) => void, css = '') => {
    const b = el('button', BUTTON_CSS + css, label);
    b.addEventListener('click', () => onClick(b));
    return b;
  };
  const empty = isEmptyMapEdits(edits);
  const text = exportMapEdits(edits);
  const note = el('div', 'margin:8px 0;color:#9fe8ff;', empty ? 'まだ何も直していません' : '下の文を写して、開発の会話に貼ってください');
  const area = el('textarea', 'width:100%;height:50vh;box-sizing:border-box;font:11px monospace;color:#fff;background:#121c26;border:1px solid #3e5670;border-radius:6px;');
  area.value = empty ? '' : text;
  area.readOnly = true;
  let armed = false;
  panel.append(
    el('div', 'font:bold 16px sans-serif;color:#9fe8ff;margin-bottom:8px;', '地図の調整：書き出し'),
    note,
    button('写す（会話に貼る）', () => {
      if (empty) return;
      navigator.clipboard?.writeText(text).then(
        () => (note.textContent = '写しました。開発の会話に貼ってください'),
        () => {
          note.textContent = '写せませんでした。下の文を長押しして全部選んでください';
          area.select();
        },
      );
    }, 'background:#1f5a3a;border-color:#6dff9e;'),
    area,
    button('閉じる', close),
    button('直したものを全部消す（元の地図に戻す）', (b) => {
      if (!armed) {
        armed = true;
        b.textContent = 'もう一度押すと全部消します';
        return;
      }
      onClear();
      close();
    }, 'background:#4a2a2a;border-color:#a05050;'),
  );
  document.body.append(panel);
}

