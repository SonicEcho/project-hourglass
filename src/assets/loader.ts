import Phaser from 'phaser';
import type { AssetEntry } from '../data';
import { ASSETS } from '../data';
import { RENDER_SCALE } from '../ui/theme';
import { assetUrl, isBgm } from './paths';

// 素材を読み込む部品（段階15）。素材の読み込みはここだけで行う。
// 画面は台帳（src/data/assets.ts）の id で素材を使い、ファイルがない・読み込めない時は今までの図形で代わりに描く

/** 読み込めなかった素材の id */
const failed = new Set<string>();

export { assetUrl, isBgm } from './paths';

/**
 * 起動の画面で読む素材か（段階69）：タイトルで使う SVG と効果音だけ。
 * 立ち絵・背景・地図・1枚絵・敵の絵（ほとんどの重さ）は、タイトルを出した後に裏で読む（PreloadScene）
 */
export function isBootAsset(a: AssetEntry): boolean {
  return a.kind !== 'image';
}

/** 台帳の画像・SVG・効果音を、その画面の loader に積む（which で選んだものだけ） */
export function queueAssets(scene: Phaser.Scene, which: (a: AssetEntry) => boolean = () => true, assets: AssetEntry[] = ASSETS): void {
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
    failed.add(file.key);
    console.warn(`[assets] 読み込めなかった：${file.key}（${file.url}）。図形で代わりに描く`);
  });
  for (const a of assets) {
    if (!which(a)) continue;
    // id が _src で終わる絵は、差分を切り抜く元の絵（scripts/portrait_parts.py）。画面では使わないので読み込まない
    if (!a.file || a.id.endsWith('_src')) continue;
    if (a.kind === 'image') scene.load.image(a.id, assetUrl(a));
    // SVG は高解像度の画面でもにじまないよう、描く倍率に合わせた大きさで読み込む
    else if (a.kind === 'svg') scene.load.svg(a.id, assetUrl(a), { scale: RENDER_SCALE });
    // BGM は起動では読まない（1曲が1〜2MB あるため。タイトルから始める時に端末にしまい、流す時に audio/sound.ts が読む）
    else if (a.kind === 'audio' && !isBgm(a)) scene.load.audio(a.id, assetUrl(a));
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

// ---- 裏での読み込み（段階69） ----

/** 裏で読む素材の進み具合（PreloadScene が書く。まだ始まっていなければ total 0） */
export const background = { loaded: 0, total: 0, done: false };
