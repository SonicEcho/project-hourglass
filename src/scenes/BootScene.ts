import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { queueAssets } from '../assets/loader';
import { loadHeadingFont } from '../assets/fonts';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addText } from '../ui/widgets';

const BAR_W = 240;
const BAR_H = 8;

/**
 * 起動の画面（段階15）：台帳の素材を読み込んでからタイトルへ。読み込めない素材があっても進む。
 * 読み込んでいる間は、進み具合のバーを出す（段階20）。見出しの書体も待つ（段階32a）
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    addText(this, cx, cy - 24, '読み込み中', { size: 14, color: COLORS.subText }).setOrigin(0.5);
    this.add.rectangle(cx, cy, BAR_W, BAR_H, COLORS.panel).setRounded(8).setStrokeStyle(1, COLORS.border);
    const fill = this.add.rectangle(cx - BAR_W / 2, cy, 0, BAR_H, COLORS.accent).setOrigin(0, 0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => fill.setSize(BAR_W * v, BAR_H));
    queueAssets(this);
    void loadHeadingFont();
  }

  create(): void {
    // 見出しの書体が読み込まれてからタイトルへ（段階32a。遅い時は3秒で進む）
    void loadHeadingFont().then(() => this.scene.start('Title'));
  }
}
