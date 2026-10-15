import { ALBUM_COPY_MAX, ALBUM_SIZE } from '../data/constants';
import type { CardDef } from './types';

// アルバムの編集と、スナップの入手（段階41。docs/design/battle.md の 2.）。Phaser に依存しない。
// 持っているスナップ（owned）のうち、ALBUM_SIZE 枚ちょうどをアルバム（album）に入れて戦う。同じスナップは ALBUM_COPY_MAX 枚まで

/** スナップの id → 枚数 */
export type SnapCounts = Record<string, number>;

export interface AlbumState {
  /** 持っているスナップ（アルバムに入っている分も含む） */
  owned: SnapCounts;
  /** アルバムに入れているスナップ（合わせて ALBUM_SIZE 枚） */
  album: SnapCounts;
}

/** 最初の持ち物：最初のアルバムの中身を、そのまま持っている */
export function createAlbum(initial: { card: CardDef; count: number }[]): AlbumState {
  const counts: SnapCounts = {};
  for (const { card, count } of initial) counts[card.id] = (counts[card.id] ?? 0) + count;
  return { owned: { ...counts }, album: { ...counts } };
}

export function countOf(counts: SnapCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

/** アルバムに入れていない、持っているだけのスナップの枚数（id ごと。0 は除く） */
export function spareSnaps(state: AlbumState): SnapCounts {
  const out: SnapCounts = {};
  for (const [id, n] of Object.entries(state.owned)) {
    const spare = n - (state.album[id] ?? 0);
    if (spare > 0) out[id] = spare;
  }
  return out;
}

/** 入れ替えられるスナップがあるか（アルバムの画面を出すか） */
export function hasSpare(state: AlbumState): boolean {
  return countOf(spareSnaps(state)) > 0;
}

/** スナップを手に入れる（持ち物に足す。アルバムには入れない） */
export function gainSnaps(state: AlbumState, ids: string[]): AlbumState {
  const owned = { ...state.owned };
  for (const id of ids) owned[id] = (owned[id] ?? 0) + 1;
  return { owned, album: { ...state.album } };
}

/** アルバムに1枚入れられない理由。入れられるなら null */
export function getAddError(state: AlbumState, id: string, size = ALBUM_SIZE, copyMax = ALBUM_COPY_MAX): string | null {
  const inAlbum = state.album[id] ?? 0;
  if (inAlbum >= (state.owned[id] ?? 0)) return 'no spare copy';
  if (countOf(state.album) >= size) return 'album is full';
  if (inAlbum >= copyMax) return 'too many copies';
  return null;
}

export function addToAlbum(state: AlbumState, id: string, size = ALBUM_SIZE, copyMax = ALBUM_COPY_MAX): AlbumState {
  const err = getAddError(state, id, size, copyMax);
  if (err) throw new Error(err);
  return { owned: { ...state.owned }, album: { ...state.album, [id]: (state.album[id] ?? 0) + 1 } };
}

/** アルバムから1枚外す（持ち物には残る） */
export function removeFromAlbum(state: AlbumState, id: string): AlbumState {
  const n = state.album[id] ?? 0;
  if (n <= 0) throw new Error('not in the album');
  const album = { ...state.album };
  if (n === 1) delete album[id];
  else album[id] = n - 1;
  return { owned: { ...state.owned }, album };
}

/** アルバムが戦える形か（ちょうど size 枚） */
export function isAlbumComplete(state: AlbumState, size = ALBUM_SIZE): boolean {
  return countOf(state.album) === size;
}

/** 戦闘の山札：アルバムを枚数分に並べる（並びは cards の順。戦闘の始めにシャッフルする） */
export function albumDeck(state: AlbumState, cards: Record<string, CardDef>): CardDef[] {
  return Object.values(cards).flatMap((card) => Array.from({ length: state.album[card.id] ?? 0 }, () => card));
}

/**
 * セーブから読んだアルバムを、今のスナップに合わせて整える。
 * 知らないスナップは捨て、最初の持ち物は必ず持っていることにする。アルバムは持っている枚数と上限におさめ、
 * size 枚ちょうどでなければ最初のアルバムに戻す（壊れた形で戦えなくならないように）
 */
export function sanitizeAlbum(raw: unknown, cards: Record<string, CardDef>, initial: AlbumState, size = ALBUM_SIZE, copyMax = ALBUM_COPY_MAX): AlbumState {
  const obj = isObject(raw) ? raw : {};
  const owned: SnapCounts = { ...initial.owned };
  for (const [id, n] of Object.entries(counts(obj.owned, cards))) owned[id] = Math.max(owned[id] ?? 0, n);
  const album: SnapCounts = {};
  for (const [id, n] of Object.entries(counts(obj.album, cards))) {
    const kept = Math.min(n, owned[id] ?? 0, copyMax);
    if (kept > 0) album[id] = kept;
  }
  return { owned, album: countOf(album) === size ? album : { ...initial.album } };
}

function counts(raw: unknown, cards: Record<string, CardDef>): SnapCounts {
  const out: SnapCounts = {};
  if (!isObject(raw)) return out;
  for (const [id, n] of Object.entries(raw)) if (cards[id] && typeof n === 'number' && Number.isInteger(n) && n > 0) out[id] = n;
  return out;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
