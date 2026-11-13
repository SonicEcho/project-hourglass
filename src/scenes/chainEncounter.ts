import { battleReward, boardColorCells, capItems, chainBossSnaps, chainEnemyDef, gainSnaps, keepVitals, recordLibraryBattle, recordLibraryFinds, recordVictory, thinItems, type ChainEncounterResult, type ChainState, type Element, type Lineup } from '../core';
import { AREAS, CHAIN_AREA_BATTLES, CHAIN_AREA_SETUPS, CHAIN_SNAPS, PART_BREAK_POINTS, snapNames, WEAPON_DATA, type CampaignBattle } from '../data';
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

/**
 * 今いる区画が、新しい戦闘の区画か（段階163。アルバムの画面で、どちらのアルバムを開くか）。
 * 探索の外（拠点など）や、区画の戦闘が今の戦闘のままの区画では false
 */
export function chainAlbumActive(): boolean {
  const area = run.explore ? AREAS[run.explore.area] : undefined;
  if (!area) return false;
  const battles = [...area.enemies.map((e) => e.battle), area.boss?.battle].filter((x): x is string => !!x);
  return battles.some((b) => CHAIN_AREA_BATTLES.includes(b));
}

/** 探索の戦闘の始め方（新しい戦闘か、今の戦闘か） */
export function battleSceneFor(data: BattleSceneData): 'ChainBattle' | 'Battle' {
  return data.encounter && useNewBattle(data.encounter.battle) ? 'ChainBattle' : 'Battle';
}

/**
 * 見つけたコンボ（初めてそろうと覚える）。探索の戦闘はライブラリの記録（セーブ。段階167）に、
 * 試しの戦闘は今までどおり端末に覚える
 */
const COMBO_KEY = 'hourglass.chainTrial.combos';
const KNOWN_KEY = 'hourglass.chainTrial.knownWeak';

function readJson(key: string): unknown {
  try {
    const raw = browserStorage().read(key);
    return raw ? (JSON.parse(raw) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

function writeJson(key: string, v: unknown): void {
  try {
    browserStorage().write(key, JSON.stringify(v));
  } catch {
    // 覚えられなくても遊べる
  }
}

export function foundChainCombos(encounter: boolean): string[] {
  if (encounter) return [...run.library.combos];
  const v = readJson(COMBO_KEY);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export function addFoundChainCombo(encounter: boolean, id: string): void {
  if (encounter) {
    run.library = recordLibraryFinds(run.library, { combos: [id] });
    return;
  }
  const list = foundChainCombos(false);
  if (!list.includes(id)) writeJson(COMBO_KEY, [...list, id]);
}

/** 分かった弱点（探索の戦闘はライブラリ、試しの戦闘は端末） */
export function knownChainWeak(encounter: boolean): Record<string, Element[]> {
  if (encounter) return Object.fromEntries(Object.entries(run.library.weak).map(([k, v]) => [k, [...v]]));
  const v = readJson(KNOWN_KEY);
  const out: Record<string, Element[]> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, list] of Object.entries(v as Record<string, unknown>)) if (Array.isArray(list)) out[k] = list.filter((x): x is Element => typeof x === 'string');
  }
  return out;
}

export function keepChainWeak(encounter: boolean, known: Record<string, Element[]>): void {
  if (encounter) run.library = recordLibraryBattle(run.library, { met: [], defeated: [], weak: known });
  else writeJson(KNOWN_KEY, known);
}

/**
 * 探索の戦闘が終わった時の、ライブラリの記録（段階167。勝ち負けどちらも）：会った敵と倒した敵（部位は数えない。本体の項目に部位を載せる）。保存する
 */
export function recordChainBattle(s: ChainState): void {
  const body = (defId: string) => !chainEnemyDef(s, defId)?.part;
  const met = s.def.enemies.filter((e) => !e.part).map((e) => e.id);
  const defeated = s.enemies.filter((e) => e.hp <= 0 && !e.gone && body(e.defId)).map((e) => e.defId);
  // 分かれた敵の破片などで、会った数より多く数えない
  const capped: string[] = [];
  for (const id of defeated) if (capped.filter((x) => x === id).length < met.filter((x) => x === id).length) capped.push(id);
  run.library = recordLibraryBattle(run.library, { met, defeated: capped, weak: s.known });
  saveRun();
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
  // スナップ：区画を作り直した戦闘は、新しい戦闘のスナップを新しいアルバムへ（段階163）。まだの戦闘は今のアルバムへ
  const setup = CHAIN_AREA_SETUPS[def.id];
  // ぬしのスナップ（段階180：早く倒した時＝★3 だけ。部位を壊すと部位の素材）
  const chainSnaps = enc.hunt || !setup ? [] : chainBossSnaps(result, setup.snaps);
  const snaps = enc.hunt || setup ? [] : (def.snaps ?? []);
  if (snaps.length > 0) run.album = gainSnaps(run.album, snaps);
  // 早く勝った時の敵のスナップ（段階165。狩りでも）
  if (result.snap) chainSnaps.push(result.snap);
  if (chainSnaps.length > 0) run.chainAlbum = gainSnaps(run.chainAlbum, chainSnaps);
  // ライブラリ（段階167）：手に入れたスナップと素材
  run.library = recordLibraryFinds(run.library, { snaps: chainSnaps, items: [...drops.map((d) => d.itemId), ...(prize ? [prize] : [])] });
  saveRun();
  const mark = (kind: string) => (kind === 'rare' ? '★' : kind === 'uncommon' ? '◆' : '');
  const counts = new Map<string, number>();
  for (const d of drops) {
    const name = `${mark(d.kind)}${WEAPON_DATA.items[d.itemId]?.name ?? d.itemId}`;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const list = [...counts].map(([name, n]) => `${name}${n > 1 ? `×${n}` : ''}`).join('、');
  const itemName = (id: string) => WEAPON_DATA.items[id]?.name ?? id;
  const dropText = `素材：${list || 'なし'}${faded > 0 ? `（記憶が薄れて、${faded}つは砂に戻った）` : ''}${prize ? `　アイテム：${itemName(prize)}` : ''}${capped.overflow.length ? `（いっぱいで入らなかった：${capped.overflow.map(itemName).join('、')}）` : ''}${snaps.length > 0 ? `\nスナップ：${snapNames(snaps)}` : ''}${chainSnaps.length > 0 ? `\nスナップ：${chainSnaps.map((id) => CHAIN_SNAPS[id]?.name ?? id).join('、')}` : ''}`;
  return { gained, koma: def.koma && !enc.hunt ? def.koma : 0, dropText, rare: drops.some((d) => d.kind === 'rare') };
}
