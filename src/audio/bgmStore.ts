import type { AssetEntry } from '../data';
import { ASSETS } from '../data';
import { assetUrl, isBgm } from '../assets/paths';

// BGM を端末にしまう（2026-10-11、開発者と決めた。docs/design/tech.md）。
// タイトルで「はじめる」「はじめから」を押した時に、全部の曲をダウンロードしてブラウザのサイトのデータ置き場（Cache Storage）にしまう。
// 「つづきから」の時は、足りない曲だけを取る。曲を差し替えた時は、台帳の版の印（version）で URL が変わるので取り直す。
// 置き場が使えないブラウザ（https でない所など）では、しまわずに流す時にその場で読む

const CACHE_NAME = 'restopia-bgm';

/** 置き場（Cache Storage のうち使う所だけ。テストで差し替える） */
export interface BgmShelf {
  has(url: string): Promise<boolean>;
  get(url: string): Promise<ArrayBuffer | null>;
  put(url: string, data: Blob): Promise<void>;
  /** しまってある曲の URL */
  urls(): Promise<string[]>;
  remove(url: string): Promise<void>;
}

/** 台帳の BGM（ファイルのあるもの） */
export function bgmEntries(assets: AssetEntry[] = ASSETS): AssetEntry[] {
  return assets.filter((a) => isBgm(a) && a.file);
}

/** 置き場に入れる時の名前（ページからの絶対 URL。置き場は絶対 URL で覚えているため） */
export function bgmUrl(entry: AssetEntry): string {
  return new URL(assetUrl(entry), window.location.href).href;
}

let shelfPromise: Promise<BgmShelf | null> | null = null;

/** 置き場を開く。使えないブラウザでは null */
export function openShelf(): Promise<BgmShelf | null> {
  shelfPromise ??= (async () => {
    try {
      if (typeof caches === 'undefined') return null;
      const c = await caches.open(CACHE_NAME);
      return {
        has: async (url) => !!(await c.match(url)),
        get: async (url) => {
          const r = await c.match(url);
          return r ? r.arrayBuffer() : null;
        },
        put: (url, data) => c.put(url, new Response(data, { headers: { 'Content-Type': 'audio/mpeg' } })),
        urls: async () => (await c.keys()).map((r) => r.url),
        remove: async (url) => {
          await c.delete(url);
        },
      } satisfies BgmShelf;
    } catch (e) {
      console.warn('[bgm] 曲の置き場を開けなかった。流す時にその場で読む', e);
      return null;
    }
  })();
  return shelfPromise;
}

/** まだしまっていない曲 */
export async function missingBgm(shelf: BgmShelf, entries: AssetEntry[], urlOf: (e: AssetEntry) => string): Promise<AssetEntry[]> {
  const out: AssetEntry[] = [];
  for (const e of entries) if (!(await shelf.has(urlOf(e)))) out.push(e);
  return out;
}

/** 今の台帳にない曲（差し替える前の古い版など）を置き場から消す */
export async function pruneBgm(shelf: BgmShelf, entries: AssetEntry[], urlOf: (e: AssetEntry) => string): Promise<void> {
  const keep = new Set(entries.map(urlOf));
  for (const url of await shelf.urls()) if (!keep.has(url)) await shelf.remove(url);
}

/** 読み込みの進み具合（バイト） */
export type BgmProgress = (loaded: number, total: number) => void;

/** 曲を1つずつダウンロードしてしまう。1つでも取れなければ投げる（取れた曲はしまったまま） */
export async function downloadBgm(
  shelf: BgmShelf,
  entries: AssetEntry[],
  urlOf: (e: AssetEntry) => string,
  onProgress: BgmProgress,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const total = entries.reduce((sum, e) => sum + (e.bytes ?? 0), 0);
  let loaded = 0;
  onProgress(0, total);
  for (const e of entries) {
    const res = await fetchFn(urlOf(e));
    if (!res.ok) throw new Error(`${res.status} ${urlOf(e)}`);
    const chunks: Uint8Array[] = [];
    if (res.body) {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress(Math.min(loaded, total), total);
      }
    } else {
      const b = new Uint8Array(await res.arrayBuffer());
      chunks.push(b);
      loaded += b.length;
      onProgress(Math.min(loaded, total), total);
    }
    await shelf.put(urlOf(e), new Blob(chunks as BlobPart[], { type: 'audio/mpeg' }));
  }
}

/**
 * タイトルから始める時に呼ぶ：足りない曲をダウンロードしてしまう。古い版は消す。
 * 置き場が使えない時は何もしない（流す時にその場で読む）
 */
export async function prepareBgm(onProgress: BgmProgress): Promise<void> {
  const shelf = await openShelf();
  if (!shelf) return;
  const entries = bgmEntries();
  await pruneBgm(shelf, entries, bgmUrl).catch((e) => console.warn('[bgm] 古い曲を消せなかった', e));
  const missing = await missingBgm(shelf, entries, bgmUrl);
  if (missing.length > 0) await downloadBgm(shelf, missing, bgmUrl, onProgress);
}

/** 流す曲の mp3 を読む。しまってあればそこから、なければダウンロードして（置き場があれば）しまう */
export async function readBgm(entry: AssetEntry): Promise<ArrayBuffer> {
  const url = bgmUrl(entry);
  const shelf = await openShelf();
  const stored = await shelf?.get(url).catch(() => null);
  if (stored) return stored;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data = await res.arrayBuffer();
  if (shelf) void shelf.put(url, new Blob([data], { type: 'audio/mpeg' })).catch(() => undefined);
  return data;
}
