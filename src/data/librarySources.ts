import { AREAS } from './areas';
import { CHAIN_AREA_SETUPS, CHAIN_ENEMY_SNAPS } from './chainAreas';
import { CHAIN_START_ALBUM } from './chainArea11';
import { EXCHANGE_GOODS } from './exchange';
import { LIBRARY_ENEMIES } from './library';
import { LOST_ITEMS } from './lost';
import { SAND_BOTTOM_FINDS } from './sandBottom';

// ライブラリの「手に入る所」（段階233。開発者と決めた：スナップと素材に、どこで手に入るかのヒントを出す）。
// データから自動で集める。まだ会っていない敵・まだ知らない区画の名前は伏せる（gate が開くまで hidden の文）

/** 伏せる条件：この敵に会った／この区画（名前）を知っている、のどれか */
export interface SourceGate {
  enemy?: string;
  areas?: string[];
}

export interface LibrarySource {
  text: string;
  /** 条件が開くまでの文 */
  hidden: string;
  gate?: SourceGate;
}

const areaName = (id: string) => AREAS[id]?.name ?? id;
const enemyName = (id: string) => LIBRARY_ENEMIES.find((e) => e.id === id)?.base.name ?? id;
/** その戦闘のぬし（部位でない、ぬしの敵） */
function bossOf(battleId: string): string | undefined {
  const setup = CHAIN_AREA_SETUPS[battleId];
  return setup?.enemies.find((e) => !e.part && LIBRARY_ENEMIES.some((x) => x.id === e.id && x.boss))?.id;
}

function collect(): { snaps: Record<string, LibrarySource[]>; items: Record<string, LibrarySource[]> } {
  const snaps: Record<string, LibrarySource[]> = {};
  const items: Record<string, LibrarySource[]> = {};
  const add = (to: Record<string, LibrarySource[]>, id: string, s: LibrarySource) => {
    const list = (to[id] ??= []);
    if (!list.some((x) => x.text === s.text)) list.push(s);
  };
  const areaGate = (id: string): SourceGate => ({ areas: [areaName(id)] });

  // はじめから持っているスナップ
  for (const id of new Set(CHAIN_START_ALBUM)) add(snaps, id, { text: 'はじめから持っている', hidden: 'はじめから持っている' });
  // ぬし（★3で早く勝つ）と、なんでもない（言えなかった言葉を言わずに勝つ）
  for (const [battleId, setup] of Object.entries(CHAIN_AREA_SETUPS)) {
    const boss = bossOf(battleId);
    if (!boss) continue;
    for (const id of setup.snaps ?? []) add(snaps, id, { text: `${enemyName(boss)}に★3で早く勝つ`, hidden: '？？？（区画のぬし）に★3で早く勝つ', gate: { enemy: boss } });
    for (const id of setup.quietSnaps ?? []) add(snaps, id, { text: `${enemyName(boss)}に、言えなかった言葉を最後まで言わずに勝つ`, hidden: '？？？（区画のぬし）に、ある勝ち方で勝つ', gate: { enemy: boss } });
  }
  // 敵のスナップ（早く勝つと、ときどき）
  for (const [enemy, id] of Object.entries(CHAIN_ENEMY_SNAPS)) add(snaps, id, { text: `${enemyName(enemy)}に★3で早く勝つと、ときどき`, hidden: '？？？（まだ会っていない敵）に★3で早く勝つと、ときどき', gate: { enemy } });
  // 区画：時間を返した時・宝箱
  for (const [areaId, area] of Object.entries(AREAS)) {
    for (const id of area.chainReturnSnaps ?? []) add(snaps, id, { text: `${areaName(areaId)}の時間を返す`, hidden: '？？？の区画の時間を返す', gate: areaGate(areaId) });
    for (const c of area.chests ?? []) {
      for (const id of c.chainSnaps ?? []) add(snaps, id, { text: `${areaName(areaId)}の宝箱`, hidden: '？？？の区画の宝箱', gate: areaGate(areaId) });
      for (const id of c.items) add(items, id, { text: `${areaName(areaId)}の宝箱`, hidden: '？？？の区画の宝箱', gate: areaGate(areaId) });
    }
  }
  // 敵が落とす・部位を壊す
  for (const e of LIBRARY_ENEMIES) {
    const t = e.base.dropTable;
    for (const id of [t?.common, t?.uncommon, t?.rare, ...(e.base.drops ?? [])]) if (id) add(items, id, { text: `${e.base.name}が落とす`, hidden: '？？？（まだ会っていない敵）が落とす', gate: { enemy: e.id } });
    for (const p of e.parts) if (p.drop) add(items, p.drop, { text: `${e.base.name}の${p.name}を壊す`, hidden: '？？？（区画のぬし）の部位を壊す', gate: { enemy: e.id } });
  }
  // 交換所（素材は時間を返した区画の物。スナップは章から）
  for (const g of EXCHANGE_GOODS) {
    if (g.kind === 'snap') add(snaps, g.ref, { text: `交換所（${g.chapter ?? 1}章から）`, hidden: `交換所（${g.chapter ?? 1}章から）` });
    if (g.kind === 'item') add(items, g.ref, g.area ? { text: `交換所（${areaName(g.area)}の時間を返した後）`, hidden: '交換所（その区画の時間を返した後）', gate: areaGate(g.area) } : { text: '交換所', hidden: '交換所' });
  }
  // 依頼のご褒美
  for (const d of LOST_ITEMS) {
    const gate = areaGate(d.area);
    for (const id of d.reward.snaps ?? []) add(snaps, id, { text: `依頼「${d.name}」のご褒美`, hidden: '依頼のご褒美', gate });
    for (const id of d.reward.items ?? []) add(items, id, { text: `依頼「${d.name}」のご褒美`, hidden: '依頼のご褒美', gate });
  }
  // 砂の底（層の名前は、帯の区画を知るまで伏せる）
  for (const f of SAND_BOTTOM_FINDS) {
    const gate: SourceGate = { areas: f.areas.map(areaName) };
    for (const id of f.items) add(items, id, { text: `砂の底・${f.name}（宝箱・鉱脈）`, hidden: '砂の底・まだ見ぬ層', gate });
    for (const id of f.digCommon) add(items, id, { text: `砂の底・${f.name}（宝箱・鉱脈）`, hidden: '砂の底・まだ見ぬ層', gate });
    for (const id of f.digRare) add(items, id, { text: `砂の底・${f.name}（珍品）`, hidden: '砂の底・まだ見ぬ層（珍品）', gate });
    for (const id of f.snaps) add(snaps, id, { text: `砂の底・${f.name}（珍品）`, hidden: '砂の底・まだ見ぬ層（珍品）', gate });
  }
  return { snaps, items };
}

const SOURCES = collect();
/** スナップ → 手に入る所 */
export const LIBRARY_SNAP_SOURCES: Record<string, LibrarySource[]> = SOURCES.snaps;
/** 素材 → 手に入る所 */
export const LIBRARY_ITEM_SOURCES: Record<string, LibrarySource[]> = SOURCES.items;

/** 手に入る所の文（伏せる物は伏せた文。同じ文はまとめる） */
export function sourceTexts(list: readonly LibrarySource[] | undefined, known: { enemy: (id: string) => boolean; area: (name: string) => boolean }): string[] {
  const out: string[] = [];
  for (const s of list ?? []) {
    const open = !s.gate || (s.gate.enemy !== undefined && known.enemy(s.gate.enemy)) || (s.gate.areas ?? []).some(known.area);
    const t = open ? s.text : s.hidden;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}
