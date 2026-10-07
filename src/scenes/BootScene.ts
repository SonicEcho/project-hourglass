import Phaser from 'phaser';
import { queueAssets } from '../assets/loader';

/** 起動の画面（段階15）：台帳の素材を読み込んでからタイトルへ。読み込めない素材があっても進む */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    queueAssets(this);
  }

  create(): void {
    this.scene.start('Title');
  }
}
