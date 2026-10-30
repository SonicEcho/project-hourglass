import { afterEach, describe, expect, it } from 'vitest';
import { addToAlbum, createAlbum, gainSnaps, parseSave, removeFromAlbum, sameAlbum } from '../src/core';
import { FOLDER } from '../src/data';
import type { SaveStorage } from '../src/save/storage';
import { memoryStorage } from '../src/save/storage';
import { isSaveFailing, isStaleByOtherTab, markStaleByOtherTab, onSaveStatus, readSave, run, SAVE_KEY, saveContext, saveRun, setSaveStorage, startNewRun } from '../src/scenes/run';

// 段階124（レビューの項目1〜3）：保存の結果と知らせ、アルバムの下書き

/** 書き込みを失敗させたり戻したりできる保存の窓口 */
function flakyStorage(): SaveStorage & { fail: boolean; writes: number } {
  const inner = memoryStorage();
  const s = {
    fail: false,
    writes: 0,
    read: (key: string) => inner.read(key),
    write: (key: string, text: string) => {
      s.writes++;
      return s.fail ? false : inner.write(key, text);
    },
    remove: (key: string) => inner.remove(key),
  };
  return s;
}

afterEach(() => {
  run.active = false;
  setSaveStorage(memoryStorage());
});

describe('保存の結果（段階124）', () => {
  it('書き込めた・同じなので省いた・周回の外・書き込めない、を分けて返す', () => {
    const st = flakyStorage();
    setSaveStorage(st);
    startNewRun();
    expect(isSaveFailing()).toBe(false);
    expect(saveRun()).toBe('unchanged');
    run.vars = { a: '1' };
    expect(saveRun()).toBe('saved');
    st.fail = true;
    run.vars = { a: '2' };
    expect(saveRun()).toBe('failed');
    expect(isSaveFailing()).toBe(true);
    run.active = false;
    expect(saveRun()).toBe('skipped');
  });

  it('最初の書き込みから失敗した時も、成功とは言わない', () => {
    const st = flakyStorage();
    st.fail = true;
    setSaveStorage(st);
    startNewRun();
    expect(isSaveFailing()).toBe(true);
    expect(saveRun()).toBe('failed');
    expect(st.read(SAVE_KEY)).toBeNull();
  });

  it('続けて失敗しても知らせは1回だけ。書き込めたら失敗の状態は消える', () => {
    const st = flakyStorage();
    setSaveStorage(st);
    startNewRun();
    const seen: boolean[] = [];
    const off = onSaveStatus((f) => seen.push(f));
    st.fail = true;
    run.vars = { a: '1' };
    expect(saveRun()).toBe('failed');
    expect(saveRun()).toBe('failed');
    run.vars = { a: '2' };
    expect(saveRun()).toBe('failed');
    // 失敗した後も、同じ中身でもう一度書き込もうとする（省かない）
    expect(st.writes).toBe(4);
    st.fail = false;
    expect(saveRun()).toBe('saved');
    expect(isSaveFailing()).toBe(false);
    expect(seen).toEqual([true, false]);
    const r = readSave();
    expect(r?.ok && r.save.run.vars).toEqual({ a: '2' });
    off();
  });

  it('失敗の後に、中身が前に保存できた形へ戻ったら、保存は済んでいる', () => {
    const st = flakyStorage();
    setSaveStorage(st);
    startNewRun();
    st.fail = true;
    run.vars = { a: '1' };
    expect(saveRun()).toBe('failed');
    run.vars = {};
    expect(saveRun()).toBe('unchanged');
    expect(isSaveFailing()).toBe(false);
  });

  it('保存の場所を替えると、失敗の状態は消える', () => {
    const st = flakyStorage();
    st.fail = true;
    setSaveStorage(st);
    startNewRun();
    expect(isSaveFailing()).toBe(true);
    setSaveStorage(memoryStorage());
    expect(isSaveFailing()).toBe(false);
  });
});

describe('ほかのタブで進めた時（段階134）', () => {
  it('ほかのタブで保存が書き換わったら、このタブからは保存しない（新しい進み具合を上書きしない）', () => {
    const st = flakyStorage();
    setSaveStorage(st);
    startNewRun();
    // ほかのタブが新しい進み具合を書いた
    st.write(SAVE_KEY, 'other tab');
    markStaleByOtherTab();
    expect(isStaleByOtherTab()).toBe(true);
    run.vars = { a: '1' };
    const writes = st.writes;
    expect(saveRun()).toBe('stale');
    expect(st.writes).toBe(writes);
    expect(st.read(SAVE_KEY)).toBe('other tab');
  });

  it('保存の場所を替える（開き直す）と、また保存する', () => {
    markStaleByOtherTab();
    setSaveStorage(memoryStorage());
    expect(isStaleByOtherTab()).toBe(false);
    startNewRun();
    run.vars = { a: '1' };
    expect(saveRun()).toBe('saved');
  });
});

describe('アルバムの下書き（段階124）', () => {
  /** 初期の20枚から1枚入れ替えた、決めた編成 */
  function customAlbum() {
    const a = gainSnaps(createAlbum(FOLDER), ['joker']);
    return addToAlbum(removeFromAlbum(a, Object.keys(a.album)[0]), 'joker');
  }

  it('編集の途中（19枚）で保存されても、セーブには決めた20枚が残る', () => {
    const st = flakyStorage();
    setSaveStorage(st);
    startNewRun();
    run.album = customAlbum();
    saveRun();
    // 画面の中だけで下書きを変える（run.album は変えない）
    const draft = removeFromAlbum(run.album, 'joker');
    expect(sameAlbum(draft, run.album)).toBe(false);
    saveRun();
    const r = parseSave(st.read(SAVE_KEY)!, saveContext());
    expect(r.ok && r.save.run.album).toEqual(customAlbum());
  });

  it('壊れた（20枚でない）アルバムを読んだ時は、持ち物を残して最初の編成に戻す（今までどおりの守り）', () => {
    const st = flakyStorage();
    setSaveStorage(st);
    startNewRun();
    run.album = removeFromAlbum(customAlbum(), 'joker');
    saveRun();
    const r = parseSave(st.read(SAVE_KEY)!, saveContext());
    expect(r.ok && r.save.run.album.album).toEqual(createAlbum(FOLDER).album);
    expect(r.ok && r.save.run.album.owned.joker).toBe(1);
  });

  it('sameAlbum は入れている枚数だけを比べる', () => {
    const a = createAlbum(FOLDER);
    expect(sameAlbum(a, gainSnaps(a, ['joker']))).toBe(true);
    expect(sameAlbum(a, customAlbum())).toBe(false);
    // 外して同じ物を入れ直すと、変わっていない
    const id = Object.keys(a.album)[0];
    expect(sameAlbum(a, addToAlbum(removeFromAlbum(a, id), id))).toBe(true);
  });
});
