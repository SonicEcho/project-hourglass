import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASSETS, CAST, PORTRAIT_PARTS } from '../src/data';

describe('立ち絵のまばたき・口パクの差分（段階46b）', () => {
  it('重ねる絵は台帳にあり、ファイルもある', () => {
    for (const [name, parts] of Object.entries(PORTRAIT_PARTS)) {
      for (const part of [parts.blink, parts.talk]) {
        if (!part) continue;
        for (const image of [part.image, ...Object.values(part.byFace ?? {})]) {
          const entry = ASSETS.find((a) => a.id === image);
          expect(entry, `${name} ${image}`).toBeDefined();
          expect(existsSync(`public/${entry!.file}`), entry!.file).toBe(true);
        }
      }
    }
  });

  it('重ねてよい表情は、その人の表情の絵（CAST の faces の値）にある', () => {
    for (const [name, parts] of Object.entries(PORTRAIT_PARTS)) {
      const cast = CAST[name];
      expect(cast, name).toBeDefined();
      const ids = Object.values(cast.faces);
      for (const part of [parts.blink, parts.talk]) for (const f of [...(part?.faces ?? []), ...Object.keys(part?.byFace ?? {})]) expect(ids, `${name} ${f}`).toContain(f);
    }
  });

  it('差分を切り抜く元の絵（id が _src で終わる）は、会話の表情に使っていない', () => {
    const used = Object.values(CAST).flatMap((c) => Object.values(c.faces).map((f) => `${c.portrait}.${f}`));
    expect(used.filter((id) => id.endsWith('_src'))).toEqual([]);
  });
});
