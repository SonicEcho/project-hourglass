import Phaser from 'phaser';
import { COLORS, FONT, FONT_HAND, FONT_HEADING, MOTION, RENDER_SCALE, SKIN } from './theme';
import { playSe } from '../audio/sound';
import { SE } from '../data';
// 角の丸い四角をなめらかに描く置き換え（skin.ts）を、どの画面よりも先に入れる
import { sparkAt } from './skin';

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
}

export function addText(scene: Phaser.Scene, x: number, y: number, text: string, style: TextStyle = {}): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: style.hand ? FONT_HAND : style.bold ? FONT_HEADING : FONT,
    fontSize: `${style.size ?? 14}px`,
    color: style.color ?? COLORS.text,
    fontStyle: style.bold && !style.hand ? 'bold' : 'normal',
    align: style.align ?? 'left',
    wordWrap: style.wrap ? { width: style.wrap, useAdvancedWrap: true } : undefined,
  });
  t.setResolution(RENDER_SCALE);
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
}

/**
 * ボタン。中心座標で置く。角が丸く、下に影、上半分にうっすら光。押すと少し沈む（段階32a）。
 * 返す四角の色（setFillStyle・setStrokeStyle）は、あとから替えてよい
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
  const radius = Math.min(SKIN.buttonRadius, h / 2);
  // 押せないボタンは影と光をなくし、ふちも薄くして、押せるボタンと見分けやすくする（段階32a 調整1）
  const shadow = scene.add.rectangle(x, y + SKIN.shadowOffset, w, h, 0x000000, enabled ? 0.38 : 0).setRounded(radius);
  const rect = scene.add.rectangle(x, y, w, h, enabled ? (opts.fill ?? COLORS.panelLight) : COLORS.disabled).setRounded(radius);
  rect.setStrokeStyle(opts.strokeWidth ?? 1, opts.stroke ?? COLORS.border, enabled ? 1 : 0.45);
  const sheen = scene.add.rectangle(x, y - h / 4 + 1, w - 6, h / 2 - 3, 0xffffff, enabled ? 0.07 : 0).setRounded(Math.max(0, radius - 3));
  const text = addText(scene, x, y, label, {
    size: opts.size ?? 14,
    color: enabled ? (opts.textColor ?? COLORS.text) : COLORS.dimText,
    align: 'center',
    bold: true,
    wrap: w - 6,
  }).setOrigin(0.5);
  parent.add([shadow, rect, sheen, text]);
  if (enabled) {
    // 押した時に少し沈む
    const face = [rect, sheen, text];
    const press = (down: boolean) => {
      for (const o of face) o.setScale(down ? SKIN.pressScale : 1);
      for (const o of face) o.y = (o === sheen ? y - h / 4 + 1 : y) + (down ? 2 : 0);
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
    // 押して離した時：ボタンが一瞬光り、砂の粒が散る（段階32a 調整1）
    if (onTap) {
      rect.on('pointerup', () => {
        const m = rect.getWorldTransformMatrix();
        sparkAt(scene, m.tx, m.ty);
        sheen.setAlpha(1).setFillStyle(0xffffff, 0.3);
        scene.tweens.add({ targets: sheen, alpha: { from: 1, to: 0.23 }, duration: 240 });
      });
    }
  }
  else if (handlers.onLongPress) makePressable(rect, { onLongPress: handlers.onLongPress });
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
