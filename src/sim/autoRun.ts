import type { ArmoryState, CharacterDef, GrowthState, NaviData, NaviState, Placement, Rotation } from '../core';
import {
  applyGrowth,
  applyNavi,
  applyWeapons,
  battleReward,
  boardColorCells,
  claimRewardParts,
  createArmory,
  createBattle,
  createGrowth,
  createNavi,
  evolveWeapon,
  feedFragment,
  findBugs,
  fragmentItem,
  getBattleResult,
  getEvolveError,
  getOpenError,
  getPlaceError,
  isPartActive,
  naviDataWithWeapons,
  openableNodes,
  openNode,
  placePart,
  recordVictory,
  removePart,
} from '../core';
import {
  CAMPAIGN,
  createCampaignSetup,
  GROWTH_MAP,
  NAVI_DATA,
  NAVI_REWARD_CANDIDATES,
  NAVI_REWARD_PICKS,
  PART_BREAK_POINTS,
  PARTY,
  SKILLS,
  START_MEMORY_POINTS,
  START_NAVI_PARTS,
  WEAPON_DATA,
} from '../data';
import { autoPlay, lcg } from './autoBattle';

// 周回の自動対戦（段階12）。タイトルから5戦目のボスまでを、決まった方針で自動で遊ぶ。
// 方針は docs/SPEC.md の「自動対戦の測定をスクリプトに（段階12）」の表のとおり

/** 負けた時に、同じ戦闘をやり直す回数の上限 */
export const MAX_ATTEMPTS = 20;

/** 1つの戦闘の結果 */
export interface StageRecord {
  /** 勝つまでに戦った回数（勝てなかった時は MAX_ATTEMPTS） */
  attempts: number;
  won: boolean;
  /** 勝った戦闘のラウンド数 */
  rounds: number | null;
}

export interface RunRecord {
  seed: number;
  /** 戦った戦闘の結果（勝ち切れなかった戦闘で終わる） */
  stages: StageRecord[];
  cleared: boolean;
}

interface AutoRunState {
  growth: GrowthState;
  navi: NaviState;
  armory: ArmoryState;
}

/** 周回を1回、自動で遊ぶ。同じシードなら同じ結果になる */
export function autoRun(seed: number): RunRecord {
  const pick = lcg((seed * 7919 + 1) % 2147483648);
  const st: AutoRunState = {
    growth: createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS),
    navi: createNavi(START_NAVI_PARTS),
    armory: createArmory(WEAPON_DATA),
  };
  const stages: StageRecord[] = [];
  for (let i = 0; i < CAMPAIGN.length; i++) {
    spendPoints(st, pick);
    useArmory(st, pick);
    st.navi = arrangeNavi(naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, st.armory), st.navi);
    const allies = party(st);
    let record: StageRecord = { attempts: MAX_ATTEMPTS, won: false, rounds: null };
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // 1回目は画面と同じ「周回のシード＋戦闘の番号」。やり直すたびに別のシード
      const battleSeed = (seed + i + attempt * 100) >>> 0;
      const s = autoPlay(createBattle(createCampaignSetup(i, battleSeed, allies)), battleSeed);
      if (s.outcome !== 'victory') continue;
      record = { attempts: attempt + 1, won: true, rounds: s.round };
      receiveVictory(st, i, getBattleResult(s));
      break;
    }
    stages.push(record);
    if (!record.won) return { seed, stages, cleared: false };
  }
  return { seed, stages, cleared: true };
}

function party(st: AutoRunState): CharacterDef[] {
  const grown = applyGrowth(GROWTH_MAP, st.growth, PARTY, SKILLS);
  return applyWeapons(WEAPON_DATA, st.armory, applyNavi(naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, st.armory), st.navi, grown));
}

/** 星図：でたらめなキャラの、開けられるでたらめなマスに、払えなくなるまで星の砂を使う */
function spendPoints(st: AutoRunState, pick: (n: number) => number): void {
  for (let guard = 0; guard < 200; guard++) {
    const options = PARTY.flatMap((c) =>
      openableNodes(GROWTH_MAP, st.growth, c.id)
        .filter((n) => getOpenError(GROWTH_MAP, st.growth, c, n.id) === null)
        .map((n) => ({ c, id: n.id })),
    );
    if (options.length === 0) return;
    const o = options[pick(options.length)];
    st.growth = openNode(GROWTH_MAP, st.growth, o.c, o.id);
  }
}

/** 武器：素材・アイテムをすべて時分解し、記憶の欠片をでたらめな武器に吸わせ、進化できれば最初の進化先へ */
function useArmory(st: AutoRunState, pick: (n: number) => number): void {
  for (const [id, n] of Object.entries(st.armory.items)) for (let k = 0; k < n; k++) st.armory = fragmentItem(WEAPON_DATA, st.armory, id);
  const owners = Object.keys(st.armory.weapons);
  for (const [id, n] of Object.entries(st.armory.fragments)) {
    for (let k = 0; k < n; k++) st.armory = feedFragment(WEAPON_DATA, st.armory, owners[pick(owners.length)], id);
  }
  for (const owner of owners) {
    const w = st.armory.weapons[owner];
    if (w.evolvedTo) continue;
    const evo = WEAPON_DATA.weapons[w.defId].evolutions.find((e) => getEvolveError(WEAPON_DATA, st.armory, owner, e.id) === null);
    if (evo) st.armory = evolveWeapon(WEAPON_DATA, st.armory, owner, evo.id);
  }
}

/**
 * ムーブメント：いったん全部外し、大きいギアから順に、キャラを順番に回してはめる。
 * 効果ギアはブリッジに乗る場所を優先し、狂いを作る場所には置かない。どこにも置けないギアは外したまま
 */
export function arrangeNavi(data: NaviData, navi0: NaviState): NaviState {
  let navi: NaviState = navi0.parts.reduce((n, p) => removePart(n, p.uid), navi0);
  const order = [...navi.parts].sort((a, b) => data.parts[b.partId].cells.length - data.parts[a.partId].cells.length || a.uid - b.uid);
  const chars = PARTY.map((c) => c.id);
  let turn = 0;
  for (const part of order) {
    const isEffect = data.parts[part.partId].kind === 'effect';
    for (let k = 0; k < chars.length; k++) {
      const charId = chars[(turn + k) % chars.length];
      const spot = bestSpot(data, navi, part.uid, charId, isEffect);
      if (!spot) continue;
      navi = placePart(data, navi, part.uid, spot);
      turn = (turn + k + 1) % chars.length;
      break;
    }
  }
  return navi;
}

function bestSpot(data: NaviData, navi: NaviState, uid: number, charId: string, isEffect: boolean): Placement | null {
  const board = data.boards[charId];
  let fallback: Placement | null = null;
  for (const rotation of [0, 1, 2, 3] as Rotation[]) {
    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const p: Placement = { charId, col, row, rotation };
        if (getPlaceError(data, navi, uid, p)) continue;
        const next = placePart(data, navi, uid, p);
        if (findBugs(data, next, charId).length > 0) continue;
        if (!isEffect) return p;
        if (isPartActive(data, next.parts.find((x) => x.uid === uid)!)) return p;
        fallback ??= p;
      }
    }
  }
  return fallback;
}

/** 勝った時の受け取り（画面の BattleScene と同じ順番） */
function receiveVictory(st: AutoRunState, stage: number, result: ReturnType<typeof getBattleResult>): void {
  const def = CAMPAIGN[stage];
  if (def.boss) return;
  st.growth = { ...st.growth, points: st.growth.points + battleReward(def.reward, result.brokenParts.length, PART_BREAK_POINTS) };
  const naviData = naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, st.armory);
  st.armory = recordVictory(st.armory, {
    actions: result.actionCounts,
    colorCells: Object.fromEntries(PARTY.map((p) => [p.id, boardColorCells(naviData, st.navi, p.id)])),
    items: [...result.drops, ...(def.item ? [def.item] : [])],
  });
  const candidates = NAVI_REWARD_CANDIDATES[stage];
  if (candidates) {
    const n = Math.min(NAVI_REWARD_PICKS, candidates.length);
    st.navi = claimRewardParts(st.navi, candidates, Array.from({ length: n }, (_, k) => k), NAVI_REWARD_PICKS);
  }
}

