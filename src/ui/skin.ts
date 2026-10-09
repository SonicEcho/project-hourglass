import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, MOTION, SKIN } from './theme';

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
  ensureSandTexture(scene);
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

/**
 * 画面に入る時の演出（段階32a 調整1）：暗い藍から明るくなりながら、上から砂がさらさら流れ落ちる。
 * 自分で暗転・明転をする画面（会話・物語の流れ・日常・探索・時間を返す）では使わない
 */
export function enterScreen(scene: Phaser.Scene): void {
  const bg = Phaser.Display.Color.IntegerToRGB(COLORS.bg);
  scene.cameras.main.fadeIn(MOTION.enterMs, bg.r, bg.g, bg.b);
  ensureSandTexture(scene);
  const veil = scene.add.particles(0, 0, 'ui-sand', {
    x: { min: 0, max: GAME_WIDTH },
    y: { min: -20, max: GAME_HEIGHT * 0.4 },
    speedY: { min: 380, max: 620 },
    gravityY: 400,
    scale: { min: 0.4, max: 1 },
    tint: SKIN.sand,
    alpha: { start: 0.7, end: 0 },
    lifespan: { min: 350, max: 650 },
    emitting: false,
  });
  veil.setDepth(900);
  veil.explode(55);
  scene.time.delayedCall(1200, () => veil.destroy());
}

/** 砂の粒の絵（2px の丸）を作る。背景・画面に入る演出・ボタンの反応で使う */
export function ensureSandTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('ui-sand')) return;
  const t = scene.make.graphics({}, false);
  t.fillStyle(0xffffff, 1).fillCircle(2, 2, 2);
  t.generateTexture('ui-sand', 4, 4);
  t.destroy();
}

/** ボタンを押した時：その場所に砂の粒が小さく散る（段階32a 調整1） */
export function sparkAt(scene: Phaser.Scene, x: number, y: number): void {
  ensureSandTexture(scene);
  const p = scene.add.particles(0, 0, 'ui-sand', {
    speed: { min: 40, max: 120 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0.2 },
    tint: SKIN.sand,
    alpha: { start: 0.9, end: 0 },
    lifespan: 380,
    emitting: false,
  });
  p.setDepth(950);
  p.explode(10, x, y);
  scene.time.delayedCall(500, () => p.destroy());
}

/** 窓をふわっと出す（画面の真ん中を中心に、少し小さい所から大きくなりながら現れる） */
export function popIn(scene: Phaser.Scene, c: Phaser.GameObjects.Container): void {
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const set = (v: number) => {
    const s = 0.94 + 0.06 * v;
    c.setScale(s).setPosition(cx * (1 - s), cy * (1 - s)).setAlpha(v);
  };
  set(0);
  scene.tweens.addCounter({ from: 0, to: 1, duration: MOTION.popMs, ease: 'Back.easeOut', onUpdate: (t) => set(t.getValue() ?? 1) });
}

/** 窓をすっと消す（押せなくしてから薄くして消す） */
export function fadeOutAndDestroy(scene: Phaser.Scene, c: Phaser.GameObjects.Container | undefined): void {
  if (!c || !c.active) return;
  c.each((o: Phaser.GameObjects.GameObject) => o.disableInteractive());
  scene.tweens.add({ targets: c, alpha: 0, duration: MOTION.closeMs, onComplete: () => c.destroy(true) });
}

/**
 * 数を数えるように変える（段階32a 調整1）。from から to へ、format で文字にして text に入れる。
 * from と to が同じなら何もしない
 */
export function countText(scene: Phaser.Scene, text: Phaser.GameObjects.Text, from: number, to: number, format: (v: number) => string): void {
  if (from === to) return;
  text.setText(format(from));
  scene.tweens.addCounter({
    from,
    to,
    duration: MOTION.countMs,
    ease: 'Cubic.easeOut',
    onUpdate: (t) => {
      if (text.active) text.setText(format(Math.round(t.getValue() ?? to)));
    },
  });
}
