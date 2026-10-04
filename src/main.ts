import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { formatBuildInfo } from './debug/buildInfo';
import { isDebugEnabled } from './debug/debugFlag';
import { loadEruda } from './debug/eruda';
import { BattleScene } from './scenes/BattleScene';
import { RENDER_SCALE } from './ui/theme';

const debug = isDebugEnabled(window.location.search);

const buildInfoEl = document.getElementById('build-info');
if (buildInfoEl) {
  buildInfoEl.textContent = (debug ? '[debug] ' : '') + formatBuildInfo(__BUILD_TIME__, __COMMIT_ID__);
}

if (debug) {
  loadEruda()
    .then(() => console.log('[debug] eruda loaded', { build: __BUILD_TIME__, commit: __COMMIT_ID__ }))
    .catch((e) => console.error('[debug] failed to load eruda', e));
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#101820',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 高解像度の画面でにじまないよう、内部は RENDER_SCALE 倍で描く（座標は 390×844 のまま）
    width: GAME_WIDTH * RENDER_SCALE,
    height: GAME_HEIGHT * RENDER_SCALE,
  },
  input: { activePointers: 1 },
  scene: [BattleScene],
});
