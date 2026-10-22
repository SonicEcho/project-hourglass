import { browserStorage } from '../save/storage';
import type { MemoKind, MemoPlace } from './memos';
import { addMemo, clearMemos, formatMemos, formatPlace, MEMO_KINDS, readMemos, removeMemo } from './memos';

// その場のメモの窓（段階92）：画面の左下の「メモ」から、どの画面でも開ける（?debug=1 の時だけ main.ts から呼ぶ）。
// 種類を1つ選び、一言書く。書いた時の場所は getPlace で自動で添える。一覧の「全部写す」で、会話に貼る文をクリップボードへ

/** メモのボタンはデバッグメニューの下（メニューを開いている時は隠れる）、メモの窓はメニューの上 */
const Z = 9000;
const PANEL_Z = 9100;
const BUTTON_CSS =
  'display:block;width:100%;min-height:44px;margin:6px 0;padding:8px;font:14px sans-serif;color:#fff;background:#2a3b4e;border:1px solid #3e5670;border-radius:6px;text-align:left;';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.style.cssText = css;
  e.textContent = text;
  return e;
}

/** 書いた日時を、端末の時刻で「10/22 15:41」に */
function localTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function installMemoPanel(getPlace: () => MemoPlace): void {
  const storage = browserStorage();
  const toggle = el(
    'button',
    `position:fixed;left:52px;bottom:calc(2px + env(safe-area-inset-bottom));z-index:${Z};width:44px;height:22px;font:bold 11px sans-serif;color:#9fe8ff;background:rgba(16,24,32,0.85);border:1px solid #9fe8ff;border-radius:4px;`,
    'メモ',
  );
  const panel = el(
    'div',
    `position:fixed;inset:0;z-index:${PANEL_Z};display:none;background:rgba(0,0,0,0.88);overflow-y:auto;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;color:#fff;font:14px sans-serif;`,
  );
  document.body.append(toggle, panel);
  // 窓の上の操作を、下のゲームの画面へ通さない（文字を打つキーも）
  for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'keyup']) panel.addEventListener(type, (e) => e.stopPropagation());

  const close = () => {
    panel.style.display = 'none';
  };
  const button = (label: string, onClick: () => void, css = '') => {
    const b = el('button', BUTTON_CSS + css, label);
    b.addEventListener('click', onClick);
    return b;
  };
  const title = (text: string) => el('div', 'font:bold 16px sans-serif;color:#9fe8ff;margin-bottom:8px;', text);

  let kind: MemoKind = MEMO_KINDS[0];
  let draft = '';
  let place: MemoPlace = {};

  /** 書く窓 */
  const showWrite = (note = '') => {
    panel.replaceChildren();
    panel.append(title('メモを書く'));
    if (note) panel.append(el('div', 'color:#6dff9e;margin-bottom:8px;', note));
    panel.append(el('div', 'color:#9fb3c8;font-size:12px;margin-bottom:8px;word-break:break-all;', `場所：${formatPlace(place) || '不明'}`));
    const chips = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;');
    for (const k of MEMO_KINDS) {
      const on = k === kind;
      const chip = el('button', `min-height:40px;padding:6px 12px;font:14px sans-serif;border-radius:20px;border:1px solid ${on ? '#9fe8ff' : '#3e5670'};color:${on ? '#101820' : '#fff'};background:${on ? '#9fe8ff' : '#2a3b4e'};`, k);
      chip.addEventListener('click', () => {
        kind = k;
        draft = area.value;
        showWrite();
      });
      chips.append(chip);
    }
    const area = el('textarea', 'display:block;width:100%;min-height:120px;box-sizing:border-box;padding:8px;font:16px sans-serif;color:#fff;background:#0b1218;border:1px solid #3e5670;border-radius:6px;');
    area.id = 'memo-text';
    area.placeholder = '気になったことを一言（音声入力でもよい）';
    area.value = draft;
    panel.append(
      chips,
      area,
      button('書いて閉じる', () => {
        if (!area.value.trim()) {
          draft = '';
          showWrite('何も書いていません');
          return;
        }
        addMemo(storage, kind, area.value, place, new Date());
        draft = '';
        close();
      }, 'background:#1f5a3a;border-color:#6dff9e;'),
      button(`一覧を見る（${readMemos(storage).length}件）`, () => {
        draft = area.value;
        showList();
      }),
      button('閉じる（書いた文は残す）', () => {
        draft = area.value;
        close();
      }),
    );
    area.focus();
  };

  /** 一覧の窓 */
  const showList = (note = '') => {
    const list = readMemos(storage);
    panel.replaceChildren();
    panel.append(title(`メモの一覧（${list.length}件）`));
    if (note) panel.append(el('div', 'color:#6dff9e;margin-bottom:8px;', note));
    const text = formatMemos(list);
    panel.append(
      button('全部写す（会話に貼る）', () => {
        navigator.clipboard?.writeText(text).then(
          () => showList('写しました。開発の会話に貼ってください'),
          () => showList('写せませんでした。下の文を長押しして選んでください'),
        );
      }, 'background:#1f5a3a;border-color:#6dff9e;'),
      button('書く窓へ戻る', () => showWrite()),
    );
    for (const m of list) {
      const row = el('div', 'margin:8px 0;padding:8px;background:#121c26;border:1px solid #3e5670;border-radius:6px;');
      row.append(
        el('div', 'font:bold 13px sans-serif;color:#ffd84a;', `【${m.kind}】${localTime(m.at)}`),
        el('div', 'margin:4px 0;white-space:pre-wrap;user-select:text;-webkit-user-select:text;', m.body),
        el('div', 'font-size:11px;color:#9fb3c8;word-break:break-all;', formatPlace(m.place)),
      );
      const del = el('button', 'margin-top:6px;min-height:36px;padding:4px 12px;font:13px sans-serif;color:#fff;background:#4a2a2a;border:1px solid #a05050;border-radius:6px;', '消す');
      del.addEventListener('click', () => {
        removeMemo(storage, m.id);
        showList('消しました');
      });
      row.append(del);
      panel.append(row);
    }
    if (list.length > 0) {
      panel.append(
        button('全部消す（直してもらった後に）', () => {
          if (!window.confirm(`メモを${list.length}件、全部消しますか？`)) return;
          clearMemos(storage);
          showList('全部消しました');
        }, 'background:#4a2a2a;border-color:#a05050;'),
      );
    }
    panel.append(el('pre', 'white-space:pre-wrap;word-break:break-all;font:11px/1.5 monospace;color:#cfe;background:#0b1218;padding:8px;border-radius:6px;user-select:text;-webkit-user-select:text;', text));
    panel.append(button('閉じる', close));
  };

  toggle.addEventListener('click', () => {
    // 開いた時の場所を覚える（窓を開いている間に画面が変わっても、開いた所を添える）
    try {
      place = getPlace();
    } catch (e) {
      console.error('[memo] place', e);
      place = {};
    }
    showWrite();
    panel.style.display = 'block';
  });
}
