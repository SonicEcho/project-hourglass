import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { hasImage } from '../assets/loader';
import type { Backdrop } from '../data';
import { addText } from './widgets';

/**
 * 背景を top〜bottom の範囲に描いて layer に入れる（会話の画面と日常の画面で使う）。
 * 絵があれば範囲を覆う大きさにして、はみ出した所は見せない。なければ色の帯と「（仮）名前」（label の時）
 */
export function drawBackdrop(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, def: Backdrop, top: number, bottom: number, label: boolean): void {
  const h = bottom - top;
  if (def.image && hasImage(scene, def.image)) {
    const img = scene.add.image(GAME_WIDTH / 2, top + h / 2, def.image);
    // 地図の絵は縦長なので、真ん中あたりが見える
    const s = Math.max(GAME_WIDTH / img.width, h / img.height);
    const cw = GAME_WIDTH / s;
    const ch = h / s;
    img.setScale(s).setCrop((img.width - cw) / 2, (img.height - ch) / 2, cw, ch);
    // 同じ絵を夜などに使い回す時は、色をかける
    if (def.tint !== undefined) img.setTint(def.tint);
    layer.add(img);
    return;
  }
  const g = scene.add.graphics();
  g.fillGradientStyle(def.top, def.top, def.bottom, def.bottom, 1).fillRect(0, top, GAME_WIDTH, h);
  layer.add(g);
  if (label) layer.add(addText(scene, GAME_WIDTH / 2, top + 90, `（仮）${def.title}`, { size: 13, color: '#ffffffaa', align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5));
}
