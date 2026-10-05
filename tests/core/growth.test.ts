import { describe, expect, it } from 'vitest';
import {
  applyGrowth,
  battleReward,
  createGrowth,
  findNode,
  getOpenError,
  knownSkillIds,
  neighbors,
  nodeCost,
  openableNodes,
  openNode,
  piecePosition,
} from '../../src/core';
import type { GrowthState } from '../../src/core';
import { AKARI, CAMPAIGN, GROWTH_COST, GROWTH_MAP, HERO, MIO, PARTY, SKILLS, START_MEMORY_POINTS } from '../../src/data';

const ids = PARTY.map((c) => c.id);
const fresh = (points = 99): GrowthState => createGrowth(GROWTH_MAP, ids, points);
const at = (row: number, col: number) => `n${row}_${col}`;

describe('成長マップのデータ', () => {
  it('7×9の格子に約40マス。3人の出発点がある', () => {
    expect(GROWTH_MAP.nodes.length).toBeGreaterThanOrEqual(40);
    for (const n of GROWTH_MAP.nodes) {
      expect(n.col).toBeLessThan(7);
      expect(n.row).toBeLessThan(9);
    }
    expect(GROWTH_MAP.nodes.filter((n) => n.kind === 'start').map((n) => (n.kind === 'start' ? n.owner : ''))).toEqual(
      expect.arrayContaining(['hero', 'akari', 'mio']),
    );
  });

  it('すべてのマスが道でつながっている', () => {
    const seen = new Set<string>([GROWTH_MAP.nodes[0].id]);
    const queue = [GROWTH_MAP.nodes[0].id];
    while (queue.length) {
      for (const nb of neighbors(GROWTH_MAP, queue.shift()!)) {
        if (!seen.has(nb.id)) {
          seen.add(nb.id);
          queue.push(nb.id);
        }
      }
    }
    expect(seen.size).toBe(GROWTH_MAP.nodes.length);
  });

  it('魔法・スキルのマスは、実在する魔法・スキルを指している', () => {
    const all = Object.keys(SKILLS);
    for (const n of GROWTH_MAP.nodes) if (n.kind === 'skill') expect(all).toContain(n.skillId);
  });

  it('周回は5戦。最後がボス', () => {
    expect(CAMPAIGN).toHaveLength(5);
    expect(CAMPAIGN[4].boss).toBe(true);
    expect(CAMPAIGN.slice(0, 4).map((b) => b.reward)).toEqual([4, 5, 6, 7]);
  });
});

describe('成長マップ', () => {
  it('始めは各キャラが自分の出発点だけ開いていて、記憶ポイントを持っている', () => {
    const g = createGrowth(GROWTH_MAP, ids, START_MEMORY_POINTS);
    expect(g.points).toBe(START_MEMORY_POINTS);
    expect(piecePosition(g, 'hero')).toBe(at(8, 3));
    expect(piecePosition(g, 'akari')).toBe(at(5, 0));
    expect(piecePosition(g, 'mio')).toBe(at(5, 6));
  });

  it('開けられるのは、開けたマスの隣だけ', () => {
    const next = openableNodes(GROWTH_MAP, fresh(), 'hero').map((n) => n.id).sort();
    expect(next).toEqual([at(8, 2), at(8, 4)].sort());
    expect(getOpenError(GROWTH_MAP, fresh(), HERO, at(4, 3))).not.toBeNull();
  });

  it('開けると記憶ポイントを払い、駒がそこへ進む。その隣も開けられるようになる', () => {
    const g = openNode(GROWTH_MAP, fresh(10), HERO, at(8, 2)); // ダブルスラッシュ
    expect(g.points).toBe(10 - GROWTH_COST.skill);
    expect(piecePosition(g, 'hero')).toBe(at(8, 2));
    expect(openableNodes(GROWTH_MAP, g, 'hero').map((n) => n.id)).toContain(at(7, 2));
  });

  it('記憶ポイントが足りないと開けられない', () => {
    expect(getOpenError(GROWTH_MAP, fresh(2), HERO, at(8, 2))).toBe('not enough memory points');
  });

  it('マスの開放はキャラごと', () => {
    const g = openNode(GROWTH_MAP, fresh(), HERO, at(8, 2));
    expect(openableNodes(GROWTH_MAP, g, 'akari').some((n) => n.id === at(8, 2))).toBe(false);
  });

  it('もう覚えている魔法・スキルのマスと、他のキャラの出発点は「通るだけ」の値段', () => {
    // 主人公はファイアを元から覚えている
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, at(8, 4))).toBe(GROWTH_COST.passThrough);
    expect(nodeCost(GROWTH_MAP, fresh(), MIO, at(8, 4))).toBe(GROWTH_COST.skill);
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, at(5, 0))).toBe(GROWTH_COST.passThrough);
  });

  it('能力値（小）は1pt、（大）は2pt', () => {
    const small = GROWTH_MAP.nodes.find((n) => n.kind === 'stat')!;
    const big = GROWTH_MAP.nodes.find((n) => n.kind === 'statBig')!;
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, small.id)).toBe(1);
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, big.id)).toBe(2);
  });
});

describe('成長の反映', () => {
  it('開けた能力値マスの分だけ能力値が上がる', () => {
    let g = fresh();
    g = openNode(GROWTH_MAP, g, AKARI, at(4, 0)); // 魔力+2
    g = openNode(GROWTH_MAP, g, AKARI, at(4, 1)); // MP+6
    const [, akari] = applyGrowth(GROWTH_MAP, g, PARTY, SKILLS);
    expect(akari.stats.mag).toBe(AKARI.stats.mag + 2);
    expect(akari.stats.mp).toBe(AKARI.stats.mp + 6);
    // 他のキャラは変わらない
    expect(applyGrowth(GROWTH_MAP, g, PARTY, SKILLS)[0].stats).toEqual(HERO.stats);
  });

  it('魔法・スキルのマスを開けると覚え、戦闘で使える魔法・スキルに加わる', () => {
    const g = openNode(GROWTH_MAP, fresh(), HERO, at(8, 2));
    const [hero] = applyGrowth(GROWTH_MAP, g, PARTY, SKILLS);
    expect(hero.skills.map((k) => k.id)).toEqual(['fire', 'breakSlash', 'doubleSlash']);
    expect(knownSkillIds(GROWTH_MAP, g, HERO)).toContain('doubleSlash');
  });

  it('もう覚えている魔法・スキルは重ねて覚えない', () => {
    const g = openNode(GROWTH_MAP, fresh(), HERO, at(8, 4)); // ファイア（元から覚えている）
    const [hero] = applyGrowth(GROWTH_MAP, g, PARTY, SKILLS);
    expect(hero.skills.filter((k) => k.id === 'fire')).toHaveLength(1);
  });

  it('元の定義は書き換えない', () => {
    const before = structuredClone(PARTY);
    applyGrowth(GROWTH_MAP, openNode(GROWTH_MAP, fresh(), HERO, at(8, 2)), PARTY, SKILLS);
    expect(PARTY).toEqual(before);
  });

  it('戦闘の記憶ポイント：基本 ＋ 壊した部位 × 2', () => {
    expect(battleReward(6, 0, 2)).toBe(6);
    expect(battleReward(0, 2, 2)).toBe(4);
  });

  it('マスの定義が引ける', () => {
    expect(findNode(GROWTH_MAP, at(0, 3))).toMatchObject({ kind: 'skill', skillId: 'fira' });
  });
});
