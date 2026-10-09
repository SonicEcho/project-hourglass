import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { formatBuildInfo } from './debug/buildInfo';
import { isDebugEnabled } from './debug/debugFlag';
import { installDebugMenu } from './debug/debugMenu';
import { loadEruda } from './debug/eruda';
import { installTestHook } from './debug/testHook';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { DialogueScene } from './scenes/DialogueScene';
import { FlowScene } from './scenes/FlowScene';
import { DailyScene } from './scenes/DailyScene';
import { ExploreScene } from './scenes/ExploreScene';
import { ReturnScene } from './scenes/ReturnScene';
import { ProtoExploreScene } from './scenes/ProtoExploreScene';
import { GrowthScene } from './scenes/GrowthScene';
import { NaviScene } from './scenes/NaviScene';
import { WeaponScene } from './scenes/WeaponScene';
import { ResultScene } from './scenes/ResultScene';
import { allBattles, progressAt } from './core';
import { STORY } from './data';
import { initRunFromUrl, run, saveRun, setHubReturn, startNewRun } from './scenes/run';
import { notePlayInput, tickPlayRecord } from './scenes/playRecord';
import { PlayLogScene } from './scenes/PlayLogScene';
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

// 遊んだ記録（段階32b）：画面が表に出ていて、最近触っている間だけ、今の出来事にいた時間を数える
const tickPlay = () => tickPlayRecord(run.active ? run.event : null, document.visibilityState === 'visible');
window.setInterval(tickPlay, 5000);
window.addEventListener('pointerdown', () => notePlayInput(), { capture: true });
document.addEventListener('visibilitychange', () => {
  // 裏に回る直前までの分を足してから止める（表に戻った時は、そこから数え直す）
  if (document.visibilityState === 'hidden') tickPlayRecord(run.active ? run.event : null, true);
  tickPlay();
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#121831',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 高解像度の画面でにじまないよう、内部は RENDER_SCALE 倍で描く（座標は 390×844 のまま）
    width: GAME_WIDTH * RENDER_SCALE,
    height: GAME_HEIGHT * RENDER_SCALE,
  },
  input: { activePointers: 1 },
  // 最初の Boot で素材を読み込んでからタイトルへ（段階15）
  scene: [BootScene, TitleScene, CreditsScene, GrowthScene, NaviScene, WeaponScene, BattleScene, ResultScene, ProtoExploreScene, DialogueScene, FlowScene, DailyScene, ExploreScene, ReturnScene, PlayLogScene],
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
      setHubReturn(null);
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
    openPrototype: (key, data = {}) => goTo(key, data),
    openDialogue: (data) => goTo('Dialogue', data),
    openFlow: () => goTo('Flow', { done: false }),
    openExplore: (area) => goTo('Explore', { area, won: undefined, lost: undefined, seen: undefined }),
  });
  installTestHook(game);
}
