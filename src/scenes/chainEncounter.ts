import { battleReward, boardColorCells, capItems, gainSnaps, keepVitals, recordVictory, thinItems, type ChainEncounterResult, type Lineup } from '../core';
import { CHAIN_AREA_BATTLES, PART_BREAK_POINTS, snapNames, WEAPON_DATA, type CampaignBattle } from '../data';
import { isDebugEnabled } from '../debug/debugFlag';
import { browserStorage } from '../save/storage';
import type { BattleSceneData } from './BattleScene';
import { currentNaviData, lineupBase, run, saveRun } from './run';

// 段階159：新しい戦闘（並べてつなぐ戦闘）を探索から呼ぶ（docs/milestones/M3_battle_migration.md の段階C）。
// どの区画の戦闘を新しい戦闘にするかと、勝った時の報酬の受け取り（今の本番の戦闘と同じ物）

/** デバッグメニューの切り替え：探索の戦闘を全部、新しい戦闘にする（?debug=1 の時だけ効く。端末に覚える） */
const NEW_BATTLE_KEY = 'hourglass.debug.newBattle';

export function debugNewBattle(): boolean {
  return browserStorage().read(NEW_BATTLE_KEY) === '1';
}

export function setDebugNewBattle(on: boolean): void {
  browserStorage().write(NEW_BATTLE_KEY, on ? '1' : '0');
}

/** その区画の戦闘を、新しい戦闘で戦うか（区画ごとの切り替え CHAIN_AREA_BATTLES か、デバッグの切り替え） */
export function useNewBattle(battleId: string): boolean {
  if (CHAIN_AREA_BATTLES.includes(battleId)) return true;
  return isDebugEnabled(typeof window === 'undefined' ? '' : window.location.search) && debugNewBattle();
}

/** 探索の戦闘の始め方（新しい戦闘か、今の戦闘か） */
export function battleSceneFor(data: BattleSceneData): 'ChainBattle' | 'Battle' {
  return data.encounter && useNewBattle(data.encounter.battle) ? 'ChainBattle' : 'Battle';
}

export interface ChainWinReward {
  gained: number;
  koma: number;
  dropText: string;
  rare: boolean;
}

/**
 * 勝った時の報酬を受け取る（今の本番の戦闘の showEncounterEnd と同じ受け取り方。ポーチ・つながりゲージ・部位破壊は新しい戦闘にないので除く）：
 * 星の砂（狩りの割合）、残った HP・MP の持ち越し、素材（記憶の薄れの割合）と勝利のアイテム、武器の経験値と盤の色、ぬしのスナップ。最後にセーブ
 */
export function settleChainWin(enc: NonNullable<BattleSceneData['encounter']>, def: CampaignBattle, result: ChainEncounterResult, lineup: Lineup, seed: number): ChainWinReward {
  const rate = enc.rewardRate ?? 1;
  const gained = Math.ceil(battleReward(def.reward, 0, PART_BREAK_POINTS) * rate);
  const prize = enc.hunt ? undefined : def.item;
  run.growth = { ...run.growth, points: run.growth.points + gained };
  if (enc.hunt) {
    if (run.hunt) run.hunt = { ...run.hunt, state: keepVitals(run.hunt.state, result.vitals) };
  } else if (run.explore) run.explore = keepVitals(run.explore, result.vitals);
  const naviData = currentNaviData();
  const colorMembers = lineup.unlocks.navi ? lineupBase(lineup) : [];
  const keptIdx = new Set(thinItems(result.drops.map((_, i) => String(i)), enc.dropRate ?? 1, seed + 7));
  const drops = result.drops.filter((_, i) => keptIdx.has(String(i)));
  const faded = result.drops.length - drops.length;
  run.armory = recordVictory(run.armory, {
    actions: result.actionCounts,
    colorCells: Object.fromEntries(colorMembers.map((p) => [p.id, boardColorCells(naviData, run.navi, p.id)])),
    items: [...drops.map((d) => d.itemId), ...(prize ? [prize] : [])],
    expRate: rate,
  });
  const capped = capItems(WEAPON_DATA, run.armory);
  run.armory = capped.armory;
  const snaps = enc.hunt ? [] : (def.snaps ?? []);
  if (snaps.length > 0) run.album = gainSnaps(run.album, snaps);
  saveRun();
  const mark = (kind: string) => (kind === 'rare' ? '★' : kind === 'uncommon' ? '◆' : '');
  const counts = new Map<string, number>();
  for (const d of drops) {
    const name = `${mark(d.kind)}${WEAPON_DATA.items[d.itemId]?.name ?? d.itemId}`;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const list = [...counts].map(([name, n]) => `${name}${n > 1 ? `×${n}` : ''}`).join('、');
  const itemName = (id: string) => WEAPON_DATA.items[id]?.name ?? id;
  const dropText = `素材：${list || 'なし'}${faded > 0 ? `（記憶が薄れて、${faded}つは砂に戻った）` : ''}${prize ? `　アイテム：${itemName(prize)}` : ''}${capped.overflow.length ? `（いっぱいで入らなかった：${capped.overflow.map(itemName).join('、')}）` : ''}${snaps.length > 0 ? `\nスナップ：${snapNames(snaps)}` : ''}`;
  return { gained, koma: def.koma && !enc.hunt ? def.koma : 0, dropText, rare: drops.some((d) => d.kind === 'rare') };
}
