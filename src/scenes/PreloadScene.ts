import Phaser from 'phaser';
import { background, isBootAsset, queueAssets } from '../assets/loader';

/**
 * 裏での読み込み（段階69）：起動の画面で読まなかった素材（立ち絵・背景・地図・1枚絵・敵の絵）を、タイトルを出した後に読む。
 * 画面には何も描かず、読み終えても止めない（止めると読み込みが途中で切れるため。ほかの画面の行き来とは関係なく動き続ける）。
 * タイトルから遊び始める時は、読み終えるまで待つ（TitleScene の waitBgm）
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    queueAssets(this, (a) => !isBootAsset(a));
    background.total = this.load.list.size;
    if (background.total === 0) {
      background.done = true;
      return;
    }
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, () => (background.loaded = this.load.totalComplete));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, () => (background.loaded = this.load.totalComplete + this.load.totalFailed));
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      background.loaded = background.total;
      background.done = true;
    });
    this.load.start();
  }
}
