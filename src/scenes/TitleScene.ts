import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { startNewRun } from './run';

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
    root.add(addText(this, cx, 360, 'RESTOPIA', { size: 34, bold: true }).setOrigin(0.5));
    root.add(addText(this, cx, 400, '思い出だけの理想郷', { size: 15, color: COLORS.accentText }).setOrigin(0.5));
    root.add(addText(this, cx, 432, 'バトルプロトタイプ', { size: 13, color: COLORS.subText }).setOrigin(0.5));
    root.add(
      addText(this, cx, 470, '星図で育てながら5戦。最後はボス「歪みの獣」', { size: 13, color: COLORS.subText }).setOrigin(0.5),
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
          startNewRun();
          this.scene.start('Growth');
        },
      },
      { size: 20, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 },
    );
  }
}
