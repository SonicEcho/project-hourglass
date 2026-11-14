import { describe, expect, it } from 'vitest';
import { BARK_CAST, BARKS, CAST, LINKS } from '../../src/data';

// 戦闘中のひとこと（段階46a）のデータ。段階192（段階G2）で古い戦闘を外したので、今は新しい戦闘では使っていない（データと仕組みは残す）

describe('ひとことのデータ', () => {
  it('どの台詞の表情も、その人の会話の表情にある', () => {
    for (const [id, triggers] of Object.entries(BARKS)) {
      const cast = CAST[BARK_CAST[id]];
      expect(cast, id).toBeDefined();
      for (const lines of Object.values(triggers)) for (const l of lines ?? []) expect(Object.keys(cast.faces), `${id} ${l.text}`).toContain(l.face);
    }
  });

  it('連携技の2人には、呼ぶ台詞と答える台詞がある', () => {
    for (const link of LINKS) for (const id of link.members) {
      expect(BARKS[id]?.linkCall?.length, id).toBeGreaterThan(0);
      expect(BARKS[id]?.linkAnswer?.length, id).toBeGreaterThan(0);
    }
  });
});
