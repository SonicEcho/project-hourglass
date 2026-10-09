import Phaser from 'phaser';
import type { DamageType } from '../core';

// 小さなアイコン（段階32a 調整2）。絵の素材は使わず、図形で描く。
// 中心 (x, y)、大きさ size（おおよその外寄りの四角の一辺）、色 color

export type IconKind = DamageType | 'heal' | 'support' | 'hp' | 'mp' | 'star' | 'weapon' | 'gear';

type P = [number, number];

export function addIcon(scene: Phaser.Scene, kind: IconKind, x: number, y: number, size: number, color: number, alpha = 1): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  const s = size;
  const poly = (pts: P[]) => g.fillPoints(pts.map(([px, py]) => new Phaser.Math.Vector2(px * s, py * s)), true);
  g.fillStyle(color, alpha);
  g.lineStyle(Math.max(1.2, s * 0.11), color, alpha);
  switch (kind) {
    case 'physical':
    case 'weapon': {
      // 剣（斜め）。小さく出してもチェック印に見えないよう、刃と鍔を太めに
      g.setAngle(45);
      poly([
        [-0.11, 0.1],
        [-0.11, -0.32],
        [0, -0.5],
        [0.11, -0.32],
        [0.11, 0.1],
      ]);
      g.fillRect(-0.32 * s, 0.08 * s, 0.64 * s, 0.13 * s);
      g.fillRect(-0.08 * s, 0.2 * s, 0.16 * s, 0.2 * s);
      g.fillCircle(0, 0.44 * s, 0.09 * s);
      break;
    }
    case 'fire':
      // 炎：しずくを逆さにした形と、内側の小さな炎
      g.fillCircle(0, 0.16 * s, 0.28 * s);
      poly([
        [-0.27, 0.1],
        [-0.12, -0.18],
        [0.02, -0.5],
        [0.14, -0.2],
        [0.27, 0.1],
      ]);
      g.fillStyle(0xffffff, 0.45 * alpha);
      g.fillCircle(0, 0.22 * s, 0.12 * s);
      break;
    case 'ice':
      // 雪の結晶：6本の線
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 2;
        g.lineBetween(Math.cos(a) * 0.46 * s, Math.sin(a) * 0.46 * s, -Math.cos(a) * 0.46 * s, -Math.sin(a) * 0.46 * s);
      }
      g.fillCircle(0, 0, 0.1 * s);
      break;
    case 'thunder':
      // 稲妻
      poly([
        [0.12, -0.5],
        [-0.26, 0.06],
        [-0.02, 0.06],
        [-0.14, 0.5],
        [0.28, -0.1],
        [0.04, -0.1],
        [0.2, -0.5],
      ]);
      break;
    case 'magic':
      // 4つの角の星
      poly([
        [0, -0.5],
        [0.12, -0.12],
        [0.5, 0],
        [0.12, 0.12],
        [0, 0.5],
        [-0.12, 0.12],
        [-0.5, 0],
        [-0.12, -0.12],
      ]);
      break;
    case 'heal':
      // 十字
      g.fillRect(-0.12 * s, -0.42 * s, 0.24 * s, 0.84 * s);
      g.fillRect(-0.42 * s, -0.12 * s, 0.84 * s, 0.24 * s);
      break;
    case 'support':
      // ひし形
      poly([
        [0, -0.45],
        [0.36, 0],
        [0, 0.45],
        [-0.36, 0],
      ]);
      break;
    case 'hp':
      // ハート
      g.fillCircle(-0.2 * s, -0.1 * s, 0.22 * s);
      g.fillCircle(0.2 * s, -0.1 * s, 0.22 * s);
      poly([
        [-0.42, -0.02],
        [0.42, -0.02],
        [0, 0.44],
      ]);
      break;
    case 'mp':
      // しずく
      g.fillCircle(0, 0.14 * s, 0.3 * s);
      poly([
        [-0.27, 0.04],
        [0, -0.48],
        [0.27, 0.04],
      ]);
      break;
    case 'star': {
      // 5つの角の星
      const pts: P[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.5 : 0.21;
        const a = -Math.PI / 2 + (Math.PI / 5) * i;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      poly(pts);
      break;
    }
    case 'gear': {
      // 歯車：8つの歯と輪
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        const w = 0.09;
        const r0 = 0.28;
        const r1 = 0.48;
        poly([
          [c * r0 - sn * w, sn * r0 + c * w],
          [c * r1 - sn * w, sn * r1 + c * w],
          [c * r1 + sn * w, sn * r1 - c * w],
          [c * r0 + sn * w, sn * r0 - c * w],
        ]);
      }
      g.lineStyle(s * 0.14, color, alpha);
      g.strokeCircle(0, 0, 0.26 * s);
      break;
    }
  }
  return g;
}
