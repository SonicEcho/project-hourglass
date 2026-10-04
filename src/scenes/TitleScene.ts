import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { rerollSeed } from './run';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const root = this.add.container(0, 0);
    const cx = GAME_WIDTH / 2;
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0));
    // 仮の砂時計
    const g = this.add.graphics();
    g.lineStyle(3, COLORS.accent, 1);
    g.strokeTriangle(cx - 40, 160, cx + 40, 160, cx, 230);
    g.strokeTriangle(cx - 40, 300, cx + 40, 300, cx, 230);
    root.add(g);
    root.add(addText(this, cx, 360, 'Project Hourglass', { size: 30, bold: true }).setOrigin(0.5));
    root.add(addText(this, cx, 402, 'バトルプロトタイプ', { size: 16, color: COLORS.subText }).setOrigin(0.5));
    root.add(
      addText(this, cx, 470, '雑魚戦 → ボス戦「歪みの獣」', { size: 14, color: COLORS.subText }).setOrigin(0.5),
    );
    addButton(
      this,
      root,
      cx,
      640,
      260,
      64,
      'はじめる',
      {
        onTap: () => {
          rerollSeed();
          this.scene.start('Battle', { encounter: 'battle1' });
        },
      },
      { size: 20, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 },
    );
  }
}
