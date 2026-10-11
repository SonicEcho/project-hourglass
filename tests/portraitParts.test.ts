import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASSETS, CAST, PORTRAIT_PARTS } from '../src/data';

describe('立ち絵のまばたき・口パクの差分（段階46b）', () => {
  it('重ねる絵は台帳にあり、ファイルもある', () => {
    for (const [name, parts] of Object.entries(PORTRAIT_PARTS)) {
      for (const part of [parts.blink, parts.talk]) {
        if (!part) continue;
        const entry = ASSETS.find((a) => a.id === part.image);
        expect(entry, `${name} ${part.image}`).toBeDefined();
        expect(existsSync(`public/${entry!.file}`), entry!.file).toBe(true);
      }
    }
  });

  it('重ねてよい表情は、その人の表情の絵（CAST の faces の値）にある', () => {
    for (const [name, parts] of Object.entries(PORTRAIT_PARTS)) {
      const cast = CAST[name];
      expect(cast, name).toBeDefined();
      const ids = Object.values(cast.faces);
      for (const part of [parts.blink, parts.talk]) for (const f of part?.faces ?? []) expect(ids, `${name} ${f}`).toContain(f);
    }
  });
});
