import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { formatBuildInfo } from './debug/buildInfo';
import { isDebugEnabled } from './debug/debugFlag';
import { installDebugMenu } from './debug/debugMenu';
import { installPlaytime } from './debug/playtime';
import { loadEruda } from './debug/eruda';
import { installTestHook } from './debug/testHook';
import { installMemoPanel } from './debug/memoPanel';
import type { MemoPlace } from './debug/memos';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { CreditsScene } from './scenes/CreditsScene';
import { DialogueScene } from './scenes/DialogueScene';
import { FlowScene } from './scenes/FlowScene';
import { DailyScene } from './scenes/DailyScene';
import { ChestMapScene } from './scenes/ChestMapScene';
import { ExploreScene } from './scenes/ExploreScene';
import { ReturnScene } from './scenes/ReturnScene';
import { ProtoExploreScene } from './scenes/ProtoExploreScene';
import { GrowthScene } from './scenes/GrowthScene';
import { NaviScene } from './scenes/NaviScene';
import { WeaponScene } from './scenes/WeaponScene';
import { WeaponTreeScene } from './scenes/WeaponTreeScene';
import { AlbumScene } from './scenes/AlbumScene';
import { PartyScene } from './scenes/PartyScene';
import { HubScene } from './scenes/HubScene';
import { ExchangeScene } from './scenes/ExchangeScene';
import { LostScene } from './scenes/LostScene';
import { TalkArchiveScene } from './scenes/TalkArchiveScene';
import { ResultScene } from './scenes/ResultScene';
import { findEvent } from './core';
import { SLICE_FLOW } from './data';
import { getActiveBattle, initRunFromUrl, isSaveFailing, markStaleByOtherTab, onSaveStatus, run, SAVE_KEY, saveRun, setHubReturn, startNewRun } from './scenes/run';
import { installSaveNotice, showStaleNotice } from './ui/saveNotice';
import { notePlayInput, tickPlayRecord } from './scenes/playRecord';
import { PlayLogScene } from './scenes/PlayLogScene';
import { TitleScene } from './scenes/TitleScene';
import { RENDER_SCALE } from './ui/theme';
import { installServiceWorker } from './assets/serviceWorker';

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
installServiceWorker();

// 保存できていない時の印（段階124）
const saveNoticeEl = document.getElementById('save-notice');
if (saveNoticeEl) installSaveNotice(saveNoticeEl, { onStatus: onSaveStatus, isFailing: isSaveFailing, retry: saveRun });

// ほかのタブで保存が書き換わった時（段階134）：遊んでいる途中なら、このタブの保存を止めて、開き直しを勧める
window.addEventListener('storage', (e) => {
  if (e.key !== SAVE_KEY || !run.active) return;
  markStaleByOtherTab();
  const el = document.getElementById('stale-notice');
  if (el) showStaleNotice(el);
});

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
  scene: [BootScene, PreloadScene, TitleScene, CreditsScene, GrowthScene, NaviScene, WeaponScene, WeaponTreeScene, AlbumScene, PartyScene, BattleScene, ResultScene, ProtoExploreScene, DialogueScene, FlowScene, DailyScene, ExploreScene, ReturnScene, PlayLogScene, HubScene, ExchangeScene, LostScene, TalkArchiveScene, ChestMapScene],
});

if (debug) {
  /** 今動いている画面から、別の画面に切り替える */
  const goTo = (key: string, data: object) => {
    // 裏で読み込んでいる画面（段階69）は除く
    const current = game.scene.getScenes(true).find((s) => s.scene.key !== 'Preload');
    if (current) current.scene.start(key, data);
    else game.scene.start(key, data);
  };
  installDebugMenu({
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
    openExplore: (area) => goTo('Explore', { area, won: undefined, lost: undefined, seen: undefined, hunt: undefined }),
    openMapTune: (area, night, room) => goTo('Explore', { area, won: undefined, lost: undefined, seen: undefined, hunt: undefined, night, tune: { room, edit: true } }),
  });
  // その場のメモ（段階92）：書いた時の場所を集める
  installMemoPanel(() => {
    const keys = game.scene.getScenes(true).map((sc) => sc.scene.key).filter((k) => k !== 'Preload');
    const place: MemoPlace = { screen: keys.join('・'), build: formatBuildInfo(__BUILD_TIME__, __COMMIT_ID__) };
    if (run.active) {
      place.day = run.progress.day;
      place.event = run.event;
      place.eventTitle = findEvent(SLICE_FLOW, run.event)?.title;
    }
    if (keys.includes('Dialogue')) {
      const line = (game.scene.getScene('Dialogue') as DialogueScene).memoLine();
      if (line) Object.assign(place, line);
    }
    const battle = keys.includes('Battle') ? getActiveBattle()?.getState() : undefined;
    if (battle) {
      place.battle = battle.enemies.map((e) => e.name).join('・');
      place.round = battle.round;
    }
    if (keys.includes('Explore') && run.explore) {
      place.area = run.explore.area;
      place.room = run.explore.room;
    }
    return place;
  });
  installTestHook(game);
  // プレイ時間の記録（段階63）
  installPlaytime(game);
}
