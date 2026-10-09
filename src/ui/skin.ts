import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, SKIN } from './theme';

// 画面の部品の見た目（段階32a）。絵の素材は使わず、図形で描く。色と形は theme.ts の COLORS と SKIN

// Phaser 3.90 の角の丸い四角は、角を「半径÷5」個の辺で描く（半径10だと2辺で、面取りに見える）。
// 画面は高解像度で描いているので、角を8辺以上で描くようにする（ここで1回だけ置き換える）
type ArcTo = (path: number[], cx: number, cy: number, r: number, a0: number, a1: number, segments: number) => void;
const rectProto = Phaser.GameObjects.Rectangle.prototype as unknown as { arcTo: ArcTo; __smoothArc?: boolean };
if (!rectProto.__smoothArc) {
  const arcTo = rectProto.arcTo;
  rectProto.arcTo = function (this: unknown, path, cx, cy, r, a0, a1, segments) {
    arcTo.call(this, path, cx, cy, r, a0, a1, Math.max(segments, 8));
  };
  rectProto.__smoothArc = true;
}

/** 画面ごとに作った背景（描き直しのたびに作り直さないよう覚えておく） */
const backdrops = new WeakMap<Phaser.Scene, Phaser.GameObjects.GameObject>();

/**
 * 画面の背景：上の藍から下の深い紺へ移り変わる色、地平の近くにうっすら夕焼け、ゆっくり舞う砂の粒。
 * 画面の一番下に1回だけ作る。返すのは、今まで背景に使っていた四角の代わり（透明。タップを受けたい時に使う）
 */
export function screenBg(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  const made = backdrops.get(scene);
  if (!made || !made.active || !scene.children.exists(made)) backdrops.set(scene, drawBackdrop(scene));
  return scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001).setOrigin(0);
}

function drawBackdrop(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(-100);
  const mid = GAME_HEIGHT * 0.55;
  g.fillGradientStyle(SKIN.bgTop, SKIN.bgTop, SKIN.bgMiddle, SKIN.bgMiddle, 1);
  g.fillRect(0, 0, GAME_WIDTH, mid);
  g.fillGradientStyle(SKIN.bgMiddle, SKIN.bgMiddle, SKIN.bgBottom, SKIN.bgBottom, 1);
  g.fillRect(0, mid, GAME_WIDTH, GAME_HEIGHT - mid);
  // 地平の夕焼け：薄い楕円を重ねて、ぼんやり光って見せる
  for (let i = 0; i < 6; i++) {
    g.fillStyle(SKIN.bgGlow, 0.022);
    g.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT + 40, GAME_WIDTH * (0.9 + i * 0.25), 260 + i * 70);
  }
  // 砂の粒
  if (!scene.textures.exists('ui-sand')) {
    const t = scene.make.graphics({}, false);
    t.fillStyle(0xffffff, 1).fillCircle(2, 2, 2);
    t.generateTexture('ui-sand', 4, 4);
    t.destroy();
  }
  const sand = scene.add.particles(0, 0, 'ui-sand', {
    x: { min: 0, max: GAME_WIDTH },
    y: { min: 0, max: GAME_HEIGHT },
    speedY: { min: -14, max: -5 },
    speedX: { min: -4, max: 4 },
    scale: { min: 0.3, max: 0.9 },
    alpha: { start: 0.45, end: 0 },
    tint: SKIN.sand,
    lifespan: { min: 6000, max: 11000 },
    frequency: 380,
  });
  sand.setDepth(-99);
  sand.fastForward(9000);
  return g;
}

/** 枠（パネル）の角を丸くする。今の四角をそのまま使う */
export function rounded<T extends Phaser.GameObjects.Rectangle>(rect: T, radius: number = SKIN.panelRadius): T {
  return rect.setRounded(Math.min(radius, rect.height / 2, rect.width / 2));
}

/**
 * 説明や詳しい情報の窓（左上が x, y）。角の丸い枠に、砂色のふちと、四隅の小さな飾り
 */
export function addWindow(scene: Phaser.Scene, x: number, y: number, w: number, h: number, accent: number = COLORS.accent): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  c.add(scene.add.rectangle(x + 2, y + 5, w, h, 0x000000, 0.4).setOrigin(0).setRounded(14));
  c.add(scene.add.rectangle(x, y, w, h, COLORS.panel, 0.97).setOrigin(0).setRounded(14).setStrokeStyle(2, accent));
  const g = scene.add.graphics();
  g.lineStyle(1, accent, 0.35).strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 10);
  g.fillStyle(accent, 1);
  for (const [cx, cy] of [
    [x + 5, y + 5],
    [x + w - 5, y + 5],
    [x + 5, y + h - 5],
    [x + w - 5, y + h - 5],
  ]) {
    g.fillPoints([new Phaser.Math.Vector2(cx, cy - 5), new Phaser.Math.Vector2(cx + 5, cy), new Phaser.Math.Vector2(cx, cy + 5), new Phaser.Math.Vector2(cx - 5, cy)], true);
  }
  c.add(g);
  return c;
}
