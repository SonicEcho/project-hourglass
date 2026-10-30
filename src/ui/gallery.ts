import Phaser from 'phaser';
import { hasImage } from '../assets/loader';
import { HUB_TILE_ART, HUB_TILE_FOCUS, type HubTileId } from '../data';
import { playSe } from '../audio/sound';
import { SE } from '../data';
import { FRAME_COLORS } from './frame';
import { sparkAt } from './skin';
import { COLORS, FONT_HEADING } from './theme';
import { addText, makePressable } from './widgets';

// 拠点の「思い出のギャラリー」のタイル（段階142。docs/ART.md の 5-9）。
// 1枚絵を角の丸い枠に切り抜き、下を黒くぼかして名前を白で重ねる。新しい物がある時は右上に札

export interface GalleryTile {
  id: HubTileId;
  label: string;
  /** 名前の下の小さな一言（なくてもよい） */
  sub?: string;
  /** 右上の札（「進化できる」など。なくてもよい） */
  badge?: string;
  /** 札の色（ふつうは金。ムーブメントの狂いは赤） */
  badgeColor?: number;
  enabled?: boolean;
  onTap: () => void;
}

/** 台帳の絵を、w×h の枠いっぱいに切り抜いて置く（左上が x, y）。focusY は見せたい所の高さ（0〜1） */
function coverImage(scene: Phaser.Scene, id: string, x: number, y: number, w: number, h: number, focusY: number): Phaser.GameObjects.Image {
  const src = scene.textures.get(id).getSourceImage();
  const scale = Math.max(w / src.width, h / src.height);
  const cw = w / scale;
  const ch = h / scale;
  const sx = (src.width - cw) / 2;
  const sy = Math.min(src.height - ch, Math.max(0, src.height * focusY - ch / 2));
  return scene.add.image(x - sx * scale, y - sy * scale, id).setOrigin(0).setScale(scale).setCrop(sx, sy, cw, ch);
}

/** タイルを1枚描く（左上が x, y） */
export function addGalleryTile(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, tile: GalleryTile): void {
  const enabled = tile.enabled ?? true;
  const radius = 12;
  const face = scene.add.container(0, 0);
  // 影
  root.add(scene.add.rectangle(x + w / 2, y + h / 2 + 4, w, h, 0x000000, 0.5).setRounded(radius));
  // 絵（届いていれば新しいタイルの絵、なければ代わりの絵、どれもなければ暗い地）
  const art = HUB_TILE_ART[tile.id].find((id) => hasImage(scene, id));
  face.add(scene.add.rectangle(x, y, w, h, 0x2a2016).setOrigin(0));
  if (art) {
    const img = coverImage(scene, art, x, y, w, h, HUB_TILE_FOCUS[art] ?? 0.5);
    if (!enabled) img.setAlpha(0.35);
    face.add(img);
  }
  // 下を黒くぼかす（名前が読めるように）
  const shade = scene.add.graphics();
  const top = y + h * 0.4;
  shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.88, 0.88);
  shade.fillRect(x, top, w, y + h - top);
  face.add(shade);
  const mask = scene.make.graphics({}, false).fillStyle(0xffffff).fillRoundedRect(x, y, w, h, radius);
  face.setMask(mask.createGeometryMask());
  face.once(Phaser.GameObjects.Events.DESTROY, () => mask.destroy());
  root.add(face);
  // ふち（押せないタイルは薄く）
  const frame = scene.add.rectangle(x, y, w, h, 0x000000, 0.001).setOrigin(0).setRounded(radius);
  frame.setStrokeStyle(1, 0xffffff, enabled ? 0.22 : 0.08);
  root.add(frame);
  // 名前と一言
  const big = w >= 170;
  const label = addText(scene, x + 11, y + h - (tile.sub ? 26 : 10), tile.label, { size: big ? 17 : 14, bold: true, color: enabled ? COLORS.text : COLORS.dimText });
  label.setOrigin(0, 1).setFontFamily(FONT_HEADING).setShadow(0, 2, '#000000', 4, false, true);
  root.add(label);
  if (tile.sub) root.add(addText(scene, x + 11, y + h - 9, tile.sub, { size: 10, color: COLORS.subText }).setOrigin(0, 1));
  // 右上の札
  if (tile.badge) {
    const t = addText(scene, 0, 0, tile.badge, { size: 10, bold: true, color: tile.badgeColor ? '#ffffff' : FRAME_COLORS.goldInk });
    const bw = t.width + 14;
    const bx = x + w - 8 - bw;
    root.add(scene.add.rectangle(bx, y + 8, bw, 18, tile.badgeColor ?? FRAME_COLORS.gold).setOrigin(0).setRounded(9));
    t.setPosition(bx + bw / 2, y + 17).setOrigin(0.5);
    root.add(t);
  }
  if (!enabled) return;
  // 押すと少し沈み、砂の粒が散る（ボタンと同じ手ざわり）
  const press = (down: boolean) => {
    face.setAlpha(down ? 0.8 : 1);
    frame.setStrokeStyle(down ? 2 : 1, down ? FRAME_COLORS.gold : 0xffffff, down ? 1 : 0.22);
  };
  frame.on('pointerdown', () => press(true));
  frame.on('pointerup', () => press(false));
  frame.on('pointerout', () => press(false));
  makePressable(frame, {
    onTap: () => {
      playSe(scene, SE.tap);
      sparkAt(scene, x + w / 2, y + h / 2);
      tile.onTap();
    },
  });
}
