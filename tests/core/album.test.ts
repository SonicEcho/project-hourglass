import { describe, expect, it } from 'vitest';
import {
  addToAlbum,
  albumDeck,
  countOf,
  createAlbum,
  gainSnaps,
  getAddError,
  getRoundOrder,
  hasSpare,
  isAlbumComplete,
  removeFromAlbum,
  spareSnaps,
} from '../../src/core';
import { ALBUM_COPY_MAX, ALBUM_SIZE, AREA_BATTLES, AREAS, CARDS, FOLDER } from '../../src/data';
import { ally, attackOn, battle, enemy, eventsOf, execute, planAll, withHand } from './helpers';

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

describe('新しいスナップ', () => {
  const two = () => battle({ allies: [ally('hero', { spd: 12 }), ally('mio', { spd: 6 })], enemies: [enemy('e', { spd: 11 }, { weaknesses: ['ice'] })] });

  it('ジョーカー：相手の弱点の属性になる', () => {
    let s = withHand(two(), [CARDS.joker]);
    s = planAll(s, { hero: { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } }, mio: attackOn('enemy0') });
    s = execute(s);
    expect(eventsOf(s, 'damage').find((d) => d.sourceId === 'hero')?.affinity).toBe('weak');
  });

  it('ピンチヒッター：使う仲間は、このラウンドの最初に動く', () => {
    let s = withHand(two(), [CARDS.pinchHitter]);
    s = planAll(s, { mio: { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } }, hero: attackOn('enemy0') });
    expect(getRoundOrder(s).map((e) => e.ids[0])).toEqual(['mio', 'hero', 'enemy0']);
  });

  it('アンコール：このラウンドに最後に使われたスナップを、同じ相手にもう一度', () => {
    let s = withHand(two(), [CARDS.heavyBlow, CARDS.encore]);
    s = planAll(s, {
      hero: { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } },
      mio: { type: 'card', cardUid: s.hand[1].uid },
    });
    const from = s.log.length;
    s = execute(s);
    expect(eventsOf(s, 'encore', from)).toEqual([{ type: 'encore', actorId: 'mio', name: 'ヘビーブロウ' }]);
    const hits = eventsOf(s, 'damage', from).filter((d) => d.targetId === 'enemy0');
    expect(hits.map((d) => d.sourceId)).toEqual(['hero', 'mio']);
  });

  it('アンコール：まだ誰もスナップを使っていなければ不発', () => {
    let s = withHand(two(), [CARDS.encore]);
    s = planAll(s, { hero: { type: 'card', cardUid: s.hand[0].uid }, mio: attackOn('enemy0') });
    const from = s.log.length;
    s = execute(s);
    expect(eventsOf(s, 'encore', from)).toEqual([{ type: 'encore', actorId: 'hero', name: null }]);
  });
});
