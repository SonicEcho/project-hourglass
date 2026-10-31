import Phaser from 'phaser';
import type { NaviPartDef, PartColor, Rotation } from '../core';
import { rotateCells } from '../core';

// ムーブメントのギアの見た目（段階8）

/**
 * ギアの色＝金属（段階146。docs/ART.md の 5-9「時計の機械」）：赤＝銅、青＝鋼（青焼き）、緑＝青銅（緑青）、黄＝真鍮。
 * 決まり（同じ色＝同じ金属が辺で接すると狂い）は今のまま。PART_COLOR は金属のいちばん明るい面の色
 */
export const METAL: Record<PartColor, { base: number; light: number; dark: number }> = {
  red: { base: 0xc8683e, light: 0xf0a878, dark: 0x6a2a14 },
  blue: { base: 0x5a7eb8, light: 0xa8c4ec, dark: 0x1e2e52 },
  green: { base: 0x4f9a7a, light: 0x9ad8b8, dark: 0x1a4434 },
  yellow: { base: 0xd8b048, light: 0xfff0a0, dark: 0x6a5014 },
};

export const PART_COLOR: Record<PartColor, number> = {
  red: METAL.red.base,
  blue: METAL.blue.base,
  green: METAL.green.base,
  yellow: METAL.yellow.base,
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

/** ギアの形を小さく描く（左上を x, y に合わせる）。1マスに小さな金属の歯車を1つずつ（段階146） */
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
  const g = scene.add.graphics();
  const cells = rotateCells(def.cells, rotation);
  // 効果のギア（ブリッジが要る）は、歯車の後ろに金の輪（段階146 の調整。盤の上の金のふちと同じ印）
  if (def.kind === 'effect') for (const [c, r] of cells) g.fillStyle(0xffd77a, alpha).fillCircle(x + c * cell + cell / 2, y + r * cell + cell / 2, cell * 0.74);
  for (const [c, r] of cells) drawGear(g, x + c * cell + cell / 2, y + r * cell + cell / 2, cell * 0.5, def.color, alpha, cell >= 14);
  parent.add(g);
}

/**
 * 金属の歯車を1つ描く（中心 cx, cy、歯の先までの半径 r）。detail が true なら、肉抜きの穴・軸の赤い石・照り返しも描く。
 * lit が true なら軸の石が光る（ブリッジに乗って効いている効果のギア）
 */
export function drawGear(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: PartColor, alpha = 1, detail = true, lit = false): void {
  const m = METAL[color];
  const teeth = 10;
  const body = r * 0.78;
  // 歯（台形を回して並べる）
  g.fillStyle(m.dark, alpha);
  g.fillCircle(cx, cy, body + 1);
  for (let i = 0; i < teeth; i++) {
    const a = (Math.PI * 2 * i) / teeth;
    const w0 = 0.2;
    const w1 = 0.13;
    const pts = [
      [Math.cos(a - w0) * body, Math.sin(a - w0) * body],
      [Math.cos(a - w1) * r, Math.sin(a - w1) * r],
      [Math.cos(a + w1) * r, Math.sin(a + w1) * r],
      [Math.cos(a + w0) * body, Math.sin(a + w0) * body],
    ].map(([px, py]) => new Phaser.Math.Vector2(cx + px, cy + py));
    g.fillStyle(m.base, alpha).fillPoints(pts, true);
  }
  g.fillStyle(m.base, alpha).fillCircle(cx, cy, body);
  if (!detail) {
    g.fillStyle(m.dark, alpha).fillCircle(cx, cy, body * 0.32);
    return;
  }
  // 照り返し（左上が明るい）
  g.fillStyle(m.light, 0.35 * alpha).fillCircle(cx - body * 0.18, cy - body * 0.18, body * 0.72);
  g.fillStyle(m.base, alpha).fillCircle(cx + body * 0.05, cy + body * 0.05, body * 0.62);
  // 肉抜きの穴（4つ）
  g.fillStyle(m.dark, 0.85 * alpha);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (Math.PI / 2) * i;
    g.fillCircle(cx + Math.cos(a) * body * 0.48, cy + Math.sin(a) * body * 0.48, body * 0.17);
  }
  // 軸と赤い石
  g.fillStyle(m.light, alpha).fillCircle(cx, cy, body * 0.24);
  if (lit) {
    g.fillStyle(0xff4060, 0.35).fillCircle(cx, cy, body * 0.5);
    g.fillStyle(0xffd0a0, 0.5).fillCircle(cx, cy, body * 0.32);
  }
  g.fillStyle(lit ? 0xff4a5a : 0xc0102a, alpha).fillCircle(cx, cy, body * 0.13);
  g.fillStyle(0xffffff, 0.7 * alpha).fillCircle(cx - body * 0.05, cy - body * 0.05, body * 0.04);
}

/**
 * ムーブメントの後ろ（段階146。時計の機械）：時計の縁（金）、銀の縞の地板（ジュネーブ・ストライプとペルラージュ）、青いネジ、ルビー。
 * plate は地板の場所（盤のまわり）。地のビロードは画面の背景（frameBg）
 */
export function drawMovementBg(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, plate: { x: number; y: number; w: number; h: number }): void {
  const g = scene.add.graphics();
  // 時計の縁（金の太い輪。地板を囲む）
  const ring = 9;
  g.fillStyle(0x000000, 0.5).fillRoundedRect(plate.x - ring - 2, plate.y - ring + 3, plate.w + ring * 2 + 4, plate.h + ring * 2 + 2, 26);
  g.fillGradientStyle(0xf0d488, 0xc9a35a, 0x8a6a2a, 0xc9a35a, 1);
  g.fillRoundedRect(plate.x - ring, plate.y - ring, plate.w + ring * 2, plate.h + ring * 2, 24);
  g.lineStyle(1, 0xfff0c0, 0.6).strokeRoundedRect(plate.x - ring + 2, plate.y - ring + 2, plate.w + ring * 2 - 4, plate.h + ring * 2 - 4, 22);
  // 地板（銀）とジュネーブ・ストライプ（斜めの明るい帯）
  g.fillStyle(0xa8acb4, 1).fillRoundedRect(plate.x, plate.y, plate.w, plate.h, 16);
  g.lineStyle(9, 0xffffff, 0.12);
  for (let d = -plate.h; d < plate.w; d += 22) {
    const x0 = plate.x + Math.max(0, d);
    const y0 = plate.y + Math.max(0, -d);
    const len = Math.min(plate.w - Math.max(0, d), plate.h - Math.max(0, -d));
    if (len > 0) g.lineBetween(x0, y0, x0 + len, y0 + len);
  }
  // ペルラージュ（小さな輪の模様。四隅）
  g.lineStyle(1, 0xffffff, 0.12);
  for (const [cx, cy] of [
    [plate.x + 18, plate.y + 18],
    [plate.x + plate.w - 18, plate.y + plate.h - 18],
  ]) {
    for (let i = 0; i < 6; i++) g.strokeCircle(cx + (i % 3) * 7 - 7, cy + Math.floor(i / 3) * 7 - 3, 4);
  }
  // 青いネジ（四隅）とルビー（縁ぞい）
  for (const [sx, sy] of [
    [plate.x + 10, plate.y + 10],
    [plate.x + plate.w - 10, plate.y + 10],
    [plate.x + 10, plate.y + plate.h - 10],
    [plate.x + plate.w - 10, plate.y + plate.h - 10],
  ]) {
    g.fillStyle(0x1e3a8a, 1).fillCircle(sx, sy, 5);
    g.fillStyle(0x6a8ad8, 0.8).fillCircle(sx - 1.5, sy - 1.5, 2.2);
    g.lineStyle(1.2, 0x0a1430, 1).lineBetween(sx - 4, sy + 1, sx + 4, sy - 1);
  }
  for (const [rx, ry] of [
    [plate.x + plate.w * 0.3, plate.y - ring / 2],
    [plate.x + plate.w * 0.72, plate.y + plate.h + ring / 2],
    [plate.x - ring / 2, plate.y + plate.h * 0.6],
    [plate.x + plate.w + ring / 2, plate.y + plate.h * 0.35],
  ]) {
    g.fillStyle(0x8a0a1a, 1).fillCircle(rx, ry, 3.6);
    g.fillStyle(0xff4a5a, 1).fillCircle(rx - 0.8, ry - 0.8, 1.8);
  }
  parent.add(g);
}

/** てんぷ（金の輪とスポーク）。ゆっくり揺れる（段階146） */
export function addBalanceWheel(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, r: number): void {
  const wheel = scene.add.graphics({ x, y });
  wheel.lineStyle(3, 0xd8b048, 1).strokeCircle(0, 0, r);
  wheel.lineStyle(1, 0xfff0a0, 0.7).strokeCircle(0, 0, r - 2);
  wheel.lineStyle(2, 0xb08a30, 1);
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 * i) / 3;
    wheel.lineBetween(0, 0, Math.cos(a) * r, Math.sin(a) * r);
  }
  wheel.fillStyle(0xc0102a, 1).fillCircle(0, 0, 2.5);
  parent.add(wheel);
  scene.tweens.add({ targets: wheel, angle: { from: -40, to: 40 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}
