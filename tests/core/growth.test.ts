import { describe, expect, it } from 'vitest';
import {
  applyGrowth,
  checkGrowthMap,
  renameNode,
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
import { AKARI, CAMPAIGN, GROWTH_COST, GROWTH_FRONTIER, GROWTH_MAP, HERO, MIO, PARTY, SKILLS, START_MEMORY_POINTS, STAT_STEP } from '../../src/data';

const ids = PARTY.map((c) => c.id);
const fresh = (points = 99): GrowthState => createGrowth(GROWTH_MAP, ids, points);

describe('星図のデータ', () => {
  it('本物の星座の48個の星（段階56）と、ヘルクレス座の11個（段階91a）、ケフェウス座の9個（段階140a）。どの星も星図の中にあり、5人の出発点がある。書き間違いがない', () => {
    expect(GROWTH_MAP.nodes.length).toBe(68);
    for (const n of GROWTH_MAP.nodes) {
      expect(n.x).toBeGreaterThan(0);
      expect(n.y).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(GROWTH_MAP.width);
      expect(n.y).toBeLessThan(GROWTH_MAP.height);
    }
    expect(checkGrowthMap(GROWTH_MAP, { minGap: 34, frontier: GROWTH_FRONTIER.map((f) => f.node) })).toEqual([]);
    // 効果の数は格子の星図と同じ（わし座ι だけ、防1 → 防2 にした）
    const count = (k: string) => GROWTH_MAP.nodes.filter((n) => n.kind === k).length;
    // ヘルクレス座：小夜子の出発点・ダブルスラッシュ・小4・大5。ケフェウス座：早瀬の出発点・サンダラ・小3・大4
    expect([count('start'), count('skill'), count('stat'), count('statBig')]).toEqual([5, 12, 35, 16]);
    expect(GROWTH_MAP.nodes.filter((n) => n.chapter === 2)).toHaveLength(17);
    expect(GROWTH_MAP.nodes.filter((n) => n.chapter === 3)).toHaveLength(11);
    expect(GROWTH_MAP.nodes.filter((n) => n.chapter === 4)).toHaveLength(9);
    expect(GROWTH_MAP.nodes.filter((n) => n.kind === 'start').map((n) => (n.kind === 'start' ? n.owner : ''))).toEqual(
      expect.arrayContaining(['hero', 'akari', 'mio', 'sayoko', 'hayase']),
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

describe('星図', () => {
  it('始めは各キャラが自分の出発点だけ開いていて、星の砂を持っている', () => {
    const g = createGrowth(GROWTH_MAP, ids, START_MEMORY_POINTS);
    expect(g.points).toBe(START_MEMORY_POINTS);
    expect(piecePosition(g, 'hero')).toBe('altair');
    expect(piecePosition(g, 'akari')).toBe('vega');
    expect(piecePosition(g, 'mio')).toBe('sualocin');
  });

  it('開けられるのは、開けたマスの隣だけ', () => {
    const next = openableNodes(GROWTH_MAP, fresh(), 'hero').map((n) => n.id).sort();
    expect(next).toEqual(['tarazed', 'alshain', 'muAql'].sort());
    expect(getOpenError(GROWTH_MAP, fresh(), HERO, 'thetaAql')).not.toBeNull();
  });

  it('開けると星の砂を払い、駒がそこへ進む。その隣も開けられるようになる', () => {
    const g = openNode(GROWTH_MAP, fresh(10), HERO, 'tarazed'); // ダブルスラッシュ
    expect(g.points).toBe(10 - GROWTH_COST.skill);
    expect(piecePosition(g, 'hero')).toBe('tarazed');
    expect(openableNodes(GROWTH_MAP, g, 'hero').map((n) => n.id)).toContain('betaSge');
  });

  it('星の砂が足りないと開けられない', () => {
    expect(getOpenError(GROWTH_MAP, fresh(2), HERO, 'tarazed')).toBe('not enough memory points');
  });

  it('マスの開放はキャラごと', () => {
    const g = openNode(GROWTH_MAP, fresh(), HERO, 'tarazed');
    expect(openableNodes(GROWTH_MAP, g, 'akari').some((n) => n.id === 'tarazed')).toBe(false);
  });

  it('もう覚えている魔法・スキルのマスと、他のキャラの出発点は「通るだけ」の値段', () => {
    // ハルトはファイアを元から覚えている
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, 'alshain')).toBe(GROWTH_COST.passThrough);
    expect(nodeCost(GROWTH_MAP, fresh(), MIO, 'alshain')).toBe(GROWTH_COST.skill);
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, 'vega')).toBe(GROWTH_COST.passThrough);
  });

  it('能力値（大）は（小）の2倍の値段', () => {
    const small = GROWTH_MAP.nodes.find((n) => n.kind === 'stat')!;
    const big = GROWTH_MAP.nodes.find((n) => n.kind === 'statBig')!;
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, small.id)).toBe(GROWTH_COST.stat);
    expect(nodeCost(GROWTH_MAP, fresh(), HERO, big.id)).toBe(GROWTH_COST.statBig);
    expect(GROWTH_COST.statBig).toBe(GROWTH_COST.stat * 2);
  });
});

describe('成長の反映', () => {
  it('開けた能力値マスの分だけ能力値が上がる', () => {
    let g = fresh();
    g = openNode(GROWTH_MAP, g, AKARI, 'zetaLyr'); // 魔力（小）
    g = openNode(GROWTH_MAP, g, AKARI, 'deltaLyr'); // MP（小）
    const [, akari] = applyGrowth(GROWTH_MAP, g, PARTY, SKILLS);
    expect(akari.stats.mag).toBe(AKARI.stats.mag + STAT_STEP.mag);
    expect(akari.stats.mp).toBe(AKARI.stats.mp + STAT_STEP.mp);
    // 他のキャラは変わらない
    expect(applyGrowth(GROWTH_MAP, g, PARTY, SKILLS)[0].stats).toEqual(HERO.stats);
  });

  it('魔法・スキルのマスを開けると覚え、戦闘で使える魔法・スキルに加わる', () => {
    const g = openNode(GROWTH_MAP, fresh(), HERO, 'tarazed');
    const [hero] = applyGrowth(GROWTH_MAP, g, PARTY, SKILLS);
    expect(hero.skills.map((k) => k.id)).toEqual(['fire', 'breakSlash', 'doubleSlash']);
    expect(knownSkillIds(GROWTH_MAP, g, HERO)).toContain('doubleSlash');
  });

  it('もう覚えている魔法・スキルは重ねて覚えない', () => {
    const g = openNode(GROWTH_MAP, fresh(), HERO, 'alshain'); // ファイア（元から覚えている）
    const [hero] = applyGrowth(GROWTH_MAP, g, PARTY, SKILLS);
    expect(hero.skills.filter((k) => k.id === 'fire')).toHaveLength(1);
  });

  it('元の定義は書き換えない', () => {
    const before = structuredClone(PARTY);
    applyGrowth(GROWTH_MAP, openNode(GROWTH_MAP, fresh(), HERO, 'tarazed'), PARTY, SKILLS);
    expect(PARTY).toEqual(before);
  });

  it('戦闘の星の砂：基本 ＋ 壊した部位 × 2', () => {
    expect(battleReward(6, 0, 2)).toBe(6);
    expect(battleReward(0, 2, 2)).toBe(4);
  });

  it('マスの定義が引ける', () => {
    expect(findNode(GROWTH_MAP, 'deneb')).toMatchObject({ kind: 'skill', skillId: 'fira', name: 'デネブ', con: 'cyg', chapter: 2 });
  });
});

describe('星図の書き間違いの検査と、前の id の付け替え（段階56）', () => {
  const tiny = {
    width: 400,
    height: 400,
    costs: GROWTH_COST,
    nodes: [
      { id: 'a', x: 50, y: 50, kind: 'start' as const, owner: 'hero' },
      { id: 'b', x: 120, y: 50, kind: 'stat' as const, stat: 'atk' as const, amount: 2 },
      { id: 'c', x: 190, y: 50, kind: 'stat' as const, stat: 'atk' as const, amount: 2 },
      { id: 'd', x: 200, y: 60, chapter: 2, kind: 'skill' as const, skillId: 'fire' },
    ],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['c', 'x'], ['a', 'b']] as [string, string][],
    renamed: { n8_3: 'a' },
  };

  it('知らない星への道・同じ道・近すぎる星・行き止まりの小さな能力値を見つける', () => {
    expect(checkGrowthMap(tiny, { minGap: 34, frontier: [] })).toEqual([
      '知らない星への道：c-x',
      '同じ道が2本：a-b',
      '近すぎる星：c-d',
    ]);
    // c-d の道がないと、d は行き止まりではないが、どこからも行けない。b-c がなければ c は行けず、b は小さな能力値の行き止まり
    const cut = { ...tiny, edges: [['a', 'b'], ['c', 'd']] as [string, string][], nodes: tiny.nodes.map((n) => (n.id === 'd' ? { ...n, x: 300, y: 300 } : n)) };
    expect(checkGrowthMap(cut, { minGap: 34, frontier: [] })).toEqual([
      '0章で、出発点から行けない星：c',
      '2章で、出発点から行けない星：c',
      '2章で、出発点から行けない星：d',
      '行き止まりの星が小さな能力値：b',
      '行き止まりの星が小さな能力値：c',
    ]);
    // 将来の星座へつなぐ場所は、行き止まりでも小さな能力値でよい
    expect(checkGrowthMap(cut, { minGap: 34, frontier: ['b', 'c'] }).filter((e) => e.startsWith('行き止まり'))).toEqual([]);
  });

  it('前の id は付け替える。知らない id はそのまま', () => {
    expect(renameNode(tiny, 'n8_3')).toBe('a');
    expect(renameNode(tiny, 'zzz')).toBe('zzz');
    // 本物の星図：格子の星図の48マスは、全部どれかの星に付け替わる（出発点は出発点に）
    expect(Object.keys(GROWTH_MAP.renamed ?? {})).toHaveLength(48);
    expect(renameNode(GROWTH_MAP, 'n8_3')).toBe('altair');
    expect(renameNode(GROWTH_MAP, 'n5_0')).toBe('vega');
    expect(renameNode(GROWTH_MAP, 'n5_6')).toBe('sualocin');
  });
});
