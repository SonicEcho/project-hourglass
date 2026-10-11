import type { AssetEntry } from '../data';

// 素材の場所（Phaser を読み込まない。テストからも使う）

/** public/ からの場所を、公開先のサブパス（/project-hourglass/）付きの URL にする。版の印があれば ?v= に付ける（中身を替えたら別の URL になる） */
export function assetUrl(entry: Pick<AssetEntry, 'file' | 'version'>): string {
  const url = `${import.meta.env.BASE_URL}${entry.file ?? ''}`;
  return entry.version ? `${url}?v=${entry.version}` : url;
}

/** BGM か（台帳の id が bgm. で始まる音）。BGM は起動では読まず、端末にしまって使う（audio/bgmStore.ts） */
export function isBgm(entry: Pick<AssetEntry, 'id' | 'kind'>): boolean {
  return entry.kind === 'audio' && entry.id.startsWith('bgm.');
}
