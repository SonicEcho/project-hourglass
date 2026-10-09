import Phaser from 'phaser';
import type { TipDef } from '../core';
import { markTipSeen, nextTip, parseSeenTips, serializeSeenTips } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { TIPS } from '../data';
import { browserStorage } from '../save/storage';
import { applyKinsoku } from './kinsoku';
import { COLORS } from './theme';
import { addButton, addText } from './widgets';

// 初めての人向けの説明の窓（段階30）。見た説明はセーブとは別に覚える（はじめからやり直しても出さない）

const TIPS_KEY = 'restopia.tips';
let seen: string[] | null = null;

/** 見た説明の id */
export function seenTips(): string[] {
  if (!seen) seen = parseSeenTips(browserStorage().read(TIPS_KEY));
  return seen;
}

function saveSeen(list: string[]): void {
  seen = list;
  browserStorage().write(TIPS_KEY, serializeSeenTips(list));
}

/** 見た説明を忘れて、また使う場面で出すようにする */
export function resetTips(): void {
  saveSeen([]);
}

/** 説明の窓を出す。後ろは押せない。「わかった」で閉じる */
export function showTipPanel(scene: Phaser.Scene, tip: TipDef, onClose?: () => void, label = 'はじめての説明'): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0).setDepth(500);
  c.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
  const w = GAME_WIDTH - 40;
  // 行の頭に「、」などが来ないよう、段落ごとに折り返しを先に決めてから出す（会話の画面と同じ）。段落の間は1行あける
  const body = addText(scene, 0, 0, '', { size: 14, wrap: w - 40 }).setLineSpacing(3);
  body.setText(tip.body.split('\n').map((p) => applyKinsoku(body.getWrappedText(p)).join('\n')).join('\n\n')).setWordWrapWidth(null);
  const h = body.height + 150;
  const y = Math.max(40, GAME_HEIGHT / 2 - h / 2 - 40);
  c.add(scene.add.rectangle(20, y, w, h, COLORS.panel).setOrigin(0).setStrokeStyle(2, COLORS.accent));
  c.add(addText(scene, 40, y + 14, label, { size: 12, color: COLORS.subText }));
  c.add(addText(scene, 40, y + 34, tip.title, { size: 18, bold: true, color: COLORS.accentText }));
  body.setPosition(40, y + 68);
  c.add(body);
  addButton(scene, c, GAME_WIDTH / 2, y + h - 36, 180, 48, 'わかった', {
    onTap: () => {
      c.destroy(true);
      onClose?.();
    },
  }, { size: 16, bold: true, fill: 0x2f6b3f, stroke: 0x6dff9e });
  return c;
}

/**
 * 今の場面に合う、まだ見ていない説明があれば1つ出して、見たことにする。出したら true（閉じた時に onClose）
 */
export function maybeShowTip(scene: Phaser.Scene, triggers: readonly string[], onClose?: () => void): boolean {
  const tip = nextTip(TIPS, seenTips(), triggers);
  if (!tip) return false;
  saveSeen(markTipSeen(seenTips(), tip.id));
  console.log(`[tip] ${tip.id}`);
  showTipPanel(scene, tip, onClose);
  return true;
}
