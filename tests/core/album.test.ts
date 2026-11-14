import { describe, expect, it } from 'vitest';
import {
  addToAlbum,
  albumDeck,
  countOf,
  createAlbum,
  gainSnaps,
  getAddError,
  hasSpare,
  isAlbumComplete,
  removeFromAlbum,
  spareSnaps,
} from '../../src/core';
import { ALBUM_COPY_MAX, ALBUM_SIZE, AREA_BATTLES, AREAS, CARDS, FOLDER } from '../../src/data';

// 段階41：アルバムの編集と、スナップの入手。新しいスナップ（ジョーカー・アンコール・ピンチヒッター）

describe('アルバムの編集', () => {
  it('最初は、最初のアルバムの中身をそのまま持っていて、入れ替えられるものはない', () => {
    const a = createAlbum(FOLDER);
    expect(countOf(a.album)).toBe(ALBUM_SIZE);
    expect(a.owned).toEqual(a.album);
    expect(hasSpare(a)).toBe(false);
  });

  it('手に入れたスナップは持ち物に入り、アルバムには入らない', () => {
    const a = gainSnaps(createAlbum(FOLDER), ['joker', 'sword']);
    expect(spareSnaps(a)).toEqual({ joker: 1, sword: 1 });
    expect(countOf(a.album)).toBe(ALBUM_SIZE);
  });

  it('いっぱいの時は入れられない。外してから入れる', () => {
    let a = gainSnaps(createAlbum(FOLDER), ['joker']);
    expect(getAddError(a, 'joker')).toBe('album is full');
    a = removeFromAlbum(a, 'sword');
    expect(isAlbumComplete(a)).toBe(false);
    a = addToAlbum(a, 'joker');
    expect(isAlbumComplete(a)).toBe(true);
    expect(a.album.joker).toBe(1);
    // 持っている分より多くは入れられない
    a = removeFromAlbum(a, 'sword');
    expect(getAddError(a, 'joker')).toBe('no spare copy');
  });

  it(`同じスナップは${ALBUM_COPY_MAX}枚まで`, () => {
    let a = gainSnaps(createAlbum(FOLDER), ['sword', 'sword']);
    a = removeFromAlbum(removeFromAlbum(a, 'draw'), 'search');
    a = addToAlbum(a, 'sword');
    expect(a.album.sword).toBe(ALBUM_COPY_MAX);
    expect(getAddError(a, 'sword')).toBe('too many copies');
  });

  it('戦闘の山札はアルバムの中身', () => {
    const a = addToAlbum(removeFromAlbum(gainSnaps(createAlbum(FOLDER), ['encore']), 'sword'), 'encore');
    const deck = albumDeck(a, CARDS);
    expect(deck).toHaveLength(ALBUM_SIZE);
    expect(deck.filter((c) => c.id === 'encore')).toHaveLength(1);
    expect(deck.filter((c) => c.id === 'sword')).toHaveLength(2);
  });

  it('入手の道筋：宝箱・ボス・返した報酬のスナップは、どれも今あるスナップ', () => {
    const ids = [
      ...Object.values(AREAS).flatMap((a) => [...a.chests.flatMap((c) => c.snaps ?? []), ...(a.returnSnaps ?? [])]),
      ...Object.values(AREA_BATTLES).flatMap((b) => b.snaps ?? []),
    ];
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(CARDS[id as keyof typeof CARDS], id).toBeDefined();
    // 新しい3枚は、2章のどこかで手に入る
    for (const id of ['joker', 'encore', 'pinchHitter']) expect(ids).toContain(id);
  });
});

