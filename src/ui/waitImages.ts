import Phaser from 'phaser';
import { BACKDROPS, CAST, CGS, PORTRAIT_PARTS, SCENES } from '../data';
import { background, preloadQueue, unsettled } from '../assets/loader';
import { sceneImageIds } from '../assets/sceneImages';
import { screenImages } from '../assets/screenImages';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS } from './theme';
import { addText } from './widgets';

// 場面で使う絵を待つ（段階148）。まだ読んでいない絵があれば、それを先に読ませ、読み終えるまで暗い画面に進み具合を出す。
// 前は遊び始める時に全部の絵（約350枚）を待っていた。再開のたびに20秒ほど待たされたので、その場面の絵だけを待つ形にした

/** 会話の場面で使う絵 */
export function dialogueImages(sceneIds: string[]): string[] {
  const data = { cast: CAST, backdrops: BACKDROPS, cgs: CGS, parts: PORTRAIT_PARTS };
  return sceneIds.flatMap((id) => {
    const scene = SCENES.find((s) => s.id === id);
    return scene ? sceneImageIds(scene, data) : [];
  });
}

/** その絵がそろっていれば、すぐ then。そろっていなければ先に読ませ、読み終えるまで待ってから then */
export function waitImages(scene: Phaser.Scene, ids: string[], then: () => void): void {
  const left = () => (ids === ALL ? (background.done ? [] : ['*']) : unsettled(scene, ids));
  if (left().length === 0) {
    then();
    return;
  }
  // 段階150：待つ間は、その絵だけを読む（ほかの絵も一緒に読むと、絵を画面に載せる手間の取り合いで待ちが延びる）。
  // 読み終えて画面が始まり、少ししてから残りを裏で読み始める
  if (ids !== ALL) preloadQueue.focus(ids);
  else preloadQueue.release();
  const total = ids === ALL ? 0 : unsettled(scene, ids).length;
  const layer = scene.add.container(0, 0).setDepth(3000);
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1).setOrigin(0).setInteractive());
  layer.add(addText(scene, GAME_WIDTH / 2, 380, '絵を読み込んでいます', { size: 16, color: COLORS.accentText }).setOrigin(0.5));
  const barW = 240;
  layer.add(scene.add.rectangle(GAME_WIDTH / 2 - barW / 2, 420, barW, 6, COLORS.panel).setOrigin(0, 0.5));
  const bar = scene.add.rectangle(GAME_WIDTH / 2 - barW / 2, 420, 0, 6, COLORS.accent).setOrigin(0, 0.5);
  layer.add(bar);
  const timer = scene.time.addEvent({
    delay: 100,
    loop: true,
    callback: () => {
      const rest = left().length;
      bar.width = barW * (ids === ALL ? background.loaded / Math.max(1, background.total) : 1 - rest / Math.max(1, total));
      if (rest > 0) return;
      timer.remove();
      layer.destroy(true);
      // 画面が替わるとその画面の時計は止まるので、ブラウザの時計で
      if (ids !== ALL) window.setTimeout(() => preloadQueue.release(), 1500);
      then();
    },
  });
}

/**
 * 遊び始める時（タイトルの「はじめる」「つづきから」）：最初の会話の場面の絵だけを読み、ほかの絵は止める。
 * 裏で絵を読むと、絵を画面に載せる手間で画面の動き（タイトルの余韻など）が遅くなり、再開まで十数秒かかっていた。
 * 会話の画面が始まって少ししたら、残りを読み始める（releaseSoon）
 */
export function focusImages(ids: string[]): void {
  preloadQueue.focus(ids);
}

/** 止めていた裏の読み込みを、少し置いてから再び始める */
export function releaseSoon(scene: Phaser.Scene, ms = 1500): void {
  scene.time.delayedCall(ms, () => preloadQueue.release());
}

/** その画面（会話のほか）を、その画面で使う絵がそろってから開く（段階150。わからない画面は全部の絵を待つ） */
export function startWithImages(scene: Phaser.Scene, key: string, data: object): void {
  waitImages(scene, screenImages(key, data as Record<string, unknown>, ALL), () => scene.scene.start(key, data));
}

/** waitImages に渡すと、全部の絵を待つ */
export const ALL: string[] = [];
