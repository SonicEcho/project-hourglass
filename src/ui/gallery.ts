import Phaser from 'phaser';
import { hasImage } from '../assets/loader';
import { HUB_TILE_ART, HUB_TILE_CROP_BOTTOM, HUB_TILE_FOCUS, HUB_TILE_SHIFT, HUB_TILE_TALL, type HubTileId } from '../data';
import { playSe } from '../audio/sound';
import { SE } from '../data';
import { sparkAt } from './skin';
import { COLORS, FONT, STYLE } from './theme';
import { addSlant, addText, makePressable } from './widgets';

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

/**
 * 斜めに切った絵のタイル（段階226。テーマ「スタイリッシュ」の拠点。docs/milestones/M3_ui_polish.md の 8. の A）。左上が x, y。
 * 1枚絵を右へ傾けた平行四辺形に切り抜き、下を暗くして、名前を白い斜体に紅の影で重ねる。札は黄の斜めの札。
 * big は「砂の底へ」のような大きなタイル（名前を紅の帯に載せる）
 */
export function addSlantTile(scene: Phaser.Scene, root: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, tile: GalleryTile, big = false): void {
  const enabled = tile.enabled ?? true;
  const k = Math.min(big ? 26 : 14, h * 0.2);
  const pts = [x + k, y, x + w, y, x + w - k, y + h, x, y + h];
  const poly = () => [0, 1, 2, 3].map((i) => new Phaser.Math.Vector2(pts[i * 2], pts[i * 2 + 1]));
  // 影
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.75).fillPoints(poly().map((p) => new Phaser.Math.Vector2(p.x + 4, p.y + 4)), true);
  root.add(shadow);
  const face = scene.add.container(0, 0);
  face.add(scene.add.rectangle(x, y, w, h, 0x1a1418).setOrigin(0));
  // 段階227：縦長のタイル用の絵があれば先に使う（砂の底の横長の帯は tile.sandBottom）
  const tall = big ? undefined : HUB_TILE_TALL[tile.id];
  const art = [...(tall ? [tall] : []), ...HUB_TILE_ART[tile.id]].find((id) => hasImage(scene, id));
  if (art) {
    // 段階227 の直し：大きさは変えずに、絵を下へずらす（下の端は切れる。上に空いた所は暗くぼかす）
    const shift = Math.round(h * (HUB_TILE_SHIFT[art] ?? 0));
    let img: Phaser.GameObjects.Image;
    if (shift > 0) {
      const src = scene.textures.get(art).getSourceImage();
      const scale = Math.max(w / src.width, h / src.height);
      const sx = (src.width - w / scale) / 2;
      img = scene.add.image(x - sx * scale, y + shift, art).setOrigin(0).setScale(scale).setCrop(sx, 0, w / scale, (h - shift) / scale);
      face.add(img);
      const fade = scene.add.graphics();
      fade.fillGradientStyle(0x0b0a0c, 0x0b0a0c, 0x0b0a0c, 0x0b0a0c, 1, 1, 0, 0);
      fade.fillRect(x, y + shift - 1, w, Math.min(26, h * 0.2));
      face.add(fade);
    } else if (HUB_TILE_CROP_BOTTOM[art]) {
      // 下を切り落とし、残った上の方をタイルいっぱいに（左右は真ん中から切る）
      const src = scene.textures.get(art).getSourceImage();
      const usedH = src.height * (1 - HUB_TILE_CROP_BOTTOM[art]);
      const scale = Math.max(w / src.width, h / usedH);
      const sx = (src.width - w / scale) / 2;
      img = scene.add.image(x - sx * scale, y, art).setOrigin(0).setScale(scale).setCrop(sx, 0, w / scale, h / scale);
      face.add(img);
    } else {
      img = coverImage(scene, art, x, y, w, h, HUB_TILE_FOCUS[art] ?? 0.5);
      face.add(img);
    }
    if (!enabled) img.setAlpha(0.3).setTint(0x888888);
  }
  const shade = scene.add.graphics();
  // 段階227 の直し：名前のための暗がりは、下の方だけ・少し薄く（絵の下が暗いと、切れて見えたので）
  const top = y + h * (big ? 0.3 : 0.55);
  shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.82, 0.82);
  shade.fillRect(x, top, w, y + h - top);
  face.add(shade);
  const mask = scene.make.graphics({}, false).fillStyle(0xffffff).fillPoints(poly(), true);
  face.setMask(mask.createGeometryMask());
  face.once(Phaser.GameObjects.Events.DESTROY, () => mask.destroy());
  root.add(face);
  // ふち（大きなタイルは紅、ほかは白）
  const edge = scene.add.graphics();
  const drawEdge = (down: boolean) => {
    edge.clear();
    edge.lineStyle(down ? 3 : big ? 3 : 2, down ? STYLE.red : big ? STYLE.red : 0xffffff, enabled ? 1 : 0.3).strokePoints(poly(), true);
  };
  drawEdge(false);
  root.add(edge);
  if (big) {
    // 名前は紅の斜めの帯に
    const name = addText(scene, 0, 0, tile.label, { size: 22, bold: true }).setFontFamily(FONT).setFontStyle('bold italic');
    const sub = tile.sub ? addText(scene, 0, 0, tile.sub, { size: 10, color: '#ffffff' }) : undefined;
    const bw = Math.max(name.width, sub?.width ?? 0) + 40;
    const bh = sub ? 50 : 36;
    const by = y + h - bh - 10;
    root.add(addSlant(scene, x + bw / 2, by + bh / 2, bw, bh, enabled ? STYLE.red : STYLE.redDim));
    name.setPosition(x + 12, by + 4);
    root.add(name);
    if (sub) root.add(sub.setPosition(x + 14, by + 32));
  } else {
    // 段階227 の直し（開発者の声）：名前はどのタイルも一番下の同じ高さ。一言（星の砂など）は左上の小さな黒い札に。
    // 名前は斜めに切った右下に掛からない幅に縮める
    const label = addText(scene, x + 6, y + h - 7, tile.label, { size: 12, bold: true, color: enabled ? COLORS.text : COLORS.dimText });
    label.setOrigin(0, 1).setFontFamily(FONT).setFontStyle('bold italic').setShadow(2, 2, STYLE.redText, 0, false, true);
    const room = w - k - 14;
    if (label.width > room) label.setScale(room / label.width);
    root.add(label);
    if (tile.sub) {
      const sub = addText(scene, 0, 0, tile.sub, { size: 9, bold: true, color: '#ffffff' });
      const sw = Math.min(sub.width + 12, w - k - 6);
      if (sub.width > sw - 10) sub.setScale((sw - 10) / sub.width);
      const sy = y + h - 34;
      root.add(addSlant(scene, x + 4 + sw / 2, sy, sw, 15, 0x000000, 0.8));
      root.add(sub.setOrigin(0.5).setPosition(x + 4 + sw / 2, sy));
    }
  }
  // 右上の札（黄の斜めの札。赤の札はそのまま赤）
  if (tile.badge) {
    const t = addText(scene, 0, 0, tile.badge, { size: 9, bold: true, color: tile.badgeColor ? '#ffffff' : '#000000' });
    const bw = t.width + 14;
    // 段階227 の直し（開発者の声）：札は左の端をそろえ、タイルの左の枠から少しはみ出させて目立たせる（黒い影付き）
    const bx = x - 6 + bw / 2;
    root.add(addSlant(scene, bx + 3, y + 14, bw, 16, 0x000000, 0.8));
    root.add(addSlant(scene, bx, y + 11, bw, 16, tile.badgeColor ?? STYLE.yellow));
    root.add(t.setPosition(bx, y + 11).setOrigin(0.5));
  }
  if (!enabled) return;
  const hit = scene.add.rectangle(x, y, w, h, 0xffffff, 0.001).setOrigin(0);
  root.add(hit);
  const press = (down: boolean) => {
    face.setAlpha(down ? 0.75 : 1);
    drawEdge(down);
  };
  hit.on('pointerdown', () => press(true));
  hit.on('pointerup', () => press(false));
  hit.on('pointerout', () => press(false));
  makePressable(hit, {
    onTap: () => {
      playSe(scene, SE.tap);
      sparkAt(scene, x + w / 2, y + h / 2);
      tile.onTap();
    },
  });
}

