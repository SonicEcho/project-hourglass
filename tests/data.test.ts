import { describe, expect, it } from 'vitest';
import { buildFolder, CARD_NAME_LINES, CARDS, DISTORTED_BEAST, ENCOUNTERS, FOLDER, PARTY } from '../src/data';

describe('データ定義', () => {
  it('カードの名前の2行の分け方は、改行を除くと名前と同じで、2行まで（段階32b）', () => {
    for (const [id, lines] of Object.entries(CARD_NAME_LINES)) {
      const card = (CARDS as Record<string, { name: string }>)[id];
      expect(card, id).toBeDefined();
      expect(lines?.replace('\n', '')).toBe(card.name);
      expect(lines?.split('\n').length).toBe(2);
    }
  });

  it('アルバムは20枚', () => {
    expect(buildFolder()).toHaveLength(20);
    expect(FOLDER.reduce((n, f) => n + f.count, 0)).toBe(20);
  });

  it('仲間はハルト・あかり・みおの3人', () => {
    expect(PARTY.map((c) => c.name)).toEqual(['ハルト', 'あかり', 'みお']);
  });

  it('戦闘1は雑魚3体、戦闘2はボス1体', () => {
    expect(ENCOUNTERS.battle1.enemies.map((e) => e.name)).toEqual(['スライム', 'フロストバット', 'アーマードッグ']);
    expect(ENCOUNTERS.battle2.enemies).toEqual([DISTORTED_BEAST]);
  });

  it('ボスの部位が使う行動は、存在する部位を指している', () => {
    const partIds = (DISTORTED_BEAST.parts ?? []).map((p) => p.id);
    for (const a of DISTORTED_BEAST.actions) {
      if (a.requiresPart) expect(partIds).toContain(a.requiresPart);
    }
  });
});
