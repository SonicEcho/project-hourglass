import Phaser from 'phaser';
import type { NaviPartDef, PartColor, Rotation } from '../core';
import { rotateCells } from '../core';

// ナビカス盤のパーツの見た目（段階8）

export const PART_COLOR: Record<PartColor, number> = {
  red: 0xe0524a,
  blue: 0x4a8fe0,
  green: 0x4cc070,
  yellow: 0xe0b830,
};

/** 盤のマスに書く短い名前 */
export const PART_SHORT: Record<string, string> = {
  hpMemory: 'HP',
  mpMemory: 'MP',
  powerMemory: '攻',
  magicMemory: '魔',
  guardMemory: '防',
  speedMemory: '速',
  fireBoost: '火',
  iceBoost: '氷',
  thunderBoost: '雷',
  breaker: '破',
  oneMoreDraw: 'ワ',
  batonReceiver: 'バ',
  comboBoost: 'コ',
  firstAid: '救',
  mpSave: '節',
  startDash: '先',
};

/** パーツの形を小さく描く（左上を x, y に合わせる） */
export function drawPartShape(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  def: NaviPartDef,
  rotation: Rotation,
  x: number,
  y: number,
  cell: number,
  alpha = 1,
): void {
  for (const [c, r] of rotateCells(def.cells, rotation)) {
    const rect = scene.add.rectangle(x + c * cell, y + r * cell, cell - 1, cell - 1, PART_COLOR[def.color], alpha).setOrigin(0);
    if (def.kind === 'effect') rect.setStrokeStyle(1, 0xffffff, alpha);
    parent.add(rect);
  }
}
