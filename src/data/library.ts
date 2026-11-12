import type { ChainEnemyDef, ChainLinkDef, ChainMove, EnemyDef, LibraryContext } from '../core';
import { AREAS, AREA_BATTLES } from './areas';
import { CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS, CHAIN_SNAPS } from './chainAreas';
import { WEAPON_DATA } from './weapons';

// ライブラリに載る物（段階167）：新しい戦闘で戦う区画（CHAIN_AREA_SETUPS）から集める。
// 段階F で区画を作り直すと、そこに出る敵・スナップ・コンボ・素材が自動で増える

/** ライブラリの敵の1項目 */
export interface LibraryEnemy {
  id: string;
  /** 新しい戦闘の敵（弱点・耐性・特徴・予定の癖） */
  chain: ChainEnemyDef;
  /** 今の敵の決まり（落とす素材） */
  base: EnemyDef;
  /** 部位（ぬし） */
  parts: ChainEnemyDef[];
  /** 出てくる区画の名前（重なりなし） */
  areas: string[];
  boss: boolean;
}

/** 区画の戦闘の id → 区画の名前 */
function areaOfBattle(battleId: string): string | undefined {
  // 地図に置かれていない物語の戦闘（カイの負け戦など）は、戦闘の id の頭（a23 など）の区画（段階175）
  return Object.values(AREAS).find((a) => a.enemies.some((e) => e.battle === battleId) || a.boss?.battle === battleId)?.name ?? AREAS[battleId.split('_')[0]]?.name;
}

function collectEnemies(): LibraryEnemy[] {
  const out = new Map<string, LibraryEnemy>();
  for (const [battleId, setup] of Object.entries(CHAIN_AREA_SETUPS)) {
    const area = areaOfBattle(battleId);
    const battle = AREA_BATTLES[battleId];
    for (const e of setup.enemies) {
      if (e.part) continue;
      const base = battle?.enemies.find((x) => x.id === e.id);
      if (!base) continue;
      const cur = out.get(e.id) ?? { id: e.id, chain: e, base, parts: setup.enemies.filter((p) => p.part?.of === e.id), areas: [], boss: !!battle.boss };
      if (area && !cur.areas.includes(area)) cur.areas.push(area);
      out.set(e.id, cur);
    }
  }
  // 雑魚を先に、ぬしは後に（区画の中の順）
  return [...out.values()].sort((x, y) => Number(x.boss) - Number(y.boss));
}

export const LIBRARY_ENEMIES: LibraryEnemy[] = collectEnemies();

/** ライブラリのスナップ（アルバムに入れられる物。スペシャルは仲間のものなので載せない） */
export const LIBRARY_SNAPS: ChainMove[] = Object.values(CHAIN_SNAPS);

/** ライブラリのコンボ（区画のコンボを重なりなしで） */
export const LIBRARY_COMBOS: ChainLinkDef[] = [...new Map(Object.values(CHAIN_AREA_SETUPS).flatMap((s) => s.links.map((l) => [l.id, l] as const))).values()];

/** 素材の1項目：落とす敵（部位なら部位の名前も）と、鍵になる武器の進化 */
export interface LibraryItem {
  id: string;
  sources: string[];
  keys: string[];
}

function collectItems(): LibraryItem[] {
  const out = new Map<string, LibraryItem>();
  const add = (id: string, source: string) => {
    if (!WEAPON_DATA.items[id]) return;
    const cur = out.get(id) ?? { id, sources: [], keys: [] };
    if (!cur.sources.includes(source)) cur.sources.push(source);
    out.set(id, cur);
  };
  for (const e of LIBRARY_ENEMIES) {
    const t = e.base.dropTable;
    for (const id of [t?.common, t?.uncommon, t?.rare, ...(e.base.drops ?? [])]) if (id) add(id, e.base.name);
    for (const p of e.parts) if (p.drop) add(p.drop, `${e.base.name}の${p.name}`);
  }
  for (const w of Object.values(WEAPON_DATA.weapons)) {
    for (const evo of w.evolutions) {
      for (const c of evo.conditions) {
        const it = c.kind === 'key' ? out.get(c.item) : undefined;
        if (it && evo.name) it.keys.push(`${w.name} → ${evo.name}`);
      }
    }
  }
  return [...out.values()];
}

export const LIBRARY_ITEMS: LibraryItem[] = collectItems();

/** 敵 → その敵のスナップ（早く勝つと、ときどき） */
export const LIBRARY_ENEMY_SNAP: Record<string, string> = CHAIN_ENEMY_SNAPS;

/** セーブを読む時の材料（ライブラリに載る id。素材は全部の素材から：今の戦闘の区画で拾った物も記録する） */
export const LIBRARY_CONTEXT: LibraryContext = {
  enemies: LIBRARY_ENEMIES.map((e) => e.id),
  snaps: LIBRARY_SNAPS.map((m) => m.id),
  combos: LIBRARY_COMBOS.map((l) => l.id),
  items: Object.keys(WEAPON_DATA.items),
};
