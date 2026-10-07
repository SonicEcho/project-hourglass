import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { formatBuildInfo } from './debug/buildInfo';
import { isDebugEnabled } from './debug/debugFlag';
import { installDebugMenu } from './debug/debugMenu';
import { loadEruda } from './debug/eruda';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { ProtoDialogueScene } from './scenes/ProtoDialogueScene';
import { ProtoExploreScene } from './scenes/ProtoExploreScene';
import { GrowthScene } from './scenes/GrowthScene';
import { NaviScene } from './scenes/NaviScene';
import { WeaponScene } from './scenes/WeaponScene';
import { ResultScene } from './scenes/ResultScene';
import { allBattles, progressAt } from './core';
import { STORY } from './data';
import { initRunFromUrl, run, saveRun, startNewRun } from './scenes/run';
import { TitleScene } from './scenes/TitleScene';
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

initRunFromUrl();

// ブラウザが裏に回った時（アプリの切り替え、タブを閉じる）も保存する。戦闘中なら、その戦闘の前の状態が保存される
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveRun();
});
window.addEventListener('pagehide', () => saveRun());

const game = new Phaser.Game({
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
  // 最初の Boot で素材を読み込んでからタイトルへ（段階15）
  scene: [BootScene, TitleScene, CreditsScene, GrowthScene, NaviScene, WeaponScene, BattleScene, ResultScene, ProtoExploreScene, ProtoDialogueScene],
});

if (debug) {
  /** 今動いている画面から、別の画面に切り替える */
  const goTo = (key: string, data: object) => {
    const current = game.scene.getScenes(true)[0];
    if (current) current.scene.start(key, data);
    else game.scene.start(key, data);
  };
  installDebugMenu({
    startBoss: () => {
      // 最後の戦闘（ボス）。日はそのまま
      run.progress = progressAt(STORY, allBattles(STORY).length - 1, run.progress.day);
      goTo('Battle', { progress: run.progress });
    },
    restartRun: () => {
      startNewRun();
      goTo('Growth', {});
    },
    refreshGrowth: () => {
      const growth = game.scene.getScene('Growth') as GrowthScene | null;
      growth?.refresh();
      const navi = game.scene.getScene('Navi') as NaviScene | null;
      navi?.refresh();
      const weapon = game.scene.getScene('Weapon') as WeaponScene | null;
      weapon?.refresh();
    },
    openPrototype: (key) => goTo(key, {}),
  });
}
