import type { ChainEnemyDef, ChainTrait } from '../core/chain';
import { CHAIN_AREA_SETUPS } from './chainAreas';
import { CHAIN_TRAIT_TEXT } from './chainTrial';
import type { NaviPartId } from './navi';
import { AREAS } from './areas';

// 段階201（段取りの段階G5c）：ギアの付け替えを活かす仕組み（docs/milestones/M3_catalog.md の 18-3）。
// 敵の性質 → 効くギア（対策のギア。18-6）。区画の予告・負けた時の手がかり・ライブラリ・ギアの説明が使う

/** 性質に効くギア（対策のギア）。1つの性質に1つ以上 */
export const GEAR_COUNTERS: Partial<Record<ChainTrait, NaviPartId[]>> = {
  shell: ['shellCrack'],
  hard: ['armorPierce'],
  shield: ['wideShot'],
  interrupt: ['wideShot'],
  split: ['splash'],
  pop: ['blastShelter'],
  timer: ['blastShelter', 'breakTime'],
  counter: ['mirrorGuard'],
  sticky: ['timeKeeper'],
  flee: ['anchor'],
  swift: ['anchor'],
  fast: ['anchor'],
  healer: ['hunter'],
  leader: ['hunter'],
  waker: ['hunter'],
  veil: ['finder'],
  shift: ['finder'],
  rewind: ['stopwatch'],
};

/** 性質の名前（画面に出す） */
export function traitName(t: ChainTrait): string {
  return CHAIN_TRAIT_TEXT[t]?.name ?? t;
}

/** そのギアが効く性質（ギアの説明・ライブラリ） */
export function gearCounterTraits(gearId: string): ChainTrait[] {
  return (Object.entries(GEAR_COUNTERS) as [ChainTrait, NaviPartId[]][]).filter(([, gears]) => gears.includes(gearId as NaviPartId)).map(([t]) => t);
}

/** 敵の並びに出てくる性質を、多い順に（部位は数えない） */
function traitsByCount(lists: ChainEnemyDef[][]): ChainTrait[] {
  const count = new Map<ChainTrait, number>();
  for (const list of lists) for (const e of list) if (e.trait && !e.part) count.set(e.trait, (count.get(e.trait) ?? 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

/**
 * 区画の予告（段階201。一覧の 18-3）：その区画の砂嵐に多い性質（3つまで）と、ぬしの性質。
 * 新しい戦闘で作り直した区画の戦闘（CHAIN_AREA_SETUPS）から数える
 */
export function areaTraitHints(areaId: string): { field: ChainTrait[]; boss: ChainTrait[] } {
  const area = AREAS[areaId];
  if (!area) return { field: [], boss: [] };
  const field = traitsByCount(area.enemies.map((e) => CHAIN_AREA_SETUPS[e.battle]?.enemies ?? [])).slice(0, 3);
  const boss = traitsByCount([CHAIN_AREA_SETUPS[area.boss.battle]?.enemies ?? []]);
  return { field, boss };
}

/** 予告の1行（例：「この先：かたい・バリア（効くギア：アーマーピアス・シェルクラック）」）。gearName はギアの名前を引く */
export function traitHintLine(label: string, traits: ChainTrait[], gearName: (id: string) => string): string {
  if (traits.length === 0) return '';
  const gears = [...new Set(traits.flatMap((t) => GEAR_COUNTERS[t] ?? []))].map(gearName);
  return `${label}：${traits.map(traitName).join('・')}${gears.length ? `（効くギア：${gears.join('・')}）` : ''}`;
}
