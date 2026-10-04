import { describe, expect, it } from 'vitest';
import { buildFolder, DISTORTED_BEAST, ENCOUNTERS, FOLDER, PARTY } from '../src/data';

describe('データ定義', () => {
  it('フォルダは20枚', () => {
    expect(buildFolder()).toHaveLength(20);
    expect(FOLDER.reduce((n, f) => n + f.count, 0)).toBe(20);
  });

  it('仲間は主人公・あかり・みおの3人', () => {
    expect(PARTY.map((c) => c.name)).toEqual(['主人公', 'あかり', 'みお']);
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
