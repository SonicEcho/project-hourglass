import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCredits } from '../src/assets/credits';
import type { AssetEntry } from '../src/data';
import { ASSETS } from '../src/data';

// 素材台帳の書き漏れを、公開の前に自動で止める（段階15。決まりは docs/ASSETS.md）

const ROOT = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

/** 台帳の1つ分の決まりを確かめ、守れていない点を返す */
function problems(a: AssetEntry): string[] {
  const out: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.acquiredAt)) out.push('手に入れた日が YYYY-MM-DD でない');
  if (!a.author.trim() || !a.license.trim()) out.push('作者かライセンスが空');
  if (a.creditRequired && !a.credit?.trim()) out.push('クレジットが要るのに、その文がない');
  if (a.status === 'final' && !a.commercialUse) out.push('本番の素材なのに、売り物に使えない');
  if (a.kind === 'library') {
    if (a.source.type !== 'library') out.push('ライブラリなのに入手元がライブラリでない');
    if (a.file) out.push('ライブラリにファイルの場所がある');
  } else {
    if (!a.file) out.push('ファイルの場所がない');
    else if (!existsSync(join(ROOT, 'public', a.file))) out.push(`public/${a.file} がない`);
    if (a.source.type === 'library') out.push('素材なのに入手元がライブラリ');
  }
  const s = a.source;
  if (s.type === 'free' && (!/^https?:\/\//.test(s.url) || !s.site.trim())) out.push('フリー素材のサイト名か URL がない');
  if (s.type === 'ai' && (!s.service.trim() || !s.plan.trim() || !s.prompt.trim())) out.push('AI の素材のサービス名・版・プロンプトのどれかがない');
  if ((s.type === 'free' || s.type === 'library') && !a.termsCopy) out.push('利用規約・ライセンス文の控えの場所がない');
  if (a.termsCopy && !existsSync(join(ROOT, a.termsCopy))) out.push(`${a.termsCopy} がない`);
  return out;
}

describe('素材台帳', () => {
  it('id が重ならない', () => {
    expect(new Set(ASSETS.map((a) => a.id)).size).toBe(ASSETS.length);
  });

  it.each(ASSETS.map((a) => [a.id, a] as const))('%s：決まりどおりに書いてある', (_id, a) => {
    expect(problems(a)).toEqual([]);
  });

  it('台帳のライブラリは、package.json の配布物に入るもの（dependencies と、配布物に入る eruda）と合う', () => {
    const libs = ASSETS.flatMap((a) => (a.source.type === 'library' ? [a.source.npm] : [])).sort();
    // eruda は ?debug=1 の時だけ読み込むが、ファイルとして配布物に入るので台帳に載せる
    const shipped = [...Object.keys(pkg.dependencies ?? {}), 'eruda'].sort();
    expect(libs).toEqual(shipped);
  });

  it('決まりを破った書き方は見つけられる（テストの確かめ）', () => {
    const bad: AssetEntry = {
      id: 'x',
      kind: 'image',
      title: 'x',
      file: 'assets/none.png',
      status: 'final',
      source: { type: 'free', site: '', url: 'x' },
      author: 'a',
      license: 'l',
      commercialUse: false,
      creditRequired: true,
      modifyAllowed: false,
      acquiredAt: '2026/10/07',
    };
    expect(problems(bad)).toEqual([
      '手に入れた日が YYYY-MM-DD でない',
      'クレジットが要るのに、その文がない',
      '本番の素材なのに、売り物に使えない',
      'public/assets/none.png がない',
      'フリー素材のサイト名か URL がない',
      '利用規約・ライセンス文の控えの場所がない',
    ]);
    const ai: AssetEntry = { ...bad, source: { type: 'ai', service: 'S', plan: '有料', prompt: '' } };
    expect(problems(ai)).toContain('AI の素材のサービス名・版・プロンプトのどれかがない');
  });
});

describe('クレジットの画面の一覧', () => {
  it('素材とライブラリに分け、作者・ライセンス・クレジットの文を出す', () => {
    const [media, libs] = buildCredits(ASSETS);
    expect(media.items.map((i) => i.title)).toContain('タイトルの砂時計');
    const phaser = libs.items.find((i) => i.title === 'Phaser')!;
    expect(phaser.lines).toContain('ライセンス：MIT License');
    expect(phaser.lines.some((l) => l.includes('Copyright'))).toBe(true);
  });

  it('?debug=1 の時だけ、仮／本番と入手元を出す', () => {
    const plain = buildCredits(ASSETS)[0].items[0].lines.join();
    const debug = buildCredits(ASSETS, true)[0].items[0].lines.join();
    expect(plain).not.toContain('［仮］');
    expect(debug).toContain('［仮］自作');
  });
});
