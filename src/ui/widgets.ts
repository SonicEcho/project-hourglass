import Phaser from 'phaser';
import { COLORS, FONT, FONT_HAND, FONT_HEADING, MOTION, RENDER_SCALE, SKIN, STYLE } from './theme';
import { playSe } from '../audio/sound';
import { SE } from '../data';
// 角の丸い四角をなめらかに描く置き換え（skin.ts）を、どの画面よりも先に入れる
import { sparkAt } from './skin';
import { wrapJapanese } from './kinsoku';

export const LONG_PRESS_MS = 500;

export interface TextStyle {
  size?: number;
  color?: string;
  /** 太字。太字は見出しの書体（丸みのある書体）で出す（段階32a） */
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  /** 子どもの手書き風の書体で出す（けいかくひょう。段階32b 調整3） */
  hand?: boolean;
  /** wrap の折り返しを日本語向けにする（段階125。英数字のまとまりを切らず、禁則を守る。ui/kinsoku.ts の wrapJapanese） */
  ja?: boolean;
}

export function addText(scene: Phaser.Scene, x: number, y: number, text: string, style: TextStyle = {}): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: style.hand ? FONT_HAND : style.bold ? FONT_HEADING : FONT,
    fontSize: `${style.size ?? 14}px`,
    color: style.color ?? COLORS.text,
    fontStyle: style.bold && !style.hand ? 'bold' : 'normal',
    align: style.align ?? 'left',
    wordWrap: style.wrap && !style.ja ? { width: style.wrap, useAdvancedWrap: true } : undefined,
  });
  t.setResolution(RENDER_SCALE);
  if (style.wrap && style.ja) {
    const ctx = t.context;
    t.style.syncFont(t.canvas, ctx);
    t.setText(wrapJapanese(text, style.wrap, (s) => ctx.measureText(s).width).join('\n'));
  }
  return t;
}

export interface PressHandlers {
  onTap?: () => void;
  onLongPress?: () => void;
}

/**
 * タップと長押し（0.5秒）を見分けて呼ぶ。長押しの後に指を離してもタップにはしない。
 */
export function makePressable(obj: Phaser.GameObjects.GameObject, handlers: PressHandlers): void {
  const scene = obj.scene;
  let timer: Phaser.Time.TimerEvent | undefined;
  let pressed = false;
  let longFired = false;
  obj.setInteractive();
  obj.on('pointerdown', () => {
    pressed = true;
    longFired = false;
    timer?.remove();
    if (handlers.onLongPress) {
      timer = scene.time.delayedCall(LONG_PRESS_MS, () => {
        if (!pressed) return;
        longFired = true;
        handlers.onLongPress?.();
      });
    }
  });
  obj.on('pointerup', () => {
    timer?.remove();
    const wasPressed = pressed;
    pressed = false;
    // 再描画で自分が消えても安全なように、次のフレームで呼ぶ
    if (wasPressed && !longFired && handlers.onTap) scene.time.delayedCall(0, handlers.onTap);
  });
  obj.on('pointerout', () => {
    timer?.remove();
    pressed = false;
  });
}

export interface ButtonOptions {
  fill?: number;
  stroke?: number;
  strokeWidth?: number;
  textColor?: string;
  size?: number;
  enabled?: boolean;
  bold?: boolean;
  /** 字を斜体にする（押してほしいボタン。段階225） */
  italic?: boolean;
}

/** 右へ傾けた平行四辺形（段階225。真ん中が x, y） */
export function addSlant(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill: number, alpha = 1): Phaser.GameObjects.Polygon {
  const k = Math.min(STYLE.slantMax, h * STYLE.slant);
  return scene.add.polygon(x, y, [k, 0, w, 0, w - k, h, 0, h], fill, alpha);
}

/**
 * ボタン。中心座標で置く（段階225：右へ傾けた平行四辺形・斜めにずらした黒い影。押すと少し沈む）。
 * 返す四角はタップを受ける透明の四角。setFillStyle・setStrokeStyle は見えている形に伝えるので、あとから色を替えてよい
 */
export function addButton(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  handlers: PressHandlers,
  opts: ButtonOptions = {},
): Phaser.GameObjects.Rectangle {
  const enabled = opts.enabled ?? true;
  const shadow = addSlant(scene, x + STYLE.shadow, y + STYLE.shadow, w, h, 0x000000, enabled ? 0.75 : 0);
  const face = addSlant(scene, x, y, w, h, enabled ? (opts.fill ?? STYLE.ink) : COLORS.disabled, enabled ? 1 : 0.7);
  face.setStrokeStyle(opts.strokeWidth ?? 1.5, opts.stroke ?? STYLE.paper, enabled ? 1 : 0.35);
  const text = addText(scene, x, y, label, {
    size: opts.size ?? 14,
    color: enabled ? (opts.textColor ?? COLORS.text) : COLORS.dimText,
    align: 'center',
    bold: true,
    wrap: w - 14,
  }).setOrigin(0.5);
  if (opts.italic) text.setFontStyle('bold italic');
  // タップを受ける透明の四角（返す物）。色の変更は見えている形へ伝える
  const rect = scene.add.rectangle(x, y, w, h, 0xffffff, 0.001);
  const r = rect as unknown as { setFillStyle: (c?: number, a?: number) => Phaser.GameObjects.Rectangle; setStrokeStyle: (lw?: number, c?: number, a?: number) => Phaser.GameObjects.Rectangle };
  r.setFillStyle = (c?: number, a?: number) => {
    face.setFillStyle(c, a);
    return rect;
  };
  r.setStrokeStyle = (lw?: number, c?: number, a?: number) => {
    face.setStrokeStyle(lw, c, a);
    return rect;
  };
  parent.add([shadow, face, text, rect]);
  if (enabled) {
    // 押した時に少し沈む（影の方へずれる）
    const press = (down: boolean) => {
      for (const o of [face, text]) {
        o.setScale(down ? SKIN.pressScale : 1);
        o.x = x + (down ? 2 : 0);
        o.y = y + (down ? 2 : 0);
      }
    };
    rect.on('pointerdown', () => press(true));
    rect.on('pointerup', () => press(false));
    rect.on('pointerout', () => press(false));
    const onTap = handlers.onTap;
    makePressable(rect, {
      ...handlers,
      onTap: onTap && (() => {
        playSe(scene, SE.tap);
        onTap();
      }),
    });
    // 押して離した時：一瞬白く光り、砂の粒が散る（段階32a 調整1）
    if (onTap) {
      rect.on('pointerup', () => {
        const m = rect.getWorldTransformMatrix();
        sparkAt(scene, m.tx, m.ty);
        const flash = addSlant(scene, x, y, w, h, 0xffffff, 0.35);
        parent.add(flash);
        scene.tweens.add({ targets: flash, alpha: 0, duration: 220, onComplete: () => flash.destroy() });
      });
    }
  } else if (handlers.onLongPress) makePressable(rect, { onLongPress: handlers.onLongPress });
  return rect;
}

/** HPやMPのバー */
/**
 * ゲージ。from を渡すと、その割合から ratio まで滑らかに動く（段階32a 調整1。HP が減る・増える時）
 */
export function addBar(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: number,
  from?: number,
): void {
  // 角の丸い溝に、光の筋の入った中身（段階32a）
  const r = h / 2;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const bg = scene.add.rectangle(x, y, w, h, COLORS.barBg).setOrigin(0, 0.5).setRounded(r).setStrokeStyle(1, 0x000000, 0.6);
  const fill = scene.add.rectangle(x, y, h, h, color).setOrigin(0, 0.5).setRounded(r);
  const shine = scene.add.rectangle(x + 1, y - h / 4, 1, Math.max(1, h / 3), 0xffffff, 0.28).setOrigin(0, 0.5);
  parent.add([bg, fill, shine]);
  const show = (v: number) => {
    const fw = clamp(v) * w;
    fill.setVisible(fw > 0).setSize(Math.max(fw, h), h).setScale(fw < h ? fw / h : 1, 1);
    shine.setVisible(fw > 2).setSize(Math.max(1, fw - 2), Math.max(1, h / 3));
  };
  if (from === undefined || clamp(from) === clamp(ratio)) {
    show(ratio);
    return;
  }
  show(from);
  scene.tweens.addCounter({
    from: clamp(from),
    to: clamp(ratio),
    duration: MOTION.countMs,
    ease: 'Cubic.easeOut',
    onUpdate: (t) => {
      if (fill.active) show(t.getValue() ?? ratio);
    },
  });
}
