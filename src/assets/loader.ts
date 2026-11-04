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

/** 画面で読み込む素材か（ファイルがあり、差分を切り抜く元の絵でない） */
export function isLoadable(a: AssetEntry): boolean {
  // id が _src で終わる絵は、差分を切り抜く元の絵（scripts/portrait_parts.py）。画面では使わないので読み込まない
  return !!a.file && !a.id.endsWith('_src');
}

/** 読み込めなかった素材を覚える（その画面の loader に1回だけ付ける） */
export function watchLoadErrors(scene: Phaser.Scene): void {
  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
    failed.add(file.key);
    console.warn(`[assets] 読み込めなかった：${file.key}（${file.url}）。図形で代わりに描く`);
  });
}

/** 台帳の画像・SVG・効果音を、その画面の loader に積む（which で選んだものだけ） */
export function queueAssets(scene: Phaser.Scene, which: (a: AssetEntry) => boolean = () => true, assets: AssetEntry[] = ASSETS): void {
  watchLoadErrors(scene);
  queueFiles(scene, assets.filter(which));
}

/** 素材を、その画面の loader に積む（読み込めなかった時の覚えは付けない） */
export function queueFiles(scene: Phaser.Scene, assets: AssetEntry[]): void {
  for (const a of assets) {
    if (!isLoadable(a)) continue;
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

/**
 * 裏で読む素材の順番（段階148）。先に要る絵の id を渡すと、まだ読んでいない物を列の先頭へ回す（PreloadScene が受け持つ）。
 * PreloadScene が動く前は何もしない
 */
export const preloadQueue: {
  prioritize: (ids: string[]) => void;
  /** その絵だけを読み、ほかの絵は release まで止める（遊び始める時。絵を画面に載せる手間で、画面の動きが遅くならないように） */
  focus: (ids: string[]) => void;
  release: () => void;
  /** 何も読まずに止める（タイトルの間。押されたら、要る絵だけを focus で読む） */
  hold: () => void;
} = { prioritize: () => {}, focus: () => {}, release: () => {}, hold: () => {} };

/** その絵を読み終えたか（読めなかった物も、読み終えたとみなす。画面は図形で代わりに描く） */
export function isSettled(scene: Phaser.Scene, id: string): boolean {
  return failed.has(id) || scene.textures.exists(id);
}

/** 台帳にあって画面で読み込む絵のうち、まだ読み終えていない id */
export function unsettled(scene: Phaser.Scene, ids: string[]): string[] {
  const known = new Set(ASSETS.filter((a) => a.kind === 'image' && isLoadable(a)).map((a) => a.id));
  return [...new Set(ids)].filter((id) => known.has(id) && !isSettled(scene, id));
}
