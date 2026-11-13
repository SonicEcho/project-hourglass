import type { ChainVariant } from '../core';
import { AREA_BATTLES } from './areas';
import type { ChainAreaSetup } from './chainArea11';
import { A3S_COMBOS, A3S_DECK, a3sChainEnemy } from './chainArea3s';

// 段階183（段取りの段階F7a）：祭りの夜（カイ）「露出オーバー」の砂嵐を、新しい戦闘にする（docs/milestones/M3_battle_migration.md の 14-4）。
// カイの枠で切り取られかけた景色から湧く砂嵐。祭りの夜の敵が、祭りの夜で決めた性質（割り込み・足止め・ダウン時爆発）のまま出る（2-3x と同じ作り）。
// カイ（本気のカイ）は段階F7b

/**
 * 砂嵐の HP の倍率（今の区画の戦闘の HP にかける）。祭りの夜（カイ）に入る時点の控えめな育ち具合（ハルト・小夜子・あかり）で自動対戦して測った（段階183）：
 * 0.9 で 1.9〜2.4 ラウンド、1.1 で 2.3〜2.9 ラウンド（どれも20戦中20勝）
 */
export const A3K_CHAIN_HP_RATE = 1;

/** 祭りの夜（カイ）の砂嵐（カイは段階F7b） */
const A3K_IDS = Object.keys(AREA_BATTLES).filter((id) => id.startsWith('a3k_') && !AREA_BATTLES[id].boss);

/** 祭りの夜（カイ）の区画の戦闘の中身。札（cards）は chainAreas.ts で、全部の区画の札に差し替える */
export const A3K_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  A3K_IDS.map((id) => {
    const enemies = AREA_BATTLES[id].enemies.map((e) => a3sChainEnemy(e, A3K_CHAIN_HP_RATE));
    const variants: ChainVariant[] = [{ id: 'normal', name: 'ふつう', patterns: enemies.map((e) => e.pattern) }];
    return [id, { enemies, variants, deck: A3S_DECK, cards: {}, links: A3S_COMBOS, gradeAt: { high: 13, mid: 20 } }];
  }),
);
