import type { BattleSetup, CharacterDef, EnemyDef } from '../core/types';
import { buildFolder } from './cards';
import { COMBOS } from './combos';
import { ARMOR_DOG, DISTORTED_BEAST, FROST_BAT, SLIME } from './enemies';
import { LINKS } from './links';
import { ITEMS } from './weapons';

// 周回の構成（段階7）：戦闘 → 星図 → 戦闘…の5戦。数値はすべて仮

/** 敵を強くした版（HP・攻撃・魔力を rate 倍）。extraDrops の素材も落とす */
export function strengthen(enemy: EnemyDef, rate: number, extraDrops: string[] = []): EnemyDef {
  return {
    ...enemy,
    drops: [...(enemy.drops ?? []), ...extraDrops],
    name: `${enemy.name}+`,
    stats: {
      ...enemy.stats,
      hp: Math.round(enemy.stats.hp * rate),
      atk: Math.round(enemy.stats.atk * rate),
      mag: Math.round(enemy.stats.mag * rate),
    },
  };
}

export interface CampaignBattle {
  name: string;
  enemies: EnemyDef[];
  /** 勝った時の星の砂 */
  reward: number;
  /** 勝った時にもらえる通常アイテム（段階9） */
  item?: string;
  boss?: boolean;
}

export const CAMPAIGN: CampaignBattle[] = [
  { name: '戦闘1', enemies: [SLIME, SLIME], reward: 4, item: ITEMS.potion.id },
  { name: '戦闘2', enemies: [SLIME, FROST_BAT], reward: 5, item: ITEMS.ether.id },
  { name: '戦闘3', enemies: [SLIME, FROST_BAT, ARMOR_DOG], reward: 6, item: ITEMS.potion.id },
  { name: '戦闘4', enemies: [SLIME, FROST_BAT, ARMOR_DOG].map((e) => strengthen(e, 1.3, [ITEMS.steelClaw.id])), reward: 7, item: ITEMS.hiPotion.id },
  { name: '戦闘5（ボス）', enemies: [DISTORTED_BEAST], reward: 0, boss: true },
];

/** 周回の戦闘の設定。allies は成長を反映したキャラ */
export function createCampaignSetup(index: number, seed: number, allies: CharacterDef[]): BattleSetup {
  return {
    allies,
    enemies: CAMPAIGN[index].enemies,
    deck: buildFolder(),
    links: LINKS,
    combos: COMBOS,
    seed,
  };
}
