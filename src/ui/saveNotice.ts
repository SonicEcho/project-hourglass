import type { SaveResult } from '../scenes/run';

// 保存できていない時の印（段階124。レビューの項目1。docs/design/run.md の セーブ）。
// どの画面でも出るよう、ゲームの画面の外（HTML）に置く。書き込めない間だけ上の真ん中に出し、タップでもう一度保存する。
// 書き込めたら「保存できました」を少し見せて消す。失敗のたびに増やさず、印は1つだけ

export interface SaveNoticeDeps {
  /** 保存できていない状態が変わったら知らせる。戻り値で止める */
  onStatus: (fn: (failing: boolean) => void) => () => void;
  isFailing: () => boolean;
  /** もう一度保存する */
  retry: () => SaveResult;
}

const FAILING_TEXT = '⚠ 保存できていません・タップで再保存';

export function installSaveNotice(el: HTMLElement, deps: SaveNoticeDeps): void {
  let hideTimer: number | undefined;
  const show = (text: string, ok: boolean) => {
    window.clearTimeout(hideTimer);
    el.textContent = text;
    el.classList.toggle('ok', ok);
    el.hidden = false;
  };
  const update = (failing: boolean) => {
    if (failing) show(FAILING_TEXT, false);
    else if (!el.hidden) {
      show('保存できました', true);
      hideTimer = window.setTimeout(() => (el.hidden = true), 1500);
    }
  };
  el.hidden = true;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const r = deps.retry();
    // まだ書き込めない時は、押したことが分かるよう言葉を変える（印は残す）
    if (r === 'failed') show('⚠ まだ保存できません（空き容量・プライベートモード？）', false);
    else if (r === 'skipped') el.hidden = true;
  });
  deps.onStatus(update);
  if (deps.isFailing()) update(true);
}
