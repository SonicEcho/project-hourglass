import Phaser from 'phaser';
import type { AssetEntry } from '../data';
import { ASSETS } from '../data';
import { RENDER_SCALE } from '../ui/theme';

// 素材を読み込む部品（段階15）。素材の読み込みはここだけで行う。
// 画面は台帳（src/data/assets.ts）の id で素材を使い、ファイルがない・読み込めない時は今までの図形で代わりに描く

/** 読み込めなかった素材の id */
const failed = new Set<string>();

/** public/ からの場所を、公開先のサブパス（/project-hourglass/）付きの URL にする */
export function assetUrl(entry: Pick<AssetEntry, 'file'>): string {
  return `${import.meta.env.BASE_URL}${entry.file ?? ''}`;
}

/** 台帳の画像・SVG・音を、起動の画面の preload で読み込む */
export function queueAssets(scene: Phaser.Scene, assets: AssetEntry[] = ASSETS): void {
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
    failed.add(file.key);
    console.warn(`[assets] 読み込めなかった：${file.key}（${file.url}）。図形で代わりに描く`);
  });
  for (const a of assets) {
    if (!a.file) continue;
    if (a.kind === 'image') scene.load.image(a.id, assetUrl(a));
    // SVG は高解像度の画面でもにじまないよう、描く倍率に合わせた大きさで読み込む
    else if (a.kind === 'svg') scene.load.svg(a.id, assetUrl(a), { scale: RENDER_SCALE });
    else if (a.kind === 'audio') scene.load.audio(a.id, assetUrl(a));
  }
}

/** その素材が使えるか（読み込めていれば true） */
export function hasImage(scene: Phaser.Scene, id: string): boolean {
  return !failed.has(id) && scene.textures.exists(id);
}

/**
 * 台帳の画像を置く。使えない時は fallback で図形を描き、その図形を返す。
 * SVG は RENDER_SCALE 倍で読み込んでいるので、座標系（390×844）の大きさに戻して置く
 */
export function addImageOr<T extends Phaser.GameObjects.GameObject>(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  fallback: () => T,
): Phaser.GameObjects.Image | T {
  if (!hasImage(scene, id)) return fallback();
  const entry = ASSETS.find((a) => a.id === id);
  const img = scene.add.image(x, y, id);
  if (entry?.kind === 'svg') img.setScale(1 / RENDER_SCALE);
  return img;
}
