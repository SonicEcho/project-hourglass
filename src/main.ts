import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { formatBuildInfo } from './debug/buildInfo';
import { isDebugEnabled } from './debug/debugFlag';
import { loadEruda } from './debug/eruda';
import { HelloScene } from './scenes/HelloScene';

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
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [HelloScene],
});
