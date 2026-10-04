import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/** 段階1の確認用画面 */
export class HelloScene extends Phaser.Scene {
  constructor() {
    super('Hello');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .text(cx, cy - 40, 'Hello', { fontFamily: 'sans-serif', fontSize: '64px', color: '#ffffff' })
      .setOrigin(0.5);
    this.add
      .text(cx, cy + 30, 'Project Hourglass\nバトルプロトタイプ', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#9fb3c8',
        align: 'center',
      })
      .setOrigin(0.5);

    // タップ反応の確認用
    const tapText = this.add
      .text(cx, cy + 120, 'タップしてみてください', { fontFamily: 'sans-serif', fontSize: '16px', color: '#6c8299' })
      .setOrigin(0.5);
    let taps = 0;
    this.input.on('pointerdown', () => {
      taps += 1;
      tapText.setText(`タップ ${taps} 回`);
      console.log(`[Hello] tap ${taps}`);
    });
  }
}
