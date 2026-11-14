import { describe, expect, it } from 'vitest';
import type { NaviState, Placement } from '../../src/core';
import {
  applyNavi,
  boardPassives,
  claimRewardParts,
  createNavi,
  findBugs,
  getPlaceError,
  isPartActive,
  placePart,
  placedCells,
  removePart,
  rotateCells,
} from '../../src/core';
import {
  BUG_HP_RATE,
  NAVI_BOARDS,
  NAVI_DATA,
  NAVI_PARTS,
  NAVI_REWARD_CANDIDATES,
  NAVI_REWARD_PICKS,
  PARTY,
  START_NAVI_PARTS,
} from '../../src/data';

const at = (charId: string, col: number, row: number, rotation: Placement['rotation'] = 0): Placement => ({ charId, col, row, rotation });

/** 指定したギアを持った状態（uid は並べた順に 0, 1, 2…） */
const owning = (...ids: string[]): NaviState => createNavi(ids);

describe('ムーブメント：形と回転', () => {
  it('時計回りに90度ずつ回し、左上を [0, 0] にそろえる', () => {
    expect(rotateCells([[0, 0], [1, 0], [2, 0]], 1)).toEqual([[0, 0], [0, 1], [0, 2]]);
    // L字：[0,0],[0,1],[1,1] を90度回すと ┌ の形
    expect(rotateCells([[0, 0], [0, 1], [1, 1]], 1)).toEqual([[1, 0], [0, 0], [0, 1]]);
  });

  it('4回回すと元の形に戻る', () => {
    for (const def of Object.values(NAVI_PARTS)) {
      const twice = rotateCells(rotateCells(def.cells, 2), 2);
      expect(new Set(twice.map(String))).toEqual(new Set(def.cells.map(String)));
    }
  });

  it('盤の上で占めるマスは、置いた位置の分ずれる', () => {
    expect(placedCells(NAVI_PARTS.powerMemory, { col: 1, row: 2, rotation: 0 })).toEqual([[1, 2], [2, 2]]);
  });
});

describe('ムーブメント：置く・外す', () => {
  it('盤の外や欠けたマスにははみ出せない', () => {
    const n = owning('powerMemory');
    expect(getPlaceError(NAVI_DATA, n, 0, at('hero', 3, 0))).toBe('out of the board');
    // みおの盤は四隅が欠けている
    expect(getPlaceError(NAVI_DATA, n, 0, at('mio', 0, 0))).toBe('out of the board');
    expect(getPlaceError(NAVI_DATA, n, 0, at('mio', 1, 0))).toBeNull();
  });

  it('他のギアと重ねられない', () => {
    let n = owning('powerMemory', 'magicMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    expect(getPlaceError(NAVI_DATA, n, 1, at('hero', 1, 0))).toBe('overlaps another part');
    expect(getPlaceError(NAVI_DATA, n, 1, at('hero', 2, 0))).toBeNull();
    // 別のキャラの盤なら同じ位置でも置ける
    expect(getPlaceError(NAVI_DATA, n, 1, at('akari', 0, 0))).toBeNull();
  });

  it('はまっているギアを動かす時は、自分の今の位置は空いているものとして扱う', () => {
    let n = owning('powerMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    expect(getPlaceError(NAVI_DATA, n, 0, at('hero', 1, 0))).toBeNull();
  });

  it('1つのギアは1人の盤にしかはまらない（はめ直すと移る）', () => {
    let n = owning('hpMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = placePart(NAVI_DATA, n, 0, at('akari', 2, 1));
    expect(n.parts[0].placement).toEqual(at('akari', 2, 1));
  });

  it('外すと、どの盤にもはまっていない状態に戻る', () => {
    let n = owning('hpMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = removePart(n, 0);
    expect(n.parts[0].placement).toBeNull();
  });

  it('元の状態は書き換えない', () => {
    const n = owning('hpMemory');
    placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    expect(n.parts[0].placement).toBeNull();
  });
});

describe('ムーブメント：ブリッジ', () => {
  it('効果ギアは、ブリッジに1マス以上乗っている時だけ効く', () => {
    let n = owning('breaker', 'firstAid');
    n = placePart(NAVI_DATA, n, 0, at('hero', 1, 0, 1)); // 縦に置いて、2列目（ブリッジ）に乗る
    n = placePart(NAVI_DATA, n, 1, at('hero', 2, 3)); // 右下（ブリッジの外）
    expect(isPartActive(NAVI_DATA, n.parts[0])).toBe(true);
    expect(isPartActive(NAVI_DATA, n.parts[1])).toBe(false);
    expect(boardPassives(NAVI_DATA, n, 'hero')).toEqual([NAVI_PARTS.breaker.effect]);
  });

  it('能力値ギアは、どこに置いても効く', () => {
    let n = owning('powerMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 3));
    expect(isPartActive(NAVI_DATA, n.parts[0])).toBe(true);
    const [hero] = applyNavi(NAVI_DATA, n, [PARTY[0]]);
    expect(hero.stats.atk).toBe(PARTY[0].stats.atk + 3);
  });

  it('はまっていないギアは効かない', () => {
    const n = owning('powerMemory', 'breaker');
    const [hero] = applyNavi(NAVI_DATA, n, [PARTY[0]]);
    expect(hero.stats).toEqual(PARTY[0].stats);
    // 段階200：効果ギアは新しい戦闘の特性（traits）に入る。はまっていなければ何も入らない
    expect(hero.traits).toBeUndefined();
  });
});

describe('ムーブメント：狂い', () => {
  it('同じ色の別々のギアが辺で接すると、狂いになる', () => {
    let n = owning('hpMemory', 'powerMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = placePart(NAVI_DATA, n, 1, at('hero', 1, 0));
    expect(findBugs(NAVI_DATA, n, 'hero')).toEqual([[0, 1]]);
    expect(boardPassives(NAVI_DATA, n, 'hero')).toEqual([{ kind: 'bug', rate: BUG_HP_RATE }]);
  });

  it('斜めに接しているだけなら狂いにならない', () => {
    let n = owning('hpMemory', 'powerMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = placePart(NAVI_DATA, n, 1, at('hero', 1, 1));
    expect(findBugs(NAVI_DATA, n, 'hero')).toEqual([]);
  });

  it('違う色なら接していても狂いにならない', () => {
    let n = owning('hpMemory', 'magicMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = placePart(NAVI_DATA, n, 1, at('hero', 1, 0));
    expect(findBugs(NAVI_DATA, n, 'hero')).toEqual([]);
  });

  it('組ごとに1つ数える', () => {
    let n = owning('hpMemory', 'hpMemory', 'hpMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = placePart(NAVI_DATA, n, 1, at('hero', 1, 0));
    n = placePart(NAVI_DATA, n, 2, at('hero', 2, 0));
    expect(findBugs(NAVI_DATA, n, 'hero')).toHaveLength(2);
    const [hero] = applyNavi(NAVI_DATA, n, [PARTY[0]]);
    expect(hero.traits?.filter((p) => p.kind === 'bug')).toHaveLength(2);
  });

  it('別のキャラの盤のギアとは狂いにならない', () => {
    let n = owning('hpMemory', 'powerMemory');
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = placePart(NAVI_DATA, n, 1, at('akari', 1, 0));
    expect(findBugs(NAVI_DATA, n, 'hero')).toEqual([]);
    expect(findBugs(NAVI_DATA, n, 'akari')).toEqual([]);
  });
});

describe('ムーブメント：ギアの入手', () => {
  it('周回の始めのギアと、勝利の報酬の候補は、すべて定義がある', () => {
    for (const id of [...START_NAVI_PARTS, ...NAVI_REWARD_CANDIDATES.flat()]) expect(NAVI_PARTS[id]).toBeDefined();
    expect(NAVI_REWARD_CANDIDATES).toHaveLength(4);
  });

  it('候補から決まった数を選んで受け取る', () => {
    const n = claimRewardParts(createNavi(START_NAVI_PARTS), NAVI_REWARD_CANDIDATES[0], [0, 2], NAVI_REWARD_PICKS);
    expect(n.parts.map((p) => p.partId).slice(-2)).toEqual(['iceBoost', 'mpMemory']);
    expect(new Set(n.parts.map((p) => p.uid)).size).toBe(n.parts.length);
  });

  it('数が違う・同じ候補を2回・ない候補は選べない', () => {
    const n = createNavi([]);
    const c = NAVI_REWARD_CANDIDATES[0];
    expect(() => claimRewardParts(n, c, [0], 2)).toThrow();
    expect(() => claimRewardParts(n, c, [1, 1], 2)).toThrow();
    expect(() => claimRewardParts(n, c, [0, 5], 2)).toThrow();
  });

  it('各キャラの盤のブリッジには、置けるマスがある', () => {
    for (const board of Object.values(NAVI_BOARDS)) {
      expect(board.cells.some(([c]) => c === board.commandCol)).toBe(true);
    }
    expect(Object.keys(NAVI_BOARDS).sort()).toEqual(PARTY.map((c) => c.id).sort());
  });
});

describe('ギアの入れ替え（段階200）', () => {
  it('絆のギアは銀で、狂いを起こさず、ブリッジに乗っている時だけ3人のコンボを開く', async () => {
    const { activeBondLinks } = await import('../../src/core');
    expect(NAVI_DATA.parts.fairBond).toMatchObject({ kind: 'bond', color: 'silver', links: ['threeTimes'] });
    let n = owning('fairBond', 'hpMemory');
    expect(activeBondLinks(NAVI_DATA, n, ['hero', 'akari', 'mio'])).toEqual([]);
    // ブリッジ（列1）に乗せる。隣に置いた1マスのギアとは狂いにならない
    n = placePart(NAVI_DATA, n, 0, at('akari', 0, 0));
    n = placePart(NAVI_DATA, n, 1, at('akari', 2, 0));
    expect(activeBondLinks(NAVI_DATA, n, ['hero', 'akari', 'mio'])).toEqual(['threeTimes']);
    expect(findBugs(NAVI_DATA, n, 'akari')).toEqual([]);
    // 並びにその仲間がいなければ開かない
    expect(activeBondLinks(NAVI_DATA, n, ['hero', 'mio'])).toEqual([]);
  });

  it('どのギアも、どこかで手に入る（周回の始め・宝箱・会話・出来事・落とし物・狩りの採取の場所）', async () => {
    const { AREAS, LOST_ITEMS, RETURN_VISITS, START_NAVI_PARTS } = await import('../../src/data');
    const got = new Set<string>(START_NAVI_PARTS);
    for (const a of Object.values(AREAS)) {
      if (a.id.startsWith('trial')) continue;
      for (const c of a.chests) for (const g of c.gears ?? []) got.add(g);
      for (const t of a.triggers) for (const g of t.gears ?? []) got.add(g);
      // 記憶をたどる時（狩り）の採取の場所の、初めての1回だけのギア
      for (const g of a.hunt?.gathers ?? []) for (const id of g.gears ?? []) got.add(id);
    }
    for (const v of RETURN_VISITS) for (const g of v.gears ?? []) got.add(g);
    for (const l of LOST_ITEMS) for (const g of l.reward.gears ?? []) got.add(g);
    for (const g of got) expect(NAVI_DATA.parts[g], g).toBeDefined();
    expect(Object.keys(NAVI_DATA.parts).filter((id) => !got.has(id))).toEqual([]);
    expect(Object.keys(NAVI_DATA.parts)).toHaveLength(40);
  });
});

describe('狩りの採取の場所のギア（段階200）', () => {
  it('初めて開ける時だけギアが入る（手に入れたら物語の変数に覚える）', async () => {
    const { huntArea, huntGearKey } = await import('../../src/core');
    const { AREAS } = await import('../../src/data');
    const a31 = AREAS.a31 as Parameters<typeof huntArea>[0];
    const first = huntArea(a31, 1).chests.find((c) => c.id === 'a31_gather_paddy')!;
    expect(first.gears).toEqual(['timeKeeper']);
    const again = huntArea(a31, 2, { [huntGearKey('a31_gather_paddy')]: '1' }).chests.find((c) => c.id === 'a31_gather_paddy')!;
    expect(again.gears).toBeUndefined();
    expect(again.items.length).toBeGreaterThan(0);
  });
});
