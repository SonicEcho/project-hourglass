import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 2026-11-23：同じ名前のまま描き直した絵が、端末で入れ替わらなかった。印を付けないのは Vite が作った js・css だけ（docs/design/tech.md の決定の記録）
describe('端末にしまう設定', () => {
  it('中身の印を付けないのは、名前に印のある js・css だけ（絵には印を付ける）', () => {
    const src = readFileSync('vite.config.ts', 'utf8');
    const m = src.match(/dontCacheBustURLsMatching:\s*(\/.+\/),/);
    expect(m).toBeTruthy();
    // eslint-disable-next-line no-eval
    const re = eval(m![1]) as RegExp;
    expect(re.test('assets/index-BpT0_RaK.js')).toBe(true);
    expect(re.test('assets/sprites/props/lantern_white_on.webp')).toBe(false);
    expect(re.test('assets/maps/fest2_backyard_ground.webp')).toBe(false);
  });
});
