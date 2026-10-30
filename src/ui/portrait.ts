import Phaser from 'phaser';
import { hasImage } from '../assets/loader';
import { CAST, FACE_CROP } from '../data';

/** 会話の人と表情 → 使える立ち絵の台帳の id（その表情の絵、なければ代わりの表情の絵。どちらもなければ ''） */
export function portraitImageId(scene: Phaser.Scene, castName: string, face: string): string {
  const def = CAST[castName];
  if (!def?.portrait) return '';
  const idOf = (f: string) => `${def.portrait}.${def.faces[f] ?? f}`;
  return [face, def.fallback?.[face]].map((f) => (f ? idOf(f) : '')).find((x) => x && hasImage(scene, x)) ?? '';
}

/** 立ち絵から顔を丸く切り出した絵（中心 cx, cy、半径 r。戦闘の行動順の丸と、育成の画面の顔のタブで使う） */
export function faceImage(scene: Phaser.Scene, id: string, cx: number, cy: number, r: number, crop: { x: number; y: number; size: number } = FACE_CROP): Phaser.GameObjects.Image {
  const src = scene.textures.get(id).getSourceImage();
  const size = src.width * crop.size;
  const sx = src.width * crop.x;
  const sy = src.height * crop.y;
  const img = scene.add.image(cx, cy, id).setCrop(sx, sy, size, size);
  img.setOrigin((sx + size / 2) / src.width, (sy + size / 2) / src.height).setScale((r * 2) / size);
  const shape = scene.make.graphics({}, false).fillStyle(0xffffff).fillCircle(cx, cy, r);
  img.setMask(shape.createGeometryMask());
  img.once(Phaser.GameObjects.Events.DESTROY, () => shape.destroy());
  return img;
}
