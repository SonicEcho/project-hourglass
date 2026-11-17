import Phaser from 'phaser';
import { BACKDROPS, CAST, CGS, PORTRAIT_PARTS, SCENES } from '../data';
import { preloadQueue, unloadExcept, unsettled } from '../assets/loader';
import { loadSegment, segmentImages } from '../assets/screenImages';
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
export function waitImages(scene: Phaser.Scene, ids0: string[], then: () => void, label = '絵を読み込んでいます'): void {
  // 段階250：「全部の絵」は、今の章の絵のこと（全部を読むと、展開した絵でメモリが足りなくなるため）
  const ids = ids0 === ALL ? [...chapterKeep] : ids0;
  const left = () => unsettled(scene, ids);
  if (left().length === 0) {
    then();
    return;
  }
  // 段階150：待つ間は、その絵だけを読む（ほかの絵も一緒に読むと、絵を画面に載せる手間の取り合いで待ちが延びる）。
  // 読み終えて画面が始まり、少ししてから残りを裏で読み始める
  preloadQueue.focus(ids);
  const total = unsettled(scene, ids).length;
  const layer = scene.add.container(0, 0).setDepth(3000);
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1).setOrigin(0).setInteractive());
  layer.add(addText(scene, GAME_WIDTH / 2, 380, label, { size: 16, color: COLORS.accentText }).setOrigin(0.5));
  const barW = 240;
  layer.add(scene.add.rectangle(GAME_WIDTH / 2 - barW / 2, 420, barW, 6, COLORS.panel).setOrigin(0, 0.5));
  const bar = scene.add.rectangle(GAME_WIDTH / 2 - barW / 2, 420, 0, 6, COLORS.accent).setOrigin(0, 0.5);
  layer.add(bar);
  const timer = scene.time.addEvent({
    delay: 100,
    loop: true,
    callback: () => {
      const rest = left().length;
      bar.width = barW * (1 - rest / Math.max(1, total));
      if (rest > 0) return;
      timer.remove();
      layer.destroy(true);
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

// ---- まとまりの読み込み（段階250） ----

/** 今読んであるまとまり（最初の出来事の id）と、そのまとまりで持っておく絵 */
let loadedSegment: string | null = null;
const chapterKeep = new Set<string>();

/**
 * まとまりが変わったら（はじめから・つづきから・章の始め・区画を返した後）、そのまとまりで使う絵を読み込み画面でまとめて読み、
 * ほかの絵は捨ててから then。同じまとまりのうちは、すぐ then
 */
export function loadSection(scene: Phaser.Scene, eventId: string, then: () => void): void {
  const seg = loadSegment(eventId);
  if (!seg || loadedSegment === seg.id) {
    then();
    return;
  }
  const ids = segmentImages(seg.events);
  chapterKeep.clear();
  for (const id of ids) chapterKeep.add(id);
  // 先に前のまとまりの絵を捨ててから読む（メモリに2つ分を抱えないように）
  unloadExcept(scene, chapterKeep);
  waitImages(
    scene,
    ids,
    () => {
      loadedSegment = seg.id;
      then();
    },
    `${seg.name}を読み込んでいます`,
  );
}
