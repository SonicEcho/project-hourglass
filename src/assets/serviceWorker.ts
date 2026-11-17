// 端末にしまう仕組み（段階70）の登録。段階76 で、vite-plugin-pwa の登録（registerSW.js。登録するだけ）を、これに替えた。
// 新しい版があるかをブラウザ任せにせず、開いた時と、裏から戻った時に自分で確かめる（docs/design/tech.md の決定の記録）。
// 新しい版は読み終えたらすぐ切り替わる（vite.config.ts の skipWaiting・clientsClaim）ので、次に開いた時から新しい版になる

export function installServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const install = () => {
    const base = import.meta.env.BASE_URL;
    // 登録済みなら、その登録で確かめる（登録済みの時に register を呼ぶと、終わらないまま止まることがあった。手元の Chromium）
    navigator.serviceWorker
      .getRegistration(base)
      .then((found) => found ?? navigator.serviceWorker.register(`${base}sw.js`, { scope: base }))
      .then((reg) => {
        const check = () => reg.update().catch((e) => console.warn('[sw] 新しい版を確かめられなかった', e));
        check();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
      })
      .catch((e) => console.warn('[sw] 登録できなかった', e));
    // 遊んでいる途中で新しい版に切り替わったら、読み直すよう知らせる（2026-11-17。古いプログラムのまま新しい絵を読むと、
    // まばたき・口パクの部品が違う場所に出た）。最初の登録（前の版がない時）は知らせない
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('controllerchange', showUpdateBanner, { once: true });
    }
  };
  // 端末にしまった版から開くと、ここに来る前にページの読み込みが終わっていることがある（load を待つと、いつまでも動かない）
  if (document.readyState === 'complete') install();
  else window.addEventListener('load', install);
}

/** 画面の上に「新しい版になりました」の帯を出す。タップで読み直す（遊んだところは、最後に保存した所から続く） */
function showUpdateBanner(): void {
  if (document.getElementById('update-banner')) return;
  const el = document.createElement('div');
  el.id = 'update-banner';
  el.textContent = '新しい版になりました。ここをタップで読み直す';
  el.style.cssText =
    'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:10000;padding:10px 16px;background:#e8193f;color:#fff;' +
    'font:bold 13px sans-serif;border:2px solid #fff;box-shadow:3px 3px 0 #000;cursor:pointer;white-space:nowrap';
  el.addEventListener('click', () => location.reload());
  document.body.appendChild(el);
}
