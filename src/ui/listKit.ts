import Phaser from 'phaser';
import type { ChainCardCategory } from '../core';
import { GAME_WIDTH } from '../config';
import { addIcon, type IconKind } from './icons';
import { SIDE_PADDING } from './layout';
import { COLORS } from './theme';
import { addButton, addText, makePressable } from './widgets';

// 一覧の画面の共通の部品（段階167。アルバムとライブラリで使う）。
// 見た目を仕上げる段階（段取りの段階G の後）では、ここを直せば全部の一覧の画面に効く

/** スナップの分類の名前と色（戦闘の画面の札・アルバム・ライブラリで同じ物を使う） */
export const SNAP_CATEGORY: Record<ChainCardCategory, { label: string; color: number }> = {
  attack: { label: 'アクション', color: 0x3a8dff },
  support: { label: 'エフェクト', color: 0x19b37a },
  finish: { label: 'クライマックス', color: 0xff2d55 },
  special: { label: 'スペシャル', color: 0xff8a1f },
  link: { label: 'コンボ', color: 0xffcf5a },
};

/** 一覧の印の色（敵のスナップ・敵・素材） */
export const LIST_COLORS = { enemy: 0xc08cff, item: 0xd9a35a, combo: SNAP_CATEGORY.link.color };

/** 一覧の1行の高さと間 */
export const ROW_H = 36;
export const ROW_GAP = 3;
export const ROW_W = GAME_WIDTH - SIDE_PADDING * 2;

/** 小さな札（タブ・絞り込み）。選んでいる物は色で塗る */
export function addChip(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, label: string, color: number, on: boolean, onTap: () => void): void {
  const r = scene.add.rectangle(x, y, w, h, on ? color : 0x141c25).setRounded(6);
  r.setStrokeStyle(1, on ? color : COLORS.border);
  parent.add(r);
  const t = addText(scene, x, y, label, { size: 10, bold: true, color: on ? '#101820' : COLORS.subText }).setOrigin(0.5);
  if (t.width > w - 6) t.setScale((w - 6) / t.width);
  parent.add(t);
  makePressable(r, { onTap });
}

export interface TabDef<T extends string> {
  id: T;
  label: string;
  color: number;
}

/** 横に並ぶタブ。名前の長さに合わせて幅を分ける */
export function addTabs<T extends string>(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, y: number, tabs: readonly TabDef<T>[], current: T, onPick: (id: T) => void): void {
  const gap = 3;
  const free = ROW_W - (tabs.length - 1) * gap;
  const need = tabs.map((t) => 12 + t.label.length * 10);
  const extra = (free - need.reduce((a, b) => a + b, 0)) / tabs.length;
  let left = SIDE_PADDING;
  tabs.forEach((t, i) => {
    const w = need[i] + extra;
    addChip(scene, parent, left + w / 2, y, w, 26, t.label, t.color, current === t.id, () => {
      if (current !== t.id) onPick(t.id);
    });
    left += w + gap;
  });
}

/** 一覧の1行の地（タップで選ぶ）。dim はまだ持っていない・見つけていない物。行の真ん中の y を返す */
export function addListRow(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, top: number, opts: { dim: boolean; selected: boolean; onTap: () => void }): number {
  const row = scene.add.rectangle(SIDE_PADDING, top, ROW_W, ROW_H, opts.dim ? 0x141c25 : COLORS.panel).setRounded(8).setOrigin(0);
  row.setStrokeStyle(opts.selected ? 3 : 1, opts.selected ? COLORS.select : COLORS.border);
  parent.add(row);
  makePressable(row, { onTap: opts.onTap });
  return top + ROW_H / 2;
}

/** 行の左の帯（分類の色・アイコン・名前） */
export function addBand(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, left: number, cy: number, w: number, color: number, label: string, icon: IconKind | null, faded: boolean): void {
  const x = left + w / 2;
  parent.add(scene.add.rectangle(x, cy, w, 22, color, faded ? 0.4 : 0.9).setRounded(6));
  const t = addText(scene, x, cy, label, { size: 9, bold: true, color: '#101820' }).setOrigin(0.5);
  if (icon) {
    const l = x - (12 + 2 + t.width) / 2;
    parent.add(addIcon(scene, icon, l + 6, cy, 11, 0x101820));
    t.setX(l + 14 + t.width / 2);
  }
  parent.add(t);
}

/** 行の名前（幅に収まらなければ縮める） */
export function addRowName(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, cy: number, name: string, maxW: number, dim: boolean): Phaser.GameObjects.Text {
  const t = addText(scene, x, cy, name, { size: 13, bold: true, color: dim ? COLORS.dimText : COLORS.text }).setOrigin(0, 0.5);
  if (t.width > maxW) t.setScale(maxW / t.width);
  parent.add(t);
  return t;
}

/** ページの切り替え（◀ 1/2 ▶）。ページが1つなら何も出さない */
export function addPager(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, y: number, page: number, pages: number, onTurn: (d: number) => void): void {
  if (pages <= 1) return;
  addButton(scene, parent, GAME_WIDTH / 2 - 70, y, 60, 28, '◀', { onTap: () => onTurn(-1) }, { enabled: page > 0, size: 12 });
  parent.add(addText(scene, GAME_WIDTH / 2, y, `${page + 1}/${pages}`, { size: 12, color: COLORS.subText }).setOrigin(0.5));
  addButton(scene, parent, GAME_WIDTH / 2 + 70, y, 60, 28, '▶', { onTap: () => onTurn(1) }, { enabled: page < pages - 1, size: 12 });
}

/** 説明の窓（行ごとの文） */
export function addDetailBox(scene: Phaser.Scene, parent: Phaser.GameObjects.Container, y: number, h: number, lines: readonly string[]): void {
  parent.add(scene.add.rectangle(SIDE_PADDING, y, ROW_W, h, COLORS.panel).setRounded(8).setOrigin(0).setStrokeStyle(1, COLORS.border));
  parent.add(addText(scene, SIDE_PADDING + 10, y + 8, lines.join('\n'), { size: 12, wrap: ROW_W - 20 }));
}
