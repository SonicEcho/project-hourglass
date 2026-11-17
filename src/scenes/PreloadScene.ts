import Phaser from 'phaser';
import type { AssetEntry } from '../data';
import { ASSETS } from '../data';
import { isLoadable, preloadQueue, queueFiles, watchLoadErrors } from '../assets/loader';

/**
 * 絵の読み込み係（段階69。段階250 で作り直した）：画面には何も描かず、頼まれた絵だけを少しずつ（BATCH 枚ずつ）読む。
 * 段階148〜150 では、タイトルの後に全部の絵（580枚）を遊びながら裏で読んでいた。絵を画面用に展開する手間で遊んでいる画面が
 * カクつき、展開した絵は全部で約2.7GBになって、スマホのメモリも足りなくなった（2026-11-17 開発者の声）。
 * 今は、章が変わる時に、その章で使う絵だけを読み込み画面で読む（FlowScene・ui/waitImages.ts の chapter の読み込み）。
 * 遊んでいる間は、章に入っていない絵が要る時だけ、その画面の前に読む
 */
const BATCH = 6;

export class PreloadScene extends Phaser.Scene {
  private queue: AssetEntry[] = [];
  private loading = false;

  constructor() {
    super('Preload');
  }

  create(): void {
    watchLoadErrors(this);
    this.load.on(Phaser.Loader.Events.COMPLETE, () => this.next());
    const byId = new Map(ASSETS.filter((a) => a.kind === 'image' && isLoadable(a)).map((a) => [a.id, a]));
    preloadQueue.prioritize = (ids) => {
      const queued = new Set(this.queue.map((a) => a.id));
      const want = [...new Set(ids)].map((id) => byId.get(id)).filter((a): a is AssetEntry => !!a && !queued.has(a.id) && !this.textures.exists(a.id));
      if (want.length === 0) return;
      // 新しく頼まれた絵を先に読む
      this.queue = [...want, ...this.queue];
      if (!this.loading) this.next();
    };
    preloadQueue.focus = (ids) => preloadQueue.prioritize(ids);
    preloadQueue.release = () => {};
    preloadQueue.hold = () => {};
  }

  /** 次のひとまとまりを読む。なければ待つ */
  private next(): void {
    this.loading = false;
    const batch = this.queue.splice(0, BATCH).filter((a) => !this.textures.exists(a.id));
    if (batch.length === 0) {
      if (this.queue.length > 0) this.next();
      return;
    }
    queueFiles(this, batch);
    this.loading = true;
    this.load.start();
  }
}
