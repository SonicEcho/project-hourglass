import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { STYLE } from './theme';

// 指で上下にずらす一覧（段階231。段階127 のムーブメントの一覧の作りを、ほかの画面でも使えるようにした）。
// 画面を描き直すたびに build で中身の入れ物を作り直す。ずらした量は描き直しても残る。
// 一覧の行を押した時は guard で包む：ずらした後と、見えていない所（一覧の外）を押した時は、押したことにしない

const DRAG_THRESHOLD = 8;

export class ScrollArea {
  scroll = 0;
  private top = 0;
  private bottom = 0;
  private content = 0;
  private drag: { y: number; scroll: number } | null = null;
  private dragged = false;
  private layer?: Phaser.GameObjects.Container;
  private bar?: Phaser.GameObjects.Rectangle;
  private mask?: Phaser.GameObjects.Graphics;

  /** blocked：重なった窓が出ている時など、ずらさない時に true */
  constructor(private scene: Phaser.Scene, private blocked: () => boolean = () => false) {
    const world = (p: Phaser.Input.Pointer) => scene.cameras.main.getWorldPoint(p.x, p.y);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragged = false;
      const y = world(p).y;
      this.drag = !this.blocked() && this.layer?.active && y >= this.top && y <= this.bottom && this.max() > 0 ? { y, scroll: this.scroll } : null;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      const dy = world(p).y - this.drag.y;
      if (!this.dragged && Math.abs(dy) < DRAG_THRESHOLD) return;
      this.dragged = true;
      this.setScroll(this.drag.scroll - dy);
    });
    scene.input.on('pointerup', () => (this.drag = null));
    // PC で見る時のため、ホイールでもずらせる
    scene.input.on('wheel', (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      const y = world(p).y;
      if (this.blocked() || !this.layer?.active || y < this.top || y > this.bottom) return;
      this.setScroll(this.scroll + dy * 0.5);
    });
  }

  /** ずらせる最大の量 */
  max(): number {
    return Math.max(0, this.content - (this.bottom - this.top));
  }

  /** 一番上へ戻す（タブを替えた時など） */
  reset(): void {
    this.scroll = 0;
  }

  /**
   * 一覧の入れ物を作る。中身は y = top から下へ、ずらす前の位置で置く。contentH は中身の高さ。
   * 一覧の上に描く物（見出し・タブ・窓）より先に root へ足すと、それらのボタンが一覧の行より優先して押せる
   */
  build(root: Phaser.GameObjects.Container, top: number, bottom: number, contentH: number): Phaser.GameObjects.Container {
    this.top = top;
    this.bottom = bottom;
    this.content = contentH;
    this.scroll = Math.max(0, Math.min(this.scroll, this.max()));
    const layer = this.scene.add.container(0, -this.scroll);
    root.add(layer);
    this.layer = layer;
    this.mask?.destroy();
    this.mask = this.scene.make.graphics({}).fillRect(0, top - 2, GAME_WIDTH, bottom - top + 4);
    layer.setMask(this.mask.createGeometryMask());
    this.bar = undefined;
    const max = this.max();
    if (max > 0) {
      const h = bottom - top;
      const barH = Math.max(24, (h * h) / (h + max));
      root.add(this.scene.add.rectangle(GAME_WIDTH - 3, top, 3, h, 0xffffff, 0.08).setOrigin(0.5, 0));
      this.bar = this.scene.add.rectangle(GAME_WIDTH - 3, top, 3, barH, STYLE.red, 0.9).setOrigin(0.5, 0);
      root.add(this.bar);
      this.moveBar();
    }
    return layer;
  }

  /** 押してよいか（ずらしていない、かつ一覧の見える範囲の中） */
  pressOk(): boolean {
    if (this.dragged) return false;
    const p = this.scene.input.activePointer;
    const y = this.scene.cameras.main.getWorldPoint(p.x, p.y).y;
    return y >= this.top && y <= this.bottom;
  }

  /** 一覧の中の行・ボタンの onTap を包む */
  guard(fn: () => void): () => void {
    return () => {
      if (this.pressOk()) fn();
    };
  }

  /** その範囲（中身の位置）が見えるようにずらす */
  reveal(y: number, h: number): void {
    const v = this.bottom - this.top;
    const at = y - this.top;
    if (at < this.scroll) this.setScroll(at);
    else if (at + h > this.scroll + v) this.setScroll(at + h - v);
  }

  private setScroll(s: number): void {
    this.scroll = Math.max(0, Math.min(s, this.max()));
    if (this.layer) this.layer.y = -this.scroll;
    this.moveBar();
  }

  private moveBar(): void {
    if (!this.bar) return;
    const max = this.max();
    this.bar.y = this.top + (max > 0 ? (this.scroll / max) * (this.bottom - this.top - this.bar.height) : 0);
  }
}
