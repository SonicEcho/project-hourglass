import Phaser from 'phaser';

// 全画面（段階48。docs/design/tech.md の 8.）。
// Android の Chrome はアドレスバーの帯が勝手に隠れたり出たりするので、ゲームの中のボタンで全画面にできるようにする。
// ホーム画面のアイコンから開いた時（manifest の display: fullscreen）は、もう全画面なのでボタンを出さない

/** ホーム画面のアイコンから、アプリのように開いているか（Fullscreen API の全画面とは別） */
function isAppMode(): boolean {
  if (document.fullscreenElement) return false;
  return ['fullscreen', 'standalone'].some((m) => window.matchMedia?.(`(display-mode: ${m})`).matches);
}

/** ゲームの中の全画面のボタンを出すか。全画面にできないブラウザ（iPhone の Safari など）とアプリとして開いた時は出さない */
export function canToggleFullscreen(): boolean {
  return document.fullscreenEnabled === true && !isAppMode();
}

export function isFullscreen(): boolean {
  return document.fullscreenElement != null;
}

/** 全画面にする・やめる。ボタンを押した直後に呼ぶ（ブラウザは、画面に触れてから少しの間だけ全画面を許す） */
export function toggleFullscreen(): void {
  if (isFullscreen()) {
    document.exitFullscreen().catch((e) => console.warn('[fullscreen] やめられませんでした', e));
    return;
  }
  document.documentElement
    .requestFullscreen({ navigationUI: 'hide' })
    .then(() => {
      // 縦持ちのゲームなので、できる端末では縦向きに固定する（できなくても困らない）
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      orientation.lock?.('portrait').catch(() => undefined);
    })
    .catch((e) => console.warn('[fullscreen] 全画面にできませんでした', e));
}

/** 全画面になった・やめた時に呼ぶ（戻る操作でやめた時も）。画面を閉じたら外す */
export function onFullscreenChange(scene: Phaser.Scene, fn: () => void): void {
  document.addEventListener('fullscreenchange', fn);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener('fullscreenchange', fn));
}
