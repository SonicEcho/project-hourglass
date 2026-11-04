import Phaser from 'phaser';
import type { AssetEntry } from '../data';
import { ASSETS } from '../data';
import { background, isBootAsset, isLoadable, preloadQueue, queueFiles, watchLoadErrors } from '../assets/loader';

/**
 * 裏での読み込み（段階69）：起動の画面で読まなかった素材（立ち絵・背景・地図・1枚絵・敵の絵）を、タイトルを出した後に読む。
 * 画面には何も描かず、読み終えても止めない（止めると読み込みが途中で切れるため。ほかの画面の行き来とは関係なく動き続ける）。
 * 段階148：少しずつ（BATCH 枚ずつ）読み、先に要る絵を渡されたら（preloadQueue.prioritize）、それを先に読む。
 * 遊び始める・場面が替わる時は、その場面で使う絵だけを待つ（ui/waitImages.ts）。残りは遊んでいる間に読む
 */
const BATCH = 6;

export class PreloadScene extends Phaser.Scene {
  private pending: AssetEntry[] = [];
  /** focus で止めている間は、この絵だけを読む */
  private only: Set<string> | null = null;
  private loading = false;

  constructor() {
    super('Preload');
  }

  create(): void {
    this.pending = ASSETS.filter((a) => !isBootAsset(a) && isLoadable(a));
    background.total = this.pending.length;
    background.loaded = 0;
    if (background.total === 0) {
      background.done = true;
      return;
    }
    watchLoadErrors(this);
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, () => (background.loaded += 1));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, () => (background.loaded += 1));
    this.load.on(Phaser.Loader.Events.COMPLETE, () => this.next());
    preloadQueue.prioritize = (ids) => {
      const want = new Set(ids);
      const first = this.pending.filter((a) => want.has(a.id));
      if (first.length === 0) return;
      this.pending = [...first, ...this.pending.filter((a) => !want.has(a.id))];
      // 止めている間でも、先に要ると言われた絵は読む
      if (this.only) for (const id of ids) this.only.add(id);
      if (!this.loading) this.next();
    };
    preloadQueue.focus = (ids) => {
      this.only = new Set();
      preloadQueue.prioritize(ids);
    };
    preloadQueue.hold = () => {
      if (!this.only) this.only = new Set();
    };
    preloadQueue.release = () => {
      this.only = null;
      if (!this.loading) this.next();
    };
    // タイトルを出している間は止めておく（タイトルの画面が hold を呼ぶ前に、読み始めないように）
    this.only = new Set();
    this.next();
  }

  /** 次のひとまとまりを読む。なければ読み終わり */
  private next(): void {
    // 読んでいる途中で先に要る絵を渡された時は、今のまとまりを読み終えてから、その絵を読む
    this.loading = false;
    const only = this.only;
    const take = only ? this.pending.filter((a) => only.has(a.id)).slice(0, BATCH) : this.pending.slice(0, BATCH);
    // 止めている間に読む物がなくなったら、release を待つ
    if (only && take.length === 0) return;
    this.pending = this.pending.filter((a) => !take.includes(a));
    const batch = take.filter((a) => !this.textures.exists(a.id));
    if (batch.length === 0 && this.pending.length === 0) {
      background.loaded = background.total;
      background.done = true;
      return;
    }
    if (batch.length === 0) {
      this.next();
      return;
    }
    queueFiles(this, batch);
    this.loading = true;
    this.load.start();
  }
}
