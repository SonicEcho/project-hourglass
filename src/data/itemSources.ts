import { allBattles } from '../core/progress';
import type { EnemyDef } from '../core/types';
import { AREA_BATTLES, AREAS } from './areas';
import { DROP_RATES } from './constants';
import { STORY } from './story';

// 素材・アイテムの手に入れ方（段階27b）。武器の画面（進化の鍵がどこで手に入るか）と、データの一覧表で使う

/** 区画と試作の周回に出てくる敵（同じ名前は1回。段階96 の本気のカイは、負け戦のカイと同じ名前なので、名前と id の組で数える） */
export function knownEnemies(): EnemyDef[] {
  const seen = new Map<string, EnemyDef>();
  for (const b of [...Object.values(AREA_BATTLES), ...allBattles(STORY)]) for (const e of b.enemies) if (!seen.has(`${e.name}:${e.id}`)) seen.set(`${e.name}:${e.id}`, e);
  return [...seen.values()];
}

/** 手に入れ方の一覧（例：「金魚ノイズ（珍しい 20%）」「金魚鉢のぬしの金魚鉢を壊す」） */
export function itemSources(id: string): string[] {
  const out: string[] = [];
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  for (const e of knownEnemies()) {
    const t = e.dropTable;
    if (t?.common === id) out.push(`${e.name}（いつもの ${pct(DROP_RATES.normal.common)}）`);
    if (t?.uncommon === id) out.push(`${e.name}（珍しい ${pct(DROP_RATES.normal.uncommon)}）`);
    if (t?.rare === id) out.push(`${e.name}（レア ${pct(DROP_RATES.normal.rare)}）`);
    if (e.drops?.includes(id)) out.push(`${e.name}（必ず）`);
    for (const p of e.parts ?? []) if (p.drop === id) out.push(`${e.name}の${p.name}を壊す`);
  }
  for (const b of Object.values(AREA_BATTLES)) if (b.item === id) out.push(`${b.name}の勝利`);
  for (const b of allBattles(STORY)) if (b.item === id) out.push(`${b.name}の勝利`);
  for (const a of Object.values(AREAS)) for (const c of a.chests) if (c.items.includes(id)) out.push(`${a.name}の宝箱`);
  return [...new Set(out)];
}

/**
 * 素材の手がかり（段階42。進化ツリーの2段先に見せる。例：「1-2 の砂嵐が落とすらしい」「2-1 のぬしの体から取れるらしい」）。
 * 区画の戦闘に出てこない素材は「どこかの砂嵐が落とすらしい」
 */
export function itemHint(id: string): string {
  for (const [battleId, b] of Object.entries(AREA_BATTLES)) {
    for (const e of b.enemies) {
      const t = e.dropTable;
      const fromBody = e.drops?.includes(id) || (e.parts ?? []).some((p) => p.drop === id);
      const fromDrop = t?.common === id || t?.uncommon === id || t?.rare === id;
      if (!fromBody && !fromDrop) continue;
      const area = AREAS[battleId.split('_')[0]];
      const where = area ? area.name.split('「')[0] : 'どこか';
      return fromBody ? `${where} のぬしの体から取れるらしい` : `${where} の${t?.rare === id ? '砂嵐が、ごくまれに' : '砂嵐が'}落とすらしい`;
    }
  }
  return 'どこかの砂嵐が落とすらしい';
}
