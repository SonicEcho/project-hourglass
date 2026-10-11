import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BgmShelf } from '../src/audio/bgmStore';
import { bgmEntries, downloadBgm, missingBgm, pruneBgm } from '../src/audio/bgmStore';
import { assetUrl } from '../src/assets/paths';
import type { AssetEntry } from '../src/data';

// BGM を端末にしまう（2026-10-11）

const ROOT = join(__dirname, '..');

/** 置き場の代わり（覚えた URL と中身） */
function fakeShelf(initial: string[] = []): BgmShelf & { stored: Map<string, number> } {
  const stored = new Map<string, number>(initial.map((u) => [u, 0]));
  return {
    stored,
    has: async (url) => stored.has(url),
    get: async () => null,
    put: async (url, data) => {
      stored.set(url, data.size);
    },
    urls: async () => [...stored.keys()],
    remove: async (url) => {
      stored.delete(url);
    },
  };
}

const song = (id: string, bytes: number): AssetEntry =>
  ({ id, kind: 'audio', file: `assets/bgm/${id}.mp3`, version: 'v1', bytes }) as AssetEntry;
const urlOf = (e: AssetEntry) => `https://example.com/${e.file}?v=${e.version}`;

describe('BGM の台帳', () => {
  it('BGM はどれも、版の印（sha256 の頭12文字）と大きさがファイルと合う（曲を替えたら書き直す）', () => {
    const entries = bgmEntries();
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      const data = readFileSync(join(ROOT, 'public', e.file!));
      expect({ id: e.id, version: e.version, bytes: e.bytes }).toEqual({
        id: e.id,
        version: createHash('sha256').update(data).digest('hex').slice(0, 12),
        bytes: data.length,
      });
    }
  });

  it('版の印は URL の ?v= に付く（中身を替えたら、端末にしまった古い曲と別になる）', () => {
    expect(assetUrl({ file: 'assets/bgm/a.mp3', version: 'abc' })).toMatch(/assets\/bgm\/a\.mp3\?v=abc$/);
    expect(assetUrl({ file: 'assets/se/a.mp3' })).toMatch(/assets\/se\/a\.mp3$/);
  });
});

describe('BGM を端末にしまう', () => {
  it('しまっていない曲だけを取る', async () => {
    const a = song('a', 10);
    const b = song('b', 20);
    const shelf = fakeShelf([urlOf(a)]);
    expect((await missingBgm(shelf, [a, b], urlOf)).map((e) => e.id)).toEqual(['b']);
  });

  it('今の台帳にない古い曲は消す', async () => {
    const a = song('a', 10);
    const shelf = fakeShelf([urlOf(a), 'https://example.com/assets/bgm/a.mp3?v=old']);
    await pruneBgm(shelf, [a], urlOf);
    expect([...shelf.stored.keys()]).toEqual([urlOf(a)]);
  });

  it('1つずつダウンロードしてしまい、進み具合を台帳の大きさの合計で知らせる', async () => {
    const a = song('a', 3);
    const b = song('b', 5);
    const shelf = fakeShelf();
    const seen: [number, number][] = [];
    const fetchFn = (async (url: string) => new Response(new Uint8Array(url.includes('/a.mp3') ? 3 : 5))) as typeof fetch;
    await downloadBgm(shelf, [a, b], urlOf, (l, t) => seen.push([l, t]), fetchFn);
    expect(shelf.stored.get(urlOf(a))).toBe(3);
    expect(shelf.stored.get(urlOf(b))).toBe(5);
    expect(seen[0]).toEqual([0, 8]);
    expect(seen.at(-1)).toEqual([8, 8]);
  });

  it('取れない曲があれば止めて知らせる（取れた曲はしまったまま）', async () => {
    const a = song('a', 3);
    const b = song('b', 5);
    const shelf = fakeShelf();
    const fetchFn = (async (url: string) =>
      url.includes('/b.mp3') ? new Response(null, { status: 404 }) : new Response(new Uint8Array(3))) as typeof fetch;
    await expect(downloadBgm(shelf, [a, b], urlOf, () => undefined, fetchFn)).rejects.toThrow('404');
    expect([...shelf.stored.keys()]).toEqual([urlOf(a)]);
  });
});
