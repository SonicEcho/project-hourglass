import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// 見出しの書体（段階32a）は、ゲームで使う字だけに絞ってある（scripts/font-subset.py）。
// src/ に新しい字を書いたのに書体を作り直していないと、その字だけ端末の文字で出てしまうので、ここで知らせる

const ROOT = join(__dirname, '..');

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? tsFiles(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('見出しの書体', () => {
  it('src/ に書いた字が、すべて書体に入っている（足りなければ python3 scripts/font-subset.py で作り直す）', () => {
    const have = new Set(readFileSync(join(ROOT, 'public/assets/fonts/heading-chars.txt'), 'utf8'));
    const missing = new Set<string>();
    for (const f of tsFiles(join(ROOT, 'src'))) {
      for (const ch of readFileSync(f, 'utf8')) if (ch.codePointAt(0)! >= 0x80 && /\P{C}/u.test(ch) && !have.has(ch)) missing.add(ch);
    }
    expect([...missing].join('')).toBe('');
  });
});
