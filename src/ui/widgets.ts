import Phaser from 'phaser';
import { COLORS, FONT, RENDER_SCALE } from './theme';
import { playSe } from '../audio/sound';
import { SE } from '../data';

export const LONG_PRESS_MS = 500;

export interface TextStyle {
  size?: number;
  color?: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
}

export function addText(scene: Phaser.Scene, x: number, y: number, text: string, style: TextStyle = {}): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: FONT,
    fontSize: `${style.size ?? 14}px`,
    color: style.color ?? COLORS.text,
    fontStyle: style.bold ? 'bold' : 'normal',
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

/** 角丸でない簡単なボタン。中心座標で置く */
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
  const rect = scene.add.rectangle(x, y, w, h, enabled ? (opts.fill ?? COLORS.panelLight) : COLORS.disabled);
  rect.setStrokeStyle(opts.strokeWidth ?? 1, opts.stroke ?? COLORS.border);
  const text = addText(scene, x, y, label, {
    size: opts.size ?? 14,
    color: enabled ? (opts.textColor ?? COLORS.text) : COLORS.dimText,
    align: 'center',
    bold: opts.bold,
    wrap: w - 6,
  }).setOrigin(0.5);
  parent.add([rect, text]);
  if (enabled) {
    const onTap = handlers.onTap;
    makePressable(rect, {
      ...handlers,
      onTap: onTap && (() => {
        playSe(scene, SE.tap);
        onTap();
      }),
    });
  }
  else if (handlers.onLongPress) makePressable(rect, { onLongPress: handlers.onLongPress });
  return rect;
}

/** HPやMPのバー */
export function addBar(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: number,
): void {
  const bg = scene.add.rectangle(x, y, w, h, COLORS.barBg).setOrigin(0, 0.5);
  const fill = scene.add.rectangle(x, y, Math.max(0, Math.min(1, ratio)) * w, h, color).setOrigin(0, 0.5);
  parent.add([bg, fill]);
}
