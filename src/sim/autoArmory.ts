import type { ArmoryState, WeaponData, WeaponParamKey } from '../core';
import { absorbMaterial, evolveWeapon, feedFragment, fragmentItem, getAbsorbError, getEvolveError, getFragmentError, nextEvolutions } from '../core';
import { WEAPON_DATA } from '../data';

// 自動対戦の武器の育て方（段階27b）。周回（autoRun）と 1-1（autoArea）の両方で使う。
// 仲間を順番に回し、一番近い進化先に近づく素材（足りない能力値を上げ、条件の能力値を下げないもの）から吸わせる。
// 枠が余れば、上がる方が大きい素材も吸わせる。吸わせられずに残った素材は時分解し、記憶の欠片をでたらめな仲間に吸わせる。
// 進化できれば、最初に条件を満たした進化先へ（型は1つ目。段階42：2回目・3回目も同じ。寄り道は目指さない）

/** 目指してよい進化先（寄り道とまだ作っていない先は除く。prefer があれば、1回目はその進化先だけ。段階54の道ごとの測定） */
function candidates(D: WeaponData, armory: ArmoryState, owner: string, prefer?: string) {
  const w = armory.weapons[owner];
  return nextEvolutions(D, w).filter((e) => !e.sealed && !e.detour && (!prefer || w.path.length > 0 || e.id === prefer));
}

/** 一番近い進化先の、条件の能力値（なければ空） */
function targetParams(D: WeaponData, armory: ArmoryState, owner: string, prefer?: string): WeaponParamKey[] {
  const w = armory.weapons[owner];
  if (!w) return [];
  let best: { lack: number; params: WeaponParamKey[] } | null = null;
  for (const evo of candidates(D, armory, owner, prefer)) {
    const conds = evo.conditions.flatMap((c) => (c.kind === 'param' ? [c] : []));
    if (conds.length === 0) continue;
    const lack = conds.reduce((sum, c) => sum + Math.max(0, c.min - w.params[c.param]), 0);
    if (!best || lack < best.lack) best = { lack, params: conds.map((c) => c.param) };
  }
  return best?.params ?? [];
}

/** その仲間に吸わせる素材の順番（よい方から）。吸わせない方がよい素材は入れない */
function materialOrder(D: WeaponData, armory: ArmoryState, owner: string, prefer?: string): string[] {
  const target = targetParams(D, armory, owner, prefer);
  const score = (id: string): number => {
    const g = D.items[id].gains;
    const total = Object.values(g).reduce((a, n) => a + (n ?? 0), 0);
    const toward = target.reduce((a, k) => a + (g[k] ?? 0), 0);
    const hurts = target.some((k) => (g[k] ?? 0) < 0);
    return hurts ? -1 : toward * 10 + total;
  };
  return Object.keys(armory.items)
    .filter((id) => D.items[id]?.kind === 'material' && (armory.items[id] ?? 0) > 0 && score(id) > 0)
    .sort((a, b) => score(b) - score(a));
}

/**
 * 素材・欠片を使い、進化できれば進化させる。鍵の素材は、進化の条件に使う分だけ残す
 * （鍵になる素材は吸わせず、時分解もしない）。D は武器のデータ（テストで差し替えられるように）。
 * prefer は仲間ごとの1回目の進化先（段階54。進化の道ごとの勝率を測る時。2回目からはその先の本道）
 */
export function autoUseArmory(armory0: ArmoryState, owners: string[], pick: (n: number) => number, D: WeaponData = WEAPON_DATA, prefer: Record<string, string> = {}): ArmoryState {
  let armory = armory0;
  const keys = new Set(Object.values(D.weapons).flatMap((w) => w.evolutions.flatMap((e) => e.conditions.flatMap((c) => (c.kind === 'key' ? [c.item] : [])))));
  // 吸わせる：仲間を順番に回して1つずつ
  for (let guard = 0; guard < 200; guard++) {
    let any = false;
    for (const owner of owners) {
      const id = materialOrder(D, armory, owner, prefer[owner]).find((m) => !keys.has(m) && getAbsorbError(D, armory, owner, m) === null);
      if (!id) continue;
      armory = absorbMaterial(D, armory, owner, id);
      any = true;
    }
    if (!any) break;
  }
  // 残った素材・アイテムは時分解（鍵は残す）
  for (const id of Object.keys(armory.items)) {
    if (keys.has(id)) continue;
    while (getFragmentError(D, armory, id) === null) armory = fragmentItem(D, armory, id);
  }
  for (const [id, n] of Object.entries(armory.fragments)) {
    for (let k = 0; k < n; k++) armory = feedFragment(D, armory, owners[pick(owners.length)], id);
  }
  for (const owner of owners) {
    const w = armory.weapons[owner];
    if (!w) continue;
    const evo = candidates(D, armory, owner, prefer[owner]).find((e) => getEvolveError(D, armory, owner, e.id) === null);
    if (evo) armory = evolveWeapon(D, armory, owner, evo.id);
  }
  return armory;
}
